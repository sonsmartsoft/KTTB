import React from 'react';
import { useChild } from '@/context/ChildContext';
import { useScheduleDate } from '@/context/DateContext';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storage } from '@/services/storage';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';

export const CalendarPage: React.FC = () => {
  const { activeChild } = useChild();
  const { selectedDate, setSelectedDate } = useScheduleDate();

  const selectedDateObj = parseISO(selectedDate);
  const monthStart = startOfMonth(selectedDateObj);
  const monthEnd = endOfMonth(selectedDateObj);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Resolve schedule for the selected date
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <span>Lịch Học & Sự Kiện Gia Đình</span>
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          Điều hướng thời gian theo tháng và tự động chọn đúng phiên bản Thời khóa biểu theo ngày hiệu lực
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Month Calendar Grid */}
        <Card className="lg:col-span-2 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-app-border">
            <h3 className="text-base font-bold text-content-primary capitalize">
              {format(selectedDateObj, 'MMMM yyyy', { locale: vi })}
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() - 1, 1);
                  setSelectedDate(format(prevMonth, 'yyyy-MM-dd'));
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 1);
                  setSelectedDate(format(nextMonth, 'yyyy-MM-dd'));
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Day Matrix */}
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => (
              <div key={d} className="text-xs font-bold text-content-muted py-1.5 uppercase">
                {d}
              </div>
            ))}

            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = dateStr === selectedDate;
              const hasException = exceptions.some((e) => e.child_id === activeChild.id && e.date === dateStr);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[56px] p-1.5 rounded-theme-md flex flex-col items-center justify-between border transition-all ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-theme-sm border-primary'
                      : 'bg-app-surface text-content-primary border-app-subtle hover:border-primary/40'
                  }`}
                >
                  <span className="text-xs">{format(day, 'd')}</span>
                  <div className="flex items-center gap-1 mt-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                    {hasException && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-app-subtle text-xs text-content-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Lịch học chính khóa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Có sự kiện / Thay đổi / Thi</span>
            </div>
          </div>
        </Card>

        {/* Selected Day Schedule Summary */}
        <Card className="p-5 space-y-4">
          <div className="pb-3 border-b border-app-border">
            <span className="text-xs font-bold text-primary">CHI TIẾT LỊCH TRÌNH</span>
            <h3 className="text-lg font-bold text-content-primary mt-0.5">
              Ngày {format(selectedDateObj, 'dd/MM/yyyy')}
            </h3>
            <p className="text-xs text-content-muted">
              {activeChild.name} • {resolved.timetableTemplate?.name || 'Chưa có TKB'}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                <span>☀️</span> Buổi sáng ({resolved.morning.length} tiết)
              </div>
              <div className="space-y-1.5">
                {resolved.morning.map((m) => (
                  <div key={m.id} className="p-2 rounded bg-app-bg border border-app-subtle text-xs flex justify-between">
                    <span className="font-bold text-content-primary">{m.title}</span>
                    <span className="text-content-muted font-mono">{m.timeDisplay}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-sky-700 mb-1.5 flex items-center gap-1">
                <span>☁️</span> Buổi chiều ({resolved.afternoon.length} tiết)
              </div>
              <div className="space-y-1.5">
                {resolved.afternoon.map((m) => (
                  <div key={m.id} className="p-2 rounded bg-app-bg border border-app-subtle text-xs flex justify-between">
                    <span className="font-bold text-content-primary">{m.title}</span>
                    <span className="text-content-muted font-mono">{m.timeDisplay}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-purple-700 mb-1.5 flex items-center gap-1">
                <span>🌙</span> Buổi tối ({resolved.evening.length} lớp)
              </div>
              <div className="space-y-1.5">
                {resolved.evening.length === 0 ? (
                  <p className="text-xs text-content-muted italic">Nghỉ ngơi</p>
                ) : (
                  resolved.evening.map((m) => (
                    <div key={m.id} className="p-2 rounded bg-app-bg border border-app-subtle text-xs flex justify-between">
                      <span className="font-bold text-purple-700">{m.title}</span>
                      <span className="text-content-muted font-mono">{m.timeDisplay}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
