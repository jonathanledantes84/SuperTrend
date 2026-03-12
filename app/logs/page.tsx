'use client';

import { useState } from 'react';
import { Terminal, AlertCircle, Info, CheckCircle2, Copy, Trash2, Download } from 'lucide-react';

const mockLogs = [
  { id: 1, type: 'info', message: 'Bot iniciado correctamente. Conectado a Bybit Mainnet.', time: '10:45:22' },
  { id: 2, type: 'success', message: 'Señal LONG recibida para BTC/USDT en 15m.', time: '10:46:05' },
  { id: 3, type: 'success', message: 'Orden Market ejecutada: Compra 0.05 BTC a $88,900.', time: '10:46:06' },
  { id: 4, type: 'info', message: 'Stop Loss configurado en $86,677 (2.5%).', time: '10:46:07' },
  { id: 5, type: 'warning', message: 'Alta volatilidad detectada. Ajustando parámetros de riesgo.', time: '11:15:30' },
  { id: 6, type: 'error', message: 'Error de red temporal al consultar balance. Reintentando...', time: '11:30:12' },
  { id: 7, type: 'info', message: 'Conexión restaurada.', time: '11:30:15' },
];

export default function LogsPage() {
  const [logs, setLogs] = useState(mockLogs);

  const clearLogs = () => setLogs([]);
  
  const copyLogs = () => {
    const text = logs.map(l => `[${l.time}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-slate-800 text-[#28A745] flex items-center justify-center">
            <Terminal className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">System Logs</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Registro de eventos y ejecución del bot en tiempo real</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={copyLogs}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#242424] border border-slate-200 dark:border-slate-800 text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#333333] transition-colors"
          >
            <Copy className="size-4" />
            Copiar
          </button>
          <button 
            onClick={clearLogs}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-[#242424] border border-slate-200 dark:border-slate-800 text-sm font-medium text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 className="size-4" />
            Limpiar
          </button>
        </div>
      </div>

      <div className="flex-1 bg-[#1e1e1e] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-mono text-sm">
        <div className="bg-[#2d2d2d] px-4 py-2 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex gap-2">
            <div className="size-3 rounded-full bg-[#DC3545]" />
            <div className="size-3 rounded-full bg-amber-500" />
            <div className="size-3 rounded-full bg-[#28A745]" />
          </div>
          <span className="text-slate-400 text-xs">supertrend-bot.log</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="flex gap-4 hover:bg-white/5 p-1 rounded transition-colors">
              <span className="text-slate-500 shrink-0">[{log.time}]</span>
              <span className="shrink-0 mt-0.5">
                {log.type === 'info' && <Info className="size-4 text-blue-400" />}
                {log.type === 'success' && <CheckCircle2 className="size-4 text-[#28A745]" />}
                {log.type === 'warning' && <AlertCircle className="size-4 text-amber-400" />}
                {log.type === 'error' && <AlertCircle className="size-4 text-[#DC3545]" />}
              </span>
              <span className={`
                ${log.type === 'info' ? 'text-slate-300' : ''}
                ${log.type === 'success' ? 'text-[#28A745]' : ''}
                ${log.type === 'warning' ? 'text-amber-300' : ''}
                ${log.type === 'error' ? 'text-[#DC3545]' : ''}
              `}>
                {log.message}
              </span>
            </div>
          ))}
          {logs.length > 0 && (
            <div className="flex gap-4 p-1">
              <span className="text-slate-500 shrink-0">[{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}]</span>
              <span className="text-slate-300 flex items-center gap-2">
                Esperando nuevas señales... <span className="inline-block w-2 h-4 bg-[#28A745] animate-pulse" />
              </span>
            </div>
          )}
          {logs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 opacity-50">
              <Terminal className="size-12" />
              <p>No hay registros para mostrar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
