import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  PhoneCall,
  MessageSquare,
  Calendar,
  Wallet as WalletIcon,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  BadgePercent,
  Search,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Debt, DebtType } from '../types/finance';
import { formatCurrency, formatDateUz } from '../utils/formatters';
import { DebtModal } from '../components/debts/DebtModal';
import { RepayDebtModal } from '../components/debts/RepayDebtModal';

type DebtFilterTab = 'lent' | 'borrowed' | 'closed';

export const Debts: React.FC = () => {
  const {
    debts,
    wallets,
    baseCurrency,
    isBalanceHidden,
    convertAmount,
    deleteDebt,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<DebtFilterTab>('lent');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modallar holati
  const [isDebtModalOpen, setIsDebtModalOpen] = useState<boolean>(false);
  const [debtToEdit, setDebtToEdit] = useState<Debt | null>(null);
  const [defaultDebtType, setDefaultDebtType] = useState<DebtType>('lent');

  const [isRepayModalOpen, setIsRepayModalOpen] = useState<boolean>(false);
  const [debtToRepay, setDebtToRepay] = useState<Debt | null>(null);

  const [debtToDelete, setDebtToDelete] = useState<Debt | null>(null);

  // Umumiy statistika hisoblash (barchasi baseCurrency da)
  const stats = useMemo(() => {
    let totalLentPending = 0;
    let totalBorrowedPending = 0;
    let activeLentCount = 0;
    let activeBorrowedCount = 0;
    let closedCount = 0;

    debts.forEach((debt) => {
      const remaining = Math.max(0, debt.amount - debt.paidAmount);
      const remainingInBase = convertAmount(remaining, debt.currency, baseCurrency);

      if (debt.isClosed) {
        closedCount++;
      } else {
        if (debt.type === 'lent') {
          totalLentPending += remainingInBase;
          activeLentCount++;
        } else {
          totalBorrowedPending += remainingInBase;
          activeBorrowedCount++;
        }
      }
    });

    return {
      totalLentPending,
      totalBorrowedPending,
      activeLentCount,
      activeBorrowedCount,
      closedCount,
    };
  }, [debts, convertAmount, baseCurrency]);

  // Tab bo'yicha saralangan va qidirilgan qarzlar
  const filteredDebts = useMemo(() => {
    return debts
      .filter((debt) => {
        // Tab filter
        if (activeTab === 'closed') {
          if (!debt.isClosed) return false;
        } else {
          if (debt.isClosed) return false;
          if (debt.type !== activeTab) return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = debt.personName.toLowerCase().includes(q);
          const matchPhone = debt.phone?.toLowerCase().includes(q);
          const matchNote = debt.note?.toLowerCase().includes(q);
          return matchName || matchPhone || matchNote;
        }

        return true;
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [debts, activeTab, searchQuery]);

  // Qaytarish muddati statusini hisoblash
  const getDueStatus = (dueDateStr: string) => {
    if (!dueDateStr) {
      return { text: "Muddatsiz", badgeClass: "bg-slate-500/10 text-slate-500", isOverdue: false };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return {
        text: "Bugun so'nggi kun!",
        badgeClass: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse font-bold",
        isOverdue: false,
      };
    } else if (diffDays > 0) {
      return {
        text: `${diffDays} kun qoldi`,
        badgeClass:
          diffDays <= 3
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-semibold"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold",
        isOverdue: false,
      };
    } else {
      const overdueDays = Math.abs(diffDays);
      return {
        text: `${overdueDays} kun o'tib ketdi!`,
        badgeClass: "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-bold",
        isOverdue: true,
      };
    }
  };

  const handleOpenAdd = (type: DebtType = 'lent') => {
    setDebtToEdit(null);
    setDefaultDebtType(type);
    setIsDebtModalOpen(true);
  };

  const handleOpenEdit = (debt: Debt) => {
    setDebtToEdit(debt);
    setIsDebtModalOpen(true);
  };

  const handleOpenRepay = (debt: Debt) => {
    setDebtToRepay(debt);
    setIsRepayModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (debtToDelete) {
      deleteDebt(debtToDelete.id);
      setDebtToDelete(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* 1. Yuqori Xulosa Paneli (2 ta asosiy karta + Yangi qarz tugmasi) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        
        {/* Menga qaytarishlari kerak (Jami berilgan qarzlar) */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-emerald-500/5 via-white to-emerald-500/10 dark:from-emerald-500/10 dark:via-slate-900 dark:to-emerald-500/5 border border-emerald-500/30 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Menga qaytarishlari kerak (Berilgan)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
              <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mb-1">
            {formatCurrency(stats.totalLentPending, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {stats.activeLentCount} ta faol debitorlik bo'yicha umumiy qoldiq
          </p>
        </div>

        {/* Men qaytarishim kerak (Jami olingan qarzlar) */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-rose-500/5 via-white to-rose-500/10 dark:from-rose-500/10 dark:via-slate-900 dark:to-rose-500/5 border border-rose-500/30 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Men qaytarishim kerak (Olingan)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight mb-1">
            {formatCurrency(stats.totalBorrowedPending, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {stats.activeBorrowedCount} ta faol kreditorlik bo'yicha umumiy majburiyat
          </p>
        </div>

        {/* Tezkor Qo'shish Bloki */}
        <div className="lg:col-span-2 rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Tezkor amal
            </span>
            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1">
              Yangi qarz berish yoki olishni yozib qo'ying
            </p>
          </div>

          <button
            onClick={() => handleOpenAdd('lent')}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Qarz yozish</span>
          </button>
        </div>

      </div>

      {/* 2. Tab Switcher va Qidiruv Maydoni */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Segmented Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 overflow-x-auto">
          
          <button
            onClick={() => setActiveTab('lent')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'lent'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Men qarz berdim</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'lent'
                  ? 'bg-emerald-700/60 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stats.activeLentCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('borrowed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'borrowed'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Men qarz oldim</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'borrowed'
                  ? 'bg-rose-700/60 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stats.activeBorrowedCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('closed')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'closed'
                ? 'bg-slate-700 dark:bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Yopilgan qarzlar tarixi</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                activeTab === 'closed'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              {stats.closedCount}
            </span>
          </button>

        </div>

        {/* Qidiruv inputi */}
        <div className="relative min-w-[200px] sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ism, telefon yoki izoh..."
            className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

      </div>

      {/* 3. Qarz Kartochkalari Ro'yxati */}
      {filteredDebts.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 p-10 sm:p-12 text-center">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-4">
            <HandCoins className="w-8 h-8" />
          </div>
          <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
            {activeTab === 'closed'
              ? "Hali yopilgan qarzlar yo'q"
              : activeTab === 'lent'
              ? "Siz bergan faol qarzlar mavjud emas"
              : "Siz olgan faol qarzlar mavjud emas"}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            {activeTab === 'closed'
              ? "To'liq qaytarilgan va yopilgan barcha qarzlar tarixi shu yerda ko'rinadi."
              : "Yangi qarz berish yoki qarz olish operatsiyasini qo'shib, hisob-kitobni qat'iy nazoratda tuting."}
          </p>
          {activeTab !== 'closed' && (
            <button
              onClick={() => handleOpenAdd(activeTab)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>
                {activeTab === 'lent' ? "Qarz berishni qayd etish" : "Qarz olishni qayd etish"}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredDebts.map((debt) => {
            const isLent = debt.type === 'lent';
            const remaining = Math.max(0, debt.amount - debt.paidAmount);
            const progress = Math.min(100, Math.round((debt.paidAmount / debt.amount) * 100));
            const dueStatus = getDueStatus(debt.dueDate);
            const wallet = wallets.find((w) => w.id === debt.walletId);

            return (
              <div
                key={debt.id}
                className="rounded-3xl p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
              >
                
                {/* Kartochka yuqori qismi: Shaxs, Turi, Telefon va Amallar */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                          isLent
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {isLent ? (
                          <ArrowDownLeft className="w-3 h-3 stroke-[2.5]" />
                        ) : (
                          <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />
                        )}
                        <span>{isLent ? 'Men berdim' : 'Men oldim'}</span>
                      </span>

                      {debt.isClosed ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          <span>Yopilgan</span>
                        </span>
                      ) : (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] ${dueStatus.badgeClass}`}>
                          {dueStatus.isOverdue && <AlertCircle className="w-3 h-3 shrink-0" />}
                          <span>{dueStatus.text}</span>
                        </span>
                      )}
                    </div>

                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {debt.personName}
                    </h4>

                    {debt.phone && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {debt.phone}
                        </span>
                        <div className="flex items-center gap-1">
                          <a
                            href={`tel:${debt.phone}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                            title="Qo'ng'iroq qilish"
                          >
                            <PhoneCall className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`sms:${debt.phone}`}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            title="SMS yozish"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tahrirlash va O'chirish kichik tugmalari */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(debt)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Qarzni tahrirlash"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDebtToDelete(debt)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Qarzni o'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Summalar va Progress Blok */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Umumiy qarz summasi
                      </span>
                      <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(debt.amount, debt.currency, isBalanceHidden)}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Qoldiq
                      </span>
                      <div
                        className={`text-lg sm:text-xl font-extrabold font-mono ${
                          debt.isClosed
                            ? 'text-emerald-600 dark:text-emerald-400 line-through opacity-70'
                            : isLent
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {formatCurrency(remaining, debt.currency, isBalanceHidden)}
                      </div>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div>
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                      <span className="flex items-center gap-1">
                        <BadgePercent className="w-3.5 h-3.5 text-slate-400" />
                        <span>To'langan: {formatCurrency(debt.paidAmount, debt.currency, isBalanceHidden)}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                        {progress}%
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          debt.isClosed
                            ? 'bg-emerald-500'
                            : isLent
                            ? 'bg-emerald-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Izoh (agar mavjud bo'lsa) */}
                {debt.note && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-start gap-2">
                    <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{debt.note}</span>
                  </p>
                )}

                {/* Kartochka pastki paneli: Hamyon, Sana va To'lov tugmasi */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  
                  <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateUz(debt.dueDate)}</span>
                    </span>
                    {wallet && (
                      <span className="flex items-center gap-1 font-medium">
                        <WalletIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{wallet.name}</span>
                      </span>
                    )}
                  </div>

                  {/* To'lov / Repay tugmasi */}
                  {!debt.isClosed ? (
                    <button
                      onClick={() => handleOpenRepay(debt)}
                      className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all active:scale-95 shrink-0 ${
                        isLent
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                          : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>{isLent ? "Qarzni qabul qilish" : "Qarzni to'lash"}</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Qarz to'liq yopilgan</span>
                    </div>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Yangi qarz / Tahrirlash modali */}
      <DebtModal
        isOpen={isDebtModalOpen}
        onClose={() => setIsDebtModalOpen(false)}
        debtToEdit={debtToEdit}
        defaultType={defaultDebtType}
      />

      {/* Qarzni qaytarish (Repay) modali */}
      <RepayDebtModal
        isOpen={isRepayModalOpen}
        onClose={() => {
          setIsRepayModalOpen(false);
          setDebtToRepay(null);
        }}
        debt={debtToRepay}
      />

      {/* O'chirishni tasdiqlash modali */}
      {debtToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              Qarzni o'chirish
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Haqiqatan ham <strong className="text-slate-900 dark:text-white">"{debtToDelete.personName}"</strong> qarz yozuvini o'chirib tashlamoqchimisiz?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDebtToDelete(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30"
              >
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
