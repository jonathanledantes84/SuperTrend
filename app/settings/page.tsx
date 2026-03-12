'use client';

import { useState, useEffect } from 'react';
import { Key, Settings as SettingsIcon, ShieldAlert, CheckCircle2, RefreshCw, Save } from 'lucide-react';

import { storage } from '@/lib/storage';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [env, setEnv] = useState('mainnet');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const savedKey = await storage.get('bybit_api_key');
      const savedSecret = await storage.get('bybit_api_secret');
      const savedEnv = await storage.get('bybit_env');
      
      if (savedKey) setApiKey(savedKey);
      if (savedSecret) setApiSecret(savedSecret);
      if (savedEnv) setEnv(savedEnv);
    };
    loadSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await storage.set('bybit_api_key', apiKey);
    await storage.set('bybit_api_secret', apiSecret);
    await storage.set('bybit_env', env);
    
    // Notify background script that settings changed
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATED' });
    }
    
    setTimeout(() => {
      setIsSaving(false);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Configuración de Trading</h1>
        <p className="text-slate-500 dark:text-slate-400">Gestiona tus credenciales de Bybit y personaliza los parámetros de tu estrategia SuperTrend.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* API Credentials */}
          <section className="bg-white dark:bg-[#242424] p-6 rounded-xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#FF6B00]">
              <Key className="size-5" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Credenciales de API Bybit</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Entorno de Trading</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setEnv('mainnet')}
                    className={`relative flex cursor-pointer rounded-xl border-2 p-4 focus:outline-none transition-all ${
                      env === 'mainnet' 
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5' 
                        : 'border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-[#333333]/50'
                    }`}
                  >
                    <span className="flex flex-1 flex-col text-left">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white uppercase">Mainnet</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">Fondos Reales</span>
                    </span>
                    {env === 'mainnet' && <CheckCircle2 className="text-[#FF6B00] size-5" />}
                  </button>
                  
                  <button 
                    onClick={() => setEnv('testnet')}
                    className={`relative flex cursor-pointer rounded-xl border-2 p-4 focus:outline-none transition-all ${
                      env === 'testnet' 
                        ? 'border-[#FF6B00] bg-[#FF6B00]/5' 
                        : 'border-slate-200 dark:border-[#333333] hover:bg-slate-50 dark:hover:bg-[#333333]/50'
                    }`}
                  >
                    <span className="flex flex-1 flex-col text-left">
                      <span className="block text-sm font-bold text-slate-900 dark:text-white uppercase">Testnet</span>
                      <span className="mt-1 flex items-center text-xs text-slate-500 dark:text-slate-400">Demo / Pruebas</span>
                    </span>
                    {env === 'testnet' && <CheckCircle2 className="text-[#FF6B00] size-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">API Key</label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Pega tu API Key de Bybit" 
                  className="form-input block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 px-4" 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Secret Key</label>
                <input 
                  type="password" 
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="••••••••••••••••" 
                  className="form-input block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 px-4" 
                />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <button className="w-full sm:flex-1 bg-slate-100 dark:bg-[#333333] hover:bg-slate-200 dark:hover:bg-[#444444] text-slate-700 dark:text-slate-100 font-bold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <RefreshCw className="size-5" />
                  Probar Conexión
                </button>
                {apiKey && apiSecret && (
                  <div className="flex items-center gap-2 text-[#28A745] text-sm font-medium">
                    <CheckCircle2 className="size-5" />
                    <span>Configurado</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Strategy Parameters */}
          <section className="bg-white dark:bg-[#242424] p-6 rounded-xl border border-slate-200 dark:border-[#FF6B00]/20 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-[#FF6B00]">
              <SettingsIcon className="size-5" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Parámetros de Estrategia</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Par de Trading</label>
                <select className="form-select block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 px-4">
                  <option value="BTCUSDT">BTC / USDT</option>
                  <option value="ETHUSDT">ETH / USDT</option>
                  <option value="SOLUSDT">SOL / USDT</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Temporalidad (Timeframe)</label>
                <select className="form-select block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 px-4" defaultValue="15m">
                  <option value="1m">1 minuto</option>
                  <option value="5m">5 minutos</option>
                  <option value="15m">15 minutos</option>
                  <option value="1h">1 hora</option>
                  <option value="4h">4 horas</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cantidad por Orden (USDT)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    placeholder="100" 
                    className="form-input block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 pl-4 pr-16" 
                  />
                  <span className="absolute right-4 top-3 text-slate-400 font-medium">USDT</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Apalancamiento (Leverage)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    placeholder="10" 
                    className="form-input block w-full rounded-xl border-slate-200 dark:border-[#333333] bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-white focus:border-[#FF6B00] focus:ring-[#FF6B00] h-12 pl-4 pr-12" 
                  />
                  <span className="absolute right-4 top-3 text-slate-400 font-medium">x</span>
                </div>
              </div>
            </div>

            <div className="mt-8 border-t border-slate-100 dark:border-[#333333] pt-6 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-[#FF6B00] hover:bg-[#FF6B00]/90 text-white font-bold py-3 px-8 rounded-xl transition-all hover:shadow-lg active:scale-95 flex items-center gap-2 ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <RefreshCw className="size-5 animate-spin" />
                ) : isSaved ? (
                  <CheckCircle2 className="size-5" />
                ) : (
                  <Save className="size-5" />
                )}
                {isSaving ? 'Guardando...' : isSaved ? '¡Guardado!' : 'Guardar Configuración'}
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-[#FF6B00]/10 border border-[#FF6B00]/20 p-4 rounded-xl">
            <div className="flex gap-3">
              <ShieldAlert className="text-[#FF6B00] size-5 shrink-0" />
              <div className="flex flex-col gap-1">
                <p className="text-sm font-bold text-[#FF6B00]">Consejo de Seguridad</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">Asegúrate de que tu API Key tenga permisos de &apos;Trading&apos; activados, pero &apos;Retiros&apos; desactivados.</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#242424] p-6 rounded-xl border border-slate-200 dark:border-[#FF6B00]/20">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Estado del Bot</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Estrategia</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">SuperTrend V2</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Modo de Margen</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">Aislado (Isolated)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Estado</span>
                <span className={`flex items-center gap-1.5 text-xs font-bold ${apiKey ? 'text-[#28A745]' : 'text-amber-500'}`}>
                  <span className={`size-2 rounded-full ${apiKey ? 'bg-[#28A745]' : 'bg-amber-500'}`}></span>
                  {apiKey ? 'Listo para Operar' : 'Esperando Configuración'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
