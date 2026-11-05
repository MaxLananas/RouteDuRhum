/**
 * Dissect the official cartography page: download its HTML + JS bundles and extract
 * every data URL, tile provider and configuration file it references.
 * Output: data/diagnostics/carto-analysis.md
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const UA = 'Mozilla/5.0 (compatible; RouteDuRhumTracker/1.0; +https://github.com/MaxLananas/RouteDuRhum)';
const BASE = 'https://carto.routedurhum.com/';
mkdirSync('data/diagnostics', { recursive: true });

const found = new Map();
async function get(url, asText = true) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' }, redirect: 'follow' });
  const buf = new Uint8Array(await res.arrayBuffer());
  return { res, text: asText ? new TextDecoder('utf-8').decode(buf) : buf, bytes: buf.length };
}

function note(kind, value, where) {
  const key = `${kind}|${value}`;
  if (!found.has(key)) found.set(key, { kind, value, where: new Set() });
  found.get(key).where.add(where);
}

const index = await get(BASE);
console.log('index.html', index.res.status, index.bytes, 'bytes');
writeFileSync('data/diagnostics/carto-index.html', index.text);

const scripts = [...index.text.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
const links = [...index.text.matchAll(/<link[^>]+href=["']([^"']+)["']/g)].map((m) => m[1]);
console.log('scripts:', scripts.length, 'links:', links.length);

for (const m of index.text.matchAll(/["']([^"']*\.(?:json|hwx|txt|xml|csv|grib2?)["'])/g)) note('index-ref', m[1], 'index.html');
for (const m of index.text.matchAll(/https?:\/\/[^\s"'<>)]+/g)) note('index-url', m[0], 'index.html');

const bundles = [];
for (const s of scripts.slice(0, 40)) {
  const url = new URL(s, BASE).href;
  try {
    const r = await get(url);
    bundles.push({ url, bytes: r.bytes, sha: createHash('sha1').update(r.text).digest('hex').slice(0, 12) });
    console.log('bundle', url, r.res.status, r.bytes);
    // data endpoints
    for (const m of r.text.matchAll(/["'`]([^"'`\s]{0,120}\.(?:json|hwx|txt|xml|grib2?|csv))["'`]/g)) note('data-file', m[1], url);
    // full http urls
    for (const m of r.text.matchAll(/https?:\/\/[a-z0-9.\-]+[^\s"'`<>)\\]+/gi)) note('url', m[0], url);
    // geovoile-specific strings
    for (const m of r.text.matchAll(/(?:wind|wave|current|pressure|cloud|rain|isobar|grib|meteo)[a-z0-9_\-]{0,20}/gi)) {
      const t = m[0].toLowerCase();
      if (t.length > 6) note('keyword', t, url);
    }
    // tile templates
    for (const m of r.text.matchAll(/[a-z0-9{}._\-]*\{z\}[^\s"'`]*/gi)) note('tile-template', m[0], url);
    writeFileSync(`data/diagnostics/bundle-${createHash('sha1').update(url).digest('hex').slice(0, 8)}.js`, r.text);
  } catch (e) {
    console.log('bundle failed', url, e.message);
  }
}

const interesting = [...found.values()]
  .map((v) => ({ ...v, where: [...v.where] }))
  .filter((v) => v.kind !== 'keyword' || /wind|wave|current|press|cloud|rain|isobar|grib|meteo/.test(v.value));

const lines = [
  `# Analyse de la cartographie officielle — ${new Date().toISOString()}`,
  '',
  `Page : ${BASE} (${index.bytes} octets, HTTP ${index.res.status})`,
  '',
  '## Bundles JavaScript',
  '',
  ...bundles.map((b) => `- \`${b.url}\` — ${b.bytes} octets — sha1 ${b.sha}`),
  '',
  '## Ressources de données référencées',
  '',
  '| Type | Référence | Trouvé dans |',
  '| --- | --- | --- |',
  ...interesting.map((v) => `| ${v.kind} | \`${v.value.slice(0, 120)}\` | ${v.where.map((w) => w.replace(BASE, '/')).join(', ').slice(0, 120)} |`),
  '',
].join('\n');
writeFileSync('data/diagnostics/carto-analysis.md', lines);
console.log('wrote data/diagnostics/carto-analysis.md', found.size, 'references');
