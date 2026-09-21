import {
  Child,
  TimetableTemplate,
  TimetableEntry,
  ExtraSchedule,
  ScheduleException,
  ResolvedDailySchedule,
  DailyScheduleItem,
  WeekdayNumber,
} from '@/domain/types';

export function getVietnameseWeekday(dateStr: string): WeekdayNumber {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(year, month - 1, day);
  const jsDay = d.getDay(); // 0 is Sunday, 1 is Monday...
  if (jsDay === 0) return 8; // Chủ nhật
  return (jsDay + 1) as WeekdayNumber;
}

export interface ScheduleResolutionData {
  child: Child;
  templates: TimetableTemplate[];
  entries: TimetableEntry[];
  extraSchedules: ExtraSchedule[];
  exceptions: ScheduleException[];
}

/**
 * Pure domain schedule resolution engine.
 * Priority:
 * 1. Date-specific exceptions (cancellation, substitution, time adjust)
 * 2. Active timetable version (valid_from <= date <= valid_to)
 * 3. Weekly timetable entries for that weekday
 * 4. Extra schedules active on that weekday and date
 */
export function resolveSchedule(
  dateStr: string,
  data: ScheduleResolutionData
): ResolvedDailySchedule {
  const { child, templates, entries, extraSchedules, exceptions } = data;
  const weekday = getVietnameseWeekday(dateStr);

  // 1. Find active timetable version for the selected date
  const activeTemplate =
    templates.find(
      (t) =>
        t.child_id === child.id &&
        t.status === 'active' &&
        t.valid_from <= dateStr &&
        t.valid_to >= dateStr
    ) || null;

  // 2. Find weekly entries for this weekday in the active template
  const rawEntries = activeTemplate
    ? entries.filter(
        (e) => e.timetable_id === activeTemplate.id && e.weekday === weekday
      )
    : [];

  // 3. Find date-specific exceptions for this child and date
  const dateExceptions = exceptions.filter(
    (exc) => exc.child_id === child.id && exc.date === dateStr
  );

  // Build daily schedule items from school entries
  const schoolItems: DailyScheduleItem[] = rawEntries.map((entry) => {
    // Check if there is an exception overriding this specific entry
    const matchingException = dateExceptions.find(
      (exc) => exc.timetable_entry_id === entry.id
    );

    if (matchingException) {
      if (matchingException.type === 'cancel') {
        return {
          id: `entry-${entry.id}-cancelled`,
          source: 'exception',
          title: entry.subject,
          subtitle: entry.teacher ? `GV: ${entry.teacher}` : undefined,
          timeDisplay: `${entry.start_time} – ${entry.end_time}`,
          period: entry.period,
          session: entry.session,
          room: entry.room,
          note: matchingException.note || 'Tiết học bị hủy',
          color: entry.color,
          isCancelled: true,
          originalEntryId: entry.id,
        };
      }

      if (matchingException.type === 'replace') {
        return {
          id: `entry-${entry.id}-replaced`,
          source: 'exception',
          title: matchingException.subject || entry.subject,
          subtitle: matchingException.teacher ? `GV: ${matchingException.teacher}` : entry.teacher,
          timeDisplay: matchingException.start_time && matchingException.end_time
            ? `${matchingException.start_time} – ${matchingException.end_time}`
            : `${entry.start_time} – ${entry.end_time}`,
          period: entry.period,
          session: entry.session,
          room: entry.room,
          note: matchingException.note || 'Thay đổi tiết học',
          color: entry.color,
          isModified: true,
          originalEntryId: entry.id,
        };
      }
    }

    return {
      id: `entry-${entry.id}`,
      source: 'school',
      title: entry.subject,
      subtitle: entry.teacher ? `GV: ${entry.teacher}` : undefined,
      timeDisplay: `${entry.start_time} – ${entry.end_time}`,
      period: entry.period,
      session: entry.session,
      room: entry.room,
      note: entry.note,
      color: entry.color,
      originalEntryId: entry.id,
    };
  });

  // Handle standalone custom exceptions for this date (not linked to an existing entry)
  const standaloneExceptions = dateExceptions.filter(
    (exc) => !exc.timetable_entry_id && exc.type !== 'cancel'
  );

  const customItems: DailyScheduleItem[] = standaloneExceptions.map((exc) => ({
    id: `exc-${exc.id}`,
    source: 'exception',
    title: exc.subject || 'Lịch đặc biệt',
    subtitle: exc.teacher,
    timeDisplay: exc.start_time && exc.end_time ? `${exc.start_time} – ${exc.end_time}` : 'Trong ngày',
    session: 'morning',
    note: exc.note,
    isModified: true,
  }));

  // 4. Load extra schedules applicable to this weekday and child
  const childExtraSchedules = extraSchedules.filter((extra) => {
    if (extra.child_id !== child.id || !extra.active) return false;
    if (!extra.weekdays.includes(weekday)) return false;
    if (extra.valid_from && extra.valid_from > dateStr) return false;
    if (extra.valid_to && extra.valid_to < dateStr) return false;
    return true;
  });

  const extraItems: DailyScheduleItem[] = childExtraSchedules.map((extra) => {
    // Check if an exception cancelled this extra class
    const cancelledExc = dateExceptions.find(
      (exc) => exc.subject === extra.name && exc.type === 'cancel'
    );

    return {
      id: `extra-${extra.id}`,
      source: 'extra',
      title: extra.name,
      subtitle: extra.category,
      timeDisplay: `${extra.start_time} – ${extra.end_time}`,
      session: extra.session,
      note: extra.note,
      color: extra.color,
      isExtra: true,
      isCancelled: Boolean(cancelledExc),
    };
  });

  // 5. Combine and group into Morning, Afternoon, Evening
  const allItems = [...schoolItems, ...customItems, ...extraItems];

  const morning = allItems
    .filter((item) => item.session === 'morning')
    .sort((a, b) => (a.period || 0) - (b.period || 0) || a.timeDisplay.localeCompare(b.timeDisplay));

  const afternoon = allItems
    .filter((item) => item.session === 'afternoon')
    .sort((a, b) => (a.period || 0) - (b.period || 0) || a.timeDisplay.localeCompare(b.timeDisplay));

  const evening = allItems
    .filter((item) => item.session === 'evening')
    .sort((a, b) => a.timeDisplay.localeCompare(b.timeDisplay));

  return {
    child,
    date: dateStr,
    weekday,
    timetableTemplate: activeTemplate,
    morning,
    afternoon,
    evening,
    exceptions: dateExceptions,
    extraSchedules: childExtraSchedules,
  };
}
