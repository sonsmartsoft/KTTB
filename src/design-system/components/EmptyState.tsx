import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-app-card/60 border border-dashed border-app-border rounded-theme-card my-4">
      {icon ? (
        <div className="mb-4 text-primary p-3 bg-primary-light rounded-full">
          {icon}
        </div>
      ) : (
        <div className="text-4xl mb-3">🎒</div>
      )}
      <h3 className="text-base font-bold text-content-primary mb-1">{title}</h3>
      <p className="text-sm text-content-muted max-w-sm mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
