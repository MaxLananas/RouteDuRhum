/**
 * Minimal zero-dependency dev server that mimics Cloudflare Pages:
 *   - serves ./public
 *   - routes /api/* to the Pages Functions in ./functions
 *   - binds 0.0.0.0 so preview proxies can reach it
 */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { pathToFileURL } from 'node:url';

const PORT = Number(process.env.PORT || 8080);
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = new URL('../public', import.meta.url).pathname;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp', '.avif': 'image/avif',
};

async function serveFile(res, path) {
  try {
    const s = await stat(path);
    if (s.isDirectory()) return serveFile(res, join(path, 'index.html'));
    const body = await readFile(path);
    res.writeHead(200, {
      'Content-Type': MIME[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);

  if (pathname.startsWith('/api/')) {
    const name = pathname.replace('/api/', '').replace(/\/$/, '');
    const file = join(ROOT, '..', 'functions', 'api', `${name}.js`);
    try {
      const mod = await import(pathToFileURL(file).href + `?t=${Date.now()}`);
      const request = new Request(`http://${req.headers.host}${req.url}`, { method: req.method });
      const response = await mod.onRequestGet({ request, env: {}, params: {} });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    } catch (e) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'function_failed', detail: String(e.message) }));
      return;
    }
  }

  const target = normalize(join(ROOT, pathname === '/' ? 'index.html' : pathname));
  if (!target.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (await serveFile(res, target)) return;
  if (await serveFile(res, join(ROOT, 'index.html'))) return;
  res.writeHead(404).end('not found');
});

server.listen(PORT, HOST, () => {
  console.log(`Dev server on http://${HOST}:${PORT} (static: public/, functions: /api/*)`);
});
