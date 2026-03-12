const BASE = {
  real:    "https://api.bybit.com",
  testnet: "https://api-testnet.bybit.com"
};

export async function hmacSHA256(secret: string, message: string) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2,"0")).join("");
}

export async function bybitRequest(cfg: any, method: string, path: string, params: any = {}) {
  const base       = cfg.testnet ? BASE.testnet : BASE.real;
  const timestamp  = Date.now().toString();
  const recvWindow = "5000";

  let queryStr = "";
  let bodyStr  = "";
  if (method === "GET") {
    queryStr = new URLSearchParams(params).toString();
  } else {
    bodyStr = JSON.stringify(params);
  }

  const preSign = timestamp + cfg.apiKey + recvWindow + (method === "GET" ? queryStr : bodyStr);
  const sign    = await hmacSHA256(cfg.apiSecret, preSign);

  const headers = {
    "X-BAPI-API-KEY":     cfg.apiKey,
    "X-BAPI-TIMESTAMP":   timestamp,
    "X-BAPI-RECV-WINDOW": recvWindow,
    "X-BAPI-SIGN":        sign,
    "Content-Type":       "application/json"
  };

  const url = `${base}${path}${queryStr ? "?" + queryStr : ""}`;
  
  // In a Chrome Extension, we can fetch directly if we have host permissions.
  // We'll try direct fetch first, and fallback to the proxy if it fails (for the web preview).
  try {
    const res = await fetch(url, {
      method,
      headers,
      body: method !== "GET" ? bodyStr : undefined
    });
    const data = await res.json();
    if (data.retCode !== undefined) return data.result;
  } catch (e) {
    console.log("Direct fetch failed, falling back to proxy...");
  }

  // Fallback to our proxy for the AI Studio web preview
  const res = await fetch('/api/bybit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      method,
      headers,
      payload: method !== "GET" ? bodyStr : undefined
    })
  });

  const data = await res.json();
  if (data.retCode !== 0) throw new Error(data.retMsg || "Bybit API error");
  return data.result;
}

export async function getKlines(cfg: any, symbol: string, interval: string, limit = 300) {
  const base = cfg.testnet ? BASE.testnet : BASE.real;
  const url  = `${base}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.retCode === 0) {
      const bars = [...data.result.list].reverse();
      return {
        opens:  bars.map(b => parseFloat(b[1])),
        highs:  bars.map(b => parseFloat(b[2])),
        lows:   bars.map(b => parseFloat(b[3])),
        closes: bars.map(b => parseFloat(b[4]))
      };
    }
  } catch (e) {
    console.log("Direct kline fetch failed, falling back to proxy...");
  }

  const res = await fetch('/api/bybit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, method: 'GET' })
  });
  
  const data = await res.json();
  if (data.retCode !== 0) throw new Error(data.retMsg);
  const bars = [...data.result.list].reverse();
  return {
    opens:  bars.map(b => parseFloat(b[1])),
    highs:  bars.map(b => parseFloat(b[2])),
    lows:   bars.map(b => parseFloat(b[3])),
    closes: bars.map(b => parseFloat(b[4]))
  };
}

export async function getBalance(cfg: any) {
  const types = ["UNIFIED", "SPOT"];
  for (const accountType of types) {
    try {
      const result = await bybitRequest(cfg, "GET", "/v5/account/wallet-balance", { accountType });
      const coins  = (result.list || [])[0]?.coin || [];
      const usdt   = coins.find((c: any) => c.coin === "USDT");
      const bal    = usdt ? parseFloat(usdt.walletBalance || usdt.availableToWithdraw || "0") : 0;
      if (bal > 0) return bal;
    } catch(e) { /* probar siguiente */ }
  }
  return 0;
}

export async function getBTCBalance(cfg: any, baseCoin: string) {
  const types = ["UNIFIED", "SPOT"];
  for (const accountType of types) {
    try {
      const result = await bybitRequest(cfg, "GET", "/v5/account/wallet-balance", { accountType });
      const coins  = (result.list || [])[0]?.coin || [];
      const coin   = coins.find((c: any) => c.coin === baseCoin);
      return coin ? parseFloat(coin.walletBalance || "0") : 0;
    } catch(e) { /* probar siguiente */ }
  }
  return 0;
}

export async function placeOrder(cfg: any, symbol: string, side: string, qty: number, isUSDT = false) {
  const params: any = {
    category:    "spot",
    symbol:      symbol,
    side:        side,
    orderType:   "Market",
    timeInForce: "GoodTillCancel"
  };
  if (side === "Buy") {
    params.qty         = String(qty);
    params.marketUnit  = "quoteCoin";
  } else {
    params.qty         = String(qty);
    params.marketUnit  = "baseCoin";
  }
  return await bybitRequest(cfg, "POST", "/v5/order/create", params);
}
