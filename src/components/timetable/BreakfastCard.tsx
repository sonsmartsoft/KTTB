import React, { useState, useCallback } from 'react';
import { storage } from '@/services/storage';
import { BreakfastPlan, BreakfastMeal, BreakfastSettings, WeekdayNumber } from '@/domain/types';
import { useChild } from '@/context/ChildContext';
import {
  UtensilsCrossed, Plus, Trash2, Edit3, Check, X, RotateCcw,
  ChevronDown, ChevronUp, ArrowLeftRight, Settings, Shuffle,
  Eye, EyeOff, GripVertical,
} from 'lucide-react';

const WEEKDAYS: { num: WeekdayNumber; label: string; short: string }[] = [
  { num: 2, label: 'Thứ 2', short: 'T2' },
  { num: 3, label: 'Thứ 3', short: 'T3' },
  { num: 4, label: 'Thứ 4', short: 'T4' },
  { num: 5, label: 'Thứ 5', short: 'T5' },
  { num: 6, label: 'Thứ 6', short: 'T6' },
  { num: 7, label: 'Thứ 7', short: 'T7' },
  { num: 8, label: 'CN', short: 'CN' },
];

/** Tính ISO week number của ngày */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const MEAL_SUGGESTIONS = [
  'Bánh mì trứng', 'Bánh mì thịt nguội', 'Cháo gà', 'Cháo thịt',
  'Phở bò', 'Phở gà', 'Bún riêu', 'Mì tôm trứng', 'Cơm chiên trứng',
  'Xôi xéo', 'Xôi lạc', 'Bánh cuốn', 'Bánh bao', 'Sữa + bánh quy',
  'Trứng ốp la + cơm', 'Miến gà', 'Hủ tiếu', 'Bún bò', 'Bánh ướt',
  'Yến mạch', 'Sandwich', 'Ngũ cốc sữa', 'Cháo cá',
];

interface Props {
  /** Tuần JS weekday của ngày hôm nay để highlight */
  todayWeekday?: WeekdayNumber;
}

export const BreakfastCard: React.FC<Props> = ({ todayWeekday }) => {
  const { activeChild } = useChild();

  // Reload từ storage
  const reload = () => {
    setSettings(storage.getBreakfastSettings(activeChild.id));
    setPlans(storage.getBreakfastPlans(activeChild.id));
  };

  const [settings, setSettings] = useState<BreakfastSettings>(() =>
    storage.getBreakfastSettings(activeChild.id)
  );
  const [plans, setPlans] = useState<BreakfastPlan[]>(() =>
    storage.getBreakfastPlans(activeChild.id)
  );

  // Đồng bộ khi đổi trẻ
  React.useEffect(() => {
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

  // Inline meal edit state
  const [editCell, setEditCell] = useState<{ planId: string; weekday: WeekdayNumber } | null>(null);
  const [editMealValue, setEditMealValue] = useState('');
  const [editNoteValue, setEditNoteValue] = useState('');
  const [suggestionOpen, setSuggestionOpen] = useState(false);

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

  const openEditCell = (planId: string, weekday: WeekdayNumber) => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;
    const m = getMeal(plan, weekday);
    setEditCell({ planId, weekday });
    setEditMealValue(m?.meal || '');
    setEditNoteValue(m?.note || '');
    setSuggestionOpen(false);
  };

  const saveEditCell = () => {
    if (!editCell) return;
    const plan = plans.find((p) => p.id === editCell.planId);
    if (!plan) return;
    savePlan(upsertMeal(plan, editCell.weekday, editMealValue, editNoteValue));
    setEditCell(null);
    setSuggestionOpen(false);
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400 transition-all text-sm font-semibold group"
        >
          <UtensilsCrossed className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Bật thẻ Thực đơn bữa sáng</span>
          <span className="text-xs font-normal text-amber-500">(Click để kích hoạt)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 pt-4 border-t-2 border-dashed border-amber-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-lg">☀️</div>
          <div>
            <h3 className="text-sm font-black text-amber-900 uppercase tracking-wide">Thực đơn bữa sáng</h3>
            <p className="text-[10px] text-amber-600">
              {settings.auto_rotate && plans.length >= 2
                ? `Tự động xoay ${plans.length} menu • Tuần này: ${activePlan?.name || '—'}`
                : `Đang dùng: ${activePlan?.name || '—'}`
              }
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsSettingsOpen((v) => !v)}
            className={`p-1.5 rounded-lg border transition-colors text-amber-700 ${isSettingsOpen ? 'bg-amber-100 border-amber-300' : 'bg-white border-amber-200 hover:bg-amber-50'}`}
            title="Cài đặt bữa sáng"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => saveSettings({ ...settings, enabled: false })}
            className="p-1.5 rounded-lg border border-amber-200 bg-white hover:bg-red-50 hover:border-red-300 hover:text-red-600 text-amber-700 transition-colors"
            title="Ẩn thẻ bữa sáng"
          >
            <EyeOff className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="p-1.5 rounded-lg border border-amber-200 bg-white hover:bg-amber-50 text-amber-700 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {isSettingsOpen && (
        <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-3">
          <p className="font-bold text-amber-900 text-[11px] uppercase tracking-wider">⚙️ Cài đặt thực đơn</p>

          {/* Auto rotate */}
          <label className="flex items-center gap-2.5 cursor-pointer">
            <div
              onClick={() => {
                const next = { ...settings, auto_rotate: !settings.auto_rotate };
                if (!next.auto_rotate) next.cycle_start = undefined;
                else next.cycle_start = new Date().toISOString().split('T')[0];
                saveSettings(next);
              }}
              className={`w-9 h-5 rounded-full border-2 relative transition-all ${settings.auto_rotate ? 'bg-amber-500 border-amber-600' : 'bg-slate-200 border-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-3.5 h-3.5 bg-white rounded-full shadow transition-all ${settings.auto_rotate ? 'left-[18px]' : 'left-0.5'}`} />
            </div>
            <span className="font-semibold text-amber-800">
              Tự động xoay vòng menu theo tuần
              {settings.auto_rotate && <span className="font-normal text-amber-600"> (cần ≥ 2 menu)</span>}
            </span>
          </label>

          {settings.auto_rotate && settings.cycle_start && (
            <div className="flex items-center gap-2">
              <span className="text-amber-700">Bắt đầu từ:</span>
              <input
                type="date"
                value={settings.cycle_start}
                onChange={(e) => saveSettings({ ...settings, cycle_start: e.target.value })}
                className="border border-amber-300 rounded-md px-2 py-0.5 text-xs bg-white"
              />
              <span className="text-amber-500">(thứ Hai tuần đó)</span>
            </div>
          )}

          {/* Menu list management */}
          <div className="space-y-1.5">
            <p className="font-semibold text-amber-800">Danh sách menu ({plans.length})</p>
            {plans.map((plan) => (
              <div key={plan.id} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-amber-200">
                <button
                  onClick={() => saveSettings({ ...settings, active_plan_id: plan.id, auto_rotate: false })}
                  className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${plan.id === activePlanId && !settings.auto_rotate ? 'bg-amber-500 border-amber-600' : 'border-slate-300 hover:border-amber-400'}`}
                >
                  {plan.id === activePlanId && !settings.auto_rotate && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </button>
                {editingPlanId === plan.id ? (
                  <input
                    autoFocus
                    value={plan.name}
                    onChange={(e) => savePlan({ ...plan, name: e.target.value })}
                    onBlur={() => setEditingPlanId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingPlanId(null)}
                    className="flex-1 border border-amber-300 rounded px-1.5 py-0.5 text-xs"
                  />
                ) : (
                  <span className="flex-1 font-medium text-amber-900">{plan.name}</span>
                )}
                <button onClick={() => setEditingPlanId(editingPlanId === plan.id ? null : plan.id)} className="text-slate-400 hover:text-amber-600 transition-colors">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={() => { if (confirm(`Xóa "${plan.name}"?`)) deletePlan(plan.id); }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}

            {isAddingPlan ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addNewPlan(); if (e.key === 'Escape') setIsAddingPlan(false); }}
                  placeholder={`Menu ${String.fromCharCode(65 + plans.length)}`}
                  className="flex-1 border border-amber-300 rounded-lg px-2 py-1 text-xs"
                />
                <button onClick={addNewPlan} className="p-1 bg-amber-500 rounded text-white"><Check className="w-3 h-3" /></button>
                <button onClick={() => setIsAddingPlan(false)} className="p-1 bg-slate-200 rounded text-slate-600"><X className="w-3 h-3" /></button>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingPlan(true)}
                className="w-full py-1.5 border-2 border-dashed border-amber-300 rounded-lg text-amber-700 hover:bg-amber-50 transition-colors flex items-center justify-center gap-1 text-[11px] font-semibold"
              >
                <Plus className="w-3 h-3" /> Thêm menu mới
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plan tabs (if multiple) */}
      {isExpanded && plans.length > 1 && (
        <div className="flex gap-1.5 mb-3 flex-wrap">
          {plans.map((plan) => (
            <button
              key={plan.id}
              onClick={() => saveSettings({ ...settings, active_plan_id: plan.id, auto_rotate: false })}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all border ${plan.id === activePlanId ? 'bg-amber-500 text-white border-amber-600 shadow-sm' : 'bg-white text-amber-700 border-amber-300 hover:bg-amber-50'}`}
            >
              {plan.name}
              {settings.auto_rotate && plan.id === activePlanId && ' ✓'}
            </button>
          ))}
          {settings.auto_rotate && (
            <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium ml-1">
              <Shuffle className="w-3 h-3" /> Tự động
            </span>
          )}
        </div>
      )}

      {/* Meal grid */}
      {isExpanded && (
        <div className="overflow-x-auto">
          {plans.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-amber-600">
              <UtensilsCrossed className="w-8 h-8 opacity-40" />
              <p className="text-sm font-semibold">Chưa có menu nào</p>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-xs px-3 py-1.5 bg-amber-100 rounded-lg border border-amber-300 hover:bg-amber-200 transition-colors font-medium"
              >
                ⚙️ Mở cài đặt để thêm menu
              </button>
            </div>
          ) : activePlan ? (
            <table className="w-full border-collapse text-xs min-w-[500px]">
              <thead>
                <tr>
                  {WEEKDAYS.map((d) => (
                    <th
                      key={d.num}
                      className={`py-1.5 px-2 text-center font-bold text-[11px] rounded-t-lg ${d.num === todayWeekday ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-800'}`}
                    >
                      {d.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {WEEKDAYS.map((d) => {
                    const m = getMeal(activePlan, d.num);
                    const isEditing = editCell?.planId === activePlan.id && editCell?.weekday === d.num;
                    const isDragTarget = swapTarget?.planId === activePlan.id && swapTarget?.weekday === d.num;
                    const isToday = d.num === todayWeekday;

                    return (
                      <td
                        key={d.num}
                        draggable={!!m}
                        onDragStart={() => m && handleDragStart(activePlan.id, d.num)}
                        onDragOver={(e) => handleDragOver(activePlan.id, d.num, e)}
                        onDrop={() => handleDrop(activePlan.id, d.num)}
                        onDragEnd={() => { setSwapSource(null); setSwapTarget(null); }}
                        className={`p-1.5 align-top border border-amber-100 transition-all ${isToday ? 'bg-amber-50' : 'bg-white'} ${isDragTarget ? 'border-2 border-amber-400 bg-amber-50' : ''}`}
                        style={{ minWidth: 100 }}
                      >
                        {isEditing ? (
                          <div className="space-y-1 relative">
                            <input
                              autoFocus
                              value={editMealValue}
                              onChange={(e) => { setEditMealValue(e.target.value); setSuggestionOpen(e.target.value.length > 0); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEditCell(); if (e.key === 'Escape') setEditCell(null); }}
                              placeholder="Tên món..."
                              className="w-full border border-amber-300 rounded px-1.5 py-1 text-[11px] focus:ring-1 focus:ring-amber-400"
                            />
                            {/* Suggestions dropdown */}
                            {suggestionOpen && (
                              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-amber-200 rounded-lg shadow-lg max-h-36 overflow-y-auto mt-0.5">
                                {MEAL_SUGGESTIONS.filter((s) => s.toLowerCase().includes(editMealValue.toLowerCase())).map((s) => (
                                  <button
                                    key={s}
                                    onMouseDown={(e) => { e.preventDefault(); setEditMealValue(s); setSuggestionOpen(false); }}
                                    className="w-full text-left px-2 py-1 hover:bg-amber-50 text-[11px] text-slate-700"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                            <input
                              value={editNoteValue}
                              onChange={(e) => setEditNoteValue(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveEditCell(); }}
                              placeholder="Ghi chú..."
                              className="w-full border border-amber-200 rounded px-1.5 py-0.5 text-[10px] text-slate-500"
                            />
                            <div className="flex gap-1">
                              <button onClick={saveEditCell} className="flex-1 bg-amber-500 text-white rounded py-0.5 flex items-center justify-center gap-0.5 hover:bg-amber-600 transition-colors">
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button onClick={() => setEditCell(null)} className="flex-1 bg-slate-200 rounded py-0.5 flex items-center justify-center hover:bg-slate-300 transition-colors">
                                <X className="w-2.5 h-2.5 text-slate-600" />
                              </button>
                            </div>
                          </div>
                        ) : m ? (
                          <div
                            className={`group flex flex-col gap-0.5 cursor-pointer rounded-lg p-1.5 transition-all hover:shadow-sm ${isToday ? 'bg-amber-100/70 hover:bg-amber-100' : 'hover:bg-amber-50'}`}
                            onClick={() => openEditCell(activePlan.id, d.num)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-amber-900 leading-tight text-[11px]">{m.meal}</span>
                              <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <GripVertical className="w-2.5 h-2.5 text-slate-400 cursor-grab" />
                                <Edit3 className="w-2.5 h-2.5 text-amber-500" />
                              </div>
                            </div>
                            {m.note && (
                              <span className="text-[9px] text-amber-600 bg-amber-50 rounded px-1 leading-tight">{m.note}</span>
                            )}
                            {isToday && (
                              <span className="text-[9px] font-bold text-amber-700">📍 Hôm nay</span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => openEditCell(activePlan.id, d.num)}
                            className="w-full h-full min-h-[48px] flex flex-col items-center justify-center gap-0.5 text-amber-300 hover:text-amber-500 hover:bg-amber-50/60 rounded-lg transition-all group border border-dashed border-amber-200 hover:border-amber-300"
                          >
                            <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                            <span className="text-[9px]">Thêm món</span>
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

      {/* Swap hint */}
      {isExpanded && activePlan && activePlan.meals.length >= 2 && (
        <p className="text-[10px] text-amber-500 mt-2 flex items-center gap-1">
          <ArrowLeftRight className="w-3 h-3" />
          Kéo thả ô để hoán vị món giữa các ngày • Click ô để chỉnh sửa
        </p>
      )}
    </div>
  );
};
