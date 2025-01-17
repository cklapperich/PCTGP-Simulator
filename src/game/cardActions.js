import { EventType } from './enums.js';
import { Event } from './models.js';
import { UIoutputQueue } from './events.js';

/**
 * Draw a card from deck to hand
 * @param {PlayerState} player - Player drawing the card
 * @returns {Card} The drawn card
 */

//TODO: 
// draw cards needs to just fail / not fully complete if you have less cards in deck. 
// 1 card in deck, draw 3 -> draw 1
export function drawCard(player) {
    const card = player.deck.draw();
    const deckIndex = player.deck.cards.length; // Index card was drawn from
    card.setOwner(player);
    player.hand.push(card);
    
    // Emit game state event
    const drawEvent = new Event(EventType.DRAW_CARD, {
        player: player,
        card: card,
        hand: player.hand
    });
    UIoutputQueue.put(drawEvent);

    // Emit UI events
    UIoutputQueue.put(new Event(EventType.CARD_MOVE, {
        card: card,
        player: player,
        sourceZone: 'deck',
        sourceIndex: deckIndex,
        destinationZone: 'hand',
        destinationIndex: player.hand.length - 1
    }));

    UIoutputQueue.put(new Event(EventType.CARD_REVEAL, {
        card: card,
        player: player
    }));

    return card;
}

/**
 * Play a Pokemon card to the field
 * @param {Card} card - Pokemon card to play
 * @param {PlayerState} player - Player playing the card
 * @param {GameState} gameState - Current game state
 * @returns {boolean} Whether the card was successfully played
 */
export function playPokemonCard(card, player ,gameState) {
    // Remove from hand
    const handIndex = player.hand.indexOf(card);
    if (handIndex === -1) return false;
    player.hand.splice(handIndex, 1);

    // Set owner if not already set
    if (!card.owner) {
        card.setOwner(player);
    }

    // Place as active if no active Pokemon
    if (!player.active) {
        player.active = card;
        UIoutputQueue.put(new Event(EventType.CARD_MOVE, {
            card: card,
            player: player,
            sourceZone: 'hand',
            sourceIndex: handIndex,
            destinationZone: 'active'
        }));
        return true;
    }

    // Otherwise try to place on bench
    const benchSpots = Object.keys(player.bench).length;
    if (benchSpots < 5) {
        // Find first empty bench spot
        let benchIndex = 0;
        while (player.bench[benchIndex]) benchIndex++;
        player.bench[benchIndex] = card;
        
        UIoutputQueue.put(new Event(EventType.CARD_MOVE, {
            card: card,
            player: player,
            sourceZone: 'hand',
            sourceIndex: handIndex,
            destinationZone: 'bench',
            destinationIndex: benchIndex
        }));
        return true;
    }

    // Bench is full, return card to hand
    player.hand.splice(handIndex, 0, card);
    // No need for a CARD_MOVE event since the card stays in hand
    return false;
}

/**
 * Attach energy from energy zone to a Pokemon
 * @param {Type} energyType - Type of energy to attach
 * @param {Card} targetPokemon - Pokemon to attach energy to
 * @param {PlayerState} player - Player attaching the energy
 * @returns {boolean} Whether energy was successfully attached
 */
export function attachEnergy(energyType, targetPokemon, player) {
    if (!player.canAttachEnergy) return false;

    if (targetPokemon.attachEnergy(energyType)) {
        // Emit game state event
        UIoutputQueue.put(new Event(EventType.ATTACH_ENERGY, {
            player: player,
            energyType: energyType,
            target: targetPokemon
        }));

        // Find target zone and index
        let destinationZone, destinationIndex;
        if (targetPokemon === player.active) {
            destinationZone = 'active';
            destinationIndex = null;
        } else {
            destinationZone = 'bench';
            destinationIndex = Object.entries(player.bench)
                .find(([_, card]) => card === targetPokemon)?.[0];
        }

        // Emit UI event for energy movement
        UIoutputQueue.put(new Event(EventType.CARD_MOVE, {
            card: { type: energyType }, // Energy cards are virtual
            player: player,
            sourceZone: 'energy_zone',
            destinationZone: destinationZone,
            destinationIndex: destinationIndex
        }));

        return true;
    }
    return false;
}

/**
 * Move a Pokemon to the discard pile and award points
 * @param {Card} pokemon - Pokemon to discard
 * @param {PlayerState} player - Player who owns the Pokemon
 * @param {PlayerState} opponent - Player who knocked out the Pokemon
 */
export function discardPokemon(pokemon, player, opponent) {
    // Award points to opponent
    if (opponent) {
        opponent.points += 1;
        const pointEvent = new Event(EventType.PHASE_CHANGE, {
            phase: "POINTS_AWARDED",
            player: opponent,
            amount: 1,
            reason: "knockout"
        });
        UIoutputQueue.put(pointEvent);
    }

    // Note: The CARD_MOVE event for discarding is now emitted by the caller
    // (e.g., in checkStateBasedActions) since they know the source zone
    player.discard.push(pokemon);
}
