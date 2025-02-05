import { Stage, Type, ZoneName, EffectSourceType, CardType } from '../RulesEngine/enums.js';
import { Card, GameState, PlayerState, Deck } from '../RulesEngine/models.js';
import { drawInitialHand, applyEffect } from '../RulesEngine/game_actions.js';
import '../RulesEngine/effect_registry.js'; // Import this first to register effects
import { createEffect } from '../RulesEngine/effect_manager.js';
import { GameEventType } from '../RulesEngine/event_models.js';
import assert from 'assert';

// Test data setup
function createBasicTestCards() {
    const basicPokemon = new Card({
        name: "Test Basic",
        HP: 50,
        type: Type.GRASS,
        stage: Stage.BASIC,
        cardType: CardType.POKEMON,
        set: "TEST"
    });

    const evolution = new Card({
        name: "Test Evolution",
        HP: 70,
        type: Type.GRASS,
        stage: Stage.STAGE_1,
        evolvesFrom: "Test Basic",
        cardType: CardType.POKEMON,
        set: "TEST"
    });

    // !! No such thing an an energy card right now
    // const energyCard = new Card({
    //     name: "Test Energy",
    //     type: Type.GRASS,
    //     stage: Stage.NONE,
    //     cardType: CardType.POKEMON,
    //     set: "TEST"
    // });

    return { basicPokemon, evolution };
}

// Test initial hand drawing
function testDrawInitialHand() {
    const { basicPokemon, evolution } = createBasicTestCards();
    
    // Setup deck with known cards - using duplicates of basic and evolution for now
    const deck = new Deck({
        cards: [
            basicPokemon,
            basicPokemon,
            basicPokemon,
            evolution,
            evolution
        ]
    });

    const player = new PlayerState({
        name: "Test Player",
        deck: deck
    });

    // Initialize deck zone with the deck's cards
    player.getZone(ZoneName.DECK).cards = [...deck.cards];

    const state = new GameState(player, new PlayerState());
    
    // Draw initial hand
    const drawnCards = drawInitialHand(state, 0);

    // Verify we got 5 cards
    assert.strictEqual(drawnCards.length, 5, "Should draw exactly 5 cards");
    
    // Verify first card is a basic Pokemon
    assert.strictEqual(drawnCards[0].stage, Stage.BASIC, "First card should be a basic Pokemon");
    
    // Verify events were emitted
    assert.strictEqual(state.uiEvents.length, 5, "Should emit 5 draw events");
    
    // Verify each event moves a card from deck to hand
    state.uiEvents.forEach(event => {
        assert.strictEqual(event.data.sourceZone, ZoneName.DECK);
        assert.strictEqual(event.data.targetZone, ZoneName.HAND);
    });

    // Verify cards are in hand
    assert.strictEqual(player.getZone(ZoneName.HAND).cards.length, 5, "Should have 5 cards in hand");

    console.log("✓ drawInitialHand tests passed");
}

// Test effect-based damage
function testEffectBasedDamage() {
    // Setup source Pokemon
    const sourcePokemon = new Card({
        name: "Source Pokemon",
        HP: 60,
        type: Type.FIRE,
        stage: Stage.BASIC,
        cardType: CardType.POKEMON,
        set: "TEST"
    });

    // Setup target Pokemon
    const targetPokemon = new Card({
        name: "Target Pokemon",
        HP: 60,
        type: Type.GRASS,
        stage: Stage.BASIC,
        weakness: Type.FIRE,
        cardType: CardType.POKEMON,
        set: "TEST"
    });

    // Setup players with empty decks
    const player1 = new PlayerState({ 
        name: "Player 1",
        deck: new Deck()
    });
    const player2 = new PlayerState({ 
        name: "Player 2",
        deck: new Deck()
    });

    // Add Pokemon to active spots
    player1.addCardToZone(sourcePokemon, ZoneName.ACTIVE);
    player2.addCardToZone(targetPokemon, ZoneName.ACTIVE);

    // Create game state
    const gameState = new GameState(player1, player2);
    gameState.currentPlayerIndex = 0; // Player 1's turn

    const targetZone = player2.getZone(ZoneName.ACTIVE);

    // Test 1: Basic damage
    targetZone.damage = 0; // Reset damage counter
    gameState.clearUIEvents(); // Clear events
    const effect = createEffect(
        "FIXED_DAMAGE",
        sourcePokemon,
        EffectSourceType.ATTACK,
        targetPokemon,
        { amount: 30 }
    );

    applyEffect(gameState, effect);
    assert.strictEqual(targetZone.damage, 30, "Should apply 30 damage");

    // Verify damage event
    const damageEvent = gameState.uiEvents.find(e => e.type === GameEventType.DAMAGE);
    assert.ok(damageEvent, "Should emit damage event");
    assert.strictEqual(damageEvent.data.amount, 30);

    // Test 2: Weakness (+20 damage)
    targetZone.damage = 0; // Reset damage counter
    gameState.clearUIEvents(); // Clear events
    const weaknessEffect = createEffect(
        "FIXED_DAMAGE",
        sourcePokemon,
        EffectSourceType.ATTACK,
        targetPokemon,
        { 
            amount: 30,
            damageType: Type.FIRE
        }
    );

    applyEffect(gameState, weaknessEffect);
    assert.strictEqual(targetZone.damage, 50, "Should apply 30 + 20 damage due to weakness");

    // Test 3: Max HP bounds
    targetZone.damage = 0; // Reset damage counter
    gameState.clearUIEvents(); // Clear events
    const maxEffect = createEffect(
        "FIXED_DAMAGE",
        sourcePokemon,
        EffectSourceType.ATTACK,
        targetPokemon,
        { 
            amount: 100,
            damageType: Type.FIRE
        }
    );

    applyEffect(gameState, maxEffect);
    assert.strictEqual(targetZone.damage, 60, "Should cap damage at max HP");

    // Test 4: 0 damage
    targetZone.damage = 0; // Reset damage counter
    gameState.clearUIEvents(); // Clear events
    const zeroEffect = createEffect(
        "FIXED_DAMAGE",
        sourcePokemon,
        EffectSourceType.ATTACK,
        targetPokemon,
        { amount: 0 }
    );

    applyEffect(gameState, zeroEffect);
    assert.strictEqual(targetZone.damage, 0, "Should handle 0 damage");
    assert.strictEqual(gameState.uiEvents.length, 0, "Should not emit event for 0 damage");

    console.log("✓ Effect-based damage tests passed");
}

// Run all tests
console.log("Running game actions tests...");
testDrawInitialHand();
testEffectBasedDamage();
console.log("All game actions tests passed!");
