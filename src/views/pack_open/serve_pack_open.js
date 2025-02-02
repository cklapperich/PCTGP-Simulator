import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

const app = express();

// Serve the test_pack_open.html and its direct dependencies
app.use('/src/views/pack_open', express.static(path.join(projectRoot, 'src/views/pack_open')));
app.use('/src/config', express.static(path.join(projectRoot, 'src/config')));

// Serve assets maintaining the same directory structure
app.use('/assets', express.static(path.join(projectRoot, 'assets')));

// Redirect root to the pack open test
app.get('/', (req, res) => {
    res.redirect('/src/views/pack_open/test_pack_open.html');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
