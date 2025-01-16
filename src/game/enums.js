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
    TURN_START: "turn_start",
    TURN_END: "turn_end",

    // Pokemon state events
    KNOCKOUT: "knockout",
    EVOLVE: "evolve",
    RETREAT: "retreat",
    DAMAGE: "damage",
    HEAL: "heal",
    STATUS_APPLY: "status_apply",
    STATUS_REMOVE: "status_remove",

    // Effect events
    EFFECT_START: "effect_start",
    EFFECT_END: "effect_end",
    ABILITY_ACTIVATE: "ability_activate",

    // Special interaction events
    SEARCH_DECK: "search_deck",
    SEARCH_DISCARD: "search_discard",
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
    COLORLESS: "colorless",
    DARK:"dark",
    DRAGON:"dragon",
    METAL:"metal"
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

export const MoveType = Object.freeze({
    PLAY_CARD: "play_card",
    ATTACK: "attack",
    ACTIVATE_ABILITY: "activate_ability",
    RETREAT: "retreat",
    ATTACH_ENERGY: "attach_energy_from_zone",
    CONCEDE: "concede"
});
