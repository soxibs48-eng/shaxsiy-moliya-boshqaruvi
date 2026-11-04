import React, { useState, useEffect } from 'react';
import { X, Target, Check, AlertCircle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Budget, Currency } from '../../types/finance';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetToEdit?: Budget | null;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  budgetToEdit,
}) => {
  const { categories, addBudget, updateBudget } = useFinance();

  const [category, setCategory] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [error, setError] = useState<string | null>(null);

  // Faqat xarajat kategoriyalari
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  useEffect(() => {
    if (isOpen) {
      if (budgetToEdit) {
        setCategory(budgetToEdit.category);
        setLimitAmount(budgetToEdit.limitAmount.toString());
        setCurrency(budgetToEdit.currency);
      } else {
        setCategory(expenseCategories[0]?.name || 'Oziq-ovqat');
        setLimitAmount('');
        setCurrency('UZS');
      }
      setError(null);
    }
  }, [isOpen, budgetToEdit, categories]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!category) {
      setError('Iltimos, xarajat kategoriyasini tanlang!');
      return;
    }

    const numLimit = parseFloat(limitAmount);
    if (isNaN(numLimit) || numLimit <= 0) {
      setError('Iltimos, musbat limit summasini kiriting!');
      return;
    }

    if (budgetToEdit) {
      updateBudget(budgetToEdit.id, {
        category,
        limitAmount: numLimit,
        currency,
      });
    } else {
      addBudget({
        category,
        limitAmount: numLimit,
        currency,
      });
    }

    onClose();
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
            <Target className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {budgetToEdit ? 'Limitni tahrirlash' : 'Oylik byudjet limiti'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kategoriya bo'yicha maksimal xarajat chegarasi
            </p>
          </div>
        </div>

        {error && (
          <div className="my-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Kategoriya tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Xarajat kategoriyasi *
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Limit summasi va Valyuta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Oylik limit summasi *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0"
                value={limitAmount}
                onChange={(e) => {
                  setLimitAmount(e.target.value);
                  setError(null);
                }}
                placeholder="Masalan: 2 500 000"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value="UZS">UZS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
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
              <span>{budgetToEdit ? 'Saqlash' : 'Limit o\'rnatish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

