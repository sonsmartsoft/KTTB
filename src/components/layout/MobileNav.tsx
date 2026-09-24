import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  TableProperties,
  Sparkles,
  Menu,
  X,
  UserCheck,
  BookOpen,
  Award,
  Users,
  Settings,
  Flag,
  TrendingUp,
} from 'lucide-react';
import { useKidMode } from '@/context/KidModeContext';

export const MobileNav: React.FC = () => {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { isKidMode } = useKidMode();

  const mainNavItems = isKidMode
    ? [
        { to: '/kid-corner', label: 'Góc Con', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
        { to: '/timetable', label: 'TKB', icon: <TableProperties className="w-5 h-5" /> },
        { to: '/milestones', label: 'Ôn thi', icon: <Flag className="w-5 h-5" /> },
        { to: '/achievements', label: 'Thưởng', icon: <Award className="w-5 h-5" /> },
      ]
    : [
        { to: '/', label: 'Hôm nay', icon: <LayoutDashboard className="w-5 h-5" /> },
        { to: '/timetable', label: 'TKB', icon: <TableProperties className="w-5 h-5" /> },
        { to: '/calendar', label: 'Lịch', icon: <CalendarDays className="w-5 h-5" /> },
        { to: '/performance', label: 'Điểm số', icon: <Sparkles className="w-5 h-5" /> },
      ];

  const extraNavItems = isKidMode
    ? [
        { to: '/milestone-progress', label: 'Kết quả học tập', desc: 'Lịch sử điểm số & tiến trình', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
      ]
    : [
        { to: '/milestones', label: 'Cột mốc & Lộ trình', desc: 'Gantt chart kỳ thi & Ôn tập nước rút', icon: <Flag className="w-5 h-5 text-indigo-500" /> },
        { to: '/milestone-progress', label: 'Kết quả & Tiến trình', desc: 'Biểu đồ điểm số & lịch sử học tập', icon: <TrendingUp className="w-5 h-5 text-emerald-500" /> },
        { to: '/teachers', label: 'Sổ liên lạc thầy cô', desc: 'Danh bạ GVCN & bộ môn, gọi điện, Zalo', icon: <UserCheck className="w-5 h-5 text-emerald-500" /> },
        { to: '/extra-classes', label: 'Lịch học thêm', desc: 'Lớp bồi dưỡng văn hóa, ngoại ngữ, ca tối', icon: <BookOpen className="w-5 h-5 text-blue-500" /> },
        { to: '/achievements', label: 'Thành tích & Khen thưởng', desc: 'Huy chương, cúp vàng, giấy khen', icon: <Award className="w-5 h-5 text-amber-500" /> },
        { to: '/children', label: 'Hồ sơ các bé', desc: 'Bé Trung Quân & Bé Hạ Băng', icon: <Users className="w-5 h-5 text-purple-500" /> },
        { to: '/settings', label: 'Giao diện & Cài đặt', desc: 'Đổi theme Cute/Modern/Pastel/Colorful', icon: <Settings className="w-5 h-5 text-slate-500" /> },
      ];

  return (
    <>
      {/* Mobile Drawer for More Items */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-sm animate-in fade-in flex flex-col justify-end">
          <div
            className="fixed inset-0"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="bg-app-surface border-t border-app-border rounded-t-3xl p-5 shadow-theme-pop z-10 space-y-4 max-h-[80vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-app-border">
              <div className="flex items-center gap-2">
                <span className="text-lg">⭐</span>
                <span className="font-bold text-sm text-content-primary font-display">Tất cả chức năng</span>
              </div>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-lg text-content-muted hover:text-content-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {extraNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3.5 p-3 rounded-2xl border transition-all ${
                      isActive
                        ? 'bg-primary/10 border-primary text-primary font-bold'
                        : 'bg-app-bg border-app-subtle text-content-primary hover:border-primary/40'
                    }`
                  }
                >
                  <div className="p-2 rounded-xl bg-app-surface border border-app-subtle shrink-0">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[11px] text-content-muted truncate">{item.desc}</div>
                  </div>
                </NavLink>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-card/95 backdrop-blur-md border-t border-app-border px-2 py-1.5 flex items-center justify-around mobile-nav-bar shadow-lg">
        {mainNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-2 rounded-theme-sm text-[11px] font-bold transition-all ${
                isActive
                  ? 'text-primary scale-105'
                  : 'text-content-muted hover:text-content-primary'
              }`
            }
          >
            {item.icon}
            <span className="mt-0.5">{item.label}</span>
          </NavLink>
        ))}

        {/* More button */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-theme-sm text-[11px] font-bold transition-all ${
            isMoreMenuOpen ? 'text-primary scale-105' : 'text-content-muted hover:text-content-primary'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="mt-0.5">Thêm...</span>
        </button>
      </nav>
    </>
  );
};
