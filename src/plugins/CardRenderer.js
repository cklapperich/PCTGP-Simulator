/**
 * High-quality card rendering utility for Phaser 3
 * Uses RenderTexture to maintain image quality while scaling
 */
class CardRenderer {
    /**
     * @param {Phaser.Scene} scene - The scene this renderer belongs to
     */
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Creates a high-quality card display
     * @param {string} cardKey - The texture key for the card image
     * @param {number} x - X position (center point if centered=true, top-left if centered=false)
     * @param {number} y - Y position (center point if centered=true, top-left if centered=false)
     * @param {Object} options
     * @param {boolean} options.centered - If true, x,y specify the center point. If false, x,y specify top-left (default: true)
     * @param {number} options.height - Desired height in pixels (maintains aspect ratio)
     * @param {boolean} options.debug - Show debug info
     * @returns {Phaser.RenderTexture} The render texture containing the card
     */
    createCard(cardKey, x, y, options = {}) {
        const gameWidth = this.scene.game.config.width;
        const gameHeight = this.scene.game.config.height;
        
        // Create temporary card to get dimensions
        const originalCard = this.scene.add.image(0, 0, cardKey);
        originalCard.setVisible(false);
        
        // Get dimensions
        const width = originalCard.width;
        const height = originalCard.height;
        
        // Calculate scale
        const targetHeight = options.height || (gameHeight * 0.4);
        const scale = targetHeight / height;
        
        // Calculate final dimensions after scaling
        const finalWidth = width * scale;
        const finalHeight = height * scale;
        
        // Create render texture at origin
        const rt = this.scene.add.renderTexture(0, 0, width, height);
        
        // Draw the card into the texture
        rt.clear();
        rt.draw(cardKey, 0, 0);
        
        // Set origin and position based on mode
        if (options.centered !== false) {
            rt.setOrigin(0.5, 0.5);
            rt.setPosition(x, y);
        } else {
            rt.setOrigin(0, 0);
            rt.setPosition(x, y);
        }
        
        // Apply scale
        rt.setScale(scale);
        
        // Clean up
        originalCard.destroy();
        
        // Add debug visualization if requested
        if (options.debug) {
            // Add debug rectangle that matches the positioning mode
            const debugRect = this.scene.add.rectangle(x, y, finalWidth, finalHeight)
                .setStrokeStyle(2, 0xffffff);
            
            if (options.centered !== false) {
                debugRect.setOrigin(0.5, 0.5);
            } else {
                debugRect.setOrigin(0, 0);
            }
            
            // Add debug text with enhanced info
            this.scene.add.text(10, 10, [
                `Original size: ${width}x${height}`,
                `Target height: ${targetHeight}px (${((targetHeight/gameHeight)*100).toFixed(1)}% of screen)`,
                `Final size: ${finalWidth.toFixed(1)}x${finalHeight.toFixed(1)}`,
                `Width: ${((finalWidth/gameWidth)*100).toFixed(1)}% of screen width`,
                `Height: ${((finalHeight/gameHeight)*100).toFixed(1)}% of screen height`,
                `Scale: ${scale.toFixed(3)}`,
                `Position mode: ${options.centered !== false ? 'centered' : 'top-left'}`,
                `Position: (${x}, ${y})`
            ].join('\n'), { 
                color: '#ffffff',
                backgroundColor: '#000000',
                padding: { x: 5, y: 5 }
            });
        }
        
        return rt;
    }
}

export default CardRenderer;
