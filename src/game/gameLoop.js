import { EventType, Phase, MoveType} from './enums.js';
import { Event, PlayerState } from './models.js';
import { startFirstTurn, endTurn, checkEndOfTurnTriggers } from './turns.js';
import { drawCard, discardPokemon } from './cardActions.js';

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

    // Clear any existing effects
    //effectRegistry.effects.clear();

    // Disable initial actions for both players
    Object.values(gameState.players).forEach(player => {
        player.canAttachEnergy = false;
        player.canAttack = false;
    });

    // Initial coin flip phase
    gameState.phase = Phase.INITIAL_COIN_FLIP;
    const phaseEvent = new Event(EventType.PHASE_CHANGE, {
        phase: Phase.INITIAL_COIN_FLIP
    });
    outputQueue.put(phaseEvent);
    //effectRegistry.handleEvent(phaseEvent);

    // Perform initial coin flip
    const flip = flipCoins(1);
    gameState.currentPlayer = flip[0] ? 0 : 1;
    const flipEvent = new Event(EventType.FLIP_COINS, {
        flip: flip
    });
    outputQueue.put(flipEvent);
    //effectRegistry.handleEvent(flipEvent);

    // Setup phase
    gameState.phase = Phase.SETUP;
    const setupEvent = new Event(EventType.PHASE_CHANGE, {
        phase: Phase.SETUP,
        firstPlayer: gameState.players[gameState.currentPlayer]
    });
    outputQueue.put(setupEvent);
    //effectRegistry.handleEvent(setupEvent);

    // Shuffle decks and draw initial hands
    Object.values(gameState.players).forEach(player => {
        // Shuffle deck
        player.deck.shuffle();
        const shuffleEvent = new Event(EventType.SHUFFLE, {
            player: player
        });
        outputQueue.put(shuffleEvent);
        //effectRegistry.handleEvent(shuffleEvent);

        // Draw 7 cards
        for (let i = 0; i < 7; i++) {
            drawCard(player);
        }
    });

    // Start first turn
    startFirstTurn(gameState);
    return gameState;
}

/**
 * Checks and handles state-based actions
 * @param {GameState} gameState - Current game state
 */
export function checkStateBasedActions(gameState) {
    const currentPlayer = gameState.getCurrentPlayer();
    const opponentPlayer = gameState.getOpponentPlayer();

    // Check active Pokemon knockouts
    [currentPlayer, opponentPlayer].forEach(player => {
        if (player.active && player.active.isKnockedOut()) {
            // Emit knockout event
            outputQueue.put(new Event(EventType.KNOCKOUT, {
                pokemon: player.active,
                player: player
            }));
            // effectRegistry.handleEvent(new Event(EventType.KNOCKOUT, {
            //     pokemon: player.active,
            //     player: player
            // }));

            const otherPlayer = player === currentPlayer ? opponentPlayer : currentPlayer;
            // Move knocked out Pokemon to discard pile and award point
            discardPokemon(player.active, player, otherPlayer);
            player.active = null;
        }
    });

    // Check bench Pokemon knockouts
    [currentPlayer, opponentPlayer].forEach(player => {
        Object.entries(player.bench).forEach(([index, pokemon]) => {
            if (pokemon.isKnockedOut()) {
                // Emit knockout event
                outputQueue.put(new Event(EventType.KNOCKOUT, {
                    pokemon: pokemon,
                    player: player,
                    benchIndex: index
                }));
                // effectRegistry.handleEvent(new Event(EventType.KNOCKOUT, {
                //     pokemon: pokemon,
                //     player: player,
                //     benchIndex: index
                // }));

                const otherPlayer = player === currentPlayer ? opponentPlayer : currentPlayer;
                // Move knocked out Pokemon to discard pile and award point
                discardPokemon(pokemon, player, otherPlayer);
                delete player.bench[index];
            }
        });
    });

    // Check for no active Pokemon
    [currentPlayer, opponentPlayer].forEach(player => {
        if (!player.active) {
            // If there are Pokemon on the bench, prompt to select one
            const benchPokemon = Object.values(player.bench);
            if (benchPokemon.length > 0) {
                const selectEvent = new Event(EventType.WAIT_FOR_INPUT, {
                    player: player,
                    type: "select_active",
                    options: benchPokemon
                });
                outputQueue.put(selectEvent);
                //effectRegistry.handleEvent(selectEvent);
            } else {
                // No Pokemon left - game over
                const gameEndEvent = new Event(EventType.GAME_END, {
                    winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                    reason: "no_pokemon"
                });
                outputQueue.put(gameEndEvent);
                //effectRegistry.handleEvent(gameEndEvent);
            }
        }
    });

    // Check win conditions
    [currentPlayer, opponentPlayer].forEach(player => {
        if (player.points >= 3) {
            const gameEndEvent = new Event(EventType.GAME_END, {
                winner: player,
                reason: "knockouts"
            });
            outputQueue.put(gameEndEvent);
            //effectRegistry.handleEvent(gameEndEvent);
        }

        // we need to make sure this ONLY happens at the start of the turn
        // Win by deck out (opponent can't draw)
        if (player.deck.cards.length === 0) {
            const gameEndEvent = new Event(EventType.GAME_END, {
                winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                reason: "deck_out"
            });
            outputQueue.put(gameEndEvent);
            //effectRegistry.handleEvent(gameEndEvent);
        }
    });
}

/**
 * Process end of turn and switch to next player
 * @param {GameState} gameState - Current game state
 */
export function processTurnEnd(gameState) {
    
    // Check for end of turn triggers before ending turn
    checkEndOfTurnTriggers(gameState);
    
    // End current turn and start next one
    endTurn(gameState);
}

/**
 * Gets all legal moves in the current game state
 * @param {GameState} gameState - Current game state
 * @returns {Move[]} Array of legal moves
 */
export function getLegalMoves(gameState) {
    const moves = [];
    const currentPlayer = gameState.getCurrentPlayer();

    // Concede is always a legal move
    moves.push(new Move(MoveType.CONCEDE));

    // Playing cards from hand
    currentPlayer.hand.forEach((card, index) => {
        // TODO: CHECK IF CARD CAN ACTUALLY BE PLAYED: EVOLUTION RULES, EMPTY BENCH SLOT, ETC.
        // for basics you need an empty bench slot
        // for evolutions you need a matching basic on the bench and can_evolve=True
        // TODO: need to update can_evolve at the start of each turn
        // Can always attempt to play a card
        moves.push(new Move(MoveType.PLAY_CARD, {
            card: card,
            handIndex: index
        }));
    });

    // Active Pokemon attacks
    if (currentPlayer.active && currentPlayer.canAttack) {
        currentPlayer.active.attacks.forEach((attack, index) => {
            //if (attack.canUse(currentPlayer.active, effectRegistry)) {
                moves.push(new Move(MoveType.ATTACK, {
                    attackIndex: index,
                    attack: attack
                }));
            //}
        });
    }

    // Retreat
    if (currentPlayer.active){
        // Can only retreat if we have a bench Pokemon to switch to
        if (Object.keys(currentPlayer.bench).length > 0) {
            // Check if any effects prevent retreat
            let canRetreat = true;
            // effectRegistry.effects.forEach(effect => {
            //     if (effect.isActive && effect.preventsRetreat?.(currentPlayer.active)) {
            //         canRetreat = false;
            //     }
            // });

            if (canRetreat) {
                moves.push(new Move(MoveType.RETREAT));
            }
        }
    }

    // Attach energy from energy zone
    if (currentPlayer.canAttachEnergy) {
        // TODO
        // assign the players current and next energy zone
        // assign each deck an 'energy types' array
        // each turn, if the energy zone is empty, move the next energy into current energy zone, then randomly generate a new energy from the list of types for the next energy
        // then, if the zone has energy, attaching an energy is legal
        // when you attach an energy ,remove an energy from the current zone
        // the current and next need to be updated at the start of each turn as necessary.

        // EnergyZone.BASIC_ENERGY.forEach(energyType => {
        //     // Can attach to active
        //     if (currentPlayer.active) {
        //         moves.push(new Move(MoveType.ATTACH_ENERGY, {
        //             energyType: energyType,
        //             target: 'active'
        //         }));
        //     }
        //     // Can attach to any bench pokemon
        //     Object.keys(currentPlayer.bench).forEach(benchIndex => {
        //         moves.push(new Move(MoveType.ATTACH_ENERGY, {
        //             energyType: energyType,
        //             target: 'bench',
        //             benchIndex: parseInt(benchIndex)
        //         }));
        //     });
        // });
    }

    return moves;
}
