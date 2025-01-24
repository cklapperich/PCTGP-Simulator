import GameState from './GameState.js';
export class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
        const gameStateInstance = new GameState();
        this.gameState = gameStateInstance;
        this.levels = new Map(); // Store all loaded levels
    }

    init(data) {
        this.worldFile = data.world || '/assets/worlds/world1/world1.world';
        const savedPos = this.gameState?.position;
        if (savedPos) {
            this.startX = savedPos.x;
            this.startY = savedPos.y;
            this.currentLevelKey = savedPos.level;
        } else {
            this.startX = data.startX || 0;
            this.startY = data.startY || 0;
            this.currentLevelKey = '0001_Level_0'; // Default level
        }
    }

    preload() {
        // Load the world file
        this.load.json('worldData', this.worldFile);
    }

    async create() {
        const worldData = this.cache.json.get('worldData');
        const worldBasePath = this.worldFile.substring(0, this.worldFile.lastIndexOf('/') + 1);
        
        // Track all unique tilesets across all maps
        const globalTilesets = new Map();
        
        // First pass: Load all TMX files and collect tileset information
        await Promise.all(worldData.maps.map(async (mapInfo) => {
            const mapPath = worldBasePath + mapInfo.fileName;
            const mapKey = mapInfo.fileName.replace('.tmx', '');
            
            // Load the TMX file
            this.load.tilemapTiledJSON(mapKey, mapPath);
            await new Promise(resolve => {
                this.load.once('complete', resolve);
                this.load.start();
            });

            // Get tileset information from the loaded map
            const mapData = this.cache.json.get(mapKey);
            mapData.tilesets.forEach(tileset => {
                if (!globalTilesets.has(tileset.name)) {
                    globalTilesets.set(tileset.name, {
                        name: tileset.name,
                        image: this.getTilesetPath(tileset.image, worldBasePath)
                    });
                }
            });
        }));

        // Load all unique tileset images
        for (const tileset of globalTilesets.values()) {
            if (!this.textures.exists(tileset.name)) {
                this.load.image(tileset.name, tileset.image);
            }
        }
        
        // Wait for tileset images to load
        if (this.load.list.size > 0) {
            await new Promise(resolve => {
                this.load.once('complete', resolve);
                this.load.start();
            });
        }

        // Create all maps
        worldData.maps.forEach(mapInfo => {
            const mapKey = mapInfo.fileName.replace('.tmx', '');
            const map = this.make.tilemap({ key: mapKey });
            
            // Add all tilesets to the map
            const loadedTilesets = {};
            map.tilesets.forEach(tileset => {
                loadedTilesets[tileset.name] = map.addTilesetImage(
                    tileset.name, 
                    tileset.name
                );
            });

            // Create all layers
            const layers = {};
            map.layers.forEach(layer => {
                const layerData = map.createLayer(
                    layer.name,
                    Object.values(loadedTilesets),
                    mapInfo.x,  // Offset by world position
                    mapInfo.y   // Offset by world position
                );
                
                // Set collision if needed
                if (layer.properties?.some(p => p.name === 'collision' && p.value === true)) {
                    layerData.setCollisionByProperty({ collides: true });
                }
                
                layers[layer.name] = layerData;
            });

            // Store level data
            this.levels.set(mapKey, {
                map,
                layers,
                worldX: mapInfo.x,
                worldY: mapInfo.y,
                width: map.widthInPixels,
                height: map.heightInPixels,
                transitions: this.setupLevelTransitions(map, mapInfo.x, mapInfo.y)
            });
        });

        // Set camera bounds to encompass all levels
        const worldBounds = this.calculateWorldBounds();
        this.physics.world.setBounds(
            worldBounds.x, 
            worldBounds.y, 
            worldBounds.width, 
            worldBounds.height
        );
        this.cameras.main.setBounds(
            worldBounds.x, 
            worldBounds.y, 
            worldBounds.width, 
            worldBounds.height
        );
    }

    getTilesetPath(tilesetPath, worldBasePath) {
        if (tilesetPath.startsWith('../')) {
            return '/assets/' + tilesetPath.replace('../', '');
        }
        return worldBasePath + tilesetPath;
    }

    calculateWorldBounds() {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        
        for (const levelData of this.levels.values()) {
            minX = Math.min(minX, levelData.worldX);
            minY = Math.min(minY, levelData.worldY);
            maxX = Math.max(maxX, levelData.worldX + levelData.width);
            maxY = Math.max(maxY, levelData.worldY + levelData.height);
        }
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    update() {
        // Handle player movement and level transitions here
    }
}

    // NOT IN DATA - leave this out for now
    // setupLevelTransitions(map, offsetX, offsetY) {
    //     const transitions = [];
        
    //     map.getObjectLayerNames().forEach(layerName => {
    //         const objects = map.getObjectLayer(layerName);
    //         if (!objects) return;
            
    //         objects.objects.forEach(object => {
    //             if (object.type === 'transition') {
    //                 const trigger = this.add.rectangle(
    //                     object.x + offsetX + (object.width / 2),
    //                     object.y + offsetY + (object.height / 2),
    //                     object.width,
    //                     object.height
    //                 );
                    
    //                 this.physics.add.existing(trigger, true);
                    
    //                 const transitionData = {
    //                     trigger,
    //                     targetLevel: object.properties.find(p => p.name === 'targetLevel')?.value,
    //                     targetX: object.properties.find(p => p.name === 'targetX')?.value,
    //                     targetY: object.properties.find(p => p.name === 'targetY')?.value
    //                 };
                    
    //                 transitions.push(transitionData);
    //             }
    //         });
    //     });
        
    //     return transitions;
    // }


