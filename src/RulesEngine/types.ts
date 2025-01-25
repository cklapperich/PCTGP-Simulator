// Shared type definitions

export interface WeaknessResistanceProps {
    type: string;
    value: number;
}

export interface CardProps {
    name: string;
    HP: number;
    type: string;
    attacks?: Attack[];
    retreat?: number;
    rarity?: string;
    set?: string;
    ability?: any; // TODO: Define ability type
    stage?: string;
    evolvesFrom?: string | null;
    weakness?: string;
    resistance?: string;
}

export interface Attack {
    name: string;
    effect: any; // TODO: Define effect type
    cost: any; // TODO: Define cost type
    damage: number;
}

export interface DeckProps {
    name?: string;
    cards?: any[]; // TODO: Define card type
    energyTypes?: Set<string>;
}

export interface PlayerStateProps {
    name?: string;
    isAI?: boolean;
    deck?: any; // TODO: Define deck type
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
    type?: string | null;
    effectType?: string | null;
    phase?: string | null;
    turn?: number | null;
    winner?: number | null;
    amount?: number | null;
    flips?: boolean[] | null;
    zoneType?: string | null;  // Added for energy zone updates
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
