import { EffectTiming, EffectSourceType } from './enums';
import { GameState } from './models';
import { GameContext } from './types';

export interface EffectConfig {
    timing: EffectTiming;
    duration: number;
    requiresSource: boolean;
    create: (data: any) => {
        run: (gameState: GameState, context: GameContext) => any;
    };
}

export interface Effect {
    id: string;
    source: any;
    sourceType: EffectSourceType;
    target: any | null;
    duration: number;
    timing: EffectTiming;
    run: (gameState: GameState, context: GameContext) => any;
    requiresSource: boolean;
}

// Global registry of effect types
export const effectRegistry: {[key: string]: EffectConfig} = {};

export function registerEffect(effectType: string, config: EffectConfig): void {
    if (effectRegistry[effectType]) {
        throw new Error(`Effect type ${effectType} is already registered`);
    }
    effectRegistry[effectType] = config;
}
