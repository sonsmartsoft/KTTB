import { describe, it, expect } from 'vitest';
import { resolveSchedule, getVietnameseWeekday } from './resolveSchedule';
import {
  SEED_CHILDREN,
  SEED_TIMETABLE_TEMPLATES,
  SEED_TIMETABLE_ENTRIES,
  SEED_EXTRA_SCHEDULES,
  SEED_SCHEDULE_EXCEPTIONS,
} from '@/services/seedData';

describe('Schedule Resolution Domain Engine', () => {
  it('correctly maps dates to Vietnamese weekdays', () => {
    // 2026-09-21 is Monday (Thứ 2)
    expect(getVietnameseWeekday('2026-09-21')).toBe(2);
    // 2026-09-22 is Tuesday (Thứ 3)
    expect(getVietnameseWeekday('2026-09-22')).toBe(3);
    // 2026-09-27 is Sunday (Chủ nhật)
    expect(getVietnameseWeekday('2026-09-27')).toBe(8);
  });

  it('resolves Monday 21/09/2026 for Bé Trung Quân matching sample.png', () => {
    const quan = SEED_CHILDREN.find((c) => c.id === 'child-trung-quan')!;
    const result = resolveSchedule('2026-09-21', {
      child: quan,
      templates: SEED_TIMETABLE_TEMPLATES,
      entries: SEED_TIMETABLE_ENTRIES,
      extraSchedules: SEED_EXTRA_SCHEDULES,
      exceptions: SEED_SCHEDULE_EXCEPTIONS,
    });

    expect(result.child.name).toBe('Bé Trung Quân');
    expect(result.weekday).toBe(2);
    expect(result.timetableTemplate?.name).toContain('Lớp 6A5');

    // Morning should have 4 periods: Chào cờ, Ngữ văn, GDTC, Âm nhạc
    expect(result.morning.length).toBe(4);
    expect(result.morning[0].title).toBe('Chào cờ');
    expect(result.morning[1].title).toBe('Ngữ văn');
    expect(result.morning[2].title).toBe('GDTC');
    expect(result.morning[3].title).toBe('Âm nhạc');

    // Afternoon should have 2 periods: TANN, KNS
    expect(result.afternoon.length).toBe(2);
    expect(result.afternoon[0].title).toBe('TANN');
    expect(result.afternoon[1].title).toBe('KNS');

    // Evening should have Math extra class (19:15 - 21:15)
    expect(result.evening.length).toBe(1);
    expect(result.evening[0].title).toContain('Toán');
  });

  it('applies schedule exception replacement on 2026-09-23', () => {
    const quan = SEED_CHILDREN.find((c) => c.id === 'child-trung-quan')!;
    const result = resolveSchedule('2026-09-23', {
      child: quan,
      templates: SEED_TIMETABLE_TEMPLATES,
      entries: SEED_TIMETABLE_ENTRIES,
      extraSchedules: SEED_EXTRA_SCHEDULES,
      exceptions: SEED_SCHEDULE_EXCEPTIONS,
    });

    // Custom exam exception should appear
    const examItem = [...result.morning, ...result.afternoon, ...result.evening].find(
      (item) => item.title.includes('Khảo sát')
    );
    expect(examItem).toBeDefined();
    expect(examItem?.isModified).toBe(true);
  });
});
