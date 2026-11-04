/** Dump the tracker's predicted-route structures so their encoding can be verified. */
import { decodeHwx } from './geo/hwx.mjs';
const BASE = 'https://carto.routedurhum.com/data/';
const get = async (u) => {
  const r = await fetch(u, { headers: { 'User-Agent': 'rdr-probe' } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return new Uint8Array(await r.arrayBuffer());
};
const raw = await get(`${BASE}tracker_tracks.hwx?v=${Date.now()}`);
const j = JSON.parse(new TextDecoder().decode(decodeHwx(raw)));
const out = [];
for (const t of j.tracks.slice(0, 60)) {
  const pred = t.pred;
  out.push({
    id: t.id,
    locPts: (t.loc || []).length,
    lastLoc: (t.loc || []).slice(-2),
    predType: Array.isArray(pred) ? 'array' : typeof pred,
    predLen: Array.isArray(pred) ? pred.length : null,
    predHead: Array.isArray(pred) ? pred.slice(0, 4) : pred,
    keys: Object.keys(t),
  });
}
console.log(JSON.stringify({ tracks: j.tracks.length, sample: out.filter((x) => x.predLen), first: out.slice(0, 3) }, null, 1).slice(0, 6000));
