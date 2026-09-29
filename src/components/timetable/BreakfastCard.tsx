import React, { useState, useEffect } from 'react';
import { storage } from '@/services/storage';
import { BreakfastPlan, BreakfastMeal, BreakfastSettings, WeekdayNumber } from '@/domain/types';
import { useChild } from '@/context/ChildContext';
import {
  UtensilsCrossed, Plus, Trash2, Edit3, Check, X, RotateCcw,
  ChevronDown, ChevronUp, ArrowLeftRight, Settings, Shuffle,
  EyeOff, GripVertical, ChevronLeft, ChevronRight, Sparkles, Tag,
} from 'lucide-react';

const WEEKDAYS: { num: WeekdayNumber; label: string; short: string }[] = [
  { num: 2, label: 'Thứ 2', short: 'T2' },
  { num: 3, label: 'Thứ 3', short: 'T3' },
  { num: 4, label: 'Thứ 4', short: 'T4' },
  { num: 5, label: 'Thứ 5', short: 'T5' },
  { num: 6, label: 'Thứ 6', short: 'T6' },
  { num: 7, label: 'Thứ 7', short: 'T7' },
  { num: 8, label: 'Chủ nhật', short: 'CN' },
];

/** Tính ISO week number của ngày */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

interface Props {
  /** Tuần JS weekday của ngày hôm nay để highlight */
  todayWeekday?: WeekdayNumber;
}

export const BreakfastCard: React.FC<Props> = ({ todayWeekday }) => {
  const { activeChild } = useChild();

  const [settings, setSettings] = useState<BreakfastSettings>(() =>
    storage.getBreakfastSettings(activeChild.id)
  );
  const [plans, setPlans] = useState<BreakfastPlan[]>(() =>
    storage.getBreakfastPlans(activeChild.id)
  );
  const [dishList, setDishList] = useState<string[]>(() =>
    storage.getBreakfastDishes()
  );

  // Reload từ storage khi đổi bé
  const reload = () => {
    setSettings(storage.getBreakfastSettings(activeChild.id));
    setPlans(storage.getBreakfastPlans(activeChild.id));
    setDishList(storage.getBreakfastDishes());
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild.id]);

  const saveSettings = (next: BreakfastSettings) => {
    setSettings(next);
    storage.saveBreakfastSettings(next);
  };

  const savePlan = (plan: BreakfastPlan) => {
    storage.saveBreakfastPlan(plan);
    setPlans(storage.getBreakfastPlans(activeChild.id));
  };

  const deletePlan = (id: string) => {
    storage.deleteBreakfastPlan(id);
    const remaining = storage.getBreakfastPlans(activeChild.id);
    setPlans(remaining);
    if (settings.active_plan_id === id) {
      saveSettings({ ...settings, active_plan_id: remaining[0]?.id });
    }
  };

  // UI state
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [isAddingPlan, setIsAddingPlan] = useState(false);

  // Swap-meal drag state
  const [swapSource, setSwapSource] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);

  // Quick Meal Modal Editor state
  const [modalCell, setModalCell] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);
  const [formMeal, setFormMeal] = useState('');
  const [formNote, setFormNote] = useState('');
  const [isAddingCustomDish, setIsAddingCustomDish] = useState(false);
  const [newCustomDishName, setNewCustomDishName] = useState('');

  // Determine active plan & tính tuần nếu auto_rotate
  const activePlanId = (() => {
    if (!settings.active_plan_id && plans.length > 0) return plans[0].id;
    if (settings.auto_rotate && settings.cycle_start && plans.length >= 2) {
      const cycleWeek = getISOWeekNumber(new Date(settings.cycle_start));
      const currentWeek = getISOWeekNumber(new Date());
      const diff = currentWeek - cycleWeek;
      const idx = ((diff % plans.length) + plans.length) % plans.length;
      return plans[idx]?.id || plans[0]?.id;
    }
    return settings.active_plan_id || plans[0]?.id;
  })();

  const activePlan = plans.find((p) => p.id === activePlanId);

  /* ---- Helpers ---- */
  const getMeal = (plan: BreakfastPlan, weekday: WeekdayNumber): BreakfastMeal | undefined =>
    plan.meals.find((m) => m.weekday === weekday);

  const upsertMeal = (plan: BreakfastPlan, weekday: WeekdayNumber, meal: string, note?: string): BreakfastPlan => {
    const meals = plan.meals.filter((m) => m.weekday !== weekday);
    if (meal.trim()) meals.push({ weekday, meal: meal.trim(), note: note?.trim() || undefined });
    return { ...plan, meals };
  };

  const addNewPlan = () => {
    const name = newPlanName.trim() || `Menu ${String.fromCharCode(65 + plans.length)}`;
    const plan: BreakfastPlan = {
      id: `bp-${Date.now()}`,
      child_id: activeChild.id,
      name,
      meals: [],
      created_at: new Date().toISOString(),
    };
    storage.saveBreakfastPlan(plan);
    const updated = storage.getBreakfastPlans(activeChild.id);
    setPlans(updated);
    saveSettings({ ...settings, active_plan_id: plan.id });
    setNewPlanName('');
    setIsAddingPlan(false);
  };

  /** Hoán vị 2 ngày trong cùng plan */
  const swapMeals = (planId: string, a: WeekdayNumber, b: WeekdayNumber) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const mealA = getMeal(plan, a);
    const mealB = getMeal(plan, b);
    let updated = plan;
    updated = upsertMeal(updated, a, mealB?.meal || '', mealB?.note);
    updated = upsertMeal(updated, b, mealA?.meal || '', mealA?.note);
    savePlan(updated);
  };

  const openModal = (planId: string, weekday: WeekdayNumber) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const m = getMeal(plan, weekday);
    setModalCell({ planId, weekday });
    setFormMeal(m?.meal || '');
    setFormNote(m?.note || '');
    setIsAddingCustomDish(false);
    setNewCustomDishName('');
  };

  const closeModal = () => {
    setModalCell(null);
    setIsAddingCustomDish(false);
  };

  const handleSaveMeal = (andNext = false) => {
    if (!modalCell || !activePlan) return;
    const updated = upsertMeal(activePlan, modalCell.weekday, formMeal, formNote);
    savePlan(updated);

    if (formMeal.trim()) {
      storage.addBreakfastDish(formMeal.trim());
      setDishList(storage.getBreakfastDishes());
    }

    if (andNext) {
      const currentIdx = WEEKDAYS.findIndex((d) => d.num === modalCell.weekday);
      const nextDay = WEEKDAYS[(currentIdx + 1) % WEEKDAYS.length];
      const nextMeal = getMeal(updated, nextDay.num);
      setModalCell({ planId: modalCell.planId, weekday: nextDay.num });
      setFormMeal(nextMeal?.meal || '');
      setFormNote(nextMeal?.note || '');
    } else {
      closeModal();
    }
  };

  const handleDeleteMeal = (planId: string, weekday: WeekdayNumber) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    savePlan(upsertMeal(plan, weekday, ''));
    if (modalCell?.weekday === weekday) {
      closeModal();
    }
  };

  const handleSwitchDayInModal = (targetWeekday: WeekdayNumber) => {
    if (!activePlan || !modalCell) return;
    const targetMeal = getMeal(activePlan, targetWeekday);
    setModalCell({ planId: modalCell.planId, weekday: targetWeekday });
    setFormMeal(targetMeal?.meal || '');
    setFormNote(targetMeal?.note || '');
  };

  const handleAddCustomDish = () => {
    const trimmed = newCustomDishName.trim();
    if (!trimmed) return;
    storage.addBreakfastDish(trimmed);
    setDishList(storage.getBreakfastDishes());
    setFormMeal(trimmed);
    setNewCustomDishName('');
    setIsAddingCustomDish(false);
  };

  const handleDeleteDishFromList = (dishToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    storage.deleteBreakfastDish(dishToDelete);
    setDishList(storage.getBreakfastDishes());
  };

  /* ---- Drag and Drop for swapping ---- */
  const handleDragStart = (planId: string, weekday: WeekdayNumber) => {
    setSwapSource({ planId, weekday });
    setSwapTarget(null);
  };
  const handleDragOver = (planId: string, weekday: WeekdayNumber, e: React.DragEvent) => {
    e.preventDefault();
    setSwapTarget({ planId, weekday });
  };
  const handleDrop = (planId: string, weekday: WeekdayNumber) => {
    if (swapSource && swapSource.planId === planId && swapSource.weekday !== weekday) {
      swapMeals(planId, swapSource.weekday, weekday);
    }
    setSwapSource(null);
    setSwapTarget(null);
  };

  if (!settings.enabled) {
    return (
      <div className="mt-4 pt-4 border-t border-dashed border-slate-200">
        <button
          onClick={() => saveSettings({ ...settings, enabled: true })}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all text-sm font-semibold group cursor-pointer"
        >
          <UtensilsCrossed className="w-4 h-4 group-hover:scale-110 transition-transform text-amber-600" />
          <span>Bật thẻ Thực đơn bữa sáng</span>
          <span className="text-xs font-normal text-amber-500">(Click để kích hoạt)</span>
        </button>
      </div>
    );
  }

  const currentModalDay = modalCell ? WEEKDAYS.find((d) => d.num === modalCell.weekday) : null;
  const currentModalMeal = modalCell && activePlan ? getMeal(activePlan, modalCell.weekday) : null;

  return (
    <div className="mt-5 pt-4 border-t-2 border-dashed border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-base shadow-sm">
            ☀️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">Thực đơn bữa sáng</h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                Tuần {getISOWeekNumber(new Date())}
              </span>
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              {settings.auto_rotate && plans.length >= 2
                ? `Tự động xoay ${plans.length} menu • Tuần này: ${activePlan?.name || '—'}`
                : `Đang dùng: ${activePlan?.name || '—'}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSettingsOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer text-amber-800 ${
              isSettingsOpen ? 'bg-amber-200/80 border-amber-400' : 'bg-white border-amber-200 hover:bg-amber-50'
            }`}
            title="Cài đặt bữa sáng & xoay menu"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => saveSettings({ ...settings, enabled: false })}
            className="p-1.5 rounded-lg border border-amber-200 bg-white hover:bg-rose-50 hover:border-rose-300 hover:text-rose-600 text-amber-700 transition-colors cursor-pointer"
            title="Tắt thẻ bữa sáng"
          >
            <EyeOff className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 transition-colors cursor-pointer"
            title={isExpanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="mb-3.5 p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs space-y-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/80">
            <p className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
              <span>⚙️ Cài đặt thực đơn</span>
            </p>
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="text-amber-700 hover:text-amber-900 font-bold p-1 rounded hover:bg-amber-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto rotate toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              onClick={() => {
                const next = { ...settings, auto_rotate: !settings.auto_rotate };
                if (!next.auto_rotate) next.cycle_start = undefined;
                else next.cycle_start = new Date().toISOString().split('T')[0];
                saveSettings(next);
              }}
              className={`w-9 h-5 rounded-full border-2 relative transition-all ${
                settings.auto_rotate ? 'bg-amber-500 border-amber-600' : 'bg-slate-200 border-slate-300'
              }`}
            >
              <div
                className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${
                  settings.auto_rotate ? 'left-[18px]' : 'left-0.5'
                }`}
              />
            </div>
            <div className="text-amber-900 leading-tight">
              <span className="font-bold">Tự động đổi món xoay vòng theo tuần</span>
              <p className="text-[10px] text-amber-700">
                {settings.auto_rotate
                  ? 'Hệ thống tự động luân phiên các Menu A, B, C... mỗi khi sang tuần mới'
                  : 'Đang tắt xoay vòng (chọn menu thủ công bên dưới)'}
              </p>
            </div>
          </label>

          {settings.auto_rotate && settings.cycle_start && (
            <div className="flex items-center gap-2 pl-12 text-[11px]">
              <span className="text-amber-800 font-medium">Bắt đầu chu kỳ từ:</span>
              <input
                type="date"
                value={settings.cycle_start}
                onChange={(e) => saveSettings({ ...settings, cycle_start: e.target.value })}
                className="border border-amber-300 rounded-md px-2 py-0.5 text-xs bg-white text-amber-950 font-medium"
              />
            </div>
          )}

          {/* Menu list management */}
          <div className="space-y-2 pt-1 border-t border-amber-200/60">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-950">Danh sách các Menu ({plans.length})</span>
              <span className="text-[10px] text-amber-600 font-normal">Tạo nhiều menu để xoay món</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                    plan.id === activePlanId
                      ? 'bg-amber-100/70 border-amber-400 shadow-2xs'
                      : 'bg-white border-amber-200 hover:border-amber-300'
                  }`}
                >
                  <button
                    onClick={() => saveSettings({ ...settings, active_plan_id: plan.id, auto_rotate: false })}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                      plan.id === activePlanId
                        ? 'bg-amber-500 border-amber-600'
                        : 'border-slate-300 hover:border-amber-400'
                    }`}
                    title="Chọn làm menu hiện tại"
                  >
                    {plan.id === activePlanId && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </button>
                  {editingPlanId === plan.id ? (
                    <input
                      autoFocus
                      value={plan.name}
                      onChange={(e) => savePlan({ ...plan, name: e.target.value })}
                      onBlur={() => setEditingPlanId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingPlanId(null)}
                      className="flex-1 border border-amber-300 rounded-md px-2 py-0.5 text-xs bg-white text-amber-950 font-semibold"
                    />
                  ) : (
                    <div
                      className="flex-1 font-semibold text-amber-950 cursor-pointer"
                      onClick={() => setEditingPlanId(plan.id)}
                    >
                      {plan.name}
                      <span className="text-[10px] font-normal text-amber-600 ml-2">
                        ({plan.meals.length}/7 ngày có món)
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => setEditingPlanId(editingPlanId === plan.id ? null : plan.id)}
                    className="p-1 text-slate-400 hover:text-amber-600 transition-colors rounded"
                    title="Đổi tên"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Xóa "${plan.name}"?`)) deletePlan(plan.id);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-500 transition-colors rounded"
                    title="Xóa menu"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {isAddingPlan ? (
              <div className="flex items-center gap-2 pt-1">
                <input
                  autoFocus
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addNewPlan();
                    if (e.key === 'Escape') setIsAddingPlan(false);
                  }}
                  placeholder={`Ví dụ: Menu ${String.fromCharCode(65 + plans.length)} (Tuần chẵn)`}
                  className="flex-1 border border-amber-300 rounded-lg px-2.5 py-1 text-xs bg-white text-amber-950"
                />
                <button
                  onClick={addNewPlan}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Lưu
                </button>
                <button
                  onClick={() => setIsAddingPlan(false)}
                  className="p-1 bg-slate-200 hover:bg-slate-300 rounded-lg text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingPlan(true)}
                className="w-full py-1.5 border-2 border-dashed border-amber-300 rounded-xl text-amber-800 hover:bg-amber-100/60 transition-colors flex items-center justify-center gap-1 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm menu mới
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan tabs (if multiple) */}
      {isExpanded && plans.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="text-[11px] font-bold text-amber-800 mr-1 flex items-center gap-1">
            <UtensilsCrossed className="w-3 h-3 text-amber-600" /> Menu:
          </span>
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => saveSettings({ ...settings, active_plan_id: plan.id, auto_rotate: false })}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                plan.id === activePlanId
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
            >
              {plan.name}
              {settings.auto_rotate && plan.id === activePlanId && ' ✓'}
            </button>
          ))}
          {settings.auto_rotate && (
            <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 font-bold px-2 py-0.5 rounded-full ml-1 border border-amber-200">
              <Shuffle className="w-3 h-3 text-amber-600" /> Tự động đổi tuần
            </span>
          )}
        </div>
      )}

      {/* Meal Grid */}
      {isExpanded && (
        <div className="overflow-x-auto rounded-xl border border-amber-200 shadow-xs bg-white">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-amber-700">
              <UtensilsCrossed className="w-8 h-8 opacity-40 text-amber-500" />
              <p className="text-sm font-bold">Chưa có menu nào</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-sm font-bold transition-colors cursor-pointer"
              >
                + Tạo menu đầu tiên
              </button>
            </div>
          ) : activePlan ? (
            <table className="w-full border-collapse text-xs min-w-[580px]">
              <thead>
                <tr className="border-b border-amber-200 bg-amber-50/80">
                  {WEEKDAYS.map((d) => {
                    const isToday = d.num === todayWeekday;
                    return (
                      <th
                        key={d.num}
                        className={`py-2 px-2 text-center font-bold text-xs transition-colors ${
                          isToday
                            ? 'bg-amber-500 text-white'
                            : 'text-amber-900 border-r border-amber-100 last:border-r-0'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                          <span>{d.label}</span>
                          {isToday && <span className="text-[10px] font-normal">●</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {WEEKDAYS.map((d) => {
                    const m = getMeal(activePlan, d.num);
                    const isDragTarget = swapTarget?.planId === activePlan.id && swapTarget?.weekday === d.num;
                    const isToday = d.num === todayWeekday;

                    return (
                      <td
                        key={d.num}
                        draggable={!!m}
                        onDragStart={() => m && handleDragStart(activePlan.id, d.num)}
                        onDragOver={(e) => handleDragOver(activePlan.id, d.num, e)}
                        onDrop={() => handleDrop(activePlan.id, d.num)}
                        onDragEnd={() => {
                          setSwapSource(null);
                          setSwapTarget(null);
                        }}
                        className={`p-1.5 align-top border-r border-amber-100 last:border-r-0 transition-all ${
                          isToday ? 'bg-amber-50/50' : 'bg-white'
                        } ${isDragTarget ? 'ring-2 ring-amber-400 bg-amber-100/70' : ''}`}
                        style={{ minWidth: 100, width: `${100 / 7}%` }}
                      >
                        {m ? (
                          <div
                            onClick={() => openModal(activePlan.id, d.num)}
                            className={`group relative flex flex-col justify-between min-h-[64px] p-2 rounded-xl border transition-all cursor-pointer ${
                              isToday
                                ? 'bg-amber-100/90 border-amber-300 shadow-2xs hover:bg-amber-100 hover:border-amber-400'
                                : 'bg-amber-50/40 border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 hover:shadow-2xs'
                            }`}
                            title="Bấm để chỉnh sửa món"
                          >
                            {/* Grip & Quick Delete on hover */}
                            <div className="absolute top-1 right-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteMeal(activePlan.id, d.num);
                                }}
                                title="Xóa món"
                                className="w-4 h-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center text-[10px] shadow-sm cursor-pointer"
                              >
                                <X className="w-2.5 h-2.5" />
                              </span>
                            </div>

                            {/* Tên món — Không lặp lại nhãn thứ */}
                            <div className="text-xs font-bold text-amber-950 leading-snug pr-3">
                              {m.meal}
                            </div>

                            {/* Ghi chú hoặc Hôm nay */}
                            <div className="mt-1.5 space-y-1">
                              {m.note && (
                                <div
                                  className="text-[9px] text-amber-900 bg-amber-200/60 rounded px-1.5 py-0.5 font-normal leading-tight truncate border border-amber-300/40"
                                  title={m.note}
                                >
                                  📝 {m.note}
                                </div>
                              )}
                              {isToday && (
                                <span className="inline-flex items-center text-[9px] font-bold text-amber-700 bg-white/80 px-1.5 py-0.5 rounded-full border border-amber-200 shadow-2xs">
                                  📍 Hôm nay
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* Ô trống: bấm để thêm nhanh */
                          <button
                            type="button"
                            onClick={() => openModal(activePlan.id, d.num)}
                            className="w-full h-full min-h-[64px] flex flex-col items-center justify-center gap-1 text-amber-400 hover:text-amber-700 hover:bg-amber-50/70 rounded-xl transition-all group border border-dashed border-amber-200 hover:border-amber-400 cursor-pointer p-1"
                            title="Bấm để chọn món ăn sáng"
                          >
                            <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-semibold">Thêm món</span>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          ) : null}
        </div>
      )}

      {/* Gợi ý kéo thả đổi món */}
      {isExpanded && activePlan && activePlan.meals.length >= 2 && (
        <div className="flex items-center justify-between text-[11px] text-amber-700 mt-2 px-1">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
            Kéo thả giữa 2 ô để hoán đổi món cho nhau • Nhấp vào ô để chỉnh sửa nhanh
          </span>
        </div>
      )}

      {/* ================= MODAL CHỌN MÓN ĂN SÁNG NHANH ================= */}
      {modalCell && currentModalDay && activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xl w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  🍳
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-1.5">
                    <span>Thực đơn {currentModalDay.label}</span>
                    {currentModalDay.num === todayWeekday && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded-full border border-amber-200">
                        Hôm nay
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-600">
                    Menu: <strong className="text-amber-800">{activePlan.name}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Day Switcher Tabs inside Modal */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-amber-800 shrink-0 mr-1">Chuyển ngày:</span>
              {WEEKDAYS.map((d) => (
                <button
                  type="button"
                  key={d.num}
                  onClick={() => handleSwitchDayInModal(d.num)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                    d.num === modalCell.weekday
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  {d.short}
                </button>
              ))}
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMeal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Input tên món */}
              <div className="space-y-1.5">
                <label className="font-bold text-amber-950 flex items-center justify-between">
                  <span>Món ăn sáng *</span>
                  {formMeal && (
                    <span className="text-[10px] text-amber-600 font-normal">
                      Bấm Enter hoặc nút Lưu để hoàn tất
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Nhập tên món ăn sáng (ví dụ: Bánh mì trứng)..."
                  value={formMeal}
                  onChange={(e) => setFormMeal(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/30 text-amber-950 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                {/* Quick Pills (Gợi ý món chọn nhanh giống môn học) */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <Tag className="w-3 h-3 text-amber-600" />
                      Gợi ý món ăn nhanh (bấm để chọn):
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingCustomDish((v) => !v)}
                      className="text-amber-700 hover:text-amber-900 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      Thêm món vào danh sách
                    </button>
                  </div>

                  {/* Add Custom Dish input */}
                  {isAddingCustomDish && (
                    <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded-xl border border-amber-200">
                      <input
                        type="text"
                        placeholder="Tên món mới..."
                        value={newCustomDishName}
                        onChange={(e) => setNewCustomDishName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddCustomDish();
                          }
                          if (e.key === 'Escape') setIsAddingCustomDish(false);
                        }}
                        className="flex-1 px-2.5 py-1 rounded-lg border border-amber-300 text-xs bg-white text-amber-950"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomDish}
                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs cursor-pointer"
                      >
                        Thêm
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCustomDish(false)}
                        className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Quick Pills List */}
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-amber-50/50 rounded-xl border border-amber-200/60">
                    {dishList.map((dish) => {
                      const isSelected = formMeal === dish;
                      return (
                        <div
                          key={dish}
                          className={`group/pill inline-flex items-center rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-2xs'
                              : 'bg-white text-amber-950 border-amber-200 hover:border-amber-400 hover:bg-amber-100/70'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setFormMeal(dish)}
                            className="px-2.5 py-1 text-left cursor-pointer"
                          >
                            {dish}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleDeleteDishFromList(dish, e)}
                            title="Xóa khỏi danh sách gợi ý"
                            className={`pr-1.5 pl-0.5 opacity-0 group-hover/pill:opacity-100 transition-opacity hover:text-rose-500 cursor-pointer ${
                              isSelected ? 'text-white/80 hover:text-white' : 'text-slate-400'
                            }`}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="font-bold text-amber-950">Ghi chú thêm (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: uống 1 hộp sữa tươi, mang thêm bánh..."
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-amber-200 bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-100 gap-2">
                <div>
                  {currentModalMeal && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMeal(activePlan.id, modalCell.weekday)}
                      className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Xóa món này
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Huỷ
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveMeal(true)}
                    className="px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                    title="Lưu món này và mở ngay ngày tiếp theo"
                  >
                    <span>Lưu & Tiếp theo</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Lưu
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
