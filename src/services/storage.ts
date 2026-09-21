import {
  Child,
  TimetableTemplate,
  TimetableEntry,
  ExtraSchedule,
  ScheduleException,
  AssessmentPlan,
  Assessment,
  PerformanceTarget,
  AchievementRecord,
  AppearanceSettings,
} from '@/domain/types';
import {
  SEED_CHILDREN,
  SEED_TIMETABLE_TEMPLATES,
  SEED_TIMETABLE_ENTRIES,
  SEED_EXTRA_SCHEDULES,
  SEED_SCHEDULE_EXCEPTIONS,
  SEED_ASSESSMENT_PLANS,
  SEED_ASSESSMENTS,
  SEED_PERFORMANCE_TARGETS,
  SEED_ACHIEVEMENT_RECORDS,
} from './seedData';

const KEYS = {
  CHILDREN: 'ktt_children',
  TEMPLATES: 'ktt_templates',
  ENTRIES: 'ktt_entries',
  EXTRA_SCHEDULES: 'ktt_extra_schedules',
  EXCEPTIONS: 'ktt_exceptions',
  ASSESSMENT_PLANS: 'ktt_assessment_plans',
  ASSESSMENTS: 'ktt_assessments',
  TARGETS: 'ktt_targets',
  ACHIEVEMENTS: 'ktt_achievements',
  SETTINGS: 'ktt_settings',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save to localStorage [${key}]:`, err);
  }
}

export const storage = {
  // Initialize with seed data if first time
  init() {
    if (!localStorage.getItem(KEYS.CHILDREN)) {
      this.resetToSeed();
    }
  },

  resetToSeed() {
    setItem(KEYS.CHILDREN, SEED_CHILDREN);
    setItem(KEYS.TEMPLATES, SEED_TIMETABLE_TEMPLATES);
    setItem(KEYS.ENTRIES, SEED_TIMETABLE_ENTRIES);
    setItem(KEYS.EXTRA_SCHEDULES, SEED_EXTRA_SCHEDULES);
    setItem(KEYS.EXCEPTIONS, SEED_SCHEDULE_EXCEPTIONS);
    setItem(KEYS.ASSESSMENT_PLANS, SEED_ASSESSMENT_PLANS);
    setItem(KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
    setItem(KEYS.TARGETS, SEED_PERFORMANCE_TARGETS);
    setItem(KEYS.ACHIEVEMENTS, SEED_ACHIEVEMENT_RECORDS);
    setItem(KEYS.SETTINGS, {
      theme: 'cute',
      density: 'comfortable',
      activeChildId: 'child-trung-quan',
    } as AppearanceSettings);
  },

  // Children
  getChildren(): Child[] {
    return getItem(KEYS.CHILDREN, SEED_CHILDREN);
  },
  saveChildren(children: Child[]): void {
    setItem(KEYS.CHILDREN, children);
  },
  getChildById(id: string): Child | undefined {
    return this.getChildren().find((c) => c.id === id);
  },

  // Timetable Templates
  getTemplates(): TimetableTemplate[] {
    return getItem(KEYS.TEMPLATES, SEED_TIMETABLE_TEMPLATES);
  },
  saveTemplates(templates: TimetableTemplate[]): void {
    setItem(KEYS.TEMPLATES, templates);
  },

  // Timetable Entries
  getEntries(): TimetableEntry[] {
    return getItem(KEYS.ENTRIES, SEED_TIMETABLE_ENTRIES);
  },
  saveEntries(entries: TimetableEntry[]): void {
    setItem(KEYS.ENTRIES, entries);
  },

  // Extra Schedules
  getExtraSchedules(): ExtraSchedule[] {
    return getItem(KEYS.EXTRA_SCHEDULES, SEED_EXTRA_SCHEDULES);
  },
  saveExtraSchedules(schedules: ExtraSchedule[]): void {
    setItem(KEYS.EXTRA_SCHEDULES, schedules);
  },

  // Schedule Exceptions
  getExceptions(): ScheduleException[] {
    return getItem(KEYS.EXCEPTIONS, SEED_SCHEDULE_EXCEPTIONS);
  },
  saveExceptions(exceptions: ScheduleException[]): void {
    setItem(KEYS.EXCEPTIONS, exceptions);
  },

  // Assessment Plans
  getAssessmentPlans(): AssessmentPlan[] {
    return getItem(KEYS.ASSESSMENT_PLANS, SEED_ASSESSMENT_PLANS);
  },
  saveAssessmentPlans(plans: AssessmentPlan[]): void {
    setItem(KEYS.ASSESSMENT_PLANS, plans);
  },

  // Assessments
  getAssessments(): Assessment[] {
    return getItem(KEYS.ASSESSMENTS, SEED_ASSESSMENTS);
  },
  saveAssessments(assessments: Assessment[]): void {
    setItem(KEYS.ASSESSMENTS, assessments);
  },

  // Targets
  getTargets(): PerformanceTarget[] {
    return getItem(KEYS.TARGETS, SEED_PERFORMANCE_TARGETS);
  },
  saveTargets(targets: PerformanceTarget[]): void {
    setItem(KEYS.TARGETS, targets);
  },

  // Achievements
  getAchievements(): AchievementRecord[] {
    return getItem(KEYS.ACHIEVEMENTS, SEED_ACHIEVEMENT_RECORDS);
  },
  saveAchievements(achievements: AchievementRecord[]): void {
    setItem(KEYS.ACHIEVEMENTS, achievements);
  },

  // Settings
  getSettings(): AppearanceSettings {
    return getItem(KEYS.SETTINGS, {
      theme: 'cute',
      density: 'comfortable',
      activeChildId: 'child-trung-quan',
    });
  },
  saveSettings(settings: AppearanceSettings): void {
    setItem(KEYS.SETTINGS, settings);
  },
};
