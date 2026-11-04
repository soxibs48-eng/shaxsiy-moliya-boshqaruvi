import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeftRight,
  AlertTriangle,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFromWalletId?: string | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({
  isOpen,
  onClose,
  defaultFromWalletId,
}) => {
  const { wallets, transferBetweenWallets, exchangeRates, isBalanceHidden } = useFinance();

  const [fromWalletId, setFromWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [customRate, setCustomRate] = useState<string>('');
  const [fee, setFee] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Modal ochilganda boshlang'ich hamyonlarni belgilash
  useEffect(() => {
    if (isOpen && wallets.length >= 2) {
      const initialFrom = defaultFromWalletId || wallets[0].id;
      setFromWalletId(initialFrom);
      const otherWallet = wallets.find(w => w.id !== initialFrom);
      setToWalletId(otherWallet ? otherWallet.id : wallets[1].id);
      setAmount('');
      setCustomRate('');
      setFee('0');
      setNote('');
      setError(null);
    }
  }, [isOpen, defaultFromWalletId, wallets]);

  const fromWallet = useMemo(() => wallets.find(w => w.id === fromWalletId), [wallets, fromWalletId]);
  const toWallet = useMemo(() => wallets.find(w => w.id === toWalletId), [wallets, toWalletId]);

  const isCrossCurrency = fromWallet && toWallet && fromWallet.currency !== toWallet.currency;

  // Standart hisoblangan kurs
  const defaultRate = useMemo(() => {
    if (!fromWallet || !toWallet || !isCrossCurrency) return 1;
    if (fromWallet.currency === 'UZS' && toWallet.currency === 'USD') return exchangeRates.USD;
    if (fromWallet.currency === 'UZS' && toWallet.currency === 'EUR') return exchangeRates.EUR;
    if (fromWallet.currency === 'USD' && toWallet.currency === 'UZS') return exchangeRates.USD;
    if (fromWallet.currency === 'EUR' && toWallet.currency === 'UZS') return exchangeRates.EUR;
    if (fromWallet.currency === 'USD' && toWallet.currency === 'EUR') return exchangeRates.EUR / exchangeRates.USD;
    if (fromWallet.currency === 'EUR' && toWallet.currency === 'USD') return exchangeRates.USD / exchangeRates.EUR;
    return 1;
  }, [fromWallet, toWallet, isCrossCurrency, exchangeRates]);

  // Faol kurs (agar qo'lda kiritilgan bo'lsa customRate, aks holda defaultRate)
  const activeRate = useMemo(() => {
    const parsed = parseFloat(customRate);
    if (!isNaN(parsed) && parsed > 0) return parsed;
    return defaultRate;
  }, [customRate, defaultRate]);

  // Qabul qiluvchi summa hisoblash
  const calculatedReceived = useMemo(() => {
    const numAmount = parseFloat(amount) || 0;
    if (numAmount <= 0) return 0;
    if (!fromWallet || !toWallet) return 0;
    if (!isCrossCurrency) return numAmount;

    if (fromWallet.currency === 'UZS' && (toWallet.currency === 'USD' || toWallet.currency === 'EUR')) {
      return Math.round((numAmount / activeRate + Number.EPSILON) * 100) / 100;
    }
    if ((fromWallet.currency === 'USD' || fromWallet.currency === 'EUR') && toWallet.currency === 'UZS') {
      return Math.round(numAmount * activeRate);
    }
    return Math.round((numAmount * activeRate + Number.EPSILON) * 100) / 100;
  }, [amount, fromWallet, toWallet, isCrossCurrency, activeRate]);

  if (!isOpen) return null;

  if (wallets.length < 2) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h4 className="font-bold text-slate-900 dark:text-white mb-2">Hamyonlar yetarli emas</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Pul o'tkazmasi uchun kamida 2 ta hamyon bo'lishi kerak. Iltimos, oldin yangi hamyon qo'shing.
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs"
          >
            Tushundim
          </button>
        </div>
      </div>
    );
  }

  const numAmount = parseFloat(amount) || 0;
  const numFee = parseFloat(fee) || 0;
  const totalDeduct = numAmount + (numFee > 0 ? numFee : 0);
  const isInsufficient = fromWallet ? fromWallet.balance < totalDeduct : false;

  const handleMaxClick = () => {
    if (fromWallet) {
      setAmount(fromWallet.balance.toString());
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromWallet || !toWallet) {
      setError('Hamyonlarni tanlang');
      return;
    }
    if (fromWalletId === toWalletId) {
      setError('Bir xil hamyon tanlandi!');
      return;
    }
    if (numAmount <= 0) {
      setError('O\'tkazma summasini kiriting!');
      return;
    }
    if (isInsufficient) {
      setError('Hamyonda yetarli mablag\' yo\'q!');
      return;
    }

    const success = transferBetweenWallets({
      fromWalletId,
      toWalletId,
      amount: numAmount,
      customRate: isCrossCurrency ? activeRate : undefined,
      fee: numFee > 0 ? numFee : 0,
      note: note.trim(),
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Hamyonlararo o'tkazma
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Mablag'larni hisoblar o'rtasida konvertatsiya bilan o'tkazish
            </p>
          </div>
        </div>

        {error && (
          <div className="my-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Hamyonlar tanlovi (From -> To) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative">
            {/* Jo'natuvchi hamyon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Qayerdan (Chiqim)
              </label>
              <select
                value={fromWalletId}
                onChange={(e) => {
                  setFromWalletId(e.target.value);
                  if (e.target.value === toWalletId) {
                    const alt = wallets.find(w => w.id !== e.target.value);
                    if (alt) setToWalletId(alt.id);
                  }
                  setError(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({formatCurrency(w.balance, w.currency, isBalanceHidden)})
                  </option>
                ))}
              </select>
            </div>

            {/* Qabul qiluvchi hamyon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Qayerga (Kirim)
              </label>
              <select
                value={toWalletId}
                onChange={(e) => {
                  setToWalletId(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {wallets
                  .filter((w) => w.id !== fromWalletId)
                  .map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Summa kiritish */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                O'tkazma summasi *
              </label>
              {fromWallet && (
                <div className="text-xs text-slate-400">
                  Mavjud: <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{formatCurrency(fromWallet.balance, fromWallet.currency, isBalanceHidden)}</span>
                </div>
              )}
            </div>
            <div className="relative">
              <input
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className={`w-full pl-4 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-base font-bold font-mono focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                  isInsufficient
                    ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {fromWallet?.currency}
                </span>
                <button
                  type="button"
                  onClick={handleMaxClick}
                  className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold hover:bg-emerald-500/20 transition-colors"
                >
                  MAX
                </button>
              </div>
            </div>
            {isInsufficient && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                Hamyonda yetarli mablag' mavjud emas!
              </p>
            )}
          </div>

          {/* Konvertatsiya bloki (agar valyutalar turlicha bo'lsa) */}
          {isCrossCurrency && fromWallet && toWallet && (
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  Valyuta konvertatsiyasi
                </span>
                <button
                  type="button"
                  onClick={() => setCustomRate('')}
                  title="Standart kursga qaytarish"
                  className="text-[11px] text-slate-400 hover:text-emerald-500 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Standart kurs
                </button>
              </div>

              {/* Kurs inputi */}
              <div className="flex items-center justify-between text-xs gap-3">
                <span className="text-slate-600 dark:text-slate-400">
                  Kurs: 1 {fromWallet.currency === 'UZS' ? toWallet.currency : fromWallet.currency} =
                </span>
                <div className="flex items-center gap-1 w-32">
                  <input
                    type="number"
                    step="any"
                    value={customRate !== '' ? customRate : defaultRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    className="w-full px-2.5 py-1 text-right text-xs font-mono font-bold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-900 dark:text-white"
                  />
                  <span className="text-[11px] text-slate-400 font-mono">
                    UZS
                  </span>
                </div>
              </div>

              {/* Qabul qilinadigan summa xulosasi */}
              <div className="pt-2 border-t border-emerald-500/10 flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Qabul qiluvchiga tushadi:
                </span>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                  {formatCurrency(calculatedReceived, toWallet.currency)}
                </span>
              </div>
            </div>
          )}

          {/* Qo'shimcha parametrlar: Komissiya va Izoh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bank komissiyasi (ixtiyoriy)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400">
                  {fromWallet?.currency}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Izoh (ixtiyoriy)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Masalan: Kartadan naqd pul yechildi"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Amallar */}
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
              disabled={isInsufficient || numAmount <= 0}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>O'tkazishni tasdiqlash</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
