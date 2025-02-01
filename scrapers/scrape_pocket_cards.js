import { load } from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

// Utility function for rate limiting
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Convert energy symbols to our format
const energyMap = {
    'G': 'grass',
    'R': 'fire',
    'W': 'water',
    'L': 'lightning',
    'P': 'psychic',
    'F': 'fighting',
    'D': 'darkness',
    'M': 'metal',
    'Y': 'fairy',
    'N': 'dragon',
    'C': 'colorless'
};

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
    return costText ? costText.split('').map(symbol => energyMap[symbol] || 'colorless') : [];
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

// Extract card data from HTML
function parseCardData($, cardNumber, setId) {
    const paddedNumber = cardNumber.toString().padStart(3, '0');
    const cardData = {
        name: $('.card-text-name').text().trim(),
        id: `${setId}-${paddedNumber}`,
        set: setId,
        type: null,
        HP: null,
        category: null,
        subcategory: null,
        stage: null,
        evolvesFrom: null,
        retreat: null,
        artist: null,
        rarity: null,
        pack: null,
        text: null,
        resistance: null // Initialize resistance as null
    };

    // Extract type and HP from title
    const titleText = $('.card-text-title').text();
    const typeMatch = titleText.match(/- ([A-Za-z]+)\s+- (\d+) HP/);
    if (typeMatch) {
        cardData.type = typeMatch[1].toLowerCase();
        cardData.HP = parseInt(typeMatch[2]);
    }

    // Get card category and stage/subcategory
    const typeText = $('.card-text-type').text().trim();
    if (typeText.includes('Trainer')) {
        cardData.category = 'trainer';
        
        // Extract subcategory (Tool, Item, Supporter)
        if (typeText.includes('Tool')) {
            cardData.subcategory = 'tool';
        } else if (typeText.includes('Item')) {
            cardData.subcategory = 'item';
        } else if (typeText.includes('Supporter')) {
            cardData.subcategory = 'supporter';
        }
        
        // Get trainer card text
        const cardTextSections = $('.card-text-section');
        cardTextSections.each((i, section) => {
            const $section = $(section);
            // Skip the title section and artist section
            if (!$section.find('.card-text-title').length && !$section.hasClass('card-text-artist')) {
                cardData.text = $section.text().trim();
            }
        });
        
        // Add empty effect object for trainer cards
        cardData.effect = {};
    } else {
        cardData.category = 'pokemon';
        // Add attacks array for Pokemon cards
        cardData.attacks = [];
        
        // Extract stage info
        if (typeText.includes('Basic')) {
            cardData.stage = 'basic';
        } else {
            const stageMatch = typeText.match(/Stage (\d+)/);
            if (stageMatch) {
                cardData.stage = `stage ${stageMatch[1]}`;
            }
        }
        
        // Extract evolves from
        const evolvesFromLink = $('.card-text-type a').first();
        if (evolvesFromLink.length > 0) {
            cardData.evolvesFrom = evolvesFromLink.text().trim();
        }
    }

    // Check for ex Pokemon
    if ($('.card-text-wrr:contains("ex rule")').length > 0) {
        cardData.ex = true;
    }

    // Extract weakness, resistance, and retreat cost for Pokemon
    if (cardData.category === 'pokemon') {
        const wrrText = $('.card-text-wrr').first().text();
        const weaknessMatch = wrrText.match(/Weakness: ([A-Za-z]+)/);
        if (weaknessMatch) {
            cardData.weakness = weaknessMatch[1].toLowerCase();
        }

        // Only set resistance if it's not "none"
        const resistanceMatch = wrrText.match(/Resistance: ([A-Za-z]+)/);
        if (resistanceMatch) {
            const resistance = resistanceMatch[1].toLowerCase();
            if (resistance !== 'none') {
                cardData.resistance = resistance;
            }
        }
        
        const retreatMatch = wrrText.match(/Retreat: (\d+)/);
        if (retreatMatch) {
            cardData.retreat = parseInt(retreatMatch[1]);
        }
    }

    // Get artist
    const artistText = $('.card-text-artist a').text().trim();
    if (artistText) {
        cardData.artist = artistText;
    }

    // Extract rarity from current variant
    const rarityText = $('tr.current td:last-child').text();
    cardData.rarity = parseRarity(rarityText);

    // Extract pack name
    const packText = $('.card-prints-current .prints-current-details').text();
    const packMatch = packText.match(/(\w+)\s+pack/);
    if (packMatch) {
        cardData.pack = packMatch[1].toLowerCase();
    }

    // Parse attacks for Pokemon cards
    if (cardData.category === 'pokemon') {
        $('.card-text-attack').each((i, elem) => {
            const $attack = $(elem);
            const attackInfo = $attack.find('.card-text-attack-info').text().trim();
            
            // Extract cost symbols from the start of the string
            const costMatch = attackInfo.match(/^([A-Z]+)/);
            const name = cleanAttackName(attackInfo.substring(costMatch ? costMatch[0].length : 0));
            
            const attack = {
                name: name,
                cost: parseAttackCost(costMatch ? costMatch[1] : ''), // Empty array for 0-cost attacks
                text: $attack.find('.card-text-attack-effect').text().trim(),
                effect: {
                    type: "SIMPLE_DAMAGE",
                    amount: parseAttackDamage(name)
                }
            };
            cardData.attacks.push(attack);
        });
    }

    // Remove null values except resistance
    Object.keys(cardData).forEach(key => {
        if (cardData[key] === null && key !== 'resistance') {
            delete cardData[key];
        }
    });

    return cardData;
}

// Download and save card image
async function downloadImage(imageUrl, setId, number) {
    try {
        const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
        const imagePath = path.join(process.cwd(), 'assets', 'cardart', setId);
        await fs.mkdir(imagePath, { recursive: true });
        const paddedNumber = number.toString().padStart(3, '0');
        await fs.writeFile(
            path.join(imagePath, `${setId}-${paddedNumber}.png`),
            response.data
        );
    } catch (error) {
        console.error(`Error downloading image for ${setId}-${number}:`, error.message);
    }
}

// Save card data as JSON
async function saveCardJson(cardData, setId, number) {
    const jsonPath = path.join(process.cwd(), 'assets', 'cards', setId);
    await fs.mkdir(jsonPath, { recursive: true });
    const paddedNumber = number.toString().padStart(3, '0');
    await fs.writeFile(
        path.join(jsonPath, `${setId}-${paddedNumber}.json`),
        JSON.stringify(cardData, null, 2)
    );
}

// Main function to scrape a single card
async function scrapeCard(setId, number, baseUrl = 'https://pocket.limitlesstcg.com') {
    try {
        // Use raw number for URL, but padded for file operations
        const url = `${baseUrl}/cards/${setId}/${parseInt(number)}`;
        const response = await axios.get(url);
        const $ = load(response.data);

        // Get card data
        const cardData = parseCardData($, number, setId);

        // Get image URL and download
        const imageUrl = $('.card-image img').attr('src');
        if (imageUrl) {
            await downloadImage(imageUrl, setId, number);
        }

        // Save card data
        await saveCardJson(cardData, setId, number);
        
        console.log(`Successfully scraped ${cardData.id}`);
        return cardData;
    } catch (error) {
        console.error(`Error scraping ${setId}-${number}:`, error.message);
        throw error;
    }
}

// Main function to scrape an entire set
async function scrapeSet(setId, maxNumber, baseUrl = 'https://pocket.limitlesstcg.com') {
    console.log(`Starting to scrape set ${setId}`);
    
    for (let i = 1; i <= maxNumber; i++) {
        await scrapeCard(setId, i, baseUrl);
        await delay(1000); // 1 second delay between requests
    }
    
    console.log(`Finished scraping set ${setId}`);
}

// Export functions for use
export {
    scrapeSet,
    scrapeCard
};
