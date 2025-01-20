import { checkStateBasedActions } from "./check_statebased_actions";
import { GameEvent, GameEventType, GameEventData } from "./event_models";
import { InputRequestEvent, InputType, SelectReason } from "./input_event_models";
import { drawCard, shuffle_deck, drawInitialHand, playPokemonCard } from "./game_actions";
import { Phase, ZoneName } from "./enums";
import { getLegalInputs } from "./get_legal_inputs";

/**
 * Creates a game engine generator that manages game flow and state transitions
 * @param {GameState} gameState - The current game state
 * @param {EventHandler} eventHandler - Handler for game events
 */
export function* createGameEngine(gameState, eventHandler) {
    // Shuffle decks
    [0, 1].forEach(playerIndex => {
        shuffle_deck(gameState, playerIndex, eventHandler);
    });

    // Initial setup phase
    gameState.phase = Phase.SETUP;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: new GameEventData({ phase: gameState.phase })
    }));
    
    // Deal initial hands
    [0, 1].forEach(playerIndex => {
        drawInitialHand(gameState, playerIndex, eventHandler);
    });

    // Determine turn order
    gameState.phase = Phase.TURN_ORDER;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: new GameEventData({ phase: gameState.phase })
    }));
    
    // Flip coin to determine first player
    const coinFlip = Math.random() < 0.5;
    gameState.currentPlayer = coinFlip ? 0 : 1;
    
    // Notify about coin flip and turn order
    eventHandler.push(new GameEvent({
        type: GameEventType.FLIP_COINS,
        data: new GameEventData({
            flips: [coinFlip]
        })
    }));
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_ORDER,
        data: new GameEventData({ playerIndex: gameState.currentPlayer })
    }));

    // Active Pokemon Setup Phase
    gameState.phase = Phase.SETUP_PLACE_ACTIVE;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: new GameEventData({ phase: gameState.phase })
    }));
    
    // Wait for both players to place their active Pokemon
    const activePokemonPlaced = new Set();
    while (activePokemonPlaced.size < 2) {
        const input = yield new InputRequestEvent({
            legalMoves: getLegalInputs(gameState),
            reason: SelectReason.SETUP_ACTIVE
        });

        playPokemonCard(gameState, input.playerIndex, input.data.handIndex, ZoneName.ACTIVE, eventHandler);
        activePokemonPlaced.add(input.playerIndex);
    }
    
    // Bench Setup Phase
    gameState.phase = Phase.SETUP_PLACE_BENCH;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: new GameEventData({ phase: gameState.phase })
    }));

    // Wait for both players to complete bench setup
    const benchSetupComplete = new Set();
    while (benchSetupComplete.size < 2) {
        const input = yield new InputRequestEvent({
            legalMoves: getLegalInputs(gameState),
            reason: SelectReason.SETUP_BENCH
        });

        if (input.type === InputType.START_BATTLE) {
            benchSetupComplete.add(input.playerIndex);
            gameState.players[input.playerIndex].setupComplete = true;
        } else if (input.type === InputType.CARD_MOVE) {
            playPokemonCard(gameState, input.playerIndex, input.data.handIndex, input.data.targetZone, eventHandler);
        }
    }

    // Transition to main phase
    gameState.phase = Phase.MAIN;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: new GameEventData({ phase: gameState.phase })
    }));

    // Main game loop
    while (!gameState.gameOver) {
        eventHandler.push(new GameEvent({
            type: GameEventType.TURN_START,
            data: new GameEventData({ playerIndex: gameState.currentPlayer })
        }));

        // Main phase - keep accepting moves until player passes or game ends
        while (gameState.phase === Phase.MAIN) {
            const input = yield new InputRequestEvent({
                legalMoves: getLegalInputs(gameState),
                reason: SelectReason.NOT_SPECIFIED
            });

            // For now only handle passing turn, other inputs will be implemented later
            if (input.type === InputType.PASS_TURN) {
                gameState.phase = Phase.BETWEEN_TURNS;
                eventHandler.push(new GameEvent({
                    type: GameEventType.PHASE_CHANGE,
                    data: new GameEventData({ phase: gameState.phase })
                }));
            }
            
            checkStateBasedActions(gameState, eventHandler);
        }

        // Switch players
        gameState.currentPlayer = 1 - gameState.currentPlayer;
    }

    // Game over
    eventHandler.push(new GameEvent({
        type: GameEventType.GAME_END,
        data: new GameEventData({ winner: gameState.winner })
    }));
}
