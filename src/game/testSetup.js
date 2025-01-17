import { runGame } from './textFrontend.js';
import { MoveType } from './enums.js';
import { inputQueue, Move } from './gameLoop.js';

// Pre-fill input queue with moves
function setupTestMoves() {
    // Players place active Pokemon
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 })); // Player 1 active
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 })); // Player 2 active

    // Players place bench Pokemon
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 })); // Player 1 bench slot 0
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 })); // Player 2 bench slot 0
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 0 })); // Player 1 bench slot 1
    inputQueue.put(new Move(MoveType.CHOOSE_HAND_CARD, { handIndex: 0, player: 1 })); // Player 2 bench slot 1

    // Players end bench placement
    inputQueue.put(new Move(MoveType.PASS_TURN, { player: 0 })); // Player 1 done
    inputQueue.put(new Move(MoveType.PASS_TURN, { player: 1 })); // Player 2 done
}

// Run test
async function runTest() {
    setupTestMoves();
    await runGame();
}

runTest().catch(console.error);
