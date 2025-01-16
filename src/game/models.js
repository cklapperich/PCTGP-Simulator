import { Type, Rarity } from './enums.js';

/**
 * Represents a basic effect with damage
 */
export class BasicEffect {
    constructor(baseDamage = 0) {
        this.baseDamage = baseDamage;
    }
}

/**
 * Represents a Pokemon card attack
 */
export class Attack {
    constructor(name, effect, cost, damage) {
        this.name = name;
        this.effect = effect;
        this.cost = cost;
        this.damage = damage;
    }
}

/**
 * Represents a Pokemon card
 */
export class Card {
    constructor({name, HP, type, attacks = [], retreat = 0, rarity = Rarity.COMMON, set = ""}) {
        this.name = name;
        this.HP = HP;
        this.type = type;
        this.attacks = attacks;
        this.retreat = retreat;
        this.rarity = rarity;
        this.set = set;
    }

    clone() {
        return structuredClone(this);
    }
}

/**
 * Represents a deck of Pokemon cards
 */
export class Deck {
    constructor(cards = []) {
        this.cards = [...cards];
    }

    shuffle() {
        // Fisher-Yates shuffle
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        return this.cards;
    }

    draw() {
        if (this.cards.length === 0) {
            throw new Error("Cannot draw from empty deck");
        }
        return this.cards.pop();
    }
}

/**
 * Represents a player's state in the game
 */
export class PlayerState {
    constructor({
        name = "DEFAULT",
        hand = [],
        bench = {},
        active = null,
        points = 0,
        deck = null,
        discard = [],
        energy = null,
        nextEnergy = null,
        isAI = false
    } = {}) {
        this.name = name;
        this.hand = hand;
        this.bench = bench;
        this.active = active;
        this.points = points;
        this.deck = deck;
        this.discard = discard;
        this.energy = energy;
        this.nextEnergy = nextEnergy;
        this.isAI = isAI;
        this.canAttachEnergy = true;
        this.canAttack = true;
    }
}

/**
 * Parameters for search events
 */
export class SearchParams {
    constructor({
        instruction,
        legalCards,
        minCards = 1,
        maxCards = 1,
        canCancel = false,
        playerId,
        reason = ""
    }) {
        this.instruction = instruction;
        this.legalCards = legalCards;
        this.minCards = minCards;
        this.maxCards = maxCards;
        this.canCancel = canCancel;
        this.playerId = playerId;
        this.reason = reason;
    }
}

/**
 * Represents a game event
 */
export class Event {
    constructor(eventType, data = {}, searchParams = null) {
        this.eventType = eventType;
        this.data = data;
        this.searchParams = searchParams;
    }
}
