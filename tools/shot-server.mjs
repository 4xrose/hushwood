import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = process.env.SHOT_DIR || path.join(process.env.TEMP || '.', 'opencode');
fs.mkdirSync(dir, { recursive: true });

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(200);
    res.end('shot server');
    return;
  }
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const name = (req.url || '/shot.jpg').replace(/\W+/g, '_').slice(1) || 'shot.jpg';
    const file = path.join(dir, name.endsWith('.jpg') || name.endsWith('.png') ? name : `${name}.jpg`);
    const body = Buffer.concat(chunks);
    let data = body;
    // Accept either raw base64 or a full data URL.
    const text = body.toString('utf8');
    if (text.startsWith('data:image')) {
      data = Buffer.from(text.split(',')[1], 'base64');
    } else if (/^[A-Za-z0-9+/=\s]+$/.test(text.slice(0, 200))) {
      data = Buffer.from(text.replace(/\s/g, ''), 'base64');
    }
    fs.writeFileSync(file, data);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(file);
  });
}).listen(8787, '127.0.0.1', () => console.log('shot server on 8787'));
