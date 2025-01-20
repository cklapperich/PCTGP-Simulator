import { SelectReason, Phase, Zone, BENCH_ZONES } from './enums.js';
import { PlayerInput, InputData, Card } from './models.js';

/**
 * Gets all legal bench placement inputs for placing a basic Pokemon from hand
 * @param {Card} card - Card to check for placement
 * @param {number} handIndex - Index of card in hand
 * @param {PlayerState} player - Player attempting placement
 * @param {number} playerIndex - Index of player attempting placement
 * @returns {PlayerInput[]} Array of legal inputs for placing the card
 */
function getLegalBenchPlacements(card, handIndex, player) {
    const inputs = [];
    if (!(card instanceof Card) || card.stage !== 'basic') {
        return inputs;
    }

    // Check each bench zone for emptiness
    BENCH_ZONES.forEach(zone => {
        // Convert zone name (e.g. "bench_0") to index for bench object lookup
        const benchIndex = parseInt(zone.split('_')[1]);
        if (!player.bench[benchIndex]) {
            inputs.push(new PlayerInput({
                data: new InputData({
                    selectedIndex: handIndex,
                    sourceZone: Zone.HAND,
                    targetZone: zone
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
 * @returns {Object} Dictionary of {playerId: PlayerInput[]} mapping players to their legal inputs
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
                player.hand.forEach((card, index) => {
                    if (card instanceof Card && card.stage === 'basic') {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                selectedIndex: index,
                                sourceZone: Zone.HAND,
                                targetZone: Zone.ACTIVE
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
                player.hand.forEach((card, index) => {
                    if (card instanceof Card && card.stage === 'basic') {
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
            currentPlayer.hand.forEach((card, index) => {
                inputs.push(new PlayerInput({
                    data: new InputData({
                        selectedIndex: index,
                        sourceZone: Zone.HAND
                    }),
                    reason: SelectReason.PLAY_POKEMON,
                    playerIndex: currentPlayerIndex
                }));
            });

            // Can select active Pokemon for evolution or energy attachment
            if (currentPlayer.active) {
                // Evolution input
                if (currentPlayer.active.can_evolve) {
                    inputs.push(new PlayerInput({
                        data: new InputData({
                            sourceZone: Zone.ACTIVE
                        }),
                        reason: SelectReason.EVOLVE_POKEMON,
                        playerIndex: currentPlayerIndex
                    }));
                }
                // Energy attachment input
                if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                    inputs.push(new PlayerInput({
                        data: new InputData({
                            sourceZone: Zone.ACTIVE
                        }),
                        reason: SelectReason.ATTACH_ENERGY,
                        playerIndex: currentPlayerIndex
                    }));
                }
                // Attack inputs
                currentPlayer.active.attacks.forEach((attack, index) => {
                    if (attack.canUse(currentPlayer.active, gameState.effectRegistry)) {
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
            Object.entries(currentPlayer.bench).forEach(([benchIndex, pokemon]) => {
                if (pokemon) {
                    const zone = `bench_${benchIndex}`;
                    // Evolution input
                    if (pokemon.can_evolve) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                selectedIndex: parseInt(benchIndex),
                                sourceZone: zone
                            }),
                            reason: SelectReason.EVOLVE_POKEMON,
                            playerIndex: currentPlayerIndex
                        }));
                    }
                    // Energy attachment input
                    if (currentPlayer.canAttachEnergy && gameState.turn > 1 && currentPlayer.currentEnergyZone) {
                        inputs.push(new PlayerInput({
                            data: new InputData({
                                selectedIndex: parseInt(benchIndex),
                                sourceZone: zone
                            }),
                            reason: SelectReason.ATTACH_ENERGY,
                            playerIndex: currentPlayerIndex
                        }));
                    }
                }
            });

            // Can retreat if bench has Pokemon and enough energy
            if (Object.keys(currentPlayer.bench).length > 0 && 
                currentPlayer.active?.canRetreat(gameState.effectRegistry)) {
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
