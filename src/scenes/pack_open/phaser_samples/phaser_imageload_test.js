//phaser_imageload_test.js
class CardScene extends Phaser.Scene {
    constructor() {
        super({ key: 'CardScene' });
    }
    
    preload() {
        this.load.image('card', '../../../assets/cardart/A1/A1-001.png');
    }

    create() {
        const card = this.add.image(400, 300, 'card');
        card.setOrigin(0.5);
        card.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
        card.setScale(0.5);
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: CardScene,
    pixelArt: true,
};

const game = new Phaser.Game(config);