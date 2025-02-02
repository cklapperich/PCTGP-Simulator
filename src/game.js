import Phaser from 'phaser'
import GameState from '@world/GameState.js'
import { WorldScene } from '@world/WorldEngineSimple.js'
import { World } from 'ldtk'

// Create game state instance
const gameState = new GameState();

// Load world data using proper asset path
const worldData = await World.loadRaw('/assets/worlds.ldtk');

const config = {
    type: Phaser.AUTO,
    resolution: window.devicePixelRatio, // Handle high DPI displays
    antialias: false,  // Smoother scaling for non-pixel art
    roundPixels: false, // Prevent pixel snapping which can cause blur
    scene: [WorldScene],
    pixelArt: false,
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
game.scene.start('WorldScene', { 
    gameState,
    world: worldData
});
