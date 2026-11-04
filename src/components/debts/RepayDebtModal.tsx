import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface RepayDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
}

export const RepayDebtModal: React.FC<RepayDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
}) => {
  const { wallets, repayDebt, convertAmount } = useFinance();

  const [repayAmount, setRepayAmount] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const remaining = debt ? Math.max(0, debt.amount - debt.paidAmount) : 0;

  useEffect(() => {
    if (isOpen && debt) {
      setRepayAmount(remaining.toString());
      // Default qarzning o'z hamyoni yoki birinchi mos hamyon
      const matchWallet =
        wallets.find((w) => w.id === debt.walletId) ||
        wallets.find((w) => w.currency === debt.currency) ||
        wallets[0];
      setWalletId(matchWallet ? matchWallet.id : '');
      setNote('');
      setError(null);
    }
  }, [isOpen, debt, remaining, wallets]);

  if (!isOpen || !debt) return null;

  const selectedWallet = wallets.find((w) => w.id === walletId);
  const parsedRepay = parseFloat(repayAmount) || 0;

  // Hamyon valyutasidagi summa
  const convertedInWallet = selectedWallet
    ? convertAmount(parsedRepay, debt.currency, selectedWallet.currency)
    : parsedRepay;

  const handleSetPercent = (percent: number) => {
    const val = Math.round((remaining * (percent / 100) + Number.EPSILON) * 100) / 100;
    setRepayAmount(val.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (parsedRepay <= 0) {
      setError("To'lov summasi 0 dan katta bo'lishi kerak!");
      return;
    }

    if (parsedRepay > remaining + 0.01) {
      setError(`To'lov summasi qolgan qarzdorlikdan (${formatCurrency(remaining, debt.currency)}) oshib ketmasligi kerak!`);
      return;
    }

    if (!walletId) {
      setError("Iltimos, operatsiya uchun hamyonni tanlang!");
      return;
    }

    if (debt.type === 'borrowed' && selectedWallet && selectedWallet.balance < convertedInWallet) {
      setError(`Tanlangan hamyonda mablag' yetarli emas! Mavjud: ${formatCurrency(selectedWallet.balance, selectedWallet.currency)}`);
      return;
    }

    const success = repayDebt({
      debtId: debt.id,
      repayAmount: parsedRepay,
      walletId,
      note: note.trim() || undefined,
    });

    if (success) {
      onClose();
    }
  };

  const isFullRepay = parsedRepay >= remaining - 0.01 && parsedRepay > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Yopish"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              debt.type === 'lent'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {debt.type === 'lent' ? (
              <ArrowDownLeft className="w-6 h-6 stroke-[2.5]" />
            ) : (
              <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {debt.type === 'lent' ? "Qarzni qabul qilish" : "Qarzni qaytarish (To'lash)"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {debt.type === 'lent'
                ? `${debt.personName} sizga qarzni qaytarmoqda`
                : `${debt.personName}ga qarzni to'lamoqdasiz`}
            </p>
          </div>
        </div>

        {/* Qarz haqida umumiy xulosa kartochkasi */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 mb-5">
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Shaxs:</span>
            <span className="font-bold text-slate-900 dark:text-white text-sm">{debt.personName}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>Umumiy qarz summasi:</span>
            <span className="font-bold font-mono text-slate-700 dark:text-slate-300">
              {formatCurrency(debt.amount, debt.currency)}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span>To'langan qismi:</span>
            <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {formatCurrency(debt.paidAmount, debt.currency)}
            </span>
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Qolgan qarzdorlik:
            </span>
            <span className="text-base font-extrabold font-mono text-rose-600 dark:text-rose-400">
              {formatCurrency(remaining, debt.currency)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* To'lov summasi */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                To'lov summasi ({debt.currency}):
              </label>
              <span className="text-[11px] text-slate-400">
                Qolgan: {formatCurrency(remaining, debt.currency)}
              </span>
            </div>

            <div className="relative">
              <input
                type="number"
                step="any"
                min="0.01"
                max={remaining}
                required
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold font-mono text-slate-400">
                {debt.currency}
              </span>
            </div>

            {/* Tezkor foiz tugmalari */}
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                onClick={() => handleSetPercent(25)}
                className="py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                25%
              </button>
              <button
                type="button"
                onClick={() => handleSetPercent(50)}
                className="py-1.5 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              >
                50%
              </button>
              <button
                type="button"
                onClick={() => handleSetPercent(100)}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isFullRepay
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20'
                }`}
              >
                100% To'liq
              </button>
            </div>
          </div>

          {/* Hamyon tanlovi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {debt.type === 'lent' ? 'Qaysi hamyonga tushsin?' : 'Qaysi hamyondan to\'lanadi?'}
              </span>
            </label>
            <select
              required
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatCurrency(w.balance, w.currency)})
                </option>
              ))}
            </select>

            {/* Valyuta konvertatsiyasi ko'rsatkichi */}
            {selectedWallet && selectedWallet.currency !== debt.currency && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 font-medium">
                ⚡ Konvertatsiya bo'yicha hamyon balansi: ~
                {formatCurrency(convertedInWallet, selectedWallet.currency)} ga o'zgaradi.
              </p>
            )}
          </div>

          {/* Qo'shimcha Izoh */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Izoh (ixtiyoriy)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: Qarzning bir qismi qaytarildi..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* To'liq yopilish ogohlantirish nishoni */}
          {isFullRepay && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>Ushbu to'lovdan so'ng ushbu qarz <b>to'liq yopiladi</b>!</span>
            </div>
          )}

          {/* Tugmalar */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-xl text-white text-xs sm:text-sm font-semibold shadow-lg transition-all flex items-center justify-center gap-1.5 ${
                debt.type === 'lent'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{debt.type === 'lent' ? "Qabul qilish" : "To'lash"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

