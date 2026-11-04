import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Check, RefreshCw } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface ExchangeRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRatesModal: React.FC<ExchangeRatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { exchangeRates, updateExchangeRates } = useFinance();

  const [usdRate, setUsdRate] = useState<string>('12850');
  const [eurRate, setEurRate] = useState<string>('13900');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsdRate(exchangeRates.USD.toString());
      setEurRate(exchangeRates.EUR.toString());
      setError(null);
    }
  }, [isOpen, exchangeRates]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedUsd = parseFloat(usdRate);
    const parsedEur = parseFloat(eurRate);

    if (isNaN(parsedUsd) || parsedUsd <= 0 || isNaN(parsedEur) || parsedEur <= 0) {
      setError('Kurslar noldan katta musbat son bo\'lishi shart!');
      return;
    }

    updateExchangeRates({
      USD: parsedUsd,
      EUR: parsedEur,
    });
    onClose();
  };

  const handleResetDefaults = () => {
    setUsdRate('12850');
    setEurRate('13900');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Valyuta kurslarini sozlash
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Balans va o'tkazmalarni konvertatsiya qilish kursi
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* USD kursi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              1 AQSH dollari (USD) kursi:
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                value={usdRate}
                onChange={(e) => setUsdRate(e.target.value)}
                placeholder="12850"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                UZS
              </span>
            </div>
          </div>

          {/* EUR kursi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              1 Yevro (EUR) kursi:
            </label>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="1"
                value={eurRate}
                onChange={(e) => setEurRate(e.target.value)}
                placeholder="13900"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                UZS
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
            <span>Markaziy bank tavsiya kursi</span>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="hover:text-emerald-500 flex items-center gap-1 text-slate-500 dark:text-slate-400"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Standartga qaytarish
            </button>
          </div>

          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Saqlash</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

