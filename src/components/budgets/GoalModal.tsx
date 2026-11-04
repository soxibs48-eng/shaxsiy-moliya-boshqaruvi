import React, { useState, useEffect } from 'react';
import {
  X,
  Target,
  Check,
  Laptop,
  Plane,
  Car,
  Home,
  ShieldCheck,
  GraduationCap,
  Gem,
  Trophy,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal, Currency } from '../../types/finance';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

const COLOR_OPTIONS = [
  '#3b82f6', // Okean ko'k
  '#10b981', // Zumrad yashil
  '#8b5cf6', // Binafsha
  '#f59e0b', // Oltin sariq
  '#f43f5e', // Qirmizi
  '#06b6d4', // Firuza
];

const ICON_OPTIONS = [
  { id: 'laptop', icon: Laptop, label: 'Gadjet' },
  { id: 'plane', icon: Plane, label: 'Sayohat' },
  { id: 'car', icon: Car, label: 'Avto' },
  { id: 'home', icon: Home, label: 'Uy' },
  { id: 'shield-check', icon: ShieldCheck, label: 'Zaxira' },
  { id: 'graduation-cap', icon: GraduationCap, label: 'Ta\'lim' },
  { id: 'gem', icon: Gem, label: 'Qimmatbaho' },
  { id: 'trophy', icon: Trophy, label: 'Orzu' },
];

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const { addGoal, updateGoal } = useFinance();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('0');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('laptop');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        setTitle(goalToEdit.title);
        setTargetAmount(goalToEdit.targetAmount.toString());
        setCurrentAmount(goalToEdit.currentAmount.toString());
        setCurrency(goalToEdit.currency);
        setDeadline(goalToEdit.deadline);
        setColor(goalToEdit.color);
        setIcon(goalToEdit.icon || 'laptop');
      } else {
        setTitle('');
        setTargetAmount('');
        setCurrentAmount('0');
        setCurrency('USD');
        // Standart holatda 6 oydan keyingi sana
        const future = new Date();
        future.setMonth(future.getMonth() + 6);
        setDeadline(future.toISOString().split('T')[0]);
        setColor('#3b82f6');
        setIcon('laptop');
      }
      setError(null);
    }
  }, [isOpen, goalToEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Iltimos, maqsad nomini kiriting!');
      return;
    }

    const numTarget = parseFloat(targetAmount);
    if (isNaN(numTarget) || numTarget <= 0) {
      setError('Kerakli summa musbat son bo\'lishi shart!');
      return;
    }

    const numCurrent = parseFloat(currentAmount);
    if (isNaN(numCurrent) || numCurrent < 0) {
      setError('Hozirgi jamg\'arma manfiy bo\'lmasligi kerak!');
      return;
    }

    if (!deadline) {
      setError('Iltimos, erishish muddatini belgilang!');
      return;
    }

    if (goalToEdit) {
      updateGoal(goalToEdit.id, {
        title: title.trim(),
        targetAmount: numTarget,
        currentAmount: numCurrent,
        currency,
        deadline,
        color,
        icon,
      });
    } else {
      addGoal({
        title: title.trim(),
        targetAmount: numTarget,
        currentAmount: numCurrent,
        currency,
        deadline,
        color,
        icon,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
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
              {goalToEdit ? 'Maqsadni tahrirlash' : 'Yangi moliyaviy maqsad'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kopilka oching va rejangizga qadamma-qadam erishing
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
          {/* Maqsad nomi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Maqsad nomi *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder="Masalan: Yangi MacBook Pro, Sayohat, Avtomobil..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Summalar va Valyuta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Kerakli maqsad summasi *
              </label>
              <div className="flex gap-1.5">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={targetAmount}
                  onChange={(e) => {
                    setTargetAmount(e.target.value);
                    setError(null);
                  }}
                  placeholder="2000"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as Currency)}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="UZS">UZS</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Hozirgacha yig'ilgan summa
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="0"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Muddat (Deadline) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Erishish muddati (Deadline) *</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Rang tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Maqsad rangi
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                    color === c ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ikonka tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Belgi (Ikonka)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {ICON_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`flex items-center justify-center gap-1.5 p-2 rounded-xl border text-xs transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
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
              <span>{goalToEdit ? 'Saqlash' : 'Maqsadni yaratish'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
