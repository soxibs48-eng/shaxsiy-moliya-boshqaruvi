import React, { useState, useEffect } from 'react';
import {
  X,
  Wallet as WalletIcon,
  CreditCard,
  Banknote,
  PiggyBank,
  Landmark,
  Coins,
  Check,
} from 'lucide-react';
import { Wallet, WalletType, Currency } from '../../types/finance';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (walletData: Omit<Wallet, 'id'>) => void;
  walletToEdit?: Wallet | null;
}

const COLOR_OPTIONS = [
  { label: 'Zumrad yashil', hex: '#10b981', gradient: 'from-emerald-600 to-teal-500' },
  { label: 'Okean ko\'k', hex: '#3b82f6', gradient: 'from-blue-600 to-cyan-500' },
  { label: 'Binafsha', hex: '#8b5cf6', gradient: 'from-purple-600 to-indigo-500' },
  { label: 'Oltin sariq', hex: '#f59e0b', gradient: 'from-amber-500 to-orange-500' },
  { label: 'Qirmizi', hex: '#f43f5e', gradient: 'from-rose-500 to-pink-600' },
  { label: 'Grafit qora', hex: '#334155', gradient: 'from-slate-700 to-slate-900' },
];

const ICON_OPTIONS = [
  { id: 'banknote', icon: Banknote, label: 'Naqd' },
  { id: 'credit-card', icon: CreditCard, label: 'Karta' },
  { id: 'piggy-bank', icon: PiggyBank, label: 'Jamg\'arma' },
  { id: 'wallet', icon: WalletIcon, label: 'Hamyon' },
  { id: 'landmark', icon: Landmark, label: 'Bank' },
  { id: 'coins', icon: Coins, label: 'Tanga' },
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSave,
  walletToEdit,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('card');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [balance, setBalance] = useState<string>('0');
  const [color, setColor] = useState('#10b981');
  const [icon, setIcon] = useState('credit-card');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (walletToEdit) {
      setName(walletToEdit.name);
      setType(walletToEdit.type);
      setCurrency(walletToEdit.currency);
      setBalance(walletToEdit.balance.toString());
      setColor(walletToEdit.color);
      setIcon(walletToEdit.icon);
    } else {
      setName('');
      setType('card');
      setCurrency('UZS');
      setBalance('0');
      setColor('#10b981');
      setIcon('credit-card');
    }
    setError(null);
  }, [walletToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Iltimos, hamyon nomini kiriting!');
      return;
    }

    const numericBalance = parseFloat(balance);
    if (isNaN(numericBalance) || numericBalance < 0) {
      setError('Balans noldan kam bo\'lmasligi kerak!');
      return;
    }

    onSave({
      name: name.trim(),
      type,
      currency,
      balance: numericBalance,
      color,
      icon,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Yopish tugmasi */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
          {walletToEdit ? 'Hamyonni tahrirlash' : 'Yangi hamyon qo\'shish'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
          {walletToEdit
            ? 'Hamyon ma\'lumotlarini o\'zgartiring va saqlang'
            : 'Hisobingiz uchun yangi karta, naqd pul yoki omonat manbasini belgilang'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hamyon nomi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hamyon nomi *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="Masalan: Uzcard Asosiy, Naqd pul, Kapitalbank Visa"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Hamyon turi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hamyon turi
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'cash' as WalletType, label: 'Naqd pul', icon: Banknote },
                { id: 'card' as WalletType, label: 'Plastik karta', icon: CreditCard },
                { id: 'savings' as WalletType, label: 'Jamg\'arma', icon: PiggyBank },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setType(item.id);
                      if (!walletToEdit) {
                        if (item.id === 'cash') setIcon('banknote');
                        if (item.id === 'card') setIcon('credit-card');
                        if (item.id === 'savings') setIcon('piggy-bank');
                      }
                    }}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valyuta va Balans */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Valyuta {walletToEdit && <span className="text-[10px] text-slate-400">(O'zgarmas)</span>}
              </label>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['UZS', 'USD', 'EUR'] as Currency[]).map((c) => (
                  <button
                    key={c}
                    type="button"
                    disabled={!!walletToEdit}
                    onClick={() => setCurrency(c)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      currency === c
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-50'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Joriy balans
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono text-slate-900 dark:text-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
                  {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Rang tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Karta rangi
            </label>
            <div className="flex items-center gap-3 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  title={c.label}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform ${
                    color === c.hex ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {color === c.hex && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Ikonka tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Hamyon belgisi (Ikonka)
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ICON_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = icon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-1.5 text-xs transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Saqlash tugmasi */}
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
              className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
            >
              {walletToEdit ? 'Saqlash' : 'Hamyon yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

