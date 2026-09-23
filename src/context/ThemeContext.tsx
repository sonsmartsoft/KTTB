import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppTheme } from '@/domain/types';
import { THEMES, ThemeConfig, applyTheme, ColorMode } from '@/design-system/themes';
import { storage } from '@/services/storage';

export type { ColorMode };

interface ThemeContextType {
  theme: AppTheme;
  themeConfig: ThemeConfig;
  setTheme: (newTheme: AppTheme) => void;
  availableThemes: ThemeConfig[];
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('ktt_theme') as AppTheme;
    if (saved && ['cute', 'modern', 'pastel', 'colorful'].includes(saved)) {
      return saved;
    }
    return storage.getSettings().theme || 'cute';
  });

  const [colorMode, setColorModeState] = useState<ColorMode>(() => {
    return (localStorage.getItem('ktt_color_mode') as ColorMode) || 'light';
  });

  useEffect(() => {
    applyTheme(theme, colorMode);
    const settings = storage.getSettings();
    storage.saveSettings({ ...settings, theme });
  }, [theme, colorMode]);

  // Listen to system dark mode preference change if mode is 'system'
  useEffect(() => {
    if (colorMode !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      applyTheme(theme, 'system');
    };
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme, colorMode]);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const setColorMode = (newMode: ColorMode) => {
    setColorModeState(newMode);
    applyTheme(theme, newMode);
  };

  const themeConfig = THEMES[theme] || THEMES.cute;
  const availableThemes = Object.values(THEMES);

  return (
    <ThemeContext.Provider value={{ theme, themeConfig, setTheme, availableThemes, colorMode, setColorMode }}>
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

