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
  Clock,
  CheckCircle2,
  Flame,
  ClipboardList,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  X,
  Compass,
  Trophy,
  Filter,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { AcademicMilestone, MilestoneCategory, MilestoneStatus } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

const CATEGORY_MAP: Record<MilestoneCategory, { label: string; color: string; icon: string }> = {
  survey: { label: 'Thi Khảo sát', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '📝' },
  midterm: { label: 'Thi Giữa kỳ', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: '⚡' },
  final: { label: 'Thi Học kỳ', color: 'bg-red-100 text-red-800 border-red-200', icon: '🏆' },
  olympic: { label: 'HSG / Olympic', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: '🥇' },
  certificate: { label: 'Chứng chỉ / Năng khiếu', color: 'bg-pink-100 text-pink-800 border-pink-200', icon: '📜' },
  other: { label: 'Khác', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: '📌' },
};

export const MilestonesKanbanPage: React.FC = () => {
  const { activeChild } = useChild();
  const [milestones, setMilestones] = useState<AcademicMilestone[]>(() => storage.getMilestones());

  // View Mode: 'kanban' vs 'roadmap'
  const [viewMode, setViewMode] = useState<'kanban' | 'roadmap'>('kanban');

  // Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<MilestoneCategory>('survey');
  const [formDate, setFormDate] = useState('2026-09-26');
  const [formStatus, setFormStatus] = useState<MilestoneStatus>('planned');
  const [formTargetScore, setFormTargetScore] = useState('>= 9.0');
  const [formActualScore, setFormActualScore] = useState('');
  const [formSubjects, setFormSubjects] = useState('Toán, Tiếng Anh');
  const [formDescription, setFormDescription] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Child milestones
  const childMilestones = milestones
    .filter((m) => m.child_id === activeChild.id)
    .filter((m) => selectedCategory === 'all' || m.category === selectedCategory)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Kanban Columns
  const plannedItems = childMilestones.filter((m) => m.status === 'planned');
  const activeItems = childMilestones.filter((m) => m.status === 'active');
  const completedItems = childMilestones.filter((m) => m.status === 'completed');

  const openAddModal = () => {
    setEditingMilestoneId(null);
    setFormTitle('');
    setFormCategory('survey');
    setFormDate('2026-09-26');
    setFormStatus('planned');
    setFormTargetScore('>= 9.0');
    setFormActualScore('');
    setFormSubjects('Toán, Tiếng Anh');
    setFormDescription('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: AcademicMilestone) => {
    setEditingMilestoneId(item.id);
    setFormTitle(item.title);
    setFormCategory(item.category);
    setFormDate(item.date);
    setFormStatus(item.status);
    setFormTargetScore(item.target_score || '');
    setFormActualScore(item.actual_score || '');
    setFormSubjects((item.subjects || []).join(', '));
    setFormDescription(item.description || '');
    setFormNotes(item.preparation_notes || '');
    setIsModalOpen(true);
  };

  const handleSaveMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    const subjectsArr = formSubjects
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingMilestoneId) {
      storage.updateMilestone(editingMilestoneId, {
        title: formTitle.trim(),
        category: formCategory,
        date: formDate,
        status: formStatus,
        target_score: formTargetScore.trim() || undefined,
        actual_score: formActualScore.trim() || undefined,
        subjects: subjectsArr,
        description: formDescription.trim() || undefined,
        preparation_notes: formNotes.trim() || undefined,
      });
    } else {
      storage.addMilestone({
        child_id: activeChild.id,
        title: formTitle.trim(),
        category: formCategory,
        date: formDate,
        status: formStatus,
        target_score: formTargetScore.trim() || undefined,
        actual_score: formActualScore.trim() || undefined,
        subjects: subjectsArr,
        description: formDescription.trim() || undefined,
        preparation_notes: formNotes.trim() || undefined,
      });
    }

    setMilestones(storage.getMilestones());
    setIsModalOpen(false);
  };

  const handleDeleteMilestone = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá cột mốc này?')) {
      storage.deleteMilestone(id);
      setMilestones(storage.getMilestones());
    }
  };

  const handleMoveStatus = (id: string, newStatus: MilestoneStatus) => {
    storage.updateMilestone(id, { status: newStatus });
    setMilestones(storage.getMilestones());
  };

  // Helper to calculate D-Day countdown relative to 2026-09-21
  const getDDay = (targetDate: string) => {
    const today = new Date('2026-09-21');
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { label: 'HÔM NAY', isUrgent: true };
    if (diffDays > 0) return { label: `D-${diffDays} ngày`, isUrgent: diffDays <= 7 };
    return { label: `Đã qua ${Math.abs(diffDays)} ngày`, isUrgent: false };
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1.5">
            <Target className="w-3.5 h-3.5" />
            <span>Project Management for Learning Milestones</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <span>Cột Mốc & Lộ Trình Kỳ Thi — {formatChildDisplayName(activeChild)}</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Theo dõi kế hoạch thi cử, các kỳ khảo sát năng lực và mục tiêu học tập theo lộ trình năm học 2026–2027
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-app-card border border-app-border rounded-xl p-1 shadow-theme-sm">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'kanban'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('roadmap')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'roadmap'
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-content-secondary hover:text-content-primary'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Timeline Roadmap</span>
            </button>
          </div>

          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm cột mốc mới
          </Button>
        </div>
      </div>

      {/* Today Marker Status Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-primary text-white p-4 rounded-2xl shadow-theme-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-bold">
            📍
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white/80 uppercase tracking-wider">
              Vị trí học tập hiện tại
            </div>
            <div className="text-base font-extrabold flex items-center gap-2">
              <span>Thứ 2, ngày 21/09/2026</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-amber-950 font-black">
                Giai đoạn khởi động Học kỳ 1
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="text-right">
            <div className="text-white/80 text-[11px]">Cột mốc tiếp theo gần nhất:</div>
            <div className="font-extrabold text-white text-sm">
              Kiểm tra Chuyên đề Tháng 9 (26/09)
            </div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md font-black text-amber-300">
            D-5 ngày
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap items-center gap-1.5 pb-1">
        <span className="text-xs font-bold text-content-muted mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Lọc:
        </span>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-theme-sm'
              : 'bg-app-card border border-app-border text-content-secondary hover:border-primary/40'
          }`}
        >
          Tất cả ({childMilestones.length})
        </button>
        {Object.entries(CATEGORY_MAP).map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedCategory === key
                ? 'bg-primary text-primary-foreground shadow-theme-sm'
                : 'bg-app-card border border-app-border text-content-secondary hover:border-primary/40'
            }`}
          >
            <span>{meta.icon}</span>
            <span>{meta.label}</span>
          </button>
        ))}
      </div>

      {/* VIEW 1: KANBAN BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
          {/* Column 1: SẮP TỚI / KẾ HOẠCH */}
          <div className="space-y-3 bg-app-bg/50 p-3.5 rounded-2xl border border-app-border/80 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-extrabold text-sm text-content-primary">📋 Sắp Tới / Lên Kế Hoạch</h3>
              </div>
              <Badge variant="outline" size="sm">
                {plannedItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {plannedItems.map((item) => renderMilestoneCard(item))}
              {plannedItems.length === 0 && (
                <div className="py-12 text-center text-xs text-content-muted">Chưa có cột mốc kế hoạch</div>
              )}
            </div>
          </div>

          {/* Column 2: ĐANG DIỄN RA TRONG THÁNG */}
          <div className="space-y-3 bg-amber-50/30 dark:bg-amber-950/10 p-3.5 rounded-2xl border border-amber-200/60 dark:border-amber-900/30 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <h3 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                  🔥 Đang Diễn Ra Trong Tháng
                </h3>
              </div>
              <Badge variant="warning" size="sm">
                {activeItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {activeItems.map((item) => renderMilestoneCard(item))}
              {activeItems.length === 0 && (
                <div className="py-12 text-center text-xs text-content-muted">Tháng này chưa có kỳ thi đang mở</div>
              )}
            </div>
          </div>

          {/* Column 3: ĐÃ HOÀN THÀNH & ĐÃ CÓ ĐIỂM */}
          <div className="space-y-3 bg-emerald-50/30 dark:bg-emerald-950/10 p-3.5 rounded-2xl border border-emerald-200/60 dark:border-emerald-900/30 min-h-[500px]">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-200 dark:border-emerald-900/40">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-extrabold text-sm text-emerald-900 dark:text-emerald-200">
                  ✅ Đã Hoàn Thành & Đã Có Điểm
                </h3>
              </div>
              <Badge variant="success" size="sm">
                {completedItems.length}
              </Badge>
            </div>

            <div className="space-y-3">
              {completedItems.map((item) => renderMilestoneCard(item))}
              {completedItems.length === 0 && (
                <div className="py-12 text-center text-xs text-content-muted">Chưa có kết quả hoàn thành</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: TIMELINE ROADMAP (PROJECT OVERVIEW) */}
      {viewMode === 'roadmap' && (
        <Card className="p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-app-border pb-3">
            <div>
              <h3 className="font-extrabold text-base text-content-primary flex items-center gap-2">
                <Compass className="w-5 h-5 text-primary" />
                <span>Lộ Trình Học Tập & Khảo Sát Năm Học 2026–2027</span>
              </h3>
              <p className="text-xs text-content-muted mt-0.5">
                Các mốc thi cử theo trình tự thời gian từ khai giảng đến tổng kết năm học
              </p>
            </div>
            <div className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-xl">
              <span>📍 Hiện tại: Tháng 9/2026</span>
            </div>
          </div>

          {/* Chronological Timeline Track */}
          <div className="relative pl-6 sm:pl-8 border-l-2 border-dashed border-primary/40 space-y-8 my-4">
            {childMilestones.map((item, idx) => {
              const dday = getDDay(item.date);
              const catMeta = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;
              const isPast = item.status === 'completed' || dday.label.startsWith('Đã qua');
              const isCurrent = item.status === 'active' || dday.label === 'HÔM NAY' || dday.label.startsWith('D-');

              return (
                <div key={item.id} className="relative group">
                  {/* Pin Dot on Timeline */}
                  <div
                    className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 shadow-sm transition-transform group-hover:scale-110 ${
                      item.status === 'completed'
                        ? 'bg-emerald-500 border-white text-white'
                        : item.status === 'active'
                        ? 'bg-amber-500 border-white text-white ring-4 ring-amber-300/40 animate-pulse'
                        : 'bg-white dark:bg-slate-900 border-primary text-primary'
                    }`}
                  >
                    {item.status === 'completed' ? '✓' : idx + 1}
                  </div>

                  {/* Milestone Card on Timeline */}
                  <div className="bg-app-card border border-app-border hover:border-primary/50 rounded-2xl p-4 shadow-theme-sm transition-all group-hover:shadow-theme-md">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-app-subtle">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{catMeta.icon}</span>
                        <div>
                          <h4 className="font-extrabold text-sm text-content-primary">{item.title}</h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.color}`}>
                            {catMeta.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-content-secondary flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-primary" />
                          {item.date.split('-').reverse().join('/')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                            dday.isUrgent
                              ? 'bg-amber-500 text-white animate-pulse'
                              : 'bg-app-bg text-content-muted border border-app-border'
                          }`}
                        >
                          {dday.label}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-xs">
                      <div>
                        <span className="text-[11px] text-content-muted block">Mục tiêu:</span>
                        <span className="font-bold text-primary">{item.target_score || 'Chưa đặt mục tiêu'}</span>
                      </div>
                      {item.actual_score && (
                        <div>
                          <span className="text-[11px] text-content-muted block">Điểm thực tế:</span>
                          <span className="font-black text-emerald-600 text-sm">{item.actual_score}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[11px] text-content-muted block">Môn thi:</span>
                        <span className="font-semibold text-content-secondary">
                          {(item.subjects || []).join(', ') || 'Toàn diện'}
                        </span>
                      </div>
                    </div>

                    {item.preparation_notes && (
                      <div className="mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-content-secondary">
                        💡 <strong>Lưu ý ôn luyện:</strong> {item.preparation_notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ADD / EDIT MILESTONE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{editingMilestoneId ? 'Chỉnh Sửa Cột Mốc Kỳ Thi' : 'Thêm Cột Mốc Kỳ Thi Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMilestone} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên kỳ thi / Cột mốc *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Thi Giữa Học Kỳ 1, Khảo sát Toán bồi dưỡng..."
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Phân loại cột mốc</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as MilestoneCategory)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="survey">Thi Khảo sát đầu kỳ/tháng</option>
                    <option value="midterm">Thi Giữa học kỳ (Midterm)</option>
                    <option value="final">Thi Cuối học kỳ (Final)</option>
                    <option value="olympic">Học sinh giỏi / Olympic</option>
                    <option value="certificate">Chứng chỉ tiếng Anh / Năng khiếu</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Trạng thái tiến độ</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MilestoneStatus)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="planned">📋 Sắp tới / Lên kế hoạch</option>
                    <option value="active">🔥 Đang diễn ra trong tháng</option>
                    <option value="completed">✅ Đã hoàn thành & Có điểm</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ngày thi / Cột mốc *</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Mục tiêu điểm số</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: >= 9.0 hoặc Giải Ba"
                    value={formTargetScore}
                    onChange={(e) => setFormTargetScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Điểm thực tế (nếu đã thi)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: 9.2"
                    value={formActualScore}
                    onChange={(e) => setFormActualScore(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Các môn thi (cách nhau dấu phẩy)</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Toán, Ngữ văn, Tiếng Anh"
                    value={formSubjects}
                    onChange={(e) => setFormSubjects(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Ghi chú kế hoạch & Lưu ý ôn tập</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cần tập trung ôn kỹ hình học chương 1 và từ vựng Unit 3..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingMilestoneId ? 'Cập nhật cột mốc' : 'Tạo cột mốc'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // Card renderer for Kanban
  function renderMilestoneCard(item: AcademicMilestone) {
    const dday = getDDay(item.date);
    const catMeta = CATEGORY_MAP[item.category] || CATEGORY_MAP.other;

    return (
      <Card
        key={item.id}
        className="p-4 space-y-3 bg-app-surface border border-app-border hover:shadow-theme-md transition-all group"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catMeta.color} inline-block`}>
              {catMeta.icon} {catMeta.label}
            </span>
            <h4 className="font-bold text-sm text-content-primary leading-tight">{item.title}</h4>
          </div>

          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openEditModal(item)}
              className="p-1 text-content-muted hover:text-primary rounded hover:bg-black/5"
              title="Chỉnh sửa"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteMilestone(item.id)}
              className="p-1 text-content-muted hover:text-red-500 rounded hover:bg-black/5"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Date & D-Day */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-app-subtle">
          <div className="flex items-center gap-1.5 text-content-secondary font-mono">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{item.date.split('-').reverse().join('/')}</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
              dday.isUrgent
                ? 'bg-amber-500 text-white animate-pulse'
                : 'bg-app-bg text-content-muted border border-app-border'
            }`}
          >
            {dday.label}
          </span>
        </div>

        {/* Targets & Subjects */}
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
            <div className="text-[11px] text-content-secondary truncate pt-1 border-t border-app-subtle">
              📚 {item.subjects.join(', ')}
            </div>
          )}
        </div>

        {/* Quick Move Status Buttons */}
        <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
          {item.status !== 'planned' && (
            <button
              onClick={() => handleMoveStatus(item.id, 'planned')}
              className="text-content-muted hover:text-primary px-1.5 py-0.5 rounded hover:bg-black/5"
              title="Chuyển về Sắp tới"
            >
              ← Kế hoạch
            </button>
          )}
          {item.status !== 'active' && (
            <button
              onClick={() => handleMoveStatus(item.id, 'active')}
              className="text-amber-600 hover:text-amber-700 font-bold px-1.5 py-0.5 rounded hover:bg-amber-50"
              title="Đưa vào Tháng này"
            >
              🔥 Tháng này
            </button>
          )}
          {item.status !== 'completed' && (
            <button
              onClick={() => handleMoveStatus(item.id, 'completed')}
              className="text-emerald-600 hover:text-emerald-700 font-bold px-1.5 py-0.5 rounded hover:bg-emerald-50 ml-auto"
              title="Đánh dấu đã hoàn thành"
            >
              ✓ Hoàn thành
            </button>
          )}
        </div>
      </Card>
    );
  }
};
