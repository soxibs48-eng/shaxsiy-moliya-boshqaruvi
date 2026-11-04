import React from 'react';
import {
  Eye,
  EyeOff,
  Sun,
  Moon,
  Plus,
  Wallet as WalletIcon,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Currency, NavigationTab } from '../../types/finance';
import { formatCurrency, getFormattedToday } from '../../utils/formatters';

const pageTitles: Record<NavigationTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Asosiy panel',
    subtitle: 'Moliya umumiy holati va tezkor hisobotlar',
  },
  wallets: {
    title: 'Hamyonlar',
    subtitle: 'Barcha hisob raqamlari, kartalar va naqd pullar',
  },
  transactions: {
    title: 'Operatsiyalar tarixi',
    subtitle: 'Barcha kirim, chiqim va o\'tkazmalar ro\'yxati',
  },
  budgets: {
    title: 'Byudjet va Maqsadlar',
    subtitle: 'Xarajat limitlari va moliyaviy orzular nazorati',
  },
  debts: {
    title: 'Qarzlar daftari',
    subtitle: 'Berilgan va olingan qarzlar hisob-kitobi',
  },
  analytics: {
    title: 'Moliyaviy Analitika',
    subtitle: 'Xarajatlar strukturasi va dinamik grafiklar',
  },
};

export const Header: React.FC = () => {
  const {
    activeTab,
    baseCurrency,
    setBaseCurrency,
    getTotalBalance,
    isBalanceHidden,
    toggleBalanceHidden,
    theme,
    toggleTheme,
    openTxModal,
  } = useFinance();

  const currencies: Currency[] = ['UZS', 'USD', 'EUR'];
  const totalBalance = getTotalBalance();
  const pageInfo = pageTitles[activeTab] || pageTitles.dashboard;

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5 transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        
        {/* Chap tomon: Sahifa sarlavhasi va Sana */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              {pageInfo.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {getFormattedToday()} • {pageInfo.subtitle}
            </p>
          </div>
        </div>

        {/* O'ng tomon: Boshqaruv vidjetlari */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* 1. Umumiy balans vidjeti */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-slate-100/90 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-sm">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WalletIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-400 leading-none">
                Umumiy Balans
              </span>
              <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                {formatCurrency(totalBalance, baseCurrency, isBalanceHidden)}
              </span>
            </div>
            <button
              onClick={toggleBalanceHidden}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors ml-1"
              title={isBalanceHidden ? "Balansni ko'rsatish" : "Balansni yashirish"}
              aria-label="Balansni ko'rsatish yoki yashirish"
            >
              {isBalanceHidden ? (
                <EyeOff className="w-4 h-4 text-emerald-500" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 2. Valyuta selektori */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
            {currencies.map((curr) => {
              const isSelected = baseCurrency === curr;
              return (
                <button
                  key={curr}
                  onClick={() => setBaseCurrency(curr)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all duration-150 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {curr}
                </button>
              );
            })}
          </div>

          {/* 3. Dark/Light rejimi toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 sm:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-emerald-500 dark:hover:text-emerald-400 border border-slate-200/80 dark:border-slate-700/60 transition-colors shadow-sm"
            title={theme === 'dark' ? "Yorug' rejimga o'tish" : "Qorong'u rejimga o'tish"}
            aria-label="Kun yoki Tun rejimini almashtirish"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* 4. "+ Yangi operatsiya" yashil tugmasi (Haqiqiy TransactionModal ochadi) */}
          <button
            onClick={() => openTxModal('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all duration-150"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Yangi operatsiya</span>
            <span className="sm:hidden">Amal</span>
          </button>

        </div>
      </div>
    </header>
  );
};
