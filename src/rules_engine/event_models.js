
import { ZoneName } from './enums.js';

export const GameEventType = Object.freeze({
    // UI Update Events - these tell the UI exactly what changed visually
    CARD_MOVE: "card_move",     // Card moved from one zone to another (hand->bench, bench->active, etc)
    CARD_REVEAL: "card_reveal", // Card was revealed (e.g. from deck to hand)
    CARD_HIDE: "card_hide",     // Card was hidden (e.g. shuffled into deck)
    
    // Game State Events
    SHUFFLE_DECK: "shuffle",
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
    EFFECT_ADD: "effect_add",
    EFFECT_REMOVE: "effect_removed",
    ABILITY_ACTIVATE: "ability_activate",
    
    // Energy Zone Events
    ENERGY_ZONE_UPDATE: "energy_zone_update",
});


/**
 * Data structure containing all possible fields for any game event.
 * Fields are optional and their usage depends on the event type.
 */
export class GameEventData {
    constructor({
        // Card movement fields
        card=null,                // The card being moved/played/attached
        sourceZone=null,         // Zone the card is moving from
        targetZone=null,         // Zone the card is moving to
        playerIndex=null,         // Index of player performing action
        
        // Battle fields
        attackingPokemon=null,   // Pokemon using attack
        defendingPokemon=null,   // Pokemon being attacked
        attackIndex=null,        // Index of chosen attack
        damage=null,             // Amount of damage dealt
        
        // Effect fields
        source=null,             // Card/effect causing this event
        effectType=null,         // Type of effect being applied
        
        // Game state fields
        phase=null,              // New game phase
        turn=null,              // Current turn number
        winner=null,            // Winner of game
        
        // Misc fields
        amount=null,            // Generic number (damage, cards drawn, etc)
        flips=null,            // Results of coin flips
        
        // Additional fields can be added as needed
    } = {}) {
        this.card = card;
        this.sourceZone = sourceZone;
        this.targetZone = targetZone;
        this.playerIndex = playerIndex;
        
        this.attackingPokemon = attackingPokemon;
        this.defendingPokemon = defendingPokemon;
        this.attackIndex = attackIndex;
        this.damage = damage;
        
        this.source = source;
        this.effectType = effectType;
        
        this.phase = phase;
        this.turn = turn;
        this.winner = winner;
        
        this.amount = amount;
        this.flips = flips;
    }
}

/**
 * Game event with type and optional data fields
 */
export class GameEvent {
    constructor({
        type,
        data = {}
    }) {
        this.type = type;
        this.data = new GameEventData(data);
    }

    /**
     * Helper methods to create common event types.
     * These provide a cleaner API while maintaining flexibility.
     */
    static createCardMove({card, sourceZone, targetZone, playerIndex}) {
        return new GameEvent({
            type: GameEventType.CARD_MOVE,
            data: {card, sourceZone, targetZone, playerIndex}
        });
    }

    static createAttack({attackingPokemon, defendingPokemon, attackIndex, damage}) {
        return new GameEvent({
            type: GameEventType.ATTACK,
            data: {attackingPokemon, defendingPokemon, attackIndex, damage}
        });
    }

    static createDamage({target, amount, source}) {
        return new GameEvent({
            type: GameEventType.DAMAGE,
            data: {target, amount, source}
        });
    }

    static createPhaseChange(phase) {
        return new GameEvent({
            type: GameEventType.PHASE_CHANGE,
            data: {phase}
        });
    }
}
