// lib/bybit.js - Optimized Bybit V5 Spot client (native crypto, UNIFIED/SPOT fallback)
// Merged root bybit.js + lib/bybit.ts (no proxy needed in ext)

const BASE = {
  real: 'https://api.bybit.com',
  testnet: 'https://api-testnet.bybit.com'
};

async function hmacSHA256(secret, message) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function bybitRequest(cfg, method, path, params = {}) {
  const base = cfg.testnet ? BASE.testnet : BASE.real;
  const timestamp = Date.now().toString();
  const recvWindow = '5000';

  let queryStr = '';
  let bodyStr = '';
  if (method === 'GET') {
    queryStr = new URLSearchParams(params).toString();
  } else {
    bodyStr = JSON.stringify(params);
  }

  const preSign = timestamp + cfg.apiKey + recvWindow + (method === 'GET' ? queryStr : bodyStr);
  const sign = await hmacSHA256(cfg.apiSecret, preSign);

  const headers = {
    'X-BAPI-API-KEY': cfg.apiKey,
    'X-BAPI-TIMESTAMP': timestamp,
    'X-BAPI-RECV-WINDOW': recvWindow,
    'X-BAPI-SIGN': sign,
    'Content-Type': 'application/json'
  };

  const url = `${base}${path}${queryStr ? '?' + queryStr : ''}`;
  const res = await fetch(url, { method, headers, body: method !== 'GET' ? bodyStr : undefined });
  const data = await res.json();
  if (data.retCode !== 0) throw new Error(data.retMsg || 'Bybit API error');
  return data.result;
}

async function getKlines(cfg, symbol, interval, limit = 300) {
  const base = cfg.testnet ? BASE.testnet : BASE.real;
  const url = `${base}/v5/market/kline?category=spot&symbol=${symbol}&interval=${interval}&limit=${limit}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.retCode !== 0) throw new Error(data.retMsg);
  const bars = [...data.result.list].reverse();
  return {
    highs: bars.map(b => parseFloat(b[2])),
    lows: bars.map(b => parseFloat(b[3])),
    closes: bars.map(b => parseFloat(b[4]))
  };
}

async function getBalance(cfg) {
  const types = ['UNIFIED', 'SPOT'];
  for (const accountType of types) {
    try {
      const result = await bybitRequest(cfg, 'GET', '/v5/account/wallet-balance', { accountType });
      const coins = (result.list || [])[0]?.coin || [];
      const usdt = coins.find(c => c.coin === 'USDT');
      const bal = usdt ? parseFloat(usdt.walletBalance || usdt.availableToWithdraw || '0') : 0;
      if (bal > 0) return bal;
    } catch (e) {}
  }
  return 0;
}

async function getBTCBalance(cfg, baseCoin) {
  const types = ['UNIFIED', 'SPOT'];
  for (const accountType of types) {
    try {
      const result = await bybitRequest(cfg, 'GET', '/v5/account/wallet-balance', { accountType });
      const coins = (result.list || [])[0]?.coin || [];
      const coin = coins.find(c => c.coin === baseCoin);
      return coin ? parseFloat(coin.walletBalance || '0') : 0;
    } catch (e) {}
  }
  return 0;
}

async function placeOrder(cfg, symbol, side, qty, isUSDT = false) {
  const params = {
    category: 'spot',
    symbol,
    side,
    orderType: 'Market',
    timeInForce: 'GoodTillCancel'
  };
  params.qty = String(qty);
  params.marketUnit = side === 'Buy' ? 'quoteCoin' : 'baseCoin'; // USDT/BTC
  return await bybitRequest(cfg, 'POST', '/v5/order/create', params);
}

export { hmacSHA256, bybitRequest, getKlines, getBalance, getBTCBalance, placeOrder };

