@echo off
echo Downloading card images...
node scrapers/scrape_images.js A1 96
node scrapers/scrape_images.js A2 120
echo Card image download complete!
