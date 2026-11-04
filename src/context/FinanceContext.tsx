import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Currency,
  Wallet,
  Transaction,
  Category,
  Budget,
  Goal,
  Debt,
  NavigationTab,
  ThemeMode,
  ExchangeRates,
  FinanceContextType,
  TransferParams,
  WalletType,
} from '../types/finance';

// Standart valyuta kurslari (1 birlik xorijiy valyutaning UZS dagi qiymati)
const DEFAULT_RATES: ExchangeRates = {
  USD: 12850,
  EUR: 13900,
  UZS: 1,
};

// Standart xarajat va daromad kategoriyalari
export const INITIAL_CATEGORIES: Category[] = [
  // Xarajatlar
  { id: 'cat-exp-1', name: 'Oziq-ovqat', type: 'expense', icon: 'shopping-cart', color: '#10b981' },
  { id: 'cat-exp-2', name: 'Kafe va restoran', type: 'expense', icon: 'utensils', color: '#f59e0b' },
  { id: 'cat-exp-3', name: 'Transport', type: 'expense', icon: 'car', color: '#3b82f6' },
  { id: 'cat-exp-4', name: 'Kommunal to\'lovlar', type: 'expense', icon: 'zap', color: '#6366f1' },
  { id: 'cat-exp-5', name: 'Uy-ro\'zg\'or', type: 'expense', icon: 'home', color: '#8b5cf6' },
  { id: 'cat-exp-6', name: 'Kiyim-kechak', type: 'expense', icon: 'shirt', color: '#ec4899' },
  { id: 'cat-exp-7', name: 'Sog\'liq va dorilar', type: 'expense', icon: 'heart-pulse', color: '#ef4444' },
  { id: 'cat-exp-8', name: 'Aloqa va internet', type: 'expense', icon: 'wifi', color: '#06b6d4' },
  { id: 'cat-exp-9', name: 'Ta\'lim', type: 'expense', icon: 'graduation-cap', color: '#14b8a6' },
  { id: 'cat-exp-10', name: 'Dam olish', type: 'expense', icon: 'gamepad-2', color: '#f97316' },
  { id: 'cat-exp-11', name: 'Boshqa xarajat', type: 'expense', icon: 'more-horizontal', color: '#64748b' },

  // Daromadlar
  { id: 'cat-inc-1', name: 'Asosiy maosh', type: 'income', icon: 'briefcase', color: '#10b981' },
  { id: 'cat-inc-2', name: 'Frilans', type: 'income', icon: 'laptop', color: '#3b82f6' },
  { id: 'cat-inc-3', name: 'Biznes va savdo', type: 'income', icon: 'trending-up', color: '#8b5cf6' },
  { id: 'cat-inc-4', name: 'Mukofot va sovg\'a', type: 'income', icon: 'gift', color: '#f59e0b' },
  { id: 'cat-inc-5', name: 'Investitsiya/Divident', type: 'income', icon: 'line-chart', color: '#06b6d4' },
  { id: 'cat-inc-6', name: 'Boshqa daromad', type: 'income', icon: 'plus-circle', color: '#64748b' },
];

// Standart boshlang'ich hamyonlar
const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'wallet-1',
    name: 'Naqd hamyon',
    type: 'cash',
    currency: 'UZS',
    balance: 2500000,
    color: '#10b981', // Zumrad yashil
    icon: 'banknote',
  },
  {
    id: 'wallet-2',
    name: 'Uzcard Asosiy',
    type: 'card',
    currency: 'UZS',
    balance: 8400000,
    color: '#3b82f6', // Moviy
    icon: 'credit-card',
  },
  {
    id: 'wallet-3',
    name: 'Dollar jamg\'arma',
    type: 'savings',
    currency: 'USD',
    balance: 1200,
    color: '#8b5cf6', // Binafsha
    icon: 'piggy-bank',
  },
];

// Standart namunaviy operatsiyalar (Joriy oy sanalari bilan 8 ta realistik tranzaksiya)
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    walletId: 'wallet-2',
    type: 'income',
    amount: 12000000,
    currency: 'UZS',
    category: 'Asosiy maosh',
    date: '2026-11-01',
    note: 'Noyabr oyi uchun oylik ish haqi',
  },
  {
    id: 'tx-2',
    walletId: 'wallet-3',
    type: 'income',
    amount: 250,
    currency: 'USD',
    category: 'Frilans',
    date: '2026-11-02',
    note: 'Web-dizayn loyihasi uchun to\'lov',
  },
  {
    id: 'tx-3',
    walletId: 'wallet-2',
    type: 'expense',
    amount: 850000,
    currency: 'UZS',
    category: 'Oziq-ovqat',
    date: '2026-11-02',
    note: 'Korzinka supermarketidan oylik oziq-ovqat xaridi',
  },
  {
    id: 'tx-4',
    walletId: 'wallet-1',
    type: 'expense',
    amount: 180000,
    currency: 'UZS',
    category: 'Kafe va restoran',
    date: '2026-11-03',
    note: 'Do\'stlar bilan tushlik',
  },
  {
    id: 'tx-5',
    walletId: 'wallet-1',
    type: 'expense',
    amount: 350000,
    currency: 'UZS',
    category: 'Transport',
    date: '2026-11-03',
    note: 'Avtomobilga yoqilg\'i quyish',
  },
  {
    id: 'tx-6',
    walletId: 'wallet-2',
    type: 'expense',
    amount: 420000,
    currency: 'UZS',
    category: 'Kommunal to\'lovlar',
    date: '2026-11-04',
    note: 'Elektr energiyasi va gaz to\'lovlari',
  },
  {
    id: 'tx-7',
    walletId: 'wallet-2',
    type: 'expense',
    amount: 220000,
    currency: 'UZS',
    category: 'Aloqa va internet',
    date: '2026-11-04',
    note: 'Uy interneti va mobil tarif to\'lovi',
  },
  {
    id: 'tx-8',
    walletId: 'wallet-2',
    toWalletId: 'wallet-1',
    type: 'transfer',
    amount: 500000,
    currency: 'UZS',
    category: 'O\'tkazma',
    date: '2026-11-04',
    note: 'Uzcard Asosiy ➔ Naqd hamyon (Bankomatdan yechildi)',
  },
];

// Standart namunaviy byudjetlar
const INITIAL_BUDGETS: Budget[] = [
  {
    id: 'b-1',
    category: 'Oziq-ovqat',
    limitAmount: 3000000,
    currency: 'UZS',
  },
  {
    id: 'b-2',
    category: 'Transport',
    limitAmount: 1000000,
    currency: 'UZS',
  },
  {
    id: 'b-3',
    category: 'Ko\'ngilochar',
    limitAmount: 800000,
    currency: 'UZS',
  },
];

// Standart namunaviy maqsadlar
const INITIAL_GOALS: Goal[] = [
  {
    id: 'g-1',
    title: 'Yangi noutbuk (MacBook M3)',
    targetAmount: 2000,
    currentAmount: 1200,
    currency: 'USD',
    deadline: '2026-12-31',
    color: '#06b6d4',
  },
  {
    id: 'g-2',
    title: 'Favqulodda jamg\'arma',
    targetAmount: 20000000,
    currentAmount: 10900000,
    currency: 'UZS',
    deadline: '2027-06-01',
    color: '#10b981',
  },
];

// Standart namunaviy qarzlar
const INITIAL_DEBTS: Debt[] = [
  {
    id: 'd-1',
    type: 'lent',
    personName: 'Alisher Vohidov',
    phone: '+998 90 123 45 67',
    amount: 1500000,
    paidAmount: 500000,
    currency: 'UZS',
    walletId: 'wallet-1',
    dueDate: '2026-11-20',
    isClosed: false,
    note: 'Telefon ta\'miri uchun olgan',
  },
  {
    id: 'd-2',
    type: 'borrowed',
    personName: 'Sardor aka',
    phone: '+998 97 765 43 21',
    amount: 100,
    paidAmount: 0,
    currency: 'USD',
    walletId: 'wallet-3',
    dueDate: '2026-11-25',
    isClosed: false,
    note: 'Kripto savdo uchun vaqtincha',
  },
];

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // 1. Wallets state
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    try {
      const saved = localStorage.getItem('sf_wallets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Wallets o\'qishda xatolik:', e);
    }
    return INITIAL_WALLETS;
  });

  // 2. Transactions state
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem('sf_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Transactions o\'qishda xatolik:', e);
    }
    return INITIAL_TRANSACTIONS;
  });

  // 2.1 Categories state
  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem('sf_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Categories o\'qishda xatolik:', e);
    }
    return INITIAL_CATEGORIES;
  });

  // 2.2 Global Modallar state'lari
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [defaultTxType, setDefaultTxType] = useState<'income' | 'expense'>('expense');

  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultFromId, setTransferDefaultFromId] = useState<string | null>(null);

  const openTxModal = (type?: 'income' | 'expense', tx?: Transaction) => {
    if (tx) {
      setEditingTx(tx);
      setDefaultTxType(tx.type === 'income' ? 'income' : 'expense');
    } else {
      setEditingTx(null);
      setDefaultTxType(type || 'expense');
    }
    setIsTxModalOpen(true);
  };

  const closeTxModal = () => {
    setIsTxModalOpen(false);
    setEditingTx(null);
  };

  const openTransferModal = (fromWalletId?: string) => {
    setTransferDefaultFromId(fromWalletId || null);
    setIsTransferModalOpen(true);
  };

  const closeTransferModal = () => {
    setIsTransferModalOpen(false);
    setTransferDefaultFromId(null);
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...categoryData,
      id: `cat-custom-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCat]);
    showToast(`"${newCat.name}" kategoriyasi qo'shildi!`);
  };

  // 3. Budgets state
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    try {
      const saved = localStorage.getItem('sf_budgets');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Budgets o\'qishda xatolik:', e);
    }
    return INITIAL_BUDGETS;
  });

  // 4. Goals state
  const [goals, setGoals] = useState<Goal[]>(() => {
    try {
      const saved = localStorage.getItem('sf_goals');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Goals o\'qishda xatolik:', e);
    }
    return INITIAL_GOALS;
  });

  // 5. Debts state
  const [debts, setDebts] = useState<Debt[]>(() => {
    try {
      const saved = localStorage.getItem('sf_debts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Debts o\'qishda xatolik:', e);
    }
    return INITIAL_DEBTS;
  });

  // 6. Base currency
  const [baseCurrency, setBaseCurrencyState] = useState<Currency>(() => {
    try {
      const saved = localStorage.getItem('sf_base_currency') as Currency;
      if (saved === 'UZS' || saved === 'USD' || saved === 'EUR') return saved;
    } catch (e) {
      console.error('Base currency o\'qishda xatolik:', e);
    }
    return 'UZS';
  });

  // 7. Balansni yashirish (ko'zcha holati)
  const [isBalanceHidden, setIsBalanceHidden] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sf_balance_hidden') === 'true';
    } catch {
      return false;
    }
  });

  // 8. Mavzu (Dark / Light)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('sf_theme') as ThemeMode;
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark'; // Boshlang'ich default fintech dark mode
  });

  // 9. Faol tab
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');

  // 10. Valyuta kurslari (localStorage bilan sinxron)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(() => {
    try {
      const saved = localStorage.getItem('sf_exchange_rates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.USD === 'number' && typeof parsed.EUR === 'number') {
          return { ...DEFAULT_RATES, ...parsed };
        }
      }
    } catch (e) {
      console.error('Exchange rates o\'qishda xatolik:', e);
    }
    return DEFAULT_RATES;
  });

  const updateExchangeRates = (rates: { USD: number; EUR: number }) => {
    setExchangeRates({
      UZS: 1,
      USD: rates.USD > 0 ? rates.USD : DEFAULT_RATES.USD,
      EUR: rates.EUR > 0 ? rates.EUR : DEFAULT_RATES.EUR,
    });
    showToast("Valyuta kurslari yangilandi!");
  };

  useEffect(() => {
    try {
      localStorage.setItem('sf_exchange_rates', JSON.stringify(exchangeRates));
    } catch (e) {
      console.error(e);
    }
  }, [exchangeRates]);

  // 11. Toast xabar tizimi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const clearToast = () => {
    setToastMessage(null);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // localStorage saqlash effektlari
  useEffect(() => {
    try {
      localStorage.setItem('sf_wallets', JSON.stringify(wallets));
    } catch (e) {
      console.error(e);
    }
  }, [wallets]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_categories', JSON.stringify(categories));
    } catch (e) {
      console.error(e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_budgets', JSON.stringify(budgets));
    } catch (e) {
      console.error(e);
    }
  }, [budgets]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_goals', JSON.stringify(goals));
    } catch (e) {
      console.error(e);
    }
  }, [goals]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_debts', JSON.stringify(debts));
    } catch (e) {
      console.error(e);
    }
  }, [debts]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_base_currency', baseCurrency);
    } catch (e) {
      console.error(e);
    }
  }, [baseCurrency]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_balance_hidden', String(isBalanceHidden));
    } catch (e) {
      console.error(e);
    }
  }, [isBalanceHidden]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Valyutani o'zgartirish
  const setBaseCurrency = (currency: Currency) => {
    setBaseCurrencyState(currency);
    showToast(`Asosiy valyuta ${currency} ga o'zgartirildi`);
  };

  // Balans yashirishni almashtirish
  const toggleBalanceHidden = () => {
    setIsBalanceHidden(prev => !prev);
  };

  // Mavzuni almashtirish
  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Valyuta konvertatsiyasi: from -> to
  const convertAmount = (amount: number, from: Currency, to: Currency): number => {
    if (from === to) return amount;

    // 1. Dastlab miqdorni UZS ga o'giramiz
    let amountInUZS = amount;
    if (from === 'USD') {
      amountInUZS = amount * exchangeRates.USD;
    } else if (from === 'EUR') {
      amountInUZS = amount * exchangeRates.EUR;
    }

    // 2. UZS dan maqsadli valyutaga o'giramiz
    if (to === 'UZS') {
      return amountInUZS;
    } else if (to === 'USD') {
      return amountInUZS / exchangeRates.USD;
    } else if (to === 'EUR') {
      return amountInUZS / exchangeRates.EUR;
    }

    return amount;
  };

  // Barcha hamyonlarning tanlangan baseCurrency bo'yicha umumiy summasi
  const getTotalBalance = (): number => {
    return wallets.reduce((total, wallet) => {
      const converted = convertAmount(wallet.balance, wallet.currency, baseCurrency);
      return total + converted;
    }, 0);
  };

  // Hamyon turlari bo'yicha jami summani hisoblash
  const getTotalByType = (type: WalletType): number => {
    return wallets
      .filter(w => w.type === type)
      .reduce((sum, w) => sum + convertAmount(w.balance, w.currency, baseCurrency), 0);
  };

  // Wallet CRUD
  const addWallet = (walletData: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...walletData,
      id: `wallet-${Date.now()}`,
    };
    setWallets(prev => [...prev, newWallet]);
    showToast(`"${newWallet.name}" hamyoni muvaffaqiyatli qo'shildi!`);
  };

  const updateWallet = (id: string, updatedFields: Partial<Wallet>) => {
    setWallets(prev =>
      prev.map(w => (w.id === id ? { ...w, ...updatedFields } : w))
    );
    showToast('Hamyon yangilandi!');
  };

  const deleteWallet = (id: string) => {
    const target = wallets.find(w => w.id === id);
    setWallets(prev => prev.filter(w => w.id !== id));
    // Unga tegishli tranzaksiyalarni ham tozalash
    setTransactions(prev => prev.filter(tx => tx.walletId !== id && tx.toWalletId !== id));
    showToast(`"${target?.name || 'Hamyon'}" va unga tegishli barcha amallar o'chirildi`);
  };

  // Hamyonlararo o'tkazma
  const transferBetweenWallets = (params: TransferParams): boolean => {
    const { fromWalletId, toWalletId, amount, customRate, fee = 0, date, note } = params;
    const fromWallet = wallets.find(w => w.id === fromWalletId);
    const toWallet = wallets.find(w => w.id === toWalletId);

    if (!fromWallet || !toWallet) {
      showToast("Hamyon topilmadi!");
      return false;
    }

    if (fromWalletId === toWalletId) {
      showToast("Bir xil hamyonlar orasida o'tkazma qilib bo'lmaydi!");
      return false;
    }

    if (amount <= 0) {
      showToast("O'tkazma summasi 0 dan katta bo'lishi kerak!");
      return false;
    }

    const totalDeduct = amount + (fee > 0 ? fee : 0);
    if (fromWallet.balance < totalDeduct) {
      showToast("Hamyonda yetarli mablag' yo'q!");
      return false;
    }

    // Qabul qiluvchi valyutadagi summani hisoblash
    let receivedAmount = amount;
    if (fromWallet.currency !== toWallet.currency) {
      if (customRate && customRate > 0) {
        if (fromWallet.currency === 'UZS' && (toWallet.currency === 'USD' || toWallet.currency === 'EUR')) {
          receivedAmount = amount / customRate;
        } else if ((fromWallet.currency === 'USD' || fromWallet.currency === 'EUR') && toWallet.currency === 'UZS') {
          receivedAmount = amount * customRate;
        } else {
          // Boshqa o'zaro kurs
          receivedAmount = amount * customRate;
        }
      } else {
        receivedAmount = convertAmount(amount, fromWallet.currency, toWallet.currency);
      }
    }

    // Balanslarni yangilash
    setWallets(prev =>
      prev.map(w => {
        if (w.id === fromWalletId) {
          const newBal = Math.max(0, Math.round((w.balance - totalDeduct + Number.EPSILON) * 100) / 100);
          return { ...w, balance: newBal };
        }
        if (w.id === toWalletId) {
          const newBal = Math.round((w.balance + receivedAmount + Number.EPSILON) * 100) / 100;
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    // Tranzaksiyalar tarixiga qo'shish
    const formattedDate = date || new Date().toISOString().split('T')[0];
    const newTx: Transaction = {
      id: `tx-tr-${Date.now()}`,
      walletId: fromWalletId,
      toWalletId: toWalletId,
      type: 'transfer',
      amount: amount,
      currency: fromWallet.currency,
      category: "O'tkazma",
      date: formattedDate,
      note: note
        ? note
        : `${fromWallet.name} ➔ ${toWallet.name}${fee > 0 ? ` (Komissiya: ${fee} ${fromWallet.currency})` : ''}`,
    };

    setTransactions(prev => [newTx, ...prev]);
    showToast("Pul muvaffaqiyatli o'tkazildi!");
    return true;
  };

  // Transaction CRUD
  const addTransaction = (txData: Omit<Transaction, 'id'>): boolean => {
    const wallet = wallets.find(w => w.id === txData.walletId);
    if (!wallet) {
      showToast("Hamyon tanlanmagan!");
      return false;
    }

    if (txData.amount <= 0) {
      showToast("Summa 0 dan katta bo'lishi kerak!");
      return false;
    }

    if (txData.type === 'expense' && wallet.balance < txData.amount) {
      showToast("Diqqat: Hamyonda mablag' yetarli emas!");
      return false;
    }

    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      currency: wallet.currency,
    };

    // Hamyon balansini yangilash
    setWallets(prev =>
      prev.map(w => {
        if (w.id === newTx.walletId) {
          const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
          const newBal = Math.round((w.balance + delta + Number.EPSILON) * 100) / 100;
          return { ...w, balance: Math.max(0, newBal) };
        }
        return w;
      })
    );

    setTransactions(prev => [newTx, ...prev]);
    showToast(newTx.type === 'income' ? "Daromad qo'shildi!" : "Xarajat saqlandi!");
    return true;
  };

  const updateTransaction = (id: string, updatedFields: Partial<Transaction>): boolean => {
    const oldTx = transactions.find(t => t.id === id);
    if (!oldTx) return false;

    const targetWalletId = updatedFields.walletId || oldTx.walletId;
    const targetWallet = wallets.find(w => w.id === targetWalletId);
    if (!targetWallet) return false;

    const newAmount = updatedFields.amount !== undefined ? updatedFields.amount : oldTx.amount;
    const newType = updatedFields.type || oldTx.type;

    // Balanslarni sinxronlashtirish
    setWallets(prev => {
      // 1. Oldingi operatsiya ta'sirini bekor qilish (revert)
      const reverted = prev.map(w => {
        if (w.id === oldTx.walletId) {
          const revertDelta = oldTx.type === 'income' ? -oldTx.amount : oldTx.amount;
          return { ...w, balance: Math.max(0, Math.round((w.balance + revertDelta + Number.EPSILON) * 100) / 100) };
        }
        return w;
      });

      // 2. Yangi operatsiya ta'sirini kiritish (apply)
      return reverted.map(w => {
        if (w.id === targetWalletId) {
          const applyDelta = newType === 'income' ? newAmount : -newAmount;
          return { ...w, balance: Math.max(0, Math.round((w.balance + applyDelta + Number.EPSILON) * 100) / 100) };
        }
        return w;
      });
    });

    setTransactions(prev =>
      prev.map(t =>
        t.id === id
          ? {
              ...t,
              ...updatedFields,
              currency: targetWallet.currency,
            }
          : t
      )
    );

    showToast("Operatsiya muvaffaqiyatli yangilandi!");
    return true;
  };

  const deleteTransaction = (id: string) => {
    const target = transactions.find(tx => tx.id === id);
    if (!target) return;

    // Agar o'tkazma bo'lsa
    if (target.type === 'transfer') {
      setWallets(prev =>
        prev.map(w => {
          if (w.id === target.walletId) {
            return { ...w, balance: Math.round((w.balance + target.amount + Number.EPSILON) * 100) / 100 };
          }
          if (w.id === target.toWalletId) {
            return { ...w, balance: Math.max(0, Math.round((w.balance - target.amount + Number.EPSILON) * 100) / 100) };
          }
          return w;
        })
      );
    } else {
      // Oddiy income yoki expense
      setWallets(prev =>
        prev.map(w => {
          if (w.id === target.walletId) {
            const revertDelta = target.type === 'income' ? -target.amount : target.amount;
            return { ...w, balance: Math.max(0, Math.round((w.balance + revertDelta + Number.EPSILON) * 100) / 100) };
          }
          return w;
        })
      );
    }

    setTransactions(prev => prev.filter(tx => tx.id !== id));
    showToast('Operatsiya o\'chirildi va balans tiklandi');
  };

  return (
    <FinanceContext.Provider
      value={{
        wallets,
        transactions,
        categories,
        budgets,
        goals,
        debts,
        baseCurrency,
        setBaseCurrency,
        exchangeRates,
        isBalanceHidden,
        toggleBalanceHidden,
        theme,
        toggleTheme,
        activeTab,
        setActiveTab,
        convertAmount,
        getTotalBalance,
        getTotalByType,
        addWallet,
        updateWallet,
        deleteWallet,
        transferBetweenWallets,
        updateExchangeRates,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        isTxModalOpen,
        editingTx,
        defaultTxType,
        openTxModal,
        closeTxModal,
        isTransferModalOpen,
        transferDefaultFromId,
        openTransferModal,
        closeTransferModal,
        setBudgets,
        setGoals,
        setDebts,
        toastMessage,
        showToast,
        clearToast,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance faqat FinanceProvider ichida ishlatilishi kerak');
  }
  return context;
};

