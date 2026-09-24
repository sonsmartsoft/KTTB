import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { KpiGradientCard } from '@/design-system/components/KpiGradientCard';
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
  Upload,
  Image as ImageIcon,
  Eye,
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
  const [viewingAchievement, setViewingAchievement] = useState<AchievementRecord | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<AchievementRecord['category']>('competition');
  const [result, setResult] = useState('Giải Nhì');
  const [level, setLevel] = useState('Cấp Quận');
  const [organization, setOrganization] = useState('Phòng Giáo Dục & Đào Tạo');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');

  const childAchievements = achievements.filter((a) => a.child_id === activeChild.id);

  const filteredAchievements =
    activeCategory === 'all'
      ? childAchievements
      : childAchievements.filter((a) => a.category === activeCategory);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      alert('Vui lòng chọn ảnh dung lượng dưới 3MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const res = uploadEvent.target?.result as string;
      setImageUrl(res);
    };
    reader.readAsDataURL(file);
  };

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
      image_url: imageUrl || undefined,
    });

    setAchievements(storage.getAchievements());
    setIsModalOpen(false);
    setTitle('');
    setDescription('');
    setImageUrl('');
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

      {/* ================= TROPHY SHOWCASE SHELF ================= */}
      {(() => {
        const goldCount = childAchievements.filter(
          (a) =>
            a.result?.toLowerCase().includes('nhất') ||
            a.result?.toLowerCase().includes('vàng') ||
            a.result?.toLowerCase().includes('xuất sắc')
        ).length;

        const silverCount = childAchievements.filter(
          (a) =>
            a.result?.toLowerCase().includes('nhì') ||
            a.result?.toLowerCase().includes('bạc')
        ).length;

        const bronzeCount = childAchievements.filter(
          (a) =>
            a.result?.toLowerCase().includes('ba') ||
            a.result?.toLowerCase().includes('đồng') ||
            a.result?.toLowerCase().includes('khuyến khích')
        ).length;

        const certCount = childAchievements.filter(
          (a) => a.category === 'certificate' || a.category === 'academic'
        ).length;

        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <KpiGradientCard
              colorType="amber"
              icon="🏆"
              title="CÚP VÀNG & GIẢI NHẤT"
              value={goldCount}
              unit="giải"
              subtitle="Danh hiệu cao nhất"
              badgeText={goldCount > 0 ? '🏆 Nổi bật' : 'Chưa có'}
              progressPercent={childAchievements.length > 0 ? Math.round((goldCount / childAchievements.length) * 100) : 0}
            />
            <KpiGradientCard
              colorType="indigo"
              icon="🥈"
              title="CÚP BẠC & GIẢI NHÌ"
              value={silverCount}
              unit="giải"
              subtitle="Thành tích xuất sắc"
              badgeText={silverCount > 0 ? '🥈 Xuất sắc' : 'Chưa có'}
              progressPercent={childAchievements.length > 0 ? Math.round((silverCount / childAchievements.length) * 100) : 0}
            />
            <KpiGradientCard
              colorType="rose"
              icon="🥉"
              title="GIẢI BA & KHUỶN KHÍCH"
              value={bronzeCount}
              unit="giải"
              subtitle="Huy chương đồng"
              badgeText={bronzeCount > 0 ? '🥉 Tốt' : 'Chưa có'}
              progressPercent={childAchievements.length > 0 ? Math.round((bronzeCount / childAchievements.length) * 100) : 0}
            />
            <KpiGradientCard
              colorType="blue"
              icon="📜"
              title="CHỨNG CHỈ & BẰNG KHEN"
              value={certCount}
              unit="cái"
              subtitle="Chứng nhận học thuật"
              badgeText={certCount > 0 ? '📚 Giỏi' : 'Chưa có'}
              progressPercent={childAchievements.length > 0 ? Math.round((certCount / childAchievements.length) * 100) : 0}
            />
          </div>
        );
      })()}

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
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                {getCategoryIcon(ach.category)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-content-primary">{ach.title}</h3>
                  <Badge variant="secondary">{ach.result || 'Khen thưởng'}</Badge>
                  {ach.level && <Badge variant="outline">{ach.level}</Badge>}
                  {ach.image_url && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      <ImageIcon className="w-3 h-3" />
                      <span>Có ảnh đính kèm</span>
                    </span>
                  )}
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

            {/* Actions: View Certificate & Delete */}
            <div className="flex items-center gap-2 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye className="w-3.5 h-3.5" />}
                onClick={() => setViewingAchievement(ach)}
              >
                {ach.image_url ? 'Xem ảnh' : 'Xem chứng chỉ'}
              </Button>

              <button
                onClick={() => handleDeleteAchievement(ach.id)}
                className="p-2 rounded-lg text-content-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Xoá thành tích"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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

              {/* Real Certificate Photo Upload */}
              <div className="space-y-1.5">
                <label className="font-bold text-content-primary flex items-center justify-between">
                  <span>Ảnh chụp bằng khen / Cúp / Huy chương</span>
                  {imageUrl && (
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="text-rose-500 hover:underline text-[11px]"
                    >
                      Xoá ảnh
                    </button>
                  )}
                </label>
                {imageUrl ? (
                  <div className="relative rounded-xl border border-app-border overflow-hidden max-h-36 flex items-center justify-center bg-black/5">
                    <img src={imageUrl} alt="Bằng khen preview" className="max-h-36 w-auto object-contain" />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-app-border hover:border-primary/50 rounded-xl p-3 cursor-pointer bg-app-bg/50 hover:bg-primary/5 transition-colors">
                    <Upload className="w-5 h-5 text-content-muted mb-1" />
                    <span className="text-xs text-content-secondary font-medium">Bấm để tải ảnh chụp từ máy</span>
                    <span className="text-[10px] text-content-muted">Hỗ trợ JPG, PNG, WEBP (Tối đa 3MB)</span>
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                  </label>
                )}
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

      {/* ================= CERTIFICATE & AWARD VIEWER MODAL ================= */}
      {viewingAchievement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-2xl w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-content-primary">Chứng Nhận Thành Tích</h3>
              </div>
              <button
                onClick={() => setViewingAchievement(null)}
                className="p-1.5 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Display Card */}
            {viewingAchievement.image_url ? (
              <div className="space-y-3">
                <div className="rounded-xl overflow-hidden border border-app-border bg-black/5 flex items-center justify-center max-h-[380px]">
                  <img
                    src={viewingAchievement.image_url}
                    alt={viewingAchievement.title}
                    className="max-h-[380px] w-full object-contain"
                  />
                </div>
                <div className="text-center">
                  <h4 className="font-bold text-sm text-content-primary">{viewingAchievement.title}</h4>
                  <p className="text-xs text-content-muted mt-0.5">
                    {viewingAchievement.result} • {viewingAchievement.level || 'Chính thức'} •{' '}
                    {viewingAchievement.date.split('-').reverse().join('/')}
                  </p>
                </div>
              </div>
            ) : (
              /* Digital Certificate Template with Gilded Borders */
              <div className="relative p-6 rounded-2xl border-4 border-amber-300 dark:border-amber-700 bg-gradient-to-b from-amber-50/70 via-white to-amber-50/50 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900 text-center space-y-3 shadow-inner">
                <div className="text-4xl">🏆</div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  GIẤY CHỨNG NHẬN VINH DANH
                </span>

                <h3 className="text-lg font-extrabold text-content-primary font-display">
                  {viewingAchievement.title}
                </h3>

                <p className="text-xs text-content-secondary">
                  Trao tặng cho bé: <strong className="text-primary text-sm">{activeChild.name}</strong>
                </p>

                <div className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold text-xs">
                  {viewingAchievement.result || 'Thành tích Xuất sắc'}
                </div>

                {viewingAchievement.description && (
                  <p className="text-xs italic text-content-secondary max-w-sm mx-auto pt-1">
                    "{viewingAchievement.description}"
                  </p>
                )}

                <div className="pt-3 border-t border-amber-200 dark:border-amber-800/60 flex items-center justify-between text-[11px] text-content-muted px-2">
                  <span>Đơn vị: {viewingAchievement.organization || 'Hội đồng Khảo thí'}</span>
                  <span>Ngày: {viewingAchievement.date.split('-').reverse().join('/')}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end pt-2 border-t border-app-border">
              <Button variant="primary" size="sm" onClick={() => setViewingAchievement(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
