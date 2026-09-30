import React, { useState, useMemo, useEffect } from 'react';
import { storage } from '@/services/storage';
import { MOTHER_GOLDEN_RULES } from '@/services/motherAndBreakfastSeed';
import {
  MotherMealDay,
  MotherWorkoutItem,
  MotherDailyCheckIn,
  MotherSettings,
  WorkoutCategory,
  WeekdayNumber,
} from '@/domain/types';
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import {
  Heart,
  Flame,
  Droplets,
  Dumbbell,
  Utensils,
  Sparkles,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  Edit2,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
  Check,
  Award,
  Scale,
  Info,
  TrendingUp,
} from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Link } from 'react-router-dom';

const WEEKDAY_LABELS: { day: WeekdayNumber; label: string; short: string }[] = [
  { day: 2, label: 'Thứ 2', short: 'T2' },
  { day: 3, label: 'Thứ 3', short: 'T3' },
  { day: 4, label: 'Thứ 4', short: 'T4' },
  { day: 5, label: 'Thứ 5', short: 'T5' },
  { day: 6, label: 'Thứ 6', short: 'T6' },
  { day: 7, label: 'Thứ 7', short: 'T7' },
  { day: 8, label: 'Chủ nhật', short: 'CN' },
];

const WORKOUT_CATEGORY_META: Record<
  WorkoutCategory,
  { label: string; emoji: string; badgeClass: string; borderClass: string }
> = {
  cardio: {
    label: 'Cardio / Đốt mỡ',
    emoji: '🏃‍♀️',
    badgeClass: 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300',
    borderClass: 'border-rose-200 dark:border-rose-800/60',
  },
  yoga: {
    label: 'Yoga & Giãn cơ',
    emoji: '🧘‍♀️',
    badgeClass: 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300',
    borderClass: 'border-purple-200 dark:border-purple-800/60',
  },
  strength: {
    label: 'Sức mạnh / Thon gọn',
    emoji: '💪',
    badgeClass: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    borderClass: 'border-amber-200 dark:border-amber-800/60',
  },
  pilates: {
    label: 'Pilates / Siết eo',
    emoji: '🩰',
    badgeClass: 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
    borderClass: 'border-pink-200 dark:border-pink-800/60',
  },
  hiit: {
    label: 'HIIT / Đốt calo nhanh',
    emoji: '🔥',
    badgeClass: 'bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300',
    borderClass: 'border-orange-200 dark:border-orange-800/60',
  },
  rest: {
    label: 'Nghỉ ngơi / Phục hồi',
    emoji: '🌿',
    badgeClass: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    borderClass: 'border-sky-200 dark:border-sky-800/60',
  },
};

export const MotherCornerPage: React.FC = () => {
  const [todayStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const todayWeekday = useMemo<WeekdayNumber>(() => {
    const jsDay = new Date().getDay();
    return (jsDay === 0 ? 8 : jsDay + 1) as WeekdayNumber;
  }, []);

  const [meals, setMeals] = useState<MotherMealDay[]>(() => storage.getMotherMeals());
  const [workouts, setWorkouts] = useState<MotherWorkoutItem[]>(() => storage.getMotherWorkouts());
  const [settings, setSettings] = useState<MotherSettings>(() => storage.getMotherSettings());
  const [todayCheckIn, setTodayCheckIn] = useState<MotherDailyCheckIn>(() =>
    storage.getMotherCheckInByDate(todayStr)
  );
  const [allCheckIns, setAllCheckIns] = useState<MotherDailyCheckIn[]>(() =>
    storage.getMotherCheckIns()
  );

  // Manual History Entry / Edit state
  const [logDate, setLogDate] = useState<string>(todayStr);
  const [logWeight, setLogWeight] = useState<string>(() =>
    todayCheckIn.weightKg ? String(todayCheckIn.weightKg) : ''
  );
  const [logWater, setLogWater] = useState<number>(todayCheckIn.waterGlasses || 8);
  const [logWorkout, setLogWorkout] = useState<boolean>(todayCheckIn.workoutCompleted || false);
  const [logNote, setLogNote] = useState<string>(todayCheckIn.note || '');

  // Sync when cloud finishes loading or mother profile updates
  useEffect(() => {
    const handleSynced = () => {
      setMeals(storage.getMotherMeals());
      setWorkouts(storage.getMotherWorkouts());
      setSettings(storage.getMotherSettings());
      setTodayCheckIn(storage.getMotherCheckInByDate(todayStr));
      setAllCheckIns(storage.getMotherCheckIns());
    };
    window.addEventListener('ktt-cloud-synced', handleSynced);
    window.addEventListener('ktt-mother-updated', handleSynced);
    return () => {
      window.removeEventListener('ktt-cloud-synced', handleSynced);
      window.removeEventListener('ktt-mother-updated', handleSynced);
    };
  }, [todayStr]);

  // Calculate which day (1..30) corresponds to today based on startDate
  const autoCycleDay = useMemo(() => {
    try {
      const start = parseISO(settings.startDate);
      const now = parseISO(todayStr);
      const diff = differenceInCalendarDays(now, start);
      const mod = ((diff % 30) + 30) % 30;
      return mod + 1;
    } catch {
      return 1;
    }
  }, [settings.startDate, todayStr]);

  const [selectedDayNum, setSelectedDayNum] = useState<number>(autoCycleDay);
  const [weekFilter, setWeekFilter] = useState<'all' | 'w1' | 'w2' | 'w3' | 'w4'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRules, setShowRules] = useState(true);

  // Edit Meal Modal state
  const [editingMealDay, setEditingMealDay] = useState<MotherMealDay | null>(null);

  // Edit Workout Modal state
  const [editingWorkout, setEditingWorkout] = useState<MotherWorkoutItem | null>(null);
  const [isNewWorkout, setIsNewWorkout] = useState(false);

  const activeMealDay = useMemo(
    () => meals.find((m) => m.day === selectedDayNum) || meals[0],
    [meals, selectedDayNum]
  );

  const updateCheckIn = (patch: Partial<MotherDailyCheckIn>) => {
    const next: MotherDailyCheckIn = {
      ...todayCheckIn,
      ...patch,
      date: todayStr,
    };
    setTodayCheckIn(next);
    storage.saveMotherCheckIn(next);
    setAllCheckIns(storage.getMotherCheckIns());
    setSettings(storage.getMotherSettings());
    if (logDate === todayStr && patch.weightKg !== undefined) {
      setLogWeight(patch.weightKg ? String(patch.weightKg) : '');
    }
  };

  const handleSaveHistoryLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logDate) return;
    const existing = storage.getMotherCheckInByDate(logDate);
    const weightNum = logWeight.trim() ? parseFloat(logWeight) : undefined;
    const entry: MotherDailyCheckIn = {
      ...existing,
      date: logDate,
      weightKg: weightNum && !isNaN(weightNum) ? weightNum : undefined,
      waterGlasses: logWater,
      workoutCompleted: logWorkout,
      note: logNote.trim() || undefined,
    };
    storage.saveMotherCheckIn(entry);
    setAllCheckIns(storage.getMotherCheckIns());
    setSettings(storage.getMotherSettings());
    if (logDate === todayStr) {
      setTodayCheckIn(storage.getMotherCheckInByDate(todayStr));
    }
  };

  const handleSelectLogToEdit = (item: MotherDailyCheckIn) => {
    setLogDate(item.date);
    setLogWeight(item.weightKg !== undefined ? String(item.weightKg) : '');
    setLogWater(item.waterGlasses ?? 8);
    setLogWorkout(Boolean(item.workoutCompleted));
    setLogNote(item.note || '');
    const el = document.getElementById('mother-weight-history');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleDeleteHistoryLog = (date: string) => {
    if (window.confirm(`Xoá bản ghi nhật ký ngày ${date.split('-').reverse().join('/')}?`)) {
      storage.deleteMotherCheckIn(date);
      setAllCheckIns(storage.getMotherCheckIns());
      if (date === todayStr) {
        setTodayCheckIn(storage.getMotherCheckInByDate(todayStr));
      }
    }
  };

  const toggleMealDone = (mealType: 'breakfast' | 'lunch' | 'snack' | 'dinner') => {
    const exists = todayCheckIn.completedMeals.includes(mealType);
    const nextCompleted = exists
      ? todayCheckIn.completedMeals.filter((m) => m !== mealType)
      : [...todayCheckIn.completedMeals, mealType];
    updateCheckIn({ completedMeals: nextCompleted });
  };

  const handleSaveSettings = (patch: Partial<MotherSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    storage.saveMotherSettings(next);
  };

  const handleSaveMealDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMealDay) return;
    storage.updateMotherMealDay(editingMealDay);
    setMeals(storage.getMotherMeals());
    setEditingMealDay(null);
  };

  const handleResetMeals = () => {
    if (window.confirm(`Khôi phục lại Thực đơn 30 ngày (${settings.targetCalories} Calo) mặc định của ${settings.authorName}?`)) {
      storage.resetMotherMeals();
      setMeals(storage.getMotherMeals());
    }
  };

  const handleOpenEditWorkout = (item: MotherWorkoutItem) => {
    setEditingWorkout({ ...item });
    setIsNewWorkout(false);
  };

  const handleOpenAddWorkout = (weekday: WeekdayNumber) => {
    setEditingWorkout({
      id: `mw-${Date.now()}`,
      weekday,
      title: '',
      category: 'yoga',
      duration_min: 30,
      time_slot: '17:30 – 18:00',
      calories_est: 150,
      exercises: '',
      note: '',
    });
    setIsNewWorkout(true);
  };

  const handleSaveWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkout || !editingWorkout.title.trim()) return;
    storage.upsertMotherWorkout(editingWorkout);
    setWorkouts(storage.getMotherWorkouts());
    setEditingWorkout(null);
  };

  const handleDeleteWorkout = (id: string) => {
    if (window.confirm('Xoá lịch tập này?')) {
      storage.deleteMotherWorkout(id);
      setWorkouts(storage.getMotherWorkouts());
      setEditingWorkout(null);
    }
  };

  const filteredMeals = useMemo(() => {
    return meals.filter((m) => {
      if (weekFilter === 'w1' && (m.day < 1 || m.day > 7)) return false;
      if (weekFilter === 'w2' && (m.day < 8 || m.day > 14)) return false;
      if (weekFilter === 'w3' && (m.day < 15 || m.day > 21)) return false;
      if (weekFilter === 'w4' && m.day < 22) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          m.breakfast.toLowerCase().includes(q) ||
          m.lunch.toLowerCase().includes(q) ||
          m.snack.toLowerCase().includes(q) ||
          m.dinner.toLowerCase().includes(q) ||
          (m.note && m.note.toLowerCase().includes(q)) ||
          `ngày ${m.day}`.includes(q)
        );
      }
      return true;
    });
  }, [meals, weekFilter, searchQuery]);

  const completedMealsCount = todayCheckIn.completedMeals.length;
  const isMotherPhoto =
    settings.avatarUrl?.startsWith('data:') || settings.avatarUrl?.startsWith('http');

  return (
    <div data-section="mother" className="space-y-6 animate-in fade-in duration-200 pb-10">
      {/* ── HERO BANNER: GÓC CỦA MẸ ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 p-5 md:p-7 text-white shadow-xl">
        <div className="absolute -top-12 -right-12 w-52 h-52 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/15 blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center text-4xl shadow-lg shrink-0 overflow-hidden"
              style={{ backgroundColor: settings.color || '#F43F5E' }}
            >
              {isMotherPhoto ? (
                <img
                  src={settings.avatarUrl}
                  alt={settings.authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{settings.avatarUrl || '🧘‍♀️'}</span>
              )}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-extrabold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Chuyên mục Sức khoẻ &amp; Vóc dáng của Mẹ</span>
                </div>
                <Link
                  to="/children"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 hover:bg-white/35 backdrop-blur-sm text-[11px] font-bold transition-colors"
                  title="Cấu hình họ tên, ảnh đại diện, sinh nhật & mục tiêu của Mẹ"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Cấu hình Hồ sơ Mẹ</span>
                </Link>
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight">
                Góc của Mẹ: {settings.authorName}
                {settings.nickname && settings.nickname !== settings.authorName
                  ? ` (${settings.nickname})`
                  : ''}{' '}
                💖
              </h1>
              <p className="text-xs md:text-sm text-white/90 font-medium">
                Thực đơn chuẩn <strong className="font-black">{settings.targetCalories} Calo/ngày</strong> (30 ngày) &amp; Lịch tập luyện giữ dáng • {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>

          {/* Quick KPI Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-amber-200 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-white/80">Chu kỳ hôm nay</div>
                <div className="text-sm font-black">Ngày {autoCycleDay} / 30</div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center gap-2.5">
              <Utensils className="w-5 h-5 text-emerald-200 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-white/80">Bữa ăn hôm nay</div>
                <div className="text-sm font-black">{completedMealsCount}/4 bữa</div>
              </div>
            </div>

            <div className="px-3.5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center gap-2.5">
              <Droplets className="w-5 h-5 text-sky-200 shrink-0" />
              <div>
                <div className="text-[10px] font-bold uppercase text-white/80">Nước uống (2L)</div>
                <div className="text-sm font-black">{todayCheckIn.waterGlasses * 250} ml</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => updateCheckIn({ workoutCompleted: !todayCheckIn.workoutCompleted })}
              className={`px-3.5 py-2.5 rounded-2xl backdrop-blur-md border flex items-center gap-2 transition-all ${
                todayCheckIn.workoutCompleted
                  ? 'bg-emerald-500/90 border-emerald-300 text-white shadow-md'
                  : 'bg-white/20 border-white/30 text-white hover:bg-white/30'
              }`}
            >
              <Dumbbell className="w-5 h-5 shrink-0" />
              <div className="text-left">
                <div className="text-[10px] font-bold uppercase text-white/85">Tập hôm nay</div>
                <div className="text-xs font-black">
                  {todayCheckIn.workoutCompleted ? '✅ Đã tập xong!' : 'Chưa tick tập'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* ── GOLDEN RULES & WATER / WEIGHT CHECK-IN BAR ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Golden Rules Card */}
        <Card className="lg:col-span-2 p-5 border-2 border-rose-200/80 dark:border-rose-800/50 bg-gradient-to-br from-rose-50/70 via-pink-50/40 to-amber-50/50 dark:from-rose-950/20 dark:via-pink-950/15 dark:to-amber-950/10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-sm">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-rose-950 dark:text-rose-200">
                  🌟 Nguyên Tắc Vàng — Thực Đơn Cá Nhân 1300 Calo ({settings.authorName})
                </h2>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/80">
                  Tuân thủ đều đặn mỗi ngày để đạt hiệu quả giảm mỡ &amp; giữ năng lượng tốt nhất
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowRules((v) => !v)}
              className="text-xs font-bold text-rose-600 dark:text-rose-300 hover:underline shrink-0"
            >
              {showRules ? 'Thu gọn' : 'Xem nguyên tắc'}
            </button>
          </div>

          {showRules && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {MOTHER_GOLDEN_RULES.map((rule, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-white/85 dark:bg-slate-900/60 border border-rose-200/60 dark:border-rose-800/40 flex items-start gap-2.5 shadow-sm"
                >
                  <div className="text-xs font-semibold text-content-primary leading-relaxed">
                    {rule}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Daily Water & Weight Tracker */}
        <Card className="p-5 border border-app-border space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-900/40 text-sky-600 flex items-center justify-center">
                  <Droplets className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-content-primary">Theo dõi Nước &amp; Cân nặng</h3>
                  <p className="text-[10px] text-content-muted">Mục tiêu: 8 cốc (2 lít nước/ngày)</p>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                {todayCheckIn.waterGlasses}/8 cốc
              </Badge>
            </div>

            {/* 8 Glasses of Water */}
            <div className="grid grid-cols-8 gap-1.5 pt-1">
              {Array.from({ length: 8 }, (_, idx) => {
                const filled = idx < todayCheckIn.waterGlasses;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      updateCheckIn({
                        waterGlasses:
                          todayCheckIn.waterGlasses === idx + 1 ? idx : idx + 1,
                      })
                    }
                    className={`h-11 rounded-xl border flex flex-col items-center justify-center transition-all ${
                      filled
                        ? 'bg-sky-500 border-sky-500 text-white shadow-sm scale-[1.02]'
                        : 'bg-app-bg border-app-border text-content-muted hover:border-sky-300'
                    }`}
                    title={`Cốc ${idx + 1} (${(idx + 1) * 250}ml)`}
                  >
                    <span className="text-sm leading-none">💧</span>
                    <span className="text-[9px] font-bold mt-0.5">{idx + 1}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Weight & Cycle Start Date */}
          <div className="space-y-2.5 pt-2 border-t border-app-border">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] font-bold text-content-secondary flex items-center gap-1 mb-1">
                  <Scale className="w-3 h-3 text-rose-500" /> Cân nặng hôm nay (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="VD: 54.5"
                  value={todayCheckIn.weightKg ?? ''}
                  onChange={(e) =>
                    updateCheckIn({
                      weightKg: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-app-border rounded-xl bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-content-secondary flex items-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-rose-500" /> Ngày bắt đầu Ngày 1
                </label>
                <input
                  type="date"
                  value={settings.startDate}
                  onChange={(e) => {
                    handleSaveSettings({ startDate: e.target.value });
                  }}
                  className="w-full px-2.5 py-1.5 text-xs font-bold border border-app-border rounded-xl bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('mother-weight-history');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200/70 dark:border-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-extrabold flex items-center justify-between transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                <span>Xem lịch sử cân nặng &amp; nhật ký hàng ngày</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                {allCheckIns.length} ngày đã lưu
              </span>
            </button>
          </div>
        </Card>
      </div>

      {/* ── ACTIVE DAY MEAL DETAIL (4 MEALS + CHECKLIST) ── */}
      <Card className="p-5 md:p-6 border-2 border-rose-300/70 dark:border-rose-800/60 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center font-black text-base shadow-sm">
              N{activeMealDay.day}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-black text-content-primary">
                  Thực Đơn Ngày {activeMealDay.day} / 30
                </h2>
                {activeMealDay.day === autoCycleDay && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    🔥 HÔM NAY
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  ~1300 Kcal
                </span>
              </div>
              <p className="text-xs text-content-secondary">
                Chạm vào từng bữa để đánh dấu hoàn thành hoặc bấm <strong>Sửa thực đơn</strong> để đổi món phù hợp
              </p>
            </div>
          </div>

          {/* Day Navigator */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedDayNum((d) => (d <= 1 ? 30 : d - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <select
              value={selectedDayNum}
              onChange={(e) => setSelectedDayNum(Number(e.target.value))}
              className="px-3 py-1.5 text-xs font-extrabold rounded-xl border border-rose-300 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 focus:outline-none"
            >
              {meals.map((m) => (
                <option key={m.day} value={m.day}>
                  Ngày {m.day} {m.day === autoCycleDay ? '(Hôm nay)' : ''} — {m.breakfast.slice(0, 24)}...
                </option>
              ))}
            </select>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSelectedDayNum((d) => (d >= 30 ? 1 : d + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            {selectedDayNum !== autoCycleDay && (
              <Button
                size="sm"
                variant="soft"
                onClick={() => setSelectedDayNum(autoCycleDay)}
              >
                Về hôm nay (Ngày {autoCycleDay})
              </Button>
            )}
            <Button
              size="sm"
              variant="primary"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={() => setEditingMealDay({ ...activeMealDay })}
            >
              Sửa thực đơn
            </Button>
          </div>
        </div>

        {/* 4 Meal Cards Grid — Centered & Symmetrical */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            {
              key: 'breakfast' as const,
              label: 'Bữa Sáng',
              time: '06:30 – 07:30',
              kcal: '~320 Kcal',
              emoji: '🌅',
              dish: activeMealDay.breakfast,
              colorClass: 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 dark:border-amber-800/50',
              pillClass: 'bg-amber-500 text-white',
            },
            {
              key: 'lunch' as const,
              label: 'Bữa Trưa',
              time: '11:30 – 12:30',
              kcal: '~450 Kcal',
              emoji: '☀️',
              dish: activeMealDay.lunch,
              colorClass: 'border-emerald-200 bg-emerald-50/60 dark:bg-emerald-950/20 dark:border-emerald-800/50',
              pillClass: 'bg-emerald-500 text-white',
            },
            {
              key: 'snack' as const,
              label: 'Bữa Phụ Chiều',
              time: '16:00 – 16:30',
              kcal: '~150 Kcal',
              emoji: '🍎',
              dish: activeMealDay.snack,
              colorClass: 'border-pink-200 bg-pink-50/60 dark:bg-pink-950/20 dark:border-pink-800/50',
              pillClass: 'bg-pink-500 text-white',
            },
            {
              key: 'dinner' as const,
              label: 'Bữa Tối (Trước 19:30)',
              time: '18:00 – 19:15',
              kcal: '~380 Kcal',
              emoji: '🌙',
              dish: activeMealDay.dinner,
              colorClass: 'border-indigo-200 bg-indigo-50/60 dark:bg-indigo-950/20 dark:border-indigo-800/50',
              pillClass: 'bg-indigo-500 text-white',
            },
          ].map((m) => {
            const isChecked = todayCheckIn.completedMeals.includes(m.key);
            return (
              <div
                key={m.key}
                onClick={() => toggleMealDone(m.key)}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center text-center justify-between gap-2.5 hover:scale-[1.01] ${
                  isChecked
                    ? 'border-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30 ring-2 ring-emerald-300/40'
                    : m.colorClass
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${m.pillClass}`}>
                    {m.emoji} {m.label}
                  </span>
                  <span className="text-[10px] font-bold text-content-muted">{m.kcal}</span>
                </div>

                <div className="py-2 flex flex-col items-center justify-center gap-1.5 flex-1">
                  <div className="text-sm font-black text-content-primary leading-snug">
                    {m.dish}
                  </div>
                  <div className="text-[10px] text-content-muted flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {m.time}
                  </div>
                </div>

                <div className="w-full pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-center gap-1.5 text-xs font-extrabold">
                  {isChecked ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" /> Đã hoàn thành
                    </span>
                  ) : (
                    <span className="text-content-muted flex items-center gap-1">
                      <Circle className="w-4 h-4" /> Chạm để đánh dấu xong
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Note of the Day */}
        {activeMealDay.note && (
          <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                💡 Lưu ý Ngày {activeMealDay.day}: <span className="font-black">{activeMealDay.note}</span>
              </span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold hidden sm:inline">
              Luôn ăn rau luộc trước khi ăn tinh bột và đạm
            </span>
          </div>
        )}
      </Card>

      {/* ── MOTHER'S WEEKLY WORKOUT SCHEDULE ── */}
      <Card className="p-5 md:p-6 border border-app-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-content-primary">
                💪 Lịch Tập Luyện Hàng Tuần Của Mẹ
              </h2>
              <p className="text-xs text-content-secondary">
                Kết hợp Cardio đốt mỡ, Pilates siết eo &amp; Yoga giãn cơ giúp cơ thể săn chắc, dẻo dai
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => {
                if (window.confirm('Khôi phục lịch tập mặc định cả tuần?')) {
                  storage.resetMotherWorkouts();
                  setWorkouts(storage.getMotherWorkouts());
                }
              }}
            >
              Mặc định
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => handleOpenAddWorkout(todayWeekday)}
            >
              Thêm bài tập
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2.5">
          {WEEKDAY_LABELS.map(({ day, label }) => {
            const dayItems = workouts.filter((w) => w.weekday === day);
            const isToday = day === todayWeekday;
            return (
              <div
                key={day}
                className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 transition-all ${
                  isToday
                    ? 'border-purple-500 bg-purple-50/70 dark:bg-purple-950/30 ring-2 ring-purple-400/40 shadow-sm'
                    : 'border-app-border bg-app-surface'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      isToday
                        ? 'bg-purple-600 text-white'
                        : 'bg-app-bg text-content-secondary border border-app-border'
                    }`}
                  >
                    {label}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenAddWorkout(day)}
                    className="w-6 h-6 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-600 flex items-center justify-center"
                    title={`Thêm bài tập ${label}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {dayItems.length === 0 ? (
                  <button
                    type="button"
                    onClick={() => handleOpenAddWorkout(day)}
                    className="py-6 text-center text-xs text-content-muted border border-dashed border-app-border rounded-xl hover:border-purple-400"
                  >
                    + Thêm lịch tập
                  </button>
                ) : (
                  <div className="space-y-2 flex-1 flex flex-col justify-center">
                    {dayItems.map((item) => {
                      const meta = WORKOUT_CATEGORY_META[item.category] || WORKOUT_CATEGORY_META.yoga;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenEditWorkout(item)}
                          className={`p-2.5 rounded-xl border ${meta.borderClass} bg-white/90 dark:bg-slate-900/70 cursor-pointer hover:scale-[1.02] transition-all text-center flex flex-col items-center gap-1.5`}
                        >
                          <span className="text-2xl leading-none">{meta.emoji}</span>
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                          <div className="text-xs font-black text-content-primary leading-snug">
                            {item.title}
                          </div>
                          <div className="text-[10px] text-content-muted font-semibold">
                            ⏰ {item.time_slot} ({item.duration_min}p)
                          </div>
                          {item.calories_est ? (
                            <div className="text-[10px] font-extrabold text-rose-600 dark:text-rose-400">
                              🔥 -{item.calories_est} Kcal
                            </div>
                          ) : null}
                          {item.exercises && (
                            <div className="text-[10px] text-content-secondary italic line-clamp-2 border-t border-app-border/60 pt-1 w-full">
                              {item.exercises}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── FULL 30-DAY MEAL TABLE (MOTHER_MENU.MD) ── */}
      <Card className="p-5 md:p-6 border border-app-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-sm">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-content-primary">
                📋 Bảng Thực Đơn Chi Tiết 30 Ngày (1300 Calo — {settings.authorName})
              </h2>
              <p className="text-xs text-content-secondary">
                Nhấn vào bất kỳ ngày nào để xem hoặc chỉnh sửa món ăn
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-content-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm món (VD: ức gà, cá hồi, yến mạch)..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400 w-56"
              />
            </div>

            <Button
              size="sm"
              variant="outline"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetMeals}
            >
              Khôi phục gốc
            </Button>
          </div>
        </div>

        {/* Week Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả 30 ngày' },
            { id: 'w1', label: 'Tuần 1 (Ngày 1–7)' },
            { id: 'w2', label: 'Tuần 2 (Ngày 8–14)' },
            { id: 'w3', label: 'Tuần 3 (Ngày 15–21)' },
            { id: 'w4', label: 'Tuần 4+ (Ngày 22–30)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setWeekFilter(tab.id as typeof weekFilter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                weekFilter === tab.id
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-app-bg text-content-secondary border border-app-border hover:border-rose-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 30-Day Responsive Table */}
        <div className="overflow-x-auto rounded-2xl border border-app-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-rose-50/80 dark:bg-rose-950/40 border-b border-app-border text-[11px] font-black uppercase text-rose-900 dark:text-rose-200">
                <th className="py-3 px-3 text-center w-20">Ngày</th>
                <th className="py-3 px-3">🌅 Bữa Sáng</th>
                <th className="py-3 px-3">☀️ Bữa Trưa</th>
                <th className="py-3 px-3">🍎 Bữa Phụ (16h)</th>
                <th className="py-3 px-3">🌙 Bữa Tối (&lt;19h30)</th>
                <th className="py-3 px-3">💡 Ghi chú</th>
                <th className="py-3 px-3 text-center w-16">Sửa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border text-xs">
              {filteredMeals.map((m) => {
                const isToday = m.day === autoCycleDay;
                const isSelected = m.day === selectedDayNum;
                return (
                  <tr
                    key={m.day}
                    onClick={() => setSelectedDayNum(m.day)}
                    className={`cursor-pointer transition-colors ${
                      isToday
                        ? 'bg-rose-50/90 dark:bg-rose-950/30 font-semibold'
                        : isSelected
                        ? 'bg-amber-50/70 dark:bg-amber-950/20'
                        : 'hover:bg-app-bg/70'
                    }`}
                  >
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[11px] font-black ${
                          isToday
                            ? 'bg-rose-500 text-white shadow-sm'
                            : 'bg-app-bg border border-app-border text-content-primary'
                        }`}
                      >
                        Ngày {m.day}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-bold text-content-primary">{m.breakfast}</td>
                    <td className="py-3 px-3 text-content-primary">{m.lunch}</td>
                    <td className="py-3 px-3 text-content-secondary">{m.snack}</td>
                    <td className="py-3 px-3 text-content-primary">{m.dinner}</td>
                    <td className="py-3 px-3 text-rose-600 dark:text-rose-400 italic text-[11px]">
                      {m.note || '—'}
                    </td>
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setEditingMealDay({ ...m })}
                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 transition-colors"
                        title={`Sửa thực đơn Ngày ${m.day}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── WEIGHT & DAILY CHECK-IN HISTORY LOG (#mother-weight-history) ── */}
      <Card
        id="mother-weight-history"
        className="p-5 md:p-6 border-2 border-emerald-200/80 dark:border-emerald-800/50 space-y-5 scroll-mt-20"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-sm">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-black text-content-primary">
                📊 Nhật Ký Cân Nặng &amp; Toàn Bộ Lịch Sử Theo Dõi Hàng Ngày
              </h2>
              <p className="text-xs text-content-secondary">
                Tự động lưu trữ theo từng ngày trên thiết bị &amp; đồng bộ đám mây Supabase (<code className="font-mono text-[11px]">ktt_mother_checkins</code>)
              </p>
            </div>
          </div>

          <Badge variant="primary" size="sm">
            Đã lưu {allCheckIns.length} ngày
          </Badge>
        </div>

        {/* KPI Summary Cards */}
        {(() => {
          const sortedAsc = [...allCheckIns]
            .filter((c) => typeof c.weightKg === 'number' && c.weightKg > 0)
            .sort((a, b) => a.date.localeCompare(b.date));
          const firstWeight =
            sortedAsc.length > 0
              ? sortedAsc[0].weightKg!
              : settings.currentWeightKg || 56;
          const latestWeight =
            sortedAsc.length > 0
              ? sortedAsc[sortedAsc.length - 1].weightKg!
              : settings.currentWeightKg || 56;
          const targetWeight = settings.targetWeightKg || 52;
          const heightM = (settings.heightCm || 160) / 100;
          const bmi = latestWeight / (heightM * heightM);
          const totalDiff = Number((latestWeight - firstWeight).toFixed(1));
          const toTargetDiff = Number((latestWeight - targetWeight).toFixed(1));

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200/70 dark:border-emerald-800/50">
                  <div className="text-[11px] font-bold text-content-secondary">Cân nặng mới nhất</div>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 mt-0.5">
                    {latestWeight} kg
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                    Khởi điểm: <strong>{firstWeight} kg</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/70 dark:border-rose-800/50">
                  <div className="text-[11px] font-bold text-content-secondary">Mục tiêu cân nặng</div>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-300 mt-0.5">
                    {targetWeight} kg
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                    {toTargetDiff > 0
                      ? `Cần giảm thêm ${toTargetDiff} kg`
                      : toTargetDiff === 0
                      ? '🎉 Đã đạt mục tiêu!'
                      : `Thấp hơn mục tiêu ${Math.abs(toTargetDiff)} kg`}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/25 border border-amber-200/70 dark:border-amber-800/50">
                  <div className="text-[11px] font-bold text-content-secondary">Thay đổi tổng cộng</div>
                  <div
                    className={`text-xl font-black mt-0.5 ${
                      totalDiff <= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {totalDiff > 0 ? `+${totalDiff}` : totalDiff} kg
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                     Qua {sortedAsc.length} lần ghi cân nặng
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50/70 dark:bg-sky-950/25 border border-sky-200/70 dark:border-sky-800/50">
                  <div className="text-[11px] font-bold text-content-secondary">
                    Chỉ số BMI ({settings.heightCm || 160}cm)
                  </div>
                  <div className="text-xl font-black text-sky-700 dark:text-sky-300 mt-0.5">
                    {bmi.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-content-muted mt-0.5">
                    {bmi < 18.5
                      ? 'Hơi gầy'
                      : bmi < 23
                      ? '✅ Vóc dáng Chuẩn'
                      : 'Cần giảm mỡ nhẹ'}
                  </div>
                </div>
              </div>

              {/* Visual Weight Trend Bars */}
              {sortedAsc.length > 0 && (
                <div className="p-4 rounded-2xl bg-app-bg border border-app-border space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-content-primary flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      Biểu đồ xu hướng cân nặng theo ngày
                    </span>
                    <span className="text-[11px] text-content-muted">
                      Mục tiêu: <strong className="text-rose-500">{targetWeight} kg</strong>
                    </span>
                  </div>
                  <div className="flex items-end gap-2 overflow-x-auto pb-2 pt-4 min-h-[130px]">
                    {sortedAsc.slice(-14).map((item, idx) => {
                      const w = item.weightKg!;
                      const minW = Math.min(targetWeight - 2, ...sortedAsc.map((x) => x.weightKg!)) - 1;
                      const maxW = Math.max(targetWeight + 4, ...sortedAsc.map((x) => x.weightKg!)) + 1;
                      const pct = Math.max(
                        18,
                        Math.min(100, Math.round(((w - minW) / Math.max(1, maxW - minW)) * 85))
                      );
                      const prevW = idx > 0 ? sortedAsc.slice(-14)[idx - 1].weightKg! : w;
                      const isDown = w <= prevW;
                      return (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => handleSelectLogToEdit(item)}
                          className="flex flex-col items-center gap-1 min-w-[52px] group cursor-pointer"
                          title={`Ngày ${item.date.split('-').reverse().join('/')}: ${w} kg (Bấm để sửa)`}
                        >
                          <span
                            className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                              isDown
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            }`}
                          >
                            {w}kg
                          </span>
                          <div className="w-8 h-20 bg-black/5 dark:bg-white/5 rounded-xl flex items-end p-1">
                            <div
                              className={`w-full rounded-lg transition-all group-hover:brightness-110 ${
                                isDown
                                  ? 'bg-gradient-to-t from-emerald-600 to-teal-400'
                                  : 'bg-gradient-to-t from-rose-500 to-amber-400'
                              }`}
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-content-secondary">
                            {item.date.slice(8, 10)}/{item.date.slice(5, 7)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Form to Add / Edit Weight & Check-In for Any Date */}
        <form
          onSubmit={handleSaveHistoryLog}
          className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/15 border border-emerald-200/70 dark:border-emerald-800/40 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-content-primary flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Ghi nhận hoặc Cập nhật Cân nặng &amp; Nhật ký theo ngày</span>
            </h3>
            <span className="text-[11px] text-content-muted">
              Chọn ngày bất kỳ để thêm mới hoặc sửa lại lịch sử
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
                  const existing = storage.getMotherCheckInByDate(d);
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

        {/* Full History Table */}
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
              {allCheckIns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-content-muted">
                    Chưa có bản ghi lịch sử nào. Hãy nhập cân nặng hôm nay hoặc dùng khung bên trên để lưu nhật ký!
                  </td>
                </tr>
              ) : (
                [...allCheckIns]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((item, idx, arr) => {
                    // Find previous chronological weight entry (which is at a higher index in desc array)
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
                              onClick={() => handleSelectLogToEdit(item)}
                              className="p-1.5 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 transition-colors"
                              title="Sửa nhật ký ngày này"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteHistoryLog(item.date)}
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

      {/* ── MODAL: EDIT MEAL DAY ── */}
      {editingMealDay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setEditingMealDay(null)}
        >
          <div
            className="bg-app-surface rounded-3xl shadow-2xl border border-app-border w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Utensils className="w-4 h-4" />
                <span>Chỉnh sửa Thực đơn Ngày {editingMealDay.day} / 30</span>
              </div>
              <button
                onClick={() => setEditingMealDay(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMealDay} className="p-5 space-y-3.5">
              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  🌅 Bữa Sáng
                </label>
                <input
                  value={editingMealDay.breakfast}
                  onChange={(e) =>
                    setEditingMealDay({ ...editingMealDay, breakfast: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs font-semibold border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  ☀️ Bữa Trưa
                </label>
                <input
                  value={editingMealDay.lunch}
                  onChange={(e) =>
                    setEditingMealDay({ ...editingMealDay, lunch: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs font-semibold border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  🍎 Bữa Phụ (16:00)
                </label>
                <input
                  value={editingMealDay.snack}
                  onChange={(e) =>
                    setEditingMealDay({ ...editingMealDay, snack: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs font-semibold border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  🌙 Bữa Tối (Trước 19:30)
                </label>
                <input
                  value={editingMealDay.dinner}
                  onChange={(e) =>
                    setEditingMealDay({ ...editingMealDay, dinner: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 text-xs font-semibold border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  💡 Ghi chú
                </label>
                <input
                  value={editingMealDay.note || ''}
                  onChange={(e) =>
                    setEditingMealDay({ ...editingMealDay, note: e.target.value })
                  }
                  placeholder="VD: Hạn chế mắm muối, ngủ sớm..."
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingMealDay(null)}
                >
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Lưu thực đơn
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT WORKOUT ── */}
      {editingWorkout && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setEditingWorkout(null)}
        >
          <div
            className="bg-app-surface rounded-3xl shadow-2xl border border-app-border w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
              <div className="flex items-center gap-2 font-black text-sm">
                <Dumbbell className="w-4 h-4" />
                <span>
                  {isNewWorkout ? 'Thêm bài tập mới' : 'Chỉnh sửa lịch tập của Mẹ'}
                </span>
              </div>
              <button
                onClick={() => setEditingWorkout(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveWorkout} className="p-5 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-content-secondary mb-1 block">
                    Thứ trong tuần
                  </label>
                  <select
                    value={editingWorkout.weekday}
                    onChange={(e) =>
                      setEditingWorkout({
                        ...editingWorkout,
                        weekday: Number(e.target.value) as WeekdayNumber,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-bold border border-app-border rounded-xl bg-app-bg text-content-primary"
                  >
                    {WEEKDAY_LABELS.map((w) => (
                      <option key={w.day} value={w.day}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-content-secondary mb-1 block">
                    Nhóm bài tập
                  </label>
                  <select
                    value={editingWorkout.category}
                    onChange={(e) =>
                      setEditingWorkout({
                        ...editingWorkout,
                        category: e.target.value as WorkoutCategory,
                      })
                    }
                    className="w-full px-3 py-2 text-xs font-bold border border-app-border rounded-xl bg-app-bg text-content-primary"
                  >
                    {Object.entries(WORKOUT_CATEGORY_META).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.emoji} {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  Tên bài tập *
                </label>
                <input
                  value={editingWorkout.title}
                  onChange={(e) =>
                    setEditingWorkout({ ...editingWorkout, title: e.target.value })
                  }
                  placeholder="VD: Pilates siết cơ bụng & thon gọn đùi"
                  required
                  className="w-full px-3 py-2 text-xs font-semibold border border-app-border rounded-xl bg-app-bg text-content-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-xs font-bold text-content-secondary mb-1 block">
                    Khung giờ
                  </label>
                  <input
                    value={editingWorkout.time_slot}
                    onChange={(e) =>
                      setEditingWorkout({ ...editingWorkout, time_slot: e.target.value })
                    }
                    placeholder="17:30 – 18:00"
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-xl bg-app-bg text-content-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-content-secondary mb-1 block">
                    Số phút
                  </label>
                  <input
                    type="number"
                    value={editingWorkout.duration_min}
                    onChange={(e) =>
                      setEditingWorkout({
                        ...editingWorkout,
                        duration_min: Number(e.target.value) || 30,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-xl bg-app-bg text-content-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-content-secondary mb-1 block">
                    Calo đốt
                  </label>
                  <input
                    type="number"
                    value={editingWorkout.calories_est || 0}
                    onChange={(e) =>
                      setEditingWorkout({
                        ...editingWorkout,
                        calories_est: Number(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-xl bg-app-bg text-content-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-content-secondary mb-1 block">
                  Chi tiết động tác / Bài tập
                </label>
                <textarea
                  rows={2}
                  value={editingWorkout.exercises || ''}
                  onChange={(e) =>
                    setEditingWorkout({ ...editingWorkout, exercises: e.target.value })
                  }
                  placeholder="VD: Plank 3 hiệp x 45s, Squat 3x15, Giãn cơ..."
                  className="w-full px-3 py-2 text-xs border border-app-border rounded-xl bg-app-bg text-content-primary resize-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {!isNewWorkout ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkout(editingWorkout.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xoá
                  </button>
                ) : (
                  <div />
                )}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingWorkout(null)}
                  >
                    Huỷ
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    Lưu lịch tập
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
