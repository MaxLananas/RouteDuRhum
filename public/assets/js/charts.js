/* ============================================================================
   Charts — Chart.js, styled for the dark ocean theme.
   ========================================================================== */
(function () {
  'use strict';

  const C = { instances: {}, theme: null };

  function theme() {
    if (C.theme) return C.theme;
    Chart.defaults.font.family = "'JetBrains Mono', monospace";
    Chart.defaults.font.size = 9;
    Chart.defaults.color = '#6b8299';
    C.theme = true;
    return true;
  }

  const AXIS = {
    grid: { color: 'rgba(255,255,255,0.06)', drawTicks: false },
    border: { display: false },
    ticks: { padding: 6, maxRotation: 0, autoSkipPadding: 14 },
  };

  function baseOpts(yTitle, unit) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 420 },
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(9,18,30,.96)',
          borderColor: 'rgba(255,255,255,.16)',
          borderWidth: 1,
          titleFont: { family: "'JetBrains Mono', monospace", size: 9 },
          bodyFont: { family: "'JetBrains Mono', monospace", size: 10 },
          padding: 9,
          cornerRadius: 8,
          displayColors: true,
          boxWidth: 6,
          boxHeight: 6,
          callbacks: {
            label: (c) => ` ${c.dataset.label} : ${c.parsed.y === null || c.parsed.y === undefined ? '—' : c.parsed.y.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${unit ? ' ' + unit : ''}`,
          },
        },
      },
      scales: {
        x: { ...AXIS, type: 'category', ticks: { ...AXIS.ticks, maxTicksLimit: 6 } },
        y: { ...AXIS, beginAtZero: false, title: { display: !!yTitle, text: yTitle, color: '#4d637a', font: { size: 8 } } },
      },
    };
  }

  function make(id, conf) {
    const el = document.getElementById(id);
    if (!el) return null;
    if (C.instances[id]) C.instances[id].destroy();
    const chart = new Chart(el.getContext('2d'), conf);
    C.instances[id] = chart;
    return chart;
  }

  function line(data, color, opts = {}) {
    return {
      data,
      borderColor: color,
      backgroundColor: opts.fill ? color.replace('rgb', 'rgba').replace(')', ',0.12)') : 'transparent',
      borderWidth: opts.width || 1.8,
      pointRadius: 0,
      pointHoverRadius: 3,
      tension: opts.tension ?? 0.25,
      fill: !!opts.fill,
      spanGaps: true,
      yAxisID: opts.axis || 'y',
      borderDash: opts.dash || undefined,
      label: opts.label || '',
      stepped: opts.stepped || false,
    };
  }

  const dateLabel = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  };

  /* ---------------------------------------------------- Laurent history */
  C.laurentHistory = function (h) {
    if (!h || !h.dates || !h.dates.length) return;
    theme();
    const labels = h.dates.map(dateLabel);

    make('chartSpeed', {
      type: 'line',
      data: {
        labels,
        datasets: [
          line(h.speed, 'rgb(62,230,176)', { label: 'Vitesse', fill: true }),
          line(h.vmg, 'rgb(114,185,241)', { label: 'VMG', dash: [4, 3] }),
        ],
      },
      options: baseOpts('nœuds', 'nd'),
    });

    const ranks = h.rank.map((r) => (Number.isFinite(r) ? r : null));
    const maxRank = Math.max(...ranks.filter(Number.isFinite), 2);
    make('chartRank', {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: ranks,
            borderColor: 'rgb(255,194,75)',
            backgroundColor: 'rgba(255,194,75,.12)',
            borderWidth: 2,
            pointRadius: 0,
            stepped: 'middle',
            fill: true,
            spanGaps: true,
            label: 'Rang',
          },
        ],
      },
      options: {
        ...baseOpts('rang', ''),
        scales: {
          x: { ...AXIS, ticks: { ...AXIS.ticks, maxTicksLimit: 6 } },
          y: { ...AXIS, reverse: true, min: 1, max: maxRank, ticks: { ...AXIS.ticks, stepSize: 1, precision: 0 } },
        },
      },
    });

    make('chartDtf', {
      type: 'line',
      data: {
        labels,
        datasets: [
          line(h.dtf, 'rgb(255,194,75)', { label: 'DTF', fill: true }),
          line(h.dtl, 'rgb(255,107,87)', { label: 'DTL' }),
        ],
      },
      options: baseOpts('milles', 'mi'),
    });

    make('chartWind', {
      type: 'line',
      data: {
        labels,
        datasets: [
          // official tracker units: wind in tenths of a knot, waves in decimetres
          line(h.windspeed.map((v) => (Number.isFinite(v) ? v / 10 : null)), 'rgb(114,185,241)', { label: 'Vent', fill: true }),
          line(h.windgust.map((v) => (Number.isFinite(v) ? v / 10 : null)), 'rgb(255,107,87)', { label: 'Rafales', dash: [3, 3] }),
          line(h.waveheight.map((v) => (Number.isFinite(v) ? v / 10 : null)), 'rgb(62,230,176)', { label: 'Vagues' }),
        ],
      },
      options: baseOpts('nd · m', ''),
    });
  };

  /* ------------------------------------------------------ forecast chart */
  C.forecast = function (s) {
    if (!s || !s.time.length) return;
    theme();
    const labels = s.time.map((t) => {
      const d = new Date(t + ':00Z');
      return d.toLocaleDateString('fr-FR', { weekday: 'short' }) + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    });
    make('chartForecast', {
      type: 'line',
      data: {
        labels,
        datasets: [
          line(s.wind, 'rgb(114,185,241)', { label: 'Vent', fill: true }),
          line(s.gust, 'rgb(255,138,61)', { label: 'Rafales' }),
          line(s.waves, 'rgb(62,230,176)', { label: 'Vagues', dash: [4, 3] }),
        ],
      },
      options: baseOpts('nd · m', ''),
    });
  };

  window.charts = C;
})();
