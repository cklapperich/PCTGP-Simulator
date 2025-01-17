import { pullPack, loadPackData, DEFAULT_PACK_ODDS } from '../pack_pull.js';

// Mock pack data for testing
const TEST_PACK = {
    "set_id": "TEST",
    "packname": "Test Pack",
    "pack_odds": "default",
    "diamond_1": ["D1-001", "D1-002"],
    "diamond_2": ["D2-001", "D2-002"],
    "diamond_3": ["D3-001", "D3-002"],
    "diamond_4": ["D4-001", "D4-002"],
    "star_1": ["S1-001", "S1-002"],
    "star_2": ["S2-001", "S2-002"],
    "star_3": ["S3-001", "S3-002"],
    "crown": ["CR-001", "CR-002"]
};

// Mock fetch for testing
global.fetch = async (url) => ({
    json: async () => {
        if (url.includes('TEST.json')) {
            return TEST_PACK;
        }
        throw new Error('Pack not found');
    }
});

/**
 * Tests basic pack pulling functionality
 */
async function testBasicPull() {
    console.log('\n=== Testing Basic Pack Pull ===');
    
    const cards = await pullPack('TEST');
    
    // Verify we got 5 cards
    console.assert(cards.length === 5, `Expected 5 cards, got ${cards.length}`);
    
    // Verify first 3 are diamond_2
    const firstThree = cards.slice(0, 3);
    firstThree.forEach((card, i) => {
        console.assert(
            card.startsWith('D2-'),
            `Card ${i + 1} should be diamond_2, got ${card}`
        );
    });

    console.log('Basic pull test complete');
}

/**
 * Tests rarity distribution over many pulls
 */
async function testRarityDistribution() {
    console.log('\n=== Testing Rarity Distribution ===');
    
    const SAMPLE_SIZE = 10000;
    const position4Stats = {};
    const position5Stats = {};
    
    // Perform pulls
    for (let i = 0; i < SAMPLE_SIZE; i++) {
        const cards = await pullPack('TEST');
        
        // Track 4th card rarity
        const card4 = cards[3];
        const rarity4 = card4.split('-')[0];
        position4Stats[rarity4] = (position4Stats[rarity4] || 0) + 1;
        
        // Track 5th card rarity
        const card5 = cards[4];
        const rarity5 = card5.split('-')[0];
        position5Stats[rarity5] = (position5Stats[rarity5] || 0) + 1;
    }
    
    // Check 4th card distribution
    console.log('\nPosition 4 Distribution:');
    Object.entries(position4Stats).forEach(([rarity, count]) => {
        const actualPercentage = (count / SAMPLE_SIZE) * 100;
        console.log(`${rarity}: ${actualPercentage.toFixed(3)}%`);
    });
    
    // Check 5th card distribution
    console.log('\nPosition 5 Distribution:');
    Object.entries(position5Stats).forEach(([rarity, count]) => {
        const actualPercentage = (count / SAMPLE_SIZE) * 100;
        console.log(`${rarity}: ${actualPercentage.toFixed(3)}%`);
    });
}

/**
 * Tests cache functionality
 */
async function testCache() {
    console.log('\n=== Testing Cache ===');
    
    let fetchCount = 0;
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
        fetchCount++;
        return originalFetch(url);
    };
    
    // First load should fetch
    await loadPackData('TEST');
    console.assert(fetchCount === 1, 'First load should fetch data');
    
    // Second load should use cache
    await loadPackData('TEST');
    console.assert(fetchCount === 1, 'Second load should use cache');
    
    // Multiple pulls should use cache
    await pullPack('TEST');
    await pullPack('TEST');
    console.assert(fetchCount === 1, 'Multiple pulls should use cache');
    
    console.log('Cache test complete');
    
    // Restore original fetch
    global.fetch = originalFetch;
}

/**
 * Tests fallback behavior
 */
async function testFallbacks() {
    console.log('\n=== Testing Fallbacks ===');
    
    // Test pack with empty pools
    const emptyPoolPack = {
        ...TEST_PACK,
        star_1: [],
        star_2: [],
        star_3: [],
        crown: []
    };
    
    global.fetch = async () => ({
        json: async () => emptyPoolPack
    });
    
    const cards = await pullPack('EMPTY');
    
    // All cards should fallback to diamond_2
    cards.forEach((card, i) => {
        console.assert(
            card.startsWith('D2-'),
            `Card ${i + 1} should fallback to diamond_2, got ${card}`
        );
    });
    
    console.log('Fallback test complete');
}

// Run all tests
async function runTests() {
    try {
        await testBasicPull();
        await testRarityDistribution();
        await testCache();
        await testFallbacks();
        console.log('\nAll tests completed successfully');
    } catch (error) {
        console.error('Tests failed:', error);
    }
}

runTests();
