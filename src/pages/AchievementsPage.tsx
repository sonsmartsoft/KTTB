import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Award,
  Plus,
  Calendar,
  Star,
  Trophy,
  Medal,
  Trash2,
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { AchievementRecord } from '@/domain/types';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'academic', label: '📚 Học tập' },
  { key: 'competition', label: '🏆 Cuộc thi & Giải' },
  { key: 'certificate', label: '📜 Chứng chỉ' },
  { key: 'sports', label: '⚽ Thể thao' },
  { key: 'arts', label: '🎨 Nghệ thuật' },
];

export const AchievementsPage: React.FC = () => {
  const { activeChild } = useChild();
  const [achievements, setAchievements] = useState<AchievementRecord[]>(() => storage.getAchievements());
  const [activeCategory, setActiveCategory] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AchievementRecord['category']>('competition');
  const [result, setResult] = useState('Giải Nhì');
  const [level, setLevel] = useState('Cấp Quận');
  const [organization, setOrganization] = useState('Phòng Giáo Dục & Đào Tạo');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');

  const childAchievements = achievements.filter((a) => a.child_id === activeChild.id);

  const filteredAchievements =
    activeCategory === 'all'
      ? childAchievements
      : childAchievements.filter((a) => a.category === activeCategory);

  const handleSaveAchievement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    storage.addAchievement({
      child_id: activeChild.id,
      title: title.trim(),
      category,
      result: result.trim() || undefined,
      level: level.trim() || undefined,
      organization: organization.trim() || undefined,
      school_year: '2026-2027',
      date,
      description: description.trim() || undefined,
    });

    setAchievements(storage.getAchievements());
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
  };

  const handleDeleteAchievement = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá thành tích này?')) {
      storage.deleteAchievement(id);
      setAchievements(storage.getAchievements());
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'competition':
        return '🏆';
      case 'certificate':
        return '📜';
      case 'sports':
        return '🥇';
      case 'arts':
        return '🎨';
      default:
        return '⭐';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Bộ Sưu Tập Thành Tích & Khen Thưởng</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Ghi nhận các danh hiệu, giải thưởng học thuật, chứng chỉ và bước tiến phát triển của {activeChild.name}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsModalOpen(true)}
        >
          Thêm thành tích mới
        </Button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-1">
        {CATEGORIES.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveCategory(tab.key)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              activeCategory === tab.key
                ? 'bg-primary text-primary-foreground border-primary shadow-theme-sm'
                : 'bg-app-surface text-content-secondary border-app-border hover:border-primary/40'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline of Achievements */}
      <div className="space-y-4">
        {filteredAchievements.map((ach) => (
          <Card
            key={ach.id}
            className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-theme-md transition-shadow group relative"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                {getCategoryIcon(ach.category)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-content-primary">{ach.title}</h3>
                  <Badge variant="secondary">{ach.result || 'Khen thưởng'}</Badge>
                  {ach.level && <Badge variant="outline">{ach.level}</Badge>}
                </div>
                {ach.description && (
                  <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                    {ach.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-content-muted mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {ach.date.split('-').reverse().join('/')}
                  </span>
                  <span>•</span>
                  <span>Năm học: {ach.school_year}</span>
                  {ach.organization && (
                    <>
                      <span>•</span>
                      <span>Đơn vị: {ach.organization}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Delete button */}
            <button
              onClick={() => handleDeleteAchievement(ach.id)}
              className="p-1.5 rounded-lg text-content-muted hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100"
              title="Xoá thành tích"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAchievements.length === 0 && (
        <Card className="p-12 text-center space-y-3">
          <div className="text-5xl">🏅</div>
          <h3 className="text-base font-bold text-content-primary">Chưa có thành tích trong mục này</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Ghi nhận ngay các danh hiệu, giải thưởng và chứng chỉ để làm phong phú thêm bảng vinh danh của{' '}
            {activeChild.name}.
          </p>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Thêm thành tích đầu tiên
          </Button>
        </Card>
      )}

      {/* ADD ACHIEVEMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>Ghi Nhận Thành Tích Mới</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAchievement} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên danh hiệu / Giải thưởng *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Giải Nhì Học sinh Giỏi Toán Cấp Quận..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Phân loại</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="competition">Cuộc thi &amp; Giải thưởng</option>
                    <option value="academic">Học tập xuất sắc</option>
                    <option value="certificate">Chứng chỉ quốc tế</option>
                    <option value="sports">Thể thao &amp; Thể chất</option>
                    <option value="arts">Nghệ thuật &amp; Âm nhạc</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Kết quả đạt được</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Giải Nhất, Xuất sắc..."
                    value={result}
                    onChange={(e) => setResult(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Cấp độ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cấp Trường, Cấp Quận..."
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ngày khen thưởng</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Đơn vị trao giải / Cấp chứng nhận</label>
                <input
                  type="text"
                  placeholder="Ví dụ: THCS Tô Hiệu, Phòng GD&ĐT..."
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Mô tả chi tiết / Lời chúc mừng</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận nỗ lực hoặc kỷ niệm đáng nhớ..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu thành tích
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
