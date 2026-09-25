/**
 * serve.mjs — 零依赖静态服务器（预览 dist/ 用）。
 * 用法：node scripts/serve.mjs [dir] [port]   默认 dist 8080
 */

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const dir = resolve(process.argv[2] ?? 'dist');
const port = Number(process.argv[3] ?? process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.wav': 'audio/wav',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.log': 'text/plain; charset=utf-8',
  '.enc': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.conf': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url ?? '/').split('?')[0]);
  let path = normalize(join(dir, url));
  if (!path.startsWith(dir)) { res.writeHead(403); res.end('forbidden'); return; }

  if (existsSync(path) && statSync(path).isDirectory()) {
    path = join(path, 'index.html');
  }
  if (!existsSync(path)) path = join(dir, '404.html');

  const type = TYPES[extname(path)] ?? 'application/octet-stream';
  const stream = createReadStream(path);
  stream.on('error', () => { res.writeHead(500); res.end('internal error'); });
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-cache' });
  stream.pipe(res);
});

server.listen(port, () => {
  console.log(`[serve] ${dir} → http://127.0.0.1:${port}`);
});
