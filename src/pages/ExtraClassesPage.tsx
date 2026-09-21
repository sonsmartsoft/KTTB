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
} from 'lucide-react';
import { DAY_HEADER_COLORS } from '@/design-system/tokens/colors';
import { ExtraSchedule, WeekdayNumber, SessionType } from '@/domain/types';

const CATEGORY_MAP: Record<string, { label: string; color: string }> = {
  academic: { label: 'Văn hóa & Bồi dưỡng', color: 'bg-blue-100 text-blue-800' },
  language: { label: 'Ngoại ngữ & IELTS', color: 'bg-pink-100 text-pink-800' },
  sports: { label: 'Thể thao & Thể chất', color: 'bg-emerald-100 text-emerald-800' },
  arts: { label: 'Nghệ thuật & Âm nhạc', color: 'bg-purple-100 text-purple-800' },
  skills: { label: 'Kỹ năng & Công nghệ', color: 'bg-amber-100 text-amber-800' },
  other: { label: 'Khác', color: 'bg-slate-100 text-slate-800' },
};

export const ExtraClassesPage: React.FC = () => {
  const { activeChild } = useChild();
  const [extraSchedules, setExtraSchedules] = useState<ExtraSchedule[]>(() => storage.getExtraSchedules());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState('academic');
  const [weekdays, setWeekdays] = useState<WeekdayNumber[]>([2, 5]);
  const [session, setSession] = useState<SessionType>('evening');
  const [startTime, setStartTime] = useState('19:15');
  const [endTime, setEndTime] = useState('21:15');
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
        note: note.trim() || undefined,
        active: true,
      });
    }

    setExtraSchedules(storage.getExtraSchedules());
    setIsModalOpen(false);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Lịch Học Thêm & Ngoại Khóa</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý các lớp bồi dưỡng văn hóa, ngoại ngữ, kỹ năng, năng khiếu và tự động tích hợp vào lịch ngày & TKB
            cho {activeChild.name}
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Thêm lớp học thêm
        </Button>
      </div>

      {/* Grid of Extra Classes */}
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
