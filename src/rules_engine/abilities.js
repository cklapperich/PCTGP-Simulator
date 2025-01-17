import { EventType } from './enums.js';
import { Event } from './models.js';
import { Effect, effectRegistry } from './effects.js';
import { outputQueue } from './gameLoop.js';

/**
 * Base class for ability effects
 */
export class AbilityEffect extends Effect {
    constructor(id, source, ability) {
        super(id, source);
        this.ability = ability;
    }

    // Override in subclasses to specify when ability can be activated
    canActivate(gameState) {
        return true;
    }

    // Override in subclasses to handle ability activation
    onActivate(gameState) {}
}

/**
 * Represents a Pokemon ability
 */
export class Ability {
    constructor({
        name,
        description,
        effect = null,
        triggerType = null, // 'manual', 'auto', 'endOfTurn', etc.
        condition = null    // Function that returns true if ability can be used
    }) {
        this.name = name;
        this.description = description;
        this.effect = effect;
        this.triggerType = triggerType;
        this.condition = condition;
    }

    /**
     * Check if ability can be activated
     * @param {Card} pokemon - Pokemon with this ability
     * @param {GameState} gameState - Current game state
     */
    canActivate(pokemon, gameState) {
        // Check if any effects prevent ability activation
        let canUse = true;
        effectRegistry.effects.forEach(effect => {
            if (effect.isActive && effect.preventsAbilities?.(pokemon)) {
                canUse = false;
            }
        });

        // Check ability's own conditions
        if (canUse && this.condition) {
            canUse = this.condition(pokemon, gameState);
        }

        return canUse;
    }

    /**
     * Activate the ability
     * @param {Card} pokemon - Pokemon using the ability
     * @param {GameState} gameState - Current game state
     */
    activate(pokemon, gameState) {
        if (!this.canActivate(pokemon, gameState)) {
            return false;
        }

        // Create and register ability effect
        if (this.effect) {
            const abilityEffect = new this.effect(
                `${this.name}_${pokemon.id}`,
                pokemon,
                this
            );
            effectRegistry.addEffect(abilityEffect);
        }

        // Emit ability activation event
        const event = new Event(EventType.ABILITY_ACTIVATE, {
            pokemon: pokemon,
            ability: this
        });
        outputQueue.put(event);
        effectRegistry.handleEvent(event);

        return true;
    }

    /**
     * Check if ability should trigger at end of turn
     * @param {Card} pokemon - Pokemon with this ability
     * @param {GameState} gameState - Current game state
     */
    checkEndOfTurnTrigger(pokemon, gameState) {
        if (this.triggerType === 'endOfTurn' && this.canActivate(pokemon, gameState)) {
            this.activate(pokemon, gameState);
        }
    }
}

/**
 * Example ability: Double grass energy provided
 */
export const DoubleGrassAbility = new Ability({
    name: "Jungle Power",
    description: "This Pokemon's Grass Energy provides double Energy.",
    effect: class extends AbilityEffect {
        getProvidedEnergy(pokemon, baseEnergy) {
            if (pokemon === this.source) {
                const available = new Map(baseEnergy);
                const grassEnergy = available.get('grass') || 0;
                available.set('grass', grassEnergy * 2);
                return available;
            }
            return baseEnergy;
        }
    },
    triggerType: 'auto'
});

/**
 * Example ability: Heal at end of turn
 */
export const EndOfTurnHealAbility = new Ability({
    name: "Recovery",
    description: "At the end of your turn, heal 10 damage from this Pokemon.",
    effect: class extends AbilityEffect {
        onEvent(event, gameState) {
            if (event.eventType === EventType.TURN_END &&
                event.data.player === this.source.owner) {
                // Heal 10 damage
                this.source.damage = Math.max(0, this.source.damage - 10);
                
                // Emit heal event
                const healEvent = new Event(EventType.HEAL, {
                    pokemon: this.source,
                    amount: 10
                });
                outputQueue.put(healEvent);
                effectRegistry.handleEvent(healEvent);
            }
        }
    },
    triggerType: 'endOfTurn'
});
