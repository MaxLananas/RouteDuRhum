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

  /** Datasets of every chart built so far, so baseOpts can pin the time range. */
  const DATA = {};

  function baseOpts(yTitle, unit, chartId) {
    const range = chartId && DATA[chartId] ? pinTimeRange(DATA[chartId]) : null;
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
            title: dateTitle,
            label: (c) => ` ${c.dataset.label} : ${c.parsed.y === null || c.parsed.y === undefined ? '—' : c.parsed.y.toLocaleString('fr-FR', { maximumFractionDigits: 1 })}${unit ? ' ' + unit : ''}`,
          },
        },
      },
      scales: {
        // A linear time axis, in epoch milliseconds: the tracker publishes every
        // 5 min at the start and every hour later, so a category axis would
        // stretch the first hours of the race to half the chart.
        x: {
          ...AXIS,
          type: 'linear',
          ticks: {
            ...AXIS.ticks,
            maxTicksLimit: 6,
            callback: (v) => dateTick(v),
          },
          ...(range || {}),
        },
        y: { ...AXIS, beginAtZero: false, title: { display: !!yTitle, text: yTitle, color: '#4d637a', font: { size: 8 } } },
      },
    };
  }

  function make(id, conf) {
    DATA[id] = conf?.data?.datasets || [];
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

  /** ISO timestamp → epoch ms, or null (Chart.js skips null points). */
  const ms = (iso) => {
    const t = Date.parse(iso);
    return Number.isFinite(t) ? t : null;
  };

  /** Axis tick: day + hour in Paris time, weekday kept for the 48 h forecast. */
  const dateTick = (v) => {
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return '';
    const day = d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    return `${day} ${time}`;
  };

  /** Same, for tooltip titles. */
  const dateTitle = (items) => {
    const v = items?.[0]?.parsed?.x;
    if (!Number.isFinite(v)) return '';
    return new Date(v).toLocaleString('fr-FR', {
      weekday: 'short', day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris',
    });
  };

  /**
   * Pin the x axis to the first and last real report. Chart.js otherwise pads a
   * linear axis, which invents empty hours at both ends of the race.
   */
  function pinTimeRange(datasets) {
    let min = Infinity;
    let max = -Infinity;
    (datasets || []).forEach((d) => {
      (d.data || []).forEach((pt) => {
        if (!Number.isFinite(pt?.x)) return;
        if (pt.x < min) min = pt.x;
        if (pt.x > max) max = pt.x;
      });
    });
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) return null;
    const pad = (max - min) * 0.01;
    return { min: min - pad, max: max + pad };
  }

  /** Build [{x, y}] pairs from a parallel array of ISO dates. */
  const pairs = (dates, values) => dates.map((iso, i) => ({ x: ms(iso), y: values[i] ?? null })).filter((p) => p.x !== null);

  /* ---------------------------------------------------- Laurent history */
  C.laurentHistory = function (h) {
    if (!h || !h.dates || !h.dates.length) return;
    theme();
    make('chartSpeed', {
      type: 'line',
      data: {
        datasets: [
          line(pairs(h.dates, h.speed), 'rgb(62,230,176)', { label: 'Vitesse', fill: true }),
          line(pairs(h.dates, h.vmg), 'rgb(114,185,241)', { label: 'VMG', dash: [4, 3] }),
        ],
      },
      options: baseOpts('nœuds', 'nd', 'chartSpeed'),
    });

    const ranks = h.rank.map((r) => (Number.isFinite(r) ? r : null));
    const maxRank = Math.max(...ranks.filter(Number.isFinite), 2);
    make('chartRank', {
      type: 'line',
      data: {
        datasets: [
          {
            data: pairs(h.dates, ranks),
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
        ...baseOpts('rang', '', 'chartRank'),
        scales: {
          x: {
            ...AXIS, type: 'linear',
            ticks: { ...AXIS.ticks, maxTicksLimit: 6, callback: (v) => dateTick(v) },
            ...(pinTimeRange(DATA.chartRank || []) || {}),
          },
          y: { ...AXIS, reverse: true, min: 1, max: maxRank, ticks: { ...AXIS.ticks, stepSize: 1, precision: 0 } },
        },
      },
    });

    make('chartDtf', {
      type: 'line',
      data: {
        datasets: [
          line(pairs(h.dates, h.dtf), 'rgb(255,194,75)', { label: 'DTF', fill: true }),
          line(pairs(h.dates, h.dtl), 'rgb(255,107,87)', { label: 'DTL' }),
        ],
      },
      options: baseOpts('milles', 'mi', 'chartDtf'),
    });

    make('chartWind', {
      type: 'line',
      data: {
        datasets: [
          // official tracker units: wind in tenths of a knot, waves in decimetres
          line(pairs(h.dates, h.windspeed.map((v) => (Number.isFinite(v) ? v / 10 : null))), 'rgb(114,185,241)', { label: 'Vent', fill: true }),
          line(pairs(h.dates, h.windgust.map((v) => (Number.isFinite(v) ? v / 10 : null))), 'rgb(255,107,87)', { label: 'Rafales', dash: [3, 3] }),
          line(pairs(h.dates, h.waveheight.map((v) => (Number.isFinite(v) ? v / 10 : null))), 'rgb(62,230,176)', { label: 'Vagues' }),
        ],
      },
      options: baseOpts('nd · m', '', 'chartWind'),
    });
  };

  /* ------------------------------------------------------ forecast chart */
  C.forecast = function (s) {
    if (!s || !s.time.length) return;
    theme();
    const iso = s.time.map((t) => t + ':00Z');
    make('chartForecast', {
      type: 'line',
      data: {
        datasets: [
          line(pairs(iso, s.wind), 'rgb(114,185,241)', { label: 'Vent', fill: true }),
          line(pairs(iso, s.gust), 'rgb(255,138,61)', { label: 'Rafales' }),
          line(pairs(iso, s.waves), 'rgb(62,230,176)', { label: 'Vagues', dash: [4, 3] }),
        ],
      },
      options: baseOpts('nd · m', '', 'chartForecast'),
    });
  };

  /** Gap to the leader for Laurent (+ optionally the whole Ocean Fifty fleet). */
  C.rivals = function (hist, fleet, showAll) {
    const core = dataStore.core;
    if (!hist || !hist.dates) return;
    theme();
    const me = hist.dtl.map((v) => (Number.isFinite(v) ? v : null));
    const datasets = [
      {
        ...line(pairs(hist.dates, me), 'rgb(47,123,255)', { label: 'La French Fab', width: 2.4, fill: true }),
      },
    ];
    if (showAll && fleet && fleet.series) {
      for (const [id, s] of Object.entries(fleet.series)) {
        if (String(id) === String(hist.boatId)) continue;
        datasets.push({
          ...line(pairs(hist.dates, s.dtl.map((v) => (Number.isFinite(v) ? v : null))), 'rgb(92,117,145)', { width: 1 }),
          label: core?.boats?.[id]?.n || `#${id}`,
        });
      }
    }
    make('chartRivals', {
      type: 'line',
      data: { datasets },
      options: {
        ...baseOpts('milles de retard', 'mi', 'chartRivals'),
        plugins: {
          ...baseOpts().plugins,
          tooltip: {
            ...baseOpts().plugins.tooltip,
            callbacks: {
              label: (c) =>
                ` ${c.dataset.label} : ${c.parsed.y === null ? '—' : c.parsed.y.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} mi`,
            },
          },
        },
      },
    });
  };

  window.charts = C;
})();
