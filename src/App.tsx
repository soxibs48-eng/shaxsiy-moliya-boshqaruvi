import React from 'react';
import { Plus } from 'lucide-react';
import { useFinance } from './context/FinanceContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottomNav } from './components/layout/BottomNav';
import { Toast } from './components/layout/Toast';
import { TransactionModal } from './components/modals/TransactionModal';
import { TransferModal } from './components/wallets/TransferModal';

import { Dashboard } from './pages/Dashboard';
import { Wallets } from './pages/Wallets';
import { Transactions } from './pages/Transactions';
import { Budgets } from './pages/Budgets';
import { Debts } from './pages/Debts';
import { Analytics } from './pages/Analytics';

export const App: React.FC = () => {
  const {
    activeTab,
    openTxModal,
    isTransferModalOpen,
    transferDefaultFromId,
    closeTransferModal,
  } = useFinance();

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'wallets':
        return <Wallets />;
      case 'transactions':
        return <Transactions />;
      case 'budgets':
        return <Budgets />;
      case 'debts':
        return <Debts />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* 1. Desktop chap yon panel (Sidebar) */}
      <Sidebar />

      {/* 2. Asosiy ishchi maydon */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        {/* Yuqori boshqaruv paneli (Header) */}
        <Header />

        {/* Sahifa ichki kontenti */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {renderActivePage()}
        </main>
      </div>

      {/* 3. Mobil pastki navigatsiya (BottomNav) */}
      <BottomNav />

      {/* 4. Mobil suzuvchi Yangi Operatsiya (FAB) tugmasi */}
      <button
        onClick={() => openTxModal('expense')}
        aria-label="Yangi operatsiya qo'shish"
        className="md:hidden fixed bottom-20 right-4 z-40 w-13 h-13 p-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 active:scale-90 text-white shadow-xl shadow-emerald-600/40 border-2 border-white dark:border-slate-800 transition-all flex items-center justify-center"
      >
        <Plus className="w-6 h-6 stroke-[2.8]" />
      </button>

      {/* 5. Global Yangi Operatsiya Modali */}
      <TransactionModal />

      {/* 6. Global Hamyonlararo O'tkazma Modali */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={closeTransferModal}
        defaultFromWalletId={transferDefaultFromId}
      />

      {/* 7. Global Toast bildirishnomasi */}
      <Toast />
    </div>
  );
};

export default App;
