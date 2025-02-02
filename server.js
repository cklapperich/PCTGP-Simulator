import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Determine if we're in production
const isProduction = process.env.NODE_ENV === 'production';

// In production, serve from the dist directory
// In development, serve from the root directory
const staticPath = isProduction ? path.join(__dirname, 'dist') : __dirname;

// Serve static files
app.use(express.static(staticPath));

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
    console.log(`Serving static files from: ${staticPath}`);
});
