/** Does Open-Meteo refuse the exact URL the browser sends? Test header variants. */
// paired grid: 10 lats x 14 lons = 140 points, lat-major
const PL = [];
const PN = [];
for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) { PL.push(52 - y * 4); PN.push(-68 + x * 4); }
const exact = `https://api.open-meteo.com/v1/forecast?latitude=${PL.join(',')}&longitude=${PN.join(',')}&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn&cell_selection=sea`;
const marineExact = `https://marine-api.open-meteo.com/v1/marine?latitude=${PL.join(',')}&longitude=${PN.join(',')}&timezone=UTC&forecast_days=3&hourly=wave_height,wave_direction,wave_period,sea_surface_temperature`;
const sets = [
  ['plain', {}],
  ['browser', {
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/131.0.0.0 Safari/537.36',
    Accept: '*/*',
    Origin: 'http://127.0.0.1:8099',
    Referer: 'http://127.0.0.1:8099/',
    'Sec-Fetch-Mode': 'cors',
    'Sec-Fetch-Site': 'cross-site',
  }],
  ['origin', { Origin: 'http://127.0.0.1:8099' }],
  ['ua', { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/131 Safari/537.36' }],
];
for (const [n, h] of sets) {
  try {
    const r = await fetch(exact, { headers: h });
    const b = await r.text();
    console.log(`EXACT ${n.padEnd(10)} HTTP ${r.status} ${b.length}B ${r.status !== 200 ? b.slice(0, 240) : ''}`);
  } catch (e) {
    console.log(`EXACT ${n.padEnd(10)} ERROR ${e.message}`);
  }
}
{
  const r = await fetch(marineExact);
  console.log(`MARINE grid    HTTP ${r.status} ${(await r.text()).length}B`);
}
for (const days of ['2', '3']) {
  const u = exact.replace('forecast_days=3', `forecast_days=${days}`);
  const r = await fetch(u);
  console.log(`EXACT days=${days}    HTTP ${r.status} ${(await r.text()).length}B`);
}
