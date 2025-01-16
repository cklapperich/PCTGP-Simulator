
# effect_registry.py
class EffectRegistry:
    def __init__(self):
        self.custom_effects = {
            "ancient_mew_energy_move": self.ancient_mew_effect,
            "destiny_bond": self.destiny_bond_effect,
            # Add other unique effects here
        }

    def ancient_mew_effect(self, game_state, params):
        # Implementation
        pass

    def destiny_bond_effect(self, game_state, params):
        # Implementation
        pass
