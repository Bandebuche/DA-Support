import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Timer, 
  Clock4, 
  CheckCircle2, 
  BarChart3, 
  Settings, 
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';
import { ThemeToggle } from '../common/ThemeToggle';

export type NavItemKey = 
  | 'overview' 
  | 'all' 
  | 'my-tickets' 
  | 'active' 
  | 'pending' 
  | 'resolved' 
  | 'analytics' 
  | 'settings';

export interface AdminSidebarProps {
  currentTab: NavItemKey;
  onSelectTab: (tab: NavItemKey) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSwitchToPublic: () => void;
  onLogout?: () => void;
  ticketCounts: {
    all: number;
    active: number;
    pending: number;
    resolved: number;
  };
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onSwitchToPublic,
  onLogout,
  ticketCounts,
}) => {
  const navItems = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'all', label: 'All Tickets', icon: Layers, count: ticketCounts.all },
    { key: 'active', label: 'Active Support', icon: Timer, count: ticketCounts.active, highlight: true },
    { key: 'pending', label: 'Pending', icon: Clock4, count: ticketCounts.pending },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2, count: ticketCounts.resolved },
    { key: 'analytics', label: 'Analytics & SLA', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 z-40 bg-surface flex flex-col border-r border-surface-border transition-all duration-200 select-none',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-surface-border">
        <div className="flex items-center gap-2.5 overflow-hidden">
          {!collapsed ? (
            <BrandLogo size="sm" showBadge={false} />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/50 flex items-center justify-center shrink-0 p-1">
              <img
                src="https://digitalazadi.com/wp-content/uploads/2026/03/Digital-Azadi-White-Logo-scaled.png"
                alt="Digital Azadi"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = './digital-azadi-logo.png';
                }}
              />
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-text-muted hover:text-text-pure hover:bg-surface-elevated transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.key;

          return (
            <button
              key={item.key}
              onClick={() => onSelectTab(item.key as NavItemKey)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 group relative',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 font-bold'
                  : 'text-text-soft hover:text-text-pure hover:bg-surface-elevated'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-text-muted group-hover:text-text-pure',
                  item.highlight && !isActive && 'text-amber-600 dark:text-amber-400'
                )}
              />

              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.count !== undefined && (
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-mono font-medium',
                        isActive
                          ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white'
                          : 'bg-surface-elevated text-text-muted border border-surface-border'
                      )}
                    >
                      {item.count}
                    </span>
                  )}
                </>
              )}

              {collapsed && item.count !== undefined && item.count > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-surface-border space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToPublic}
            className={cn(
              'flex-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-text-soft hover:text-text-pure',
              'bg-surface-elevated hover:bg-surface-hover border border-surface-border transition'
            )}
            title="Open Public Support Portal"
          >
            <ExternalLink className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            {!collapsed && <span className="truncate">Public Portal</span>}
          </button>

          <ThemeToggle />
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
              'bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 border border-red-200 dark:border-red-900/40 transition'
            )}
            title="Sign Out of Admin Deck"
          >
            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            {!collapsed && <span className="truncate">Sign Out</span>}
          </button>
        )}

        {!collapsed && (
          <div className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-[10px] text-text-muted flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              IST Sync Engine
            </span>
            <span className="font-mono">Asia/Kolkata</span>
          </div>
        )}
      </div>
    </aside>
  );
};

// Backward-compatible alias
export const NexusRail = AdminSidebar;
