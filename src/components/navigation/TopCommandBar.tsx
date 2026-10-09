import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, 
  RotateCw, 
  Kanban, 
  LayoutGrid, 
  Table, 
  Clock, 
  Cloud, 
  SlidersHorizontal,
  Zap,
  Activity,
  CheckCircle2
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
    <div className="sticky top-2 z-40 px-4 md:px-6">
      <header className="glass-floating rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4 border border-surface-borderLight/20 shadow-2xl">
        
        {/* Left: Branded Hologram Logo + Live IST Digital HUD */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-surface-obsidian border border-neon-violet/50 flex items-center justify-center shadow-nexus-sm">
              <Activity className="w-4 h-4 text-neon-electric" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-black font-mono tracking-wider uppercase text-text-pure block">
                COMMAND HUD
              </span>
              <div className="flex items-center gap-1.5 text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-emerald-400 font-bold">{istTime} IST</span>
                <span className="text-text-faint">• Cloud: Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Quick Search Bar with Keyboard Shortcut Badge */}
        <div className="relative flex-1 max-w-lg mx-auto">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search Ticket ID (NEXUS-2026-XXXX), Phone, Name..."
            className={cn(
              'w-full pl-9 pr-24 py-2 rounded-xl text-xs bg-surface-obsidian text-text-pure',
              'border border-surface-border placeholder:text-text-faint',
              'focus:border-neon-electric focus:shadow-nexus-sm focus:outline-none transition'
            )}
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-void border border-surface-border rounded text-text-muted">
              Press ⌘K or /
            </kbd>
          </div>
        </div>

        {/* Right: Live Mode Switcher (Kanban vs Grid vs Table) + Sync Button */}
        <div className="flex items-center gap-2.5 shrink-0">
          
          {/* View Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-surface-obsidian border border-surface-border">
            <button
              onClick={() => onViewModeChange('kanban')}
              className={cn(
                'p-1.5 rounded-lg text-xs transition flex items-center gap-1 font-mono',
                viewMode === 'kanban'
                  ? 'bg-violet-600 text-white shadow-nexus-sm'
                  : 'text-text-muted hover:text-white'
              )}
              title="Kanban Board View"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden xl:inline">Kanban</span>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={cn(
                'p-1.5 rounded-lg text-xs transition flex items-center gap-1 font-mono',
                viewMode === 'cards'
                  ? 'bg-violet-600 text-white shadow-nexus-sm'
                  : 'text-text-muted hover:text-white'
              )}
              title="Modular Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden xl:inline">Cards</span>
            </button>
            <button
              onClick={() => onViewModeChange('table')}
              className={cn(
                'p-1.5 rounded-lg text-xs transition flex items-center gap-1 font-mono',
                viewMode === 'table'
                  ? 'bg-violet-600 text-white shadow-nexus-sm'
                  : 'text-text-muted hover:text-white'
              )}
              title="Dense Table View"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="text-[10px] hidden xl:inline">Table</span>
            </button>
          </div>

          {/* Sync Button with pulse dot */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-surface-obsidian hover:bg-surface-cosmic border border-surface-border text-text-muted hover:text-white transition disabled:opacity-50 relative"
            title="Sync with Database & Sheets"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-neon-electric')} />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </button>

          {/* Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-surface-obsidian hover:bg-surface-cosmic border border-surface-border text-text-muted hover:text-white transition"
            title="Cloud Backend Settings"
          >
            <SlidersHorizontal className="w-4 h-4 text-neon-electric" />
          </button>

          {/* Theme Switcher */}
          <ThemeToggle />
        </div>

      </header>
    </div>
  );
};
