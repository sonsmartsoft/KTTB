import React, { useState, useEffect, useMemo } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { MotherSettings } from '@/domain/types';
import {
  buildFamilyBirthdayList,
  getBirthdayBannerMessage,
  getDailyFamilyWish,
  FamilyBirthdayMember,
} from '@/lib/birthdayHelper';
import { Sparkles, Cake, Gift, RefreshCw, Calendar, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FamilyBirthdayBanner: React.FC = () => {
  const { childrenList } = useChild();
  const [mother, setMother] = useState<MotherSettings>(() => storage.getMotherSettings());
  const [wishOffset, setWishOffset] = useState(0);

  useEffect(() => {
    const handleRefresh = () => {
      setMother(storage.getMotherSettings());
    };
    window.addEventListener('ktt-cloud-synced', handleRefresh);
    window.addEventListener('ktt-mother-updated', handleRefresh);
    return () => {
      window.removeEventListener('ktt-cloud-synced', handleRefresh);
      window.removeEventListener('ktt-mother-updated', handleRefresh);
    };
  }, []);

  const familyMembers = useMemo(
    () => buildFamilyBirthdayList(mother, childrenList, new Date()),
    [mother, childrenList]
  );

  // Những thành viên có sinh nhật HÔM NAY hoặc TRONG VÒNG 7 NGÀY TỚI (trước 1 tuần)
  const activeBirthdayMembers = useMemo(() => {
    return familyMembers
      .filter((m) => m.isBirthdayToday || m.isBirthdayWithinWeek)
      .sort((a, b) => (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999));
  }, [familyMembers]);

  // Thành viên có sinh nhật gần nhất tiếp theo (để hiển thị nhắc nhẹ ngày thường)
  const nearestUpcomingMember = useMemo(() => {
    const withDates = familyMembers
      .filter((m) => m.daysUntilBirthday !== null)
      .sort((a, b) => (a.daysUntilBirthday ?? 999) - (b.daysUntilBirthday ?? 999));
    return withDates[0] || null;
  }, [familyMembers]);

  const dailyWish = useMemo(() => getDailyFamilyWish(new Date(), wishOffset), [wishOffset]);

  const renderAvatar = (member: FamilyBirthdayMember) => {
    const isPhoto =
      member.avatarUrl?.startsWith('data:') || member.avatarUrl?.startsWith('http');
    if (isPhoto) {
      return (
        <img
          src={member.avatarUrl}
          alt={member.name}
          className="w-full h-full object-cover"
        />
      );
    }
    if (member.role === 'mother') {
      return <span>{member.avatarUrl || '🧘‍♀️'}</span>;
    }
    return (
      <span>
        {member.avatarUrl?.includes('girl') || member.nickname.includes('Băng') ? '👧' : '👦'}
      </span>
    );
  };

  // CASE 1: CÓ SINH NHẬT TRONG VÒNG 1 TUẦN (1..7 ngày) HOẶC ĐÚNG HÔM NAY (0 ngày)
  if (activeBirthdayMembers.length > 0) {
    return (
      <div className="mb-4 space-y-2.5">
        {activeBirthdayMembers.map((member) => {
          const msg = getBirthdayBannerMessage(member, wishOffset);
          const isToday = member.isBirthdayToday;

          return (
            <div
              key={member.id}
              className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 text-white shadow-lg transition-all ${
                isToday
                  ? 'bg-gradient-to-r from-rose-500 via-fuchsia-500 to-amber-500 ring-2 ring-amber-300/80'
                  : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500'
              }`}
            >
              {/* Decorative circles */}
              <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/15 blur-xl pointer-events-none" />
              <div className="absolute -bottom-8 -left-8 w-28 h-28 rounded-full bg-white/10 blur-lg pointer-events-none" />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div
                    className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl border-2 border-white/70 shadow-md flex items-center justify-center text-3xl shrink-0 overflow-hidden bg-white/20 backdrop-blur-sm"
                    style={{ backgroundColor: member.color }}
                  >
                    {renderAvatar(member)}
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/25 backdrop-blur-md text-[11px] font-black tracking-wide uppercase">
                      {isToday ? (
                        <Cake className="w-3.5 h-3.5 text-amber-200 animate-bounce" />
                      ) : (
                        <Gift className="w-3.5 h-3.5 text-amber-200" />
                      )}
                      <span>{msg.badge}</span>
                    </div>

                    <h3 className="text-base sm:text-lg font-black leading-snug">
                      {msg.headline}
                    </h3>

                    <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed max-w-3xl">
                      {msg.wishText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    type="button"
                    onClick={() => setWishOffset((v) => v + 1)}
                    className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                    title="Đổi câu chúc mừng khác"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Đổi câu chúc</span>
                  </button>
                  <Link
                    to="/children"
                    className="px-3 py-1.5 rounded-xl bg-white text-rose-600 hover:bg-rose-50 text-xs font-extrabold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Hồ sơ &amp; Sinh nhật</span>
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // CASE 2: NGÀY THƯỜNG — MỖI NGÀY 1 CÂU CHÚC GIA ĐÌNH + NHẮC SINH NHẬT SẮP TỚI
  return (
    <div className="mb-4 relative overflow-hidden rounded-2xl border border-rose-200/70 dark:border-rose-800/40 bg-gradient-to-r from-rose-50/90 via-amber-50/70 to-sky-50/80 dark:from-rose-950/25 dark:via-amber-950/15 dark:to-sky-950/20 px-4 py-3 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center text-xl shadow-sm shrink-0">
            {dailyWish.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-700 dark:text-rose-300">
                <Sparkles className="w-3 h-3" /> Lời chúc mỗi ngày • {dailyWish.category}
              </span>
              {nearestUpcomingMember && nearestUpcomingMember.daysUntilBirthday !== null && (
                <Link
                  to="/children"
                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25 transition-colors"
                  title="Bấm để cấu hình ngày sinh nhật của Mẹ & các con"
                >
                  <Cake className="w-3 h-3 text-rose-500" />
                  <span>
                    Sinh nhật tiếp theo: <strong>{nearestUpcomingMember.nickname}</strong> (
                    {nearestUpcomingMember.nextBirthdayDisplay} • còn{' '}
                    {nearestUpcomingMember.daysUntilBirthday} ngày)
                  </span>
                </Link>
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-content-primary mt-1 leading-relaxed">
              “{dailyWish.text}”
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
          <button
            type="button"
            onClick={() => setWishOffset((v) => v + 1)}
            className="px-2.5 py-1.5 rounded-xl bg-white/80 dark:bg-slate-800/80 hover:bg-white border border-app-border text-[11px] font-bold text-content-secondary hover:text-primary flex items-center gap-1 transition-all shadow-2xs"
            title="Xem câu chúc khác"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Đổi câu chúc</span>
          </button>
          <Link
            to="/children"
            className="px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[11px] font-bold flex items-center gap-1 transition-all"
            title="Cấu hình thông tin & sinh nhật của Mẹ và các con"
          >
            <Heart className="w-3 h-3 text-rose-500" />
            <span>Hồ sơ Mẹ &amp; Bé</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
