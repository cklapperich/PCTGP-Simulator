import {createEffect, registerEffect} from './effect_manager.js'
// Basic effects
registerEffect("FIXED_DAMAGE", ({ amount }) => ({
    on_apply: (gameState, target) => {
        result = gameActions.calculateDamage(gameState, target, amount);
    }
}));

registerEffect("APPLY_STATUS", ({ status }) => ({
    on_apply: (gameState, source, target) => {
        const statusEffect = new Effect({
            id: crypto.randomUUID(),
            type: {status},
            source: status,
            target: target
        });
        gameActions.applyStatus(gameState, target, status);
        gameState.effectManager.addEffect(statusEffect);
    }
}));

// Compound effects
registerEffect("COIN_FLIP_EFFECT", ({ on_heads, on_tails }) => ({
    on_apply: function*(gameState, source, target) {
        const result = gameActions.flipCoin();
        const effectData = result === "heads" ? on_heads : on_tails;
        
        if (effectData) {
            const effect = createEffect(effectData);
            yield* effect.on_apply(gameState, target);
        }
    }
}));
