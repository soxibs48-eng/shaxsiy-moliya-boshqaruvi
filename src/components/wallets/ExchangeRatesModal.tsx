import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  Check,
  RefreshCw,
  Radio,
  Zap,
  Globe,
  Sliders,
  Clock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatExchangeRate } from '../../utils/formatters';

interface ExchangeRatesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExchangeRatesModal: React.FC<ExchangeRatesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    exchangeRates,
    ratesMetadata,
    updateExchangeRates,
    fetchLiveRates,
    setIsAutoRefresh,
    setRefreshInterval,
  } = useFinance();

  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [usdRateInput, setUsdRateInput] = useState<string>('');
  const [eurRateInput, setEurRateInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isRefreshingNow, setIsRefreshingNow] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setUsdRateInput(exchangeRates.USD.toString());
      setEurRateInput(exchangeRates.EUR.toString());
      setError(null);
    }
  }, [isOpen, exchangeRates]);

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedUsd = parseFloat(usdRateInput);
    const parsedEur = parseFloat(eurRateInput);

    if (isNaN(parsedUsd) || parsedUsd <= 0 || isNaN(parsedEur) || parsedEur <= 0) {
      setError("Kurslar noldan katta musbat son bo'lishi shart!");
      return;
    }

    updateExchangeRates({
      USD: parsedUsd,
      EUR: parsedEur,
    });
    setIsManualMode(false);
  };

  const handleManualRefresh = async () => {
    setIsRefreshingNow(true);
    await fetchLiveRates(true);
    setTimeout(() => setIsRefreshingNow(false), 500);
  };

  const getSourceLabel = () => {
    if (ratesMetadata.source === 'cbu') return "O'zbekiston Markaziy Banki (CBU.uz) Rasmiy API";
    if (ratesMetadata.source === 'er-api') return "Xalqaro Ochiq ER-API (Global Exchange)";
    return "Foydalanuvchi tomonidan qo'lda kiritilgan";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha va Jonli status */}
        <div className="flex items-start gap-3.5 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
            <TrendingUp className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Valyuta kurslari
              </h3>
              {ratesMetadata.isAutoRefresh && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Jonli efir
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {getSourceLabel()}
            </p>
          </div>
        </div>

        {/* Jonli Status Paneli */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-5 text-xs">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">Har 1 soniyada tekshirilmoqda</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono">
              <Clock className="w-3.5 h-3.5" />
              <span>{ratesMetadata.lastUpdated}</span>
              <span>({ratesMetadata.secondsSinceUpdate}s oldin)</span>
            </div>
          </div>
        </div>

        {/* USD va EUR Jonli Kartalari */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-5">
          
          {/* USD Kartasi */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/5 to-emerald-500/15 dark:from-emerald-500/10 dark:to-emerald-500/5 border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  $
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  1 USD (Dollar)
                </span>
              </div>
              {ratesMetadata.diff.USD !== 0 && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                    ratesMetadata.diff.USD > 0
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {ratesMetadata.diff.USD > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {ratesMetadata.diff.USD > 0 ? '+' : ''}
                  {ratesMetadata.diff.USD}
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
              {formatExchangeRate(exchangeRates.USD)}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5 font-sans">
                UZS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              O'zbekiston so'miga nisbatan
            </p>
          </div>

          {/* EUR Kartasi */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/5 to-blue-500/15 dark:from-blue-500/10 dark:to-blue-500/5 border border-blue-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-xl bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                  €
                </span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  1 EUR (Evro)
                </span>
              </div>
              {ratesMetadata.diff.EUR !== 0 && (
                <span
                  className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold font-mono ${
                    ratesMetadata.diff.EUR > 0
                      ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                      : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {ratesMetadata.diff.EUR > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {ratesMetadata.diff.EUR > 0 ? '+' : ''}
                  {ratesMetadata.diff.EUR}
                </span>
              )}
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mt-1">
              {formatExchangeRate(exchangeRates.EUR)}
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1.5 font-sans">
                UZS
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              O'zbekiston so'miga nisbatan
            </p>
          </div>

        </div>

        {/* Avto-yangilanish va Chastota sozlamalari */}
        <div className="mb-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Yangilanish chastotasi
              </span>
            </div>
            <button
              onClick={() => setIsAutoRefresh(!ratesMetadata.isAutoRefresh)}
              className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
                ratesMetadata.isAutoRefresh
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {ratesMetadata.isAutoRefresh ? 'Faol (Uzluksiz)' : "To'xtatilgan"}
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Har 1 soniya', value: 1000 },
              { label: 'Har 5 soniya', value: 5000 },
              { label: 'Har 30 soniya', value: 30000 },
            ].map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setRefreshInterval(item.value);
                  if (!ratesMetadata.isAutoRefresh) setIsAutoRefresh(true);
                }}
                className={`py-2 px-2.5 rounded-xl text-xs font-semibold text-center transition-all ${
                  ratesMetadata.refreshInterval === item.value && ratesMetadata.isAutoRefresh
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Qo'lda tahrirlash (Manual Override) Bo'limi */}
        <div className="mb-5 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setIsManualMode(!isManualMode)}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-500 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isManualMode ? "Qo'lda kiritishni yopish" : "Maxsus kurs kiritish (Manual)"}</span>
            </button>
            
            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshingNow}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingNow ? 'animate-spin' : ''}`} />
              <span>Hozir yangilash</span>
            </button>
          </div>

          {isManualMode && (
            <form onSubmit={handleManualSubmit} className="space-y-3.5 mt-3 animate-fadeIn">
              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    USD kursi:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={usdRateInput}
                      onChange={(e) => setUsdRateInput(e.target.value)}
                      placeholder="12850"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                      UZS
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    EUR kursi:
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={eurRateInput}
                      onChange={(e) => setEurRateInput(e.target.value)}
                      placeholder="13900"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 font-mono">
                      UZS
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsManualMode(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Qo'lda saqlash</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal pastki tugmasi */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Markaziy Bank ochiq tekin APIsi ulangan</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          >
            Tushunarli
          </button>
        </div>

      </div>
    </div>
  );
};
