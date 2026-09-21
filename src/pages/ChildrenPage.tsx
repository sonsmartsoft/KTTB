import React from 'react';
import { useChild } from '@/context/ChildContext';
import { Card } from '@/design-system/components/Card';
import { Badge } from '@/design-system/components/Badge';
import { Button } from '@/design-system/components/Button';
import { Users, Plus, Check, School, Calendar } from 'lucide-react';

export const ChildrenPage: React.FC = () => {
  const { childrenList, activeChild, setActiveChildId } = useChild();

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold font-display text-content-primary flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <span>Hồ Sơ Các Con Trong Gia Đình</span>
          </h2>
          <p className="text-sm text-content-secondary mt-1">
            Quản lý thông tin học tập, lớp, trường và chuyển đổi nhanh giữa các bé
          </p>
        </div>

        <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
          Thêm bé mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {childrenList.map((c) => {
          const isSelected = c.id === activeChild.id;
          return (
            <Card
              key={c.id}
              className={`p-6 space-y-4 border-2 transition-all ${
                isSelected ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-app-border'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-md"
                    style={{ backgroundColor: c.color }}
                  >
                    {c.avatar_url === 'boy' ? '👦' : '👧'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-content-primary">{c.name}</h3>
                    <p className="text-xs text-content-muted">Tên thân mật: Bé {c.nickname}</p>
                  </div>
                </div>

                {isSelected ? (
                  <Badge variant="primary" icon={<Check className="w-3.5 h-3.5" />}>
                    Đang chọn
                  </Badge>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveChildId(c.id)}
                  >
                    Chọn bé này
                  </Button>
                )}
              </div>

              <div className="space-y-2 pt-3 border-t border-app-subtle text-xs">
                <div className="flex items-center gap-2 text-content-secondary">
                  <School className="w-4 h-4 text-primary" />
                  <span className="font-bold text-content-primary">{c.class_name}</span>
                  <span>•</span>
                  <span>{c.school_name}</span>
                </div>

                <div className="flex items-center gap-2 text-content-secondary">
                  <Calendar className="w-4 h-4 text-secondary" />
                  <span>Năm sinh: <strong>{c.birthYear}</strong></span>
                  {c.date_of_birth && (
                    <span className="text-content-muted">
                      ({c.date_of_birth.split('-').reverse().join('/')})
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full"
                  onClick={() => setActiveChildId(c.id)}
                >
                  Xem thời khóa biểu & lịch học của {c.nickname}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
