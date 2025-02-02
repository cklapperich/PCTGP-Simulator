class Deck {
    constructor(cards = [], coin = null, types = []) {
        this.cards = cards;    // array of strings
        this.coin = coin;      // can be null
        this.types = types;    // array of strings, can be empty
    }
}

export default class GameState {
    constructor() {
        this.flags = {};  // levelName -> {flagName: boolean}
        this.position = {
            x: 0,
            y: 0,
            level: 'assets/worlds/world1/tiled/0001_Level_0.tmx'
        };
        this.playerName = '';
        this.coins = 0;
        this.deck = new Deck();  // default empty deck
    }
    
    setFlag(level, flagName, value = true) {
        if (!this.flags[level]) {
            this.flags[level] = {};
        }
        this.flags[level][flagName] = value;
    }
    
    getFlag(level, flagName) {
        return this.flags[level]?.[flagName] ?? false;
    }
    
    setDeck(cards = [], coin = null, types = []) {
        this.deck = new Deck(cards, coin, types);
    }
}
