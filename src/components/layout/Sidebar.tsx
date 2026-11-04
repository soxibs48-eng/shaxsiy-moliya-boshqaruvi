import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  Handshake,
  PieChart,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NavigationTab } from '../../types/finance';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Asosiy', icon: LayoutDashboard },
  { id: 'wallets', label: 'Hamyonlar', icon: Wallet },
  { id: 'transactions', label: 'Operatsiyalar', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Byudjet & Maqsadlar', icon: Target },
  { id: 'debts', label: 'Qarzlar daftari', icon: Handshake },
  { id: 'analytics', label: 'Analitika', icon: PieChart },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, exchangeRates } = useFinance();

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 backdrop-blur-xl h-screen sticky top-0 z-30 transition-all select-none">
      {/* Brend Logo va Nomi */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20">
          <TrendingUp className="w-5 h-5 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 bg-clip-text text-transparent">
              Smart Finance
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Shaxsiy moliya boshqaruvi
          </p>
        </div>
      </div>

      {/* Asosiy navigatsiya menyusi */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-400">
          Menyu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group relative ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                  isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400 group-hover:text-emerald-500'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Pastki qism: Valyuta kurslari info bloki */}
      <div className="p-4 m-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 dark:border-slate-800/60">
          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Valyuta kursi
          </span>
          <span className="text-[10px] text-slate-400 uppercase font-mono">Markaziy Bank</span>
        </div>
        <div className="space-y-1.5 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
          <div className="flex justify-between items-center">
            <span>1 USD</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {exchangeRates.USD.toLocaleString('uz-UZ')} UZS
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>1 EUR</span>
            <span className="font-bold text-slate-900 dark:text-slate-200">
              {exchangeRates.EUR.toLocaleString('uz-UZ')} UZS
            </span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-800/40 flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Xavfsiz mahalliy xotira (Offline)</span>
        </div>
      </div>
    </aside>
  );
};

