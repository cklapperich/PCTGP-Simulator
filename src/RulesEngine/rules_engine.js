import { getLegalInputs } from "./get_legal_inputs.js";
import { GameState } from "./models.js";
import { rulesEngineGenerator } from "./rules_engine_generator.js";

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

        this.state_history.push(new TurnHistory(
            this.state,
            null,
            [],
            getLegalInputs(this.state)
        ));

        this.generator = rulesEngineGenerator(this.state, this.eventHandler);
    }

    getLegalInputs() {
        return getLegalInputs(this.state);
    }
    
    runUntilNext(input) {
        this.currentTurnEvents = [];
        
        const response = this.generator.next(input).value;
        
        this.state_history.push(new TurnHistory(
            this.state,
            input,
            [...this.currentTurnEvents],
            response.legalInputs
        ));
        
        return {
            state: this.state,
            legalInputs: response.legalInputs || []
        };
    }

    cleanup() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}
