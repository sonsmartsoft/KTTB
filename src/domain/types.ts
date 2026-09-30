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
  gender?: 'male' | 'female';
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
  fee_per_session?: number; // Học phí mỗi buổi (VNĐ) riêng cho từng lớp
  active: boolean;
  // Thông tin thầy/cô & thanh toán (chỉ phụ huynh thấy)
  teacher_name?: string;    // Tên thầy/cô phụ trách lớp này
  bank_account?: string;    // Số tài khoản ngân hàng
  bank_name?: string;       // Tên ngân hàng viết tắt (VCB, TPB, MB...)
  bank_owner?: string;      // Tên chủ tài khoản (có thể khác tên thầy/cô)
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
  note?: string; // Ghi chú giải thích viết tắt, diễn giải tên môn
}

export interface TimetableLegendItem {
  id: string;
  code: string;
  note: string;
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

export interface MonthlyTuitionPayment {
  id: string; // e.g. "child-id_extra-id_YYYY-MM"
  child_id: string;
  extra_schedule_id: string;
  month: string; // "YYYY-MM"
  attended_count: number;
  fee_per_session: number;
  total_amount: number;
  is_paid: boolean;
  paid_at?: string;          // YYYY-MM-DD
  payment_method?: 'bank_transfer' | 'cash';
  transaction_ref?: string;  // Mã/nội dung chuyển khoản
  note?: string;
}

export type MilestoneCategory = 'survey' | 'midterm' | 'final' | 'olympic' | 'certificate' | 'other';
export type MilestoneStatus = 'planned' | 'active' | 'completed';

export interface AcademicMilestone {
  id: string;
  child_id: string;
  title: string;
  category: MilestoneCategory;
  date: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  status: MilestoneStatus;
  target_score?: string;
  actual_score?: string;
  description?: string;
  subjects?: string[];
  color?: string;
  preparation_notes?: string;
}

export interface ExamPrepTask {
  id: string;
  milestone_id: string; // ID của AcademicMilestone
  child_id: string;
  title: string;
  subject?: string;
  due_date?: string; // YYYY-MM-DD
  priority?: 'high' | 'medium' | 'low';
  is_completed: boolean;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

// ================== BỮA SÁNG (Breakfast Planner) ==================

/** Một món ăn sáng cụ thể cho một ngày trong tuần */
export interface BreakfastMeal {
  weekday: WeekdayNumber; // 2=Mon, 3=Tue, ..., 7=Sat, 8=Sun
  meal: string;           // e.g. "Bánh mì trứng", "Cháo gà"
  note?: string;
}

/** Kế hoạch bữa sáng cho một trẻ — có thể có nhiều menu xoay vòng */
export interface BreakfastPlan {
  id: string;
  child_id: string;
  /** Tên menu, e.g. "Menu Tuần A", "Menu Tuần B" */
  name: string;
  /** Danh sách món theo từng ngày */
  meals: BreakfastMeal[];
  created_at?: string;
}

/** Cài đặt tính năng bữa sáng per-child */
export interface BreakfastSettings {
  child_id: string;
  enabled: boolean;
  /** ID của BreakfastPlan đang áp dụng tuần này */
  active_plan_id?: string;
  /** Bật tự động xoay vòng menu (A→B→A→B…) theo tuần */
  auto_rotate: boolean;
  /** Ngày bắt đầu cycle hiện tại (YYYY-MM-DD) — để tính tuần mấy */
  cycle_start?: string;
}

// ================== CÀI ĐẶT CỠ CHỮ & FONT CHỮ (Typography & Display Scaling) ==================

export type FontFamilyKey =
  | 'Quicksand'
  | 'Be Vietnam Pro'
  | 'Lexend'
  | 'Nunito'
  | 'Inter'
  | 'Comfortaa';

export type FontSizeScale = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type DisplayScaleMode = 'auto' | 'standard' | 'large' | 'tv';

export type TypographySectionKey =
  | 'general'
  | 'timetable'
  | 'breakfast'
  | 'extra'
  | 'kidCorner'
  | 'mother';

export interface SectionTypographyConfig {
  fontFamily: FontFamilyKey;
  fontSize: FontSizeScale;
}

export interface TypographySettings {
  displayMode: DisplayScaleMode;
  fullWidthOnLargeScreen: boolean;
  sections: Record<TypographySectionKey, SectionTypographyConfig>;
}

// ================== GÓC CỦA MẸ (Thực đơn 30 ngày & Lịch tập) ==================

export interface MotherMealDay {
  day: number; // 1 -> 30
  breakfast: string;
  lunch: string;
  snack: string;
  dinner: string;
  note?: string;
}

export type WorkoutCategory = 'cardio' | 'strength' | 'yoga' | 'pilates' | 'hiit' | 'rest';

export interface MotherWorkoutItem {
  id: string;
  weekday: WeekdayNumber; // 2=T2 ... 8=CN
  title: string;
  category: WorkoutCategory;
  time_slot: string; // e.g. "05:30 – 06:15" or "17:30 – 18:15"
  duration_min: number;
  calories_est: number;
  exercises: string; // Chi tiết các bài tập
  note?: string;
}

export interface MotherDailyCheckIn {
  date: string; // YYYY-MM-DD
  completedMeals: ('breakfast' | 'lunch' | 'snack' | 'dinner')[];
  waterGlasses: number; // 0 -> 10 (8 cốc = 2 lít)
  workoutCompleted: boolean;
  weightKg?: number;
  note?: string;
}

export interface MotherSettings {
  startDate: string; // YYYY-MM-DD ngày bắt đầu lộ trình 30 ngày
  targetCalories: number; // 1300
  targetWaterLiters: number; // 2.0
  targetWeightKg?: number;
  currentWeightKg?: number;
  authorName: string; // "Đinh Thị Mơ"
}

