import { GameEventType, Type, Phase, ZoneName, BENCH_ZONES, Stage, energyZoneLocation } from './enums.js';
import { GameEvent } from './event_models.js';
import { GameState, PlayerState } from './models.js';
import { flipCoins } from './gameLoop.js';
import { checkStateBasedActions } from './check_statebased_actions.js';

/**
 * Draw initial hand of 5 cards, ensuring at least one basic Pokemon by:
 * 1. Finding a random basic Pokemon in deck and adding it to hand
 * 2. Drawing 4 more random cards
 * @param {GameState} state - Current game state
 * @param {number} player_index - Index of player drawing cards
 * @param {eventHandler} eventHandler - Bus to emit events on
 * @returns {Array<Card>} The drawn cards
 */
export function drawInitialHand(state, player_index, eventHandler) {
    const player = state.players[player_index];
    const deck = player.deck;
    
    // Find all basic Pokemon in deck and select one randomly
    const basicPokemonIndices = deck.cards.reduce((indices, card, index) => {
        if (card.stage === Stage.BASIC) {
            indices.push(index);
        }
        return indices;
    }, []);
    
    // Select random basic Pokemon
    const randomBasicIndex = basicPokemonIndices[Math.floor(Math.random() * basicPokemonIndices.length)];
    const basicPokemon = deck.cards[randomBasicIndex];
    
    // Remove it from deck and add to hand
    deck.cards.splice(randomBasicIndex, 1);
    player.addToHand(basicPokemon);

    // Emit event for the basic Pokemon draw
    eventHandler.put(GameEvent.createCardMove({
        card: basicPokemon,
        sourceZone: ZoneName.DECK,
        targetZone: ZoneName.HAND,
        playerIndex: player_index
    }));

    // Draw 4 more cards
    const drawnCards = [basicPokemon];
    for (let i = 0; i < 4; i++) {
        const card = drawCard(state, player_index, eventHandler);
        drawnCards.push(card);
    }

    return drawnCards;
}

export function drawCard(state, player_index, eventHandler) {
    const player = state.players[player_index];
    
    // Draw card using PlayerState zone methods
    const card = player.drawCard();

    // Emit game state event
    eventHandler.put(GameEvent.createCardMove({
        card: card,
        sourceZone: ZoneName.DECK,
        targetZone: ZoneName.HAND,
        playerIndex: player_index
    }));
    return card;
}

export function shuffleDeck(state, player_index, eventHandler) {
    const player = state.players[player_index];
    player.shuffleDeck();
    
    // Emit game state event
    eventHandler.put(new GameEvent({
        type: GameEventType.SHUFFLE_DECK,
        data: {
            playerIndex: player_index,
            sourceZone: ZoneName.DECK
        }
    }));
}

/**
 * Play a Pokemon card from hand to a specific zone
 * @param {GameState} gameState - Current game state
 * @param {number} playerIndex - Index of the player playing the card
 * @param {number} handIndex - Index of the card in the player's hand
 * @param {string} zone - Zone to play the card to (from Zone enum)
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
export function playPokemonCard(gameState, playerIndex, handIndex, targetZoneName, eventHandler) {
    const player = gameState.players[playerIndex];
    
    // Get card from hand zone
    const handZone = player.getZone(ZoneName.HAND);
    const card = handZone.cards[handIndex];

    // Remove from hand using zone methods
    handZone.cards.splice(handIndex, 1);
    
    // Add to target zone using PlayerState method
    player.addCardToZone(card, targetZoneName);

    // Emit game state event
    eventHandler.put(GameEvent.createCardMove({
        card: card,
        sourceZone: ZoneName.HAND,
        targetZone: targetZoneName,
        playerIndex: playerIndex
    }));
}

/**
 * Attach energy from energy zone to a Pokemon
 * @param {GameState} state - Current game state
 * @param {number} playerIndex - Index of the player attaching energy
 * @param {string} targetZoneName - Zone to attach energy to (from ZoneName enum)
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
export function attachEnergyFromEnergyZone(state, playerIndex, targetZoneName, eventHandler) {
    const player = state.players[playerIndex];

    // Get target zone and energy type
    const targetZone = player.getZone(targetZoneName);
    const energyType = player.currentEnergyZone;

    if (!energyType || !player.canAttachEnergy) {
        return false; // No energy type selected or player cannot attach energy
    }
    player.currentEnergyZone = Type.NONE;
    player.canAttachEnergy = false;
    return attachEnergy(state, playerIndex, energyType, targetZoneName, eventHandler);
}

export function attachEnergy(state, playerIndex, energyType, targetZoneName, eventHandler) {
    const player = state.players[playerIndex];
    player.attachEnergyToZone(energyType, targetZoneName);

    // Emit game state event
    eventHandler.put(new GameEvent({
        type: GameEventType.ATTACH_ENERGY,
        data: {
            playerIndex: playerIndex,
            energyType: energyType,
            targetZone: targetZoneName
        }
    }));
    return true;
}

/**
 * Initialize both players' energy zones during setup
 * @param {GameState} gameState - Current game state
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
export function initializeEnergyZones(gameState, eventHandler) {
    [0, 1].forEach(playerIndex => {
        const player = gameState.players[playerIndex];
        const energyTypes = player.deck.getEnergyTypes();
        if (energyTypes.length === 0) return;

        // Set current energy to NONE
        player.currentEnergyZone = Type.NONE;
        eventHandler.put(new GameEvent({
            type: GameEventType.ENERGY_ZONE_UPDATE,
            data: {
                playerIndex: playerIndex,
                zoneType: energyZoneLocation.CURRENT,
                energyType: Type.NONE
            }
        }));

        // Initialize next energy zone with random type
        const randomIndex = Math.floor(Math.random() * energyTypes.length);
        const newNextEnergy = energyTypes[randomIndex];
        player.nextEnergyZone = newNextEnergy;
        eventHandler.put(new GameEvent({
            type: GameEventType.ENERGY_ZONE_UPDATE,
            data: {
                playerIndex: playerIndex,
                zoneType: energyZoneLocation.NEXT,
                energyType: newNextEnergy
            }
        }));
    });
}

/**
 * Update a player's energy zones
 * @param {GameState} gameState - Current game state
 * @param {number} playerIndex - Index of player whose energy zones to update
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
function updateEnergyZones(gameState, playerIndex, eventHandler) {
    const player = gameState.players[playerIndex];
    const energyTypes = player.deck.getEnergyTypes();
    if (energyTypes.length === 0) return;

    // Update current energy
    const newCurrentEnergy = player.nextEnergyZone;
    player.currentEnergyZone = newCurrentEnergy;
    player.nextEnergyZone = null;
    
    // Emit event for current energy update
    eventHandler.put(new GameEvent({
        type: GameEventType.ENERGY_ZONE_UPDATE,
        data: {
            playerIndex: playerIndex,
            zoneType: energyZoneLocation.CURRENT,
            energyType: newCurrentEnergy
        }
    }));

    // Generate and set new next energy
    const randomIndex = Math.floor(Math.random() * energyTypes.length);
    const newNextEnergy = energyTypes[randomIndex];
    player.nextEnergyZone = newNextEnergy;
    
    // Emit event for next energy update
    eventHandler.put(new GameEvent({
        type: GameEventType.ENERGY_ZONE_UPDATE,
        data: {
            playerIndex: playerIndex,
            zoneType: energyZoneLocation.NEXT,
            energyType: newNextEnergy
        }
    }));
}

/**
 * End the current turn and start the next one
 * @param {GameState} gameState - Current game state
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
export function endTurn(gameState, eventHandler) {
    const currentPlayer = gameState.getCurrentPlayer();
    const nextPlayer = gameState.getOpponentPlayer();
    const nextPlayerIndex = 1 - gameState.currentPlayer;

    // Emit turn end event
    eventHandler.put(GameEvent.createTurnEnd({
        playerIndex: gameState.currentPlayer,
        turn: gameState.turn
    }));

    // TODO: BETWEEN TURNS (mostly just handling poison?)
    
    // Switch current player
    gameState.currentPlayer = nextPlayerIndex;
    gameState.turn++;

    // Emit turn start event
    eventHandler.put(GameEvent.createTurnStart({
        playerIndex: nextPlayerIndex,
        turn: gameState.turn
    }));

    // Reset turn-based flags and update energy zones
    nextPlayer.canAttachEnergy = true;
    nextPlayer.canSupporter = true;
    updateEnergyZones(gameState, nextPlayerIndex, eventHandler);

    // Allow evolution for existing Pokemon
    const activePokemon = nextPlayer.getPokemonInZone(ZoneName.ACTIVE);
    if (activePokemon) {
        activePokemon.can_evolve = true;
    }
    
    BENCH_ZONES.forEach(benchZone => {
        const pokemon = nextPlayer.getPokemonInZone(benchZone);
        if (pokemon) {
            pokemon.can_evolve = true;
        }
    });

    // Check state-based actions after turn change
    checkStateBasedActions(gameState, eventHandler);
}

export function startFirstTurn(playerIndex, gameState, eventHandler) {
    gameState.currentPlayer = playerIndex;
    gameState.turn++;
    // Emit turn start event for the first turn
    eventHandler.put(GameEvent.createTurnStart({
        playerIndex: playerIndex,
        turn: gameState.turn
    }));
    // dont update energy zones first turn

    player = gameState.getCurrentPlayer();
    player.canSupporter = true;
}