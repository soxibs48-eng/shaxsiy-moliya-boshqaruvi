import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Wallet } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  wallet: Wallet | null;
  onClose: () => void;
  onConfirm: (walletId: string) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  wallet,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !wallet) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mx-auto flex items-center justify-center mb-4 ring-8 ring-rose-500/5">
          <Trash2 className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Hamyonni o'chirish
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
          Haqiqatan ham <strong className="text-slate-900 dark:text-white">"{wallet.name}"</strong> ({formatCurrency(wallet.balance, wallet.currency)}) hamyonini o'chirmoqchimisiz?
        </p>

        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-left mb-6 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
            Diqqat: Ushbu hamyon o'chirilgach, unga tegishli bo'lgan o'tkazmalar tarixi ham tozalanadi. Bu amalni ortga qaytarib bo'lmaydi.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition-colors"
          >
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(wallet.id);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            <span>Ha, o'chirilsin</span>
          </button>
        </div>
      </div>
    </div>
  );
};

