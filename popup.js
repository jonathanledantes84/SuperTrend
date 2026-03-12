// popup.js — SuperTrend Bot · completo y limpio
const _port = chrome.runtime.connect({ name: "keepalive" });

const g = id => document.getElementById(id);
const fmt  = (n,d=2) => Number(n||0).toFixed(d);
const fmtP = (n,d=2) => (n>=0?"+":"")+fmt(n,d);
const now  = () => new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit",second:"2-digit"});

// ── Theme ─────────────────────────────────────────────────────────────────────
let theme = "dark";
function applyTheme(t) {
  theme = t;
  document.documentElement.setAttribute("data-theme", t);
  g("themeBtn").textContent = t === "dark" ? "☀️" : "🌙";
  chrome.storage.local.set({ theme: t });
}
chrome.storage.local.get("theme", d => applyTheme(d.theme || "dark"));
g("themeBtn").addEventListener("click", () => applyTheme(theme === "dark" ? "light" : "dark"));

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = ["dash","chart","logs","cfg"];
function showTab(tab) {
  TABS.forEach(t => {
    const page = g("page" + t.charAt(0).toUpperCase() + t.slice(1));
    const btn  = g("tab"  + t.charAt(0).toUpperCase() + t.slice(1));
    if (page) page.style.display = t === tab ? "block" : "none";
    if (btn)  btn.className = "icon-btn" + (t === tab ? " active" : "");
  });
  if (tab === "logs")  refresh();
  if (tab === "cfg")   loadCfg();
  if (tab === "chart") loadChart();
}
g("tabDash").addEventListener("click",  () => showTab("dash"));
g("tabChart").addEventListener("click", () => showTab("chart"));
g("tabLogs").addEventListener("click",  () => showTab("logs"));
g("tabCfg").addEventListener("click",   () => showTab("cfg"));

// ── State ─────────────────────────────────────────────────────────────────────
function getState() {
  return new Promise(r => chrome.runtime.sendMessage({type:"GET_STATE"}, res => r(res?.state || null)));
}

function renderState(s, cfg) {
  if (!s) return;
  const blocked = s.blocked;
  g("dot").className = blocked ? "dot blocked" : s.running ? "dot run" : "dot stop";
  const autoTradeOn = cfg?.autoTrade !== false;
  g("sbarText").textContent = blocked ? "🚫 Bot pausado — límite diario"
    : s.running
      ? (autoTradeOn ? "Bot activo — auto-trade cada 1 minuto" : "Bot activo — solo señales (sin órdenes)")
      : "Bot detenido";
  const mode = cfg?.testnet !== false ? "TESTNET" : "REAL";
  g("modeBadge").textContent = blocked ? "BLOQUEADO" : mode;
  g("modeBadge").className = blocked ? "badge blocked" : mode === "REAL" ? "badge real" : "badge";
  g("price").textContent   = s.lastPrice ? "$" + fmt(s.lastPrice) : "—";
  g("balance").textContent = s.balanceUSDT ? fmt(s.balanceUSDT) + " U" : "—";
  g("bstate").textContent  = blocked ? "BLOQUEADO" : s.running ? "ACTIVO" : "DETENIDO";
  g("bstate").className    = "cval " + (blocked ? "r" : s.running ? "g" : "r");
  g("btnStart").disabled   = s.running || blocked;
  g("btnStop").disabled    = !s.running;
  g("blockedBanner").style.display = blocked ? "block" : "none";

  const iv = cfg?.interval || "15", miv = cfg?.majorInterval || "240";
  g("tLabel1").textContent = "SUPERTREND " + iv + "MIN";
  g("tLabel2").textContent = "FILTRO " + miv + "MIN";
  const t = s.trend;
  g("trend1").innerHTML = t === 1 ? '<span class="up">▲ ALCISTA</span>'
    : t === -1 ? '<span class="dn">▼ BAJISTA</span>' : '<span class="fl">— Esperando</span>';
  const tm = s.trendMajor;
  g("trend2").innerHTML = tm === 1 ? '<span class="up">▲ ALCISTA</span>'
    : tm === -1 ? '<span class="dn">▼ BAJISTA</span>' : '<span class="fl">— Esperando</span>';

  const dp = s.dailyPnl || 0;
  g("dailyPnlVal").textContent = fmtP(dp) + " U";
  g("dailyPnlVal").style.color = dp >= 0 ? "var(--g)" : "var(--r)";
  const maxLoss = (s.balanceUSDT || 0) * (parseFloat(cfg?.maxDailyLossPct || 5) / 100) || 1;
  const pct = Math.min(100, Math.abs(dp) / maxLoss * 100);
  g("riskFill").style.width = pct + "%";
  g("riskFill").style.background = pct > 80 ? "var(--r)" : pct > 50 ? "var(--y)" : "var(--g)";

  const eb = g("errBar");
  eb.style.display = s.error ? "block" : "none";
  if (s.error) eb.textContent = "⚠ " + s.error;

  const pos = s.position;
  if (pos?.open) {
    g("posBox").className = "pos-box show";
    g("posHeader").className = "pos-header buy";
    g("posHeader").textContent = "📍 POSICIÓN BUY ABIERTA";
    g("posEntry").textContent  = "$" + fmt(pos.entryPrice);
    g("posSL").textContent     = pos.slPrice ? "$" + fmt(pos.slPrice) : "—";
    g("posTP").textContent     = pos.tpPrice ? "$" + fmt(pos.tpPrice) : "—";
    g("posQty").textContent    = pos.qty;
    g("posPrice").textContent  = s.lastPrice ? "$" + fmt(s.lastPrice) : "—";
    const pnl = pos.pnl || 0;
    g("posPnl").textContent = fmtP(pnl) + " U";
    g("posPnl").className   = "pos-val " + (pnl >= 0 ? "g" : "r");
  } else {
    g("posBox").className = "pos-box";
  }

  const ol = g("olist");
  if (s.orders?.length) {
    ol.innerHTML = s.orders.slice(0,15).map(o => {
      const side = (o.side || "").toLowerCase();
      const time = (o.time || "").slice(11,19) || "—";
      const reason = o.reason || "";
      let tag = o.type === "OPEN"
        ? `<span class="otag ${side}">${side.toUpperCase()}</span>`
        : reason === "SL" ? '<span class="otag sl">SL</span>'
        : reason === "TP" ? '<span class="otag tp">TP</span>'
        : `<span class="otag close">${reason || "CIERRE"}</span>`;
      const pnlStr = o.pnl !== undefined
        ? `<span class="opnl ${parseFloat(o.pnl)>=0?"g":"r"}">${fmtP(parseFloat(o.pnl))}U</span>` : "";
      return `<div class="orow">${tag}<span class="oinfo">${o.symbol||"—"} $${o.price||"—"}</span>${pnlStr}<span class="otime">${time}</span></div>`;
    }).join("");
  } else {
    ol.innerHTML = '<div class="oempty">Sin operaciones aún</div>';
  }

  renderLogs(s.logs);
  g("lastUpd").textContent = "actualizado: " + now();
}

function renderLogs(logs) {
  const ll = g("loglist");
  if (!logs?.length) { ll.innerHTML = '<div class="lempty">Sin actividad — iniciá el bot</div>'; return; }
  ll.innerHTML = logs.map(l =>
    `<div class="lrow"><span class="ltime">${l.time}</span><div class="ldot ${l.level}"></div><span class="lmsg ${l.level}">${l.msg}</span></div>`
  ).join("");
}

async function refresh() {
  const [s, cfg] = await Promise.all([
    getState(),
    new Promise(r => chrome.storage.local.get(["testnet","symbol","interval","majorInterval","maxDailyLossPct","autoTrade"], r))
  ]);
  renderState(s, cfg);
}

g("rfBtn").addEventListener("click", async () => {
  g("rfBtn").textContent = "↻ ...";
  await refresh();
  g("rfBtn").textContent = "↻ Refrescar";
});

// ── Controls ──────────────────────────────────────────────────────────────────
g("btnStart").addEventListener("click", () => {
  g("btnStart").textContent = "..."; g("btnStart").disabled = true;
  chrome.runtime.sendMessage({type:"START"}, async () => { await refresh(); g("btnStart").textContent = "▶ Iniciar"; });
});
g("btnStop").addEventListener("click", () => {
  g("btnStop").textContent = "..."; g("btnStop").disabled = true;
  chrome.runtime.sendMessage({type:"STOP"}, async () => { await refresh(); g("btnStop").textContent = "■ Detener"; });
});
g("closePosBtn").addEventListener("click", () => {
  if (!confirm("¿Cerrar la posición manualmente?")) return;
  g("closePosBtn").textContent = "Cerrando..."; g("closePosBtn").disabled = true;
  chrome.runtime.sendMessage({type:"CLOSE_NOW"}, async () => {
    await refresh(); g("closePosBtn").textContent = "✕ Cerrar manualmente"; g("closePosBtn").disabled = false;
  });
});
g("resetDailyBtn").addEventListener("click", () => {
  if (!confirm("¿Resetear el límite diario y reanudar?")) return;
  chrome.runtime.sendMessage({type:"RESET_DAILY"}, () => refresh());
});
g("clearLogsBtn").addEventListener("click", () =>
  chrome.runtime.sendMessage({type:"CLEAR_LOGS"}, () => refresh())
);

// ── Settings ──────────────────────────────────────────────────────────────────
function loadCfg() {
  chrome.storage.local.get(["apiKey","apiSecret","testnet","symbol","qty","interval","majorInterval","slPct","tpPct","maxDailyLossPct","autoTrade"], d => {
    g("inKey").value      = d.apiKey     || "";
    g("inSecret").value   = d.apiSecret  || "";
    g("inTestnet").value  = d.testnet === false ? "false" : "true";
    g("inSymbol").value   = d.symbol     || "BTCUSDT";
    g("inQty").value      = d.qty        || "10";
    g("inInterval").value = d.interval   || "15";
    g("inMajor").value    = d.majorInterval || "60";
    g("inSL").value       = d.slPct      || "2";
    g("inTP").value       = d.tpPct      || "4";
    g("inMaxLoss").value  = d.maxDailyLossPct || "5";
    g("inAutoTrade").value = d.autoTrade === false ? "false" : "true";
    updateRR();
  });
}
function updateRR() {
  const sl = parseFloat(g("inSL").value) || 2;
  const tp = parseFloat(g("inTP").value) || 4;
  g("rrLabel").textContent = "1:" + (tp/sl).toFixed(1);
  g("rrLabel").style.color = tp >= sl ? "var(--g)" : "var(--r)";
}
g("inSL").addEventListener("input", updateRR);
g("inTP").addEventListener("input", updateRR);
g("saveBtn").addEventListener("click", () => {
  const key = g("inKey").value.trim(), secret = g("inSecret").value.trim();
  if (!key)    { showMsg("Ingresá tu API Key", "err"); return; }
  if (!secret) { showMsg("Ingresá tu Secret Key", "err"); return; }
  chrome.storage.local.set({
    apiKey: key, apiSecret: secret,
    testnet: g("inTestnet").value !== "false",
    symbol: (g("inSymbol").value.trim() || "BTCUSDT").toUpperCase(),
    qty: g("inQty").value.trim() || "10",
    interval: g("inInterval").value || "15",
    majorInterval: g("inMajor").value || "60",
    slPct: g("inSL").value || "2",
    tpPct: g("inTP").value || "4",
    maxDailyLossPct: g("inMaxLoss").value || "5",
    autoTrade: g("inAutoTrade").value !== "false"
  }, () => { showMsg("✓ Guardado — reiniciá el bot", "ok"); updateRR(); });
});
function showMsg(txt, type) {
  const m = g("cfgMsg"); m.textContent = txt; m.className = "msg " + type;
  setTimeout(() => m.className = "msg", 4000);
}
g("eyeBtn").addEventListener("click", () => {
  const s = g("inSecret").type === "password";
  g("inSecret").type = s ? "text" : "password";
  g("eyeBtn").textContent = s ? "🔒" : "👁";
});

// ── CHART TAB ─────────────────────────────────────────────────────────────────
let chartTf = "15";
let chartBusy = false;
let chartInterval = null;

document.querySelectorAll(".tf-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    chartTf = btn.dataset.tf;
    loadChart();
  });
});

async function loadChart() {
  if (chartBusy) return;
  chartBusy = true;
  const canvas = g("chart");
  const ctx    = canvas.getContext("2d");
  const isDark = theme === "dark";

  // Mostrar loading
  canvas.width  = 300; canvas.height = 200;
  ctx.fillStyle = isDark ? "#080b10" : "#f0f4f8";
  ctx.fillRect(0, 0, 300, 200);
  ctx.fillStyle = isDark ? "#566880" : "#6b7a8d";
  ctx.font = "9px 'Space Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillText("Cargando " + chartTf + "min...", 150, 100);

  const cfg = await new Promise(r => chrome.storage.local.get(["testnet","symbol"], r));
  const symbol  = (cfg.symbol || "BTCUSDT").toUpperCase();
  const base    = cfg.testnet !== false ? "https://api-testnet.bybit.com" : "https://api.bybit.com";
  g("chartTitle").textContent = symbol + " · " + chartTf + (chartTf === "D" ? "" : "MIN");

  try {
    const url  = `${base}/v5/market/kline?category=spot&symbol=${symbol}&interval=${chartTf}&limit=80`;
    const res  = await fetch(url);
    const data = await res.json();
    if (data.retCode !== 0) throw new Error(data.retMsg);
    const bars = [...data.result.list].reverse();
    const klines = {
      opens:  bars.map(b => parseFloat(b[1])),
      highs:  bars.map(b => parseFloat(b[2])),
      lows:   bars.map(b => parseFloat(b[3])),
      closes: bars.map(b => parseFloat(b[4]))
    };
    const st    = calcST(klines.highs, klines.lows, klines.closes);
    const price = klines.closes[klines.closes.length - 1];
    canvas.width  = 300; canvas.height = 200;
    drawChart(canvas, klines, st, price, isDark);
    g("chartUpd").textContent = "act: " + now();
  } catch(e) {
    ctx.fillStyle = isDark ? "#080b10" : "#f0f4f8";
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillStyle = "#ff4466";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText("Error: " + e.message.slice(0,40), 150, 100);
  }
  chartBusy = false;
}

// SuperTrend para el gráfico
function calcST(highs, lows, closes, period=10, mult=3.0) {
  const n = closes.length;
  const trend = new Array(n).fill(1);
  const up    = new Array(n).fill(0);
  const dn    = new Array(n).fill(0);
  let atr = 0;
  const alpha = 1 / period;
  for (let i = 0; i < n; i++) {
    const tr = i === 0 ? highs[i] - lows[i]
      : Math.max(highs[i]-lows[i], Math.abs(highs[i]-closes[i-1]), Math.abs(lows[i]-closes[i-1]));
    atr = i === 0 ? tr : atr*(1-alpha) + tr*alpha;
    const src = (highs[i]+lows[i])/2;
    up[i] = src - mult*atr;
    dn[i] = src + mult*atr;
    if (i > 0) {
      up[i] = closes[i-1] > up[i-1] ? Math.max(up[i], up[i-1]) : up[i];
      dn[i] = closes[i-1] < dn[i-1] ? Math.min(dn[i], dn[i-1]) : dn[i];
      if      (trend[i-1]===-1 && closes[i] > dn[i-1]) trend[i] = 1;
      else if (trend[i-1]=== 1 && closes[i] < up[i-1]) trend[i] = -1;
      else trend[i] = trend[i-1];
    }
  }
  return { trend, up, dn };
}

function drawChart(canvas, klines, st, currentPrice, isDark) {
  const ctx  = canvas.getContext("2d");
  const W=300, H=200;
  const upC  = isDark ? "#00ff88" : "#00aa55";
  const dnC  = isDark ? "#ff4466" : "#e02040";
  const bg   = isDark ? "#080b10" : "#f0f4f8";
  const grid = isDark ? "#1c2535" : "#dde4ed";
  const tc   = isDark ? "#566880" : "#9baabb";

  ctx.fillStyle = bg; ctx.fillRect(0,0,W,H);

  const show  = Math.min(klines.closes.length, 60);
  const start = klines.closes.length - show;
  const highs  = klines.highs.slice(start);
  const lows   = klines.lows.slice(start);
  const opens  = klines.opens.slice(start);
  const closes = klines.closes.slice(start);
  const trend  = st.trend.slice(start);
  const stLine = trend.map((tr,i) => tr===1 ? st.up[start+i] : st.dn[start+i]);

  const allP  = [...highs, ...lows, ...stLine];
  const minP  = Math.min(...allP)*0.9998;
  const maxP  = Math.max(...allP)*1.0002;
  const range = maxP - minP;

  const pL=4, pR=42, pT=8, pB=18;
  const cW=W-pL-pR, cH=H-pT-pB;
  const toY = p => pT + cH - ((p-minP)/range)*cH;
  const bW  = cW/show;
  const cndW = Math.max(1, bW*0.55);

  // Grid + precios
  for (let i=0; i<=4; i++) {
    const y = pT + (cH/4)*i;
    ctx.strokeStyle=grid; ctx.lineWidth=0.5;
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
    const p = maxP-(range/4)*i;
    ctx.fillStyle=tc; ctx.font="7px monospace"; ctx.textAlign="left";
    ctx.fillText("$"+p.toFixed(0), W-pR+3, y+3);
  }

  // SuperTrend line
  ctx.lineWidth=1.5;
  for (let i=1; i<show; i++) {
    const x1=pL+(i-1)*bW+bW/2, y1=toY(stLine[i-1]);
    const x2=pL+i*bW+bW/2,     y2=toY(stLine[i]);
    ctx.strokeStyle = trend[i]===1 ? upC+"99" : dnC+"99";
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }

  // Velas
  for (let i=0; i<show; i++) {
    const x   = pL+i*bW+bW/2;
    const isUp= closes[i]>=opens[i];
    const col = isUp ? upC : dnC;
    ctx.strokeStyle=col; ctx.lineWidth=0.8;
    ctx.beginPath(); ctx.moveTo(x,toY(highs[i])); ctx.lineTo(x,toY(lows[i])); ctx.stroke();
    ctx.fillStyle=col;
    const bTop=Math.min(toY(opens[i]),toY(closes[i]));
    const bH  =Math.max(1,Math.abs(toY(opens[i])-toY(closes[i])));
    ctx.fillRect(x-cndW/2, bTop, cndW, bH);
  }

  // Precio actual
  if (currentPrice) {
    const y=toY(currentPrice);
    ctx.strokeStyle="#44aaff66"; ctx.lineWidth=0.8;
    ctx.setLineDash([3,3]);
    ctx.beginPath(); ctx.moveTo(pL,y); ctx.lineTo(W-pR,y); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle="#44aaff"; ctx.font="bold 7px monospace"; ctx.textAlign="left";
    ctx.fillText("$"+currentPrice.toFixed(0), W-pR+3, y+3);
  }

  // Señales
  for (let i=1; i<show; i++) {
    if (trend[i-1]===-1 && trend[i]===1) {
      const x=pL+i*bW+bW/2;
      ctx.fillStyle=upC; ctx.font="bold 9px monospace"; ctx.textAlign="center";
      ctx.fillText("▲", x, toY(lows[i])+11);
    } else if (trend[i-1]===1 && trend[i]===-1) {
      const x=pL+i*bW+bW/2;
      ctx.fillStyle=dnC; ctx.font="bold 9px monospace"; ctx.textAlign="center";
      ctx.fillText("▼", x, toY(highs[i])-4);
    }
  }
}

// ── Init ──────────────────────────────────────────────────────────────────────
showTab("dash");
refresh();
setInterval(refresh, 5000);
