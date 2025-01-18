import { State } from '../State.js';

export class BattleState extends State {
    constructor(game) {
        super(game);
        console.log('Initializing BattleState');
        this.screen = document.getElementById('battle-screen');
        
        if (!this.screen) {
            console.error('Could not find battle-screen element');
            return;
        }

        // Load battle HTML content
        fetch('src/states/battle/battle.html')
            .then(response => response.text())
            .then(html => {
                // Store the HTML content for later use
                this.battleHTML = html;
            })
            .catch(error => {
                console.error('Error loading battle.html:', error);
            });
    }

    enter() {
        console.log('Entering battle state');
        if (this.battleHTML) {
            // Insert the battle HTML content
            this.screen.innerHTML = this.battleHTML;
        }
        // Show this screen which will trigger the playmat unroll animation
        this.screen.classList.add('active');
    }

    exit() {
        console.log('Exiting battle state');
        // Hide this screen
        this.screen.classList.remove('active');
    }
}
