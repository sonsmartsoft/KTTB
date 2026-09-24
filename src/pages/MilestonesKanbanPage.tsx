import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Target, Plus, Calendar, Edit2, Trash2, Sparkles, X,
  ClipboardList, BarChart2, CheckCircle2, ChevronLeft, ChevronRight,
  ZoomIn, ZoomOut, TrendingUp,
} from 'lucide-react';
import { AcademicMilestone, MilestoneCategory, MilestoneStatus } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

// ─── Types ────────────────────────────────────────────────────────────────────
type GanttZoom = 'year' | 'month' | 'week';

// ─── Constants ────────────────────────────────────────────────────────────────
const SCHOOL_YEAR_START = new Date('2026-09-01');
const SCHOOL_YEAR_END   = new Date('2027-05-31');

const CATEGORY_META: Record<MilestoneCategory, { label: string; color: string; gradient: string; bg: string; border: string; icon: string; darkText: string }> = {
  survey:      { label: 'Khảo sát',      color: '#0284C7', gradient: 'linear-gradient(90deg,#0284C7,#38BDF8)', bg: '#EFF6FF', border: '#BFDBFE', icon: '📝', darkText: '#075985' },
  midterm:     { label: 'Giữa kỳ',       color: '#7C3AED', gradient: 'linear-gradient(90deg,#7C3AED,#A78BFA)', bg: '#F5F3FF', border: '#DDD6FE', icon: '⚡', darkText: '#4C1D95' },
  final:       { label: 'Học kỳ',        color: '#DC2626', gradient: 'linear-gradient(90deg,#DC2626,#F87171)', bg: '#FEF2F2', border: '#FECACA', icon: '🏆', darkText: '#7F1D1D' },
  olympic:     { label: 'HSG / Olympic', color: '#059669', gradient: 'linear-gradient(90deg,#059669,#34D399)', bg: '#ECFDF5', border: '#A7F3D0', icon: '🥇', darkText: '#064E3B' },
  certificate: { label: 'Chứng chỉ',    color: '#DB2777', gradient: 'linear-gradient(90deg,#DB2777,#F472B6)', bg: '#FDF2F8', border: '#FBCFE8', icon: '📜', darkText: '#831843' },
  other:       { label: 'Khác',          color: '#64748B', gradient: 'linear-gradient(90deg,#64748B,#94A3B8)', bg: '#F8FAFC', border: '#CBD5E1', icon: '📌', darkText: '#334155' },
};

const STATUS_COLOR: Record<MilestoneStatus, string> = {
  planned:   '#64748B',
  active:    '#F59E0B',
  completed: '#10B981',
};

// ─── Date helpers ─────────────────────────────────────────────────────────────
const toDate = (s: string) => { const d = new Date(s); d.setHours(0,0,0,0); return d; };
const today  = () => { const d = new Date(); d.setHours(0,0,0,0); return d; };

function addDays(d: Date, n: number): Date {
  const r = new Date(d); r.setDate(r.getDate() + n); return r;
}
function addMonths(d: Date, n: number): Date {
  const r = new Date(d); r.setMonth(r.getMonth() + n); return r;
}
function startOfWeek(d: Date): Date { // Monday
  const r = new Date(d); const day = r.getDay(); const diff = (day + 6) % 7;
  r.setDate(r.getDate() - diff); r.setHours(0,0,0,0); return r;
}
function startOfMonth(d: Date): Date { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date): Date   { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function isWeekend(d: Date): boolean { return d.getDay() === 0 || d.getDay() === 6; }

function formatDate(d: Date, fmt: 'short' | 'month' | 'day' = 'short'): string {
  if (fmt === 'month') return d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
  if (fmt === 'day')   return d.getDate().toString();
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
}

function getDDay(dateStr: string): { label: string; isUrgent: boolean; isPast: boolean; isToday: boolean } {
  const t = today();
  const target = toDate(dateStr);
  const diff = Math.round((target.getTime() - t.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: 'HÔM NAY', isUrgent: true,  isPast: false, isToday: true };
  if (diff > 0)   return { label: `D-${diff}`, isUrgent: diff <= 14, isPast: false, isToday: false };
  return { label: `${Math.abs(diff)}d ago`, isUrgent: false, isPast: true, isToday: false };
}

// ─── Gantt Grid logic ─────────────────────────────────────────────────────────

interface GanttConfig {
  viewStart:   Date;
  viewEnd:     Date;
  columns:     GanttColumn[];
  totalDays:   number;
  colWidthPx:  number; // width per unit column (px), for stable rendering
}

interface GanttColumn {
  label:    string;
  sublabel: string;
  start:    Date;
  end:      Date;
  isToday:  boolean;
  isWeekend?: boolean;
  isCurrentMonth?: boolean;
}

function buildYearConfig(): GanttConfig {
  const viewStart = SCHOOL_YEAR_START;
  const viewEnd   = SCHOOL_YEAR_END;
  const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / 86400000);
  const columns: GanttColumn[] = [];
  let cur = new Date(viewStart);
  const t = today();
  while (cur <= viewEnd) {
    const mEnd = endOfMonth(cur);
    const colEnd = mEnd < viewEnd ? mEnd : viewEnd;
    columns.push({
      label: cur.toLocaleDateString('vi-VN', { month: 'long' }),
      sublabel: cur.getFullYear().toString().slice(2),
      start: new Date(cur),
      end: colEnd,
      isToday: t >= cur && t <= colEnd,
      isCurrentMonth: t.getMonth() === cur.getMonth() && t.getFullYear() === cur.getFullYear(),
    });
    cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
  }
  return { viewStart, viewEnd, columns, totalDays, colWidthPx: 110 };
}

function buildMonthConfig(anchor: Date): GanttConfig {
  // show 3 months centered on anchor
  const viewStart = startOfMonth(addMonths(anchor, -1));
  const viewEnd   = endOfMonth(addMonths(anchor, 1));
  const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / 86400000);
  const columns: GanttColumn[] = [];
  const t = today();
  let weekStart = startOfWeek(viewStart);
  while (weekStart <= viewEnd) {
    const weekEnd = addDays(weekStart, 6);
    columns.push({
      label: `W${getWeekNumber(weekStart)}`,
      sublabel: `${formatDate(weekStart,'day')}–${formatDate(weekEnd,'day')}/${weekEnd.getMonth()+1}`,
      start: new Date(weekStart),
      end: new Date(weekEnd),
      isToday: t >= weekStart && t <= weekEnd,
    });
    weekStart = addDays(weekStart, 7);
  }
  return { viewStart, viewEnd, columns, totalDays, colWidthPx: 72 };
}

function buildWeekConfig(anchor: Date): GanttConfig {
  // show 5 weeks centered on anchor's week
  const anchorWeek = startOfWeek(anchor);
  const viewStart = addDays(anchorWeek, -14); // 2 weeks before
  const viewEnd   = addDays(anchorWeek, 34);  // 5 weeks total - 1
  const totalDays = Math.ceil((viewEnd.getTime() - viewStart.getTime()) / 86400000);
  const columns: GanttColumn[] = [];
  const t = today();
  let cur = new Date(viewStart);
  while (cur <= viewEnd) {
    columns.push({
      label: `${cur.getDate()}`,
      sublabel: cur.toLocaleDateString('vi-VN', { weekday: 'short' }),
      start: new Date(cur),
      end: new Date(cur),
      isToday: isSameDay(cur, t),
      isWeekend: isWeekend(cur),
    });
    cur = addDays(cur, 1);
  }
  return { viewStart, viewEnd, columns, totalDays, colWidthPx: 44 };
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
}

// pct position within viewStart..viewEnd
function datePct(d: Date, cfg: GanttConfig): number {
  const offset = Math.max(0, d.getTime() - cfg.viewStart.getTime()) / 86400000;
  return Math.min(100, Math.max(0, (offset / cfg.totalDays) * 100));
}

// ─── Component ────────────────────────────────────────────────────────────────
export const MilestonesKanbanPage: React.FC = () => {
  const { activeChild } = useChild();
  const [milestones, setMilestones] = useState<AcademicMilestone[]>(() => storage.getMilestones());

  const [viewMode, setViewMode]     = useState<'kanban' | 'gantt'>('gantt');
  const [zoom, setZoom]             = useState<GanttZoom>('year');
  const [anchor, setAnchor]         = useState<Date>(() => today());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tooltipItem, setTooltipItem] = useState<AcademicMilestone | null>(null);
  const [tooltipPos, setTooltipPos]   = useState({ x: 0, y: 0 });

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MilestoneCategory>('survey');
  const [formDate, setFormDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<MilestoneStatus>('planned');
  const [formTargetScore, setFormTargetScore] = useState('');
  const [formActualScore, setFormActualScore] = useState('');
  const [formSubjects, setFormSubjects] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Refs
  const scrollRef  = useRef<HTMLDivElement>(null);
  const ganttBodyRef = useRef<HTMLDivElement>(null);

  // ── Build gantt config ──
  const cfg: GanttConfig = (() => {
    if (zoom === 'year')  return buildYearConfig();
    if (zoom === 'month') return buildMonthConfig(anchor);
    return buildWeekConfig(anchor);
  })();

  const t = today();
  const todayVisible = t >= cfg.viewStart && t <= cfg.viewEnd;
  const todayPct = datePct(t, cfg);

  // ── Auto-scroll to today ──
  useEffect(() => {
    if (!scrollRef.current || !todayVisible) return;
    const container = scrollRef.current;
    const scrollableWidth = container.scrollWidth - container.clientWidth;
    const targetScroll = (todayPct / 100) * container.scrollWidth - container.clientWidth / 2;
    container.scrollLeft = Math.max(0, Math.min(scrollableWidth, targetScroll));
  }, [zoom, anchor, todayPct, todayVisible]);

  // ── Milestones ──
  const allChildMilestones = milestones
    .filter((m) => m.child_id === activeChild.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const childMilestones = allChildMilestones.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  // Kanban buckets
  const plannedItems   = childMilestones.filter((m) => m.status === 'planned');
  const activeItems    = childMilestones.filter((m) => m.status === 'active');
  const completedItems = childMilestones.filter((m) => m.status === 'completed');

  // ── Navigation ──
  const navPrev = () => {
    if (zoom === 'month') setAnchor((a) => addMonths(a, -3));
    else if (zoom === 'week') setAnchor((a) => addDays(a, -35));
  };
  const navNext = () => {
    if (zoom === 'month') setAnchor((a) => addMonths(a, 3));
    else if (zoom === 'week') setAnchor((a) => addDays(a, 35));
  };
  const navToToday = () => setAnchor(today());

  // ── Tooltip ──
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setTooltipPos({ x: e.clientX, y: e.clientY });
  }, []);

  // ── Modal ──
  const openAddModal = () => {
    setEditingMilestoneId(null); setFormTitle(''); setFormCategory('survey');
    setFormDate(today().toISOString().split('T')[0]); setFormEndDate('');
    setFormStatus('planned'); setFormTargetScore('>= 9.0');
    setFormActualScore(''); setFormSubjects('Toán, Tiếng Anh'); setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AcademicMilestone) => {
    setEditingMilestoneId(item.id); setFormTitle(item.title);
    setFormCategory(item.category); setFormDate(item.date);
    setFormEndDate(item.end_date || ''); setFormStatus(item.status);
    setFormTargetScore(item.target_score || ''); setFormActualScore(item.actual_score || '');
    setFormSubjects((item.subjects || []).join(', ')); setFormNotes(item.preparation_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;
    const data = {
      title: formTitle.trim(), category: formCategory, date: formDate,
      end_date: formEndDate || undefined, status: formStatus,
      target_score: formTargetScore.trim() || undefined, actual_score: formActualScore.trim() || undefined,
      subjects: formSubjects.split(',').map((s) => s.trim()).filter(Boolean),
      preparation_notes: formNotes.trim() || undefined,
    };
    if (editingMilestoneId) storage.updateMilestone(editingMilestoneId, data);
    else storage.addMilestone({ child_id: activeChild.id, ...data });
    setMilestones(storage.getMilestones()); setIsModalOpen(false);
  };

  const handleDeleteMilestone = (id: string) => {
    if (window.confirm('Xoá cột mốc này?')) {
      storage.deleteMilestone(id); setMilestones(storage.getMilestones());
    }
  };

  const handleMoveStatus = (id: string, s: MilestoneStatus) => {
    storage.updateMilestone(id, { status: s }); setMilestones(storage.getMilestones());
  };

  // ── Kanban card ──
  const renderKanbanCard = (item: AcademicMilestone) => {
    const meta = CATEGORY_META[item.category];
    const dday = getDDay(item.date);
    return (
      <Card key={item.id} className="overflow-hidden border border-app-border hover:shadow-theme-md transition-all group">
        <div className="h-1" style={{ background: meta.gradient }} />
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1 flex-1 min-w-0">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block"
                style={{ color: meta.color, borderColor: meta.border, backgroundColor: meta.bg }}>
                {meta.icon} {meta.label}
              </span>
              <h4 className="font-bold text-sm text-content-primary leading-tight">{item.title}</h4>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <button onClick={() => openEditModal(item)} className="p-1 text-content-muted hover:text-primary rounded"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDeleteMilestone(item.id)} className="p-1 text-content-muted hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-content-secondary font-mono text-[11px]">
              <Calendar className="w-3 h-3 text-primary" />
              {item.date.split('-').reverse().join('/')}
            </div>
            <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
              dday.isToday ? 'bg-red-500 text-white' : dday.isUrgent ? 'bg-amber-500 text-white' : dday.isPast ? 'bg-emerald-100 text-emerald-800' : 'bg-app-bg border border-app-border text-content-muted'}`}>
              {dday.label}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-app-bg border border-app-subtle space-y-1.5 text-[11px]">
            <div className="flex justify-between"><span className="text-content-muted">Mục tiêu</span><span className="font-bold text-primary">{item.target_score || '—'}</span></div>
            {item.actual_score && <div className="flex justify-between"><span className="text-content-muted">Kết quả</span><span className="font-black text-emerald-600">{item.actual_score}</span></div>}
            {!!item.subjects?.length && <div className="text-content-secondary truncate border-t border-app-subtle pt-1">📚 {item.subjects.join(', ')}</div>}
          </div>
          <div className="flex items-center gap-1 text-[10px] pt-0.5">
            {item.status !== 'planned' && <button onClick={() => handleMoveStatus(item.id,'planned')} className="text-content-muted hover:text-primary px-1.5 py-0.5 rounded hover:bg-black/5">← Kế hoạch</button>}
            {item.status !== 'active' && <button onClick={() => handleMoveStatus(item.id,'active')} className="text-amber-600 font-bold px-1.5 py-0.5 rounded hover:bg-amber-50">🔥 Mở</button>}
            {item.status !== 'completed' && <button onClick={() => handleMoveStatus(item.id,'completed')} className="text-emerald-600 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-50 ml-auto">✓ Xong</button>}
          </div>
        </div>
      </Card>
    );
  };

  // ── Gantt row bar ──
  const renderGanttBar = (item: AcademicMilestone) => {
    const meta      = CATEGORY_META[item.category];
    const dday      = getDDay(item.date);
    const startDate = toDate(item.date);
    const endDate   = item.end_date ? toDate(item.end_date) : startDate;

    // clamp to view
    const clampedStart = startDate < cfg.viewStart ? cfg.viewStart : startDate;
    const clampedEnd   = endDate   > cfg.viewEnd   ? cfg.viewEnd   : endDate;

    // out of view completely
    const inView = clampedStart <= cfg.viewEnd && clampedEnd >= cfg.viewStart;

    const leftPct  = datePct(clampedStart, cfg);
    const rightPct = datePct(clampedEnd,   cfg);
    const widthPct = Math.max(rightPct - leftPct, 0);
    const isRange  = item.end_date && widthPct > 0.5;
    const isCompleted = item.status === 'completed';
    const isActive    = item.status === 'active';

    return (
      <div
        key={item.id}
        className="flex items-center border-b border-app-border/50 group/row cursor-pointer hover:bg-primary/[0.04] transition-colors"
        style={{ minHeight: 52 }}
        onMouseEnter={(e) => { setTooltipItem(item); setTooltipPos({ x: e.clientX, y: e.clientY }); }}
        onMouseLeave={() => setTooltipItem(null)}
        onMouseMove={handleMouseMove}
        onClick={() => openEditModal(item)}
      >
        {/* Sticky name column */}
        <div className="w-52 shrink-0 flex items-center gap-2.5 px-3 py-2 border-r border-app-border bg-app-surface sticky left-0 z-20">
          <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: meta.gradient }} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-content-primary leading-snug line-clamp-2">{item.title}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px]">{meta.icon}</span>
              <span className="text-[10px] text-content-muted font-mono">{item.date.split('-').reverse().join('/')}</span>
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLOR[item.status] }} />
            </div>
          </div>
          {/* D-Day pill */}
          {!dday.isPast && (
            <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-black whitespace-nowrap ${
              dday.isToday ? 'bg-red-500 text-white' : dday.isUrgent ? 'bg-amber-500 text-white' : 'bg-app-bg border border-app-border text-content-muted'}`}>
              {dday.label}
            </span>
          )}
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
        </div>

        {/* Grid area */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 52 }}>
          {/* TODAY line */}
          {todayVisible && (
            <div className="absolute top-0 bottom-0 z-10 pointer-events-none flex flex-col items-center"
              style={{ left: `${todayPct}%` }}>
              <div className="w-px h-full bg-red-400/70" />
            </div>
          )}

          {/* Bar or diamond */}
          {inView && (isRange ? (
            <div
              className="absolute top-1/2 -translate-y-1/2 h-7 rounded-full flex items-center px-3 gap-2 shadow-sm transition-all group-hover/row:shadow-md group-hover/row:brightness-105"
              style={{
                left: `${leftPct}%`,
                width: `${widthPct}%`,
                background: meta.gradient,
                opacity: isCompleted ? 0.6 : 1,
                outline: isActive ? `2px solid ${meta.color}` : 'none',
                outlineOffset: '2px',
              }}
              title={item.title}
            >
              <span className="text-white text-[10px] font-bold truncate flex-1 leading-none drop-shadow-sm">{item.title}</span>
              {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />}
              {isCompleted && <CheckCircle2 className="w-3 h-3 text-white/90 shrink-0" />}
            </div>
          ) : (
            /* Diamond marker */
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
              style={{ left: `${leftPct}%` }}>
              <div
                className="w-5 h-5 rounded-sm rotate-45 shadow-md transition-all group-hover/row:scale-125"
                style={{
                  background: meta.gradient,
                  opacity: isCompleted ? 0.65 : 1,
                  boxShadow: isActive ? `0 0 0 4px ${meta.color}30` : undefined,
                }}
              >
                {isCompleted && (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="-rotate-45 text-white text-[8px] font-black">✓</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Edit action */}
        <div className="w-8 shrink-0 flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity border-l border-app-border/50">
          <button onClick={(e) => { e.stopPropagation(); openEditModal(item); }} className="p-1 text-content-muted hover:text-primary rounded" title="Sửa">
            <Edit2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1.5">
            <Target className="w-3.5 h-3.5" /><span>Academic Milestone Roadmap</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-content-primary">
            Cột Mốc Kỳ Thi — {formatChildDisplayName(activeChild)}
          </h2>
          <p className="text-sm text-content-secondary mt-1">Lộ trình học tập & thi cử năm học 2026–2027</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode */}
          <div className="flex items-center bg-app-card border border-app-border rounded-xl p-1 shadow-theme-sm gap-0.5">
            <button onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'gantt' ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'text-content-secondary hover:text-content-primary'}`}>
              <BarChart2 className="w-3.5 h-3.5" /><span>Gantt</span>
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'text-content-secondary hover:text-content-primary'}`}>
              <ClipboardList className="w-3.5 h-3.5" /><span>Kanban</span>
            </button>
            <Link to="/milestone-progress"
              className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 text-content-secondary hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /><span>Kết quả & Tiến trình</span>
            </Link>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm cột mốc
          </Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${selectedCategory === 'all' ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'bg-app-card border border-app-border text-content-secondary hover:border-primary/40'}`}>
          Tất cả ({allChildMilestones.length})
        </button>
        {(Object.entries(CATEGORY_META) as [MilestoneCategory, typeof CATEGORY_META[MilestoneCategory]][]).map(([key, meta]) => (
          <button key={key} onClick={() => setSelectedCategory(key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${selectedCategory === key ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'bg-app-card border border-app-border text-content-secondary hover:border-primary/40'}`}>
            <span>{meta.icon}</span><span>{meta.label}</span>
          </button>
        ))}
      </div>

      {/* ══ GANTT VIEW ══════════════════════════════════════════════════════ */}
      {viewMode === 'gantt' && (
        <Card className="overflow-hidden shadow-theme-md">

          {/* Gantt toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-app-border bg-app-subtle">

            {/* Zoom selector */}
            <div className="flex items-center gap-1 bg-app-bg border border-app-border rounded-xl p-1">
              {(['year','month','week'] as GanttZoom[]).map((z) => (
                <button key={z} onClick={() => { setZoom(z); setAnchor(today()); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${zoom === z ? 'bg-primary text-primary-foreground shadow-sm' : 'text-content-secondary hover:text-content-primary'}`}>
                  {z === 'year' ? '📅 Năm' : z === 'month' ? '📆 Tháng' : '🗓 Tuần'}
                </button>
              ))}
            </div>

            {/* Navigation (only for month/week) */}
            {zoom !== 'year' && (
              <div className="flex items-center gap-2">
                <button onClick={navPrev} className="p-1.5 rounded-lg border border-app-border bg-app-bg text-content-secondary hover:text-primary hover:border-primary/40 transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={navToToday} className="px-3 py-1.5 text-[11px] font-bold rounded-lg border border-app-border bg-app-bg hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                  Hôm nay
                </button>
                <button onClick={navNext} className="p-1.5 rounded-lg border border-app-border bg-app-bg text-content-secondary hover:text-primary hover:border-primary/40 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 ml-auto">
              {(Object.entries(CATEGORY_META) as [MilestoneCategory, typeof CATEGORY_META[MilestoneCategory]][]).map(([key, meta]) => (
                <div key={key} className="flex items-center gap-1 text-[10px] text-content-muted">
                  <span className="w-2.5 h-2.5 rounded-sm inline-block shrink-0" style={{ background: meta.gradient }} />
                  {meta.icon} {meta.label}
                </div>
              ))}
              <div className="flex items-center gap-1 text-[10px] text-red-500 font-semibold">
                <span className="w-px h-3 bg-red-400 inline-block" />
                Hôm nay
              </div>
            </div>
          </div>

          {/* Gantt Chart Body */}
          <div className="flex">

            {/* Sticky name header (left column header) */}
            <div className="w-52 shrink-0 border-r border-app-border bg-app-subtle sticky left-0 z-30">
              <div className="px-3 py-2 text-[10px] font-black text-content-muted uppercase tracking-widest">
                Cột mốc / Kỳ thi
              </div>
            </div>

            {/* Scrollable grid header */}
            <div className="flex-1 overflow-hidden">
              <div ref={scrollRef} className="overflow-x-auto">
                {/* COLUMN HEADERS */}
                <div className="flex border-b-2 border-app-border bg-app-subtle" style={{ minWidth: cfg.columns.length * cfg.colWidthPx }}>
                  {cfg.columns.map((col, i) => (
                    <div key={i}
                      className={`shrink-0 border-r border-app-border text-center py-2 transition-colors ${
                        col.isToday ? 'bg-primary/10' :
                        col.isWeekend ? 'bg-app-bg/80' :
                        col.isCurrentMonth ? 'bg-primary/5' : ''
                      }`}
                      style={{ width: cfg.colWidthPx }}>
                      <div className={`text-[11px] font-extrabold ${col.isToday ? 'text-primary' : col.isWeekend ? 'text-content-muted/60' : 'text-content-secondary'}`}>
                        {col.label}
                      </div>
                      <div className={`text-[9px] ${col.isToday ? 'text-primary/80' : 'text-content-muted'}`}>
                        {col.sublabel}
                        {col.isToday && <span className="ml-1 text-[8px] font-black text-primary">▼</span>}
                      </div>
                    </div>
                  ))}
                </div>

                {/* ROWS */}
                <div ref={ganttBodyRef} style={{ minWidth: cfg.columns.length * cfg.colWidthPx }}>
                  {/* Column grid lines overlay + TODAY highlight */}
                  <div className="relative">
                    {/* TODAY column highlight */}
                    {todayVisible && (
                      <div className="absolute top-0 bottom-0 pointer-events-none z-0"
                        style={{
                          left: `${todayPct}%`,
                          width: '2px',
                          background: 'linear-gradient(180deg, #EF4444 0%, #F87171 100%)',
                          opacity: 0.6,
                        }}
                      />
                    )}

                    {/* Empty state */}
                    {childMilestones.length === 0 && (
                      <div className="py-16 text-center text-content-muted">
                        <div className="text-4xl mb-3">📅</div>
                        <div className="font-bold text-sm">Chưa có cột mốc nào</div>
                        <div className="text-xs mt-1">Nhấn "Thêm cột mốc" để bắt đầu</div>
                      </div>
                    )}

                    {/* Milestone rows */}
                    {childMilestones.map((item) => renderGanttBar(item))}

                    {/* Footer TODAY label */}
                    {childMilestones.length > 0 && todayVisible && (
                      <div className="relative h-6 border-t border-app-border bg-app-subtle">
                        <div className="absolute top-0 flex items-center h-full -translate-x-1/2"
                          style={{ left: `${todayPct}%` }}>
                          <div className="w-0.5 h-full bg-red-400/70" />
                          <span className="ml-1 text-[9px] font-black text-red-500 whitespace-nowrap">▲ Hôm nay ({today().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })})</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Edit column header */}
            <div className="w-8 shrink-0 border-l border-app-border bg-app-subtle" />
          </div>
        </Card>
      )}

      {/* ══ KANBAN VIEW ════════════════════════════════════════════════════ */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div className="space-y-3 bg-app-bg/50 p-3.5 rounded-2xl border border-app-border min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-slate-500" /><h3 className="font-extrabold text-sm text-content-primary">📋 Sắp Tới</h3></div>
              <Badge variant="outline" size="sm">{plannedItems.length}</Badge>
            </div>
            <div className="space-y-3">{plannedItems.map(renderKanbanCard)}{!plannedItems.length && <div className="py-10 text-center text-xs text-content-muted">Chưa có cột mốc</div>}</div>
          </div>
          <div className="space-y-3 bg-amber-50/30 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /><h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">🔥 Đang Diễn Ra</h3></div>
              <Badge variant="warning" size="sm">{activeItems.length}</Badge>
            </div>
            <div className="space-y-3">{activeItems.map(renderKanbanCard)}{!activeItems.length && <div className="py-10 text-center text-xs text-content-muted">Không có kỳ thi đang mở</div>}</div>
          </div>
          <div className="space-y-3 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">✅ Hoàn Thành</h3></div>
              <Badge variant="success" size="sm">{completedItems.length}</Badge>
            </div>
            <div className="space-y-3">{completedItems.map(renderKanbanCard)}{!completedItems.length && <div className="py-10 text-center text-xs text-content-muted">Chưa có kết quả</div>}</div>
          </div>
        </div>
      )}

      {/* ══ FLOATING TOOLTIP ═══════════════════════════════════════════════ */}
      {tooltipItem && (
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-100"
          style={{ left: tooltipPos.x + 16, top: tooltipPos.y - 8, maxWidth: 280 }}>
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop overflow-hidden text-xs">
            <div className="h-1" style={{ background: CATEGORY_META[tooltipItem.category].gradient }} />
            <div className="p-3.5 space-y-2">
              <div className="font-extrabold text-content-primary leading-tight">{tooltipItem.title}</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: CATEGORY_META[tooltipItem.category].bg, color: CATEGORY_META[tooltipItem.category].color, border: `1px solid ${CATEGORY_META[tooltipItem.category].border}` }}>
                  {CATEGORY_META[tooltipItem.category].icon} {CATEGORY_META[tooltipItem.category].label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${STATUS_COLOR[tooltipItem.status]}20`, color: STATUS_COLOR[tooltipItem.status] }}>
                  {tooltipItem.status === 'completed' ? '✅ Hoàn thành' : tooltipItem.status === 'active' ? '🔥 Đang mở' : '📋 Sắp tới'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-content-secondary">
                <div><b className="text-content-primary">Ngày:</b><br />{tooltipItem.date.split('-').reverse().join('/')}{tooltipItem.end_date && ` → ${tooltipItem.end_date.split('-').reverse().join('/')}`}</div>
                <div><b className="text-content-primary">Mục tiêu:</b><br /><span className="text-primary font-bold">{tooltipItem.target_score || '—'}</span></div>
                {tooltipItem.actual_score && <div><b className="text-content-primary">Kết quả:</b><br /><span className="text-emerald-600 font-black">{tooltipItem.actual_score}</span></div>}
                {!!tooltipItem.subjects?.length && <div className="col-span-2"><b className="text-content-primary">Môn:</b> {tooltipItem.subjects.join(', ')}</div>}
              </div>
              {tooltipItem.preparation_notes && (
                <div className="text-[10px] text-content-muted italic border-t border-app-subtle pt-2">
                  💡 {tooltipItem.preparation_notes}
                </div>
              )}
              <div className="text-[9px] text-content-muted text-right">Click để chỉnh sửa</div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL ═══════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="h-1.5" style={{ background: CATEGORY_META[formCategory].gradient }} />
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-app-border">
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {editingMilestoneId ? 'Chỉnh Sửa Cột Mốc' : 'Thêm Cột Mốc Mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveMilestone} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Tên kỳ thi / Cột mốc *</label>
                  <input type="text" required placeholder="Ví dụ: Thi Giữa HK1..." value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Phân loại</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value as MilestoneCategory)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="survey">📝 Khảo sát</option>
                      <option value="midterm">⚡ Giữa kỳ</option>
                      <option value="final">🏆 Học kỳ</option>
                      <option value="olympic">🥇 HSG / Olympic</option>
                      <option value="certificate">📜 Chứng chỉ</option>
                      <option value="other">📌 Khác</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Trạng thái</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as MilestoneStatus)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary">
                      <option value="planned">📋 Sắp tới</option>
                      <option value="active">🔥 Đang diễn ra</option>
                      <option value="completed">✅ Hoàn thành</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Ngày thi / Bắt đầu *</label>
                    <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Ngày kết thúc (tuỳ chọn)</label>
                    <input type="date" value={formEndDate} min={formDate} onChange={(e) => setFormEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Mục tiêu điểm</label>
                    <input type="text" placeholder=">= 9.0" value={formTargetScore} onChange={(e) => setFormTargetScore(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Điểm thực tế</label>
                    <input type="text" placeholder="9.2" value={formActualScore} onChange={(e) => setFormActualScore(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Các môn thi (phân cách bằng dấu phẩy)</label>
                  <input type="text" placeholder="Toán, Ngữ văn, Tiếng Anh" value={formSubjects} onChange={(e) => setFormSubjects(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ghi chú & Kế hoạch ôn tập</label>
                  <textarea rows={2} placeholder="Ôn kỹ hình học chương 1..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                  <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>Huỷ</Button>
                  <Button type="submit" variant="primary" size="sm">{editingMilestoneId ? 'Cập nhật' : 'Tạo cột mốc'}</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
