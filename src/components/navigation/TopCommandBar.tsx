import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Kanban, 
  LayoutGrid, 
  Table, 
  Clock, 
  SlidersHorizontal,
  Menu,
  Bell,
  User,
  ShieldCheck
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
  ticketCount?: number;
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
  ticketCount,
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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-6 sm:px-8 py-4 select-none transition-colors">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Left: Section Title & Count Subtitle (Matching Reference Screenshot) */}
        <div className="flex items-center gap-3">
          {/* Hamburger for Mobile (< md) */}
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden transition shrink-0"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-blue-600" />
            </button>
          )}

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {ticketCount !== undefined ? `${ticketCount} tickets found` : 'Live Operations Queue'}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, View Switcher, Notification, Theme, User Chip */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Search Input Bar (Sleek rounded input) */}
          <div className="relative min-w-[220px] sm:min-w-[280px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search ticket, name, phone..."
              className={cn(
                'w-full pl-10 pr-16 py-2 rounded-2xl text-xs sm:text-sm font-medium',
                'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white',
                'border border-slate-200 dark:border-slate-700 placeholder:text-slate-400',
                'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition'
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-slate-400 shadow-2xs">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onViewModeChange('table')}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold',
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Table View (Reference Layout)"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold',
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
            <button
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold',
                viewMode === 'kanban'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Board Pipeline View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Board</span>
            </button>
          </div>

          {/* IST Clock Pill */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{istTime}</span>
            <span className="text-[10px] text-slate-400 font-normal">IST</span>
          </div>

          {/* Sync Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50"
            title="Sync with Sheets & Database"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
          </button>

          {/* Cloud Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition"
            title="Google Sheets / Cloud Config"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notification Bell (from screenshot) */}
          <div className="relative">
            <button
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
          </div>

          {/* Admin User Profile Avatar Chip (from screenshot) */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-md ring-2 ring-blue-500/20">
              AD
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                Admin Lead
              </span>
              <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
                Super Admin
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
