import React, { useState, useEffect } from 'react';
import {
  X,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  User,
  Phone,
  Calendar,
  Wallet as WalletIcon,
  FileText,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Debt, DebtType, Currency } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface DebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debtToEdit?: Debt | null;
  defaultType?: DebtType;
}

export const DebtModal: React.FC<DebtModalProps> = ({
  isOpen,
  onClose,
  debtToEdit,
  defaultType = 'lent',
}) => {
  const { wallets, addDebt, updateDebt, baseCurrency } = useFinance();

  const [type, setType] = useState<DebtType>(defaultType);
  const [personName, setPersonName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [currency, setCurrency] = useState<Currency>(baseCurrency);
  const [walletId, setWalletId] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (debtToEdit) {
        setType(debtToEdit.type);
        setPersonName(debtToEdit.personName);
        setPhone(debtToEdit.phone || '');
        setAmount(debtToEdit.amount.toString());
        setCurrency(debtToEdit.currency);
        setWalletId(debtToEdit.walletId);
        setDueDate(debtToEdit.dueDate);
        setNote(debtToEdit.note || '');
      } else {
        setType(defaultType);
        setPersonName('');
        setPhone('');
        setAmount('');
        setCurrency(baseCurrency);
        // Default birinchi mos hamyon
        if (wallets.length > 0) {
          const matchWallet = wallets.find((w) => w.currency === baseCurrency) || wallets[0];
          setWalletId(matchWallet.id);
        } else {
          setWalletId('');
        }
        // Standart qaytarish sanasi: bugundan 14 kun keyin
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 14);
        setDueDate(futureDate.toISOString().split('T')[0]);
        setNote('');
      }
      setError(null);
    }
  }, [isOpen, debtToEdit, defaultType, baseCurrency, wallets]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!personName.trim()) {
      setError("Shaxsning ismi yoki tashkilot nomini kiriting!");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("Qarz summasi noldan katta musbat son bo'lishi shart!");
      return;
    }

    if (!walletId) {
      setError("Iltimos, bog'liq hamyonni tanlang!");
      return;
    }

    if (!dueDate) {
      setError("Iltimos, qaytarish muddatini belgilang!");
      return;
    }

    if (debtToEdit) {
      updateDebt(debtToEdit.id, {
        type,
        personName: personName.trim(),
        phone: phone.trim() || undefined,
        amount: parsedAmount,
        currency,
        walletId,
        dueDate,
        note: note.trim() || undefined,
      });
      onClose();
    } else {
      const success = addDebt({
        type,
        personName: personName.trim(),
        phone: phone.trim() || undefined,
        amount: parsedAmount,
        currency,
        walletId,
        dueDate,
        note: note.trim() || undefined,
      });

      if (success) {
        onClose();
      }
    }
  };

  const selectedWallet = wallets.find((w) => w.id === walletId);

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

        {/* Sarlavha */}
        <div className="flex items-center gap-3 mb-5">
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
              type === 'lent'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            <HandCoins className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {debtToEdit ? "Qarzni tahrirlash" : "Yangi qarz qayd etish"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Qarz berish yoki olish operatsiyasi hisob-kitobi
            </p>
          </div>
        </div>

        {/* Qarz turi: Men berdim / Men oldim switch */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => setType('lent')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              type === 'lent'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Men berdim (Berilgan)</span>
          </button>

          <button
            type="button"
            onClick={() => setType('borrowed')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              type === 'borrowed'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Men oldim (Olingan)</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold animate-fadeIn">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Shaxs ismi va Telefoni */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{type === 'lent' ? 'Kimga berildi?' : 'Kimdan olindi?'} *</span>
              </label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Masalan: Anvar aka, Alisher..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>Telefon raqami (ixtiyoriy)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998 90 123 45 67"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Summa va Valyuta */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Qarz summasi va valyutasi *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Masalan: 1 000 000"
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-base font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                {(['UZS', 'USD', 'EUR'] as Currency[]).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => setCurrency(curr)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      currency === curr
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bog'liq hamyon va Qaytarish sanasi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {type === 'lent' ? 'Qaysi hamyondan berildi?' : 'Qaysi hamyonga tushdi?'} *
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
              {selectedWallet && (
                <p className="text-[11px] text-slate-400 mt-1">
                  Mavjud balans: {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Qaytarish muddati (Deadline) *</span>
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Qo'shimcha Izoh */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Qo'shimcha izoh (ixtiyoriy)</span>
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: Moshina ta'miri uchun, to'y xarajatlari..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tugmalar */}
          <div className="pt-3 flex gap-3">
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
                type === 'lent'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
              }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{debtToEdit ? "Saqlash" : "Qarzni qayd etish"}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

