import CardRenderer from '../../../plugins/CardRenderer.js';

class CardRendererTestScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CardRendererTestScene' });
    }
    
    preload() {
        this.load.image('card', '../../../../assets/cardart/A1/A1-001.png');
    }

    create() {
        const gameWidth = this.game.config.width;
        const gameHeight = this.game.config.height;
        
        // Add a background to see our game bounds
        this.add.rectangle(400, 300, 800, 600, 0x333333);
        
        // Add a white border around the game window
        this.add.rectangle(gameWidth/2, gameHeight/2, gameWidth, gameHeight)
            .setStrokeStyle(2, 0xffffff);
        
        // Create our card renderer
        this.cardRenderer = new CardRenderer(this);
        
        const targetHeight = 200;
        
        // Create a card with top-left corner at center of screen (400,300)
        const rt = this.cardRenderer.createCard('card', 400, 300, {
            height: targetHeight,
            centered: false,
            debug: true
        });
        
        // Add a crosshair at the center point
        const crosshairSize = 20;
        const crosshairColor = 0x00ff00;
        
        // Horizontal line
        this.add.line(400, 300, -crosshairSize/2, 0, crosshairSize/2, 0, crosshairColor);
        // Vertical line
        this.add.line(400, 300, 0, -crosshairSize/2, 0, crosshairSize/2, crosshairColor);
        
        // Add game window debug info
        const debugY = gameHeight - 60;
        this.add.text(10, debugY, [
            `Game Window: ${gameWidth}x${gameHeight}`,
            `Card height: ${targetHeight}px (${((targetHeight/gameHeight)*100).toFixed(1)}% of screen height)`
        ].join('\n'), { 
            color: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-container',
        width: 1600,
        height: 1200,
    },
    pixelArt: false,
    scene: CardRendererTestScene
};

const game = new Phaser.Game(config);
