import Phaser from 'phaser';
// layers support Game Events https://docs.phaser.io/api-documentation/class/gameobjects-layer
// TODO:
/*
 Let's think about what each layer really needs:

Floor_walls layer: Already working perfectly with our current multi-layer approach
Interactive/Dynamic tiles: Could be a single dynamic layer
Entities: Could be simple game objects
Instead of creating multiple types of layers, we could just:

Keep the current multi-layer system for Floor_walls exactly as is (since it works)
Add a single dynamic layer for any tile-based things that need to change
Create sprites for the entities that need complex interaction (like the PC)
The main insight here is we don't need to complicate it with multiple approaches to layers - we can stick with what's working and just add the minimum needed for the new functionality.

Let's look at your Entities layer from the LDTK data. For something like the PC terminal, instead of treating it as a tile, we'd create it as a Phaser Game Object:

// Example of creating the PC as a game object
const pcData = level.layerInstances.find(l => l.__identifier === "Entities")
    .entityInstances.find(e => e.__identifier === "PC");

if (pcData) {
    // Create an interactive sprite or image
    const pc = this.add.sprite(
        pcData.px[0],  // x position from LDTK
        pcData.px[1],  // y position from LDTK
        'pc-terminal'  // texture key
    );
    
    // Make it interactive
    pc.setInteractive();
    
    // Handle clicks/interaction
    pc.on('pointerdown', () => {
        // Open menu or whatever the PC should do
        console.log('PC terminal activated');
    });
}
The advantages of this approach:

Built-in Phaser event handling for interaction
Can easily add properties and methods specific to the PC
Can add visual effects or states
Cleaner separation between map structure (tiles) and interactive elements
More natural way to handle one-off unique objects in your game world
Each entity from your LDTK Entities layer would become its own game object with its own behavior, rather than trying to handle it through the tile system.

Yes! For our PC terminal example, several of these methods would be very helpful. Let's look at the most relevant ones:

For basic interactivity:

javascriptCopyconst pc = this.add.sprite(x, y, 'pc-terminal');

// Make interactive and handle input
pc.setInteractive()  // Makes object respond to input
   .setData('state', 'idle')  // Store custom data
   .setName('terminal-1');    // Give it a unique name

// Event handling
pc.on('pointerover', () => {
    pc.setAlpha(0.8);  // Visual feedback when hovering
});

pc.on('pointerout', () => {
    pc.setAlpha(1);
});

For state management:

javascriptCopy// You can track the PC's state
pc.setState('active');  // When menu is open
pc.setState('idle');    // When not in use

// Check state in update loop or event handlers
if (pc.state === 'active') {
    // Do something
}

For layering/depth:

javascriptCopy// Make sure PC appears above floor tiles
pc.setDepth(100);

// Or relatively position it
pc.setAbove(floorLayer);  // Places it above another object

For adding custom data:

javascriptCopy// Store custom properties
pc.setDataEnabled();
pc.setData('lastUsed', Date.now());
pc.setData('menuOptions', ['Save', 'Load', 'Exit']);

// Access them later
const options = pc.getData('menuOptions');
This built-in functionality means we don't need to write much custom code to handle:

Input detection
Visual states
Layer management
Custom data storage
*/
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