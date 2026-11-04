import React from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';

export const Analytics: React.FC = () => {
  const { baseCurrency, isBalanceHidden, showToast } = useFinance();

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 6-qadam preview xabari */}
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-600/30">
            <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 dark:text-white text-base">
                Moliyaviy Analitika va Grafiklar
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                6-bosqich
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bu bo'lim 6-qadamda to'liq ishga tushiriladi: Recharts interaktiv doiraviy va chiziqli grafiklari, oylik dinamika va sun'iy intellekt xulosalari.
            </p>
          </div>
        </div>

        <button
          onClick={() => showToast("Analitik filtrlar 6-bosqichda ochiladi")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Hisobot yaratish</span>
        </button>
      </div>

      {/* Mock Grafik vizual namoyishi */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Xarajatlar toifalari preview */}
        <div className="lg:col-span-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-emerald-500" />
              Xarajat toifalari
            </h5>
            <span className="text-[11px] text-slate-400">Recharts Preview</span>
          </div>

          <div className="py-6 flex flex-col items-center justify-center">
            {/* Vizual halqali doira simulatsiyasi */}
            <div className="relative w-40 h-40 rounded-full border-[14px] border-emerald-500 border-t-amber-400 border-r-rose-400 border-l-blue-400 flex items-center justify-center">
              <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400">Jami Sarf</span>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                  {formatCurrency(800000, baseCurrency, isBalanceHidden)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6 w-full text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Oziq-ovqat (45%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Transport (25%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Ko'ngilochar (18%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                <span className="text-slate-600 dark:text-slate-400 truncate">Boshqa (12%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Oylik dinamika trendi preview */}
        <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h5 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Kirim va Chiqim dinamikasi
            </h5>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Oxirgi 6 oy</span>
            </div>
          </div>

          <div className="h-64 flex items-end justify-between gap-3 pt-8 px-2">
            {[
              { month: 'Iyun', in: 60, out: 40 },
              { month: 'Iyul', in: 75, out: 55 },
              { month: 'Avgust', in: 90, out: 70 },
              { month: 'Sentabr', in: 85, out: 60 },
              { month: 'Oktabr', in: 95, out: 65 },
              { month: 'Noyabr', in: 100, out: 50 },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <div className="w-full flex items-end justify-center gap-1.5 h-full">
                  <div
                    className="w-1/2 bg-emerald-500/80 hover:bg-emerald-500 rounded-t-lg transition-all"
                    style={{ height: `${bar.in}%` }}
                    title={`Kirim: ${bar.in}%`}
                  />
                  <div
                    className="w-1/2 bg-rose-400/80 hover:bg-rose-400 rounded-t-lg transition-all"
                    style={{ height: `${bar.out}%` }}
                    title={`Chiqim: ${bar.out}%`}
                  />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{bar.month}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Kirimlar oqimi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-rose-400" />
              <span className="text-slate-600 dark:text-slate-400">Xarajatlar oqimi</span>
            </div>
          </div>
        </div>

      </div>

      {/* AI va Moliyaviy tavsiya bloki preview */}
      <div className="rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden shadow-lg border border-slate-800">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-500/25">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h5 className="font-bold text-base mb-1 flex items-center gap-2">
              Smart Moliya Tavsiyasi (AI Maslahatchi)
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                Tez kunda
              </span>
            </h5>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-3">
              O'tgan oyga nisbatan xarajatlaringiz 12% ga optimallashdi. Agar jamg'arma sur'ati shu maromda davom etsa, siz "Yangi noutbuk" maqsadiga belgilangan muddatdan 20 kun oldin erishasiz!
            </p>
            <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Barcha tavsiyalarni o'qish</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

