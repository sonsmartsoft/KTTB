import React, { useState, useEffect, useCallback } from 'react';
import { useTheme, ColorMode } from '@/context/ThemeContext';
import { AppTheme } from '@/domain/types';
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { supabase } from '@/lib/supabase';
import {
  Check, Palette, Sun, Moon, Monitor, RefreshCw, Database,
  Server, Link2, Shield, HardDrive, Activity, Clock,
  ChevronRight, AlertCircle, CheckCircle2, Loader2, Wifi,
} from 'lucide-react';


type ConnStatus = 'idle' | 'checking' | 'ok' | 'error';
interface ConnInfo { status: ConnStatus; latencyMs?: number; rowCount?: number; checkedAt?: string; errorMsg?: string; }

function getLocalStorageStats() {
  const KTT_KEYS = [
    'ktt_children','ktt_templates','ktt_entries','ktt_extra_schedules',
    'ktt_exceptions','ktt_assessment_plans','ktt_assessments','ktt_targets',
    'ktt_achievements','ktt_school_years','ktt_teachers','ktt_subjects',
    'ktt_timetable_legend','ktt_session_logs','ktt_homework',
    'ktt_daily_teacher_comments','ktt_tuition_payments','ktt_academic_milestones',
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

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, availableThemes, colorMode, setColorMode } = useTheme();
  const handleColorMode = (mode: ColorMode) => { setColorMode(mode); };

  const [conn, setConn] = useState<ConnInfo>({ status: 'idle' });
  const checkConnection = useCallback(async () => {
    setConn({ status: 'checking' });
    const start = Date.now();
    try {
      const { data, error, count } = await supabase.from('ktt_children').select('id', { count: 'exact', head: false });
      const latencyMs = Date.now() - start;
      if (error) setConn({ status: 'error', latencyMs, errorMsg: error.message, checkedAt: new Date().toLocaleTimeString('vi-VN') });
      else setConn({ status: 'ok', latencyMs, rowCount: count ?? data?.length ?? 0, checkedAt: new Date().toLocaleTimeString('vi-VN') });
    } catch (err: any) {
      setConn({ status: 'error', latencyMs: Date.now() - start, errorMsg: String(err?.message || err), checkedAt: new Date().toLocaleTimeString('vi-VN') });
    }
  }, []);
  useEffect(() => { checkConnection(); }, [checkConnection]);

  const lsStats = getLocalStorageStats();
  const SUPABASE_URL = 'https://tufepmuglmezhnehezyg.supabase.co';
  const PROJECT_REF = 'tufepmuglmezhnehezyg';

  const colorModeOptions: { id: ColorMode; label: string; icon: React.ReactNode }[] = [
    { id: 'light',  label: 'Sáng (Light)',      icon: <Sun className="w-4 h-4" /> },
    { id: 'dark',   label: 'Tối (Dark)',         icon: <Moon className="w-4 h-4" /> },
    { id: 'system', label: 'Tự động (System)',  icon: <Monitor className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-content-primary font-display flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          <span>Giao diện &amp; Cài đặt</span>
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          Tùy chỉnh giao diện, theo dõi kết nối hệ thống và thông tin cấu hình
        </p>
      </div>

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

        <div className={`flex items-center gap-3 p-4 rounded-theme-md border ${
          conn.status === 'ok'       ? 'bg-emerald-50 border-emerald-200'
          : conn.status === 'error'  ? 'bg-red-50 border-red-200'
          : conn.status === 'checking'? 'bg-blue-50 border-blue-200'
          : 'bg-app-bg border-app-border'
        }`}>
          {conn.status === 'ok'       && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {conn.status === 'error'    && <AlertCircle  className="w-5 h-5 text-red-500 shrink-0" />}
          {conn.status === 'checking' && <Loader2 className="w-5 h-5 text-blue-500 animate-spin shrink-0" />}
          {conn.status === 'idle'     && <Wifi className="w-5 h-5 text-content-muted shrink-0" />}
          <div className="flex-1 min-w-0">
            {conn.status === 'ok' && <><p className="text-sm font-bold text-emerald-700">Kết nối thành công ✓</p><p className="text-xs text-emerald-600">Độ trễ: <b>{conn.latencyMs}ms</b> · Bản ghi trẻ: <b>{conn.rowCount}</b> · Lúc {conn.checkedAt}</p></>}
            {conn.status === 'error' && <><p className="text-sm font-bold text-red-600">Không kết nối được</p><p className="text-xs text-red-500 truncate">{conn.errorMsg}</p></>}
            {conn.status === 'checking' && <p className="text-sm text-blue-600">Đang kiểm tra kết nối...</p>}
            {conn.status === 'idle'     && <p className="text-sm text-content-muted">Bấm "Kiểm tra" để ping Supabase</p>}
          </div>
          {conn.status === 'ok'    && <Badge variant="success" className="shrink-0">Online</Badge>}
          {conn.status === 'error' && <Badge variant="danger"  className="shrink-0">Offline</Badge>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <Link2 className="w-4 h-4 text-blue-500" />,       label: 'Project URL',        value: SUPABASE_URL,                               mono: true, small: true },
            { icon: <Server className="w-4 h-4 text-violet-500" />,    label: 'Project Ref',        value: PROJECT_REF,                                mono: true },
            { icon: <Shield className="w-4 h-4 text-amber-500" />,     label: 'Auth Mode',          value: 'Anon Key (Publishable)' },
            { icon: <Activity className="w-4 h-4 text-emerald-500" />, label: 'Chiến lược sync',   value: 'Hybrid Cache: Local → Cloud (fire-and-forget)' },
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
            <span>⭐ <b className="text-content-secondary">Kids Timetable</b> v1.0.0</span>
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
