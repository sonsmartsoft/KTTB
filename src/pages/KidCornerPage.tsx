import React, { useState, useMemo } from 'react';
import { useChild } from '@/context/ChildContext';
import { useKidMode } from '@/context/KidModeContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Target,
  Flame,
  AlertCircle,
  ShieldAlert,
  LogOut,
  Plus,
  Star,
  CheckSquare,
} from 'lucide-react';
import {
  AcademicMilestone,
  ExamPrepTask,
  HomeworkTask,
} from '@/domain/types';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';
import { formatChildDisplayName } from '@/lib/childNameHelper';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

export const KidCornerPage: React.FC = () => {
  const { activeChild } = useChild();
  const { isKidMode, exitKidMode } = useKidMode();

  const [todayStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [milestones, setMilestones] = useState<AcademicMilestone[]>(() => storage.getMilestones());
  const [prepTasks, setPrepTasks] = useState<ExamPrepTask[]>(() => storage.getExamPrepTasks());
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(() => storage.getHomeworkTasks());

  // Parent exit PIN modal
  const [showExitModal, setShowExitModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Quick add prep task
  const [newPrepTitle, setNewPrepTitle] = useState('');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>('');

  // Daily schedule for today — use pure domain resolver
  const resolved = useMemo(() => {
    const childTemplates = storage.getTemplates().filter((t) => t.child_id === activeChild.id);
    const templateIds = new Set(childTemplates.map((t) => t.id));
    const childEntries = storage.getEntries().filter((e) => templateIds.has(e.timetable_id));
    return resolveSchedule(todayStr, {
      child: activeChild,
      templates: childTemplates,
      entries: childEntries,
      extraSchedules: storage.getExtraSchedules().filter((s) => s.child_id === activeChild.id),
      exceptions: storage.getExceptions().filter((x) => x.child_id === activeChild.id),
    });
  }, [activeChild.id, todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  // Filter child data
  const childMilestones = milestones
    .filter((m) => m.child_id === activeChild.id && m.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));

  // Next upcoming milestone
  const nextMilestone = childMilestones[0];

  // Tasks for next milestone or child
  const relevantPrepTasks = prepTasks.filter(
    (t) => t.child_id === activeChild.id && (!nextMilestone || t.milestone_id === nextMilestone.id)
  );

  const completedPrepCount = relevantPrepTasks.filter((t) => t.is_completed).length;
  const prepProgressPct = relevantPrepTasks.length > 0
    ? Math.round((completedPrepCount / relevantPrepTasks.length) * 100)
    : 0;

  // Child homework tasks
  const childHomework = homeworkTasks.filter((h) => h.child_id === activeChild.id);

  // Achievements
  const achievements = storage.getAchievements().filter((a) => a.child_id === activeChild.id);
  const totalStars = achievements.length;

  // Handlers
  const handleTogglePrep = (taskId: string) => {
    storage.toggleExamPrepTask(taskId);
    setPrepTasks(storage.getExamPrepTasks());
  };

  const handleToggleHomework = (hwId: string) => {
    storage.toggleHomework(hwId);
    setHomeworkTasks(storage.getHomeworkTasks());
  };

  const handleAddPrepTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrepTitle.trim() || !nextMilestone) return;

    storage.addExamPrepTask({
      child_id: activeChild.id,
      milestone_id: selectedMilestoneId || nextMilestone.id,
      title: newPrepTitle.trim(),
      priority: 'high',
      is_completed: false,
    });
    setNewPrepTitle('');
    setPrepTasks(storage.getExamPrepTasks());
  };

  const handleConfirmExit = () => {
    const ok = exitKidMode(pinInput.trim() || undefined);
    if (ok) {
      setShowExitModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Calculate D-Day for next milestone
  const ddayInfo = (() => {
    if (!nextMilestone) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(nextMilestone.date);
    target.setHours(0, 0, 0, 0);
    const diff = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: 'HÔM NAY', isUrgent: true };
    if (diff > 0) return { label: `Còn ${diff} ngày`, isUrgent: diff <= 7 };
    return { label: `Đã diễn ra`, isUrgent: false };
  })();

  // Today schedule items
  const allTodayItems = [
    ...resolved.morning,
    ...resolved.afternoon,
    ...resolved.evening,
  ].filter((item) => !item.isCancelled);

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ── Cheerful Kid Header Banner ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400 p-6 md:p-8 text-white shadow-theme-lg">
        {/* Decorative background shapes */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-white/15 blur-lg pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center text-4xl shadow-theme-md border-2 border-white/40 overflow-hidden bg-white/20 backdrop-blur-sm"
              style={{ backgroundColor: activeChild.color || '#2563EB' }}
            >
              {activeChild.avatar_url?.startsWith('data:') || activeChild.avatar_url?.startsWith('http') ? (
                <img src={activeChild.avatar_url} alt={activeChild.name} className="w-full h-full object-cover" />
              ) : activeChild.avatar_url === 'girl' ? (
                '👧'
              ) : (
                '👦'
              )}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-xs font-black mb-1">
                <span>⭐ Góc học tập & rèn luyện</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight drop-shadow-sm">
                Chào {formatChildDisplayName(activeChild)}! 🚀
              </h1>
              <p className="text-white/90 text-xs md:text-sm font-medium mt-0.5">
                {activeChild.class_name} • Hôm nay là {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Stars pill */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-sm">
              <Star className="w-5 h-5 text-yellow-200 fill-yellow-300 animate-pulse" />
              <div>
                <div className="text-[10px] font-bold text-white/80 uppercase">Sao thưởng</div>
                <div className="text-lg font-black leading-none">{totalStars} ⭐</div>
              </div>
            </div>

            {/* Exit Kid Mode Button */}
            {isKidMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExitModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white border-white/40 text-xs font-bold shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5 mr-1" />
                Về chế độ Ba Mẹ
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Today's Routine & Timetable (1 Col on Desktop) */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <Card className="p-5 space-y-4 border border-app-border shadow-theme-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-content-primary">Lịch học hôm nay</h3>
                  <p className="text-[11px] text-content-muted">Chuẩn bị sách vở và đồ dùng</p>
                </div>
              </div>
              <Badge variant="primary" size="sm">
                {allTodayItems.length} tiết
              </Badge>
            </div>

            {allTodayItems.length === 0 ? (
              <div className="py-8 text-center text-content-muted space-y-1">
                <div className="text-3xl">🎉</div>
                <p className="text-xs font-bold">Hôm nay con được nghỉ học!</p>
                <p className="text-[11px]">Nghỉ ngơi và vui chơi cùng gia đình nhé.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allTodayItems.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      item.isExtra
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                        : 'bg-app-bg border-app-border/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-2.5 h-10 rounded-full shrink-0"
                        style={{ backgroundColor: item.color || '#2563EB' }}
                      />
                      <div>
                        <div className="text-xs font-black text-content-primary flex items-center gap-1.5">
                          <span>{item.title}</span>
                          {item.isExtra && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-bold">
                              Học thêm
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-content-muted flex items-center gap-2 mt-0.5">
                          <span>{item.timeDisplay}</span>
                          {item.room && <span>• Phòng {item.room}</span>}
                        </div>
                      </div>
                    </div>
                    {item.subtitle && (
                      <span className="text-[10px] font-bold text-content-secondary bg-app-card px-2 py-0.5 rounded-md border border-app-border">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Quick Homework Checklist */}
          <Card className="p-5 space-y-4 border border-app-border shadow-theme-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <CheckSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-content-primary">Bài tập về nhà</h3>
                  <p className="text-[11px] text-content-muted">Tick chọn khi con làm xong nhé</p>
                </div>
              </div>
              <Badge variant="success" size="sm">
                {childHomework.filter((h) => h.is_completed).length}/{childHomework.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {childHomework.length === 0 ? (
                <div className="py-6 text-center text-content-muted text-xs">
                  👏 Tuyệt vời, con không còn bài tập nào tồn đọng!
                </div>
              ) : (
                childHomework.map((hw) => (
                  <div
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      hw.is_completed
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/50 text-content-muted line-through opacity-70'
                        : 'bg-app-bg border-app-border hover:border-emerald-400'
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-emerald-600">
                      {hw.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-content-primary">{hw.subject}</div>
                      <div className="text-[11px] text-content-secondary line-clamp-2 mt-0.5">
                        {hw.description}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Middle & Right Column: Exam Prep Countdown & Tasks (2 Cols on Desktop) */}
        <div className="md:col-span-2 space-y-6">
          {/* Upcoming Milestone Countdown Card */}
          {nextMilestone ? (
            <Card className="p-6 border-2 border-primary/30 bg-gradient-to-br from-app-card via-app-card to-primary/5 shadow-theme-md space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black">
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    <span>Kỳ Thi Nước Rút Tiếp Theo</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-content-primary">
                    {nextMilestone.title}
                  </h2>
                  <p className="text-xs text-content-secondary">
                    Ngày thi: <b className="text-content-primary font-mono">{nextMilestone.date.split('-').reverse().join('/')}</b>
                    {nextMilestone.subjects?.length ? ` • Môn: ${nextMilestone.subjects.join(', ')}` : ''}
                  </p>
                </div>

                {ddayInfo && (
                  <div
                    className={`px-4 py-3 rounded-2xl text-center shadow-theme-sm border ${
                      ddayInfo.isUrgent
                        ? 'bg-red-500 text-white border-red-400 animate-pulse'
                        : 'bg-amber-500 text-white border-amber-400'
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase tracking-wider">Đếm ngược</div>
                    <div className="text-2xl font-black">{ddayInfo.label}</div>
                  </div>
                )}
              </div>

              {/* Target Score & Goal */}
              <div className="p-3.5 rounded-2xl bg-app-bg border border-app-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-content-muted font-bold">Mục tiêu của con</div>
                    <div className="text-sm font-black text-primary">
                      {nextMilestone.target_score || 'Đạt điểm tối đa'}
                    </div>
                  </div>
                </div>
                {nextMilestone.preparation_notes && (
                  <div className="text-right text-[11px] text-content-muted italic max-w-xs line-clamp-1">
                    💡 {nextMilestone.preparation_notes}
                  </div>
                )}
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-content-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Tiến độ ôn tập nước rút
                  </span>
                  <span className="text-emerald-600 font-black">
                    {completedPrepCount}/{relevantPrepTasks.length} nhiệm vụ ({prepProgressPct}%)
                  </span>
                </div>
                <div className="h-3 rounded-full bg-app-bg border border-app-subtle overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-500"
                    style={{ width: `${prepProgressPct}%` }}
                  />
                </div>
              </div>

              {/* Checklist Tasks */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-black text-content-primary uppercase tracking-wider">
                  Nhiệm vụ cần ôn tập trước ngày thi:
                </div>

                <div className="space-y-2.5">
                  {relevantPrepTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTogglePrep(task.id)}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3.5 cursor-pointer transition-all ${
                        task.is_completed
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 text-content-muted line-through opacity-75'
                          : 'bg-app-bg border-app-border hover:border-primary/50 shadow-sm'
                      }`}
                    >
                      <button className="mt-0.5 shrink-0 text-emerald-600">
                        {task.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-content-primary">{task.title}</span>
                          {task.priority === 'high' && !task.is_completed && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-black">
                              Ưu tiên cao
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-content-secondary">
                          {task.subject && <span className="font-semibold text-primary">📚 {task.subject}</span>}
                          {task.due_date && <span>📅 Hạn: {task.due_date.split('-').reverse().join('/')}</span>}
                        </div>
                        {task.notes && (
                          <div className="text-[10px] text-content-muted mt-1 italic">
                            💡 {task.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {relevantPrepTasks.length === 0 && (
                    <div className="py-6 text-center text-xs text-content-muted">
                      Chưa có nhiệm vụ ôn tập nào. Con hoặc ba mẹ hãy thêm vào bên dưới nhé!
                    </div>
                  )}
                </div>

                {/* Quick Add Prep Task Form */}
                <form onSubmit={handleAddPrepTask} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Thêm nhiệm vụ ôn tập (VD: Giải đề thi thử số 2, học từ vựng...)"
                    value={newPrepTitle}
                    onChange={(e) => setNewPrepTitle(e.target.value)}
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    Thêm
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="p-8 text-center space-y-2 border border-app-border">
              <div className="text-4xl">🌟</div>
              <h3 className="font-bold text-content-primary">Chưa có kỳ thi nào sắp tới</h3>
              <p className="text-xs text-content-muted">
                Hiện tại không có áp lực thi cử! Hãy tập trung học tốt các tiết học trên lớp nhé.
              </p>
            </Card>
          )}

          {/* Cheerful Achievements Showcase */}
          <Card className="p-5 space-y-4 border border-app-border shadow-theme-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-content-primary">Bảng vàng thành tích của con</h3>
                  <p className="text-[11px] text-content-muted">Những nỗ lực đáng tự hào đã đạt được</p>
                </div>
              </div>
              <Badge variant="outline" size="sm">
                {achievements.length} khen thưởng
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {achievements.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-app-bg border border-app-subtle flex items-center gap-3 hover:border-amber-300 transition-colors"
                >
                  <div className="text-2xl">🏅</div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-black text-content-primary truncate">{item.title}</div>
                    <div className="text-[10px] text-content-muted">
                      {item.date?.split('-').reverse().join('/')} • {item.result || item.level || 'Đạt thành tích'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── Parent Exit PIN Modal ── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-content-primary">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Xác nhận trở lại chế độ Ba Mẹ</h3>
                <p className="text-xs text-content-muted">Bảo vệ riêng tư tài chính & học phí</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-content-secondary">
                Nhập mã PIN ba mẹ (Mặc định: 1234 hoặc bấm xác nhận):
              </label>
              <input
                type="password"
                maxLength={8}
                placeholder="1234"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className="w-full px-3 py-2 text-center text-lg font-mono tracking-widest rounded-xl border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {pinError && (
                <p className="text-[11px] text-red-500 font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Mã PIN không đúng. Vui lòng thử lại!
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-app-border">
              <Button variant="outline" size="sm" onClick={() => setShowExitModal(false)}>
                Ở lại góc của con
              </Button>
              <Button variant="primary" size="sm" onClick={handleConfirmExit}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
