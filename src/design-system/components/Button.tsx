import React, { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  icon,
  className,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none';
  
  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-theme-sm gap-1.5',
    md: 'text-sm px-4 py-2 rounded-theme-md gap-2',
    lg: 'text-base px-5 py-2.5 rounded-theme-lg gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-theme-sm hover:shadow-theme-md focus:ring-primary',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover shadow-theme-sm hover:shadow-theme-md focus:ring-secondary',
    accent: 'bg-accent text-white hover:opacity-90 shadow-theme-sm focus:ring-accent',
    outline: 'border border-app-border bg-app-surface text-content-primary hover:bg-app-bg focus:ring-primary',
    ghost: 'text-content-primary hover:bg-black/5 dark:hover:bg-white/5 focus:ring-primary',
    soft: 'bg-primary-light text-primary hover:bg-primary/20 focus:ring-primary',
  };

  return (
    <button
      className={twMerge(clsx(baseStyles, sizeStyles[size], variantStyles[variant], className))}
      {...props}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
};
