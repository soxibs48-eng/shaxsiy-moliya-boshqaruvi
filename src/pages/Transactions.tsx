import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Tag,
  Edit2,
  Trash2,
  X,
  Plus,
  Coins,
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
  Briefcase,
  Laptop,
  TrendingUp,
  Gift,
  LineChart,
  PlusCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatCurrency, formatDateUz } from '../utils/formatters';

export const Transactions: React.FC = () => {
  const {
    transactions,
    wallets,
    categories,
    baseCurrency,
    isBalanceHidden,
    convertAmount,
    openTxModal,
    deleteTransaction,
  } = useFinance();

  // Filtr holatlari
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7days' | 'this_month'>('all');

  // O'chirish tasdiqlash uchun tranzaksiya
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Kategoriya ikonkasini chizish
  const getCategoryIcon = (categoryName: string, className = 'w-4 h-4') => {
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    const iconName = cat?.icon || 'tag';

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
      default:
        return <Tag className={className} />;
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return cat?.color || '#10b981';
  };

  // Sana guruhlash sarlavhalari (Bugun, Kecha, yoki aniq sana)
  const getDateLabel = (dateStr: string) => {
    const today = new Date();
    const txDate = new Date(dateStr);

    const isToday =
      today.getFullYear() === txDate.getFullYear() &&
      today.getMonth() === txDate.getMonth() &&
      today.getDate() === txDate.getDate();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      yesterday.getFullYear() === txDate.getFullYear() &&
      yesterday.getMonth() === txDate.getMonth() &&
      yesterday.getDate() === txDate.getDate();

    if (isToday) return 'Bugun';
    if (isYesterday) return 'Kecha';
    return formatDateUz(dateStr);
  };

  // Filtrlangan tranzaksiyalar ro'yxati
  const filteredTransactions = useMemo(() => {
    const today = new Date();

    return transactions.filter((tx) => {
      // 1. Matnli qidiruv (Izoh yoki Kategoriya)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchNote = tx.note.toLowerCase().includes(query);
        const matchCat = tx.category.toLowerCase().includes(query);
        if (!matchNote && !matchCat) return false;
      }

      // 2. Tur bo'yicha filtr
      if (typeFilter !== 'all' && tx.type !== typeFilter) {
        return false;
      }

      // 3. Hamyon bo'yicha filtr
      if (walletFilter !== 'all') {
        if (tx.walletId !== walletFilter && tx.toWalletId !== walletFilter) {
          return false;
        }
      }

      // 4. Kategoriya bo'yicha filtr
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) {
        return false;
      }

      // 5. Vaqt oralig'i filtri
      if (dateRangeFilter !== 'all') {
        const txDate = new Date(tx.date);
        if (dateRangeFilter === 'today') {
          const isToday =
            today.getFullYear() === txDate.getFullYear() &&
            today.getMonth() === txDate.getMonth() &&
            today.getDate() === txDate.getDate();
          if (!isToday) return false;
        } else if (dateRangeFilter === '7days') {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          if (txDate < sevenDaysAgo) return false;
        } else if (dateRangeFilter === 'this_month') {
          const isThisMonth =
            today.getFullYear() === txDate.getFullYear() &&
            today.getMonth() === txDate.getMonth();
          if (!isThisMonth) return false;
        }
      }

      return true;
    });
  }, [transactions, searchQuery, typeFilter, walletFilter, categoryFilter, dateRangeFilter]);

  // Filtrlangan statistika (Daromad, Xarajat, Farq)
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    filteredTransactions.forEach((tx) => {
      const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        income += converted;
      } else if (tx.type === 'expense') {
        expense += converted;
      }
    });

    const net = income - expense;
    return { income, expense, net };
  }, [filteredTransactions, convertAmount, baseCurrency]);

  // Sanalar bo'yicha guruhlash
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, { dateStr: string; items: Transaction[]; totalNet: number }> = {};

    filteredTransactions.forEach((tx) => {
      const dateKey = tx.date;
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateStr: dateKey,
          items: [],
          totalNet: 0,
        };
      }
      groups[dateKey].items.push(tx);

      const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        groups[dateKey].totalNet += converted;
      } else if (tx.type === 'expense') {
        groups[dateKey].totalNet -= converted;
      }
    });

    // Sanalar bo'yicha kamayish tartibida saralash
    return Object.values(groups).sort((a, b) => new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime());
  }, [filteredTransactions, convertAmount, baseCurrency]);

  const hasActiveFilters =
    searchQuery !== '' ||
    typeFilter !== 'all' ||
    walletFilter !== 'all' ||
    categoryFilter !== 'all' ||
    dateRangeFilter !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setWalletFilter('all');
    setCategoryFilter('all');
    setDateRangeFilter('all');
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Filtrlangan Statistika Paneli (3 ta mini-karta) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Daromad */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Kirim (Daromad)
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              +{formatCurrency(stats.income, baseCurrency, isBalanceHidden)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Xarajat */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Chiqim (Xarajat)
            </span>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              -{formatCurrency(stats.expense, baseCurrency, isBalanceHidden)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Sof Farq */}
        <div className="rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sof Farq (Balans)
            </span>
            <div
              className={`text-xl sm:text-2xl font-black font-mono mt-1 ${
                stats.net >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {stats.net >= 0 ? '+' : ''}
              {formatCurrency(stats.net, baseCurrency, isBalanceHidden)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Qidiruv va Filtrlar Paneli */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Qidiruv inputi */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Kategoriya yoki izoh bo'yicha tezkor qidirish..."
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* "+ Yangi operatsiya" tugmasi */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => openTxModal('expense')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Yangi operatsiya</span>
            </button>
          </div>
        </div>

        {/* Filtr tugmalari qatori */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          {/* Tur bo'yicha */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs">
            {[
              { id: 'all', label: 'Barchasi' },
              { id: 'expense', label: 'Xarajat' },
              { id: 'income', label: 'Daromad' },
              { id: 'transfer', label: 'O\'tkazma' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id as any)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                  typeFilter === t.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Hamyon filtri */}
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Barcha hamyonlar</option>
            {wallets.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Kategoriya filtri */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Barcha kategoriyalar</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Vaqt oralig'i */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Barcha vaqt</option>
            <option value="today">Bugun</option>
            <option value="7days">Oxirgi 7 kun</option>
            <option value="this_month">Shu oy</option>
          </select>

          {/* Tozalash tugmasi */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors px-2 py-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Filtrlarni tozalash</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Sanalar bo'yicha guruhlangan ro'yxat */}
      <div className="space-y-4">
        {groupedTransactions.length === 0 ? (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
              <Filter className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
              Operatsiyalar topilmadi
            </h5>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Tanlangan filtrlar bo'yicha hech qanday operatsiya topilmadi. Filtrlarni o'zgartiring yoki yangi operatsiya qo'shing.
            </p>
            <button
              onClick={() => openTxModal('expense')}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              + Yangi operatsiya qo'shish
            </button>
          </div>
        ) : (
          groupedTransactions.map((group) => {
            const dateLabel = getDateLabel(group.dateStr);

            return (
              <div
                key={group.dateStr}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm"
              >
                {/* Kunlik guruh sarlavhasi */}
                <div className="px-5 py-3 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Calendar className="w-4 h-4 text-emerald-500" />
                    <span>{dateLabel}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({group.items.length} ta amal)
                    </span>
                  </div>

                  <div
                    className={`font-mono text-xs ${
                      group.totalNet >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    Kunlik: {group.totalNet >= 0 ? '+' : ''}
                    {formatCurrency(group.totalNet, baseCurrency, isBalanceHidden)}
                  </div>
                </div>

                {/* Kun ichidagi amallar ro'yxati */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {group.items.map((tx) => {
                    const isIncome = tx.type === 'income';
                    const isTransfer = tx.type === 'transfer';
                    const wallet = wallets.find(w => w.id === tx.walletId);
                    const toWallet = tx.toWalletId ? wallets.find(w => w.id === tx.toWalletId) : null;
                    const catColor = getCategoryColor(tx.category);

                    return (
                      <div
                        key={tx.id}
                        className="p-4 sm:px-5 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Chap tomon: Ikonka va nomlar */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{
                              backgroundColor: isTransfer ? '#3b82f6' : catColor,
                            }}
                          >
                            {isTransfer ? (
                              <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
                            ) : (
                              getCategoryIcon(tx.category, 'w-5 h-5')
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                                {tx.category}
                              </h5>
                              <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                                {isTransfer
                                  ? `${wallet?.name || 'Hamyon'} ➔ ${toWallet?.name || 'Hamyon'}`
                                  : wallet?.name || 'Hamyon'}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-xs sm:max-w-md">
                              {tx.note}
                            </p>
                          </div>
                        </div>

                        {/* O'ng tomon: Summa va Amallar */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div
                              className={`text-sm sm:text-base font-extrabold font-mono ${
                                isTransfer
                                  ? 'text-blue-600 dark:text-blue-400'
                                  : isIncome
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                              {formatCurrency(tx.amount, tx.currency, isBalanceHidden)}
                            </div>
                            <span className="sm:hidden text-[10px] text-slate-400 font-mono">
                              {wallet?.name}
                            </span>
                          </div>

                          {/* Tahrirlash va O'chirish tugmalari */}
                          <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                            {!isTransfer && (
                              <button
                                onClick={() => openTxModal(undefined, tx)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Tahrirlash"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* O'chirish tasdiqlash dialogi */}
      {txToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">
              Operatsiyani o'chirish
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Haqiqatan ham ushbu <strong>"{txToDelete.category}" ({formatCurrency(txToDelete.amount, txToDelete.currency)})</strong> operatsiyasini o'chirmoqchimisiz? Hamyon balansi tiklanadi.
            </p>
            <div className="flex gap-2.5">
              <button
                onClick={() => setTxToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => {
                  deleteTransaction(txToDelete.id);
                  setTxToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                Ha, o'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
