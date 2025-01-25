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
    const response = await fetch(`assets/packs/${packId}.json`);
    const packData = await response.json();
    // Cache the loaded data
    packDataCache.set(packId, packData);
    return packData;
  } catch (error) {
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
 * @returns {string} Selected card ID, falls back to diamond_2 pool if empty
 */
function getRandomCard(packData, rarity) {
  const pool = packData[rarity];
  if (!pool || pool.length === 0) {
    // Fallback to diamond_2 if pool is empty
    return getRandomCard(packData, 'diamond_2');
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * Simulates pulling cards from a pack
 * @param {string} packId - ID of the pack to pull from
 * @returns {Promise<string[]>} Array of card IDs pulled from the pack
 */
async function pullPack(packId) {
  const packData = await loadPackData(packId);
  const packOdds = packData.pack_odds === 'default' ? DEFAULT_PACK_ODDS : packData.pack_odds;
  const results = [];

  // First 3 cards - guaranteed common (diamond_2)
  for (let i = 0; i < 3; i++) {
    results.push(getRandomCard(packData, 'diamond_2'));
  }

  // 4th card
  const rarity4 = getRandomWithOdds(packOdds.position4);
  results.push(getRandomCard(packData, rarity4));

  // 5th card
  const rarity5 = getRandomWithOdds(packOdds.position5);
  results.push(getRandomCard(packData, rarity5));

  return results;
}

// Export functions
export {
  pullPack,
  loadPackData,
  DEFAULT_PACK_ODDS
};
