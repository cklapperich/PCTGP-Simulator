import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the root directory
app.use(express.static(__dirname));

// Serve the pack open test page at the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/pack_open/test_pack_open.html'));
});

// Fallback route for SPA-like behavior
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'src/views/pack_open/test_pack_open.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
