import { EventType, Phase} from './rules_engine/enums.js';
import { Card} from './rules_engine/models.js';
import { UIoutputBus } from './rules_engine/events.js';

/**
 * Prints detailed card information
 * @param {Card} card - Card to display
 */
function printCardDetails(card) {
    console.log(`${card.name} (${card.type.toLowerCase()}, ${card.HP} HP)`);
    card.attacks.forEach(attack => {
        const cost = attack.cost.map(c => c.toLowerCase()).join('/');
        console.log(`  Attack: ${attack.name} (${cost}) - ${attack.damage} dmg`);
    });
}

/**
 * Prints energy information for a Pokemon
 * @param {Card} pokemon - Pokemon to display energy for
 */
function printEnergyDetails(pokemon) {
    const energyTypes = Array.from(pokemon.attachedEnergy.entries())
        .map(([type, count]) => `${count} ${type.toLowerCase()}`)
        .join(', ');
    console.log(`  Energy: ${energyTypes || 'none'}`);
}

/**
 * Handles shuffle event display
 * @param {Event} event - Shuffle event
 */
function handleShuffleEvent(event) {
    console.log(`Shuffling ${event.data.player.name}'s deck...`);
}

/**
 * Handles card draw event display
 * @param {Event} event - Draw event
 */
function handleDrawEvent(event) {
    const player = event.data.player;
    const card = event.data.card;
    
    if (event.data.hand.length === 1) {
        console.log(`\n=== ${player.name}'s Opening Hand ===`);
    }
    process.stdout.write('- ');
    printCardDetails(card);
}

/**
 * Handles phase change event display
 * @param {Event} event - Phase change event
 */
function handlePhaseChangeEvent(event) {
    const phase = event.data.phase;
    console.log(`\n====== ${phase} PHASE ======`);

    if (phase === Phase.INITIAL_COIN_FLIP) {
        console.log("Flipping a coin to determine who goes first...");
    } else if (phase === Phase.SETUP_PLACE_ACTIVE) {
        if (event.data.firstPlayer) {
            console.log(`${event.data.firstPlayer.name} will go first!`);
        }
        console.log("Players must now place their active Pokemon");
    } else if (phase === Phase.SETUP_PLACE_BENCH) {
        console.log("Players may now place up to 3 bench Pokemon");
    } else if (phase === "SETUP_COMPLETE") {
        const player = event.data.player;
        console.log(`${player.name} finished placing Pokemon`);
    } else if (phase === Phase.DRAW) {
        console.log("\n====== MAIN PHASE ======");
        console.log("Setup complete, starting main phase");
    }
}

/**
 * Handles card movement event display
 * @param {Event} event - Card movement event
 */
function handleCardMove(event) {
    const { card, player, sourceZone, destinationZone, destinationIndex } = event.data;
    
    if (destinationZone === 'active') {
        console.log(`${player.name} placed ${card.name} as their active Pokemon`);
    } else if (destinationZone === 'bench') {
        console.log(`${player.name} placed ${card.name} on bench slot ${destinationIndex}`);
    } else if (destinationZone === 'discard') {
        console.log(`${card.name} was moved to ${player.name}'s discard pile`);
    } else if (destinationZone === 'hand') {
        // Don't log card movement to hand - we handle this in draw events
    }
}

/**
 * Handles card reveal event display
 * @param {Event} event - Card reveal event
 */
function handleCardReveal(event) {
    // For text frontend, we don't need to handle reveals separately
    // as we show cards when they're drawn or played
}

/**
 * Handles energy attachment event display
 * @param {Event} event - Energy attachment event
 */
function handleEnergyAttachment(event) {
    const player = event.data.player;
    const target = event.data.target;
    const energyType = event.data.energyType;
    
    console.log(`\n${player.name} attached ${energyType.toLowerCase()} energy to ${target.name}`);
    printEnergyDetails(target);
}

/**
 * Handles knockout event display
 * @param {Event} event - Knockout event
 */
function handleKnockout(event) {
    const pokemon = event.data.pokemon;
    const player = event.data.player;
    console.log(`\n${pokemon.name} was knocked out!`);
}

/**
 * Handles game end event display
 * @param {Event} event - Game end event
 */
function handleGameEnd(event) {
    const winner = event.data.winner;
    const reason = event.data.reason;
    console.log(`\n====== GAME OVER ======`);
    console.log(`${winner.name} wins by ${reason}!`);
}

/**
 * Handles coin flip event display
 * @param {Event} event - Coin flip event
 */
function handleCoinFlip(event) {
    const flip = event.data.flip;
    const count = flip.length;
    
    if (count === 1) {
        console.log(`Coin flip result: ${flip[0] ? 'Heads' : 'Tails'}`);
    } else {
        console.log(`Flipping ${count} coins...`);
        flip.forEach((result, index) => {
            console.log(`Coin ${index + 1}: ${result ? 'Heads' : 'Tails'}`);
        });
    }
}

/**
 * Handles wait for input event display and processing
 * @param {Event} event - Wait for input event
 */
function handleWaitForInput(event) {
    const { inputType, player, phase, legalMoves } = event.data;
    console.log(`\n=== ${player.name}'s turn - ${phase} ===`);
    console.log("Legal moves:");
    legalMoves.forEach((move, index) => {
        console.log(`${index + 1}: ${move.type} - ${JSON.stringify(move.data)}`);
    });
}

/**
 * Handles invalid move event display
 * @param {Event} event - Invalid move event
 */
function handleInvalidMove(event) {
    const { move, reason } = event.data;
    console.log(`\nInvalid move: ${move.type} - ${reason}`);
}

/**
 * Event handler mapping
 */
const eventHandlers = {
    [EventType.PHASE_CHANGE]: handlePhaseChangeEvent,
    [EventType.FLIP_COINS]: handleCoinFlip,
    [EventType.SHUFFLE]: handleShuffleEvent,
    [EventType.DRAW_CARD]: handleDrawEvent,
    [EventType.ATTACH_ENERGY]: handleEnergyAttachment,
    [EventType.KNOCKOUT]: handleKnockout,
    [EventType.GAME_END]: handleGameEnd,
    [EventType.CARD_MOVE]: handleCardMove,
    [EventType.CARD_REVEAL]: handleCardReveal,
    [EventType.WAIT_FOR_INPUT]: handleWaitForInput,
    [EventType.INVALID_MOVE]: handleInvalidMove
};

/**
 * Initialize the text frontend by subscribing to UI events
 */
export function initializeTextFrontend() {
    // Subscribe to UI events
    UIoutputBus.subscribe(event => {
        const handler = eventHandlers[event.eventType];
        if (handler) {
            handler(event);
        }
    });
}

/**
 * For backwards compatibility - processes any events in the queue
 */
export function processUIEvents() {
    while (!UIoutputBus.empty()) {
        const event = UIoutputBus.get();
        const handler = eventHandlers[event.eventType];
        if (handler) {
            handler(event);
        }
    }
}
