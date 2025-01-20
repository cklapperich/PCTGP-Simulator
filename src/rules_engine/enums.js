// Converted from Python Enums


export const Phase = Object.freeze({
    // INITIAL setup
    DEAL_CARDS: "DEAL_CARDS",
    TURN_ORDER: "TURN_ORDER",
    SETUP_PLACE_ACTIVE: "SETUP_PLACE_ACTIVE",
    SETUP_PLACE_BENCH: "SETUP_PLACE_BENCH",

    // normal game flow
    MAIN: "MAIN",
    BETWEEN_TURNS: "BETWEEN_TURNS",

    // end
    GAME_END: "GAME_END"
});

export const energyZoneLocation = Object.freeze({
    CURRENT: "current",
    NEXT: "next",
});
export const Type = Object.freeze({
    GRASS: "grass",
    FIRE: "fire",
    WATER: "water",
    LIGHTNING: "lightning",
    FIGHTING: "fighting",
    PSYCHIC: "psychic",
    COLORLESS: "colorless",
    DARK:"dark",
    DRAGON:"dragon",
    METAL:"metal",
    NONE:"none",
});

export const Rarity = Object.freeze({
    DIAMOND_1: "diamond_1",
    DIAMOND_2: "diamond_2",
    DIAMOND_3: "diamond_3",
    DIAMOND_4: "diamond_4",
    STAR_1: "star_1",
    STAR_2: "star_2",
    STAR_3: "star_3",
    CROWN: "crown"
});

export const ZoneName = Object.freeze({
    // Pokemon zones
    ACTIVE: "active",
    BENCH_0: "bench_0",
    BENCH_1: "bench_1", 
    BENCH_2: "bench_2",
    
    // Card pile zones
    DECK: "deck",
    DISCARD: "discard",
    HAND: "hand",
});

/** All possible bench zones in order */
export const BENCH_ZONES = [ZoneName.BENCH_0, ZoneName.BENCH_1, ZoneName.BENCH_2];


export const Stage = Object.freeze({
    BASIC: "basic",
    STAGE_1: "stage_1",
    STAGE_2: "stage_2", 
    NONE: "none"
});

