import React from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Printer, Calendar, BookOpen, Clock } from 'lucide-react';
import { DAY_HEADER_COLORS, getSubjectMeta } from '@/design-system/tokens/colors';
import { MascotBoy } from '@/design-system/illustrations/MascotBoy';
import { BookStack } from '@/design-system/illustrations/BookStack';
import { PushPin, SpeechBubble, MotivationalRibbon } from '@/design-system/illustrations/DecorativeBadges';

export const TimetablePage: React.FC = () => {
  const { activeChild } = useChild();

  const templates = storage.getTemplates().filter((t) => t.child_id === activeChild.id && t.status === 'active');
  const activeTemplate = templates[0] || null;

  const entries = activeTemplate
    ? storage.getEntries().filter((e) => e.timetable_id === activeTemplate.id)
    : [];

  const extraSchedules = storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id && e.active);

  const handlePrint = () => {
    window.print();
  };

  const weekdays = [2, 3, 4, 5, 6, 7, 8] as const;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <div>
          <h2 className="text-xl md:text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <span>Thời Khóa Biểu Tuần</span>
            {activeTemplate && <Badge variant="primary">{activeTemplate.semester}</Badge>}
          </h2>
          <p className="text-xs text-content-secondary mt-0.5">
            {activeChild.name} • {activeChild.class_name} • {activeChild.school_name} ({activeTemplate?.school_year || '2026–2027'})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" icon={<Printer className="w-4 h-4" />} onClick={handlePrint}>
            In Thời Khóa Biểu (A4)
          </Button>
        </div>
      </div>

      {/* Hero A4 Infographic Layout matching sample.png */}
      <div className="timetable-print-container bg-white border border-app-border rounded-theme-card p-4 md:p-6 shadow-theme-md overflow-x-auto">
        {/* Infographic Header with mascot & slogans */}
        <div className="flex items-center justify-between pb-6 border-b border-blue-100 relative">
          {/* Left Mascot & Speech Bubble */}
          <div className="hidden lg:flex items-center gap-3">
            <MascotBoy size={110} />
            <SpeechBubble
              text="Cố gắng mỗi ngày để chạm tới ước mơ! ♡"
              subtext="Năm học 2026 - 2027"
              className="max-w-[190px]"
            />
          </div>

          {/* Central 3D Banner */}
          <div className="text-center flex-1">
            <h1 className="text-2xl md:text-4xl font-extrabold text-blue-600 font-display tracking-tight drop-shadow-sm">
              THỜI KHÓA BIỂU
            </h1>
            <div className="inline-block mt-1">
              <span className="text-2xl md:text-3xl font-black px-4 py-1 rounded-xl bg-amber-400 text-blue-900 border-2 border-blue-900 shadow-theme-pop uppercase font-display">
                {activeChild.class_name}
              </span>
            </div>
            <div className="mt-2 text-xs font-bold text-rose-500">
              ♥ Năm học {activeTemplate?.school_year || '2026 - 2027'} ♥
            </div>
          </div>

          {/* Right Mascot & Quote */}
          <div className="hidden lg:flex items-center gap-3">
            <div className="text-right">
              <MotivationalRibbon
                text="Học tốt, Rèn luyện tốt"
                subtext="Cùng nhau tiến bộ! ♡"
              />
            </div>
            <BookStack size={95} />
          </div>
        </div>

        {/* Timetable Matrix Grid */}
        <div className="min-w-[840px] mt-4">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-xs font-bold text-white bg-blue-700 rounded-tl-lg w-28 text-center border border-white/20">
                  Buổi
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-600 w-16 text-center border border-white/20">
                  Tiết
                </th>
                <th className="p-2 text-xs font-bold text-white bg-blue-500 w-24 text-center border border-white/20">
                  Thời gian
                </th>
                {weekdays.map((w) => {
                  const conf = DAY_HEADER_COLORS[w];
                  return (
                    <th
                      key={w}
                      className="p-2 text-xs font-extrabold text-white text-center border border-white/20 uppercase tracking-wide"
                      style={{ backgroundColor: conf.bg }}
                    >
                      {conf.label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {/* SÁNG (Morning 4 periods) */}
              {[1, 2, 3, 4].map((period, idx) => {
                const times = ['7:00 – 7:45', '8:45 – 9:30', '9:50 – 10:35', '10:55 – 11:40'][idx];
                return (
                  <tr key={`morning-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={4}
                        className="p-2 text-center bg-amber-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">☀️</div>
                        <div className="text-xs font-black text-amber-800 uppercase">Buổi sáng</div>
                        <div className="text-[10px] text-amber-700 font-mono">(7:00 – 11:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = entries.find(
                        (e) => e.session === 'morning' && e.weekday === weekday && e.period === period
                      );
                      if (!entry) {
                        return (
                          <td key={weekday} className="p-1.5 text-center text-slate-300 border border-slate-200">
                            —
                          </td>
                        );
                      }
                      const meta = getSubjectMeta(entry.subject);
                      return (
                        <td key={weekday} className="p-1 border border-slate-200">
                          <div className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center`}>
                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {entry.subject}
                            </div>
                            {entry.teacher && (
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                                - {entry.teacher}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* CHIỀU (Afternoon 3 periods) */}
              {[1, 2, 3].map((period, idx) => {
                const times = ['13:30 – 14:15', '14:35 – 15:20', '15:40 – 16:25'][idx];
                return (
                  <tr key={`afternoon-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={3}
                        className="p-2 text-center bg-sky-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">☁️</div>
                        <div className="text-xs font-black text-sky-800 uppercase">Buổi chiều</div>
                        <div className="text-[10px] text-sky-700 font-mono">(13:30 – 17:00)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Tiết {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      const entry = entries.find(
                        (e) => e.session === 'afternoon' && e.weekday === weekday && e.period === period
                      );
                      if (!entry) {
                        return (
                          <td key={weekday} className="p-1.5 text-center text-slate-300 border border-slate-200">
                            —
                          </td>
                        );
                      }
                      const meta = getSubjectMeta(entry.subject);
                      return (
                        <td key={weekday} className="p-1 border border-slate-200">
                          <div className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center`}>
                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {entry.subject}
                            </div>
                            {entry.teacher && (
                              <div className="text-[10px] text-slate-500 mt-0.5 leading-none">
                                - {entry.teacher}
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* TỐI / HỌC THÊM (Evening 2 rows) */}
              {[1, 2].map((period, idx) => {
                const times = ['17:15 – 19:15', '19:15 – 21:15'][idx];
                return (
                  <tr key={`evening-${period}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    {idx === 0 && (
                      <td
                        rowSpan={2}
                        className="p-2 text-center bg-indigo-50 border border-slate-200 align-middle"
                      >
                        <div className="text-2xl mb-1">🌙</div>
                        <div className="text-xs font-black text-indigo-800 uppercase">Buổi tối</div>
                        <div className="text-[10px] text-indigo-700 font-mono">(17:15 – 21:30)</div>
                      </td>
                    )}
                    <td className="p-2 text-center font-bold text-xs text-slate-700 bg-slate-50 border border-slate-200">
                      Ca {period}
                    </td>
                    <td className="p-2 text-center text-[11px] font-mono text-slate-600 bg-slate-50 border border-slate-200">
                      {times}
                    </td>
                    {weekdays.map((weekday) => {
                      // Find extra schedule for this weekday and period slot
                      const extra = extraSchedules.find((ex) => {
                        if (!ex.weekdays.includes(weekday)) return false;
                        if (idx === 0 && ex.start_time.startsWith('17')) return true;
                        if (idx === 1 && (ex.start_time.startsWith('19') || ex.start_time.startsWith('08') && weekday === 8)) return true;
                        return false;
                      });

                      if (!extra) {
                        return (
                          <td key={weekday} className="p-1.5 text-center text-slate-300 border border-slate-200">
                            —
                          </td>
                        );
                      }

                      const meta = getSubjectMeta(extra.name);
                      return (
                        <td key={weekday} className="p-1 border border-slate-200">
                          <div className={`p-1.5 rounded-lg border ${meta.bgClass} ${meta.borderClass} text-center min-h-[46px] flex flex-col justify-center`}>
                            <div className={`text-xs font-bold ${meta.textClass} leading-tight`}>
                              {extra.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {extra.start_time} – {extra.end_time}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Infographic Module: Lịch học thêm clipboard + Pinned Ghi chú */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5 pt-4 border-t border-slate-100">
          {/* Extra Classes Board */}
          <div className="md:col-span-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 relative">
            <div className="flex items-center gap-2 mb-2 font-bold text-xs text-blue-900">
              <span className="text-base">📋</span>
              <span className="uppercase tracking-wider">LỊCH HỌC THÊM</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Toán bồi dưỡng:</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 pl-3.5 font-mono">
                  Thứ 2, Thứ 5 | 19:15 – 21:15
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pink-500" />
                  <span>Tiếng Anh:</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 pl-3.5 font-mono">
                  Thứ 4, Thứ 7 | 17:15 – 19:15
                </div>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-blue-100 sm:col-span-2">
                <div className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Phụ đạo Tiếng Anh:</span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 pl-3.5 font-mono">
                  Thứ 6 | 19:30 – 21:30 (hoặc Chủ nhật 8:00 – 10:00 nếu không học T6)
                </div>
              </div>
            </div>
          </div>

          {/* Bulletin Note pinned with red pushpin */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 relative shadow-sm">
            <div className="absolute -top-3 right-4">
              <PushPin size={24} />
            </div>
            <div className="font-bold text-xs text-amber-900 mb-1.5 flex items-center gap-1">
              <span>📌</span>
              <span>Ghi chú viết tắt</span>
            </div>
            <ul className="text-[10px] text-amber-800 space-y-1">
              <li>• <strong>TANN:</strong> Tiếng Anh, nói chung</li>
              <li>• <strong>KNS:</strong> Kỹ năng sống</li>
              <li>• <strong>SHL:</strong> Sinh hoạt lớp</li>
              <li>• <strong>HĐTN:</strong> Hoạt động trải nghiệm hướng nghiệp</li>
              <li>• <strong>CN:</strong> Công nghệ</li>
              <li>• <strong>(S):</strong> Sinh học | <strong>(Lí):</strong> Vật lí</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
