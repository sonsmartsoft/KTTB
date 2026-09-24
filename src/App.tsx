import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { ChildProvider } from './context/ChildContext';
import { DateProvider } from './context/DateContext';
import { KidModeProvider } from './context/KidModeContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { TimetablePage } from './pages/TimetablePage';
import { CalendarPage } from './pages/CalendarPage';
import { ExtraClassesPage } from './pages/ExtraClassesPage';
import { PerformancePage } from './pages/PerformancePage';
import { AchievementsPage } from './pages/AchievementsPage';
import { ChildrenPage } from './pages/ChildrenPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeachersPage } from './pages/TeachersPage';
import { MilestonesKanbanPage } from './pages/MilestonesKanbanPage';
import { MilestoneProgressPage } from './pages/MilestoneProgressPage';
import { KidCornerPage } from './pages/KidCornerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ChildProvider>
          <KidModeProvider>
            <DateProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<AppShell />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="kid-corner" element={<KidCornerPage />} />
                    <Route path="timetable" element={<TimetablePage />} />
                    <Route path="calendar" element={<CalendarPage />} />
                    <Route path="extra-classes" element={<ExtraClassesPage />} />
                    <Route path="performance" element={<PerformancePage />} />
                    <Route path="achievements" element={<AchievementsPage />} />
                    <Route path="teachers" element={<TeachersPage />} />
                    <Route path="milestones" element={<MilestonesKanbanPage />} />
                    <Route path="milestone-progress" element={<MilestoneProgressPage />} />
                    <Route path="children" element={<ChildrenPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </DateProvider>
          </KidModeProvider>
        </ChildProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
