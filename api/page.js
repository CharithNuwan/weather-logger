// api/page.js — serves all HTML pages
export default function handler(req, res) {
  const path = req.url?.split('?')[0] || '/';

  if (path === '/' || path === '/dashboard') {
    return res.status(200).setHeader('Content-Type','text/html').send(dashboardHTML());
  }
  if (path === '/patterns') {
    return res.status(200).setHeader('Content-Type','text/html').send(patternsHTML());
  }
  if (path === '/summary') {
    return res.status(200).setHeader('Content-Type','text/html').send(summaryHTML());
  }
  if (path === '/predict') {
    return res.status(200).setHeader('Content-Type','text/html').send(predictHTML());
  }
  if (path === '/settings') {
    return res.status(200).setHeader('Content-Type','text/html').send(settingsHTML());
  }

  return res.status(404).send('Not found');
}

// ============================================================
// SHARED STYLES + NAV
// ============================================================
function sharedHead(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Weather Logger</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');
:root{
  --bg:#060a0e;--panel:#0c1520;--border:#152535;
  --teal:#00e5cc;--blue:#0088ff;--orange:#ff8800;
  --green:#00dd77;--red:#ff3355;--gold:#f0a500;
  --purple:#aa44ff;--dim:#2a5070;--text:#90b8d0;--white:#d8eeff;
}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Exo 2',sans-serif;min-height:100vh}
body::before{content:'';position:fixed;inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,204,.006) 2px,rgba(0,229,204,.006) 4px);
  pointer-events:none;z-index:999}

/* NAV */
nav{background:rgba(6,10,14,.95);border-bottom:1px solid var(--border);
  padding:10px 20px;display:flex;align-items:center;gap:15px;
  position:sticky;top:0;z-index:100;backdrop-filter:blur(10px)}
.nav-brand{font-family:'Orbitron',monospace;font-size:.85rem;font-weight:900;
  color:var(--white);letter-spacing:3px;margin-right:10px}
.nav-brand span{color:var(--teal)}
.nav-link{font-family:'Orbitron',monospace;font-size:.5rem;letter-spacing:2px;
  color:var(--dim);text-decoration:none;padding:5px 10px;border-radius:2px;
  border:1px solid transparent;transition:all .2s}
.nav-link:hover{color:var(--teal);border-color:var(--border)}
.nav-link.active{color:var(--teal);border-color:var(--teal);background:rgba(0,229,204,.06)}
.nav-status{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.6rem}
.status-dot{width:7px;height:7px;border-radius:50%;background:var(--dim)}
.status-dot.online{background:var(--green);box-shadow:0 0 6px var(--green);animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}

/* PAGE */
.page{max-width:1400px;margin:0 auto;padding:15px}
.page-title{font-family:'Orbitron',monospace;font-size:1.2rem;font-weight:900;
  color:var(--white);letter-spacing:4px;margin-bottom:4px}
.page-sub{font-size:.65rem;color:var(--dim);letter-spacing:2px;margin-bottom:15px}
.hline{height:1px;background:linear-gradient(90deg,transparent,var(--teal),transparent);
  margin-bottom:15px;opacity:.35}

/* PANELS */
.panel{background:var(--panel);border:1px solid var(--border);border-radius:4px;
  padding:14px;position:relative;overflow:hidden}
.panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--teal),transparent);opacity:.4}
.ptitle{font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:3px;
  color:var(--teal);margin-bottom:12px;opacity:.8}

/* CARDS GRID */
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:4px;
  padding:14px;text-align:center;position:relative;overflow:hidden;transition:all .3s}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;transition:background .3s}
.card.temp::before{background:linear-gradient(90deg,transparent,var(--orange),transparent)}
.card.hum::before{background:linear-gradient(90deg,transparent,var(--blue),transparent)}
.card.pres::before{background:linear-gradient(90deg,transparent,var(--purple),transparent)}
.card.alt::before{background:linear-gradient(90deg,transparent,var(--green),transparent)}
.card-icon{font-size:1.5rem;margin-bottom:5px}
.card-val{font-family:'Orbitron',monospace;font-size:1.8rem;font-weight:900;
  line-height:1;margin-bottom:3px;transition:all .3s}
.card-unit{font-size:.6rem;color:var(--dim);letter-spacing:2px;margin-bottom:5px}
.card-lbl{font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:2px;color:var(--dim)}
.card-change{font-size:.6rem;margin-top:4px}

/* GRID LAYOUTS */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px}
.grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px}
.grid4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:15px}

/* CHART */
.chart-wrap{position:relative;height:200px}

/* TABLE */
.tbl{width:100%;border-collapse:collapse;font-size:.7rem}
.tbl th{font-family:'Orbitron',monospace;font-size:.48rem;letter-spacing:2px;
  color:var(--teal);padding:7px 10px;border-bottom:1px solid var(--border);text-align:left}
.tbl td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.03);color:var(--text)}
.tbl tr:hover td{background:rgba(0,229,204,.03)}

/* STAT ROWS */
.srow{display:flex;justify-content:space-between;padding:5px 0;
  border-bottom:1px solid rgba(255,255,255,.04);font-size:.68rem}
.srow:last-child{border-bottom:none}
.slbl{color:var(--dim)}.sval{font-family:'Orbitron',monospace;font-size:.65rem;font-weight:700}

/* BUTTONS */
.btn{font-family:'Orbitron',monospace;font-size:.55rem;letter-spacing:2px;
  padding:8px 16px;border-radius:3px;border:1px solid;cursor:pointer;transition:all .2s}
.btn-teal{background:rgba(0,229,204,.1);border-color:var(--teal);color:var(--teal)}
.btn-teal:hover{background:rgba(0,229,204,.2)}
.btn-red{background:rgba(255,51,85,.1);border-color:var(--red);color:var(--red)}
.btn-red:hover{background:rgba(255,51,85,.2)}
.btn-gold{background:rgba(240,165,0,.1);border-color:var(--gold);color:var(--gold)}
.btn-gold:hover{background:rgba(240,165,0,.2)}

/* INPUT */
.inp{background:rgba(0,0,0,.3);border:1px solid var(--border);color:var(--white);
  padding:7px 12px;border-radius:3px;font-family:'Exo 2',sans-serif;font-size:.8rem;width:100%}
.inp:focus{outline:none;border-color:var(--teal)}
.inp-group{margin-bottom:10px}
.inp-lbl{font-family:'Orbitron',monospace;font-size:.5rem;letter-spacing:2px;
  color:var(--dim);margin-bottom:4px;display:block}

/* BADGE */
.badge{display:inline-block;font-family:'Orbitron',monospace;font-size:.5rem;
  padding:2px 7px;border-radius:2px;letter-spacing:1px}
.badge-ok{background:rgba(0,221,119,.12);color:var(--green);border:1px solid rgba(0,221,119,.3)}
.badge-warn{background:rgba(240,165,0,.12);color:var(--gold);border:1px solid rgba(240,165,0,.3)}
.badge-bad{background:rgba(255,51,85,.12);color:var(--red);border:1px solid rgba(255,51,85,.3)}

/* LOADING */
.loading{text-align:center;padding:30px;color:var(--dim);
  font-family:'Orbitron',monospace;font-size:.6rem;letter-spacing:3px}

/* REFRESH BAR */
.rbar{position:fixed;bottom:0;left:0;right:0;height:2px;background:var(--border);z-index:998}
.rfill{height:100%;background:linear-gradient(90deg,var(--teal),var(--blue))}

@media(max-width:768px){
  .cards{grid-template-columns:repeat(2,1fr)}
  .grid2,.grid3,.grid4{grid-template-columns:1fr}
}
</style>
</head>
<body>`;
}

function nav(active) {
  return `<nav>
  <span class="nav-brand">WEATHER <span>LOGGER</span></span>
  <a href="/"         class="nav-link ${active==='dashboard'?'active':''}">DASHBOARD</a>
  <a href="/patterns" class="nav-link ${active==='patterns' ?'active':''}">PATTERNS</a>
  <a href="/summary"  class="nav-link ${active==='summary'  ?'active':''}">SUMMARY</a>
  <a href="/predict"  class="nav-link ${active==='predict'  ?'active':''}">PREDICT</a>
  <a href="/settings" class="nav-link ${active==='settings' ?'active':''}">SETTINGS</a>
  <div class="nav-status">
    <div class="status-dot" id="status-dot"></div>
    <span id="status-txt" style="color:var(--dim)">CONNECTING</span>
    <span id="last-update" style="color:var(--dim);font-size:.55rem"></span>
  </div>
</nav>`;
}

// ============================================================
// DASHBOARD PAGE
// ============================================================
function dashboardHTML() {
  return sharedHead('Dashboard') + nav('dashboard') + `
<div class="page">
  <div class="page-title">LIVE <span style="color:var(--teal)">DASHBOARD</span></div>
  <div class="page-sub">REAL TIME WEATHER DATA · AUTO REFRESH 30s</div>
  <div class="hline"></div>

  <!-- LIVE CARDS -->
  <div class="cards">
    <div class="card temp">
      <div class="card-icon">🌡️</div>
      <div class="card-val" id="val-temp" style="color:var(--orange)">--.-</div>
      <div class="card-unit">CELSIUS</div>
      <div class="card-lbl">TEMPERATURE</div>
      <div class="card-change" id="chg-temp"></div>
    </div>
    <div class="card hum">
      <div class="card-icon">💧</div>
      <div class="card-val" id="val-hum" style="color:var(--blue)">--.-</div>
      <div class="card-unit">PERCENT %</div>
      <div class="card-lbl">HUMIDITY</div>
      <div class="card-change" id="chg-hum"></div>
    </div>
    <div class="card pres">
      <div class="card-icon">🔵</div>
      <div class="card-val" id="val-pres" style="color:var(--purple);font-size:1.3rem">----.-</div>
      <div class="card-unit">hPa</div>
      <div class="card-lbl">PRESSURE</div>
      <div class="card-change" id="chg-pres"></div>
    </div>
    <div class="card alt">
      <div class="card-icon">⛰️</div>
      <div class="card-val" id="val-alt" style="color:var(--green)">---.-</div>
      <div class="card-unit">METERS</div>
      <div class="card-lbl">ALTITUDE</div>
    </div>
  </div>

  <!-- STATUS ROW -->
  <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap">
    <div class="panel" style="flex:1;min-width:200px;padding:10px">
      <div class="ptitle">▸ DEVICE STATUS</div>
      <div class="srow"><span class="slbl">Device</span><span class="sval" id="dev-name" style="color:var(--teal)">--</span></div>
      <div class="srow"><span class="slbl">Location</span><span class="sval" id="dev-loc" style="color:var(--text)">--</span></div>
      <div class="srow"><span class="slbl">Interval</span><span class="sval" id="dev-interval" style="color:var(--gold)">-- s</span></div>
      <div class="srow"><span class="slbl">Last seen</span><span class="sval" id="dev-lastseen" style="color:var(--green)">--</span></div>
      <div class="srow"><span class="slbl">Total readings</span><span class="sval" id="dev-total" style="color:var(--teal)">--</span></div>
    </div>
    <div class="panel" style="flex:1;min-width:200px;padding:10px">
      <div class="ptitle">▸ TODAY RANGE</div>
      <div class="srow"><span class="slbl">Temp min/max</span><span class="sval" id="today-temp" style="color:var(--orange)">--</span></div>
      <div class="srow"><span class="slbl">Humid min/max</span><span class="sval" id="today-hum" style="color:var(--blue)">--</span></div>
      <div class="srow"><span class="slbl">Pres min/max</span><span class="sval" id="today-pres" style="color:var(--purple);font-size:.55rem">--</span></div>
      <div class="srow"><span class="slbl">Readings today</span><span class="sval" id="today-count" style="color:var(--teal)">--</span></div>
    </div>
    <div class="panel" style="flex:1;min-width:200px;padding:10px">
      <div class="ptitle">▸ COMFORT INDEX</div>
      <div style="text-align:center;padding:10px 0">
        <div style="font-size:2rem" id="comfort-icon">--</div>
        <div style="font-family:'Orbitron',monospace;font-size:.9rem;margin-top:5px" id="comfort-label">--</div>
        <div style="font-size:.65rem;color:var(--dim);margin-top:3px" id="comfort-desc">--</div>
      </div>
    </div>
  </div>

  <!-- CHARTS -->
  <div class="grid2">
    <div class="panel">
      <div class="ptitle">▸ TEMPERATURE — LAST 50 READINGS</div>
      <div class="chart-wrap"><canvas id="chart-temp"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">▸ HUMIDITY — LAST 50 READINGS</div>
      <div class="chart-wrap"><canvas id="chart-hum"></canvas></div>
    </div>
  </div>
  <div class="grid2">
    <div class="panel">
      <div class="ptitle">▸ PRESSURE — LAST 50 READINGS</div>
      <div class="chart-wrap"><canvas id="chart-pres"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">▸ ALTITUDE — LAST 50 READINGS</div>
      <div class="chart-wrap"><canvas id="chart-alt"></canvas></div>
    </div>
  </div>
</div>

<div class="rbar"><div class="rfill" id="rbar" style="width:100%"></div></div>

<script>
let charts = {};
let prevData = null;
let refreshInterval = 30;
let countdown = 30;

const chartDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    x: { ticks: { color:'#2a5070', font:{size:9}, maxTicksLimit:8 },
         grid: { color:'rgba(255,255,255,.04)' } },
    y: { ticks: { color:'#90b8d0', font:{size:10} },
         grid: { color:'rgba(255,255,255,.06)' } }
  }
};

function makeChart(id, color, label) {
  const ctx = document.getElementById(id)?.getContext('2d');
  if (!ctx) return null;
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label, data: [],
        borderColor: color,
        backgroundColor: color + '18',
        borderWidth: 2,
        pointRadius: 2,
        pointBackgroundColor: color,
        fill: true,
        tension: 0.4
      }]
    },
    options: { ...chartDefaults }
  });
}

function initCharts() {
  charts.temp = makeChart('chart-temp','#ff8800','Temperature °C');
  charts.hum  = makeChart('chart-hum', '#0088ff','Humidity %');
  charts.pres = makeChart('chart-pres','#aa44ff','Pressure hPa');
  charts.alt  = makeChart('chart-alt', '#00dd77','Altitude m');
}

function updateChart(chart, data, field) {
  if (!chart) return;
  chart.data.labels = data.map(d =>
    new Date(d.recorded_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
  );
  chart.data.datasets[0].data = data.map(d => parseFloat(d[field]).toFixed(2));
  chart.update('none');
}

function comfortIndex(temp, hum) {
  const hi = temp + 0.33*(hum/100*6.105*Math.exp(17.27*temp/(237.7+temp))) - 4;
  if (hi < 21) return { icon:'🥶', label:'COLD',        desc:'Below comfort zone', color:'#0088ff' };
  if (hi < 24) return { icon:'😊', label:'COMFORTABLE', desc:'Ideal conditions',   color:'#00dd77' };
  if (hi < 27) return { icon:'😐', label:'WARM',        desc:'Slightly warm',      color:'#f0a500' };
  if (hi < 30) return { icon:'🥵', label:'HOT',         desc:'Uncomfortable heat', color:'#ff8800' };
  return              { icon:'🔥', label:'VERY HOT',    desc:'Dangerous heat!',    color:'#ff3355' };
}

function change(val, prev, unit) {
  if (!prev) return '';
  const diff = (val - prev).toFixed(1);
  if (Math.abs(diff) < 0.1) return `<span style="color:var(--dim)">▬ stable</span>`;
  if (diff > 0) return `<span style="color:var(--red)">▲ +${diff}${unit}</span>`;
  return `<span style="color:var(--blue)">▼ ${diff}${unit}</span>`;
}

async function loadData() {
  try {
    // Latest reading
    const r1  = await fetch('/api/data?type=latest');
    const d1  = await r1.json();
    const row = d1.data;

    if (row) {
      const temp = parseFloat(row.temp).toFixed(1);
      const hum  = parseFloat(row.humidity).toFixed(1);
      const pres = parseFloat(row.pressure).toFixed(1);
      const alt  = parseFloat(row.altitude).toFixed(1);

      document.getElementById('val-temp').textContent = temp;
      document.getElementById('val-hum').textContent  = hum;
      document.getElementById('val-pres').textContent = pres;
      document.getElementById('val-alt').textContent  = alt;

      if (prevData) {
        document.getElementById('chg-temp').innerHTML = change(temp, prevData.temp, '°');
        document.getElementById('chg-hum').innerHTML  = change(hum,  prevData.hum,  '%');
        document.getElementById('chg-pres').innerHTML = change(pres, prevData.pres, 'hPa');
      }
      prevData = { temp, hum, pres, alt };

      // Comfort
      const cf = comfortIndex(parseFloat(temp), parseFloat(hum));
      document.getElementById('comfort-icon').textContent  = cf.icon;
      document.getElementById('comfort-label').textContent = cf.label;
      document.getElementById('comfort-label').style.color = cf.color;
      document.getElementById('comfort-desc').textContent  = cf.desc;

      // Last seen
      const ago = Math.round((Date.now() - new Date(row.recorded_at+'Z').getTime()) / 1000);
      document.getElementById('dev-lastseen').textContent = ago < 3600 ? ago+'s ago' : 'Long ago';

      // Status dot
      document.getElementById('status-dot').className = ago < 120 ? 'status-dot online' : 'status-dot';
      document.getElementById('status-txt').textContent = ago < 120 ? 'ONLINE' : 'OFFLINE';
      document.getElementById('status-txt').style.color = ago < 120 ? 'var(--green)' : 'var(--red)';
    }

    // Recent for charts
    const r2 = await fetch('/api/data?type=recent&limit=50');
    const d2 = await r2.json();
    if (d2.data) {
      updateChart(charts.temp, d2.data, 'temp');
      updateChart(charts.hum,  d2.data, 'humidity');
      updateChart(charts.pres, d2.data, 'pressure');
      updateChart(charts.alt,  d2.data, 'altitude');
    }

    // Today summary
    const r3 = await fetch('/api/data?type=today');
    const d3 = await r3.json();
    if (d3.data) {
      const t = d3.data;
      document.getElementById('today-temp').textContent  = t.min_temp?.toFixed(1) + ' / ' + t.max_temp?.toFixed(1) + '°C';
      document.getElementById('today-hum').textContent   = t.min_hum?.toFixed(1)  + ' / ' + t.max_hum?.toFixed(1)  + '%';
      document.getElementById('today-pres').textContent  = t.min_pres?.toFixed(0) + ' / ' + t.max_pres?.toFixed(0) + ' hPa';
      document.getElementById('today-count').textContent = t.total_readings + ' readings';
    }

    // Stats + config
    const r4 = await fetch('/api/data?type=stats');
    const d4 = await r4.json();
    if (d4.data) {
      document.getElementById('dev-total').textContent = d4.data.total + ' total';
    }

    const r5 = await fetch('/api/config');
    const d5 = await r5.json();
    if (d5.config) {
      document.getElementById('dev-name').textContent     = d5.config.device_name || '--';
      document.getElementById('dev-loc').textContent      = d5.config.location    || '--';
      document.getElementById('dev-interval').textContent = d5.config.send_interval + 's';
      refreshInterval = parseInt(d5.config.send_interval || 30);
    }

    document.getElementById('last-update').textContent = new Date().toLocaleTimeString();

  } catch(e) {
    console.error('Load error:', e);
  }
}

// Countdown bar
function startCountdown() {
  countdown = refreshInterval;
  const bar = document.getElementById('rbar');
  const tick = setInterval(() => {
    countdown--;
    if (bar) bar.style.width = (countdown / refreshInterval * 100) + '%';
    if (countdown <= 0) {
      clearInterval(tick);
      loadData().then(() => startCountdown());
    }
  }, 1000);
}

initCharts();
loadData().then(() => startCountdown());
</script>
</body></html>`;
}

// ============================================================
// PATTERNS PAGE
// ============================================================
function patternsHTML() {
  return sharedHead('Patterns') + nav('patterns') + `
<div class="page">
  <div class="page-title">PATTERN <span style="color:var(--teal)">ANALYSIS</span></div>
  <div class="page-sub">HISTORICAL WEATHER PATTERNS · HOURLY & WEEKLY TRENDS</div>
  <div class="hline"></div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">▸ AVERAGE TEMPERATURE BY HOUR</div>
      <div class="chart-wrap"><canvas id="chart-hourtemp"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">▸ AVERAGE HUMIDITY BY HOUR</div>
      <div class="chart-wrap"><canvas id="chart-hourhum"></canvas></div>
    </div>
  </div>

  <div class="grid2">
    <div class="panel">
      <div class="ptitle">▸ 7 DAY TEMPERATURE RANGE</div>
      <div class="chart-wrap"><canvas id="chart-week"></canvas></div>
    </div>
    <div class="panel">
      <div class="ptitle">▸ 7 DAY HUMIDITY AVERAGE</div>
      <div class="chart-wrap"><canvas id="chart-weekhum"></canvas></div>
    </div>
  </div>

  <div class="panel">
    <div class="ptitle">▸ PATTERN INSIGHTS</div>
    <div id="insights" class="loading">ANALYZING PATTERNS...</div>
  </div>
</div>

<script>
async function loadPatterns() {
  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color:'#90b8d0', font:{size:10} } } },
    scales: {
      x: { ticks:{color:'#2a5070',font:{size:9}}, grid:{color:'rgba(255,255,255,.04)'} },
      y: { ticks:{color:'#90b8d0',font:{size:10}}, grid:{color:'rgba(255,255,255,.06)'} }
    }
  };

  // Hourly patterns
  const r1 = await fetch('/api/data?type=pattern_hour');
  const d1 = await r1.json();
  if (d1.data && d1.data.length > 0) {
    const hours  = d1.data.map(d => d.hour + ':00');
    const temps  = d1.data.map(d => parseFloat(d.avg_temp).toFixed(1));
    const hums   = d1.data.map(d => parseFloat(d.avg_hum).toFixed(1));

    new Chart(document.getElementById('chart-hourtemp').getContext('2d'), {
      type: 'bar',
      data: { labels: hours, datasets: [{
        label: 'Avg Temp °C', data: temps,
        backgroundColor: temps.map(t => t > 30 ? '#ff330055' : '#ff880055'),
        borderColor:     temps.map(t => t > 30 ? '#ff3355'   : '#ff8800'),
        borderWidth: 2
      }]},
      options: chartOpts
    });

    new Chart(document.getElementById('chart-hourhum').getContext('2d'), {
      type: 'bar',
      data: { labels: hours, datasets: [{
        label: 'Avg Humidity %', data: hums,
        backgroundColor: '#0088ff22', borderColor: '#0088ff', borderWidth: 2
      }]},
      options: chartOpts
    });

    // Insights
    const maxTempHour = d1.data.reduce((a,b) => a.avg_temp > b.avg_temp ? a : b);
    const minTempHour = d1.data.reduce((a,b) => a.avg_temp < b.avg_temp ? a : b);
    const maxHumHour  = d1.data.reduce((a,b) => a.avg_hum  > b.avg_hum  ? a : b);

    document.getElementById('insights').innerHTML = `
      <div class="grid3">
        <div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">
          <div style="font-size:1.5rem">🌡️</div>
          <div style="font-family:'Orbitron',monospace;color:var(--orange);font-size:.8rem;margin:5px 0">
            HOTTEST: ${maxTempHour.hour}:00
          </div>
          <div style="font-size:.7rem;color:var(--text)">
            Average ${parseFloat(maxTempHour.avg_temp).toFixed(1)}°C at this hour
          </div>
        </div>
        <div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">
          <div style="font-size:1.5rem">🌙</div>
          <div style="font-family:'Orbitron',monospace;color:var(--blue);font-size:.8rem;margin:5px 0">
            COOLEST: ${minTempHour.hour}:00
          </div>
          <div style="font-size:.7rem;color:var(--text)">
            Average ${parseFloat(minTempHour.avg_temp).toFixed(1)}°C at this hour
          </div>
        </div>
        <div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">
          <div style="font-size:1.5rem">💧</div>
          <div style="font-family:'Orbitron',monospace;color:var(--teal);font-size:.8rem;margin:5px 0">
            MOST HUMID: ${maxHumHour.hour}:00
          </div>
          <div style="font-size:.7rem;color:var(--text)">
            Average ${parseFloat(maxHumHour.avg_hum).toFixed(1)}% at this hour
          </div>
        </div>
      </div>
    `;
  }

  // Weekly
  const r2 = await fetch('/api/data?type=weekly');
  const d2 = await r2.json();
  if (d2.data && d2.data.length > 0) {
    const dates   = d2.data.map(d => d.date);
    const avgTemp = d2.data.map(d => parseFloat(d.avg_temp).toFixed(1));
    const minTemp = d2.data.map(d => parseFloat(d.min_temp).toFixed(1));
    const maxTemp = d2.data.map(d => parseFloat(d.max_temp).toFixed(1));
    const avgHum  = d2.data.map(d => parseFloat(d.avg_hum).toFixed(1));

    new Chart(document.getElementById('chart-week').getContext('2d'), {
      type: 'line',
      data: { labels: dates, datasets: [
        { label:'Max', data:maxTemp, borderColor:'#ff3355', borderWidth:2, pointRadius:3, fill:false, tension:.4 },
        { label:'Avg', data:avgTemp, borderColor:'#ff8800', borderWidth:2, pointRadius:3,
          backgroundColor:'#ff880015', fill:true, tension:.4 },
        { label:'Min', data:minTemp, borderColor:'#0088ff', borderWidth:2, pointRadius:3, fill:false, tension:.4 }
      ]},
      options: chartOpts
    });

    new Chart(document.getElementById('chart-weekhum').getContext('2d'), {
      type: 'line',
      data: { labels: dates, datasets: [{
        label:'Avg Humidity', data:avgHum,
        borderColor:'#0088ff', backgroundColor:'#0088ff15',
        borderWidth:2, fill:true, tension:.4
      }]},
      options: chartOpts
    });
  }
}

loadPatterns();
</script>
</body></html>`;
}

// ============================================================
// SUMMARY PAGE
// ============================================================
function summaryHTML() {
  return sharedHead('Summary') + nav('summary') + `
<div class="page">
  <div class="page-title">DAILY <span style="color:var(--teal)">SUMMARY</span></div>
  <div class="page-sub">TODAY'S WEATHER OVERVIEW</div>
  <div class="hline"></div>

  <div id="summary-content" class="loading">LOADING SUMMARY...</div>
</div>

<script>
async function loadSummary() {
  const [r1,r2,r3] = await Promise.all([
    fetch('/api/data?type=today'),
    fetch('/api/data?type=hourly'),
    fetch('/api/data?type=stats')
  ]);
  const [d1,d2,d3] = await Promise.all([r1.json(),r2.json(),r3.json()]);

  const t = d1.data;
  const h = d2.data || [];
  const s = d3.data;

  if (!t || !t.total_readings) {
    document.getElementById('summary-content').innerHTML =
      '<div class="loading">NO DATA FOR TODAY YET</div>';
    return;
  }

  // Weather description
  const avgTemp = parseFloat(t.avg_temp);
  const avgHum  = parseFloat(t.avg_hum);
  let weatherDesc = avgTemp > 32 ? '🔥 Very hot day'
    : avgTemp > 28 ? '☀️ Hot and sunny'
    : avgTemp > 24 ? '⛅ Warm day'
    : avgTemp > 20 ? '🌤️ Pleasant'
    : '🌡️ Cool day';

  let humDesc = avgHum > 80 ? '💦 Very humid'
    : avgHum > 65 ? '💧 Humid'
    : avgHum > 50 ? '😊 Comfortable'
    : '🌵 Dry';

  document.getElementById('summary-content').innerHTML = \`
    <div class="grid4" style="margin-bottom:15px">
      <div class="panel" style="text-align:center;padding:20px">
        <div style="font-size:2rem">🌡️</div>
        <div style="font-family:'Orbitron',monospace;font-size:1.5rem;color:var(--orange);margin:8px 0">
          \${parseFloat(t.avg_temp).toFixed(1)}°C
        </div>
        <div style="font-size:.6rem;color:var(--dim)">AVG TEMPERATURE</div>
        <div style="font-size:.65rem;margin-top:5px;color:var(--text)">
          \${parseFloat(t.min_temp).toFixed(1)}° — \${parseFloat(t.max_temp).toFixed(1)}°
        </div>
      </div>
      <div class="panel" style="text-align:center;padding:20px">
        <div style="font-size:2rem">💧</div>
        <div style="font-family:'Orbitron',monospace;font-size:1.5rem;color:var(--blue);margin:8px 0">
          \${parseFloat(t.avg_hum).toFixed(1)}%
        </div>
        <div style="font-size:.6rem;color:var(--dim)">AVG HUMIDITY</div>
        <div style="font-size:.65rem;margin-top:5px;color:var(--text)">
          \${parseFloat(t.min_hum).toFixed(1)}% — \${parseFloat(t.max_hum).toFixed(1)}%
        </div>
      </div>
      <div class="panel" style="text-align:center;padding:20px">
        <div style="font-size:2rem">🔵</div>
        <div style="font-family:'Orbitron',monospace;font-size:1.2rem;color:var(--purple);margin:8px 0">
          \${parseFloat(t.avg_pres).toFixed(0)} hPa
        </div>
        <div style="font-size:.6rem;color:var(--dim)">AVG PRESSURE</div>
        <div style="font-size:.65rem;margin-top:5px;color:var(--text)">
          \${parseFloat(t.min_pres).toFixed(0)} — \${parseFloat(t.max_pres).toFixed(0)} hPa
        </div>
      </div>
      <div class="panel" style="text-align:center;padding:20px">
        <div style="font-size:2rem">📊</div>
        <div style="font-family:'Orbitron',monospace;font-size:1.5rem;color:var(--teal);margin:8px 0">
          \${t.total_readings}
        </div>
        <div style="font-size:.6rem;color:var(--dim)">READINGS TODAY</div>
        <div style="font-size:.65rem;margin-top:5px;color:var(--text)">
          \${t.first_reading?.substring(11,16)} — \${t.last_reading?.substring(11,16)}
        </div>
      </div>
    </div>

    <div class="grid2">
      <div class="panel">
        <div class="ptitle">▸ TODAY IN WORDS</div>
        <div style="padding:15px;text-align:center">
          <div style="font-size:3rem">\${avgTemp > 30 ? '🔥' : avgTemp > 25 ? '☀️' : '⛅'}</div>
          <div style="font-family:'Orbitron',monospace;font-size:1rem;color:var(--white);margin:10px 0">
            \${weatherDesc}
          </div>
          <div style="font-size:.8rem;color:var(--text)">\${humDesc}</div>
          <div style="margin-top:10px;font-size:.7rem;color:var(--dim)">
            All time record: \${parseFloat(s?.all_max_temp||0).toFixed(1)}°C max /
            \${parseFloat(s?.all_min_temp||0).toFixed(1)}°C min
          </div>
        </div>
      </div>
      <div class="panel">
        <div class="ptitle">▸ HOURLY BREAKDOWN</div>
        <div style="max-height:200px;overflow-y:auto">
          <table class="tbl">
            <tr><th>HOUR</th><th>TEMP</th><th>HUMID</th><th>PRES</th><th>READINGS</th></tr>
            \${h.map(r => \`
              <tr>
                <td style="color:var(--teal)">\${r.hour}:00</td>
                <td style="color:var(--orange)">\${parseFloat(r.avg_temp).toFixed(1)}°C</td>
                <td style="color:var(--blue)">\${parseFloat(r.avg_hum).toFixed(1)}%</td>
                <td style="color:var(--purple)">\${parseFloat(r.avg_pres).toFixed(0)}</td>
                <td>\${r.readings}</td>
              </tr>
            \`).join('')}
          </table>
        </div>
      </div>
    </div>
  \`;
}
loadSummary();
</script>
</body></html>`;
}

// ============================================================
// PREDICTIONS PAGE
// ============================================================
function predictHTML() {
  return sharedHead('Predictions') + nav('predict') + `
<div class="page">
  <div class="page-title">WEATHER <span style="color:var(--teal)">PREDICTIONS</span></div>
  <div class="page-sub">AI PATTERN BASED WEATHER FORECASTING</div>
  <div class="hline"></div>
  <div id="predict-content" class="loading">ANALYZING DATA...</div>
</div>

<script>
async function loadPredictions() {
  const [r1,r2,r3] = await Promise.all([
    fetch('/api/data?type=latest'),
    fetch('/api/data?type=today'),
    fetch('/api/data?type=weekly')
  ]);
  const [d1,d2,d3] = await Promise.all([r1.json(),r2.json(),r3.json()]);

  const latest = d1.data;
  const today  = d2.data;
  const weekly = d3.data || [];

  if (!latest) {
    document.getElementById('predict-content').innerHTML =
      '<div class="loading">NOT ENOUGH DATA YET</div>';
    return;
  }

  const temp = parseFloat(latest.temp);
  const hum  = parseFloat(latest.humidity);
  const pres = parseFloat(latest.pressure);

  // Simple rule based predictions
  let rainChance = 0;
  let rainDesc   = '';
  let tempPred   = '';
  let comfortPred= '';

  // Pressure based rain prediction
  if (pres < 1005) { rainChance = 75; rainDesc = 'Low pressure — rain likely!'; }
  else if (pres < 1010) { rainChance = 45; rainDesc = 'Pressure dropping — possible rain'; }
  else if (pres < 1015) { rainChance = 20; rainDesc = 'Stable pressure — mostly dry'; }
  else { rainChance = 5; rainDesc = 'High pressure — clear weather'; }

  // Humidity boost
  if (hum > 80) rainChance = Math.min(95, rainChance + 20);
  if (hum > 90) rainChance = Math.min(99, rainChance + 15);

  // Temperature prediction
  const hour = new Date().getHours();
  if (hour < 12)      tempPred = 'Temperature will rise through the day';
  else if (hour < 16) tempPred = 'Peak temperature period — expect ' + (temp+1).toFixed(1) + '°C';
  else                tempPred = 'Temperature will drop — expect ' + (temp-2).toFixed(1) + '°C by night';

  // Weekly trend
  let trend = 'stable';
  if (weekly.length >= 3) {
    const last3 = weekly.slice(-3);
    const trendDiff = parseFloat(last3[2]?.avg_temp||0) - parseFloat(last3[0]?.avg_temp||0);
    if (trendDiff > 1.5) trend = 'warming';
    else if (trendDiff < -1.5) trend = 'cooling';
  }

  const rainColor = rainChance > 60 ? 'var(--blue)' : rainChance > 30 ? 'var(--gold)' : 'var(--green)';
  const rainIcon  = rainChance > 60 ? '🌧️' : rainChance > 30 ? '⛅' : '☀️';

  document.getElementById('predict-content').innerHTML = \`
    <div class="grid2" style="margin-bottom:15px">
      <div class="panel" style="text-align:center;padding:25px">
        <div style="font-size:3rem;margin-bottom:10px">\${rainIcon}</div>
        <div style="font-family:'Orbitron',monospace;font-size:.7rem;color:var(--dim);margin-bottom:8px">
          RAIN PROBABILITY
        </div>
        <div style="font-family:'Orbitron',monospace;font-size:3rem;font-weight:900;color:\${rainColor}">
          \${rainChance}%
        </div>
        <div style="margin-top:10px;font-size:.75rem;color:var(--text)">\${rainDesc}</div>
        <div style="margin-top:12px;height:6px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden">
          <div style="width:\${rainChance}%;height:100%;background:\${rainColor};border-radius:3px;transition:width 1s"></div>
        </div>
      </div>
      <div class="panel" style="padding:20px">
        <div class="ptitle">▸ FORECAST INDICATORS</div>
        <div class="srow">
          <span class="slbl">Pressure trend</span>
          <span class="sval" style="color:\${pres<1010?'var(--red)':'var(--green)'}">
            \${pres < 1005 ? '▼ FALLING FAST' : pres < 1010 ? '▼ FALLING' : pres < 1015 ? '▬ STABLE' : '▲ RISING'} (\${pres} hPa)
          </span>
        </div>
        <div class="srow">
          <span class="slbl">Humidity level</span>
          <span class="sval" style="color:\${hum>80?'var(--blue)':'var(--green)'}">
            \${hum > 80 ? '💧 HIGH ' : hum > 60 ? '😊 NORMAL ' : '🌵 LOW '}\${hum}%
          </span>
        </div>
        <div class="srow">
          <span class="slbl">Temperature</span>
          <span class="sval" style="color:var(--orange)">\${temp.toFixed(1)}°C now</span>
        </div>
        <div class="srow">
          <span class="slbl">Weekly trend</span>
          <span class="sval" style="color:\${trend==='warming'?'var(--red)':trend==='cooling'?'var(--blue)':'var(--green)'}">
            \${trend==='warming'?'▲ WARMING':trend==='cooling'?'▼ COOLING':'▬ STABLE'}
          </span>
        </div>
        <div class="srow">
          <span class="slbl">Temp prediction</span>
          <span class="sval" style="color:var(--text);font-size:.56rem">\${tempPred}</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="ptitle">▸ NOTE</div>
      <div style="font-size:.72rem;color:var(--dim);padding:8px;line-height:1.6">
        Predictions are based on pressure, humidity and temperature patterns from your sensor data.
        Accuracy improves as more data is collected over days and weeks!
        More data = smarter predictions! 📊
      </div>
    </div>
  \`;
}
loadPredictions();
</script>
</body></html>`;
}

// ============================================================
// SETTINGS PAGE — change interval, restart ESP32 remotely!
// ============================================================
function settingsHTML() {
  return sharedHead('Settings') + nav('settings') + `
<div class="page">
  <div class="page-title">REMOTE <span style="color:var(--teal)">SETTINGS</span></div>
  <div class="page-sub">CHANGE ESP32 SETTINGS FROM ANYWHERE · REMOTE RESTART</div>
  <div class="hline"></div>

  <div class="grid2">
    <!-- SETTINGS FORM -->
    <div class="panel">
      <div class="ptitle">▸ ESP32 CONFIGURATION</div>
      <div id="settings-form" class="loading">LOADING...</div>
    </div>

    <!-- STATUS -->
    <div class="panel">
      <div class="ptitle">▸ DEVICE STATUS</div>
      <div id="device-status" class="loading">LOADING...</div>

      <div style="margin-top:15px">
        <div class="ptitle">▸ REMOTE COMMANDS</div>

        <div style="margin-bottom:10px;padding:10px;background:rgba(255,51,85,.06);
             border:1px solid rgba(255,51,85,.2);border-radius:3px">
          <div style="font-size:.65rem;color:var(--text);margin-bottom:8px">
            ⚠️ Restart ESP32 remotely — device will restart on next data send!
          </div>
          <button class="btn btn-red" onclick="sendRestart()">🔄 RESTART ESP32</button>
        </div>

        <div style="padding:10px;background:rgba(0,229,204,.06);
             border:1px solid rgba(0,229,204,.2);border-radius:3px">
          <div style="font-size:.65rem;color:var(--text);margin-bottom:8px">
            How remote restart works:
          </div>
          <div style="font-size:.62rem;color:var(--dim);line-height:1.8">
            1. Click restart button here<br>
            2. Server flags restart=true<br>
            3. Next time ESP32 sends data<br>
            4. Server replies restart:true<br>
            5. ESP32 receives → restarts!<br>
            6. New settings applied! ✅
          </div>
        </div>
      </div>
    </div>
  </div>

  <div id="save-status" style="display:none;margin-top:10px;padding:10px;
       border-radius:3px;font-family:'Orbitron',monospace;font-size:.6rem;text-align:center"></div>
</div>

<script>
let currentConfig = {};

async function loadSettings() {
  const r = await fetch('/api/config');
  const d = await r.json();
  currentConfig = d.config || {};

  document.getElementById('settings-form').innerHTML = \`
    <div class="inp-group">
      <label class="inp-lbl">DEVICE NAME</label>
      <input class="inp" id="cfg-name" value="\${currentConfig.device_name||''}" placeholder="ESP32-Weather">
    </div>
    <div class="inp-group">
      <label class="inp-lbl">LOCATION</label>
      <input class="inp" id="cfg-loc" value="\${currentConfig.location||''}" placeholder="Home">
    </div>
    <div class="inp-group">
      <label class="inp-lbl">SEND INTERVAL (SECONDS)</label>
      <input class="inp" id="cfg-interval" type="number" min="10" max="3600"
             value="\${currentConfig.send_interval||60}" placeholder="60">
      <div style="font-size:.58rem;color:var(--dim);margin-top:4px">
        Min: 10s · Recommended: 60s · Max: 3600s
      </div>
    </div>
    <div class="inp-group">
      <label class="inp-lbl">FIRMWARE VERSION</label>
      <input class="inp" id="cfg-fw" value="\${currentConfig.firmware_ver||'1.0.0'}" placeholder="1.0.0">
    </div>
    <button class="btn btn-teal" onclick="saveSettings()" style="width:100%;margin-top:5px">
      💾 SAVE SETTINGS
    </button>
    <div style="font-size:.6rem;color:var(--dim);margin-top:8px;line-height:1.6">
      Settings take effect on ESP32's next data send!
      Change interval → ESP32 auto-adjusts timing!
    </div>
  \`;

  const r2  = await fetch('/api/data?type=latest');
  const d2  = await r2.json();
  const row = d2.data;
  const ago = row ? Math.round((Date.now() - new Date(row.recorded_at+'Z').getTime())/1000) : 999;

  document.getElementById('device-status').innerHTML = \`
    <div class="srow">
      <span class="slbl">Status</span>
      <span class="sval" style="color:\${ago<120?'var(--green)':'var(--red)'}">
        \${ago<120?'● ONLINE':'● OFFLINE'}
      </span>
    </div>
    <div class="srow">
      <span class="slbl">Last seen</span>
      <span class="sval" style="color:var(--text)">\${ago<3600?ago+'s ago':'Long ago'}</span>
    </div>
    <div class="srow">
      <span class="slbl">Last temp</span>
      <span class="sval" style="color:var(--orange)">
        \${row ? parseFloat(row.temp).toFixed(1)+'°C' : '--'}
      </span>
    </div>
    <div class="srow">
      <span class="slbl">Send interval</span>
      <span class="sval" style="color:var(--gold)">\${currentConfig.send_interval||60}s</span>
    </div>
    <div class="srow">
      <span class="slbl">Restart pending</span>
      <span class="sval" style="color:\${currentConfig.ota_available==='1'?'var(--red)':'var(--green)'}">
        \${currentConfig.ota_available==='1'?'YES — waiting for ESP32':'No'}
      </span>
    </div>
  \`;
}

async function saveSettings() {
  const body = {
    device_name:   document.getElementById('cfg-name').value,
    location:      document.getElementById('cfg-loc').value,
    send_interval: document.getElementById('cfg-interval').value,
    firmware_ver:  document.getElementById('cfg-fw').value
  };

  const r = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const d = await r.json();

  const el = document.getElementById('save-status');
  el.style.display = 'block';
  if (d.status === 'ok') {
    el.style.background = 'rgba(0,221,119,.1)';
    el.style.color = 'var(--green)';
    el.style.border = '1px solid rgba(0,221,119,.3)';
    el.textContent = '✅ SETTINGS SAVED! ESP32 will update on next send!';
  } else {
    el.style.background = 'rgba(255,51,85,.1)';
    el.style.color = 'var(--red)';
    el.textContent = '❌ SAVE FAILED!';
  }
  setTimeout(() => loadSettings(), 2000);
}

async function sendRestart() {
  if (!confirm('Restart ESP32 remotely? It will restart on next data send!')) return;

  const r = await fetch('/api/config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restart: true })
  });
  const d = await r.json();

  const el = document.getElementById('save-status');
  el.style.display = 'block';
  el.style.background = 'rgba(255,136,0,.1)';
  el.style.color = 'var(--gold)';
  el.style.border = '1px solid rgba(255,136,0,.3)';
  el.textContent = '⚠️ RESTART QUEUED! ESP32 will restart on next data send!';
  setTimeout(() => loadSettings(), 2000);
}

loadSettings();
</script>
</body></html>`;
}
