// Converted from Python Enums

export const EventType = Object.freeze({
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

    // Special Interaction Events
    SEARCH_DECK: "search_deck",
    SEARCH_DISCARD: "search_discard",
    WAIT_FOR_INPUT: "wait_for_input"
});

export const Phase = Object.freeze({
    // INITIAL setup
    INITIAL_COIN_FLIP: "INITIAL_COIN_FLIP",
    DEAL_CARDS: "DEAL_CARDS",
    SETUP_PLACE_ACTIVE: "SETUP_PLACE_ACTIVE",
    SETUP_PLACE_BENCH: "SETUP_PLACE_BENCH",

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
    // Game actions
    ATTACK: "attack",
    ACTIVATE_ABILITY: "activate_ability",
    RETREAT: "retreat",
    ATTACH_ENERGY: "attach_energy_from_zone",
    
    // Raw inputs
    CHOOSE_HAND_CARD: "choose_hand_card",     // Player selected a card in their hand
    CHOOSE_FIELD_CARD: "choose_field_card",   // Player selected a card on the field
    PASS_TURN: "pass_turn",                   // Player wants to end their turn/action
    
    // Special
    CONCEDE: "concede"                        // Player gives up
});

export const InputType = Object.freeze({
    PLACE_ACTIVE: "place_active",           // Player must place their active Pokemon
    PLACE_BENCH: "place_bench",             // Player may place bench Pokemon
    MAIN_ACTION: "main_action",             // Player's main turn action (attach energy, evolve, etc)
    ATTACK_TARGET: "attack_target",         // Player must choose attack target
    SEARCH_DECK: "search_deck",             // Player is searching their deck
    SEARCH_DISCARD: "search_discard"        // Player is searching their discard pile
});
