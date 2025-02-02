
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