// Converted from Python Enums

export const GameEventType = Object.freeze({
    // UI Update Events - these tell the UI exactly what changed visually
    CARD_MOVE: "card_move",     // Card moved from one zone to another (hand->bench, bench->active, etc)
    CARD_REVEAL: "card_reveal", // Card was revealed (e.g. from deck to hand)
    CARD_HIDE: "card_hide",     // Card was hidden (e.g. shuffled into deck)
    
    // Game State Events
    SHUFFLE: "shuffle",
    DRAW_CARD: "draw_card",
    ATTACH_ENERGY: "attach_energy",
    ATTACK: "attack",
    FLIP_COINS: "flip_coins",
    PHASE_CHANGE: "phase_change",
    GAME_END: "game_end",
    TURN_START: "turn_start",
    TURN_END: "turn_end",
    TURN_ORDER: "SETUP_COIN_FLIP", // communicate turn order
    // Pokemon State Events
    KNOCKOUT: "knockout",
    EVOLVE: "evolve",
    RETREAT: "retreat",
    DAMAGE: "damage",
    HEAL: "heal",
    STATUS_APPLY: "status_apply",
    STATUS_REMOVE: "status_remove",

    // Effect Events
    EFFECT_START: "effect_start",
    EFFECT_END: "effect_end",
    ABILITY_ACTIVATE: "ability_activate",
    
    // Energy Zone Events
    ENERGY_ZONE_UPDATE: "energy_zone_update",

});

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

export const InputType = Object.freeze({
    // Selection inputs - WHAT you're selecting from
    SELECT_HAND: "select_hand",           // Select card(s) from hand
    SELECT_BENCH: "select_bench",         // Select Pokemon from bench
    SELECT_ACTIVE: "select_active",       // Select active Pokemon
    SEARCH_DECK: "search_deck",           // Search deck for card(s)
    SEARCH_DISCARD: "search_discard",     // Search discard for card(s)
    
    // Game action inputs
    ATTACK: "attack",                     // Choose an attack to use
    ACTIVATE_ABILITY: "activate_ability", // Choose an ability to activate
    RETREAT: "retreat",                   // Choose to retreat
    PASS_TURN: "pass_turn",              // Choose to pass turn
    START_BATTLE: "start_battle",         // Choose to start battle
    CONCEDE: "concede"                    // Choose to concede
});
