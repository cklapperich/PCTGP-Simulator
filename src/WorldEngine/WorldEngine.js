import GameState from './GameState.js';

class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
        // Store the singleton instance
        const gameStateInstance = new GameState();
        this.gameState = gameStateInstance;
    }

    init(data) {
        this.currentLevel = data.level || 'assets/worlds/world1/tiled/0001_Level_0.tmx';
        
        const savedPos = this.gameState?.position;
        if (savedPos?.level === this.currentLevel) {
            this.startX = savedPos.x;
            this.startY = savedPos.y;
        } else {
            this.startX = data.startX || 0;
            this.startY = data.startY || 0;
        }
    }

    preload() {
        // Load just the TMX file first
        this.load.tilemapTiledJSON(this.currentLevel, this.currentLevel);
    }

    create() {
        // Create the tilemap from the TMX file
        const map = this.make.tilemap({ key: this.currentLevel });
        
        // Load all tilesets from the map data
        const tilesets = map.tilesets;
        const loadedTilesets = {};

        // Load each tileset and store the created tileset object
        tilesets.forEach(tileset => {
            // The source path is relative to the TMX file location
            const tilesetKey = tileset.name;
            
            // Load the image if it hasn't been loaded yet
            if (!this.textures.exists(tilesetKey)) {
                this.load.image(tilesetKey, tileset.image);
            }
            
            // We need to wait for any new images to load
            this.load.once('complete', () => {
                loadedTilesets[tilesetKey] = map.addTilesetImage(tileset.name, tilesetKey);
            });
            
            this.load.start();
        });

        // Create all layers from the map
        map.layers.forEach(layer => {
            const layerData = map.createLayer(layer.name, loadedTilesets);
            
            // Set collision for layers with collision properties
            if (layer.properties && layer.properties.some(p => p.name === 'collision' && p.value === true)) {
                layerData.setCollisionByProperty({ collides: true });
            }
        });
        
        // Setup camera bounds
        this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
        
        // Find and setup level transitions from object layer
        map.getObjectLayerNames().forEach(layerName => {
            const objects = map.getObjectLayer(layerName);
            if (!objects) return;
            
            objects.objects.forEach(object => {
                if (object.type === 'transition') {
                    const trigger = this.add.rectangle(
                        object.x + (object.width / 2),
                        object.y + (object.height / 2),
                        object.width,
                        object.height
                    );
                    
                    this.physics.add.existing(trigger, true);
                    
                    // Store the transition data
                    trigger.transitionData = {
                        targetLevel: object.properties.find(p => p.name === 'targetLevel')?.value,
                        targetX: object.properties.find(p => p.name === 'targetX')?.value,
                        targetY: object.properties.find(p => p.name === 'targetY')?.value
                    };
                }
            });
        });
    }

    update() {
        // We'll add player movement later
    }
}
