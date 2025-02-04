    import { audioConfig } from '../config/AudioConfig.js';

export class PreloaderScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloaderScene' });
    }

    preload() {
        console.log('PreloaderScene: Loading audio assets...');
        Object.entries(audioConfig.sfx).forEach(([key, path]) => {
            console.log(`PreloaderScene: Loading ${key} from ${path}`);
            this.load.audio(key, path);
        });
    }

    create() {
        console.log('PreloaderScene: Audio loaded, starting BootScene');
        this.scene.start('BootScene');
    }
}
