import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'flat' | 'gradient';
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = 'default',
  className,
  children,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-app-card border border-app-border rounded-theme-card shadow-theme-sm',
    elevated: 'bg-app-card border border-app-subtle rounded-theme-card shadow-theme-md hover:shadow-theme-lg transition-shadow',
    bordered: 'bg-app-card border-2 border-app-border rounded-theme-card',
    flat: 'bg-app-surface/60 rounded-theme-card',
    gradient: 'bg-gradient-to-br from-white to-orange-50/50 border border-orange-100 rounded-theme-card shadow-theme-sm',
  };

  return (
    <div
      className={twMerge(clsx('transition-all duration-200', variantStyles[variant], className))}
      {...props}
    >
      {children}
    </div>
  );
};
