@echo off
echo Installing PCTGP Simulator...

REM Check for Node.js
node --version || (
    echo Node.js not found! Please install Node.js from https://nodejs.org/
    exit /b 1
)

REM Install all dependencies from package.json
echo Installing dependencies...
call npm install

REM Build the project
echo Building project...
call npm run build

REM Download card images
 echo Downloading card images...
call download_card_images.bat

echo Installation complete!
