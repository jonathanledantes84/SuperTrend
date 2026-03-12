
// SuperTrend Bybit Bot - Background Service Worker

const BASE = {
  real: "https://api.bybit.com",
  testnet: "https://api-testnet.bybit.com"
};

// --- Utils ---
async function hmacSHA256(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function bybitRequest(cfg, method, path, params = {}) {
  const base = cfg.testnet ? BASE.testnet : BASE.real;
  const timestamp = Date.now().toString();
  const recvWindow = "5000";

  let queryStr = "";
  let bodyStr = "";
  if (method === "GET") {
    queryStr = new URLSearchParams(params).toString();
  } else {
    bodyStr = JSON.stringify(params);
  }

  const preSign = timestamp + cfg.apiKey + recvWindow + (method === "GET" ? queryStr : bodyStr);
  const sign = await hmacSHA256(cfg.apiSecret, preSign);

  const headers = {
    "X-BAPI-API-KEY": cfg.apiKey,
    "X-BAPI-TIMESTAMP": timestamp,
    "X-BAPI-RECV-WINDOW": recvWindow,
    "X-BAPI-SIGN": sign,
    "Content-Type": "application/json"
  };

  const url = `${base}${path}${queryStr ? "?" + queryStr : ""}`;
  const res = await fetch(url, {
    method,
    headers,
    body: method !== "GET" ? bodyStr : undefined
  });
  return await res.json();
}

function calcSuperTrend(highs, lows, closes, period = 10, multiplier = 3.0) {
  const n = closes.length;
  if (n === 0) return { trend: [], up: [], dn: [] };

  const tr = Array(n).fill(0);
  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i - 1]),
      Math.abs(lows[i] - closes[i - 1])
    );
  }

  const atr = Array(n).fill(0);
  if (n >= period) {
    atr[period - 1] = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
    const alpha = 1 / period;
    for (let i = period; i < n; i++) {
      atr[i] = alpha * tr[i] + (1 - alpha) * atr[i - 1];
    }
  }

  const up = Array(n).fill(0);
  const dn = Array(n).fill(0);
  const trend = Array(n).fill(1);

  for (let i = 0; i < n; i++) {
    const src = (highs[i] + lows[i]) / 2;
    const upRaw = src - multiplier * atr[i];
    const dnRaw = src + multiplier * atr[i];

    if (i === 0) {
      up[i] = upRaw; dn[i] = dnRaw; trend[i] = 1;
      continue;
    }

    const up1 = up[i - 1];
    const dn1 = dn[i - 1];

    up[i] = closes[i - 1] > up1 ? Math.max(upRaw, up1) : upRaw;
    dn[i] = closes[i - 1] < dn1 ? Math.min(dnRaw, dn1) : dnRaw;

    const prev = trend[i - 1];
    if (prev === -1 && closes[i] > dn1) trend[i] = 1;
    else if (prev === 1 && closes[i] < up1) trend[i] = -1;
    else trend[i] = prev;
  }

  return { trend, up, dn };
}

// --- Bot Logic ---
async function runIteration() {
  const data = await chrome.storage.local.get(['bot_active', 'bybit_api_key', 'bybit_api_secret', 'bybit_env', 'trading_pair', 'timeframe', 'order_qty']);
  if (!data.bot_active) return;

  const cfg = {
    apiKey: data.bybit_api_key,
    apiSecret: data.bybit_api_secret,
    testnet: data.bybit_env === 'testnet'
  };

  if (!cfg.apiKey || !cfg.apiSecret) return;

  const symbol = data.trading_pair || "BTCUSDT";
  const interval = data.timeframe || "15";

  try {
    // 1. Get Klines
    const base = cfg.testnet ? BASE.testnet : BASE.real;
    const klineUrl = `${base}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=100`;
    const klineRes = await fetch(klineUrl);
    const klineData = await klineRes.json();

    if (klineData.retCode !== 0) throw new Error(klineData.retMsg);

    const bars = [...klineData.result.list].reverse();
    const highs = bars.map(b => parseFloat(b[2]));
    const lows = bars.map(b => parseFloat(b[3]));
    const closes = bars.map(b => parseFloat(b[4]));

    // 2. Calc SuperTrend
    const st = calcSuperTrend(highs, lows, closes);
    const currentTrend = st.trend[st.trend.length - 1];
    const previousTrend = st.trend[st.trend.length - 2];

    // 3. Check for Signal
    if (currentTrend !== previousTrend) {
      const side = currentTrend === 1 ? "Buy" : "Sell";
      const qty = parseFloat(data.order_qty || "50");

      // Place Order
      const orderRes = await bybitRequest(cfg, "POST", "/v5/order/create", {
        category: "spot",
        symbol: symbol,
        side: side,
        orderType: "Market",
        qty: String(qty),
        marketUnit: side === "Buy" ? "quoteCoin" : "baseCoin"
      });

      if (orderRes.retCode === 0) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon.png',
          title: `Señal SuperTrend: ${side}`,
          message: `Orden ejecutada para ${symbol} a precio de mercado.`
        });
        
        // Log to storage
        const logs = (await chrome.storage.local.get(['logs'])).logs || [];
        logs.unshift({
          id: Date.now(),
          type: 'success',
          message: `Señal ${side.toUpperCase()} ejecutada para ${symbol}.`,
          time: new Date().toLocaleTimeString()
        });
        await chrome.storage.local.set({ logs: logs.slice(0, 100) });
      } else {
        console.error("Order failed:", orderRes.retMsg);
      }
    }
  } catch (e) {
    console.error("Iteration error:", e);
  }
}

// --- Events ---
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create('trading_loop', { periodInMinutes: 1 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'trading_loop') {
    runIteration();
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_BOT') {
    chrome.storage.local.set({ bot_active: true }, () => {
      runIteration();
      sendResponse({ status: 'started' });
    });
    return true;
  }
  if (msg.type === 'STOP_BOT') {
    chrome.storage.local.set({ bot_active: false }, () => {
      sendResponse({ status: 'stopped' });
    });
    return true;
  }
});
