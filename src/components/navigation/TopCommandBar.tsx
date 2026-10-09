import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Kanban, 
  LayoutGrid, 
  Table, 
  Clock, 
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { getCurrentISTClockString } from '../../lib/timezone';
import { isLiveSheetsConnected } from '../../services/sheetsSync';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';

export type ViewMode = 'kanban' | 'cards' | 'table';

interface TopCommandBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (m: ViewMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenSettings: () => void;
  title: string;
}

export const TopCommandBar: React.FC<TopCommandBarProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  onRefresh,
  isRefreshing,
  onOpenSettings,
  title,
}) => {
  const [istTime, setIstTime] = useState(getCurrentISTClockString());
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Live IST Clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getCurrentISTClockString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcut: Ctrl + K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isSheetsLive = isLiveSheetsConnected();

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-border px-4 md:px-6 py-3">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        
        {/* Left: Section Title + Live IST Status */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <h1 className="text-base font-bold text-text-pure tracking-tight">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs text-text-muted mt-0.5">
              <span className="flex items-center gap-1.5 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{istTime} IST</span>
              </span>
              <span>•</span>
              <span className="text-text-muted">Cloud Sync: Active</span>
            </div>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="relative w-full sm:max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search Ticket ID (DA-2026-XXXX), Phone, Name..."
            className={cn(
              'w-full pl-9 pr-24 py-2 rounded-xl text-xs bg-surface-elevated text-text-pure',
              'border border-surface-border placeholder:text-text-faint',
              'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition'
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-surface border border-surface-border rounded text-text-muted shadow-sm">
              ⌘K or /
            </kbd>
          </div>
        </div>

        {/* Right: View Switcher, Sync, Settings & Theme Toggle */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-surface-elevated border border-surface-border">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
                viewMode === 'kanban'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-text-soft hover:text-text-pure hover:bg-surface'
              )}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="text-xs hidden xl:inline">Kanban</span>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
                viewMode === 'cards'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-text-soft hover:text-text-pure hover:bg-surface'
              )}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-xs hidden xl:inline">Cards</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-text-soft hover:text-text-pure hover:bg-surface'
              )}
              title="Table View"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="text-xs hidden xl:inline">Table</span>
            </button>
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition disabled:opacity-50 relative"
            title="Sync with Database & Sheets"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-indigo-600 dark:text-indigo-400')} />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition"
            title="Cloud Backend Settings"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>

      </div>
    </header>
  );
};
