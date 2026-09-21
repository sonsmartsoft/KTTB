import React, { InputHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  className,
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-content-primary">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3 text-content-muted pointer-events-none">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={twMerge(
            clsx(
              'w-full bg-app-surface border border-app-border rounded-theme-md text-sm text-content-primary placeholder:text-content-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent py-2 px-3',
              icon ? 'pl-9' : 'pl-3',
              error ? 'border-rose-400 focus:ring-rose-400' : 'border-app-border',
              className
            )
          )}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-content-muted">{helperText}</p>
      ) : null}
    </div>
  );
};
