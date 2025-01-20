import { EventType, Phase, MoveType, InputType } from './enums.js';
import { Event, PlayerState, GameState, Move } from './models.js';
import { drawCard, startMainPhase } from './game_actions.js';
import { UIoutputBus, RequestInputBus, inputBus } from './old_events.js';

export class RulesEngine {
    constructor() {
        this.gameState = null;
        this.inputBus = null;
        this.outputBus = null;
        this.players = {};
    }

    /**
     * Initialize the rules engine with input/output event buses
     */
    initialize() {
        // Set up message buses
        this.inputBus = inputBus;
        this.outputBus = UIoutputBus;
        this.requestInputBus = RequestInputBus;
        this.input_subscription = this.inputBus.subscribe()
        
        // Initialize empty game state
        this.gameState = new GameState();
    }

    /**
     * Main processing loop that handles incoming events
     */
    async run() {
        // Keep running until game ends
        while (this.gameState.phase !== Phase.GAME_END) {
            const input = await this.inputBus.waitForNext();
            await this.handlePlayerMove(input);
        }
    }

    /**
     * Flips coins and returns array of boolean results
     * @param {number} n - Number of coins to flip
     * @returns {boolean[]} Array of coin flip results (true = heads, false = tails)
     */
    flipCoins(n) {
        return Array(n).fill().map(() => Math.random() < 0.5);
    }

    /**
     * Initializes and starts a new game
     * @param {PlayerState} player1 - First player
     * @param {PlayerState} player2 - Second player
     */
    startGame(player1, player2) {
        // Store players
        this.players[0] = player1;
        this.players[1] = player2;

        // Initialize game state
        this.gameState.turn = 0;
        this.gameState.players = this.players;

        // Disable initial actions for both players
        Object.values(this.gameState.players).forEach(player => {
            player.canAttachEnergy = false;
            player.canAttack = false;
        });

        // Initial coin flip phase
        this.gameState.phase = Phase.INITIAL_COIN_FLIP;
        this.outputBus.put(new Event(EventType.PHASE_CHANGE, {
            phase: Phase.INITIAL_COIN_FLIP
        }));

        // Perform initial coin flip
        const flip = this.flipCoins(1);
        this.gameState.currentPlayer = flip[0] ? 0 : 1;
        this.outputBus.put(new Event(EventType.FLIP_COINS, {
            flip: flip
        }));

        // Start with placing active Pokemon
        this.gameState.phase = Phase.SETUP_PLACE_ACTIVE;
        this.outputBus.put(new Event(EventType.PHASE_CHANGE, {
            phase: Phase.SETUP_PLACE_ACTIVE,
            firstPlayer: this.gameState.players[this.gameState.currentPlayer]
        }));

        // Shuffle decks and draw initial hands
        Object.values(this.gameState.players).forEach(player => {
            // Shuffle deck
            player.deck.shuffle();
            this.outputBus.put(new Event(EventType.SHUFFLE, {
                player: player
            }));

            // Draw 7 cards
            for (let i = 0; i < 7; i++) {
                drawCard(player);
            }
            //TODO: handle mulligan and redraw in case no basics are drawn
        });
    }

    /**
     * Handle a move made by a player
     * @param {Move} move - Move to handle
     */
    async handlePlayerMove(move) {
        const player = this.gameState.getCurrentPlayer();

        // Validate move is legal
        const legalMoves = this.getLegalMoves();
        const isLegal = legalMoves.some(legalMove => 
            legalMove.type === move.type && 
            JSON.stringify(legalMove.data) === JSON.stringify(move.data)
        );

        if (!isLegal) {
            this.outputBus.put(new Event(EventType.INVALID_MOVE, {
                move: move,
                reason: "Move is not legal in current game state"
            }));
            return;
        }

        switch (move.type) {
            case MoveType.PLAY_HAND_CARD:
                await this.playHandCard(move.data.cardIndex, move.data.targetZone);
                break;
                
            case MoveType.START_BATTLE:
                await this.startNextTurn();
                break;
                
            case MoveType.PASS_TURN:
                await this.startNextTurn();
                break;

            case MoveType.ATTACK:
                const attack = player.active.attacks[move.data.attackIndex];
                await this.processAttack(attack);
                player.canAttack = false;
                await this.endTurn();
                break;

            case MoveType.RETREAT:
                if (player.active && Object.keys(player.bench).length > 0) {
                    // TODO: Handle retreat cost and switching Pokemon
                }
                break;

            case MoveType.ATTACH_ENERGY:
                if (player.canAttachEnergy && player.currentEnergyZone) {
                    // TODO: Handle energy attachment
                    player.canAttachEnergy = false;
                }
                break;

            case MoveType.CONCEDE:
                this.outputBus.put(new Event(EventType.GAME_END, {
                    winner: this.gameState.getOpponentPlayer(),
                    reason: "concede"
                }));
                this.gameState.phase = Phase.GAME_END;
                break;
        }
    }

    /**
     * Get list of legal moves in current game state
     * @returns {Move[]} Array of legal moves
     */
    getLegalMoves() {
        // TODO: Implement get legal moves logic
        return [];
    }

    /**
     * Process playing a card from hand
     * @param {number} cardIndex - Index of card in hand
     * @param {string} targetZone - Zone to play card to
     */
    async playHandCard(cardIndex, targetZone) {
        // TODO: Implement play hand card logic
    }

    /**
     * Start the next turn
     */
    async startNextTurn() {
        // TODO: Implement start next turn logic
    }

    /**
     * Process an attack
     * @param {Attack} attack - Attack to process
     */
    async processAttack(attack) {
        // TODO: Implement process attack logic
    }

    /**
     * End the current turn
     */
    async endTurn() {
        // TODO: Implement end turn logic
    }

    /**
     * Request input from one or more players and wait for their responses
     * @param {PlayerState[]} players - Players to request input from
     * @param {string} inputType - Type of input being requested
     * @param {Object} options - Additional options for the input request
     * @param {Move[]} legalMoves - Array of legal moves the players can make
     * @returns {Promise<Object[]>} Promise that resolves with array of player responses
     */
    async requestInput(players, inputType, options = {}, legalMoves = []) {
        // Push input request event for each player
        players.forEach(player => {
            const inputEvent = new Event(EventType.WAIT_FOR_INPUT, {
                player: player,
                inputType: inputType,
                options: options,
                legalMoves: legalMoves,
                waitingFor: players // Track which players we need responses from
            });
            this.requestInputBus.put(inputEvent);
        });

        // Wait for responses from all players
        const responses = [];
        const pendingPlayers = new Set(players);

        while (pendingPlayers.size > 0) {
            // Wait for next input
            const response = await this.input_subscription.get();
            
            // If this response is from a player we're waiting for
            if (pendingPlayers.has(response.player)) {
                responses.push(response);
                pendingPlayers.delete(response.player);
            }
        }

        return responses;
    }
}
