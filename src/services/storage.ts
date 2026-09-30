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
  SchoolYearRecord,
  TeacherContact,
  SubjectItem,
  TimetableLegendItem,
  ExtraClassSessionLog,
  HomeworkTask,
  DailyTeacherComment,
  MonthlyTuitionPayment,
  AcademicMilestone,
  ExamPrepTask,
  BreakfastPlan,
  BreakfastSettings,
  BreakfastMeal,
  WeekdayNumber,
  TypographySettings,
  MotherMealDay,
  MotherWorkoutItem,
  MotherDailyCheckIn,
  MotherSettings,
} from '@/domain/types';
import {
  upsertToTable,
  upsertKvToCloud,
  syncOnStart,
  STORAGE_TO_TABLE,
  SYS_KV_STORAGE_KEYS,
} from '@/lib/supabaseSync';
import {
  SEED_BREAKFAST_PLANS,
  SEED_BREAKFAST_SETTINGS,
  SEED_MOTHER_MEAL_DAYS,
  SEED_MOTHER_WORKOUTS,
  SEED_MOTHER_CHECKINS,
  DEFAULT_MOTHER_SETTINGS,
  DEFAULT_TYPOGRAPHY_SETTINGS,
} from './motherAndBreakfastSeed';
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
  SEED_SCHOOL_YEARS,
  SEED_TEACHERS,
  SEED_SUBJECTS,
  SEED_TIMETABLE_LEGEND,
  SEED_SESSION_LOGS,
  SEED_HOMEWORK_TASKS,
  SEED_DAILY_TEACHER_COMMENTS,
  SEED_ACADEMIC_MILESTONES,
  SEED_EXAM_PREP_TASKS,
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
  SCHOOL_YEARS: 'ktt_school_years',
  TEACHERS: 'ktt_teachers',
  SUBJECTS: 'ktt_subjects',
  TIMETABLE_LEGEND: 'ktt_timetable_legend',
  SESSION_LOGS: 'ktt_session_logs',
  HOMEWORK: 'ktt_homework',
  DAILY_COMMENTS: 'ktt_daily_teacher_comments',
  TUITION_PAYMENTS: 'ktt_tuition_payments',
  MILESTONES: 'ktt_academic_milestones',
  EXAM_PREP_TASKS: 'ktt_exam_prep_tasks',
  BREAKFAST_PLANS: 'ktt_breakfast_plans',
  BREAKFAST_SETTINGS: 'ktt_breakfast_settings',
  BREAKFAST_DISHES: 'ktt_breakfast_dishes',
  TYPOGRAPHY_SETTINGS: 'ktt_typography_settings',
  MOTHER_MEALS: 'ktt_mother_meals',
  MOTHER_WORKOUTS: 'ktt_mother_workouts',
  MOTHER_CHECKINS: 'ktt_mother_checkins',
  MOTHER_SETTINGS: 'ktt_mother_settings',
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
    // Auto-sync to Supabase (fire-and-forget) for standard tables
    const tableName = STORAGE_TO_TABLE[key];
    if (tableName && Array.isArray(value)) {
      upsertToTable(tableName, value as unknown[]);
    }
    // Auto-sync to Supabase KV store for extended settings/data (Breakfast, Typography, Mother...)
    if (SYS_KV_STORAGE_KEYS.has(key)) {
      upsertKvToCloud(key, value);
    }
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

  // Sync from Supabase cloud → localStorage on app start
  async syncFromCloud(): Promise<boolean> {
    return syncOnStart();
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
    setItem(KEYS.SCHOOL_YEARS, SEED_SCHOOL_YEARS);
    setItem(KEYS.TEACHERS, SEED_TEACHERS);
    setItem(KEYS.SUBJECTS, SEED_SUBJECTS);
    setItem(KEYS.TIMETABLE_LEGEND, SEED_TIMETABLE_LEGEND);
    setItem(KEYS.SESSION_LOGS, SEED_SESSION_LOGS);
    setItem(KEYS.HOMEWORK, SEED_HOMEWORK_TASKS);
    setItem(KEYS.DAILY_COMMENTS, SEED_DAILY_TEACHER_COMMENTS);
    const existingTheme = (localStorage.getItem('ktt_theme') as any) || 'cute';
    const existingChild = localStorage.getItem('ktt_active_child_id') || 'child-trung-quan';
    setItem(KEYS.SETTINGS, {
      theme: existingTheme,
      density: 'comfortable',
      activeChildId: existingChild,
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
  createTemplate(template: Omit<TimetableTemplate, 'id' | 'created_at' | 'updated_at'>): TimetableTemplate {
    const templates = this.getTemplates();
    const newTemplate: TimetableTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveTemplates([...templates, newTemplate]);
    return newTemplate;
  },
  updateTemplate(id: string, updates: Partial<TimetableTemplate>): void {
    const templates = this.getTemplates().map((t) =>
      t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
    );
    this.saveTemplates(templates);
  },
  duplicateTemplate(
    sourceId: string,
    newName: string,
    newSemester: string,
    validFrom: string,
    validTo: string
  ): TimetableTemplate {
    const templates = this.getTemplates();
    const source = templates.find((t) => t.id === sourceId);
    if (!source) throw new Error('Source template not found');

    const newTemplateId = `template-${Date.now()}`;
    const newTemplate: TimetableTemplate = {
      ...source,
      id: newTemplateId,
      name: newName,
      semester: newSemester,
      valid_from: validFrom,
      valid_to: validTo,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.saveTemplates([...templates, newTemplate]);

    // Clone all entries
    const sourceEntries = this.getEntries().filter((e) => e.timetable_id === sourceId);
    const clonedEntries: TimetableEntry[] = sourceEntries.map((e, idx) => ({
      ...e,
      id: `entry-${Date.now()}-${idx}`,
      timetable_id: newTemplateId,
    }));
    const allEntries = [...this.getEntries(), ...clonedEntries];
    this.saveEntries(allEntries);

    return newTemplate;
  },
  deleteTemplate(id: string): void {
    const templates = this.getTemplates().filter((t) => t.id !== id);
    this.saveTemplates(templates);
    const entries = this.getEntries().filter((e) => e.timetable_id !== id);
    this.saveEntries(entries);
  },

  // Timetable Entries
  getEntries(): TimetableEntry[] {
    return getItem(KEYS.ENTRIES, SEED_TIMETABLE_ENTRIES);
  },
  saveEntries(entries: TimetableEntry[]): void {
    setItem(KEYS.ENTRIES, entries);
  },
  setEntriesForTimetable(timetableId: string, newEntries: TimetableEntry[]): void {
    const otherEntries = this.getEntries().filter((e) => e.timetable_id !== timetableId);
    this.saveEntries([...otherEntries, ...newEntries]);
  },

  // Extra Schedules
  getExtraSchedules(): ExtraSchedule[] {
    const list = getItem<ExtraSchedule[]>(KEYS.EXTRA_SCHEDULES, SEED_EXTRA_SCHEDULES);
    return list.map((item) => {
      if (item.start_time && item.session === 'evening' && item.start_time < '12:00') {
        return { ...item, session: 'morning' as const };
      }
      if (item.start_time && item.session === 'evening' && item.start_time >= '12:00' && item.start_time < '17:00') {
        return { ...item, session: 'afternoon' as const };
      }
      return item;
    });
  },
  saveExtraSchedules(schedules: ExtraSchedule[]): void {
    setItem(KEYS.EXTRA_SCHEDULES, schedules);
  },
  addExtraSchedule(schedule: Omit<ExtraSchedule, 'id'>): ExtraSchedule {
    const list = this.getExtraSchedules();
    const session = schedule.session || (schedule.start_time < '12:00' ? 'morning' : schedule.start_time < '17:00' ? 'afternoon' : 'evening');
    const newItem: ExtraSchedule = {
      ...schedule,
      session,
      id: `extra-${Date.now()}`,
    };
    this.saveExtraSchedules([...list, newItem]);
    return newItem;
  },
  updateExtraSchedule(id: string, updates: Partial<ExtraSchedule>): void {
    const list = this.getExtraSchedules().map((e) => {
      if (e.id !== id) return e;
      const updated = { ...e, ...updates };
      if (!updates.session && updates.start_time) {
        updated.session = updates.start_time < '12:00' ? 'morning' : updates.start_time < '17:00' ? 'afternoon' : 'evening';
      }
      return updated;
    });
    this.saveExtraSchedules(list);
  },
  deleteExtraSchedule(id: string): void {
    const list = this.getExtraSchedules().filter((e) => e.id !== id);
    this.saveExtraSchedules(list);
  },

  // Schedule Exceptions
  getExceptions(): ScheduleException[] {
    return getItem(KEYS.EXCEPTIONS, SEED_SCHEDULE_EXCEPTIONS);
  },
  saveExceptions(exceptions: ScheduleException[]): void {
    setItem(KEYS.EXCEPTIONS, exceptions);
  },
  addException(exception: Omit<ScheduleException, 'id'>): ScheduleException {
    const list = this.getExceptions();
    const newItem: ScheduleException = {
      ...exception,
      id: `exception-${Date.now()}`,
    };
    this.saveExceptions([...list, newItem]);
    return newItem;
  },
  deleteException(id: string): void {
    const list = this.getExceptions().filter((e) => e.id !== id);
    this.saveExceptions(list);
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
  addAssessment(assessment: Assessment): void {
    const list = this.getAssessments();
    this.saveAssessments([assessment, ...list]);
  },

  // Targets
  getTargets(): PerformanceTarget[] {
    return getItem(KEYS.TARGETS, SEED_PERFORMANCE_TARGETS);
  },
  saveTargets(targets: PerformanceTarget[]): void {
    setItem(KEYS.TARGETS, targets);
  },
  updateTarget(id: string, updates: Partial<PerformanceTarget>): void {
    const list = this.getTargets().map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.saveTargets(list);
  },

  // Achievements
  getAchievements(): AchievementRecord[] {
    return getItem(KEYS.ACHIEVEMENTS, SEED_ACHIEVEMENT_RECORDS);
  },
  saveAchievements(achievements: AchievementRecord[]): void {
    setItem(KEYS.ACHIEVEMENTS, achievements);
  },
  addAchievement(achievement: Omit<AchievementRecord, 'id'>): AchievementRecord {
    const list = this.getAchievements();
    const newItem: AchievementRecord = {
      ...achievement,
      id: `achieve-${Date.now()}`,
    };
    this.saveAchievements([newItem, ...list]);
    return newItem;
  },
  deleteAchievement(id: string): void {
    const list = this.getAchievements().filter((a) => a.id !== id);
    this.saveAchievements(list);
  },

  // Settings
  getSettings(): AppearanceSettings {
    const defaultSettings: AppearanceSettings = {
      theme: 'cute',
      density: 'comfortable',
      activeChildId: 'child-trung-quan',
    };
    const settings = getItem(KEYS.SETTINGS, defaultSettings);
    try {
      const directTheme = localStorage.getItem('ktt_theme') as any;
      if (directTheme && ['cute', 'modern', 'pastel', 'colorful'].includes(directTheme)) {
        settings.theme = directTheme;
      }
      const directChild = localStorage.getItem('ktt_active_child_id');
      if (directChild) {
        settings.activeChildId = directChild;
      }
    } catch {}
    return settings;
  },
  saveSettings(settings: AppearanceSettings): void {
    setItem(KEYS.SETTINGS, settings);
    try {
      if (settings.theme) {
        localStorage.setItem('ktt_theme', settings.theme);
      }
      if (settings.activeChildId) {
        localStorage.setItem('ktt_active_child_id', settings.activeChildId);
      }
    } catch {}
  },

  // School Years (Lịch sử học bạ các năm)
  getSchoolYears(): SchoolYearRecord[] {
    return getItem(KEYS.SCHOOL_YEARS, SEED_SCHOOL_YEARS);
  },
  saveSchoolYears(years: SchoolYearRecord[]): void {
    setItem(KEYS.SCHOOL_YEARS, years);
  },
  addSchoolYear(record: Omit<SchoolYearRecord, 'id'>): SchoolYearRecord {
    const list = this.getSchoolYears();
    const newItem: SchoolYearRecord = {
      ...record,
      id: `sy-${Date.now()}`,
    };
    this.saveSchoolYears([...list, newItem]);
    return newItem;
  },
  updateSchoolYear(id: string, updates: Partial<SchoolYearRecord>): void {
    const list = this.getSchoolYears().map((y) => (y.id === id ? { ...y, ...updates } : y));
    this.saveSchoolYears(list);
  },

  // Teachers (Sổ liên lạc & Danh bạ Thầy Cô)
  getTeachers(): TeacherContact[] {
    return getItem(KEYS.TEACHERS, SEED_TEACHERS);
  },
  saveTeachers(teachers: TeacherContact[]): void {
    setItem(KEYS.TEACHERS, teachers);
  },
  addTeacher(teacher: Omit<TeacherContact, 'id'>): TeacherContact {
    const list = this.getTeachers();
    const newItem: TeacherContact = {
      ...teacher,
      id: `teacher-${Date.now()}`,
    };
    this.saveTeachers([...list, newItem]);
    return newItem;
  },
  updateTeacher(id: string, updates: Partial<TeacherContact>): void {
    const list = this.getTeachers().map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.saveTeachers(list);
  },
  deleteTeacher(id: string): void {
    const list = this.getTeachers().filter((t) => t.id !== id);
    this.saveTeachers(list);
  },

  // Subjects (Cấu hình danh mục môn học)
  getSubjects(): SubjectItem[] {
    const stored = getItem<SubjectItem[]>(KEYS.SUBJECTS, SEED_SUBJECTS);
    const seedMap = new Map(SEED_SUBJECTS.map((s) => [s.id, s]));
    return stored.map((s) => {
      const seed = seedMap.get(s.id);
      if (seed && !s.note && seed.note) {
        return { ...s, note: seed.note };
      }
      return s;
    });
  },
  saveSubjects(subjects: SubjectItem[]): void {
    setItem(KEYS.SUBJECTS, subjects);
  },
  addSubject(subject: Omit<SubjectItem, 'id'>): SubjectItem {
    const list = this.getSubjects();
    const newItem: SubjectItem = {
      ...subject,
      id: `subj-${Date.now()}`,
    };
    this.saveSubjects([...list, newItem]);
    return newItem;
  },
  updateSubject(id: string, updates: Partial<SubjectItem>): void {
    const list = this.getSubjects().map((s) => (s.id === id ? { ...s, ...updates } : s));
    this.saveSubjects(list);
  },
  deleteSubject(id: string): void {
    const list = this.getSubjects().filter((s) => s.id !== id);
    this.saveSubjects(list);
  },
  renameSubjectAcrossTimetables(oldName: string, newName: string): void {
    if (!oldName || !newName || oldName === newName) return;
    const entries = this.getEntries().map((e) =>
      e.subject === oldName ? { ...e, subject: newName } : e
    );
    setItem(KEYS.ENTRIES, entries);
    const extras = this.getExtraSchedules().map((ex) =>
      ex.name === oldName ? { ...ex, name: newName } : ex
    );
    setItem(KEYS.EXTRA_SCHEDULES, extras);
  },

  // Timetable Legend / Ghi chú viết tắt & Tên môn
  getTimetableLegend(): TimetableLegendItem[] {
    return getItem(KEYS.TIMETABLE_LEGEND, SEED_TIMETABLE_LEGEND);
  },
  saveTimetableLegend(items: TimetableLegendItem[]): void {
    setItem(KEYS.TIMETABLE_LEGEND, items);
  },
  updateTimetableLegendItem(id: string, updates: Partial<TimetableLegendItem>): void {
    const list = this.getTimetableLegend().map((item) => (item.id === id ? { ...item, ...updates } : item));
    this.saveTimetableLegend(list);
  },
  addTimetableLegendItem(item: Omit<TimetableLegendItem, 'id'>): TimetableLegendItem {
    const list = this.getTimetableLegend();
    const newItem: TimetableLegendItem = {
      ...item,
      id: `leg-${Date.now()}`,
    };
    this.saveTimetableLegend([...list, newItem]);
    return newItem;
  },
  deleteTimetableLegendItem(id: string): void {
    const list = this.getTimetableLegend().filter((item) => item.id !== id);
    this.saveTimetableLegend(list);
  },

  // Extra Class Session Logs (Nhật ký từng buổi & Đánh giá)
  getSessionLogs(): ExtraClassSessionLog[] {
    return getItem(KEYS.SESSION_LOGS, SEED_SESSION_LOGS);
  },
  saveSessionLogs(logs: ExtraClassSessionLog[]): void {
    setItem(KEYS.SESSION_LOGS, logs);
  },
  addSessionLog(log: Omit<ExtraClassSessionLog, 'id'>): ExtraClassSessionLog {
    const list = this.getSessionLogs();
    const newItem: ExtraClassSessionLog = {
      ...log,
      id: `log-${Date.now()}`,
    };
    this.saveSessionLogs([newItem, ...list]);
    return newItem;
  },
  updateSessionLog(id: string, updates: Partial<ExtraClassSessionLog>): void {
    const list = this.getSessionLogs().map((l) => (l.id === id ? { ...l, ...updates } : l));
    this.saveSessionLogs(list);
  },
  deleteSessionLog(id: string): void {
    const list = this.getSessionLogs().filter((l) => l.id !== id);
    this.saveSessionLogs(list);
  },

  // Homework Tasks (Sổ dặn dò & Bài tập về nhà)
  getHomeworkTasks(): HomeworkTask[] {
    return getItem(KEYS.HOMEWORK, SEED_HOMEWORK_TASKS);
  },
  saveHomeworkTasks(tasks: HomeworkTask[]): void {
    setItem(KEYS.HOMEWORK, tasks);
  },
  addHomeworkTask(task: Omit<HomeworkTask, 'id'>): HomeworkTask {
    const list = this.getHomeworkTasks();
    const newItem: HomeworkTask = {
      ...task,
      id: `hw-${Date.now()}`,
    };
    this.saveHomeworkTasks([newItem, ...list]);
    return newItem;
  },
  toggleHomework(id: string): void {
    const list = this.getHomeworkTasks().map((t) =>
      t.id === id ? { ...t, is_completed: !t.is_completed } : t
    );
    this.saveHomeworkTasks(list);
  },
  deleteHomeworkTask(id: string): void {
    const list = this.getHomeworkTasks().filter((t) => t.id !== id);
    this.saveHomeworkTasks(list);
  },

  // Daily Teacher Comments (Sổ liên lạc & Lời nhắn Thầy Cô hàng ngày)
  getDailyComments(): DailyTeacherComment[] {
    return getItem(KEYS.DAILY_COMMENTS, SEED_DAILY_TEACHER_COMMENTS);
  },
  saveDailyComments(comments: DailyTeacherComment[]): void {
    setItem(KEYS.DAILY_COMMENTS, comments);
  },
  addDailyComment(comment: Omit<DailyTeacherComment, 'id' | 'created_at'>): DailyTeacherComment {
    const list = this.getDailyComments();
    const newComment: DailyTeacherComment = {
      ...comment,
      id: `dtc-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.saveDailyComments([newComment, ...list]);
    return newComment;
  },
  updateDailyComment(id: string, updates: Partial<DailyTeacherComment>): void {
    const list = this.getDailyComments().map((c) => (c.id === id ? { ...c, ...updates } : c));
    this.saveDailyComments(list);
  },
  toggleDailyCommentAcknowledged(id: string): void {
    const list = this.getDailyComments().map((c) =>
      c.id === id ? { ...c, parent_acknowledged: !c.parent_acknowledged } : c
    );
    this.saveDailyComments(list);
  },
  deleteDailyComment(id: string): void {
    const list = this.getDailyComments().filter((c) => c.id !== id);
    this.saveDailyComments(list);
  },

  // Monthly Tuition Payments (Theo dõi đóng học phí hàng tháng)
  getTuitionPayments(): MonthlyTuitionPayment[] {
    return getItem(KEYS.TUITION_PAYMENTS, []);
  },
  saveTuitionPayments(payments: MonthlyTuitionPayment[]): void {
    setItem(KEYS.TUITION_PAYMENTS, payments);
  },
  upsertTuitionPayment(payment: MonthlyTuitionPayment): void {
    const list = this.getTuitionPayments();
    const idx = list.findIndex(
      (p) =>
        p.child_id === payment.child_id &&
        p.extra_schedule_id === payment.extra_schedule_id &&
        p.month === payment.month
    );
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...payment };
      this.saveTuitionPayments([...list]);
    } else {
      this.saveTuitionPayments([...list, payment]);
    }
  },

  // Academic Milestones (Cột mốc kỳ thi & Khảo sát năng lực)
  getMilestones(): AcademicMilestone[] {
    return getItem(KEYS.MILESTONES, SEED_ACADEMIC_MILESTONES);
  },
  saveMilestones(milestones: AcademicMilestone[]): void {
    setItem(KEYS.MILESTONES, milestones);
  },
  addMilestone(milestone: Omit<AcademicMilestone, 'id'>): AcademicMilestone {
    const list = this.getMilestones();
    const newMilestone: AcademicMilestone = {
      ...milestone,
      id: `milestone-${Date.now()}`,
    };
    this.saveMilestones([...list, newMilestone]);
    return newMilestone;
  },
  updateMilestone(id: string, updates: Partial<AcademicMilestone>): void {
    const list = this.getMilestones().map((m) => (m.id === id ? { ...m, ...updates } : m));
    this.saveMilestones(list);
  },
  deleteMilestone(id: string): void {
    const list = this.getMilestones().filter((m) => m.id !== id);
    this.saveMilestones(list);
  },

  // Exam Prep Checklist (Kế hoạch ôn tập nước rút theo cột mốc kỳ thi)
  getExamPrepTasks(): ExamPrepTask[] {
    return getItem(KEYS.EXAM_PREP_TASKS, SEED_EXAM_PREP_TASKS);
  },
  saveExamPrepTasks(tasks: ExamPrepTask[]): void {
    setItem(KEYS.EXAM_PREP_TASKS, tasks);
  },
  addExamPrepTask(task: Omit<ExamPrepTask, 'id' | 'created_at'>): ExamPrepTask {
    const list = this.getExamPrepTasks();
    const newTask: ExamPrepTask = {
      ...task,
      id: `prep-${Date.now()}`,
      created_at: new Date().toISOString().split('T')[0],
    };
    this.saveExamPrepTasks([...list, newTask]);
    return newTask;
  },
  updateExamPrepTask(id: string, updates: Partial<ExamPrepTask>): void {
    const list = this.getExamPrepTasks().map((t) => (t.id === id ? { ...t, ...updates } : t));
    this.saveExamPrepTasks(list);
  },
  toggleExamPrepTask(id: string): void {
    const list = this.getExamPrepTasks().map((t) => {
      if (t.id === id) {
        const nextState = !t.is_completed;
        return {
          ...t,
          is_completed: nextState,
          completed_at: nextState ? new Date().toISOString().split('T')[0] : undefined,
        };
      }
      return t;
    });
    this.saveExamPrepTasks(list);
  },
  deleteExamPrepTask(id: string): void {
    const list = this.getExamPrepTasks().filter((t) => t.id !== id);
    this.saveExamPrepTasks(list);
  },

  // ================== BỮA SÁNG ==================
  getAllBreakfastPlans(): BreakfastPlan[] {
    const all = getItem<BreakfastPlan[]>(KEYS.BREAKFAST_PLANS, SEED_BREAKFAST_PLANS);
    return all.length > 0 ? all : SEED_BREAKFAST_PLANS;
  },
  getBreakfastPlans(childId: string): BreakfastPlan[] {
    const all = this.getAllBreakfastPlans();
    const childPlans = all.filter((p) => p.child_id === childId);
    if (childPlans.length > 0) return childPlans;
    // Tự động khởi tạo menu mặc định nếu bé chưa có menu nào
    const fallbackPlan: BreakfastPlan = {
      id: `bp-default-${childId}`,
      child_id: childId,
      name: 'Menu Tuần A',
      meals: [
        { weekday: 2, meal: 'Phở bò', note: 'Uống 1 hộp sữa tươi' },
        { weekday: 3, meal: 'Bánh mì trứng', note: 'Kèm dưa chuột' },
        { weekday: 4, meal: 'Xôi xéo ruốc', note: 'Thêm chả quế' },
        { weekday: 5, meal: 'Bún riêu cua', note: 'Ít hành' },
        { weekday: 6, meal: 'Bánh bao nhân thịt', note: 'Uống sữa hạt' },
        { weekday: 7, meal: 'Cơm chiên trứng', note: 'Thêm xúc xích' },
        { weekday: 8, meal: 'Bánh mì chảo', note: 'Bữa sáng cuối tuần' },
      ],
      created_at: new Date().toISOString(),
    };
    setItem(KEYS.BREAKFAST_PLANS, [...all, fallbackPlan]);
    return [fallbackPlan];
  },
  saveBreakfastPlan(plan: BreakfastPlan): void {
    const all = [...this.getAllBreakfastPlans()];
    const idx = all.findIndex((p) => p.id === plan.id);
    if (idx >= 0) all[idx] = plan;
    else all.push(plan);
    setItem(KEYS.BREAKFAST_PLANS, all);
  },
  deleteBreakfastPlan(id: string): void {
    const all = this.getAllBreakfastPlans().filter((p) => p.id !== id);
    setItem(KEYS.BREAKFAST_PLANS, all);
  },
  resetBreakfastPlansForChild(childId: string): void {
    const others = this.getAllBreakfastPlans().filter((p) => p.child_id !== childId);
    const seedForChild = SEED_BREAKFAST_PLANS.filter((p) => p.child_id === childId);
    setItem(KEYS.BREAKFAST_PLANS, [...others, ...seedForChild]);
  },
  getBreakfastSettings(childId: string): BreakfastSettings {
    const all = getItem<BreakfastSettings[]>(KEYS.BREAKFAST_SETTINGS, SEED_BREAKFAST_SETTINGS);
    const found = all.find((s) => s.child_id === childId);
    if (found) return found;
    const seedFound = SEED_BREAKFAST_SETTINGS.find((s) => s.child_id === childId);
    if (seedFound) return seedFound;
    return {
      child_id: childId,
      enabled: true,
      auto_rotate: false,
    };
  },
  saveBreakfastSettings(settings: BreakfastSettings): void {
    const all = [...getItem<BreakfastSettings[]>(KEYS.BREAKFAST_SETTINGS, SEED_BREAKFAST_SETTINGS)];
    const idx = all.findIndex((s) => s.child_id === settings.child_id);
    if (idx >= 0) all[idx] = settings;
    else all.push(settings);
    setItem(KEYS.BREAKFAST_SETTINGS, all);
  },
  getActiveBreakfastPlanForChild(childId: string): BreakfastPlan | null {
    const plans = this.getBreakfastPlans(childId);
    if (plans.length === 0) return null;
    const settings = this.getBreakfastSettings(childId);
    if (settings.auto_rotate && settings.cycle_start && plans.length >= 2) {
      const getISOWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
      };
      const cycleWeek = getISOWeek(new Date(settings.cycle_start));
      const currentWeek = getISOWeek(new Date());
      const diff = currentWeek - cycleWeek;
      const idx = ((diff % plans.length) + plans.length) % plans.length;
      return plans[idx] || plans[0];
    }
    return plans.find((p) => p.id === settings.active_plan_id) || plans[0];
  },
  getBreakfastMealForWeekday(childId: string, weekday: WeekdayNumber): BreakfastMeal | undefined {
    const plan = this.getActiveBreakfastPlanForChild(childId);
    if (!plan) return undefined;
    return plan.meals.find((m) => m.weekday === weekday);
  },
  getBreakfastDishes(): string[] {
    const defaultDishes = [
      'Bánh mì trứng',
      'Bánh mì thịt pate',
      'Phở bò',
      'Phở gà',
      'Bún riêu cua',
      'Bún bò Huế',
      'Xôi xéo ruốc',
      'Xôi lạc đậu xanh',
      'Bánh bao nhân thịt',
      'Bánh cuốn chả',
      'Cơm chiên trứng',
      'Mì tôm nấu trứng',
      'Cháo sườn / cháo gà',
      'Miến gà',
      'Hủ tiếu Nam Vang',
      'Sandwich phô mai',
      'Ngũ cốc + sữa tươi',
      'Bánh mì chảo',
      'Bánh giò nóng',
      'Sữa chua + hoa quả',
    ];
    return getItem<string[]>(KEYS.BREAKFAST_DISHES, defaultDishes);
  },
  saveBreakfastDishes(dishes: string[]): void {
    setItem(KEYS.BREAKFAST_DISHES, dishes);
  },
  addBreakfastDish(dish: string): void {
    const trimmed = dish.trim();
    if (!trimmed) return;
    const current = this.getBreakfastDishes();
    if (!current.includes(trimmed)) {
      this.saveBreakfastDishes([trimmed, ...current]);
    }
  },
  deleteBreakfastDish(dish: string): void {
    const current = this.getBreakfastDishes().filter((d) => d !== dish);
    this.saveBreakfastDishes(current);
  },

  // ================== CÀI ĐẶT CỠ CHỮ & FONT CHỮ (Typography) ==================
  getTypographySettings(): TypographySettings {
    const stored = getItem<Partial<TypographySettings>>(KEYS.TYPOGRAPHY_SETTINGS, DEFAULT_TYPOGRAPHY_SETTINGS);
    return {
      displayMode: stored.displayMode || DEFAULT_TYPOGRAPHY_SETTINGS.displayMode,
      fullWidthOnLargeScreen:
        stored.fullWidthOnLargeScreen !== undefined
          ? stored.fullWidthOnLargeScreen
          : DEFAULT_TYPOGRAPHY_SETTINGS.fullWidthOnLargeScreen,
      sections: {
        ...DEFAULT_TYPOGRAPHY_SETTINGS.sections,
        ...(stored.sections || {}),
      },
    };
  },
  saveTypographySettings(settings: TypographySettings): void {
    setItem(KEYS.TYPOGRAPHY_SETTINGS, settings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ktt-typography-updated'));
    }
  },

  // ================== GÓC CỦA MẸ (Thực đơn 30 ngày & Lịch tập) ==================
  getMotherMeals(): MotherMealDay[] {
    const stored = getItem<MotherMealDay[]>(KEYS.MOTHER_MEALS, SEED_MOTHER_MEAL_DAYS);
    return stored.length > 0 ? stored : SEED_MOTHER_MEAL_DAYS;
  },
  saveMotherMeals(meals: MotherMealDay[]): void {
    setItem(KEYS.MOTHER_MEALS, meals);
  },
  updateMotherMealDay(updatedDay: MotherMealDay): void {
    const all = this.getMotherMeals().map((d) => (d.day === updatedDay.day ? updatedDay : d));
    this.saveMotherMeals(all);
  },
  resetMotherMeals(): void {
    setItem(KEYS.MOTHER_MEALS, SEED_MOTHER_MEAL_DAYS);
  },
  getMotherWorkouts(): MotherWorkoutItem[] {
    const stored = getItem<MotherWorkoutItem[]>(KEYS.MOTHER_WORKOUTS, SEED_MOTHER_WORKOUTS);
    return stored.length > 0 ? stored : SEED_MOTHER_WORKOUTS;
  },
  saveMotherWorkouts(workouts: MotherWorkoutItem[]): void {
    setItem(KEYS.MOTHER_WORKOUTS, workouts);
  },
  upsertMotherWorkout(workout: MotherWorkoutItem): void {
    const all = [...this.getMotherWorkouts()];
    const idx = all.findIndex((w) => w.id === workout.id);
    if (idx >= 0) all[idx] = workout;
    else all.push(workout);
    this.saveMotherWorkouts(all);
  },
  deleteMotherWorkout(id: string): void {
    const all = this.getMotherWorkouts().filter((w) => w.id !== id);
    this.saveMotherWorkouts(all);
  },
  resetMotherWorkouts(): void {
    setItem(KEYS.MOTHER_WORKOUTS, SEED_MOTHER_WORKOUTS);
  },
  getMotherCheckIns(): MotherDailyCheckIn[] {
    const stored = getItem<MotherDailyCheckIn[]>(KEYS.MOTHER_CHECKINS, SEED_MOTHER_CHECKINS);
    return stored.length > 0 ? stored : SEED_MOTHER_CHECKINS;
  },
  getMotherCheckInByDate(date: string): MotherDailyCheckIn {
    const all = this.getMotherCheckIns();
    return (
      all.find((c) => c.date === date) || {
        date,
        completedMeals: [],
        waterGlasses: 0,
        workoutCompleted: false,
      }
    );
  },
  saveMotherCheckIn(checkIn: MotherDailyCheckIn): void {
    const all = [...this.getMotherCheckIns()];
    const idx = all.findIndex((c) => c.date === checkIn.date);
    if (idx >= 0) all[idx] = checkIn;
    else all.push(checkIn);
    all.sort((a, b) => b.date.localeCompare(a.date));
    setItem(KEYS.MOTHER_CHECKINS, all);

    // Tự động cập nhật cân nặng hiện tại mới nhất vào Hồ sơ Mẹ
    const latestWithWeight = all.find((c) => typeof c.weightKg === 'number' && c.weightKg > 0);
    if (latestWithWeight && latestWithWeight.weightKg) {
      const currentSettings = this.getMotherSettings();
      if (currentSettings.currentWeightKg !== latestWithWeight.weightKg) {
        this.saveMotherSettings({
          ...currentSettings,
          currentWeightKg: latestWithWeight.weightKg,
        });
      }
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ktt-mother-updated'));
    }
  },
  deleteMotherCheckIn(date: string): void {
    const all = this.getMotherCheckIns().filter((c) => c.date !== date);
    setItem(KEYS.MOTHER_CHECKINS, all);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ktt-mother-updated'));
    }
  },
  getMotherSettings(): MotherSettings {
    const raw = getItem<MotherSettings>(KEYS.MOTHER_SETTINGS, DEFAULT_MOTHER_SETTINGS);
    const merged: MotherSettings = {
      ...DEFAULT_MOTHER_SETTINGS,
      ...raw,
      authorName:
        !raw.authorName || raw.authorName === 'Đinh Thị Mơ'
          ? DEFAULT_MOTHER_SETTINGS.authorName
          : raw.authorName,
    };
    return merged;
  },
  saveMotherSettings(settings: MotherSettings): void {
    setItem(KEYS.MOTHER_SETTINGS, settings);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('ktt-mother-updated'));
    }
  },
};


