import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { FamilyBirthdayBanner } from '../family/FamilyBirthdayBanner';
import { storage } from '@/services/storage';

export const AppShell: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const typo = storage.getTypographySettings();
      if (typo.sidebarCollapsed !== undefined) return typo.sidebarCollapsed;
      return localStorage.getItem('ktt_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleSynced = () => {
      try {
        const typo = storage.getTypographySettings();
        if (typo.sidebarCollapsed !== undefined) {
          setIsSidebarCollapsed(typo.sidebarCollapsed);
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('ktt-cloud-synced', handleSynced);
    return () => window.removeEventListener('ktt-cloud-synced', handleSynced);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('ktt_sidebar_collapsed', String(next));
        const currentTypo = storage.getTypographySettings();
        storage.saveTypographySettings({
          ...currentTypo,
          sidebarCollapsed: next,
        });
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-content-primary">
      {/* Desktop Sidebar */}
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={handleToggleSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 w-full">
          <FamilyBirthdayBanner />
          <Outlet />
        </main>
      </div>

      {/* Mobile Persistent Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
