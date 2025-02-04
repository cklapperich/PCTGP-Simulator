/**
 * Default pack odds configuration for different card positions
 * Position 1-3: Common cards (diamond_2)
 * Position 4-5: Variable rarity based on odds with diamond_2 fallback
 * @type {Object}
 */
const DEFAULT_PACK_ODDS = {
  // Positions 1-3 are 100% common (diamond_2)
  common: {
    diamond_1: 100
  },
  
  // Position 4 odds
  position4: {
    crown: 0.04,
    star_3: 0.222,
    star_2: 0.5,
    star_1: 2.572,
    diamond_4: 1.666,
    diamond_3: 5.0,
    diamond_2: 90.0
  },

  // Position 5 odds  
  position5: {
    crown: 0.160,
    star_3: 0.888,
    star_2: 2.0,
    star_1: 10.288,
    diamond_4: 6.664,
    diamond_3: 20.0,
    diamond_2: 60.0
  }
};

// Global cache for pack data
const packDataCache = new Map();

/**
 * Loads and parses pack data from JSON file, using cache if available
 * @param {string} packId - ID of the pack to load
 * @returns {Promise<Object>} Pack data including card pools and configuration
 */
async function loadPackData(packId) {
  // Return cached data if available
  if (packDataCache.has(packId)) {
    return packDataCache.get(packId);
  }

  try {
    // Add leading slash for absolute path
    const response = await fetch(`/packs/${packId}.json`);
    const packData = await response.json();
    // Cache the loaded data
    packDataCache.set(packId, packData);
    return packData;
  } catch (error) {
    console.error(`Failed to load pack data for ${packId}:`, error);
    throw new Error(`Failed to load pack data for ${packId}: ${error.message}`);
  }
}

/**
 * Selects a random rarity based on provided odds
 * @param {Object} odds - Odds configuration mapping rarity to chance
 * @returns {string} Selected rarity, falls back to diamond_2 if no match
 */
function getRandomWithOdds(odds) {
  const rand = Math.random() * 100;
  let cumulative = 0;
  
  for (const [rarity, chance] of Object.entries(odds)) {
    cumulative += chance;
    if (rand <= cumulative) {
      return rarity;
    }
  }
  
  // Fallback to most common rarity
  return 'diamond_2';
}

/**
 * Selects a random card from the specified rarity pool
 * @param {Object} packData - Pack data containing card pools
 * @param {string} rarity - Rarity to select from
 * @returns {Object} Selected card data including ID and rarity
 */
function getRandomCard(packData, rarity) {
  const pool = packData[rarity];
  if (!pool || pool.length === 0) {
    // Fallback to diamond_2 if pool is empty
    return getRandomCard(packData, 'diamond_2');
  }
  const cardId = pool[Math.floor(Math.random() * pool.length)];
  return {
    id: cardId,
    rarity: rarity,
    position: null // Will be set by pullPack
  };
}

/**
 * Simulates pulling cards from a pack
 * @param {Object} packData - Pack data containing card pools and configuration
 * @returns {Promise<Array<Object>>} Array of card data objects containing id, rarity, and position
 */
async function pullPack(packData) {
  const packOdds = packData.pack_odds === 'default' ? DEFAULT_PACK_ODDS : packData.pack_odds;
  const results = [];

  // First 3 cards - guaranteed common (diamond_2)
  for (let i = 0; i < 3; i++) {
    const card = getRandomCard(packData, 'diamond_2');
    card.position = i + 1;
    results.push(card);
  }

  // 4th card
  const rarity4 = getRandomWithOdds(packOdds.position4);
  const card4 = getRandomCard(packData, rarity4);
  card4.position = 4;
  results.push(card4);

  // 5th card
  const rarity5 = getRandomWithOdds(packOdds.position5);
  const card5 = getRandomCard(packData, rarity5);
  card5.position = 5;
  results.push(card5);

  return results;
}

// Export functions
export {
  pullPack,
  loadPackData,
  DEFAULT_PACK_ODDS
};
