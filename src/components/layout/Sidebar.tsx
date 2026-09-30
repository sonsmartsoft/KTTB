import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  TableProperties,
  Sparkles,
  Award,
  BookOpen,
  Users,
  Settings,
  UserCheck,
  Flag,
  TrendingUp,
  Heart,
  Smile,
  PanelLeftClose,
} from 'lucide-react';
import { useChild } from '@/context/ChildContext';
import { useKidMode } from '@/context/KidModeContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: <LayoutDashboard className="w-5 h-5" /> },
  { to: '/timetable', label: 'Thời khóa biểu', icon: <TableProperties className="w-5 h-5" /> },
  { to: '/kid-corner', label: 'Góc của Bé', icon: <Smile className="w-5 h-5 text-amber-500" /> },
  { to: '/mother', label: 'Góc của Mẹ (Ăn & Tập)', icon: <Heart className="w-5 h-5 text-rose-500" /> },
  { to: '/calendar', label: 'Lịch học & Sự kiện', icon: <CalendarDays className="w-5 h-5" /> },
  { to: '/extra-classes', label: 'Lịch học thêm', icon: <BookOpen className="w-5 h-5" /> },
  { to: '/performance', label: 'Điểm & Học bạ', icon: <Sparkles className="w-5 h-5" /> },
  { to: '/achievements', label: 'Thành tích & Khen thưởng', icon: <Award className="w-5 h-5" /> },
  { to: '/teachers', label: 'Sổ liên lạc thầy cô', icon: <UserCheck className="w-5 h-5" /> },
  { to: '/milestones', label: 'Cột mốc & Lộ trình', icon: <Flag className="w-5 h-5" /> },
  { to: '/milestone-progress', label: 'Kết quả & Tiến trình', icon: <TrendingUp className="w-5 h-5" /> },
  { to: '/children', label: 'Hồ sơ Mẹ & Các bé', icon: <Users className="w-5 h-5" /> },
  { to: '/settings', label: 'Giao diện & Cài đặt', icon: <Settings className="w-5 h-5" /> },
];

const KID_NAV_ITEMS: NavItem[] = [
  { to: '/kid-corner', label: 'Góc Của Con', icon: <Sparkles className="w-5 h-5 text-amber-500" /> },
  { to: '/timetable', label: 'Thời khóa biểu', icon: <TableProperties className="w-5 h-5" /> },
  { to: '/milestones', label: 'Cột mốc & Ôn thi', icon: <Flag className="w-5 h-5" /> },
  { to: '/milestone-progress', label: 'Kết quả học tập', icon: <TrendingUp className="w-5 h-5" /> },
  { to: '/achievements', label: 'Góc khen thưởng', icon: <Award className="w-5 h-5" /> },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed = false, onToggleCollapse }) => {
  const { activeChild } = useChild();
  const { isKidMode } = useKidMode();

  const currentNavItems = isKidMode ? KID_NAV_ITEMS : NAV_ITEMS;

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-app-card border-r border-app-border h-screen sticky top-0 shrink-0 z-20 transition-all duration-200">
      {/* Brand Logo & Title */}
      <div className="p-4 border-b border-app-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-theme-md bg-gradient-to-tr from-primary to-amber-400 flex items-center justify-center text-white shadow-theme-sm font-bold text-xl shrink-0">
            ⭐
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-content-primary leading-tight font-display truncate">
              Kids Timetable
            </h1>
            <p className="text-[11px] text-content-muted truncate">Lịch học &amp; Gia đình</p>
          </div>
        </div>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-content-muted hover:text-primary hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0"
            title="Ẩn thanh menu bên trái (Chế độ toàn màn hình / TV)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Active Child Mini Card */}
      <div className="p-3 mx-3 my-3 bg-app-bg border border-app-subtle rounded-theme-md flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm overflow-hidden"
          style={{ backgroundColor: activeChild.color || '#2563EB' }}
        >
          {activeChild.avatar_url?.startsWith('data:') || activeChild.avatar_url?.startsWith('http') ? (
            <img src={activeChild.avatar_url} alt={activeChild.name} className="w-full h-full object-cover" />
          ) : activeChild.avatar_url === 'boy' ? (
            '👦'
          ) : (
            '👧'
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-content-primary truncate">
            {activeChild.name}
          </div>
          <div className="text-[10px] text-content-muted truncate">
            {activeChild.class_name} • {activeChild.school_name}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {currentNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-theme-md text-xs font-bold transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-theme-sm'
                  : 'text-content-secondary hover:bg-black/5 dark:hover:bg-white/5 hover:text-content-primary'
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer Motivation */}
      <div className="p-4 border-t border-app-subtle text-center">
        <p className="text-[11px] text-content-muted italic">
          "Cố gắng mỗi ngày để chạm tới ước mơ! ♡"
        </p>
      </div>
    </aside>
  );
};
