import { Type, Phase, ZoneName, BENCH_ZONES, Stage, EnergyZoneLocation } from './enums.js';
import { GameEvent, GameEventType } from './event_models.js';
import { GameState, Card, Zone } from './models.js';
import { checkStateBasedActions } from './check_statebased_actions.js';
import { EffectType } from './effect_manager';

interface DamageContext {
    damage: number;
    target: Zone;
    damageType: string;
    source?: any;
}

interface DamageOptions {
    applyWeakness?: boolean;
    ignoreTargetEffects?: boolean;
}

export function applyDamageCalculation(
    gameState: GameState,
    context: DamageContext,
    eventHandler: GameEvent[],
    options: DamageOptions = { applyWeakness: true, ignoreTargetEffects: false }
): number {
    let finalDamage = context.damage;

    // Apply weakness if applicable
    if (options.applyWeakness && context.target.getPokemon()?.weakness === context.damageType) {
        const immunityEffects = gameState.effectManager.getActiveEffects(gameState, EffectType.IMMUNITY, context);
        if (immunityEffects.length === 0) {
            finalDamage += 20;
        }
    }

    // Get damage modifications from effects if not ignored
    if (!options.ignoreTargetEffects) {
        // Apply damage modification effects
        const damageEffects = gameState.effectManager.getActiveEffects(gameState, EffectType.DAMAGE_MODIFICATION, context);
        for (const effect of damageEffects) {
            if (effect.modifier) {
                finalDamage = effect.modifier(finalDamage, gameState, context);
            }
        }

        // Apply damage reaction effects
        const reactionEffects = gameState.effectManager.getActiveEffects(gameState, EffectType.DAMAGE_REACTION, context);
        for (const effect of reactionEffects) {
            if (effect.modifier) {
                finalDamage = effect.modifier(finalDamage, gameState, context);
            }
        }
    }

    // Apply the final damage
    const actualDamage = applyDamageCounters(gameState, context, eventHandler, finalDamage);
    return actualDamage;
}

export function applyDamageCounters(
    gameState: GameState,
    context: DamageContext,
    eventHandler: GameEvent[],
    amount: number
): number {
    const zone = context.target;
    const oldDamage = zone.damage || 0;
    
    // Get max HP of card in zone
    const card = zone.getPokemon();
    if (!card) return 0;
    
    // Calculate new damage, bounded by 0 and maxHP
    const newDamage = Math.max(0, Math.min(oldDamage + amount, card.HP));
    const actualDamage = newDamage - oldDamage;
    
    // Update zone's damage
    zone.damage = newDamage;

    // Emit damage event with actual amount applied
    if (actualDamage !== 0) {
        eventHandler.push(GameEvent.createDamage({
            target: zone,
            amount: actualDamage,
            source: context.source,
            type: context.damageType
        }));
    }

    return actualDamage;
}

export function applyEffect(
    gameState: GameState,
    effect: any,
    context: any,
    eventHandler: GameEvent[]
): boolean {
    // Check if effect can be applied with context
    if (!gameState.effectManager.canApplyEffect(gameState, effect, context)) {
        return false;
    }

    // Add the effect
    gameState.effectManager.addEffect(effect, context);

    // Emit effect added event
    eventHandler.push(new GameEvent({
        type: GameEventType.EFFECT_ADD,
        data: {
            source: context.source,
            target: context.target,
            effectType: effect.type
        }
    }));

    return true;
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

export function attachEnergyFromEnergyZone(
    gameState: GameState,
    playerIndex: number,
    targetZoneName: ZoneName,
    eventHandler: GameEvent[]
): boolean {
    const player = gameState.players[playerIndex];
    const energyType = player.currentEnergyZone;

    if (!energyType || energyType === Type.NONE) {
        return false;
    }
    player.currentEnergyZone = Type.NONE;
    player.canAttachEnergy = false;
    return attachEnergy(gameState, playerIndex, energyType, targetZoneName, eventHandler);
}

export function attachEnergy(
    gameState: GameState,
    playerIndex: number,
    energyType: string,
    targetZoneName: ZoneName,
    eventHandler: GameEvent[]
): boolean {
    const player = gameState.players[playerIndex];
    player.addEnergyToZone(energyType, targetZoneName);

    // Emit game state event
    eventHandler.push(new GameEvent({
        type: GameEventType.ATTACH_ENERGY,
        data: {
            playerIndex: playerIndex,
            type: energyType,
            targetZone: targetZoneName
        }
    }));
    return true;
}

export function initializeEnergyZones(
    gameState: GameState,
    eventHandler: GameEvent[]
): void {
    [0, 1].forEach(playerIndex => {
        const player = gameState.players[playerIndex];
        const energyTypes = player.deck.getEnergyTypes();
        if (energyTypes.length === 0) return;

        // Set current energy to NONE
        player.currentEnergyZone = Type.NONE;
        eventHandler.push(new GameEvent({
            type: GameEventType.ENERGY_ZONE_UPDATE,
            data: {
                playerIndex: playerIndex,
                type: Type.NONE,
                zoneType: EnergyZoneLocation.CURRENT
            }
        }));

        // Initialize next energy zone with random type
        const randomIndex = Math.floor(Math.random() * energyTypes.length);
        const newNextEnergy = energyTypes[randomIndex];
        player.nextEnergyZone = newNextEnergy;
        eventHandler.push(new GameEvent({
            type: GameEventType.ENERGY_ZONE_UPDATE,
            data: {
                playerIndex: playerIndex,
                type: newNextEnergy,
                zoneType: EnergyZoneLocation.NEXT
            }
        }));
    });
}

function updateEnergyZones(
    gameState: GameState,
    playerIndex: number,
    eventHandler: GameEvent[]
): void {
    const player = gameState.players[playerIndex];
    const energyTypes = player.deck.getEnergyTypes();
    if (energyTypes.length === 0) return;

    // Update current energy
    const newCurrentEnergy = player.nextEnergyZone;
    player.currentEnergyZone = newCurrentEnergy;
    player.nextEnergyZone = null;
    
    // Emit event for current energy update
    eventHandler.push(new GameEvent({
        type: GameEventType.ENERGY_ZONE_UPDATE,
        data: {
            playerIndex: playerIndex,
            type: newCurrentEnergy,
            zoneType: EnergyZoneLocation.CURRENT
        }
    }));

    // Generate and set new next energy
    const randomIndex = Math.floor(Math.random() * energyTypes.length);
    const newNextEnergy = energyTypes[randomIndex];
    player.nextEnergyZone = newNextEnergy;
    
    // Emit event for next energy update
    eventHandler.push(new GameEvent({
        type: GameEventType.ENERGY_ZONE_UPDATE,
        data: {
            playerIndex: playerIndex,
            type: newNextEnergy,
            zoneType: EnergyZoneLocation.NEXT
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

    // Reset turn-based flags and update energy zones
    nextPlayer.canAttachEnergy = true;
    nextPlayer.canSupporter = true;
    updateEnergyZones(gameState, nextPlayerIndex, eventHandler);

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
