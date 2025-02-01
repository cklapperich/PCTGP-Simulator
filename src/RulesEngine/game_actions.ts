import { Type, ZoneName, BENCH_ZONES, Stage, EffectType} from './enums.js';
import { GameEvent, GameEventType } from './event_models.js';
import { GameState, Card, Zone } from './models.js';
import { checkStateBasedActions } from './check_statebased_actions.js';
import {createEffect} from './effect_manager.js';
import { EffectSource } from './enums.js';

// export class Effect {
//     id: string;
//     type: string;
//     source: Card;
//     sourceType: EffectSource;
//     target: any | null;
//     duration: number;
//     priority: number;
//     modifier: ((value: number, gameState: GameState) => number) | null;
//     condition: ((gameState: GameState) => boolean) | null;
//     effectType?: string;
// }
// export enum EffectSource {
//     ATTACK = 'ATTACK',
//     ABILITY = 'ABILITY',
//     TRAINER = 'TRAINER'
// }
/**
 * Data structure containing all possible fields for any input response.
 * Fields are optional and their usage depends on the input type.
 */
// export class InputData implements InputDataProps {
//     handIndex: number | null = null;
//     sourceZone: string | null = null;
//     targetZone: string | null = null;
//     deckIndex: number | null = null;
//     attackIndex: number | null = null;
//     attackInfo: any | null = null;  // TODO: Define attack info type

//     constructor(props: Partial<InputDataProps> = {}) {
//         Object.assign(this, props);
//     }
// }

// export class PlayerInput {
//     inputType: string | undefined;
//     data: InputData;
//     playerIndex: number | undefined;

//     constructor({
//         inputType = undefined,
//         data = new InputData(),
//         playerIndex = undefined
//     }: PlayerInputProps = {}) {
//         this.inputType = inputType;
//         this.data = data instanceof InputData ? data : new InputData(data);
//         this.playerIndex = playerIndex;
//     }
// }

export function applyEffect(
    gameState: GameState, 
    sourceType: EffectSource, 
    sourceCard: Card, 
    effect_data: any, 
    eventHandler: GameEvent[]
): void {
    // Use the createEffect function from effect_manager to properly create the effect
    // This will use the registered effect creator for the given type
    const effect = createEffect(effect_data);
    
    // Set the source-related properties that aren't part of the effect data
    effect.source = sourceCard;
    effect.sourceType = sourceType;

    // If the effect has an on_apply function, call it
    if gameState.effectManager.query("CAN_APPLY_EFFECT", gameState, effect) {
        effect.run(gameState, sourceCard, effect_data.target);
    }
    if (effect.duration>0){
        gameState.addEffect(gameState, effect);
    }


}

export function applyDamageCalculation(
    gameState: GameState,
    targetZone: Zone,
    damage: number,
    damageType: Type,
    eventHandler: GameEvent[],
    options = { applyWeakness: true, ignoreTargetEffects: false }
): number {
    // Apply weakness if applicable
    let finalDamage = damage;
    if (options.applyWeakness && targetZone.getPokemon()?.weakness === damageType) {
        finalDamage += 20;
    }

    // Get damage modifications from effects if not ignored
    if (!options.ignoreTargetEffects) {
        // Get all active damage modifying effects
        const damageEffects = gameState.effectManager.query("DAMAGE_MODIFICATION",
            gameState,
        );

        // Apply each effect's modifier in order
        for (const effect of damageEffects) {
            if (effect.modifier && gameState.effectManager.query("CAN_APPLY_EFFECT", gameState, effect)) {
                finalDamage = effect.modifier(finalDamage, gameState);
            }
        }
    }

    // Apply the final damage
    const actualDamage = applyDamageCounters(
        gameState,
        targetZone,
        finalDamage,
        eventHandler
    );
    return actualDamage;
}

export function applyDamageCounters(
    gameState: GameState,
    targetZone: Zone,
    amount: number,
    eventHandler: GameEvent[],
): number {
    const oldDamage = targetZone.damage || 0;
    
    // Get max HP of card in zone
    const card = targetZone.getPokemon();
    if (!card) return 0;
    
    // Calculate new damage, bounded by 0 and maxHP
    const newDamage = Math.max(0, Math.min(oldDamage + amount, card.HP));
    const actualDamage = newDamage - oldDamage;
    
    // Update zone's damage
    targetZone.damage = newDamage;

    // Emit damage event with actual amount applied
    if (actualDamage !== 0) {
        // Get and apply damage reaction effects
        const reactionEffects = gameState.effectManager.getActiveEffects(
            gameState,
            EffectType.DAMAGE_REACTION
        );

        for (const effect of reactionEffects) {
            if (effect.modifier && gameState.effectManager.canApplyEffect(gameState, effect)) {
                effect.modifier(actualDamage, gameState);
            }
        }
    }
    
    return actualDamage;
}

export function drawInitialHand(
    gameState: GameState,
    player_index: number,
    eventHandler: GameEvent[]
): Card[] {
    const player = gameState.players[player_index];
    const deck = player.deck;
    
    // Find all basic Pokemon in deck and select one randomly
    const basicPokemonIndices = deck.cards.reduce((indices: number[], card: Card, index: number) => {
        if (card.stage === Stage.BASIC) {
            indices.push(index);
        }
        return indices;
    }, []);

    // Select random basic Pokemon
    const randomBasicIndex = basicPokemonIndices[Math.floor(Math.random() * basicPokemonIndices.length)];
    const basicPokemon = deck.cards[randomBasicIndex];
    
    // Remove it from deck and add to hand
    deck.cards.splice(randomBasicIndex, 1);
    player.addToHand(basicPokemon);

    // Emit event for the basic Pokemon draw
    eventHandler.push(new GameEvent({
        type: GameEventType.CARD_MOVE,
        data: {
            card: basicPokemon,
            sourceZone: ZoneName.DECK,
            targetZone: ZoneName.HAND,
            playerIndex: player_index
        }
    }));

    // Draw 4 more cards
    const drawnCards = [basicPokemon];
    for (let i = 0; i < 4; i++) {
        const card = drawCard(gameState, player_index, eventHandler);
        drawnCards.push(card);
    }

    return drawnCards;
}

export function drawCard(
    gameState: GameState,
    player_index: number,
    eventHandler: GameEvent[]
): Card {
    const player = gameState.players[player_index];
    
    // Draw card using PlayerState zone methods
    const card = player.drawCard();
    
    // Emit game state event
    eventHandler.push(new GameEvent({
        type: GameEventType.CARD_MOVE,
        data: {
            card: card,
            sourceZone: ZoneName.DECK,
            targetZone: ZoneName.HAND,
            playerIndex: player_index
        }
    }));
    return card;
}

export function shuffleDeck(
    gameState: GameState,
    player_index: number,
    eventHandler: GameEvent[]
): void {
    const player = gameState.players[player_index];
    player.shuffleDeck();
    
    // Emit game state event
    eventHandler.push(new GameEvent({
        type: GameEventType.SHUFFLE_DECK,
        data: {
            playerIndex: player_index,
            sourceZone: ZoneName.DECK
        }
    }));
}

export function playPokemonCard(
    gameState: GameState,
    playerIndex: number,
    handIndex: number,
    targetZoneName: ZoneName,
    eventHandler: GameEvent[]
): void {
    const player = gameState.players[playerIndex];
    
    // Get card from hand zone
    const handZone = player.getZone(ZoneName.HAND);
    const card = handZone.cards[handIndex];

    // Remove from hand using zone methods
    handZone.cards.splice(handIndex, 1);
    
    // Add to target zone using PlayerState method
    player.addCardToZone(card, targetZoneName);

    // Emit game state event
    eventHandler.push(new GameEvent({
        type: GameEventType.CARD_MOVE,
        data: {
            card: card,
            sourceZone: ZoneName.HAND,
            targetZone: targetZoneName,
            playerIndex: playerIndex
        }
    }));
}

export function endTurn(
    gameState: GameState,
    eventHandler: GameEvent[]
): void {
    const nextPlayerIndex = 1 - gameState.currentPlayerIndex;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const nextPlayer = gameState.players[nextPlayerIndex];

    // Emit turn end event
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_END,
        data: {
            playerIndex: gameState.currentPlayerIndex,
            turn: gameState.turn
        }
    }));

    // TODO: BETWEEN TURNS (mostly just handling poison?)
    
    // Switch current player
    gameState.currentPlayerIndex = nextPlayerIndex;
    gameState.turn++;

    // Emit turn start event
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_START,
        data: {
            playerIndex: nextPlayerIndex,
            turn: gameState.turn
        }
    }));

    // Reset turn-based flags
    nextPlayer.canSupporter = true;

    // Allow evolution for existing Pokemon
    const activePokemon = nextPlayer.getPokemonInZone(ZoneName.ACTIVE);
    if (activePokemon) {
        activePokemon.can_evolve = true;
    }
    
    BENCH_ZONES.forEach(benchZone => {
        const pokemon = nextPlayer.getPokemonInZone(benchZone);
        if (pokemon) {
            pokemon.can_evolve = true;
        }
    });

    // count down duration on status effects
    gameState.effectManager.tickdown(gameState);

    // end of turn stuff
    checkStateBasedActions(gameState, eventHandler);
}

export function startFirstTurn(
    playerIndex: number,
    gameState: GameState,
    eventHandler: GameEvent[]
): void {
    gameState.currentPlayerIndex = playerIndex;
    gameState.turn++;
    
    // Emit turn start event for the first turn
    eventHandler.push(new GameEvent({
        type: GameEventType.TURN_START,
        data: {
            playerIndex: playerIndex,
            turn: gameState.turn
        }
    }));
    
    // Don't update energy zones first turn
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    currentPlayer.canSupporter = true;
}
