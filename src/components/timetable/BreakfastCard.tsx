import React, { useState, useEffect, useCallback } from 'react';
import { storage } from '@/services/storage';
import { BreakfastPlan, BreakfastMeal, BreakfastSettings, WeekdayNumber } from '@/domain/types';
import { useChild } from '@/context/ChildContext';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Check,
  X,
  ArrowLeftRight,
  Shuffle,
  Eye,
  EyeOff,
  ChevronRight,
  Tag,
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
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
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

  // Reload từ storage khi đổi bé hoặc khi cloud sync hoàn tất
  const reload = useCallback(() => {
    setSettings(storage.getBreakfastSettings(activeChild.id));
    setPlans(storage.getBreakfastPlans(activeChild.id));
    setDishList(storage.getBreakfastDishes());
  }, [activeChild.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  useEffect(() => {
    const handleSync = () => reload();
    window.addEventListener('ktt-cloud-synced', handleSync);
    window.addEventListener('ktt-breakfast-updated', handleSync);
    return () => {
      window.removeEventListener('ktt-cloud-synced', handleSync);
      window.removeEventListener('ktt-breakfast-updated', handleSync);
    };
  }, [reload]);

  const saveSettings = (next: BreakfastSettings) => {
    setSettings(next);
    storage.saveBreakfastSettings(next);
  };

  const savePlan = (plan: BreakfastPlan) => {
    storage.saveBreakfastPlan(plan);
    setPlans(storage.getBreakfastPlans(activeChild.id));
  };

  // Swap-meal drag state
  const [swapSource, setSwapSource] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);
  const [swapTarget, setSwapTarget] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);

  // Quick Meal Modal Editor state
  const [modalCell, setModalCell] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);
  const [formMeal, setFormMeal] = useState('');
  const [formNote, setFormNote] = useState('');
  const [autoSavedToast, setAutoSavedToast] = useState(false);

  // Determine active plan & tính tuần nếu auto_rotate
  const activePlan = storage.getActiveBreakfastPlanForChild(activeChild.id) || plans[0] || null;
  const activePlanId = activePlan?.id || '';

  /* ---- Helpers ---- */
  const getMeal = (plan: BreakfastPlan, weekday: WeekdayNumber): BreakfastMeal | undefined =>
    plan.meals.find((m) => m.weekday === weekday);

  const upsertMeal = (plan: BreakfastPlan, weekday: WeekdayNumber, meal: string, note?: string): BreakfastPlan => {
    const meals = plan.meals.filter((m) => m.weekday !== weekday);
    if (meal.trim()) meals.push({ weekday, meal: meal.trim(), note: note?.trim() || undefined });
    return { ...plan, meals };
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
    const plan = plans.find((p) => p.id === planId) || activePlan;
    if (!plan) return;
    const m = getMeal(plan, weekday);
    setModalCell({ planId: plan.id, weekday });
    setFormMeal(m?.meal || '');
    setFormNote(m?.note || '');
    setAutoSavedToast(false);
  };

  const closeModal = () => {
    // Tự động lưu nếu người dùng đã nhập tên món trước khi đóng
    if (modalCell && activePlan && formMeal.trim()) {
      const updated = upsertMeal(activePlan, modalCell.weekday, formMeal, formNote);
      savePlan(updated);
    }
    setModalCell(null);
    setAutoSavedToast(false);
  };

  const persistCurrentModalMeal = (mealStr: string, noteStr: string): BreakfastPlan | null => {
    if (!modalCell || !activePlan) return null;
    const updated = upsertMeal(activePlan, modalCell.weekday, mealStr, noteStr);
    savePlan(updated);
    if (mealStr.trim()) {
      storage.addBreakfastDish(mealStr.trim());
      setDishList(storage.getBreakfastDishes());
    }
    setAutoSavedToast(true);
    return updated;
  };

  const handleSaveMeal = (andNext = false) => {
    if (!modalCell || !activePlan) return;
    const updated = persistCurrentModalMeal(formMeal, formNote);
    if (!updated) return;

    if (andNext) {
      const currentIdx = WEEKDAYS.findIndex((d) => d.num === modalCell.weekday);
      const nextDay = WEEKDAYS[(currentIdx + 1) % WEEKDAYS.length];
      const nextMeal = getMeal(updated, nextDay.num);
      setModalCell({ planId: modalCell.planId, weekday: nextDay.num });
      setFormMeal(nextMeal?.meal || '');
      setFormNote(nextMeal?.note || '');
      setAutoSavedToast(false);
    } else {
      setModalCell(null);
    }
  };

  const handleDeleteMeal = (planId: string, weekday: WeekdayNumber) => {
    const plan = plans.find((p) => p.id === planId) || activePlan;
    if (!plan) return;
    savePlan(upsertMeal(plan, weekday, ''));
    if (modalCell?.weekday === weekday) {
      setModalCell(null);
    }
  };

  const handleSwitchDayInModal = (targetWeekday: WeekdayNumber) => {
    if (!activePlan || !modalCell) return;
    // Tự động lưu ngày hiện tại trước khi chuyển sang ngày khác để không bao giờ mất dữ liệu
    let latestPlan = activePlan;
    if (formMeal.trim()) {
      latestPlan = upsertMeal(activePlan, modalCell.weekday, formMeal, formNote);
      savePlan(latestPlan);
    }
    const targetMeal = getMeal(latestPlan, targetWeekday);
    setModalCell({ planId: modalCell.planId, weekday: targetWeekday });
    setFormMeal(targetMeal?.meal || '');
    setFormNote(targetMeal?.note || '');
    setAutoSavedToast(false);
  };

  const handleQuickPickDish = (dish: string) => {
    setFormMeal(dish);
    // Lưu ngay lập tức khi bấm chọn món gợi ý
    persistCurrentModalMeal(dish, formNote);
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

  // Trạng thái đang ẩn (Show / Hide)
  if (!settings.enabled) {
    return (
      <div data-section="breakfast" className="mt-4 pt-3 border-t border-dashed border-amber-200 no-print">
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80">
          <div className="flex items-center gap-2 text-amber-800 text-xs font-bold">
            <UtensilsCrossed className="w-4 h-4 text-amber-600" />
            <span>Thực đơn bữa sáng đang tạm ẩn</span>
          </div>
          <button
            onClick={() => saveSettings({ ...settings, enabled: true })}
            className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-all text-xs font-bold shadow-xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Hiện thực đơn (Show)</span>
          </button>
        </div>
      </div>
    );
  }

  const currentModalDay = modalCell ? WEEKDAYS.find((d) => d.num === modalCell.weekday) : null;
  const currentModalMeal = modalCell && activePlan ? getMeal(activePlan, modalCell.weekday) : null;

  return (
    <div data-section="breakfast" className="mt-5 pt-4 border-t-2 border-dashed border-amber-200">
      {/* Header gọn gàng: Tiêu đề + Chọn nhanh Menu (nếu có >1 menu) + Nút Show/Hide */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white flex items-center justify-center text-base shadow-sm shrink-0">
            ☀️
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                Thực đơn bữa sáng
              </h3>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                Tuần {getISOWeekNumber(new Date())}
              </span>
              {settings.auto_rotate && plans.length >= 2 && (
                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  <Shuffle className="w-3 h-3 text-amber-600" /> Xoay tự động
                </span>
              )}
            </div>
            <p className="text-[11px] text-amber-700 font-medium">
              Nhấp vào từng ngày để đổi món nhanh • Cài đặt danh sách menu tại mục Cài đặt
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap no-print">
          {/* Nếu có nhiều menu thì cho phép chọn nhanh menu đang hiển thị */}
          {plans.length > 1 && (
            <div className="flex items-center gap-1 bg-amber-50 p-1 rounded-xl border border-amber-200">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => saveSettings({ ...settings, active_plan_id: plan.id, auto_rotate: false })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    plan.id === activePlanId
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-amber-800 hover:bg-amber-100/80'
                  }`}
                >
                  {plan.name}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => saveSettings({ ...settings, enabled: false })}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-white hover:bg-amber-50 text-amber-800 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
            title="Ẩn bảng thực đơn bữa sáng"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-600" />
            <span>Ẩn thực đơn (Hide)</span>
          </button>
        </div>
      </div>

      {/* Bảng thực đơn 7 ngày căn giữa cân đối */}
      <div className="overflow-x-auto rounded-2xl border-2 border-amber-200/90 shadow-sm bg-white">
        {activePlan ? (
          <table className="w-full table-fixed border-collapse text-xs min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50/70 to-amber-50">
                {WEEKDAYS.map((d) => {
                  const isToday = d.num === todayWeekday;
                  return (
                    <th
                      key={d.num}
                      style={{ width: `${100 / 7}%` }}
                      className={`py-2.5 px-2 text-center font-extrabold text-xs uppercase tracking-wider transition-colors ${
                        isToday
                          ? 'bg-amber-500 text-white'
                          : 'text-amber-900 border-r border-amber-100 last:border-r-0'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>{d.label}</span>
                        {isToday && (
                          <span className="text-[9px] bg-white text-amber-700 font-black px-1.5 py-0.2 rounded-full">
                            Hôm nay
                          </span>
                        )}
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
                      className={`p-2 align-middle border-r border-amber-100 last:border-r-0 transition-all text-center ${
                        isToday ? 'bg-amber-50/60' : 'bg-white'
                      } ${isDragTarget ? 'ring-2 ring-amber-400 bg-amber-100/70' : ''}`}
                    >
                      {m ? (
                        <div
                          onClick={() => openModal(activePlan.id, d.num)}
                          className={`group relative flex flex-col items-center justify-center text-center min-h-[76px] p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isToday
                              ? 'bg-gradient-to-b from-amber-100/90 to-amber-50 border-amber-400 shadow-xs hover:shadow-md'
                              : 'bg-amber-50/40 border-amber-200/80 hover:bg-amber-50 hover:border-amber-300 hover:shadow-xs'
                          }`}
                          title="Bấm để chọn hoặc đổi món ăn sáng"
                        >
                          {/* Quick Delete on hover */}
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 no-print">
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

                          {/* Tên món ăn căn giữa cân đối */}
                          <div className="text-xs font-extrabold text-amber-950 leading-snug text-center break-words w-full px-1">
                            {m.meal}
                          </div>

                          {/* Ghi chú căn giữa */}
                          {m.note && (
                            <div
                              className="mt-1.5 inline-flex items-center justify-center text-[10px] text-amber-900 bg-amber-200/60 rounded-lg px-2 py-0.5 font-medium leading-tight text-center max-w-full border border-amber-300/50"
                              title={m.note}
                            >
                              <span className="truncate">📝 {m.note}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Ô trống căn giữa */
                        <button
                          type="button"
                          onClick={() => openModal(activePlan.id, d.num)}
                          className="w-full min-h-[76px] flex flex-col items-center justify-center gap-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50/80 rounded-xl transition-all group border border-dashed border-amber-200 hover:border-amber-400 cursor-pointer p-2 text-center"
                          title="Bấm để chọn món ăn sáng"
                        >
                          <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold">Chọn món</span>
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

      {/* Gợi ý kéo thả đổi món */}
      {activePlan && activePlan.meals.length >= 2 && (
        <div className="flex items-center justify-center text-[11px] text-amber-700 mt-2 px-1 no-print">
          <span className="flex items-center gap-1.5 font-medium">
            <ArrowLeftRight className="w-3.5 h-3.5 text-amber-600" />
            Kéo thả giữa 2 ô để hoán đổi món • Bấm trực tiếp vào ô để chọn món ăn
          </span>
        </div>
      )}

      {/* ================= MODAL CHỌN MÓN ĂN SÁNG NHANH ================= */}
      {modalCell && currentModalDay && activePlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150 no-print">
          <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xl w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🍳
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                    <span>Chọn món ăn sáng — {currentModalDay.label}</span>
                    {currentModalDay.num === todayWeekday && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        Hôm nay
                      </span>
                    )}
                  </h3>
                  <p className="text-[11px] text-amber-700 flex items-center gap-2">
                    <span>Menu: <strong className="text-amber-900">{activePlan.name}</strong></span>
                    {autoSavedToast && (
                      <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200">
                        ✓ Đã lưu tự động
                      </span>
                    )}
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
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[11px] font-bold text-amber-800 shrink-0 mr-1">Chuyển ngày:</span>
              {WEEKDAYS.map((d) => {
                const hasDish = !!getMeal(activePlan, d.num)?.meal;
                return (
                  <button
                    type="button"
                    key={d.num}
                    onClick={() => handleSwitchDayInModal(d.num)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                      d.num === modalCell.weekday
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : hasDish
                        ? 'bg-amber-100/70 text-amber-950 border-amber-300 hover:bg-amber-100'
                        : 'bg-amber-50/50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {d.short} {hasDish && d.num !== modalCell.weekday ? '•' : ''}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveMeal(false);
              }}
              className="space-y-3.5 text-xs"
            >
              {/* Quick Pills (Gợi ý món chọn nhanh) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-900 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-amber-600" />
                    Chọn nhanh từ thực đơn gợi ý (bấm là tự lưu):
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-2 bg-amber-50/60 rounded-xl border border-amber-200/80">
                  {dishList.map((dish) => {
                    const isSelected = formMeal === dish;
                    return (
                      <button
                        type="button"
                        key={dish}
                        onClick={() => handleQuickPickDish(dish)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-[1.02]'
                            : 'bg-white text-amber-950 border-amber-200 hover:border-amber-400 hover:bg-amber-100/70'
                        }`}
                      >
                        {dish}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Input tên món tự nhập */}
              <div className="space-y-1">
                <label className="font-bold text-amber-950 block">
                  Hoặc tự nhập tên món ăn sáng *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên món ăn sáng (ví dụ: Bánh mì trứng)..."
                  value={formMeal}
                  onChange={(e) => {
                    setFormMeal(e.target.value);
                    setAutoSavedToast(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-amber-50/30 text-amber-950 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Ghi chú */}
              <div className="space-y-1">
                <label className="font-bold text-amber-950 block">Ghi chú kèm theo (tuỳ chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: uống 1 hộp sữa tươi, thêm phô mai..."
                  value={formNote}
                  onChange={(e) => {
                    setFormNote(e.target.value);
                    setAutoSavedToast(false);
                  }}
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
                      Xóa món
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Đóng
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
                    Lưu món
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
