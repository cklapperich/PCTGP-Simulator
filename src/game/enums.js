// Converted from Python Enums

export const EventType = Object.freeze({
    // Game state events
    SHUFFLE: "shuffle",
    DRAW_CARD: "draw_card", 
    ATTACH_ENERGY: "attach_energy",
    ATTACK: "attack",
    FLIP_COINS: "flip_coins",
    PHASE_CHANGE: "phase_change",
    GAME_END: "game_end",
    TURN_CHANGE: "turn_change",

    // Special interaction events
    SEARCH_DECK: "search_deck",
    SEARCH_DISCARD: "search_discard",
    SELECT_PRIZE: "select_prize",
    WAIT_FOR_INPUT: "wait_for_input"
});

export const Phase = Object.freeze({
    // INITIAL setup
    SETUP: "SETUP",
    INITIAL_COIN_FLIP: "INITIAL_COIN_FLIP",
    DEAL_CARDS: "DEAL_CARDS", 
    SETUP_PLACE_CARDS: "SETUP_PLACE_CARDS",

    // normal game flow
    DRAW: "DRAW",
    ATTACK: "ATTACK",
    BETWEEN_TURNS: "BETWEEN_TURNS",

    // end
    GAME_END: "GAME_END"
});

export const Type = Object.freeze({
    GRASS: "grass",
    FIRE: "fire",
    WATER: "water",
    LIGHTNING: "lightning",
    FIGHTING: "fighting",
    PSYCHIC: "psychic",
    COLORLESS: "colorless"
});

export const Rarity = Object.freeze({
    COMMON: "common",
    UNCOMMON: "uncommon",
    RARE: "rare",
    HOLO_RARE: "holo_rare"
});
