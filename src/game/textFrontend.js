import { EventType, Phase, Type } from './enums.js';
import { Card, Deck, PlayerState, Attack, BasicEffect } from './models.js';
import { startGame, outputQueue } from './gameLoop.js';
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
        const effect = new BasicEffect(atk.effect.base_damage);
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
    } else if (phase === Phase.SETUP) {
        const firstPlayer = event.data.firstPlayer;
        console.log(`${firstPlayer.name} will go first!`);
    }
}

/**
 * Handles search event display
 * @param {Event} event - Search event
 */
function handleSearchEvent(event) {
    console.log("\n=== DECK SEARCH ===");
    console.log(`Instructions: ${event.searchParams.instruction}`);
    console.log(`Reason: ${event.searchParams.reason}`);
    console.log(`Player ${event.searchParams.playerId + 1}, choose ${event.searchParams.minCards}-${event.searchParams.maxCards} cards from:`);

    // Show first 10 cards with a message if there are more
    const displayLimit = 10;
    event.searchParams.legalCards.slice(0, displayLimit).forEach((card, i) => {
        process.stdout.write(`${i + 1}. `);
        printCardDetails(card);
    });

    const remaining = event.searchParams.legalCards.length - displayLimit;
    if (remaining > 0) {
        console.log(`...and ${remaining} more cards`);
    }

    if (event.searchParams.canCancel) {
        console.log("(You may cancel this search)");
    }
}

/**
 * Handles coin flip event display
 * @param {Event} event - Coin flip event
 */
function handleCoinFlip(event) {
    console.log(`flipping ${event.data.flip.length} coins.`);
    const results = event.data.flip.map(flip => flip ? "Heads" : "Tails");
    console.log(results.join("! "));
}

/**
 * Initializes and runs the game simulation
 */
export async function runGame() {
    console.log("=== POKEMON TRADING CARD GAME SIMULATOR ===\n");
    console.log("Game started!");

    // Load card data and create decks
    const pikachuData = await fs.readFile(join('..', '..', 'assets', 'pokedata', 'A1_094.json'), 'utf-8');
    const bulbasaurData = await fs.readFile(join('..', '..', 'assets', 'pokedata', 'A1_227.json'), 'utf-8');
    
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

    // Start game and process initial events
    const gameState = startGame(player1, player2);

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
            case EventType.SEARCH_DECK:
                handleSearchEvent(event);
                break;
        }
    }

    return gameState;
}
