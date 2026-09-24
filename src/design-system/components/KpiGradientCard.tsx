import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export type KpiColorType = 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue' | 'teal' | 'indigo';

export interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  subColor?: string;
  badgeText?: string;
  badgeType?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  progressPercent?: number;
  /** Custom label cho progress bar, mặc định 'Tiến độ / Mục tiêu' */
  progressLabel?: string;
  colorType?: KpiColorType;
  icon?: LucideIcon | React.ComponentType<any> | React.ReactNode;
  onClick?: () => void;
  href?: string;
  trend?: {
    value: string | number;
    isPositive?: boolean;
    label?: string;
  };
  active?: boolean;
  className?: string;
  valueColor?: string;
  /** Hiển thị skeleton shimmer thay vì dữ liệu thật */
  loading?: boolean;
  /** compact = nhỏ hơn, phù hợp sidebar/mobile */
  size?: 'compact' | 'normal';
  /** Tắt count-up animation (dùng khi value là chuỗi) */
  noCountUp?: boolean;
}

export interface QmsThemeTokens {
  border: string;
  borderHover: string;
  cornerGlow: string;
  cornerGlowHover: string;
  accent: string;
  cardBg: string;
  cardBgHover: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconBg: string;
  iconBgHover: string;
  progressBar: string;
}

export function getQmsTheme(colorType: KpiColorType = 'cyan', isDark = false): QmsThemeTokens {
  switch (colorType) {
    case 'cyan':
      return {
        border: isDark ? 'rgba(14, 165, 233, 0.4)' : 'rgba(2, 132, 199, 0.35)',
        borderHover: isDark ? '#38bdf8' : '#0284c7',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(224, 242, 254, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(14, 165, 233, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(186, 230, 253, 1) 0%, rgba(224, 242, 254, 0.3) 75%)',
        accent: isDark ? '#38bdf8' : '#0284c7',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#121e2a' : '#f8fcff',
        badgeBg: isDark ? 'rgba(14, 165, 233, 0.22)' : 'rgba(224, 242, 254, 0.9)',
        badgeText: isDark ? '#7dd3fc' : '#0369a1',
        badgeBorder: isDark ? 'rgba(14, 165, 233, 0.45)' : 'rgba(2, 132, 199, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.35) 0%, rgba(14, 165, 233, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(2, 132, 199, 0.22) 0%, rgba(2, 132, 199, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(14, 165, 233, 0.5) 0%, rgba(14, 165, 233, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(2, 132, 199, 0.38) 0%, rgba(2, 132, 199, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #38bdf8 0%, #0284c7 100%)',
      };
    case 'emerald':
      return {
        border: isDark ? 'rgba(16, 185, 129, 0.4)' : 'rgba(16, 185, 129, 0.35)',
        borderHover: isDark ? '#34d399' : '#059669',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(209, 250, 229, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(16, 185, 129, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(167, 243, 208, 1) 0%, rgba(209, 250, 229, 0.25) 75%)',
        accent: isDark ? '#34d399' : '#059669',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#12201d' : '#f7fdfb',
        badgeBg: isDark ? 'rgba(16, 185, 129, 0.22)' : 'rgba(209, 250, 229, 0.9)',
        badgeText: isDark ? '#a7f3d0' : '#047857',
        badgeBorder: isDark ? 'rgba(16, 185, 129, 0.45)' : 'rgba(16, 185, 129, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(16, 185, 129, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.22) 0%, rgba(16, 185, 129, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.5) 0%, rgba(16, 185, 129, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.38) 0%, rgba(16, 185, 129, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #34d399 0%, #059669 100%)',
      };
    case 'amber':
      return {
        border: isDark ? 'rgba(245, 158, 11, 0.4)' : 'rgba(245, 158, 11, 0.35)',
        borderHover: isDark ? '#fcd34d' : '#ea580c',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(255, 237, 213, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(254, 215, 170, 1) 0%, rgba(255, 237, 213, 0.25) 75%)',
        accent: isDark ? '#fbbf24' : '#ea580c',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#231c15' : '#fffdf9',
        badgeBg: isDark ? 'rgba(245, 158, 11, 0.22)' : 'rgba(255, 237, 213, 0.9)',
        badgeText: isDark ? '#fed7aa' : '#c2410c',
        badgeBorder: isDark ? 'rgba(245, 158, 11, 0.45)' : 'rgba(234, 88, 12, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.35) 0%, rgba(245, 158, 11, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(234, 88, 12, 0.22) 0%, rgba(234, 88, 12, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.5) 0%, rgba(245, 158, 11, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(234, 88, 12, 0.38) 0%, rgba(234, 88, 12, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #fbbf24 0%, #ea580c 100%)',
      };
    case 'rose':
      return {
        border: isDark ? 'rgba(244, 63, 94, 0.4)' : 'rgba(244, 63, 94, 0.35)',
        borderHover: isDark ? '#fb7185' : '#e11d48',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(255, 228, 230, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(244, 63, 94, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(254, 205, 211, 1) 0%, rgba(255, 228, 230, 0.25) 75%)',
        accent: isDark ? '#fb7185' : '#e11d48',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#1f151b' : '#fffafd',
        badgeBg: isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(255, 228, 230, 0.9)',
        badgeText: isDark ? '#fda4af' : '#9f1239',
        badgeBorder: isDark ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.35) 0%, rgba(244, 63, 94, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(244, 63, 94, 0.22) 0%, rgba(244, 63, 94, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.5) 0%, rgba(244, 63, 94, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(244, 63, 94, 0.38) 0%, rgba(244, 63, 94, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #fb7185 0%, #e11d48 100%)',
      };
    case 'purple':
      return {
        border: isDark ? 'rgba(147, 51, 234, 0.4)' : 'rgba(147, 51, 234, 0.35)',
        borderHover: isDark ? '#c084fc' : '#9333ea',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(147, 51, 234, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(243, 232, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(147, 51, 234, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(233, 213, 255, 1) 0%, rgba(243, 232, 255, 0.25) 75%)',
        accent: isDark ? '#c084fc' : '#9333ea',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#181427' : '#faf8ff',
        badgeBg: isDark ? 'rgba(147, 51, 234, 0.22)' : 'rgba(243, 232, 255, 0.9)',
        badgeText: isDark ? '#d8b4fe' : '#6b21a8',
        badgeBorder: isDark ? 'rgba(147, 51, 234, 0.45)' : 'rgba(147, 51, 234, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.35) 0%, rgba(147, 51, 234, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(147, 51, 234, 0.22) 0%, rgba(147, 51, 234, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(147, 51, 234, 0.5) 0%, rgba(147, 51, 234, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(147, 51, 234, 0.38) 0%, rgba(147, 51, 234, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #c084fc 0%, #9333ea 100%)',
      };
    case 'blue':
      return {
        border: isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(37, 99, 235, 0.35)',
        borderHover: isDark ? '#60a5fa' : '#2563eb',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(219, 234, 254, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(191, 219, 254, 1) 0%, rgba(219, 234, 254, 0.25) 75%)',
        accent: isDark ? '#60a5fa' : '#2563eb',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#131b2c' : '#f7faff',
        badgeBg: isDark ? 'rgba(59, 130, 246, 0.22)' : 'rgba(219, 234, 254, 0.9)',
        badgeText: isDark ? '#bfdbfe' : '#1d4ed8',
        badgeBorder: isDark ? 'rgba(59, 130, 246, 0.45)' : 'rgba(37, 99, 235, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.35) 0%, rgba(59, 130, 246, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.22) 0%, rgba(37, 99, 235, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.5) 0%, rgba(59, 130, 246, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(37, 99, 235, 0.38) 0%, rgba(37, 99, 235, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #60a5fa 0%, #2563eb 100%)',
      };
    case 'teal':
      return {
        border: isDark ? 'rgba(20, 184, 166, 0.4)' : 'rgba(13, 148, 136, 0.35)',
        borderHover: isDark ? '#2dd4bf' : '#0d9488',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(204, 251, 241, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(20, 184, 166, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(153, 246, 228, 1) 0%, rgba(204, 251, 241, 0.25) 75%)',
        accent: isDark ? '#2dd4bf' : '#0d9488',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#112224' : '#f6fdfc',
        badgeBg: isDark ? 'rgba(20, 184, 166, 0.22)' : 'rgba(204, 251, 241, 0.9)',
        badgeText: isDark ? '#99f6e4' : '#115e59',
        badgeBorder: isDark ? 'rgba(20, 184, 166, 0.45)' : 'rgba(13, 148, 136, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.35) 0%, rgba(20, 184, 166, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(13, 148, 136, 0.22) 0%, rgba(13, 148, 136, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(20, 184, 166, 0.5) 0%, rgba(20, 184, 166, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(13, 148, 136, 0.38) 0%, rgba(13, 148, 136, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #2dd4bf 0%, #0d9488 100%)',
      };
    case 'indigo':
    default:
      return {
        border: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(79, 70, 229, 0.35)',
        borderHover: isDark ? '#818cf8' : '#4f46e5',
        cornerGlow: isDark
          ? 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.25) 0%, rgba(17, 24, 39, 0) 70%)'
          : 'radial-gradient(circle at top right, rgba(238, 242, 255, 0.95) 0%, rgba(255, 255, 255, 0) 70%)',
        cornerGlowHover: isDark
          ? 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.45) 0%, rgba(17, 24, 39, 0.1) 75%)'
          : 'radial-gradient(circle at top right, rgba(224, 231, 255, 1) 0%, rgba(238, 242, 255, 0.25) 75%)',
        accent: isDark ? '#818cf8' : '#4f46e5',
        cardBg: isDark ? '#111827' : '#ffffff',
        cardBgHover: isDark ? '#14172e' : '#f8f9ff',
        badgeBg: isDark ? 'rgba(99, 102, 241, 0.22)' : 'rgba(238, 242, 255, 0.9)',
        badgeText: isDark ? '#c7d2fe' : '#3730a3',
        badgeBorder: isDark ? 'rgba(99, 102, 241, 0.45)' : 'rgba(79, 70, 229, 0.35)',
        iconBg: isDark
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.35) 0%, rgba(99, 102, 241, 0.12) 100%)'
          : 'linear-gradient(135deg, rgba(79, 70, 229, 0.22) 0%, rgba(79, 70, 229, 0.08) 100%)',
        iconBgHover: isDark
          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.5) 0%, rgba(99, 102, 241, 0.25) 100%)'
          : 'linear-gradient(135deg, rgba(79, 70, 229, 0.38) 0%, rgba(79, 70, 229, 0.18) 100%)',
        progressBar: 'linear-gradient(90deg, #818cf8 0%, #4f46e5 100%)',
      };
  }
}

// ─── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, enabled = true): number {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target);
      return;
    }
    startTimeRef.current = null;
    const animate = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(target * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, enabled]);

  return count;
}

// ─── Shimmer Skeleton ──────────────────────────────────────────────────────────
const SkeletonLine: React.FC<{ w?: string; h?: string; className?: string }> = ({
  w = '100%',
  h = '12px',
  className = '',
}) => (
  <div
    className={`rounded-md ${className}`}
    style={{
      width: w,
      height: h,
      background: 'linear-gradient(90deg, #e2e8f0 25%, #f8fafc 50%, #e2e8f0 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
    }}
  />
);

// ─── Main Component ────────────────────────────────────────────────────────────
export const KpiGradientCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  subColor,
  badgeText,
  progressPercent,
  progressLabel,
  colorType = 'cyan',
  icon,
  onClick,
  href,
  trend,
  active = false,
  className = '',
  valueColor,
  loading = false,
  size = 'normal',
  noCountUp = false,
}) => {
  const { colorMode } = useTheme();
  const [isMounted, setIsMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // IntersectionObserver → trigger progress bar animation khi vào viewport
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setProgressVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  const isDark = isMounted
    ? colorMode === 'dark' || (colorMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    : false;

  // Memoize theme tokens
  const qmsTheme = useMemo(() => getQmsTheme(colorType, isDark), [colorType, isDark]);

  // Count-up: chỉ áp dụng khi value là số nguyên
  const isNumeric = typeof value === 'number' && !noCountUp && Number.isInteger(value);
  const animatedCount = useCountUp(isNumeric ? (value as number) : 0, 900, isMounted && isNumeric && progressVisible);
  const displayValue = isNumeric ? animatedCount : value;

  const isClickable = Boolean(onClick || href);
  const isCompact = size === 'compact';

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon as React.ElementType;
      return <IconComponent size={isCompact ? 14 : 16} aria-hidden="true" />;
    }
    return null;
  };

  // ─── Skeleton loading state ────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        className={`relative flex flex-col justify-between rounded-2xl overflow-hidden ${className}`}
        style={{
          padding: isCompact ? '12px 14px' : '14px 16px',
          minHeight: isCompact ? 110 : 132,
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          backgroundColor: isDark ? '#111827' : '#ffffff',
        }}
      >
        <style>{`@keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
        <div className="flex items-center justify-between mb-3">
          <SkeletonLine w="30px" h="30px" className="rounded-lg" />
          <SkeletonLine w="55px" h="18px" />
        </div>
        <SkeletonLine w="65%" h="28px" className="mb-2" />
        <SkeletonLine w="40%" h="10px" className="mb-3" />
        <SkeletonLine w="100%" h="4px" className="rounded-full" />
      </div>
    );
  }

  const cardContent = (
    <div
      ref={cardRef}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `${title}: ${value}${unit ? ' ' + unit : ''}` : undefined}
      onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      className={`kpi-card-root group relative flex flex-col justify-between select-none overflow-hidden ${
        isClickable ? 'cursor-pointer' : 'cursor-default'
      } ${className}`}
      style={{
        padding: isCompact ? '12px 14px' : '14px 16px',
        height: '100%',
        minHeight: isCompact ? 110 : 132,
        borderRadius: '16px',
        border: active || isHovered
          ? `1.5px solid ${qmsTheme.borderHover}`
          : `1.5px solid ${qmsTheme.border}`,
        backgroundColor: isHovered ? qmsTheme.cardBgHover : qmsTheme.cardBg,
        backgroundImage: isHovered ? qmsTheme.cornerGlowHover : qmsTheme.cornerGlow,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top right',
        backgroundSize: '100% 100%',
        boxShadow: isHovered
          ? (isDark
              ? `0 12px 28px -4px ${qmsTheme.accent}35, 0 4px 10px -2px ${qmsTheme.accent}20`
              : `0 12px 28px -4px ${qmsTheme.accent}30, 0 4px 10px -2px ${qmsTheme.accent}15`)
          : (isDark
              ? '0 4px 12px -2px rgba(0, 0, 0, 0.5)'
              : '0 2px 8px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)'),
        transform: isHovered && isClickable ? 'translateY(-3px)' : 'none',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── TOP ROW: Icon + Title on Left, Badge on Right ── */}
      <div className="flex items-center justify-between gap-2 mb-1.5 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <div
              className="kpi-icon-box shrink-0"
              style={{
                width: isCompact ? 26 : 30,
                height: isCompact ? 26 : 30,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isHovered ? qmsTheme.iconBgHover : qmsTheme.iconBg,
                color: qmsTheme.accent,
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.08) rotate(-4deg)' : 'scale(1) rotate(0deg)',
              }}
            >
              {renderIcon()}
            </div>
          )}
          <span
            className="truncate font-extrabold uppercase tracking-wide select-none"
            style={{
              color: isDark ? '#cbd5e1' : '#334155',
              fontWeight: 800,
              fontSize: isCompact ? '0.65rem' : '0.72rem',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </span>
        </div>

        {badgeText && (
          <span
            style={{
              backgroundColor: qmsTheme.badgeBg,
              color: qmsTheme.badgeText,
              border: `1px solid ${qmsTheme.badgeBorder}`,
              padding: '2px 7px',
              borderRadius: '8px',
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.3px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {badgeText}
          </span>
        )}
      </div>

      {/* ── MIDDLE ROW: Main Metric Value + Unit + Trend ── */}
      <div className="my-1 relative z-10 flex-1 flex flex-col justify-center">
        <div className="flex items-baseline gap-1.5 flex-nowrap overflow-hidden">
          <span
            style={{
              color: valueColor || (isDark ? '#f8fafc' : '#0f172a'),
              fontWeight: 800,
              lineHeight: 1.1,
              fontSize:
                String(value).length > 8
                  ? '1.15rem'
                  : String(value).length > 5
                  ? '1.28rem'
                  : isCompact
                  ? '1.3rem'
                  : '1.45rem',
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              transform: isMounted ? 'scale(1)' : 'scale(0.92)',
              opacity: isMounted ? 1 : 0,
              transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
            }}
          >
            {displayValue}
          </span>
          {unit && (
            <span
              style={{
                color: isDark ? '#94a3b8' : '#64748b',
                fontSize: isCompact ? '0.6rem' : '0.66rem',
                fontWeight: 800,
                letterSpacing: '0.3px',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {unit}
            </span>
          )}
        </div>

        {/* Trend Indicator */}
        {trend && (
          <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold">
            {trend.isPositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-500" aria-hidden="true" />
            )}
            <span className={trend.isPositive ? 'text-emerald-500' : 'text-rose-500'}>
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-slate-400 text-[10px]">{trend.label}</span>
            )}
          </div>
        )}

        {/* ── Progress Bar ── */}
        {progressPercent !== undefined && (
          <div className="mt-2">
            <div className="flex justify-between text-[10px] mb-1 font-semibold">
              <span style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.68rem', fontWeight: 600 }}>
                {progressLabel ?? 'Tiến độ / Mục tiêu'}
              </span>
              <span style={{ color: qmsTheme.accent, fontWeight: 700, fontSize: '0.68rem' }}>
                {progressPercent}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${title}: ${progressPercent}%`}
              style={{
                height: 4,
                borderRadius: 2,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                overflow: 'hidden',
                width: '100%',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: progressVisible
                    ? `${Math.min(Math.max(progressPercent, 0), 100)}%`
                    : '0%',
                  background: qmsTheme.progressBar,
                  borderRadius: 2,
                  transition: progressVisible
                    ? 'width 0.85s cubic-bezier(0.4, 0, 0.2, 1)'
                    : 'none',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM ROW: Divider & Footer Subtitle + Arrow ── */}
      <div className="mt-auto pt-1.5 relative z-10">
        <div
          style={{
            marginBottom: 6,
            height: '1px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          }}
        />
        <div className="flex items-center justify-between">
          <span
            style={{
              color: subColor || (isDark ? '#94a3b8' : '#64748b'),
              fontSize: isCompact ? '0.65rem' : '0.72rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: isClickable ? '85%' : '100%',
            }}
          >
            {subtitle || 'Thông tin tổng hợp'}
          </span>

          {isClickable && (
            <span
              aria-hidden="true"
              style={{
                color: isHovered ? qmsTheme.accent : (isDark ? '#64748b' : '#94a3b8'),
                fontWeight: 800,
                fontSize: '0.8rem',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'translateX(3px)' : 'none',
              }}
            >
              →
            </span>
          )}
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block no-underline h-full">
        {cardContent}
      </Link>
    );
  }

  return cardContent;
};

export default KpiGradientCard;
