import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Cell,
  LabelList,
} from 'recharts';
import { MotherDailyCheckIn, MotherSettings } from '@/domain/types';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Scale,
  TrendingUp,
  Droplets,
  Dumbbell,
  Utensils,
  Target,
  Plus,
  Edit2,
  Trash2,
  Filter,
  Settings2,
  Check,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import { parseISO, differenceInCalendarDays } from 'date-fns';

interface MotherAnalyticsAndGoalsSectionProps {
  allCheckIns: MotherDailyCheckIn[];
  settings: MotherSettings;
  todayStr: string;
  logDate: string;
  setLogDate: (d: string) => void;
  logWeight: string;
  setLogWeight: (w: string) => void;
  logWater: number;
  setLogWater: (g: number) => void;
  logWorkout: boolean;
  setLogWorkout: React.Dispatch<React.SetStateAction<boolean>>;
  logNote: string;
  setLogNote: (n: string) => void;
  onSaveHistoryLog: (e: React.FormEvent) => void;
  onSelectLogToEdit: (item: MotherDailyCheckIn) => void;
  onDeleteHistoryLog: (date: string) => void;
  onSaveSettings: (patch: Partial<MotherSettings>) => void;
  getCheckInByDate: (date: string) => MotherDailyCheckIn;
}

type PeriodFilterType = 'week' | 'month' | 'year' | 'all';

const CustomCombinedTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;

  return (
    <div className="bg-app-surface/95 backdrop-blur-md border border-app-border rounded-2xl shadow-xl p-3.5 text-xs min-w-[210px] space-y-2">
      <div className="flex items-center justify-between border-b border-app-border pb-1.5">
        <span className="font-black text-content-primary text-sm">
          📅 Ngày {data.fullDateDisplay}
        </span>
        {data.workoutCompleted ? (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-black text-[10px]">
            ✅ Đã tập
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-content-muted font-bold text-[10px]">
            Nghỉ tập
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-content-secondary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            Cân nặng:
          </span>
          <span className="font-black text-rose-600 dark:text-rose-400">
            {data.weightKg ? `${data.weightKg} kg` : 'Chưa cân'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-content-secondary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 inline-block" />
            Nước uống:
          </span>
          <span className="font-black text-sky-600 dark:text-sky-400">
            {data.waterGlasses}/8 cốc ({data.waterGlasses * 250} ml)
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-content-secondary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
            Luyện tập:
          </span>
          <span className="font-bold text-emerald-600 dark:text-emerald-400">
            {data.workoutCompleted ? 'Hoàn thành bài tập 💪' : 'Chưa tập / Nghỉ'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-content-secondary flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
            Thực đơn:
          </span>
          <span className="font-bold text-content-primary">
            {data.mealsCount}/4 bữa chuẩn
          </span>
        </div>
      </div>

      {data.note && (
        <div className="pt-1.5 border-t border-app-border text-[11px] text-content-secondary italic">
          “{data.note}”
        </div>
      )}
    </div>
  );
};

export const MotherAnalyticsAndGoalsSection: React.FC<MotherAnalyticsAndGoalsSectionProps> = ({
  allCheckIns,
  settings,
  todayStr,
  logDate,
  setLogDate,
  logWeight,
  setLogWeight,
  logWater,
  setLogWater,
  logWorkout,
  setLogWorkout,
  logNote,
  setLogNote,
  onSaveHistoryLog,
  onSelectLogToEdit,
  onDeleteHistoryLog,
  onSaveSettings,
  getCheckInByDate,
}) => {
  // ── Persisted View & Filter Setup (Tuần / Tháng / Năm / Tất cả + Ẩn/Hiện Label) ──
  const periodFilter: PeriodFilterType = settings.chartPeriodFilter || 'week';
  const selectedMonth: string = settings.chartSelectedMonth || todayStr.slice(0, 7);
  const selectedYear: string = settings.chartSelectedYear || todayStr.slice(0, 4);
  const showLabels: boolean = settings.chartShowLabels !== false;

  const handleChangePeriodFilter = (nextPeriod: PeriodFilterType) => {
    onSaveSettings({ chartPeriodFilter: nextPeriod });
  };

  const handleChangeSelectedMonth = (nextMonth: string) => {
    onSaveSettings({ chartSelectedMonth: nextMonth });
  };

  const handleChangeSelectedYear = (nextYear: string) => {
    onSaveSettings({ chartSelectedYear: nextYear });
  };

  const handleToggleChartLabels = () => {
    onSaveSettings({ chartShowLabels: !showLabels });
  };

  // ── Goal Configuration Inline Modal/Drawer ──
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [gStartWeight, setGStartWeight] = useState<number>(settings.startWeightKg || 56);
  const [gTargetWeight, setGTargetWeight] = useState<number>(settings.targetWeightKg || 52);
  const [gTargetWorkouts, setGTargetWorkouts] = useState<number>(
    settings.targetWorkoutsPerWeek || 5
  );
  const [gTargetWaterLiters, setGTargetWaterLiters] = useState<number>(
    settings.targetWaterLiters || 2.0
  );

  const openGoalEditor = () => {
    setGStartWeight(settings.startWeightKg || 56);
    setGTargetWeight(settings.targetWeightKg || 52);
    setGTargetWorkouts(settings.targetWorkoutsPerWeek || 5);
    setGTargetWaterLiters(settings.targetWaterLiters || 2.0);
    setIsEditingGoals(true);
  };

  const handleSaveGoals = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      startWeightKg: gStartWeight,
      targetWeightKg: gTargetWeight,
      targetWorkoutsPerWeek: gTargetWorkouts,
      targetWaterLiters: gTargetWaterLiters,
    });
    setIsEditingGoals(false);
  };

  // Available months & years in check-ins
  const availableMonths = useMemo(() => {
    const set = new Set<string>([todayStr.slice(0, 7)]);
    allCheckIns.forEach((c) => {
      if (c.date && c.date.length >= 7) set.add(c.date.slice(0, 7));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allCheckIns, todayStr]);

  const availableYears = useMemo(() => {
    const set = new Set<string>([todayStr.slice(0, 4)]);
    allCheckIns.forEach((c) => {
      if (c.date && c.date.length >= 4) set.add(c.date.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [allCheckIns, todayStr]);

  // Filtered check-ins sorted ascending for chart
  const filteredAsc = useMemo(() => {
    const sorted = [...allCheckIns].sort((a, b) => a.date.localeCompare(b.date));
    if (periodFilter === 'week') {
      // Last 7 days relative to latest date or today
      const refDate = parseISO(todayStr);
      const within7 = sorted.filter((c) => {
        try {
          const d = parseISO(c.date);
          const diff = differenceInCalendarDays(refDate, d);
          return diff >= -1 && diff <= 7;
        } catch {
          return false;
        }
      });
      return within7.length > 0 ? within7 : sorted.slice(-7);
    }
    if (periodFilter === 'month') {
      return sorted.filter((c) => c.date.startsWith(selectedMonth));
    }
    if (periodFilter === 'year') {
      return sorted.filter((c) => c.date.startsWith(selectedYear));
    }
    return sorted;
  }, [allCheckIns, periodFilter, selectedMonth, selectedYear, todayStr]);

  // Filtered check-ins sorted descending for table
  const filteredDesc = useMemo(() => {
    return [...filteredAsc].sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredAsc]);

  // Prepare Chart Data for ComposedChart (Bar + Line)
  const chartData = useMemo(() => {
    return filteredAsc.map((item) => {
      const dd = item.date.slice(8, 10);
      const mm = item.date.slice(5, 7);
      const yyyy = item.date.slice(0, 4);
      return {
        date: item.date,
        shortDate: `${dd}/${mm}`,
        fullDateDisplay: `${dd}/${mm}/${yyyy}`,
        weightKg: item.weightKg ?? null,
        waterGlasses: item.waterGlasses ?? 0,
        // Biểu diễn Luyện tập ở nửa dưới biểu đồ (qui đổi = 7 để hài hoà cạnh cốc nước)
        workoutScore: item.workoutCompleted ? 7 : 0,
        workoutCompleted: Boolean(item.workoutCompleted),
        mealsCount: item.completedMeals?.length || 0,
        note: item.note || '',
        raw: item,
      };
    });
  }, [filteredAsc]);

  // ── Overall & Period Goal Completion Calculations ──
  const goalMetrics = useMemo(() => {
    const allSortedWithWeight = [...allCheckIns]
      .filter((c) => typeof c.weightKg === 'number' && c.weightKg > 0)
      .sort((a, b) => a.date.localeCompare(b.date));

    const startWeight =
      settings.startWeightKg ||
      (allSortedWithWeight.length > 0 ? allSortedWithWeight[0].weightKg! : 56.0);
    const latestWeight =
      allSortedWithWeight.length > 0
        ? allSortedWithWeight[allSortedWithWeight.length - 1].weightKg!
        : settings.currentWeightKg || startWeight;
    const targetWeight = settings.targetWeightKg || 52.0;

    // Weight Loss Progress %
    const totalToLose = Math.max(0.1, startWeight - targetWeight);
    const lostSoFar = Number((startWeight - latestWeight).toFixed(1));
    const remainingKg = Number(Math.max(0, latestWeight - targetWeight).toFixed(1));
    const weightGoalPct =
      latestWeight <= targetWeight
        ? 100
        : Math.max(0, Math.min(100, Math.round((lostSoFar / totalToLose) * 100)));

    // BMI
    const heightM = (settings.heightCm || 160) / 100;
    const bmi = latestWeight / (heightM * heightM);

    // Period Stats (based on filteredAsc)
    const totalDaysInFilter = Math.max(1, filteredAsc.length);
    const targetGlassesPerDay = Math.round((settings.targetWaterLiters || 2.0) * 4); // 8 glasses
    const daysMetWaterGoal = filteredAsc.filter(
      (c) => (c.waterGlasses || 0) >= targetGlassesPerDay
    ).length;
    const avgWaterGlasses =
      filteredAsc.reduce((sum, c) => sum + (c.waterGlasses || 0), 0) / totalDaysInFilter;
    const waterGoalPct = Math.min(
      100,
      Math.round((avgWaterGlasses / Math.max(1, targetGlassesPerDay)) * 100)
    );

    // Workout Goal Progress
    const completedWorkouts = filteredAsc.filter((c) => c.workoutCompleted).length;
    const targetWorkoutsPerWeek = settings.targetWorkoutsPerWeek || 5;
    const expectedWorkoutsInPeriod =
      periodFilter === 'week'
        ? targetWorkoutsPerWeek
        : Math.max(
            1,
            Math.round((filteredAsc.length / 7) * targetWorkoutsPerWeek)
          );
    const workoutGoalPct = Math.min(
      100,
      Math.round((completedWorkouts / Math.max(1, expectedWorkoutsInPeriod)) * 100)
    );

    // Meal Compliance Progress
    const totalMealsCompleted = filteredAsc.reduce(
      (sum, c) => sum + (c.completedMeals?.length || 0),
      0
    );
    const mealGoalPct = Math.min(
      100,
      Math.round((totalMealsCompleted / (totalDaysInFilter * 4)) * 100)
    );

    // Overall combined score
    const overallPct = Math.round(
      (weightGoalPct + waterGoalPct + workoutGoalPct + mealGoalPct) / 4
    );

    return {
      startWeight,
      latestWeight,
      targetWeight,
      lostSoFar,
      remainingKg,
      weightGoalPct,
      bmi,
      targetGlassesPerDay,
      daysMetWaterGoal,
      avgWaterGlasses: avgWaterGlasses.toFixed(1),
      waterGoalPct,
      completedWorkouts,
      expectedWorkoutsInPeriod,
      workoutGoalPct,
      totalMealsCompleted,
      totalExpectedMeals: filteredAsc.length * 4,
      mealGoalPct,
      overallPct,
    };
  }, [allCheckIns, filteredAsc, periodFilter, settings]);

  // Tách trục Y phải (Cân nặng) nằm ở NỬA TRÊN biểu đồ và trục Y trái (Nước & Tập) nằm ở NỬA DƯỚI biểu đồ để số liệu (label) không bao giờ đè lên nhau
  const weightAxisConfig = useMemo<{ domain: [number, number]; ticks: number[] }>(() => {
    const weights = chartData
      .map((d) => d.weightKg)
      .filter((w): w is number => typeof w === 'number' && w > 0);
    const target = settings.targetWeightKg || 52;
    const minVal = weights.length > 0 ? Math.min(target, ...weights) : target - 1;
    const maxVal = weights.length > 0 ? Math.max(target, ...weights) : target + 4;
    const spread = Math.max(3, maxVal - minVal);
    // Đẩy đường cân nặng lên nửa trên của biểu đồ bằng cách mở rộng khoảng đệm phía dưới (bottom)
    const domainBottom = Math.floor(minVal - spread * 1.45);
    const domainTop = Math.ceil(maxVal + spread * 0.45);

    const tickStart = Math.floor(minVal - 0.5);
    const tickEnd = Math.ceil(maxVal + 0.5);
    const step = tickEnd - tickStart > 6 ? 2 : 1;
    const ticks: number[] = [];
    for (let v = tickStart; v <= tickEnd; v += step) {
      ticks.push(v);
    }
    return { domain: [domainBottom, domainTop], ticks };
  }, [chartData, settings.targetWeightKg]);

  const filterLabelText = useMemo(() => {
    if (periodFilter === 'week') return '7 ngày gần nhất (Tuần)';
    if (periodFilter === 'month') {
      const [y, m] = selectedMonth.split('-');
      return `Tháng ${m}/${y}`;
    }
    if (periodFilter === 'year') return `Năm ${selectedYear}`;
    return 'Toàn bộ lịch sử';
  }, [periodFilter, selectedMonth, selectedYear]);

  return (
    <Card
      id="mother-weight-history"
      className="p-5 md:p-6 border-2 border-emerald-200/80 dark:border-emerald-800/50 space-y-6 scroll-mt-20"
    >
      {/* ── HEADER & PERIOD FILTER BAR (TUẦN / THÁNG / NĂM / TẤT CẢ) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-app-border">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base md:text-lg font-black text-content-primary">
                📊 Biểu Đồ Cân Nặng • Nước Uống • Luyện Tập &amp; Tiến Độ Mục Tiêu
              </h2>
              <Badge variant="primary" size="sm">
                Đang xem: {filterLabelText} ({filteredAsc.length} ngày)
              </Badge>
            </div>
            <p className="text-xs text-content-secondary mt-0.5">
              Theo dõi Cân nặng, Nước uống &amp; Luyện tập theo Tuần / Tháng / Năm (Tự động lưu chế độ xem)
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center bg-app-bg p-1 rounded-xl border border-app-border">
            <span className="px-2 text-[11px] font-bold text-content-muted flex items-center gap-1">
              <Filter className="w-3 h-3" /> Lọc:
            </span>
            {(
              [
                { id: 'week', label: 'Tuần (7 ngày)' },
                { id: 'month', label: 'Theo Tháng' },
                { id: 'year', label: 'Theo Năm' },
                { id: 'all', label: 'Tất cả' },
              ] as { id: PeriodFilterType; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleChangePeriodFilter(tab.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  periodFilter === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {periodFilter === 'month' && (
            <select
              value={selectedMonth}
              onChange={(e) => handleChangeSelectedMonth(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-app-surface text-xs font-black text-content-primary"
            >
              {availableMonths.map((m) => {
                const [y, mo] = m.split('-');
                return (
                  <option key={m} value={m}>
                    📅 Tháng {mo}/{y}
                  </option>
                );
              })}
            </select>
          )}

          {periodFilter === 'year' && (
            <select
              value={selectedYear}
              onChange={(e) => handleChangeSelectedYear(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-700 bg-app-surface text-xs font-black text-content-primary"
            >
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  📆 Năm {y}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={handleToggleChartLabels}
            className={`px-3 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 transition-all ${
              showLabels
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : 'bg-app-surface border-app-border text-content-secondary hover:text-content-primary'
            }`}
            title="Bật / Tắt hiển thị số liệu trên biểu đồ (tự động lưu)"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showLabels ? 'Hiện label số liệu' : 'Ẩn label số liệu'}</span>
          </button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            icon={<Settings2 className="w-3.5 h-3.5 text-rose-500" />}
            onClick={openGoalEditor}
          >
            Cài đặt Mục tiêu
          </Button>
        </div>
      </div>

      {/* ── INLINE GOAL CONFIGURATION DRAWER ── */}
      {isEditingGoals && (
        <form
          onSubmit={handleSaveGoals}
          className="p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-300 dark:border-rose-800/60 space-y-3 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <Target className="w-4 h-4 text-rose-500" />
              <span>Thiết Lập Mục Tiêu Sức Khỏe &amp; Vóc Dáng Của Mẹ</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditingGoals(false)}
              className="p-1 rounded-lg text-content-muted hover:text-content-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Cân nặng khởi điểm (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={gStartWeight}
                onChange={(e) => setGStartWeight(parseFloat(e.target.value) || 56)}
                className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface font-black text-content-primary"
              />
            </div>
            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Cân nặng mục tiêu (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={gTargetWeight}
                onChange={(e) => setGTargetWeight(parseFloat(e.target.value) || 52)}
                className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface font-black text-rose-600"
              />
            </div>
            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Mục tiêu tập (buổi/tuần)
              </label>
              <input
                type="number"
                min={1}
                max={7}
                value={gTargetWorkouts}
                onChange={(e) => setGTargetWorkouts(parseInt(e.target.value, 10) || 5)}
                className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface font-black text-emerald-600"
              />
            </div>
            <div>
              <label className="font-bold text-content-secondary block mb-1">
                Mục tiêu nước (Lít/ngày)
              </label>
              <input
                type="number"
                step="0.25"
                value={gTargetWaterLiters}
                onChange={(e) => setGTargetWaterLiters(parseFloat(e.target.value) || 2.0)}
                className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface font-black text-sky-600"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingGoals(false)}
            >
              Đóng
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={<Check className="w-3.5 h-3.5" />}
            >
              Lưu mục tiêu
            </Button>
          </div>
        </form>
      )}

      {/* ── GOAL COMPLETION STATUS TRACKER (THEO DÕI HOÀN THÀNH MỤC TIÊU) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/70 via-emerald-50/40 to-sky-50/60 dark:from-rose-950/20 dark:via-emerald-950/15 dark:to-sky-950/20 border border-app-border space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-black text-content-primary">
              🎯 Tình Trạng Hoàn Thành Mục Tiêu ({filterLabelText})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-content-secondary">
              Điểm kỷ luật tổng hợp:
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black text-white shadow-sm ${
                goalMetrics.overallPct >= 80
                  ? 'bg-emerald-500'
                  : goalMetrics.overallPct >= 50
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            >
              🏆 {goalMetrics.overallPct}% Hoàn thành
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Goal 1: Weight Goal */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-rose-200/70 dark:border-rose-800/50 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                <Scale className="w-4 h-4" /> Mục tiêu Cân nặng
              </span>
              <span className="text-xs font-black text-rose-600">
                {goalMetrics.weightGoalPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-content-primary">
                {goalMetrics.latestWeight} kg{' '}
                <span className="text-xs font-bold text-content-muted">
                  / {goalMetrics.targetWeight} kg
                </span>
              </div>
              <span
                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                  goalMetrics.lostSoFar >= 0
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {goalMetrics.lostSoFar >= 0
                  ? `Đã giảm ${goalMetrics.lostSoFar}kg`
                  : `Tăng ${Math.abs(goalMetrics.lostSoFar)}kg`}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-rose-100 dark:bg-rose-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${goalMetrics.weightGoalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-secondary">
              <span>Khởi điểm: {goalMetrics.startWeight}kg</span>
              <span className="font-bold text-content-primary">
                {goalMetrics.remainingKg <= 0
                  ? '🎉 Đã đạt mục tiêu!'
                  : `Còn ${goalMetrics.remainingKg}kg tới đích`}
              </span>
            </div>
          </div>

          {/* Goal 2: Workout Goal */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-emerald-200/70 dark:border-emerald-800/50 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4" /> Mục tiêu Luyện tập
              </span>
              <span className="text-xs font-black text-emerald-600">
                {goalMetrics.workoutGoalPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-content-primary">
                {goalMetrics.completedWorkouts}{' '}
                <span className="text-xs font-bold text-content-muted">
                  / {goalMetrics.expectedWorkoutsInPeriod} buổi tập
                </span>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                ~{goalMetrics.completedWorkouts * 240} Kcal
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-emerald-100 dark:bg-emerald-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                style={{ width: `${goalMetrics.workoutGoalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-secondary">
              <span>Chuẩn: {settings.targetWorkoutsPerWeek || 5} buổi/tuần</span>
              <span className="font-bold text-emerald-600">
                {goalMetrics.workoutGoalPct >= 80
                  ? '🔥 Rất chăm chỉ!'
                  : '💪 Duy trì đều nhé'}
              </span>
            </div>
          </div>

          {/* Goal 3: Water Goal */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-sky-200/70 dark:border-sky-800/50 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-sky-600 dark:text-sky-400 flex items-center gap-1.5">
                <Droplets className="w-4 h-4" /> Mục tiêu Nước (2L)
              </span>
              <span className="text-xs font-black text-sky-600">
                {goalMetrics.waterGoalPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-content-primary">
                TB {goalMetrics.avgWaterGlasses}{' '}
                <span className="text-xs font-bold text-content-muted">
                  / {goalMetrics.targetGlassesPerDay} cốc/ngày
                </span>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                {goalMetrics.daysMetWaterGoal}/{filteredAsc.length} ngày đủ 2L
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-sky-100 dark:bg-sky-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-all duration-500"
                style={{ width: `${goalMetrics.waterGoalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-secondary">
              <span>Mỗi cốc = 250ml</span>
              <span className="font-bold text-sky-600">
                {goalMetrics.waterGoalPct >= 90 ? '💧 Đạt chuẩn 2L!' : 'Nhớ uống đủ nước'}
              </span>
            </div>
          </div>

          {/* Goal 4: 1300-Calorie Meal Compliance */}
          <div className="p-3.5 rounded-2xl bg-white/90 dark:bg-slate-900/80 border border-amber-200/70 dark:border-amber-800/50 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Utensils className="w-4 h-4" /> Thực đơn 1300 Calo
              </span>
              <span className="text-xs font-black text-amber-600">
                {goalMetrics.mealGoalPct}%
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-lg font-black text-content-primary">
                {goalMetrics.totalMealsCompleted}{' '}
                <span className="text-xs font-bold text-content-muted">
                  / {goalMetrics.totalExpectedMeals} bữa chuẩn
                </span>
              </div>
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                BMI: {goalMetrics.bmi.toFixed(1)}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-amber-100 dark:bg-amber-950 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                style={{ width: `${goalMetrics.mealGoalPct}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-content-secondary">
              <span>4 bữa chuẩn/ngày</span>
              <span className="font-bold text-amber-600">
                {goalMetrics.mealGoalPct >= 85 ? '🥗 Kỷ luật tuyệt vời!' : 'Tick bữa ăn mỗi ngày'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── COMBINED BAR + LINE CHART (CÂN NẶNG + SỐ CỐC NƯỚC + LUYỆN TẬP THEO NGÀY) ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-app-bg border border-app-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-black text-content-primary flex items-center gap-2">
              <span>📈 Biểu Đồ Cân Nặng (kg) • Nước Uống (cốc) • Luyện Tập</span>
            </h3>
            <p className="text-[11px] text-content-secondary">
              Nửa trên: Cân nặng (kg) &amp; Đích ({settings.targetWeightKg || 52}kg) • Nửa dưới: Nước uống (0–10 cốc) &amp; Luyện tập
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
              <span className="w-3 h-1 bg-rose-500 rounded-full inline-block" /> ⚖️ Cân nặng (kg)
            </span>
            <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400">
              <span className="w-3 h-3 rounded-xs bg-sky-500 inline-block" /> 💧 Nước uống (cốc)
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> 🏋️‍♀️ Luyện tập
            </span>
            <button
              type="button"
              onClick={handleToggleChartLabels}
              className="ml-1 px-2.5 py-1 rounded-lg border border-app-border bg-app-surface hover:border-emerald-400 text-content-primary flex items-center gap-1 transition-colors"
            >
              {showLabels ? <EyeOff className="w-3 h-3 text-emerald-600" /> : <Eye className="w-3 h-3 text-emerald-600" />}
              <span>{showLabels ? 'Ẩn số liệu' : 'Hiện số liệu'}</span>
            </button>
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="py-12 text-center text-xs text-content-muted">
            Không có dữ liệu nhật ký trong khoảng thời gian ({filterLabelText}). Hãy chọn bộ lọc khác hoặc thêm bản ghi bên dưới!
          </div>
        ) : (
          <div className="w-full h-[350px] sm:h-[380px] pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 24, right: 20, left: 0, bottom: 8 }}
                onClick={(state: any) => {
                  if (state?.activePayload?.[0]?.payload?.raw) {
                    onSelectLogToEdit(state.activePayload[0].payload.raw);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                <XAxis
                  dataKey="shortDate"
                  tick={{ fontSize: 11, fontWeight: 700 }}
                  tickMargin={6}
                />
                {/* Left Y-Axis: Water glasses (0..10) & Workout completion in LOWER HALF (domain 0..20) */}
                <YAxis
                  yAxisId="left"
                  domain={[0, 20]}
                  ticks={[0, 2, 4, 6, 8, 10]}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#0284C7' }}
                  unit=" cốc"
                />
                {/* Right Y-Axis: Weight (kg) elevated in UPPER HALF */}
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={weightAxisConfig.domain}
                  ticks={weightAxisConfig.ticks}
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#E11D48' }}
                  unit="kg"
                />
                <Tooltip content={<CustomCombinedTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 700, paddingTop: '8px' }}
                />

                {/* Target Water Line (8 glasses = 2L) on Left Axis */}
                <ReferenceLine
                  yAxisId="left"
                  y={8}
                  stroke="#0EA5E9"
                  strokeDasharray="4 4"
                  strokeOpacity={0.5}
                />

                {/* Target Weight Line on Right Axis */}
                {settings.targetWeightKg && (
                  <ReferenceLine
                    yAxisId="right"
                    y={settings.targetWeightKg}
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    label={{
                      value: `🎯 Đích ${settings.targetWeightKg}kg`,
                      position: 'insideTopRight',
                      fill: '#059669',
                      fontSize: 11,
                      fontWeight: 800,
                    }}
                  />
                )}

                {/* Bar 1: Water Glasses (Lower zone) */}
                <Bar
                  yAxisId="left"
                  dataKey="waterGlasses"
                  name="💧 Nước uống (cốc)"
                  fill="#0EA5E9"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={26}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`water-${idx}`}
                      fill={entry.waterGlasses >= 8 ? '#0284C7' : '#38BDF8'}
                    />
                  ))}
                  {showLabels && (
                    <LabelList
                      dataKey="waterGlasses"
                      position="top"
                      offset={4}
                      formatter={(v: any) => (Number(v) > 0 ? `${v}c` : '')}
                      style={{ fontSize: 10, fontWeight: 800, fill: '#0284C7' }}
                    />
                  )}
                </Bar>

                {/* Bar 2: Workout Completed (Lower zone) */}
                <Bar
                  yAxisId="left"
                  dataKey="workoutScore"
                  name="🏋️‍♀️ Luyện tập"
                  fill="#10B981"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={22}
                >
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={`workout-${idx}`}
                      fill={entry.workoutCompleted ? '#10B981' : '#E2E8F0'}
                    />
                  ))}
                  {showLabels && (
                    <LabelList
                      dataKey="workoutCompleted"
                      position="top"
                      offset={4}
                      formatter={(v: any) => (v ? 'Tập' : '')}
                      style={{ fontSize: 9.5, fontWeight: 800, fill: '#059669' }}
                    />
                  )}
                </Bar>

                {/* Line: Weight (kg) (Elevated in Upper zone) */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="weightKg"
                  name="⚖️ Cân nặng (kg)"
                  stroke="#F43F5E"
                  strokeWidth={3.5}
                  connectNulls
                  dot={{ r: 5, fill: '#F43F5E', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#E11D48', stroke: '#ffffff', strokeWidth: 2 }}
                >
                  {showLabels && (
                    <LabelList
                      dataKey="weightKg"
                      position="top"
                      offset={10}
                      formatter={(v: any) => (v ? `${v}kg` : '')}
                      style={{ fontSize: 11, fontWeight: 900, fill: '#E11D48' }}
                    />
                  )}
                </Line>
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ── FORM TO ADD / EDIT WEIGHT & CHECK-IN FOR ANY DATE ── */}
      <form
        onSubmit={onSaveHistoryLog}
        className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/70 dark:border-emerald-800/40 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-xs font-black text-content-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>Ghi nhận hoặc Cập nhật Cân nặng • Nước uống • Luyện tập theo ngày</span>
          </h3>
          <span className="text-[11px] text-content-muted">
            Chạm vào cột trên biểu đồ hoặc chọn ngày bất kỳ để cập nhật
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="font-bold text-content-secondary block mb-1">Ngày ghi nhận</label>
            <input
              type="date"
              required
              value={logDate}
              onChange={(e) => {
                const d = e.target.value;
                setLogDate(d);
                const existing = getCheckInByDate(d);
                setLogWeight(existing.weightKg !== undefined ? String(existing.weightKg) : '');
                setLogWater(existing.waterGlasses ?? 8);
                setLogWorkout(Boolean(existing.workoutCompleted));
                setLogNote(existing.note || '');
              }}
              className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface text-content-primary font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Cân nặng (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="VD: 54.5"
              value={logWeight}
              onChange={(e) => setLogWeight(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface text-content-primary font-bold"
            />
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">
              Số cốc nước ({logWater * 250}ml)
            </label>
            <select
              value={logWater}
              onChange={(e) => setLogWater(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface text-content-primary font-bold"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((g) => (
                <option key={g} value={g}>
                  💧 {g} cốc ({g * 250} ml)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Tập luyện</label>
            <button
              type="button"
              onClick={() => setLogWorkout((v) => !v)}
              className={`w-full px-3 py-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                logWorkout
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-app-surface text-content-secondary border-app-border'
              }`}
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>{logWorkout ? '✅ Đã tập' : 'Chưa tập'}</span>
            </button>
          </div>

          <div>
            <label className="font-bold text-content-secondary block mb-1">Ghi chú ngày</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="VD: Ăn chuẩn, người nhẹ..."
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-app-border bg-app-surface text-content-primary"
              />
              <Button type="submit" variant="primary" size="sm" className="shrink-0">
                Lưu
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* ── FULL FILTERED HISTORY TABLE ── */}
      <div className="overflow-x-auto rounded-2xl border border-app-border">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-app-bg border-b border-app-border text-[11px] font-black uppercase text-content-secondary">
              <th className="py-3 px-3">Ngày</th>
              <th className="py-3 px-3 text-center">Cân nặng (kg)</th>
              <th className="py-3 px-3 text-center">So với lần trước</th>
              <th className="py-3 px-3 text-center">Nước uống</th>
              <th className="py-3 px-3 text-center">Bữa ăn</th>
              <th className="py-3 px-3 text-center">Tập luyện</th>
              <th className="py-3 px-3">Ghi chú</th>
              <th className="py-3 px-3 text-center w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-app-border text-xs">
            {filteredDesc.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-content-muted">
                  Chưa có bản ghi lịch sử nào trong kỳ ({filterLabelText}). Hãy nhập cân nặng hôm nay hoặc dùng khung bên trên để lưu nhật ký!
                </td>
              </tr>
            ) : (
              filteredDesc.map((item, idx, arr) => {
                const prevWithWeight = arr
                  .slice(idx + 1)
                  .find((x) => typeof x.weightKg === 'number' && x.weightKg > 0);
                const diff =
                  item.weightKg && prevWithWeight?.weightKg
                    ? Number((item.weightKg - prevWithWeight.weightKg).toFixed(1))
                    : null;

                return (
                  <tr
                    key={item.date}
                    className={`hover:bg-app-bg/70 transition-colors ${
                      item.date === todayStr ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-content-primary whitespace-nowrap">
                      {item.date.split('-').reverse().join('/')}
                      {item.date === todayStr && (
                        <span className="ml-1.5 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                          Hôm nay
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-black text-sm text-content-primary">
                      {item.weightKg ? `${item.weightKg} kg` : '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {diff === null ? (
                        <span className="text-content-muted">—</span>
                      ) : diff < 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 font-black text-[11px]">
                          ▼ {diff} kg
                        </span>
                      ) : diff > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-black text-[11px]">
                          ▲ +{diff} kg
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold text-content-muted">Giữ nguyên</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-sky-600 dark:text-sky-400">
                      💧 {item.waterGlasses}/8 cốc ({item.waterGlasses * 250}ml)
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-content-primary">
                      🍽️ {item.completedMeals?.length || 0}/4 bữa
                    </td>
                    <td className="py-3 px-3 text-center">
                      {item.workoutCompleted ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[11px]">
                          ✅ Đã tập
                        </span>
                      ) : (
                        <span className="text-content-muted">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-content-secondary italic">
                      {item.note || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => onSelectLogToEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 transition-colors"
                          title="Sửa nhật ký ngày này"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteHistoryLog(item.date)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 transition-colors"
                          title="Xoá bản ghi ngày này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
