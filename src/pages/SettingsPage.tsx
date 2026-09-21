import React from 'react';
import { useTheme } from '@/context/ThemeContext';
import { AppTheme } from '@/domain/types';
import { Card } from '@/design-system/components/Card';
import { Button } from '@/design-system/components/Button';
import { Badge } from '@/design-system/components/Badge';
import { storage } from '@/services/storage';
import { RotateCcw, Check, Palette, Sparkles, Moon, Sun } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, setTheme, availableThemes } = useTheme();

  const handleResetSeed = () => {
    if (window.confirm('Khôi phục lại dữ liệu mẫu gốc cho Bé Trung Quân và Bé Hạ Băng?')) {
      storage.resetToSeed();
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      <div>
        <h2 className="text-2xl font-bold text-content-primary font-display flex items-center gap-2">
          <Palette className="w-6 h-6 text-primary" />
          <span>Giao diện & Cài đặt</span>
        </h2>
        <p className="text-sm text-content-secondary mt-1">
          Tùy chỉnh phong cách hiển thị và quản lý cấu hình hệ thống
        </p>
      </div>

      {/* Theme Selection Grid */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-content-primary">Chọn chủ đề hiển thị (Theme)</h3>
            <p className="text-xs text-content-muted">
              Thay đổi toàn bộ ngôn ngữ thiết kế, màu sắc, phông chữ và cảm xúc của ứng dụng
            </p>
          </div>
          <Badge variant="primary">4 phong cách</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {availableThemes.map((t) => {
            const isSelected = t.id === theme;
            return (
              <div
                key={t.id}
                onClick={() => setTheme(t.id as AppTheme)}
                className={`p-4 rounded-theme-card border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-theme-md ring-2 ring-primary/20'
                    : 'border-app-border bg-app-card hover:border-primary/50'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{t.icon}</span>
                      <span className="text-sm font-bold text-content-primary">{t.name}</span>
                    </div>
                    {isSelected && (
                      <span className="p-1 rounded-full bg-primary text-white">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-content-secondary">{t.description}</p>
                </div>

                {/* Theme mini preview bars */}
                <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-app-subtle">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: t.variables['--color-primary'] }}
                    title="Primary"
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: t.variables['--color-secondary'] }}
                    title="Secondary"
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: t.variables['--color-accent'] }}
                    title="Accent"
                  />
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: t.variables['--bg-app'], border: '1px solid #ccc' }}
                    title="Background"
                  />
                  <span className="text-[10px] text-content-muted ml-auto font-mono">
                    {isSelected ? 'Đang kích hoạt' : 'Bấm để chọn'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* System Data Management */}
      <Card className="p-6 space-y-4">
        <h3 className="text-base font-bold text-content-primary">Quản lý dữ liệu mẫu</h3>
        <p className="text-xs text-content-secondary">
          Hệ thống đang hoạt động với chế độ lưu trữ LocalStorage ngoại tuyến kèm dữ liệu chuẩn cho Bé Trung Quân (2015 - Lớp 6A5) và Bé Hạ Băng (2023 - Mầm non).
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetSeed}
            icon={<RotateCcw className="w-4 h-4 text-amber-500" />}
          >
            Khôi phục dữ liệu mẫu gốc
          </Button>
        </div>
      </Card>
    </div>
  );
};
