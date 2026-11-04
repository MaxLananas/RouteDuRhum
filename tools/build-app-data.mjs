/**
 * Build the browser payload from the collector snapshots.
 * Output: public/data/*.json — small, delta-encoded, cache-versioned.
 *
 * Data provenance shown in the UI:
 *   official tracker report / standings API -> "officiel"
 *   derived here from official positions     -> "calculé"
 *   Open-Meteo                               -> "modèle"
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const D = (p) => join(ROOT, 'data', p);
const OUT = join(ROOT, 'public', 'data');
mkdirSync(OUT, { recursive: true });

const read = (p, fb = null) => {
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return fb;
  }
};
const write = (name, obj) => {
  const s = JSON.stringify(obj);
  writeFileSync(join(OUT, name), s);
  return s.length;
};

const meta = read(D('meta.json'), {});
const config = read(D('config.json'), { boats: {}, legs: [], classes: [] });
const classement = read(D('classement.json'), { classes: [] });
const laurent = read(D('laurent.json'), null);
const tracks = read(D('tracks.json'), { boats: {} });
const reports = read(D('reports.json'), { reports: [] });

if (!laurent) {
  console.error('no laurent.json — run tools/collect.mjs first');
  process.exit(1);
}

/* ------------------------------------------------------------ helpers */
const r5 = (x) => Math.round(x * 1e5);

function encodeTrack(points) {
  const n = points.length;
  const t0 = points[0][0];
  const dt = [];
  const la = [];
  const lo = [];
  let pt = 0;
  let pa = 0;
  let po = 0;
  for (let i = 0; i < n; i++) {
    const [t, lat, lon] = points[i];
    const A = r5(lat);
    const O = r5(lon);
    dt.push(i === 0 ? 0 : t - pt);
    la.push(i === 0 ? A : A - pa);
    lo.push(i === 0 ? O : O - po);
    pt = t;
    pa = A;
    po = O;
  }
  return { t0, n, dt, la, lo };
}

function subsample(points, max) {
  if (points.length <= max) return points;
  const step = (points.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(points[Math.round(i * step)]);
  return out;
}

const boatIndex = {};
for (const [id, b] of Object.entries(config.boats || {})) {
  boatIndex[id] = { n: b.name, s: b.skipper, c: b.class, col: b.color || null };
}

const laurentId = laurent.trackerId;

/* ------------------------------------------------- 1. tracks per boat */
const trackFiles = {};
let totalTrackPts = 0;
for (const [id, t] of Object.entries(tracks.boats || {})) {
  const pts = t.t.map((ts, i) => [ts, t.lat[i], t.lon[i]]);
  if (!pts.length) continue;
  const isLaurent = String(id) === String(laurentId);
  const isOcean = /ocean/i.test(boatIndex[id]?.c || '');
  const max = isLaurent ? 6000 : isOcean ? 1200 : 140;
  const enc = encodeTrack(subsample(pts, max));
  const name = `track-${id}.json`;
  write(name, { id: String(id), name: boatIndex[id]?.n || '', cls: boatIndex[id]?.c || '', ...enc });
  trackFiles[id] = name;
  totalTrackPts += enc.n;
}

/* ------------------------------------------------- 2. reports history */
// Reports must read oldest -> newest. Detect the order from the payload instead of
// assuming it: the tracker has published both directions across editions.
const rawReports = reports.reports || [];
const ascending = (() => {
  if (rawReports.length < 2) return true;
  return Date.parse(rawReports[0].date) < Date.parse(rawReports[rawReports.length - 1].date);
})();
const byDate = ascending ? [...rawReports] : [...rawReports].reverse();
console.log(`reports: ${rawReports.length} entries, payload order ${ascending ? 'ancien→récent' : 'récent→ancien'}`);

function seriesFor(boatId, fields) {
  const out = { dates: [] };
  for (const f of fields) out[f] = [];
  for (const r of byDate) {
    const l = r.lines[String(boatId)];
    if (!l) continue;
    out.dates.push(r.date);
    for (const f of fields) out[f].push(l[f] ?? null);
  }
  return out;
}

const LAURENT_FIELDS = [
  'rank', 'dtf', 'dtl', 'speed', 'heading', 'vmg', 'dist1', 'vmg1', 'dist2', 'vmg2',
  'vitmax4', 'vitmax24', 'vitmax48', 'vitmaxd', 'vitmoy48', 'vit_moy_depart', 'dog',
  'winddir', 'windspeed', 'windgust', 'currentdir', 'currentspeed', 'wavedir', 'waveheight',
  'tempair', 'tempwater', 'rain', 'clouds', 'racestatus',
];
const laurentHistory = seriesFor(laurentId, LAURENT_FIELDS);
write('history-laurent.json', {
  boatId: String(laurentId),
  generatedAt: new Date().toISOString(),
  units: {
    dtf: 'milles', dtl: 'milles', speed: 'nœuds', vmg: 'nœuds', heading: 'deg',
    winddir: 'deg (origine)', windspeed: '0,1 nd', windgust: '0,1 nd', waveheight: 'dm (décimètres)',
    tempair: '0,1 °C', tempwater: '0,1 °C', clouds: 'couverture 0–400',
    dist1: 'milles sur 4 h', dist2: 'milles sur 24 h', vitmax4: 'nœuds', vitmax24: 'nœuds',
    vitmax48: 'nœuds', vitmoy48: 'nœuds', vit_moy_depart: 'nœuds', dog: 'milles',
    currentspeed: '0,1 nd', currentspeed_note: 'échelle déduite des valeurs publiées, à confirmer',
  },
  ...laurentHistory,
});

const oceanBoats = Object.entries(boatIndex)
  .filter(([, b]) => /ocean fifty/i.test(b.c || ''))
  .map(([id]) => id);
const fleetSeries = {};
for (const id of oceanBoats) fleetSeries[id] = seriesFor(id, ['rank', 'dtf', 'dtl', 'speed', 'vmg']);
write('history-oce50.json', {
  generatedAt: new Date().toISOString(),
  boats: oceanBoats,
  series: fleetSeries,
});

/* ----------------------------------------------------------- 3. core */
const classMeta = (classement.classes || []).map((c) => ({
  cle: c.cle, nom: c.nom, couleur: c.couleur, partants: c.partants, icon: c.icone || null,
}));

const toEtat = (l) => ({
  id: l.id,
  n: `${l.prenom || ''} ${l.nom || ''}`.trim(),
  b: l.bateau,
  r: l.rang ?? null,
  rb: l.rangAvant ?? null,
  st: l.statut || null,
  dtf: l.dtf ?? null,
  dtl: l.dtl ?? null,
  v: l.vitesse ?? null,
  v24: l.vitesse24h ?? null,
  d24: l.dist24h ?? null,
  cap: l.cap ?? null,
  vmg: l.vmg ?? null,
  lat: l.lat ?? null,
  lon: l.lon ?? null,
  hist: l.hist || null,
  motif: l.motif || null,
  raison: l.raison || null,
  photo: l.photo ? (String(l.photo).startsWith('http') ? l.photo : `https://static.wixstatic.com/media/${l.photo}`) : null,
  photoBoat: l.photoBoat ? (String(l.photoBoat).startsWith('http') ? l.photoBoat : `https://static.wixstatic.com/media/${l.photoBoat}`) : null,
  fiche: l.fiche ? `https://www.routedurhum.com${l.fiche}` : null,
});

const core = {
  generatedAt: new Date().toISOString(),
  race: {
    name: 'Route du Rhum — Destination Guadeloupe',
    edition: '13e édition',
    start: meta.race?.depart || config.race?.start,
    startPort: config.legs?.[0]?.start || 'Saint-Malo',
    arrivalPort: config.legs?.[0]?.arrival || 'Pointe-à-Pitre',
    distance: meta.race?.distance ?? 3542,
    state: config.race?.state || 'RUNNING',
    phase: meta.race?.phase || 'course',
    officialUpdate: meta.race?.maj || classement.maj || null,
    url: 'https://www.routedurhum.com/',
    cartoUrl: 'https://carto.routedurhum.com/',
  },
  laurent: {
    trackerId: String(laurentId),
    firstName: laurent.prenom,
    lastName: laurent.nom,
    boat: laurent.bateau,
    sail: laurent.voile,
    class: laurent.classe?.nom || 'Ocean Fifty',
    classKey: laurent.classe?.cle || 'ocean-fifty',
    classColor: laurent.classe?.couleur || '#72B9F1',
    rank: laurent.rang ?? null,
    rankBefore: laurent.rangAvant ?? null,
    partants: laurent.classe?.partants ?? null,
    dtf: laurent.dtf ?? null,
    dtl: laurent.dtl ?? null,
    speed: laurent.vitesse ?? null,
    speed24h: laurent.vitesse24h ?? null,
    dist24h: laurent.dist24h ?? null,
    heading: laurent.cap ?? null,
    vmg: laurent.vmg ?? null,
    lat: laurent.lat ?? null,
    lon: laurent.lon ?? null,
    status: laurent.statut ?? null,
    photo: laurent.photo ? (String(laurent.photo).startsWith('http') ? laurent.photo : `https://static.wixstatic.com/media/${laurent.photo}`) : null,
    photoBoat: laurent.photoBateau ? (String(laurent.photoBateau).startsWith('http') ? laurent.photoBateau : `https://static.wixstatic.com/media/${laurent.photoBateau}`) : null,
    fiche: laurent.fiche ? `https://www.routedurhum.com${laurent.fiche}` : null,
    rankHistory: (laurent.hist || []).map((r, i) => ({ i, rank: r })),
  },
  boats: boatIndex,
  classes: classMeta,
  route: { leg: config.legs?.[0] || null },
  standings: (classement.classes || []).map((c) => ({
    cle: c.cle,
    nom: c.nom,
    couleur: c.couleur,
    partants: c.partants,
    etat: (c.lignes || []).map(toEtat),
  })),
  sources: meta.sources || {},
  freshness: {
    officialStandings: meta.race?.maj || classement.maj || null,
    trackerReport: meta.sources?.['carto.live']?.latestReport || null,
    trackLast: meta.sources?.['carto.tracks']?.lastPoint || null,
    lastRun: meta.generatedAt || null,
  },
  trackIndex: trackFiles,
  files: {
    weather: 'weather-boat.json',
    historyLaurent: 'history-laurent.json',
    historyOce50: 'history-oce50.json',
    trackLaurent: trackFiles[laurentId] || null,
  },
};

/* ---------------------------------------------------- 4. merge with last good build
 * The web-export workflow can run on a fresh runner without data/classement.json.
 * In that case we keep the standings and the file index already published, and only
 * refresh the metadata, so a missing collect never blanks the site. */
const prev = read(join(OUT, 'core.json'));
const prevOk =
  prev &&
  prev.files &&
  prev.files.trackLaurent &&
  read(join(OUT, prev.files.trackLaurent)) &&
  Array.isArray(prev.standings) &&
  prev.standings.some((c) => (c.etat || []).some((b) => Number.isFinite(b.dtf)));

if (prevOk) {
  core.trackIndex = prev.trackIndex || core.trackIndex;
  core.files = prev.files;
  core.standings = prev.standings;
  if (Number.isFinite(prev.laurent?.rank)) {
    core.laurent = { ...core.laurent, ...prev.laurent, rankHistory: prev.laurent.rankHistory || core.laurent.rankHistory };
  }
  core.freshness = {
    ...core.freshness,
    officialStandings: prev.freshness?.officialStandings || core.freshness.officialStandings,
    officialLiveAt: prev.freshness?.officialLiveAt || null,
  };
  console.log('build: kept previous standings and track index');
}

const coreBytes = write('core.json', core);

/* ------------------------------------ self-check: no silently empty payloads */
const problems = [];
if (!core.standings.length) problems.push('standings empty');
if (!core.files.trackLaurent) problems.push('no laurent track');
if (!laurentHistory.dates.length) problems.push('no laurent history');
if (problems.length) console.error('BUILD WARNINGS:', problems.join(', '));

console.log(
  `core.json ${(coreBytes / 1024).toFixed(1)} kB · ${Object.keys(trackFiles).length} tracks (${totalTrackPts} pts) · ` +
    `${laurentHistory.dates.length} reports · ${core.standings.length} classes · laurent P${core.laurent.rank}`
);
