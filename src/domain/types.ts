export type WeekdayNumber = 2 | 3 | 4 | 5 | 6 | 7 | 8; // Thứ 2, 3, 4, 5, 6, 7, Chủ Nhật (8)

export type SessionType = 'morning' | 'afternoon' | 'evening';

export type TimetableStatus = 'draft' | 'active' | 'archived';

export type ExceptionType = 'cancel' | 'replace' | 'custom';

export type AppTheme = 'cute' | 'modern' | 'pastel' | 'colorful';

export interface Child {
  id: string;
  name: string;
  nickname: string;
  birthYear: number;
  date_of_birth?: string;
  school_name: string;
  grade: string;
  class_name: string;
  avatar_url: string;
  color: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableTemplate {
  id: string;
  child_id: string;
  name: string;
  description?: string;
  school_year: string; // e.g. "2026-2027"
  semester: string;    // e.g. "HK1", "HK2"
  valid_from: string;  // YYYY-MM-DD
  valid_to: string;    // YYYY-MM-DD
  status: TimetableStatus;
  created_at?: string;
  updated_at?: string;
}

export interface TimetableEntry {
  id: string;
  timetable_id: string;
  weekday: WeekdayNumber;
  period: number; // 1, 2, 3, 4
  session: SessionType;
  start_time: string; // "07:00"
  end_time: string;   // "07:45"
  subject: string;
  teacher?: string;
  room?: string;
  note?: string;
  color?: string;
}

export interface ExtraSchedule {
  id: string;
  child_id: string;
  name: string; // e.g. "Toán", "Tiếng Anh"
  category: string;
  weekdays: WeekdayNumber[]; // e.g. [2, 5]
  session: SessionType;
  start_time: string;
  end_time: string;
  valid_from?: string;
  valid_to?: string;
  note?: string;
  color?: string;
  active: boolean;
}

export interface ScheduleException {
  id: string;
  child_id: string;
  date: string; // YYYY-MM-DD
  timetable_entry_id?: string;
  type: ExceptionType;
  subject?: string;
  teacher?: string;
  start_time?: string;
  end_time?: string;
  note?: string;
}

export interface DailyScheduleItem {
  id: string;
  source: 'school' | 'extra' | 'exception';
  title: string;
  subtitle?: string; // teacher or category
  timeDisplay: string;
  period?: number;
  session: SessionType;
  room?: string;
  note?: string;
  color?: string;
  isCancelled?: boolean;
  isModified?: boolean;
  isExtra?: boolean;
  originalEntryId?: string;
}

export interface ResolvedDailySchedule {
  child: Child;
  date: string;
  weekday: WeekdayNumber;
  timetableTemplate: TimetableTemplate | null;
  morning: DailyScheduleItem[];
  afternoon: DailyScheduleItem[];
  evening: DailyScheduleItem[];
  exceptions: ScheduleException[];
  extraSchedules: ExtraSchedule[];
}

export interface AssessmentPlan {
  id: string;
  child_id: string;
  school_year: string;
  grade: string;
  name: string;
  type: 'diagnostic' | 'monthly' | 'midterm' | 'final' | 'school_exam' | 'external_exam' | 'mock_exam' | 'other';
  planned_date: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  status: 'planned' | 'completed' | 'cancelled';
}

export interface AssessmentSubjectResult {
  id: string;
  assessment_id: string;
  subject: string;
  score: number;
  max_score: number;
  target_score?: number;
  previous_score?: number;
  rank?: number;
  comment?: string;
}

export interface Assessment {
  id: string;
  assessment_plan_id: string;
  child_id: string;
  actual_date: string;
  overall_score?: number;
  overall_target?: number;
  rank?: number;
  rank_scope?: string;
  rank_total?: number;
  percentile?: number;
  comment?: string;
  status: 'planned' | 'completed';
  results: AssessmentSubjectResult[];
}

export interface PerformanceTarget {
  id: string;
  child_id: string;
  school_year: string;
  semester?: string;
  subject: string;
  target_type: 'score' | 'average' | 'rank' | 'achievement' | 'custom';
  target_value: number;
  start_date?: string;
  end_date?: string;
  note?: string;
  status: 'in_progress' | 'achieved' | 'missed';
}

export interface AchievementRecord {
  id: string;
  child_id: string;
  date: string;
  school_year: string;
  category: 'academic' | 'competition' | 'certificate' | 'sports' | 'arts' | 'reading' | 'behavior' | 'project' | 'personal_goal' | 'other';
  title: string;
  description?: string;
  level?: string; // Cấp trường, Cấp quận, Quốc tế...
  result?: string; // Giải Nhất, Xuất sắc, Đạt chứng chỉ...
  organization?: string;
  subject?: string;
  score?: string;
  rank?: string;
  certificate_url?: string;
  image_url?: string;
  note?: string;
}

export interface AppearanceSettings {
  theme: AppTheme;
  density: 'comfortable' | 'compact';
  activeChildId: string;
}

export interface YearlySubjectScore {
  subject: string;
  term1_score?: number;
  term2_score?: number;
  final_score: number;
  comment?: string;
}

export interface SchoolYearRecord {
  id: string;
  child_id: string;
  school_year: string; // e.g. "2021-2022", "2026-2027"
  grade: string;       // e.g. "Lớp 1", "Lớp 6"
  class_name: string;  // e.g. "1A1", "6A5"
  school_name: string; // e.g. "Tiểu học Tô Hiệu", "THCS Tô Hiệu"
  homeroom_teacher: {
    name: string;
    phone?: string;
    email?: string;
  };
  overall_score: number; // ĐTB cả năm (e.g. 9.8)
  rank?: number;         // Hạng trong lớp (e.g. 1)
  rank_total?: number;   // Sĩ số lớp (e.g. 40)
  classification: 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Hoàn thành tốt' | 'Đang học';
  teacher_feedback?: string; // Lời phê / nhận xét của GVCN cuối năm
  status: 'completed' | 'current';
  subject_scores: YearlySubjectScore[];
}

export interface TeacherContact {
  id: string;
  child_id: string;
  school_year: string; // "2026-2027"
  class_name: string;  // "6A5"
  name: string;        // "Cô Trần Thu Hà"
  role: 'homeroom' | 'subject' | 'tutor'; // GVCN, GV Bộ Môn, Gia sư/Trung tâm
  subject?: string;    // "Ngữ văn & Chủ nhiệm", "Toán"...
  phone: string;       // "0912.345.678"
  email?: string;
  zalo_phone?: string;
  notes?: string;      // Dặn dò của giáo viên
  parent_notes?: string; // Ghi chú riêng của phụ huynh
}

export interface SubjectItem {
  id: string;
  name: string;
  code?: string;
  color: string;
  icon?: string;
  category?: 'core' | 'science' | 'social' | 'arts_sports' | 'other';
  is_custom?: boolean;
}

export interface ExtraClassSessionLog {
  id: string;
  extra_schedule_id: string;
  child_id: string;
  date: string; // YYYY-MM-DD
  score?: number;
  max_score?: number;
  status: 'attended' | 'absent' | 'makeup';
  teacher_comment?: string;
  parent_note?: string;
}

export interface HomeworkTask {
  id: string;
  child_id: string;
  date: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD
  subject: string;
  description: string;
  is_completed: boolean;
  priority: 'normal' | 'high';
}

export interface DailyTeacherComment {
  id: string;
  child_id: string;
  date: string; // YYYY-MM-DD
  teacher_id?: string;
  teacher_name: string;
  teacher_role: 'homeroom' | 'subject' | 'tutor'; // GVCN, GV Bộ môn, Học thêm / Gia sư
  source_type: 'school' | 'extra'; // school = Chính khóa, extra = Học thêm
  subject?: string;
  category: 'praise' | 'reminder' | 'homework' | 'behavior' | 'boarding' | 'general';
  content: string;
  score?: number; // e.g. 9.5
  parent_acknowledged?: boolean;
  parent_reply?: string;
  created_at: string;
}
