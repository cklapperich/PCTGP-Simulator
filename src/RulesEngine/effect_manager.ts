import { GameState } from './models';
import { EffectSourceType, EffectTiming, DURATION } from './enums';
import { GameContext } from './types';
import { Effect, effectRegistry } from './effect_types';

/**
 * Effect system for Pokemon TCG.
 * 
 * Key design decisions:
 * - Effects are functions that run at specific timings rather than passive modifiers
 * - Two types of timings: QUERY_ (return values) and action (do things)
 * - Unified system handles both state queries and game actions
 * - Effects can be either continuous (requiring source) or applied (independent)
 * 
 * Example usages:
 * - Damage modifiers: QUERY_DAMAGE timing returns number
 * - Status effects: Attach effect to Pokemon
 * - Global effects: No target specified
 * - Triggered effects: ON_ timings that run when things happen
 */

/**
 * Create a new effect instance of the specified type
 */
export function createEffect(
    effectType: string,
    source: any,
    sourceType: EffectSourceType,
    target: any,
    data: any = {}
): Effect {
    const config = effectRegistry[effectType];
    if (!config) {
        throw new Error(`Unknown effect type: ${effectType}`);
    }

    const instance = config.create(data);
    
    return {
        id: crypto.randomUUID(),
        source,
        sourceType,
        target,
        timing: config.timing,
        duration: config.duration,
        requiresSource: config.requiresSource,
        run: instance.run
    };
}

/**
 * Manages all active effects in the game.
 * 
 * Key points:
 * - Effects are stored in a Map for easy lookup/removal
 * - query() vs runEffects() are separate for safety
 * - Both actually use same _runEffects implementation
 * - Handles both continuous and applied effects differently
 */
export class EffectManager {
    private effects: Map<string, Effect>;

    constructor() {
        this.effects = new Map();
    }

    /**
     * Add a new effect to the game.
     * Effects need unique IDs since same effect could be applied multiple times.
     */
    addEffect(effect: Effect): void {
        this.effects.set(effect.id, effect);
    }

    /**
     * Remove a specific effect by ID.
     */
    removeEffect(effectId: string): void {
        this.effects.delete(effectId);
    }

    /**
     * Remove all effects that require this source.
     * Used when a card leaves play - only removes dependent effects.
     * Example: Removes Serperior's ability but not Psyduck's Headache
     */
    cleanupSource(source: any): void {
        for (const [id, effect] of this.effects) {
            if (effect.source === source && effect.requiresSource) {
                this.effects.delete(id);
            }
        }
    }

    /**
     * Core effect running logic used by both query() and runEffects().
     * 
     * Unusual pattern: Same system handles both state queries and actions.
     * This works because Pokemon effects are simple enough that mixing
     * queries and actions doesn't cause problems.
     */
    private _runEffects(timing: EffectTiming, gameState: GameState, context: GameContext) {
        return Array.from(this.effects.values())
            .filter(effect => effect.timing === timing)
            .map(effect => effect.run(gameState, context));
    }

    /**
     * Get values from QUERY_ effects (damage modifiers etc).
     * GameState is complete game state.
     * GameContext is info about current action (attacker/defender etc).
     */
    query(timing: EffectTiming, gameState: GameState, context: GameContext): any[] {
        if (!timing.toString().startsWith('QUERY_')) {
            throw new Error(`Cannot query non-query timing: ${timing}`);
        }
        return this._runEffects(timing, gameState, context);
    }

    /**
     * Run effects that perform game actions.
     * Counterintuitive: Can cause cascading effects as actions trigger more effects.
     * This is fine in Pokemon since effect chains are small/simple.
     */
    runEffects(timing: EffectTiming, gameState: GameState, context: GameContext): any[] {
        if (timing.toString().startsWith('QUERY_')) {
            throw new Error(`Cannot run query timing: ${timing}`);
        }
        return this._runEffects(timing, gameState, context);
    }

    /**
     * Reduce duration of temporary effects and remove expired ones.
     * Called between turns.
     * 
     * Duration system is simple:
     * - Positive numbers count down to 0
     * - 0 means effect expires
     * - 999 (PERMANENT) means effect lasts until explicitly removed
     */
    tickdown(gameState: GameState): void {
        for (const [id, effect] of this.effects) {
            if (effect.duration > 0) {
                effect.duration--;
                if (effect.duration === 0) {
                    this.effects.delete(id);
                }
            }
        }
    }
}
