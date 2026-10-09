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
              'transition-colors duration-150',
              'focus:bg-surface focus:border-indigo-500 focus:outline-none',
              error && 'border-red-400 focus:border-red-500',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
