import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';

export const AppShell: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-app-bg text-content-primary">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header />
        <main className="flex-1 p-3 sm:p-4 md:p-5 lg:p-6 w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Persistent Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
