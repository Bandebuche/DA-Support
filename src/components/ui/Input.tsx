import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, label, id, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={id}
            type={type}
            ref={ref}
            className={cn(
              'w-full px-3.5 py-2.5 rounded-xl text-sm bg-surface-elevated text-text-pure',
              'border border-surface-border placeholder:text-text-faint',
              'transition-all duration-200',
              'focus:bg-surface focus:border-nexus-electric/60 focus:shadow-nexus-sm focus:outline-none',
              error && 'border-white/40 focus:border-white/60',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-nexus-electric font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
