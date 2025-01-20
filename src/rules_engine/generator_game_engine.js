import { GameEventType, Phase, InputType, SelectReason, Zone } from './enums.js';
import { GameState, InputRequestEvent } from './models.js';
import { GameEvent } from './event_models.js';
import { getLegalMoves } from './get_legal_moves.js';
import { playPokemonCard, drawCard, shuffleDeck } from './game_actions.js';

export class EventHandler {
    push(event) {
        throw new Error('Must implement event handling');
    }
}

class QueueEventHandler extends EventHandler {
    constructor() {
        super();
        this.events = [];
    }

    push(event) {
        if (!(event instanceof GameEvent)) {
            throw new Error('Must push GameEvent instances');
        }
        this.events.push(event);
    }

    clear() {
        const events = [...this.events];
        this.events = [];
        return events;
    }
}

export function* createGameEngine(player1, player2, eventHandler) {
    state = GameState(player1, player2)

    [0,1].forEach(playerIndex => {
        playerdeck = state.players[playerIndex].deck
        deck.cards.foreach(card => {card.owner = playerIndex})
    });

    [0,1].forEach(playerIndex => {
        shuffle_deck(state, playerIndex, eventHandler)
    });

    // Initial setup phase
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: { phase: Phase.DEAL_CARDS }
    }));
    
    // Deal cards - for each player call drawCard from game_actions 5 times
    [0,1].forEach(playerIndex => {
        for (let i = 0; i < 5; i++) {
            drawCard(state, playerIndex, eventHandler);
        }
    });

    // Determine turn order with coin flip
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: { phase: Phase.TURN_ORDER }
    }));
    
    // Flip coin to determine first player
    const coinFlip = Math.random() < 0.5;
    state.currentPlayer = coinFlip ? 0 : 1;
    
    // Notify about coin flip and turn order
    eventHandler.push(new GameEvent({
        type: GameEventType.FLIP_COINS,
        data: {
            flips: [coinFlip],
            result: coinFlip ? "heads" : "tails"
        }
    }));
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_ORDER,
        data: { firstPlayer: state.currentPlayer }
    }));

    // Active Pokemon Setup Phase
    state.phase = Phase.SETUP_PLACE_ACTIVE;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: { phase: state.phase }
    }));
    
    // Wait for both players to place their active Pokemon
    const activePokemonPlaced = new Set();
    while (activePokemonPlaced.size < 2) {
        const input = yield new InputRequestEvent({
            legalMoves: getLegalMoves(state),
            reason: SelectReason.SETUP_ACTIVE
        });

        if (!activePokemonPlaced.has(input.playerIndex)) {
            const player = state.players[input.playerIndex];

            const card = player.hand[input.data.selectedIndex];
            try {
                if (playPokemonCard(gameState, playerIndex, handIndex, zone, eventHandler)) {
                    activePokemonPlaced.add(input.playerIndex);
                    eventHandler.push(new GameEvent({
                        type: GameEventType.CARD_MOVE,
                        data: {
                            card: card,
                            sourceZone: Zone.HAND,
                            targetZone: Zone.ACTIVE,
                            playerIndex: input.playerIndex
                        }
                    }));
                }
            } catch (error) {
                console.error("Error placing active Pokemon:", error);
            }
        }
    }

    // Bench Setup Phase
    state.phase = Phase.SETUP_PLACE_BENCH;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: { phase: state.phase }
    }));

    // Wait for both players to complete bench setup
    const benchSetupComplete = new Set();
    while (benchSetupComplete.size < 2) {
        const input = yield new InputRequestEvent({
            legalMoves: getLegalMoves(state),
            reason: SelectReason.SETUP_BENCH
        });


        const player = state.players[input.playerIndex];

        if (input.type === InputType.START_BATTLE) {
            benchSetupComplete.add(input.playerIndex);
            player.setupComplete = true;
        } else if (!benchSetupComplete.has(input.playerIndex) && 
                   input.data.selectedIndex !== undefined && 
                   input.data.selectedIndex < player.hand.length) {
            // Allow placing Pokemon on bench until player indicates they're done
            const card = player.hand[input.data.selectedIndex];
            try {
                if (playPokemonCard(gameState, playerIndex, handIndex, zone, eventHandler)) {
                    eventHandler.push(new GameEvent({
                        type: GameEventType.CARD_MOVE,
                        data: {
                            card: card,
                            sourceZone: Zone.HAND,
                            targetZone: Zone.BENCH_0, // First available bench slot
                            playerIndex: input.playerIndex
                        }
                    }));
                }
            } catch (error) {
                console.error("Error placing bench Pokemon:", error);
            }
        }
    }

    // Transition to main phase
    state.phase = Phase.MAIN;
    eventHandler.push(new GameEvent({
        type: GameEventType.PHASE_CHANGE,
        data: { phase: state.phase }
    }));

    // Main game loop
    while (!state.gameOver) {
        eventHandler.push(new GameEvent({
            type: GameEventType.TURN_START,
            data: { player: state.currentPlayer }
        }));

        // Main phase - keep accepting moves until player passes or game ends
        while (state.phase === Phase.MAIN) {
            const input = yield new InputRequestEvent({
                legalMoves: getLegalMoves(state),
                reason: SelectReason.NOT_SPECIFIED
            });

            try {
                // For now only handle passing turn, other inputs will be implemented later
                if (input.type === InputType.PASS_TURN) {
                    state.phase = Phase.BETWEEN_TURNS;
                    eventHandler.push(new GameEvent({
                        type: GameEventType.PHASE_CHANGE,
                        data: { phase: state.phase }
                    }));
                }
            } catch (error) {
                console.error("Error processing turn input:", error);
                // Revert to main phase if error occurs during phase transition
                state.phase = Phase.MAIN;
            }
        }

        // Switch players
        state.currentPlayer = 1 - state.currentPlayer;
    }

    // Game over
    eventHandler.push(new GameEvent({
        type: GameEventType.GAME_END,
        data: { winner: state.winner }
    }));
    return state;
}
