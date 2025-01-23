const http = require('http');

const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Hello MuMu</title>
</head>
<body>
    <h1>Hello from your local machine!</h1>
    <div id="output">Waiting for button click...</div>
    <button onclick="updateText()">Click me!</button>

    <script>
        function updateText() {
            const output = document.getElementById('output');
            output.textContent = 'Button clicked at: ' + new Date().toLocaleTimeString();
        }
    </script>
</body>
</html>
`;

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
});

const HOST = '0.0.0.0';  // Listen on all network interfaces
const PORT = 3000;

server.listen(PORT, HOST, () => {
    console.log(`Server running at http://${HOST}:${PORT}/`);
    console.log('To access from MuMu Player, use your machine\'s IP address:');
    console.log(`http://YOUR_IP_ADDRESS:${PORT}`);
});