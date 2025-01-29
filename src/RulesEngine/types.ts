// Shared type definitions

import { Type, CardType,Stage, Rarity } from "./enums";

export interface CardProps {
    name: string;
    cardType: CardType;
    set: string;
    
    HP?: number;
    type?: Type;
    attacks?: Attack[];
    retreat?: number;
    rarity?: Rarity;
    ability?: any; // TODO: Define ability type
    stage?: Stage;
    evolvesFrom?: string | null;
    weakness?: Type;
    resistance?: Type;
}

export interface Attack {
    name: string;
    effect: any;
    cost: [Type]; 
    damage: number;
}

export interface DeckProps {
    name?: string;
    cards?: any[]; 
    energyTypes?: Set<Type>;  // Updated to use Type enum
}

export interface PlayerStateProps {
    name?: string;
    isAI?: boolean;
    deck?: any;
}

export interface GameEventDataProps {
    card?: any;
    sourceZone?: string | null;
    targetZone?: string | null;
    playerIndex?: number | null;
    source?: any;
    target?: any;
    attackIndex?: number | null;
    damage?: number | null;
    damageType?: Type | null;
    effectType?: string | null;
    phase?: string | null;
    turn?: number | null;
    winner?: number | null;
    amount?: number | null;
    flips?: boolean[] | null;
    zoneType?: string | null;  // For energy zone updates
    type?: Type | null;        // For energy type in events
}

export interface GameEventProps {
    type: string;
    data?: GameEventDataProps;
}

// Input-related interfaces
export interface InputDataProps {
    handIndex?: number | null;
    sourceZone?: string | null;
    targetZone?: string | null;
    deckIndex?: number | null;
    attackIndex?: number | null;
    attackInfo?: any | null;
}

export interface PlayerInputProps {
    inputType?: string;
    data?: any; // Changed from InputDataProps to any to avoid circular dependency
    playerIndex?: number;
}

export interface InputRequestEventProps {
    reason?: string;
    legalInputs?: any[]; // Changed from PlayerInput[] to any[] to avoid circular dependency
}
