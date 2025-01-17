import { EventType, Phase, Type } from './enums.js';
import { Card, Deck, PlayerState, Attack,Effect } from './models.js';
import { startGame,handleMove } from './gameLoop.js';
import { outputQueue, inputQueue} from './events.js';
import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Loads card data from a JSON file
 * @param {Object} data - Card data from JSON
 * @returns {Card} Constructed card object
 */
function createCard(data) {
     // Convert attacks
    const attacks = data.attacks.map(atk => {
        const effect = new Effect(atk.effect.base_damage);
        return new Attack(
            atk.name,
            effect,
            atk.cost.map(c => Type[c.toUpperCase()]),
            atk.effect.base_damage
        );
    });

    // Create card
    return new Card({
        name: data.name,
        HP: data.HP,
        type: Type[data.type.toUpperCase()],
        attacks: attacks,
        retreat: data.retreat,
        rarity: data.rarity,
        set: data.set
    });
}

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
    } else if (phase === "POKEMON_PLACED") {
        const player = event.data.player;
        const pokemon = event.data.pokemon;
        const location = event.data.location;
        const benchIndex = event.data.benchIndex;
        if (location === 'active') {
            console.log(`${player.name} placed ${pokemon.name} as their active Pokemon`);
        } else {
            console.log(`${player.name} placed ${pokemon.name} on bench slot ${benchIndex}`);
        }
    } else if (phase === "SETUP_COMPLETE") {
        const player = event.data.player;
        console.log(`${player.name} finished placing Pokemon`);
    } else if (phase === Phase.DRAW) {
        console.log("\n====== MAIN PHASE ======");
        console.log("Setup complete, starting main phase");
    }
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
 * Process all events in the output queue
 */
function processEvents() {
    while (!outputQueue.empty()) {
        const event = outputQueue.get();
        switch (event.eventType) {
            case EventType.PHASE_CHANGE:
                handlePhaseChangeEvent(event);
                break;
            case EventType.FLIP_COINS:
                handleCoinFlip(event);
                break;
            case EventType.SHUFFLE:
                handleShuffleEvent(event);
                break;
            case EventType.DRAW_CARD:
                handleDrawEvent(event);
                break;
            case EventType.ATTACH_ENERGY:
                handleEnergyAttachment(event);
                break;
            case EventType.KNOCKOUT:
                handleKnockout(event);
                break;
            case EventType.GAME_END:
                handleGameEnd(event);
                break;
        }
    }
}

/**
 * Initializes and runs the game simulation
 */
export async function runGame() {
    console.log("=== POKEMON TRADING CARD GAME SIMULATOR ===\n");
    console.log("Game started!");

    // Load card data
    const pikachuData = await fs.readFile(join(process.cwd(), 'assets', 'pokedata', 'A1_094.json'), 'utf-8');
    const bulbasaurData = await fs.readFile(join(process.cwd(), 'assets', 'pokedata', 'A1_227.json'), 'utf-8');
    
    const pikachu = JSON.parse(pikachuData);
    const bulbasaur = JSON.parse(bulbasaurData);

    // Create deck with 30 of each card
    const deck1Cards = [
        ...Array(30).fill().map(() => createCard(pikachu)),
        ...Array(30).fill().map(() => createCard(bulbasaur))
    ];

    const deck2Cards = [
        ...Array(30).fill().map(() => createCard(pikachu)),
        ...Array(30).fill().map(() => createCard(bulbasaur))
    ];

    // Create decks and players
    const deck1 = new Deck(deck1Cards);
    const deck2 = new Deck(deck2Cards);

    const player1 = new PlayerState({
        name: "Player 1",
        deck: deck1
    });

    const player2 = new PlayerState({
        name: "Player 2",
        deck: deck2
    });

    // Show available energy types
    console.log("\nAvailable Energy Types:");
    Object.values(Type).forEach(type => {
        if (type !== Type.COLORLESS) {
            console.log(`- ${type.toLowerCase()}`);
        }
    });

    // Start game
    let gameState = startGame(player1, player2);
    processEvents();

    // Process moves from input queue
    while (!inputQueue.empty()) {
        const move = inputQueue.get();
        handleMove(gameState, move);
        processEvents();
    }

    return gameState;
}
