class CardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CardScene' });
    }
    
    preload() {
        this.load.image('card', '../../../../assets/cardart/A1/A1-001.png');
    }

    create() {
        // Add a background rectangle to see our game bounds
        this.add.rectangle(400, 300, 800, 600, 0x333333);
        
        // First create and measure the original card
        const originalCard = this.add.image(400, 300, 'card');
        originalCard.setOrigin(0.5, 0.5); // Center the original card
        
        // Get the actual dimensions
        const width = originalCard.width;
        const height = originalCard.height;
        
        // Create a render texture at the center
        const rt = this.add.renderTexture(400, 300, width, height);
        rt.setOrigin(0.5, 0.5); // Center the render texture
        
        // Clear and fill with a color so we can see its bounds
        rt.clear();
        rt.fill(0xff0000, 0.2); // semi-transparent red
        
        // Draw the card into the render texture at its center
        rt.draw(originalCard, width/2, height/2);
        
        // Hide the original
        originalCard.setVisible(false);
        
        // Calculate scale to fit nicely in the window
        // Let's say we want it to take up about 80% of the game height
        const targetHeight = 600 * 0.4; // 80% of game height
        const scale = targetHeight / height;
        
        // Set the render texture's scale
        rt.setScale(1.0);
        
        // Add debug info
        this.add.text(10, 10, `Original card size: ${width}x${height}`, { color: '#ffffff' });
        this.add.text(10, 30, `RenderTexture size: ${rt.width}x${rt.height}`, { color: '#ffffff' });
        this.add.text(10, 50, `Scale: ${scale}`, { color: '#ffffff' });
    }
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-container',
        width: 800,
        height: 600,
    },
    zoom:5,
    pixelArt: false,
    scene: CardScene
};

const game = new Phaser.Game(config);
