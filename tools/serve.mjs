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

/**
 * Wrap a handler so nothing can ever take the whole server down.
 * Before this, a single malformed percent-escape (e.g. `/%E0%A4%A`) threw from
 * decodeURIComponent inside an async handler: that becomes an unhandled
 * rejection, and Node kills the process. The preview then went dark until it
 * was restarted, with nothing in the log to explain why.
 */
function safe(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      if (res.headersSent) {
        try { res.destroy(); } catch { /* ignore */ }
        return;
      }
      const code = err instanceof URIError ? 400 : 500;
      try {
        res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
        res.end(code === 400 ? 'bad request: malformed URL' : 'internal error');
      } catch { /* ignore */ }
      console.error(`[serve] ${req.method} ${String(req.url).slice(0, 120)} -> ${code}: ${err.message}`);
    }
  };
}

const server = createServer(safe(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // decodeURIComponent throws URIError on malformed escapes: answer 400 instead
  // of letting it bubble up as an unhandled rejection.
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' });
    res.end('bad request: malformed URL');
    return;
  }

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
}));

// Last line of defence: a stray rejection must never take the preview offline.
process.on('unhandledRejection', (err) => {
  console.error('[serve] unhandled rejection:', err && err.stack ? err.stack.split('\n')[0] : err);
});
process.on('uncaughtException', (err) => {
  console.error('[serve] uncaught exception:', err && err.stack ? err.stack.split('\n')[0] : err);
});

server.listen(PORT, HOST, () => {
  console.log(`Dev server on http://${HOST}:${PORT} (static: public/, functions: /api/*)`);
});
