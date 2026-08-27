const http = require('http');

const PORT = 3000;
const TARGET_PORT = 8080;

const server = http.createServer((req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: TARGET_PORT,
        path: req.url,
        method: req.method,
        headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
        res.writeHead(500);
        res.end();
    });

    req.pipe(proxyReq, { end: true });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Proxy server running at http://0.0.0.0:${PORT}/`);
    console.log(`Now you can access from your phone using: http://<YOUR-IP>:${PORT}/`);
});
