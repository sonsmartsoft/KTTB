import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  TableProperties,
  Sparkles,
  Settings,
} from 'lucide-react';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: '/', label: 'Hôm nay', icon: <LayoutDashboard className="w-5 h-5" /> },
    { to: '/timetable', label: 'TKB', icon: <TableProperties className="w-5 h-5" /> },
    { to: '/calendar', label: 'Lịch', icon: <CalendarDays className="w-5 h-5" /> },
    { to: '/performance', label: 'Điểm số', icon: <Sparkles className="w-5 h-5" /> },
    { to: '/settings', label: 'Cài đặt', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-app-card/95 backdrop-blur-md border-t border-app-border px-2 py-1.5 flex items-center justify-around mobile-nav-bar shadow-lg">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-1 px-2.5 rounded-theme-sm text-[11px] font-bold transition-all ${
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
    </nav>
  );
};
