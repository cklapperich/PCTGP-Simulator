import { Stage, Type, ZoneName, CardType } from '../RulesEngine/enums.js';
import { Card, GameState, PlayerState, Deck, Zone } from '../RulesEngine/models.js';
import { drawInitialHand, applyDamageCalculation } from '../RulesEngine/game_actions.js';
import { EffectType, EffectSource } from '../RulesEngine/effect_manager.js';
import { GameEvent } from '../RulesEngine/event_models.js';
import assert from 'assert';

describe('Game Actions Tests', () => {
    describe('drawInitialHand', () => {
        // Mock event handler to collect events
        const eventHandler: GameEvent[] = [];

        // Create test cards
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

        const trainerCard = new Card({
            name: "Test Trainer",
            type: Type.NONE,
            stage: Stage.NONE,
            cardType: CardType.TRAINER,
            set: "TEST"
        });

        beforeEach(() => {
            eventHandler.length = 0; // Clear events
        });

        it('should draw a basic Pokemon and 4 other cards', () => {
            // Setup deck with known cards
            const deck = new Deck({
                cards: [
                    basicPokemon,
                    trainerCard,
                    trainerCard,
                    evolution,
                    trainerCard,
                    trainerCard
                ]
            });

            const player = new PlayerState({
                name: "Test Player",
                deck: deck
            });

            const state = new GameState(player, new PlayerState());

            // Draw initial hand
            const drawnCards = drawInitialHand(state, 0, eventHandler);

            // Verify we got 5 cards
            assert.strictEqual(drawnCards.length, 5, "Should draw exactly 5 cards");
            
            // Verify first card is a basic Pokemon
            assert.strictEqual(drawnCards[0].stage, Stage.BASIC, "First card should be a basic Pokemon");
            
            // Verify events were emitted
            assert.strictEqual(eventHandler.length, 5, "Should emit 5 draw events");
            
            // Verify each event moves a card from deck to hand
            eventHandler.forEach(event => {
                assert.strictEqual(event.data.sourceZone, ZoneName.DECK);
                assert.strictEqual(event.data.targetZone, ZoneName.HAND);
            });

            // Verify cards are in hand
            assert.strictEqual(player.getZone(ZoneName.HAND).cards.length, 5, "Should have 5 cards in hand");
        });
    });

    describe('applyDamageCalculation', () => {
        let gameState: GameState;
        let eventHandler: GameEvent[];
        let sourcePlayer: PlayerState;
        let targetPlayer: PlayerState;

        beforeEach(() => {
            // Create players for GameState
            sourcePlayer = new PlayerState();
            targetPlayer = new PlayerState();
            gameState = new GameState(sourcePlayer, targetPlayer);
            eventHandler = [];

            // Setup source Pokemon
            const sourcePokemon = new Card({
                name: "Source Pokemon",
                HP: 60,
                type: Type.FIRE,
                stage: Stage.BASIC,
                cardType: CardType.POKEMON,
                set: "TEST"
            });
            sourcePlayer.addCardToZone(sourcePokemon, ZoneName.ACTIVE);

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
            targetPlayer.addCardToZone(targetPokemon, ZoneName.ACTIVE);
        });

        it('should apply basic damage correctly', () => {
            const damage = applyDamageCalculation(
                gameState,
                0, // sourcePlayerIndex
                1, // targetPlayerIndex
                ZoneName.ACTIVE,
                ZoneName.ACTIVE,
                20, // damage
                Type.FIRE,
                eventHandler
            );

            assert.strictEqual(damage, 40, "Should apply weakness for 40 total damage");
            assert.strictEqual(targetPlayer.getZone(ZoneName.ACTIVE).damage, 40, "Zone should have 40 damage");
            
            // Verify damage event
            const damageEvent = eventHandler.find(e => e.type === "DAMAGE");
            assert.ok(damageEvent, "Should emit damage event");
            assert.strictEqual(damageEvent?.data.amount, 40);
        });

        it('should handle immunity effects', () => {
            // Add immunity effect
            gameState.effectManager.addEffect({
                id: "test-immunity",
                type: EffectType.IMMUNITY,
                source: sourcePlayer.getZone(ZoneName.ACTIVE),
                sourceType: EffectSource.ABILITY,
                target: targetPlayer.getZone(ZoneName.ACTIVE),
                duration: 1,
                priority: 0,
                condition: () => true,
                modifier: null
            }, {
                source: sourcePlayer.getZone(ZoneName.ACTIVE),
                target: targetPlayer.getZone(ZoneName.ACTIVE),
                damage: 20,
                damageType: Type.FIRE
            });

            const damage = applyDamageCalculation(
                gameState,
                0, // sourcePlayerIndex
                1, // targetPlayerIndex
                ZoneName.ACTIVE,
                ZoneName.ACTIVE,
                20, // damage
                Type.FIRE,
                eventHandler
            );

            assert.strictEqual(damage, 20, "Should not apply weakness due to immunity");
        });

        it('should respect max HP bounds', () => {
            const damage = applyDamageCalculation(
                gameState,
                0, // sourcePlayerIndex
                1, // targetPlayerIndex
                ZoneName.ACTIVE,
                ZoneName.ACTIVE,
                100, // More than max HP
                Type.FIRE,
                eventHandler
            );

            assert.strictEqual(damage, 60, "Should cap damage at max HP");
            assert.strictEqual(targetPlayer.getZone(ZoneName.ACTIVE).damage, 60, "Zone damage should be capped at max HP");
        });

        it('should handle 0 damage', () => {
            const damage = applyDamageCalculation(
                gameState,
                0, // sourcePlayerIndex
                1, // targetPlayerIndex
                ZoneName.ACTIVE,
                ZoneName.ACTIVE,
                0,
                Type.FIRE,
                eventHandler
            );

            assert.strictEqual(damage, 0, "Should handle 0 damage");
            assert.strictEqual(eventHandler.length, 0, "Should not emit event for 0 damage");
        });
    });
});
