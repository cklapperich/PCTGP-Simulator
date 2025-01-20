import { getLegalInputs } from "./get_legal_inputs";
export class TurnHistory {
    constructor(state, lastinput, gameevents, legal_inputs) {
        this.state = state || null;
        this.lastinput = lastinput || null;
        this.gameevents = gameevents || [];
        this.legal_inputs = legal_inputs || [];
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
            getLegalInputs(initialstate)
        ));

        this.generator = createGameEngineGenerator(this.state, eventHandler);
    }

    getLegalInputs() {
        return getLegalInputs(this.state);
    }
    
    runUntilNext(input) {
        this.currentTurnEvents = [];
        
        const response = this.generator.next(input).value;
        const newstate = JSON.parse(JSON.stringify(this.state));
        
        this.state_history.push(new TurnHistory(
            newstate,
            input,
            [...this.currentTurnEvents],
            response.legal_inputs
        ));
        
        return response;
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}