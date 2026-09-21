import React from 'react';
import { useChild } from '@/context/ChildContext';
import { storage } from '@/services/storage';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { BookOpen, Plus, Clock, Calendar } from 'lucide-react';
import { DAY_HEADER_COLORS } from '@/design-system/tokens/colors';

export const ExtraClassesPage: React.FC = () => {
  const { activeChild } = useChild();
  const extraSchedules = storage.getExtraSchedules().filter((e) => e.child_id === activeChild.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            <span>Lịch Học Thêm & Ngoại Khóa</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý các ca học định kỳ buổi tối hoặc cuối tuần theo từng buổi, độc lập với tiết học chính khóa
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Thêm lớp học thêm
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {extraSchedules.map((extra) => (
          <Card key={extra.id} className="p-5 space-y-4 hover:shadow-theme-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-content-primary">{extra.name}</h3>
                <span className="text-xs text-content-muted capitalize">{extra.category}</span>
              </div>
              <Badge variant="secondary">
                {extra.session === 'evening' ? 'Buổi tối' : extra.session === 'morning' ? 'Buổi sáng' : 'Buổi chiều'}
              </Badge>
            </div>

            <div className="space-y-2 pt-2 border-t border-app-subtle text-xs">
              <div className="flex items-center gap-2 text-content-secondary">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-content-primary">
                  {extra.start_time} – {extra.end_time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-content-secondary">
                <Calendar className="w-4 h-4 text-secondary" />
                <div className="flex flex-wrap gap-1">
                  {extra.weekdays.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                      style={{ backgroundColor: DAY_HEADER_COLORS[w]?.bg || '#2563EB' }}
                    >
                      {DAY_HEADER_COLORS[w]?.label || `T${w}`}
                    </span>
                  ))}
                </div>
              </div>

              {extra.note && (
                <div className="p-2 rounded bg-app-bg text-[11px] text-content-secondary italic border border-app-subtle mt-2">
                  * {extra.note}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
