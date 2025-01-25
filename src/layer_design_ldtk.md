You need 3 clear layers in your LDTK editor:

Floor_walls (tile layer)

Base floor and wall tiles
These often stack (multiple tiles in same position)
Uses our current multi-layer rendering approach


Interactive_Tiles (tile layer) - if needed

For doors, breakable walls, etc.
Things that change state but are still tiles
Would use Phaser's dynamic tilemap layer


Entities (entity layer)

For PC terminals, NPCs, etc.
NOT tiles - these become Phaser game objects
Uses Phaser's built-in interactive object features

Right now you have Floor_walls and Entities which might be all you need if you don't have any tiles that need to change state during gameplay.