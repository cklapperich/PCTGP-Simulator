/*
Typical URL: https://pocket.limitlesstcg.com/cards/{set}/{number}

Title, rarity, name, image, illustrator, and other info are all included
The image asset should be named {set}_{number}_{language}.webp

Exammple output JSON:

{
    "name": "Bulbasaur",
    "category":"pokemon",
    "subcategory":"supporter",
    "id": "A1-001",
    "stage": "basic",
    "set": "A1",
    "type": "grass",
    "HP": 70,
    "retreat": 1,
    "weakness": "fire",
    "rarity":"diamond_1",
    "artist":"Narumi Sato",
    "attacks": [
        {
            "name": "Vine Whip",
            "cost": ["grass", "colorless"],
            "text": "",
            "effect": {
                "type": "SIMPLE_DAMAGE",
                "amount": 20
            }
        }
    ]
}


Example cards:


Spearow
- Colorless - 60 HP

Pokémon - Basic

C Peck 20


Weakness: Lightning
Retreat: 1

Illustrated by Shiburingaru

Wigglytuff ex
- Colorless - 140 HP

Pokémon - Stage 1 - Evolves from Jigglypuff

CCC Sleepy Song 80

Your opponent's Active Pokémon is now Asleep.

Weakness: Fighting
Retreat: 2

ex rule: When your Pokémon ex is Knocked Out, your opponent gets 2 points.

Illustrated by PLANETA Igarashi


Mars

Trainer - Supporter

Your opponent shuffles their hand into their deck and draws a card for each of their remaining points needed to win.
Illustrated by Yuu Nishida

Rarity will be tricky, the webpage uses icons to denote rarity, but also to denote teh rarity of its variants:

A2
Space-Time Smackdown (A2)
#195 · ☆☆ · Palkia pack
Versions
Space-Time Smackdown #155
◊◊
Space-Time Smackdown #195
☆☆


in this case, the correct answer for rarity is "2_star" as this specific variant has 2 stars. 

raritys can be 1/2/3/4 diamond or 1/2/3 star or crown.

Crown rare uses the text "Crown Rare" instead of symbols

Mewtwo ex
- Psychic - 150 HP

Pokémon - Basic

PC Psychic Sphere 50


PPCC Psydrive 150

Discard 2 [P] Energy from this Pokémon.

Weakness: Darkness
Retreat: 2

ex rule: When your Pokémon ex is Knocked Out, your opponent gets 2 points.

Illustrated by PLANETA Mochizuki
A1
Genetic Apex (A1)
#286 · Crown Rare
Versions
Genetic Apex #129
◊◊◊◊
Genetic Apex #262
☆☆
Genetic Apex #282
☆☆☆
Genetic Apex #286
Crown Rare


For pokemon cards, subcategory can be ommited entirely. for trainer cards, HP and retreat cost ommitted.
For all cards, attacks and abilities should have their effects left as a blank dict {} as we'll code the effects in later.
just name text cost.
For trainer cards, the category should be "trainer" and subcategory should be the type of trainer card.

For EX pokemon, we need an "ex:true" added to the json

We'll need to iterate over every card in a set like A1)

the scraping function should take the set name (A1) in as an input.

then there should be a subfunction to scrape a single page.

and a sub functions to do each of: extract rarity, HP, category, subcategory, download the image, retreat cost, name, is ex, attack names