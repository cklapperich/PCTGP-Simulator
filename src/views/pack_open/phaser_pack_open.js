import {PackAnimations} from './pack_animations.js';
const CONTAINER_CONFIG = {
    WIDTH: 1000,      // Base container width
    HEIGHT: 800,      // Base container height
    CARD_SCALE: 0.7,  // Cards take 70% of container height
    PACK_SCALE: 0.84, // Pack scale = card scale * 1.2
};

class PackOpenScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PackOpenScene' });
        this.state = {
            currentPack: null,
            currentCardIndex: -1,
            isPackOpened: false
        };
        this.sprites = {
            pack: null,
            packTop: null,
            packBottom: null,
            card: null
        };
    }

    init(data) {
        this.packArtPath = data.packArtPath;
        this.cardData = data.cardData;
        this.cardArtPaths = data.cardArtPaths;
    }

    async preload() {
        this.setupLoadingHandlers();
        await this.loadPackArt();
    }

    setupLoadingHandlers() {
        this.load.on('start', () => console.log('Loading started'));
        this.load.on('progress', (value) => console.log('Loading progress:', value));
        this.load.on('complete', () => console.log('All assets loaded successfully'));
        this.load.on('loaderror', (fileObj) => {
            console.error('Error loading file:', {
                key: fileObj.key,
                src: fileObj.src,
                type: fileObj.type
            });
        });
    }

    async loadPackArt() {
        const packartKey = 'pack-sprite';
        this.load.image(packartKey, this.packArtPath);
        
        await new Promise((resolve) => {
            this.load.once('complete', resolve);
            this.load.start();
        });
    }

    create() {
        this.setupContainer();
        this.setupSprites();
        this.setupInteractions();
        this.setupKeyboardControls();
        this.scale.on('resize', this.handleResize, this);
        this.animations = new PackAnimations(this, this.gameContainer);
    }

    setupContainer() {
        this.gameContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.gameContainer.setSize(CONTAINER_CONFIG.WIDTH, CONTAINER_CONFIG.HEIGHT);
    }

    scaleSprite(sprite, targetScale) {
        if (!sprite) return;
        
        if (sprite === this.sprites.card) {
            const STANDARD_CARD_HEIGHT = 512;
            const heightScale = STANDARD_CARD_HEIGHT / sprite.height;
            sprite.setScale(heightScale);
            return;
        }
        
        const availableHeight = this.scale.height * 0.9;
        const scale = (availableHeight * targetScale) / sprite.height;
        sprite.setScale(scale);
    }

    setupInteractions() {
        this.sprites.pack.setInteractive({ cursor: 'pointer' });
        this.sprites.pack.on('pointerdown', () => this.handlePackOpen());

        this.sprites.card.setInteractive({ cursor: 'pointer' });
        this.sprites.card.on('pointerdown', () => this.nextCard());
    }

    setupKeyboardControls() {
        this.input.keyboard.on('keydown-RIGHT', () => {
            if (this.state.isPackOpened) this.nextCard();
        });
        this.input.keyboard.on('keydown-SPACE', () => {
            if (this.state.isPackOpened) this.nextCard();
        });
        this.input.keyboard.on('keydown-LEFT', () => {
            if (this.state.isPackOpened) this.previousCard();
        });
    }

    handleResize(gameSize) {
        this.gameContainer.x = gameSize.width / 2;
        this.gameContainer.y = gameSize.height / 2;
        
        if (this.sprites.pack?.visible) {
            this.scaleSprite(this.sprites.pack, CONTAINER_CONFIG.PACK_SCALE);
        }
        if (this.sprites.card?.visible) {
            this.scaleSprite(this.sprites.card, CONTAINER_CONFIG.CARD_SCALE);
        }
    }

    async handlePackOpen() {
        if (this.state.isPackOpened) return;

        try {
            await this.animations.animatePackOpening();
            await this.showFirstCard();
        } catch (error) {
            console.error('Failed to open pack:', error);
        }
    }

    setupSprites() {
        this.sprites.pack = this.add.sprite(0, 0, 'pack-sprite');
        this.sprites.pack.setOrigin(0, 0);
        this.scaleSprite(this.sprites.pack, CONTAINER_CONFIG.PACK_SCALE);
        
        const packWidth = this.sprites.pack.width * this.sprites.pack.scaleX;
        const packHeight = this.sprites.pack.height * this.sprites.pack.scaleY;
        this.sprites.pack.x = -packWidth / 2;
        this.sprites.pack.y = -packHeight / 2;
        
        this.sprites.card = this.add.sprite(0, 0, '');
        this.sprites.card.setVisible(false);
        
        this.gameContainer.add([this.sprites.pack, this.sprites.card]);
    }

    pause(duration) {
        return new Promise(resolve => {
            this.time.delayedCall(duration, resolve);
        });
    }

    async showFirstCard() {
        this.state.currentPack = this.cardData;
        this.state.currentCardIndex = 0;
        this.state.isPackOpened = true;
        await this.updateCardDisplay();
    }

    async updateCardDisplay() {
        if (!this.state.currentPack || this.state.currentCardIndex < 0) return;

        const currentCard = this.state.currentPack[this.state.currentCardIndex];
        const cardKey = `card-${currentCard.id}`;

        if (!this.textures.exists(cardKey)) {
            try {
                const cardPath = this.cardArtPaths[currentCard.id];
                
                this.load.image(cardKey, cardPath, {
                    antialias: false
                });
                await new Promise((resolve, reject) => {
                    this.load.once('complete', resolve);
                    this.load.once('loaderror', reject);
                    this.load.start();
                });
            } catch (error) {
                console.error('Failed to load card texture:', error);
                return;
            }
        }

        this.sprites.card.setTexture(cardKey);
        this.scaleSprite(this.sprites.card, CONTAINER_CONFIG.CARD_SCALE);
        this.sprites.card.setVisible(true);
    }

    nextCard() {
        if (this.state.currentCardIndex < this.state.currentPack.length - 1) {
            this.state.currentCardIndex++;
            this.updateCardDisplay();
        }
    }

    previousCard() {
        if (this.state.currentCardIndex > 0) {
            this.state.currentCardIndex--;
            this.updateCardDisplay();
        }
    }
}

export { PackOpenScene};