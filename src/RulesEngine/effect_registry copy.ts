import {GameState, GameContext} from './models.js'
import { DURATION, EffectTiming } from './enums.js';

// Basic effects
registerEffect("FIXED_DAMAGE", {
    timing: EffectTiming.ON_DAMAGE,
    duration: DURATION.PERMANENT,
    create: ({ amount }) => ({
        run: (gameState: GameState, context: GameContext) => {
            return gameActions.calculateDamage(gameState, context.target, amount);
        }
    })
});

registerEffect("COIN_FLIP_EFFECT", {
    timing: EffectTiming.ON_DAMAGE,
    duration: DURATION.PERMANENT,
    create: ({ on_heads, on_tails }) => ({
        run: (gameState: GameState, context: GameContext) {
            const result = gameActions.flipCoin();
            const effectData = result === "heads" ? on_heads : on_tails;
            
            if (effectData) {
                // Create the appropriate effect based on coin result
                const effect = createEffect(effectData.type, effectData);
                // Run the effect
                yield effect.run(gameState, context);
            }
        }
    })
});

registerEffect("SURGE_STRATEGY", {
    timing: EffectTiming.QUERY_CAN_PLAY_CARD,
    duration: DURATION.UNTIL_END_OF_TURN,
    create: () => {
        let additionalPlays = 0;
        return {
            run: (gameState: GameState, context: GameContext) => {
                if (context.card?.cardType !== CardType.SUPPORTER) {
                    return null;
                }
                if (!gameState.getCurrentPlayer().canSupporter) {
                    if (additionalPlays < 2) {
                        additionalPlays++;
                        return true;
                    }
                    return false;
                }
                return null;
            }
        };
    }
});

// Example of a damage modification effect
registerEffect("WEAKNESS_MODIFIER", {
    timing: EffectTiming.QUERY_DAMAGE,
    duration: DURATION.PERMANENT,
    create: ({ damageType, modifier }) => ({
        run: (gameState: GameState, context: GameContext) => {
            if (context.damageType === damageType) {
                return context.damage * modifier;
            }
            return context.damage;
        }
    })
});

// Example of a conditional effect
registerEffect("CONDITIONAL_DAMAGE", {
    timing: EffectTiming.ON_DAMAGE,
    duration: DURATION.PERMANENT,
    create: ({ condition, amount }) => ({
        run: (gameState: GameState, context: GameContext) => {
            if (condition(gameState, context)) {
                return gameActions.calculateDamage(gameState, context.target, amount);
            }
            return 0;
        }
    })
});

// Example of a healing effect
registerEffect("HEAL", {
    timing: EffectTiming.ON_DAMAGE,
    duration: DURATION.PERMANENT,
    create: ({ amount }) => ({
        run: (gameState: GameState, context: GameContext) => {
            if (context.target) {
                const zone = gameState.getZoneForCard(context.target);
                zone.healDamage(amount);
            }
        }
    })
});
