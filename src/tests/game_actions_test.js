import { Stage, Type, GameEventType, ZoneName } from '../rules_engine/enums.js';
import { Card, GameState, PlayerState, Deck } from '../rules_engine/models.js';
import { drawInitialHand } from '../rules_engine/game_actions.js';
import assert from 'assert';

describe('Game Actions Tests', () => {
    describe('drawInitialHand', () => {
        // Mock event handler
        const eventHandler = {
            events: [],
            put: function(event) {
                this.events.push(event);
            },
            clear: function() {
                this.events = [];
            }
        };

        // Create test cards
        const basicPokemon = new Card({
            name: "Test Basic",
            HP: 50,
            type: Type.GRASS,
            stage: Stage.BASIC
        });

        const evolution = new Card({
            name: "Test Evolution",
            HP: 70,
            type: Type.GRASS,
            stage: Stage.STAGE_1,
            evolvesFrom: "Test Basic"
        });

        const energyCard = new Card({
            name: "Test Energy",
            type: Type.GRASS,
            stage: Stage.NONE
        });

        beforeEach(() => {
            eventHandler.clear();
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
            assert.strictEqual(eventHandler.events.length, 5, "Should emit 5 draw events");
            
            // Verify each event is a draw event
            eventHandler.events.forEach(event => {
                assert.strictEqual(event.type, GameEventType.DRAW_CARD);
                assert.strictEqual(event.data.sourceZone, ZoneName.DECK);
                assert.strictEqual(event.data.targetZone, ZoneName.HAND);
            });

            // Verify cards are in hand
            assert.strictEqual(player.getZone(ZoneName.HAND).cards.length, 5, "Should have 5 cards in hand");
        });
    });
});
