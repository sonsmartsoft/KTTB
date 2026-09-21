import React from 'react';
import { useChild } from '@/context/ChildContext';
import { useScheduleDate } from '@/context/DateContext';
import { storage } from '@/services/storage';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { MascotBoy } from '@/design-system/illustrations/MascotBoy';
import { BookStack } from '@/design-system/illustrations/BookStack';
import { Sun, Cloud, Moon, Calendar as CalendarIcon, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getSubjectMeta } from '@/design-system/tokens/colors';

export const DashboardPage: React.FC = () => {
  const { activeChild } = useChild();
  const { selectedDate, goToNextDay, goToPrevDay, goToToday } = useScheduleDate();

  // Resolve schedule for active child on selected date
  const templates = storage.getTemplates();
  const entries = storage.getEntries();
  const extraSchedules = storage.getExtraSchedules();
  const exceptions = storage.getExceptions();

  const resolved = resolveSchedule(selectedDate, {
    child: activeChild,
    templates,
    entries,
    extraSchedules,
    exceptions,
  });

  const weekdayLabel = {
    2: 'Thứ 2',
    3: 'Thứ 3',
    4: 'Thứ 4',
    5: 'Thứ 5',
    6: 'Thứ 6',
    7: 'Thứ 7',
    8: 'Chủ nhật',
  }[resolved.weekday];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <Card variant="gradient" className="p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2 z-10 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Thời khóa biểu hôm nay</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-content-primary">
              Chào ngày mới, {activeChild.name}! 👋
            </h2>
            <p className="text-xs md:text-sm text-content-secondary leading-relaxed">
              {activeChild.class_name} • {activeChild.school_name} — Chúc con một ngày học tập thật hứng khởi và nhiều niềm vui!
            </p>
            <div className="flex items-center gap-3 pt-2">
              <Link to="/timetable">
                <Button size="sm" variant="primary" icon={<ArrowRight className="w-4 h-4" />}>
                  Xem TKB toàn tuần
                </Button>
              </Link>
              <Link to="/performance">
                <Button size="sm" variant="outline">
                  Xem điểm số & mục tiêu
                </Button>
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-3 z-10">
            <MascotBoy size={120} />
            <BookStack size={90} />
          </div>
        </div>
      </Card>

      {/* Date Navigation Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-app-card p-3 rounded-theme-md border border-app-border shadow-theme-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <span className="text-sm font-bold text-content-primary">
            {weekdayLabel}, ngày {selectedDate.split('-').reverse().join('/')}
          </span>
          {resolved.timetableTemplate && (
            <Badge variant="primary" size="sm">
              {resolved.timetableTemplate.name}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="outline" onClick={goToPrevDay}>
            ◀ Ngày trước
          </Button>
          <Button size="sm" variant="soft" onClick={goToToday}>
            Hôm nay
          </Button>
          <Button size="sm" variant="outline" onClick={goToNextDay}>
            Ngày sau ▶
          </Button>
        </div>
      </div>

      {/* Daily Schedule Columns: Sáng, Chiều, Tối */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Morning */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <Sun className="w-5 h-5" />
              <span>BUỔI SÁNG</span>
            </div>
            <span className="text-xs text-content-muted">7:00 – 11:30</span>
          </div>

          {resolved.morning.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">
              Không có tiết học buổi sáng
            </div>
          ) : (
            <div className="space-y-2">
              {resolved.morning.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}
                  >
                    <div>
                      <div className={`text-xs font-bold ${meta.textClass}`}>
                        {item.period ? `Tiết ${item.period}: ` : ''}{item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-content-secondary mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[10px] text-amber-700 italic mt-0.5">
                          * {item.note}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-content-secondary font-medium">
                        {item.timeDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Afternoon */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-sky-200">
            <div className="flex items-center gap-2 text-sky-600 font-bold text-sm">
              <Cloud className="w-5 h-5" />
              <span>BUỔI CHIỀU</span>
            </div>
            <span className="text-xs text-content-muted">13:30 – 17:00</span>
          </div>

          {resolved.afternoon.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">
              Không có tiết học buổi chiều
            </div>
          ) : (
            <div className="space-y-2">
              {resolved.afternoon.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}
                  >
                    <div>
                      <div className={`text-xs font-bold ${meta.textClass}`}>
                        {item.period ? `Tiết ${item.period}: ` : ''}{item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-content-secondary mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[10px] text-sky-700 italic mt-0.5">
                          * {item.note}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-content-secondary font-medium">
                        {item.timeDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Evening / Extra Classes */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-purple-200">
            <div className="flex items-center gap-2 text-purple-600 font-bold text-sm">
              <Moon className="w-5 h-5" />
              <span>BUỔI TỐI & HỌC THÊM</span>
            </div>
            <span className="text-xs text-content-muted">17:15 – 21:30</span>
          </div>

          {resolved.evening.length === 0 ? (
            <div className="py-6 text-center text-xs text-content-muted">
              Tối nay bé không có lịch học thêm, được nghỉ ngơi! 🎉
            </div>
          ) : (
            <div className="space-y-2">
              {resolved.evening.map((item) => {
                const meta = getSubjectMeta(item.title);
                return (
                  <div
                    key={item.id}
                    className={`p-2.5 rounded-theme-sm border ${meta.bgClass} ${meta.borderClass} flex items-center justify-between transition-all`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-xs font-bold ${meta.textClass}`}>
                          {item.title}
                        </span>
                        <Badge variant="secondary" size="sm">Học thêm</Badge>
                      </div>
                      {item.subtitle && (
                        <div className="text-[11px] text-content-secondary mt-0.5">
                          {item.subtitle}
                        </div>
                      )}
                      {item.note && (
                        <div className="text-[10px] text-purple-700 italic mt-0.5">
                          * {item.note}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-content-secondary font-medium">
                        {item.timeDisplay}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
