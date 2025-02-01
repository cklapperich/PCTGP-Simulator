// Configuration constants
const CONTAINER_CONFIG = {
    WIDTH: 1000,      // Base container width
    HEIGHT: 800,      // Base container height
    CARD_SCALE: 0.7,  // Cards take 70% of container height
    PACK_SCALE: 0.84, // Pack scale = card scale * 1.2
};

const ANIMATION_CONFIG = {
    FLASH_DURATION: 200,     // Flash effect duration
    INITIAL_PAUSE: 300,      // Pause after flash
    SPLIT_PAUSE: 400,        // Pause after initial split
    SPLIT_DURATION: 600,     // Final separation animation
    FADE_DURATION: 400,      // Final fade out
    SPLIT_DISTANCE: 0.00,    // Initial split (5% of container)
    PIXEL_SIZE: 8,          // Size of each "pixel" in dissolve effect
    DISSOLVE_FRAME_TIME: 16.67 // ~60fps
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
        // Get pre-loaded data from the game
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
    }

    setupContainer() {
        // Create main container centered in the game
        this.gameContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.gameContainer.setSize(CONTAINER_CONFIG.WIDTH, CONTAINER_CONFIG.HEIGHT);
        
        // Set container origin to center
        this.gameContainer.x = this.scale.width / 2;
        this.gameContainer.y = this.scale.height / 2;
    }

    setupSprites() {
        // Setup pack sprite
        this.sprites.pack = this.add.sprite(0, 0, 'pack-sprite');
        this.scaleSprite(this.sprites.pack, CONTAINER_CONFIG.PACK_SCALE);
        this.gameContainer.add(this.sprites.pack);
        
        // Setup card sprite (initially hidden)
        this.sprites.card = this.add.sprite(0, 0, '');
        this.sprites.card.setVisible(false);
        this.gameContainer.add(this.sprites.card);
    }

    scaleSprite(sprite, targetScale) {
        if (!sprite) return;
        
        if (sprite === this.sprites.card) {
            // For cards, scale based on height to maintain 512px height
            const STANDARD_CARD_HEIGHT = 512;
            const heightScale = STANDARD_CARD_HEIGHT / sprite.height;
            sprite.setScale(heightScale);
            return;
        }
        
        // For pack art and other sprites, use dynamic scaling
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
        // Update container position
        this.gameContainer.x = gameSize.width / 2;
        this.gameContainer.y = gameSize.height / 2;
        
        // Rescale visible sprites
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
            await this.animatePackOpening();
            await this.showFirstCard();
        } catch (error) {
            console.error('Failed to open pack:', error);
        }
    }

    createFlashEffect() {
        return new Promise(resolve => {
            // Create flash sprite at pack position with pack dimensions
            const flash = this.add.rectangle(
                0, 0,
                this.sprites.pack.width * this.sprites.pack.scaleX,
                this.sprites.pack.height * this.sprites.pack.scaleY,
                0xffffff
            );
            flash.setOrigin(0.5);
            this.gameContainer.add(flash);
            flash.setAlpha(0);

            this.tweens.add({
                targets: flash,
                alpha: { from: 0.8, to: 0 },
                duration: ANIMATION_CONFIG.FLASH_DURATION,
                onComplete: () => {
                    flash.destroy();
                    resolve();
                }
            });
        });
    }

    pause(duration) {
        return new Promise(resolve => {
            this.time.delayedCall(duration, resolve);
        });
    }

    createSplitPieces() {
        const texture = this.textures.get('pack-sprite');
        const splitPoint = 0.23; // Split at 23% from top
        const height = texture.source[0].height;
        const splitY = height * splitPoint;
        
        // Create top and bottom pieces
        this.sprites.packTop = this.add.sprite(0, 0, 'pack-sprite');
        this.sprites.packBottom = this.add.sprite(0, 0, 'pack-sprite');
        
        // Set crop for each piece
        this.sprites.packTop.setCrop(0, 0, texture.source[0].width, splitY);
        this.sprites.packBottom.setCrop(0, splitY, texture.source[0].width, height - splitY);
        
        // Scale pieces to match original pack
        const packScale = this.sprites.pack.scale;
        this.sprites.packTop.setScale(packScale);
        this.sprites.packBottom.setScale(packScale);
        
        // Add to container
        this.gameContainer.add([this.sprites.packTop, this.sprites.packBottom]);
        
        // Hide original pack sprite
        this.sprites.pack.setVisible(false);
    }

    async animatePixelDissolve() {
        const PIXEL_SIZE = ANIMATION_CONFIG.PIXEL_SIZE;
        const pixels = [];
        
        // Get pack texture for color sampling
        const texture = this.textures.get('pack-sprite');
        const textureWidth = texture.source[0].width;
        const textureHeight = texture.source[0].height;
        
        // Create a temporary canvas for color sampling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = textureWidth;
        canvas.height = textureHeight;
        ctx.drawImage(texture.source[0].image, 0, 0);
        
        // Calculate grid dimensions based on pack sprite size
        const gridWidth = Math.ceil(this.sprites.pack.width * this.sprites.pack.scaleX / PIXEL_SIZE);
        const gridHeight = Math.ceil(this.sprites.pack.height * this.sprites.pack.scaleY / PIXEL_SIZE);
        
        // Create grid of rectangles covering the pack
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                // Sample color from texture at this position
                const textureX = Math.floor((x / gridWidth) * textureWidth);
                const textureY = Math.floor((y / gridHeight) * textureHeight);
                const pixelData = ctx.getImageData(textureX, textureY, 1, 1).data;
                const color = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                
                const pixel = this.add.rectangle(
                    (x - gridWidth/2) * PIXEL_SIZE,
                    (y - gridHeight/2) * PIXEL_SIZE,
                    PIXEL_SIZE,
                    PIXEL_SIZE,
                    color
                );
                pixels.push(pixel);
                this.gameContainer.add(pixel);
            }
        }
        
        // Hide original pack sprite but keep it for reference
        this.sprites.pack.setVisible(false);
        
        // Randomly remove pixels over time
        const totalDuration = ANIMATION_CONFIG.SPLIT_DURATION;
        const pixelsPerFrame = Math.ceil(pixels.length / (totalDuration / ANIMATION_CONFIG.DISSOLVE_FRAME_TIME));
        
        await new Promise(resolve => {
            let remainingPixels = [...pixels];
            
            const dissolveInterval = setInterval(() => {
                for (let i = 0; i < pixelsPerFrame; i++) {
                    if (remainingPixels.length === 0) {
                        clearInterval(dissolveInterval);
                        this.sprites.pack.destroy();
                        pixels.forEach(p => p.destroy());
                        resolve();
                        return;
                    }
                    
                    // Remove random pixel
                    const index = Math.floor(Math.random() * remainingPixels.length);
                    const pixel = remainingPixels[index];
                    remainingPixels.splice(index, 1);
                    
                    // Fade out the pixel
                    this.tweens.add({
                        targets: pixel,
                        alpha: 0,
                        duration: 100,
                        onComplete: () => pixel.destroy()
                    });
                }
            }, ANIMATION_CONFIG.DISSOLVE_FRAME_TIME);
        });
    }

    async animatePackOpening() {
        // 1. Flash effect and initial pause
        await this.createFlashEffect();
        await this.pause(ANIMATION_CONFIG.INITIAL_PAUSE);
        
        // 2. Create split pieces and animate split
        this.createSplitPieces();
        
        // 3. Initial split animation
        await Promise.all([
            new Promise(resolve => {
                this.tweens.add({
                    targets: this.sprites.packTop,
                    y: -CONTAINER_CONFIG.HEIGHT * ANIMATION_CONFIG.SPLIT_DISTANCE,
                    duration: ANIMATION_CONFIG.SPLIT_DURATION / 3,
                    ease: 'Power1',
                    onComplete: resolve
                });
            }),
            new Promise(resolve => {
                this.tweens.add({
                    targets: this.sprites.packBottom,
                    y: CONTAINER_CONFIG.HEIGHT * ANIMATION_CONFIG.SPLIT_DISTANCE,
                    duration: ANIMATION_CONFIG.SPLIT_DURATION / 3,
                    ease: 'Power1',
                    onComplete: resolve
                });
            })
        ]);

        // 4. Pause before dissolve
        await this.pause(ANIMATION_CONFIG.SPLIT_PAUSE);

        // 5. Destroy split pieces and create pixel dissolve effect
        this.sprites.packTop.destroy();
        this.sprites.packBottom.destroy();
        this.sprites.pack.setVisible(true);
        
        // 6. Animate pixel dissolve
        await this.animatePixelDissolve();
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
                    antialias: false  // Enable antialiasing for card textures
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

export { PackOpenScene };
 