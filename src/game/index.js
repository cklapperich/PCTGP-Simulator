import { runGame } from './textFrontend.js';

// Run the game simulation
console.log("Starting Pokemon TCG Simulator...");

runGame().then(gameState => {
    console.log("\nGame initialization complete!");
    console.log(`Current phase: ${gameState.phase}`);
    console.log(`Current player: ${gameState.getCurrentPlayer().name}`);
}).catch(error => {
    console.error("Error running game:", error);
});
