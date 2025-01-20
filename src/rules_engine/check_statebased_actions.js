import { Phase, ZoneName, GameEventType,BENCH_ZONES } from './enums.js';
import { GameEvent } from './event_models.js';
import { InputRequestEvent, PlayerInput,  SelectReason, InputData } from './input_event_models.js';

/**
 * Checks and handles state-based actions
 * @param {GameState} gameState - Current game state
 * @param {eventHandler} eventHandler - Bus to emit events on
 */
export function checkStateBasedActions(gameState, eventHandler) {
    // Don't check during setup phases
    if (gameState.phase === Phase.SETUP_PLACE_ACTIVE || 
        gameState.phase === Phase.SETUP_PLACE_BENCH) {
        return;
    }

    const currentPlayer = gameState.getCurrentPlayer();
    const opponentPlayer = gameState.getOpponentPlayer();

    // Check active Pokemon knockouts
    [currentPlayer, opponentPlayer].forEach(player => {
        const activeZone = player.getZone(ZoneName.ACTIVE);
        const activePokemon = activeZone.getPokemon();
        
        if (activePokemon && activeZone.isKnockedOut()) {
            // Emit knockout event first
            eventHandler.put(new GameEvent({
                type: GameEventType.KNOCKOUT,
                data: {
                    playerIndex: gameState.players.indexOf(player)
                }
            }));

            // Move to discard and emit card move event
            eventHandler.put(GameEvent.createCardMove({
                card: activePokemon,
                playerIndex: gameState.players.indexOf(player),
                sourceZone: ZoneName.ACTIVE,
                targetZone: ZoneName.DISCARD
            }));

            // Award point to opponent
            const otherPlayer = player === currentPlayer ? opponentPlayer : currentPlayer;
            otherPlayer.points++;

            // Clear active zone
            activeZone.clear();
        }
    });

    // Check bench Pokemon knockouts
    [currentPlayer, opponentPlayer].forEach(player => {
        BENCH_ZONES.forEach(benchZone => {
            const zone = player.getZone(benchZone);
            const pokemon = zone.getPokemon();
            if (pokemon && zone.isKnockedOut()) {
                // Emit knockout event first
                eventHandler.put(new GameEvent({
                    type: GameEventType.KNOCKOUT,
                    data: {
                        playerIndex: gameState.players.indexOf(player),
                        targetZone: benchZone
                    }
                }));

                // Move to discard and emit card move event
                eventHandler.put(GameEvent.createCardMove({
                    card: pokemon,
                    playerIndex: gameState.players.indexOf(player),
                    sourceZone: benchZone,
                    targetZone: ZoneName.DISCARD
                }));

                // Award point to opponent
                const otherPlayer = player === currentPlayer ? opponentPlayer : currentPlayer;
                otherPlayer.points++;

                // Clear bench zone
                zone.clear();
            }
        });
    });

    // Check for no active Pokemon
    [currentPlayer, opponentPlayer].forEach(player => {
        if (!player.getPokemonInZone(ZoneName.ACTIVE)) {
            // Check for Pokemon on bench
            let hasBenchPokemon = false;
            const benchPokemon = [];
            
            BENCH_ZONES.forEach(benchZone => {
                const pokemon = player.getPokemonInZone(benchZone);
                if (pokemon) {
                    hasBenchPokemon = true;
                    benchPokemon.push(pokemon);
                }
            });

            if (hasBenchPokemon) {
                // Create input request for selecting new active
                const inputRequest = new InputRequestEvent({
                    reason: SelectReason.REPLACE_ACTIVE,
                    legalMoves: benchPokemon.map((pokemon, index) => new PlayerInput({
                        data: new InputData({
                            selectedIndex: index,
                            sourceZone: pokemon.zone,
                            targetZone: ZoneName.ACTIVE
                        }),
                        reason: SelectReason.REPLACE_ACTIVE,
                        playerIndex: gameState.players.indexOf(player)
                    }))
                });

                eventHandler.put(new GameEvent({
                    type: GameEventType.INPUT_REQUEST,
                    data: {
                        playerIndex: gameState.players.indexOf(player),
                        inputRequest
                    }
                }));
            } else {
                // Game over - no Pokemon left
                eventHandler.put(new GameEvent({
                    type: GameEventType.GAME_END,
                    data: {
                        winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                        reason: SelectReason.NOT_SPECIFIED
                    }
                }));
            }
        }
    });

    // Check win conditions
    [currentPlayer, opponentPlayer].forEach(player => {
        if (player.points >= 3) {
            eventHandler.put(new GameEvent({
                type: GameEventType.GAME_END,
                data: {
                    winner: player,
                    reason: SelectReason.NOT_SPECIFIED
                }
            }));
        }

        // Check deck out
        if (player.deck.cards.length === 0) {
            eventHandler.put(new GameEvent({
                type: GameEventType.GAME_END,
                data: {
                    winner: player === currentPlayer ? opponentPlayer : currentPlayer,
                    reason: SelectReason.NOT_SPECIFIED
                }
            }));
        }
    });
}
