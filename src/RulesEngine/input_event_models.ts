import type { InputRequestEventProps, InputDataProps, PlayerInputProps } from './types';

// Selection reasons - WHY are we selecting
export enum InputType {
    // Selection inputs - WHAT you're selecting from
    SELECT_HAND = "select_hand",           // Select card(s) from hand
    SELECT_BENCH = "select_bench",         // Select Pokemon from bench
    SELECT_ACTIVE = "select_active",       // Select active Pokemon
    SEARCH_DECK = "search_deck",           // Search deck for card(s)
    SEARCH_DISCARD = "search_discard",     // Search discard for card(s)
    
    // Game action inputs
    ATTACK = "attack",                     // Choose an attack to use
    ACTIVATE_ABILITY = "activate_ability", // Choose an ability to activate
    RETREAT = "retreat",                   // Choose to retreat
    PASS_TURN = "pass_turn",              // Choose to pass turn
    START_BATTLE = "start_battle",         // Choose to start battle
    CONCEDE = "concede"                    // Choose to concede
}

export enum SelectReason {
    // Setup reasons
    SETUP_ACTIVE = "setup_active",         // Selecting initial active Pokemon
    SETUP_BENCH = "setup_bench",           // Selecting initial bench Pokemon
    
    // Game action reasons
    REPLACE_ACTIVE = "replace_active",     // Active Pokemon was KO'd
    ATTACH_ENERGY = "attach_energy",       // Attaching energy to a Pokemon
    PLAY_POKEMON = "play_pokemon",         // Playing a Pokemon card
    EVOLVE_POKEMON = "evolve_pokemon",     // Evolving a Pokemon
    
    // Effect reasons
    ABILITY_TARGET = "ability_target",     // Targeting for ability effect
    ATTACK_TARGET = "attack_target",       // Targeting for attack effect
    NOT_SPECIFIED = "not_specified"
}

/**
 * Data structure containing all possible fields for any input response.
 * Fields are optional and their usage depends on the input type.
 */
export class InputData implements InputDataProps {
    handIndex: number | null = null;
    sourceZone: string | null = null;
    targetZone: string | null = null;
    deckIndex: number | null = null;
    attackIndex: number | null = null;
    attackInfo: any | null = null;  // TODO: Define attack info type

    constructor(props: Partial<InputDataProps> = {}) {
        Object.assign(this, props);
    }
}

export class PlayerInput {
    inputType: string | undefined;
    data: InputData;
    playerIndex: number | undefined;

    constructor({
        inputType = undefined,
        data = new InputData(),
        playerIndex = undefined
    }: PlayerInputProps = {}) {
        this.inputType = inputType;
        this.data = data instanceof InputData ? data : new InputData(data);
        this.playerIndex = playerIndex;
    }
}

// The engine is requesting an input for one of these reasons
export class InputRequestEvent {
    reason: string;
    legalInputs: PlayerInput[];

    constructor({
        reason = SelectReason.NOT_SPECIFIED,
        legalInputs = []
    }: InputRequestEventProps = {}) {
        this.reason = reason;
        this.legalInputs = legalInputs.map(input => 
            input instanceof PlayerInput ? input : new PlayerInput(input)
        );
    }
}
