export class AssetLoader {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Set();
    }

    // Main loading method that handles different asset types
    async loadAssets(manifest) {
        // Extract all assets that need loading
        if (manifest.pack) {
            const packPath = `/packart/${manifest.pack.id}.png`;
            this.scene.load.image(manifest.pack.id, packPath);
            this.loadedAssets.add(manifest.pack.id);
        }

        if (manifest.cards) {
            manifest.cards.forEach(card => {
                // Extract setId from cardId (format: setId-CardNumber)
                const setId = card.id.split('-')[0];
                const cardPath = `/cardart/${setId}/${card.id}.png`;
                this.scene.load.image(card.id, cardPath);
                this.loadedAssets.add(card.id);
            });
        }

        // Handle background loading - supports both asset paths and texture keys
        if (manifest.background) {
            const { key, path } = manifest.background;
            if (path) {
                // Load from file path
                this.scene.load.image(key, path);
                this.loadedAssets.add(key);
            }
            // If no path provided, assume the texture is already loaded or will be provided dynamically
        }

        // Handle icon loading
        if (manifest.icons) {
            Object.values(manifest.icons).forEach(icon => {
                this.scene.load.image(icon.key, icon.path);
                this.loadedAssets.add(icon.key);
            });
        }

        // Load fonts
        if (manifest.fonts) {
            manifest.fonts.forEach(font => {
                this.scene.load.bitmapFont(font.key, font.textureURL, font.atlasURL);
                this.loadedAssets.add(font.key);
            });
        }

        // Start loading and wait for completion
        return new Promise((resolve, reject) => {
            this.scene.load.once('complete', resolve);
            this.scene.load.once('loaderror', reject);
            this.scene.load.start();
        });
    }

    // Unload all assets that were loaded through this loader
    unloadAssets() {
        this.loadedAssets.forEach(key => {
            if (this.scene.textures.exists(key)) {
                this.scene.textures.remove(key);
            }
        });
        this.loadedAssets.clear();
    }

    // Method to check if an asset is loaded
    isAssetLoaded(key) {
        return this.loadedAssets.has(key);
    }
}
