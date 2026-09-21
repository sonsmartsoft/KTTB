import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  PhoneCall,
  MessageCircle,
  Mail,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  X,
  Sparkles,
  BookOpen,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { TeacherContact } from '@/domain/types';

export const TeachersPage: React.FC = () => {
  const { activeChild } = useChild();
  const [teachers, setTeachers] = useState<TeacherContact[]>(() => storage.getTeachers());

  const childTeachers = teachers.filter((t) => t.child_id === activeChild.id);
  const homeroomTeacher = childTeachers.find((t) => t.role === 'homeroom');
  const subjectTeachers = childTeachers.filter((t) => t.role !== 'homeroom');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeacherContact['role']>('subject');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [zaloPhone, setZaloPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [parentNotes, setParentNotes] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setRole('subject');
    setSubject('Toán');
    setPhone('');
    setZaloPhone('');
    setEmail('');
    setNotes('');
    setParentNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TeacherContact) => {
    setEditingId(t.id);
    setName(t.name);
    setRole(t.role);
    setSubject(t.subject || '');
    setPhone(t.phone);
    setZaloPhone(t.zalo_phone || '');
    setEmail(t.email || '');
    setNotes(t.notes || '');
    setParentNotes(t.parent_notes || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    if (editingId) {
      storage.updateTeacher(editingId, {
        name: name.trim(),
        role,
        subject: subject.trim() || undefined,
        phone: phone.trim(),
        zalo_phone: zaloPhone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        parent_notes: parentNotes.trim() || undefined,
      });
    } else {
      storage.addTeacher({
        child_id: activeChild.id,
        school_year: '2026-2027',
        class_name: activeChild.class_name,
        name: name.trim(),
        role,
        subject: subject.trim() || undefined,
        phone: phone.trim(),
        zalo_phone: zaloPhone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
        parent_notes: parentNotes.trim() || undefined,
      });
    }

    setTeachers(storage.getTeachers());
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc muốn xoá liên hệ thầy cô này?')) {
      storage.deleteTeacher(id);
      setTeachers(storage.getTeachers());
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            <span>Sổ Liên Lạc &amp; Danh Bạ Thầy Cô</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Thông tin liên hệ giáo viên chủ nhiệm &amp; bộ môn, số điện thoại, trao đổi và dặn dò năm học 2026–2027 của{' '}
            {activeChild.name} ({activeChild.class_name} • {activeChild.school_name})
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
          Thêm thầy cô mới
        </Button>
      </div>

      {/* Featured Homeroom Teacher (GVCN) */}
      {homeroomTeacher && (
        <Card className="p-6 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-purple-50/50 border-2 border-blue-200 shadow-theme-md relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center text-3xl font-bold shadow-md shrink-0">
                👩‍🏫
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-blue-950 font-display">{homeroomTeacher.name}</h3>
                  <Badge variant="primary" size="sm">
                    Giáo Viên Chủ Nhiệm
                  </Badge>
                  <span className="text-xs text-blue-800 font-semibold">• Lớp {homeroomTeacher.class_name}</span>
                </div>
                <p className="text-xs text-blue-900/80 font-medium">
                  {homeroomTeacher.subject || 'Chủ nhiệm & Giảng dạy'}
                </p>

                {homeroomTeacher.notes && (
                  <div className="p-2.5 rounded-xl bg-white/80 border border-blue-100 text-xs text-blue-900 mt-2 flex items-start gap-2 max-w-2xl">
                    <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <strong>Lời dặn của cô:</strong> {homeroomTeacher.notes}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Direct Contact Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
              <a
                href={`tel:${homeroomTeacher.phone.replace(/[^0-9]/g, '')}`}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Gọi: {homeroomTeacher.phone}</span>
              </a>

              {homeroomTeacher.zalo_phone && (
                <a
                  href={`https://zalo.me/${homeroomTeacher.zalo_phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Nhắn Zalo</span>
                </a>
              )}

              <button
                onClick={() => openEditModal(homeroomTeacher)}
                className="p-2 rounded-xl border border-blue-200 bg-white hover:bg-blue-50 text-blue-800"
                title="Sửa thông tin"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Subject & Tutor Teachers Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Giáo Viên Bộ Môn &amp; Giảng Dạy</span>
          </h3>
          <span className="text-xs text-content-muted">{subjectTeachers.length} thầy cô</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjectTeachers.map((t) => (
            <Card key={t.id} className="p-5 space-y-3.5 hover:shadow-theme-md transition-shadow relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-app-subtle flex items-center justify-center text-xl shrink-0">
                    {t.role === 'tutor' ? '🧑‍🏫' : '👨‍🏫'}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-content-primary">{t.name}</h4>
                    <span className="text-xs font-semibold text-primary">{t.subject}</span>
                  </div>
                </div>

                <Badge variant={t.role === 'tutor' ? 'warning' : 'outline'} size="sm">
                  {t.role === 'tutor' ? 'Học thêm' : 'Bộ môn'}
                </Badge>
              </div>

              {/* Contact numbers */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-app-subtle">
                <div className="flex items-center justify-between">
                  <span className="text-content-muted flex items-center gap-1.5">
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Điện thoại:</span>
                  </span>
                  <a
                    href={`tel:${t.phone.replace(/[^0-9]/g, '')}`}
                    className="font-mono font-bold text-emerald-600 hover:underline"
                  >
                    {t.phone}
                  </a>
                </div>

                {t.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-content-muted flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                      <span>Email:</span>
                    </span>
                    <a href={`mailto:${t.email}`} className="font-mono text-content-secondary truncate max-w-[180px]">
                      {t.email}
                    </a>
                  </div>
                )}

                {t.notes && (
                  <div className="p-2 rounded bg-app-bg text-[11px] text-content-secondary border border-app-subtle mt-1.5 italic">
                    * {t.notes}
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className="flex items-center justify-between pt-2 border-t border-app-subtle">
                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${t.phone.replace(/[^0-9]/g, '')}`}
                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-xs flex items-center gap-1"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>Gọi</span>
                  </a>
                  {t.zalo_phone && (
                    <a
                      href={`https://zalo.me/${t.zalo_phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Zalo</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1.5 rounded text-content-muted hover:text-primary hover:bg-black/5"
                    title="Chỉnh sửa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="p-1.5 rounded text-content-muted hover:text-rose-600 hover:bg-rose-50"
                    title="Xoá"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {childTeachers.length === 0 && (
        <Card className="p-12 text-center space-y-3">
          <div className="text-5xl">📖</div>
          <h3 className="text-base font-bold text-content-primary">Chưa lưu thông tin giáo viên nào</h3>
          <p className="text-xs text-content-muted max-w-sm mx-auto">
            Lưu danh bạ giáo viên chủ nhiệm và thầy cô bộ môn để phụ huynh dễ dàng liên lạc khi cần trao đổi việc học của{' '}
            {activeChild.name}.
          </p>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm giáo viên đầu tiên
          </Button>
        </Card>
      )}

      {/* ADD / EDIT TEACHER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>{editingId ? 'Chỉnh Sửa Liên Hệ Thầy Cô' : 'Thêm Thầy Cô Vào Danh Bạ'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Họ và tên thầy cô *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Cô Trần Thu Hà"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Vai trò</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as TeacherContact['role'])}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="homeroom">Giáo viên Chủ nhiệm</option>
                    <option value="subject">Giáo viên Bộ môn</option>
                    <option value="tutor">Gia sư / TT Bồi dưỡng</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Môn giảng dạy</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Môn Toán, Ngữ văn &amp; Chủ nhiệm..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ví dụ: 0912.345.678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Số Zalo</label>
                  <input
                    type="tel"
                    placeholder="Để trống nếu trùng SĐT"
                    value={zaloPhone}
                    onChange={(e) => setZaloPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Email liên hệ</label>
                <input
                  type="email"
                  placeholder="Ví dụ: thuha@tohieu.edu.vn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Lời dặn dò của thầy cô / Giờ tiện gọi</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Nhắn tin Zalo sau 17h, gọi khi có việc gấp..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  {editingId ? 'Cập nhật' : 'Lưu vào danh bạ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
