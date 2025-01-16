//IMPORTANT: CAN ONLY PLAY 1 SOUND AT A TIME
// IF 2ND SOUND TRIGGERS, SHOUDL IGNORE THE TRIGGER

class SoundManager {
    constructor() {
        this.sounds = {
            hover: new Audio('assets/sounds/hover.mp3'),
            select: new Audio('assets/sounds/select.mp3')
        };

        // Configure sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = 0.3; // Set a reasonable default volume
        });
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (sound) {
            // Reset the sound to start if it's already playing
            sound.currentTime = 0;
            sound.play().catch(e => console.log('Sound play prevented:', e));
        }
    }

    // Preload all sounds
    preload() {
        Object.values(this.sounds).forEach(sound => {
            sound.load();
        });
    }
}

// Create a singleton instance
const soundManager = new SoundManager();
export default soundManager;
