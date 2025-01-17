import { EventType, Phase, MoveType} from './enums.js';
import { Event, PlayerState, GameState, Move } from './models.js';
import { startFirstTurn, endTurn, checkEndOfTurnTriggers, startBenchPlacement, startMainPhase } from './turns.js';
import { drawCard, discardPokemon } from './cardActions.js';
import { inputQueue, outputQueue} from './events.js';


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

    // Start with placing active Pokemon
    gameState.phase = Phase.SETUP_PLACE_ACTIVE;
    const setupEvent = new Event(EventType.PHASE_CHANGE, {
        phase: Phase.SETUP_PLACE_ACTIVE,
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

        // Draw 5 cards
        for (let i = 0; i < 5; i++) {
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
    // Don't check during setup phases
    if (gameState.phase === Phase.SETUP_PLACE_ACTIVE || 
        gameState.phase === Phase.SETUP_PLACE_BENCH) {
        return;
    }

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
            } else {
                // No Pokemon left - game over
                const gameEndEvent = new Event(EventType.GAME_END, {
                    winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                    reason: "no_pokemon"
                });
                outputQueue.put(gameEndEvent);
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
        }

        // Win by deck out (opponent can't draw)
        if (player.deck.cards.length === 0) {
            const gameEndEvent = new Event(EventType.GAME_END, {
                winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                reason: "deck_out"
            });
            outputQueue.put(gameEndEvent);
        }
    });
}

/**
 * Handle placing a Pokemon from hand during setup
 * @param {GameState} gameState - Current game state
 * @param {number} handIndex - Index of card in hand to place
 * @param {PlayerState} player - Player making the move
 */
function handleSetupPlacement(gameState, handIndex, player) {
    const card = player.hand[handIndex];

    if (gameState.phase === Phase.SETUP_PLACE_ACTIVE) {
        // Place as active Pokemon
        player.active = card;
        player.hand.splice(handIndex, 1);

        // Emit event for placing active Pokemon
        outputQueue.put(new Event(EventType.PHASE_CHANGE, {
            phase: "POKEMON_PLACED",
            player: player,
            pokemon: card,
            location: 'active'
        }));

        // Move to bench placement if both players have placed active
        if (gameState.players[0].active && gameState.players[1].active) {
            startBenchPlacement(gameState);
        }
    }
    else if (gameState.phase === Phase.SETUP_PLACE_BENCH) {
        // Place on bench
        const benchIndex = Object.keys(player.bench).length;
        player.bench[benchIndex] = card;
        player.hand.splice(handIndex, 1);

        // Emit event for placing bench Pokemon
        outputQueue.put(new Event(EventType.PHASE_CHANGE, {
            phase: "POKEMON_PLACED",
            player: player,
            pokemon: card,
            location: 'bench',
            benchIndex: benchIndex
        }));
    }
}

/**
 * Handle placing a basic Pokemon during normal gameplay
 * @param {GameState} gameState - Current game state
 * @param {number} handIndex - Index of card in hand to place
 */
function handlePlaceBasic(gameState, handIndex) {
    const currentPlayer = gameState.getCurrentPlayer();
    const card = currentPlayer.hand[handIndex];

    // Can only place on bench during normal gameplay
    const benchIndex = Object.keys(currentPlayer.bench).length;
    currentPlayer.bench[benchIndex] = card;
    currentPlayer.hand.splice(handIndex, 1);

    // Emit event for placing Pokemon
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: "POKEMON_PLACED",
        player: currentPlayer,
        pokemon: card,
        location: 'bench',
        benchIndex: benchIndex
    }));
}

/**
 * Handle a move made by a player
 * @param {GameState} gameState - Current game state
 * @param {Move} move - Move to handle
 */
export function handleMove(gameState, move) {
    // During setup, use the player specified in the move
    const player = (gameState.phase === Phase.SETUP_PLACE_ACTIVE || 
                   gameState.phase === Phase.SETUP_PLACE_BENCH) && 
                  move.data.player !== undefined ? 
                  gameState.players[move.data.player] : 
                  gameState.getCurrentPlayer();

    switch (move.type) {
        case MoveType.CHOOSE_HAND_CARD:
            if (gameState.phase === Phase.SETUP_PLACE_ACTIVE || 
                gameState.phase === Phase.SETUP_PLACE_BENCH) {
                handleSetupPlacement(gameState, move.data.handIndex, player);
            } else {
                // During normal gameplay, check if it's a basic Pokemon
                const card = player.hand[move.data.handIndex];
                if (card.stage === 'basic' && Object.keys(player.bench).length < 5) {
                    handlePlaceBasic(gameState, move.data.handIndex);
                }
            }   
            break;

        case MoveType.PASS_TURN:
            if (gameState.phase === Phase.SETUP_PLACE_BENCH) {
                player.setupComplete = true;
                // Emit event for passing bench placement
                outputQueue.put(new Event(EventType.PHASE_CHANGE, {
                    phase: "SETUP_COMPLETE",
                    player: player
                }));
                // Move to main phase if both players are done with setup
                if (gameState.players[0].setupComplete && gameState.players[1].setupComplete) {
                    startMainPhase(gameState);
                }
            } else {
                processTurnEnd(gameState);
            }
            break;

        case MoveType.ATTACK:
            if (player.canAttack && player.active) {
                const attack = player.active.attacks[move.data.attackIndex];
                // TODO: Handle attack execution
                processTurnEnd(gameState);
            }
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
            outputQueue.put(new Event(EventType.GAME_END, {
                winner: gameState.getOpponentPlayer(),
                reason: "concede"
            }));
            break;
    }
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

    if (gameState.phase === Phase.SETUP_PLACE_ACTIVE) {
        // During setup active placement, can choose any basic Pokemon from hand
        currentPlayer.hand.forEach((card, index) => {
            if (card.stage === 'basic') {
                moves.push(new Move(MoveType.CHOOSE_HAND_CARD, {
                    handIndex: index,
                    player: currentPlayer === gameState.players[0] ? 0 : 1
                }));
            }
        });
    } 
    else if (gameState.phase === Phase.SETUP_PLACE_BENCH) {
        // During setup bench placement, can choose basic Pokemon from hand (up to 3)
        if (Object.keys(currentPlayer.bench).length < 3) {
            currentPlayer.hand.forEach((card, index) => {
                if (card.stage === 'basic') {
                    moves.push(new Move(MoveType.CHOOSE_HAND_CARD, {
                        handIndex: index,
                        player: currentPlayer === gameState.players[0] ? 0 : 1
                    }));
                }
            });
        }
        // Can pass to end bench placement early
        moves.push(new Move(MoveType.PASS_TURN, {
            player: currentPlayer === gameState.players[0] ? 0 : 1
        }));
    }
    else {
        // Normal gameplay - can select any card from hand
        currentPlayer.hand.forEach((card, index) => {
            moves.push(new Move(MoveType.CHOOSE_HAND_CARD, {
                handIndex: index
            }));
        });

        // Can select any card on field (active or bench)
        if (currentPlayer.active) {
            moves.push(new Move(MoveType.CHOOSE_FIELD_CARD, {
                location: 'active'
            }));
        }
        Object.keys(currentPlayer.bench).forEach(benchIndex => {
            moves.push(new Move(MoveType.CHOOSE_FIELD_CARD, {
                location: 'bench',
                benchIndex: parseInt(benchIndex)
            }));
        });

        // Game actions if conditions are met
        if (currentPlayer.active) {
            // Can retreat if bench has Pokemon
            if (Object.keys(currentPlayer.bench).length > 0) {
                moves.push(new Move(MoveType.RETREAT));
            }

            // Can attack if allowed this turn
            if (currentPlayer.canAttack) {
                currentPlayer.active.attacks.forEach((attack, index) => {
                    moves.push(new Move(MoveType.ATTACK, {
                        attackIndex: index
                    }));
                });
            }
        }

        // Can attach energy if allowed and not first turn
        if (currentPlayer.canAttachEnergy && 
            gameState.turn > 1 && 
            currentPlayer.currentEnergyZone) {
            moves.push(new Move(MoveType.ATTACH_ENERGY));
        }

        // Can pass turn during normal gameplay
        moves.push(new Move(MoveType.PASS_TURN));
    }

    return moves;
}
