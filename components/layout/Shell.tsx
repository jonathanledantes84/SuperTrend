'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  List, 
  User, 
  Bot,
  Menu,
  X
} from 'lucide-react';

import { LogoSVG } from '@/components/Logo';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Analysis', href: '/analysis', icon: Activity },
  { name: 'Logs', href: '/logs', icon: List },
  { name: 'AI Assistant', href: '/ai', icon: Bot },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A1A]">
        <div className="p-6 flex items-center gap-3">
          <div className="size-10 rounded-xl bg-[#FF6B00] flex items-center justify-center text-white">
            <LogoSVG className="size-6" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-none">SuperTrend Bot</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">v2.4.0</p>
          </div>
        </div>
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[#FF6B00] text-white shadow-lg shadow-[#FF6B00]/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <item.icon className="size-5" />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center">
              <User className="size-5 text-slate-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Admin User</span>
              <span className="text-[10px] text-slate-500">Premium Plan</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A1A] z-20">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-[#FF6B00] flex items-center justify-center text-white">
              <LogoSVG className="size-5" />
            </div>
            <h1 className="text-base font-bold">SuperTrend Bot</h1>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800"
          >
            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute inset-0 z-10 bg-white dark:bg-[#1A1A1A] flex flex-col pt-20 px-4">
            <nav className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-[#FF6B00] text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="size-6" />
                    <span className="text-base font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
          {children}
        </div>

        {/* Mobile Bottom Nav */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 flex justify-around items-center border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A1A] px-2 py-3 z-20">
          {[navItems[0], navItems[3], navItems[1], navItems[4]].map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center gap-1 ${
                  isActive ? 'text-[#FF6B00]' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <item.icon className="size-6" />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </main>
    </div>
  );
}
