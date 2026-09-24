import React, { useState, useMemo } from 'react';
import { useChild } from '@/context/ChildContext';
import { useKidMode } from '@/context/KidModeContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trophy,
  Target,
  Flame,
  AlertCircle,
  LogOut,
  Plus,
  Star,
  CheckSquare,
  BookOpen,
  Sun,
  Zap,
} from 'lucide-react';
import { AcademicMilestone, ExamPrepTask, HomeworkTask } from '@/domain/types';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';
import { formatChildDisplayName } from '@/lib/childNameHelper';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

/* ─── Gender theme ─────────────────────────────────────────── */
function getTheme(gender?: 'male' | 'female', avatarUrl?: string) {
  // 'girl' avatar_url = con gái nếu chưa set gender
  const isGirl = gender === 'female' || (!gender && avatarUrl === 'girl');
  return isGirl
    ? {
        bgGradient: 'from-fuchsia-400 via-pink-400 to-rose-400',
        accent: 'text-fuchsia-600',
        accentBg: 'bg-fuchsia-100 dark:bg-fuchsia-900/30',
        accentBorder: 'border-fuchsia-300 dark:border-fuchsia-700',
        accentRing: 'ring-fuchsia-400',
        progressBar: 'from-fuchsia-400 to-pink-500',
        cardHighlight: 'border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/20 dark:to-pink-950/20',
        hoverBorder: 'hover:border-fuchsia-400',
        emoji: '🦄',
        greeting: '✨ Góc học tập của công chúa',
        morningColor: '#e879f9',
        afternoonColor: '#fb7185',
        extraColor: '#a78bfa',
        ddayBg: 'bg-fuchsia-500 border-fuchsia-400',
        ddayUrgent: 'bg-rose-500 border-rose-400',
        starClass: 'text-fuchsia-300 fill-fuchsia-200',
        decorEmojis: ['🌸', '🌈', '🦋', '⭐', '💫', '🎀'],
        checkedRow: 'bg-fuchsia-50/60 border-fuchsia-200/50',
      }
    : {
        bgGradient: 'from-blue-500 via-indigo-500 to-violet-500',
        accent: 'text-blue-600',
        accentBg: 'bg-blue-100 dark:bg-blue-900/30',
        accentBorder: 'border-blue-300 dark:border-blue-700',
        accentRing: 'ring-blue-400',
        progressBar: 'from-blue-500 to-indigo-500',
        cardHighlight: 'border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20',
        hoverBorder: 'hover:border-blue-400',
        emoji: '🚀',
        greeting: '⚡ Góc chinh phục của chiến binh',
        morningColor: '#3b82f6',
        afternoonColor: '#6366f1',
        extraColor: '#f59e0b',
        ddayBg: 'bg-blue-500 border-blue-400',
        ddayUrgent: 'bg-red-500 border-red-400',
        starClass: 'text-yellow-300 fill-yellow-200',
        decorEmojis: ['🌙', '⭐', '🪐', '🔭', '💥', '🎮'],
        checkedRow: 'bg-blue-50/60 border-blue-200/50',
      };
}

const SESSION_CFG = {
  morning:   { label: 'Buổi Sáng',  Icon: Sun,   dot: '#f59e0b' },
  afternoon: { label: 'Buổi Chiều', Icon: Clock, dot: '#6366f1' },
  evening:   { label: 'Học Thêm',   Icon: Zap,   dot: '#10b981' },
} as const;

export const KidCornerPage: React.FC = () => {
  const { activeChild } = useChild();
  const { isKidMode, exitKidMode } = useKidMode();
  const theme = useMemo(() => getTheme(activeChild.gender, activeChild.avatar_url), [activeChild.gender, activeChild.avatar_url]);

  const [todayStr] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [milestones, setMilestones] = useState<AcademicMilestone[]>(() => storage.getMilestones());
  const [prepTasks, setPrepTasks] = useState<ExamPrepTask[]>(() => storage.getExamPrepTasks());
  const [homeworkTasks, setHomeworkTasks] = useState<HomeworkTask[]>(() => storage.getHomeworkTasks());

  const [showExitModal, setShowExitModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [newPrepTitle, setNewPrepTitle] = useState('');

  /* resolved schedule */
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild.id, todayStr]);

  const morningItems  = resolved.morning.filter((i) => !i.isCancelled);
  const afternoonItems = resolved.afternoon.filter((i) => !i.isCancelled);
  const eveningItems  = resolved.evening.filter((i) => !i.isCancelled);
  const totalItems = morningItems.length + afternoonItems.length + eveningItems.length;

  /* milestones */
  const childMilestones = milestones
    .filter((m) => m.child_id === activeChild.id && m.status !== 'completed')
    .sort((a, b) => a.date.localeCompare(b.date));
  const nextMilestone = childMilestones[0];

  const relevantPrepTasks = prepTasks.filter(
    (t) => t.child_id === activeChild.id && (!nextMilestone || t.milestone_id === nextMilestone.id)
  );
  const completedPrepCount = relevantPrepTasks.filter((t) => t.is_completed).length;
  const prepPct = relevantPrepTasks.length > 0
    ? Math.round((completedPrepCount / relevantPrepTasks.length) * 100) : 0;

  /* homework */
  const childHw = homeworkTasks.filter((h) => h.child_id === activeChild.id);
  const doneHw  = childHw.filter((h) => h.is_completed).length;

  /* achievements */
  const achievements = storage.getAchievements().filter((a) => a.child_id === activeChild.id);

  /* d-day */
  const ddayInfo = (() => {
    if (!nextMilestone) return null;
    const now = new Date(); now.setHours(0,0,0,0);
    const tgt = new Date(nextMilestone.date); tgt.setHours(0,0,0,0);
    const d = Math.round((tgt.getTime() - now.getTime()) / 86400000);
    if (d === 0) return { label: 'HÔM NAY! 🔥', urgent: true };
    if (d > 0) return { label: `Còn ${d} ngày`, urgent: d <= 7 };
    return { label: 'Đã diễn ra', urgent: false };
  })();

  /* handlers */
  const handleTogglePrep = (id: string) => {
    storage.toggleExamPrepTask(id);
    setPrepTasks(storage.getExamPrepTasks());
  };
  const handleToggleHomework = (id: string) => {
    storage.toggleHomework(id);
    setHomeworkTasks(storage.getHomeworkTasks());
  };
  const handleAddPrepTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrepTitle.trim() || !nextMilestone) return;
    storage.addExamPrepTask({
      child_id: activeChild.id,
      milestone_id: nextMilestone.id,
      title: newPrepTitle.trim(),
      priority: 'high',
      is_completed: false,
    });
    setNewPrepTitle('');
    setPrepTasks(storage.getExamPrepTasks());
  };
  const handleConfirmExit = () => {
    const ok = exitKidMode(pinInput.trim() || undefined);
    if (ok) { setShowExitModal(false); setPinInput(''); setPinError(false); }
    else setPinError(true);
  };

  /* schedule section */
  const renderSection = (
    items: typeof morningItems,
    key: 'morning' | 'afternoon' | 'evening'
  ) => {
    if (items.length === 0) return null;
    const { label, Icon, dot } = SESSION_CFG[key];
    return (
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 px-0.5">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: dot + '25' }}>
            <Icon className="w-2.5 h-2.5" style={{ color: dot }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: dot }}>{label}</span>
          <div className="flex-1 h-px" style={{ backgroundColor: dot + '30' }} />
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: dot }}>
            {items.length} tiết
          </span>
        </div>
        {items.map((item, idx) => (
          <div
            key={item.id || idx}
            className="flex items-center gap-2.5 p-2.5 rounded-2xl border border-app-border/60 bg-app-bg hover:scale-[1.01] transition-all"
          >
            <div className="w-1 h-10 rounded-full shrink-0" style={{ backgroundColor: item.color || dot }} />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-extrabold text-content-primary truncate flex items-center gap-1.5">
                {item.title}
                {item.isExtra && (
                  <span className="text-[8px] px-1 py-0.5 rounded bg-amber-500 text-white font-black">+</span>
                )}
              </div>
              <div className="text-[10px] text-content-muted mt-0.5 flex items-center gap-1.5">
                <Clock className="w-2.5 h-2.5 shrink-0" />
                <span>{item.timeDisplay}</span>
                {item.room && <span>• 📍 {item.room}</span>}
              </div>
            </div>
            {item.subtitle && (
              <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-app-border bg-app-card text-content-secondary">
                {item.subtitle}
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 max-w-4xl mx-auto animate-in fade-in duration-300 pb-8">

      {/* ── HERO BANNER ── */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${theme.bgGradient} p-5 md:p-7 text-white shadow-2xl`}>
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-36 h-36 rounded-full bg-white/15 blur-xl pointer-events-none" />
        {theme.decorEmojis.map((em, i) => (
          <span key={i} className="absolute pointer-events-none select-none opacity-20 text-xl"
            style={{ top: `${12 + i * 13}%`, right: `${5 + i * 7}%` }}>{em}</span>
        ))}

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl border-4 border-white/40 shadow-lg overflow-hidden flex items-center justify-center text-4xl bg-white/20 backdrop-blur-sm"
              style={{ backgroundColor: activeChild.color || '#6366f1' }}
            >
              {activeChild.avatar_url?.startsWith('data:') || activeChild.avatar_url?.startsWith('http')
                ? <img src={activeChild.avatar_url} alt={activeChild.name} className="w-full h-full object-cover" />
                : activeChild.avatar_url === 'girl' ? '👧' : '👦'}
              <span className="absolute -bottom-1 -right-1 text-base">{theme.emoji}</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 text-[10px] font-black mb-1">
                {theme.greeting}
              </div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight drop-shadow-sm">
                Xin chào {formatChildDisplayName(activeChild)}! {theme.emoji}
              </h1>
              <p className="text-white/85 text-xs font-semibold mt-0.5">
                {activeChild.class_name} • {format(new Date(), 'EEEE, dd/MM/yyyy', { locale: vi })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
              <Star className={`w-4 h-4 ${theme.starClass}`} />
              <div>
                <div className="text-[9px] font-bold text-white/80 uppercase">Khen thưởng</div>
                <div className="text-base font-black leading-none">{achievements.length} 🏅</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30">
              <BookOpen className="w-4 h-4 text-white/80" />
              <div>
                <div className="text-[9px] font-bold text-white/80 uppercase">Hôm nay</div>
                <div className="text-base font-black leading-none">{totalItems} tiết 📚</div>
              </div>
            </div>
            {isKidMode && (
              <button
                onClick={() => setShowExitModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/40 text-xs font-bold transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Ba Mẹ
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left: Schedule + Homework */}
        <div className="space-y-5">

          {/* TODAY SCHEDULE */}
          <Card className={`p-5 space-y-4 border-2 ${theme.accentBorder} shadow-md`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-2xl ${theme.accentBg} flex items-center justify-center`}>
                  <BookOpen className={`w-4 h-4 ${theme.accent}`} />
                </div>
                <div>
                  <h3 className="font-black text-sm text-content-primary">Lịch học hôm nay</h3>
                  <p className="text-[10px] text-content-muted">Nhớ mang đủ sách vở nhé {theme.emoji}</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full text-[10px] font-black text-white"
                style={{ backgroundColor: theme.morningColor }}>
                {totalItems} tiết
              </div>
            </div>

            {totalItems === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="text-5xl animate-bounce">🎉</div>
                <p className="text-sm font-black text-content-primary">Hôm nay được nghỉ học!</p>
                <p className="text-xs text-content-muted">Nghỉ ngơi vui vẻ cùng gia đình nhé 🏠</p>
              </div>
            ) : (
              <div className="space-y-4">
                {renderSection(morningItems, 'morning')}
                {renderSection(afternoonItems, 'afternoon')}
                {renderSection(eveningItems, 'evening')}
              </div>
            )}
          </Card>

          {/* HOMEWORK */}
          <Card className="p-5 space-y-3 border border-app-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-content-primary">Bài tập về nhà</h3>
                  <p className="text-[10px] text-content-muted">Tick khi làm xong nhé ✅</p>
                </div>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                doneHw === childHw.length && childHw.length > 0
                  ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {doneHw}/{childHw.length}
              </div>
            </div>
            {childHw.length === 0 ? (
              <div className="py-5 text-center">
                <div className="text-3xl mb-1">👏</div>
                <p className="text-xs font-bold text-emerald-600">Không còn bài tập tồn đọng!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {childHw.map((hw) => (
                  <div
                    key={hw.id}
                    onClick={() => handleToggleHomework(hw.id)}
                    className={`p-3 rounded-2xl border flex items-start gap-3 cursor-pointer select-none transition-all active:scale-[0.98] ${
                      hw.is_completed
                        ? `${theme.checkedRow} opacity-60`
                        : `bg-app-bg border-app-border ${theme.hoverBorder}`
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-emerald-500">
                      {hw.is_completed
                        ? <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                        : <Circle className="w-4 h-4" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[11px] font-bold text-content-primary ${hw.is_completed ? 'line-through' : ''}`}>
                        {hw.subject}
                      </div>
                      <div className="text-[10px] text-content-secondary mt-0.5 line-clamp-2">{hw.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right 2 cols */}
        <div className="lg:col-span-2 space-y-5">

          {/* MILESTONE */}
          {nextMilestone ? (
            <Card className={`p-6 border-2 ${theme.accentBorder} ${theme.cardHighlight} shadow-lg space-y-5`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${theme.accentBg} ${theme.accent} text-xs font-black`}>
                    <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                    Kỳ Thi Sắp Tới
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-content-primary">{nextMilestone.title}</h2>
                  <p className="text-xs text-content-secondary">
                    📅 <b className="text-content-primary font-mono">{nextMilestone.date.split('-').reverse().join('/')}</b>
                    {nextMilestone.subjects?.length ? ` • Môn: ${nextMilestone.subjects.join(', ')}` : ''}
                  </p>
                </div>
                {ddayInfo && (
                  <div className={`px-4 py-3 rounded-2xl text-center shadow-md border text-white ${
                    ddayInfo.urgent ? theme.ddayUrgent + ' animate-pulse' : theme.ddayBg
                  }`}>
                    <div className="text-[9px] font-black uppercase tracking-widest opacity-80">Đếm ngược</div>
                    <div className="text-xl font-black">{ddayInfo.label}</div>
                  </div>
                )}
              </div>

              {/* Target */}
              <div className={`p-3 rounded-2xl ${theme.accentBg} border ${theme.accentBorder} flex items-center gap-3`}>
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                  <Target className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-bold text-content-muted uppercase">Mục tiêu</div>
                  <div className={`text-sm font-black ${theme.accent}`}>
                    🎯 {nextMilestone.target_score || 'Đạt điểm cao nhất!'}
                  </div>
                </div>
                {nextMilestone.preparation_notes && (
                  <p className="text-[10px] text-content-muted italic max-w-[110px] line-clamp-2">
                    💡 {nextMilestone.preparation_notes}
                  </p>
                )}
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-content-primary flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Tiến độ ôn tập
                  </span>
                  <span className="text-emerald-600 font-black">{completedPrepCount}/{relevantPrepTasks.length} ({prepPct}%)</span>
                </div>
                <div className="h-4 rounded-full bg-app-bg border border-app-subtle overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${theme.progressBar} transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${prepPct}%` }}
                  >
                    {prepPct > 15 && <span className="text-[8px] font-black text-white">{prepPct}%</span>}
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-3">
                <div className="text-xs font-black text-content-primary uppercase tracking-wider">📋 Nhiệm vụ ôn tập:</div>
                <div className="space-y-2">
                  {relevantPrepTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTogglePrep(task.id)}
                      className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer select-none transition-all active:scale-[0.98] ${
                        task.is_completed
                          ? `${theme.checkedRow} opacity-70`
                          : `bg-app-bg border-app-border ${theme.hoverBorder} shadow-sm`
                      }`}
                    >
                      <button className={`mt-0.5 shrink-0 ${theme.accent}`}>
                        {task.is_completed
                          ? <CheckCircle2 className="w-5 h-5 fill-emerald-500 text-white" />
                          : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold text-content-primary flex items-center gap-2 ${task.is_completed ? 'line-through' : ''}`}>
                          <span>{task.title}</span>
                          {task.priority === 'high' && !task.is_completed && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-black shrink-0">⚡ Ưu tiên</span>
                          )}
                        </div>
                        <div className="text-[10px] text-content-secondary mt-0.5 flex items-center gap-2">
                          {task.subject && <span className={`font-semibold ${theme.accent}`}>📚 {task.subject}</span>}
                          {task.due_date && <span>📅 {task.due_date.split('-').reverse().join('/')}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                  {relevantPrepTasks.length === 0 && (
                    <div className="py-5 text-center text-xs text-content-muted">
                      Chưa có nhiệm vụ ôn tập. Thêm vào bên dưới nhé! ✍️
                    </div>
                  )}
                </div>
                <form onSubmit={handleAddPrepTask} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Thêm nhiệm vụ ôn tập..."
                    value={newPrepTitle}
                    onChange={(e) => setNewPrepTitle(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 ${theme.accentRing}`}
                  />
                  <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                    Thêm
                  </Button>
                </form>
              </div>
            </Card>
          ) : (
            <Card className="p-10 text-center space-y-3 border border-app-border">
              <div className="text-6xl animate-bounce">🌟</div>
              <h3 className="font-black text-content-primary">Chưa có kỳ thi nào sắp tới!</h3>
              <p className="text-xs text-content-muted">Hãy tập trung học tốt mỗi ngày nhé {theme.emoji}</p>
            </Card>
          )}

          {/* ACHIEVEMENTS */}
          <Card className="p-5 space-y-4 border border-app-border shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600">
                  <Trophy className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-content-primary">Bảng vàng thành tích 🏆</h3>
                  <p className="text-[10px] text-content-muted">Những nỗ lực đáng tự hào</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black">
                {achievements.length} khen thưởng
              </div>
            </div>
            {achievements.length === 0 ? (
              <div className="py-6 text-center">
                <div className="text-4xl mb-2">💪</div>
                <p className="text-xs text-content-muted">Cố lên! Thành tích đầu tiên đang chờ con!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {achievements.slice(0, 6).map((item) => (
                  <div key={item.id} className={`p-3.5 rounded-2xl border flex items-center gap-3 hover:scale-[1.02] transition-all ${theme.cardHighlight}`}>
                    <div className="text-2xl shrink-0">🏅</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black text-content-primary truncate">{item.title}</div>
                      <div className="text-[10px] text-content-muted mt-0.5">
                        📅 {item.date?.split('-').reverse().join('/')}
                        {item.result && <> • <span className="text-amber-600 font-bold">{item.result}</span></>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── EXIT PIN MODAL ── */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-3xl shadow-2xl w-full max-w-xs p-6 space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-1">
              <div className="text-4xl">🔐</div>
              <h3 className="font-black text-base text-content-primary">Trở về chế độ Ba Mẹ</h3>
              <p className="text-xs text-content-muted">Nhập mã PIN để tiếp tục</p>
            </div>
            <div className="space-y-2">
              <input
                type="password"
                maxLength={8}
                placeholder="● ● ● ●"
                value={pinInput}
                autoFocus
                onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                onKeyDown={(e) => e.key === 'Enter' && handleConfirmExit()}
                className={`w-full px-4 py-3 text-center text-2xl font-black tracking-[0.5em] rounded-2xl border-2 bg-app-bg text-content-primary focus:outline-none transition-all ${
                  pinError
                    ? 'border-red-400 focus:ring-2 ring-red-300'
                    : `border-app-border focus:ring-2 ${theme.accentRing}`
                }`}
              />
              {pinError && (
                <p className="text-[11px] text-red-500 font-bold flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Mã PIN không đúng. Thử lại nhé!
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1"
                onClick={() => { setShowExitModal(false); setPinInput(''); setPinError(false); }}>
                Ở lại
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={handleConfirmExit}>
                Xác nhận
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
