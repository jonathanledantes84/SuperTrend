import type {Metadata} from 'next';
import { Inter, Public_Sans } from 'next/font/google';
import './globals.css';
import { Shell } from '@/components/layout/Shell';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const publicSans = Public_Sans({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'SuperTrend Bot',
  description: 'Bot de trading SuperTrend para Bybit Spot con IA',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="es" className={`${inter.variable} ${publicSans.variable}`}>
      <body className="font-display bg-slate-50 dark:bg-[#1A1A1A] text-slate-900 dark:text-slate-100" suppressHydrationWarning>
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
