export type Currency = 'UZS' | 'USD' | 'EUR';

export type WalletType = 'cash' | 'card' | 'savings';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  currency: Currency;
  balance: number;
  color: string;
  icon: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  category: string;
  date: string; // ISO string YYYY-MM-DD
  note: string;
  toWalletId?: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  currency: Currency;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  currency: Currency;
  deadline: string; // YYYY-MM-DD
  color: string;
  icon?: string;
}

export interface ContributeGoalParams {
  goalId: string;
  walletId: string;
  amount: number;
  note?: string;
}

export type DebtType = 'lent' | 'borrowed'; // lent = berilgan qarz, borrowed = olingan qarz

export interface Debt {
  id: string;
  type: DebtType;
  personName: string;
  phone?: string;
  amount: number;
  paidAmount: number;
  currency: Currency;
  walletId: string;
  dueDate: string; // YYYY-MM-DD
  isClosed: boolean;
  note?: string;
}

export type NavigationTab = 
  | 'dashboard' 
  | 'wallets' 
  | 'transactions' 
  | 'budgets' 
  | 'debts' 
  | 'analytics';

export type ThemeMode = 'light' | 'dark';

export interface ExchangeRates {
  USD: number; // 1 USD in UZS (masalan: 12850)
  EUR: number; // 1 EUR in UZS (masalan: 13900)
  UZS: number; // 1 UZS in UZS (= 1)
}

export interface ExchangeRateDiff {
  USD: number;
  EUR: number;
}

export interface RatesMetadata {
  source: 'cbu' | 'er-api' | 'manual';
  lastUpdated: string; // Masalan: "19:25:34"
  lastSyncTimestamp: number;
  status: 'connected' | 'updating' | 'error';
  diff: ExchangeRateDiff;
  isAutoRefresh: boolean;
  refreshInterval: number; // ms, masalan: 1000 (har soniyada)
  secondsSinceUpdate: number;
  tickCount: number;
}

export interface TransferParams {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  customRate?: number;
  fee?: number;
  date?: string;
  note?: string;
}

export interface FinanceContextType {
  // Asosiy ma'lumotlar
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debts: Debt[];

  // Sozlamalar va holatlar
  baseCurrency: Currency;
  setBaseCurrency: (currency: Currency) => void;
  exchangeRates: ExchangeRates;
  ratesMetadata: RatesMetadata;
  updateExchangeRates: (rates: { USD: number; EUR: number }) => void;
  fetchLiveRates: (showToastNotification?: boolean) => Promise<void>;
  setIsAutoRefresh: (enabled: boolean) => void;
  setRefreshInterval: (intervalMs: number) => void;
  isBalanceHidden: boolean;
  toggleBalanceHidden: () => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Hisob-kitob yordamchilari
  convertAmount: (amount: number, from: Currency, to: Currency) => number;
  getTotalBalance: () => number;
  getTotalByType: (type: WalletType) => number;

  // CRUD va O'tkazma operatsiyalari
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, wallet: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  transferBetweenWallets: (params: TransferParams) => boolean;

  addTransaction: (transaction: Omit<Transaction, 'id'>) => boolean;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => boolean;
  deleteTransaction: (id: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;

  // Byudjetlar CRUD
  addBudget: (budget: Omit<Budget, 'id'>) => void;
  updateBudget: (id: string, budget: Partial<Budget>) => void;
  deleteBudget: (id: string) => void;
  getBudgetSpent: (category: string, currency: Currency) => number;

  // Maqsadlar CRUD va To'ldirish
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  contributeToGoal: (params: ContributeGoalParams) => boolean;

  // Global Modallar boshqaruvi
  isTxModalOpen: boolean;
  editingTx: Transaction | null;
  defaultTxType: 'income' | 'expense';
  openTxModal: (type?: 'income' | 'expense', tx?: Transaction) => void;
  closeTxModal: () => void;

  isTransferModalOpen: boolean;
  transferDefaultFromId: string | null;
  openTransferModal: (fromWalletId?: string) => void;
  closeTransferModal: () => void;

  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>;
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  setDebts: React.Dispatch<React.SetStateAction<Debt[]>>;

  // Toast / Xabarlar
  toastMessage: string | null;
  showToast: (msg: string) => void;
  clearToast: () => void;
}

