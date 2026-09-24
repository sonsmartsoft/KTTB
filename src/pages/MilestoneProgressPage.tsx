import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { KpiGradientCard } from '@/design-system/components/KpiGradientCard';
import { Badge } from '@/design-system/components/Badge';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine, Cell,
} from 'recharts';
import {
  TrendingUp, Trophy, Target, CheckCircle2, XCircle,
  BarChart2, Star, CalendarDays, BookOpen, Flame,
} from 'lucide-react';
import { AcademicMilestone, MilestoneCategory } from '@/domain/types';
import { formatChildDisplayName } from '@/lib/childNameHelper';

// ─── Category meta ────────────────────────────────────────────────────────────
const CATEGORY_META: Record<MilestoneCategory, { label: string; color: string; icon: string }> = {
  survey:      { label: 'Khảo sát',      color: '#0284C7', icon: '📝' },
  midterm:     { label: 'Giữa kỳ',       color: '#7C3AED', icon: '⚡' },
  final:       { label: 'Học kỳ',        color: '#DC2626', icon: '🏆' },
  olympic:     { label: 'HSG / Olympic', color: '#059669', icon: '🥇' },
  certificate: { label: 'Chứng chỉ',    color: '#DB2777', icon: '📜' },
  other:       { label: 'Khác',          color: '#64748B', icon: '📌' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseScore(raw: string | undefined): number | null {
  if (!raw) return null;
  // Extract first number from strings like ">= 9.0", "9.2", "Giải Ba" etc.
  const match = raw.match(/[\d]+(?:[.,]\d+)?/);
  if (!match) return null;
  return parseFloat(match[0].replace(',', '.'));
}

function formatScoreLabel(raw: string | undefined): string {
  return raw || '—';
}

// Custom recharts tooltip
const CustomBarTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-app-surface border border-app-border rounded-xl shadow-theme-pop p-3 text-xs min-w-[160px]">
      <div className="font-bold text-content-primary mb-2 text-sm leading-tight">{label}</div>
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
            <span className="text-content-secondary">{entry.name}</span>
          </div>
          <span className="font-black text-content-primary">{entry.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
};

const CustomLineTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload;
  return (
    <div className="bg-app-surface border border-app-border rounded-xl shadow-theme-pop p-3 text-xs min-w-[180px]">
      <div className="font-bold text-content-primary mb-1 leading-tight">{label}</div>
      {item?.dateLabel && <div className="text-content-muted text-[10px] mb-2">{item.dateLabel}</div>}
      {payload.map((entry: any) => (
        <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-content-secondary">{entry.name}</span>
          </div>
          <span className="font-black" style={{ color: entry.color }}>{entry.value ?? '—'}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export const MilestoneProgressPage: React.FC = () => {
  const { activeChild } = useChild();
  const allMilestones = storage.getMilestones();

  const childMilestones = useMemo(
    () => allMilestones
      .filter((m) => m.child_id === activeChild.id)
      .sort((a, b) => a.date.localeCompare(b.date)),
    [allMilestones, activeChild.id]
  );

  const completed = childMilestones.filter((m) => m.status === 'completed' && m.actual_score);
  const allWithTarget = childMilestones.filter((m) => m.actual_score || m.target_score);

  // ── Stats ──
  const totalExams   = childMilestones.length;
  const doneCount    = childMilestones.filter((m) => m.status === 'completed').length;
  const scoredCount  = completed.length;

  const metTarget = completed.filter((m) => {
    const actual = parseScore(m.actual_score);
    const target = parseScore(m.target_score);
    if (actual === null || target === null) return false;
    return actual >= target;
  }).length;

  const avgActual = (() => {
    const nums = completed.map((m) => parseScore(m.actual_score)).filter((n): n is number => n !== null);
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  })();

  // ── Bar chart data: target vs actual per exam ──
  const barData = allWithTarget.map((m) => ({
    name: m.title.length > 18 ? m.title.slice(0, 16) + '…' : m.title,
    fullName: m.title,
    'Mục tiêu': parseScore(m.target_score),
    'Thực tế':  parseScore(m.actual_score),
    category: m.category,
    color: CATEGORY_META[m.category].color,
    met: (() => {
      const a = parseScore(m.actual_score), t = parseScore(m.target_score);
      if (a === null || t === null) return null;
      return a >= t;
    })(),
  }));

  // ── Line chart data: score trend ──
  const lineData = completed.map((m) => ({
    name: m.title.length > 14 ? m.title.slice(0, 12) + '…' : m.title,
    dateLabel: m.date.split('-').reverse().join('/'),
    'Mục tiêu': parseScore(m.target_score),
    'Thực tế':  parseScore(m.actual_score),
  }));

  // ── Category breakdown ──
  const catBreakdown = (Object.keys(CATEGORY_META) as MilestoneCategory[]).map((cat) => {
    const items = childMilestones.filter((m) => m.category === cat);
    const done  = items.filter((m) => m.status === 'completed');
    return { cat, meta: CATEGORY_META[cat], total: items.length, done: done.length };
  }).filter((c) => c.total > 0);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Learning Progress</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-content-primary">
            Kết Quả & Tiến Trình — {formatChildDisplayName(activeChild)}
          </h2>
          <p className="text-sm text-content-secondary mt-1">Lịch sử điểm số và so sánh mục tiêu theo từng kỳ thi</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/milestones"
            className="px-3.5 py-2 rounded-xl border border-app-border bg-app-card text-content-primary hover:border-primary/50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-theme-sm"
          >
            <BarChart2 className="w-4 h-4 text-primary" />
            <span>Lộ trình Gantt / Kanban</span>
          </Link>
        </div>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <KpiGradientCard
          colorType="blue"
          icon={CalendarDays}
          title="TỔNG KỲ THI"
          value={totalExams}
          unit="kỳ"
          subtitle="Năm học 2026–2027"
          progressPercent={totalExams > 0 ? Math.round((doneCount / totalExams) * 100) : 0}
          progressLabel="Hoàn thành"
        />
        <KpiGradientCard
          colorType="emerald"
          icon={CheckCircle2}
          title="ĐÃ HOÀN THÀNH"
          value={doneCount}
          unit="kỳ"
          badgeText={totalExams > 0 ? `${Math.round((doneCount/totalExams)*100)}%` : '0%'}
          subtitle={`/ ${totalExams} kỳ thi tổng`}
          progressPercent={totalExams > 0 ? Math.round((doneCount / totalExams) * 100) : 0}
        />
        <KpiGradientCard
          colorType="amber"
          icon={Target}
          title="ĐẠT MỤC TIÊU"
          value={metTarget}
          unit={`/${scoredCount} kỳ`}
          badgeText={scoredCount > 0 ? `${Math.round((metTarget/scoredCount)*100)}%` : '—'}
          subtitle="Kỳ thi có nhập điểm"
          progressPercent={scoredCount > 0 ? Math.round((metTarget / scoredCount) * 100) : 0}
        />
        <KpiGradientCard
          colorType="purple"
          icon={Star}
          title="ĐIỂM TB THỰC TẾ"
          value={avgActual !== null ? avgActual.toFixed(1) : '—'}
          noCountUp
          subtitle="Trung bình tất cả kỳ"
          badgeText={avgActual !== null ? (avgActual >= 8 ? '🌟 Xuất sắc' : avgActual >= 6.5 ? '👍 Khá' : '📖 Cần cố') : 'Chưa có'}
        />
      </div>

      {/* ── Bar Chart: Mục tiêu vs Thực tế ── */}
      {barData.length > 0 ? (
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-content-primary flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-primary" />
                So sánh Mục tiêu ↔ Thực tế
              </h3>
              <p className="text-xs text-content-muted mt-0.5">Điểm số từng kỳ thi — cột xanh = mục tiêu, cột màu = kết quả</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={barData} barCategoryGap="25%" margin={{ top: 8, right: 16, left: -8, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: 'var(--color-content-muted, #94a3b8)' }}
                angle={-30}
                textAnchor="end"
                interval={0}
                height={64}
              />
              <YAxis
                domain={[0, 10]}
                tick={{ fontSize: 10, fill: 'var(--color-content-muted, #94a3b8)' }}
                tickCount={6}
              />
              <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={9} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: '≥9.0', position: 'right', fontSize: 9, fill: '#10B981' }} />
              <Bar dataKey="Mục tiêu" fill="#CBD5E1" radius={[4,4,0,0]} maxBarSize={32} />
              <Bar dataKey="Thực tế" radius={[4,4,0,0]} maxBarSize={32}>
                {barData.map((entry, idx) => (
                  <Cell
                    key={idx}
                    fill={entry.met === true ? '#10B981' : entry.met === false ? '#F87171' : entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 text-[11px] text-content-muted flex-wrap">
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />Đạt / vượt mục tiêu</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />Chưa đạt mục tiêu</div>
            <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-300 inline-block" />Mục tiêu đặt ra</div>
          </div>
        </Card>
      ) : (
        <Card className="p-10 text-center space-y-2">
          <div className="text-4xl">📊</div>
          <div className="font-bold text-content-primary">Chưa có điểm số nào</div>
          <div className="text-xs text-content-muted">Sau khi thi xong, vào Gantt Chart → click vào kỳ thi → nhập "Điểm thực tế" → chuyển trạng thái ✅</div>
        </Card>
      )}

      {/* ── Line Chart: Trend ── */}
      {lineData.length >= 2 && (
        <Card className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-content-primary flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Xu hướng điểm số theo thời gian
            </h3>
            <p className="text-xs text-content-muted mt-0.5">So sánh điểm thực tế với mục tiêu qua các kỳ đã hoàn thành</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={lineData} margin={{ top: 8, right: 16, left: -8, bottom: 56 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border, #e2e8f0)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-content-muted, #94a3b8)' }} angle={-30} textAnchor="end" interval={0} height={64} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: 'var(--color-content-muted, #94a3b8)' }} tickCount={6} />
              <Tooltip content={<CustomLineTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={9} stroke="#10B981" strokeDasharray="4 4" strokeWidth={1.5} />
              <Line type="monotone" dataKey="Mục tiêu" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 4, fill: '#CBD5E1' }} />
              <Line type="monotone" dataKey="Thực tế" stroke="#6366F1" strokeWidth={2.5} dot={{ r: 5, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* ── Detail Table ── */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-app-border flex items-center justify-between">
          <h3 className="font-bold text-content-primary flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Bảng Chi Tiết Tất Cả Kỳ Thi
          </h3>
          <Badge variant="outline" size="sm">{childMilestones.length} kỳ thi</Badge>
        </div>
        {childMilestones.length === 0 ? (
          <div className="p-10 text-center text-content-muted text-sm">Chưa có cột mốc nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr className="bg-app-subtle border-b border-app-border">
                  <th className="text-left px-3 py-2.5 font-bold text-content-muted" style={{ width: '140px', minWidth: '120px', maxWidth: '140px' }}>Kỳ thi / Cột mốc</th>
                  <th className="text-left px-3 py-2.5 font-bold text-content-muted">Loại</th>
                  <th className="text-center px-3 py-2.5 font-bold text-content-muted">Ngày</th>
                  <th className="text-center px-3 py-2.5 font-bold text-content-muted">Mục tiêu</th>
                  <th className="text-center px-3 py-2.5 font-bold text-content-muted">Thực tế</th>
                  <th className="text-center px-3 py-2.5 font-bold text-content-muted">Kết quả</th>
                  <th className="text-left px-3 py-2.5 font-bold text-content-muted">Môn thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/60">
                {childMilestones.map((m) => {
                  const meta   = CATEGORY_META[m.category];
                  const actual = parseScore(m.actual_score);
                  const target = parseScore(m.target_score);
                  const met    = actual !== null && target !== null ? actual >= target : null;
                  return (
                    <tr key={m.id} className="hover:bg-primary/[0.03] transition-colors group">
                      <td className="px-3 py-3" style={{ width: '140px', maxWidth: '140px', overflow: 'hidden' }}>
                        <div className="font-semibold text-content-primary leading-snug truncate" title={m.title}>{m.title}</div>
                        {m.preparation_notes && (
                          <div className="text-[10px] text-content-muted mt-0.5 italic line-clamp-1">💡 {m.preparation_notes}</div>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border" style={{ color: meta.color, borderColor: `${meta.color}40`, backgroundColor: `${meta.color}10` }}>
                          {meta.icon} {meta.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-content-secondary">
                        {m.date.split('-').reverse().join('/')}
                        {m.end_date && <><br /><span className="text-[10px] text-content-muted">→ {m.end_date.split('-').reverse().join('/')}</span></>}
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-content-secondary">
                        {formatScoreLabel(m.target_score)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {m.actual_score ? (
                          <span className="font-black text-lg" style={{ color: met === true ? '#10B981' : met === false ? '#EF4444' : '#6366F1' }}>
                            {m.actual_score}
                          </span>
                        ) : (
                          <span className="text-content-muted italic text-[11px]">
                            {m.status === 'completed' ? 'Chưa nhập' : m.status === 'active' ? '🔥 Đang thi' : '📋 Chưa thi'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {met === true && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-black">
                            <Trophy className="w-3 h-3" />ĐẠT
                          </span>
                        )}
                        {met === false && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] font-bold">
                            <XCircle className="w-3 h-3" />Chưa đạt
                          </span>
                        )}
                        {met === null && m.status !== 'completed' && (
                          <span className="text-[10px] text-content-muted">—</span>
                        )}
                        {met === null && m.status === 'completed' && (
                          <span className="text-[10px] text-content-muted italic">Chưa nhập điểm</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-content-secondary">
                        {m.subjects?.join(', ') || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {/* Summary footer */}
              {scoredCount > 0 && (
                <tfoot>
                  <tr className="bg-app-subtle border-t-2 border-app-border">
                    <td colSpan={4} className="px-4 py-3 font-bold text-content-primary">Tổng kết {scoredCount} kỳ đã có điểm</td>
                    <td className="px-3 py-3 text-center">
                      {avgActual !== null && (
                        <span className="font-black text-xl text-violet-600">{avgActual.toFixed(2)}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-bold text-emerald-600">{metTarget}/{scoredCount} đạt</span>
                    </td>
                    <td />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </Card>

      {/* ── Category Breakdown ── */}
      {catBreakdown.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {catBreakdown.map(({ cat, meta, total, done }) => (
            <Card key={cat} className="p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.icon}</span>
                  <span className="text-xs font-bold text-content-primary">{meta.label}</span>
                </div>
                <span className="text-xs font-bold text-content-muted">{done}/{total}</span>
              </div>
              {/* Progress bar */}
              <div className="h-2 rounded-full bg-app-bg overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${total > 0 ? (done/total)*100 : 0}%`, backgroundColor: meta.color }}
                />
              </div>
              <div className="text-[10px] text-content-muted">
                {done === total && total > 0
                  ? '✅ Hoàn thành tất cả'
                  : total - done > 0
                  ? `${total - done} kỳ còn lại`
                  : 'Chưa có kỳ thi nào'}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
