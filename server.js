import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// In production, serve the Vite build output
if (isProduction) {
    app.use(express.static(path.join(__dirname, 'dist')));
    // Also serve assets from dist/assets
    app.use('/assets', express.static(path.join(__dirname, 'dist/assets')));
} else {
    // In development, serve from root directory
    app.use(express.static(__dirname));
}

// Health check endpoint for Render
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

// Serve the pack open test page at the root
app.get('/', (req, res) => {
    const htmlPath = isProduction 
        ? path.join(__dirname, 'dist/src/views/pack_open/test_pack_open.html')
        : path.join(__dirname, 'src/views/pack_open/test_pack_open.html');
    res.sendFile(htmlPath);
});

// Error handling for 404s
app.use((req, res, next) => {
    if (req.path.includes('/assets/')) {
        console.error(`404: Asset not found - ${req.path}`);
        console.error(`Looked in: ${isProduction ? 'dist' + req.path : req.path}`);
    }
    res.status(404).send('Not Found');
});

// General error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Mode: ${isProduction ? 'production' : 'development'}`);
    console.log(`Static files: ${isProduction ? 'dist' : 'root'}`);
});
