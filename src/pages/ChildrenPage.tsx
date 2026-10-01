import React, { useState, useEffect } from 'react';
import { useChild } from '@/context/ChildContext';
import { useAdminConfirm } from '@/context/AdminConfirmContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Users,
  Plus,
  Check,
  School,
  Calendar,
  Edit2,
  X,
  Sparkles,
  Camera,
  Upload,
  Trash2,
  Heart,
  Flame,
  Scale,
  ArrowRight,
  Cake,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Child, MotherSettings } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';
import { calculateBirthdayStatus } from '@/lib/birthdayHelper';
import { Link } from 'react-router-dom';

export const ChildrenPage: React.FC = () => {
  const { childrenList, activeChild, setActiveChildId, updateChild, addChild, deleteChild } = useChild();
  const { confirmDelete } = useAdminConfirm();

  // Child Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  // Child Form State
  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState(2015);
  const [dateOfBirth, setDateOfBirth] = useState('2015-08-15');
  const [schoolName, setSchoolName] = useState('');
  const [className, setClassName] = useState('');
  const [grade, setGrade] = useState('6');
  const [avatarUrl, setAvatarUrl] = useState('boy');
  const [color, setColor] = useState('#2563EB');

  // Mother Profile State & Modal
  const [motherProfile, setMotherProfile] = useState<MotherSettings>(() =>
    storage.getMotherSettings()
  );
  const [isMotherModalOpen, setIsMotherModalOpen] = useState(false);
  const [mName, setMName] = useState('');
  const [mNickname, setMNickname] = useState('');
  const [mBirthYear, setMBirthYear] = useState(1990);
  const [mDateOfBirth, setMDateOfBirth] = useState('1990-10-20');
  const [mHeightCm, setMHeightCm] = useState(160);
  const [mCurrentWeight, setMCurrentWeight] = useState(56);
  const [mTargetWeight, setMTargetWeight] = useState(52);
  const [mTargetCalories, setMTargetCalories] = useState(1300);
  const [mStartDate, setMStartDate] = useState('2026-09-28');
  const [mAvatarUrl, setMAvatarUrl] = useState('🧘‍♀️');
  const [mColor, setMColor] = useState('#F43F5E');
  const [mGoalNote, setMGoalNote] = useState('');

  // Saving & Cloud Sync Feedback State
  const [isSavingMother, setIsSavingMother] = useState(false);
  const [isSavingChild, setIsSavingChild] = useState(false);
  const [syncToast, setSyncToast] = useState<{ message: string; type: 'success' | 'warning' } | null>(null);

  const showSyncToast = (message: string, type: 'success' | 'warning' = 'success') => {
    setSyncToast({ message, type });
    setTimeout(() => setSyncToast(null), 4000);
  };

  useEffect(() => {
    const refreshMother = () => setMotherProfile(storage.getMotherSettings());
    window.addEventListener('ktt-cloud-synced', refreshMother);
    window.addEventListener('ktt-mother-updated', refreshMother);
    return () => {
      window.removeEventListener('ktt-cloud-synced', refreshMother);
      window.removeEventListener('ktt-mother-updated', refreshMother);
    };
  }, []);

  const openEditMotherModal = () => {
    const current = storage.getMotherSettings();
    const by = current.birthYear || 1990;
    setMName(current.authorName || 'Mẹ Yêu');
    setMNickname(current.nickname || 'Mẹ Quân & Băng');
    setMBirthYear(by);
    setMDateOfBirth(current.date_of_birth || `${by}-10-20`);
    setMHeightCm(current.heightCm || 160);
    setMCurrentWeight(current.currentWeightKg || 56);
    setMTargetWeight(current.targetWeightKg || 52);
    setMTargetCalories(current.targetCalories || 1300);
    setMStartDate(current.startDate || '2026-09-28');
    setMAvatarUrl(current.avatarUrl || '🧘‍♀️');
    setMColor(current.color || '#F43F5E');
    setMGoalNote(
      current.goalNote || 'Giữ dáng thon gọn, khỏe mạnh & tràn đầy năng lượng mỗi ngày'
    );
    setIsMotherModalOpen(true);
  };

  const handleMotherImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 3MB để tải nhanh.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setMAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveMother = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim()) return;
    setIsSavingMother(true);
    try {
      const derivedYear = mDateOfBirth
        ? parseInt(mDateOfBirth.split('-')[0], 10) || mBirthYear
        : mBirthYear;
      const updated: MotherSettings = {
        ...motherProfile,
        authorName: mName.trim(),
        nickname: mNickname.trim() || mName.trim(),
        birthYear: derivedYear,
        date_of_birth: mDateOfBirth || undefined,
        heightCm: mHeightCm,
        currentWeightKg: mCurrentWeight,
        targetWeightKg: mTargetWeight,
        targetCalories: mTargetCalories,
        startDate: mStartDate,
        avatarUrl: mAvatarUrl,
        color: mColor,
        goalNote: mGoalNote.trim(),
      };
      setMotherProfile(updated);
      const cloudSuccess = await storage.saveMotherSettings(updated);
      setIsMotherModalOpen(false);
      if (cloudSuccess) {
        showSyncToast('✓ Đã lưu và đồng bộ thành công hồ sơ của Mẹ lên Supabase Cloud!', 'success');
      } else {
        showSyncToast('Đã lưu vào bộ nhớ máy (Đang kết nối lại Cloud)...', 'warning');
      }
    } catch (err: any) {
      showSyncToast(`Lỗi khi lưu: ${err?.message || err}`, 'warning');
    } finally {
      setIsSavingMother(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Vui lòng chọn ảnh dung lượng dưới 3MB để tải nhanh.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatarUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddModal = () => {
    setEditingChild(null);
    setName('');
    setNickname('');
    setBirthYear(2016);
    setDateOfBirth('2016-06-01');
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
    setDateOfBirth(child.date_of_birth || `${child.birthYear || 2015}-08-15`);
    setSchoolName(child.school_name);
    setClassName(child.class_name);
    setGrade(child.grade);
    setAvatarUrl(child.avatar_url);
    setColor(child.color);
    setIsModalOpen(true);
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !className.trim()) return;
    setIsSavingChild(true);

    try {
      const derivedBirthYear = dateOfBirth
        ? parseInt(dateOfBirth.split('-')[0], 10) || birthYear
        : birthYear;

      let cloudSuccess = false;
      if (editingChild) {
        cloudSuccess = await updateChild({
          ...editingChild,
          name: name.trim(),
          nickname: nickname.trim() || name.trim(),
          birthYear: derivedBirthYear,
          date_of_birth: dateOfBirth || undefined,
          school_name: schoolName.trim(),
          class_name: className.trim(),
          grade: grade.trim(),
          avatar_url: avatarUrl,
          color,
        });
      } else {
        cloudSuccess = await addChild({
          name: name.trim(),
          nickname: nickname.trim() || name.trim(),
          birthYear: derivedBirthYear,
          date_of_birth: dateOfBirth || undefined,
          school_name: schoolName.trim(),
          class_name: className.trim(),
          grade: grade.trim(),
          avatar_url: avatarUrl,
          color,
          active: true,
        });
      }
      setIsModalOpen(false);
      if (cloudSuccess) {
        showSyncToast('✓ Đã lưu và đồng bộ thành công hồ sơ của bé lên Supabase Cloud!', 'success');
      } else {
        showSyncToast('Đã lưu vào bộ nhớ máy (Đang kết nối lại Cloud)...', 'warning');
      }
    } catch (err: any) {
      showSyncToast(`Lỗi khi lưu: ${err?.message || err}`, 'warning');
    } finally {
      setIsSavingChild(false);
    }
  };

  const handleDeleteChild = (child: Child) => {
    if (childrenList.length <= 1) {
      alert('Không thể xoá hồ sơ bé duy nhất trong hệ thống.');
      return;
    }
    confirmDelete({
      title: 'Xoá hồ sơ của bé',
      message: `Bạn có chắc chắn muốn xoá hồ sơ "${child.name}"? Thao tác này sẽ xoá dữ liệu lịch học, thành tích của bé trên thiết bị và đồng bộ Supabase Cloud.`,
      itemName: `${child.name} (${child.class_name})`,
      onConfirm: async () => {
        const ok = await deleteChild(child.id);
        if (ok) {
          showSyncToast(`✓ Đã xoá thành công hồ sơ của ${child.nickname}.`, 'success');
        }
      },
    });
  };

  const isMotherPhoto =
    motherProfile.avatarUrl?.startsWith('data:') ||
    motherProfile.avatarUrl?.startsWith('http');

  const motherBday = calculateBirthdayStatus(
    motherProfile.date_of_birth,
    motherProfile.birthYear
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-5xl mx-auto pb-8">
      {/* Toast thông báo lưu & đồng bộ Cloud */}
      {syncToast && (
        <div
          className={`flex items-center gap-2.5 p-3 rounded-theme-md text-xs font-semibold shadow-theme-md transition-all animate-in slide-in-from-top-2 ${
            syncToast.type === 'success'
              ? 'bg-emerald-500 text-white dark:bg-emerald-600'
              : 'bg-amber-500 text-white dark:bg-amber-600'
          }`}
        >
          {syncToast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{syncToast.message}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Hồ Sơ Gia Đình: Mẹ &amp; Các Con</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Cấu hình thông tin cá nhân, ngày sinh nhật (tự động hiện banner chúc mừng trước 1 tuần) của Mẹ và các con
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<Edit2 className="w-4 h-4 text-rose-500" />}
            onClick={openEditMotherModal}
          >
            Cấu hình Hồ sơ Mẹ
          </Button>
          <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />} onClick={openAddModal}>
            Thêm hồ sơ con
          </Button>
        </div>
      </div>

      {/* ── MOTHER PROFILE CARD ── */}
      <Card className="p-6 border-2 border-rose-300/80 dark:border-rose-800/60 bg-gradient-to-br from-rose-50/80 via-pink-50/40 to-amber-50/50 dark:from-rose-950/25 dark:via-pink-950/15 dark:to-amber-950/10 shadow-md space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-md overflow-hidden relative shrink-0 border-2 border-white/60"
              style={{ backgroundColor: motherProfile.color || '#F43F5E' }}
            >
              {isMotherPhoto ? (
                <img
                  src={motherProfile.avatarUrl}
                  alt={motherProfile.authorName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{motherProfile.avatarUrl || '🧘‍♀️'}</span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase">
                  <Heart className="w-3 h-3" /> Hồ sơ của Mẹ
                </span>
                {motherBday.daysUntil !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      motherBday.daysUntil === 0
                        ? 'bg-amber-400 text-slate-950 animate-pulse'
                        : motherBday.daysUntil <= 7
                        ? 'bg-fuchsia-500 text-white'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                    }`}
                  >
                    <Cake className="w-3 h-3" />
                    {motherBday.daysUntil === 0
                      ? '🎂 Hôm nay là Sinh Nhật Mẹ!'
                      : `Sinh nhật ${motherBday.nextBirthdayDisplay} (còn ${motherBday.daysUntil} ngày)`}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-content-primary">
                {motherProfile.authorName}
                {motherProfile.nickname && motherProfile.nickname !== motherProfile.authorName
                  ? ` (${motherProfile.nickname})`
                  : ''}
              </h3>
              <p className="text-xs text-content-secondary mt-0.5">
                {motherProfile.goalNote || 'Giữ dáng thon gọn, khỏe mạnh & tràn đầy năng lượng'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              onClick={openEditMotherModal}
            >
              Chỉnh sửa thông tin Mẹ
            </Button>
            <Link to="/mother">
              <Button
                variant="primary"
                size="sm"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Mở Góc của Mẹ
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-rose-200/60 dark:border-rose-800/40 text-xs">
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-rose-200/50 flex items-center gap-2.5">
            <Cake className="w-4 h-4 text-rose-500 shrink-0" />
            <div>
              <div className="text-[10px] text-content-muted font-bold">Ngày sinh nhật</div>
              <div className="font-black text-content-primary">{motherBday.fullDobDisplay}</div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-rose-200/50 flex items-center gap-2.5">
            <Scale className="w-4 h-4 text-emerald-500 shrink-0" />
            <div>
              <div className="text-[10px] text-content-muted font-bold">Cân nặng &amp; Chiều cao</div>
              <div className="font-black text-content-primary">
                {motherProfile.currentWeightKg || '—'}→{motherProfile.targetWeightKg || '—'}kg • {motherProfile.heightCm || 160}cm
              </div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-rose-200/50 flex items-center gap-2.5">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <div>
              <div className="text-[10px] text-content-muted font-bold">Mục tiêu Calo</div>
              <div className="font-black text-content-primary">{motherProfile.targetCalories} Kcal/ngày</div>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-rose-200/50 flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <div>
              <div className="text-[10px] text-content-muted font-bold">Bắt đầu lộ trình 30 ngày</div>
              <div className="font-black text-content-primary">
                {motherProfile.startDate?.split('-').reverse().join('/')}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ── CHILDREN PROFILES GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {childrenList.map((c) => {
          const isSelected = c.id === activeChild.id;
          const cBday = calculateBirthdayStatus(c.date_of_birth, c.birthYear);
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
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md overflow-hidden relative shrink-0"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.avatar_url?.startsWith('data:') || c.avatar_url?.startsWith('http') ? (
                      <img src={c.avatar_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      c.avatar_url?.includes('girl') || c.nickname === 'Bé Băng' ? '👧' : '👦'
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-content-primary">{formatChildDisplayName(c)}</h3>
                    <p className="text-xs text-content-muted">Tên thân mật: {c.nickname}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-content-muted hover:text-primary rounded-lg hover:bg-black/5"
                    title="Chỉnh sửa thông tin & sinh nhật"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {isSelected ? (
                    <Badge variant="primary" icon={<Check className="w-3.5 h-3.5" />}>
                      Đang chọn
                    </Badge>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setActiveChildId(c.id)}>
                      Chọn hồ sơ này
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

                <div className="flex flex-wrap items-center justify-between gap-2 text-content-secondary">
                  <div className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-rose-500" />
                    <span>
                      Sinh nhật: <strong>{cBday.fullDobDisplay}</strong>
                    </span>
                  </div>
                  {cBday.daysUntil !== null && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        cBday.daysUntil === 0
                          ? 'bg-amber-400 text-slate-950 animate-pulse'
                          : cBday.daysUntil <= 7
                          ? 'bg-fuchsia-500 text-white'
                          : 'bg-app-bg border border-app-border text-content-secondary'
                      }`}
                    >
                      {cBday.daysUntil === 0
                        ? '🎂 Hôm nay sinh nhật!'
                        : `Còn ${cBday.daysUntil} ngày`}
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Edit2 className="w-3.5 h-3.5" />}
                  onClick={() => openEditModal(c)}
                >
                  Sửa
                </Button>
                {childrenList.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 border-rose-200 dark:border-rose-900/30"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                    onClick={() => handleDeleteChild(c)}
                    title="Xoá hồ sơ bé (Cần mã PIN Admin)"
                  >
                    Xoá
                  </Button>
                )}
                <Button
                  variant={isSelected ? 'primary' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={() => setActiveChildId(c.id)}
                >
                  {isSelected ? `Đang xem lịch của ${c.nickname}` : `Xem lịch của ${c.nickname}`}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ── EDIT MOTHER PROFILE MODAL ── */}
      {isMotherModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-lg space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                <span>Cấu Hình Hồ Sơ Của Mẹ</span>
              </h3>
              <button
                onClick={() => setIsMotherModalOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMother} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Họ và tên của Mẹ *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ tên của Mẹ..."
                    value={mName}
                    onChange={(e) => setMName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Tên gọi thân mật</label>
                  <input
                    type="text"
                    placeholder="VD: Mẹ Yêu, Mẹ Quân Băng..."
                    value={mNickname}
                    onChange={(e) => setMNickname(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ngày tháng năm sinh (Sinh nhật)</span>
                  </label>
                  <input
                    type="date"
                    value={mDateOfBirth}
                    onChange={(e) => {
                      setMDateOfBirth(e.target.value);
                      if (e.target.value) {
                        const y = parseInt(e.target.value.split('-')[0], 10);
                        if (y) setMBirthYear(y);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Biểu tượng đại diện</label>
                  <select
                    value={
                      mAvatarUrl.startsWith('data:') || mAvatarUrl.startsWith('http')
                        ? 'custom'
                        : mAvatarUrl
                    }
                    onChange={(e) => {
                      if (e.target.value !== 'custom') setMAvatarUrl(e.target.value);
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-rose-400"
                  >
                    <option value="🧘‍♀️">🧘‍♀️ Mẹ Tập Yoga / Giữ Dáng</option>
                    <option value="👩">👩 Mẹ Dịu Dàng</option>
                    <option value="👑">👑 Nữ Hoàng Gia Đình</option>
                    <option value="🌸">🌸 Hoa Anh Đào</option>
                    <option value="💖">💖 Trái Tim Yêu Thương</option>
                    {(mAvatarUrl.startsWith('data:') || mAvatarUrl.startsWith('http')) && (
                      <option value="custom">🖼️ Ảnh thực tế đã tải lên</option>
                    )}
                  </select>
                </div>
              </div>

              {/* UPLOAD REAL PHOTO OF MOTHER */}
              <div className="p-3 rounded-xl border border-app-border bg-app-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-content-primary flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ảnh đại diện thực tế của Mẹ</span>
                  </label>
                  {(mAvatarUrl.startsWith('data:') || mAvatarUrl.startsWith('http')) && (
                    <button
                      type="button"
                      onClick={() => setMAvatarUrl('🧘‍♀️')}
                      className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xoá ảnh
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl overflow-hidden border border-app-border flex items-center justify-center shrink-0 text-white"
                    style={{ backgroundColor: mColor }}
                  >
                    {mAvatarUrl.startsWith('data:') || mAvatarUrl.startsWith('http') ? (
                      <img src={mAvatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{mAvatarUrl}</span>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-rose-400 hover:border-rose-500 rounded-lg text-rose-600 font-medium hover:bg-rose-50/50 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh của Mẹ từ máy (JPG, PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMotherImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Chiều cao (cm)</label>
                  <input
                    type="number"
                    value={mHeightCm}
                    onChange={(e) => setMHeightCm(Number(e.target.value) || 160)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Cân nặng hiện tại (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mCurrentWeight}
                    onChange={(e) => setMCurrentWeight(parseFloat(e.target.value) || 55)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Mục tiêu cân (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mTargetWeight}
                    onChange={(e) => setMTargetWeight(parseFloat(e.target.value) || 52)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Mục tiêu Calo / ngày</label>
                  <input
                    type="number"
                    value={mTargetCalories}
                    onChange={(e) => setMTargetCalories(Number(e.target.value) || 1300)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ngày bắt đầu lộ trình 30 ngày</label>
                  <input
                    type="date"
                    value={mStartDate}
                    onChange={(e) => setMStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Mục tiêu / Ghi chú truyền cảm hứng</label>
                <input
                  type="text"
                  value={mGoalNote}
                  onChange={(e) => setMGoalNote(e.target.value)}
                  placeholder="VD: Giữ dáng thon gọn, khỏe mạnh & tràn đầy năng lượng..."
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Màu sắc chủ đạo của Mẹ</label>
                <div className="flex items-center gap-2">
                  {['#F43F5E', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B', '#2563EB'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setMColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        mColor === c ? 'scale-125 border-black shadow-md' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsMotherModalOpen(false)}>
                  Huỷ
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingMother}
                  icon={isSavingMother ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isSavingMother ? 'Đang lưu & đẩy lên Cloud...' : 'Lưu hồ sơ của Mẹ'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT CHILD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
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
                  <label className="font-bold text-content-primary flex items-center gap-1">
                    <Cake className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ngày sinh nhật</span>
                  </label>
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => {
                      setDateOfBirth(e.target.value);
                      if (e.target.value) {
                        const y = parseInt(e.target.value.split('-')[0], 10);
                        if (y) setBirthYear(y);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Giới tính / Biểu tượng</label>
                  <select
                    value={avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? 'custom' : avatarUrl}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setAvatarUrl(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="boy">👦 Bé Trai (Mascot Boy)</option>
                    <option value="girl">👧 Bé Gái (Mascot Girl)</option>
                    {(avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) && (
                      <option value="custom">🖼️ Ảnh thực tế đã tải lên</option>
                    )}
                  </select>
                </div>
              </div>

              {/* UPLOAD REAL PHOTO OF CHILD */}
              <div className="p-3 rounded-xl border border-app-border bg-app-card/60 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-content-primary flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-primary" />
                    <span>Ảnh đại diện thực tế của con</span>
                  </label>
                  {(avatarUrl.startsWith('data:') || avatarUrl.startsWith('http')) && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('boy')}
                      className="text-[11px] text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Xoá ảnh
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-app-border bg-black/5 flex items-center justify-center shrink-0">
                    {avatarUrl.startsWith('data:') || avatarUrl.startsWith('http') ? (
                      <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{avatarUrl === 'girl' ? '👧' : '👦'}</span>
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-primary/50 hover:border-primary rounded-lg text-primary font-medium hover:bg-primary/5 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy (JPG, PNG)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
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
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingChild}
                  icon={isSavingChild ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
                >
                  {isSavingChild ? 'Đang lưu & đẩy lên Cloud...' : editingChild ? 'Cập nhật' : 'Thêm bé'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
