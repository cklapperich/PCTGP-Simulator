export class TurnHistory {
    constructor(state, lastinput, gameevents, legal_moves) {
        this.state = state || null;
        this.lastinput = lastinput || null;
        this.gameevents = gameevents || [];
        this.legal_moves = legal_moves || [];
    }
}

export class RulesEngine {
    constructor(player1, player2, eventHandler) {
        this.state = new GameState(player1, player2);
        this.state_history = [];
        this.eventHandler = eventHandler;
        this.currentTurnEvents = [];
        
        this.unsubscribe = this.eventHandler.subscribe(event => {
            this.currentTurnEvents.push(event);
        });

        const initialstate = JSON.parse(JSON.stringify(this.state));
        this.state_history.push(new TurnHistory(
            initialstate,
            null,
            [],
            getLegalMoves(initialstate)
        ));

        this.generator = createGameEngineGenerator(this.state, eventHandler);

        const statecopy = JSON.parse(JSON.stringify(this.state));
        this.state_history.push(new TurnHistory(
            statecopy,
            null,
            [],
            getLegalMoves(statecopy)
        ));
    }

    getLegalMoves() {
        return getLegalMoves(this.state);
    }
    
    runUntilNext(input) {
        this.currentTurnEvents = [];
        
        const response = this.generator.next(input).value;
        const newstate = JSON.parse(JSON.stringify(this.state));
        
        this.state_history.push(new TurnHistory(
            newstate,
            input,
            [...this.currentTurnEvents],
            getLegalMoves(newstate)
        ));
        
        return response;
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}