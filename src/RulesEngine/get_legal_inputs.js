import { Phase, ZoneName, Stage } from './enums.js';
import { Card } from './models.js';
import { PlayerInput, InputData, InputType } from './input_event_models.js';

const BENCH_ZONES = [ZoneName.BENCH_0, ZoneName.BENCH_1, ZoneName.BENCH_2];

/**
 * Gets all legal bench placement inputs for placing a basic Pokemon from hand
 * @param {Card} card - Card to check for placement
 * @param {number} handIndex - Index of card in hand
 * @param {PlayerState} player - Player attempting placement
 * @param {number} playerIndex - Index of player attempting placement
 * @returns {PlayerInput[]} Array of legal inputs for placing the card
 */
function getLegalBenchPlacements(card, handIndex, player, playerIndex) {
    const inputs = [];
    if (!(card instanceof Card) || card.stage !== Stage.BASIC) {
        return inputs;
    }

    // Check each bench zone for emptiness
    BENCH_ZONES.forEach(zoneName => {
        const zone = player.getZone(zoneName);
        if (!zone.getPokemon()) {
            inputs.push(new PlayerInput({
                data: new InputData({
                    handIndex: handIndex,
                    sourceZone: ZoneName.HAND,
                    targetZone: zoneName
                }),
                playerIndex: playerIndex,
                inputType: InputType.CARD_MOVE
            }));
        }
    });

    return inputs;
}

/**
 * Gets all legal inputs in the current game state
 * @param {GameState} gameState - Current game state
 * @returns {PlayerInput[]} Array of legal inputs
 */
export function getLegalInputs(gameState) {
    const inputs = [];
    const currentPlayerIndex = gameState.currentPlayerIndex;
    const currentPlayer = gameState.players[currentPlayerIndex];

    // Concede is always a legal input for both players
    [0, 1].forEach(playerIndex => {
        inputs.push(new PlayerInput({
            data: new InputData(),
            playerIndex: playerIndex,
            inputType: InputType.CONCEDE
        }));
    });

    switch (gameState.phase) {
        case Phase.SETUP_PLACE_ACTIVE:
            // During setup active placement, BOTH players can choose any basic Pokemon from hand
            [0, 1].forEach(playerIndex => {
                const player = gameState.players[playerIndex];
                const handZone = player.getZone(ZoneName.HAND);
                handZone.cards.forEach((card, index) => {
                    if (card instanceof Card && card.stage === Stage.BASIC) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                handIndex: index,
                                sourceZone: ZoneName.HAND,
                                targetZone: ZoneName.ACTIVE
                            }),
                            playerIndex: playerIndex,
                            inputType: InputType.CARD_MOVE
                        }));
                    }
                });
            });
            break;

        case Phase.SETUP_PLACE_BENCH:
            // During setup bench placement, BOTH players can choose basic Pokemon from hand (up to 3)
            [0, 1].forEach(playerIndex => {
                const player = gameState.players[playerIndex];
                const handZone = player.getZone(ZoneName.HAND);
                handZone.cards.forEach((card, index) => {
                    if (card instanceof Card && card.stage === Stage.BASIC) {
                        inputs.push(...getLegalBenchPlacements(card, index, player, playerIndex));
                    }
                });
                // Each player can pass to end bench placement early
                inputs.push(new PlayerInput({
                    data: new InputData(),
                    playerIndex: playerIndex,
                    inputType: InputType.START_BATTLE
                }));
            });
            break;

        case Phase.MAIN:
            // Normal gameplay - current player can select any card from hand
            const handZone = currentPlayer.getZone(ZoneName.HAND);
            handZone.cards.forEach((card, index) => {
                inputs.push(new PlayerInput({
                    data: new InputData({
                        handIndex: index,
                        sourceZone: ZoneName.HAND
                    }),
                    playerIndex: currentPlayerIndex,
                    inputType: InputType.SELECT_HAND
                }));
            });

            // Can select active Pokemon for evolution or energy attachment
            const activeZone = currentPlayer.getZone(ZoneName.ACTIVE);
            const activePokemon = activeZone.getPokemon();
            if (activePokemon) {
                // Evolution input
                if (activePokemon.can_evolve) {
                    inputs.push(new PlayerInput({
                        data: new InputData({
                            sourceZone: ZoneName.ACTIVE
                        }),
                        playerIndex: currentPlayerIndex,
                        inputType: InputType.SELECT_ACTIVE
                    }));
                }
                // Energy attachment input
                if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                    inputs.push(new PlayerInput({
                        data: new InputData({
                            sourceZone: ZoneName.ACTIVE
                        }),
                        playerIndex: currentPlayerIndex,
                        inputType: InputType.SELECT_ACTIVE
                    }));
                }
            }

            // Can select bench Pokemon for evolution or energy attachment
            BENCH_ZONES.forEach((zoneName, benchIndex) => {
                const benchZone = currentPlayer.getZone(zoneName);
                const pokemon = benchZone.getPokemon();
                if (pokemon) {
                    // Evolution input
                    if (pokemon.can_evolve) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                handIndex: benchIndex,
                                sourceZone: zoneName
                            }),
                            playerIndex: currentPlayerIndex,
                            inputType: InputType.SELECT_BENCH
                        }));
                    }
                    // Energy attachment input
                    if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                handIndex: benchIndex,
                                sourceZone: zoneName
                            }),
                            playerIndex: currentPlayerIndex,
                            inputType: InputType.SELECT_BENCH
                        }));
                    }
                }
            });

            // Can pass turn during normal gameplay
            inputs.push(new PlayerInput({
                data: new InputData(),
                playerIndex: currentPlayerIndex,
                inputType: InputType.PASS_TURN
            }));
            break;
    }

    return inputs;
}
