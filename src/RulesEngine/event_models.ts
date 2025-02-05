import { ZoneName, Type } from './enums';
import type { GameEventProps, GameEventDataProps } from './types';

export enum GameEventType {
    // UI Update Events - these tell the UI exactly what changed visually
    CARD_MOVE = "card_move",     // Card moved from one zone to another (hand->bench, bench->active, etc)
    CARD_REVEAL = "card_reveal", // Card was revealed (e.g. from deck to hand)
    CARD_HIDE = "card_hide",     // Card was hidden (e.g. shuffled into deck)
    
    // Game State Events
    SHUFFLE_DECK = "shuffle",
    DRAW_CARD = "draw_card",
    ATTACH_ENERGY = "attach_energy",
    ATTACK = "attack",
    FLIP_COINS = "flip_coins",
    PHASE_CHANGE = "phase_change",
    GAME_END = "game_end",
    TURN_START = "turn_start",
    TURN_END = "turn_end",
    TURN_ORDER = "SETUP_COIN_FLIP", // communicate turn order
    
    // Pokemon State Events
    KNOCKOUT = "knockout",
    EVOLVE = "evolve",
    RETREAT = "retreat",
    DAMAGE = "damage",
    HEAL = "heal",
    STATUS_APPLY = "status_apply",
    STATUS_REMOVE = "status_remove",

    // Effect Events
    EFFECT_ADD = "effect_add",
    EFFECT_REMOVE = "effect_removed",
    ABILITY_ACTIVATE = "ability_activate",
    
    // Energy Zone Events
    ENERGY_ZONE_UPDATE = "energy_zone_update"
}

/**
 * Data structure containing all possible fields for any game event.
 * Fields are optional and their usage depends on the event type.
 */
export class GameEventData {
    card: any | null;               // The card being moved/played/attached
    sourceZone: string | null;      // Zone the card is moving from
    targetZone: string | null;      // Zone the card is moving to
    playerIndex: number | null;     // Index of player performing action
    sourceCard: any | null;         // Card/Pokemon/effect causing this event
    targetCard: any | null;         // Card/Pokemon being targeted
    attackIndex: number | null;     // Index of chosen attack
    damageType: Type | null;            // Type for damage/energy/etc
    effectType: string | null;      // Type of effect being applied
    phase: string | null;           // New game phase
    turn: number | null;            // Current turn number
    winner: number | null;          // Winner of game
    amount: number | null;          // Generic number (damage, cards drawn, etc)
    flips: boolean[] | null;        // Results of coin flips

    constructor({
        card = null,
        sourceZone = null,
        targetZone = null,
        playerIndex = null,
        source = null,
        target = null,
        attackIndex = null,
        damageType = null,
        effectType = null,
        phase = null,
        turn = null,
        winner = null,
        amount = null,
        flips = null,
    }: GameEventDataProps = {}) {
        this.card = card;
        this.sourceZone = sourceZone;
        this.targetZone = targetZone;
        this.playerIndex = playerIndex;
        
        this.sourceCard = source;
        this.targetCard = target;
        this.attackIndex = attackIndex;
        this.damageType = damageType;
        
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
    type: string;
    data: GameEventData;

    constructor({
        type,
        data = {}
    }: GameEventProps) {
        this.type = type;
        this.data = new GameEventData(data);
    }
}
