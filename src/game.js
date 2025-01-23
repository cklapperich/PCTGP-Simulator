import GameState from './WorldEngine/GameState.js'
import {WorldScene} from './WorldEngine/WorldScene.js'

// Create game state instance
const gameState = new GameState();

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [WorldScene],
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true
        }
    }
};

const game = new Phaser.Game(config);
game.scene.start('WorldScene', { gameState });
