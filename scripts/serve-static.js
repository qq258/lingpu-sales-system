/**
 * 轻量级静态文件服务器 - 无需外部依赖
 * 用于在打包后的环境中 serve 前端静态文件
 * 自动代理 /api/ 请求到后端服务器
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.argv[2] || process.env.PORT || '8080', 10);
const ROOT_DIR = path.resolve(process.argv[3] || process.cwd());
const API_TARGET = process.env.API_TARGET || 'http://localhost:3000';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

// Parse API target URL
const apiUrl = new URL(API_TARGET);
const apiOptions = {
  hostname: apiUrl.hostname,
  port: apiUrl.port || (apiUrl.protocol === 'https:' ? 443 : 80),
  protocol: apiUrl.protocol,
};

function proxyRequest(req, res) {
  const targetPath = req.url;
  const headers = { ...req.headers };
  // Remove host header so the target server uses its own
  delete headers.host;

  const options = {
    hostname: apiOptions.hostname,
    port: apiOptions.port,
    path: targetPath,
    method: req.method,
    headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    // Forward response status and headers
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error(`Proxy error for ${req.url}: ${err.message}`);
    res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Gateway: Cannot reach backend server');
  });

  // Forward request body
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  // Proxy /api/ requests to backend
  if (req.url.startsWith('/api/')) {
    return proxyRequest(req, res);
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(ROOT_DIR, urlPath);

  // 安全检查：防止目录遍历
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA 支持：未匹配到文件时返回 index.html
        const indexPath = path.join(ROOT_DIR, 'index.html');
        fs.readFile(indexPath, (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
          } else {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(data2);
          }
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running at http://0.0.0.0:${PORT}`);
  console.log(`Serving directory: ${ROOT_DIR}`);
  console.log(`API proxy: /api/* -> ${API_TARGET}`);
});
