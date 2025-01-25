
/**
 * Effect Registry System
 * 
 * This system is designed to handle card effects in a flexible, extensible way using
 * a registry pattern. Effects are defined as objects with an on_apply function and
 * optional condition, allowing for:
 * 
 * 1. Easy addition of new effects without modifying existing code
 * 2. Support for both immediate and conditional effects
 * 3. Future extensibility for JSON-defined conditions
 * 
 * Key Design Decisions:
 * - Effects return objects instead of functions to separate condition checking from execution
 * - Standardized parameter structure in createEffect to support future JSON condition system
 * - Generator functions supported for effects requiring user interaction
 */

const effectRegistry = new Map();

/**
 * Registers an effect creator function with the registry.
 * Effect creators must return an object with:
 * - on_apply: (required) Function that implements the effect
 * - condition: (optional) Function that returns true if effect can be applied
 */
export function registerEffect(name, effectCreator) {
    effectRegistry.set(name, effectCreator);
}

// TODO PREVENT EFFECTS OF THE SAME NAME FROM APPLYING/STACKING TWICE

/**
 * Creates an effect instance from JSON data.
 * Structured to support future condition system by separating condition parameter.
 * Currently ignores condition in JSON as conditions are hardcoded in effect registration.
 */
export function createEffect(jsonData) {
    const { type, condition, ...effectParams } = jsonData;
    const creator = effectRegistry.get(type);
    if (!creator) {
        throw new Error(`Unknown effect type: ${type}`);
    }
    return creator(effectParams);
}

// Types of effects that can modify game state
const EffectType = {
    MODIFY_RETREAT_COST: 'MODIFY_RETREAT_COST',
    DISABLE_RETREAT: 'DISABLE_RETREAT',
    MODIFY_ENERGY_COUNT: 'MODIFY_ENERGY_COUNT',
    ON_DAMAGED: 'ON_DAMAGED', // FOR 'when this pokemon is damaged... type effects ie Druddigon
    // Will be many more...
};

// Where the effect came from
const EffectSource = {
    ATTACK: 'ATTACK',
    ABILITY: 'ABILITY',
    TOOL: 'TOOL',
    STATUS: 'STATUS',
    DAMAGE_REACTION: 'DAMAGE_REACTION',  // New type
    HEAL: 'HEAL', // New type

    // etc...
};

class Effect {
    constructor({
        id,
        type,
        source,
        sourceType,
        target = null,
        duration = -2, // -2 = permanent, -1 = until end of next turn
        priority = 0,
        modifier = null,
        condition = null
    }) {
        this.id = id;                // Unique identifier
        this.type = type;            // What kind of modification
        this.source = source;        // Card/ability that created it
        this.sourceType = sourceType;// ATTACK/ABILITY/etc
        this.target = target;        // What it applies to
        this.duration = duration;    // How long it lasts
        this.priority = priority;    // Order of application
        this.modifier = modifier;    // Function to modify values
        this.condition = condition;  // When it's active
    }

    isActive(gameState) {
        if (!this.condition) return true;
        return this.condition(gameState);
    }
}

class EffectManager {
    constructor(gameState) {
        this.effects = new Map();  // id -> Effect
        this.gameState = gameState;
    }

    addEffect(effect) {
        this.effects.set(effect.id, effect);
    }

    removeEffect(effectId) {
        this.effects.delete(effectId);
    }

    removeEffectsBySource(sourceType) {
        for (const [id, effect] of this.effects) {
            if (effect.sourceType === sourceType) {
                this.effects.delete(id);
            }
        }
    }

    getActiveEffects(type = null) {
        return Array.from(this.effects.values())
            .filter(effect => effect.isActive(this.gameState))
            .filter(effect => !type || effect.type === type)
            .sort((a, b) => a.priority - b.priority);
    }

    // Calculate values considering all active effects
    calculateRetreatCost(pokemon) {
        let cost = pokemon.baseRetreatCost;
        
        const effects = this.getActiveEffects(EffectType.MODIFY_RETREAT_COST)
            .filter(effect => effect.target === null || effect.target === pokemon);

        for (const effect of effects) {
            if (effect.modifier) {
                cost = effect.modifier(cost, this.gameState);
            }
        }

        return Math.max(0, cost);
    }

    canRetreat(pokemon) {
        // First check for effects that disable retreat entirely
        const disablingEffects = this.getActiveEffects(EffectType.DISABLE_RETREAT)
            .filter(effect => effect.target === null || effect.target === pokemon);

        if (disablingEffects.length > 0) {
            return false;
        }

        // Then check if they have enough energy
        const actualCost = this.calculateRetreatCost(pokemon);
        const actualEnergy = this.calculateAttachedEnergy(pokemon);

        return actualEnergy >= actualCost;
    }

    calculateAttachedEnergy(pokemon) {
        let count = pokemon.attachedEnergy.length;
        
        const effects = this.getActiveEffects(EffectType.MODIFY_ENERGY_COUNT)
            .filter(effect => effect.target === null || effect.target === pokemon);

        for (const effect of effects) {
            if (effect.modifier) {
                count = effect.modifier(count, this.gameState);
            }
        }

        return Math.max(0, count);
    }

    // Method to check if an effect can be applied
    canApplyEffect(effect) {
        // Get all effects that might prevent this effect
        const preventingEffects = this.getActiveEffects()
            .filter(e => e.type === 'PREVENT_EFFECT' && 
                        (!e.target || e.target === effect.target) &&
                        (!e.effectType || e.effectType === effect.type));

        return preventingEffects.length === 0;
    }

    //called in between every turn
    tickdown(){
        for (const [id, effect] of this.effects) {
            if (effect.duration >= 0) {
                effect.duration -= 1;
                if (effect.duration === -1) {
                    this.effects.delete(id);
                }
            }
        }
    }
}
