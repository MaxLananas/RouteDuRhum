/**
 * Pages Function — same-origin proxy for the official standings API.
 *
 * Why it exists
 *   The organiser's endpoint (www.routedurhum.com/_functions/classement) does return
 *   `Access-Control-Allow-Origin: *`, so the browser can usually call it directly.
 *   This proxy is kept for two cases we cannot control:
 *     1. the organiser removes the CORS header (the site keeps working), or
 *     2. the visitor's network blocks the third-party domain (corporate proxies, some
 *        mobile carriers).
 *
 * Caching
 *   The standings are published roughly hourly. We serve with s-maxage=60 so a burst
 *   of visitors costs one upstream request per minute at most, then revalidate in the
 *   background. On upstream failure we return the last cached copy with
 *   `X-Source: stale` and the real upstream timestamp, never invented data.
 */
const UPSTREAM = 'https://www.routedurhum.com/_functions/classement?lang=fr';

export async function onRequestGet(context) {
  const { request } = context;
  // `caches` exists on Cloudflare Workers/Pages but not in a plain Node dev server.
  const cache = typeof caches !== 'undefined' ? caches.default : null;
  const cacheKey = new Request(new URL('/api/classement', request.url).toString(), { method: 'GET' });

  const cached = cache ? await cache.match(cacheKey) : null;
  if (cached) {
    const age = Number(cached.headers.get('X-Cache-Age') || 0);
    if (Date.now() - age < 60_000) {
      return new Response(cached.body, {
        headers: { ...Object.fromEntries(cached.headers), 'X-Source': 'edge-cache' },
      });
    }
  }

  try {
    const res = await fetch(UPSTREAM, {
      headers: { Accept: 'application/json', 'User-Agent': 'RouteDuRhumTracker/1.0 (pages-function)' },
      cf: { cacheTtl: 30, cacheEverything: true },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = await res.text();
    JSON.parse(body); // reject anything that is not JSON
    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=30, s-maxage=60, stale-while-revalidate=300',
      'Access-Control-Allow-Origin': '*',
      'X-Source': 'upstream',
      'X-Fetched-At': new Date().toISOString(),
      'X-Cache-Age': String(Date.now()),
    });
    if (cache) await cache.put(cacheKey, new Response(body, { headers }));
    return new Response(body, { headers });
  } catch (err) {
    if (cached) {
      return new Response(cached.body, {
        headers: {
          ...Object.fromEntries(cached.headers),
          'X-Source': 'stale',
          'X-Error': String(err.message || err).slice(0, 120),
          'Cache-Control': 'public, max-age=15',
        },
      });
    }
    return new Response(
      JSON.stringify({ error: 'upstream_unavailable', detail: String(err.message || err).slice(0, 120) }),
      { status: 502, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
}
