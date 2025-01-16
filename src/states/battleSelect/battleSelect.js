import { State } from '../State.js';
import trainersData from '../../data/trainers.json' assert { type: "json" };
import soundManager from '../../soundManager.js';

export class BattleSelectState extends State {
    constructor(game) {
        super(game);
        console.log('Initializing BattleSelectState');
        this.selectedTrainer = null;
        this.screen = document.getElementById('battle-select-screen');
        this.trainersContainer = this.screen.querySelector('.trainer-portraits');
        
        if (!this.screen) {
            console.error('Could not find battle-select-screen element');
        }
        if (!this.trainersContainer) {
            console.error('Could not find trainer-portraits element');
        }
    }

    enter() {
        console.log('Entering battle select state');
        // Show this screen
        this.screen.classList.add('active');
        // Render trainers
        this.renderTrainers();
        // Setup event listeners
        this.setupEventListeners();
    }

    renderTrainers() {
        console.log('Rendering trainers from data:', trainersData);
        this.trainersContainer.innerHTML = trainersData.trainers
            .map(trainer => `
                <div class="trainer-card" data-trainer-id="${trainer.id}">
                    <img src="${trainer.portrait}" alt="${trainer.name}" class="trainer-portrait">
                    <h2>${trainer.name}</h2>
                    <div class="trainer-info">
                        <p class="difficulty">Difficulty: ${'⭐'.repeat(trainer.difficulty)}</p>
                        <p class="description">${trainer.description}</p>
                        <p class="rewards">Rewards: ${trainer.rewards.cards} cards, ${trainer.rewards.packs} pack</p>
                    </div>
                </div>
            `)
            .join('');
    }

    setupEventListeners() {
        console.log('Setting up battle select event listeners');
        this.trainersContainer.querySelectorAll('.trainer-card').forEach(card => {
            // Add hover sound effect
            card.addEventListener('mouseenter', () => {
                soundManager.play('hover');
            });

            card.addEventListener('click', () => {
                soundManager.play('select');
                const trainerId = card.dataset.trainerId;
                console.log('Trainer card clicked:', trainerId);
                const trainer = trainersData.trainers.find(t => t.id === trainerId);
                if (trainer) {
                    console.log('Found trainer data:', trainer);
                    this.selectedTrainer = trainer;
                    this.promptStartFight();
                } else {
                    console.error('Could not find trainer data for id:', trainerId);
                }
            });
        });
    }

    promptStartFight() {
        console.log('Prompting to start fight with:', this.selectedTrainer);
        const confirm = window.confirm(
            `Want to start the fight with ${this.selectedTrainer.name}?\n` +
            `Deck Theme: ${this.selectedTrainer.deck.theme}\n` +
            `Rewards: ${this.selectedTrainer.rewards.cards} cards, ${this.selectedTrainer.rewards.packs} pack`
        );
        if (confirm) {
            console.log('Fight confirmed, transitioning to battle state');
            // Store trainer data before transition
            const trainer = this.selectedTrainer;
            // Transition to battle state after this state is cleaned up
            this.game.transitionToState('Battle', { trainer });
        } else {
            console.log('Fight cancelled');
        }
    }

    exit() {
        console.log('Exiting battle select state');
        // Hide this screen
        this.screen.classList.remove('active');
        // Cleanup event listeners
        this.trainersContainer.innerHTML = '';
    }
}
