/**
 * One-shot reconnaissance: fetch the official tracker resources, decode them and
 * print their shape so the schema can be verified against real bytes.
 * Run: node tools/geo/probe.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { decodeHwx } from './hwx.mjs';

const BASE = process.env.CARTO_BASE || 'https://carto.routedurhum.com/data/';
const UA = 'RouteDuRhumTracker/1.0 (+https://github.com/MaxLananas/RouteDuRhum)';

async function get(path) {
  const url = BASE + path;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Encoding': 'gzip, deflate, br' },
    redirect: 'follow',
  });
  const buf = new Uint8Array(await res.arrayBuffer());
  return { res, buf };
}

function summarize(x, depth = 0, max = 2) {
  const pad = '  '.repeat(depth);
  if (Array.isArray(x)) {
    console.log(`${pad}Array(${x.length})`);
    if (x.length && depth < max) summarize(x[0], depth + 1, max);
  } else if (x && typeof x === 'object') {
    const keys = Object.keys(x);
    console.log(`${pad}{${keys.slice(0, 30).join(', ')}${keys.length > 30 ? `, …+${keys.length - 30}` : ''}}`);
    if (depth < max) for (const k of keys.slice(0, 14)) summarize(x[k], depth + 1, max);
  } else {
    const s = JSON.stringify(x);
    console.log(`${pad}${s && s.length > 120 ? s.slice(0, 120) + '…' : s}`);
  }
}

const versionsTxt = await (async () => {
  const { res, buf } = await get(`versions.txt?nocache=${Date.now()}`);
  console.log('versions.txt', res.status, JSON.stringify(res.headers.get('content-type')), buf.length, 'bytes');
  console.log('  raw:', new TextDecoder().decode(buf).slice(0, 300));
  console.log('  headers:', JSON.stringify({
    cc: res.headers.get('cache-control'),
    server: res.headers.get('server'),
    etag: res.headers.get('etag'),
    lax: res.headers.get('access-control-allow-origin'),
  }));
  return new TextDecoder().decode(buf);
})();

mkdirSync('tmp/probe', { recursive: true });

for (const name of ['config', 'live', 'reports', 'tracks']) {
  try {
    const { res, buf } = await get(`tracker_${name}.hwx?nocache=${Date.now()}`);
    console.log(`\n=== tracker_${name}.hwx ===`);
    console.log('status', res.status, 'compressed', buf.length, 'bytes', res.headers.get('content-type'));
    writeFileSync(`tmp/probe/${name}.hwx.raw`, buf);
    const dec = decodeHwx(buf);
    writeFileSync(`tmp/probe/${name}.decoded`, dec);
    console.log('decoded', dec.length, 'bytes');
    console.log('head:', new TextDecoder().decode(dec.subarray(0, 420)).replace(/\n/g, ' '));
    if (name !== 'config') {
      try {
        const j = JSON.parse(new TextDecoder().decode(dec));
        summarize(j, 0, 2);
      } catch (e) {
        console.log('not JSON:', e.message);
      }
    } else {
      console.log('xml head:', new TextDecoder().decode(dec.subarray(0, 1400)));
    }
  } catch (e) {
    console.log(`!!! ${name} failed:`, e.message);
  }
}
