import React from 'react';
import { cn } from '../../lib/utils';
import { TicketStatus, TicketPriority } from '../../types/ticket';
import { CheckCircle2, Clock, AlertTriangle, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: TicketStatus;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className, showDot = true }) => {
  const getStyles = () => {
    switch (status) {
      case 'In Progress':
        return {
          wrapper: 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-[0_0_15px_-2px_rgba(245,158,11,0.3)]',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'New':
        return {
          wrapper: 'bg-violet-500/15 text-violet-300 border-violet-500/40 shadow-[0_0_15px_-2px_rgba(139,92,246,0.25)]',
          dot: 'bg-violet-400',
        };
      case 'Waiting for User':
        return {
          wrapper: 'bg-slate-800/60 text-slate-300 border-slate-700/60',
          dot: 'bg-slate-400',
        };
      case 'Resolved':
        return {
          wrapper: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_-2px_rgba(16,185,129,0.3)]',
          dot: 'bg-emerald-400',
        };
    }
  };

  const { wrapper, dot } = getStyles();

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide border font-mono uppercase backdrop-blur-md',
        wrapper,
        className
      )}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />}
      <span>{status}</span>
    </span>
  );
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className }) => {
  const getStyles = () => {
    switch (priority) {
      case 'Urgent':
        return 'text-[#FF5500] bg-[#FF5500]/15 border-[#FF5500]/40 shadow-[0_0_15px_-2px_rgba(255,85,0,0.3)]';
      case 'High':
        return 'text-violet-300 bg-violet-500/20 border-violet-500/40';
      case 'Normal':
        return 'text-slate-300 bg-slate-800/60 border-slate-700/60';
      case 'Low':
        return 'text-slate-400 bg-slate-800/40 border-slate-800/60';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono uppercase tracking-wider border font-bold backdrop-blur-md',
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
    return <StatusBadge status={value as TicketStatus} className={className} />;
  }
  return <PriorityBadge priority={value as TicketPriority} className={className} />;
};
