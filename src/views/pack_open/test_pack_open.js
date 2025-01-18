
// Usage example:
const gameState = new Game();
gameState.states.PackOpen = new PackOpenState(gameState);

// Transition to pack opening state
gameState.transitionToState('PackOpen', {
packImage: 'A1m.png',
contents: ['card1', 'card2', 'card3'],
onComplete: (contents) => {
    // Transition to next state, like displaying cards
    gameState.transitionToState('ShowCards', { cards: contents });
}
});