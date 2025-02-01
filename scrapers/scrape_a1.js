import { scrapeSet } from './scrape_pocket_cards.js';

async function scrapeA1Set() {
    console.log('Starting to scrape A1 set (cards 1-286)...');

    try {
        await scrapeSet('A1', 286);
        console.log('Successfully scraped all A1 cards!');
    } catch (error) {
        console.error('Error during scraping:', error);
    }
}

scrapeA1Set();
