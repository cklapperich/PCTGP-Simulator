import { BattleSelectState } from './states/battleSelect/battleSelect.js';
import { BattleState } from './states/battle/battle.js';
import { State } from './states/State.js';

class Game {
  constructor() {
    this.currentState = null;
    this.states = {
      BattleSelect: new BattleSelectState(this),
      Battle: new BattleState(this)
    };
  }

  start() {
    // Start with battle select state
    this.transitionToState('BattleSelect');
  }

  transitionToState(stateName, stateData = null) {
    // Exit current state if one exists
    if (this.currentState) {
      this.currentState.exit();
    }

    // Enter new state with optional data
    this.currentState = this.states[stateName];
    this.currentState.enter(stateData);
  }

  update() {
    if (this.currentState) {
      this.currentState.update();
    }
  }

  render() {
    if (this.currentState) {
      this.currentState.render();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();

  // Set up game loop
  function gameLoop() {
    game.update();
    game.render();
    requestAnimationFrame(gameLoop);
  }
  
  gameLoop();
});
