import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  BookOpen,
  Plus,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  MapPin,
  CheckCircle2,
  X,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ClipboardCheck,
  Star,
  MessageSquareQuote,
  CheckCheck,
  UserCheck,
  CalendarDays,
  Filter,
  DollarSign,
  Wallet,
  ShieldCheck,
  AlertCircle,
  CreditCard,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import { DAY_HEADER_COLORS } from '@/design-system/tokens/colors';
import { ExtraSchedule, WeekdayNumber, SessionType, ExtraClassSessionLog, MonthlyTuitionPayment } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  academic: { label: 'Văn hóa & Bồi dưỡng', color: 'bg-blue-100 text-blue-800' },
  language: { label: 'Ngoại ngữ & IELTS', color: 'bg-pink-100 text-pink-800' },
  sports: { label: 'Thể thao & Thể chất', color: 'bg-emerald-100 text-emerald-800' },
  arts: { label: 'Nghệ thuật & Âm nhạc', color: 'bg-purple-100 text-purple-800' },
  skills: { label: 'Kỹ năng & Công nghệ', color: 'bg-amber-100 text-amber-800' },
  other: { label: 'Khác', color: 'bg-slate-100 text-slate-800' },
};

function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function getSessionsCountInMonth(yearMonth: string, weekdays: WeekdayNumber[]): number {
  if (!yearMonth || !weekdays || weekdays.length === 0) return 0;
  const [y, m] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 is Sunday
    const vnDay = (day === 0 ? 8 : day + 1) as WeekdayNumber;
    if (weekdays.includes(vnDay)) {
      count++;
    }
  }
  return count;
}

export const ExtraClassesPage: React.FC = () => {
  const { activeChild } = useChild();
  const [extraSchedules, setExtraSchedules] = useState<ExtraSchedule[]>(() => storage.getExtraSchedules());
  const [sessionLogs, setSessionLogs] = useState<ExtraClassSessionLog[]>(() => storage.getSessionLogs());

  // Active Tab: 'classes' | 'journal' | 'tuition'
  const [activeTab, setActiveTab] = useState<'classes' | 'journal' | 'tuition'>('classes');

  // Tuition Management State (Phụ huynh)
  const [tuitionMonth, setTuitionMonth] = useState('2026-09');
  const [tuitionPayments, setTuitionPayments] = useState<MonthlyTuitionPayment[]>(() => storage.getTuitionPayments());
  const [editingFeeScheduleId, setEditingFeeScheduleId] = useState<string | null>(null);
  const [inlineFeeValue, setInlineFeeValue] = useState<number>(150000);

  // Journal Filter State
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [filterClassId, setFilterClassId] = useState('all');

  // Schedule Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Journal Session Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [logScheduleId, setLogScheduleId] = useState('');
  const [logDate, setLogDate] = useState('2026-09-21');
  const [logScore, setLogScore] = useState<number | undefined>(10);
  const [logStatus, setLogStatus] = useState<'attended' | 'absent' | 'makeup'>('attended');
  const [logComment, setLogComment] = useState('');
  const [logParentNote, setLogParentNote] = useState('');

  // Form State for Extra Class
  const [name, setName] = useState('');
  const [category, setCategory] = useState('academic');
  const [weekdays, setWeekdays] = useState<WeekdayNumber[]>([2, 5]);
  const [session, setSession] = useState<SessionType>('evening');
  const [startTime, setStartTime] = useState('19:15');
  const [endTime, setEndTime] = useState('21:15');
  const [feePerSession, setFeePerSession] = useState<number>(150000);
  const [note, setNote] = useState('');

  const childSchedules = extraSchedules.filter((e) => e.child_id === activeChild.id);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory('academic');
    setWeekdays([2, 5]);
    setSession('evening');
    setStartTime('19:15');
    setEndTime('21:15');
    setFeePerSession(150000);
    setNote('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: ExtraSchedule) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category || 'academic');
    setWeekdays(item.weekdays);
    setSession(item.session);
    setStartTime(item.start_time);
    setEndTime(item.end_time);
    setFeePerSession(item.fee_per_session || 150000);
    setNote(item.note || '');
    setIsModalOpen(true);
  };

  const handleToggleWeekday = (w: WeekdayNumber) => {
    setWeekdays((prev) =>
      prev.includes(w) ? prev.filter((item) => item !== w) : [...prev, w].sort()
    );
  };

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || weekdays.length === 0) return;

    if (editingId) {
      storage.updateExtraSchedule(editingId, {
        name: name.trim(),
        category,
        weekdays,
        session,
        start_time: startTime,
        end_time: endTime,
        fee_per_session: feePerSession,
        note: note.trim() || undefined,
      });
    } else {
      storage.addExtraSchedule({
        child_id: activeChild.id,
        name: name.trim(),
        category,
        weekdays,
        session,
        start_time: startTime,
        end_time: endTime,
        fee_per_session: feePerSession,
        note: note.trim() || undefined,
        active: true,
      });
    }

    setExtraSchedules(storage.getExtraSchedules());
    setIsModalOpen(false);
  };

  const handleToggleTuitionPayment = (schedule: ExtraSchedule, attendedCount: number, fee: number) => {
    const existing = tuitionPayments.find(
      (p) => p.child_id === activeChild.id && p.extra_schedule_id === schedule.id && p.month === tuitionMonth
    );
    const newIsPaid = !existing?.is_paid;
    const payment: MonthlyTuitionPayment = {
      id: `${activeChild.id}_${schedule.id}_${tuitionMonth}`,
      child_id: activeChild.id,
      extra_schedule_id: schedule.id,
      month: tuitionMonth,
      attended_count: attendedCount,
      fee_per_session: fee,
      total_amount: attendedCount * fee,
      is_paid: newIsPaid,
      paid_at: newIsPaid ? new Date().toISOString().split('T')[0] : undefined,
    };
    storage.upsertTuitionPayment(payment);
    setTuitionPayments(storage.getTuitionPayments());
  };

  const handleSaveInlineFee = (scheduleId: string) => {
    storage.updateExtraSchedule(scheduleId, { fee_per_session: inlineFeeValue });
    setExtraSchedules(storage.getExtraSchedules());
    setEditingFeeScheduleId(null);
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá lớp học thêm này?')) {
      storage.deleteExtraSchedule(id);
      setExtraSchedules(storage.getExtraSchedules());
    }
  };

  const handleToggleActive = (item: ExtraSchedule) => {
    storage.updateExtraSchedule(item.id, { active: !item.active });
    setExtraSchedules(storage.getExtraSchedules());
  };

  // Journal Handlers
  const openAddLogModal = () => {
    setEditingLogId(null);
    setLogScheduleId(childSchedules[0]?.id || '');
    setLogDate(new Date().toISOString().split('T')[0]);
    setLogScore(10);
    setLogStatus('attended');
    setLogComment('');
    setLogParentNote('');
    setIsLogModalOpen(true);
  };

  const openEditLogModal = (log: ExtraClassSessionLog) => {
    setEditingLogId(log.id);
    setLogScheduleId(log.extra_schedule_id);
    setLogDate(log.date);
    setLogScore(log.score);
    setLogStatus(log.status);
    setLogComment(log.teacher_comment || '');
    setLogParentNote(log.parent_note || '');
    setIsLogModalOpen(true);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logScheduleId) return;

    if (editingLogId) {
      storage.updateSessionLog(editingLogId, {
        extra_schedule_id: logScheduleId,
        date: logDate,
        score: logScore,
        status: logStatus,
        teacher_comment: logComment.trim() || undefined,
        parent_note: logParentNote.trim() || undefined,
      });
    } else {
      storage.addSessionLog({
        child_id: activeChild.id,
        extra_schedule_id: logScheduleId,
        date: logDate,
        score: logScore,
        max_score: 10,
        status: logStatus,
        teacher_comment: logComment.trim() || undefined,
        parent_note: logParentNote.trim() || undefined,
      });
    }
    setSessionLogs(storage.getSessionLogs());
    setIsLogModalOpen(false);
  };

  const handleDeleteLog = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá nhật ký buổi học này?')) {
      storage.deleteSessionLog(id);
      setSessionLogs(storage.getSessionLogs());
    }
  };

  // Filtered session logs for active child
  const childSessionLogs = sessionLogs
    .filter((l) => l.child_id === activeChild.id)
    .filter((l) => !selectedMonth || l.date.startsWith(selectedMonth))
    .filter((l) => filterClassId === 'all' || l.extra_schedule_id === filterClassId)
    .sort((a, b) => b.date.localeCompare(a.date));

  const totalSessions = childSessionLogs.length;
  const attendedCount = childSessionLogs.filter((l) => l.status === 'attended').length;
  const scoredLogs = childSessionLogs.filter((l) => l.score !== undefined);
  const avgScore =
    scoredLogs.length > 0
      ? (scoredLogs.reduce((acc, curr) => acc + (curr.score || 0), 0) / scoredLogs.length).toFixed(1)
      : '—';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Lịch Học Thêm & Sổ Tay Học Phí</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý lịch học ngoại khóa, nhật ký đánh giá và theo dõi học phí hàng tháng cho {formatChildDisplayName(activeChild)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'classes' && (
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
              Thêm lớp học thêm
            </Button>
          )}
          {activeTab === 'journal' && (
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddLogModal}>
              Ghi nhận buổi học
            </Button>
          )}
          {activeTab === 'tuition' && (
            <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
              Cài đặt thêm lớp & Đơn giá
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-app-border pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'classes'
              ? 'bg-primary text-primary-foreground shadow-theme-sm'
              : 'text-content-secondary hover:text-content-primary hover:bg-black/5'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Danh Sách Lớp ({childSchedules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journal')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'journal'
              ? 'bg-primary text-primary-foreground shadow-theme-sm'
              : 'text-content-secondary hover:text-content-primary hover:bg-black/5'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Nhật Ký Từng Buổi & Đánh Giá</span>
        </button>

        <button
          onClick={() => setActiveTab('tuition')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
            activeTab === 'tuition'
              ? 'bg-emerald-600 text-white shadow-theme-sm'
              : 'text-content-secondary hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>💰 Bảng Tính Học Phí Hàng Tháng (Phụ Huynh)</span>
        </button>
      </div>

      {/* TAB 1: CLASSSES LIST */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {childSchedules.map((extra) => {
          const catMeta = CATEGORY_MAP[extra.category] || CATEGORY_MAP.academic;
          return (
            <Card
              key={extra.id}
              className={`p-5 space-y-4 transition-all ${
                extra.active
                  ? 'hover:shadow-theme-md bg-app-surface'
                  : 'opacity-60 bg-app-subtle/30 border-dashed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-content-primary">{extra.name}</h3>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${catMeta.color}`}>
                    {catMeta.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant={extra.active ? 'primary' : 'outline'} size="sm">
                    {extra.session === 'evening'
                      ? 'Buổi tối'
                      : extra.session === 'morning'
                      ? 'Buổi sáng'
                      : 'Buổi chiều'}
                  </Badge>
                  <button
                    onClick={() => handleToggleActive(extra)}
                    className="text-content-muted hover:text-primary transition-colors p-1"
                    title={extra.active ? 'Tạm dừng lớp này' : 'Kích hoạt lại'}
                  >
                    {extra.active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-app-subtle text-xs">
                <div className="flex items-center gap-2 text-content-secondary">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-mono font-bold text-content-primary">
                    {extra.start_time} – {extra.end_time}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-content-secondary">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <div className="flex flex-wrap gap-1">
                    {extra.weekdays.map((w) => (
                      <span
                        key={w}
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                        style={{ backgroundColor: DAY_HEADER_COLORS[w]?.bg || '#2563EB' }}
                      >
                        {DAY_HEADER_COLORS[w]?.label || `T${w}`}
                      </span>
                    ))}
                  </div>
                </div>

                {extra.note && (
                  <div className="p-2 rounded bg-app-bg text-[11px] text-content-secondary italic border border-app-subtle mt-2">
                    * {extra.note}
                  </div>
                )}
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-subtle">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => openEditModal(extra)}
                >
                  Sửa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => handleDeleteClass(extra.id)}
                >
                  Xoá
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {childSchedules.length === 0 && (
        <Card className="p-12 text-center space-y-3">
          <div className="text-5xl">🎨</div>
          <h3 className="text-base font-bold text-content-primary">Chưa có lịch học thêm nào</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Thêm các lớp học bồi dưỡng hoặc rèn luyện kỹ năng ngoài giờ để hệ thống tự động đưa vào Thời khóa biểu và Lịch
            ngày của {activeChild.name}.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm lớp học thêm đầu tiên
          </Button>
        </Card>
      )}
        </div>
      )}

      {/* TAB 2: JOURNAL & MONTHLY EVALUATION */}
      {activeTab === 'journal' && (
        <div className="space-y-5">
          {/* Monthly KPI Summary Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-xl">
                🗓️
              </div>
              <div>
                <div className="text-xs text-content-muted">Số buổi đã học (Tháng {selectedMonth})</div>
                <div className="text-lg font-extrabold text-content-primary">
                  {totalSessions} buổi học
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xl">
                ✅
              </div>
              <div>
                <div className="text-xs text-content-muted">Chuyên cần & Có mặt</div>
                <div className="text-lg font-extrabold text-content-primary">
                  {attendedCount} / {totalSessions} buổi (
                  {totalSessions > 0 ? Math.round((attendedCount / totalSessions) * 100) : 100}%)
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-900/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xl">
                ⭐
              </div>
              <div>
                <div className="text-xs text-content-muted">Điểm kiểm tra trung bình</div>
                <div className="text-lg font-extrabold text-content-primary">
                  {avgScore} / 10
                </div>
              </div>
            </Card>
          </div>

          {/* Filter Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-app-card border border-app-border">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="font-bold text-content-primary flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-primary" />
                Lọc nhật ký:
              </span>

              {/* Month Selector */}
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-app-border bg-app-bg text-content-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              />

              {/* Class Filter */}
              <select
                value={filterClassId}
                onChange={(e) => setFilterClassId(e.target.value)}
                className="px-2.5 py-1 rounded-lg border border-app-border bg-app-bg text-content-primary font-medium focus:outline-none focus:ring-1 focus:ring-primary text-xs"
              >
                <option value="all">Tất cả lớp học thêm</option>
                {childSchedules.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <Button variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={openAddLogModal}>
              Ghi nhận buổi học
            </Button>
          </div>

          {/* Session Logs Timeline */}
          <div className="space-y-3">
            {childSessionLogs.map((log) => {
              const matchedClass = extraSchedules.find((c) => c.id === log.extra_schedule_id);
              const catMeta = matchedClass ? CATEGORY_MAP[matchedClass.category] : CATEGORY_MAP.academic;

              return (
                <Card key={log.id} className="p-4 space-y-3 border border-app-border hover:shadow-theme-sm transition-all">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        📝
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-content-primary">
                            {matchedClass?.name || 'Buổi học thêm'}
                          </h4>
                          {catMeta && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${catMeta.color}`}>
                              {catMeta.label}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-content-muted flex items-center gap-2 mt-0.5">
                          <span className="font-mono">{log.date.split('-').reverse().join('/')}</span>
                          {matchedClass && (
                            <span>
                              • {matchedClass.start_time} – {matchedClass.end_time}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Attendance Badge */}
                      <Badge
                        variant={
                          log.status === 'attended'
                            ? 'success'
                            : log.status === 'makeup'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {log.status === 'attended'
                          ? 'Có mặt'
                          : log.status === 'makeup'
                          ? 'Học bù'
                          : 'Vắng mặt'}
                      </Badge>

                      {/* Score Badge */}
                      {log.score !== undefined && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-extrabold text-xs flex items-center gap-1 border border-amber-300 dark:border-amber-800">
                          ⭐ {log.score} / {log.max_score || 10}
                        </span>
                      )}

                      <button
                        onClick={() => openEditLogModal(log)}
                        className="p-1 text-content-muted hover:text-primary rounded"
                        title="Chỉnh sửa nhật ký"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="p-1 text-content-muted hover:text-rose-500 rounded"
                        title="Xoá nhật ký này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Teacher Feedback / Comments Box */}
                  {log.teacher_comment && (
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-950 dark:text-blue-200 flex items-start gap-2">
                      <MessageSquareQuote className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold text-primary">Lời phê của Thầy/Cô:</strong>{' '}
                        <span>"{log.teacher_comment}"</span>
                      </div>
                    </div>
                  )}

                  {/* Parent Note */}
                  {log.parent_note && (
                    <div className="text-[11px] text-content-muted italic pl-2 border-l-2 border-primary/30">
                      Ghi chú phụ huynh: {log.parent_note}
                    </div>
                  )}
                </Card>
              );
            })}

            {childSessionLogs.length === 0 && (
              <Card className="p-8 text-center space-y-2">
                <div className="text-4xl">📖</div>
                <h4 className="text-sm font-bold text-content-primary">
                  Chưa có nhật ký buổi học nào trong tháng {selectedMonth}
                </h4>
                <p className="text-xs text-content-muted">
                  Bấm nút "Ghi nhận buổi học" để lưu điểm số và lời phê của thầy cô sau mỗi buổi học.
                </p>
                <Button variant="outline" size="sm" onClick={openAddLogModal}>
                  Ghi nhận buổi học đầu tiên
                </Button>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TUITION BILLING MANAGEMENT (PHỤ HUYNH) */}
      {activeTab === 'tuition' && (
        <div className="space-y-5">
          {/* Privacy Security Notice */}
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3.5 shadow-theme-sm">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <div className="font-extrabold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-2">
                <span>Khu Vực Quản Lý Học Phí Của Phụ Huynh</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 font-bold">
                  Bảo mật tài chính
                </span>
              </div>
              <p className="text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                Bảng tính này là <strong>nơi DUY NHẤT</strong> hiển thị số tiền học phí để cha mẹ kiểm tra số buổi thực tế và thanh toán cho các thầy cô. Toàn bộ thông tin tiền bạc được ẩn hoàn toàn khỏi Thời khóa biểu học tập của các con.
              </p>
            </div>
          </div>

          {/* Month Selector and Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-app-card p-4 rounded-2xl border border-app-border shadow-theme-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-content-muted">Kỳ tính học phí</div>
                <div className="text-sm font-extrabold text-content-primary">
                  Tháng {tuitionMonth.split('-').reverse().join('/')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-content-secondary">Chọn tháng:</span>
              <input
                type="month"
                value={tuitionMonth}
                onChange={(e) => setTuitionMonth(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-app-border bg-app-bg text-content-primary text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Monthly KPI Overview Cards */}
          {(() => {
            const classSummaries = childSchedules.map((extra) => {
              const sessionsCount = getSessionsCountInMonth(tuitionMonth, extra.weekdays);
              const fee = extra.fee_per_session || 150000;
              const payment = tuitionPayments.find(
                (p) => p.child_id === activeChild.id && p.extra_schedule_id === extra.id && p.month === tuitionMonth
              );
              const isPaid = payment?.is_paid || false;
              const totalFee = sessionsCount * fee;
              return { extra, sessionsCount, fee, isPaid, totalFee, payment };
            });

            const totalSessionsSum = classSummaries.reduce((acc, c) => acc + c.sessionsCount, 0);
            const totalTuitionSum = classSummaries.reduce((acc, c) => acc + c.totalFee, 0);
            const paidTuitionSum = classSummaries.filter((c) => c.isPaid).reduce((acc, c) => acc + c.totalFee, 0);
            const remainingTuitionSum = totalTuitionSum - paidTuitionSum;

            return (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 border-blue-200 dark:border-blue-900/40">
                    <div className="text-xs text-content-muted">Tổng số buổi trong tháng</div>
                    <div className="text-2xl font-black text-content-primary mt-1">
                      {totalSessionsSum} <span className="text-sm font-normal text-content-muted">buổi</span>
                    </div>
                    <div className="text-[10px] text-content-secondary mt-1">
                      Tính theo lịch cố định các thứ trong tuần
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/20 border-purple-200 dark:border-purple-900/40">
                    <div className="text-xs text-content-muted">Tổng học phí cần thanh toán</div>
                    <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                      {formatVND(totalTuitionSum)}
                    </div>
                    <div className="text-[10px] text-content-secondary mt-1">
                      {childSchedules.length} lớp học thêm
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-900/40">
                    <div className="text-xs text-content-muted">Đã thanh toán</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                      {formatVND(paidTuitionSum)}
                    </div>
                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                      {classSummaries.filter((c) => c.isPaid).length} / {childSchedules.length} lớp đã chuyển
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 border-amber-200 dark:border-amber-900/40">
                    <div className="text-xs text-content-muted">Còn lại cần chuyển</div>
                    <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                      {formatVND(remainingTuitionSum)}
                    </div>
                    <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-semibold">
                      {classSummaries.filter((c) => !c.isPaid).length} lớp đang chờ nộp
                    </div>
                  </Card>
                </div>

                {/* Detailed Tuition Per Class */}
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-content-primary flex items-center justify-between">
                    <span>Chi Tiết Từng Lớp Học Thêm ({childSchedules.length})</span>
                    <span className="text-xs font-normal text-content-muted">
                      Nhấn vào nút trạng thái để đánh dấu đã chuyển khoản
                    </span>
                  </h3>

                  <div className="grid grid-cols-1 gap-3.5">
                    {classSummaries.map(({ extra, sessionsCount, fee, isPaid, totalFee, payment }) => {
                      const isEditingFee = editingFeeScheduleId === extra.id;
                      return (
                        <Card
                          key={extra.id}
                          className={`p-4 transition-all border-2 ${
                            isPaid
                              ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10'
                              : 'border-app-border hover:border-amber-400/60 bg-app-surface'
                          }`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-content-primary">{extra.name}</h4>
                                <Badge variant={isPaid ? 'primary' : 'outline'} size="sm">
                                  {isPaid ? 'Đã đóng học phí' : 'Chờ thanh toán'}
                                </Badge>
                              </div>
                              <div className="text-xs text-content-secondary flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-primary">{extra.note || 'Lớp học thêm'}</span>
                                <span>•</span>
                                <span className="font-mono">
                                  {extra.start_time} – {extra.end_time}
                                </span>
                                <span>•</span>
                                <div className="flex gap-1">
                                  {extra.weekdays.map((w) => (
                                    <span
                                      key={w}
                                      className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white"
                                      style={{ backgroundColor: DAY_HEADER_COLORS[w]?.bg || '#2563EB' }}
                                    >
                                      {DAY_HEADER_COLORS[w]?.label || `T${w}`}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Calculation Breakdown */}
                            <div className="flex flex-wrap items-center gap-4 text-xs">
                              {/* Sessions in month */}
                              <div className="text-center px-3 py-1.5 rounded-xl bg-app-bg border border-app-border">
                                <div className="text-[10px] text-content-muted">Số buổi tháng</div>
                                <div className="font-extrabold text-sm text-content-primary font-mono">
                                  {sessionsCount} buổi
                                </div>
                              </div>

                              <div className="text-content-muted font-bold">×</div>

                              {/* Per-class fee setup */}
                              <div className="text-center px-3 py-1.5 rounded-xl bg-app-bg border border-app-border min-w-[130px]">
                                <div className="text-[10px] text-content-muted flex items-center justify-center gap-1">
                                  <span>Đơn giá lớp</span>
                                  {!isEditingFee && (
                                    <button
                                      onClick={() => {
                                        setEditingFeeScheduleId(extra.id);
                                        setInlineFeeValue(fee);
                                      }}
                                      className="text-primary hover:underline"
                                      title="Cài đặt lại số tiền lớp này"
                                    >
                                      <Edit2 className="w-3 h-3 inline" />
                                    </button>
                                  )}
                                </div>
                                {isEditingFee ? (
                                  <div className="flex items-center gap-1 mt-1">
                                    <input
                                      type="number"
                                      step={10000}
                                      value={inlineFeeValue}
                                      onChange={(e) => setInlineFeeValue(Number(e.target.value) || 0)}
                                      className="w-20 px-1 py-0.5 text-xs font-mono font-bold rounded border border-primary bg-white dark:bg-slate-900"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleSaveInlineFee(extra.id)}
                                      className="px-1.5 py-0.5 rounded bg-primary text-white text-[10px] font-bold"
                                    >
                                      Lưu
                                    </button>
                                  </div>
                                ) : (
                                  <div className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                                    {formatVND(fee)}
                                  </div>
                                )}
                              </div>

                              <div className="text-content-muted font-bold">=</div>

                              {/* Total for class */}
                              <div className="text-right min-w-[130px]">
                                <div className="text-[10px] text-content-muted">Thành tiền tháng</div>
                                <div className="text-base font-black text-content-primary font-mono">
                                  {formatVND(totalFee)}
                                </div>
                              </div>

                              {/* Toggle Payment Button */}
                              <div className="shrink-0">
                                <button
                                  onClick={() => handleToggleTuitionPayment(extra, sessionsCount, fee)}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-theme-sm ${
                                    isPaid
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-amber-500 text-white hover:bg-amber-600'
                                  }`}
                                >
                                  {isPaid ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      <span>Đã chuyển tiền</span>
                                    </>
                                  ) : (
                                    <>
                                      <Clock className="w-4 h-4" />
                                      <span>Chưa thanh toán</span>
                                    </>
                                  )}
                                </button>
                                {payment?.paid_at && (
                                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 text-center mt-1">
                                    Ngày {payment.paid_at.split('-').reverse().join('/')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      );
                    })}

                    {childSchedules.length === 0 && (
                      <Card className="p-8 text-center space-y-2">
                        <div className="text-4xl">💰</div>
                        <h4 className="text-sm font-bold text-content-primary">Chưa có lớp học thêm nào để tính học phí</h4>
                        <p className="text-xs text-content-muted">
                          Hãy thêm các lớp học thêm ở Tab "Danh Sách Lớp" và cài đặt số tiền học phí cho từng lớp.
                        </p>
                      </Card>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ADD / EDIT SESSION LOG MODAL */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <ClipboardCheck className="w-5 h-5 text-primary" />
                <span>{editingLogId ? 'Chỉnh Sửa Nhật Ký Buổi Học' : 'Ghi Nhận Buổi Học Thêm'}</span>
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Lớp học thêm *</label>
                <select
                  required
                  value={logScheduleId}
                  onChange={(e) => setLogScheduleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">-- Chọn lớp học --</option>
                  {childSchedules.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.start_time} – {c.end_time})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ngày học *</label>
                  <input
                    type="date"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Chuyên cần</label>
                  <select
                    value={logStatus}
                    onChange={(e) => setLogStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="attended">✅ Có mặt đầy đủ</option>
                    <option value="makeup">🔄 Học bù</option>
                    <option value="absent">❌ Vắng mặt</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Điểm kiểm tra buổi học (Thang điểm 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="Ví dụ: 9.5"
                  value={logScore ?? ''}
                  onChange={(e) => setLogScore(e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Lời phê / Nhận xét của Thầy Cô *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ví dụ: Làm bài xuất sắc, nắm chắc phương trình bậc nhất, trình bày sạch sẽ..."
                  value={logComment}
                  onChange={(e) => setLogComment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Ghi chú riêng của phụ huynh (Tùy chọn)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã nộp học phí tháng, dặn dò bé chú ý..."
                  value={logParentNote}
                  onChange={(e) => setLogParentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsLogModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingLogId ? 'Cập nhật' : 'Lưu nhật ký'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CLASS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{editingId ? 'Chỉnh Sửa Lớp Học Thêm' : 'Thêm Lớp Học Thêm Mới'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClass} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên môn / lớp học *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Toán bồi dưỡng, Tiếng Anh giao tiếp..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Phân loại</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="academic">Văn hóa & Bồi dưỡng</option>
                    <option value="language">Ngoại ngữ & IELTS</option>
                    <option value="sports">Thể thao & Bơi lội</option>
                    <option value="arts">Nghệ thuật & Đàn Piano</option>
                    <option value="skills">Kỹ năng & Lập trình</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Buổi trong ngày</label>
                  <select
                    value={session}
                    onChange={(e) => setSession(e.target.value as SessionType)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="evening">Buổi tối</option>
                    <option value="afternoon">Buổi chiều</option>
                    <option value="morning">Buổi sáng</option>
                  </select>
                </div>
              </div>

              {/* Weekday Selection */}
              <div className="space-y-1.5">
                <label className="font-bold text-content-primary">Các ngày học trong tuần *</label>
                <div className="flex flex-wrap gap-1.5">
                  {([2, 3, 4, 5, 6, 7, 8] as WeekdayNumber[]).map((w) => {
                    const isSelected = weekdays.includes(w);
                    const label = w === 8 ? 'CN' : `T${w}`;
                    return (
                      <button
                        type="button"
                        key={w}
                        onClick={() => handleToggleWeekday(w)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-primary text-primary-foreground border-primary shadow-theme-sm'
                            : 'bg-app-bg text-content-secondary border-app-border hover:border-primary/40'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giờ bắt đầu *</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giờ kết thúc *</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Per-Class Tuition Fee Setup */}
              <div className="space-y-1 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Học phí mỗi buổi (VNĐ)</span>
                  </label>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    Chỉ hiển thị cho phụ huynh
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    step={10000}
                    placeholder="Ví dụ: 150000"
                    value={feePerSession}
                    onChange={(e) => setFeePerSession(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 pr-16 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-content-primary font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-content-muted">đ / buổi</span>
                </div>
                <p className="text-[10px] text-content-muted italic">
                  * Hệ thống tự động nhân số buổi thực tế trong tháng theo đơn giá riêng của lớp này để tính tiền cần thanh toán cho thầy cô. Hoàn toàn ẩn khỏi TKB của các con.
                </p>
              </div>

              {/* Note */}
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Ghi chú / Địa điểm / Giáo viên</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Thầy Nam dạy tại Trung tâm, mang sách bài tập..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingId ? 'Cập nhật' : 'Thêm lớp học'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
