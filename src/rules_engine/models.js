import { Type, Rarity, Phase, SelectReason, ZoneName, Stage} from './enums.js';

/**
 * Represents the current state of the game
 */
export class GameState {
    constructor() {
        this.phase = Phase.DEAL_CARDS;
        this.players = {};
        this.turn = 0;
        this.currentPlayer = -1; //starts at -1 before a player is chosen
    }

    getCurrentPlayer() {
        return this.players[this.currentPlayer];
    }

    getOpponentPlayer() {
        return this.players[1 - this.currentPlayer];
    }
}

export class Attack {
    constructor(name, effect, cost, damage) {
        this.name = name;
        this.effect = effect;
        this.cost = cost;
        this.damage = damage;
    }

    /**
     * Check if there's enough energy to use this attack
     * @param {Card} pokemon - Pokemon trying to use the attack
     * @param {EffectRegistry} effectRegistry - Registry of active effects
     * @returns {boolean} Whether attack can be used
     */
    canUse(pokemon, effectRegistry) {
        const energyCount = new Map();
        
        // Count required energy by type
        this.cost.forEach(type => {
            energyCount.set(type, (energyCount.get(type) || 0) + 1);
        });

        // Get available energy including effects
        const availableEnergy = effectRegistry.calculateAvailableEnergy(
            pokemon, 
            pokemon.attachedEnergy
        );

        // Check if we have enough of each type
        for (const [type, required] of energyCount) {
            const available = availableEnergy.get(type) || 0;
            if (available < required) {
                // Special case: Colorless can be paid with any type
                if (type === Type.COLORLESS) {
                    // Sum all available energy
                    const totalEnergy = Array.from(availableEnergy.values())
                        .reduce((sum, count) => sum + count, 0);
                    if (totalEnergy < required) return false;
                } else {
                    return false;
                }
            }
        }

        return true;
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
        this.energyTypes = new Set(energyTypes); // Set of energy types (Type enum) this deck can use
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
        return Array.from(this.energyTypes);
    }
}

/**
 * Represents a game zone that can contain cards and energy
 */
class Zone {
    constructor() {
        this.cards = [];  // Stack of cards in the zone
        this.attachedEnergy = new Map(); // Type -> count
        this.attachedTools = new Set(); // Set of tool cards
        this.damage = 0; // Track damage on the zone instead of the card
    }

    clear() {
        const clearedCards = [...this.cards];
        this.cards = [];
        this.attachedEnergy.clear();
        this.attachedTools.clear();
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
        this.attachedEnergy.set(
            energyType,
            (this.attachedEnergy.get(energyType) || 0) + 1
        );
    }

    // Remove energy of specific type from this zone
    removeEnergy(energyType) {
        const current = this.attachedEnergy.get(energyType) || 0;
        if (current > 0) {
            this.attachedEnergy.set(energyType, current - 1);
            if (this.attachedEnergy.get(energyType) === 0) {
                this.attachedEnergy.delete(energyType);
            }
            return true;
        }
        return false;
    }

    // Get total count of attached energy
    getTotalEnergy() {
        let total = 0;
        for (const count of this.attachedEnergy.values()) {
            total += count;
        }
        return total;
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

    clone() {
        return structuredClone(this);
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
        this.zones = new Map();
        this.zones.set(ZoneName.ACTIVE, new Zone());
        this.zones.set(ZoneName.BENCH_0, new Zone());
        this.zones.set(ZoneName.BENCH_1, new Zone());
        this.zones.set(ZoneName.BENCH_2, new Zone());
        this.zones.set(ZoneName.DISCARD, new Zone());
        this.zones.set(ZoneName.HAND, new Zone());
        
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
        const zone = this.zones.get(zoneName);
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
