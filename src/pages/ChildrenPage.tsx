import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Users, Plus, Check, School, Calendar, Edit2, X, Sparkles, UserPlus } from 'lucide-react';
import { Child } from '@/domain/types';

export const ChildrenPage: React.FC = () => {
  const { childrenList, activeChild, setActiveChildId, updateChild, addChild } = useChild();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState(2015);
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('6');
  const [avatarUrl, setAvatarUrl] = useState('boy');
  const [color, setColor] = useState('#2563EB');

  const openAddModal = () => {
    setEditingChild(null);
    setName('');
    setNickname('');
    setBirthYear(2016);
    setSchoolName('THCS Tô Hiệu');
    setClassName('6A5');
    setGrade('6');
    setAvatarUrl('boy');
    setColor('#2563EB');
    setIsModalOpen(true);
  };

  const openEditModal = (child: Child) => {
    setEditingChild(child);
    setName(child.name);
    setNickname(child.nickname);
    setBirthYear(child.birthYear);
    setSchoolName(child.school_name);
    setClassName(child.class_name);
    setGrade(child.grade);
    setAvatarUrl(child.avatar_url);
    setColor(child.color);
    setIsModalOpen(true);
  };

  const handleSaveChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !className.trim()) return;

    if (editingChild) {
      updateChild({
        ...editingChild,
        name: name.trim(),
        nickname: nickname.trim() || name.trim(),
        birthYear,
        school_name: schoolName.trim(),
        class_name: className.trim(),
        grade: grade.trim(),
        avatar_url: avatarUrl,
        color,
      });
    } else {
      addChild({
        name: name.trim(),
        nickname: nickname.trim() || name.trim(),
        birthYear,
        school_name: schoolName.trim(),
        class_name: className.trim(),
        grade: grade.trim(),
        avatar_url: avatarUrl,
        color,
        active: true,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Hồ Sơ Các Con Trong Gia Đình</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý thông tin học tập, trường lớp và chuyển đổi linh hoạt giữa Bé Trung Quân và Bé Hạ Băng
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Thêm bé mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {childrenList.map((c) => {
          const isSelected = c.id === activeChild.id;
          return (
            <Card
              key={c.id}
              className={`p-6 space-y-4 border-2 transition-all ${
                isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-app-border hover:border-primary/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.avatar_url.includes('girl') || c.nickname === 'Bé Băng' ? '👧' : '👦'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-content-primary">{c.name}</h3>
                    <p className="text-xs text-content-muted">Tên thân mật: {c.nickname}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-content-muted hover:text-primary rounded-lg hover:bg-black/5"
                    title="Chỉnh sửa thông tin"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isSelected ? (
                    <Badge variant="primary" icon={<Check className="w-3.5 h-3.5" />}>
                      Đang chọn
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setActiveChildId(c.id)}>
                      Chọn bé này
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-app-subtle text-xs">
                <div className="flex items-center gap-2 text-content-secondary">
                  <School className="w-4 h-4 text-primary" />
                  <span className="font-bold text-content-primary">{c.class_name}</span>
                  <span>•</span>
                  <span>{c.school_name}</span>
                </div>

                <div className="flex items-center gap-2 text-content-secondary">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span>
                    Năm sinh: <strong>{c.birthYear}</strong>
                  </span>
                  {c.date_of_birth && (
                    <span className="text-content-muted">({c.date_of_birth.split('-').reverse().join('/')})</span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveChildId(c.id)}
                >
                  {isSelected ? `Đang xem lịch của ${c.nickname}` : `Xem thời khóa biểu & lịch học của ${c.nickname}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ADD / EDIT CHILD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{editingChild ? 'Chỉnh Sửa Thông Tin Bé' : 'Thêm Bé Vào Gia Đình'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveChild} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Họ và tên *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Nguyễn Trung Quân"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Tên gọi thân mật</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Bé Quân"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Năm sinh</label>
                  <input
                    type="number"
                    min={2005}
                    max={2030}
                    value={birthYear}
                    onChange={(e) => setBirthYear(parseInt(e.target.value) || 2015)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giới tính / Mascot</label>
                  <select
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="boy">👦 Bé Trai (Mascot Boy)</option>
                    <option value="girl">👧 Bé Gái (Mascot Girl)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Lớp học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 6A5, Mầm non..."
                    value={className}
                    onChange={(e) => setClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Khối / Cấp học</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Lớp 6, Mầm..."
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên trường học</label>
                <input
                  type="text"
                  placeholder="Ví dụ: THCS Tô Hiệu"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Màu sắc chủ đạo đại diện</label>
                <div className="flex items-center gap-2">
                  {['#2563EB', '#EC4899', '#10B981', '#8B5CF6', '#F59E0B'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-125 border-black shadow-md' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingChild ? 'Cập nhật' : 'Thêm bé'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
