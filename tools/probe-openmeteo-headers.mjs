/** Does Open-Meteo refuse the exact URL the browser sends? Test header variants. */
const exact = 'https://api.open-meteo.com/v1/forecast?latitude=52,48,44,40,36,32,28,24,20,16&longitude=-68,-64,-60,-56,-52,-48,-44,-40,-36,-32,-28,-24,-20,-16&timezone=UTC&forecast_days=3&hourly=wind_speed_10m,wind_direction_10m,wind_gusts_10m,pressure_msl,cloud_cover,temperature_2m&wind_speed_unit=kn';
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
for (const days of ['2', '3']) {
  const u = exact.replace('forecast_days=3', `forecast_days=${days}`);
  const r = await fetch(u);
  console.log(`EXACT days=${days}    HTTP ${r.status} ${(await r.text()).length}B`);
}
