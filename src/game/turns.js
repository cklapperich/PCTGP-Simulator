import { EventType, Type, Phase } from './enums.js';
import { Event } from './models.js';
import { outputQueue, checkStateBasedActions, flipCoins } from './gameLoop.js';

/**
 * Update a player's energy zones
 * @param {PlayerState} player - Player whose energy zones to update
 * @param {number} turn - Current turn number
 */
function updateEnergyZones(player, turn) {
    // Turn 1: Players only get a next energy, no current energy
    if (turn === 1) {
        // Only generate next energy if we don't have one
        if (!player.nextEnergyZone && player.deck.energyTypes.length > 0) {
            const randomIndex = Math.floor(Math.random() * player.deck.energyTypes.length);
            player.nextEnergyZone = player.deck.energyTypes[randomIndex];
        }
        // Ensure no current energy on turn 1
        player.currentEnergyZone = null;
        return;
    }
    
    // Turn 2+: Rotate next to current, generate new next
    if (turn >= 2) {
        // Move next to current if we don't have a current
        if (!player.currentEnergyZone && player.nextEnergyZone) {
            player.currentEnergyZone = player.nextEnergyZone;
            player.nextEnergyZone = null;
        }
        
        // Generate new next if empty
        if (!player.nextEnergyZone && player.deck.energyTypes.length > 0) {
            const randomIndex = Math.floor(Math.random() * player.deck.energyTypes.length);
            player.nextEnergyZone = player.deck.energyTypes[randomIndex];
        }
    }
}

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

    // Reset turn-based flags, update energy zones, and set evolution permissions
    nextPlayer.canAttachEnergy = true;
    nextPlayer.canAttack = true;
    updateEnergyZones(nextPlayer, gameState.turn);

    // Allow evolution for any existing Pokemon (if any)
    if (nextPlayer.active) {
        nextPlayer.active.can_evolve = true;
    }
    Object.values(nextPlayer.bench).forEach(pokemon => {
        pokemon.can_evolve = true;
    });

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
 * Start the first turn of the game after setup is complete
 * @param {GameState} gameState - Current game state
 */
export function startFirstTurn(gameState) {
    const firstPlayer = gameState.getCurrentPlayer();
    
    // Initialize energy zones for both players - only next energy on turn 1
    updateEnergyZones(firstPlayer, 1);
    updateEnergyZones(gameState.getOpponentPlayer(), 1);

    // Start in setup phase - players must place active Pokemon first
    gameState.phase = Phase.SETUP_PLACE_ACTIVE;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: Phase.SETUP_PLACE_ACTIVE,
        firstPlayer: firstPlayer
    }));
}

/**
 * Switch to the next player during setup
 * @param {GameState} gameState - Current game state
 */
export function switchSetupPlayer(gameState) {
    gameState.currentPlayer = 1 - gameState.currentPlayer;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: gameState.phase,
        player: gameState.getCurrentPlayer()
    }));
}

/**
 * Transition from active placement to bench placement during setup
 * @param {GameState} gameState - Current game state
 */
export function startBenchPlacement(gameState) {
    gameState.phase = Phase.SETUP_PLACE_BENCH;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: Phase.SETUP_PLACE_BENCH,
        player: gameState.getCurrentPlayer()
    }));
}

/**
 * Start the actual first turn after setup is complete
 * @param {GameState} gameState - Current game state
 */
export function startMainPhase(gameState) {
    const firstPlayer = gameState.getCurrentPlayer();
    
    // Enable actions for first player
    firstPlayer.canAttachEnergy = true;
    firstPlayer.canAttack = true;

    // Change to draw phase to start main gameplay
    gameState.phase = Phase.DRAW;
    outputQueue.put(new Event(EventType.PHASE_CHANGE, {
        phase: Phase.DRAW
    }));

    // Emit turn start event
    const startEvent = new Event(EventType.TURN_START, {
        player: firstPlayer,
        turn: gameState.turn
    });
    outputQueue.put(startEvent);
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
