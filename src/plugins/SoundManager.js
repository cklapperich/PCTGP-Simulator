export class SoundManager extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
    }

    init() {
        // Called when the plugin is loaded by the PluginManager
        console.log('SoundManager: Initialized');
    }

    playSound(key, config = {}) {
        const sound = this.game.sound.add(key, {
            volume: config.volume || 1,
            rate: config.rate || 1,
            detune: config.detune || 0
        });
        sound.play();
        return sound;
    }

    playRandomizedSound(key) {
        const pitch = 0.8 + Math.random() * 0.4;  // Random pitch 0.9-1.1
        const volume = 0.9 + Math.random() * 0.2;  // Random volume 0.8-1.2
        return this.playSound(key, { rate: pitch, volume });
    }
}
