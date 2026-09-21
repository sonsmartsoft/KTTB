import React from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Award, Plus, Calendar, Star, Trophy, Medal } from 'lucide-react';

export const AchievementsPage: React.FC = () => {
  const { activeChild } = useChild();
  const achievements = storage.getAchievements().filter((a) => a.child_id === activeChild.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            <span>Bộ Sưu Tập Thành Tích & Khen Thưởng</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Ghi nhận các danh hiệu, giải thưởng học thuật, chứng chỉ và bước tiến phát triển của {activeChild.name}
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Thêm thành tích mới
        </Button>
      </div>

      {/* Timeline of Achievements */}
      <div className="space-y-4">
        {achievements.map((ach) => (
          <Card key={ach.id} className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:shadow-theme-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl shrink-0 shadow-sm">
                {ach.category === 'competition' ? '🏆' : ach.category === 'certificate' ? '📜' : '⭐'}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-bold text-content-primary">{ach.title}</h3>
                  <Badge variant="secondary">{ach.result || 'Khen thưởng'}</Badge>
                  {ach.level && <Badge variant="outline">{ach.level}</Badge>}
                </div>
                <p className="text-xs text-content-secondary mt-1 max-w-2xl leading-relaxed">
                  {ach.description}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-content-muted mt-2">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    {ach.date.split('-').reverse().join('/')}
                  </span>
                  <span>•</span>
                  <span>Năm học: {ach.school_year}</span>
                  {ach.organization && (
                    <>
                      <span>•</span>
                      <span>Đơn vị: {ach.organization}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
