import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { useScheduleDate } from '@/context/DateContext';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  CheckCircle2,
  CalendarX,
  RefreshCw,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { storage } from '@/services/storage';
import { resolveSchedule } from '@/domain/schedule-resolution/resolveSchedule';
import { ScheduleException, ExceptionType } from '@/domain/types';
import { getLunarDateInfo } from '@/utils/lunarCalendar';
import { getHolidayInfo, getDayTextClass, getWeekdayHeaderClass } from '@/utils/vietnameseHolidays';

export const CalendarPage: React.FC = () => {
  const { activeChild } = useChild();
  const { selectedDate, setSelectedDate } = useScheduleDate();

  const [exceptions, setExceptions] = useState<ScheduleException[]>(() => storage.getExceptions());
  const [isAddExceptionOpen, setIsAddExceptionOpen] = useState(false);

  // Form state
  const [excType, setExcType] = useState<ExceptionType>('cancel');
  const [excSubject, setExcSubject] = useState('');
  const [excNote, setExcNote] = useState('');
  const [excStartTime, setExcStartTime] = useState('07:00');
  const [excEndTime, setExcEndTime] = useState('11:30');

  const selectedDateObj = parseISO(selectedDate);
  const monthStart = startOfMonth(selectedDateObj);
  const monthEnd = endOfMonth(selectedDateObj);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  // JS getDay(): 0 is Sunday, 1 is Monday ... 6 is Saturday
  // Columns are: T2(0), T3(1), T4(2), T5(3), T6(4), T7(5), CN(6)
  const startOffset = (monthStart.getDay() + 6) % 7;
  const trailingOffset = (7 - ((startOffset + days.length) % 7)) % 7;

  // Resolve schedule for the selected date
  const templates = storage.getTemplates();
  const entries = storage.getEntries();
  const extraSchedules = storage.getExtraSchedules();

  const resolved = resolveSchedule(selectedDate, {
    child: activeChild,
    templates,
    entries,
    extraSchedules,
    exceptions,
  });

  const dayExceptions = exceptions.filter((e) => e.child_id === activeChild.id && e.date === selectedDate);

  const handleAddException = (e: React.FormEvent) => {
    e.preventDefault();
    const newExc: Omit<ScheduleException, 'id'> = {
      child_id: activeChild.id,
      date: selectedDate,
      type: excType,
      subject: excSubject.trim() || undefined,
      note: excNote.trim() || (excType === 'cancel' ? 'Nghỉ học cả ngày' : 'Thay đổi thời khóa biểu'),
      start_time: excType === 'replace' ? excStartTime : undefined,
      end_time: excType === 'replace' ? excEndTime : undefined,
    };
    const created = storage.addException(newExc);
    setExceptions(storage.getExceptions());
    setIsAddExceptionOpen(false);
    setExcSubject('');
    setExcNote('');
  };

  const handleDeleteException = (id: string) => {
    storage.deleteException(id);
    setExceptions(storage.getExceptions());
  };

  const handleQuickCancelDay = () => {
    const newExc: Omit<ScheduleException, 'id'> = {
      child_id: activeChild.id,
      date: selectedDate,
      type: 'cancel',
      note: 'Nghỉ học cả ngày (Báo bận / Nghỉ lễ)',
    };
    storage.addException(newExc);
    setExceptions(storage.getExceptions());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            <span>Lịch Học & Sự Kiện Gia Đình</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Điều hướng thời gian theo tháng, tự động giải quyết TKB theo khoảng hiệu lực và quản lý các ngày Ngoại lệ
            (nghỉ học, học bù) cho {activeChild.name}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<CalendarX className="w-4 h-4 text-rose-500" />}
            onClick={handleQuickCancelDay}
          >
            Báo nghỉ ngày này
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddExceptionOpen(true)}
          >
            Thêm ngoại lệ / Đổi tiết
          </Button>
        </div>
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
                  const todayStr = format(new Date(), 'yyyy-MM-dd');
                  setSelectedDate(todayStr);
                }}
              >
                Hôm nay
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
            {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => (
              <div key={d} className={`text-xs py-1.5 uppercase text-center ${getWeekdayHeaderClass(i)}`}>
                {d}
              </div>
            ))}

            {/* Empty slots before first day of month to align weekdays */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div
                key={`empty-start-${i}`}
                className="min-h-[64px] rounded-theme-md bg-app-surface/20 border border-dashed border-app-border/20 opacity-30 pointer-events-none"
              />
            ))}

            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const isSelected = dateStr === selectedDate;
              const hasException = exceptions.some((e) => e.child_id === activeChild.id && e.date === dateStr);
              const isToday = isSameDay(day, new Date());
              const dayOfWeek = ((day.getDay() + 6) % 7) + 2; // T2=2 .. CN=8
              const isWeekday = day.getDay() >= 1 && day.getDay() <= 5;
              const hasSchool = isWeekday;
              const hasExtra = extraSchedules.some(
                (es) => es.child_id === activeChild.id && es.active && es.weekdays.includes(dayOfWeek as any)
              );
              const isCancelled = exceptions.some(
                (e) => e.child_id === activeChild.id && e.date === dateStr && e.type === 'cancel'
              );
              const holiday = getHolidayInfo(day);

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[64px] p-1.5 rounded-theme-md flex flex-col items-center justify-between border transition-all ${
                    isSelected
                      ? holiday.isRedDay
                        ? 'bg-red-500 text-white font-bold shadow-theme-sm border-red-500 scale-[1.02]'
                        : holiday.isSaturday
                        ? 'bg-blue-500 text-white font-bold shadow-theme-sm border-blue-500 scale-[1.02]'
                        : 'bg-primary text-primary-foreground font-bold shadow-theme-sm border-primary scale-[1.02]'
                      : holiday.isRedDay
                      ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200/80 dark:border-red-900/40 hover:border-red-400'
                      : holiday.isSaturday
                      ? 'bg-blue-50/40 dark:bg-blue-950/10 border-blue-200/60 dark:border-blue-900/30 hover:border-blue-400'
                      : 'bg-app-surface text-content-primary border-app-subtle hover:border-primary/40 hover:bg-black/5'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs ${getDayTextClass(holiday, isSelected)}`}>
                      {format(day, 'd')}
                    </span>
                    {isToday && (
                      <span className={`text-[8px] px-1 rounded font-bold ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                      }`}>
                        Nay
                      </span>
                    )}
                  </div>
                  {/* Holiday name badge */}
                  {holiday.holidayName && (
                    <div className="w-full">
                      <span className={`text-[7px] leading-tight font-black truncate block text-center px-0.5 rounded ${
                        isSelected ? 'text-white/90' : 'text-red-600 dark:text-red-400'
                      }`}>
                        🎌 {holiday.holidayName}
                      </span>
                    </div>
                  )}

                  {/* Vietnamese Lunar Date Subtext */}
                  {(() => {
                    const lunar = getLunarDateInfo(day);
                    return (
                      <div className="w-full flex items-center justify-center my-0.5">
                        <span
                          className={`text-[9px] leading-tight px-1 py-0.2 rounded ${
                            (lunar.isFirstDay || lunar.isFullMoon)
                              ? isSelected
                                ? 'bg-amber-400/30 text-amber-200 font-bold'
                                : 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-bold'
                              : isSelected
                              ? 'text-white/80 font-normal'
                              : 'text-content-muted font-normal'
                          }`}
                          title={`Âm lịch: ${lunar.fullText}${lunar.specialEvent ? ` (${lunar.specialEvent})` : ''}`}
                        >
                          {lunar.specialEvent || lunar.shortText}
                        </span>
                      </div>
                    );
                  })()}

                  {/* Color-Coded Session Dots */}
                  <div className="flex items-center gap-1">
                    {hasSchool && !isCancelled && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}
                        title="Chính khóa"
                      />
                    )}
                    {hasExtra && !isCancelled && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-200' : 'bg-purple-500'}`}
                        title="Học thêm"
                      />
                    )}
                    {hasException && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ring-1 ring-white ${
                          isSelected ? 'bg-amber-300' : 'bg-rose-500'
                        }`}
                        title="Có ngoại lệ / Nghỉ học"
                      />
                    )}
                  </div>
                </button>
              );
            })}

            {/* Empty slots after last day of month to complete grid row */}
            {Array.from({ length: trailingOffset }).map((_, i) => (
              <div
                key={`empty-end-${i}`}
                className="min-h-[64px] rounded-theme-md bg-app-surface/20 border border-dashed border-app-border/20 opacity-30 pointer-events-none"
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-app-subtle text-xs text-content-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Chính khóa</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>Học thêm</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>Ngoại lệ / Nghỉ học</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-black">CN / Lễ</span>
              <span>Chủ nhật &amp; Ngày lễ</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-[10px] font-black">T7</span>
              <span>Thứ Bảy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 text-[10px] font-bold">
                Rằm / Mùng 1
              </span>
              <span>Lịch Âm</span>
            </div>
          </div>
        </Card>

        {/* Selected Day Schedule Summary */}
        <Card className="p-5 space-y-4">
          <div className="pb-3 border-b border-app-border flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-primary uppercase">CHI TIẾT LỊCH TRÌNH</span>
                {(() => {
                  const selLunar = getLunarDateInfo(selectedDateObj);
                  const selHoliday = getHolidayInfo(selectedDateObj);
                  return (
                    <>
                      {selHoliday.holidayName && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 font-black border border-red-200 dark:border-red-800 animate-pulse">
                          🎌 {selHoliday.holidayName} (Nghỉ lễ)
                        </span>
                      )}
                      {!selHoliday.holidayName && selHoliday.isSunday && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-bold border border-red-200 dark:border-red-900/50">
                          🔴 Nghỉ Chủ nhật
                        </span>
                      )}
                      {!selHoliday.holidayName && selHoliday.isSaturday && (
                        <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-900/50">
                          🔵 Thứ Bảy
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-medium">
                        <span>🏮 Âm lịch: {selLunar.fullText}</span>
                        {selLunar.specialEvent && <strong>({selLunar.specialEvent})</strong>}
                      </span>
                    </>
                  );
                })()}
              </div>
              {(() => {
                const selHoliday = getHolidayInfo(selectedDateObj);
                return (
                  <h3 className={`text-lg font-bold mt-1 ${
                    selHoliday.isRedDay ? 'text-red-600 dark:text-red-400' : 'text-content-primary'
                  }`}>
                    Ngày {format(selectedDateObj, 'dd/MM/yyyy')} ({format(selectedDateObj, 'EEEE', { locale: vi })})
                  </h3>
                );
              })()}
              <p className="text-xs text-content-muted">
                {activeChild.name} • {resolved.timetableTemplate?.name || 'Không có TKB hiệu lực'}
              </p>
            </div>
            {dayExceptions.length > 0 && (
              <Badge variant="warning" size="sm">
                {dayExceptions.length} ngoại lệ
              </Badge>
            )}
          </div>

          {/* Active Exceptions List on this Day */}
          {dayExceptions.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Ngoại lệ áp dụng hôm nay:</span>
              </div>
              {dayExceptions.map((exc) => (
                <div
                  key={exc.id}
                  className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs flex items-center justify-between text-rose-900"
                >
                  <div>
                    <div className="font-bold flex items-center gap-1">
                      <span>{exc.type === 'cancel' ? '🚫 Nghỉ học' : '🔄 Đổi môn/lịch'}</span>
                      {exc.subject && <span>• Môn: {exc.subject}</span>}
                    </div>
                    {exc.note && <div className="text-[11px] text-rose-700 mt-0.5">{exc.note}</div>}
                  </div>
                  <button
                    onClick={() => handleDeleteException(exc.id)}
                    className="p-1 text-rose-400 hover:text-rose-700 rounded hover:bg-rose-100"
                    title="Xoá ngoại lệ này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Resolved Periods */}
          <div className="space-y-4">
            <div>
              <div className="text-xs font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                <span>☀️</span> Buổi sáng ({resolved.morning.length} tiết)
              </div>
              <div className="space-y-1.5">
                {resolved.morning.length === 0 ? (
                  <p className="text-xs text-content-muted italic">Không có tiết</p>
                ) : (
                  resolved.morning.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded border text-xs flex justify-between items-center ${
                        m.isCancelled
                          ? 'bg-rose-50/70 border-rose-200 line-through text-rose-700'
                          : 'bg-app-bg border-app-subtle'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-content-primary">{m.title}</span>
                        {m.subtitle && <span className="text-[11px] text-content-muted ml-1">({m.subtitle})</span>}
                      </div>
                      <span className="text-content-muted font-mono text-[11px]">{m.timeDisplay}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-sky-700 mb-1.5 flex items-center gap-1">
                <span>☁️</span> Buổi chiều ({resolved.afternoon.length} tiết)
              </div>
              <div className="space-y-1.5">
                {resolved.afternoon.length === 0 ? (
                  <p className="text-xs text-content-muted italic">Không có tiết</p>
                ) : (
                  resolved.afternoon.map((m) => (
                    <div
                      key={m.id}
                      className={`p-2 rounded border text-xs flex justify-between items-center ${
                        m.isCancelled
                          ? 'bg-rose-50/70 border-rose-200 line-through text-rose-700'
                          : 'bg-app-bg border-app-subtle'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-content-primary">{m.title}</span>
                        {m.subtitle && <span className="text-[11px] text-content-muted ml-1">({m.subtitle})</span>}
                      </div>
                      <span className="text-content-muted font-mono text-[11px]">{m.timeDisplay}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-purple-700 mb-1.5 flex items-center gap-1">
                <span>🌙</span> Buổi tối ({resolved.evening.length} lớp)
              </div>
              <div className="space-y-1.5">
                {resolved.evening.length === 0 ? (
                  <p className="text-xs text-content-muted italic">Nghỉ ngơi, không có lịch học thêm</p>
                ) : (
                  resolved.evening.map((m) => (
                    <div
                      key={m.id}
                      className="p-2 rounded bg-purple-50/60 border border-purple-200 text-xs flex justify-between items-center"
                    >
                      <span className="font-bold text-purple-800">{m.title}</span>
                      <span className="text-purple-600 font-mono text-[11px]">{m.timeDisplay}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ADD EXCEPTION MODAL */}
      {isAddExceptionOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" />
                <span>Thêm Ngoại Lệ Cho Ngày {format(selectedDateObj, 'dd/MM/yyyy')}</span>
              </h3>
              <button
                onClick={() => setIsAddExceptionOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddException} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Loại ngoại lệ</label>
                <select
                  value={excType}
                  onChange={(e) => setExcType(e.target.value as ExceptionType)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="cancel">🚫 Báo nghỉ học (Nghỉ ốm, Nghỉ lễ, Bận việc)</option>
                  <option value="replace">🔄 Học bù / Đổi môn khác</option>
                  <option value="custom">✨ Sự kiện đặc biệt (Dã ngoại, Thi kiểm tra...)</option>
                </select>
              </div>

              {excType !== 'cancel' && (
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Môn học / Hoạt động *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Thi Giữa Kỳ, Dã ngoại sinh thái..."
                    value={excSubject}
                    onChange={(e) => setExcSubject(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              {excType === 'replace' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={excStartTime}
                      onChange={(e) => setExcStartTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-content-primary">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={excEndTime}
                      onChange={(e) => setExcEndTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Lý do / Ghi chú</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú thêm cho gia đình..."
                  value={excNote}
                  onChange={(e) => setExcNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddExceptionOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu ngoại lệ
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
