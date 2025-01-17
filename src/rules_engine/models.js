import { Type, Rarity, Phase } from './enums.js';

/**
 * Represents a Pokemon card attack
 */

// KEY INSIGHT: effects can be either 'damage' effects or other effects. most attack effects have a damage effect 
// and sometimes a non-damage effect
// an attack might require a coin flip, if heads, put oponnent to sleep - but deal no damage
// or deal 30x times the number of heads, flip 3 coins. but no other effects
// game logic distinguishes between damage and non-damage effects (prevent all damage...) vs (prevent all effects, including damage) vs (prevent all effects except damage)
// KEY INSIGHT: effects need a 'tear down' to undo what they did

// IDEA 1: everytime something happens, run every effect. Each effect is just a function that receives the game state.
// it checks the game state and the game phasem and then can mnodify the state, flipping variables like damage, can_attack, can_retreat, and so on.
// but now we lose the ability to do things like "can't retreat due to {reason}!"

// IDEA 2: EFFECT REGISTRY
// register effects with an effect registry. Game pushes events to the registry. then effects process those events, and can return true/false for things like can_retreat
// this way, we can still do things like "can't retreat due to {reason}!"
// see some of the commented out code in gameLoop.js for roughly how this works

// we need to track what effects are on each player and card - cards and players have data fields to store an effects list
// see a1-57.json for an example of how effects look in json. this is CORRECT and we want to keep it.
// but we might need an 'oponnents field' and an 'allied field' and a 'global' as well.
// or maybe simpler, some effects are registered in the registry but dont belong to anything but the 'source"? consider an ability tha tdoubles the potency of all allied grass energy to 2
// but then how do we know to call it? so it might have to go to global
export class Effect {
    constructor(base_damage = 0) {
        this.type = 'basic';  // Default to basic effect
        this.base_damage = base_damage || 0;  // Default to 0 if undefined
    }
}

/**
 * Represents a legal move in the game
 */
export class Move {
    constructor(type, data = {}) {
        this.type = type;
        this.data = data;
    }
}

/**
 * Represents the current state of the game
 */
export class GameState {
    constructor() {
        this.phase = Phase.INITIAL_COIN_FLIP;
        this.players = {};
        this.turn = 0;
        this.currentPlayer = 0;
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
        stage = 'basic', // 'basic', 'stage1', or 'stage2'
        evolvesFrom = null, // Name of Pokemon this evolves from
        can_evolve = true // Whether this Pokemon can evolve this turn
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
        this.attachedEnergy = new Map(); // Type -> count of attached energy
        this.damage = 0;
        this.owner = null; // Set when card is added to a player's deck/hand/field
        this.reference_card = null; // Set for alternate-artwork cards, this is the 'rules reference', otherwise blank
    }

    /**
     * Set the owner of this card
     * @param {PlayerState} player - The player who owns this card
     */
    setOwner(player) {
        this.owner = player;
        // If this card has an auto-trigger ability, activate it
        if (this.ability?.triggerType === 'auto') {
            this.ability.activate(this, null); // gameState will be provided by the effect system
        }
    }

    clone() {
        return structuredClone(this);
    }

    /**
     * Attach energy from energy zone to this Pokemon
     * @param {Type} energyType - Type of energy to attach
     */
    attachEnergy(energyType) {
        // Can only attach one energy per turn
        if (this.owner && !this.owner.canAttachEnergy) return false;
        
        this.attachedEnergy.set(
            energyType, 
            (this.attachedEnergy.get(energyType) || 0) + 1
        );

        if (this.owner) {
            this.owner.canAttachEnergy = false;
        }

        return true;
    }

    /**
     * Check if Pokemon can retreat
     * @param {EffectRegistry} effectRegistry - Registry of active effects
     * @returns {boolean} Whether retreat is possible
     */
    canRetreat(effectRegistry) {
        const availableEnergy = effectRegistry.calculateAvailableEnergy(this, this.attachedEnergy);
        const totalEnergy = Array.from(availableEnergy.values())
            .reduce((sum, count) => sum + count, 0);
        return totalEnergy >= this.retreat;
    }

    /**
     * Get total damage taken
     * @returns {number} Current damage
     */
    getDamage() {
        return this.damage;
    }

    /**
     * Check if Pokemon is knocked out
     * @returns {boolean} Whether Pokemon is KO'd
     */
    isKnockedOut() {
        return this.damage >= this.HP;
    }
}

/**
 * Represents a deck of Pokemon cards
 */
export class Deck {
    constructor(cards = [], energyTypes = []) {
        this.cards = [...cards];
        this.energyTypes = energyTypes; // Array of energy types available in this deck
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
        currentEnergyZone = null,
        nextEnergyZone = null,
        isAI = false
    } = {}) {
        this.name = name;
        this.hand = hand;
        this.bench = bench;
        this.active = active;
        this.points = points;
        this.deck = deck;
        this.discard = discard;
        this.currentEnergyZone = currentEnergyZone; // Current available energy type
        this.nextEnergyZone = nextEnergyZone; // Next energy type to become available
        this.isAI = isAI;
        this.canAttachEnergy = true;
        this.canAttack = true;
        this.setupComplete = false;
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
