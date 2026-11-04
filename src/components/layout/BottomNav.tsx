import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Target,
  Handshake,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { NavigationTab } from '../../types/finance';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Asosiy', icon: LayoutDashboard },
  { id: 'wallets', label: 'Hamyon', icon: Wallet },
  { id: 'transactions', label: 'Amallar', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Byudjet', icon: Target },
  { id: 'debts', label: 'Qarzlar', icon: Handshake },
  { id: 'analytics', label: 'Analitika', icon: PieChart },
];

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 safe-area-pb shadow-lg">
      <div className="grid grid-cols-6 gap-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 relative ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div
                className={`p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-emerald-50 dark:bg-emerald-950/60 scale-110' : ''
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-full">
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-emerald-500 absolute top-1" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

