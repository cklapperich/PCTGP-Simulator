import { EffectTiming, DURATION, Type } from './enums';
import { GameState } from './models';
import { GameContext } from './types';
import { applyDamageCalculation } from './game_actions';
import { registerEffect } from './effect_types';

// Basic damage effect
registerEffect("FIXED_DAMAGE", {
    timing: EffectTiming.ON_DAMAGE,
    duration: DURATION.PERMANENT,
    requiresSource: true,
    create: ({ amount, damageType = Type.NONE }) => ({
        run: (gameState: GameState, context: GameContext) => {
            if (!context.targetZoneName || context.targetPlayerIndex === undefined) {
                return 0;
            }
            
            const targetZone = gameState.players[context.targetPlayerIndex].getZone(context.targetZoneName);
            
            // Use the damage type from effect creation if not provided in context
            const effectiveDamageType = context.damageType || damageType;
            
            return applyDamageCalculation(
                gameState,
                targetZone,
                amount,
                effectiveDamageType,
                { applyWeakness: true, ignoreTargetEffects: false }
            );
        }
    })
});
