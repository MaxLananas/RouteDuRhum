/**
 * Find an Open-Meteo grid request shape the API accepts (multi-coordinate grids
 * are capped), and record the exact URLs used by the site.
 */
const BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE = 'https://marine-api.open-meteo.com/v1/marine';
const variables = 'wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m';

const lat = [];
const lon = [];
for (let la = 52; la >= 16; la -= 4) for (let lo = -68; lo <= -16; lo += 4) { lat.push(la); lon.push(lo); }
// Open-Meteo multi-point requests are PAIRS: latitude[i] with longitude[i].
const pLat = [];
const pLon = [];
for (let i = 0; i < 140; i++) {
  pLat.push(52 - (i % 10) * 4);
  pLon.push(-68 + Math.floor(i / 10) * 4);
}
console.log('grid points:', pLat.length);

const variants = [
  ['full grid', `${BASE}?latitude=${lat.join(',')}&longitude=${lon.join(',')}&hourly=${variables}&wind_speed_unit=kn&timezone=UTC&forecast_days=3`],
  ['grid + cell_selection', `${BASE}?latitude=${lat.join(',')}&longitude=${lon.join(',')}&hourly=${variables}&wind_speed_unit=kn&timezone=UTC&forecast_days=3&cell_selection=sea`],
  ['5x5 test', `${BASE}?latitude=${lat.slice(0, 25).join(',')}&longitude=${lon.slice(0, 25).join(',')}&hourly=${variables}&wind_speed_unit=kn&timezone=UTC&forecast_days=3`],
  ['8x8 test', `${BASE}?latitude=${lat.slice(0, 64).join(',')}&longitude=${lon.slice(0, 64).join(',')}&hourly=${variables}&wind_speed_unit=kn&timezone=UTC&forecast_days=3`],
  ['10x10 test', `${BASE}?latitude=${lat.slice(0, 100).join(',')}&longitude=${lon.slice(0, 100).join(',')}&hourly=${variables}&wind_speed_unit=kn&timezone=UTC&forecast_days=3`],
];

for (const [name, url] of variants) {
  try {
    const res = await fetch(url);
    const body = await res.text();
    let shape = body.slice(0, 140);
    try {
      const j = JSON.parse(body);
      shape = Array.isArray(j) ? `array(${j.length}) first.lat=${j[0]?.latitude}` : `object keys=${Object.keys(j).join(',')}`;
    } catch {}
    console.log(`${name.padEnd(22)} HTTP ${res.status} ${body.length}B  ${shape}`);
  } catch (e) {
    console.log(`${name.padEnd(22)} ERROR ${e.message}`);
  }
}

// marine grid
const mVariants = [
  ['marine 36', `${MARINE}?latitude=${lat.slice(0, 36).join(',')}&longitude=${lon.slice(0, 36).join(',')}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=UTC&forecast_days=3`],
  ['marine 25', `${MARINE}?latitude=${lat.slice(0, 25).join(',')}&longitude=${lon.slice(0, 25).join(',')}&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature&timezone=UTC&forecast_days=3`],
  ['marine + wave_period', `${MARINE}?latitude=40,-40&longitude=-40,-40&hourly=wave_height,wave_direction,wave_period,swell_wave_height,sea_surface_temperature&timezone=UTC&forecast_days=3`],
];
for (const [name, url] of mVariants) {
  try {
    const res = await fetch(url);
    const body = await res.text();
    let shape = body.slice(0, 160);
    try {
      const j = JSON.parse(body);
      shape = Array.isArray(j) ? `array(${j.length})` : `object keys=${Object.keys(j).join(',')}`;
    } catch {}
    console.log(`${name.padEnd(22)} HTTP ${res.status} ${body.length}B ${shape}`);
  } catch (e) {
    console.log(`${name.padEnd(22)} ERROR ${e.message}`);
  }
}

// ---- reproduce the browser request exactly (headers matter) ----
const exact = `https://api.open-meteo.com/v1/forecast?latitude=${pLat.join(',')}&longitude=${pLon.join(',')}&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn`;
const headerSets = [
  ['plain', {}],
  ['browser-ish', {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131 Safari/537.36',
    'Accept': '*/*',
    'Origin': 'http://127.0.0.1:8099',
    'Referer': 'http://127.0.0.1:8099/',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-Dest': 'empty',
  }],
  ['origin-only', { 'Origin': 'http://127.0.0.1:8099' }],
  ['accept-encoding', { 'Accept-Encoding': 'gzip, deflate, br, zstd' }],
];
for (const [name, headers] of headerSets) {
  try {
    const res = await fetch(exact, { headers });
    const body = await res.text();
    console.log(`EXACT ${name.padEnd(16)} HTTP ${res.status} ${body.length}B ${res.status !== 200 ? body.slice(0, 220) : ''}`);
  } catch (e) {
    console.log(`EXACT ${name.padEnd(16)} ERROR ${e.message}`);
  }
}

// and a 2-day version of the same grid
const twoDay = exact.replace('forecast_days=3', 'forecast_days=2');
let r2 = await fetch(twoDay);
console.log(`EXACT 2days            HTTP ${r2.status} ${(await r2.text()).length}B`);
