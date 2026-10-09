import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Kanban, 
  LayoutGrid, 
  Table, 
  Clock, 
  SlidersHorizontal,
  Menu
} from 'lucide-react';
import { getCurrentISTClockString } from '../../lib/timezone';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { BrandLogo } from '../common/BrandLogo';

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
  onOpenMobileNav?: () => void;
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
  onOpenMobileNav,
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

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-border px-3 sm:px-6 py-2.5 sm:py-3 transition-colors select-none">
      <div className="flex flex-col gap-2.5 max-w-7xl mx-auto">
        
        {/* Top Row: Hamburger / Brand (mobile), Section Title & Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Mobile Hamburger & Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger Button for Mobile (< md) */}
            {onOpenMobileNav && (
              <button
                onClick={onOpenMobileNav}
                className="p-2 -ml-1 rounded-xl text-text-soft hover:text-text-pure hover:bg-surface-elevated border border-transparent hover:border-surface-border md:hidden transition shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </button>
            )}

            {/* Mobile Logo (< sm) */}
            <div className="sm:hidden shrink-0">
              <BrandLogo size="sm" showBadge={false} />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-text-pure tracking-tight truncate">
                {title}
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-text-muted">
                <span className="flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{istTime}</span>
                </span>
                <span className="hidden xs:inline">•</span>
                <span className="hidden xs:inline text-text-muted">IST Cloud</span>
              </div>
            </div>
          </div>

          {/* Right Actions: View Switcher, Sync, Settings, Theme Toggle */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            
            {/* View Mode Switcher */}
            <div className="flex items-center p-0.5 sm:p-1 rounded-xl bg-surface-elevated border border-surface-border">
              <button
                onClick={() => onViewModeChange('kanban')}
                className={cn(
                  'p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
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
                  'p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
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
                  'p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-xs transition flex items-center gap-1.5 font-medium',
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
              className="p-1.5 sm:p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition disabled:opacity-50"
              title="Sync with Database & Sheets"
            >
              <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-indigo-600 dark:text-indigo-400')} />
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettings}
              className="p-1.5 sm:p-2 rounded-xl bg-surface-elevated hover:bg-surface-hover border border-surface-border text-text-soft hover:text-text-pure transition"
              title="Cloud Backend Settings"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </button>

            {/* Theme Switcher */}
            <ThemeToggle />
          </div>

        </div>

        {/* Bottom Row / Full-width Search Input */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search Ticket ID (DA-2026-XXXX), Phone, Name, Subject..."
            className={cn(
              'w-full pl-9 pr-20 py-2 rounded-xl text-xs bg-surface-elevated text-text-pure',
              'border border-surface-border placeholder:text-text-faint',
              'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition'
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-medium bg-surface border border-surface-border rounded text-text-muted shadow-sm">
              ⌘K or /
            </kbd>
          </div>
        </div>

      </div>
    </header>
  );
};
