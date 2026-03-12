// lib/supertrend.js - Unified PineScript-exact SuperTrend (period=10, mult=3 default)
// Compatible root/background/popup - from supertrend.js + lib/supertrend.ts merged/optimized

function calcSuperTrend(highs, lows, closes, period = 10, multiplier = 3.0) {
  const n = closes.length;
  if (n === 0) return { trend: [], up: [], dn: [] };

  // ATR Wilder RMA (PineScript exact)
  const tr = Array(n).fill(0);
  tr[0] = highs[0] - lows[0];
  for (let i = 1; i < n; i++) {
    tr[i] = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i-1]),
      Math.abs(lows[i] - closes[i-1])
    );
  }
  const atr = Array(n).fill(0);
  if (n >= period) {
    atr[period-1] = tr.slice(0, period).reduce((a,b) => a+b, 0) / period;
    const alpha = 1 / period;
    for (let i = period; i < n; i++) {
      atr[i] = alpha * tr[i] + (1 - alpha) * atr[i-1];
    }
  }

  // SuperTrend bands + trend
  const up = Array(n).fill(0);
  const dn = Array(n).fill(0);
  const trend = Array(n).fill(1);

  for (let i = 0; i < n; i++) {
    const src = (highs[i] + lows[i]) / 2; // hl2
    const upRaw = src - multiplier * atr[i];
    const dnRaw = src + multiplier * atr[i];

    if (i === 0) {
      up[i] = upRaw; dn[i] = dnRaw; trend[i] = 1;
      continue;
    }

    const up1 = up[i-1];
    const dn1 = dn[i-1];

    up[i] = closes[i-1] > up1 ? Math.max(upRaw, up1) : upRaw;
    dn[i] = closes[i-1] < dn1 ? Math.min(dnRaw, dn1) : dnRaw;

    const prev = trend[i-1];
    if (prev === -1 && closes[i] > dn1) trend[i] = 1;
    else if (prev === 1 && closes[i] < up1) trend[i] = -1;
    else trend[i] = prev;
  }

  return { trend, up, dn };
}

export { calcSuperTrend };

