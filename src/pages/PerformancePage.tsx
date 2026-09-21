import React from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Sparkles, Plus, TrendingUp, Target, Award, CheckCircle2 } from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const { activeChild } = useChild();

  const plans = storage.getAssessmentPlans().filter((p) => p.child_id === activeChild.id);
  const assessments = storage.getAssessments().filter((a) => a.child_id === activeChild.id);
  const targets = storage.getTargets().filter((t) => t.child_id === activeChild.id);

  const latestAssessment = assessments[0];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            <span>Kết Quả Học Tập & Mục Tiêu</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Theo dõi kế hoạch khảo sát, điểm số thực tế, khoảng cách mục tiêu và thứ hạng chính thức của {activeChild.name}
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Thêm đợt khảo sát
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold text-content-muted">Điểm trung bình đợt gần nhất</span>
          <div className="text-3xl font-extrabold text-primary font-display">
            {latestAssessment?.overall_score ?? '—'}
            <span className="text-xs font-normal text-content-muted ml-1">/ 10</span>
          </div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Vượt mục tiêu +0.3 điểm</span>
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold text-content-muted">Xếp hạng chính thức</span>
          <div className="text-3xl font-extrabold text-secondary font-display">
            {latestAssessment?.rank ? `${latestAssessment.rank} / ${latestAssessment.rank_total}` : '—'}
          </div>
          <p className="text-[11px] text-content-muted">
            Phạm vi: {latestAssessment?.rank_scope || 'Lớp học'}
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold text-content-muted">Mục tiêu năm học</span>
          <div className="text-3xl font-extrabold text-indigo-600 font-display">
            {targets.length}
            <span className="text-xs font-normal text-content-muted ml-1">chỉ tiêu</span>
          </div>
          <p className="text-[11px] text-content-secondary">
            Toán (9.0), Anh (9.2), Văn (8.5)
          </p>
        </Card>

        <Card className="p-4 space-y-1">
          <span className="text-xs font-bold text-content-muted">Trạng thái rèn luyện</span>
          <div className="text-3xl font-extrabold text-emerald-600 font-display">
            Tốt
          </div>
          <p className="text-[11px] text-content-muted">
            Theo sổ theo dõi năm học 2026–2027
          </p>
        </Card>
      </div>

      {/* Latest Assessment Results Breakdown */}
      {latestAssessment && (
        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-app-border gap-2">
            <div>
              <span className="text-xs font-bold text-primary">KẾT QUẢ CHI TIẾT</span>
              <h3 className="text-lg font-bold text-content-primary">
                {plans.find((p) => p.id === latestAssessment.assessment_plan_id)?.name || 'Khảo sát năng lực'}
              </h3>
              <p className="text-xs text-content-muted">
                Ngày thi: {latestAssessment.actual_date.split('-').reverse().join('/')} • Nhận xét: {latestAssessment.comment}
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
                  <th className="py-2.5 font-bold text-center">Hạng môn</th>
                  <th className="py-2.5 font-bold">Nhận xét giáo viên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-subtle">
                {latestAssessment.results.map((res) => {
                  const gap = (res.target_score !== undefined) ? res.score - res.target_score : 0;
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
                            gap >= 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {gap >= 0 ? `+${gap.toFixed(1)}` : gap.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-content-secondary">
                        {res.rank ? `#${res.rank}` : '—'}
                      </td>
                      <td className="py-2.5 text-content-secondary italic">
                        {res.comment || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
