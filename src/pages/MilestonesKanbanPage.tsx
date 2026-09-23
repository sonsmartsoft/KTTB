import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Target,
  Plus,
  Calendar,
  Edit2,
  Trash2,
  Sparkles,
  X,
  ClipboardList,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { AcademicMilestone, MilestoneCategory, MilestoneStatus } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

// ─── Constants ────────────────────────────────────────────────────────────────

const SCHOOL_YEAR_START = new Date('2026-09-01');
const SCHOOL_YEAR_END   = new Date('2027-05-31');
const TOTAL_DAYS = Math.ceil(
  (SCHOOL_YEAR_END.getTime() - SCHOOL_YEAR_START.getTime()) / (1000 * 60 * 60 * 24)
);

const GANTT_MONTHS = [
  { label: 'T9/2026',  month: 8,  year: 2026 },
  { label: 'T10/2026', month: 9,  year: 2026 },
  { label: 'T11/2026', month: 10, year: 2026 },
  { label: 'T12/2026', month: 11, year: 2026 },
  { label: 'T1/2027',  month: 0,  year: 2027 },
  { label: 'T2/2027',  month: 1,  year: 2027 },
  { label: 'T3/2027',  month: 2,  year: 2027 },
  { label: 'T4/2027',  month: 3,  year: 2027 },
  { label: 'T5/2027',  month: 4,  year: 2027 },
];

const CATEGORY_META: Record<MilestoneCategory, { label: string; color: string; bg: string; border: string; icon: string }> = {
  survey:      { label: 'Khảo sát',      color: '#0284C7', bg: '#EFF6FF', border: '#BFDBFE', icon: '📝' },
  midterm:     { label: 'Giữa kỳ',       color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE', icon: '⚡' },
  final:       { label: 'Học kỳ',        color: '#DC2626', bg: '#FEF2F2', border: '#FECACA', icon: '🏆' },
  olympic:     { label: 'HSG / Olympic', color: '#059669', bg: '#ECFDF5', border: '#A7F3D0', icon: '🥇' },
  certificate: { label: 'Chứng chỉ',    color: '#DB2777', bg: '#FDF2F8', border: '#FBCFE8', icon: '📜' },
  other:       { label: 'Khác',          color: '#64748B', bg: '#F8FAFC', border: '#CBD5E1', icon: '📌' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dayOffset(dateStr: string): number {
  const d = new Date(dateStr);
  return Math.max(0, Math.ceil((d.getTime() - SCHOOL_YEAR_START.getTime()) / (1000 * 60 * 60 * 24)));
}

function pct(offset: number): number {
  return Math.min(100, Math.max(0, (offset / TOTAL_DAYS) * 100));
}

function todayPct(): number {
  const now = new Date();
  const offset = Math.ceil((now.getTime() - SCHOOL_YEAR_START.getTime()) / (1000 * 60 * 60 * 24));
  return pct(offset);
}

function getDDay(dateStr: string): { label: string; isUrgent: boolean; isPast: boolean } {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr); target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return { label: 'HÔM NAY', isUrgent: true, isPast: false };
  if (diff > 0)   return { label: `D-${diff}`, isUrgent: diff <= 14, isPast: false };
  return { label: `${Math.abs(diff)}d trước`, isUrgent: false, isPast: true };
}

function monthWidthPct(month: number, year: number): number {
  const start = new Date(year, month, 1);
  const end   = new Date(year, month + 1, 0);
  const days  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return (days / TOTAL_DAYS) * 100;
}

function monthStartPct(month: number, year: number): number {
  const d = new Date(year, month, 1);
  const offset = Math.ceil((d.getTime() - SCHOOL_YEAR_START.getTime()) / (1000 * 60 * 60 * 24));
  return pct(offset);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const MilestonesKanbanPage: React.FC = () => {
  const { activeChild } = useChild();
  const [milestones, setMilestones] = useState<AcademicMilestone[]>(() => storage.getMilestones());

  const [viewMode, setViewMode] = useState<'kanban' | 'gantt'>('gantt');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [tooltipItem, setTooltipItem] = useState<AcademicMilestone | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MilestoneCategory>('survey');
  const [formDate, setFormDate] = useState('2026-09-26');
  const [formEndDate, setFormEndDate] = useState('');
  const [formStatus, setFormStatus] = useState<MilestoneStatus>('planned');
  const [formTargetScore, setFormTargetScore] = useState('>= 9.0');
  const [formActualScore, setFormActualScore] = useState('');
  const [formSubjects, setFormSubjects] = useState('Toán, Tiếng Anh');
  const [formNotes, setFormNotes] = useState('');

  const allChildMilestones = milestones
    .filter((m) => m.child_id === activeChild.id)
    .sort((a, b) => a.date.localeCompare(b.date));

  const childMilestones = allChildMilestones.filter(
    (m) => selectedCategory === 'all' || m.category === selectedCategory
  );

  const plannedItems   = childMilestones.filter((m) => m.status === 'planned');
  const activeItems    = childMilestones.filter((m) => m.status === 'active');
  const completedItems = childMilestones.filter((m) => m.status === 'completed');

  const todayP = todayPct();

  // ── Modal helpers ──

  const openAddModal = () => {
    setEditingMilestoneId(null);
    setFormTitle(''); setFormCategory('survey');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormEndDate(''); setFormStatus('planned');
    setFormTargetScore('>= 9.0'); setFormActualScore('');
    setFormSubjects('Toán, Tiếng Anh'); setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AcademicMilestone) => {
    setEditingMilestoneId(item.id);
    setFormTitle(item.title); setFormCategory(item.category);
    setFormDate(item.date); setFormEndDate(item.end_date || '');
    setFormStatus(item.status);
    setFormTargetScore(item.target_score || '');
    setFormActualScore(item.actual_score || '');
    setFormSubjects((item.subjects || []).join(', '));
    setFormNotes(item.preparation_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;
    const subjectsArr = formSubjects.split(',').map((s) => s.trim()).filter(Boolean);
    const data = {
      title: formTitle.trim(), category: formCategory,
      date: formDate, end_date: formEndDate || undefined,
      status: formStatus,
      target_score: formTargetScore.trim() || undefined,
      actual_score: formActualScore.trim() || undefined,
      subjects: subjectsArr,
      preparation_notes: formNotes.trim() || undefined,
    };
    if (editingMilestoneId) {
      storage.updateMilestone(editingMilestoneId, data);
    } else {
      storage.addMilestone({ child_id: activeChild.id, ...data });
    }
    setMilestones(storage.getMilestones());
    setIsModalOpen(false);
  };

  const handleDeleteMilestone = (id: string) => {
    if (window.confirm('Xoá cột mốc này?')) {
      storage.deleteMilestone(id);
      setMilestones(storage.getMilestones());
    }
  };

  const handleMoveStatus = (id: string, newStatus: MilestoneStatus) => {
    storage.updateMilestone(id, { status: newStatus });
    setMilestones(storage.getMilestones());
  };

  // ── Kanban card ──

  const renderKanbanCard = (item: AcademicMilestone) => {
    const meta = CATEGORY_META[item.category];
    const dday = getDDay(item.date);
    return (
      <Card key={item.id} className="p-4 space-y-3 bg-app-surface border border-app-border hover:shadow-theme-md transition-all group">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block"
              style={{ color: meta.color, borderColor: meta.border, backgroundColor: meta.bg }}>
              {meta.icon} {meta.label}
            </span>
            <h4 className="font-bold text-sm text-content-primary leading-tight">{item.title}</h4>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEditModal(item)} className="p-1 text-content-muted hover:text-primary rounded"><Edit2 className="w-3.5 h-3.5" /></button>
            <button onClick={() => handleDeleteMilestone(item.id)} className="p-1 text-content-muted hover:text-red-500 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-1 border-t border-app-subtle">
          <div className="flex items-center gap-1.5 text-content-secondary font-mono">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{item.date.split('-').reverse().join('/')}</span>
          </div>
          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${dday.label === 'HÔM NAY' ? 'bg-red-500 text-white' : dday.isUrgent ? 'bg-amber-500 text-white animate-pulse' : 'bg-app-bg text-content-muted border border-app-border'}`}>
            {dday.label}
          </span>
        </div>
        <div className="space-y-1.5 text-xs bg-app-bg p-2.5 rounded-xl border border-app-subtle">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-content-muted">Mục tiêu:</span>
            <span className="font-bold text-primary">{item.target_score || 'Chưa đặt'}</span>
          </div>
          {item.actual_score && (
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-content-muted">Điểm đạt:</span>
              <span className="font-black text-emerald-600 font-mono text-sm">{item.actual_score}</span>
            </div>
          )}
          {item.subjects && item.subjects.length > 0 && (
            <div className="text-[11px] text-content-secondary truncate pt-1 border-t border-app-subtle">📚 {item.subjects.join(', ')}</div>
          )}
        </div>
        <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
          {item.status !== 'planned' && <button onClick={() => handleMoveStatus(item.id, 'planned')} className="text-content-muted hover:text-primary px-1.5 py-0.5 rounded hover:bg-black/5">← Kế hoạch</button>}
          {item.status !== 'active' && <button onClick={() => handleMoveStatus(item.id, 'active')} className="text-amber-600 hover:text-amber-700 font-bold px-1.5 py-0.5 rounded hover:bg-amber-50">🔥 Tháng này</button>}
          {item.status !== 'completed' && <button onClick={() => handleMoveStatus(item.id, 'completed')} className="text-emerald-600 hover:text-emerald-700 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-50 ml-auto">✓ Hoàn thành</button>}
        </div>
      </Card>
    );
  };

  // ── Render ──

  return (
    <div className="space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Academic Milestone Roadmap</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-content-primary">
            Cột Mốc Kỳ Thi — {formatChildDisplayName(activeChild)}
          </h2>
          <p className="text-sm text-content-secondary mt-1">Lộ trình học tập & thi cử năm học 2026–2027</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-app-card border border-app-border rounded-xl p-1 shadow-theme-sm">
            <button onClick={() => setViewMode('gantt')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'gantt' ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'text-content-secondary hover:text-content-primary'}`}>
              <BarChart2 className="w-3.5 h-3.5" /><span>Gantt Chart</span>
            </button>
            <button onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground shadow-theme-sm' : 'text-content-secondary hover:text-content-primary'}`}>
              <ClipboardList className="w-3.5 h-3.5" /><span>Kanban</span>
            </button>
          </div>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm cột mốc
          </Button>
        </div>
      </div>

      {/* Category Filter */}
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

      {/* ═══ GANTT CHART VIEW ═══ */}
      {viewMode === 'gantt' && (
        <Card className="overflow-hidden">
          {/* Legend */}
          <div className="px-4 pt-4 pb-2 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-app-border">
            <span className="text-xs font-bold text-content-muted">Chú thích:</span>
            {(Object.entries(CATEGORY_META) as [MilestoneCategory, typeof CATEGORY_META[MilestoneCategory]][]).map(([key, meta]) => (
              <div key={key} className="flex items-center gap-1.5 text-[11px] font-semibold text-content-secondary">
                <span className="w-3 h-3 rounded-sm inline-block shrink-0" style={{ backgroundColor: meta.color }} />
                {meta.icon} {meta.label}
              </div>
            ))}
            <div className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-red-500">
              <span className="w-0.5 h-4 bg-red-500 rounded inline-block" />
              Hôm nay
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px]">

              {/* Month Header */}
              <div className="flex border-b border-app-border">
                <div className="w-48 shrink-0 bg-app-subtle border-r border-app-border px-3 py-2 text-[11px] font-bold text-content-muted uppercase tracking-wider flex items-end">
                  Kỳ thi / Cột mốc
                </div>
                <div className="flex-1 flex">
                  {GANTT_MONTHS.map((m) => {
                    const wPct = monthWidthPct(m.month, m.year);
                    const isCurrent = new Date().getMonth() === m.month && new Date().getFullYear() === m.year;
                    return (
                      <div key={m.label}
                        className={`shrink-0 border-r border-app-border py-2 text-center text-[11px] font-extrabold ${isCurrent ? 'bg-primary/10 text-primary' : 'bg-app-subtle text-content-muted'}`}
                        style={{ width: `${wPct}%` }}>
                        {m.label}
                        {isCurrent && <span className="ml-1 px-1 py-0.5 bg-primary text-primary-foreground rounded text-[9px] font-black">NOW</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="w-14 shrink-0 bg-app-subtle border-l border-app-border" />
              </div>

              {/* Empty state */}
              {childMilestones.length === 0 && (
                <div className="py-20 text-center text-content-muted">
                  <div className="text-4xl mb-3">📅</div>
                  <div className="font-bold text-sm">Chưa có cột mốc nào</div>
                  <div className="text-xs mt-1">Nhấn "Thêm cột mốc" để bắt đầu lên kế hoạch</div>
                </div>
              )}

              {/* Milestone Rows */}
              {childMilestones.map((item, idx) => {
                const meta = CATEGORY_META[item.category];
                const startP = pct(dayOffset(item.date));
                const endP   = item.end_date ? pct(dayOffset(item.end_date)) : startP;
                const barW   = Math.max(endP - startP, 0);
                const hasRange = !!(item.end_date && barW > 0.8);
                const dday   = getDDay(item.date);
                const isCompleted = item.status === 'completed';
                const isActive    = item.status === 'active';
                const isHovered   = hoveredId === item.id;

                return (
                  <div key={item.id}
                    className={`flex group border-b border-app-border/50 transition-colors ${isHovered ? 'bg-primary/5' : idx % 2 === 0 ? 'bg-app-surface' : 'bg-app-bg/60'}`}
                    onMouseEnter={() => { setHoveredId(item.id); setTooltipItem(item); }}
                    onMouseLeave={() => { setHoveredId(null); setTooltipItem(null); }}>

                    {/* Name cell */}
                    <div className="w-48 shrink-0 border-r border-app-border px-3 py-2.5 flex items-center gap-2">
                      <div className="flex flex-col items-center gap-0.5 shrink-0">
                        <span className="text-base leading-none">{meta.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-content-primary leading-tight line-clamp-2" title={item.title}>{item.title}</div>
                        <div className="text-[10px] text-content-muted mt-0.5 font-mono">
                          {item.date.split('-').reverse().join('/')}
                          {item.end_date && ` → ${item.end_date.split('-').reverse().join('/')}`}
                        </div>
                      </div>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative min-h-[56px] py-2">
                      {/* Month grid lines */}
                      {GANTT_MONTHS.map((m) => (
                        <div key={m.label} className="absolute top-0 bottom-0 border-r border-app-border/30 pointer-events-none"
                          style={{ left: `${monthStartPct(m.month, m.year) + monthWidthPct(m.month, m.year)}%` }} />
                      ))}

                      {/* TODAY line */}
                      {todayP >= 0 && todayP <= 100 && (
                        <div className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10 pointer-events-none"
                          style={{ left: `${todayP}%` }} />
                      )}

                      {hasRange ? (
                        /* Range bar */
                        <div
                          className="absolute top-1/2 -translate-y-1/2 h-8 rounded-lg flex items-center px-2.5 gap-1.5 cursor-pointer transition-all hover:brightness-110 hover:shadow-lg"
                          style={{ left: `${startP}%`, width: `${barW}%`, backgroundColor: meta.color, opacity: isCompleted ? 0.65 : 1 }}
                          onClick={() => openEditModal(item)}
                          title={item.title}>
                          <span className="text-white text-[11px] font-bold truncate flex-1">{item.title}</span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />}
                          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-white/90 shrink-0" />}
                        </div>
                      ) : (
                        /* Point diamond marker */
                        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 cursor-pointer"
                          style={{ left: `${startP}%` }}
                          onClick={() => openEditModal(item)}>
                          <div className="w-6 h-6 rounded-sm rotate-45 flex items-center justify-center transition-all group-hover:scale-125"
                            style={{
                              backgroundColor: meta.color,
                              opacity: isCompleted ? 0.65 : 1,
                              boxShadow: isActive ? `0 0 0 5px ${meta.color}30, 0 2px 8px ${meta.color}60` : `0 2px 8px ${meta.color}50`,
                            }}>
                            {isCompleted && <span className="-rotate-45 text-white text-[9px] font-black">✓</span>}
                            {isActive && <span className="-rotate-45 text-white text-[9px] font-black">!</span>}
                          </div>
                        </div>
                      )}

                      {/* D-Day badge above marker */}
                      {!isCompleted && (
                        <div className="absolute top-0.5 -translate-x-1/2 z-30 pointer-events-none"
                          style={{ left: `${startP}%` }}>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black whitespace-nowrap shadow-sm ${
                            dday.label === 'HÔM NAY' ? 'bg-red-500 text-white' :
                            dday.isUrgent ? 'bg-amber-500 text-white' :
                            'bg-app-card border border-app-border text-content-muted'}`}>
                            {dday.label}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="w-14 shrink-0 border-l border-app-border flex items-center justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="p-1 text-content-muted hover:text-primary rounded" title="Sửa"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDeleteMilestone(item.id)} className="p-1 text-content-muted hover:text-red-500 rounded" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                );
              })}

              {/* Footer: TODAY label */}
              {childMilestones.length > 0 && (
                <div className="flex border-t border-app-border">
                  <div className="w-48 shrink-0 border-r border-app-border" />
                  <div className="flex-1 relative h-7">
                    {todayP >= 0 && todayP <= 100 && (
                      <div className="absolute top-0 flex items-center h-full" style={{ left: `${todayP}%` }}>
                        <div className="w-0.5 h-full bg-red-500" />
                        <span className="ml-1 text-[9px] font-black text-red-500 whitespace-nowrap">▲ Hôm nay</span>
                      </div>
                    )}
                  </div>
                  <div className="w-14 shrink-0 border-l border-app-border" />
                </div>
              )}
            </div>
          </div>

          {/* Hover tooltip panel */}
          {tooltipItem && (
            <div className="border-t border-app-border px-4 py-3 bg-app-subtle animate-in fade-in duration-100">
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: CATEGORY_META[tooltipItem.category].color }} />
                  <span className="font-extrabold text-content-primary text-sm">{tooltipItem.title}</span>
                  <Badge variant={tooltipItem.status === 'completed' ? 'success' : tooltipItem.status === 'active' ? 'warning' : 'outline'} size="sm">
                    {tooltipItem.status === 'completed' ? '✅ Hoàn thành' : tooltipItem.status === 'active' ? '🔥 Đang mở' : '📋 Kế hoạch'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-4 text-content-secondary text-[11px]">
                  <span><b className="text-content-primary">Ngày:</b> {tooltipItem.date.split('-').reverse().join('/')}{tooltipItem.end_date && ` → ${tooltipItem.end_date.split('-').reverse().join('/')}`}</span>
                  <span><b className="text-content-primary">Mục tiêu:</b> {tooltipItem.target_score || '—'}</span>
                  {tooltipItem.actual_score && <span><b className="text-emerald-600">Đạt:</b> <span className="text-emerald-600 font-black">{tooltipItem.actual_score}</span></span>}
                  {tooltipItem.subjects?.length && <span><b className="text-content-primary">Môn:</b> {tooltipItem.subjects.join(', ')}</span>}
                </div>
                {tooltipItem.preparation_notes && (
                  <div className="w-full text-[11px] text-content-secondary italic">💡 {tooltipItem.preparation_notes}</div>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          <div className="space-y-3 bg-app-bg/50 p-3.5 rounded-2xl border border-app-border min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /><h3 className="font-extrabold text-sm text-content-primary">📋 Sắp Tới</h3></div>
              <Badge variant="outline" size="sm">{plannedItems.length}</Badge>
            </div>
            <div className="space-y-3">{plannedItems.map(renderKanbanCard)}{plannedItems.length === 0 && <div className="py-10 text-center text-xs text-content-muted">Chưa có cột mốc</div>}</div>
          </div>
          <div className="space-y-3 bg-amber-50/30 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" /><h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">🔥 Đang Diễn Ra</h3></div>
              <Badge variant="warning" size="sm">{activeItems.length}</Badge>
            </div>
            <div className="space-y-3">{activeItems.map(renderKanbanCard)}{activeItems.length === 0 && <div className="py-10 text-center text-xs text-content-muted">Không có kỳ thi đang mở</div>}</div>
          </div>
          <div className="space-y-3 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 min-h-[400px]">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">✅ Hoàn Thành</h3></div>
              <Badge variant="success" size="sm">{completedItems.length}</Badge>
            </div>
            <div className="space-y-3">{completedItems.map(renderKanbanCard)}{completedItems.length === 0 && <div className="py-10 text-center text-xs text-content-muted">Chưa có kết quả</div>}</div>
          </div>
        </div>
      )}

      {/* ═══ MODAL ═══ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-app-border">
                <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {editingMilestoneId ? 'Chỉnh Sửa Cột Mốc' : 'Thêm Cột Mốc Kỳ Thi Mới'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"><X className="w-5 h-5" /></button>
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
                    <label className="font-bold text-content-primary">Điểm thực tế (đã thi)</label>
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
