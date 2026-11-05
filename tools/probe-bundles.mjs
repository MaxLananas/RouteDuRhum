/**
 * Focused dissection of the official viewer bundles:
 * how are weather layers, tracks, replay and tiles implemented?
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const UA = 'Mozilla/5.0 (compatible; RouteDuRhumTracker/1.0)';
const assets = [
  'https://carto.routedurhum.com/assets/viewer.js?v=20261102084044',
  'https://carto.routedurhum.com/assets/sig.js?v=20261104080250',
  'https://carto.routedurhum.com/assets/hws.js?v=20261028151052',
  'https://carto.routedurhum.com/assets/version_standard_viewer.js?v=20261104105917',
  'https://carto.routedurhum.com/assets/main.js?v=20261020101316',
];
mkdirSync('data/diagnostics/bundles', { recursive: true });

const patterns = [
  /https?:\/\/[^\s"'`<>)\\]+/g,
  /[\w./-]*(?:grib|gfs|arpege|ecmwf|icon|meteoconsult|windy|openweather|isobar|forecast)[\w./-]*/gi,
  /[\w./-]*\{z\}[\w./{}#-]*/g,
  /(?:wind|wave|current|pressure|cloud|rain|temperature|swell)[A-Za-z]*(?:_[a-z]+)?\s*[:=]/g,
  /(?:replay|playback|timeline|slider|speed[A-Z]?|speedFactor)[A-Za-z]*\s*[:=]/g,
];

const out = [`# Bundles internals — ${new Date().toISOString()}`, ''];
for (const url of assets) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    const js = await res.text();
    const name = url.split('/').pop().split('?')[0];
    writeFileSync(`data/diagnostics/bundles/${name}`, js);
    out.push(`## ${name} (${js.length} o)`, '');
    const hits = new Map();
    for (const re of patterns) {
      for (const m of js.matchAll(re)) {
        const v = m[0].trim().slice(0, 160);
        if (!v || v.length < 4) continue;
        hits.set(v, (hits.get(v) || 0) + 1);
      }
    }
    const sorted = [...hits.entries()].sort((a, b) => b[1] - a[1]).slice(0, 260);
    for (const [v, n] of sorted) out.push(`- (${n}×) ${v.replace(/`/g, "'")}`);
    out.push('');
  } catch (e) {
    out.push(`## ${url} FAILED: ${e.message}`, '');
  }
}
writeFileSync('data/diagnostics/bundles-analysis.md', out.join('\n'));
console.log('ok', out.length, 'lines');
