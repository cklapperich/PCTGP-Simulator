import { GameEventType, Zone, SelectReason } from './enums.js';

/**
 * Data structure containing all possible fields for any game event.
 * Fields are optional and their usage depends on the event type.
 */
export class EventData {
    constructor({
        // Card movement fields
        card,                // The card being moved/played/attached
        sourceZone,         // Zone the card is moving from
        targetZone,         // Zone the card is moving to
        playerIndex,        // Index of player performing action
        
        // Battle fields
        attackingPokemon,   // Pokemon using attack
        defendingPokemon,   // Pokemon being attacked
        attackIndex,        // Index of chosen attack
        damage,             // Amount of damage dealt
        
        // Effect fields
        source,             // Card/effect causing this event
        effectType,         // Type of effect being applied
        
        // Game state fields
        phase,              // New game phase
        turn,              // Current turn number
        winner,            // Winner of game
        
        // Misc fields
        amount,            // Generic number (damage, cards drawn, etc)
        flips,            // Results of coin flips
        
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
        this.data = new EventData(data);
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
