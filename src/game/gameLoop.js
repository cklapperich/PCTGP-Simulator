import { EventType, Phase } from './enums.js';
import { Event, PlayerState } from './models.js';

// Simple queue implementation for events
export class EventQueue {
    constructor() {
        this.items = [];
    }

    put(item) {
        this.items.push(item);
    }

    get() {
        return this.items.shift();
    }

    empty() {
        return this.items.length === 0;
    }
}

// Global event queues
export const outputQueue = new EventQueue();
export const inputQueue = new EventQueue();

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
}

/**
 * Flips coins and returns array of boolean results
 * @param {number} n - Number of coins to flip
 * @returns {boolean[]} Array of coin flip results (true = heads, false = tails)
 */
export function flipCoins(n) {
    return Array(n).fill().map(() => Math.random() < 0.5);
}

/**
 * Initializes and starts a new game
 * @param {PlayerState} player1 - First player
 * @param {PlayerState} player2 - Second player
 * @returns {GameState} Initial game state
 */
export function startGame(player1, player2) {
    // Initialize game state
    const gameState = new GameState();
    gameState.turn = 0;
    gameState.players[0] = player1;
    gameState.players[1] = player2;

    // Disable initial actions for both players
    Object.values(gameState.players).forEach(player => {
        player.canAttachEnergy = false;
        player.canAttack = false;
    });

    // Initial coin flip phase
    gameState.phase = Phase.INITIAL_COIN_FLIP;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: Phase.INITIAL_COIN_FLIP
    }));

    // Perform initial coin flip
    const flip = flipCoins(1);
    gameState.currentPlayer = flip[0] ? 0 : 1;
    outputQueue.put(new Event(EventType.FLIP_COINS, {
        flip: flip
    }));

    // Setup phase
    gameState.phase = Phase.SETUP;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: Phase.SETUP,
        firstPlayer: gameState.players[gameState.currentPlayer]
    }));

    // Shuffle decks and draw initial hands
    Object.values(gameState.players).forEach(player => {
        // Shuffle deck
        player.deck.shuffle();
        outputQueue.put(new Event(EventType.SHUFFLE, {
            player: player
        }));

        // Draw 7 cards
        for (let i = 0; i < 7; i++) {
            const card = player.deck.draw();
            player.hand.push(card);
            outputQueue.put(new Event(EventType.DRAW_CARD, {
                player: player,
                card: card,
                hand: player.hand
            }));
        }
    });

    return gameState;
}

/**
 * Checks and handles state-based actions
 * @param {GameState} gameState - Current game state
 */
export function checkStateBasedActions(gameState) {
    // TODO: Implement state-based action checks
    // - Check for knocked out Pokemon
    // - Handle 'would be knocked out' effects
    // - Handle 'is knocked out' effects
    // - Check for no active Pokemon
}

/**
 * Gets all legal moves in the current game state
 * @param {GameState} gameState - Current game state
 */
export function getLegalMoves(gameState) {
    // TODO: Implement legal move determination
    // - Check all possible moves based on game state
    // - Consider all effects on players and Pokemon
}
