import { Type, ZoneName, BENCH_ZONES, Stage, EffectTiming } from './enums';
import { GameEvent, GameEventType } from './event_models';
import { GameState, Card, Zone } from './models';
import { checkStateBasedActions } from './check_statebased_actions';
import { Effect, EffectConfig } from './effect_types';

export function applyEffect(
    gameState: GameState, 
    effect: Effect
): void {
    // If the effect has an on_apply function, call it
    if (effect.duration > 0) {
        gameState.effectManager.addEffect(effect);
    }
    
    // Run the effect
    const context = {
        sourcePlayerIndex: gameState.currentPlayerIndex,
        targetPlayerIndex: 1 - gameState.currentPlayerIndex,
        sourceZoneName: ZoneName.ACTIVE, // Default to active zone for now
        targetZoneName: ZoneName.ACTIVE, // Default to active zone for now
        sourceCard: effect.source,
        targetCard: effect.target
    };
    effect.run(gameState, context);
}

export function applyDamageCalculation(
    gameState: GameState,
    targetZone: Zone,
    damage: number,
    damageType: Type,
    options = { applyWeakness: true, ignoreTargetEffects: false }
): number {
    // Apply weakness if applicable
    let finalDamage = damage;
    const targetPokemon = targetZone.getPokemon();
    if (options.applyWeakness && targetPokemon?.weakness === damageType && damageType !== Type.NONE) {
        finalDamage += 20; // Add 20 damage for weakness
    }

    // Get damage modifications from effects if not ignored
    if (!options.ignoreTargetEffects) {
        const context = {
            sourcePlayerIndex: gameState.currentPlayerIndex,
            targetPlayerIndex: 1 - gameState.currentPlayerIndex,
            sourceZoneName: ZoneName.ACTIVE,
            targetZoneName: ZoneName.ACTIVE,
            damage: finalDamage,
            damageType,
            targetCard: targetZone.getPokemon()
        };
        
        // Query damage modification effects
        const modifications = gameState.effectManager.query(
            EffectTiming.QUERY_DAMAGE,
            gameState,
            context
        );
        
        // Apply modifications
        for (const modification of modifications) {
            if (typeof modification === 'number') {
                finalDamage = modification;
            }
        }
    }

    // Apply the final damage
    const actualDamage = applyDamageCounters(
        gameState,
        targetZone,
        finalDamage
    );
    
    // Emit damage event
    if (actualDamage > 0) {
        gameState.addUIEvent(new GameEvent({
            type: GameEventType.DAMAGE,
            data: {
                target: targetZone.getPokemon(),
                amount: actualDamage,
                damageType
            }
        }));
    }
    
    return actualDamage;
}

export function applyDamageCounters(
    gameState: GameState,
    targetZone: Zone,
    amount: number
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
    
    return actualDamage;
}

export function drawInitialHand(
    gameState: GameState,
    player_index: number
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
    gameState.addUIEvent(new GameEvent({
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
        const card = drawCard(gameState, player_index);
        drawnCards.push(card);
    }

    return drawnCards;
}

export function drawCard(
    gameState: GameState,
    player_index: number
): Card {
    const player = gameState.players[player_index];
    
    // Draw card using PlayerState zone methods
    const card = player.drawCard();
    
    // Emit game state event
    gameState.addUIEvent(new GameEvent({
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
    player_index: number
): void {
    const player = gameState.players[player_index];
    player.shuffleDeck();
    
    // Emit game state event
    gameState.addUIEvent(new GameEvent({
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
    targetZoneName: ZoneName
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
    gameState.addUIEvent(new GameEvent({
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
    gameState: GameState
): void {
    const nextPlayerIndex = 1 - gameState.currentPlayerIndex;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const nextPlayer = gameState.players[nextPlayerIndex];

    // Emit turn end event
    gameState.addUIEvent(new GameEvent({
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
    gameState.addUIEvent(new GameEvent({
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
    checkStateBasedActions(gameState);
}

export function startFirstTurn(
    playerIndex: number,
    gameState: GameState
): void {
    gameState.currentPlayerIndex = playerIndex;
    gameState.turn++;
    
    // Emit turn start event for the first turn
    gameState.addUIEvent(new GameEvent({
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
