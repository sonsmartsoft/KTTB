import React, { useState } from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import {
  Sparkles,
  Plus,
  TrendingUp,
  Target,
  CheckCircle2,
  Calendar,
  X,
  Award,
  BookOpen,
  GraduationCap,
  History,
  FileText,
  User,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Assessment,
  AssessmentPlan,
  PerformanceTarget,
  AssessmentSubjectResult,
  SchoolYearRecord,
} from '@/domain/types';

export const PerformancePage: React.FC = () => {
  const { activeChild } = useChild();

  // Active Tab: 'current' (Khảo sát đợt hiện tại) vs 'transcript' (Học bạ qua các năm từ Lớp 1)
  const [activeTab, setActiveTab] = useState<'current' | 'transcript'>('current');

  // Assessments & Plans
  const [plans, setPlans] = useState<AssessmentPlan[]>(() => storage.getAssessmentPlans());
  const [assessments, setAssessments] = useState<Assessment[]>(() => storage.getAssessments());
  const [targets, setTargets] = useState<PerformanceTarget[]>(() => storage.getTargets());

  // School Years (Học bạ các năm)
  const [schoolYears, setSchoolYears] = useState<SchoolYearRecord[]>(() => storage.getSchoolYears());

  const childPlans = plans.filter((p) => p.child_id === activeChild.id);
  const childAssessments = assessments.filter((a) => a.child_id === activeChild.id);
  const childTargets = targets.filter((t) => t.child_id === activeChild.id);
  const childSchoolYears = schoolYears.filter((y) => y.child_id === activeChild.id);

  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string>(childAssessments[0]?.id || '');
  const currentAssessment =
    childAssessments.find((a) => a.id === selectedAssessmentId) || childAssessments[0] || null;

  // Modals
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [isAddSchoolYearOpen, setIsAddSchoolYearOpen] = useState(false);
  const [expandedYearId, setExpandedYearId] = useState<string | null>(childSchoolYears[childSchoolYears.length - 1]?.id || null);

  // Form State for Add Assessment
  const [newPlanName, setNewPlanName] = useState('Khảo sát năng lực Tháng 10');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newComment, setNewComment] = useState('Làm bài tự tin, trình bày cẩn thận');
  const [newRank, setNewRank] = useState(2);
  const [newRankTotal, setNewRankTotal] = useState(42);

  const [subjectScores, setSubjectScores] = useState<
    { subject: string; score: number; target: number; comment: string }[]
  >([
    { subject: 'Toán', score: 9.5, target: 9.0, comment: 'Tốt phần đại số' },
    { subject: 'Ngữ văn', score: 8.5, target: 8.5, comment: 'Đoạn văn biểu cảm tốt' },
    { subject: 'Tiếng Anh', score: 9.5, target: 9.2, comment: 'Từ vựng phong phú' },
    { subject: 'KHTN', score: 9.0, target: 8.8, comment: 'Nắm chắc lý thuyết' },
    { subject: 'Lịch sử & Địa lí', score: 9.0, target: 8.5, comment: 'Nhớ mốc sự kiện' },
  ]);

  // Form State for Add School Year (Lên lớp mới)
  const [newSyYear, setNewSyYear] = useState('2027-2028');
  const [newSyGrade, setNewSyGrade] = useState('Lớp 7');
  const [newSyClass, setNewSyClass] = useState('7A2');
  const [newSySchool, setNewSySchool] = useState('THCS Tô Hiệu');
  const [newSyTeacherName, setNewSyTeacherName] = useState('');
  const [newSyTeacherPhone, setNewSyTeacherPhone] = useState('');
  const [newSyOverall, setNewSyOverall] = useState(9.5);
  const [newSyClassification, setNewSyClassification] = useState<SchoolYearRecord['classification']>('Đang học');
  const [newSyFeedback, setNewSyFeedback] = useState('');

  // Target Scores with actual progress
  const targetWithScores = childTargets.map((t) => {
    const result = currentAssessment?.results?.find((r) => r.subject === t.subject);
    const actualScore = result?.score ?? null;
    const pct = actualScore !== null ? Math.min((actualScore / t.target_value) * 100, 100) : 0;
    const gap = actualScore !== null ? actualScore - t.target_value : null;
    return { ...t, actualScore, pct, gap };
  });

  const handleSaveAssessment = (e: React.FormEvent) => {
    e.preventDefault();

    const planId = `plan-${Date.now()}`;
    const newPlan: AssessmentPlan = {
      id: planId,
      child_id: activeChild.id,
      school_year: '2026-2027',
      grade: activeChild.grade,
      name: newPlanName.trim(),
      type: 'monthly',
      planned_date: newDate,
      status: 'completed',
    };

    const avgScore =
      subjectScores.reduce((acc, curr) => acc + curr.score, 0) / (subjectScores.length || 1);

    const assessmentId = `assess-${Date.now()}`;
    const results: AssessmentSubjectResult[] = subjectScores.map((s, idx) => ({
      id: `res-${assessmentId}-${idx}`,
      assessment_id: assessmentId,
      subject: s.subject,
      score: s.score,
      max_score: 10,
      target_score: s.target,
      comment: s.comment,
    }));

    const newAssessment: Assessment = {
      id: assessmentId,
      assessment_plan_id: planId,
      child_id: activeChild.id,
      actual_date: newDate,
      overall_score: parseFloat(avgScore.toFixed(2)),
      overall_target: 9.0,
      rank: newRank,
      rank_scope: 'Lớp học',
      rank_total: newRankTotal,
      comment: newComment.trim(),
      status: 'completed',
      results,
    };

    storage.saveAssessmentPlans([...storage.getAssessmentPlans(), newPlan]);
    storage.addAssessment(newAssessment);

    setPlans(storage.getAssessmentPlans());
    setAssessments(storage.getAssessments());
    setSelectedAssessmentId(assessmentId);
    setIsAddAssessmentOpen(false);
  };

  const handleSaveSchoolYear = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSyClass.trim() || !newSySchool.trim()) return;

    storage.addSchoolYear({
      child_id: activeChild.id,
      school_year: newSyYear.trim(),
      grade: newSyGrade.trim(),
      class_name: newSyClass.trim(),
      school_name: newSySchool.trim(),
      homeroom_teacher: {
        name: newSyTeacherName.trim() || 'Chưa cập nhật',
        phone: newSyTeacherPhone.trim() || undefined,
      },
      overall_score: newSyOverall,
      rank: 1,
      rank_total: 42,
      classification: newSyClassification,
      teacher_feedback: newSyFeedback.trim() || undefined,
      status: newSyClassification === 'Đang học' ? 'current' : 'completed',
      subject_scores: [
        { subject: 'Toán', final_score: newSyOverall },
        { subject: 'Ngữ văn', final_score: newSyOverall - 0.5 },
        { subject: 'Tiếng Anh', final_score: newSyOverall },
      ],
    });

    setSchoolYears(storage.getSchoolYears());
    setIsAddSchoolYearOpen(false);
  };

  const handleScoreChange = (index: number, val: number) => {
    setSubjectScores((prev) =>
      prev.map((item, i) => (i === index ? { ...item, score: val } : item))
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Kết Quả Học Tập &amp; Học Bạ Toàn Diện</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Theo dõi điểm số định kỳ và lưu trữ trọn đời hồ sơ học tập từ Lớp 1 đến hiện tại của {activeChild.name}
          </p>
        </div>

        {/* Action button based on active tab */}
        {activeTab === 'current' ? (
          <Button
            variant="primary"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddAssessmentOpen(true)}
          >
            Nhập kết quả khảo sát
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            icon={<GraduationCap className="w-4 h-4" />}
            onClick={() => setIsAddSchoolYearOpen(true)}
          >
            Lên lớp mới / Thêm năm học
          </Button>
        )}
      </div>

      {/* TOP TAB SWITCHER: Khảo sát định kỳ vs Học bạ qua các năm */}
      <div className="flex border-b border-app-border">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'current'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Khảo Sát Đợt Hiện Tại (HK1 2026–2027)</span>
        </button>

        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'transcript'
              ? 'border-primary text-primary'
              : 'border-transparent text-content-muted hover:text-content-primary'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Học Bạ Qua Các Năm (Lớp 1 → Hiện tại)</span>
          <Badge variant="secondary" size="sm">
            {childSchoolYears.length} năm
          </Badge>
        </button>
      </div>

      {/* ================= TAB 1: KHẢO SÁT ĐỊNH KỲ ================= */}
      {activeTab === 'current' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* KPI Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 space-y-1">
              <span className="text-xs font-bold text-content-muted">Điểm trung bình đợt thi</span>
              <div className="text-3xl font-extrabold text-primary font-display">
                {currentAssessment?.overall_score ?? '—'}
                <span className="text-xs font-normal text-content-muted ml-1">/ 10</span>
              </div>
              <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>
                  {currentAssessment && currentAssessment.overall_score && currentAssessment.overall_score >= 9.0
                    ? 'Đạt danh hiệu Học sinh Xuất sắc'
                    : 'Đạt danh hiệu Học sinh Giỏi'}
                </span>
              </p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs font-bold text-content-muted">Xếp hạng chính thức</span>
              <div className="text-3xl font-extrabold text-secondary font-display">
                {currentAssessment?.rank ? `${currentAssessment.rank} / ${currentAssessment.rank_total}` : '—'}
              </div>
              <p className="text-[11px] text-content-muted">
                Phạm vi: {currentAssessment?.rank_scope || 'Toàn khối/Lớp'}
              </p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs font-bold text-content-muted">Mục tiêu học kỳ</span>
              <div className="text-3xl font-extrabold text-indigo-600 font-display">
                {childTargets.length}
                <span className="text-xs font-normal text-content-muted ml-1">chỉ tiêu môn</span>
              </div>
              <p className="text-[11px] text-content-secondary truncate">
                {childTargets.map((t) => `${t.subject} (≥${t.target_value})`).join(', ')}
              </p>
            </Card>

            <Card className="p-4 space-y-1">
              <span className="text-xs font-bold text-content-muted">Trạng thái rèn luyện</span>
              <div className="text-3xl font-extrabold text-emerald-600 font-display">Tốt</div>
              <p className="text-[11px] text-content-muted">Hạnh kiểm Tốt • Chăm chỉ</p>
            </Card>
          </div>

          {/* Subject Targets with Progress Bars */}
          {targetWithScores.length > 0 && (
            <Card className="p-6 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-app-border">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-content-primary">Chỉ Tiêu &amp; Khoảng Cách Mục Tiêu</h3>
                  <Badge variant="primary" size="sm">
                    HK1 2026–2027
                  </Badge>
                </div>
              </div>

              <div className="space-y-4">
                {targetWithScores.map((t) => (
                  <div key={t.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-content-primary">{t.subject}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-content-muted">
                          Mục tiêu: <strong className="text-content-primary">{t.target_value}</strong>
                        </span>
                        {t.actualScore !== null && (
                          <span
                            className={`font-bold ${
                              t.gap !== null && t.gap >= 0 ? 'text-emerald-600' : 'text-rose-500'
                            }`}
                          >
                            Thực tế: {t.actualScore}{' '}
                            {t.gap !== null &&
                              (t.gap >= 0 ? `(+${t.gap.toFixed(1)})` : `(${t.gap.toFixed(1)})`)}
                          </span>
                        )}
                        {t.actualScore === null && (
                          <Badge variant="outline" size="sm">
                            Chưa thi
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="h-3 rounded-full bg-app-subtle overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          t.pct >= 100 ? 'bg-emerald-500' : t.pct >= 80 ? 'bg-blue-500' : 'bg-amber-400'
                        }`}
                        style={{ width: `${t.pct}%` }}
                      />
                    </div>
                    {t.note && <p className="text-[11px] text-content-muted italic">* {t.note}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Current Assessment Results Breakdown */}
          {currentAssessment && (
            <Card className="p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between pb-3 border-b border-app-border gap-2">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">KẾT QUẢ CHI TIẾT</span>
                  <h3 className="text-lg font-bold text-content-primary">
                    {plans.find((p) => p.id === currentAssessment.assessment_plan_id)?.name || 'Khảo sát năng lực'}
                  </h3>
                  <p className="text-xs text-content-muted mt-0.5">
                    Ngày thi: {currentAssessment.actual_date.split('-').reverse().join('/')} • Nhận xét giáo viên:{' '}
                    <span className="text-content-primary font-medium">{currentAssessment.comment}</span>
                  </p>
                </div>
                <Badge variant="success">Hoàn thành</Badge>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-app-border text-content-muted">
                      <th className="py-2.5 font-bold">Môn học</th>
                      <th className="py-2.5 font-bold text-center">Mục tiêu</th>
                      <th className="py-2.5 font-bold text-center">Điểm thực tế</th>
                      <th className="py-2.5 font-bold text-center">Chênh lệch (Gap)</th>
                      <th className="py-2.5 font-bold">Nhận xét môn học</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-app-subtle">
                    {currentAssessment.results.map((res) => {
                      const gap = res.target_score !== undefined ? res.score - res.target_score : 0;
                      return (
                        <tr key={res.id} className="hover:bg-black/5 dark:hover:bg-white/5">
                          <td className="py-2.5 font-bold text-content-primary">{res.subject}</td>
                          <td className="py-2.5 text-center font-mono text-content-secondary">
                            {res.target_score ?? '—'}
                          </td>
                          <td className="py-2.5 text-center font-bold font-mono text-primary text-sm">
                            {res.score}
                          </td>
                          <td className="py-2.5 text-center font-mono font-bold">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] ${
                                gap >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {gap >= 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-2.5 text-content-secondary italic">{res.comment || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ================= TAB 2: HỌC BẠ QUA CÁC NĂM (LỚP 1 → N) ================= */}
      {activeTab === 'transcript' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-4 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>
                Toàn bộ hành trình học tập từ <strong>Lớp 1 đến hiện tại</strong> của <strong>{activeChild.name}</strong>. Khi
                sang năm học mới, dữ liệu cũ được bảo lưu vĩnh viễn không bao giờ bị ghi đè.
              </span>
            </div>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsAddSchoolYearOpen(true)}
            >
              Lên lớp mới / Thêm năm học
            </Button>
          </div>

          {/* School Years Accordion / Timeline */}
          <div className="space-y-4">
            {childSchoolYears.map((sy) => {
              const isExpanded = expandedYearId === sy.id;
              return (
                <Card
                  key={sy.id}
                  className={`overflow-hidden transition-all border-2 ${
                    sy.status === 'current'
                      ? 'border-primary ring-2 ring-primary/10'
                      : 'border-app-border'
                  }`}
                >
                  {/* Card Header Banner */}
                  <div
                    onClick={() => setExpandedYearId(isExpanded ? null : sy.id)}
                    className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-xl shadow-sm ${
                          sy.status === 'current'
                            ? 'bg-primary text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {sy.grade.replace('Lớp ', 'K')}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-bold text-content-primary">
                            Năm học {sy.school_year} — {sy.grade} ({sy.class_name})
                          </h3>
                          <Badge variant={sy.status === 'current' ? 'primary' : 'success'} size="sm">
                            {sy.classification}
                          </Badge>
                          {sy.status === 'current' && (
                            <span className="text-xs font-bold text-primary animate-pulse">● Đang học</span>
                          )}
                        </div>
                        <p className="text-xs text-content-muted mt-0.5">
                          {sy.school_name} • GVCN: <strong>{sy.homeroom_teacher.name}</strong>{' '}
                          {sy.homeroom_teacher.phone && `(${sy.homeroom_teacher.phone})`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* GPA Pill */}
                      <div className="text-right">
                        <span className="text-[10px] text-content-muted uppercase font-bold">ĐTB Cả năm</span>
                        <div className="text-2xl font-extrabold text-primary font-display">
                          {sy.overall_score}
                          <span className="text-xs font-normal text-content-muted">/10</span>
                        </div>
                      </div>

                      {sy.rank && (
                        <div className="text-right hidden sm:block">
                          <span className="text-[10px] text-content-muted uppercase font-bold">Xếp hạng</span>
                          <div className="text-lg font-bold text-secondary font-display">
                            #{sy.rank} <span className="text-xs font-normal text-content-muted">/{sy.rank_total}</span>
                          </div>
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-content-muted" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-content-muted" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content: Subject Breakdown & Teacher Feedback */}
                  {isExpanded && (
                    <div className="p-5 border-t border-app-border bg-app-bg/40 space-y-4 animate-in fade-in duration-150">
                      {/* Teacher Feedback Banner */}
                      {sy.teacher_feedback && (
                        <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                          <FileText className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <strong className="font-bold">Nhận xét cuối năm của GVCN ({sy.homeroom_teacher.name}):</strong>
                            <p className="mt-0.5 italic">{sy.teacher_feedback}</p>
                          </div>
                        </div>
                      )}

                      {/* Subject Scores Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-app-border text-content-muted">
                              <th className="py-2 font-bold">Môn học</th>
                              {sy.subject_scores.some((s) => s.term1_score !== undefined) && (
                                <th className="py-2 font-bold text-center">Học kỳ 1</th>
                              )}
                              {sy.subject_scores.some((s) => s.term2_score !== undefined) && (
                                <th className="py-2 font-bold text-center">Học kỳ 2</th>
                              )}
                              <th className="py-2 font-bold text-center">Tổng kết cả năm</th>
                              <th className="py-2 font-bold">Nhận xét / Đánh giá</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-app-subtle">
                            {sy.subject_scores.map((sub, i) => (
                              <tr key={i} className="hover:bg-black/5 dark:hover:bg-white/5">
                                <td className="py-2 font-bold text-content-primary">{sub.subject}</td>
                                {sy.subject_scores.some((s) => s.term1_score !== undefined) && (
                                  <td className="py-2 text-center font-mono text-content-secondary">
                                    {sub.term1_score ?? '—'}
                                  </td>
                                )}
                                {sy.subject_scores.some((s) => s.term2_score !== undefined) && (
                                  <td className="py-2 text-center font-mono text-content-secondary">
                                    {sub.term2_score ?? '—'}
                                  </td>
                                )}
                                <td className="py-2 text-center font-bold font-mono text-primary text-sm">
                                  {sub.final_score}
                                </td>
                                <td className="py-2 text-content-muted italic">{sub.comment || 'Hoàn thành tốt'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODAL: NHẬP ĐỢT KHẢO SÁT ================= */}
      {isAddAssessmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span>Nhập Kết Quả Đợt Khảo Sát Mới</span>
              </h3>
              <button
                onClick={() => setIsAddAssessmentOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAssessment} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-content-primary">Tên đợt khảo sát / bài thi *</label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra Giữa kỳ 1, Khảo sát Tháng 10..."
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Ngày thi *</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Xếp hạng</label>
                  <input
                    type="number"
                    min={1}
                    value={newRank}
                    onChange={(e) => setNewRank(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Sĩ số lớp</label>
                  <input
                    type="number"
                    min={1}
                    value={newRankTotal}
                    onChange={(e) => setNewRankTotal(parseInt(e.target.value) || 40)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Subject Scores Table */}
              <div className="space-y-1.5">
                <label className="font-bold text-content-primary">Điểm số từng môn (Thang điểm 10):</label>
                <div className="space-y-2 border border-app-border rounded-xl p-3 bg-app-bg/50">
                  {subjectScores.map((s, idx) => (
                    <div key={s.subject} className="flex items-center gap-3">
                      <span className="w-28 font-bold text-content-primary">{s.subject}</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="10"
                          value={s.score}
                          onChange={(e) => handleScoreChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 text-center font-bold font-mono rounded border border-app-border bg-app-surface text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-content-muted text-[10px]">/ 10</span>
                      </div>
                      <input
                        type="text"
                        placeholder="Nhận xét môn..."
                        value={s.comment}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSubjectScores((prev) =>
                            prev.map((item, i) => (i === idx ? { ...item, comment: val } : item))
                          );
                        }}
                        className="flex-1 px-2 py-1 text-[11px] rounded border border-app-border bg-app-surface text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Nhận xét chung của giáo viên / phụ huynh</label>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Ghi chú đánh giá chung..."
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddAssessmentOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu kết quả
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: LÊN LỚP MỚI / THÊM NĂM HỌC ================= */}
      {isAddSchoolYearOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface border border-app-border rounded-2xl p-6 shadow-theme-pop w-full max-w-md space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-app-border">
              <h3 className="text-base font-bold text-content-primary flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                <span>Lên Lớp Mới / Thêm Năm Học</span>
              </h3>
              <button
                onClick={() => setIsAddSchoolYearOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary hover:bg-black/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-content-secondary">
              Tạo hồ sơ cho năm học mới của con. Lịch sử các năm cũ được lưu trữ nguyên vẹn để so sánh.
            </p>

            <form onSubmit={handleSaveSchoolYear} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Năm học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 2027-2028"
                    value={newSyYear}
                    onChange={(e) => setNewSyYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Khối lớp *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Lớp 7"
                    value={newSyGrade}
                    onChange={(e) => setNewSyGrade(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Lớp học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: 7A2"
                    value={newSyClass}
                    onChange={(e) => setNewSyClass(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Trường học *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: THCS Tô Hiệu"
                    value={newSySchool}
                    onChange={(e) => setNewSySchool(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">GVCN mới</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Thầy Hoàng Văn A"
                    value={newSyTeacherName}
                    onChange={(e) => setNewSyTeacherName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">SĐT GVCN</label>
                  <input
                    type="tel"
                    placeholder="Ví dụ: 0912.xxx.xxx"
                    value={newSyTeacherPhone}
                    onChange={(e) => setNewSyTeacherPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">ĐTB dự kiến / Tổng kết</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={newSyOverall}
                    onChange={(e) => setNewSyOverall(parseFloat(e.target.value) || 9.0)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-content-primary">Xếp loại</label>
                  <select
                    value={newSyClassification}
                    onChange={(e) => setNewSyClassification(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Xuất sắc">Xuất sắc</option>
                    <option value="Giỏi">Giỏi</option>
                    <option value="Khá">Khá</option>
                    <option value="Hoàn thành tốt">Hoàn thành tốt</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-content-primary">Lời phê / Nhận xét của GVCN</label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận xét của thầy cô hoặc mục tiêu năm mới..."
                  value={newSyFeedback}
                  onChange={(e) => setNewSyFeedback(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-app-border bg-app-bg text-content-primary focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-app-border">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddSchoolYearOpen(false)}>
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm">
                  Lưu năm học mới
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
