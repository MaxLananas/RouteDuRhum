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
const n = lat.length;
console.log('grid points:', n);

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
