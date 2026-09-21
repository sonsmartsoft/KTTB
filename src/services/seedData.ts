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
} from '@/domain/types';

export const SEED_CHILDREN: Child[] = [
  {
    id: 'child-trung-quan',
    name: 'Bé Trung Quân',
    nickname: 'Quân',
    birthYear: 2015,
    date_of_birth: '2015-08-15',
    school_name: 'THCS Tô Hiệu',
    grade: 'Lớp 6',
    class_name: '6A5',
    avatar_url: 'boy',
    color: '#2563EB',
    active: true,
  },
  {
    id: 'child-ha-bang',
    name: 'Bé Hạ Băng',
    nickname: 'Băng',
    birthYear: 2023,
    date_of_birth: '2023-04-20',
    school_name: 'Trường Mầm Non Họa Mi',
    grade: 'Mầm non 3 tuổi',
    class_name: 'Lớp Mầm 1',
    avatar_url: 'girl',
    color: '#EC4899',
    active: true,
  },
];

export const SEED_TIMETABLE_TEMPLATES: TimetableTemplate[] = [
  {
    id: 'template-quan-hk1',
    child_id: 'child-trung-quan',
    name: 'Thời Khóa Biểu Lớp 6A5 — HK1',
    description: 'Áp dụng cho học kỳ 1 năm học 2026–2027 tại THCS Tô Hiệu',
    school_year: '2026-2027',
    semester: 'HK1',
    valid_from: '2026-09-01',
    valid_to: '2026-12-31',
    status: 'active',
  },
  {
    id: 'template-bang-mn',
    child_id: 'child-ha-bang',
    name: 'Lịch Sinh Hoạt & Năng Khiếu Mầm Non',
    description: 'Lịch sinh hoạt và học năng khiếu tại trường mầm non và tại nhà',
    school_year: '2026-2027',
    semester: 'Cả năm',
    valid_from: '2026-09-01',
    valid_to: '2027-05-31',
    status: 'active',
  },
];

export const SEED_TIMETABLE_ENTRIES: TimetableEntry[] = [
  // ==================== BÉ TRUNG QUÂN - LỚP 6A5 (MATCHING SAMPLE.PNG) ====================
  // --- THỨ 2 (weekday: 2) ---
  // Sáng
  { id: 't2-s1', timetable_id: 'template-quan-hk1', weekday: 2, period: 1, session: 'morning', start_time: '07:00', end_time: '07:45', subject: 'Chào cờ', teacher: 'M. Dung' },
  { id: 't2-s2', timetable_id: 'template-quan-hk1', weekday: 2, period: 2, session: 'morning', start_time: '08:45', end_time: '09:30', subject: 'Ngữ văn', teacher: 'Hiếu' },
  { id: 't2-s3', timetable_id: 'template-quan-hk1', weekday: 2, period: 3, session: 'morning', start_time: '09:50', end_time: '10:35', subject: 'GDTC', teacher: 'Lê Minh' },
  { id: 't2-s4', timetable_id: 'template-quan-hk1', weekday: 2, period: 4, session: 'morning', start_time: '10:55', end_time: '11:40', subject: 'Âm nhạc', teacher: 'Lê Minh' },
  // Chiều
  { id: 't2-c1', timetable_id: 'template-quan-hk1', weekday: 2, period: 1, session: 'afternoon', start_time: '13:30', end_time: '14:15', subject: 'TANN', teacher: 'G.VNN*' },
  { id: 't2-c2', timetable_id: 'template-quan-hk1', weekday: 2, period: 2, session: 'afternoon', start_time: '14:35', end_time: '15:20', subject: 'KNS', teacher: 'M. Dung*' },

  // --- THỨ 3 (weekday: 3) ---
  // Sáng
  { id: 't3-s1', timetable_id: 'template-quan-hk1', weekday: 3, period: 1, session: 'morning', start_time: '07:00', end_time: '07:45', subject: 'Toán', teacher: 'Q. Quyên' },
  { id: 't3-s2', timetable_id: 'template-quan-hk1', weekday: 3, period: 2, session: 'morning', start_time: '08:45', end_time: '09:30', subject: 'Anh', teacher: 'H. Thủy' },
  { id: 't3-s3', timetable_id: 'template-quan-hk1', weekday: 3, period: 3, session: 'morning', start_time: '09:50', end_time: '10:35', subject: 'KHTN (S)', teacher: 'Yên Hoa (TG)' },
  { id: 't3-s4', timetable_id: 'template-quan-hk1', weekday: 3, period: 4, session: 'morning', start_time: '10:55', end_time: '11:40', subject: 'CN', teacher: 'H. Thủy' },
  // Chiều
  { id: 't3-c1', timetable_id: 'template-quan-hk1', weekday: 3, period: 1, session: 'afternoon', start_time: '13:30', end_time: '14:15', subject: 'LS-ĐL (Sử)', teacher: 'Tăm' },
  { id: 't3-c2', timetable_id: 'template-quan-hk1', weekday: 3, period: 2, session: 'afternoon', start_time: '14:35', end_time: '15:20', subject: 'GDTC', teacher: 'Lê Minh' },
  { id: 't3-c3', timetable_id: 'template-quan-hk1', weekday: 3, period: 3, session: 'afternoon', start_time: '15:40', end_time: '16:25', subject: 'Địa', teacher: 'M. Dung' },

  // --- THỨ 4 (weekday: 4) ---
  // Sáng
  { id: 't4-s1', timetable_id: 'template-quan-hk1', weekday: 4, period: 1, session: 'morning', start_time: '07:00', end_time: '07:45', subject: 'GDĐP', teacher: 'Thu Hương' },
  { id: 't4-s2', timetable_id: 'template-quan-hk1', weekday: 4, period: 2, session: 'morning', start_time: '08:45', end_time: '09:30', subject: 'Toán', teacher: 'Q. Quyên' },
  { id: 't4-s3', timetable_id: 'template-quan-hk1', weekday: 4, period: 3, session: 'morning', start_time: '09:50', end_time: '10:35', subject: 'Anh', teacher: 'H. Thủy' },
  { id: 't4-s4', timetable_id: 'template-quan-hk1', weekday: 4, period: 4, session: 'morning', start_time: '10:55', end_time: '11:40', subject: 'KHTN (Lí)', teacher: 'Q. Quyên' },
  // Chiều
  { id: 't4-c1', timetable_id: 'template-quan-hk1', weekday: 4, period: 1, session: 'afternoon', start_time: '13:30', end_time: '14:15', subject: 'HĐTN', teacher: 'Hiếu' },
  { id: 't4-c2', timetable_id: 'template-quan-hk1', weekday: 4, period: 2, session: 'afternoon', start_time: '14:35', end_time: '15:20', subject: 'Ngữ văn', teacher: 'Hiếu' },
  { id: 't4-c3', timetable_id: 'template-quan-hk1', weekday: 4, period: 3, session: 'afternoon', start_time: '15:40', end_time: '16:25', subject: 'Tin', teacher: 'K. Trang' },

  // --- THỨ 5 (weekday: 5) ---
  // Sáng
  { id: 't5-s1', timetable_id: 'template-quan-hk1', weekday: 5, period: 1, session: 'morning', start_time: '07:00', end_time: '07:45', subject: 'GDCD', teacher: 'Q. Quyên' },
  { id: 't5-s2', timetable_id: 'template-quan-hk1', weekday: 5, period: 2, session: 'morning', start_time: '08:45', end_time: '09:30', subject: 'Mĩ thuật', teacher: 'Hiếu' },
  { id: 't5-s3', timetable_id: 'template-quan-hk1', weekday: 5, period: 3, session: 'morning', start_time: '09:50', end_time: '10:35', subject: 'KHTN (S)', teacher: 'Yên Hoa (TG)' },
  { id: 't5-s4', timetable_id: 'template-quan-hk1', weekday: 5, period: 4, session: 'morning', start_time: '10:55', end_time: '11:40', subject: 'Anh', teacher: 'H. Thủy' },
  // Chiều
  { id: 't5-c1', timetable_id: 'template-quan-hk1', weekday: 5, period: 1, session: 'afternoon', start_time: '13:30', end_time: '14:15', subject: 'Ngữ văn', teacher: 'Hiếu' },
  { id: 't5-c2', timetable_id: 'template-quan-hk1', weekday: 5, period: 2, session: 'afternoon', start_time: '14:35', end_time: '15:20', subject: 'Ngữ văn', teacher: 'Hiếu' },
  { id: 't5-c3', timetable_id: 'template-quan-hk1', weekday: 5, period: 3, session: 'afternoon', start_time: '15:40', end_time: '16:25', subject: 'Toán', teacher: 'Q. Quyên' },

  // --- THỨ 6 (weekday: 6) ---
  // Sáng
  { id: 't6-s1', timetable_id: 'template-quan-hk1', weekday: 6, period: 1, session: 'morning', start_time: '07:00', end_time: '07:45', subject: 'Địa', teacher: 'M. Dung' },
  { id: 't6-s2', timetable_id: 'template-quan-hk1', weekday: 6, period: 2, session: 'morning', start_time: '08:45', end_time: '09:30', subject: 'Toán', teacher: 'Q. Quyên' },
  { id: 't6-s3', timetable_id: 'template-quan-hk1', weekday: 6, period: 3, session: 'morning', start_time: '09:50', end_time: '10:35', subject: 'KHTN (Lí)', teacher: 'Quyên' },
  { id: 't6-s4', timetable_id: 'template-quan-hk1', weekday: 6, period: 4, session: 'morning', start_time: '10:55', end_time: '11:40', subject: 'SHL', teacher: 'M. Dung' },

  // ==================== BÉ HẠ BĂNG - MẦM NON 3 TUỔI ====================
  // Thứ 2 đến Thứ 6: Lịch sinh hoạt mầm non
  ...([2, 3, 4, 5, 6] as (2 | 3 | 4 | 5 | 6)[]).flatMap((weekday) => [
    { id: `bang-t${weekday}-s1`, timetable_id: 'template-bang-mn', weekday, period: 1, session: 'morning' as const, start_time: '07:30', end_time: '08:30', subject: 'Đón trẻ & Thể dục sáng', teacher: 'Cô Mai' },
    { id: `bang-t${weekday}-s2`, timetable_id: 'template-bang-mn', weekday, period: 2, session: 'morning' as const, start_time: '08:45', end_time: '09:30', subject: weekday % 2 === 0 ? 'Tạo hình & Vẽ màu' : 'Vận động & Âm nhạc', teacher: 'Cô Mai' },
    { id: `bang-t${weekday}-s3`, timetable_id: 'template-bang-mn', weekday, period: 3, session: 'morning' as const, start_time: '09:45', end_time: '10:30', subject: 'Vui chơi ngoài trời', teacher: 'Cô Lan' },
    { id: `bang-t${weekday}-c1`, timetable_id: 'template-bang-mn', weekday, period: 1, session: 'afternoon' as const, start_time: '14:30', end_time: '15:15', subject: 'Ăn xế & Hoạt động góc', teacher: 'Cô Mai' },
    { id: `bang-t${weekday}-c2`, timetable_id: 'template-bang-mn', weekday, period: 2, session: 'afternoon' as const, start_time: '15:30', end_time: '16:30', subject: 'Kể chuyện & Trả trẻ', teacher: 'Cô Lan' },
  ]),
];

export const SEED_EXTRA_SCHEDULES: ExtraSchedule[] = [
  // Bé Trung Quân - Extra Classes matching sample.png bottom banner
  {
    id: 'extra-quan-math',
    child_id: 'child-trung-quan',
    name: 'Toán bồi dưỡng',
    category: 'math',
    weekdays: [2, 5], // Thứ 2, Thứ 5
    session: 'evening',
    start_time: '19:15',
    end_time: '21:15',
    note: 'Lớp nâng cao cô Quyên',
    color: '#059669',
    active: true,
  },
  {
    id: 'extra-quan-english',
    child_id: 'child-trung-quan',
    name: 'Tiếng Anh giao tiếp & ngữ pháp',
    category: 'english',
    weekdays: [4, 7], // Thứ 4, Thứ 7
    session: 'evening',
    start_time: '17:15',
    end_time: '19:15',
    note: 'Thứ 4: 17:15–19:15 | Thứ 7: 19:30–21:30',
    color: '#DB2777',
    active: true,
  },
  {
    id: 'extra-quan-english-tutor',
    child_id: 'child-trung-quan',
    name: 'Phụ đạo Tiếng Anh',
    category: 'english',
    weekdays: [6], // Thứ 6
    session: 'evening',
    start_time: '19:30',
    end_time: '21:30',
    note: '19:30–21:30 hoặc Chủ nhật 8:00–10:00 (nếu không học T6)',
    color: '#7C3AED',
    active: true,
  },

  // Bé Hạ Băng - Năng khiếu mầm non
  {
    id: 'extra-bang-dance',
    child_id: 'child-ha-bang',
    name: 'Múa thiếu nhi & Cảm thụ âm nhạc',
    category: 'art_pe',
    weekdays: [3, 5], // Thứ 3, Thứ 5
    session: 'evening',
    start_time: '17:45',
    end_time: '18:45',
    note: 'Cung Thiếu nhi Quận',
    color: '#EC4899',
    active: true,
  },
  {
    id: 'extra-bang-swim',
    child_id: 'child-ha-bang',
    name: 'Bơi làm quen nước cùng ba mẹ',
    category: 'art_pe',
    weekdays: [7], // Thứ 7
    session: 'morning',
    start_time: '08:30',
    end_time: '09:30',
    note: 'Hồ bơi thiếu nhi',
    color: '#0284C7',
    active: true,
  },
];

export const SEED_SCHEDULE_EXCEPTIONS: ScheduleException[] = [
  {
    id: 'exc-quan-1',
    child_id: 'child-trung-quan',
    date: '2026-09-23', // Thứ 4
    type: 'replace',
    subject: 'Khảo sát giữa HK1 - Toán',
    teacher: 'Hội đồng thi',
    start_time: '08:45',
    end_time: '09:30',
    note: 'Kiểm tra khảo sát tập trung',
  },
  {
    id: 'exc-quan-2',
    child_id: 'child-trung-quan',
    date: '2026-10-05',
    type: 'cancel',
    subject: 'Toán bồi dưỡng',
    note: 'Nghỉ học thêm theo lịch giáo viên bận',
  },
];

export const SEED_ASSESSMENT_PLANS: AssessmentPlan[] = [
  {
    id: 'plan-quan-survey-1',
    child_id: 'child-trung-quan',
    school_year: '2026-2027',
    grade: 'Lớp 6',
    name: 'Khảo sát đầu năm học 2026–2027',
    type: 'diagnostic',
    planned_date: '2026-09-23',
    description: 'Đánh giá năng lực đầu năm khối 6 các môn Toán, Văn, Anh',
    status: 'completed',
  },
  {
    id: 'plan-quan-midterm-1',
    child_id: 'child-trung-quan',
    school_year: '2026-2027',
    grade: 'Lớp 6',
    name: 'Kiểm tra Giữa Học kỳ 1',
    type: 'midterm',
    planned_date: '2026-11-05',
    description: 'Thi giữa kỳ tập trung theo đề chung trường THCS Tô Hiệu',
    status: 'planned',
  },
];

export const SEED_ASSESSMENTS: Assessment[] = [
  {
    id: 'assess-quan-survey-1',
    assessment_plan_id: 'plan-quan-survey-1',
    child_id: 'child-trung-quan',
    actual_date: '2026-09-23',
    overall_score: 8.8,
    overall_target: 8.5,
    rank: 5,
    rank_scope: 'Lớp 6A5',
    rank_total: 41,
    percentile: 88,
    comment: 'Khởi đầu năm học rất tốt, phát huy tốt ở môn Tiếng Anh và KHTN!',
    status: 'completed',
    results: [
      { id: 'res-1', assessment_id: 'assess-quan-survey-1', subject: 'Toán', score: 8.5, max_score: 10, target_score: 8.5, previous_score: 8.0, rank: 6, comment: 'Làm bài chắc chắn' },
      { id: 'res-2', assessment_id: 'assess-quan-survey-1', subject: 'Ngữ văn', score: 8.0, max_score: 10, target_score: 8.0, previous_score: 7.8, rank: 9, comment: 'Ý tứ mạch lạc, chữ viết đẹp' },
      { id: 'res-3', assessment_id: 'assess-quan-survey-1', subject: 'Tiếng Anh', score: 9.5, max_score: 10, target_score: 9.0, previous_score: 9.0, rank: 2, comment: 'Từ vựng và ngữ pháp xuất sắc' },
      { id: 'res-4', assessment_id: 'assess-quan-survey-1', subject: 'KHTN', score: 9.0, max_score: 10, target_score: 8.5, previous_score: 8.5, rank: 4, comment: 'Hiểu bài sâu' },
    ],
  },
];

export const SEED_PERFORMANCE_TARGETS: PerformanceTarget[] = [
  {
    id: 'target-quan-math',
    child_id: 'child-trung-quan',
    school_year: '2026-2027',
    semester: 'HK1',
    subject: 'Toán',
    target_type: 'score',
    target_value: 9.0,
    note: 'Mục tiêu kiểm tra cuối kỳ đạt 9.0 trở lên',
    status: 'in_progress',
  },
  {
    id: 'target-quan-english',
    child_id: 'child-trung-quan',
    school_year: '2026-2027',
    semester: 'HK1',
    subject: 'Tiếng Anh',
    target_type: 'score',
    target_value: 9.2,
    note: 'Duy trì top 3 lớp môn Tiếng Anh',
    status: 'in_progress',
  },
  {
    id: 'target-quan-literature',
    child_id: 'child-trung-quan',
    school_year: '2026-2027',
    semester: 'HK1',
    subject: 'Ngữ văn',
    target_type: 'score',
    target_value: 8.5,
    note: 'Nâng cao khả năng viết nghị luận',
    status: 'in_progress',
  },
];

export const SEED_ACHIEVEMENT_RECORDS: AchievementRecord[] = [
  {
    id: 'ach-quan-1',
    child_id: 'child-trung-quan',
    date: '2026-05-25',
    school_year: '2025-2026',
    category: 'academic',
    title: 'Học sinh Tiêu biểu Xuất sắc Lớp 5',
    description: 'Đạt danh hiệu hoàn thành xuất sắc các nội dung học tập và rèn luyện năm học 2025–2026',
    level: 'Cấp trường',
    result: 'Xuất sắc',
    organization: 'Trường Tiểu học',
  },
  {
    id: 'ach-quan-2',
    child_id: 'child-trung-quan',
    date: '2026-06-12',
    school_year: '2025-2026',
    category: 'certificate',
    title: 'Chứng chỉ Cambridge English A2 Flyers',
    description: 'Đạt 14/15 khiên bài thi quốc tế Cambridge Flyers',
    level: 'Quốc tế',
    result: '14 Shields (Xuất sắc)',
    organization: 'Cambridge Assessment English',
    score: '14/15',
  },
  {
    id: 'ach-quan-3',
    child_id: 'child-trung-quan',
    date: '2026-03-20',
    school_year: '2025-2026',
    category: 'competition',
    title: 'Giải Ba Olympic Tiếng Anh qua Internet (IOE)',
    description: 'Đạt giải Ba kỳ thi IOE cấp Quận khối 5',
    level: 'Cấp quận',
    result: 'Giải Ba',
    organization: 'Phòng GD&ĐT',
    rank: '3',
  },
  // Bé Hạ Băng milestone
  {
    id: 'ach-bang-1',
    child_id: 'child-ha-bang',
    date: '2026-06-01',
    school_year: '2025-2026',
    category: 'behavior',
    title: 'Bé Khỏe Bé Ngoan Tuần Lễ Thiếu Nhi',
    description: 'Tự lập xúc cơm và hòa đồng với bạn bè tại lớp mầm',
    level: 'Cấp trường',
    result: 'Bé Ngoan Xuất Sắc',
    organization: 'Trường Mầm Non Họa Mi',
  },
];
