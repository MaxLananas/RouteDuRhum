/**
 * Geovoile / YB-Tracking ".hwx" decoder + parsers.
 *
 * Format (reverse-engineered from the JS bundle served by carto.routedurhum.com,
 * cross-checked against https://github.com/jguiban/srdata):
 *
 *   byte 0            : xorshift seed / "skip" count
 *   bytes 1..3        : uncompressed size (24 bit, keystream-decoded)
 *   byte 4..n         : block stream
 *       - every 8 blocks a "flags" byte: (raw ^ (i & 0xFF)) ^ 0xA3
 *       - flag bit 0 -> literal byte (xorshift-decoded)
 *       - flag bit 1 -> back-reference: len = (b0 >> 4) + 3, dist = (((b0 & 15) << 8) | b1) + 1
 *
 * Keystream: xorshift32 over a 4-word state, XORed on the low byte; the state advances
 * once per decoded byte (literal or back-reference descriptor byte).
 */

const MASK = 0xffffff;

function keystream(skip) {
  const st = [0x7bc495, 0x4557fa, 0xd56aaf, 0xff8040];
  const step = () => {
    let t = st[0];
    t ^= (t << 11) & MASK;
    t ^= (t >> 8) & MASK;
    t &= MASK;
    st[0] = st[1];
    st[1] = st[2];
    st[2] = st[3];
    st[3] ^= (st[3] >> 19) & MASK;
    st[3] ^= t;
    st[3] &= MASK;
  };
  for (let i = 0; i < (skip & 0xff); i++) step();
  return (x) => {
    const r = (x ^ (st[0] & 0xff)) & 0xff;
    step();
    return r;
  };
}

export function decodeHwx(raw) {
  const buf = raw instanceof Uint8Array ? raw : new Uint8Array(raw);
  if (buf.length < 5) throw new Error(`hwx too short (${buf.length} bytes)`);
  const k = keystream(buf[0]);
  const size = (k(buf[1]) << 16) | (k(buf[2]) << 8) | k(buf[3]);
  if (size <= 0 || size > 64 * 1024 * 1024) {
    throw new Error(`implausible decoded size ${size}`);
  }
  const out = new Uint8Array(size);
  let i = 4;
  let o = 0;
  const n = buf.length;
  while (i < n && o < size) {
    const flags = ((buf[i] ^ (i & 0xff)) ^ 0xa3) & 0xff;
    i += 1;
    for (let bit = 7; bit >= 0; bit--) {
      if (!(flags & (1 << bit))) {
        out[o++] = k(buf[i++]);
      } else {
        const b0 = k(buf[i]);
        const len = (b0 >> 4) + 3;
        const dist = (((b0 & 0x0f) << 8) | k(buf[i + 1])) + 1;
        i += 2;
        for (let j = 0; j < len; j++) {
          out[o] = out[o - dist];
          o++;
        }
      }
      if (i >= n || o >= size) break;
    }
  }
  return out.subarray(0, Math.min(o, size));
}

const text = (bytes) => new TextDecoder('utf-8').decode(bytes);

/* ------------------------------------------------------------------ config */

/** Minimal XML reader (no DOM in Node). Returns boats keyed by tracker id. */
export function parseConfig(bytes) {
  const xml = text(bytes);
  const boats = {};
  const classes = [];
  // <boatclass name="Ocean Fifty" color="#72B9F1" ...> ... </boatclass>
  const classRe = /<boatclass\b([^>]*)>([\s\S]*?)<\/boatclass>/g;
  const attr = (s, name) => {
    const m = s.match(new RegExp(`${name}="([^"]*)"`));
    return m ? m[1] : null;
  };
  let cm;
  while ((cm = classRe.exec(xml))) {
    const cAttrs = cm[1];
    const cls = { name: attr(cAttrs, 'name') || attr(cAttrs, 'id') || 'unknown', boats: [] };
    const boatRe = /<boat\b([^>]*?)(\/>|>([\s\S]*?)<\/boat>)/g;
    let bm;
    while ((bm = boatRe.exec(cm[2]))) {
      const bAttrs = bm[1];
      const inner = bm[3] || '';
      const navigators = [...inner.matchAll(/<navigator\b([^>]*)\/?>/g)].map((m) => {
        const f = attr(m[1], 'fname') || '';
        const l = attr(m[1], 'lname') || '';
        return `${f} ${l}`.trim();
      });
      const id = attr(bAttrs, 'id');
      if (!id) continue;
      boats[id] = {
        id,
        name: attr(bAttrs, 'name') || '',
        sail: attr(bAttrs, 'sail') || '',
        class: cls.name,
        skipper: navigators.join(' / '),
        color: attr(bAttrs, 'color') || attr(bAttrs, 'c1') || null,
        model: attr(bAttrs, 'model') || null,
      };
      cls.boats.push(id);
    }
    classes.push(cls);
  }
  return { boats, classes };
}

/* ------------------------------------------------------------------ tracks */

/** Full tracks: { boatId: { t: [ts...], lat: [...], lon: [...] } } (delta decoded). */
export function parseTracks(bytes, coordsFactor = 100000) {
  const data = JSON.parse(text(bytes));
  const list = data.tracks || data;
  const out = {};
  for (const track of list) {
    if (String(track.id) === '0') continue; // day/night shading track
    let ts = 0;
    let lat = 0;
    let lon = 0;
    const T = [];
    const LA = [];
    const LO = [];
    for (const loc of track.loc || []) {
      if (!loc || loc.length < 3) continue;
      ts += loc[0];
      lat += loc[1] / coordsFactor;
      lon += loc[2] / coordsFactor;
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 360) continue;
      T.push(ts);
      LA.push(Math.round(lat * 1e5) / 1e5);
      LO.push(Math.round(lon * 1e5) / 1e5);
    }
    if (T.length) out[String(track.id)] = { t: T, lat: LA, lon: LO };
  }
  return out;
}

/* ----------------------------------------------------------------- reports */

/** Rank/telemetry history: [{ id, date, lines: [{col: val}] }] newest first. */
export function parseReports(bytes) {
  const data = JSON.parse(text(bytes));
  const reports = data.reports || data;
  const columns = reports.columns || [];
  const history = reports.history || reports;
  return (history || []).map((h) => ({
    id: h.id,
    date: h.date,
    lines: (h.lines || []).map((line) => {
      const o = {};
      for (let i = 0; i < columns.length; i++) o[columns[i]] = line[i];
      return o;
    }),
  }));
}

/* -------------------------------------------------------------------- live */

/** Latest positioning + the track points published since the previous one. */
export function parseLive(bytes) {
  return JSON.parse(text(bytes));
}

/** Extract per-boat fresh points from the live payload whatever its exact shape. */
export function livePoints(live, coordsFactor = 100000) {
  const out = {};
  const rows = live?.lines || live?.loc || live?.data || [];
  if (Array.isArray(rows)) {
    for (const row of rows) {
      const id = String(row.id ?? row.b ?? row.boat ?? '');
      if (!id || id === '0') continue;
      const arr = row.loc || row.track || row.pts || [];
      const pts = [];
      let ts = 0;
      let lat = 0;
      let lon = 0;
      for (const p of arr) {
        if (!Array.isArray(p)) continue;
        ts += p[0];
        lat = p.length >= 3 ? lat + p[1] / coordsFactor : p[1];
        lon = p.length >= 3 ? lon + p[2] / coordsFactor : p[2];
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        pts.push([ts, lat, lon]);
      }
      out[id] = pts;
    }
  }
  return out;
}
