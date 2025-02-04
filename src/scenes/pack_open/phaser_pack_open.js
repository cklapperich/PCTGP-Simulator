//phaser_pack_open.js
import { PackAnimations } from './pack_animations.js';
const PackState = {
    INTERACTIVE: 'INTERACTIVE',
    ANIMATING: 'ANIMATING'
};

export class PackOpenScene extends Phaser.Scene {
    static PACKART_SCALE = 0.8; // Pack art should take up 80% of container height
    static CARD_MARGIN = 20;  // Default margin for card positioning

    constructor() {
        super({ key: 'PackOpenScene' });
        this.state = PackState.INTERACTIVE;
        this.sprites = {
            background: null,
            pack: null,
            packTop: null,
            packBottom: null,
            card: null,
            energyIcon: null
        };
        this.cardCounterText = null;
    }

    init(data) {
        // Store direct references to IDs which are our texture keys
        this.packId = data.packId;
        this.cardData = data.cards;
        this.backgroundKey = data.backgroundKey || null; // Make background optional
        this.config = data.UIConfig;
    }

    create() {
        // Create a container sized according to base resolution and scale
        this.gameContainer = this.add.container(0, 0);
        this.gameContainer.width = this.config.BASE_RESOLUTION[0] * this.config.GLOBAL_SCALE;
        this.gameContainer.height = this.config.BASE_RESOLUTION[1] * this.config.GLOBAL_SCALE;
        
        // Add debug border around container
        const border = this.add.rectangle(0, 0, this.gameContainer.width, this.gameContainer.height);
        border.setStrokeStyle(4, 0xFFFFFF);
        border.setOrigin(0, 0);
        this.gameContainer.add(border);
        
        this.setupBackground();
        this.setupSprites();
        this.setupEnergyIcon();
        this.setupCardCounter();
        this.setupInteractions();
        this.setupKeyboardControls();
        this.animations = new PackAnimations(this, this.gameContainer);
    }

    setupBackground() {
        // Create black background
        this.sprites.background = this.add.rectangle(0, 0, this.gameContainer.width, this.gameContainer.height, 0x000000);
        this.sprites.background.setOrigin(0, 0);
        this.gameContainer.add(this.sprites.background);
    }

    setupEnergyIcon() {
        const iconKey = this.config.icons.energy.key;
        this.sprites.energyIcon = this.add.sprite(
            this.gameContainer.width,  // Right edge
            this.gameContainer.height, // Bottom edge
            iconKey
        );
        this.sprites.energyIcon.setOrigin(1, 1); // Set origin to bottom-right
        this.sprites.energyIcon.setScale(0.5 * this.config.GLOBAL_SCALE);
        this.gameContainer.add(this.sprites.energyIcon);
    }

    setupCardCounter() {
        // Create card counter text
        this.cardCounterText = this.add.text(
            this.gameContainer.width / 2,  // center horizontally
            PackOpenScene.CARD_MARGIN * this.config.GLOBAL_SCALE,  // margin from top
            '',  // Initial empty text
            {
                fontFamily: this.config.fonts.pokemon,
                fontSize: 48 * this.config.GLOBAL_SCALE,
                color: '#FFFFFF'
            }
        );
        this.cardCounterText.setOrigin(0.5, 0);  // Center align horizontally, top align vertically
        this.gameContainer.add(this.cardCounterText);
    }

    scaleSprite(sprite, targetScale) {
        if (!sprite) return;
        
        const availableHeight = this.gameContainer.height;
        const scale = (availableHeight * targetScale) / sprite.height;
        sprite.setScale(scale);
    }

    setupSprites() {
        // Use the provided texture key for pack
        this.sprites.pack = this.add.sprite(0, 0, this.packId);
        this.sprites.pack.setOrigin(0, 0);
        this.scaleSprite(this.sprites.pack, PackOpenScene.PACKART_SCALE * this.config.GLOBAL_SCALE);
        
        // Center pack in container
        const packWidth = this.sprites.pack.width * this.sprites.pack.scaleX;
        const packHeight = this.sprites.pack.height * this.sprites.pack.scaleY;
        this.sprites.pack.x = (this.gameContainer.width - packWidth) / 2;
        this.sprites.pack.y = (this.gameContainer.height - packHeight) / 2;
        
        // Setup card sprite
        this.sprites.card = this.add.sprite(
            this.gameContainer.width / 2,  // Center horizontally
            this.gameContainer.height * 0.6 - PackOpenScene.CARD_MARGIN * this.config.GLOBAL_SCALE,  // Lower in container with margin
            ''
        );
        this.sprites.card.setOrigin(0.5);  // Center anchor point
        this.sprites.card.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);
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

        await this.pause(100); // Add 100ms delay
        this.plugins.get('SoundManager').playRandomizedSound('card1');

        const currentCard = this.cardData[this.currentCardIndex];
        const textureKey = currentCard.id;

        if (!textureKey || !this.textures.exists(textureKey)) {
            console.error(`Texture not found for card ID: ${currentCard.id}`);
            return;
        }

        // Update card counter text (removed "Card" prefix)
        this.cardCounterText.setText(`${this.currentCardIndex + 1}/${this.cardData.length}`);

        this.sprites.card.setTexture(textureKey);
        this.sprites.card.setScale(this.config.GLOBAL_SCALE);
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
