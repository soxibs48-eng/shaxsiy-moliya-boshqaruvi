import React from 'react';
import {
  Target,
  Plus,
  AlertCircle,
  Trophy,
  PieChart,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateUz } from '../utils/formatters';

export const Budgets: React.FC = () => {
  const { budgets, goals, isBalanceHidden, showToast } = useFinance();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 4-qadam preview xabari */}
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Byudjet va Moliyaviy Maqsadlar
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                4-bosqich
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bu bo'lim 4-qadamda to'liq ishga tushiriladi: oylik xarajat limitlari, ortiqcha sarf ogohlantirishlari va jamg'arma maqsadlari.
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast("Yangi maqsad va byudjet 4-bosqichda ulanadi")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi reja qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Oylik Byudjetlar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-500" />
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                Oylik xarajat limitlari
              </h5>
            </div>
            <span className="text-xs text-slate-400">Namunaviy</span>
          </div>

          <div className="space-y-4">
            {budgets.map((b, idx) => {
              const spentMock = b.limitAmount * (0.45 + idx * 0.2);
              const percent = Math.min(100, Math.round((spentMock / b.limitAmount) * 100));
              return (
                <div key={b.id} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {b.category}
                    </span>
                    <span className="text-slate-400 font-mono">
                      {formatCurrency(spentMock, b.currency, isBalanceHidden)} / {formatCurrency(b.limitAmount, b.currency, isBalanceHidden)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent > 85 ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>{percent}% sarflandi</span>
                    <span>Qoldi: {formatCurrency(b.limitAmount - spentMock, b.currency, isBalanceHidden)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Moliyaviy Maqsadlar */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <h5 className="font-bold text-slate-900 dark:text-white text-sm">
                Jamg'arma maqsadlari
              </h5>
            </div>
            <span className="text-xs text-slate-400">Reja</span>
          </div>

          <div className="space-y-4">
            {goals.map((g) => {
              const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              return (
                <div key={g.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/80 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h6 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {g.title}
                      </h6>
                      <span className="text-[11px] text-slate-400">
                        Muddat: {formatDateUz(g.deadline)}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {percent}%
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    <span>Yig'ildi: {formatCurrency(g.currentAmount, g.currency, isBalanceHidden)}</span>
                    <span>Maqsad: {formatCurrency(g.targetAmount, g.currency, isBalanceHidden)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3 text-xs text-amber-700 dark:text-amber-300">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>
          Keyingi bosqichlarda maqsadlarga avtomatik depozit qo'shish va byudjetdan oshib ketganda push-xabarnoma berish funksiyasi qo'shiladi.
        </span>
      </div>
    </div>
  );
};

