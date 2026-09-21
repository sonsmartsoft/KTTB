import { AppTheme } from '@/domain/types';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  description: string;
  icon: string;
  variables: Record<string, string>;
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  cute: {
    id: 'cute',
    name: 'Cute / Đáng yêu',
    description: 'Tươi sáng, bo tròn mềm mại, hình vẽ ngộ nghĩnh như mẫu infographic 6A5',
    icon: '🌸',
    variables: {
      '--bg-app': '#FDFBF7',
      '--bg-surface': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--border-app': '#F3E8D8',
      '--border-subtle': '#F8EFE4',
      '--text-primary': '#1E293B',
      '--text-secondary': '#64748B',
      '--text-muted': '#94A3B8',
      '--color-primary': '#2563EB',
      '--color-primary-hover': '#1D4ED8',
      '--color-primary-light': '#EFF6FF',
      '--color-primary-foreground': '#FFFFFF',
      '--color-secondary': '#F59E0B',
      '--color-secondary-hover': '#D97706',
      '--color-secondary-light': '#FEF3C7',
      '--color-secondary-foreground': '#FFFFFF',
      '--color-accent': '#EC4899',
      '--color-accent-light': '#FDF2F8',
      '--color-success': '#10B981',
      '--color-warning': '#F59E0B',
      '--color-danger': '#EF4444',
      '--color-info': '#3B82F6',
      '--radius-sm': '8px',
      '--radius-md': '12px',
      '--radius-lg': '16px',
      '--radius-xl': '24px',
      '--radius-card': '18px',
      '--shadow-sm': '0 2px 4px rgba(245, 158, 11, 0.05)',
      '--shadow-md': '0 4px 10px rgba(245, 158, 11, 0.08)',
      '--shadow-lg': '0 10px 24px -4px rgba(245, 158, 11, 0.12)',
      '--shadow-pop': '0 6px 0 #D97706',
      '--font-display': "'Comfortaa', 'Quicksand', cursive",
    },
  },
  modern: {
    id: 'modern',
    name: 'Modern / Tối giản',
    description: 'Phong cách tối giản, sắc nét, chuyên nghiệp, thông tin mạch lạc',
    icon: '✨',
    variables: {
      '--bg-app': '#F8FAFC',
      '--bg-surface': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--border-app': '#E2E8F0',
      '--border-subtle': '#F1F5F9',
      '--text-primary': '#0F172A',
      '--text-secondary': '#475569',
      '--text-muted': '#94A3B8',
      '--color-primary': '#0F172A',
      '--color-primary-hover': '#1E293B',
      '--color-primary-light': '#F1F5F9',
      '--color-primary-foreground': '#FFFFFF',
      '--color-secondary': '#3B82F6',
      '--color-secondary-hover': '#2563EB',
      '--color-secondary-light': '#EFF6FF',
      '--color-secondary-foreground': '#FFFFFF',
      '--color-accent': '#6366F1',
      '--color-accent-light': '#EEF2FF',
      '--color-success': '#059669',
      '--color-warning': '#D97706',
      '--color-danger': '#DC2626',
      '--color-info': '#2563EB',
      '--radius-sm': '4px',
      '--radius-md': '8px',
      '--radius-lg': '10px',
      '--radius-xl': '14px',
      '--radius-card': '10px',
      '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.04)',
      '--shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
      '--shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.08)',
      '--shadow-pop': '0 2px 0 #334155',
      '--font-display': "'Inter', system-ui, sans-serif",
    },
  },
  pastel: {
    id: 'pastel',
    name: 'Pastel / Nhẹ nhàng',
    description: 'Bảng màu phấn pastel dịu mắt, thư thái, tương phản vừa phải',
    icon: '☁️',
    variables: {
      '--bg-app': '#F8F9FA',
      '--bg-surface': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--border-app': '#E9ECEF',
      '--border-subtle': '#F3F4F6',
      '--text-primary': '#2D3748',
      '--text-secondary': '#718096',
      '--text-muted': '#A0AEC0',
      '--color-primary': '#8B5CF6',
      '--color-primary-hover': '#7C3AED',
      '--color-primary-light': '#F5F3FF',
      '--color-primary-foreground': '#FFFFFF',
      '--color-secondary': '#10B981',
      '--color-secondary-hover': '#059669',
      '--color-secondary-light': '#ECFDF5',
      '--color-secondary-foreground': '#FFFFFF',
      '--color-accent': '#F472B6',
      '--color-accent-light': '#FDF2F8',
      '--color-success': '#34D399',
      '--color-warning': '#FBBF24',
      '--color-danger': '#F87171',
      '--color-info': '#60A5FA',
      '--radius-sm': '6px',
      '--radius-md': '10px',
      '--radius-lg': '14px',
      '--radius-xl': '20px',
      '--radius-card': '14px',
      '--shadow-sm': '0 2px 4px rgba(139, 92, 246, 0.04)',
      '--shadow-md': '0 4px 10px rgba(139, 92, 246, 0.06)',
      '--shadow-lg': '0 12px 20px -3px rgba(139, 92, 246, 0.08)',
      '--shadow-pop': '0 4px 0 #C4B5FD',
      '--font-display': "'Nunito', 'Quicksand', sans-serif",
    },
  },
  colorful: {
    id: 'colorful',
    name: 'Colorful / Năng động',
    description: 'Màu sắc sinh động, rực rỡ, tràn đầy năng lượng học tập',
    icon: '🌈',
    variables: {
      '--bg-app': '#FAFAF9',
      '--bg-surface': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--border-app': '#E7E5E4',
      '--border-subtle': '#F5F5F4',
      '--text-primary': '#18181B',
      '--text-secondary': '#52525B',
      '--text-muted': '#A1A1AA',
      '--color-primary': '#E11D48',
      '--color-primary-hover': '#BE123C',
      '--color-primary-light': '#FFE4E6',
      '--color-primary-foreground': '#FFFFFF',
      '--color-secondary': '#2563EB',
      '--color-secondary-hover': '#1D4ED8',
      '--color-secondary-light': '#EFF6FF',
      '--color-secondary-foreground': '#FFFFFF',
      '--color-accent': '#059669',
      '--color-accent-light': '#D1FAE5',
      '--color-success': '#16A34A',
      '--color-warning': '#EA580C',
      '--color-danger': '#E11D48',
      '--color-info': '#0284C7',
      '--radius-sm': '8px',
      '--radius-md': '14px',
      '--radius-lg': '18px',
      '--radius-xl': '24px',
      '--radius-card': '16px',
      '--shadow-sm': '0 2px 4px rgba(225, 29, 72, 0.05)',
      '--shadow-md': '0 6px 14px rgba(225, 29, 72, 0.08)',
      '--shadow-lg': '0 14px 28px -4px rgba(225, 29, 72, 0.12)',
      '--shadow-pop': '0 5px 0 #9F1239',
      '--font-display': "'Comfortaa', 'Quicksand', sans-serif",
    },
  },
};

export function applyTheme(themeId: AppTheme): void {
  const theme = THEMES[themeId] || THEMES.cute;
  const root = document.documentElement;
  
  // Set theme data attribute for CSS targeting
  root.setAttribute('data-theme', theme.id);
  
  // Apply all CSS custom variables
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  try {
    localStorage.setItem('ktt_theme', theme.id);
  } catch {}
}
