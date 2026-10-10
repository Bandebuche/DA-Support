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
  Volume2,
  VolumeX,
  Play,
  CheckCircle,
  X,
  Sparkles
} from 'lucide-react';
import { getCurrentISTClockString } from '../../lib/timezone';
import { cn } from '../../lib/utils';
import { ThemeToggle } from '../common/ThemeToggle';
import { BrandLogo } from '../common/BrandLogo';
import { AdminUserSession } from '../../lib/storage';
import { audioNotification } from '../../lib/audioNotification';

export type ViewMode = 'kanban' | 'cards' | 'table';

export interface TicketAlertItem {
  id: string;
  ticketId: string;
  title: string;
  requesterName: string;
  time: string;
}

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
  currentUser?: AdminUserSession | null;
  notifications?: TicketAlertItem[];
  onClearNotifications?: () => void;
  onSelectAlertTicket?: (ticketId: string) => void;
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
  currentUser,
  notifications = [],
  onClearNotifications,
  onSelectAlertTicket,
}) => {
  const [istTime, setIstTime] = useState(getCurrentISTClockString());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => audioNotification.isSoundMuted());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Live IST Clock ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setIstTime(getCurrentISTClockString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

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

  const handleToggleMute = () => {
    const nextMuted = audioNotification.toggleMute();
    setIsMuted(nextMuted);
    if (!nextMuted) {
      audioNotification.playNewTicketChime();
    }
  };

  const handleTestChime = () => {
    audioNotification.unlockAudio();
    audioNotification.playNewTicketChime();
  };

  const isMetaLead = currentUser?.role === 'meta_lead';
  const displayName = currentUser?.name || (isMetaLead ? 'Onkar Kulkarni' : 'Sachin Sir');
  const displayTitle = currentUser?.title || (isMetaLead ? 'Meta Specialist Lead' : 'Super Admin');
  const avatarInitials = currentUser?.avatar || (isMetaLead ? 'OK' : 'SS');

  return (
    <header className="sticky top-0 z-30 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800/80 px-4 sm:px-8 py-3.5 select-none transition-colors rounded-t-2xl sm:rounded-t-3xl md:rounded-tl-none md:rounded-tr-2xl lg:rounded-tr-[32px]">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
        
        {/* Left: Section Title & Count Subtitle */}
        <div className="flex items-center gap-3">
          {/* Hamburger for Mobile (< md) */}
          {onOpenMobileNav && (
            <button
              onClick={onOpenMobileNav}
              className="p-2 -ml-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white md:hidden transition shrink-0 cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-blue-600" />
            </button>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {title}
              </h1>
              {isMetaLead && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                  META DESK
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {ticketCount !== undefined ? `${ticketCount} tickets found` : 'Live Operations Queue'}
            </p>
          </div>
        </div>

        {/* Right Controls: Search, View Switcher, Notification, Theme, User Chip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Search Input Bar (Sleek rounded input) */}
          <div className="relative flex-1 sm:flex-initial min-w-[170px] sm:min-w-[280px]">
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
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold cursor-pointer',
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
              title="Table View"
            >
              <Table className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => onViewModeChange('cards')}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold cursor-pointer',
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
                'px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 font-bold cursor-pointer',
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
            className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition disabled:opacity-50 cursor-pointer"
            title="Sync with Sheets & Database"
          >
            <RotateCw className={cn('w-4 h-4', isRefreshing && 'animate-spin text-blue-600')} />
          </button>

          {/* Cloud Settings */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Google Sheets / Cloud Config"
          >
            <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Interactive Notification Bell Popover */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={cn(
                'p-2 rounded-2xl border transition relative cursor-pointer',
                isNotifOpen
                  ? 'bg-blue-50 dark:bg-slate-800 border-blue-400 text-blue-600 dark:text-blue-400'
                  : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              )}
              title="Notifications & Audio Alert Control"
            >
              <Bell className="w-4 h-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-4 z-50 space-y-3 animate-in zoom-in-95 duration-150">
                {/* Popover Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                      Live Query Notifications
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      className={cn(
                        'p-1.5 rounded-xl border text-xs flex items-center gap-1 transition',
                        isMuted 
                          ? 'bg-red-50 dark:bg-red-950/40 text-red-600 border-red-200' 
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-200'
                      )}
                      title={isMuted ? 'Unmute notification sound' : 'Mute notification sound'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      type="button"
                      onClick={handleTestChime}
                      className="px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[10px] font-bold transition flex items-center gap-1"
                      title="Play test audio chime"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" />
                      Test
                    </button>
                  </div>
                </div>

                {/* Audio Status Banner */}
                <div className="p-2.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-[11px] text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <span>
                    🔊 Audio alerts: <strong className="font-bold">{isMuted ? 'Muted' : 'Active (Chime on submit)'}</strong>
                  </span>
                  {notifications.length > 0 && onClearNotifications && (
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Notifications List */}
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 space-y-1">
                      <CheckCircle className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">
                        All caught up!
                      </p>
                      <p className="text-[11px]">
                        Audio alerts will chime automatically when any new ticket arrives.
                      </p>
                    </div>
                  ) : (
                    notifications.map(item => (
                      <div
                        key={item.id}
                        onClick={() => {
                          onSelectAlertTicket?.(item.ticketId);
                          setIsNotifOpen(false);
                        }}
                        className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 transition cursor-pointer text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {item.ticketId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.time}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          From: {item.requesterName}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Admin User Profile Avatar Chip (Dynamic for Sachin Sir vs Onkar Kulkarni) */}
          <div className="flex items-center gap-2 pl-1 sm:pl-2 border-l border-slate-200 dark:border-slate-700">
            <div className={cn(
              'w-9 h-9 rounded-full text-white font-extrabold text-xs flex items-center justify-center shadow-md ring-2',
              isMetaLead 
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 ring-indigo-500/20' 
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600 ring-blue-500/20'
            )}>
              {avatarInitials}
            </div>
            <div className="hidden sm:block text-left">
              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                {displayName}
              </span>
              <span className={cn(
                'text-[10px] font-semibold block leading-tight',
                isMetaLead ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'
              )}>
                {displayTitle}
              </span>
            </div>
          </div>

        </div>

      </div>
    </header>
  );
};
