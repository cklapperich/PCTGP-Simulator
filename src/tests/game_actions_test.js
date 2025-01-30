import { Stage, Type, ZoneName } from '../RulesEngine/enums.js';
import { Card, GameState, PlayerState, Deck, Zone } from '../RulesEngine/models.js';
import { drawInitialHand, applyDamageCalculation } from '../RulesEngine/game_actions.js';
import { EffectType, EffectSource } from '../RulesEngine/effect_manager.js';
import assert from 'assert';

describe('Game Actions Tests', () => {
    describe('drawInitialHand', () => {
        // Mock event handler to collect events
        const eventHandler = [];

        // Create test cards
        const basicPokemon = new Card({
            name: "Test Basic",
            HP: 50,
            type: Type.GRASS,
            stage: Stage.BASIC,
            cardType: "Pokemon",
            set: "TEST"
        });

        const evolution = new Card({
            name: "Test Evolution",
            HP: 70,
            type: Type.GRASS,
            stage: Stage.STAGE_1,
            evolvesFrom: "Test Basic",
            cardType: "Pokemon",
            set: "TEST"
        });

        const energyCard = new Card({
            name: "Test Energy",
            type: Type.GRASS,
            stage: Stage.NONE,
            cardType: "Energy",
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
                    energyCard,
                    energyCard,
                    evolution,
                    energyCard,
                    energyCard
                ]
            });

            const player = new PlayerState({
                name: "Test Player",
                deck: deck
            });

            const state = new GameState();
            state.players[0] = player;

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
        let gameState;
        let eventHandler;
        let sourceZone;
        let targetZone;

        beforeEach(() => {
            gameState = new GameState();
            eventHandler = [];

            // Setup source Pokemon
            sourceZone = new Zone(ZoneName.ACTIVE);
            sourceZone.addCard(new Card({
                name: "Source Pokemon",
                HP: 60,
                type: Type.FIRE,
                stage: Stage.BASIC,
                cardType: "Pokemon",
                set: "TEST"
            }));

            // Setup target Pokemon
            targetZone = new Zone(ZoneName.ACTIVE);
            targetZone.addCard(new Card({
                name: "Target Pokemon",
                HP: 60,
                type: Type.GRASS,
                stage: Stage.BASIC,
                weakness: Type.FIRE,
                cardType: "Pokemon",
                set: "TEST"
            }));
        });

        it('should apply basic damage correctly', () => {
            const context = {
                source: sourceZone,
                target: targetZone,
                damage: 20,
                damageType: Type.FIRE
            };

            const damage = applyDamageCalculation(gameState, context, eventHandler);
            assert.strictEqual(damage, 40, "Should apply weakness for 40 total damage");
            assert.strictEqual(targetZone.damage, 40, "Zone should have 40 damage");
            
            // Verify damage event
            const damageEvent = eventHandler.find(e => e.type === "DAMAGE");
            assert.ok(damageEvent, "Should emit damage event");
            assert.strictEqual(damageEvent?.data.amount, 40);
        });

        it('should handle immunity effects', () => {
            const context = {
                source: sourceZone,
                target: targetZone,
                damage: 20,
                damageType: Type.FIRE
            };

            // Add immunity effect
            gameState.effectManager.addEffect({
                id: "test-immunity",
                type: EffectType.IMMUNITY,
                source: sourceZone,
                sourceType: EffectSource.ABILITY,
                target: targetZone,
                duration: 1,
                priority: 0
            }, context);

            const damage = applyDamageCalculation(gameState, context, eventHandler);
            assert.strictEqual(damage, 20, "Should not apply weakness due to immunity");
        });

        it('should handle damage modification effects', () => {
            const context = {
                source: sourceZone,
                target: targetZone,
                damage: 20,
                damageType: Type.FIRE
            };

            // Add damage modification effect that doubles damage
            gameState.effectManager.addEffect({
                id: "test-damage-mod",
                type: EffectType.DAMAGE_MODIFICATION,
                source: sourceZone,
                sourceType: EffectSource.ABILITY,
                target: targetZone,
                duration: 1,
                priority: 0,
                modifier: (damage) => damage * 2
            }, context);

            const damage = applyDamageCalculation(gameState, context, eventHandler);
            assert.strictEqual(damage, 80, "Should apply weakness and damage modification");
        });

        it('should respect max HP bounds', () => {
            const context = {
                source: sourceZone,
                target: targetZone,
                damage: 100, // More than max HP
                damageType: Type.FIRE
            };

            const damage = applyDamageCalculation(gameState, context, eventHandler);
            assert.strictEqual(damage, 60, "Should cap damage at max HP");
            assert.strictEqual(targetZone.damage, 60, "Zone damage should be capped at max HP");
        });

        it('should handle 0 damage', () => {
            const context = {
                source: sourceZone,
                target: targetZone,
                damage: 0,
                damageType: Type.FIRE
            };

            const damage = applyDamageCalculation(gameState, context, eventHandler);
            assert.strictEqual(damage, 0, "Should handle 0 damage");
            assert.strictEqual(eventHandler.length, 0, "Should not emit event for 0 damage");
        });
    });
});
