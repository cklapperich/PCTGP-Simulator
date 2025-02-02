import { PackAnimations } from './pack_animations.js';
import { UIConfig, UIScenes} from '../../config/UIConfig.js';

const PackState = {
    INTERACTIVE: 'INTERACTIVE',
    ANIMATING: 'ANIMATING'
};

export class PackOpenScene extends Phaser.Scene {
    constructor() {
        super({ key: UIScenes.PACK_OPEN });
        this.state = PackState.INTERACTIVE;
        this.sprites = {
            background: null,
            pack: null,
            packTop: null,
            packBottom: null,
            card: null
        };
    }

    init(data) {
        // Store direct references to IDs which are our texture keys
        this.packId = data.packId;
        this.cardData = data.cards;
        this.backgroundKey = data.backgroundKey;
        this.config = UIConfig[UIScenes.PACK_OPEN];
    }

    create() { 
        this.setupContainer();
        this.setupBackground();
        this.setupSprites();
        this.setupInteractions();
        this.setupKeyboardControls();
        this.animations = new PackAnimations(this, this.gameContainer);
    }

    setupContainer() {
        // Calculate container size based on aspect ratio
        const { width: targetWidth, height: targetHeight } = this.config.aspectRatio;
        const scale = this.config.containerScale;
        
        // Calculate the container size while maintaining aspect ratio
        let containerWidth, containerHeight;
        const windowRatio = this.scale.width / this.scale.height;
        const targetRatio = targetWidth / targetHeight;
        
        if (windowRatio > targetRatio) {
            // Window is wider than target ratio
            containerHeight = this.scale.height * scale;
            containerWidth = containerHeight * targetRatio;
        } else {
            // Window is taller than target ratio
            containerWidth = this.scale.width * scale;
            containerHeight = containerWidth / targetRatio;
        }

        this.gameContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.gameContainer.setSize(containerWidth, containerHeight);
    }

    setupBackground() {
        // Create background sprite
        this.sprites.background = this.add.sprite(0, 0, this.backgroundKey);
        this.sprites.background.setOrigin(0.5);
        
        // Scale background to cover container
        const scaleX = this.gameContainer.width / this.sprites.background.width;
        const scaleY = this.gameContainer.height / this.sprites.background.height;
        const scale = Math.max(scaleX, scaleY);
        this.sprites.background.setScale(scale);
        
        this.gameContainer.add(this.sprites.background);
    }

    scaleSprite(sprite, targetScale, preventEnlarge = false) {
        if (!sprite) return;
        
        const availableHeight = this.gameContainer.height;
        const scale = (availableHeight * targetScale) / sprite.height;
        
        if (preventEnlarge) {
            // If preventing enlargement, cap at 1.0 scale
            sprite.setScale(Math.min(scale, 1.0));
        } else {
            sprite.setScale(scale);
        }
    }
    setupSprites() {
        // Use the provided texture key for pack
        this.sprites.pack = this.add.sprite(0, 0, this.packId);
        this.sprites.pack.setOrigin(0, 0);
        this.scaleSprite(this.sprites.pack, this.config.sprites.pack.heightScale, true);
        
        const packWidth = this.sprites.pack.width * this.sprites.pack.scaleX;
        const packHeight = this.sprites.pack.height * this.sprites.pack.scaleY;
        this.sprites.pack.x = -packWidth / 2;
        this.sprites.pack.y = -packHeight / 2;
        
        this.sprites.card = this.add.sprite(0, 0, '');
        this.sprites.card.antialiasing = false;

        this.sprites.card.setVisible(false);
        
        this.gameContainer.add([this.sprites.pack, this.sprites.card]);
    }

    setupInteractions() {
        this.sprites.pack.setInteractive({ cursor: 'pointer' });
        this.sprites.pack.on('pointerdown', () => this.handlePackOpen());

        this.sprites.card.setInteractive({ cursor: 'pointer' });
        this.sprites.card.on('pointerdown', () => this.nextCard());
    }

    setupKeyboardControls() {
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.state === PackState.INTERACTIVE) this.nextCard();
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.state === PackState.INTERACTIVE) this.nextCard();
        });
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.state === PackState.INTERACTIVE) this.previousCard();
        });
    }

    async handlePackOpen() {
        if (this.state !== PackState.INTERACTIVE) return;

        try {
            this.state = PackState.ANIMATING;
            await this.animations.animatePackOpening();
            await this.showFirstCard();
        } catch (error) {
            console.error('Failed to open pack:', error);
            this.state = PackState.INTERACTIVE;
        }
    }

    pause(duration) {
        return new Promise(resolve => {
            this.time.delayedCall(duration, resolve);
        });
    }

    async showFirstCard() {
        this.currentCardIndex = 0;
        await this.updateCardDisplay();
        this.state = PackState.INTERACTIVE;
    }

    async updateCardDisplay() {
        if (!this.cardData || this.currentCardIndex < 0) return;

        const currentCard = this.cardData[this.currentCardIndex];
        const textureKey = currentCard.id;
        console.log('Texture size:', this.textures.get(textureKey).getSourceImage().width);
        console.log('Display size:', this.sprites.card.width * this.sprites.card.scaleX);
        console.log('Scale:', this.sprites.card.scaleX);
        if (!textureKey || !this.textures.exists(textureKey)) {
            console.error(`Texture not found for card ID: ${currentCard.id}`);
            return;
        }

        this.sprites.card.setTexture(textureKey);
        this.sprites.card.texture.setFilter(Phaser.Textures.LINEAR );
        this.scaleSprite(this.sprites.card, this.config.sprites.card.heightScale);
        const availableHeight = this.gameContainer.height;

        console.log('Container height when scaling sprite:', availableHeight);

        this.sprites.card.setVisible(true);
    }

    nextCard() {
        if (this.state !== PackState.INTERACTIVE) return;
        
        if (this.currentCardIndex < this.cardData.length - 1) {
            this.state = PackState.ANIMATING;
            this.currentCardIndex++;
            this.updateCardDisplay().then(() => {
                this.state = PackState.INTERACTIVE;
            });
        }
    }

    previousCard() {
        if (this.state !== PackState.INTERACTIVE) return;
        
        if (this.currentCardIndex > 0) {
            this.state = PackState.ANIMATING;
            this.currentCardIndex--;
            this.updateCardDisplay().then(() => {
                this.state = PackState.INTERACTIVE;
            });
        }
    }
}
