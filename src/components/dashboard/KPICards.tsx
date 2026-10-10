import React, { useMemo } from 'react';
import { Ticket } from '../../types/ticket';
import { isTodayInIST } from '../../lib/timezone';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '../../lib/utils';

interface KPICardsProps {
  tickets: Ticket[];
}

export const KPICards: React.FC<KPICardsProps> = ({ tickets }) => {
  const totalCount = tickets.length;

  // Status distributions
  const openCount = tickets.filter(t => t.status === 'In Progress').length;
  const pendingCount = tickets.filter(t => t.status === 'New' || t.status === 'Waiting for User').length;
  const closedCount = tickets.filter(t => t.status === 'Resolved').length;

  const openPct = totalCount > 0 ? Math.round((openCount / totalCount) * 100) : 0;
  const pendingPct = totalCount > 0 ? Math.round((pendingCount / totalCount) * 100) : 0;
  const closedPct = totalCount > 0 ? Math.round((closedCount / totalCount) * 100) : 0;

  // 35 simulated daily timeline bars across October, November, December
  const timelineBars = useMemo(() => {
    // Generate deterministic bar heights based on ticket count
    const seedHeights = [
      18, 26, 45, 32, 22, 60, 38, 52, 70, 40,
      30, 85, 48, 62, 78, 95, 55, 42, 68, 50,
      34, 72, 88, 64, 45, 38, 58, 80, 48, 36,
      65, 82, 54, 40, 60
    ];

    return seedHeights.map((h, i) => {
      // Adjust with actual ticket volume
      const scaled = Math.min(100, Math.max(15, Math.round(h * (totalCount > 0 ? Math.max(0.6, totalCount / 5) : 0.5))));
      const hasDot = i % 4 === 0 || i === 15 || i === 22;
      return {
        height: scaled,
        hasDot,
        day: (i % 30) + 1,
      };
    });
  }, [totalCount]);

  return (
    <div className="bg-surface border border-surface-border rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Header & Subtitle */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-text-pure tracking-tight">
          Quick Statistics
        </h2>
        <p className="text-xs sm:text-sm text-text-muted mt-0.5">
          List of tickets opened by Customer across support lifecycle
        </p>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-1">
        
        {/* Total Tickets */}
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-500 tracking-tight font-mono">
            {totalCount}
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1">
            Total No. of tickets
          </span>
        </div>

        {/* In Progress / Active % */}
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-500 tracking-tight font-mono">
            {openPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Active In Progress ({openCount})
          </span>
        </div>

        {/* Pending / Private % */}
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 tracking-tight font-mono">
            {pendingPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending & New ({pendingCount})
          </span>
        </div>

        {/* Closed / Resolved % */}
        <div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 tracking-tight font-mono">
            {closedPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Resolved & Closed ({closedCount})
          </span>
        </div>

      </div>

      {/* Timeline Histogram Chart */}
      <div className="pt-4 border-t border-surface-border">
        
        {/* Bar stalks */}
        <div className="h-28 sm:h-32 flex items-end justify-between gap-1 sm:gap-1.5 px-2">
          {timelineBars.map((bar, idx) => (
            <div 
              key={idx} 
              className="flex-1 flex flex-col items-center justify-end h-full group relative"
            >
              {/* Optional blue dot pin on top */}
              {bar.hasDot && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1 group-hover:scale-125 transition-transform" />
              )}
              {/* Bar stem */}
              <div 
                className="w-full max-w-[8px] bg-slate-200 dark:bg-slate-800 group-hover:bg-indigo-500 transition-colors rounded-t-sm"
                style={{ height: `${bar.height}%` }}
              />
            </div>
          ))}
        </div>

        {/* Timeline Axis Labels (October - November - December) */}
        <div className="flex items-center justify-between text-[11px] font-semibold text-text-muted uppercase tracking-wider pt-3 select-none">
          <div className="flex items-center gap-1 hover:text-text-pure transition cursor-pointer">
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>OCTOBER</span>
          </div>
          <div className="text-text-pure font-bold font-mono">
            NOVEMBER 2026 (IST)
          </div>
          <div className="flex items-center gap-1 hover:text-text-pure transition cursor-pointer">
            <span>DECEMBER</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

      </div>

    </div>
  );
};
