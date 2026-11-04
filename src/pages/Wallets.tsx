import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  CreditCard,
  Banknote,
  PiggyBank,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  Edit2,
  Trash2,
  Send,
  Coins,
  ShieldCheck,
  Landmark,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Wallet, WalletType } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import { WalletModal } from '../components/wallets/WalletModal';
import { ExchangeRatesModal } from '../components/wallets/ExchangeRatesModal';
import { DeleteConfirmModal } from '../components/wallets/DeleteConfirmModal';

export const Wallets: React.FC = () => {
  const {
    wallets,
    baseCurrency,
    exchangeRates,
    ratesMetadata,
    isBalanceHidden,
    convertAmount,
    getTotalBalance,
    getTotalByType,
    addWallet,
    updateWallet,
    deleteWallet,
    openTransferModal,
  } = useFinance();

  // Modallar holati
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);

  const [isRatesModalOpen, setIsRatesModalOpen] = useState(false);
  const [walletToDelete, setWalletToDelete] = useState<Wallet | null>(null);

  // Statistika
  const totalBalance = getTotalBalance();
  const cashBalance = getTotalByType('cash');
  const cardBalance = getTotalByType('card');
  const savingsBalance = getTotalByType('savings');

  // Hamyon turiga mos ikonka
  const renderWalletIcon = (iconName: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'credit-card':
        return <CreditCard className={className} />;
      case 'piggy-bank':
        return <PiggyBank className={className} />;
      case 'landmark':
        return <Landmark className={className} />;
      case 'coins':
        return <Coins className={className} />;
      case 'wallet':
        return <WalletIcon className={className} />;
      case 'banknote':
      default:
        return <Banknote className={className} />;
    }
  };

  const getTypeNameUz = (type: WalletType) => {
    switch (type) {
      case 'cash':
        return 'Naqd pul';
      case 'card':
        return 'Plastik karta';
      case 'savings':
        return 'Jamg\'arma / Omonat';
    }
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setWalletToEdit(wallet);
    setIsWalletModalOpen(true);
  };

  const handleOpenAdd = () => {
    setWalletToEdit(null);
    setIsWalletModalOpen(true);
  };

  const handleOpenTransfer = (walletId?: string) => {
    openTransferModal(walletId);
  };

  const handleSaveWallet = (walletData: Omit<Wallet, 'id'>) => {
    if (walletToEdit) {
      updateWallet(walletToEdit.id, walletData);
    } else {
      addWallet(walletData);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* A) Yuqori statistika bloki (4 ta Summary Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Jami aktivlar */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Aktivlar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white font-mono mb-1">
            {formatCurrency(totalBalance, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Barcha {wallets.length} ta hamyon bo'yicha
          </p>
        </div>

        {/* 2. Naqd pullar */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Naqd pullar
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mb-1">
            {formatCurrency(cashBalance, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            {baseCurrency} ekvivalentida
          </p>
        </div>

        {/* 3. Bank kartalari */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Bank kartalari
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mb-1">
            {formatCurrency(cardBalance, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Uzcard, Humo, Visa va boshqalar
          </p>
        </div>

        {/* 4. Jamg'armalar */}
        <div className="rounded-2xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jamg'arma & Omonat
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mb-1">
            {formatCurrency(savingsBalance, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Zaxira va maqsad pullari
          </p>
        </div>
      </div>

      {/* B) Boshqaruv tugmalari (Action Bar) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Mening Hamyonlarim ({wallets.length} ta)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hisoblaringiz balansi va operatsiyalarini boshqaring
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Valyuta kurslari tugmasi */}
          <button
            onClick={() => setIsRatesModalOpen(true)}
            title={`Markaziy Bank API: $1 = ${Math.round(exchangeRates.USD).toLocaleString('uz-UZ')} UZS (${ratesMetadata.isAutoRefresh ? 'Har soniyada yangilanmoqda' : "To'xtatilgan"})`}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <span>Valyuta kurslari</span>
            <span className="hidden md:inline text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              $1 = {Math.round(exchangeRates.USD).toLocaleString('uz-UZ')}
            </span>
          </button>

          {/* O'tkazma tugmasi */}
          <button
            onClick={() => handleOpenTransfer()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-semibold transition-colors"
          >
            <ArrowLeftRight className="w-4 h-4 text-emerald-500" />
            <span>O'tkazma</span>
          </button>

          {/* Yangi hamyon tugmasi */}
          <button
            onClick={handleOpenAdd}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-600/25 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi hamyon</span>
          </button>
        </div>
      </div>

      {/* C) Hamyon kartochkalari Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {wallets.map((wallet) => {
          const converted = convertAmount(wallet.balance, wallet.currency, baseCurrency);

          return (
            <div
              key={wallet.id}
              className="relative rounded-3xl p-6 text-white shadow-xl overflow-hidden flex flex-col justify-between min-h-[220px] transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
              style={{
                background: `linear-gradient(135deg, ${wallet.color}ee, #0f172a)`,
              }}
            >
              {/* Orqa fon naqshi va blur effektlari */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none -mr-16 -mt-16" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-black/20 rounded-full blur-xl pointer-events-none -ml-10 -mb-10" />

              {/* Yuqori qism: Ikonka, Badjik va Amallar */}
              <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner border border-white/20">
                    {renderWalletIcon(wallet.icon, 'w-6 h-6 stroke-[2.2]')}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-lg text-white tracking-tight line-clamp-1">
                      {wallet.name}
                    </h4>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white/90 backdrop-blur-sm border border-white/10 mt-0.5">
                      {getTypeNameUz(wallet.type)}
                    </span>
                  </div>
                </div>

                {/* Tahrirlash va O'chirish kichik menyusi */}
                <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => handleOpenEdit(wallet)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
                    title="Hamyonni tahrirlash"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setWalletToDelete(wallet)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
                    title="Hamyonni o'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* O'rta qism: Balans */}
              <div className="relative z-10 my-4">
                <div className="flex items-center justify-between text-xs text-white/70 font-medium mb-1">
                  <span>Mavjud mablag'</span>
                  <span className="px-2 py-0.5 rounded-md bg-white/20 font-mono font-bold text-white text-[11px]">
                    {wallet.currency}
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-sm">
                  {formatCurrency(wallet.balance, wallet.currency, isBalanceHidden)}
                </div>
                {wallet.currency !== baseCurrency && (
                  <div className="text-xs text-white/75 font-mono mt-1">
                    ≈ {formatCurrency(converted, baseCurrency, isBalanceHidden)} ({baseCurrency})
                  </div>
                )}
              </div>

              {/* Pastki qism: Tezkor o'tkazma tugmasi */}
              <div className="relative z-10 pt-3 border-t border-white/15 flex items-center justify-between">
                <span className="text-[11px] text-white/70 font-mono">
                  ID: #{wallet.id.slice(-6)}
                </span>
                <button
                  onClick={() => handleOpenTransfer(wallet.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold backdrop-blur-md transition-all active:scale-95 shadow-sm"
                >
                  <Send className="w-3 h-3" />
                  <span>O'tkazma</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Yangi qo'shish kartochkasi */}
        <div
          onClick={handleOpenAdd}
          className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all min-h-[220px] group"
        >
          <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:text-emerald-500 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/60 flex items-center justify-center transition-all mb-3 shadow-inner">
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h5 className="font-bold text-slate-800 dark:text-slate-200 text-base mb-1">
            Yangi hamyon qo'shish
          </h5>
          <p className="text-xs text-slate-400 max-w-xs">
            Humo, Uzcard, Visa, Naqd pul yoki Jamg'arma hisobini ulang
          </p>
        </div>
      </div>

      {/* Modallar */}
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setWalletToEdit(null);
        }}
        onSave={handleSaveWallet}
        walletToEdit={walletToEdit}
      />

      <ExchangeRatesModal
        isOpen={isRatesModalOpen}
        onClose={() => setIsRatesModalOpen(false)}
      />

      <DeleteConfirmModal
        isOpen={!!walletToDelete}
        wallet={walletToDelete}
        onClose={() => setWalletToDelete(null)}
        onConfirm={(id) => deleteWallet(id)}
      />
    </div>
  );
};
