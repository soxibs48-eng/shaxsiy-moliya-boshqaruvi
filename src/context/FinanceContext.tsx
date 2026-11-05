import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
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
  RatesMetadata,
  FinanceContextType,
  TransferParams,
  ContributeGoalParams,
  RepayDebtParams,
  WalletType,
} from '../types/finance';
import { formatCurrency, formatExchangeRate } from '../utils/formatters';
import { getLiveExchangeRates } from '../services/currencyApi';
import {
  notifyTransactionEvent,
  notifyTransferEvent,
  notifyGoalEvent,
  notifyDebtCreatedEvent,
  notifyDebtRepaidEvent,
  notifyBudgetAlertEvent,
} from '../services/telegramBot';

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
    limitAmount: 2500000,
    currency: 'UZS',
  },
  {
    id: 'b-2',
    category: 'Kafe va restoran',
    limitAmount: 800000,
    currency: 'UZS',
  },
  {
    id: 'b-3',
    category: 'Transport',
    limitAmount: 600000,
    currency: 'UZS',
  },
];

// Standart namunaviy maqsadlar (Kopilka)
const INITIAL_GOALS: Goal[] = [
  {
    id: 'g-1',
    title: 'Yangi MacBook Pro',
    targetAmount: 2000,
    currentAmount: 850,
    currency: 'USD',
    deadline: '2027-01-15',
    color: '#3b82f6',
    icon: 'laptop',
  },
  {
    id: 'g-2',
    title: 'Oila bilan sayohat',
    targetAmount: 25000000,
    currentAmount: 10000000,
    currency: 'UZS',
    deadline: '2027-06-01',
    color: '#10b981',
    icon: 'plane',
  },
  {
    id: 'g-3',
    title: 'Qora kun uchun zaxira (Safety Cushion)',
    targetAmount: 5000,
    currentAmount: 2100,
    currency: 'USD',
    deadline: '2027-12-31',
    color: '#8b5cf6',
    icon: 'shield-check',
  },
];

// Standart namunaviy qarzlar
const INITIAL_DEBTS: Debt[] = [
  {
    id: 'debt-1',
    type: 'lent',
    personName: 'Anvar aka (O‘rtoq)',
    phone: '+998 90 123 45 67',
    amount: 2000000,
    paidAmount: 500000,
    currency: 'UZS',
    walletId: 'wallet-1',
    dueDate: '2026-11-12',
    isClosed: false,
    note: 'Tadbirkorlik uchun vaqtincha yordam',
  },
  {
    id: 'debt-2',
    type: 'borrowed',
    personName: 'Alisher (Akam)',
    phone: '+998 97 765 43 21',
    amount: 300,
    paidAmount: 0,
    currency: 'USD',
    walletId: 'wallet-3',
    dueDate: '2026-12-05',
    isClosed: false,
    note: 'Uy jihozlari uchun olingan',
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

  // 10. Toast xabar tizimi
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // 11. Valyuta kurslari (localStorage bilan sinxron)
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

  // 11.1 Jonli valyuta metama'lumotlari (Jonli API holati, manba, diff, interval)
  const [ratesMetadata, setRatesMetadata] = useState<RatesMetadata>(() => {
    return {
      source: 'cbu',
      lastUpdated: new Date().toLocaleTimeString('uz-UZ'),
      lastSyncTimestamp: Date.now(),
      status: 'connected',
      diff: { USD: 0, EUR: 0 },
      isAutoRefresh: true,
      refreshInterval: 1000, // 1000ms = Har soniyada yangilanadi!
      secondsSinceUpdate: 0,
      tickCount: 0,
    };
  });

  const isFetchingRatesRef = useRef<boolean>(false);
  const lastApiFetchTimeRef = useRef<number>(0);

  const fetchLiveRates = useCallback(async (showToastNotification: boolean = false) => {
    if (isFetchingRatesRef.current) return;
    isFetchingRatesRef.current = true;

    try {
      const live = await getLiveExchangeRates();
      setExchangeRates({
        UZS: 1,
        USD: live.USD,
        EUR: live.EUR,
      });
      setRatesMetadata(prev => ({
        ...prev,
        source: live.source,
        lastUpdated: new Date().toLocaleTimeString('uz-UZ'),
        lastSyncTimestamp: Date.now(),
        status: 'connected',
        diff: live.diff,
        secondsSinceUpdate: 0,
      }));
      lastApiFetchTimeRef.current = Date.now();

      if (showToastNotification) {
        showToast(`Jonli API yangilandi: $1 = ${formatExchangeRate(live.USD)} UZS (${live.source === 'cbu' ? 'CBU.uz' : 'ER-API'})`);
      }
    } catch (error) {
      console.error('Jonli kurslarni olishda xatolik:', error);
      setRatesMetadata(prev => ({
        ...prev,
        status: 'error',
      }));
      if (showToastNotification) {
        showToast("Valyuta kurslarini yuklashda xatolik yuz berdi");
      }
    } finally {
      isFetchingRatesRef.current = false;
    }
  }, [showToast]);

  const updateExchangeRates = (rates: { USD: number; EUR: number }) => {
    setExchangeRates({
      UZS: 1,
      USD: rates.USD > 0 ? rates.USD : DEFAULT_RATES.USD,
      EUR: rates.EUR > 0 ? rates.EUR : DEFAULT_RATES.EUR,
    });
    setRatesMetadata(prev => ({
      ...prev,
      source: 'manual',
      lastUpdated: new Date().toLocaleTimeString('uz-UZ'),
      lastSyncTimestamp: Date.now(),
      status: 'connected',
      secondsSinceUpdate: 0,
    }));
    showToast("Valyuta kurslari yangilandi!");
  };

  const setIsAutoRefresh = useCallback((enabled: boolean) => {
    setRatesMetadata(prev => ({ ...prev, isAutoRefresh: enabled }));
    showToast(enabled ? "Jonli avto-yangilanish yoqildi (Har soniyada)" : "Avto-yangilanish to'xtatildi");
  }, [showToast]);

  const setRefreshInterval = useCallback((intervalMs: number) => {
    setRatesMetadata(prev => ({ ...prev, refreshInterval: intervalMs }));
  }, []);

  // Ilova ochilganda darhol 1 marta tekin API dan kurslarni olish
  useEffect(() => {
    fetchLiveRates(false);
  }, [fetchLiveRates]);

  // Har soniyada (1000ms) uzluksiz monitoring va yangilanish
  useEffect(() => {
    if (!ratesMetadata.isAutoRefresh) return;

    const timer = setInterval(() => {
      const now = Date.now();

      // Har soniyada sekundomer va tick count yangilanadi
      setRatesMetadata(prev => ({
        ...prev,
        tickCount: prev.tickCount + 1,
        secondsSinceUpdate: Math.floor((now - prev.lastSyncTimestamp) / 1000),
      }));

      // Har soniyada API ni yangilash (agar oldingi so'rov tugagan bo'lsa)
      const timeSinceLastFetch = now - lastApiFetchTimeRef.current;
      if (timeSinceLastFetch >= ratesMetadata.refreshInterval && !isFetchingRatesRef.current) {
        fetchLiveRates(false);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ratesMetadata.isAutoRefresh, ratesMetadata.refreshInterval, fetchLiveRates]);

  useEffect(() => {
    try {
      localStorage.setItem('sf_exchange_rates', JSON.stringify(exchangeRates));
    } catch (e) {
      console.error(e);
    }
  }, [exchangeRates]);

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

    // Telegram botga xabarnoma yuborish
    notifyTransferEvent({
      fromWallet: fromWallet.name,
      toWallet: toWallet.name,
      sentAmountText: formatCurrency(amount, fromWallet.currency),
      receivedAmountText: formatCurrency(receivedAmount, toWallet.currency),
      feeText: fee > 0 ? formatCurrency(fee, fromWallet.currency) : undefined,
      date: formattedDate,
    });

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

    // Telegram botga xabarnoma yuborish
    notifyTransactionEvent({
      type: newTx.type,
      amountText: formatCurrency(newTx.amount, newTx.currency),
      category: newTx.category,
      walletName: wallet.name,
      note: newTx.note,
      date: newTx.date,
    });

    // Byudjet limitini tekshirish (faqat xarajat bo'lsa)
    if (newTx.type === 'expense') {
      const budget = budgets.find(
        (b) => b.category.toLowerCase() === newTx.category.toLowerCase()
      );
      if (budget) {
        const currentSpent = getBudgetSpent(budget.category, budget.currency);
        const addedSpent = convertAmount(newTx.amount, newTx.currency, budget.currency);
        const totalSpent = currentSpent + addedSpent;
        if (totalSpent > budget.limitAmount) {
          const percent = Math.round((totalSpent / budget.limitAmount) * 100);
          notifyBudgetAlertEvent({
            category: budget.category,
            limitText: formatCurrency(budget.limitAmount, budget.currency),
            spentText: formatCurrency(totalSpent, budget.currency),
            percent,
          });
        }
      }
    }

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

  // Byudjetlar CRUD
  const addBudget = (budgetData: Omit<Budget, 'id'>) => {
    const existing = budgets.find(b => b.category.toLowerCase() === budgetData.category.toLowerCase());
    if (existing) {
      setBudgets(prev => prev.map(b => b.id === existing.id ? { ...b, ...budgetData } : b));
      showToast(`"${budgetData.category}" uchun byudjet limiti yangilandi!`);
    } else {
      const newBudget: Budget = {
        ...budgetData,
        id: `b-${Date.now()}`,
      };
      setBudgets(prev => [...prev, newBudget]);
      showToast(`"${newBudget.category}" uchun yangi byudjet belgilandi!`);
    }
  };

  const updateBudget = (id: string, updatedFields: Partial<Budget>) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...updatedFields } : b));
    showToast("Byudjet limiti yangilandi!");
  };

  const deleteBudget = (id: string) => {
    const target = budgets.find(b => b.id === id);
    setBudgets(prev => prev.filter(b => b.id !== id));
    showToast(`"${target?.category || 'Byudjet'}" limiti o'chirildi`);
  };

  // Joriy oyda aynan shu kategoriya bo'yicha sarflangan mablag'
  const getBudgetSpent = (category: string, targetCurrency: Currency): number => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const currentMonth = `${year}-${month}`;

    return transactions
      .filter(
        t =>
          t.type === 'expense' &&
          t.category.toLowerCase() === category.toLowerCase() &&
          t.date.startsWith(currentMonth)
      )
      .reduce((sum, t) => sum + convertAmount(t.amount, t.currency, targetCurrency), 0);
  };

  // Maqsadlar CRUD
  const addGoal = (goalData: Omit<Goal, 'id'>) => {
    const newGoal: Goal = {
      ...goalData,
      id: `g-${Date.now()}`,
    };
    setGoals(prev => [...prev, newGoal]);
    showToast(`"${newGoal.title}" maqsadi qo'shildi! 🎯`);
  };

  const updateGoal = (id: string, updatedFields: Partial<Goal>) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updatedFields } : g));
    showToast("Maqsad ma'lumotlari yangilandi!");
  };

  const deleteGoal = (id: string) => {
    const target = goals.find(g => g.id === id);
    setGoals(prev => prev.filter(g => g.id !== id));
    showToast(`"${target?.title || 'Maqsad'}" o'chirildi`);
  };

  // Maqsadga pul ajratish (Kopilkani to'ldirish)
  const contributeToGoal = (params: ContributeGoalParams): boolean => {
    const { goalId, walletId, amount, note } = params;
    const goal = goals.find(g => g.id === goalId);
    const wallet = wallets.find(w => w.id === walletId);

    if (!goal || !wallet) {
      showToast("Maqsad yoki hamyon topilmadi!");
      return false;
    }

    if (amount <= 0) {
      showToast("Ajratilayotgan summa 0 dan katta bo'lishi kerak!");
      return false;
    }

    if (wallet.balance < amount) {
      showToast("Hamyonda yetarli mablag' yo'q!");
      return false;
    }

    // Maqsad valyutasiga konvertatsiya qilib qo'shish
    const addedToGoal = convertAmount(amount, wallet.currency, goal.currency);

    // 1. Hamyon balansini kamaytirish
    setWallets(prev =>
      prev.map(w => {
        if (w.id === walletId) {
          const newBal = Math.max(0, Math.round((w.balance - amount + Number.EPSILON) * 100) / 100);
          return { ...w, balance: newBal };
        }
        return w;
      })
    );

    // 2. Maqsad currentAmount qiymatini oshirish
    setGoals(prev =>
      prev.map(g => {
        if (g.id === goalId) {
          const newCurrent = Math.round((g.currentAmount + addedToGoal + Number.EPSILON) * 100) / 100;
          return { ...g, currentAmount: newCurrent };
        }
        return g;
      })
    );

    // 3. Tranzaksiyalar tarixiga yozish
    const today = new Date().toISOString().split('T')[0];
    const txNote = note || `Maqsad uchun: ${goal.title} (+${formatCurrency(addedToGoal, goal.currency)})`;
    const newTx: Transaction = {
      id: `tx-goal-${Date.now()}`,
      walletId: wallet.id,
      type: 'expense',
      amount: amount,
      currency: wallet.currency,
      category: "Jamg'arma / Maqsad",
      date: today,
      note: txNote,
    };

    setTransactions(prev => [newTx, ...prev]);
    showToast(`"${goal.title}" maqsadiga mablag' muvaffaqiyatli ajratildi! 🎉`);

    // Telegram botga xabarnoma yuborish
    const newTotalGoal = goal.currentAmount + addedToGoal;
    const goalPercent = Math.min(100, Math.round((newTotalGoal / goal.targetAmount) * 100));
    notifyGoalEvent({
      title: goal.title,
      addedText: formatCurrency(addedToGoal, goal.currency),
      currentText: formatCurrency(newTotalGoal, goal.currency),
      targetText: formatCurrency(goal.targetAmount, goal.currency),
      percent: goalPercent,
      walletName: wallet.name,
    });

    return true;
  };

  // Qarzlar CRUD va Qaytarish
  const addDebt = (debtData: Omit<Debt, 'id' | 'paidAmount' | 'isClosed'> & { paidAmount?: number }): boolean => {
    const wallet = wallets.find(w => w.id === debtData.walletId);
    if (!wallet) {
      showToast("Tanlangan hamyon topilmadi!");
      return false;
    }

    if (debtData.amount <= 0) {
      showToast("Qarz summasi 0 dan katta bo'lishi kerak!");
      return false;
    }

    // Hamyon valyutasida kerak bo'ladigan summa
    const amountInWalletCurrency = convertAmount(debtData.amount, debtData.currency, wallet.currency);

    if (debtData.type === 'lent') {
      // Men qarz berdim: hamyondan pul chiqib ketadi
      if (wallet.balance < amountInWalletCurrency) {
        showToast("Hamyonda qarz berish uchun yetarli mablag' yo'q!");
        return false;
      }

      setWallets(prev =>
        prev.map(w => {
          if (w.id === debtData.walletId) {
            const newBal = Math.max(0, Math.round((w.balance - amountInWalletCurrency + Number.EPSILON) * 100) / 100);
            return { ...w, balance: newBal };
          }
          return w;
        })
      );

      // Tranzaksiya yozish (Chiqim)
      const today = new Date().toISOString().split('T')[0];
      const newTx: Transaction = {
        id: `tx-debt-${Date.now()}`,
        walletId: wallet.id,
        type: 'expense',
        amount: amountInWalletCurrency,
        currency: wallet.currency,
        category: 'Qarz berish',
        date: today,
        note: `Qarz berildi: ${debtData.personName}${debtData.note ? ` (${debtData.note})` : ''}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    } else {
      // Men qarz oldim: hamyonga pul kelib tushadi
      setWallets(prev =>
        prev.map(w => {
          if (w.id === debtData.walletId) {
            const newBal = Math.round((w.balance + amountInWalletCurrency + Number.EPSILON) * 100) / 100;
            return { ...w, balance: newBal };
          }
          return w;
        })
      );

      // Tranzaksiya yozish (Kirim)
      const today = new Date().toISOString().split('T')[0];
      const newTx: Transaction = {
        id: `tx-debt-${Date.now()}`,
        walletId: wallet.id,
        type: 'income',
        amount: amountInWalletCurrency,
        currency: wallet.currency,
        category: 'Qarz olish',
        date: today,
        note: `Qarz olindi: ${debtData.personName}${debtData.note ? ` (${debtData.note})` : ''}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    const paid = debtData.paidAmount || 0;
    const isClosed = paid >= debtData.amount;
    const newDebt: Debt = {
      ...debtData,
      id: `debt-${Date.now()}`,
      paidAmount: paid,
      isClosed,
    };

    setDebts(prev => [newDebt, ...prev]);
    showToast(debtData.type === 'lent' ? `"${debtData.personName}"ga qarz berildi!` : `"${debtData.personName}"dan qarz olindi!`);

    // Telegram botga xabarnoma yuborish
    notifyDebtCreatedEvent({
      type: debtData.type,
      personName: debtData.personName,
      amountText: formatCurrency(debtData.amount, debtData.currency),
      walletName: wallet.name,
      dueDate: debtData.dueDate,
      phone: debtData.phone,
      note: debtData.note,
    });

    return true;
  };

  const updateDebt = (id: string, updatedFields: Partial<Debt>) => {
    setDebts(prev =>
      prev.map(d => {
        if (d.id === id) {
          const updated = { ...d, ...updatedFields };
          if (updated.paidAmount !== undefined && updated.amount !== undefined) {
            updated.isClosed = updated.paidAmount >= updated.amount;
          }
          return updated;
        }
        return d;
      })
    );
    showToast("Qarz ma'lumotlari yangilandi!");
  };

  const deleteDebt = (id: string) => {
    const target = debts.find(d => d.id === id);
    setDebts(prev => prev.filter(d => d.id !== id));
    showToast(`"${target?.personName || 'Qarz'}" o'chirildi`);
  };

  const repayDebt = (params: RepayDebtParams): boolean => {
    const { debtId, repayAmount, walletId, note } = params;
    const debt = debts.find(d => d.id === debtId);
    const wallet = wallets.find(w => w.id === walletId);

    if (!debt || !wallet) {
      showToast("Qarz yoki hamyon topilmadi!");
      return false;
    }

    if (repayAmount <= 0) {
      showToast("Qaytarilayotgan summa 0 dan katta bo'lishi kerak!");
      return false;
    }

    const remaining = debt.amount - debt.paidAmount;
    if (repayAmount > remaining + 0.001) {
      showToast(`Qaytarish summasi qolgan qarzdorlikdan (${formatCurrency(remaining, debt.currency)}) oshmasligi kerak!`);
      return false;
    }

    const amountInWalletCurrency = convertAmount(repayAmount, debt.currency, wallet.currency);

    if (debt.type === 'lent') {
      // Menga qaytarishmoqda: hamyonga kirim
      setWallets(prev =>
        prev.map(w => {
          if (w.id === walletId) {
            const newBal = Math.round((w.balance + amountInWalletCurrency + Number.EPSILON) * 100) / 100;
            return { ...w, balance: newBal };
          }
          return w;
        })
      );

      const today = new Date().toISOString().split('T')[0];
      const newTx: Transaction = {
        id: `tx-repay-${Date.now()}`,
        walletId: wallet.id,
        type: 'income',
        amount: amountInWalletCurrency,
        currency: wallet.currency,
        category: 'Qarz qaytarilishi',
        date: today,
        note: `Qarz qaytarildi: ${debt.personName}${note ? ` (${note})` : ''}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    } else {
      // Men qarzni to'layapman: hamyondan chiqim
      if (wallet.balance < amountInWalletCurrency) {
        showToast("Tanlangan hamyonda to'lov uchun mablag' yetarli emas!");
        return false;
      }

      setWallets(prev =>
        prev.map(w => {
          if (w.id === walletId) {
            const newBal = Math.max(0, Math.round((w.balance - amountInWalletCurrency + Number.EPSILON) * 100) / 100);
            return { ...w, balance: newBal };
          }
          return w;
        })
      );

      const today = new Date().toISOString().split('T')[0];
      const newTx: Transaction = {
        id: `tx-repay-${Date.now()}`,
        walletId: wallet.id,
        type: 'expense',
        amount: amountInWalletCurrency,
        currency: wallet.currency,
        category: 'Qarz to\'lovi',
        date: today,
        note: `Qarz to'landi: ${debt.personName}${note ? ` (${note})` : ''}`,
      };
      setTransactions(prev => [newTx, ...prev]);
    }

    const newPaidAmount = Math.round((debt.paidAmount + repayAmount + Number.EPSILON) * 100) / 100;
    const isNowClosed = newPaidAmount >= debt.amount - 0.001;

    setDebts(prev =>
      prev.map(d => {
        if (d.id === debtId) {
          return {
            ...d,
            paidAmount: newPaidAmount,
            isClosed: isNowClosed,
          };
        }
        return d;
      })
    );

    if (isNowClosed) {
      showToast(`"${debt.personName}" bilan qarz to'liq yopildi! 🎉`);
    } else {
      showToast(`"${debt.personName}" qarziga ${formatCurrency(repayAmount, debt.currency)} to'landi!`);
    }

    // Telegram botga xabarnoma yuborish
    const remainingAfter = Math.max(0, debt.amount - newPaidAmount);
    notifyDebtRepaidEvent({
      type: debt.type,
      personName: debt.personName,
      repayText: formatCurrency(repayAmount, debt.currency),
      remainingText: formatCurrency(remainingAfter, debt.currency),
      isClosed: isNowClosed,
      walletName: wallet.name,
    });

    return true;
  };

  // Demo ma'lumotlarni yuklash (Test va tahlil uchun 25+ ta realistik operatsiya)
  const loadDemoData = () => {
    const demoWallets: Wallet[] = [
      { id: 'wallet-1', name: 'Naqd pullar', type: 'cash', currency: 'UZS', balance: 3850000, color: '#10b981', icon: 'banknote' },
      { id: 'wallet-2', name: 'Asosiy karta (Uzcard)', type: 'card', currency: 'UZS', balance: 14200000, color: '#3b82f6', icon: 'credit-card' },
      { id: 'wallet-3', name: 'Valyuta kartasi (Visa USD)', type: 'card', currency: 'USD', balance: 850, color: '#8b5cf6', icon: 'credit-card' },
      { id: 'wallet-4', name: 'Jamg\'arma depozit', type: 'savings', currency: 'UZS', balance: 25000000, color: '#f59e0b', icon: 'piggy-bank' },
    ];

    const demoTransactions: Transaction[] = [
      // Sentabr 2026
      { id: 'tx-sep-1', walletId: 'wallet-2', type: 'income', amount: 12000000, currency: 'UZS', category: 'Asosiy maosh', date: '2026-09-01', note: 'Sentabr oyi ish haqi' },
      { id: 'tx-sep-2', walletId: 'wallet-3', type: 'income', amount: 300, currency: 'USD', category: 'Frilans', date: '2026-09-03', note: 'Mobil ilova dizayni uchun' },
      { id: 'tx-sep-3', walletId: 'wallet-2', type: 'expense', amount: 1850000, currency: 'UZS', category: 'Oziq-ovqat', date: '2026-09-05', note: 'Oylik supermarket xaridi' },
      { id: 'tx-sep-4', walletId: 'wallet-1', type: 'expense', amount: 450000, currency: 'UZS', category: 'Kafe va restoran', date: '2026-09-08', note: 'Hamkasblar bilan kechki ovqat' },
      { id: 'tx-sep-5', walletId: 'wallet-1', type: 'expense', amount: 380000, currency: 'UZS', category: 'Transport', date: '2026-09-12', note: 'Yoqilg\'i quyish va taksi' },
      { id: 'tx-sep-6', walletId: 'wallet-2', type: 'expense', amount: 420000, currency: 'UZS', category: 'Kommunal to\'lovlar', date: '2026-09-15', note: 'Gaz, elektr va suv to\'lovi' },
      { id: 'tx-sep-7', walletId: 'wallet-2', type: 'expense', amount: 1200000, currency: 'UZS', category: 'Ta\'lim', date: '2026-09-20', note: 'Ingliz tili kursi to\'lovi' },
      { id: 'tx-sep-8', walletId: 'wallet-2', toWalletId: 'wallet-1', type: 'transfer', amount: 1500000, currency: 'UZS', category: 'O\'tkazma', date: '2026-09-22', note: 'Kartadan naqd yechib olish' },

      // Oktabr 2026
      { id: 'tx-oct-1', walletId: 'wallet-2', type: 'income', amount: 12000000, currency: 'UZS', category: 'Asosiy maosh', date: '2026-10-01', note: 'Oktabr oyi ish haqi' },
      { id: 'tx-oct-2', walletId: 'wallet-2', type: 'income', amount: 4500000, currency: 'UZS', category: 'Biznes va savdo', date: '2026-10-03', note: 'Onlayn do\'kon daromadi' },
      { id: 'tx-oct-3', walletId: 'wallet-2', type: 'expense', amount: 2100000, currency: 'UZS', category: 'Oziq-ovqat', date: '2026-10-06', note: 'Makro supermarket xaridlari' },
      { id: 'tx-oct-4', walletId: 'wallet-1', type: 'expense', amount: 620000, currency: 'UZS', category: 'Kafe va restoran', date: '2026-10-10', note: 'Oila bilan tushlik' },
      { id: 'tx-oct-5', walletId: 'wallet-2', type: 'expense', amount: 390000, currency: 'UZS', category: 'Kommunal to\'lovlar', date: '2026-10-14', note: 'Kommunal xizmatlar' },
      { id: 'tx-oct-6', walletId: 'wallet-2', type: 'expense', amount: 1500000, currency: 'UZS', category: 'Kiyim-kechak', date: '2026-10-16', note: 'Qishki kiyimlar xaridi' },
      { id: 'tx-oct-7', walletId: 'wallet-1', type: 'expense', amount: 280000, currency: 'UZS', category: 'Sog\'liq va dorilar', date: '2026-10-18', note: 'Vitaminlar va dori-darmon' },
      { id: 'tx-oct-8', walletId: 'wallet-3', type: 'income', amount: 250, currency: 'USD', category: 'Frilans', date: '2026-10-21', note: 'Sayt dasturlash' },
      { id: 'tx-oct-9', walletId: 'wallet-1', type: 'expense', amount: 850000, currency: 'UZS', category: 'Dam olish', date: '2026-10-24', note: 'Dam olish maskani sayohati' },
      { id: 'tx-oct-10', walletId: 'wallet-2', toWalletId: 'wallet-4', type: 'transfer', amount: 3000000, currency: 'UZS', category: 'O\'tkazma', date: '2026-10-26', note: 'Jamg\'arma depozitiga qo\'shildi' },

      // Noyabr 2026
      { id: 'tx-nov-1', walletId: 'wallet-2', type: 'income', amount: 12000000, currency: 'UZS', category: 'Asosiy maosh', date: '2026-11-01', note: 'Noyabr oyi uchun oylik ish haqi' },
      { id: 'tx-nov-2', walletId: 'wallet-3', type: 'income', amount: 250, currency: 'USD', category: 'Frilans', date: '2026-11-02', note: 'Web-dizayn loyihasi uchun to\'lov' },
      { id: 'tx-nov-3', walletId: 'wallet-2', type: 'expense', amount: 850000, currency: 'UZS', category: 'Oziq-ovqat', date: '2026-11-02', note: 'Korzinka supermarketidan oylik oziq-ovqat xaridi' },
      { id: 'tx-nov-4', walletId: 'wallet-1', type: 'expense', amount: 180000, currency: 'UZS', category: 'Kafe va restoran', date: '2026-11-03', note: 'Do\'stlar bilan tushlik' },
      { id: 'tx-nov-5', walletId: 'wallet-1', type: 'expense', amount: 350000, currency: 'UZS', category: 'Transport', date: '2026-11-03', note: 'Avtomobilga yoqilg\'i quyish' },
      { id: 'tx-nov-6', walletId: 'wallet-2', type: 'expense', amount: 420000, currency: 'UZS', category: 'Kommunal to\'lovlar', date: '2026-11-04', note: 'Elektr energiyasi va gaz to\'lovlari' },
      { id: 'tx-nov-7', walletId: 'wallet-2', type: 'expense', amount: 220000, currency: 'UZS', category: 'Aloqa va internet', date: '2026-11-04', note: 'Uy interneti va mobil tarif to\'lovi' },
      { id: 'tx-nov-8', walletId: 'wallet-2', toWalletId: 'wallet-1', type: 'transfer', amount: 500000, currency: 'UZS', category: 'O\'tkazma', date: '2026-11-04', note: 'Kartadan naqdga' },
    ];

    const demoBudgets: Budget[] = [
      { id: 'b-1', category: 'Oziq-ovqat', limitAmount: 2500000, currency: 'UZS' },
      { id: 'b-2', category: 'Kafe va restoran', limitAmount: 800000, currency: 'UZS' },
      { id: 'b-3', category: 'Transport', limitAmount: 600000, currency: 'UZS' },
      { id: 'b-4', category: 'Kommunal to\'lovlar', limitAmount: 500000, currency: 'UZS' },
    ];

    const demoGoals: Goal[] = [
      { id: 'g-1', title: 'Yangi MacBook Pro', targetAmount: 2000, currentAmount: 850, currency: 'USD', deadline: '2026-12-31', color: '#10b981', icon: 'laptop' },
      { id: 'g-2', title: 'Oila bilan sayohat', targetAmount: 25000000, currentAmount: 10000000, currency: 'UZS', deadline: '2027-06-01', color: '#3b82f6', icon: 'palmtree' },
      { id: 'g-3', title: 'Qora kun uchun zaxira', targetAmount: 5000, currentAmount: 2100, currency: 'USD', deadline: '2027-12-31', color: '#8b5cf6', icon: 'shield-check' },
    ];

    const demoDebts: Debt[] = [
      { id: 'debt-1', type: 'lent', personName: 'Anvar aka (O‘rtoq)', phone: '+998 90 123 45 67', amount: 2000000, paidAmount: 500000, currency: 'UZS', walletId: 'wallet-1', dueDate: '2026-11-12', isClosed: false, note: 'Tadbirkorlik uchun vaqtincha yordam' },
      { id: 'debt-2', type: 'borrowed', personName: 'Alisher (Akam)', phone: '+998 97 765 43 21', amount: 300, paidAmount: 0, currency: 'USD', walletId: 'wallet-3', dueDate: '2026-12-05', isClosed: false, note: 'Uy jihozlari uchun olingan' },
    ];

    setWallets(demoWallets);
    setTransactions(demoTransactions);
    setBudgets(demoBudgets);
    setGoals(demoGoals);
    setDebts(demoDebts);
    showToast("26 ta realistik demo operatsiya va ma'lumotlar yuklandi! 🎉");
  };

  // Telegram Bot orqali kiritilgan operatsiyalarni Web-ilovaga sinxronlash
  const syncTelegramBotTransactions = async (): Promise<{ success: boolean; count: number; message: string }> => {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/bot-transactions');
      if (!res.ok) {
        return { success: false, count: 0, message: "Bot API serveriga ulanib bo'lmadi." };
      }

      const data = await res.json();
      if (!data.ok || !Array.isArray(data.transactions) || data.transactions.length === 0) {
        return { success: true, count: 0, message: "Botda yangi operatsiyalar topilmadi." };
      }

      // Mavjud bo'lmagan operatsiyalarni topish
      const existingIds = new Set(transactions.map((t) => t.id));
      const newFromBot = data.transactions.filter((bt: any) => !existingIds.has(bt.id));

      if (newFromBot.length === 0) {
        return { success: true, count: 0, message: "Barcha bot operatsiyalari allaqachon sinxronlangan." };
      }

      const defaultWallet = wallets.find((w) => w.currency === 'UZS') || wallets[0];
      if (!defaultWallet) {
        return { success: false, count: 0, message: "Hamyon mavjud emas!" };
      }

      const txsToAdd: Transaction[] = [];
      let walletDelta = 0;

      newFromBot.forEach((bt: any) => {
        const targetWallet = wallets.find((w) => w.currency === bt.currency) || defaultWallet;
        const newTx: Transaction = {
          id: bt.id || `tx-bot-${Date.now()}-${Math.random()}`,
          walletId: targetWallet.id,
          type: bt.type === 'income' ? 'income' : 'expense',
          amount: Number(bt.amount) || 0,
          currency: targetWallet.currency,
          category: bt.category || (bt.type === 'income' ? 'Boshqa daromad' : 'Boshqa xarajat'),
          date: bt.date || new Date().toISOString().split('T')[0],
          note: bt.note ? `[Telegram] ${bt.note}` : '[Telegram] Operatsiya',
        };

        txsToAdd.push(newTx);
        if (targetWallet.id === defaultWallet.id) {
          walletDelta += newTx.type === 'income' ? newTx.amount : -newTx.amount;
        }
      });

      setTransactions((prev) => [...txsToAdd, ...prev]);
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === defaultWallet.id) {
            return { ...w, balance: Math.max(0, w.balance + walletDelta) };
          }
          return w;
        })
      );

      showToast(`Telegram botdan ${txsToAdd.length} ta operatsiya yuklandi va hisoblandi! 📲`);
      return { success: true, count: txsToAdd.length, message: `${txsToAdd.length} ta operatsiya yuklandi` };
    } catch (err: any) {
      console.error('Bot sinxronizatsiya xatosi:', err);
      return { success: false, count: 0, message: "Sinxronizatsiya xatosi: " + err.message };
    }
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
        ratesMetadata,
        updateExchangeRates,
        fetchLiveRates,
        setIsAutoRefresh,
        setRefreshInterval,
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
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetSpent,
        addGoal,
        updateGoal,
        deleteGoal,
        contributeToGoal,
        addDebt,
        updateDebt,
        deleteDebt,
        repayDebt,
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
        loadDemoData,
        syncTelegramBotTransactions,
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

