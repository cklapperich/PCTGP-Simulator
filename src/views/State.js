// Base state class that all game states extend from
export class State {
    constructor(game) {
      this.game = game;  // Reference to game controller
    }
    
    enter() { /* Setup when state becomes active */ }
    exit() { /* Cleanup when leaving state */ }
    update() { /* Run each frame */ }
    render() { /* Draw to canvas */ }
    handleInput() { /* Process user input */ }
}
