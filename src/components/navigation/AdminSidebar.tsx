import React, { useEffect } from 'react';
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
  LogOut,
  X,
  Headphones,
  LifeBuoy
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { BrandLogo } from '../common/BrandLogo';

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
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  onSwitchToPublic,
  onLogout,
  ticketCounts,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const navItems = [
    { key: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'all', label: 'Tickets', icon: Layers, count: ticketCounts.all },
    { key: 'active', label: 'Active Sessions', icon: Timer, count: ticketCounts.active },
    { key: 'pending', label: 'Pending Queue', icon: Clock4, count: ticketCounts.pending },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2, count: ticketCounts.resolved },
    { key: 'analytics', label: 'Statistics', icon: BarChart3 },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];

  // Close mobile drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileOpen, onMobileClose]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileOpen]);

  const renderNavList = (isMobile: boolean = false) => (
    <nav className="flex-1 py-6 pl-4 pr-0 space-y-1.5 overflow-y-auto">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = currentTab === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              onSelectTab(item.key as NavItemKey);
              if (isMobile && onMobileClose) onMobileClose();
            }}
            className={cn(
              'w-full flex items-center gap-3.5 py-3 transition-all duration-200 group relative text-xs sm:text-sm font-semibold select-none',
              isActive
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 font-bold rounded-l-full shadow-lg shadow-blue-900/10 pl-5 pr-4 -mr-px z-10'
                : 'text-white/80 hover:text-white hover:bg-white/10 px-4 rounded-2xl mr-4',
              collapsed && !isMobile && 'justify-center px-2 mr-2'
            )}
            title={item.label}
          >
            <Icon
              className={cn(
                'w-5 h-5 shrink-0 transition-transform duration-200',
                isActive ? 'text-blue-600 dark:text-blue-400 scale-105' : 'text-white/80 group-hover:text-white',
                isActive ? '' : 'group-hover:scale-105'
              )}
            />

            {(!collapsed || isMobile) && (
              <>
                <span className="truncate flex-1 text-left">{item.label}</span>
                {item.count !== undefined && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[10px] font-mono font-bold shrink-0',
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
                        : 'bg-white/20 text-white'
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </>
            )}

            {!isMobile && collapsed && (
              <>
                {item.count !== undefined && item.count > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
                )}
                {/* Floating Tooltip on Hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-2xl z-50 flex items-center gap-2 border border-slate-700">
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-mono font-bold">
                      {item.count}
                    </span>
                  )}
                </div>
              </>
            )}
          </button>
        );
      })}
    </nav>
  );

  const renderBottomActions = (isMobile: boolean = false) => (
    <div className="p-4 border-t border-white/15 space-y-2">
      {/* Public Portal Link */}
      <button
        onClick={() => {
          onSwitchToPublic();
          if (isMobile && onMobileClose) onMobileClose();
        }}
        className={cn(
          'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white/90 hover:text-white',
          'bg-white/10 hover:bg-white/20 transition group relative border border-white/10',
          collapsed && !isMobile && 'justify-center px-2'
        )}
        title="Open Public Support Portal"
      >
        <ExternalLink className="w-4 h-4 text-white shrink-0" />
        {(!collapsed || isMobile) && <span className="truncate">Public Portal</span>}
      </button>

      {/* Sign Out */}
      {onLogout && (
        <button
          onClick={() => {
            onLogout();
            if (isMobile && onMobileClose) onMobileClose();
          }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-white/90 hover:text-white',
            'bg-red-500/20 hover:bg-red-500/30 transition group relative border border-red-300/20',
            collapsed && !isMobile && 'justify-center px-2'
          )}
          title="Sign Out of Admin Deck"
        >
          <LogOut className="w-4 h-4 text-white shrink-0" />
          {(!collapsed || isMobile) && <span className="truncate">Sign Out</span>}
        </button>
      )}

      {/* Footer Branding Note (matching reference screenshot) */}
      {(!collapsed || isMobile) && (
        <div className="pt-2 text-[10px] text-white/60 text-center font-medium select-none">
          Digital Azadi Operations
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Royal Blue Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col shrink-0 transition-all duration-300 z-30 select-none relative',
          'bg-gradient-to-b from-[#1877F2] via-[#1E6BFF] to-[#1456CC] text-white shadow-xl',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-5 border-b border-white/15">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center font-black text-base shadow-md shrink-0">
              DA
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight truncate">
                  Digital Azadi
                </span>
                <span className="text-[11px] font-medium text-white/70 block leading-tight truncate">
                  Support Portal
                </span>
              </div>
            )}
          </div>

          {/* Collapse rail toggle */}
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition shrink-0"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Item List */}
        {renderNavList(false)}

        {/* Bottom Actions */}
        {renderBottomActions(false)}
      </aside>

      {/* Mobile Drawer (Slide over) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />

          {/* Drawer Canvas */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gradient-to-b from-[#1877F2] via-[#1E6BFF] to-[#1456CC] text-white shadow-2xl z-10">
            {/* Mobile Header */}
            <div className="h-18 flex items-center justify-between px-5 border-b border-white/15">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center font-black text-base shadow-md">
                  DA
                </div>
                <div>
                  <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                    Digital Azadi
                  </span>
                  <span className="text-[11px] font-medium text-white/70 block leading-tight">
                    Support Operations
                  </span>
                </div>
              </div>

              <button
                onClick={onMobileClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav list */}
            {renderNavList(true)}

            {/* Bottom actions */}
            {renderBottomActions(true)}
          </div>
        </div>
      )}
    </>
  );
};
