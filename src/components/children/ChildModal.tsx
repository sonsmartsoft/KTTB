import React, { useState, useEffect } from 'react';
import { Child } from '@/domain/types';
import { Modal } from '@/design-system/components/Modal';
import { Button } from '@/design-system/components/Button';
import { Input } from '@/design-system/components/Input';

export interface ChildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (childData: Omit<Child, 'id' | 'created_at' | 'updated_at'>) => void;
  initialData?: Child | null;
}

const AVATAR_OPTIONS = [
  { id: 'boy', icon: '👦', label: 'Bé trai' },
  { id: 'girl', icon: '👧', label: 'Bé gái' },
  { id: 'cat', icon: '🐱', label: 'Mèo con' },
  { id: 'bear', icon: '🐻', label: 'Gấu nhỏ' },
  { id: 'fox', icon: '🦊', label: 'Cáo thông minh' },
  { id: 'star', icon: '⭐', label: 'Ngôi sao' },
];

const COLOR_OPTIONS = [
  { hex: '#2563EB', label: 'Xanh dương' },
  { hex: '#EC4899', label: 'Hồng pastel' },
  { hex: '#10B981', label: 'Xanh ngọc' },
  { hex: '#F59E0B', label: 'Vàng cam' },
  { hex: '#8B5CF6', label: 'Tím thơ mộng' },
  { hex: '#06B6D4', label: 'Xanh lơ' },
];

export const ChildModal: React.FC<ChildModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState(2015);
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [grade, setGrade] = useState('Lớp 6');
  const [className, setClassName] = useState('6A5');
  const [avatarUrl, setAvatarUrl] = useState('boy');
  const [color, setColor] = useState('#2563EB');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setNickname(initialData.nickname);
      setBirthYear(initialData.birthYear);
      setDateOfBirth(initialData.date_of_birth || '');
      setSchoolName(initialData.school_name);
      setGrade(initialData.grade);
      setClassName(initialData.class_name);
      setAvatarUrl(initialData.avatar_url || 'boy');
      setColor(initialData.color || '#2563EB');
    } else {
      setName('');
      setNickname('');
      setBirthYear(2016);
      setDateOfBirth('');
      setSchoolName('');
      setGrade('');
      setClassName('');
      setAvatarUrl('boy');
      setColor('#2563EB');
    }
    setError('');
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập họ và tên của bé');
      return;
    }
    if (!className.trim()) {
      setError('Vui lòng nhập tên lớp của bé (ví dụ: 6A5, Mầm 1)');
      return;
    }

    onSave({
      name: name.trim(),
      nickname: nickname.trim() || name.trim().split(' ').pop() || 'Bé',
      birthYear: Number(birthYear) || new Date().getFullYear() - 6,
      date_of_birth: dateOfBirth || undefined,
      school_name: schoolName.trim() || 'Trường học',
      grade: grade.trim() || 'Lớp học',
      class_name: className.trim(),
      avatar_url: avatarUrl,
      color,
      active: true,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? `Chỉnh sửa hồ sơ: ${initialData.name}` : 'Thêm hồ sơ bé mới'}
      description="Điền thông tin để tạo lịch trình và thời khóa biểu riêng cho bé"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 rounded-theme-sm bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700">
            {error}
          </div>
        )}

        {/* Avatar & Color Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-content-primary">
            Biểu tượng đại diện (Avatar)
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_OPTIONS.map((av) => (
              <button
                type="button"
                key={av.id}
                onClick={() => setAvatarUrl(av.id)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all ${
                  avatarUrl === av.id
                    ? 'ring-2 ring-primary ring-offset-2 scale-105 bg-primary-light shadow-sm'
                    : 'bg-app-surface border border-app-border hover:bg-black/5'
                }`}
                title={av.label}
              >
                {av.icon}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-content-primary">
            Màu sắc chủ đạo của bé
          </label>
          <div className="flex flex-wrap gap-2.5 items-center">
            {COLOR_OPTIONS.map((c) => (
              <button
                type="button"
                key={c.hex}
                onClick={() => setColor(c.hex)}
                className={`w-7 h-7 rounded-full transition-transform ${
                  color === c.hex
                    ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-sm'
                    : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Name and Nickname */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Họ và tên bé *"
            placeholder="Ví dụ: Bé Trung Quân"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Tên thân mật gọi ở nhà"
            placeholder="Ví dụ: Quân, Băng"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
        </div>

        {/* Birth Year and DOB */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Năm sinh"
            type="number"
            min={2010}
            max={2026}
            value={birthYear}
            onChange={(e) => setBirthYear(Number(e.target.value))}
          />
          <Input
            label="Ngày tháng năm sinh (tùy chọn)"
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
          />
        </div>

        {/* School, Grade, Class */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Trường học"
            placeholder="Ví dụ: THCS Tô Hiệu"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
          />
          <Input
            label="Khối lớp"
            placeholder="Ví dụ: Lớp 6, Mầm non"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          />
          <Input
            label="Tên lớp *"
            placeholder="Ví dụ: 6A5, Mầm 1"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            required
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-app-subtle">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {initialData ? 'Lưu thay đổi' : 'Tạo hồ sơ bé'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
