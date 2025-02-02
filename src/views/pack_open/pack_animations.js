const ANIMATION_CONFIG = {
    FLASH_DURATION: 200,     // Flash effect duration
    INITIAL_PAUSE: 300,      // Pause after flash
    SPLIT_PAUSE: 800,        // Pause after initial split
    DISSOLVE_DURATION: 600,  // Final separation animation
    SPLIT_DISTANCE: 0.03,    // Initial split (5% of container)
    PIXEL_SIZE: 8,          // Size of each "pixel" in dissolve effect
    DISSOLVE_FRAME_TIME: 16.67 // ~60fps
};

class PackAnimations {
    constructor(scene, container) {
        this.scene = scene;
        this.gameContainer = container;
    }

    createFlashEffect() {
        return new Promise(resolve => {
            const flash = this.scene.add.rectangle(
                0, 0,
                this.scene.sprites.pack.width * this.scene.sprites.pack.scaleX,
                this.scene.sprites.pack.height * this.scene.sprites.pack.scaleY,
                0xffffff
            );
            flash.setOrigin(0.5);
            this.gameContainer.add(flash);
            flash.setAlpha(0);

            this.scene.tweens.add({
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

    createSplitPieces() {
        const texture = this.scene.textures.get('pack-sprite');
        const splitPoint = 0.23;
        const height = texture.source[0].height;
        const splitY = height * splitPoint;
        
        const packX = this.scene.sprites.pack.x;
        const packY = this.scene.sprites.pack.y;
        const packScale = this.scene.sprites.pack.scale;
        
        const gapSize = this.scene.scale.height * ANIMATION_CONFIG.SPLIT_DISTANCE;
        
        this.scene.sprites.packBottom = this.scene.add.sprite(packX, packY, 'pack-sprite');
        this.scene.sprites.packBottom.setOrigin(0, 0);
        this.scene.sprites.packBottom.setCrop(0, splitY, texture.source[0].width, height - splitY);
        this.scene.sprites.packBottom.setScale(packScale);
        
        this.scene.sprites.packTop = this.scene.add.sprite(packX, packY - gapSize, 'pack-sprite');
        this.scene.sprites.packTop.setOrigin(0, 0);
        this.scene.sprites.packTop.setCrop(0, 0, texture.source[0].width, splitY);
        this.scene.sprites.packTop.setScale(packScale);
        
        this.gameContainer.add([this.scene.sprites.packBottom, this.scene.sprites.packTop]);
        this.scene.sprites.pack.setVisible(false);
    
        return {
            topBounds: {
                x: packX + (texture.source[0].width * packScale) / 2,
                y: (packY - gapSize) + (splitY * packScale) / 2,
                width: texture.source[0].width * packScale,
                height: splitY * packScale
            },
            bottomBounds: {
                x: packX + (texture.source[0].width * packScale) / 2,
                y: packY + (splitY * packScale) + ((height - splitY) * packScale) / 2,
                width: texture.source[0].width * packScale,
                height: (height - splitY) * packScale
            },
            splitY,
            textureHeight: height
        };
    }

    async animatePixelDissolve(bounds, sourceSprite, textureStartY, textureHeight) {
        const pixels = [];
        const texture = this.scene.textures.get('pack-sprite');
        const textureWidth = texture.source[0].width;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = textureWidth;
        canvas.height = texture.source[0].height;
        ctx.drawImage(texture.source[0].image, 0, 0);
        
        const gridWidth = Math.ceil(bounds.width / ANIMATION_CONFIG.PIXEL_SIZE);
        const gridHeight = Math.ceil(bounds.height / ANIMATION_CONFIG.PIXEL_SIZE);
        
        const targetLeft = bounds.x - bounds.width / 2;
        const targetTop = bounds.y - bounds.height / 2;
        
        for (let x = 0; x < gridWidth; x++) {
            for (let y = 0; y < gridHeight; y++) {
                const worldX = targetLeft + (x * ANIMATION_CONFIG.PIXEL_SIZE);
                const worldY = targetTop + (y * ANIMATION_CONFIG.PIXEL_SIZE);
                
                const textureX = Math.floor((x / gridWidth) * textureWidth);
                const textureY = textureStartY + Math.floor((y / gridHeight) * textureHeight);
                const pixelData = ctx.getImageData(textureX, textureY, 1, 1).data;
                const color = (pixelData[0] << 16) | (pixelData[1] << 8) | pixelData[2];
                
                const pixel = this.scene.add.rectangle(
                    worldX,
                    worldY,
                    ANIMATION_CONFIG.PIXEL_SIZE,
                    ANIMATION_CONFIG.PIXEL_SIZE,
                    color
                );
                pixels.push(pixel);
                this.gameContainer.add(pixel);
            }
        }
        
        await new Promise(resolve => {
            const pixelsPerFrame = Math.ceil(pixels.length / (ANIMATION_CONFIG.DISSOLVE_DURATION / ANIMATION_CONFIG.DISSOLVE_FRAME_TIME));
            let remainingPixels = [...pixels];
            
            const dissolveInterval = setInterval(() => {
                for (let i = 0; i < pixelsPerFrame; i++) {
                    if (remainingPixels.length === 0) {
                        clearInterval(dissolveInterval);
                        pixels.forEach(p => p.destroy());
                        resolve();
                        return;
                    }
                    
                    const index = Math.floor(Math.random() * remainingPixels.length);
                    const pixel = remainingPixels[index];
                    remainingPixels.splice(index, 1);
                    
                    this.scene.tweens.add({
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
        await this.createFlashEffect();
        await this.scene.pause(ANIMATION_CONFIG.INITIAL_PAUSE);
        
        const { topBounds, bottomBounds, splitY, textureHeight } = this.createSplitPieces();
        
        await this.scene.pause(ANIMATION_CONFIG.SPLIT_PAUSE);
        this.scene.sprites.packTop.setVisible(false);
        this.scene.sprites.packBottom.setVisible(false);

        await Promise.all([
            this.animatePixelDissolve(
                topBounds,
                this.scene.sprites.packTop,
                0,
                splitY
            ),
            this.animatePixelDissolve(
                bottomBounds,
                this.scene.sprites.packBottom,
                splitY,
                textureHeight - splitY
            )
        ]);
    
        this.scene.sprites.packTop.destroy();
        this.scene.sprites.packBottom.destroy();
    }
}

export {PackAnimations };