'use client';

import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Bar,
  Cell
} from 'recharts';

// Generate some mock candlestick/supertrend data
const generateMockData = () => {
  let basePrice = 88000;
  const data = [];
  let trend = 1; // 1 for up, -1 for down
  let superTrendValue = basePrice - 500;

  for (let i = 0; i < 60; i++) {
    const volatility = Math.random() * 400 - 200;
    const open = basePrice;
    const close = basePrice + volatility;
    const high = Math.max(open, close) + Math.random() * 100;
    const low = Math.min(open, close) - Math.random() * 100;
    
    // Simulate SuperTrend logic
    if (trend === 1) {
      superTrendValue = Math.max(superTrendValue, low - 200);
      if (close < superTrendValue) {
        trend = -1;
        superTrendValue = high + 200;
      }
    } else {
      superTrendValue = Math.min(superTrendValue, high + 200);
      if (close > superTrendValue) {
        trend = 1;
        superTrendValue = low - 200;
      }
    }

    data.push({
      time: `10:${(i).toString().padStart(2, '0')}`,
      open,
      close,
      high,
      low,
      superTrendUp: trend === 1 ? superTrendValue : null,
      superTrendDown: trend === -1 ? superTrendValue : null,
      isUp: close >= open,
      // For a simple bar chart representation of the candle body
      bodyBottom: Math.min(open, close),
      bodyTop: Math.max(open, close),
      bodySize: Math.max(open, close) - Math.min(open, close),
    });

    basePrice = close;
  }
  return data;
};

export function SuperTrendChart() {
  const [timeframe, setTimeframe] = useState('15m');
  const data = useMemo(() => generateMockData(), []);
  if (data.length === 0) return null;

  const minPrice = Math.min(...data.map(d => d.low)) * 0.999;
  const maxPrice = Math.max(...data.map(d => d.high)) * 1.001;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">BTC/USDT</h3>
        <div className="flex bg-slate-100 dark:bg-[#221610] rounded-lg p-1">
          {['15m', '1h', '4h', '1D'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                timeframe === tf
                  ? 'bg-white dark:bg-[#332219] text-[#ec5b13] shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} vertical={false} />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#64748b' }} 
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={[minPrice, maxPrice]} 
              tick={{ fontSize: 10, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => `$${val.toLocaleString()}`}
              orientation="right"
              width={60}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc', fontSize: '12px' }}
              itemStyle={{ color: '#f8fafc' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
            />
            
            {/* SuperTrend Lines */}
            <Line 
              type="stepAfter" 
              dataKey="superTrendUp" 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
            <Line 
              type="stepAfter" 
              dataKey="superTrendDown" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />

            {/* Price Line (Simplified representation since Recharts doesn't have native candlesticks) */}
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#ec5b13" 
              strokeWidth={1.5} 
              dot={false} 
              opacity={0.8}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex items-center gap-4 mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-emerald-500 rounded-full" />
          <span>SuperTrend ▲</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-rose-500 rounded-full" />
          <span>SuperTrend ▼</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1 bg-[#ec5b13] rounded-full" />
          <span>Precio</span>
        </div>
      </div>
    </div>
  );
}
