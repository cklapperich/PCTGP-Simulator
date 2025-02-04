import { AssetLoader } from './assetLoader.js';
import { pullPack, loadPackData } from './pack_pull.js';
import { PackOpenScene } from './phaser_pack_open.js';
import { UIConfig} from '../../config/UIConfig.js';

export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
        this.packLoader = new AssetLoader(this);
        this.globalLoader = new AssetLoader(this);
    }

    async create() {
        try {
            // Load global assets first
            await this.globalLoader.loadAssets({
                icons: UIConfig.icons
            });

            // Get pack data and pull cards
            const packId = 'A1M';
            const cards = await pullPack(await loadPackData(packId));
            
            // Load pack-specific assets
            await this.packLoader.loadAssets({
                pack: { id: packId },
                cards: cards.map(card => ({ id: card.id }))
            });

            // Add and start pack open scene
            this.scene.add('PackOpenScene', PackOpenScene);
            this.scene.start('PackOpenScene', {
                packId,
                cards,
                UIConfig
            });

            // Store loaders in registry for cleanup
            this.game.registry.set('packLoader', this.packLoader);
            this.game.registry.set('globalLoader', this.globalLoader);

        } catch (error) {
            console.error('Failed to initialize pack:', error);
        }
    }
}
