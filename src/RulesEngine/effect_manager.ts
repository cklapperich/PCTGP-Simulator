import { GameState } from './models';

export enum EffectType {
    MODIFY_RETREAT_COST = 'MODIFY_RETREAT_COST',
    DISABLE_RETREAT = 'DISABLE_RETREAT',
    MODIFY_ENERGY_COUNT = 'MODIFY_ENERGY_COUNT',
    ON_DAMAGED = 'ON_DAMAGED',
    IMMUNITY = 'IMMUNITY',
    DAMAGE_MODIFICATION = 'DAMAGE_MODIFICATION',
    DAMAGE_REACTION = 'DAMAGE_REACTION',
    PREVENT_EFFECT = 'PREVENT_EFFECT'
}

export enum EffectSource {
    ATTACK = 'ATTACK',
    ABILITY = 'ABILITY',
    TOOL = 'TOOL',
    STATUS = 'STATUS',
    DAMAGE_REACTION = 'DAMAGE_REACTION',
    HEAL = 'HEAL'
}

interface EffectProps {
    id: string;
    type: string;
    source: any;
    sourceType: EffectSource;
    target?: any;
    duration?: number;
    priority?: number;
    modifier?: ((value: number, gameState: GameState, context: any) => number) | null;
    condition?: ((gameState: GameState, context: any) => boolean) | null;
    effectType?: string;  // Added for PREVENT_EFFECT type effects
}

const effectRegistry = new Map<string, (params: any) => Effect>();

export function registerEffect(name: string, effectCreator: (params: any) => Effect): void {
    effectRegistry.set(name, effectCreator);
}

interface EffectData {
    type: string;
    condition?: any;
    [key: string]: any;
}

export function createEffect(jsonData: EffectData): Effect {
    const { type, condition, ...effectParams } = jsonData;
    const creator = effectRegistry.get(type);
    if (!creator) {
        throw new Error(`Unknown effect type: ${type}`);
    }
    return creator(effectParams);
}

export class Effect {
    id: string;
    type: string;
    source: any;
    sourceType: EffectSource;
    target: any | null;
    duration: number;
    priority: number;
    modifier: ((value: number, gameState: GameState, context: any) => number) | null;
    condition: ((gameState: GameState, context: any) => boolean) | null;
    effectType?: string;  // Added for PREVENT_EFFECT type effects

    constructor({
        id,
        type,
        source,
        sourceType,
        target = null,
        duration = -2, // -2 = permanent, -1 = until end of next turn
        priority = 0,
        modifier = null,
        condition = null,
        effectType
    }: EffectProps) {
        this.id = id;
        this.type = type;
        this.source = source;
        this.sourceType = sourceType;
        this.target = target;
        this.duration = duration;
        this.priority = priority;
        this.modifier = modifier;
        this.condition = condition;
        this.effectType = effectType;
    }

    isActive(gameState: GameState, context: any): boolean {
        if (!this.condition) return true;
        return this.condition(gameState, context);
    }
}

export class EffectManager {
    private effects: Map<string, Effect>;

    constructor() {
        this.effects = new Map();
    }

    addEffect(effect: Effect, context: any): void {
        this.effects.set(effect.id, effect);
    }

    removeEffect(effectId: string): void {
        this.effects.delete(effectId);
    }

    removeEffectsBySource(sourceType: EffectSource): void {
        for (const [id, effect] of this.effects) {
            if (effect.sourceType === sourceType) {
                this.effects.delete(id);
            }
        }
    }

    getActiveEffects(gameState: GameState, effectType: string | null, context: any): Effect[] {
        return Array.from(this.effects.values())
            .filter(effect => effect.isActive(gameState, context))
            .filter(effect => !effectType || effect.type === effectType)
            .sort((a, b) => a.priority - b.priority);
    }

    calculateRetreatCost(gameState: GameState, pokemon: any, context: any): number {
        let cost = pokemon.baseRetreatCost;
        
        const effects = this.getActiveEffects(gameState, EffectType.MODIFY_RETREAT_COST, context)
            .filter(effect => effect.target === null || effect.target === pokemon);

        for (const effect of effects) {
            if (effect.modifier) {
                cost = effect.modifier(cost, gameState, context);
            }
        }

        return Math.max(0, cost);
    }

    canRetreat(gameState: GameState, pokemon: any, context: any): boolean {
        const disablingEffects = this.getActiveEffects(gameState, EffectType.DISABLE_RETREAT, context)
            .filter(effect => effect.target === null || effect.target === pokemon);

        if (disablingEffects.length > 0) {
            return false;
        }

        const actualCost = this.calculateRetreatCost(gameState, pokemon, context);
        const actualEnergy = this.calculateAttachedEnergy(gameState, pokemon, context);

        return actualEnergy >= actualCost;
    }

    calculateAttachedEnergy(gameState: GameState, pokemon: any, context: any): number {
        let count = pokemon.attachedEnergy.length;
        
        const effects = this.getActiveEffects(gameState, EffectType.MODIFY_ENERGY_COUNT, context)
            .filter(effect => effect.target === null || effect.target === pokemon);

        for (const effect of effects) {
            if (effect.modifier) {
                count = effect.modifier(count, gameState, context);
            }
        }

        return Math.max(0, count);
    }

    canApplyEffect(gameState: GameState, effect: Effect, context: any): boolean {
        const preventingEffects = this.getActiveEffects(gameState, EffectType.PREVENT_EFFECT, context)
            .filter(e => e.type === EffectType.PREVENT_EFFECT && 
                        (!e.target || e.target === effect.target) &&
                        (!e.effectType || e.effectType === effect.type));

        return preventingEffects.length === 0;
    }

    tickdown(gameState: GameState): void {
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
