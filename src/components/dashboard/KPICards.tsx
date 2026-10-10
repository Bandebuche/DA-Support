import React, { useMemo } from 'react';
import { Ticket } from '../../types/ticket';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  HelpCircle,
  Calendar,
  Activity,
  Sparkles
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

  // Real-time IST Date
  const istNow = useMemo(() => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  }, []);

  const currentYear = istNow.getFullYear();
  const currentMonth = istNow.getMonth(); // 0-indexed (9 for October)
  const currentDay = istNow.getDate(); // e.g. 10

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const currentMonthName = monthNames[currentMonth];

  // Number of days in current month (e.g. 31 for October)
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Map real tickets to exact days of the current month
  const dailyData = useMemo(() => {
    const counts = new Array(daysInCurrentMonth).fill(0);
    const inProgressCounts = new Array(daysInCurrentMonth).fill(0);
    const resolvedCounts = new Array(daysInCurrentMonth).fill(0);

    tickets.forEach(t => {
      if (!t.createdAt) return;
      try {
        const d = new Date(new Date(t.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
        if (d.getFullYear() === currentYear && d.getMonth() === currentMonth) {
          const dayIdx = d.getDate() - 1;
          if (dayIdx >= 0 && dayIdx < daysInCurrentMonth) {
            counts[dayIdx] += 1;
            if (t.status === 'In Progress') inProgressCounts[dayIdx] += 1;
            if (t.status === 'Resolved') resolvedCounts[dayIdx] += 1;
          }
        }
      } catch {}
    });

    const maxCount = Math.max(...counts, 1);

    return Array.from({ length: daysInCurrentMonth }, (_, i) => {
      const dayNum = i + 1;
      const count = counts[i];
      const isToday = dayNum === currentDay;
      const isFuture = dayNum > currentDay;

      let heightPct = 10;
      if (count > 0) {
        heightPct = Math.min(95, Math.max(25, Math.round((count / maxCount) * 85 + 10)));
      } else if (isToday) {
        heightPct = 18;
      }

      return {
        day: dayNum,
        count,
        inProgress: inProgressCounts[i],
        resolved: resolvedCounts[i],
        isToday,
        isFuture,
        heightPct,
      };
    });
  }, [tickets, currentYear, currentMonth, daysInCurrentMonth, currentDay]);

  const todayCount = dailyData[currentDay - 1]?.count || 0;

  return (
    <div className="bg-surface border border-surface-border rounded-3xl p-5 sm:p-8 shadow-sm space-y-6">
      
      {/* Header & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-pure tracking-tight flex items-center gap-2">
            <span>Quick Statistics</span>
            <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </h2>
          <p className="text-xs sm:text-sm text-text-muted mt-0.5">
            Real-time query volume and daily operations timeline across support lifecycle
          </p>
        </div>

        {/* Today's Intake Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>Today ({currentDay} {currentMonthName}):</span>
          <span className="font-mono text-sm">{todayCount} tickets</span>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 pt-1">
        
        {/* Total Tickets */}
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-500 tracking-tight font-mono">
            {totalCount}
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1">
            Total Tickets Logged
          </span>
        </div>

        {/* In Progress / Active % */}
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-500 tracking-tight font-mono">
            {openPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            Active In Progress ({openCount})
          </span>
        </div>

        {/* Pending / Private % */}
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 tracking-tight font-mono">
            {pendingPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Pending & New ({pendingCount})
          </span>
        </div>

        {/* Closed / Resolved % */}
        <div className="p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-500 tracking-tight font-mono">
            {closedPct}%
          </div>
          <span className="text-xs text-text-muted font-medium block mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Resolved & Closed ({closedCount})
          </span>
        </div>

      </div>

      {/* Dynamic Daily Intake Activity Histogram (Matching User Request) */}
      <div className="pt-5 border-t border-surface-border space-y-3">
        
        {/* Chart Title & Live IST Legend */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-extrabold text-text-pure uppercase tracking-wider text-[11px]">
              {currentMonthName} {currentYear} • Daily Activity Flow
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              <span className="font-semibold text-text-pure">Day {currentDay} (Today)</span>
            </span>
            <span className="hidden sm:inline text-slate-400">•</span>
            <span className="hidden sm:inline font-mono">Indian Standard Time (IST)</span>
          </div>
        </div>

        {/* Dynamic Histogram Bars Container (Full Responsive with Smooth Horizontal Scroll on Mobile) */}
        <div className="overflow-x-auto pb-2 -mx-2 sm:mx-0 px-2 sm:px-0">
          <div className="h-32 sm:h-36 min-w-[620px] flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2 px-1">
            {dailyData.map(dayItem => {
              const { day, count, isToday, isFuture, heightPct } = dayItem;

              return (
                <div 
                  key={day} 
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer select-none"
                >
                  {/* Floating Smooth Hover Tooltip */}
                  <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-30 scale-95 group-hover:scale-100 flex flex-col items-center">
                    <div className="px-2.5 py-1.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white text-[11px] font-bold shadow-xl border border-slate-700 whitespace-nowrap text-center">
                      <div className="flex items-center gap-1.5 justify-center">
                        <span>{day} {currentMonthName}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-[9px] font-mono">
                            TODAY
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-medium text-slate-300 mt-0.5">
                        {count > 0 ? `${count} ticket${count > 1 ? 's' : ''} received` : '0 tickets logged'}
                      </div>
                    </div>
                    {/* Tooltip Down Arrow */}
                    <div className="w-2 h-1 border-x-4 border-t-4 border-x-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
                  </div>

                  {/* Indicator Dot on Top of Bar */}
                  {isToday ? (
                    <span 
                      className={cn(
                        'rounded-full mb-1 shrink-0 transition-transform duration-200 group-hover:scale-125',
                        count > 0 
                          ? 'w-2.5 h-2.5 bg-blue-600 dark:bg-blue-400 ring-4 ring-blue-500/25 animate-pulse shadow-md shadow-blue-500/30'
                          : 'w-2 h-2 bg-blue-500 ring-2 ring-blue-500/20'
                      )} 
                    />
                  ) : count > 0 ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-1 group-hover:scale-125 transition-transform shrink-0" />
                  ) : (
                    <span className="w-1.5 h-1.5 mb-1 shrink-0 opacity-0" />
                  )}

                  {/* Vertical Bar Stalk */}
                  <div 
                    className={cn(
                      'w-full max-w-[10px] rounded-t-sm transition-all duration-300',
                      isToday
                        ? 'bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-500 shadow-sm shadow-blue-500/30 ring-1 ring-blue-400'
                        : count > 0
                        ? 'bg-slate-300 dark:bg-slate-700 group-hover:bg-blue-500 dark:group-hover:bg-blue-400'
                        : isFuture
                        ? 'bg-slate-100 dark:bg-slate-800/40'
                        : 'bg-slate-200/80 dark:bg-slate-800/70 group-hover:bg-slate-300 dark:group-hover:bg-slate-700'
                    )}
                    style={{ height: `${heightPct}%` }}
                  />

                  {/* Day Label at Bottom */}
                  <span 
                    className={cn(
                      'text-[9px] font-mono mt-1 transition-colors select-none block',
                      isToday
                        ? 'font-extrabold text-blue-600 dark:text-blue-400 scale-110'
                        : day % 5 === 0 || day === 1 || day === daysInCurrentMonth
                        ? 'text-slate-400 font-semibold'
                        : 'text-slate-300 dark:text-slate-600 hidden md:block'
                    )}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline Bottom Summary Banner */}
        <div className="flex flex-wrap items-center justify-between text-[11px] font-semibold text-text-muted pt-2 border-t border-surface-border select-none">
          <div className="flex items-center gap-1.5 text-text-pure">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>1st {currentMonthName}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
              TODAY: {currentDay} {currentMonthName} ({todayCount} tickets)
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-text-pure">
            <span>{daysInCurrentMonth}th {currentMonthName}</span>
            <span className="w-2 h-2 rounded-full bg-slate-400" />
          </div>
        </div>

      </div>

    </div>
  );
};
