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
    SPLIT_PAUSE: 800,        // Pause after initial split
    DISSOLVE_DURATION: 600,     // Final separation animation
    SPLIT_DISTANCE: 0.03,    // Initial split (5% of container)
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
            card: null,
            // Add debug rectangles
            topRect: null,
            bottomRect: null
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
        // Container still centered in game window
        this.gameContainer = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.gameContainer.setSize(CONTAINER_CONFIG.WIDTH, CONTAINER_CONFIG.HEIGHT);
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
    setupSprites() {
        // Center pack in container
        this.sprites.pack = this.add.sprite(0, 0, 'pack-sprite');
        this.sprites.pack.setOrigin(0, 0);
        this.scaleSprite(this.sprites.pack, CONTAINER_CONFIG.PACK_SCALE);
        
        // Calculate offset to center the pack in container
        const packWidth = this.sprites.pack.width * this.sprites.pack.scaleX;
        const packHeight = this.sprites.pack.height * this.sprites.pack.scaleY;
        this.sprites.pack.x = -packWidth / 2;
        this.sprites.pack.y = -packHeight / 2;
        
        // Initialize card sprite (hidden initially)
        this.sprites.card = this.add.sprite(0, 0, '');
        this.sprites.card.setVisible(false);
        
        this.gameContainer.add([this.sprites.pack, this.sprites.card]);
    }
    
    createSplitPieces() {
        const texture = this.textures.get('pack-sprite');
        const splitPoint = 0.23;  // This controls where the texture is split
        const height = texture.source[0].height;
        const splitY = height * splitPoint;
        
        // Get original pack position
        const packX = this.sprites.pack.x;
        const packY = this.sprites.pack.y;
        const packScale = this.sprites.pack.scale;
        
        // Calculate gap size using SPLIT_DISTANCE
        const gapSize = CONTAINER_CONFIG.HEIGHT * ANIMATION_CONFIG.SPLIT_DISTANCE;
        
        // Create bottom piece - stays at original position
        this.sprites.packBottom = this.add.sprite(packX, packY, 'pack-sprite');
        this.sprites.packBottom.setOrigin(0, 0);
        this.sprites.packBottom.setCrop(0, splitY, texture.source[0].width, height - splitY);
        this.sprites.packBottom.setScale(packScale);
        
        // Create top piece - move up by gap size
        this.sprites.packTop = this.add.sprite(packX, packY - gapSize, 'pack-sprite');
        this.sprites.packTop.setOrigin(0, 0);
        this.sprites.packTop.setCrop(0, 0, texture.source[0].width, splitY);
        this.sprites.packTop.setScale(packScale);
        
        // Add both pieces to the container and hide original pack
        this.gameContainer.add([this.sprites.packBottom, this.sprites.packTop]);
        this.sprites.pack.setVisible(false);
    
        // Return coordinates for debug rectangles - these stay at the logically correct positions
        return {
            top: {
                x: packX,
                y: packY - gapSize,
                width: texture.source[0].width * packScale,
                height: splitY * packScale
            },
            bottom: {
                x: packX,
                y: packY + (splitY * packScale),  // Rectangle shows true position
                width: texture.source[0].width * packScale,
                height: (height - splitY) * packScale
            }
        };
    }

    async animatePackOpening() {
        await this.createFlashEffect();
        await this.pause(ANIMATION_CONFIG.INITIAL_PAUSE);
        
        const coords = this.createSplitPieces();
        
        // Calculate texture split points
        const texture = this.textures.get('pack-sprite');
        const splitPoint = 0.23;
        const textureHeight = texture.source[0].height;
        const splitY = Math.floor(textureHeight * splitPoint);
    
        // Calculate bounds exactly
        const packScale = this.sprites.pack.scale;
        const packX = this.sprites.pack.x;
        const packY = this.sprites.pack.y;
        const gapSize = CONTAINER_CONFIG.HEIGHT * ANIMATION_CONFIG.SPLIT_DISTANCE;
    
        const topBounds = {
            x: packX + (texture.source[0].width * packScale) / 2,
            y: (packY - gapSize) + (splitY * packScale) / 2,
            width: texture.source[0].width * packScale,
            height: splitY * packScale
        };
    
        const bottomBounds = {
            x: packX + (texture.source[0].width * packScale) / 2,
            y: packY + (splitY * packScale) + ((textureHeight - splitY) * packScale) / 2,
            width: texture.source[0].width * packScale,
            height: (textureHeight - splitY) * packScale
        };
        await this.pause(ANIMATION_CONFIG.SPLIT_PAUSE);
        this.sprites.packTop.setVisible(false);
        this.sprites.packBottom.setVisible(false);

        // Dissolve both pieces simultaneously
        await Promise.all([
            // Dissolve top piece
            this.animatePixelDissolve(
                topBounds,
                this.sprites.packTop,
                0,  // Start at top of texture
                splitY  // Use top portion height
            ),
            // Dissolve bottom piece
            this.animatePixelDissolve(
                bottomBounds,
                this.sprites.packBottom,
                splitY,  // Start at split point
                textureHeight - splitY  // Use remaining height
            )
        ]);
    
        // Clean up sprites after dissolution
        this.sprites.packTop.destroy();
        this.sprites.packBottom.destroy();
    }
    async animatePixelDissolve(bounds, sourceSprite, textureStartY, textureHeight) {
        const PIXEL_SIZE = ANIMATION_CONFIG.PIXEL_SIZE;
        const pixels = [];
        
        // Get pack texture for color sampling
        const texture = this.textures.get('pack-sprite');
        const textureWidth = texture.source[0].width;
        
        // Create a temporary canvas for color sampling
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = textureWidth;
        canvas.height = texture.source[0].height;
        ctx.drawImage(texture.source[0].image, 0, 0);
        
        // Calculate grid dimensions based on bounds
        const gridWidth = Math.ceil(bounds.width / PIXEL_SIZE);
        const gridHeight = Math.ceil(bounds.height / PIXEL_SIZE);
        
        // Calculate target area bounds
        const targetLeft = bounds.x - bounds.width / 2;
        const targetTop = bounds.y - bounds.height / 2;
        
        // Create grid of rectangles covering the target area
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                // Calculate position in world space
                const worldX = targetLeft + (x * PIXEL_SIZE);
                const worldY = targetTop + (y * PIXEL_SIZE);
                
                // Sample color from appropriate part of texture
                const textureX = Math.floor((x / gridWidth) * textureWidth);
                const textureY = textureStartY + Math.floor((y / gridHeight) * textureHeight);
                const pixelData = ctx.getImageData(textureX, textureY, 1, 1).data;
                const color = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                
                const pixel = this.add.rectangle(
                    worldX,
                    worldY,
                    PIXEL_SIZE,
                    PIXEL_SIZE,
                    color
                );
                pixels.push(pixel);
                this.gameContainer.add(pixel);
            }
        }
        
        // Randomly remove pixels over time
        const totalDuration = ANIMATION_CONFIG.DISSOLVE_DURATION;
        const pixelsPerFrame = Math.ceil(pixels.length / (totalDuration / ANIMATION_CONFIG.DISSOLVE_FRAME_TIME));
        
        await new Promise(resolve => {
            let remainingPixels = [...pixels];
            
            const dissolveInterval = setInterval(() => {
                for (let i = 0; i < pixelsPerFrame; i++) {
                    if (remainingPixels.length === 0) {
                        clearInterval(dissolveInterval);
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
 