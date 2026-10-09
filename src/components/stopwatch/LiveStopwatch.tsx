import React, { useEffect, useState } from 'react';
import { Timer, CheckCircle, Clock } from 'lucide-react';
import { computeElapsedSeconds, formatStopwatchTime } from '../../lib/stopwatch';
import { cn } from '../../lib/utils';
import { TicketStatus } from '../../types/ticket';

interface LiveStopwatchProps {
  startedAtUtc?: string;
  endedAtUtc?: string;
  status?: TicketStatus;
  fallbackSeconds?: number;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'compact' | 'standard';
}

export const LiveStopwatch: React.FC<LiveStopwatchProps> = ({
  startedAtUtc,
  endedAtUtc,
  status = 'In Progress',
  fallbackSeconds = 0,
  className,
  showIcon = true,
  size = 'md',
  variant = 'standard',
}) => {
  const [elapsed, setElapsed] = useState<number>(() => {
    if (status === 'Resolved') {
      return fallbackSeconds > 0
        ? fallbackSeconds
        : computeElapsedSeconds(startedAtUtc, endedAtUtc);
    }
    return computeElapsedSeconds(startedAtUtc);
  });

  const isRunning = status === 'In Progress' && Boolean(startedAtUtc) && !endedAtUtc;

  useEffect(() => {
    if (!isRunning) {
      if (status === 'Resolved') {
        setElapsed(fallbackSeconds > 0 ? fallbackSeconds : computeElapsedSeconds(startedAtUtc, endedAtUtc));
      }
      return;
    }

    setElapsed(computeElapsedSeconds(startedAtUtc));

    const timer = setInterval(() => {
      setElapsed(computeElapsedSeconds(startedAtUtc));
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, startedAtUtc, endedAtUtc, status, fallbackSeconds]);

  // When Resolved
  if (status === 'Resolved') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono text-xs font-semibold tracking-wider backdrop-blur-md',
          'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_-2px_rgba(16,185,129,0.3)]',
          className
        )}
      >
        {showIcon && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
        <span className="tracking-widest">{formatStopwatchTime(elapsed)}</span>
      </span>
    );
  }

  // When actively running (counting up second-by-second)
  if (isRunning) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono text-xs font-bold tracking-widest backdrop-blur-md',
          'bg-amber-500/15 border border-amber-500/50 text-amber-300 shadow-[0_0_20px_-2px_rgba(245,158,11,0.4)]',
          className
        )}
      >
        {showIcon && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 shadow-[0_0_8px_#F59E0B]"></span>
          </span>
        )}
        <span className="font-mono text-sm tracking-widest text-amber-200">{formatStopwatchTime(elapsed)}</span>
      </span>
    );
  }

  // Not started or Waiting
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg font-mono text-xs text-text-faint bg-white/5 border border-white/5',
        className
      )}
    >
      {showIcon && <Clock className="w-3 h-3 text-text-faint" />}
      <span className="tracking-widest">--:--:--</span>
    </span>
  );
};
