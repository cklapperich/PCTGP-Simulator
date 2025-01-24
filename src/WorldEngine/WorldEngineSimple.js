import Phaser from 'phaser';

export class WorldScene extends Phaser.Scene {
    constructor() {
        super({ key: 'WorldScene' });
    }

    init(data) {
        this.world = data.world;
        this.tileSize = 32;
        this.level = this.world.levels[0];
        
        // Pre-calculate tile groupings
        const floorLayer = this.level.layerInstances.find(layer => layer.__identifier === "Floor_walls");
        this.tileset = this.world.defs.tilesets.find(ts => ts.uid === floorLayer.__tilesetDefUid);
        
        // Group tiles by position
        this.tilesByPosition = new Map();
        for (const tile of floorLayer.gridTiles) {
            const x = tile.d[0] % floorLayer.__cWid;
            const y = Math.floor(tile.d[0] / floorLayer.__cWid);
            const pos = `${x},${y}`;
            if (!this.tilesByPosition.has(pos)) {
                this.tilesByPosition.set(pos, []);
            }
            this.tilesByPosition.get(pos).push(tile);
        }

        // Calculate max stack size once
        this.maxStackSize = Math.max(
            ...Array.from(this.tilesByPosition.values()).map(stack => stack.length)
        );
    }

    preload() {
        // Load tileset image
        if (this.tileset.relPath) {
            this.load.image(this.tileset.identifier, '/' + this.tileset.relPath);
        }
    }

    create() {
        // Create base tilemap
        const map = this.make.tilemap({
            width: this.level.pxWid / this.tileSize,
            height: this.level.pxHei / this.tileSize,
            tileWidth: this.tileSize,
            tileHeight: this.tileSize
        });
        
        // Add tileset to map
        const phaserTileset = map.addTilesetImage(
            this.tileset.identifier,
            this.tileset.identifier
        );

        // Create layers and place tiles
        for (let i = 0; i < this.maxStackSize; i++) {
            const layer = map.createBlankLayer(`Layer_${i}`, phaserTileset);
            layer.setDepth(i);
            layer.fill(-1);

            // Place tiles for this layer
            for (const [pos, stack] of this.tilesByPosition) {
                if (stack[i]) {  // If there's a tile for this layer
                    const [x, y] = pos.split(',').map(Number);
                    layer.putTileAt(stack[i].t, x, y);
                }
            }
        }

        // Set camera bounds
        this.cameras.main.setBounds(0, 0, this.level.pxWid, this.level.pxHei);
        this.physics.world.setBounds(0, 0, this.level.pxWid, this.level.pxHei);
    }
} 