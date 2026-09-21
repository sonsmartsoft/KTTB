import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  className,
  children,
  ...props
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full font-semibold gap-1',
    md: 'text-xs px-2.5 py-1 rounded-full font-bold gap-1.5',
  };

  const variantStyles = {
    primary: 'bg-primary-light text-primary border border-primary/20',
    secondary: 'bg-secondary-light text-secondary-hover border border-secondary/20',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    outline: 'bg-transparent text-content-secondary border border-app-border',
  };

  return (
    <span
      className={twMerge(clsx('inline-flex items-center justify-center shrink-0 leading-none transition-colors', sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
};
