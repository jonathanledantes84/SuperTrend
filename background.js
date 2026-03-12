import { getKlines, getBalance, getBTCBalance, placeOrder } from "./lib/bybit.js";
import { calcSuperTrend } from "./lib/supertrend.js";

// background.js — SuperTrend Bot SPOT
// Spot: comprás BTC con USDT (BUY) y vendés BTC por USDT (SELL)
// No hay posiciones abiertas, apalancamiento ni shorts reales
// importado via manifest module

const ALARM_NAME = "supertrend-tick";

let state = {
  running:    false,
  trend:      null,
  trendMajor: null,
  lastPrice:  0,
  lastCheck:  "—",
  balanceUSDT: 0,   // cuánto USDT tenés
  balanceBTC:  0,   // cuánto BTC tenés
  dailyPnl:   0,
  dailyDate:  "",
  orders:     [],
  logs:       [],
  error:      null,
  blocked:    false,
  // En Spot: "posición" = tenemos BTC comprado
  position: {
    open: false, entryPrice: 0, qty: 0, pnl: 0
  }
};

function ts() {
  return new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function today() {
  return new Date().toISOString().slice(0,10);
}

function log(level, msg) {
  const entry = { time: ts(), level, msg };
  state.logs.unshift(entry);
  state.logs = state.logs.slice(0, 100);
}

async function getCfg() {
  return new Promise(resolve => {
    chrome.storage.local.get([
      "apiKey","apiSecret","testnet","symbol","qty","interval",
      "slPct","tpPct","maxDailyLossPct","majorInterval","autoTrade"
    ], d => {
      resolve({
        apiKey:          d.apiKey       || "",
        apiSecret:       d.apiSecret    || "",
        testnet:         d.testnet      !== false,
        demo_mode:       d.demo_mode    === true,
        symbol:          d.symbol       || "BTCUSDT",
        qty:             d.qty          || "10",
        interval:        d.interval     || "60",
        majorInterval:   d.majorInterval|| "240",
        slPct:           parseFloat(d.slPct          || "2"),
        tpPct:           parseFloat(d.tpPct          || "4"),
        maxDailyLossPct: parseFloat(d.maxDailyLossPct) || 5,
        autoTrade: d.autoTrade !== false,
      });

    });
  });
}

function saveState() {
  // WinRate calc
  const closes = state.orders.filter(o => o.type === 'CLOSE' && o.pnl !== undefined);
  if (closes.length) {
    const wins = closes.filter(o => parseFloat(o.pnl) > 0).length;
    state.winRate = ((wins / closes.length) * 100).toFixed(1) + '%';
  } else {
    state.winRate = 'N/A';
  }
  chrome.storage.local.set({ botState: state });
}


function notify(title, msg) {
  chrome.notifications.create({
    type:"basic", iconUrl:"icon128.png", title, message: msg
  });
}

function today_str() { return new Date().toISOString().slice(0,10); }

function checkDailyReset() {
  const t = today_str();
  if (state.dailyDate !== t) {
    state.dailyDate = t;
    state.dailyPnl  = 0;
    state.blocked   = false;
    log("info", "Nuevo día — PnL diario reseteado");
  }
}

// En Spot: la "posición abierta" es simplemente tener BTC
async function syncPosition(cfg, price) {
  const base = cfg.symbol.replace("USDT","").replace("usdt","");
  const btc  = await getBTCBalance(cfg, base);
  state.balanceBTC = btc;
  if (btc > 0.00001) {
    if (!state.position.open) {
      // Tenemos BTC pero no lo registramos — sincronizar
      state.position = {
        open: true,
        entryPrice: state.position.entryPrice || price,
        qty: btc,
        pnl: 0
      };
      log("warn", "BTC encontrado en wallet (" + btc + ") — sincronizado como posición abierta");
    } else {
      state.position.qty = btc;
      state.position.pnl = parseFloat(((price - state.position.entryPrice) * btc).toFixed(4));
    }
  } else {
    if (state.position.open) {
      log("warn", "Ya no hay BTC en wallet — posición cerrada");
      state.position = { open:false, entryPrice:0, qty:0, pnl:0 };
    }
  }
}

// BUY: gastamos X USDT para comprar BTC
async function buyBTC(cfg, price) {
  const usdtToSpend = parseFloat(cfg.qty);
  if (usdtToSpend <= 0) { log("error","Cantidad inválida"); return false; }
  if (state.balanceUSDT < usdtToSpend) {
    log("warn", "Balance USDT insuficiente: " + state.balanceUSDT.toFixed(2) + " U (necesitás " + usdtToSpend + " U)");
    return false;
  }

  const slPrice = parseFloat((price * (1 - cfg.slPct/100)).toFixed(2));
  const tpPrice = parseFloat((price * (1 + cfg.tpPct/100)).toFixed(2));

  log("info", "BUY SPOT — gastando " + usdtToSpend + " USDT @ $" + price.toFixed(2) + " | SL $" + slPrice + " | TP $" + tpPrice);

  try {
    await placeOrder(cfg, cfg.symbol, "Buy", usdtToSpend, true);
    const btcComprado = parseFloat((usdtToSpend / price).toFixed(6));
    state.position = {
      open: true,
      entryPrice: price,
      qty: btcComprado,
      pnl: 0,
      slPrice,
      tpPrice
    };
    state.orders.unshift({
      type:"OPEN", side:"buy", symbol:cfg.symbol,
      qty: btcComprado, price: price.toFixed(2),
      sl: slPrice, tp: tpPrice,
      time: new Date().toISOString()
    });
    state.orders = state.orders.slice(0,50);
    log("ok", "✅ BUY ejecutado — ~" + btcComprado + " BTC @ $" + price.toFixed(2));
    notify("✅ BUY Spot", cfg.symbol + " @ $" + price.toFixed(2) + "\nSL: $" + slPrice + " | TP: $" + tpPrice);
    return true;
  } catch(e) {
    log("error", "Error BUY: " + e.message);
    state.error = e.message;
    notify("❌ Error BUY", e.message);
    return false;
  }
}

// SELL: vendemos todo el BTC que tenemos
async function sellBTC(cfg, price, reason) {
  if (!state.position.open) return;
  const btcQty = state.balanceBTC > 0 ? state.balanceBTC : state.position.qty;
  if (btcQty <= 0.00001) {
    log("warn", "No hay BTC para vender");
    return;
  }

  log("info", "SELL SPOT — vendiendo " + btcQty + " BTC @ $" + price.toFixed(2) + " (" + reason + ")");
  try {
    await placeOrder(cfg, cfg.symbol, "Sell", parseFloat(btcQty.toFixed(6)), false);
    const pnl    = parseFloat(((price - state.position.entryPrice) * btcQty).toFixed(4));
    const pnlStr = (pnl >= 0 ? "+" : "") + pnl.toFixed(2);

    state.dailyPnl += pnl;
    state.orders.unshift({
      type:"CLOSE", side:"sell", symbol:cfg.symbol,
      qty: btcQty, price: price.toFixed(2),
      entryPrice: state.position.entryPrice.toFixed(2),
      pnl: pnl.toFixed(4), reason,
      time: new Date().toISOString()
    });
    state.orders = state.orders.slice(0,50);

    const icon = reason==="SL"?"🛑":reason==="TP"?"🎯":"🔄";
    log(pnl >= 0 ? "ok" : "warn",
      icon + " SELL ("+reason+") @ $"+price.toFixed(2)+" | PnL: "+pnlStr+" U | PnL día: "+(state.dailyPnl>=0?"+":"")+state.dailyPnl.toFixed(2)+" U"
    );
    notify(icon + " SELL ("+reason+")", cfg.symbol+" @ $"+price.toFixed(2)+"\nPnL: "+pnlStr+" USDT");
    state.position = { open:false, entryPrice:0, qty:0, pnl:0 };
  } catch(e) {
    log("error", "Error SELL: " + e.message);
    state.error = e.message;
  }
}

// ── Tick principal ────────────────────────────────────────────────────────────
async function tick() {
  const cfg = await getCfg();
  if (!cfg.apiKey || !cfg.apiSecret) {
    state.error = "Sin API Key — configurá en ⚙";
    log("warn","Sin API Key"); saveState(); return;
  }

  try {
    checkDailyReset();

    if (state.blocked) {
      log("warn","🚫 Límite diario alcanzado — bot bloqueado hasta mañana");
      saveState(); return;
    }

    // Demo mode check
    if (cfg.demo_mode) {
      log("info", "🧪 MODO DEMO ACTIVO - velas sintéticas");
      // Synthetic klines for demo
      const n = 300;
      const klines = {
        highs: Array.from({length: n}, (_, i) => 65000 + Math.sin(i/10)*5000 + (Math.random()-0.5)*1000),
        lows: Array.from({length: n}, (_, i) => 65000 + Math.sin(i/10)*5000 + (Math.random()-0.5)*1000 - 500),
        closes: Array.from({length: n}, (_, i) => 65000 + Math.sin(i/10)*5000 + (Math.random()-0.5)*500)
      };
      const { trend } = calcSuperTrend(klines.highs, klines.lows, klines.closes);
      const currentTrend = trend[trend.length - 1];
      const price = klines.closes[klines.closes.length - 1];
      state.lastPrice = price;
      state.lastCheck = ts();
      // Demo trendMajor random
      state.trendMajor = Math.random() > 0.5 ? 1 : -1;
      log("info", "Demo - Tendencia: " + (currentTrend===1?"▲":"▼") + " Precio: $" + price.toFixed(0));
      // Simulate signals randomly
      if (Math.random() < 0.1) { // 10% chance per tick
        log("demo", "🧪 Señal demo BUY/SELL ejecutada");
      }
    } else {
      // Balance USDT

    try {
      state.balanceUSDT = await getBalance(cfg);
      const maxLoss = state.balanceUSDT * (cfg.maxDailyLossPct / 100);
      log("info", "Balance: " + state.balanceUSDT.toFixed(2) + " USDT | PnL día: " + (state.dailyPnl>=0?"+":"") + state.dailyPnl.toFixed(2) + " U | Límite: " + (maxLoss>0?maxLoss.toFixed(2):"N/A") + " U");

      if (maxLoss > 0 && state.dailyPnl < 0 && Math.abs(state.dailyPnl) >= maxLoss) {
        state.blocked = true;
        state.running = false;
        chrome.alarms.clear(ALARM_NAME);
        log("error","🚫 LÍMITE DIARIO ALCANZADO: " + Math.abs(state.dailyPnl).toFixed(2) + " U perdidos (máx " + maxLoss.toFixed(2) + " U). Bot detenido hasta mañana.");
        notify("🚫 Límite diario","Pérdida: "+(-state.dailyPnl).toFixed(2)+" USDT\nBot detenido hasta mañana");
        if (state.position.open) await sellBTC(cfg, state.lastPrice, "LÍMITE");
        saveState(); return;
      }
    } catch(e) {
      log("warn","No se pudo obtener balance: " + e.message);
    }

    // Velas y SuperTrend
    log("info","Calculando SuperTrend " + cfg.symbol + " (" + cfg.interval + "min)...");
    const klines = await getKlines(cfg, cfg.symbol, cfg.interval);
    const { trend } = calcSuperTrend(klines.highs, klines.lows, klines.closes);
    const currentTrend = trend[trend.length - 1];
    const price        = klines.closes[klines.closes.length - 1];
    const prevTrend    = state.trend;

    state.lastPrice = price;
    state.lastCheck = ts();
    state.error     = null;

    // Sincronizar posición Spot (BTC en wallet)
    await syncPosition(cfg, price);

    // Filtro tendencia mayor
    log("info","Verificando tendencia mayor (" + cfg.majorInterval + "min)...");
    try {
      const km = await getKlines(cfg, cfg.symbol, cfg.majorInterval, 100);
      const { trend: tm } = calcSuperTrend(km.highs, km.lows, km.closes);
      state.trendMajor = tm[tm.length - 1];
      log("info",
        "Tendencia " + cfg.interval + "min: " + (currentTrend===1?"▲ ALCISTA":"▼ BAJISTA") +
        " | Tendencia " + cfg.majorInterval + "min: " + (state.trendMajor===1?"▲ ALCISTA":"▼ BAJISTA")
      );
    } catch(e) {
      log("warn","No se pudo calcular tendencia mayor: " + e.message);
      state.trendMajor = null;
    }

    // SL / TP sobre posición abierta
    if (state.running && state.position.open) {
      const pos = state.position;
      if (pos.slPrice && price <= pos.slPrice) {
        log("warn","🛑 Stop Loss disparado @ $" + price.toFixed(2));
        await sellBTC(cfg, price, "SL");
        saveState(); state.trend = currentTrend; return;
      }
      if (pos.tpPrice && price >= pos.tpPrice) {
        log("ok","🎯 Take Profit disparado @ $" + price.toFixed(2));
        await sellBTC(cfg, price, "TP");
        saveState(); state.trend = currentTrend; return;
      }
    }

    // Señales
    if (state.running && prevTrend !== null) {
      const buySignal  = currentTrend ===  1 && prevTrend === -1;
      const sellSignal = currentTrend === -1 && prevTrend ===  1;

      if (buySignal || sellSignal) {
        const signalLabel = buySignal ? "BUY" : "SELL";
        const majorOk = state.trendMajor === null ||
          (buySignal  && state.trendMajor ===  1) ||
          (sellSignal && state.trendMajor === -1);

        if (!majorOk) {
          log("warn","⚠ Señal " + signalLabel + " ignorada — tendencia mayor contraria");
        } else if (!cfg.autoTrade) {
          log("info", "📡 Señal " + signalLabel + " detectada (auto-trade OFF)");
          notify("📡 Señal " + signalLabel, cfg.symbol + " @ $" + price.toFixed(2) + " (sin ejecución)");
        } else {
          if (sellSignal && state.position.open) {
            log("ok","🔴 SELL — tendencias alineadas");
            await sellBTC(cfg, price, "SEÑAL");
          } else if (buySignal && !state.position.open) {
            log("ok","🟢 BUY — tendencias alineadas");
            await buyBTC(cfg, price);
          } else if (buySignal && state.position.open) {
            log("info","BUY ignorado — ya tenemos BTC");
          } else if (sellSignal && !state.position.open) {
            log("info","SELL ignorado — no hay BTC para cerrar");
          }
        }
      } else {
        log("info","Sin señal nueva — esperando cambio de tendencia");
      }
    } else if (prevTrend === null) {
      log("info","Primer ciclo — leyendo tendencias, esperando próxima señal...");
    }

    state.trend = currentTrend;
    saveState();

  } catch(e) {
    log("error", e.message);
    state.error     = e.message;
    state.lastCheck = ts();
    saveState();
  }
}

// ── Alarms ────────────────────────────────────────────────────────────────────
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === ALARM_NAME) tick();
});

// ── Messages ──────────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _, respond) => {
  if (msg.type === "START" || msg.type === "START_BOT") {
    state.running = true;
    state.trend   = null;
    state.trendMajor = null;
    state.logs    = [];
    state.blocked = false;
    checkDailyReset();
    log("ok","Bot iniciado ✓");
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    tick();
    saveState();
    respond({ ok: true, status: "started" });
  }
  if (msg.type === "STOP" || msg.type === "STOP_BOT") {
    state.running = false;
    chrome.alarms.clear(ALARM_NAME);
    log("warn","Bot detenido manualmente");
    saveState();
    respond({ ok: true, status: "stopped" });
  }
  if (msg.type === "GET_STATE") {
    respond({ ok: true, state });
  }
  if (msg.type === "CLOSE_NOW") {
    getCfg().then(cfg => {
      sellBTC(cfg, state.lastPrice, "MANUAL").then(() => {
        saveState(); respond({ ok: true });
      });
    });
    return true;
  }
  if (msg.type === "CLEAR_LOGS") {
    state.logs = [];
    saveState();
    respond({ ok: true });
  }
  if (msg.type === "RESET_DAILY") {
    state.dailyPnl  = 0;
    state.blocked   = false;
    state.dailyDate = today_str();
    log("ok","PnL diario reseteado manualmente");
    saveState();
    respond({ ok: true });
  }
  return true;
});

chrome.runtime.onStartup.addListener(async () => {
  const d = await new Promise(r => chrome.storage.local.get("botState", r));
  if (d.botState?.running) {
    state = { ...state, ...d.botState };
    chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    log("info","Bot restaurado tras reinicio de Chrome");
  }
});


// ── Keepalive — evita que Chrome mate el Service Worker ───────────────────────
// MV3 mata el SW después de ~30s de inactividad. Este mecanismo lo mantiene vivo.
let keepAliveInterval = null;

function startKeepAlive() {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    // Ping al propio SW para mantenerlo activo
    chrome.runtime.getPlatformInfo(() => {});
  }, 20000); // cada 20 segundos
}

function stopKeepAlive() {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
}

// Arrancar keepalive siempre al cargar el SW
startKeepAlive();

// También usar un puerto de conexión persistente desde el popup
chrome.runtime.onConnect.addListener(port => {
  if (port.name === "keepalive") {
    port.onDisconnect.addListener(() => {
      // popup cerrado, mantener SW vivo igual con el interval
    });
  }
});
