import React, { useState, useMemo } from 'react';
import {
  Target,
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  Calendar,
  Clock,
  Laptop,
  Plane,
  Car,
  Home,
  ShieldCheck,
  GraduationCap,
  Gem,
  Trophy,
  ShoppingCart,
  Utensils,
  Zap,
  Shirt,
  HeartPulse,
  Wifi,
  Gamepad2,
  Briefcase,
  Tag,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Budget, Goal } from '../types/finance';
import { formatCurrency, formatDateUz } from '../utils/formatters';
import { BudgetModal } from '../components/budgets/BudgetModal';
import { GoalModal } from '../components/budgets/GoalModal';
import { ContributeGoalModal } from '../components/budgets/ContributeGoalModal';

export const Budgets: React.FC = () => {
  const {
    budgets,
    goals,
    categories,
    baseCurrency,
    isBalanceHidden,
    convertAmount,
    deleteBudget,
    deleteGoal,
    getBudgetSpent,
  } = useFinance();

  // Tab: 'budgets' yoki 'goals'
  const [activeSubTab, setActiveSubTab] = useState<'budgets' | 'goals'>('budgets');

  // Byudjet modallari
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  // Maqsad modallari
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  // Maqsadga pul ajratish modali
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);

  // Kategoriya ikonkasini chizish
  const getCategoryIcon = (categoryName: string, className = 'w-5 h-5') => {
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
      default:
        return <Tag className={className} />;
    }
  };

  const getCategoryColor = (categoryName: string) => {
    const cat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
    return cat?.color || '#10b981';
  };

  // Maqsad ikonkasi
  const renderGoalIcon = (iconName?: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'plane':
        return <Plane className={className} />;
      case 'car':
        return <Car className={className} />;
      case 'home':
        return <Home className={className} />;
      case 'shield-check':
        return <ShieldCheck className={className} />;
      case 'graduation-cap':
        return <GraduationCap className={className} />;
      case 'gem':
        return <Gem className={className} />;
      case 'trophy':
        return <Trophy className={className} />;
      case 'laptop':
      default:
        return <Laptop className={className} />;
    }
  };

  // Oy oxirigacha qolgan kunlarni hisoblash
  const daysRemainingInMonth = useMemo(() => {
    const now = new Date();
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, lastDayOfMonth - now.getDate() + 1);
  }, []);

  // 1-TAB: Byudjetlar jami hisob-kitoblari
  const budgetSummary = useMemo(() => {
    let totalLimitInBase = 0;
    let totalSpentInBase = 0;

    budgets.forEach((b) => {
      totalLimitInBase += convertAmount(b.limitAmount, b.currency, baseCurrency);
      const spent = getBudgetSpent(b.category, b.currency);
      totalSpentInBase += convertAmount(spent, b.currency, baseCurrency);
    });

    const remainingInBase = Math.max(0, totalLimitInBase - totalSpentInBase);
    const overallPercent = totalLimitInBase > 0 ? Math.round((totalSpentInBase / totalLimitInBase) * 100) : 0;

    return {
      totalLimitInBase,
      totalSpentInBase,
      remainingInBase,
      overallPercent,
    };
  }, [budgets, getBudgetSpent, convertAmount, baseCurrency]);

  // 2-TAB: Maqsadlar jami hisob-kitoblari
  const goalSummary = useMemo(() => {
    let totalTargetInBase = 0;
    let totalCurrentInBase = 0;
    let completedCount = 0;

    goals.forEach((g) => {
      totalTargetInBase += convertAmount(g.targetAmount, g.currency, baseCurrency);
      totalCurrentInBase += convertAmount(g.currentAmount, g.currency, baseCurrency);
      if (g.currentAmount >= g.targetAmount) {
        completedCount++;
      }
    });

    const percent = totalTargetInBase > 0 ? Math.round((totalCurrentInBase / totalTargetInBase) * 100) : 0;

    return {
      totalTargetInBase,
      totalCurrentInBase,
      completedCount,
      percent,
    };
  }, [goals, convertAmount, baseCurrency]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">
      {/* Yuqori Segmented Switch (Tab tanlagich) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="grid grid-cols-2 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-800/80 border border-slate-300/60 dark:border-slate-700/60 max-w-md w-full">
          <button
            onClick={() => setActiveSubTab('budgets')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeSubTab === 'budgets'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md shadow-slate-900/5'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4 text-emerald-500" />
            <span>Oylik Byudjet ({budgets.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('goals')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
              activeSubTab === 'goals'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md shadow-slate-900/5'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <PiggyBank className="w-4 h-4 text-purple-500" />
            <span>Kopilka & Maqsadlar ({goals.length})</span>
          </button>
        </div>

        {/* Qo'shish tugmasi */}
        {activeSubTab === 'budgets' ? (
          <button
            onClick={() => {
              setBudgetToEdit(null);
              setIsBudgetModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi limit belgilash</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setGoalToEdit(null);
              setIsGoalModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-purple-600/25 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Yangi maqsad yaratish</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 1-TAB: OYLIK BYUDJET (LIMITLAR) */}
      {/* ========================================================================= */}
      {activeSubTab === 'budgets' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Umumiy Byudjet Xulosasi Card */}
          <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Noyabr oyi umumiy byudjeti
                </span>
                <div className="flex items-baseline gap-3 mt-1">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white">
                    {formatCurrency(budgetSummary.totalSpentInBase, baseCurrency, isBalanceHidden)}
                  </span>
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-400">
                    / {formatCurrency(budgetSummary.totalLimitInBase, baseCurrency, isBalanceHidden)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Oy oxirigacha yana <strong>{daysRemainingInMonth} kun</strong> bor
                </p>
              </div>

              {/* Mini ko'rsatkichlar */}
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block">Qolgan limit:</span>
                  <span className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(budgetSummary.remainingInBase, baseCurrency, isBalanceHidden)}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] text-slate-400 font-semibold block">Sarflanish darajasi:</span>
                  <span
                    className={`text-sm sm:text-base font-black font-mono ${
                      budgetSummary.overallPercent > 100
                        ? 'text-rose-600'
                        : budgetSummary.overallPercent > 70
                        ? 'text-amber-500'
                        : 'text-emerald-600'
                    }`}
                  >
                    {budgetSummary.overallPercent}%
                  </span>
                </div>
              </div>
            </div>

            {/* Umumiy progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetSummary.overallPercent > 100
                    ? 'bg-rose-500'
                    : budgetSummary.overallPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, budgetSummary.overallPercent)}%` }}
              />
            </div>
          </div>

          {/* Kategoriya Byudjet Kartochkalari Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {budgets.map((b) => {
              const spent = getBudgetSpent(b.category, b.currency);
              const percent = b.limitAmount > 0 ? Math.round((spent / b.limitAmount) * 100) : 0;
              const isOver = spent > b.limitAmount;
              const remaining = isOver ? 0 : b.limitAmount - spent;
              const overAmount = isOver ? spent - b.limitAmount : 0;

              // Kunlik tavsiya etilgan sarf
              const dailyAverage = Math.round(remaining / daysRemainingInMonth);

              // Status va Ranglar
              let statusLabel = 'Byudjet nazorat ostida';
              let statusBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
              let barColor = 'bg-emerald-500';

              if (percent >= 100) {
                statusLabel = 'Limitdan oshib ketdi!';
                statusBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
                barColor = 'bg-rose-500';
              } else if (percent >= 70) {
                statusLabel = 'Limitga yaqinlashmoqda!';
                statusBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
                barColor = 'bg-amber-500';
              }

              const catColor = getCategoryColor(b.category);

              return (
                <div
                  key={b.id}
                  className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/40 transition-all"
                >
                  {/* Yuqori qism: Kategoriya va amallar */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm"
                        style={{ backgroundColor: catColor }}
                      >
                        {getCategoryIcon(b.category)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-slate-900 dark:text-white text-base">
                          {b.category}
                        </h4>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border mt-0.5 ${statusBg}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setBudgetToEdit(b);
                          setIsBudgetModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Tahrirlash"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteBudget(b.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Sarflangan va Limit summasi */}
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
                        {formatCurrency(spent, b.currency, isBalanceHidden)}
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-400">
                        Limit: {formatCurrency(b.limitAmount, b.currency, isBalanceHidden)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs mt-2">
                      <span className="font-extrabold font-mono text-slate-700 dark:text-slate-300">
                        {percent}% sarflandi
                      </span>
                      <span className={`font-semibold ${isOver ? 'text-rose-500 font-bold' : 'text-slate-400'}`}>
                        {isOver
                          ? `Limitdan ${formatCurrency(overAmount, b.currency, isBalanceHidden)} oshib ketdi!`
                          : `Qoldi: ${formatCurrency(remaining, b.currency, isBalanceHidden)}`}
                      </span>
                    </div>
                  </div>

                  {/* Tavsiya (Smart Hint) */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="truncate">
                      {!isOver && remaining > 0
                        ? `Limitdan chiqmaslik uchun kuniga ~${formatCurrency(dailyAverage, b.currency)} dan oshirmang`
                        : 'Ushbu toifada xarajatlarni zudlik bilan to\'xtatish tavsiya etiladi'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2-TAB: MOLIYAVIY MAQSADLAR (KOPILKA) */}
      {/* ========================================================================= */}
      {activeSubTab === 'goals' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Yuqori Xulosa Paneli */}
          <div className="rounded-3xl p-6 sm:p-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Jamg'armalar va orzular holati
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
                  {formatCurrency(goalSummary.totalCurrentInBase, baseCurrency, isBalanceHidden)}
                </span>
                <span className="text-sm sm:text-base font-bold font-mono text-slate-400">
                  / {formatCurrency(goalSummary.totalTargetInBase, baseCurrency, isBalanceHidden)}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Barcha maqsadlar umumiy foizi: <strong>{goalSummary.percent}%</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-700 dark:text-purple-300 text-xs">
                <span className="block font-semibold">Muvaffaqiyat:</span>
                <span className="text-base font-extrabold font-mono">
                  {goalSummary.completedCount} / {goals.length} ta erishildi
                </span>
              </div>

              <button
                onClick={() => {
                  setGoalToEdit(null);
                  setIsGoalModalOpen(true);
                }}
                className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Maqsad qo'shish</span>
              </button>
            </div>
          </div>

          {/* Maqsad Kartochkalari Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const percent = goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;
              const isCompleted = goal.currentAmount >= goal.targetAmount;
              const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

              // Muddat hisob-kitobi
              const today = new Date();
              const deadlineDate = new Date(goal.deadline);
              const diffTime = deadlineDate.getTime() - today.getTime();
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const diffMonths = Math.max(1, Math.ceil(diffDays / 30));

              // Oyiga tavsiya etiladigan summa
              const monthlyNeeded = Math.round(remainingAmount / diffMonths);

              return (
                <div
                  key={goal.id}
                  className={`rounded-3xl p-6 shadow-sm border transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    isCompleted
                      ? 'bg-emerald-500/5 dark:bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:shadow-md'
                  }`}
                >
                  {/* Yuqori qism: Ikonka va nom */}
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md"
                          style={{ backgroundColor: goal.color }}
                        >
                          {renderGoalIcon(goal.icon, 'w-6 h-6 stroke-[2.2]')}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-base line-clamp-1">
                            {goal.title}
                          </h4>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{formatDateUz(goal.deadline)}</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setGoalToEdit(goal);
                            setIsGoalModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Tahrirlash"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Holat badjigi */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>🎉 Maqsadga erishildi!</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{diffDays > 0 ? `${diffDays} kun qoldi` : 'Muddat yetib keldi'}</span>
                        </span>
                      )}

                      <span className="font-extrabold font-mono text-sm text-slate-900 dark:text-white">
                        {percent}%
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-gradient-to-r"
                        style={{
                          width: `${percent}%`,
                          backgroundColor: goal.color,
                          backgroundImage: `linear-gradient(to right, ${goal.color}, ${goal.color}dd)`,
                        }}
                      />
                    </div>

                    {/* Summalar */}
                    <div className="flex justify-between items-baseline text-xs mt-2 font-mono">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {formatCurrency(goal.currentAmount, goal.currency, isBalanceHidden)}
                      </span>
                      <span className="text-slate-400 font-semibold">
                        Maqsad: {formatCurrency(goal.targetAmount, goal.currency, isBalanceHidden)}
                      </span>
                    </div>
                  </div>

                  {/* Aqlli Reja & "+ Pul ajratish" tugmasi */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    {!isCompleted && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        O'z vaqtida yetish uchun oyiga <strong>~{formatCurrency(monthlyNeeded, goal.currency)}</strong> ajrating.
                      </p>
                    )}

                    <button
                      onClick={() => setContributeGoal(goal)}
                      className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                        isCompleted
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/25'
                      }`}
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>{isCompleted ? 'Yana to\'ldirish' : 'Pul ajratish (Kopilka)'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modallar */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => {
          setIsBudgetModalOpen(false);
          setBudgetToEdit(null);
        }}
        budgetToEdit={budgetToEdit}
      />

      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalToEdit(null);
        }}
        goalToEdit={goalToEdit}
      />

      <ContributeGoalModal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
      />
    </div>
  );
};
