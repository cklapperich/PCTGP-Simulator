import { EventType } from './enums.js';
import { Event } from './models.js';
import { outputQueue, checkStateBasedActions } from './gameLoop.js';

/**
 * End the current turn and start the next one
 * @param {GameState} gameState - Current game state
 */
export function endTurn(gameState) {
    const currentPlayer = gameState.getCurrentPlayer();
    const nextPlayer = gameState.getOpponentPlayer();

    // Emit turn end event
    const endEvent = new Event(EventType.TURN_END, {
        player: currentPlayer,
        turn: gameState.turn
    });
    outputQueue.put(endEvent);
    //effectRegistry.handleEvent(endEvent);

    // Switch current player
    gameState.currentPlayer = 1 - gameState.currentPlayer;
    gameState.turn++;

    // Reset turn-based flags
    nextPlayer.canAttachEnergy = true;
    nextPlayer.canAttack = true;

    // Emit turn start event
    const startEvent = new Event(EventType.TURN_START, {
        player: nextPlayer,
        turn: gameState.turn
    });
    outputQueue.put(startEvent);
    // effectRegistry.handleEvent(startEvent);

    // Check state-based actions after turn change
    // (Some effects might have ended during turn transition)
    checkStateBasedActions(gameState);
}

/**
 * Start the first turn of the game
 * @param {GameState} gameState - Current game state
 */
export function startFirstTurn(gameState) {
    const firstPlayer = gameState.getCurrentPlayer();
    
    // Enable actions for first player
    firstPlayer.canAttachEnergy = true;
    firstPlayer.canAttack = true;

    // Emit turn start event
    const startEvent = new Event(EventType.TURN_START, {
        player: firstPlayer,
        turn: gameState.turn
    });
    outputQueue.put(startEvent);
    //effectRegistry.handleEvent(startEvent);
}

/**
 * Check if any end-of-turn triggered abilities should activate
 * @param {GameState} gameState - Current game state
 */
export function checkEndOfTurnTriggers(gameState) {
    const currentPlayer = gameState.getCurrentPlayer();
    
    // Check active Pokemon
    if (currentPlayer.active?.ability) {
        // TODO: Check if ability has end of turn trigger
    }

    // Check bench Pokemon
    Object.values(currentPlayer.bench).forEach(pokemon => {
        if (pokemon.ability) {
            // TODO: Check if ability has end of turn trigger
        }
    });

    // // Let effects handle any end of turn triggers
    // const triggerEvent = new Event(EventType.PHASE_CHANGE, {
    //     phase: "END_OF_TURN_TRIGGERS",
    //     player: currentPlayer
    // });
    //effectRegistry.handleEvent(triggerEvent);
}
