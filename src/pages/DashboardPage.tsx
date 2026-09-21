import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { useScheduleDate } from '@/context/DateContext';
import { storage } from '@/services/storage';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { MascotBoy } from '@/design-system/illustrations/MascotBoy';
import { MascotGirl } from '@/design-system/illustrations/MascotGirl';
import { BookStack } from '@/design-system/illustrations/BookStack';
import {
  Sun, Cloud, Moon, Calendar as CalendarIcon, ArrowRight, Sparkles, Bell,
  BookMarked, Plus, Check, Trash2, ClipboardList, X, AlertCircle,
  MessageSquareQuote, CheckCheck, History, Filter, UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSubjectMeta } from '@/design-system/tokens/colors';
import { format, addDays, parseISO } from 'date-fns';
import { getLunarDateInfo } from '@/utils/lunarCalendar';
import { HomeworkTask, DailyTeacherComment, TeacherContact } from '@/domain/types';

const SUBJECT_OPTIONS = [
  'Toán', 'Ngữ văn', 'Tiếng Anh', 'Khoa học', 'Lịch sử', 'Địa lý',
  'Vật lý', 'Hóa học', 'Sinh học', 'Tin học', 'Thể dục', 'Âm nhạc', 'Mỹ thuật', 'Khác',
];

const WEEKDAY_LABELS: Record<number, string> = {
  2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5',
  6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật',
};

export const DashboardPage: React.FC = () => {
  const { activeChild } = useChild();
  const { selectedDate, goToNextDay, goToPrevDay, goToToday } = useScheduleDate();

  // Homework tasks state
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(() =>
    storage.getHomeworkTasks()
  );
  const [isAddHWOpen, setIsAddHWOpen] = useState(false);
  const [hwSubject, setHwSubject] = useState('Toán');
  const [hwDesc, setHwDesc] = useState('');
  const [hwDueDate, setHwDueDate] = useState(selectedDate);
  const [hwPriority, setHwPriority] = useState<'normal' | 'high'>('normal');

  // Daily teacher comments state
  const [dailyComments, setDailyComments] = useState<DailyTeacherComment[]>(() =>
    storage.getDailyComments()
  );
  const teachers = storage.getTeachers();

  // Modals for Teacher Comments
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form state for adding comment
  const [tcTeacherId, setTcTeacherId] = useState('');
  const [tcTeacherName, setTcTeacherName] = useState('Cô Trần Thu Hà');
  const [tcTeacherRole, setTcTeacherRole] = useState<'homeroom' | 'subject' | 'tutor'>('homeroom');
  const [tcSourceType, setTcSourceType] = useState<'school' | 'extra'>('school');
  const [tcSubject, setTcSubject] = useState('GVCN & Ngữ văn');
  const [tcCategory, setTcCategory] = useState<DailyTeacherComment['category']>('praise');
  const [tcContent, setTcContent] = useState('');
  const [tcScore, setTcScore] = useState<string>('');
  const [tcDate, setTcDate] = useState(selectedDate);

  // Filter state for history modal
  const [historyTeacherFilter, setHistoryTeacherFilter] = useState('all');
  const [historySourceFilter, setHistorySourceFilter] = useState('all');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState('all');

  // Resolve schedule for active child on selected date
  const templates = storage.getTemplates();
  const entries = storage.getEntries();
  const extraSchedules = storage.getExtraSchedules();
  const exceptions = storage.getExceptions();

  const resolved = resolveSchedule(selectedDate, {
    child: activeChild,
    templates,
    entries,
    extraSchedules,
    exceptions,
  });

  // Resolve next 3 days for upcoming panel
  const upcomingDays = [1, 2, 3].map((offset) => {
    const dateStr = format(addDays(parseISO(selectedDate), offset), 'yyyy-MM-dd');
    const dayResolved = resolveSchedule(dateStr, { child: activeChild, templates, entries, extraSchedules, exceptions });
    return { dateStr, resolved: dayResolved };
  });

  // Lunar date info
  const lunarInfo = getLunarDateInfo(selectedDate);
  const lunarLabel = lunarInfo.specialEvent
    ? `${lunarInfo.shortText} ÂL • ${lunarInfo.specialEvent}`
    : lunarInfo.fullText;

  const isGirl = activeChild.avatar_url === 'girl';
  const weekdayLabel = WEEKDAY_LABELS[resolved.weekday] || '';

  // Homework for active child
  const childHomework = homeworkTasks
    .filter((t) => t.child_id === activeChild.id)
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority === 'high' ? -1 : 1;
      if (a.is_completed !== b.is_completed) return a.is_completed ? 1 : -1;
      return (a.due_date || '9999').localeCompare(b.due_date || '9999');
    });

  const pendingCount = childHomework.filter((t) => !t.is_completed).length;

  const handleToggleHW = (id: string) => {
    storage.toggleHomework(id);
    setHomeworkTasks(storage.getHomeworkTasks());
  };

  const handleDeleteHW = (id: string) => {
    storage.deleteHomeworkTask(id);
    setHomeworkTasks(storage.getHomeworkTasks());
  };

  const handleAddHW = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwDesc.trim()) return;
    storage.addHomeworkTask({
      child_id: activeChild.id,
      date: selectedDate,
      due_date: hwDueDate || undefined,
      subject: hwSubject,
      description: hwDesc.trim(),
      is_completed: false,
      priority: hwPriority,
    });
    setHomeworkTasks(storage.getHomeworkTasks());
    setHwDesc('');
    setHwPriority('normal');
    setIsAddHWOpen(false);
  };

  // Teacher comments handlers
  const handleSelectTeacherProfile = (t: TeacherContact) => {
    setTcTeacherId(t.id);
    setTcTeacherName(t.name);
    setTcTeacherRole(t.role);
    setTcSourceType(t.role === 'tutor' ? 'extra' : 'school');
    setTcSubject(t.subject || '');
  };

  const handleSaveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tcContent.trim()) return;

    storage.addDailyComment({
      child_id: activeChild.id,
      date: tcDate,
      teacher_id: tcTeacherId || undefined,
      teacher_name: tcTeacherName.trim(),
      teacher_role: tcTeacherRole,
      source_type: tcSourceType,
      subject: tcSubject.trim() || undefined,
      category: tcCategory,
      content: tcContent.trim(),
      score: tcScore ? parseFloat(tcScore) : undefined,
      parent_acknowledged: true,
    });

    setDailyComments(storage.getDailyComments());
    setIsAddCommentOpen(false);
    setTcContent('');
    setTcScore('');
  };

  const handleToggleCommentAck = (id: string) => {
    storage.toggleDailyCommentAcknowledged(id);
    setDailyComments(storage.getDailyComments());
  };

  const handleDeleteComment = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xoá lời nhắn này?')) {
      storage.deleteDailyComment(id);
      setDailyComments(storage.getDailyComments());
    }
  };

  // Filter comments for active child on selected date
  const childComments = dailyComments.filter((c) => c.child_id === activeChild.id);
  const selectedDateComments = childComments.filter((c) => c.date === selectedDate);
  const schoolComments = selectedDateComments.filter((c) => c.source_type === 'school');
  const extraComments = selectedDateComments.filter((c) => c.source_type === 'extra');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <Card variant="gradient" className="p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thời khóa biểu hôm nay</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-content-primary">
              Chào ngày mới, {activeChild.name}! 👋
            </h2>
            <p className="text-xs md:text-sm text-content-secondary leading-relaxed">
              {activeChild.class_name} • {activeChild.school_name} — Chúc con một ngày học tập thật hứng khởi và nhiều niềm vui!
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link to="/timetable">
                <Button size="sm" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Xem TKB toàn tuần
                </Button>
              </Link>
              <Link to="/performance">
                <Button size="sm" variant="outline">
                  Xem điểm số &amp; mục tiêu
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 z-10">
            {isGirl ? <MascotGirl size={120} /> : <MascotBoy size={120} />}
            <BookStack size={90} />
          </div>
        </div>
      </Card>

      {/* Date Navigation Bar with Lunar Date */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-app-card p-3 rounded-theme-md border border-app-border shadow-theme-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-primary" />
            <span className="text-sm font-bold text-content-primary">
              {weekdayLabel}, ngày {selectedDate.split('-').reverse().join('/')}
            </span>
            {resolved.timetableTemplate && (
              <Badge variant="primary" size="sm">
                {resolved.timetableTemplate.name}
              </Badge>
            )}
          </div>
          {/* Lunar date pill */}
          <div className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
            lunarInfo.isFirstDay || lunarInfo.isFullMoon
              ? 'bg-red-50 text-red-600 border-red-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
          }`}>
            <span>🌙</span>
            <span>{lunarLabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={goToPrevDay}>◀ Ngày trước</Button>
          <Button size="sm" variant="soft" onClick={goToToday}>Hôm nay</Button>
          <Button size="sm" variant="outline" onClick={goToNextDay}>Ngày sau ▶</Button>
        </div>
      </div>

      {/* Daily Schedule Columns: Sáng, Chiều, Tối */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Morning */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Sun className="w-5 h-5" /><span>BUỔI SÁNG</span>
            </div>
            <span className="text-xs text-content-muted">7:00 – 11:30</span>
          </div>
          {resolved.morning.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">Không có tiết học buổi sáng</div>
          ) : (
            <div className="space-y-2">
              {resolved.morning.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div key={item.id} className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}>
                    <div>
                      <div className={`text-xs font-bold ${meta.textClass}`}>{item.period ? `Tiết ${item.period}: ` : ''}{item.title}</div>
                      {item.subtitle && <div className="text-[11px] text-content-secondary mt-0.5">{item.subtitle}</div>}
                      {item.note && <div className="text-[10px] text-amber-700 italic mt-0.5">* {item.note}</div>}
                    </div>
                    <span className="text-[11px] font-mono text-content-secondary font-medium shrink-0">{item.timeDisplay}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Afternoon */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
              <Cloud className="w-5 h-5" /><span>BUỔI CHIỀU</span>
            </div>
            <span className="text-xs text-content-muted">13:30 – 17:00</span>
          </div>
          {resolved.afternoon.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">Không có tiết học buổi chiều</div>
          ) : (
            <div className="space-y-2">
              {resolved.afternoon.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div key={item.id} className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}>
                    <div>
                      <div className={`text-xs font-bold ${meta.textClass}`}>{item.period ? `Tiết ${item.period}: ` : ''}{item.title}</div>
                      {item.subtitle && <div className="text-[11px] text-content-secondary mt-0.5">{item.subtitle}</div>}
                      {item.note && <div className="text-[10px] text-sky-700 italic mt-0.5">* {item.note}</div>}
                    </div>
                    <span className="text-[11px] font-mono text-content-secondary font-medium shrink-0">{item.timeDisplay}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Evening / Extra Classes */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <Moon className="w-5 h-5" /><span>BUỔI TỐI &amp; HỌC THÊM</span>
            </div>
            <span className="text-xs text-content-muted">17:15 – 21:30</span>
          </div>
          {resolved.evening.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">Tối nay bé không có lịch học thêm, được nghỉ ngơi! 🎉</div>
          ) : (
            <div className="space-y-2">
              {resolved.evening.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div key={item.id} className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${meta.textClass}`}>{item.title}</span>
                        <Badge variant="secondary" size="sm">Học thêm</Badge>
                      </div>
                      {item.subtitle && <div className="text-[11px] text-content-secondary mt-0.5">{item.subtitle}</div>}
                      {item.note && <div className="text-[10px] text-purple-700 italic mt-0.5">* {item.note}</div>}
                    </div>
                    <span className="text-[11px] font-mono text-content-secondary font-medium shrink-0">{item.timeDisplay}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* ===== HOMEWORK TRACKER ===== */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-app-border">
          <div className="flex items-center gap-2">
            <BookMarked className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-content-primary">Sổ Dặn Dò &amp; Bài Tập Về Nhà</h3>
            {pendingCount > 0 ? (
              <Badge variant="warning" size="sm">{pendingCount} chưa xong</Badge>
            ) : childHomework.length > 0 ? (
              <Badge variant="success" size="sm">✅ Xong hết rồi!</Badge>
            ) : (
              <Badge variant="outline" size="sm">Chưa có bài</Badge>
            )}
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => { setIsAddHWOpen(true); setHwDueDate(selectedDate); }}
          >
            Ghi bài mới
          </Button>
        </div>

        {/* Add Form */}
        {isAddHWOpen && (
          <form
            onSubmit={handleAddHW}
            className="p-4 rounded-theme-md border border-primary/30 bg-primary/5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                <ClipboardList className="w-4 h-4" /> Thêm bài tập / dặn dò
              </span>
              <button type="button" onClick={() => setIsAddHWOpen(false)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                <X className="w-4 h-4 text-content-muted" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-content-secondary mb-1 block">Môn học</label>
                <select value={hwSubject} onChange={(e) => setHwSubject(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                  {SUBJECT_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-content-secondary mb-1 block">Hạn nộp</label>
                <input type="date" value={hwDueDate} onChange={(e) => setHwDueDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-content-secondary mb-1 block">Nội dung bài tập / dặn dò</label>
              <textarea value={hwDesc} onChange={(e) => setHwDesc(e.target.value)}
                placeholder="VD: Làm bài tập toán trang 45–47, học thuộc bảng công thức..."
                rows={2} required
                className="w-full px-2 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hwPriority === 'high'}
                  onChange={(e) => setHwPriority(e.target.checked ? 'high' : 'normal')}
                  className="w-3.5 h-3.5 accent-orange-500" />
                <span className="text-[11px] font-medium text-orange-600">⚡ Ưu tiên cao</span>
              </label>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setIsAddHWOpen(false)}>Huỷ</Button>
                <Button type="submit" size="sm" variant="primary">Lưu bài tập</Button>
              </div>
            </div>
          </form>
        )}

        {/* Homework List */}
        {childHomework.length === 0 ? (
          <div className="py-8 text-center text-xs text-content-muted space-y-2">
            <div className="text-3xl">📚</div>
            <div>Chưa có bài tập nào được ghi. Nhấn <strong>"Ghi bài mới"</strong> để thêm!</div>
          </div>
        ) : (
          <div className="space-y-2">
            {childHomework.map((task) => {
              const meta = getSubjectMeta(task.subject);
              const isOverdue = task.due_date && task.due_date < selectedDate && !task.is_completed;
              return (
                <div key={task.id} className={`flex items-start gap-3 p-3 rounded-theme-md border transition-all ${
                  task.is_completed
                    ? 'border-emerald-200 bg-emerald-50 opacity-60'
                    : task.priority === 'high'
                    ? 'border-orange-200 bg-orange-50'
                    : 'border-app-border bg-app-surface hover:border-primary/30 hover:bg-primary/5'
                }`}>
                  {/* Checkbox */}
                  <button onClick={() => handleToggleHW(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                      task.is_completed ? 'border-emerald-500 bg-emerald-500' : 'border-app-border hover:border-primary'
                    }`}>
                    {task.is_completed && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${meta.bgClass} ${meta.textClass}`}>
                        {task.subject}
                      </span>
                      {task.priority === 'high' && !task.is_completed && (
                        <span className="text-[10px] font-bold text-orange-600 flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" /> Ưu tiên
                        </span>
                      )}
                      {isOverdue && <span className="text-[10px] font-bold text-red-500">⚠️ Quá hạn</span>}
                      {task.due_date && (
                        <span className="text-[10px] text-content-muted">
                          Hạn: {task.due_date.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${task.is_completed ? 'line-through text-content-muted' : 'text-content-primary'}`}>
                      {task.description}
                    </p>
                  </div>
                  {/* Delete */}
                  <button onClick={() => handleDeleteHW(task.id)}
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 text-content-muted hover:text-red-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ===== TEACHER COMMENTS (daily parallel view) ===== */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-app-border">
          <div className="flex items-center gap-2">
            <MessageSquareQuote className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-bold text-content-primary">Nhận Xét Của Thầy / Cô</h3>
            <Badge variant="outline" size="sm">
              {selectedDate.split('-').reverse().join('/')}
            </Badge>
            {selectedDateComments.length > 0 && (
              <Badge variant="primary" size="sm">{selectedDateComments.length} nhận xét</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<History className="w-3.5 h-3.5" />}
              onClick={() => setIsHistoryOpen(true)}
            >
              Lịch sử
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => { setTcDate(selectedDate); setIsAddCommentOpen(true); }}
            >
              Ghi nhận xét
            </Button>
          </div>
        </div>

        {/* Parallel two-column: School vs Extra */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Column 1: School */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-700 pb-1 border-b border-sky-100">
              <UserCheck className="w-4 h-4" />
              <span>🏫 Trên Lớp (Chính Khóa)</span>
              <span className="ml-auto font-normal text-content-muted">{schoolComments.length} nhận xét</span>
            </div>
            {schoolComments.length === 0 ? (
              <div className="py-5 text-center text-xs text-content-muted italic">Chưa có nhận xét từ giáo viên chính khóa</div>
            ) : (
              schoolComments.map((c) => (
                <CommentCard key={c.id} comment={c}
                  onAck={() => handleToggleCommentAck(c.id)}
                  onDelete={() => handleDeleteComment(c.id)} />
              ))
            )}
          </div>
          {/* Column 2: Extra */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 pb-1 border-b border-purple-100">
              <MessageSquareQuote className="w-4 h-4" />
              <span>📚 Học Thêm / Gia Sư</span>
              <span className="ml-auto font-normal text-content-muted">{extraComments.length} nhận xét</span>
            </div>
            {extraComments.length === 0 ? (
              <div className="py-5 text-center text-xs text-content-muted italic">Chưa có nhận xét từ giáo viên học thêm</div>
            ) : (
              extraComments.map((c) => (
                <CommentCard key={c.id} comment={c}
                  onAck={() => handleToggleCommentAck(c.id)}
                  onDelete={() => handleDeleteComment(c.id)} />
              ))
            )}
          </div>
        </div>
      </Card>

      {/* ===== ADD COMMENT MODAL ===== */}
      {isAddCommentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-app-surface rounded-theme-lg shadow-theme-lg border border-app-border w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <div className="flex items-center gap-2 text-primary font-bold">
                <MessageSquareQuote className="w-5 h-5" />
                <span className="text-sm">Ghi nhận xét của thầy / cô</span>
              </div>
              <button onClick={() => setIsAddCommentOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                <X className="w-4 h-4 text-content-muted" />
              </button>
            </div>
            <form onSubmit={handleSaveComment} className="p-4 space-y-4">
              {/* Quick-select teacher profile */}
              <div>
                <label className="text-[11px] font-bold text-content-secondary mb-1.5 block">
                  Chọn nhanh hồ sơ giáo viên
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                  {teachers.map((t) => (
                    <button key={t.id} type="button"
                      onClick={() => handleSelectTeacherProfile(t)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all ${
                        tcTeacherId === t.id
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-app-surface border-app-border text-content-secondary hover:border-primary/50 hover:bg-primary/5'
                      }`}>
                      {t.role === 'tutor' ? '📚' : t.role === 'homeroom' ? '🏫' : '📖'} {t.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teacher name & source type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Tên giáo viên</label>
                  <input value={tcTeacherName} onChange={(e) => setTcTeacherName(e.target.value)}
                    placeholder="Cô Nguyễn Thị A"
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Loại</label>
                  <select value={tcSourceType} onChange={(e) => setTcSourceType(e.target.value as 'school' | 'extra')}
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="school">🏫 Chính khóa</option>
                    <option value="extra">📚 Học thêm / GS</option>
                  </select>
                </div>
              </div>

              {/* Subject & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Môn / vai trò</label>
                  <input value={tcSubject} onChange={(e) => setTcSubject(e.target.value)}
                    placeholder="GVCN, Toán, Tiếng Anh..."
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Ngày</label>
                  <input type="date" value={tcDate} onChange={(e) => setTcDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Category & Score */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Phân loại</label>
                  <select value={tcCategory} onChange={(e) => setTcCategory(e.target.value as DailyTeacherComment['category'])}
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                    <option value="praise">⭐ Khen ngợi</option>
                    <option value="reminder">🔔 Nhắc nhở</option>
                    <option value="homework">📝 Bài tập</option>
                    <option value="behavior">🧠 Thái độ / Hành vi</option>
                    <option value="boarding">🚌 Ăn ở / Bán trú</option>
                    <option value="general">💬 Chung</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-content-secondary mb-1 block">Điểm (nếu có)</label>
                  <input type="number" min="0" max="10" step="0.25"
                    value={tcScore} onChange={(e) => setTcScore(e.target.value)}
                    placeholder="8.5"
                    className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="text-[11px] font-bold text-content-secondary mb-1 block">Nội dung nhận xét *</label>
                <textarea value={tcContent} onChange={(e) => setTcContent(e.target.value)}
                  placeholder="Cô giáo nhận xét hôm nay bé..."
                  rows={3} required
                  className="w-full px-2.5 py-1.5 text-xs border border-app-border rounded-theme-sm bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" size="sm" variant="outline" onClick={() => setIsAddCommentOpen(false)}>Huỷ</Button>
                <Button type="submit" size="sm" variant="primary" icon={<Check className="w-3.5 h-3.5" />}>Lưu nhận xét</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== HISTORY MODAL ===== */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-app-surface rounded-theme-lg shadow-theme-lg border border-app-border w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-app-border flex-shrink-0">
              <div className="flex items-center gap-2 text-primary font-bold">
                <History className="w-5 h-5" />
                <span className="text-sm">Lịch Sử Nhận Xét Của Thầy / Cô</span>
                <Badge variant="primary" size="sm">{childComments.length} tổng</Badge>
              </div>
              <button onClick={() => setIsHistoryOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors">
                <X className="w-4 h-4 text-content-muted" />
              </button>
            </div>
            {/* Filters */}
            <div className="p-3 border-b border-app-border bg-app-surface/50 flex flex-wrap gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-content-muted" />
                <span className="text-[11px] font-bold text-content-secondary">Lọc:</span>
              </div>
              <select value={historySourceFilter} onChange={(e) => setHistorySourceFilter(e.target.value)}
                className="px-2 py-1 text-[11px] border border-app-border rounded-full bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">Tất cả loại</option>
                <option value="school">🏫 Chính khóa</option>
                <option value="extra">📚 Học thêm</option>
              </select>
              <select value={historyTeacherFilter} onChange={(e) => setHistoryTeacherFilter(e.target.value)}
                className="px-2 py-1 text-[11px] border border-app-border rounded-full bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">Tất cả giáo viên</option>
                {[...new Set(childComments.map((c) => c.teacher_name))].map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <select value={historyCategoryFilter} onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="px-2 py-1 text-[11px] border border-app-border rounded-full bg-app-surface text-content-primary focus:outline-none focus:ring-1 focus:ring-primary">
                <option value="all">Tất cả loại NX</option>
                <option value="praise">⭐ Khen ngợi</option>
                <option value="reminder">🔔 Nhắc nhở</option>
                <option value="homework">📝 Bài tập</option>
                <option value="behavior">🧠 Thái độ</option>
                <option value="boarding">🚌 Ăn ở</option>
                <option value="general">💬 Chung</option>
              </select>
            </div>
            {/* Comment list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(() => {
                const filtered = childComments
                  .filter((c) => historySourceFilter === 'all' || c.source_type === historySourceFilter)
                  .filter((c) => historyTeacherFilter === 'all' || c.teacher_name === historyTeacherFilter)
                  .filter((c) => historyCategoryFilter === 'all' || c.category === historyCategoryFilter)
                  .sort((a, b) => b.date.localeCompare(a.date));

                if (filtered.length === 0) {
                  return (
                    <div className="py-16 text-center text-xs text-content-muted space-y-2">
                      <div className="text-4xl">💬</div>
                      <div>Không có nhận xét nào phù hợp bộ lọc</div>
                    </div>
                  );
                }

                // Group by date
                const byDate: Record<string, DailyTeacherComment[]> = {};
                filtered.forEach((c) => {
                  if (!byDate[c.date]) byDate[c.date] = [];
                  byDate[c.date].push(c);
                });

                return Object.entries(byDate).map(([date, comments]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-content-muted uppercase tracking-wide">
                      <span className="px-2 py-0.5 bg-app-bg rounded-full border border-app-border">
                        📅 {date.split('-').reverse().join('/')}
                      </span>
                      <div className="flex-1 h-px bg-app-border" />
                    </div>
                    {comments.map((c) => (
                      <CommentCard key={c.id} comment={c}
                        onAck={() => { storage.toggleDailyCommentAcknowledged(c.id); setDailyComments(storage.getDailyComments()); }}
                        onDelete={() => { if(window.confirm('Xoá nhận xét này?')) { storage.deleteDailyComment(c.id); setDailyComments(storage.getDailyComments()); }}} />
                    ))}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming 3 Days Panel */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-app-border">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-content-primary">3 Ngày Tới</h3>
          <Badge variant="outline" size="sm">Sắp có lịch</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {upcomingDays.map(({ dateStr, resolved: dr }) => {
            const dayLabel = ({
              2: 'Thứ 2', 3: 'Thứ 3', 4: 'Thứ 4', 5: 'Thứ 5',
              6: 'Thứ 6', 7: 'Thứ 7', 8: 'Chủ nhật',
            } as Record<number, string>)[dr.weekday] || '';
            const totalSlots = dr.morning.length + dr.afternoon.length + dr.evening.length;
            const upLunar = getLunarDateInfo(dateStr);
            return (
              <div key={dateStr}
                className="p-3.5 rounded-theme-md border border-app-border bg-app-surface hover:border-primary/50 hover:bg-primary/5 transition-all space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{dayLabel}</span>
                  <span className="text-[11px] font-mono text-content-muted">{dateStr.split('-').reverse().join('/')}</span>
                </div>
                <div className={`text-[10px] font-medium ${upLunar.isFirstDay || upLunar.isFullMoon ? 'text-red-500' : 'text-content-muted'}`}>
                  🌙 {upLunar.shortText}/{upLunar.lunarMonth} ÂL
                  {upLunar.specialEvent && <span className="ml-1 font-bold">• {upLunar.specialEvent}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="flex items-center gap-1 text-amber-700">☀️ {dr.morning.length} tiết</span>
                  <span className="flex items-center gap-1 text-sky-700">☁️ {dr.afternoon.length} tiết</span>
                  {dr.evening.length > 0 && (
                    <span className="flex items-center gap-1 text-purple-700">🌙 {dr.evening.length}</span>
                  )}
                </div>
                {dr.morning[0] && (
                  <div className="text-[11px] text-content-secondary truncate">
                    Đầu ngày: <span className="font-bold text-content-primary">{dr.morning[0].title}</span>
                  </div>
                )}
                {totalSlots === 0 && <div className="text-[11px] text-content-muted italic">Ngày nghỉ 🎉</div>}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

// ─── CommentCard sub-component ─────────────────────────────────────────────

const CATEGORY_META: Record<DailyTeacherComment['category'], { emoji: string; label: string; bg: string; text: string; border: string }> = {
  praise:   { emoji: '⭐', label: 'Khen ngợi',    bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  reminder: { emoji: '🔔', label: 'Nhắc nhở',     bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  homework: { emoji: '📝', label: 'Bài tập',      bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  behavior: { emoji: '🧠', label: 'Thái độ',      bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  boarding: { emoji: '🚌', label: 'Ăn ở/Bán trú', bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200' },
  general:  { emoji: '💬', label: 'Chung',         bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200' },
};

interface CommentCardProps {
  comment: DailyTeacherComment;
  onAck: () => void;
  onDelete: () => void;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment: c, onAck, onDelete }) => {
  const cm = CATEGORY_META[c.category];
  return (
    <div className={`p-3 rounded-theme-md border ${c.parent_acknowledged ? 'border-emerald-200 bg-emerald-50/50' : `${cm.border} ${cm.bg}`} transition-all space-y-2`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${cm.bg} ${cm.text} border ${cm.border}`}>
            {cm.emoji} {cm.label}
          </span>
          <span className="text-xs font-semibold text-content-primary truncate">{c.teacher_name}</span>
          {c.subject && (
            <span className="text-[11px] text-content-muted">· {c.subject}</span>
          )}
          {c.score !== undefined && (
            <span className="ml-auto text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              🎯 {c.score}đ
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={onAck}
            title={c.parent_acknowledged ? 'Bỏ xác nhận' : 'Đánh dấu đã đọc'}
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
              c.parent_acknowledged ? 'text-emerald-600 hover:bg-emerald-100' : 'text-content-muted hover:bg-black/10'
            }`}>
            <CheckCheck className="w-3.5 h-3.5" />
          </button>
          <button onClick={onDelete}
            className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-100 text-content-muted hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      {/* Content */}
      <p className="text-xs leading-relaxed text-content-primary">{c.content}</p>
      {/* Acknowledged badge */}
      {c.parent_acknowledged && (
        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
          <Check className="w-3 h-3" /> Phụ huynh đã đọc
        </div>
      )}
    </div>
  );
};
