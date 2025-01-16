
# Example usage in card definitions:
charizard_fire_spin = Attack(
    name="Fire Spin",
    cost=[Type.FIRE, Type.FIRE],
    text="Discard 2 Energy attached to Charizard and do 100 damage",
    effect=create_energy_discard_effect(damage=100, energy_count=2)
)

mewtwo_psychic = Attack(
    name="Psychic",
    cost=[Type.PSYCHIC, Type.COLORLESS],
    text="10 damage plus 10 more damage for each Energy card attached to the Defending Pokémon",
    effect=Effect(
        type=EffectType.CUSTOM,
        effect_id="psychic_scaling_damage",
        base_damage=10,
        params={"damage_per_energy": 10}
    )
)

# game.py
from effects import EffectRegistry, EffectType

class Game:
    def __init__(self):
        self.effect_registry = EffectRegistry()
    
    def apply_effect(self, effect: Effect, game_state):
        if effect.type == EffectType.BASIC:
            self.apply_damage(effect.base_damage)
        elif effect.type == EffectType.ENERGY_DISCARD:
            self.apply_damage(effect.base_damage)
            self.discard_energy(effect.params["energy_count"])
        elif effect.type == EffectType.CUSTOM:
            handler = self.effect_registry.custom_effects[effect.effect_id]
            handler(game_state, effect.params)