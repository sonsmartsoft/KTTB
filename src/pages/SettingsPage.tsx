import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, ColorMode } from '@/context/ThemeContext';
import { useChild } from '@/context/ChildContext';
import { useAdminConfirm } from '@/context/AdminConfirmContext';
import {
  AppTheme,
  FontFamilyKey,
  FontSizeScale,
  DisplayScaleMode,
  TypographySectionKey,
  BreakfastPlan,
  BreakfastSettings,
  Child,
} from '@/domain/types';
import { FONT_FAMILY_CSS, FONT_SIZE_MULTIPLIER } from '@/design-system/themes';
import { DEFAULT_TYPOGRAPHY_SETTINGS } from '@/services/motherAndBreakfastSeed';
import { storage } from '@/services/storage';
import { formatChildDisplayName } from '@/lib/childNameHelper';
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { supabase } from '@/lib/supabase';
import {
  Check, Palette, Sun, Moon, Monitor, RefreshCw, Database,
  Server, Link2, Shield, HardDrive, Activity, Clock,
  ChevronRight, AlertCircle, CheckCircle2, Loader2, Wifi,
  Type, Tv, Maximize2, Utensils, Plus, Trash2, Edit2, RotateCcw, Eye, EyeOff,
  Copy, CloudUpload, ExternalLink, ShieldAlert,
} from 'lucide-react';
import { format } from 'date-fns';

type ConnStatus = 'idle' | 'checking' | 'ok' | 'error';
type WriteStatus = 'idle' | 'checking' | 'ok' | 'blocked_rls' | 'error';
interface ConnInfo {
  status: ConnStatus;
  writeStatus?: WriteStatus;
  latencyMs?: number;
  rowCount?: number;
  checkedAt?: string;
  errorMsg?: string;
  writeErrorMsg?: string;
}

const FONT_FAMILY_LABELS: Record<FontFamilyKey, string> = {
  'Quicksand': 'Quicksand (Mềm mại, dễ thương)',
  'Be Vietnam Pro': 'Be Vietnam Pro (Rõ nét Tiếng Việt)',
  'Lexend': 'Lexend (Chống mỏi mắt, đọc siêu nhanh)',
  'Nunito': 'Nunito (Bo tròn, thân thiện)',
  'Inter': 'Inter (Hiện đại, chuẩn quốc tế)',
  'Comfortaa': 'Comfortaa (Nghệ thuật, bo tròn)',
};

const FONT_SIZE_LABELS: Record<FontSizeScale, string> = {
  sm: 'Nhỏ gọn (90%)',
  md: 'Vừa (100%)',
  lg: 'Lớn rõ (114%)',
  xl: 'Rất lớn (128%)',
  '2xl': 'Siêu lớn / TV (145%)',
};

function getLocalStorageStats() {
  const KTT_KEYS = [
    'ktt_children','ktt_templates','ktt_entries','ktt_extra_schedules',
    'ktt_exceptions','ktt_assessment_plans','ktt_assessments','ktt_targets',
    'ktt_achievements','ktt_school_years','ktt_teachers','ktt_subjects',
    'ktt_timetable_legend','ktt_session_logs','ktt_homework',
    'ktt_daily_teacher_comments','ktt_tuition_payments','ktt_academic_milestones',
    'ktt_breakfast_plans','ktt_breakfast_settings','ktt_breakfast_dishes',
    'ktt_typography_settings','ktt_mother_meals','ktt_mother_workouts','ktt_mother_checkins',
  ];
  let totalBytes = 0; let totalItems = 0;
  const tableInfo: { key: string; items: number; bytes: number }[] = [];
  KTT_KEYS.forEach((k) => {
    const raw = localStorage.getItem(k);
    if (raw) {
      const bytes = new Blob([raw]).size;
      let items = 0;
      try { const p = JSON.parse(raw); items = Array.isArray(p) ? p.length : 1; } catch {}
      totalBytes += bytes; totalItems += items;
      tableInfo.push({ key: k.replace('ktt_', ''), items, bytes });
    }
  });
  return { totalBytes, totalItems, tableInfo };
}
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

const SECTION_LABELS: { key: TypographySectionKey; label: string; desc: string; icon: string }[] = [
  { key: 'general',   label: 'Toàn bộ ứng dụng & Menu chính', desc: 'Thanh điều hướng, tiêu đề chung và tổng quan', icon: '🏠' },
  { key: 'timetable', label: 'Bảng Thời Khóa Biểu Chính Khóa', desc: 'Môn học, tiết học, giờ học Sáng & Chiều', icon: '📅' },
  { key: 'breakfast', label: 'Thực Đơn Bữa Sáng',             desc: 'Tên món ăn sáng và ghi chú dinh dưỡng', icon: '🍳' },
  { key: 'extra',     label: 'Lịch Học Thêm & Ngoại Khóa',    desc: 'Các ca học thêm, trung tâm, giáo viên', icon: '📚' },
  { key: 'kidCorner', label: 'Góc Của Bé',                    desc: 'Giao diện xem lịch học, bài tập & mục tiêu của con', icon: '🚀' },
  { key: 'mother',    label: 'Góc Của Mẹ (Lịch Ăn & Tập)',    desc: 'Thực đơn 30 ngày 1300 Calo & Lịch tập luyện', icon: '🧘‍♀️' },
];

const DISPLAY_MODES: { id: DisplayScaleMode; label: string; desc: string; badge: string }[] = [
  {
    id: 'auto',
    label: 'Tự động thông minh (Khuyên dùng)',
    desc: 'Tự động nhận diện Điện thoại, Laptop, Màn hình lớn 2K/4K hoặc Smart TV để tự căn chỉnh cỡ chữ & bố cục tối ưu',
    badge: 'Auto Adapt',
  },
  {
    id: 'standard',
    label: 'Chuẩn máy tính / Điện thoại',
    desc: 'Tỷ lệ hiển thị tiêu chuẩn gọn gàng',
    badge: '100%',
  },
  {
    id: 'large',
    label: 'Chữ lớn rõ ràng',
    desc: 'Phóng to toàn bộ giao diện thêm 15% giúp đọc dễ dàng hơn',
    badge: '115%',
  },
  {
    id: 'tv',
    label: 'Chế độ Smart TV / Màn hình lớn',
    desc: 'Phóng to chữ và bảng biểu (135% - 155%) để đứng từ xa 2–3m vẫn nhìn rõ Thời khóa biểu & Thực đơn',
    badge: 'TV / 4K',
  },
];

export const SettingsPage: React.FC = () => {
  const {
    theme,
    setTheme,
    availableThemes,
    colorMode,
    setColorMode,
    typography,
    setTypography,
  } = useTheme();
  const { childrenList, activeChild } = useChild();
  const { confirmDelete, confirmAdminAction, adminPin, setAdminPin, verifyAdminPin } = useAdminConfirm();
  const handleColorMode = (mode: ColorMode) => { setColorMode(mode); };

  // Admin PIN Management state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [showPinChars, setShowPinChars] = useState(false);

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyAdminPin(currentPinInput)) {
      setPinChangeMsg({ text: 'Mã PIN hiện tại không chính xác!', type: 'error' });
      return;
    }
    if (newPinInput.length < 4) {
      setPinChangeMsg({ text: 'Mã PIN mới phải có ít nhất 4 ký tự.', type: 'error' });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinChangeMsg({ text: 'Xác nhận mã PIN mới không khớp!', type: 'error' });
      return;
    }
    setAdminPin(newPinInput);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setIsChangingPin(false);
    setPinChangeMsg({ text: '✓ Đổi mã PIN Admin thành công! Mã PIN mới đã được áp dụng toàn hệ thống.', type: 'success' });
    setTimeout(() => setPinChangeMsg(null), 5000);
  };

  // Helper to update a single section's typography
  const updateSectionTypography = (
    sectionKey: TypographySectionKey,
    patch: Partial<{ fontFamily: FontFamilyKey; fontSize: FontSizeScale }>
  ) => {
    setTypography({
      ...typography,
      sections: {
        ...typography.sections,
        [sectionKey]: {
          ...typography.sections[sectionKey],
          ...patch,
        },
      },
    });
  };

  const resetTypography = () => {
    setTypography(DEFAULT_TYPOGRAPHY_SETTINGS);
  };

  // ── Breakfast Setup State in Admin Settings ──
  const [selectedChildId, setSelectedChildId] = useState<string>(activeChild.id);
  const [childPlans, setChildPlans] = useState<BreakfastPlan[]>(() =>
    storage.getBreakfastPlans(activeChild.id)
  );
  const [childBfConfig, setChildBfConfig] = useState<BreakfastSettings>(() =>
    storage.getBreakfastSettings(activeChild.id)
  );
  const [dishes, setDishes] = useState<string[]>(() => storage.getBreakfastDishes());
  const [newPlanName, setNewPlanName] = useState('');
  const [renamingPlanId, setRenamingPlanId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [newDishName, setNewDishName] = useState('');

  useEffect(() => {
    setChildPlans(storage.getBreakfastPlans(selectedChildId));
    setChildBfConfig(storage.getBreakfastSettings(selectedChildId));
  }, [selectedChildId]);

  useEffect(() => {
    const onSynced = () => {
      setChildPlans(storage.getBreakfastPlans(selectedChildId));
      setChildBfConfig(storage.getBreakfastSettings(selectedChildId));
      setDishes(storage.getBreakfastDishes());
    };
    window.addEventListener('ktt-cloud-synced', onSynced);
    return () => window.removeEventListener('ktt-cloud-synced', onSynced);
  }, [selectedChildId]);

  const handleSaveBfConfig = (patch: Partial<BreakfastSettings>) => {
    const updated: BreakfastSettings = { ...childBfConfig, ...patch, child_id: selectedChildId };
    storage.saveBreakfastSettings(updated);
    setChildBfConfig(storage.getBreakfastSettings(selectedChildId));
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    const newPlan: BreakfastPlan = {
      id: `bf-${selectedChildId}-${Date.now()}`,
      child_id: selectedChildId,
      name: newPlanName.trim(),
      meals: [
        { weekday: 2, meal: 'Phở bò', note: 'Thêm 1 hộp sữa tươi' },
        { weekday: 3, meal: 'Bánh mì trứng', note: 'Kèm dưa chuột' },
        { weekday: 4, meal: 'Xôi xéo ruốc', note: 'Uống sữa đậu nành' },
        { weekday: 5, meal: 'Bánh bao nhân thịt', note: '1 hộp sữa Milo' },
        { weekday: 6, meal: 'Cơm chiên trứng', note: 'Kèm 1 quả chuối' },
        { weekday: 7, meal: 'Sandwich phô mai', note: 'Thêm trái cây' },
        { weekday: 8, meal: 'Bún riêu cua', note: 'Ăn sáng cùng gia đình' },
      ],
      created_at: new Date().toISOString(),
    };
    storage.saveBreakfastPlan(newPlan);
    setChildPlans(storage.getBreakfastPlans(selectedChildId));
    handleSaveBfConfig({ active_plan_id: newPlan.id });
    setNewPlanName('');
  };

  const handleRenamePlan = (plan: BreakfastPlan) => {
    if (!renameValue.trim()) return;
    storage.saveBreakfastPlan({ ...plan, name: renameValue.trim() });
    setChildPlans(storage.getBreakfastPlans(selectedChildId));
    setRenamingPlanId(null);
    setRenameValue('');
  };

  const handleDeletePlan = (planId: string) => {
    if (childPlans.length <= 1) {
      window.alert('Mỗi bé cần giữ lại ít nhất 1 thực đơn bữa sáng!');
      return;
    }
    const plan = childPlans.find((p) => p.id === planId);
    confirmDelete({
      title: 'Xoá thực đơn bữa sáng',
      message: 'Bạn có chắc muốn xoá thực đơn bữa sáng này khỏi danh sách?',
      itemName: plan?.name,
      onConfirm: () => {
        storage.deleteBreakfastPlan(planId);
        const remaining = storage.getBreakfastPlans(selectedChildId);
        setChildPlans(remaining);
        if (childBfConfig.active_plan_id === planId && remaining[0]) {
          handleSaveBfConfig({ active_plan_id: remaining[0].id });
        }
      },
    });
  };

  const handleResetChildBreakfast = () => {
    confirmAdminAction({
      title: 'Khôi phục thực đơn bữa sáng',
      message: 'Khôi phục lại toàn bộ thực đơn bữa sáng mẫu mặc định cho bé này?',
      confirmText: 'Khôi phục thực đơn mẫu',
      isDanger: true,
      onConfirm: () => {
        storage.resetBreakfastPlansForChild(selectedChildId);
        setChildPlans(storage.getBreakfastPlans(selectedChildId));
        setChildBfConfig(storage.getBreakfastSettings(selectedChildId));
      },
    });
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;
    storage.addBreakfastDish(newDishName.trim());
    setDishes(storage.getBreakfastDishes());
    setNewDishName('');
  };

  const handleRemoveDish = (dish: string) => {
    confirmDelete({
      title: 'Xoá món ăn gợi ý',
      message: 'Bạn có chắc muốn xoá món này khỏi danh sách món gợi ý?',
      itemName: dish,
      onConfirm: () => {
        storage.deleteBreakfastDish(dish);
        setDishes(storage.getBreakfastDishes());
      },
    });
  };

  // Apply font family or size to ALL sections quickly
  const handleApplyFontToAll = (fontFamily: FontFamilyKey) => {
    const nextSections = { ...typography.sections };
    (Object.keys(nextSections) as TypographySectionKey[]).forEach((k) => {
      nextSections[k] = { ...nextSections[k], fontFamily };
    });
    setTypography({ ...typography, sections: nextSections });
  };

  const handleApplySizeToAll = (fontSize: FontSizeScale) => {
    const nextSections = { ...typography.sections };
    (Object.keys(nextSections) as TypographySectionKey[]).forEach((k) => {
      nextSections[k] = { ...nextSections[k], fontSize };
    });
    setTypography({ ...typography, sections: nextSections });
  };

  const [conn, setConn] = useState<ConnInfo>({ status: 'idle', writeStatus: 'idle' });
  const [isPushingCloud, setIsPushingCloud] = useState(false);
  const [pushResult, setPushResult] = useState<{ successCount: number; failCount: number } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  const checkConnection = useCallback(async () => {
    setConn({ status: 'checking', writeStatus: 'checking' });
    const start = Date.now();
    try {
      // 1. Kiểm tra quyền ĐỌC (Read test)
      const { data, error, count } = await supabase.from('ktt_children').select('id', { count: 'exact', head: false });
      const latencyMs = Date.now() - start;
      if (error) {
        setConn({
          status: 'error',
          writeStatus: 'error',
          latencyMs,
          errorMsg: error.message,
          checkedAt: new Date().toLocaleTimeString('vi-VN'),
        });
        return;
      }

      // 2. Kiểm tra quyền GHI (Write test — phát hiện lỗi RLS Policy 42501)
      const testRowId = `__ktt_healthcheck_${Date.now()}`;
      const { error: writeError } = await supabase
        .from('ktt_children')
        .upsert([{ id: testRowId, data: { test: true }, synced_at: new Date().toISOString() }], { onConflict: 'id' });

      if (writeError) {
        const isRls = writeError.code === '42501' || writeError.message?.toLowerCase().includes('policy');
        setConn({
          status: 'ok',
          writeStatus: isRls ? 'blocked_rls' : 'error',
          latencyMs,
          rowCount: count ?? data?.length ?? 0,
          checkedAt: new Date().toLocaleTimeString('vi-VN'),
          writeErrorMsg: writeError.message,
        });
      } else {
        // Xoá bản ghi test sau khi ghi thành công
        await supabase.from('ktt_children').delete().eq('id', testRowId);
        setConn({
          status: 'ok',
          writeStatus: 'ok',
          latencyMs,
          rowCount: count ?? data?.length ?? 0,
          checkedAt: new Date().toLocaleTimeString('vi-VN'),
        });
      }
    } catch (err: any) {
      setConn({
        status: 'error',
        writeStatus: 'error',
        latencyMs: Date.now() - start,
        errorMsg: String(err?.message || err),
        checkedAt: new Date().toLocaleTimeString('vi-VN'),
      });
    }
  }, []);
  useEffect(() => { checkConnection(); }, [checkConnection]);

  const handlePushAllToCloud = async () => {
    setIsPushingCloud(true);
    setPushResult(null);
    try {
      const res = await storage.pushAllToCloud();
      setPushResult(res);
      await checkConnection();
    } catch {
      setPushResult({ successCount: 0, failCount: 1 });
    } finally {
      setIsPushingCloud(false);
    }
  };

  const FIX_RLS_SQL = `-- 1. Tạo bảng ktt_exam_prep_tasks nếu chưa có
create table if not exists ktt_exam_prep_tasks (
  id text primary key,
  data jsonb not null,
  synced_at timestamptz default now()
);

-- 2. Cấp quyền ALL trên schema public cho anon
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;

-- 3. Tắt RLS và cấp Policy mở cho toàn bộ các bảng ktt_*
do $$
declare
  t text;
begin
  for t in
    select table_name from information_schema.tables 
    where table_schema = 'public' and table_name like 'ktt_%'
  loop
    execute format('alter table %I disable row level security;', t);
    execute format('grant all on table %I to anon, authenticated;', t);
    execute format('drop policy if exists "allow_anon_all" on %I;', t);
    execute format('create policy "allow_anon_all" on %I for all to anon using (true) with check (true);', t);
  end loop;
end $$;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(FIX_RLS_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const lsStats = getLocalStorageStats();
  const SUPABASE_URL = 'https://tufepmuglmezhnehezyg.supabase.co';
  const PROJECT_REF = 'tufepmuglmezhnehezyg';

  const colorModeOptions: { id: ColorMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light',  label: 'Sáng (Light)',      icon: <Sun className="w-4 h-4" /> },
    { id: 'dark',   label: 'Tối (Dark)',         icon: <Moon className="w-4 h-4" /> },
    { id: 'system', label: 'Tự động (System)',  icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-content-primary font-display flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          <span>Cài đặt Hệ thống, Cỡ chữ &amp; Thực đơn</span>
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          Tùy chỉnh cỡ chữ, font chữ cho từng mục, chế độ màn hình lớn / Smart TV và thiết lập thực đơn bữa sáng
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          1. TYPOGRAPHY & LARGE SCREEN / TV ADAPTATION SETTINGS
         ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="p-6 space-y-5 border-2 border-primary/30 shadow-theme-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme-md bg-primary/15 flex items-center justify-center">
              <Type className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-black text-content-primary">
                Cài đặt Cỡ chữ, Font chữ &amp; Tương thích Màn hình lớn / Tivi
              </h3>
              <p className="text-xs text-content-muted">
                Tuỳ chỉnh cỡ chữ và kiểu chữ riêng cho từng khu vực hoặc bật chế độ tự động phóng to trên Tivi / Màn hình lớn
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={resetTypography}
          >
            Khôi phục chữ mặc định
          </Button>
        </div>

        {/* Display Mode / TV Mode Selector */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-content-secondary flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-primary" />
              1. Chế độ Màn hình &amp; Tự động co giãn (TV / Màn hình lớn)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-primary">
              <input
                type="checkbox"
                checked={typography.fullWidthOnLargeScreen}
                onChange={(e) =>
                  setTypography({
                    ...typography,
                    fullWidthOnLargeScreen: e.target.checked,
                  })
                }
                className="w-4 h-4 accent-primary rounded"
              />
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Mở rộng toàn màn hình (Full-width) trên màn hình lớn / Tivi</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DISPLAY_MODES.map((dm) => {
              const isSelected = typography.displayMode === dm.id;
              return (
                <button
                  key={dm.id}
                  type="button"
                  onClick={() =>
                    setTypography({
                      ...typography,
                      displayMode: dm.id,
                    })
                  }
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 shadow-sm ring-2 ring-primary/20'
                      : 'border-app-border bg-app-bg hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <span className="text-xs font-black text-content-primary">{dm.label}</span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isSelected ? 'bg-primary text-white' : 'bg-app-card text-content-muted border border-app-border'
                      }`}
                    >
                      {dm.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-content-secondary leading-relaxed">{dm.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Global Apply Bar */}
        <div className="p-3.5 rounded-2xl bg-app-bg border border-app-border flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-bold text-content-primary">
            ⚡ Áp dụng nhanh cho <strong>tất cả các mục</strong> cùng lúc:
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typography.sections.general.fontFamily}
              onChange={(e) => handleApplyFontToAll(e.target.value as FontFamilyKey)}
              className="px-3 py-1.5 text-xs font-bold border border-app-border rounded-xl bg-app-surface text-content-primary"
            >
              {(Object.keys(FONT_FAMILY_LABELS) as FontFamilyKey[]).map((fk) => (
                <option key={fk} value={fk}>
                  Font tất cả: {FONT_FAMILY_LABELS[fk]}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-app-surface p-1 rounded-xl border border-app-border">
              {(Object.keys(FONT_SIZE_LABELS) as FontSizeScale[]).map((sz) => {
                const active = typography.sections.general.fontSize === sz;
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleApplySizeToAll(sz)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      active
                        ? 'bg-primary text-white shadow-sm'
                        : 'text-content-secondary hover:bg-app-bg'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Per-Section Font Family & Font Size Table */}
        <div className="space-y-2.5">
          <label className="text-xs font-extrabold uppercase tracking-wider text-content-secondary block">
            2. Tuỳ chỉnh Cỡ chữ &amp; Font chữ riêng cho từng mục
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SECTION_LABELS.map(({ key, label, desc, icon }) => {
              const cfg = typography.sections[key] || { fontFamily: 'Quicksand', fontSize: 'lg' };
              return (
                <div
                  key={key}
                  className="p-4 rounded-2xl border border-app-border bg-app-bg/60 space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl leading-none">{icon}</span>
                      <div>
                        <div className="text-xs font-black text-content-primary">{label}</div>
                        <div className="text-[11px] text-content-muted">{desc}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <div>
                      <label className="text-[10px] font-bold text-content-secondary mb-1 block">
                        Kiểu chữ (Font)
                      </label>
                      <select
                        value={cfg.fontFamily}
                        onChange={(e) =>
                          updateSectionTypography(key, {
                            fontFamily: e.target.value as FontFamilyKey,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-app-border rounded-xl bg-app-surface text-content-primary"
                        style={{ fontFamily: FONT_FAMILY_CSS[cfg.fontFamily] }}
                      >
                        {(Object.keys(FONT_FAMILY_LABELS) as FontFamilyKey[]).map((fk) => (
                          <option key={fk} value={fk}>
                            {FONT_FAMILY_LABELS[fk]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-content-secondary mb-1 block">
                        Cỡ chữ hiển thị
                      </label>
                      <select
                        value={cfg.fontSize}
                        onChange={(e) =>
                          updateSectionTypography(key, {
                            fontSize: e.target.value as FontSizeScale,
                          })
                        }
                        className="w-full px-2.5 py-1.5 text-xs font-bold border border-app-border rounded-xl bg-app-surface text-content-primary"
                      >
                        {(Object.keys(FONT_SIZE_LABELS) as FontSizeScale[]).map((sz) => (
                          <option key={sz} value={sz}>
                            {FONT_SIZE_LABELS[sz]}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Mini Preview for this section */}
                  <div
                    className="px-3 py-2 rounded-xl bg-app-surface border border-app-border/80 text-content-primary flex items-center justify-between"
                    style={{
                      fontFamily: FONT_FAMILY_CSS[cfg.fontFamily],
                      fontSize: `${Math.round(13 * (FONT_SIZE_MULTIPLIER[cfg.fontSize] || 1.14))}px`,
                    }}
                  >
                    <span className="font-bold truncate">
                      Mẫu chữ: Toán • Tiếng Anh • 🍜 Phở bò
                    </span>
                    <span className="text-[10px] font-mono text-content-muted shrink-0 ml-2">
                      {cfg.fontFamily} • {cfg.fontSize.toUpperCase()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          2. BREAKFAST MENU SETUP (MOVED FROM TIMETABLE PAGE TO SETTINGS)
         ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="p-6 space-y-5 border-2 border-amber-300/80 dark:border-amber-700/60 shadow-theme-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme-md bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-content-primary">
                Thiết lập Thực đơn Bữa sáng (Breakfast Setup)
              </h3>
              <p className="text-xs text-content-muted">
                Quản lý danh sách thực đơn, tự động xoay vòng theo tuần và kho món ăn gợi ý (ngoài Thời khóa biểu chỉ cần chọn món &amp; bấm Hiện/Ẩn)
              </p>
            </div>
          </div>

          {/* Child switcher for Breakfast Setup */}
          <div className="flex items-center gap-1.5 bg-app-bg p-1 rounded-xl border border-app-border">
            {childrenList.map((c: Child) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChildId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                  selectedChildId === c.id
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-content-secondary hover:bg-app-surface'
                }`}
              >
                {formatChildDisplayName(c)}
              </button>
            ))}
          </div>
        </div>

        {/* Show/Hide & Auto-Rotate Toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-xs font-black text-content-primary flex items-center gap-1.5">
                {childBfConfig.enabled ? (
                  <Eye className="w-4 h-4 text-amber-600" />
                ) : (
                  <EyeOff className="w-4 h-4 text-content-muted" />
                )}
                <span>Hiển thị Thực đơn sáng trên Thời khóa biểu</span>
              </div>
              <p className="text-[11px] text-content-secondary">
                Bạn cũng có thể bấm nút <strong>Hiện / Ẩn</strong> nhanh ngay trên trang Thời khóa biểu
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSaveBfConfig({ enabled: !childBfConfig.enabled })}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                childBfConfig.enabled
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-app-surface text-content-muted border border-app-border'
              }`}
            >
              {childBfConfig.enabled ? 'Đang Hiện ✓' : 'Đang Ẩn'}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/50 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="text-xs font-black text-content-primary">
                  🔄 Tự động xoay vòng thực đơn theo tuần
                </div>
                <p className="text-[11px] text-content-secondary">
                  Khi có từ 2 thực đơn trở lên, hệ thống tự đổi thực đơn mỗi tuần
                </p>
              </div>
              <input
                type="checkbox"
                checked={!!childBfConfig.auto_rotate}
                onChange={(e) =>
                  handleSaveBfConfig({
                    auto_rotate: e.target.checked,
                    cycle_start:
                      childBfConfig.cycle_start || format(new Date(), 'yyyy-MM-dd'),
                  })
                }
                className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
              />
            </div>
            {childBfConfig.auto_rotate && (
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60">
                <span className="text-[11px] font-bold text-content-secondary">
                  Ngày bắt đầu tính Tuần 1:
                </span>
                <input
                  type="date"
                  value={childBfConfig.cycle_start || format(new Date(), 'yyyy-MM-dd')}
                  onChange={(e) =>
                    handleSaveBfConfig({ cycle_start: e.target.value })
                  }
                  className="px-2.5 py-1 text-xs font-bold border border-amber-300 rounded-lg bg-white dark:bg-slate-900 text-content-primary"
                />
              </div>
            )}
          </div>
        </div>

        {/* Menu List Manager + Dish Library Manager */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left: Manage Breakfast Plans */}
          <div className="p-4 rounded-2xl border border-app-border bg-app-bg/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-content-primary uppercase tracking-wider">
                📋 Danh sách Thực đơn của bé ({childPlans.length})
              </div>
              <button
                type="button"
                onClick={handleResetChildBreakfast}
                className="text-[11px] font-bold text-amber-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Khôi phục mẫu
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {childPlans.map((p, idx) => {
                const isActive = p.id === (childBfConfig.active_plan_id || childPlans[0]?.id);
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                      isActive
                        ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/40 shadow-sm'
                        : 'border-app-border bg-app-surface'
                    }`}
                  >
                    {renamingPlanId === p.id ? (
                      <div className="flex items-center gap-1.5 flex-1">
                        <input
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleRenamePlan(p)}
                          className="flex-1 px-2.5 py-1 text-xs font-bold border border-amber-400 rounded-lg bg-app-bg text-content-primary"
                        />
                        <Button size="sm" variant="primary" onClick={() => handleRenamePlan(p)}>
                          Lưu
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveBfConfig({ active_plan_id: p.id })}
                          className="flex items-center gap-2 text-left flex-1 min-w-0"
                        >
                          <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-extrabold text-content-primary truncate">
                            {p.name}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500 text-white shrink-0">
                              Đang dùng
                            </span>
                          )}
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              setRenamingPlanId(p.id);
                              setRenameValue(p.name);
                            }}
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-content-muted hover:text-amber-700"
                            title="Đổi tên thực đơn"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePlan(p.id)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-content-muted hover:text-red-500"
                            title="Xoá thực đơn"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleCreatePlan} className="flex gap-2 pt-1">
              <input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                placeholder="Tên thực đơn mới (VD: Thực đơn Tuần 3)..."
                className="flex-1 px-3 py-1.5 text-xs border border-app-border rounded-xl bg-app-surface text-content-primary"
              />
              <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                Thêm
              </Button>
            </form>
          </div>

          {/* Right: Manage Suggested Dish Dictionary */}
          <div className="p-4 rounded-2xl border border-app-border bg-app-bg/50 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black text-content-primary uppercase tracking-wider">
                🥐 Kho món ăn gợi ý nhanh ({dishes.length} món)
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
              {dishes.map((d) => (
                <span
                  key={d}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-app-surface border border-app-border text-content-primary"
                >
                  <span>{d}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDish(d)}
                    className="text-content-muted hover:text-red-500 transition-colors"
                    title="Xoá khỏi gợi ý"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddDish} className="flex gap-2 pt-1">
              <input
                value={newDishName}
                onChange={(e) => setNewDishName(e.target.value)}
                placeholder="Thêm món vào kho (VD: 🧇 Bánh quế mật ong)..."
                className="flex-1 px-3 py-1.5 text-xs border border-app-border rounded-xl bg-app-surface text-content-primary"
              />
              <Button type="submit" size="sm" variant="primary" icon={<Plus className="w-3.5 h-3.5" />}>
                Thêm món
              </Button>
            </form>
          </div>
        </div>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════
          BẢO MẬT & MÃ PIN QUẢN TRỊ / PHỤ HUYNH (ADMIN SECURITY PIN)
         ═══════════════════════════════════════════════════════════════════════ */}
      <Card className="p-6 space-y-5 border-2 border-rose-400/40 dark:border-rose-700/50 shadow-theme-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-app-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-theme-md bg-rose-500/15 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-content-primary flex items-center gap-2">
                <span>Bảo Mật &amp; Mã PIN Quản Trị / Phụ Huynh</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wide px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400">
                  An Toàn Dữ Liệu
                </span>
              </h3>
              <p className="text-xs text-content-muted">
                Bảo vệ toàn bộ các thao tác xoá dữ liệu và chuyển đổi chế độ Góc của bé
              </p>
            </div>
          </div>
          <Badge variant="primary">PIN Mặc định: 0075</Badge>
        </div>

        <div className="bg-app-bg p-4 rounded-xl border border-app-subtle space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-content-primary">
                Chế độ xác nhận PIN Admin đang <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">BẬT (Bảo vệ tối đa)</span>
              </p>
              <p className="text-content-secondary leading-relaxed">
                Mọi hành động xoá dữ liệu (học sinh, lịch học, lớp học thêm, bằng khen, thực đơn, nhật ký cân nặng) hoặc thoát khỏi Góc của con đều bắt buộc nhập đúng mã PIN quản trị.
              </p>
            </div>
          </div>

          {pinChangeMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                pinChangeMsg.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
              }`}
            >
              {pinChangeMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{pinChangeMsg.text}</span>
            </div>
          )}

          {!isChangingPin ? (
            <div className="pt-2 flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsChangingPin(true);
                  setPinChangeMsg(null);
                }}
              >
                Đổi mã PIN Admin
              </Button>
              <span className="text-[11px] text-content-muted">
                (Mã PIN hiện tại đang bảo vệ hệ thống: <strong className="font-mono text-content-secondary">••••</strong>)
              </span>
            </div>
          ) : (
            <form onSubmit={handleUpdatePin} className="pt-2 border-t border-app-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-content-primary">Thay đổi mã PIN Quản trị:</span>
                <button
                  type="button"
                  onClick={() => setShowPinChars(!showPinChars)}
                  className="text-[11px] text-content-secondary flex items-center gap-1 hover:text-primary"
                >
                  {showPinChars ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPinChars ? 'Ẩn ký tự' : 'Hiện ký tự'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-content-secondary">Mã PIN cũ (mặc định: 0075) *</label>
                  <input
                    type={showPinChars ? 'text' : 'password'}
                    required
                    maxLength={10}
                    placeholder="••••"
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-surface text-content-primary font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-content-secondary">Mã PIN mới (tối thiểu 4 số) *</label>
                  <input
                    type={showPinChars ? 'text' : 'password'}
                    required
                    maxLength={10}
                    placeholder="••••"
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-surface text-content-primary font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-content-secondary">Xác nhận mã PIN mới *</label>
                  <input
                    type={showPinChars ? 'text' : 'password'}
                    required
                    maxLength={10}
                    placeholder="••••"
                    value={confirmPinInput}
                    onChange={(e) => setConfirmPinInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-surface text-content-primary font-mono tracking-widest"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangingPin(false);
                    setCurrentPinInput('');
                    setNewPinInput('');
                    setConfirmPinInput('');
                    setPinChangeMsg(null);
                  }}
                >
                  Huỷ bỏ
                </Button>
                <Button type="submit" variant="primary" size="sm" icon={<Check className="w-3.5 h-3.5" />}>
                  Lưu mã PIN mới
                </Button>
              </div>
            </form>
          )}
        </div>
      </Card>

      {/* Light / Dark Mode */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-theme-md bg-primary/10 flex items-center justify-center">
            <Sun className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary">Chế độ sáng / tối</h3>
            <p className="text-xs text-content-muted">Áp dụng toàn bộ ứng dụng ngay lập tức</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-1">
          {colorModeOptions.map((opt) => {
            const isActive = colorMode === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleColorMode(opt.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-theme-card border-2 transition-all text-xs font-medium ${
                  isActive
                    ? 'border-primary bg-primary/5 text-primary shadow-theme-sm ring-2 ring-primary/20'
                    : 'border-app-border text-content-secondary hover:border-primary/40 hover:bg-app-bg'
                }`}
              >
                <div className={`w-10 h-10 rounded-theme-md flex items-center justify-center ${isActive ? 'bg-primary text-white' : 'bg-app-bg text-content-muted'}`}>
                  {opt.icon}
                </div>
                <span>{opt.label}</span>
                {isActive && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Theme Picker */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-theme-md bg-secondary/10 flex items-center justify-center">
              <Palette className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">Chủ đề màu sắc (Theme)</h3>
              <p className="text-xs text-content-muted">Thay đổi màu sắc, font và cảm xúc tổng thể</p>
            </div>
          </div>
          <Badge variant="primary">{availableThemes.length} phong cách</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {availableThemes.map((t) => {
            const isSelected = t.id === theme;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id as AppTheme)}
                className={`p-4 rounded-theme-card border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-theme-md ring-2 ring-primary/20'
                    : 'border-app-border bg-app-card hover:border-primary/50'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-sm font-bold text-content-primary">{t.name}</span>
                    </div>
                    {isSelected && <span className="p-1 rounded-full bg-primary text-white"><Check className="w-3.5 h-3.5" /></span>}
                  </div>
                  <p className="text-xs text-content-secondary">{t.description}</p>
                </div>
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-app-subtle">
                  {(['--color-primary','--color-secondary','--color-accent','--bg-app'] as const).map((v) => (
                    <div key={v} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: t.variables[v] }} />
                  ))}
                  <span className="text-[10px] text-content-muted ml-auto font-mono">{isSelected ? '✓ Đang dùng' : 'Bấm để chọn'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Supabase Connection */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-theme-md bg-emerald-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-content-primary">Kết nối Supabase (Cloud DB)</h3>
              <p className="text-xs text-content-muted">Đồng bộ dữ liệu thời gian thực với đám mây</p>
            </div>
          </div>
          <Button
            variant="outline" size="sm"
            onClick={checkConnection}
            disabled={conn.status === 'checking'}
            icon={conn.status === 'checking' ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          >
            Kiểm tra
          </Button>
        </div>

        <div className={`flex items-start gap-3 p-4 rounded-theme-md border ${
          conn.status === 'ok' && conn.writeStatus === 'ok'
            ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/40'
            : conn.writeStatus === 'blocked_rls'
            ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700/50'
            : conn.status === 'error'
            ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40'
            : conn.status === 'checking'
            ? 'bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40'
            : 'bg-app-bg border-app-border'
        }`}>
          {conn.status === 'ok' && conn.writeStatus === 'ok' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
          {conn.writeStatus === 'blocked_rls' && <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
          {conn.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />}
          {conn.status === 'checking' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0 mt-0.5" />}
          {conn.status === 'idle' && <Wifi className="w-5 h-5 text-content-muted shrink-0 mt-0.5" />}
          <div className="flex-1 min-w-0">
            {conn.status === 'ok' && conn.writeStatus === 'ok' && (
              <>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Đồng bộ Cloud Hoàn hảo (Đọc & Ghi ✓)</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">Độ trễ: <b>{conn.latencyMs}ms</b> · Bản ghi cloud: <b>{conn.rowCount}</b> · Lúc {conn.checkedAt}</p>
              </>
            )}
            {conn.writeStatus === 'blocked_rls' && (
              <>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-200">Đọc OK nhưng BỊ CHẶN GHI (Row Level Security Policy - Mã 42501)</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Supabase đã bật bảo vệ RLS trên các bảng nên từ chối lưu dữ liệu mới từ web. Dữ liệu tạm thời chỉ lưu trong máy này!</p>
              </>
            )}
            {conn.status === 'error' && (
              <>
                <p className="text-sm font-bold text-red-600 dark:text-red-300">Không kết nối được Supabase</p>
                <p className="text-xs text-red-500 truncate">{conn.errorMsg}</p>
              </>
            )}
            {conn.status === 'checking' && <p className="text-sm text-blue-600">Đang kiểm tra kết nối & quyền ghi Cloud...</p>}
            {conn.status === 'idle' && <p className="text-sm text-content-muted">Bấm "Kiểm tra" để kiểm tra quyền Đọc/Ghi Supabase</p>}
          </div>
          {conn.status === 'ok' && conn.writeStatus === 'ok' && <Badge variant="success" className="shrink-0">Online & Write OK</Badge>}
          {conn.writeStatus === 'blocked_rls' && <Badge variant="warning" className="shrink-0 bg-amber-500 text-white font-bold">RLS Blocked</Badge>}
          {conn.status === 'error' && <Badge variant="danger" className="shrink-0">Offline</Badge>}
        </div>

        {/* Warning & 1-Click Fix for RLS Block */}
        {conn.writeStatus === 'blocked_rls' && (
          <div className="p-4 rounded-theme-md bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-content-primary">
                  Vì sao thông tin cập nhật lại bị tự chuyển về dữ liệu cũ?
                </h4>
                <p className="text-xs text-content-secondary mt-1 leading-relaxed">
                  Khi bạn sửa lớp học của Quân hoặc thực đơn, web cố gắng lưu lên Supabase Cloud nhưng cơ sở dữ liệu từ chối với lỗi <code className="px-1.5 py-0.5 rounded bg-black/10 font-mono text-amber-800 dark:text-amber-200">42501 RLS Policy</code>. 
                  Do đó Cloud vẫn chứa 0 dữ liệu. Khi bạn mở web ở tab ẩn danh, thiết bị khác (TV, điện thoại) hoặc xoá cache, ứng dụng không thấy dữ liệu trên Cloud nên tự reset về mặc định ban đầu.
                </p>
              </div>
            </div>

            <div className="p-3 bg-app-card rounded-theme-sm border border-app-border space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-semibold text-content-primary">Mã lệnh SQL sửa lỗi trong 5 giây:</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCopySql}
                    icon={copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  >
                    {copiedSql ? '✓ Đã sao chép SQL!' : 'Sao chép mã SQL (1 Click)'}
                  </Button>
                  <a
                    href={`https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-theme-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-colors"
                  >
                    <span>Mở SQL Editor</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
              <pre className="p-2.5 bg-black/5 dark:bg-black/40 rounded text-[11px] font-mono text-content-secondary max-h-28 overflow-y-auto leading-tight">
{FIX_RLS_SQL}
              </pre>
              <p className="text-[11px] text-content-muted leading-relaxed">
                👉 <b>3 bước thao tác:</b> 1. Bấm <b>Sao chép mã SQL</b> ➔ 2. Bấm <b>Mở SQL Editor</b> rồi Paste vào ➔ 3. Bấm nút <b>Run</b> (màu xanh lá) trên Supabase. Xong quay lại đây bấm <b>Kiểm tra</b>.
              </p>
            </div>
          </div>
        )}

        {/* Sync Local To Cloud Action */}
        <div className="p-4 rounded-theme-md bg-app-bg border border-app-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-content-primary uppercase tracking-wide flex items-center gap-1.5">
                <CloudUpload className="w-4 h-4 text-primary" />
                Đẩy toàn bộ dữ liệu máy này lên Cloud (Manual Push)
              </h4>
              <p className="text-xs text-content-muted mt-0.5">
                Đưa toàn bộ thông tin lớp học, thực đơn, cài đặt hiện tại trên máy của bạn đồng bộ thẳng lên Supabase.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={isPushingCloud}
              onClick={handlePushAllToCloud}
              icon={isPushingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
            >
              {isPushingCloud ? 'Đang đẩy lên...' : 'Đẩy lên Cloud ngay'}
            </Button>
          </div>

          {pushResult && (
            <div className={`p-3 rounded-theme-sm text-xs font-medium flex items-center gap-2 ${
              pushResult.failCount === 0
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
            }`}>
              {pushResult.failCount === 0 ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tuyệt vời! Đã đẩy thành công toàn bộ {pushResult.successCount} bảng dữ liệu lên Supabase Cloud. Mọi thiết bị khác bây giờ sẽ có dữ liệu này!</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Đồng bộ được {pushResult.successCount} mục, nhưng có {pushResult.failCount} mục bị Cloud từ chối ghi (hãy kiểm tra chạy mã SQL RLS ở trên).</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <Link2 className="w-4 h-4 text-blue-500" />,       label: 'Project URL',        value: SUPABASE_URL,                               mono: true, small: true },
            { icon: <Server className="w-4 h-4 text-violet-500" />,    label: 'Project Ref',        value: PROJECT_REF,                                mono: true },
            { icon: <Shield className="w-4 h-4 text-amber-500" />,     label: 'Auth Mode',          value: 'Anon Key (Publishable)' },
            { icon: <Activity className="w-4 h-4 text-emerald-500" />, label: 'Chiến lược sync',   value: 'Hybrid Cache: Local + Cloud (Tự động đồng bộ cả Thực đơn & Cài đặt)' },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3 p-3 bg-app-bg rounded-theme-md border border-app-subtle">
              <div className="w-8 h-8 rounded-theme-md bg-app-card border border-app-border flex items-center justify-center shrink-0">{item.icon}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-content-muted uppercase tracking-wide font-semibold">{item.label}</p>
                <p className={`text-xs text-content-primary break-all leading-relaxed font-medium ${item.mono ? 'font-mono' : ''} ${item.small ? 'text-[10px]' : ''}`}>{item.value}</p>
              </div>
            </div>
          ))}
        </div>

        <a
          href={`https://supabase.com/dashboard/project/${PROJECT_REF}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between p-3 rounded-theme-md border border-app-border hover:bg-app-bg hover:border-primary/40 transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🟢</span>
            <div>
              <p className="text-xs font-bold text-content-primary group-hover:text-primary transition-colors">Mở Supabase Dashboard</p>
              <p className="text-[10px] text-content-muted">Xem bảng, SQL editor, logs, realtime…</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-content-muted group-hover:text-primary transition-colors" />
        </a>
      </Card>

      {/* LocalStorage Stats */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-theme-md bg-violet-500/10 flex items-center justify-center">
            <HardDrive className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-content-primary">Bộ nhớ cục bộ (Cache)</h3>
            <p className="text-xs text-content-muted">
              Tổng: <span className="font-bold text-content-primary">{lsStats.totalItems} bản ghi</span> · {formatBytes(lsStats.totalBytes)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {lsStats.tableInfo.filter((t) => t.items > 0).sort((a, b) => b.bytes - a.bytes).map((t) => (
            <div key={t.key} className="flex items-center justify-between px-3 py-2 bg-app-bg rounded-theme-md border border-app-subtle">
              <span className="text-[11px] text-content-secondary font-mono truncate flex-1">{t.key}</span>
              <div className="flex items-center gap-1.5 shrink-0 ml-1">
                <span className="text-[11px] font-bold text-content-primary">{t.items}</span>
                <span className="text-[9px] text-content-muted">{formatBytes(t.bytes)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* App Version */}
      <Card className="p-4">
        <div className="flex items-center justify-between text-xs text-content-muted">
          <div className="flex items-center gap-3">
            <span>⭐ <b className="text-content-secondary">Kids &amp; Family Timetable</b> v1.2.0</span>
            <span>·</span>
            <span>React + Vite + Supabase</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>{new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};
