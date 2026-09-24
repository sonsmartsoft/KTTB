import React, { useState } from 'react';
import { AcademicMilestone, ExamPrepTask } from '@/domain/types';
import { storage } from '@/services/storage';
import { Button } from '@/design-system/components/Button';
import {
  X,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Flame,
  Target,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';

interface ExamPrepModalProps {
  milestone: AcademicMilestone;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const ExamPrepModal: React.FC<ExamPrepModalProps> = ({
  milestone,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [tasks, setTasks] = useState<ExamPrepTask[]>(() =>
    storage.getExamPrepTasks().filter((t) => t.milestone_id === milestone.id)
  );

  // New task form state
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState(milestone.subjects?.[0] || '');
  const [dueDate, setDueDate] = useState(milestone.date);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const handleToggle = (taskId: string) => {
    storage.toggleExamPrepTask(taskId);
    const updated = storage.getExamPrepTasks().filter((t) => t.milestone_id === milestone.id);
    setTasks(updated);
    onUpdate();
  };

  const handleDelete = (taskId: string) => {
    storage.deleteExamPrepTask(taskId);
    const updated = storage.getExamPrepTasks().filter((t) => t.milestone_id === milestone.id);
    setTasks(updated);
    onUpdate();
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    storage.addExamPrepTask({
      milestone_id: milestone.id,
      child_id: milestone.child_id,
      title: title.trim(),
      subject: subject.trim() || undefined,
      due_date: dueDate || undefined,
      priority,
      notes: notes.trim() || undefined,
      is_completed: false,
    });

    setTitle('');
    setNotes('');
    const updated = storage.getExamPrepTasks().filter((t) => t.milestone_id === milestone.id);
    setTasks(updated);
    onUpdate();
  };

  // D-Day calculation
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const targetDate = new Date(milestone.date);
  targetDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((targetDate.getTime() - now.getTime()) / 86400000);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-app-surface border border-app-border rounded-2xl shadow-theme-pop w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b border-app-border relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="space-y-2 pr-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-300" /> Kế hoạch ôn tập nước rút
              </span>
              <span className="text-xs font-mono font-bold text-content-muted">
                📅 Ngày thi: {milestone.date.split('-').reverse().join('/')}
              </span>
              {diffDays > 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  D-{diffDays}
                </span>
              ) : diffDays === 0 ? (
                <span className="px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-black">
                  HÔM NAY
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black">
                  Đã thi
                </span>
              )}
            </div>

            <h2 className="text-xl font-bold font-display text-content-primary leading-tight">
              {milestone.title}
            </h2>

            <div className="flex items-center gap-4 text-xs text-content-secondary">
              <div>
                Mục tiêu: <b className="text-primary font-bold">{milestone.target_score || '—'}</b>
              </div>
              {milestone.subjects?.length && (
                <div>
                  Môn: <b className="text-content-primary">{milestone.subjects.join(', ')}</b>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-content-secondary">
                Tiến độ: {completedCount}/{tasks.length} đầu việc hoàn thành
              </span>
              <span className="text-primary font-black">{progressPct}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-app-bg border border-app-border overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-500 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Task List */}
        <div className="p-6 space-y-4 flex-1">
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-content-muted uppercase tracking-wider">
              Danh sách chuyên đề & đầu việc cần ôn ({tasks.length}):
            </h3>

            {tasks.length === 0 ? (
              <div className="py-8 text-center text-content-muted text-xs border-2 border-dashed border-app-border rounded-xl space-y-1">
                <BookOpen className="w-8 h-8 mx-auto text-content-muted/50 mb-1" />
                <p className="font-bold">Chưa có nhiệm vụ ôn tập nào</p>
                <p className="text-[11px]">Thêm các chuyên đề, đề cương, bài tập ôn thi ở form bên dưới.</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 transition-all group ${
                    task.is_completed
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/60 opacity-80'
                      : 'bg-app-bg border-app-border hover:border-primary/40'
                  }`}
                >
                  <div
                    onClick={() => handleToggle(task.id)}
                    className="flex items-start gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <button className="mt-0.5 shrink-0 text-emerald-600">
                      {task.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500 text-white" />
                      ) : (
                        <Circle className="w-4 h-4 text-content-muted" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-xs font-bold ${
                            task.is_completed
                              ? 'line-through text-content-muted'
                              : 'text-content-primary'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.subject && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-primary/10 text-primary">
                            {task.subject}
                          </span>
                        )}
                        {task.priority === 'high' && !task.is_completed && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-black bg-red-100 text-red-600">
                            Gấp
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-content-muted mt-1">
                        {task.due_date && (
                          <span>📅 Hạn hoàn thành: {task.due_date.split('-').reverse().join('/')}</span>
                        )}
                        {task.completed_at && (
                          <span className="text-emerald-600 font-semibold">
                            ✓ Xong ngày {task.completed_at.split('-').reverse().join('/')}
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-[10px] text-content-muted italic mt-1 bg-black/5 dark:bg-white/5 p-1.5 rounded">
                          💡 {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1 text-content-muted hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Xóa đầu việc"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add New Task Form */}
          <form
            onSubmit={handleAddTask}
            className="p-4 rounded-xl border border-app-border bg-app-card space-y-3 pt-3"
          >
            <div className="text-xs font-bold text-content-primary flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary" />
              <span>Thêm nhiệm vụ ôn tập mới</span>
            </div>

            <div className="space-y-1">
              <input
                type="text"
                required
                placeholder="Tên chuyên đề / bài tập (VD: Giải đề thi thử số 1, ôn lý thuyết...)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-app-border bg-app-bg text-content-primary font-bold focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-content-muted">Môn học</label>
                <input
                  type="text"
                  placeholder="Toán / Tiếng Anh..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-content-muted">Hạn hoàn thành</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-content-muted">Mức độ ưu tiên</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="high">🔥 Ưu tiên cao</option>
                  <option value="medium">⚡ Bình thường</option>
                  <option value="low">🌱 Nhẹ nhàng</option>
                </select>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Ghi chú thêm (VD: Làm bài 3, 4 trang 50 SGK...)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button type="submit" variant="primary" size="sm" icon={<Plus className="w-3.5 h-3.5" />}>
                Thêm vào kế hoạch
              </Button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-app-border bg-app-subtle flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
