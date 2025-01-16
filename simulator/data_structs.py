from enum import Enum, Flag, auto
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel

class EffectType(str, Enum):
    BASIC = "basic"
    STATUS = "status"
    COIN_FLIP = "coin_flip"
    MULTI_COIN = "multi_coin"
    ENERGY_DISCARD = "energy_discard"  # Now a standard effect
    IMMUNITY = "immunity"  # New standard effect type!
    CUSTOM = "custom"

class Immunity(Flag):
    NONE = 0
    DAMAGE = auto()      # Immune to damage
    STATUS = auto()      # Immune to status effects
    ENERGY_REMOVE = auto()  # Can't have energy removed
    ALL = DAMAGE | STATUS | ENERGY_REMOVE

class Effect(BaseModel):
    type: EffectType
    base_damage: int = 0
    effect_id: Optional[str] = None  # Only needed for CUSTOM effects
    params: Dict[str, Any] = {}
"""
G - Grass
R - Fire
W - Water
L - Lightning
P - Psychic
F - Fighting
D - Darkness
M - Metal
Y - Fairy (in older sets before it was removed)
C - Colorless
N - Dragon (though this is less standardized)
"""
class Type(str, Enum):
    FIRE = "fire"
    WATER = "water"
    PSYCHIC = "psychic"
    GRASS = "grass"
    LIGHTING = "lightning"
    DRAGON = "dragon"
    FAIRY = "fairy"
    DARK = "dark"
    FIGHTING = "fighting"
    COLORLESS = "colorless"

class Rarity(str, Enum):
    DIAMOND_1 = "diamond_1"
    DIAMOND_2 = "diamond_2"
    DIAMOND_3 = "diamond_3"
    DIAMOND_4 = "diamond_4"
    STAR_1 = "star-1"
    STAR_2 = "star-2"
    STAR_3 = "star-3"
    CROWN = "crown"

class StatusEffect(str, Enum):
    ASLEEP = "asleep"
    CONFUSED = "confused"
    PARALYZED = "paralyzed"
    POISONED = "poisoned"
    BURNED = "burned"

class Effect(BaseModel):
    base_damage: int = 0

class BasicEffect(Effect):
    """Just does damage"""
    pass

class StatusEffect(Effect):
    """Applies a status condition"""
    status: StatusEffect
    target: str = "opponent"  # or "self"

class CoinFlipEffect(Effect):
    """Flip a coin, do something if heads, maybe something else if tails"""
    heads_effect: Optional[Effect] = None
    tails_effect: Optional[Effect] = None

class PsychicEffect(Effect):
    base_damage: int = 0
    damage_per_energy: int = 0

class ImmunityEffect: 
    target: Literal["self", "opponent"] = "self"
    immunity: Immunity

class CantAttackEffect: 
    target: Literal["self", "opponent"] = "self"
    
class EnergyDiscardCostEffect(Effect):
    """Discard X energy cards, do something for each discarded"""
    minimum_discard: int = 1
    maximum_discard: Optional[int] = None

    damage_per_discard: int
    # If None, there is no maximum

class Attack(BaseModel):
    name: str
    effect: Effect
    cost: List[Type]
    damage: int = 0

class Card(BaseModel):
    name: str = "INVALID_NAME"
    HP: int = 30
    set: str = ""
    rarity: Rarity = Rarity.DIAMOND_1
    type: Type = "COLORLESS"
    retreat: int = 0
    weakness: Optional[Type] = None
    attacks: List[Attack]
    stage: int = 0

    effects: Optional[List[Effect]] = None
    damage:int = 0
if __name__=='__main__':
    import os
    # load from json file
    import json
    from pathlib import Path
    pokedata_dir = Path(__file__).parent.parent / "assets" / "pokedata"
    os.listdir(pokedata_dir)
    # load all json files in pokedata_dir
    for file in pokedata_dir.glob("*.json"):
        with open(file, "r") as f:
            data = json.load(f)
            # load into pydantic model
            card = Card(**data)
            # print card name and type)
            print(card)
    