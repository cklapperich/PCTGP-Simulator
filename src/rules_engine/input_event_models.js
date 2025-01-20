// Selection reasons - WHY are we selecting
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
    NOT_SPECIFIED: "not_specified"
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
        reason = SelectReason.NOT_SPECIFIED, // Reason for the input request of type SelectReason from enums.js
        playerIndex = undefined // Index of the player this input belongs to
    } = {}) {
        this.data = data;
        this.reason = reason;
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
        selectedIndex,   // Index of selected item (card in hand, Pokemon on bench, etc)
        sourceZone,      // Zone selecting from (hand, bench, etc)
        targetZone,      // Zone moving to (if applicable)
        
        // Battle fields
        attackIndex,     // Index of chosen attack
        attackInfo,      // Attack details for UI convenience
        
        // Additional fields can be added as needed
    } = {}) {
        this.selectedIndex = selectedIndex;
        this.sourceZone = sourceZone;
        this.targetZone = targetZone;
        this.attackIndex = attackIndex;
        this.attackInfo = attackInfo;
    }
}