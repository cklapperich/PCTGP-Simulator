import { Type, Rarity, Phase, ZoneName, Stage,CardType} from './enums';
import type { 
    Attack, 
    CardProps, 
    DeckProps, 
    PlayerStateProps,
} from './types';
import { EffectManager } from './effect_manager.js';
import {PlayerInput} from './input_event_models.js'
/**
 * Represents the current state of the game
 */
export class GameState {
    phase: Phase;
    players: { [key: number]: PlayerState };
    turn: number;
    currentPlayerIndex: number;
    effectManager: EffectManager;
    lastinput: PlayerInput;
    activeEffects: any[]; // TODO: Define effect type? could use effect_manager.ts definition, except, circular import problem!
    constructor(player1: PlayerState, player2: PlayerState) {
        this.phase = Phase.DEAL_CARDS;
        this.players = {
            0: player1,
            1: player2
        };
        this.turn = 0;
        this.currentPlayerIndex = -1;
        this.effectManager = new EffectManager();
        this.lastinput=null;

        // Initialize card ownership for both players
        player1.deck.cards.forEach(card => {
            card.owner = 0;
        });
        player2.deck.cards.forEach(card => {
            card.owner = 1;
        });
    }

    getCurrentPlayer(): PlayerState {
        return this.players[this.currentPlayerIndex];
    }

    getOpponentPlayer(): PlayerState {
        return this.players[1 - this.currentPlayerIndex];
    }
}

export class Card {
    static nextId: number = 1;
    id: number;
    name: string;
    HP: number;
    type: Type;
    cardType: CardType;
    attacks: Attack[];
    retreat: number;
    rarity: string;
    set: string;
    ability: any; // TODO: Define ability type
    stage: string;
    evolvesFrom: string | null;
    can_evolve: boolean;
    owner: number | null;
    weakness: Type;
    resistance: Type;
    constructor({
        name,
        cardType = CardType.POKEMON,
        HP=0,
        type=Type.NONE,
        attacks = [],
        retreat = 0,
        rarity = Rarity.DIAMOND_1,
        set = "",
        ability = null,
        stage = Stage.NONE,
        evolvesFrom = null,
        weakness = Type.NONE,
        resistance = Type.NONE,
  
    }: CardProps) {
        this.id = Card.nextId++;
        this.name = name;
        this.HP = HP;
        this.cardType = cardType;
        this.type = type;
        this.attacks = attacks;
        this.retreat = retreat;
        this.rarity = rarity;
        this.set = set;
        this.ability = ability;
        this.stage = stage;
        this.evolvesFrom = evolvesFrom;
        this.can_evolve = false;
        this.owner = null;
        this.weakness = weakness;
        this.resistance = resistance;
    }
    
    is_trainer(): boolean {
        return this.cardType === CardType.TRAINER || this.cardType === CardType.SUPPORTER || this.cardType === CardType.TOOL;
    }
    is_pokemon() : boolean {
        return this.cardType === CardType.POKEMON;
    }
}

/**
 * Represents a deck of Pokemon cards
 */
export class Deck {
    name: string;
    cards: Card[];
    energyTypes: Type[];

    constructor({
        name = "Default Deck",
        cards = [],
        energyTypes = new Set<Type>()
    }: DeckProps = {}) {
        this.name = name;
        this.cards = [...cards];
        this.energyTypes = [...energyTypes];
    }

    shuffle(): void {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    addCard(card: Card): void {
        this.cards.push(card);
    }

    removeTopCard(): Card {
        if (this.cards.length === 0) {
            throw new Error("Cannot remove card from empty deck");
        }
        return this.cards.pop()!;
    }

    getEnergyTypes(): Type[] {
        return [...this.energyTypes];
    }
}

/**
 * Represents a game zone that can contain cards and energy
 */
export class Zone {
    cards: Card[];
    attachedEnergy: { [key in Type]?: number };
    attachedTools: Card[];
    damage: number;
    constructor() {
        this.cards = [];
        this.attachedEnergy = {};
        this.attachedTools = [];
        this.damage = 0;
    }

    clear(): Card[] {
        const clearedCards = [...this.cards];
        this.cards = [];
        this.attachedEnergy = {};
        this.attachedTools = [];
        this.damage = 0;
        return clearedCards;
    }

    getPokemon(): Card | null {
        return this.cards[this.cards.length - 1] || null;
    }

    addCard(card: Card): void {
        this.cards.push(card);
    }

    removeTopCard(): Card {
        if (this.cards.length === 0) {
            throw new Error("Cannot remove card from empty zone");
        }
        return this.cards.pop()!;
    }

    addEnergy(energyType: Type): void {
        this.attachedEnergy[energyType] = (this.attachedEnergy[energyType] || 0) + 1;
    }

    removeEnergy(energyType: Type): boolean {
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

    getTotalEnergy(): number {
        return Object.values(this.attachedEnergy).reduce((sum, count) => sum + count, 0);
    }

    getDamage(): number {
        return this.damage;
    }

    addDamage(amount: number): void {
        this.damage += amount;
    }

    healDamage(amount: number): void {
        this.damage = Math.max(0, this.damage - amount);
    }

    isKnockedOut(): boolean {
        const pokemon = this.getPokemon();
        return pokemon ? this.damage >= pokemon.HP : false;
    }
}

/**
 * Represents a player's state in the game
 */
export class PlayerState {
    name: string;
    isAI: boolean;
    deck: Deck;
    zones: { [key in ZoneName]: Zone };
    currentEnergyZone: Type | null;  // Changed from string to Type
    nextEnergyZone: Type | null;     // Changed from string to Type
    canAttachEnergy: boolean;
    canSupporter: boolean;
    setupComplete: boolean;
    points: number;

    constructor({
        name = "DEFAULT",
        isAI = false,
        deck = new Deck()
    }: PlayerStateProps = {}) {
        this.name = name;
        this.isAI = isAI;
        this.deck = deck;
        
        // Initialize all zones
        this.zones = {
            [ZoneName.ACTIVE]: new Zone(),
            [ZoneName.BENCH_0]: new Zone(),
            [ZoneName.BENCH_1]: new Zone(),
            [ZoneName.BENCH_2]: new Zone(),
            [ZoneName.DISCARD]: new Zone(),
            [ZoneName.HAND]: new Zone(),
            [ZoneName.DECK]: new Zone()
        };
        
        this.currentEnergyZone = null;
        this.nextEnergyZone = null;
        
        this.canAttachEnergy = true;
        this.canSupporter = true;
        this.setupComplete = false;
        this.points = 0;
    }

    getZone(zoneName: ZoneName): Zone {
        const zone = this.zones[zoneName];
        if (!zone) {
            throw new Error(`Invalid zone name: ${zoneName}`);
        }
        return zone;
    }

    getPokemonInZone(zoneName: ZoneName): Card | null {
        return this.getZone(zoneName).getPokemon();
    }

    addCardToZone(card: Card, zoneName: ZoneName): void {
        this.getZone(zoneName).addCard(card);
    }

    removeTopCardFromZone(zoneName: ZoneName): Card {
        return this.getZone(zoneName).removeTopCard();
    }

    addEnergyToZone(energyType: Type, zoneName: ZoneName): void {
        this.getZone(zoneName).addEnergy(energyType);
    }

    removeEnergyFromZone(energyType: Type, zoneName: ZoneName): boolean {
        return this.getZone(zoneName).removeEnergy(energyType);
    }

    clearZone(zoneName: ZoneName): Card[] {
        return this.getZone(zoneName).clear();
    }

    addToHand(card: Card): void {
        this.addCardToZone(card, ZoneName.HAND);
    }

    addToDiscard(card: Card): void {
        this.addCardToZone(card, ZoneName.DISCARD);
    }

    drawCard(): Card {
        const card = this.deck.removeTopCard();
        this.addToHand(card);
        return card;
    }

    shuffleDeck(): void {
        this.deck.shuffle();
    }
}
