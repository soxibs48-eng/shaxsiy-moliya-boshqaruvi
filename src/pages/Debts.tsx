import React from 'react';
import {
  Handshake,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Phone,
  CheckCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency, formatDateUz } from '../utils/formatters';

export const Debts: React.FC = () => {
  const { debts, isBalanceHidden, showToast } = useFinance();

  const totalLent = debts
    .filter(d => d.type === 'lent')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  const totalBorrowed = debts
    .filter(d => d.type === 'borrowed')
    .reduce((sum, d) => sum + (d.amount - d.paidAmount), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 5-qadam preview xabari */}
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
            <Handshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Qarzlar daftari (Debitor & Kreditor)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                5-bosqich
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bu bo'lim 5-qadamda to'liq ishga tushiriladi: qarz qaytarish sanasi eslatmalari, qisman to'lovlar tarixi va yopish amallari.
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast("Yangi qarz kiritish 5-bosqichda ochiladi")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Qarz yozish</span>
        </button>
      </div>

      {/* Tezkor xulosa kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Menga qaytarishlari kerak (Berilgan qarz)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
            {formatCurrency(totalLent, 'UZS', isBalanceHidden)}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Men qaytarishim kerak (Olingan qarz)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono">
            {formatCurrency(totalBorrowed, 'USD', isBalanceHidden)}
          </div>
        </div>
      </div>

      {/* Qarzlar ro'yxati */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {debts.map((debt) => {
          const isLent = debt.type === 'lent';
          const remaining = debt.amount - debt.paidAmount;
          return (
            <div
              key={debt.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isLent
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isLent ? 'Berilgan qarz' : 'Olingan qarz'}
                    </span>
                    {debt.isClosed && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                        <CheckCircle className="w-3 h-3 text-emerald-500" /> Yopilgan
                      </span>
                    )}
                  </div>
                  <h5 className="font-bold text-slate-900 dark:text-white text-base mt-1">
                    {debt.personName}
                  </h5>
                  {debt.phone && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {debt.phone}
                    </p>
                  )}
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(debt.amount, debt.currency, isBalanceHidden)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Qoldiq: {formatCurrency(remaining, debt.currency, isBalanceHidden)}
                  </span>
                </div>
              </div>

              {debt.note && (
                <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  {debt.note}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  Qaytarish: {formatDateUz(debt.dueDate)}
                </span>
                <button
                  onClick={() => showToast("Qarz to'lovi 5-bosqichda ulanadi")}
                  className="font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  To'lov kiritish
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

