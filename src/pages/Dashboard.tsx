import React, { useMemo } from 'react';
import {
  Wallet as WalletIcon,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  Plus,
  Coins,
  ShieldCheck,
  Sparkles,
  PieChart,
  Landmark,
  Percent,
  Target,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatCurrency, formatDateUz } from '../utils/formatters';

export const Dashboard: React.FC = () => {
  const {
    wallets,
    transactions,
    categories,
    budgets,
    goals,
    baseCurrency,
    getTotalBalance,
    isBalanceHidden,
    convertAmount,
    setActiveTab,
    openTxModal,
    openTransferModal,
    getBudgetSpent,
    theme,
  } = useFinance();

  const totalBalance = getTotalBalance();

  // Joriy oy boshini aniqlash (YYYY-MM-01)
  const currentMonthPrefix = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, []);

  // Shu oylik daromad va xarajatlarni hisoblash
  const monthlyStats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((tx) => {
      // Faqat joriy oy operatsiyalari
      if (tx.date.startsWith(currentMonthPrefix)) {
        const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
        if (tx.type === 'income') {
          income += converted;
        } else if (tx.type === 'expense') {
          expense += converted;
        }
      }
    });

    const netSavings = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netSavings / income) * 100)) : 0;

    return { income, expense, netSavings, savingsRate };
  }, [transactions, currentMonthPrefix, convertAmount, baseCurrency]);

  // Oxirgi 7 kunlik dinamika grafigi ma'lumotlari (recharts uchun)
  const chartData = useMemo(() => {
    const days: { dateStr: string; dayName: string; income: number; expense: number }[] = [];
    const dayNames = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = i === 0 ? 'Bugun' : dayNames[d.getDay()];

      days.push({
        dateStr,
        dayName,
        income: 0,
        expense: 0,
      });
    }

    transactions.forEach((tx) => {
      const dayEntry = days.find((d) => d.dateStr === tx.date);
      if (dayEntry) {
        const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
        if (tx.type === 'income') {
          dayEntry.income += Math.round(converted);
        } else if (tx.type === 'expense') {
          dayEntry.expense += Math.round(converted);
        }
      }
    });

    return days;
  }, [transactions, convertAmount, baseCurrency]);

  // Joriy oyda Top Xarajat Kategoriyalari
  const topExpenseCategories = useMemo(() => {
    const catMap: Record<string, number> = {};

    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(currentMonthPrefix)) {
        const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
        catMap[tx.category] = (catMap[tx.category] || 0) + converted;
      }
    });

    const sorted = Object.entries(catMap)
      .map(([name, amount]) => {
        const cat = categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
        const percent = monthlyStats.expense > 0 ? Math.round((amount / monthlyStats.expense) * 100) : 0;
        return {
          name,
          amount,
          percent,
          color: cat?.color || '#10b981',
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4);

    return sorted;
  }, [transactions, currentMonthPrefix, categories, convertAmount, baseCurrency, monthlyStats.expense]);

  // Limitga eng yaqinlashgan 2 ta byudjet
  const topCriticalBudgets = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = getBudgetSpent(b.category, b.currency);
        const percent = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
        return {
          ...b,
          spent,
          percent,
        };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 2);
  }, [budgets, getBudgetSpent]);

  // Eng asosiy 2 ta maqsad
  const topGoals = useMemo(() => {
    return goals.slice(0, 2);
  }, [goals]);

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

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* 1. Yuqori KPI Kartochkalari (4 ta, baseCurrency da) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Umumiy balans */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Boylik (Balans)
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WalletIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mb-1">
            {formatCurrency(totalBalance, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>{wallets.length} ta faol hamyon bo'yicha</span>
          </p>
        </div>

        {/* Shu oylik daromad */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-teal-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shu oylik daromad
            </span>
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mb-1">
            +{formatCurrency(monthlyStats.income, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 text-teal-500" />
            <span>Noyabr oyi tushumlari</span>
          </p>
        </div>

        {/* Shu oylik xarajat */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Shu oylik xarajat
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mb-1">
            -{formatCurrency(monthlyStats.expense, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
            <span>Noyabr oyi chiqimlari</span>
          </p>
        </div>

        {/* Sof tejamkorlik */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sof Jamg'arma & Tejam
            </span>
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Percent className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black font-mono mb-1 ${
              monthlyStats.netSavings >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {monthlyStats.netSavings >= 0 ? '+' : ''}
            {formatCurrency(monthlyStats.netSavings, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span className="font-bold text-slate-800 dark:text-slate-200">{monthlyStats.savingsRate}%</span>
            <span>daromaddan tejab qolindi</span>
          </p>
        </div>
      </div>

      {/* 2. Tezkor amallar qatori (Quick Actions) */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-900/30 via-slate-900 to-teal-950/40 p-4 sm:p-5 border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
              Tezkor moliyaviy amallar
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bir zumda daromad, xarajat yoki hamyonlararo o'tkazma kiriting
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          {/* Xarajat kiritish */}
          <button
            onClick={() => openTxModal('expense')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all"
          >
            <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            <span>+ Xarajat</span>
          </button>

          {/* Daromad kiritish */}
          <button
            onClick={() => openTxModal('income')}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>+ Daromad</span>
          </button>

          {/* O'tkazma */}
          <button
            onClick={() => openTransferModal()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/25 transition-all"
          >
            <ArrowLeftRight className="w-4 h-4 stroke-[2.5]" />
            <span>O'tkazma</span>
          </button>
        </div>
      </div>

      {/* 3. Vizual tahlil va Top Xarajatlar (2 ustunli blok) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapda: Recharts BarChart (Haftalik dinamika) */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                Oxirgi 7 kunlik moliyaviy dinamika
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kirim va chiqimlar oqimi ({baseCurrency})
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-slate-600 dark:text-slate-400">Kirim</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-rose-500" />
                <span className="text-slate-600 dark:text-slate-400">Chiqim</span>
              </div>
            </div>
          </div>

          <div className="w-full h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="dayName"
                  stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke={theme === 'dark' ? '#64748b' : '#94a3b8'}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => {
                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                    return val;
                  }}
                />
                <Tooltip
                  cursor={{ fill: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-700 shadow-xl text-xs space-y-1">
                          <p className="font-bold text-slate-300">{data.dateStr} ({data.dayName})</p>
                          <p className="text-emerald-400 font-mono font-semibold">
                            Kirim: +{formatCurrency(data.income, baseCurrency)}
                          </p>
                          <p className="text-rose-400 font-mono font-semibold">
                            Chiqim: -{formatCurrency(data.expense, baseCurrency)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* O'ngda: Top Xarajat Kategoriyalari */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Top Xarajatlar
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Noyabr oyida eng ko'p sarflanganlar
                </p>
              </div>
              <PieChart className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="space-y-4 my-2">
              {topExpenseCategories.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">
                  Ushbu oyda xarajatlar hali qayd etilmagan
                </p>
              ) : (
                topExpenseCategories.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cat.name}
                      </span>
                      <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(cat.amount, baseCurrency, isBalanceHidden)} ({cat.percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.percent}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Jami xarajat:</span>
            <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">
              -{formatCurrency(monthlyStats.expense, baseCurrency, isBalanceHidden)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. YANGI: Byudjet va Maqsadlar holati (Dashboard Vidjeti) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-500" />
              <span>Byudjet limitlari va Moliyaviy maqsadlar</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Oylik chegaralar hamda orzular uchun jamg'arma holati
            </p>
          </div>

          <button
            onClick={() => setActiveTab('budgets')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition-colors"
          >
            <span>Barchasini ko'rish</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Chap ustun: Top Byudjet limitlari */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
              <span>Limitga yaqinlashgan xarajatlar</span>
              <span className="text-[11px] text-slate-400 font-normal">Joriy oy</span>
            </div>

            {topCriticalBudgets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Byudjet belgilanmagan</p>
            ) : (
              topCriticalBudgets.map((b) => {
                const isOver = b.spent > b.limitAmount;
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {b.category}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {formatCurrency(b.spent, b.currency, isBalanceHidden)} / {formatCurrency(b.limitAmount, b.currency, isBalanceHidden)}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-rose-500' : b.percent >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, b.percent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className={`font-semibold ${isOver ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                        {isOver ? 'Limitdan oshdi!' : `${b.percent}% sarflandi`}
                      </span>
                      <span className="text-slate-400">
                        {isOver ? `+${formatCurrency(b.spent - b.limitAmount, b.currency, isBalanceHidden)}` : `Qoldi: ${formatCurrency(b.limitAmount - b.spent, b.currency, isBalanceHidden)}`}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* O'ng ustun: Asosiy Maqsadlar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200/60 dark:border-slate-700/60 pb-2">
              <span>Moliyaviy maqsadlar (Kopilka)</span>
              <span className="text-[11px] text-slate-400 font-normal">{goals.length} ta maqsad</span>
            </div>

            {topGoals.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">Maqsadlar kiritilmagan</p>
            ) : (
              topGoals.map((g) => {
                const percent = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
                return (
                  <div key={g.id} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                        {g.title}
                      </span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        {percent}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all bg-gradient-to-r from-purple-500 to-indigo-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{formatCurrency(g.currentAmount, g.currency, isBalanceHidden)}</span>
                      <span>Maqsad: {formatCurrency(g.targetAmount, g.currency, isBalanceHidden)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 5. Quyi qism (Oxirgi operatsiyalar va Hamyonlar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chapda (2 ustun): Oxirgi 6 ta operatsiya */}
        <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                So'nggi operatsiyalar
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Oxirgi amalga oshirilgan kirim va chiqimlar
              </p>
            </div>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition-colors"
            >
              <span>Barcha operatsiyalar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {transactions.slice(0, 6).map((tx: Transaction) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const wallet = wallets.find((w) => w.id === tx.walletId);
              const toWallet = tx.toWalletId ? wallets.find((w) => w.id === tx.toWalletId) : null;

              return (
                <div
                  key={tx.id}
                  className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isTransfer
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isTransfer ? (
                        <ArrowLeftRight className="w-5 h-5 stroke-[2.2]" />
                      ) : isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                          {tx.category}
                        </h5>
                        <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                          {isTransfer ? `${wallet?.name} ➔ ${toWallet?.name}` : wallet?.name}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-[200px] sm:max-w-sm">
                        {tx.note} • {formatDateUz(tx.date)}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div
                      className={`text-sm sm:text-base font-extrabold font-mono ${
                        isTransfer
                          ? 'text-blue-600 dark:text-blue-400'
                          : isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isTransfer ? '⇄ ' : isIncome ? '+' : '-'}
                      {formatCurrency(tx.amount, tx.currency, isBalanceHidden)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* O'ngda (1 ustun): Mening hamyonlarim */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                  Mening Hamyonlarim
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {wallets.length} ta hisob manbasi
                </p>
              </div>
              <button
                onClick={() => setActiveTab('wallets')}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 transition-colors"
              >
                <span>Boshqarish</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  onClick={() => setActiveTab('wallets')}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
                      style={{ backgroundColor: wallet.color }}
                    >
                      {renderWalletIcon(wallet.icon)}
                    </div>
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {wallet.name}
                      </h5>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {wallet.type === 'cash' ? 'Naqd' : wallet.type === 'card' ? 'Karta' : 'Jamg\'arma'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                      {formatCurrency(wallet.balance, wallet.currency, isBalanceHidden)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('wallets')}
            className="w-full mt-4 py-2.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi hamyon qo'shish</span>
          </button>
        </div>
      </div>
    </div>
  );
};
