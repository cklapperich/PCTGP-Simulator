import json
from copy import deepcopy
from game_loop import (
    Deck, PlayerState, start_game, EventType, Event, 
    output_queue, SearchParams, Phase
)
from data_structs import Card, Type, Attack, Effect, Rarity, BasicEffect


# Load card data from JSON files
def load_card(file_path: str) -> Card:
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    # Convert JSON data to match our Card model
    attacks = []
    for atk in data['attacks']:
        effect = BasicEffect(base_damage=atk['effect']['base_damage'])
        attack = Attack(
            name=atk['name'],
            effect=effect,
            cost=[Type(c) for c in atk['cost']],
            damage=atk['effect']['base_damage']
        )
        attacks.append(attack)
    
    return Card(
        name=data['name'],
        HP=data['HP'],
        type=Type(data['type']),
        attacks=attacks,
        retreat=data['retreat'],
        rarity=data['rarity'],
        set=data['set']
    )

# Load cards
pikachu_template = load_card('assets/pokedata/A1_094.json')
bulbasaur_template = load_card('assets/pokedata/A1_227.json')

# Create multiple unique instances using deepcopy
deck1_cards = (
    [deepcopy(pikachu_template) for _ in range(30)] +  # 30 Pikachus
    [deepcopy(bulbasaur_template) for _ in range(30)]  # 30 Bulbasaurs
)

deck2_cards = (
    [deepcopy(pikachu_template) for _ in range(30)] +  # 30 Pikachus
    [deepcopy(bulbasaur_template) for _ in range(30)]  # 30 Bulbasaurs
)

# Create decks
deck1 = Deck(deck1_cards)
deck2 = Deck(deck2_cards)

# Create players
player1 = PlayerState(
    name="Player 1",
    deck=deck1
)

player2 = PlayerState(
    name="Player 2", 
    deck=deck2
)

# Start game
game_state = start_game(player1, player2)

def print_card_details(card: Card):
    print(f"{card.name} ({card.type.value.title()}, {card.HP} HP)")
    for attack in card.attacks:
        cost = '/'.join(c.value.title() for c in attack.cost)
        print(f"  Attack: {attack.name} ({cost}) - {attack.damage} dmg")
def handle_shuffle_event(event:Event):
    print(f"Shuffling {event.data['player'].name}'s deck...")

def handle_draw_event(event: Event):
    """Handle displaying a card draw event to the user"""
    player = event.data['player']
    card = event.data['card']
    if len(event.data['hand']) == 1:  # First card drawn
        print(f"\n=== {player.name}'s Opening Hand ===")
    print(f"- ", end="")
    print_card_details(card)

def handle_phase_change_event(event: Event):
    phase = event.data['phase']
    print(f"\n====== {phase.value} PHASE ======")
    
    if phase == Phase.initial_coin_flip:
        print("Flipping a coin to determine who goes first...")
    elif phase == Phase.setup:
        first_player = event.data['first_player']
        print(f"{first_player.name} will go first!")

def handle_search_event(event: Event):
    """Handle displaying a search event to the user"""
    print(f"\n=== DECK SEARCH ===")
    print(f"Instructions: {event.search_params.instruction}")
    print(f"Reason: {event.search_params.reason}")
    print(f"Player {event.search_params.player_id + 1}, choose {event.search_params.min_cards}-{event.search_params.max_cards} cards from:")
    # Show first 10 cards with a message if there are more
    display_limit = 10
    for i, card in enumerate(event.search_params.legal_cards[:display_limit]):
        print(f"{i+1}. ", end="")
        print_card_details(card)
    remaining = len(event.search_params.legal_cards) - display_limit
    if remaining > 0:
        print(f"...and {remaining} more cards")
    if event.search_params.can_cancel:
        print("(You may cancel this search)")

def handle_coin_flip(event: Event):
    print(f"flipping {len(event.data['flip'])} coins.")
    result_list = ["Heads" if flip else "Tails" for flip in event.data['flip']]
    result_str = "! ".join(result_list)
    print(result_str)

# Process initial game setup events
print("=== POKEMON TRADING CARD GAME SIMULATOR ===\n")
print("Game started!")
while not output_queue.empty():
    event = output_queue.get()
    
    if event.event_type == EventType.PHASE_CHANGE:
        handle_phase_change_event(event)
    
    elif event.event_type == EventType.FLIP_COINS:
        handle_coin_flip(event)

    elif event.event_type == EventType.SHUFFLE:
        handle_shuffle_event(event)
    
    elif event.event_type == EventType.DRAW_CARD:
        handle_draw_event(event)
    
    elif event.event_type == EventType.SEARCH_DECK:
        handle_search_event(event)
