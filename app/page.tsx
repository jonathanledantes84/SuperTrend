'use client';

import { useState } from 'react';
import { ArrowUpRight, Wallet, TrendingUp, Activity, Play, Square, Clock, Filter, Settings, Plus, X, ArrowDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SuperTrendChart } from '@/components/SuperTrendChart';

export default function Dashboard() {
  const [isQuickTradeOpen, setIsQuickTradeOpen] = useState(false);
  const [tradeType, setTradeType] = useState<'LONG' | 'SHORT'>('LONG');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto relative">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#242424] p-5 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Precio BTC/USDT</p>
            <TrendingUp className="text-[#FF6B00] size-5" />
          </div>
          <p className="text-2xl font-bold">$88,967.10</p>
          <p className="text-[#28A745] text-sm font-medium flex items-center gap-1 mt-1">
            <ArrowUpRight className="size-4" /> +1.24%
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-[#242424] p-5 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Balance Total</p>
            <Wallet className="text-slate-400 size-5" />
          </div>
          <p className="text-2xl font-bold">12,450.00 U</p>
          <p className="text-slate-400 text-sm font-medium mt-1">USDT Disponible</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#242424] p-5 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">PNL Diario</p>
            <Activity className="text-slate-400 size-5" />
          </div>
          <p className="text-2xl font-bold text-[#28A745]">+340.50 U</p>
          <p className="text-slate-400 text-sm font-medium mt-1">+2.8% hoy</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-[#242424] p-5 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Estado del Bot</p>
            <div className="size-2 rounded-full bg-[#28A745] animate-pulse" />
          </div>
          <p className="text-2xl font-bold">Activo</p>
          <p className="text-[#FF6B00] text-sm font-medium mt-1">Win Rate: 68%</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters Section */}
          <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Filter className="text-[#FF6B00] size-5" />
                Filtros Supertrend
              </h2>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Estado Actual</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#28A745]/10 border border-[#28A745]/20">
                <div className="flex items-center gap-3">
                  <Clock className="text-[#28A745] size-5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Supertrend 15min</p>
                    <p className="text-base font-bold text-[#28A745] dark:text-[#28A745]">ALCISTA</p>
                  </div>
                </div>
                <ArrowUpRight className="text-[#28A745] size-5" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-[#28A745]/10 border border-[#28A745]/20">
                <div className="flex items-center gap-3">
                  <Activity className="text-[#28A745] size-5" />
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Supertrend 60min</p>
                    <p className="text-base font-bold text-[#28A745] dark:text-[#28A745]">ALCISTA</p>
                  </div>
                </div>
                <ArrowUpRight className="text-[#28A745] size-5" />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm h-[400px] flex flex-col relative overflow-hidden">
            <SuperTrendChart />
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Activity className="text-[#FF6B00] size-5" />
              Actividad Reciente
            </h2>
            <div className="space-y-4">
              {[
                { type: 'BUY', pair: 'BTC/USDT', price: '88,900', time: '10:46:06', status: 'COMPLETADO' },
                { type: 'SELL', pair: 'BTC/USDT', price: '89,200', time: '08:12:45', status: 'COMPLETADO' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#1A1A1A] border border-slate-100 dark:border-[#333333]">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center ${item.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {item.type === 'BUY' ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{item.type} {item.pair}</p>
                      <p className="text-[10px] text-slate-500">{item.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${item.price}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Execution Controls */}
        <div className="bg-white dark:bg-[#242424] p-6 rounded-2xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm flex flex-col gap-6 h-fit sticky top-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Play className="text-[#FF6B00] size-5" />
            Ejecución
          </h2>
          
          <div className="space-y-3">
            <button className="w-full py-4 bg-[#FF6B00] text-white font-bold rounded-xl shadow-lg shadow-[#FF6B00]/30 hover:bg-[#FF6B00]/90 transition-all flex items-center justify-center gap-2">
              <Play className="size-5" fill="currentColor" />
              INICIAR ESTRATEGIA
            </button>
            <button className="w-full py-4 bg-slate-100 dark:bg-[#333333] text-slate-700 dark:text-slate-100 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-[#553c2e] transition-all flex items-center justify-center gap-2 border border-slate-200 dark:border-[#FF6B00]/20">
              <Square className="size-5" fill="currentColor" />
              DETENER BOT
            </button>
          </div>

          <div className="flex-1 flex flex-col gap-4 mt-4">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-[#333333] pb-2">
              <span>Parámetros</span>
              <Settings className="size-4" />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Par:</span>
                <span className="text-sm font-semibold">BTC/USDT</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Apalancamiento:</span>
                <span className="text-sm font-semibold">10x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Orden Inicial:</span>
                <span className="text-sm font-semibold">500.00 U</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Stop Loss:</span>
                <span className="text-sm font-semibold text-[#DC3545]">2.5%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsQuickTradeOpen(true)}
        className="fixed bottom-8 right-8 size-14 rounded-full bg-[#FF6B00] text-white shadow-2xl shadow-[#FF6B00]/40 flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-30"
      >
        <Plus className="size-8" />
      </button>

      {/* Quick Trade Modal */}
      <AnimatePresence>
        {isQuickTradeOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsQuickTradeOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white dark:bg-[#242424] rounded-3xl shadow-2xl z-50 overflow-hidden border border-slate-200 dark:border-[#FF6B00]/20"
            >
              <div className="p-6 border-b border-slate-100 dark:border-[#333333] flex items-center justify-between">
                <h3 className="text-xl font-black">Operación Rápida</h3>
                <button onClick={() => setIsQuickTradeOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-[#333333] rounded-full transition-colors">
                  <X className="size-6" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div className="flex p-1 bg-slate-100 dark:bg-[#1A1A1A] rounded-2xl">
                  <button 
                    onClick={() => setTradeType('LONG')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${tradeType === 'LONG' ? 'bg-emerald-500 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    LONG
                  </button>
                  <button 
                    onClick={() => setTradeType('SHORT')}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${tradeType === 'SHORT' ? 'bg-rose-500 text-white shadow-lg' : 'text-slate-500'}`}
                  >
                    SHORT
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-500">Cantidad (USDT)</label>
                    <div className="relative">
                      <input type="number" placeholder="100.00" className="w-full h-14 bg-slate-50 dark:bg-[#1A1A1A] border-2 border-slate-100 dark:border-[#333333] rounded-2xl px-4 font-bold text-lg focus:border-[#FF6B00] outline-none transition-all" />
                      <span className="absolute right-4 top-4 font-bold text-slate-400">USDT</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-slate-500">Apalancamiento</label>
                    <input type="range" min="1" max="100" className="w-full accent-[#FF6B00]" />
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>1x</span>
                      <span>50x</span>
                      <span>100x</span>
                    </div>
                  </div>
                </div>

                <button className={`w-full py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${tradeType === 'LONG' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}>
                  EJECUTAR {tradeType} MARKET
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
