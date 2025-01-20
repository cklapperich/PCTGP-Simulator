// Selection reasons - WHY are we selecting
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

export const SelectReason = Object.freeze({
    // Setup reasons
    SETUP_ACTIVE: "setup_active",         // Selecting initial active Pokemon
    SETUP_BENCH: "setup_bench",           // Selecting initial bench Pokemon
    
    // Game action reasons
    REPLACE_ACTIVE: "replace_active",     // Active Pokemon was KO'd
    ATTACH_ENERGY: "attach_energy",       // Attaching energy to a Pokemon
    PLAY_POKEMON: "play_pokemon",         // Playing a Pokemon card
    EVOLVE_POKEMON: "evolve_pokemon",     // Evolving a Pokemon
    
    // Effect reasons
    ABILITY_TARGET: "ability_target",     // Targeting for ability effect
    ATTACK_TARGET: "attack_target",       // Targeting for attack effect
    NOT_SPECIFIED: "not_specified",
});

// The engine is requesting an input for one of these reasons
export class InputRequestEvent {
    constructor({
        reason=SelectReason.NOT_SPECIFIED,
        legalMoves = []
    }={}) {
        this.legalMoves = legalMoves; // a list of legal moves, each legal move should be of type PlayerInput
        this.reason = reason;
    }
}

export class PlayerInput {
    constructor({
        data = new InputData(), // Input data from the player
        playerIndex = undefined // Index of the player this input belongs to
    } = {}) {
        this.data = data;
        this.playerIndex = playerIndex;
    }
}

/**
 * Data structure containing all possible fields for any input response.
 * Fields are optional and their usage depends on the input type.
 */
export class InputData {
    constructor({
        // Selection fields
        handIndex=null,   // Index of selected item (card in hand, Pokemon on bench, etc)
        sourceZone=null,      // Zone selecting from (hand, bench, etc)
        targetZone=null,      // Zone moving to (if applicable)
        deckIndex=null,
        // Battle fields
        attackIndex=null,     // Index of chosen attack
        attackInfo=null,      // Attack details for UI convenience
        
        // Additional fields can be added as needed
    } = {}) {
        this.handIndex = handIndex;
        this.deckIndex = deckIndex;
        this.sourceZone = sourceZone;
        this.targetZone = targetZone;
        this.attackIndex = attackIndex;
        this.attackInfo = attackInfo;
    }
}