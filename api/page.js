// api/page.js — all dashboard pages
module.exports = function handler(req, res) {
  const path = (req.url || '/').split('?')[0];

  if (path === '/' || path === '/dashboard') return res.status(200).setHeader('Content-Type','text/html').send(dashboardHTML());
  if (path === '/patterns') return res.status(200).setHeader('Content-Type','text/html').send(patternsHTML());
  if (path === '/summary')  return res.status(200).setHeader('Content-Type','text/html').send(summaryHTML());
  if (path === '/predict')  return res.status(200).setHeader('Content-Type','text/html').send(predictHTML());
  if (path === '/settings') return res.status(200).setHeader('Content-Type','text/html').send(settingsHTML());
  return res.status(200).setHeader('Content-Type','text/html').send(dashboardHTML());
};

function head(title) {
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — Weather Logger</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600&display=swap');
:root{--bg:#060a0e;--panel:#0c1520;--border:#152535;--teal:#00e5cc;--blue:#0088ff;
  --orange:#ff8800;--green:#00dd77;--red:#ff3355;--gold:#f0a500;--purple:#aa44ff;
  --dim:#2a5070;--text:#90b8d0;--white:#d8eeff}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--bg);color:var(--text);font-family:'Exo 2',sans-serif;min-height:100vh}
body::before{content:'';position:fixed;inset:0;
  background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,229,204,.006) 2px,rgba(0,229,204,.006) 4px);
  pointer-events:none;z-index:999}
nav{background:rgba(6,10,14,.95);border-bottom:1px solid var(--border);padding:10px 20px;
  display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:100;backdrop-filter:blur(10px);flex-wrap:wrap}
.brand{font-family:'Orbitron',monospace;font-size:.85rem;font-weight:900;color:var(--white);
  letter-spacing:3px;margin-right:8px}.brand span{color:var(--teal)}
.nl{font-family:'Orbitron',monospace;font-size:.5rem;letter-spacing:2px;color:var(--dim);
  text-decoration:none;padding:5px 10px;border-radius:2px;border:1px solid transparent;transition:all .2s}
.nl:hover{color:var(--teal);border-color:var(--border)}
.nl.on{color:var(--teal);border-color:var(--teal);background:rgba(0,229,204,.06)}
.ns{margin-left:auto;display:flex;align-items:center;gap:8px;font-size:.6rem}
.sd{width:7px;height:7px;border-radius:50%;background:var(--dim)}
.sd.live{background:var(--green);box-shadow:0 0 6px var(--green);animation:pp 2s infinite}
@keyframes pp{0%,100%{opacity:1}50%{opacity:.4}}
.page{max-width:1400px;margin:0 auto;padding:15px}
.pt{font-family:'Orbitron',monospace;font-size:1.2rem;font-weight:900;color:var(--white);letter-spacing:4px;margin-bottom:4px}
.ps{font-size:.65rem;color:var(--dim);letter-spacing:2px;margin-bottom:15px}
.hl{height:1px;background:linear-gradient(90deg,transparent,var(--teal),transparent);margin-bottom:15px;opacity:.35}
.panel{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:14px;position:relative;overflow:hidden}
.panel::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,var(--teal),transparent);opacity:.4}
.ptl{font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:3px;color:var(--teal);margin-bottom:12px;opacity:.8}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:4px;padding:14px;text-align:center;position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px}
.card.temp::before{background:linear-gradient(90deg,transparent,var(--orange),transparent)}
.card.hum::before{background:linear-gradient(90deg,transparent,var(--blue),transparent)}
.card.pres::before{background:linear-gradient(90deg,transparent,var(--purple),transparent)}
.card.alt::before{background:linear-gradient(90deg,transparent,var(--green),transparent)}
.cv{font-family:'Orbitron',monospace;font-size:1.8rem;font-weight:900;line-height:1;margin:8px 0;transition:all .3s}
.cu{font-size:.6rem;color:var(--dim);letter-spacing:2px;margin-bottom:5px}
.cl{font-family:'Orbitron',monospace;font-size:.52rem;letter-spacing:2px;color:var(--dim)}
.ci{font-size:1.5rem;margin-bottom:3px}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:15px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:15px}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:15px}
.ch{position:relative;height:200px}
.tbl{width:100%;border-collapse:collapse;font-size:.7rem}
.tbl th{font-family:'Orbitron',monospace;font-size:.48rem;letter-spacing:2px;color:var(--teal);
  padding:7px 10px;border-bottom:1px solid var(--border);text-align:left}
.tbl td{padding:6px 10px;border-bottom:1px solid rgba(255,255,255,.03);color:var(--text)}
.tbl tr:hover td{background:rgba(0,229,204,.03)}
.sr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:.68rem}
.sr:last-child{border-bottom:none}
.sl{color:var(--dim)}.sv{font-family:'Orbitron',monospace;font-size:.65rem;font-weight:700}
.btn{font-family:'Orbitron',monospace;font-size:.55rem;letter-spacing:2px;padding:8px 16px;
  border-radius:3px;border:1px solid;cursor:pointer;transition:all .2s}
.bt{background:rgba(0,229,204,.1);border-color:var(--teal);color:var(--teal)}
.bt:hover{background:rgba(0,229,204,.2)}
.br{background:rgba(255,51,85,.1);border-color:var(--red);color:var(--red)}
.br:hover{background:rgba(255,51,85,.2)}
.inp{background:rgba(0,0,0,.3);border:1px solid var(--border);color:var(--white);
  padding:7px 12px;border-radius:3px;font-family:'Exo 2',sans-serif;font-size:.8rem;width:100%}
.inp:focus{outline:none;border-color:var(--teal)}
.ig{margin-bottom:10px}
.il{font-family:'Orbitron',monospace;font-size:.5rem;letter-spacing:2px;color:var(--dim);margin-bottom:4px;display:block}
.ld{text-align:center;padding:30px;color:var(--dim);font-family:'Orbitron',monospace;font-size:.6rem;letter-spacing:3px}
.rb{position:fixed;bottom:0;left:0;right:0;height:2px;background:var(--border);z-index:998}
.rf{height:100%;background:linear-gradient(90deg,var(--teal),var(--blue));transition:width 1s linear}
@media(max-width:768px){.cards,.g4{grid-template-columns:repeat(2,1fr)}.g2,.g3{grid-template-columns:1fr}}
</style></head><body>`;
}

function nav(active) {
  return `<nav>
  <span class="brand">WEATHER <span>LOGGER</span></span>
  <a href="/"         class="nl ${active==='dashboard'?'on':''}">DASHBOARD</a>
  <a href="/patterns" class="nl ${active==='patterns' ?'on':''}">PATTERNS</a>
  <a href="/summary"  class="nl ${active==='summary'  ?'on':''}">SUMMARY</a>
  <a href="/predict"  class="nl ${active==='predict'  ?'on':''}">PREDICT</a>
  <a href="/settings" class="nl ${active==='settings' ?'on':''}">SETTINGS</a>
  <div class="ns">
    <div class="sd" id="sdot"></div>
    <span id="stxt" style="color:var(--dim)">LOADING</span>
    <span id="upd"  style="color:var(--dim);font-size:.55rem"></span>
  </div>
</nav>`;
}

// ── DASHBOARD ──────────────────────────────────────────────
function dashboardHTML() {
  return head('Dashboard') + nav('dashboard') + `
<div class="page">
  <div class="pt">LIVE <span style="color:var(--teal)">DASHBOARD</span></div>
  <div class="ps">REAL TIME WEATHER DATA · AUTO REFRESH</div>
  <div class="hl"></div>

  <div class="cards">
    <div class="card temp">
      <div class="ci">🌡️</div>
      <div class="cv" id="vt" style="color:var(--orange)">--.-</div>
      <div class="cu">CELSIUS</div><div class="cl">TEMPERATURE</div>
      <div id="ct" style="font-size:.6rem;margin-top:4px"></div>
    </div>
    <div class="card hum">
      <div class="ci">💧</div>
      <div class="cv" id="vh" style="color:var(--blue)">--.-</div>
      <div class="cu">PERCENT %</div><div class="cl">HUMIDITY</div>
      <div id="ch2" style="font-size:.6rem;margin-top:4px"></div>
    </div>
    <div class="card pres">
      <div class="ci">🔵</div>
      <div class="cv" id="vp" style="color:var(--purple);font-size:1.3rem">----.-</div>
      <div class="cu">hPa</div><div class="cl">PRESSURE</div>
      <div id="cp" style="font-size:.6rem;margin-top:4px"></div>
    </div>
    <div class="card alt">
      <div class="ci">⛰️</div>
      <div class="cv" id="va" style="color:var(--green)">---.-</div>
      <div class="cu">METERS</div><div class="cl">ALTITUDE</div>
    </div>
  </div>

  <div style="display:flex;gap:10px;margin-bottom:15px;flex-wrap:wrap">
    <div class="panel" style="flex:1;min-width:180px;padding:10px">
      <div class="ptl">▸ DEVICE</div>
      <div class="sr"><span class="sl">Name</span><span class="sv" id="dn" style="color:var(--teal)">--</span></div>
      <div class="sr"><span class="sl">Location</span><span class="sv" id="dl" style="color:var(--text)">--</span></div>
      <div class="sr"><span class="sl">Interval</span><span class="sv" id="di" style="color:var(--gold)">--s</span></div>
      <div class="sr"><span class="sl">Last seen</span><span class="sv" id="ds" style="color:var(--green)">--</span></div>
      <div class="sr"><span class="sl">Total</span><span class="sv" id="dt" style="color:var(--teal)">--</span></div>
    </div>
    <div class="panel" style="flex:1;min-width:180px;padding:10px">
      <div class="ptl">▸ TODAY RANGE</div>
      <div class="sr"><span class="sl">Temp</span><span class="sv" id="tt" style="color:var(--orange)">--</span></div>
      <div class="sr"><span class="sl">Humidity</span><span class="sv" id="th" style="color:var(--blue)">--</span></div>
      <div class="sr"><span class="sl">Pressure</span><span class="sv" id="tp" style="color:var(--purple);font-size:.55rem">--</span></div>
      <div class="sr"><span class="sl">Readings</span><span class="sv" id="tc" style="color:var(--teal)">--</span></div>
    </div>
    <div class="panel" style="flex:1;min-width:180px;padding:10px">
      <div class="ptl">▸ COMFORT</div>
      <div style="text-align:center;padding:8px 0">
        <div style="font-size:2rem" id="cfi">--</div>
        <div style="font-family:'Orbitron',monospace;font-size:.85rem;margin-top:4px" id="cfl">--</div>
        <div style="font-size:.62rem;color:var(--dim);margin-top:2px" id="cfd">--</div>
      </div>
    </div>
  </div>

  <div class="g2">
    <div class="panel"><div class="ptl">▸ TEMPERATURE — LAST 50</div><div class="ch"><canvas id="cht"></canvas></div></div>
    <div class="panel"><div class="ptl">▸ HUMIDITY — LAST 50</div><div class="ch"><canvas id="chh"></canvas></div></div>
  </div>
  <div class="g2">
    <div class="panel"><div class="ptl">▸ PRESSURE — LAST 50</div><div class="ch"><canvas id="chp"></canvas></div></div>
    <div class="panel"><div class="ptl">▸ ALTITUDE — LAST 50</div><div class="ch"><canvas id="cha"></canvas></div></div>
  </div>
</div>
<div class="rb"><div class="rf" id="rfb" style="width:100%"></div></div>

<script>
let charts={}, prev=null, interval=30, cd=30;

const co={responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false}},
  scales:{
    x:{ticks:{color:'#2a5070',font:{size:9},maxTicksLimit:8},grid:{color:'rgba(255,255,255,.04)'}},
    y:{ticks:{color:'#90b8d0',font:{size:10}},grid:{color:'rgba(255,255,255,.06)'}}
  }};

function mkChart(id,color,label){
  const ctx=document.getElementById(id)?.getContext('2d');
  if(!ctx)return null;
  return new Chart(ctx,{type:'line',data:{labels:[],datasets:[{
    label,data:[],borderColor:color,backgroundColor:color+'18',
    borderWidth:2,pointRadius:2,pointBackgroundColor:color,fill:true,tension:.4
  }]},options:co});
}

function updChart(c,data,field){
  if(!c)return;
  c.data.labels=data.map(d=>new Date(d.recorded_at+'Z').toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}));
  c.data.datasets[0].data=data.map(d=>parseFloat(d[field]).toFixed(2));
  c.update('none');
}

function comfort(t,h){
  const hi=t+0.33*(h/100*6.105*Math.exp(17.27*t/(237.7+t)))-4;
  if(hi<21)return{i:'🥶',l:'COLD',d:'Below comfort',c:'#0088ff'};
  if(hi<24)return{i:'😊',l:'COMFORTABLE',d:'Ideal!',c:'#00dd77'};
  if(hi<27)return{i:'😐',l:'WARM',d:'Slightly warm',c:'#f0a500'};
  if(hi<30)return{i:'🥵',l:'HOT',d:'Uncomfortable',c:'#ff8800'};
  return{i:'🔥',l:'VERY HOT',d:'Dangerous!',c:'#ff3355'};
}

function chg(v,p,u){
  if(!p)return'';
  const d=(v-p).toFixed(1);
  if(Math.abs(d)<0.1)return'<span style="color:var(--dim)">▬ stable</span>';
  if(d>0)return'<span style="color:var(--red)">▲ +'+d+u+'</span>';
  return'<span style="color:var(--blue)">▼ '+d+u+'</span>';
}

function g(id){return document.getElementById(id)}

async function load(){
  try{
    const [r1,r2,r3,r4,r5]=await Promise.all([
      fetch('/api/data?type=latest'),
      fetch('/api/data?type=recent&limit=50'),
      fetch('/api/data?type=today'),
      fetch('/api/data?type=stats'),
      fetch('/api/config')
    ]);
    const [d1,d2,d3,d4,d5]=await Promise.all([r1.json(),r2.json(),r3.json(),r4.json(),r5.json()]);

    if(d1.data){
      const t=parseFloat(d1.data.temp).toFixed(1);
      const h=parseFloat(d1.data.humidity).toFixed(1);
      const p=parseFloat(d1.data.pressure).toFixed(1);
      const a=parseFloat(d1.data.altitude).toFixed(1);
      g('vt').textContent=t; g('vh').textContent=h;
      g('vp').textContent=p; g('va').textContent=a;
      if(prev){
        g('ct').innerHTML=chg(t,prev.t,'°');
        g('ch2').innerHTML=chg(h,prev.h,'%');
        g('cp').innerHTML=chg(p,prev.p,' hPa');
      }
      prev={t,h,p,a};
      const cf=comfort(parseFloat(t),parseFloat(h));
      g('cfi').textContent=cf.i; g('cfl').textContent=cf.l;
      g('cfl').style.color=cf.c; g('cfd').textContent=cf.d;
      const ago=Math.round((Date.now()-new Date(d1.data.recorded_at+'Z').getTime())/1000);
      g('ds').textContent=ago<3600?ago+'s ago':'Long ago';
      const online=ago<180;
      g('sdot').className='sd'+(online?' live':'');
      g('stxt').textContent=online?'ONLINE':'OFFLINE';
      g('stxt').style.color=online?'var(--green)':'var(--red)';
    }
    if(d2.data){
      updChart(charts.t,d2.data,'temp');
      updChart(charts.h,d2.data,'humidity');
      updChart(charts.p,d2.data,'pressure');
      updChart(charts.a,d2.data,'altitude');
    }
    if(d3.data){
      const t=d3.data;
      g('tt').textContent=parseFloat(t.min_temp).toFixed(1)+' / '+parseFloat(t.max_temp).toFixed(1)+'°C';
      g('th').textContent=parseFloat(t.min_hum).toFixed(1)+' / '+parseFloat(t.max_hum).toFixed(1)+'%';
      g('tp').textContent=parseFloat(t.min_pres).toFixed(0)+' / '+parseFloat(t.max_pres).toFixed(0)+' hPa';
      g('tc').textContent=(t.total_readings||0)+' readings';
    }
    if(d4.data) g('dt').textContent=(d4.data.total||0)+' total';
    if(d5.config){
      g('dn').textContent=d5.config.device_name||'--';
      g('dl').textContent=d5.config.location||'--';
      g('di').textContent=(d5.config.send_interval||60)+'s';
      interval=parseInt(d5.config.send_interval||30);
    }
    g('upd').textContent=new Date().toLocaleTimeString();
  }catch(e){console.error(e);}
}

function tick(){
  cd=interval;
  const bar=g('rfb');
  const t=setInterval(()=>{
    cd--;
    if(bar)bar.style.width=(cd/interval*100)+'%';
    if(cd<=0){clearInterval(t);load().then(()=>tick());}
  },1000);
}

charts.t=mkChart('cht','#ff8800','Temp');
charts.h=mkChart('chh','#0088ff','Humidity');
charts.p=mkChart('chp','#aa44ff','Pressure');
charts.a=mkChart('cha','#00dd77','Altitude');
load().then(()=>tick());
setInterval(()=>{if(g('upd'))g('upd').textContent=new Date().toLocaleTimeString();},1000);
</script></body></html>`;
}

// ── PATTERNS ───────────────────────────────────────────────
function patternsHTML() {
  return head('Patterns') + nav('patterns') + `
<div class="page">
  <div class="pt">PATTERN <span style="color:var(--teal)">ANALYSIS</span></div>
  <div class="ps">HOURLY & WEEKLY WEATHER TRENDS</div>
  <div class="hl"></div>
  <div class="g2">
    <div class="panel"><div class="ptl">▸ AVG TEMPERATURE BY HOUR</div><div class="ch"><canvas id="ht"></canvas></div></div>
    <div class="panel"><div class="ptl">▸ AVG HUMIDITY BY HOUR</div><div class="ch"><canvas id="hh"></canvas></div></div>
  </div>
  <div class="g2">
    <div class="panel"><div class="ptl">▸ 7 DAY TEMPERATURE RANGE</div><div class="ch"><canvas id="wt"></canvas></div></div>
    <div class="panel"><div class="ptl">▸ 7 DAY HUMIDITY</div><div class="ch"><canvas id="wh"></canvas></div></div>
  </div>
  <div class="panel"><div class="ptl">▸ INSIGHTS</div><div id="ins" class="ld">ANALYZING...</div></div>
</div>
<script>
const co2={responsive:true,maintainAspectRatio:false,
  plugins:{legend:{labels:{color:'#90b8d0',font:{size:10}}}},
  scales:{x:{ticks:{color:'#2a5070',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'}},
          y:{ticks:{color:'#90b8d0',font:{size:10}},grid:{color:'rgba(255,255,255,.06)'}}}};

async function load(){
  const [r1,r2]=await Promise.all([
    fetch('/api/data?type=pattern_hour'),
    fetch('/api/data?type=weekly')
  ]);
  const [d1,d2]=await Promise.all([r1.json(),r2.json()]);

  if(d1.data&&d1.data.length>0){
    const hrs=d1.data.map(d=>d.hour+':00');
    const ts=d1.data.map(d=>parseFloat(d.avg_temp).toFixed(1));
    const hs=d1.data.map(d=>parseFloat(d.avg_hum).toFixed(1));
    new Chart(document.getElementById('ht').getContext('2d'),{type:'bar',
      data:{labels:hrs,datasets:[{label:'Avg Temp °C',data:ts,
        backgroundColor:ts.map(t=>t>30?'#ff330055':'#ff880055'),
        borderColor:ts.map(t=>t>30?'#ff3355':'#ff8800'),borderWidth:2}]},options:co2});
    new Chart(document.getElementById('hh').getContext('2d'),{type:'bar',
      data:{labels:hrs,datasets:[{label:'Avg Humidity %',data:hs,
        backgroundColor:'#0088ff22',borderColor:'#0088ff',borderWidth:2}]},options:co2});
    const mx=d1.data.reduce((a,b)=>a.avg_temp>b.avg_temp?a:b);
    const mn=d1.data.reduce((a,b)=>a.avg_temp<b.avg_temp?a:b);
    const mh=d1.data.reduce((a,b)=>a.avg_hum>b.avg_hum?a:b);
    document.getElementById('ins').innerHTML=
      '<div class="g3">'+
      '<div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">'+
        '<div style="font-size:1.5rem">🌡️</div>'+
        '<div style="font-family:Orbitron,monospace;color:var(--orange);font-size:.8rem;margin:5px 0">HOTTEST: '+mx.hour+':00</div>'+
        '<div style="font-size:.7rem">Avg '+parseFloat(mx.avg_temp).toFixed(1)+'°C</div></div>'+
      '<div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">'+
        '<div style="font-size:1.5rem">🌙</div>'+
        '<div style="font-family:Orbitron,monospace;color:var(--blue);font-size:.8rem;margin:5px 0">COOLEST: '+mn.hour+':00</div>'+
        '<div style="font-size:.7rem">Avg '+parseFloat(mn.avg_temp).toFixed(1)+'°C</div></div>'+
      '<div style="padding:10px;background:rgba(0,0,0,.2);border-radius:3px;text-align:center">'+
        '<div style="font-size:1.5rem">💧</div>'+
        '<div style="font-family:Orbitron,monospace;color:var(--teal);font-size:.8rem;margin:5px 0">MOST HUMID: '+mh.hour+':00</div>'+
        '<div style="font-size:.7rem">Avg '+parseFloat(mh.avg_hum).toFixed(1)+'%</div></div>'+
      '</div>';
  } else {
    document.getElementById('ins').textContent='NOT ENOUGH DATA YET — COME BACK LATER!';
  }

  if(d2.data&&d2.data.length>0){
    const dates=d2.data.map(d=>d.date);
    const avg=d2.data.map(d=>parseFloat(d.avg_temp).toFixed(1));
    const mn=d2.data.map(d=>parseFloat(d.min_temp).toFixed(1));
    const mx=d2.data.map(d=>parseFloat(d.max_temp).toFixed(1));
    const ah=d2.data.map(d=>parseFloat(d.avg_hum).toFixed(1));
    new Chart(document.getElementById('wt').getContext('2d'),{type:'line',
      data:{labels:dates,datasets:[
        {label:'Max',data:mx,borderColor:'#ff3355',borderWidth:2,pointRadius:3,fill:false,tension:.4},
        {label:'Avg',data:avg,borderColor:'#ff8800',borderWidth:2,pointRadius:3,backgroundColor:'#ff880015',fill:true,tension:.4},
        {label:'Min',data:mn,borderColor:'#0088ff',borderWidth:2,pointRadius:3,fill:false,tension:.4}
      ]},options:co2});
    new Chart(document.getElementById('wh').getContext('2d'),{type:'line',
      data:{labels:dates,datasets:[{label:'Avg Humidity',data:ah,
        borderColor:'#0088ff',backgroundColor:'#0088ff15',borderWidth:2,fill:true,tension:.4}]},options:co2});
  }
}
load();
</script></body></html>`;
}

// ── SUMMARY ────────────────────────────────────────────────
function summaryHTML() {
  return head('Summary') + nav('summary') + `
<div class="page">
  <div class="pt">DAILY <span style="color:var(--teal)">SUMMARY</span></div>
  <div class="ps">TODAY'S WEATHER OVERVIEW</div>
  <div class="hl"></div>
  <div id="sc" class="ld">LOADING...</div>
</div>
<script>
async function load(){
  const [r1,r2,r3]=await Promise.all([
    fetch('/api/data?type=today'),
    fetch('/api/data?type=hourly'),
    fetch('/api/data?type=stats')
  ]);
  const [d1,d2,d3]=await Promise.all([r1.json(),r2.json(),r3.json()]);
  const t=d1.data, h=d2.data||[], s=d3.data;
  if(!t||!t.total_readings){
    document.getElementById('sc').textContent='NO DATA FOR TODAY YET';return;
  }
  const at=parseFloat(t.avg_temp), ah=parseFloat(t.avg_hum);
  const wd=at>32?'🔥 Very hot':at>28?'☀️ Hot':at>24?'⛅ Warm':at>20?'🌤️ Pleasant':'🌡️ Cool';
  const hd=ah>80?'💦 Very humid':ah>65?'💧 Humid':ah>50?'😊 Comfortable':'🌵 Dry';
  document.getElementById('sc').innerHTML=
    '<div class="g4" style="margin-bottom:15px">'+
    '<div class="panel" style="text-align:center;padding:20px"><div style="font-size:2rem">🌡️</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:1.5rem;color:var(--orange);margin:8px 0">'+at.toFixed(1)+'°C</div>'+
    '<div style="font-size:.6rem;color:var(--dim)">AVG TEMPERATURE</div>'+
    '<div style="font-size:.65rem;margin-top:5px">'+parseFloat(t.min_temp).toFixed(1)+'° — '+parseFloat(t.max_temp).toFixed(1)+'°</div></div>'+
    '<div class="panel" style="text-align:center;padding:20px"><div style="font-size:2rem">💧</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:1.5rem;color:var(--blue);margin:8px 0">'+ah.toFixed(1)+'%</div>'+
    '<div style="font-size:.6rem;color:var(--dim)">AVG HUMIDITY</div>'+
    '<div style="font-size:.65rem;margin-top:5px">'+parseFloat(t.min_hum).toFixed(1)+'% — '+parseFloat(t.max_hum).toFixed(1)+'%</div></div>'+
    '<div class="panel" style="text-align:center;padding:20px"><div style="font-size:2rem">🔵</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:1.2rem;color:var(--purple);margin:8px 0">'+parseFloat(t.avg_pres).toFixed(0)+' hPa</div>'+
    '<div style="font-size:.6rem;color:var(--dim)">AVG PRESSURE</div>'+
    '<div style="font-size:.65rem;margin-top:5px">'+parseFloat(t.min_pres).toFixed(0)+' — '+parseFloat(t.max_pres).toFixed(0)+' hPa</div></div>'+
    '<div class="panel" style="text-align:center;padding:20px"><div style="font-size:2rem">📊</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:1.5rem;color:var(--teal);margin:8px 0">'+t.total_readings+'</div>'+
    '<div style="font-size:.6rem;color:var(--dim)">READINGS TODAY</div>'+
    '<div style="font-size:.65rem;margin-top:5px">'+(t.first_reading||'').substring(11,16)+' — '+(t.last_reading||'').substring(11,16)+'</div></div>'+
    '</div>'+
    '<div class="g2">'+
    '<div class="panel"><div class="ptl">▸ TODAY IN WORDS</div>'+
    '<div style="padding:15px;text-align:center">'+
    '<div style="font-size:3rem">'+(at>30?'🔥':at>25?'☀️':'⛅')+'</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:1rem;color:var(--white);margin:10px 0">'+wd+'</div>'+
    '<div style="font-size:.8rem">'+hd+'</div>'+
    '<div style="margin-top:10px;font-size:.7rem;color:var(--dim)">All time: '+parseFloat(s?.all_max_temp||0).toFixed(1)+'°C max / '+parseFloat(s?.all_min_temp||0).toFixed(1)+'°C min</div>'+
    '</div></div>'+
    '<div class="panel"><div class="ptl">▸ HOURLY BREAKDOWN</div>'+
    '<div style="max-height:220px;overflow-y:auto">'+
    '<table class="tbl"><tr><th>HOUR</th><th>TEMP</th><th>HUMID</th><th>PRES</th><th>#</th></tr>'+
    h.map(r=>'<tr><td style="color:var(--teal)">'+r.hour+':00</td>'+
      '<td style="color:var(--orange)">'+parseFloat(r.avg_temp).toFixed(1)+'°C</td>'+
      '<td style="color:var(--blue)">'+parseFloat(r.avg_hum).toFixed(1)+'%</td>'+
      '<td style="color:var(--purple)">'+parseFloat(r.avg_pres).toFixed(0)+'</td>'+
      '<td>'+r.readings+'</td></tr>').join('')+
    '</table></div></div></div>';
}
load();
</script></body></html>`;
}

// ── PREDICT ────────────────────────────────────────────────
function predictHTML() {
  return head('Predict') + nav('predict') + `
<div class="page">
  <div class="pt">WEATHER <span style="color:var(--teal)">PREDICTIONS</span></div>
  <div class="ps">PATTERN BASED FORECASTING</div>
  <div class="hl"></div>
  <div id="pc" class="ld">ANALYZING...</div>
</div>
<script>
async function load(){
  const [r1,r2,r3]=await Promise.all([
    fetch('/api/data?type=latest'),
    fetch('/api/data?type=today'),
    fetch('/api/data?type=weekly')
  ]);
  const [d1,d2,d3]=await Promise.all([r1.json(),r2.json(),r3.json()]);
  const latest=d1.data, weekly=d3.data||[];
  if(!latest){document.getElementById('pc').textContent='NO DATA YET';return;}
  const t=parseFloat(latest.temp), h=parseFloat(latest.humidity), p=parseFloat(latest.pressure);
  let rain=0, rd='';
  if(p<1005){rain=75;rd='Low pressure — rain likely!';}
  else if(p<1010){rain=45;rd='Pressure dropping — possible rain';}
  else if(p<1015){rain=20;rd='Stable — mostly dry';}
  else{rain=5;rd='High pressure — clear weather';}
  if(h>80)rain=Math.min(95,rain+20);
  if(h>90)rain=Math.min(99,rain+15);
  const rc=rain>60?'var(--blue)':rain>30?'var(--gold)':'var(--green)';
  const ri=rain>60?'🌧️':rain>30?'⛅':'☀️';
  const hr=new Date().getHours();
  const tp=hr<12?'Temperature will rise through the day':hr<16?'Peak period — ~'+(t+1).toFixed(1)+'°C':'Dropping — ~'+(t-2).toFixed(1)+'°C by night';
  let trend='stable';
  if(weekly.length>=3){
    const d=parseFloat(weekly[weekly.length-1]?.avg_temp||0)-parseFloat(weekly[0]?.avg_temp||0);
    if(d>1.5)trend='warming';else if(d<-1.5)trend='cooling';
  }
  document.getElementById('pc').innerHTML=
    '<div class="g2" style="margin-bottom:15px">'+
    '<div class="panel" style="text-align:center;padding:25px">'+
    '<div style="font-size:3rem;margin-bottom:10px">'+ri+'</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:.7rem;color:var(--dim);margin-bottom:8px">RAIN PROBABILITY</div>'+
    '<div style="font-family:Orbitron,monospace;font-size:3rem;font-weight:900;color:'+rc+'">'+rain+'%</div>'+
    '<div style="margin-top:10px;font-size:.75rem">'+rd+'</div>'+
    '<div style="margin-top:12px;height:6px;background:rgba(255,255,255,.05);border-radius:3px;overflow:hidden">'+
    '<div style="width:'+rain+'%;height:100%;background:'+rc+';border-radius:3px"></div></div></div>'+
    '<div class="panel" style="padding:20px"><div class="ptl">▸ INDICATORS</div>'+
    '<div class="sr"><span class="sl">Pressure</span><span class="sv" style="color:'+(p<1010?'var(--red)':'var(--green)')+'">'+
    (p<1005?'▼ FALLING FAST':p<1010?'▼ FALLING':p<1015?'▬ STABLE':'▲ RISING')+' ('+p+' hPa)</span></div>'+
    '<div class="sr"><span class="sl">Humidity</span><span class="sv" style="color:'+(h>80?'var(--blue)':'var(--green)')+'">'+
    (h>80?'💧 HIGH ':h>60?'😊 NORMAL ':'🌵 LOW ')+h+'%</span></div>'+
    '<div class="sr"><span class="sl">Temperature</span><span class="sv" style="color:var(--orange)">'+t.toFixed(1)+'°C</span></div>'+
    '<div class="sr"><span class="sl">Weekly trend</span><span class="sv" style="color:'+(trend==='warming'?'var(--red)':trend==='cooling'?'var(--blue)':'var(--green)')+'">'+
    (trend==='warming'?'▲ WARMING':trend==='cooling'?'▼ COOLING':'▬ STABLE')+'</span></div>'+
    '<div class="sr"><span class="sl">Prediction</span><span class="sv" style="color:var(--text);font-size:.55rem">'+tp+'</span></div>'+
    '</div></div>'+
    '<div class="panel"><div class="ptl">▸ NOTE</div>'+
    '<div style="font-size:.72rem;color:var(--dim);padding:8px;line-height:1.6">'+
    'Predictions are based on pressure, humidity and temperature patterns. Accuracy improves as more data is collected over days and weeks! 📊'+
    '</div></div>';
}
load();
</script></body></html>`;
}

// ── SETTINGS ───────────────────────────────────────────────
function settingsHTML() {
  return head('Settings') + nav('settings') + `
<div class="page">
  <div class="pt">REMOTE <span style="color:var(--teal)">SETTINGS</span></div>
  <div class="ps">CHANGE ESP32 SETTINGS FROM ANYWHERE · REMOTE RESTART</div>
  <div class="hl"></div>
  <div class="g2">
    <div class="panel">
      <div class="ptl">▸ ESP32 CONFIGURATION</div>
      <div id="sf" class="ld">LOADING...</div>
    </div>
    <div class="panel">
      <div class="ptl">▸ DEVICE STATUS</div>
      <div id="ds2" class="ld">LOADING...</div>
      <div style="margin-top:15px">
        <div class="ptl">▸ REMOTE COMMANDS</div>
        <div style="margin-bottom:10px;padding:10px;background:rgba(255,51,85,.06);border:1px solid rgba(255,51,85,.2);border-radius:3px">
          <div style="font-size:.65rem;margin-bottom:8px">⚠️ Restart ESP32 — restarts on next data send!</div>
          <button class="btn br" onclick="doRestart()" style="width:100%">🔄 RESTART ESP32</button>
        </div>
        <div style="padding:10px;background:rgba(0,229,204,.06);border:1px solid rgba(0,229,204,.2);border-radius:3px">
          <div style="font-size:.62rem;color:var(--dim);line-height:1.8">
            How remote restart works:<br>
            1. Click restart here<br>
            2. Server flags restart=true<br>
            3. ESP32 sends next data<br>
            4. Server replies restart:true<br>
            5. ESP32 restarts! ✅
          </div>
        </div>
      </div>
    </div>
  </div>
  <div id="msg" style="display:none;margin-top:10px;padding:10px;border-radius:3px;
       font-family:'Orbitron',monospace;font-size:.6rem;text-align:center"></div>
</div>
<script>
let cfg={};
function g(id){return document.getElementById(id);}

async function load(){
  const [r1,r2]=await Promise.all([fetch('/api/config'),fetch('/api/data?type=latest')]);
  const [d1,d2]=await Promise.all([r1.json(),r2.json()]);
  cfg=d1.config||{};
  g('sf').innerHTML=
    '<div class="ig"><label class="il">DEVICE NAME</label>'+
    '<input class="inp" id="cn" value="'+(cfg.device_name||'')+'"></div>'+
    '<div class="ig"><label class="il">LOCATION</label>'+
    '<input class="inp" id="cl2" value="'+(cfg.location||'')+'"></div>'+
    '<div class="ig"><label class="il">SEND INTERVAL (SECONDS)</label>'+
    '<input class="inp" id="ci" type="number" min="10" max="3600" value="'+(cfg.send_interval||60)+'">'+
    '<div style="font-size:.58rem;color:var(--dim);margin-top:4px">Min: 10s · Recommended: 60s</div></div>'+
    '<button class="btn bt" onclick="save()" style="width:100%;margin-top:5px">💾 SAVE SETTINGS</button>'+
    '<div style="font-size:.6rem;color:var(--dim);margin-top:8px;line-height:1.6">Settings update on ESP32\'s next data send!</div>';
  const row=d2.data;
  const ago=row?Math.round((Date.now()-new Date(row.recorded_at+'Z').getTime())/1000):999;
  g('ds2').innerHTML=
    '<div class="sr"><span class="sl">Status</span><span class="sv" style="color:'+(ago<180?'var(--green)':'var(--red)')+'">'+
    (ago<180?'● ONLINE':'● OFFLINE')+'</span></div>'+
    '<div class="sr"><span class="sl">Last seen</span><span class="sv">'+(ago<3600?ago+'s ago':'Long ago')+'</span></div>'+
    '<div class="sr"><span class="sl">Last temp</span><span class="sv" style="color:var(--orange)">'+
    (row?parseFloat(row.temp).toFixed(1)+'°C':'--')+'</span></div>'+
    '<div class="sr"><span class="sl">Interval</span><span class="sv" style="color:var(--gold)">'+(cfg.send_interval||60)+'s</span></div>'+
    '<div class="sr"><span class="sl">Restart pending</span><span class="sv" style="color:'+(cfg.ota_available==='1'?'var(--red)':'var(--green)')+'">'+
    (cfg.ota_available==='1'?'YES — waiting':'No')+'</span></div>';
}

async function save(){
  const body={
    device_name:  g('cn').value,
    location:     g('cl2').value,
    send_interval:g('ci').value
  };
  const r=await fetch('/api/config',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const d=await r.json();
  showMsg(d.status==='ok'?'✅ SAVED! ESP32 updates on next send!':'❌ SAVE FAILED!',
          d.status==='ok'?'rgba(0,221,119,.1)':'rgba(255,51,85,.1)',
          d.status==='ok'?'var(--green)':'var(--red)');
  setTimeout(load,1500);
}

async function doRestart(){
  if(!confirm('Restart ESP32 on next data send?'))return;
  const r=await fetch('/api/config',{method:'POST',
    headers:{'Content-Type':'application/json'},body:JSON.stringify({restart:true})});
  const d=await r.json();
  showMsg('⚠️ RESTART QUEUED! ESP32 restarts on next send!','rgba(255,136,0,.1)','var(--gold)');
  setTimeout(load,1500);
}

function showMsg(txt,bg,col){
  const el=g('msg');
  el.style.display='block';el.textContent=txt;
  el.style.background=bg;el.style.color=col;
  el.style.border='1px solid '+col;
  setTimeout(()=>el.style.display='none',4000);
}

load();
</script></body></html>`;
}
