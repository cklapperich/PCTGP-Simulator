// effect_manager.ts
import { GameState } from './models';
import { EffectSourceType, EffectTiming, DURATION } from './enums';
import { GameContext } from './types';

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
 * Represents an ongoing effect in the game.
 * Effects can either:
 * 1. Return values when queried (QUERY_ timings)
 * 2. Perform game actions (ON_ timings)
 * 
 * Effects also have two cleanup behaviors:
 * 1. Continuous effects (requiresSource=true): Removed when source leaves play
 * 2. Applied effects (requiresSource=false): Last until duration expires
 */
export class Effect {
    id: string;
    source: any;  // Card/ability that created the effect
    sourceType: EffectSourceType;  // ABILITY/ATTACK/TRAINER
    target: any | null;  // What the effect is attached to/affecting
    duration: number;  // How long effect lasts (see DURATION enum)
    timing: EffectTiming;  // When effect runs
    run: (gameState: GameState, context: GameContext) => any;
    requiresSource: boolean;  // Whether effect is removed when source leaves play

    /**
     * @param props.target Can mean two things:
     * 1. Target of an attack/trainer (for one-time effects)
     * 2. What the effect is attached to (for ongoing effects)
     * 
     * @param props.duration How long effect lasts:
     * - PERMANENT (999): Lasts until explicitly removed
     * - UNTIL_END_OF_TURN (0): Removed at end of turn
     * - UNTIL_NEXT_TURN (1): Removed at end of next turn
     * 
     * @param props.requiresSource Whether effect depends on source:
     * - true: Effect removed when source leaves play (e.g. abilities)
     * - false: Effect lasts until duration expires (e.g. status effects)
     * Defaults to true for abilities, false otherwise
     */
    constructor(props: {
        id: string,
        source: any,
        sourceType: EffectSourceType,
        timing: EffectTiming,
        run: (gameState: GameState, context: GameContext) => any,
        target?: any,
        duration?: number,
        requiresSource?: boolean
    }) {
        this.id = props.id;
        this.source = props.source;
        this.sourceType = props.sourceType;
        this.timing = props.timing;
        this.run = props.run;
        this.target = props.target || null;
        this.duration = props.duration || DURATION.PERMANENT;
        this.requiresSource = props.requiresSource ?? (props.sourceType === EffectSourceType.ABILITY);
    }
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