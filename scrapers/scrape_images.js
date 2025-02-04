#!/usr/bin/env node
import { load } from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { delay } from './utilities.js';

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
        console.log(`Successfully downloaded image for ${setId}-${paddedNumber}`);
    } catch (error) {
        console.error(`Error downloading image for ${setId}-${number}:`, error.message);
    }
}

// Scrape and download a single card's image
async function scrapeCardImage(setId, number, baseUrl = 'https://pocket.limitlesstcg.com') {
    try {
        const url = `${baseUrl}/cards/${setId}/${parseInt(number)}`;
        const response = await axios.get(url);
        const $ = load(response.data);

        const imageUrl = $('.card-image img').attr('src');
        if (imageUrl) {
            await downloadImage(imageUrl, setId, number);
        } else {
            console.error(`No image found for ${setId}-${number}`);
        }
    } catch (error) {
        console.error(`Error scraping ${setId}-${number}:`, error.message);
    }
}

// Main function to scrape images for an entire set
async function scrapeSetImages(setId, maxNumber, baseUrl = 'https://pocket.limitlesstcg.com') {
    console.log(`Starting to download images for set ${setId}`);
    
    for (let i = 1; i <= maxNumber; i++) {
        await scrapeCardImage(setId, i, baseUrl);
        await delay(1000); // 1 second delay between requests
    }
    
    console.log(`Finished downloading images for set ${setId}`);
}

// Handle command line arguments
const [,, setId, maxNumber, baseUrl] = process.argv;

if (!setId || !maxNumber) {
    console.error('Usage: node scrape_images.js <setId> <maxNumber> [baseUrl]');
    process.exit(1);
}

scrapeSetImages(setId, parseInt(maxNumber), baseUrl).catch(console.error);
