'use client';

import { Activity, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const mockTrades = [
  { id: 1, type: 'LONG', pair: 'BTC/USDT', entry: 88500, exit: 89200, pnl: '+70.00', pnlPercent: '+0.79%', time: 'Hace 2 horas', status: 'Cerrada' },
  { id: 2, type: 'SHORT', pair: 'BTC/USDT', entry: 89100, exit: 88800, pnl: '+30.00', pnlPercent: '+0.33%', time: 'Hace 5 horas', status: 'Cerrada' },
  { id: 3, type: 'LONG', pair: 'BTC/USDT', entry: 88900, exit: null, pnl: '+67.10', pnlPercent: '+0.75%', time: 'Activa', status: 'Abierta' },
];

const performanceData = [
  { day: '01 Mar', pnl: 0 },
  { day: '02 Mar', pnl: 120 },
  { day: '03 Mar', pnl: 80 },
  { day: '04 Mar', pnl: 250 },
  { day: '05 Mar', pnl: 400 },
  { day: '06 Mar', pnl: 380 },
  { day: '07 Mar', pnl: 520 },
  { day: '08 Mar', pnl: 610 },
  { day: '09 Mar', pnl: 590 },
  { day: '10 Mar', pnl: 840 },
  { day: '11 Mar', pnl: 1240 },
];

export default function AnalysisPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Análisis de Rendimiento</h1>
        <p className="text-slate-500 dark:text-slate-400">Estadísticas detalladas y registro de operaciones de tu bot SuperTrend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Win Rate</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-slate-900 dark:text-white">68.5%</p>
            <p className="text-[#28A745] font-medium flex items-center mb-1">
              <ArrowUpRight className="size-4" /> +2.1%
            </p>
          </div>
          <div className="mt-4 w-full bg-slate-100 dark:bg-[#1A1A1A] h-2 rounded-full overflow-hidden">
            <div className="bg-[#28A745] h-full rounded-full" style={{ width: '68.5%' }} />
          </div>
        </div>

        <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Beneficio Total (30d)</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-[#28A745]">+1,240.50</p>
            <p className="text-slate-500 font-medium mb-1">USDT</p>
          </div>
          <p className="text-sm text-slate-400 mt-4">142 operaciones realizadas</p>
        </div>

        <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Drawdown Máximo</p>
          <div className="flex items-end gap-3">
            <p className="text-4xl font-black text-[#DC3545]">-4.2%</p>
          </div>
          <p className="text-sm text-slate-400 mt-4">Riesgo controlado</p>
        </div>
      </div>

      {/* Performance Chart */}
      <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="text-[#FF6B00] size-5" />
            Crecimiento de Capital (PNL Acumulado)
          </h2>
          <div className="flex gap-2">
            {['7D', '30D', 'ALL'].map(t => (
              <button key={t} className={`px-3 py-1 text-xs font-bold rounded-lg ${t === '30D' ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 dark:bg-[#1A1A1A] text-slate-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorPnl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#28A745" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#28A745" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `$${v}`} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                itemStyle={{ color: '#28A745' }}
              />
              <Area type="monotone" dataKey="pnl" stroke="#28A745" strokeWidth={3} fillOpacity={1} fill="url(#colorPnl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white dark:bg-[#242424] rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-[#333333] flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-[#FF6B00] size-5" />
            Últimas Operaciones
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#1A1A1A] text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-[#333333]">
                <th className="p-4 font-semibold">Par</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Entrada</th>
                <th className="p-4 font-semibold">Salida</th>
                <th className="p-4 font-semibold">PNL</th>
                <th className="p-4 font-semibold">Tiempo</th>
                <th className="p-4 font-semibold">Estado</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {mockTrades.map((trade) => (
                <tr key={trade.id} className="border-b border-slate-100 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-[#1A1A1A]/50 transition-colors">
                  <td className="p-4 font-bold">{trade.pair}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                      trade.type === 'LONG' ? 'bg-[#28A745]/10 text-[#28A745] dark:text-[#28A745]' : 'bg-[#DC3545]/10 text-[#DC3545] dark:text-[#DC3545]'
                    }`}>
                      {trade.type === 'LONG' ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                      {trade.type}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">${trade.entry.toLocaleString()}</td>
                  <td className="p-4 text-slate-600 dark:text-slate-300">{trade.exit ? `$${trade.exit.toLocaleString()}` : '-'}</td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-[#28A745]">{trade.pnl} U</span>
                      <span className="text-xs text-[#28A745] dark:text-[#28A745]">{trade.pnlPercent}</span>
                    </div>
                  </td>
                  <td className="p-4 text-slate-500 flex items-center gap-1">
                    <Clock className="size-3" /> {trade.time}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                      trade.status === 'Abierta' ? 'text-amber-500' : 'text-slate-500'
                    }`}>
                      {trade.status === 'Abierta' && <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />}
                      {trade.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
