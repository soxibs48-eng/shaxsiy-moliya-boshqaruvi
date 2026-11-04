import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  Utensils,
  Car,
  Zap,
  Home,
  Shirt,
  HeartPulse,
  Wifi,
  GraduationCap,
  Gamepad2,
  MoreHorizontal,
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  LineChart,
  PlusCircle,
  Tag,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

export const TransactionModal: React.FC = () => {
  const {
    wallets,
    categories,
    isTxModalOpen,
    editingTx,
    defaultTxType,
    closeTxModal,
    addTransaction,
    updateTransaction,
    addCategory,
    isBalanceHidden,
  } = useFinance();

  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [walletId, setWalletId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Yangi kategoriya yaratish inline rejimi
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  // Modal ochilganda yoki editingTx o'zgarganda holatni to'ldirish
  useEffect(() => {
    if (isTxModalOpen) {
      if (editingTx) {
        setType(editingTx.type === 'income' ? 'income' : 'expense');
        setWalletId(editingTx.walletId);
        setAmount(editingTx.amount.toString());
        setCategory(editingTx.category);
        setDate(editingTx.date || new Date().toISOString().split('T')[0]);
        setNote(editingTx.note || '');
      } else {
        setType(defaultTxType);
        const defaultWallet = wallets[0]?.id || '';
        setWalletId(defaultWallet);
        setAmount('');
        // Birinchi mos kategoriyani tanlash
        const firstCat = categories.find(c => c.type === defaultTxType);
        setCategory(firstCat ? firstCat.name : '');
        setDate(new Date().toISOString().split('T')[0]);
        setNote('');
      }
      setIsAddingCategory(false);
      setNewCatName('');
      setError(null);
    }
  }, [isTxModalOpen, editingTx, defaultTxType, wallets, categories]);

  // Tur o'zgarganda birinchi mos kategoriyani tanlash
  useEffect(() => {
    if (!editingTx && isTxModalOpen) {
      const matchCat = categories.find(c => c.type === type);
      if (matchCat) {
        setCategory(matchCat.name);
      }
    }
  }, [type, categories, editingTx, isTxModalOpen]);

  // Tanlangan hamyon
  const selectedWallet = useMemo(() => wallets.find(w => w.id === walletId), [wallets, walletId]);

  // Kategoriya ro'yxati (turiga qarab)
  const filteredCategories = useMemo(
    () => categories.filter(c => c.type === type),
    [categories, type]
  );

  // Kategoriya ikonkasini chizish
  const renderCategoryIcon = (iconName: string, className = 'w-4 h-4') => {
    switch (iconName) {
      case 'shopping-cart':
        return <ShoppingCart className={className} />;
      case 'utensils':
        return <Utensils className={className} />;
      case 'car':
        return <Car className={className} />;
      case 'zap':
        return <Zap className={className} />;
      case 'home':
        return <Home className={className} />;
      case 'shirt':
        return <Shirt className={className} />;
      case 'heart-pulse':
        return <HeartPulse className={className} />;
      case 'wifi':
        return <Wifi className={className} />;
      case 'graduation-cap':
        return <GraduationCap className={className} />;
      case 'gamepad-2':
        return <Gamepad2 className={className} />;
      case 'briefcase':
        return <Briefcase className={className} />;
      case 'laptop':
        return <Laptop className={className} />;
      case 'trending-up':
        return <TrendingUp className={className} />;
      case 'gift':
        return <Gift className={className} />;
      case 'line-chart':
        return <LineChart className={className} />;
      case 'plus-circle':
        return <PlusCircle className={className} />;
      case 'more-horizontal':
      default:
        return <MoreHorizontal className={className} />;
    }
  };

  if (!isTxModalOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  // Balans yetishmovchiligini tekshirish (faqat expense holatida)
  const isInsufficient = Boolean(
    type === 'expense' &&
    selectedWallet &&
    numAmount > (editingTx && editingTx.walletId === selectedWallet.id ? selectedWallet.balance + editingTx.amount : selectedWallet.balance)
  );

  // Tezkor summa qo'shish
  const handleQuickAdd = (addValue: number) => {
    const current = parseFloat(amount) || 0;
    setAmount((current + addValue).toString());
    setError(null);
  };

  // Yangi kategoriya qo'shish
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      type,
      color: newCatColor,
      icon: 'tag',
    });

    setCategory(newCatName.trim());
    setNewCatName('');
    setIsAddingCategory(false);
  };

  // Asosiy formani jo'natish
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletId) {
      setError('Iltimos, hamyonni tanlang!');
      return;
    }

    if (numAmount <= 0) {
      setError('Iltimos, musbat summa kiriting!');
      return;
    }

    if (isInsufficient) {
      setError('Hamyonda mablag\' yetarli emas!');
      return;
    }

    if (!category) {
      setError('Iltimos, kategoriyani tanlang!');
      return;
    }

    const txPayload = {
      walletId,
      type,
      amount: numAmount,
      currency: selectedWallet ? selectedWallet.currency : 'UZS',
      category,
      date: date || new Date().toISOString().split('T')[0],
      note: note.trim() || category,
    };

    let success = false;
    if (editingTx) {
      success = updateTransaction(editingTx.id, txPayload);
    } else {
      success = addTransaction(txPayload);
    }

    if (success) {
      closeTxModal();
    }
  };

  const quickAmounts = selectedWallet?.currency === 'UZS'
    ? [10000, 50000, 100000, 500000, 1000000]
    : [10, 20, 50, 100, 500];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Yopish tugmasi */}
        <button
          onClick={closeTxModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Sarlavha va Segmented Control */}
        <div className="mb-5">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
            {editingTx ? 'Operatsiyani tahrirlash' : 'Yangi operatsiya'}
          </h3>

          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-200 animate-pulse" />
              <span>Chiqim (Xarajat)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                setError(null);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-200 animate-pulse" />
              <span>Kirim (Daromad)</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Summa maydoni */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Summa *
              </label>
              {selectedWallet && (
                <span className="text-xs text-slate-400">
                  Hamyon qoldig'i: <strong className="text-slate-700 dark:text-slate-300 font-mono">{formatCurrency(selectedWallet.balance, selectedWallet.currency, isBalanceHidden)}</strong>
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
                className={`w-full pl-4 pr-16 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border text-xl sm:text-2xl font-black font-mono focus:outline-none focus:ring-2 text-slate-900 dark:text-white ${
                  isInsufficient
                    ? 'border-rose-500 focus:ring-rose-500 text-rose-600'
                    : type === 'expense'
                    ? 'border-slate-200 dark:border-slate-700 focus:ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500'
                }`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 font-mono">
                {selectedWallet?.currency || 'UZS'}
              </span>
            </div>

            {isInsufficient && (
              <p className="text-xs text-rose-500 font-semibold mt-1">
                Diqqat: Hamyonda mablag' yetarli emas!
              </p>
            )}

            {/* Tezkor summa tugmalari */}
            <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickAdd(q)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap transition-colors"
                >
                  +{selectedWallet?.currency === 'UZS' ? q.toLocaleString('uz-UZ') : `$${q}`}
                </button>
              ))}
            </div>
          </div>

          {/* Hamyonni tanlash */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Hamyon *
            </label>
            <select
              value={walletId}
              onChange={(e) => {
                setWalletId(e.target.value);
                setError(null);
              }}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} — {formatCurrency(w.balance, w.currency, isBalanceHidden)}
                </option>
              ))}
            </select>
          </div>

          {/* Kategoriyalar tanlash Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kategoriya: <strong className="text-slate-900 dark:text-white">{category}</strong>
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(prev => !prev)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Yangi kategoriya</span>
              </button>
            </div>

            {/* Inline Yangi kategoriya qo'shish paneli */}
            {isAddingCategory && (
              <div className="mb-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5 animate-fadeIn">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Kategoriya nomi (masalan: Kitoblar)"
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="color"
                    value={newCatColor}
                    onChange={(e) => setNewCatColor(e.target.value)}
                    className="w-9 h-8 p-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 cursor-pointer"
                    title="Rang tanlang"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>
            )}

            {/* Kategoriyalar ro'yxati (Grid) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto pr-1">
              {filteredCategories.map((cat) => {
                const isSelected = category === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategory(cat.name);
                      setError(null);
                    }}
                    className={`flex items-center gap-2 p-2 rounded-xl text-left text-xs transition-all border ${
                      isSelected
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold ring-1 ring-emerald-500/40'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5')}
                    </div>
                    <span className="truncate">{cat.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sana va Izoh */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Sana</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Izoh (ixtiyoriy)</span>
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Xarid tafsiloti..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Saqlash tugmasi */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={closeTxModal}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={isInsufficient || numAmount <= 0}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-50 ${
                type === 'expense'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
              }`}
            >
              {editingTx ? 'O\'zgarishlarni saqlash' : type === 'expense' ? 'Xarajatni kiritish' : 'Daromadni kiritish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
