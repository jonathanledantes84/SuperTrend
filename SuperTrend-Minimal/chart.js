// chart.js — Mini gráfico de velas + SuperTrend dentro del popup

function drawChart(canvas, klines, supertrendData, currentPrice) {
  const ctx    = canvas.getContext("2d");
  const W      = canvas.width;
  const H      = canvas.height;
  const isDark = document.documentElement.getAttribute("data-theme") !== "light";

  // Colores
  const bg      = isDark ? "#080b10" : "#f0f4f8";
  const grid    = isDark ? "#1c2535" : "#dde4ed";
  const upC     = isDark ? "#00ff88" : "#00aa55";
  const dnC     = isDark ? "#ff4466" : "#e02040";
  const stUp    = isDark ? "#00ff8880" : "#00aa5580";
  const stDn    = isDark ? "#ff446680" : "#e0204080";
  const textC   = isDark ? "#566880" : "#6b7a8d";

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const bars   = klines.closes.length;
  const show   = Math.min(bars, 60); // mostrar últimas 60 velas
  const start  = bars - show;

  const highs  = klines.highs.slice(start);
  const lows   = klines.lows.slice(start);
  const opens  = klines.opens.slice(start);
  const closes = klines.closes.slice(start);
  const trend  = supertrendData.trend.slice(start);
  const stLine = supertrendData.up.map((u, i) =>
    trend[i + start] === 1 ? supertrendData.up[i + start] : supertrendData.dn[i + start]
  ).slice(0, show);

  const allPrices = [...highs, ...lows, ...stLine.filter(v => v > 0)];
  const minP = Math.min(...allPrices) * 0.9995;
  const maxP = Math.max(...allPrices) * 1.0005;
  const range = maxP - minP;

  const padL = 4, padR = 40, padT = 8, padB = 18;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const toY = p => padT + chartH - ((p - minP) / range) * chartH;
  const barW = chartW / show;
  const candleW = Math.max(1, barW * 0.6);

  // Grid lines
  ctx.strokeStyle = grid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = padT + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    const price = maxP - (range / 4) * i;
    ctx.fillStyle = textC;
    ctx.font = "8px 'Space Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("$" + price.toFixed(0), W - padR + 3, y + 3);
  }

  // SuperTrend line
  ctx.lineWidth = 1.5;
  let prevX = null, prevY = null;
  for (let i = 0; i < show; i++) {
    const x = padL + i * barW + barW / 2;
    const y = toY(stLine[i]);
    if (prevX !== null) {
      ctx.strokeStyle = trend[i] === 1 ? stUp : stDn;
      ctx.beginPath();
      ctx.moveTo(prevX, prevY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    prevX = x; prevY = y;
  }

  // Velas
  for (let i = 0; i < show; i++) {
    const x     = padL + i * barW + barW / 2;
    const isUp  = closes[i] >= opens[i];
    const color = isUp ? upC : dnC;
    const yH    = toY(highs[i]);
    const yL    = toY(lows[i]);
    const yO    = toY(opens[i]);
    const yC    = toY(closes[i]);

    // Mecha
    ctx.strokeStyle = color;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, yH);
    ctx.lineTo(x, yL);
    ctx.stroke();

    // Cuerpo
    ctx.fillStyle = color;
    const bodyTop = Math.min(yO, yC);
    const bodyH   = Math.max(1, Math.abs(yO - yC));
    ctx.fillRect(x - candleW / 2, bodyTop, candleW, bodyH);
  }

  // Línea de precio actual
  if (currentPrice) {
    const y = toY(currentPrice);
    ctx.strokeStyle = isDark ? "#44aaff88" : "#0077cc88";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label precio
    ctx.fillStyle = isDark ? "#44aaff" : "#0077cc";
    ctx.font = "bold 8px 'Space Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("$" + currentPrice.toFixed(0), W - padR + 3, y + 3);
  }

  // Señales BUY/SELL
  for (let i = 1; i < show; i++) {
    const prevTrend = trend[i - 1];
    const curTrend  = trend[i];
    if (prevTrend === -1 && curTrend === 1) {
      // BUY signal
      const x = padL + i * barW + barW / 2;
      const y = toY(lows[i]) + 10;
      ctx.fillStyle = upC;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("▲", x, y);
    } else if (prevTrend === 1 && curTrend === -1) {
      // SELL signal
      const x = padL + i * barW + barW / 2;
      const y = toY(highs[i]) - 4;
      ctx.fillStyle = dnC;
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("▼", x, y);
    }
  }
}

// Exportar para uso en popup.js
if (typeof module !== "undefined") module.exports = { drawChart };
