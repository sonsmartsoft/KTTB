import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '@/domain/types';
import { THEMES, ThemeConfig, applyTheme } from '@/design-system/themes';
import { storage } from '@/services/storage';

interface ThemeContextType {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  setTheme: (newTheme: AppTheme) => void;
  availableThemes: ThemeConfig[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    // Read directly from localStorage (already initialized/applied in main.tsx)
    const saved = localStorage.getItem('ktt_theme') as AppTheme;
    if (saved && ['cute', 'modern', 'pastel', 'colorful'].includes(saved)) {
      return saved;
    }
    return storage.getSettings().theme || 'cute';
  });

  useEffect(() => {
    applyTheme(theme);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, theme });
  }, [theme]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const themeConfig = THEMES[theme] || THEMES.cute;
  const availableThemes = Object.values(THEMES);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, availableThemes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
