import React, { useState, useMemo } from 'react';
import {
  PieChart as PieChartIcon,
  TrendingUp,
  BarChart3,
  Calendar,
  Sparkles,
  Download,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  RefreshCw,
  PiggyBank,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../utils/formatters';
import { exportTransactionsToCSV } from '../utils/csvExport';

type DateRangeFilter =
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'year_to_date'
  | 'all_time';

interface DateRangeOption {
  key: DateRangeFilter;
  label: string;
}

const DATE_RANGE_OPTIONS: DateRangeOption[] = [
  { key: 'this_month', label: 'Shu oy' },
  { key: 'last_month', label: "O'tgan oy" },
  { key: 'last_3_months', label: 'Oxirgi 3 oy' },
  { key: 'last_6_months', label: 'Oxirgi 6 oy' },
  { key: 'year_to_date', label: 'Yil boshi' },
  { key: 'all_time', label: 'Barcha davr' },
];

const CATEGORY_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6', // teal
  '#6366f1', // indigo
  '#ef4444', // red
  '#64748b', // slate
];

export const Analytics: React.FC = () => {
  const {
    transactions,
    wallets,
    budgets,
    debts,
    baseCurrency,
    isBalanceHidden,
    convertAmount,
    getBudgetSpent,
    loadDemoData,
    showToast,
    theme,
  } = useFinance();

  const [dateRange, setDateRange] = useState<DateRangeFilter>('this_month');
  const [isAiRefreshing, setIsAiRefreshing] = useState<boolean>(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState<boolean>(false);

  // Tanlangan sana oralig'ining boshlanish va tugash sanalarini hisoblash
  const { startDate, endDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    let start = new Date(currentYear, currentMonth, 1);
    let end = new Date(currentYear, currentMonth + 1, 0);
    let label = 'Noyabr oyi';

    switch (dateRange) {
      case 'this_month':
        start = new Date(currentYear, currentMonth, 1);
        end = new Date(currentYear, currentMonth + 1, 0);
        label = 'Joriy oy';
        break;
      case 'last_month':
        start = new Date(currentYear, currentMonth - 1, 1);
        end = new Date(currentYear, currentMonth, 0);
        label = "O'tgan oy";
        break;
      case 'last_3_months':
        start = new Date(currentYear, currentMonth - 2, 1);
        end = new Date(currentYear, currentMonth + 1, 0);
        label = 'Oxirgi 3 oy';
        break;
      case 'last_6_months':
        start = new Date(currentYear, currentMonth - 5, 1);
        end = new Date(currentYear, currentMonth + 1, 0);
        label = 'Oxirgi 6 oy';
        break;
      case 'year_to_date':
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, currentMonth + 1, 0);
        label = 'Yil boshidan buyon';
        break;
      case 'all_time':
        start = new Date(2020, 0, 1);
        end = new Date(currentYear + 1, 11, 31);
        label = 'Barcha davrlar';
        break;
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    return { startDate: startStr, endDate: endStr, rangeLabel: label };
  }, [dateRange]);

  // Tanlangan sana oralig'idagi operatsiyalarni filtrlash
  const filteredTransactions = useMemo(() => {
    return transactions.filter(
      (tx) => tx.date >= startDate && tx.date <= endDate
    );
  }, [transactions, startDate, endDate]);

  // 1. KPI Xulosa ko'rsatkichlari
  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    filteredTransactions.forEach((tx) => {
      const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        totalIncome += converted;
      } else if (tx.type === 'expense') {
        totalExpense += converted;
      }
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0
        ? Math.max(-100, Math.min(100, Math.round((netSavings / totalIncome) * 100)))
        : totalExpense > 0
        ? -100
        : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
    };
  }, [filteredTransactions, convertAmount, baseCurrency]);

  // 2. Blok 1: Xarajatlar toifalari bo'yicha Doiraviy Diagramma (PieChart)
  const categoryExpenses = useMemo(() => {
    const catMap: Record<string, number> = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'expense') {
        const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
        catMap[tx.category] = (catMap[tx.category] || 0) + converted;
      }
    });

    const totalExp = Object.values(catMap).reduce((a, b) => a + b, 0);

    const sorted = Object.entries(catMap)
      .map(([name, value], index) => {
        const percent = totalExp > 0 ? Math.round((value / totalExp) * 100) : 0;
        return {
          name,
          value: Math.round(value),
          percent,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
        };
      })
      .sort((a, b) => b.value - a.value);

    return { data: sorted, totalExpense: totalExp };
  }, [filteredTransactions, convertAmount, baseCurrency]);

  // 3. Blok 2: Oylar kesimida Daromad va Xarajat solishtirmasi (BarChart)
  const monthlyComparison = useMemo(() => {
    const monthNames = [
      'Yanvar',
      'Fevral',
      'Mart',
      'Aprel',
      'May',
      'Iyun',
      'Iyul',
      'Avgust',
      'Sentabr',
      'Oktabr',
      'Noyabr',
      'Dekabr',
    ];

    const monthMap: Record<
      string,
      { monthKey: string; monthLabel: string; income: number; expense: number }
    > = {};

    filteredTransactions.forEach((tx) => {
      if (tx.type !== 'income' && tx.type !== 'expense') return;

      const datePart = tx.date.split('-'); // YYYY, MM, DD
      if (datePart.length >= 2) {
        const monthKey = `${datePart[0]}-${datePart[1]}`;
        const monthNum = parseInt(datePart[1], 10) - 1;
        const monthLabel = monthNames[monthNum] || monthKey;

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            monthKey,
            monthLabel,
            income: 0,
            expense: 0,
          };
        }

        const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
        if (tx.type === 'income') {
          monthMap[monthKey].income += Math.round(converted);
        } else {
          monthMap[monthKey].expense += Math.round(converted);
        }
      }
    });

    return Object.values(monthMap).sort((a, b) =>
      a.monthKey.localeCompare(b.monthKey)
    );
  }, [filteredTransactions, convertAmount, baseCurrency]);

  // 4. Blok 3: Sof Balans va Jamg'arma Dinamikasi (Area / Line chart)
  const cumulativeTrend = useMemo(() => {
    // Tranzaksiyalarni sanasi bo'yicha saralash
    const sorted = [...filteredTransactions].sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    let runningSavings = 0;
    const trendMap: Record<string, { date: string; balance: number }> = {};

    sorted.forEach((tx) => {
      const converted = convertAmount(tx.amount, tx.currency, baseCurrency);
      if (tx.type === 'income') {
        runningSavings += converted;
      } else if (tx.type === 'expense') {
        runningSavings -= converted;
      }

      // Har bir sana uchun oxirgi balansni yozish
      trendMap[tx.date] = {
        date: tx.date.slice(5), // MM-DD
        balance: Math.round(runningSavings),
      };
    });

    return Object.values(trendMap);
  }, [filteredTransactions, convertAmount, baseCurrency]);

  // 5. Smart AI Maslahatchi Tahlili (AI Financial Advisor)
  const aiInsights = useMemo(() => {
    const list: {
      type: 'warning' | 'success' | 'alert' | 'tip';
      title: string;
      message: string;
      badge: string;
    }[] = [];

    // 1. Kategoriya anomaliyasi tahlili
    if (categoryExpenses.data.length > 0) {
      const topCat = categoryExpenses.data[0];
      if (topCat.percent >= 30) {
        list.push({
          type: 'warning',
          title: `Xarajatlar nomutanosibligi: ${topCat.name}`,
          message: `Diqqat: Xarajatlaringizning ${topCat.percent}% qismi (${formatCurrency(topCat.value, baseCurrency)}) aynan "${topCat.name}" toifasiga to'g'ri kelmoqda. Bu ko'rsatkichni me'yorlashtirish orqali oylik jamg'armani sezilarli oshirishingiz mumkin!`,
          badge: 'Muhim tahlil',
        });
      } else {
        list.push({
          type: 'success',
          title: "Xarajatlar to'g'ri taqsimlangan",
          message: `Ajoyib! Sizning xarajatlaringiz turli toifalar bo'yicha me'yorda taqsimlangan. Eng yirik xarajat "${topCat.name}" bo'lib, umumiy summaning atigi ${topCat.percent}% qismini tashkil etadi.`,
          badge: 'Balanslashgan',
        });
      }
    }

    // 2. Jamg'arma darajasi (Savings rate) tahlili
    if (summary.savingsRate >= 20) {
      list.push({
        type: 'success',
        title: "Mustahkam jamg'arma sur'ati",
        message: `Ajoyib natija! Tanlangan davrda tushgan jami daromadingizning ${summary.savingsRate}% qismini (${formatCurrency(summary.netSavings, baseCurrency)}) tejab qoldingiz. Moliyaviy xavfsizlik yostig'ingiz tobora mustahkamlanmoqda! 🚀`,
        badge: 'Zo\'r natija',
      });
    } else if (summary.savingsRate > 0 && summary.savingsRate < 20) {
      list.push({
        type: 'tip',
        title: "Jamg'arma imkoniyati",
        message: `Siz bu davrda daromadning ${summary.savingsRate}% qismini tejam qildingiz. Klassik moliyaviy qoidaga ko'ra, har bir daromadning kamida 20% qismini zaxira va investitsiyaga yo'naltirish tavsiya etiladi.`,
        badge: 'Tavsiya',
      });
    } else if (summary.totalExpense > summary.totalIncome) {
      list.push({
        type: 'alert',
        title: "Moliyaviy kamomad (Defitsit) ogohlantirishi!",
        message: `Ogohlantirish: Xarajatlaringiz jami daromadingizdan ${formatCurrency(Math.abs(summary.netSavings), baseCurrency)} ga oshib ketdi. Zudlik bilan ikkinchi darajali xarajatlarni qisqartiring yoki qo'shimcha daromad manbalarini jalb qiling.`,
        badge: 'Xavf',
      });
    }

    // 3. Byudjet xavfi tahlili
    let highRiskBudgetFound = false;
    budgets.forEach((b) => {
      const spent = getBudgetSpent(b.category, b.currency);
      if (b.limitAmount > 0) {
        const pct = Math.round((spent / b.limitAmount) * 100);
        if (pct >= 85) {
          highRiskBudgetFound = true;
          list.push({
            type: 'alert',
            title: `Byudjet xavfi: ${b.category}`,
            message: `"${b.category}" toifasida belgilangan oylik limitning ${pct}% qismi sarflab bo'lindi (${formatCurrency(spent, b.currency)} / ${formatCurrency(b.limitAmount, b.currency)}). Qolgan kunlarda ushbu toifaga sarf-xarajatni cheklang!`,
            badge: `${pct}% sarflandi`,
          });
        }
      }
    });

    if (!highRiskBudgetFound && budgets.length > 0) {
      list.push({
        type: 'success',
        title: "Byudjet limitlari to'liq nazoratda",
        message: `Barcha belgilangan ${budgets.length} ta oylik xarajat limitlari xavfsiz chegarada ushlab turilibdi. Oylik reja intizom bilan bajarilmoqda.`,
        badge: 'Xavfsiz',
      });
    }

    // 4. Qarz majburiyatlari xavfi
    const activeBorrowed = debts.filter((d) => !d.isClosed && d.type === 'borrowed');
    if (activeBorrowed.length > 0) {
      const totalBorrowedLeft = activeBorrowed.reduce(
        (sum, d) => sum + convertAmount(d.amount - d.paidAmount, d.currency, baseCurrency),
        0
      );
      list.push({
        type: 'tip',
        title: "Qarzdorlik majburiyatlarini yopish",
        message: `Sizda ${activeBorrowed.length} ta to'lanishi kerak bo'lgan faol qarz mavjud (${formatCurrency(totalBorrowedLeft, baseCurrency)}). Moliyaviy erkinlik uchun avval qarz majburiyatlarini to'liq yopishni rejalashtiring.`,
        badge: 'Majburiyat',
      });
    }

    // 5. Oltin moliyaviy maslahat (Doimiy qoida)
    list.push({
      type: 'tip',
      title: "50/30/20 Qoidasini qo'llang",
      message: "Moliyaviy barqarorlik siri: Daromadning 50% qismini majburiy ehtiyojlarga (oziq-ovqat, kommunal, ijara), 30% qismini shaxsiy xohishlarga (dam olish, kiyim), 20% qismini esa darhol jamg'arma va kelajakka ajrating.",
      badge: 'Oltin Qoida',
    });

    return list;
  }, [categoryExpenses, summary, budgets, debts, getBudgetSpent, convertAmount, baseCurrency]);

  const handleRefreshAi = () => {
    setIsAiRefreshing(true);
    setTimeout(() => {
      setIsAiRefreshing(false);
      showToast("AI moliyaviy tahlili qayta yangilandi! 🧠✨");
    }, 600);
  };

  const handleExportCSV = () => {
    const success = exportTransactionsToCSV(transactions, wallets);
    if (success) {
      showToast("Barcha operatsiyalar CSV formatida yuklab olindi! 📥");
    } else {
      showToast("Eksport qilish uchun operatsiyalar topilmadi!");
    }
  };

  const handleLoadDemo = () => {
    loadDemoData();
    setShowDemoConfirm(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      
      {/* 1. Yuqori Action Bar: Sana Oralig'i va Eksport Tugmalari */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        
        {/* Sana Oralig'i Chipi */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Tahlil davri: {rangeLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {DATE_RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDateRange(opt.key)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  dateRange === opt.key
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Eksport va Demo yuklash tugmalari */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* CSV Eksport */}
          <button
            onClick={handleExportCSV}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shadow-sm"
            title="Excel va CSV formatida yuklab olish"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>CSV Eksport</span>
          </button>

          {/* Demo Ma'lumotlarni Yuklash */}
          <button
            onClick={() => setShowDemoConfirm(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-xs font-bold transition-all"
            title="Tizimga 26 ta realistik demo operatsiya yuklash"
          >
            <Database className="w-4 h-4" />
            <span>Demo yuklash (25+)</span>
          </button>
        </div>

      </div>

      {/* 2. Tanlangan Davr bo'yicha 4 ta KPI Xulosa Kartochkalari */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Jami Daromad */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Daromad ({rangeLabel})
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mb-1">
            +{formatCurrency(summary.totalIncome, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Tanlangan davrdagi barcha tushumlar
          </p>
        </div>

        {/* Jami Xarajat */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jami Xarajat ({rangeLabel})
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono mb-1">
            -{formatCurrency(summary.totalExpense, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Barcha toifalar bo'yicha sarflangan
          </p>
        </div>

        {/* Sof Tejamkorlik */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-blue-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Sof Jamg'arma (Foyda)
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold font-mono mb-1 ${
              summary.netSavings >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {summary.netSavings >= 0 ? '+' : ''}
            {formatCurrency(summary.netSavings, baseCurrency, isBalanceHidden)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Daromad va xarajat orasidagi sof farq
          </p>
        </div>

        {/* Jamg'arma Darajasi */}
        <div className="rounded-3xl p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-purple-500/50 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Jamg'arma Sur'ati
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-2xl font-extrabold font-mono mb-1 ${
              summary.savingsRate >= 20
                ? 'text-emerald-600 dark:text-emerald-400'
                : summary.savingsRate > 0
                ? 'text-amber-500 dark:text-amber-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {summary.savingsRate}%
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {summary.savingsRate >= 20
              ? "Yuqori darajadagi tejamkorlik"
              : summary.savingsRate > 0
              ? "O'rtacha jamg'arma darajasi"
              : "Xarajatlar daromaddan yuqori"}
          </p>
        </div>

      </div>

      {/* 3. Recharts Grafiklari (2 ustunli katta blok) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* BLOK 1: Xarajatlar toifalari bo'yicha Doiraviy Donut Grafik (5 ustun) */}
        <div className="lg:col-span-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-500" />
                <span>Xarajatlar strukturasi</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toifalar bo'yicha xarajatlar taqsimoti
              </p>
            </div>
            <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">
              {formatCurrency(categoryExpenses.totalExpense, baseCurrency, isBalanceHidden)}
            </span>
          </div>

          {categoryExpenses.data.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              Ushbu davrda xarajatlar mavjud emas
            </div>
          ) : (
            <div>
              {/* Doiraviy Grafik */}
              <div className="h-60 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryExpenses.data}
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryExpenses.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [
                        formatCurrency(val, baseCurrency),
                        'Summa',
                      ]}
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                        borderRadius: '1rem',
                        fontSize: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut markazidagi summa */}
                <div className="absolute text-center pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Jami Sarf
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(categoryExpenses.totalExpense, baseCurrency, isBalanceHidden)}
                  </span>
                </div>
              </div>

              {/* Toifalar Ro'yxati / Legend */}
              <div className="space-y-2 mt-4 max-h-52 overflow-y-auto pr-1">
                {categoryExpenses.data.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex items-center justify-between text-xs p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-500 dark:text-slate-400">
                        {formatCurrency(cat.value, baseCurrency, isBalanceHidden)}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white w-10 text-right">
                        {cat.percent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* BLOK 2: Oylik Daromad va Xarajat Solishtirma Grafigi (7 ustun) */}
        <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-500" />
                <span>Oylik Daromad va Xarajat solishtirmasi</span>
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Oylar kesimida kassa oqimi balansi ({baseCurrency})
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

          {monthlyComparison.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              Ushbu davrda solishtirish uchun operatsiyalar yetarli emas
            </div>
          ) : (
            <div className="h-80 w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyComparison}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={isDark ? '#1e293b' : '#f1f5f9'}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="monthLabel"
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                    axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      v >= 1000000
                        ? `${(v / 1000000).toFixed(1)}M`
                        : v >= 1000
                        ? `${(v / 1000).toFixed(0)}k`
                        : `${v}`
                    }
                  />
                  <Tooltip
                    formatter={(val: number, name: string) => [
                      formatCurrency(val, baseCurrency),
                      name === 'income' ? 'Kirim' : 'Chiqim',
                    ]}
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      borderRadius: '1rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

      </div>

      {/* 4. BLOK 3: Sof Balans va Kapital Dinamikasi (Line / Area Chart) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div>
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              <span>Kapital va Jamg'arma O'sish Dinamikasi</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Vaqt o'tishi bilan sof jamg'arma oqimining o'sish traektoriyasi ({baseCurrency})
            </p>
          </div>
        </div>

        {cumulativeTrend.length < 2 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            Dinamikani ko'rsatish uchun kamida 2 xil kundagi operatsiyalar zarur
          </div>
        ) : (
          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={cumulativeTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={isDark ? '#1e293b' : '#f1f5f9'}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: isDark ? '#334155' : '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000000
                      ? `${(v / 1000000).toFixed(1)}M`
                      : v >= 1000
                      ? `${(v / 1000).toFixed(0)}k`
                      : `${v}`
                  }
                />
                <Tooltip
                  formatter={(val: number) => [
                    formatCurrency(val, baseCurrency),
                    'Sof jamg\'arma',
                  ]}
                  contentStyle={{
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    borderRadius: '1rem',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#balanceGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* 5. SMART AI MASLAHATCHI (AI Financial Advisor) */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/70 text-white p-6 sm:p-7 border border-emerald-500/30 shadow-xl relative overflow-hidden">
        
        {/* Orqa fon nur effekti */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* AI Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold">
                  Smart AI Moliyaviy Maslahatchi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  AI Tahlil
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real tranzaksiyalaringiz, odatlaringiz va byudjetlaringiz asosida avtomatik tahlil
              </p>
            </div>
          </div>

          <button
            onClick={handleRefreshAi}
            disabled={isAiRefreshing}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAiRefreshing ? 'animate-spin' : ''}`} />
            <span>AI tahlilini yangilash</span>
          </button>
        </div>

        {/* AI Tavsiyalar Kartalari Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {aiInsights.map((insight, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl bg-slate-800/80 border border-slate-700/80 hover:border-emerald-500/40 transition-all flex flex-col justify-between gap-2.5 group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    {insight.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : insight.type === 'alert' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : insight.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Lightbulb className="w-4 h-4 text-sky-400" />
                    )}
                    <h5 className="font-bold text-sm text-white">
                      {insight.title}
                    </h5>
                  </div>

                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-700 text-slate-300">
                    {insight.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {insight.message}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Demo ma'lumotlarni tasdiqlash modali */}
      {showDemoConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center mb-3">
              <Database className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1.5">
              Demo ma'lumotlarni yuklash
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
              Ilovangizga oxirgi 3 oy uchun <strong>26 ta realistik operatsiya</strong>, 4 ta hamyon, byudjet va maqsadlar yuklanadi. Davom etasizmi?
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowDemoConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
              >
                Bekor qilish
              </button>
              <button
                type="button"
                onClick={handleLoadDemo}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30"
              >
                Yuklash
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
