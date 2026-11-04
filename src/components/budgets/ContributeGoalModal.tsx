import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  PiggyBank,
  ArrowRight,
  AlertTriangle,
  Coins,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface ContributeGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
}

export const ContributeGoalModal: React.FC<ContributeGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
}) => {
  const { wallets, contributeToGoal, convertAmount, isBalanceHidden } = useFinance();

  const [walletId, setWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (wallets.length > 0) {
        setWalletId(wallets[0].id);
      }
      setAmount('');
      setNote('');
      setError(null);
    }
  }, [isOpen, wallets]);

  const selectedWallet = useMemo(() => wallets.find(w => w.id === walletId), [wallets, walletId]);

  // Maqsad valyutasida qancha bo'lib tushishini hisoblash
  const convertedAmount = useMemo(() => {
    const num = parseFloat(amount) || 0;
    if (num <= 0 || !selectedWallet || !goal) return 0;
    return convertAmount(num, selectedWallet.currency, goal.currency);
  }, [amount, selectedWallet, goal, convertAmount]);

  if (!isOpen || !goal) return null;

  const numAmount = parseFloat(amount) || 0;
  const isInsufficient = selectedWallet ? selectedWallet.balance < numAmount : false;

  const handleMaxClick = () => {
    if (selectedWallet) {
      setAmount(selectedWallet.balance.toString());
      setError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWallet) {
      setError('Iltimos, hamyonni tanlang!');
      return;
    }

    if (numAmount <= 0) {
      setError('Iltimos, summa kiriting!');
      return;
    }

    if (isInsufficient) {
      setError('Hamyonda mablag\' yetarli emas!');
      return;
    }

    const success = contributeToGoal({
      goalId: goal.id,
      walletId: selectedWallet.id,
      amount: numAmount,
      note: note.trim(),
    });

    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Maqsadga pul ajratish
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              "{goal.title}" kopilkasini to'ldirish
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Hamyon tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Qaysi hamyondan olinadi *
            </label>
            <select
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {formatCurrency(w.balance, w.currency, isBalanceHidden)}
                </option>
              ))}
            </select>
          </div>

          {/* Summa kiritish */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ajratilayotgan summa *
              </label>
              {selectedWallet && (
                <span className="text-xs text-slate-400">
                  Mavjud: <strong className="font-mono text-slate-700 dark:text-slate-300">{formatCurrency(selectedWallet.balance, selectedWallet.currency, isBalanceHidden)}</strong>
                </span>
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
                placeholder="0"
                className={`w-full pl-4 pr-20 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-base font-bold font-mono focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                  isInsufficient
                    ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 font-mono">
                  {selectedWallet?.currency}
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
                Hamyonda mablag' yetarli emas!
              </p>
            )}
          </div>

          {/* Konvertatsiya xulosasi (agar valyutalar boshqa bo'lsa) */}
          {selectedWallet && selectedWallet.currency !== goal.currency && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Coins className="w-4 h-4 text-emerald-500" />
                Kopilkaga qo'shiladi:
              </span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono text-sm">
                +{formatCurrency(convertedAmount, goal.currency)}
              </span>
            </div>
          )}

          {/* Izoh */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Izoh (ixtiyoriy)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Masalan: "${goal.title}" uchun tejov`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
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
              disabled={isInsufficient || numAmount <= 0}
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Ajratish</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

