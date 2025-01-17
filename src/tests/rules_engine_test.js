import { EventType, MoveType, Type } from '../rules_engine/enums.js';
import { RequestInputBus, inputBus, UIoutputBus } from '../rules_engine/events.js';
import assert from 'assert';
import { Move, Deck, PlayerState, Card, Attack, Effect } from '../rules_engine/models.js';
import { handleMove, startGame } from '../rules_engine/gameLoop.js';
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
        // Create effect with base damage
        const effect = new Effect(atk.effect.base_damage || 0);
        // Pass same base_damage to Attack for display/reference
        return new Attack(
            atk.name,
            effect,
            atk.cost.map(c => Type[c.toUpperCase()]),
            atk.effect.base_damage || 0
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
 * Initializes and runs the game simulation
 */
export async function runGame() {
    console.log("=== POKEMON TRADING CARD GAME SIMULATOR ===\n");
    console.log("Game started!");

    // Load card data
    const pikachuData = await fs.readFile(join(process.cwd(), 'assets', 'cards', 'A1','A1_001.json'), 'utf-8');
    const bulbasaurData = await fs.readFile(join(process.cwd(), 'assets', 'cards', 'A1','A1_094.json'), 'utf-8');
    
    const pikachu = JSON.parse(pikachuData);
    const bulbasaur = JSON.parse(bulbasaurData);

    // Create deck with 10 of each card
    const deck1Cards = [
        ...Array(10).fill().map(() => createCard(pikachu)),
        ...Array(10).fill().map(() => createCard(bulbasaur))
    ];

    const deck2Cards = [
        ...Array(10).fill().map(() => createCard(pikachu)),
        ...Array(10).fill().map(() => createCard(bulbasaur))
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
    let gameState = startGame(player1, player2);
    return gameState;
}

// Test moves to execute
const TEST_MOVES = [
    // Players place active Pokemon
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 }), // Player 1 active
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 }), // Player 2 active

    // Players place bench Pokemon
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 }), // Player 1 bench slot 0
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 }), // Player 2 bench slot 0
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 }), // Player 1 bench slot 1
    new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 }), // Player 2 bench slot 1

    // Players end bench placement
    new Move(MoveType.PASS_TURN, { player: 0 }), // Player 1 done
    new Move(MoveType.PASS_TURN, { player: 1 })  // Player 2 done
];

// Game setup phases in order
const SETUP_PHASES = [
    'INITIAL_COIN_FLIP',
    'SETUP_PLACE_ACTIVE',
    'SETUP_PLACE_BENCH',
    'SETUP_COMPLETE',
    'DRAW'
];

// Keep track of all events across the entire test
let allEvents = [];

// Subscribe to UI events for verification
UIoutputBus.subscribe(event => {
    allEvents.push(event);
    console.log(`Event: ${event.eventType}${event.data?.phase ? ` (${event.data.phase})` : ''}`);
});

// Verify the sequence of events at the end of the test
function verifyEventSequence() {
    let seenPhases = new Set();
    let seenInitialDraw = false;
    let seenActivePlacement = false;
    let seenBenchPlacement = false;
    
    // Go through all collected events
    for (const event of allEvents) {
        // Track phases
        if (event.eventType === 'phase_change' && event.data?.phase) {
            seenPhases.add(event.data.phase);
            console.log(`✓ Saw phase: ${event.data.phase}`);
        }
        
        // Track key events in sequence
        if (['draw_card', 'card_reveal'].includes(event.eventType) && !seenBenchPlacement) {
            seenInitialDraw = true;
        }
        if (event.eventType === 'card_move' && event.data?.destinationZone === 'active') {
            assert(seenInitialDraw, 'Active placement should happen after initial draw');
            seenActivePlacement = true;
        }
        if (event.eventType === 'card_move' && event.data?.destinationZone === 'bench') {
            assert(seenActivePlacement, 'Bench placement should happen after active placement');
            seenBenchPlacement = true;
        }
    }
    
    // Verify we saw all required phases
    for (const phase of SETUP_PHASES) {
        assert(seenPhases.has(phase), `Missing required phase: ${phase}`);
    }
    
    // Verify we saw all key events
    assert(seenInitialDraw, 'Missing initial card draw events');
    assert(seenActivePlacement, 'Missing active Pokemon placement');
    assert(seenBenchPlacement, 'Missing bench Pokemon placement');
    
    console.log('✓ All events occurred in roughly the correct order');
    
    // Clear events for next test run
    allEvents = [];
}

// Run test
async function runTest() {
    try {
        // Clear any existing events
        allEvents = [];
        
        // Start the game
        let gameState = await runGame();
        
        // Process each test move
        let moveIndex = 0;
        while (moveIndex < TEST_MOVES.length) {
            // Wait for input request from RequestInputBus
            const inputRequest = RequestInputBus.get();
            if (!inputRequest) {
                throw new Error('Game did not request input');
            }
            
            // Stop if game ended
            if (inputRequest.eventType === EventType.GAME_END) {
                return;
            }

            if (inputRequest.eventType !== EventType.WAIT_FOR_INPUT) {
                throw new Error(`Expected WAIT_FOR_INPUT event, got ${inputRequest.eventType}`);
            }

            // Get the current move and update its player index if needed
            const move = {...TEST_MOVES[moveIndex]};
            if (move.data && move.data.hasOwnProperty('player')) {
                // During setup, use the player from the input request
                const requestedPlayer = inputRequest.data.player;
                move.data.player = requestedPlayer === gameState.players[0] ? 0 : 1;
            }

            // Log the current input request
            console.log(`\nProcessing ${inputRequest.data.inputType} request for ${inputRequest.data.player.name}`);

            // Verify move is legal for the current input type
            const isLegal = inputRequest.data.legalMoves.some(legalMove => 
                legalMove.type === move.type && 
                JSON.stringify(legalMove.data) === JSON.stringify(move.data)
            );

            if (!isLegal) {
                throw new Error(`Move ${move.type} is not legal for input type ${inputRequest.data.inputType}`);
            }

            // Submit the move to the input bus and process it
            inputBus.publish(move);
            handleMove(gameState, move);
            moveIndex++;
        }

        // Verify the complete sequence of events
        verifyEventSequence();
        console.log('Test completed successfully');
    } catch (error) {
        console.error('Test failed:', error.message);
        throw error;
    }
}

runTest().catch(console.error);
