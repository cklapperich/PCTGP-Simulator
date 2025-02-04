// Duplicated from src/RulesEngine/enums.ts
export const Type = {
    GRASS: "grass",
    FIRE: "fire",
    WATER: "water",
    LIGHTNING: "lightning",
    FIGHTING: "fighting",
    PSYCHIC: "psychic",
    COLORLESS: "colorless",
    DARK: "dark",
    DRAGON: "dragon",
    METAL: "metal",
    FAIRY: "fairy",
    NONE: "none"
};

export const CardType = {
    POKEMON: 'POKEMON',
    TRAINER: 'ITEM',
    SUPPORTER: 'SUPPORTER',
    TOOL: 'TOOL'
};

export const Stage = {
    BASIC: "basic",
    STAGE_1: "stage_1",
    STAGE_2: "stage_2",
    NONE: "none"
};

// Energy symbol mapping
const energySymbolToType = {
    'G': Type.GRASS,
    'R': Type.FIRE,
    'W': Type.WATER,
    'L': Type.LIGHTNING,
    'P': Type.PSYCHIC,
    'F': Type.FIGHTING,
    'D': Type.DARK,
    'M': Type.METAL,
    'Y': Type.FAIRY,
    'N': Type.DRAGON,
    'C': Type.COLORLESS
};

// Utility function for rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Parse rarity symbols to our format
function parseRarity(rarityText) {
    rarityText = rarityText.trim();
    if (rarityText === 'Crown Rare') return 'crown';
    
    const diamondCount = (rarityText.match(/◊/g) || []).length;
    if (diamondCount > 0) return `diamond_${diamondCount}`;
    
    const starCount = (rarityText.match(/☆/g) || []).length;
    if (starCount > 0) return `${starCount}_star`;
    
    return 'unknown';
}

// Parse attack costs from ptcg-symbol spans
function parseAttackCost(costText) {
    if (!costText) return [];
    return costText.split('').map(symbol => energySymbolToType[symbol] || Type.COLORLESS);
}

// Parse attack damage amount - just get the last number in the string
function parseAttackDamage(name) {
    const numbers = name.match(/\d+/g);
    return numbers ? parseInt(numbers[numbers.length - 1]) : 0;
}

// Clean attack name by removing leading "0" and newlines
function cleanAttackName(name) {
    return name.replace(/^0\s*/, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}

export {
    delay,
    parseRarity,
    parseAttackCost,
    parseAttackDamage,
    cleanAttackName
};
