import { RulesEngine, TurnHistory } from '../rules_engine/rules_engine.js';
import { PlayerInput, InputData, InputType } from '../rules_engine/input_event_models.js';
import { ZoneName, Phase, Type, Stage } from '../rules_engine/enums.js';
import { GameState, Deck, PlayerState, Card } from '../rules_engine/models.js';
import { rulesEngineGenerator } from '../rules_engine/rules_engine_generator.js';
import { QueueEventHandler } from '../rules_engine/EventHandlers.js';

// Create Bulbasaur card
function createBulbasaurCard() {
    return new Card({
        name: "Bulbasaur",
        HP: 70,
        type: Type.GRASS,
        attacks: [],  // No attacks for now
        retreat: 1,
        rarity: "diamond_1",
        set: "A1",
        stage: Stage.BASIC,
        weakness: Type.FIRE
    });
}

// Mock player data with Bulbasaur cards
const createTestPlayer = (name) => {
    // Create deck first
    const deck = new Deck({
        name: `${name}'s Test Deck`,
        cards: [
            createBulbasaurCard(),
            createBulbasaurCard(),
            createBulbasaurCard(),
            createBulbasaurCard(),
            createBulbasaurCard(),
            createBulbasaurCard(),  // Add extra cards in case we need more
            createBulbasaurCard()
        ],
        energyTypes: new Set([Type.GRASS])
    });
    
    // Create player state with deck
    return new PlayerState({
        name: name,
        deck: deck
    });
};

// Simple assertion helper
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

// Test setup helper
function createTestSetup() {
    const eventHandler = new QueueEventHandler();
    const player1 = createTestPlayer("Player 1");
    const player2 = createTestPlayer("Player 2");
    const engine = new RulesEngine(player1, player2, eventHandler);
    return { engine, eventHandler };
}

console.log("Testing setup phase - place active Pokemon");
try {
    const { engine } = createTestSetup();
    // Initial state should be SETUP_PLACE_ACTIVE
    let response = engine.runUntilNext();
    assert(response.state.phase === Phase.SETUP_PLACE_ACTIVE, 
        `Expected phase to be SETUP_PLACE_ACTIVE, got ${response.state.phase}`);

    // Player 1 places Bulbasaur as active
    const player1Input = new PlayerInput({
        data: new InputData({
            handIndex: 0,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.ACTIVE
        }),
        playerIndex: 0,
        inputType: InputType.CARD_MOVE
    });

    response = engine.runUntilNext(player1Input);
        
    // Player 2 places Bulbasaur as active
    const player2Input = new PlayerInput({
        data: new InputData({
            handIndex: 0,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.ACTIVE
        }),
        playerIndex: 1,
        inputType: InputType.CARD_MOVE
    });

    response = engine.runUntilNext(player2Input);
    
    // Should move to bench placement phase
    assert(response.state.phase === Phase.SETUP_PLACE_BENCH,
        `Expected phase to be SETUP_PLACE_BENCH, got ${response.state.phase}`);

    // Verify Bulbasaur was placed correctly
    assert(response.state.players[0].zones[ZoneName.ACTIVE].cards[0].name === "Bulbasaur",
        "Player 1's active Pokemon should be Bulbasaur");
    assert(response.state.players[1].zones[ZoneName.ACTIVE].cards[0].name === "Bulbasaur",
        "Player 2's active Pokemon should be Bulbasaur");

    engine.cleanup();
    console.log("✓ Active Pokemon placement test passed");
} catch (error) {
    console.error("✗ Active Pokemon placement test failed:", error.message);
}

console.log("\nTesting setup phase - complete setup and reach main phase");
try {
    const { engine } = createTestSetup();
    // Place active Pokemon (Bulbasaur) for both players
    let response = engine.runUntilNext();
        
    response = engine.runUntilNext(new PlayerInput({
        data: new InputData({
            handIndex: 0,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.ACTIVE
        }),
        playerIndex: 0,
        inputType: InputType.CARD_MOVE
    }));

    response = engine.runUntilNext(new PlayerInput({
        data: new InputData({
            handIndex: 0,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.ACTIVE
        }),
        playerIndex: 1,
        inputType: InputType.CARD_MOVE
    }));

    // Place Bulbasaur on bench for Player 1
    response = engine.runUntilNext(new PlayerInput({
        data: new InputData({
            handIndex: 1,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.BENCH_0
        }),
        playerIndex: 0,
        inputType: InputType.CARD_MOVE
    }));

    // Player 1 done placing bench Pokemon
    response = engine.runUntilNext(new PlayerInput({
        data: new InputData(),
        playerIndex: 0,
        inputType: InputType.START_BATTLE
    }));

    // Place Bulbasaur on bench for Player 2
    response = engine.runUntilNext(new PlayerInput({
        data: new InputData({
            handIndex: 1,
            sourceZone: ZoneName.HAND,
            targetZone: ZoneName.BENCH_0
        }),
        playerIndex: 1,
        inputType: InputType.CARD_MOVE
    }));

    // Player 2 done placing bench Pokemon
    response = engine.runUntilNext(new PlayerInput({
        data: new InputData(),
        playerIndex: 1,
        inputType: InputType.START_BATTLE
    }));

    // Should now be in main phase
    assert(response.state.phase === Phase.MAIN,
        `Expected phase to be MAIN, got ${response.state.phase}`);

    // Verify final board state
    // Player 1 board
    assert(response.state.players[0].zones[ZoneName.ACTIVE].cards[0].name === "Bulbasaur",
        "Player 1's active Pokemon should be Bulbasaur");
    assert(response.state.players[0].zones[ZoneName.BENCH_0].cards[0].name === "Bulbasaur",
        "Player 1's benched Pokemon should be Bulbasaur");
    
    // Player 2 board
    assert(response.state.players[1].zones[ZoneName.ACTIVE].cards[0].name === "Bulbasaur",
        "Player 2's active Pokemon should be Bulbasaur");
    assert(response.state.players[1].zones[ZoneName.BENCH_0].cards[0].name === "Bulbasaur",
        "Player 2's benched Pokemon should be Bulbasaur");

    engine.cleanup();
    console.log("✓ Complete setup test passed");
} catch (error) {
    console.error("✗ Complete setup test failed:", error.message);
}
