import { checkStateBasedActions } from "./check_statebased_actions.js";
import { GameEvent, GameEventType, GameEventData } from "./event_models.js";
import { InputRequestEvent, InputType, SelectReason } from "./input_event_models.js";
import { drawCard, shuffleDeck, drawInitialHand, playPokemonCard } from "./game_actions.js";
import { Phase, ZoneName } from "./enums.js";
import { getLegalInputs } from "./get_legal_inputs.js";

/**
 * Creates a game engine generator that manages game flow and state transitions
 * @param {GameState} gameState - The current game state
 * @param {EventHandler} eventHandler - Handler for game events
 */
export function* rulesEngineGenerator(gameState, eventHandler) {
    // GameState starts in DEAL_CARDS phase
    // First shuffle decks
    [0, 1].forEach(playerIndex => {
        shuffleDeck(gameState, playerIndex, eventHandler);
    });
    
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
    gameState.currentPlayerIndex = coinFlip ? 0 : 1;
    
    // Notify about coin flip and turn order
    eventHandler.push(new GameEvent({
        type: GameEventType.FLIP_COINS,
        data: new GameEventData({
            flips: [coinFlip]
        })
    }));
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_ORDER,
        data: new GameEventData({ playerIndex: gameState.currentPlayerIndex })
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
        const legalInputs = getLegalInputs(gameState);
        const input = yield {
            state: gameState,
            legalInputs: legalInputs
        };

        if (input.inputType === InputType.CARD_MOVE) {
            playPokemonCard(gameState, input.playerIndex, input.data.handIndex, input.data.targetZone, eventHandler);
            activePokemonPlaced.add(input.playerIndex);
        }
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
        const legalInputs = getLegalInputs(gameState);
        const input = yield {
            state: gameState,
            legalInputs: legalInputs
        };

        if (input.inputType === InputType.START_BATTLE) {
            benchSetupComplete.add(input.playerIndex);
            gameState.players[input.playerIndex].setupComplete = true;
        } else if (input.inputType === InputType.CARD_MOVE) {
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
            data: new GameEventData({ playerIndex: gameState.currentPlayerIndex })
        }));

        // Main phase - keep accepting inputs until player passes or game ends
        while (gameState.phase === Phase.MAIN) {
            const legalInputs = getLegalInputs(gameState);
            const input = yield {
                state: gameState,
                legalInputs: legalInputs
            };

            // For now only handle passing turn, other inputs will be implemented later
            if (input.inputType === InputType.PASS_TURN) {
                gameState.phase = Phase.BETWEEN_TURNS;
                eventHandler.push(new GameEvent({
                    type: GameEventType.PHASE_CHANGE,
                    data: new GameEventData({ phase: gameState.phase })
                }));
            }
            else if (input.inputType === InputType.ATTACK) {
                // get legal inputs has already determined this is a valid attack!
                attack_index = input.attack_index
                target_index = input.target_index
                activepoke = gameState.players[gameState.currentPlayerIndex].getPokemonInZone(ZoneName.ACTIVE)
                attack = activepoke.attacks[attack_index]
                for (const effect of attack.effects) {
                    const effect_result = applyEffect(gameState, effect, gameState.currentPlayerIndex, target_index, eventHandler);
                }
                //check statebased actions
                checkStateBasedActions(gameState, eventHandler);
                // switch phases
                gameState.phase = Phase.BETWEEN_TURNS;
                eventHandler.push(new GameEvent({
                    type: GameEventType.PHASE_CHANGE,
                    data: new GameEventData({ phase: gameState.phase })
                }));
            }
            checkStateBasedActions(gameState, eventHandler);
        }

        // Switch players
        gameState.currentPlayerIndex = 1 - gameState.currentPlayerIndex;
    }

    // Game over
    eventHandler.push(new GameEvent({
        type: GameEventType.GAME_END,
        data: new GameEventData({ winner: gameState.winner })
    }));
}
