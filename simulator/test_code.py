
# Simulate a deck search for basic Pokemon
print("\n=== Searching Deck for Basic Pokemon ===")
basic_pokemon = [c for c in player1.deck.cards if not hasattr(c, 'evolves_from')]  # Simple basic check
search_params = SearchParams(
    instruction="Choose a Basic Pokemon from your deck",
    legal_cards=basic_pokemon,
    min_cards=0,
    max_cards=1,
    can_cancel=True,
    player_id=0,  # Player 1
    reason="Testing deck search functionality"
)
output_queue.put(Event(
    event_type=EventType.SEARCH_DECK,
    search_params=search_params
))

# Draw some additional cards
print("\n=== Drawing Additional Cards ===")
for _ in range(3):
    card = player1.deck.draw()
    player1.hand.append(card)
    e = Event(event_type=EventType.DRAW_CARD, data={"player": player1, "card": card, "hand": player1.hand})
    output_queue.put(e)

print(f"\nPlayer 1 now has {len(player1.hand)} cards in hand")
