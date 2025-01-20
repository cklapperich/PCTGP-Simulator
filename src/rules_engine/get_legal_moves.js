import { SelectReason, Phase, ZoneName, Stage } from './enums.js';
import { Card } from './models.js';
import { PlayerInput, InputData } from './input_event_models.js';

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
                    selectedIndex: handIndex,
                    sourceZone: ZoneName.HAND,
                    targetZone: zoneName
                }),
                reason: SelectReason.SETUP_BENCH,
                playerIndex: playerIndex
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
    const currentPlayer = gameState.getCurrentPlayer();
    const currentPlayerIndex = gameState.currentPlayer;

    // Concede is always a legal input for both players
    inputs.push(new PlayerInput({
        data: new InputData(),
        reason: SelectReason.NOT_SPECIFIED,
        playerIndex: 0
    }));
    inputs.push(new PlayerInput({
        data: new InputData(),
        reason: SelectReason.NOT_SPECIFIED,
        playerIndex: 1
    }));

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
                                selectedIndex: index,
                                sourceZone: ZoneName.HAND,
                                targetZone: ZoneName.ACTIVE
                            }),
                            reason: SelectReason.SETUP_ACTIVE,
                            playerIndex: playerIndex
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
                    reason: SelectReason.NOT_SPECIFIED,
                    playerIndex: playerIndex
                }));
            });
            break;

        case Phase.MAIN:
            // Normal gameplay - current player can select any card from hand
            const handZone = currentPlayer.getZone(ZoneName.HAND);
            handZone.cards.forEach((card, index) => {
                inputs.push(new PlayerInput({
                    data: new InputData({
                        selectedIndex: index,
                        sourceZone: ZoneName.HAND
                    }),
                    reason: SelectReason.PLAY_POKEMON,
                    playerIndex: currentPlayerIndex
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
                        reason: SelectReason.EVOLVE_POKEMON,
                        playerIndex: currentPlayerIndex
                    }));
                }
                // Energy attachment input
                if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                    inputs.push(new PlayerInput({
                        data: new InputData({
                            sourceZone: ZoneName.ACTIVE
                        }),
                        reason: SelectReason.ATTACH_ENERGY,
                        playerIndex: currentPlayerIndex
                    }));
                }
                // Attack inputs
                activePokemon.attacks.forEach((attack, index) => {
                    if (attack.canUse(activePokemon, gameState.effectRegistry)) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                attackIndex: index,
                                attackInfo: attack
                            }),
                            reason: SelectReason.ATTACK_TARGET,
                            playerIndex: currentPlayerIndex
                        }));
                    }
                });
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
                                selectedIndex: benchIndex,
                                sourceZone: zoneName
                            }),
                            reason: SelectReason.EVOLVE_POKEMON,
                            playerIndex: currentPlayerIndex
                        }));
                    }
                    // Energy attachment input
                    if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                selectedIndex: benchIndex,
                                sourceZone: zoneName
                            }),
                            reason: SelectReason.ATTACH_ENERGY,
                            playerIndex: currentPlayerIndex
                        }));
                    }
                }
            });

            // Can retreat if bench has Pokemon and enough energy
            const hasBenchedPokemon = BENCH_ZONES.some(zoneName => {
                const zone = currentPlayer.getZone(zoneName);
                return zone.getPokemon() !== null;
            });
            
            if (hasBenchedPokemon && activePokemon?.canRetreat(gameState.effectRegistry)) {
                inputs.push(new PlayerInput({
                    data: new InputData(),
                    reason: SelectReason.REPLACE_ACTIVE,
                    playerIndex: currentPlayerIndex
                }));
            }

            // Can pass turn during normal gameplay
            inputs.push(new PlayerInput({
                data: new InputData(),
                reason: SelectReason.NOT_SPECIFIED,
                playerIndex: currentPlayerIndex
            }));
            break;
    }

    return inputs;
}
