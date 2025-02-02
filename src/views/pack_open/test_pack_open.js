import { AssetLoader } from './assetLoader.js';
import { pullPack, loadPackData } from './pack_pull.js';
import { PackOpenScene } from './phaser_pack_open.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.assetLoader = new AssetLoader(this);
    }

    async create() {
        try {
            // Get pack data and pull cards
            const packId = 'A1M';
            const cards = await pullPack(await loadPackData(packId));
            
            // Load all assets
            await this.assetLoader.loadAssets({
                pack: { id: packId },
                cards: cards.map(card => ({ id: card.id }))
            });
            
            // Start pack open scene
            this.scene.add('PackOpenScene', PackOpenScene);
            this.scene.start('PackOpenScene', {
                packId,
                cards
            });

            // Store loader in registry for cleanup
            this.game.registry.set('assetLoader', this.assetLoader);

        } catch (error) {
            console.error('Failed to initialize pack:', error);
        }
    }
}