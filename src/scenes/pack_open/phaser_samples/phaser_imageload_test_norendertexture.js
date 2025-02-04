class CardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CardScene' });
    }
    
    preload() {
        this.load.image('card', '../../../../assets/cardart/A1/A1-001.png');
    }

    create() {
        // Create a high-res render texture
        const rt = this.add.renderTexture(0, 0, 400,300);
        
        // Draw the card at full resolution (1.0 scale)
        const originalCard = this.add.image(0, 0, 'card');
        originalCard.setOrigin(0, 0);
        originalCard.setScale(1);
        rt.draw(originalCard);
        
        // Hide the original card (we only used it to draw to the texture)
        originalCard.setVisible(false);
        
        // Create a sprite using this render texture as our display window
        const displaySprite = this.add.sprite(400, 300, rt);
        displaySprite.setScale(0.1); // Scale down to desired display size
        
        // Add some debug info
        this.add.text(10, 10, 'Original texture size: ' + originalCard.width + 'x' + originalCard.height, { color: '#ffffff' });
        this.add.text(10, 30, 'RenderTexture size: 2000x3000', { color: '#ffffff' });
        this.add.text(10, 50, 'Display scale: 0.1', { color: '#ffffff' });
    }
}

const config = {
    type: Phaser.WEBGL,
    parent: 'phaser-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'phaser-container',
        width: 800,
        height: 600,
    },
    pixelArt: false, // Changed to false since we want smooth scaling
    scene: CardScene
};
