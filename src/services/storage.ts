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
  SEED_SCHOOL_YEARS,
  SEED_TEACHERS,
  SEED_SUBJECTS,
  SEED_TIMETABLE_LEGEND,
  SEED_SESSION_LOGS,
  SEED_HOMEWORK_TASKS,
  SEED_DAILY_TEACHER_COMMENTS,
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
    setItem(KEYS.SCHOOL_YEARS, SEED_SCHOOL_YEARS);
    setItem(KEYS.TEACHERS, SEED_TEACHERS);
    setItem(KEYS.SUBJECTS, SEED_SUBJECTS);
    setItem(KEYS.TIMETABLE_LEGEND, SEED_TIMETABLE_LEGEND);
    setItem(KEYS.SESSION_LOGS, SEED_SESSION_LOGS);
    setItem(KEYS.HOMEWORK, SEED_HOMEWORK_TASKS);
    setItem(KEYS.DAILY_COMMENTS, SEED_DAILY_TEACHER_COMMENTS);
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
    return getItem(KEYS.EXTRA_SCHEDULES, SEED_EXTRA_SCHEDULES);
  },
  saveExtraSchedules(schedules: ExtraSchedule[]): void {
    setItem(KEYS.EXTRA_SCHEDULES, schedules);
  },
  addExtraSchedule(schedule: Omit<ExtraSchedule, 'id'>): ExtraSchedule {
    const list = this.getExtraSchedules();
    const newItem: ExtraSchedule = {
      ...schedule,
      id: `extra-${Date.now()}`,
    };
    this.saveExtraSchedules([...list, newItem]);
    return newItem;
  },
  updateExtraSchedule(id: string, updates: Partial<ExtraSchedule>): void {
    const list = this.getExtraSchedules().map((e) => (e.id === id ? { ...e, ...updates } : e));
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
    return getItem(KEYS.SETTINGS, {
      theme: 'cute',
      density: 'comfortable',
      activeChildId: 'child-trung-quan',
    });
  },
  saveSettings(settings: AppearanceSettings): void {
    setItem(KEYS.SETTINGS, settings);
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
};
