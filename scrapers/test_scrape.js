import { scrapeCard } from './scrape_pocket_cards.js';

async function runTests() {
    console.log('Testing different card formats...\n');

    // Test Pokemon with standard damage
    console.log('Testing Standard damage (Mewtwo ex) (A1/286)...');
    await scrapeCard('A1', 286);
    console.log('Scrape completed successfully!\n');

    // Test Pokemon with simple attack
    console.log('Testing Simple attack (Psyduck) (A1/57)...');
    await scrapeCard('A1', 57);
    console.log('Scrape completed successfully!\n');

    // Test Pokemon with plus modifier
    console.log('Testing Plus modifier (Alakazam) (A1/117)...');
    await scrapeCard('A1', 117);
    console.log('Scrape completed successfully!\n');

    // Test Trainer card (Professor Sada) (A1/224)
    console.log('Testing Trainer card (Professor Sada) (A1/224)...');
    await scrapeCard('A1', 224);
    console.log('Scrape completed successfully!\n');

    // Test Pokemon with resistance and 0-cost attack using non-pocket URL
    console.log('Testing Resistance and 0-cost attack (SP/294)...');
    await scrapeCard('SP', 294, 'https://limitlesstcg.com');
    console.log('Scrape completed successfully!\n');
}

runTests().catch(console.error);
