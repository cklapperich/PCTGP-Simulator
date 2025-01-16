import data_structs
from data_structs import Card, Type
from enum import Enum, auto
from typing import List, Dict, Optional
from pydantic import BaseModel

from queue import Queue

output_queue = Queue()
input_queue = Queue()

class EventType(Enum):
    # Game state events
    SHUFFLE = "shuffle"
    DRAW_CARD = "draw_card"
    ATTACH_ENERGY = "attach_energy"
    ATTACK = "attack"
    FLIP_COINS = "flip_coins"
    PHASE_CHANGE = "phase_change"
    GAME_END = "game_end"
    TURN_CHANGE = "turn_change"

    # Special interaction events
    SEARCH_DECK = "search_deck"       # Search deck with filtered legal choices
    SEARCH_DISCARD = "search_discard" # Search discard with filtered legal choices
    SELECT_PRIZE = "select_prize"     # Select prize card(s)
    WAIT_FOR_INPUT = "wait_for_input" # Wait for player to make a choice

class SearchParams(BaseModel):
    """Parameters for search events"""
    instruction: str           # Clear text instruction for player
    legal_cards: List[Card]    # Pre-filtered list of legal choices
    min_cards: int = 1         # Minimum cards to select
    max_cards: int = 1         # Maximum cards to select
    can_cancel: bool = False   # Whether player can cancel the search
    player_id: int             # ID of the player performing the search (0 or 1)
    reason: str = ""           # What triggered this search (e.g., "Professor Oak's effect")

class Event(BaseModel):
    event_type: EventType
    data: Dict = {}
    search_params: Optional[SearchParams] = None  # For search events

class Phase(Enum):
    # INITIAL setup
    setup = "SETUP"
    initial_coin_flip = "INITIAL_COIN_FLIP"
    deal_cards = "DEAL_CARDS"
    place_basics = "SETUP_PLACE_CARDS"

    # normal game flow
    draw = "DRAW"
    attack = "ATTACK"
    between_turns = "BETWEEN_TURNS"

    # end
    game_end = "GAME_END"

class Deck:
    def __init__(self, cards: List[Card]):
       self.cards = cards
       self.shuffle()

    def shuffle(self):
       random.shuffle(self.cards)
       return self.cards

    def draw(self) -> Card:
       card = self.cards.pop()
       return card

class PlayerState(BaseModel):
    class Config:
        arbitrary_types_allowed = True
    name: str = "DEFAULT"
    hand: List[Card] = []
    bench: Dict[int,Card] = {}
    active: Card = None
    points: int = 0
    deck: Deck = None
    discard: List[Card] = []
    energy: Type = None
    next_energy: Type = None
    is_ai: bool = False
    can_attach_energy: bool = True
    can_attack: bool = True
    
class GameState(BaseModel):
    phase: Phase = Phase.initial_coin_flip
    players: Dict[int, PlayerState] = {}
    turn: int = 0
    current_player: int = 0

def get_current_player(self):
    return self.players[self.current_player]

import random
def flip_coins(n)-> List[bool]:
    return [random.choice([True, False]) for _ in range(n)]

def start_game(player1:PlayerState, player2:PlayerState):
    # INITIAL SETUP
    game_state = GameState()
    game_state.turn = 0
    game_state.players[0] = player1
    game_state.players[1] = player2
    for player in game_state.players.values():
        player.can_attach_energy = False
        player.can_attack = False

    # INITIAL COIN FLIP PHASE
    game_state.phase = Phase.initial_coin_flip
    e = Event(event_type=EventType.PHASE_CHANGE, data={"phase": Phase.initial_coin_flip})
    output_queue.put(Event(event_type=EventType.PHASE_CHANGE, data={"phase": game_state.phase}))

    # INITIAL COIN FLIP EVENT
    flip = flip_coins(1)
    if flip[0]:
        game_state.current_player = 0
    else:
        game_state.current_player = 1
    
    e = Event(event_type=EventType.FLIP_COINS, data={"flip": flip})
    output_queue.put(e)
    
    # INITIAL DRAW PHASE
    game_state.phase = Phase.setup
    e = Event(event_type=EventType.PHASE_CHANGE, data={
        "phase": Phase.setup,
        "first_player": game_state.players[game_state.current_player]
    })
    output_queue.put(e)
    
    # SHUFFLE EACH DECK AND DRAW 7 CARDS FOR EACH PLAYER
    for player in game_state.players.values():
        player.deck.shuffle()
        e = Event(event_type=EventType.SHUFFLE, data={"player": player})
        output_queue.put(e)

        for _ in range(7):
            card = player.deck.draw()
            player.hand.append(card)
            e = Event(event_type=EventType.DRAW_CARD, data={"player": player, "card": card, "hand": player.hand})
            output_queue.put(e)

    return game_state

def check_state_based_actions(game_state):
    # check if any pokemon are knocked out
    # check for 'if a pokemon would be knocked out' type  effects'
    # knock the pokemon out if necessary
    # check for 'if a pokemon is knocked out' type effects
    
    # no active - ask player to select an active, and if no pokemon in hand, end the game
    pass

def get_legal_moves(game_state):
    # determine all legal moves based on the game state and all effects on all players and pokemon