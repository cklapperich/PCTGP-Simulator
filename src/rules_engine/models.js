import { Type, Rarity, Phase, ZoneName, Stage } from './enums.js';

/**
 * Represents the current state of the game
 */
export class GameState {
    constructor(player1, player2) {
        this.phase = Phase.DEAL_CARDS;
        this.players = {
            0: player1,
            1: player2
        }; // mandatory. a dict of {0:player,1:player2}
        this.turn = 0;
        this.currentPlayerIndex = -1; //starts at -1 before a player is chosen

        // Initialize card ownership for both players
        player1.deck.cards.forEach(card => {
            card.owner = 0;
        });
        player2.deck.cards.forEach(card => {
            card.owner = 1;
        });
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayerIndex];
    }

    getOpponentPlayer() {
        return this.players[1 - this.currentPlayerIndex];
    }
}

export class Attack {
    constructor(name, effect, cost, damage) {
        this.name = name;
        this.effect = effect;
        this.cost = cost;
        this.damage = damage;
    }
}

/**
 * Represents a deck of Pokemon cards
 */
export class Deck {
    constructor({
        name = "Default Deck",
        cards = [],
        energyTypes = new Set()
    } = {}) {
        this.name = name;
        this.cards = [...cards]; // Array of Card objects
        this.energyTypes = [...energyTypes]; // Array of energy types (Type enum)
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    addCard(card) {
        this.cards.push(card);
    }

    removeTopCard() {
        if (this.cards.length === 0) {
            throw new Error("Cannot remove card from empty deck");
        }
        return this.cards.pop();
    }

    getEnergyTypes() {
        return [...this.energyTypes];
    }
}

/**
 * Represents a game zone that can contain cards and energy
 */
export class Zone {
    constructor() {
        this.cards = [];  // Stack of cards in the zone
        this.attachedEnergy = {};  // Type -> count
        this.attachedTools = [];  // Array of tool cards
        this.damage = 0; // Track damage on the zone instead of the card
    }

    clear() {
        const clearedCards = [...this.cards];
        this.cards = [];
        this.attachedEnergy = {};
        this.attachedTools = [];
        this.damage = 0;
        return clearedCards;
    }

    // Get the Pokemon card in this zone (top card)
    getPokemon() {
        return this.cards[this.cards.length - 1] || null;
    }

    // Add a card to this zone
    addCard(card) {
        this.cards.push(card);
    }

    // Remove and return top card from zone
    removeTopCard() {
        if (this.cards.length === 0) {
            throw new Error("Cannot remove card from empty zone");
        }
        return this.cards.pop();
    }

    // Add energy of specific type to this zone
    addEnergy(energyType) {
        this.attachedEnergy[energyType] = (this.attachedEnergy[energyType] || 0) + 1;
    }

    // Remove energy of specific type from this zone
    removeEnergy(energyType) {
        const current = this.attachedEnergy[energyType] || 0;
        if (current > 0) {
            this.attachedEnergy[energyType] = current - 1;
            if (this.attachedEnergy[energyType] === 0) {
                delete this.attachedEnergy[energyType];
            }
            return true;
        }
        return false;
    }

    // Get total count of attached energy
    getTotalEnergy() {
        return Object.values(this.attachedEnergy).reduce((sum, count) => sum + count, 0);
    }

    // Damage related methods
    getDamage() {
        return this.damage;
    }

    addDamage(amount) {
        this.damage += amount;
    }

    healDamage(amount) {
        this.damage = Math.max(0, this.damage - amount);
    }

    isKnockedOut() {
        const pokemon = this.getPokemon();
        return pokemon && this.damage >= pokemon.HP;
    }
}

/**
 * Represents a Pokemon card
 */
export class Card {
    static nextId = 1;

    constructor({
        name, 
        HP, 
        type, 
        attacks = [], 
        retreat = 0, 
        rarity = Rarity.COMMON, 
        set = "", 
        ability = null,
        stage = Stage.NONE,
        evolvesFrom = null,
        can_evolve = true
    }) {
        this.id = Card.nextId++;
        this.name = name;
        this.HP = HP;
        this.type = type;
        this.attacks = attacks;
        this.retreat = retreat;
        this.rarity = rarity;
        this.set = set;
        this.ability = ability;
        this.stage = stage;
        this.evolvesFrom = evolvesFrom;
        this.can_evolve = can_evolve;
        this.owner = null;
        this.reference_card = null;
        this.waitingForPlayer = null;
    }
}

/**
 * Represents a player's state in the game
 */
export class PlayerState {
    constructor({
        name = "DEFAULT",
        isAI = false,
        deck = new Deck()
    } = {}) {
        this.name = name;
        this.isAI = isAI;
        this.deck = deck;
        
        // Initialize all zones
        this.zones = {};
        this.zones[ZoneName.ACTIVE] = new Zone();
        this.zones[ZoneName.BENCH_0] = new Zone();
        this.zones[ZoneName.BENCH_1] = new Zone();
        this.zones[ZoneName.BENCH_2] = new Zone();
        this.zones[ZoneName.DISCARD] = new Zone();
        this.zones[ZoneName.HAND] = new Zone();
        
        // Energy system
        this.currentEnergyZone = null;
        this.nextEnergyZone = null;
        
        // Game state flags
        this.canAttachEnergy = true;
        this.canSupporter = true;
        this.setupComplete = false;
        this.points = 0;
    }

    // Get a zone by name
    getZone(zoneName) {
        const zone = this.zones[zoneName];
        if (!zone) {
            throw new Error(`Invalid zone name: ${zoneName}`);
        }
        return zone;
    }

    // Get the Pokemon card in a zone
    getPokemonInZone(zoneName) {
        return this.getZone(zoneName).getPokemon();
    }

    // Generic zone operations
    addCardToZone(card, zoneName) {
        this.getZone(zoneName).addCard(card);
    }

    removeTopCardFromZone(zoneName) {
        return this.getZone(zoneName).removeTopCard();
    }

    addEnergyToZone(energyType, zoneName) {
        this.getZone(zoneName).addEnergy(energyType);
    }

    removeEnergyFromZone(energyType, zoneName) {
        return this.getZone(zoneName).removeEnergy(energyType);
    }

    clearZone(zoneName) {
        return this.getZone(zoneName).clear();
    }

    // Convenience methods for card piles
    addToHand(card) {
        this.addCardToZone(card, ZoneName.HAND);
    }

    addToDiscard(card) {
        this.addCardToZone(card, ZoneName.DISCARD);
    }

    // Draw a card from deck to hand
    drawCard() {
        const card = this.deck.removeTopCard();
        this.addToHand(card);
        return card;
    }

    // Shuffle the deck
    shuffleDeck() {
        this.deck.shuffle();
    }
}
