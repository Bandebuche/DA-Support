import React from 'react';
import { cn } from '../../lib/utils';
import { TicketStatus, TicketPriority } from '../../types/ticket';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
  showDot?: boolean;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showDot = true, size = 'md' }) => {
  const getStyles = () => {
    switch (status) {
      case 'In Progress':
        return {
          wrapper: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/40',
          dot: 'bg-amber-500 dark:bg-amber-400 animate-pulse',
        };
      case 'New':
        return {
          wrapper: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/40',
          dot: 'bg-indigo-600 dark:bg-indigo-400',
        };
      case 'Waiting for User':
        return {
          wrapper: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60',
          dot: 'bg-slate-500 dark:bg-slate-400',
        };
      case 'Resolved':
        return {
          wrapper: 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/40',
          dot: 'bg-emerald-600 dark:bg-emerald-400',
        };
    }
  };

  const { wrapper, dot } = getStyles();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium font-sans whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        wrapper,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />}
      <span>{status}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className, size = 'md' }) => {
  const getStyles = () => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-50 text-red-700 border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/40 font-semibold';
      case 'High':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/40 font-semibold';
      case 'Normal':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/60';
      case 'Low':
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800/60';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border font-sans whitespace-nowrap',
        size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-xs',
        getStyles(),
        className
      )}
    >
      {priority}
    </span>
  );
};

export interface BadgeProps {
  variant: 'status' | 'priority';
  value: TicketStatus | TicketPriority;
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant, value, size = 'md', className }) => {
  if (variant === 'status') {
    return <StatusBadge status={value as TicketStatus} size={size} className={className} />;
  }
  return <PriorityBadge priority={value as TicketPriority} size={size} className={className} />;
};
