Core Technology Stack

Frontend: HTML/CSS/JavaScript
- Each game state has its own HTML template and CSS
- JavaScript handles state management and game logic
- send the user the entire app, maybe with a loading scscreen while it loads. Images are the only thing loaded in a 'lazy' way.

State Management System

The game uses a simple but effective state management system:

1. Base State Class (src/states/State.js)
   - Provides common interface for all game states
   - Methods: enter(), exit(), update(), render()
   - Each state extends this base class

2. Game Controller (src/game.js)
   - Manages state transitions
   - Runs the game loop
   - Handles state initialization

3. State Implementation
   Each state follows a consistent pattern:
   - HTML template for the state's UI
   - CSS file for styling
   - JavaScript class extending State for behavior

Project Structure

project_root/
├── main.js             # Electron main process
├── preload.js          # Electron preload script
├── index.html          # Main HTML with all state templates
├── src/               # Renderer process code
│   ├── game.js         # Game controller and loop
│   ├── styles.css      # Global styles
│   └── states/         # Game states
│       ├── State.js    # Base state class

└── assets/             # Game resources
    └── portraits/      # Character images


State System
states/
├── battleSelect/    # Trainer selection screen
    - Shows trainer portraits
    - Handles trainer selection
    - Transitions to battle state
└── [Future States]  # Additional states as needed

UI Architecture

- Each state has its UI defined in HTML
- States are shown/hidden using CSS classes
- No dynamic DOM creation - all elements exist in index.html
- CSS handles transitions and animations
- JavaScript manages state changes and event handling