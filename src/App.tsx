import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, TicketStatus } from './types/ticket';
import { ticketService } from './services/ticketService';
import { isTodayInIST } from './lib/timezone';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Navigation
import { AdminSidebar, NavItemKey } from './components/navigation/AdminSidebar';
import { TopCommandBar, ViewMode } from './components/navigation/TopCommandBar';
import { KPICards } from './components/dashboard/KPICards';
import { FilterTray, FilterState } from './components/dashboard/FilterTray';
import { AnalyticsView } from './components/dashboard/AnalyticsView';
import { PortalLinksModal } from './components/navigation/PortalLinksModal';

// Ticket Views
import { KanbanBoard } from './components/tickets/KanbanBoard';
import { TicketCardGrid } from './components/tickets/TicketCardGrid';
import { TicketTableView } from './components/tickets/TicketTableView';
import { TicketDetailDrawer } from './components/tickets/TicketDetailDrawer';

// Modals
import { ResolveModal } from './components/modals/ResolveModal';
import { ManualOverrideModal } from './components/modals/ManualOverrideModal';
import { CloudConfigModal } from './components/modals/CloudConfigModal';

// Public Portal & Admin Login
import { PublicGateway } from './components/public/PublicGateway';
import { AdminLogin } from './components/admin/AdminLogin';
import { isUserAuthenticated, setUserAuthenticated } from './lib/storage';
import { Globe, Link2 } from 'lucide-react';

export type RouteType = 'public' | 'admin' | 'track' | 'analytics';

function parseCurrentRoute(): { route: RouteType; tab: NavItemKey } {
  if (typeof window === 'undefined') return { route: 'public', tab: 'overview' };

  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  // 1. Admin Command Deck route (e.g. /admin, ?portal=admin, ?page=admin, #admin)
  if (path.includes('admin') || search.get('portal') === 'admin' || search.get('page') === 'admin' || hash === '#admin') {
    const tabParam = (search.get('tab') || 'overview') as NavItemKey;
    return { route: 'admin', tab: tabParam };
  }

  // 2. Analytics direct route (part of Admin)
  if (path.includes('analytics') || search.get('page') === 'analytics' || search.get('tab') === 'analytics' || hash === '#analytics') {
    return { route: 'admin', tab: 'analytics' };
  }

  // 3. Default: Public Submission Gateway (/submit or /)
  return { route: 'public', tab: 'overview' };
}

function AppContent() {
  const { toast } = useToast();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());

  // Routing State
  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => parseCurrentRoute().route);
  const [currentTab, setCurrentTab] = useState<NavItemKey>(() => parseCurrentRoute().tab);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);

  // Sync route on popstate and hashchange
  useEffect(() => {
    const handleUrlChange = () => {
      const parsed = parseCurrentRoute();
      setCurrentRoute(parsed.route);
      setCurrentTab(parsed.tab);
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Programmatic navigation that updates browser URL
  const navigateTo = useCallback((targetRoute: RouteType, targetTab: NavItemKey = 'overview') => {
    let resolvedRoute: RouteType = targetRoute;
    if (targetRoute === 'analytics') {
      resolvedRoute = 'admin';
      targetTab = 'analytics';
    } else if (targetRoute === 'track') {
      resolvedRoute = 'public';
    }

    const isSubdir = typeof window !== 'undefined' && window.location.pathname.toLowerCase().startsWith('/support');
    const basePath = isSubdir ? '/support' : '';

    let newPath = basePath ? `${basePath}/` : '/';
    let query = '';

    if (resolvedRoute === 'public') {
      newPath = basePath ? `${basePath}/submit` : '/submit';
    } else if (resolvedRoute === 'admin') {
      newPath = basePath ? `${basePath}/admin` : '/admin';
      query = targetTab === 'analytics' ? '?tab=analytics' : '';
    }

    try {
      window.history.pushState({}, '', query ? `${newPath}${query}` : newPath);
    } catch {
      // Fallback
    }

    setCurrentRoute(resolvedRoute);
    setCurrentTab(targetTab);
  }, []);

  // State: Tickets
  const [tickets, setTickets] = useState<Ticket[]>(() => ticketService.getAllTickets());
  const [isRefreshing, setIsRefreshing] = useState(false);

  // UI View state
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    ecosystem: 'all',
    membershipTier: 'all',
    priority: 'all',
    category: 'all',
    dateRange: 'all',
    sortBy: 'newest',
  });

  // Modals & Drawers
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<Ticket | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [overrideTicket, setOverrideTicket] = useState<Ticket | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [isCloudConfigOpen, setIsCloudConfigOpen] = useState(false);

  const refreshTickets = useCallback(() => {
    setIsRefreshing(true);
    const fresh = ticketService.getAllTickets();
    setTickets(fresh);

    if (selectedTicket) {
      const updated = fresh.find(t => t.ticketId === selectedTicket.ticketId);
      if (updated) setSelectedTicket(updated);
    }

    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  }, [selectedTicket]);

  // Ticket Action Handlers
  const handleStartSupport = async (ticketId: string) => {
    try {
      const updated = await ticketService.startSupport(ticketId, 'Agent Lead');
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Support Stopwatch Started',
        description: `Active session begun for ticket ${ticketId}`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Starting Support',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleOpenResolveModal = (ticket: Ticket) => {
    setResolvingTicket(ticket);
    setIsResolveModalOpen(true);
  };

  const handleConfirmResolve = async (ticketId: string, resolutionNotes: string) => {
    try {
      const updated = await ticketService.resolveTicket(ticketId, resolutionNotes, 'Agent Lead');
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Ticket Resolved Successfully',
        description: `Duration committed & logged for ${ticketId}`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Resolving Ticket',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      const updated = await ticketService.updateStatus(ticketId, newStatus, 'Agent Lead');
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Status Updated',
        description: `Ticket ${ticketId} is now ${newStatus}`,
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error Updating Status',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleAddInternalNote = async (ticketId: string, content: string) => {
    try {
      const updated = await ticketService.addInternalNote(ticketId, content, 'Support Agent');
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Note Appended',
        description: 'Internal private note saved to audit record',
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Saving Note',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleManualOverride = async (
    ticketId: string,
    data: {
      status?: TicketStatus;
      durationSeconds?: number;
      resolutionNotes?: string;
      agentName: string;
    }
  ) => {
    try {
      const updated = await ticketService.manualOverride(ticketId, data);
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Manual Override Applied',
        description: `Record adjusted for ticket ${ticketId}`,
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error Applying Override',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleSelectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDrawerOpen(true);
  };

  // Nav counts
  const ticketCounts = useMemo(() => {
    return {
      all: tickets.length,
      active: tickets.filter(t => t.status === 'In Progress').length,
      pending: tickets.filter(t => t.status === 'New' || t.status === 'Waiting for User').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
    };
  }, [tickets]);

  // Unique categories for filter tray
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    tickets.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [tickets]);

  // Filtering Logic
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      // 1. Sidebar tab filter
      if (currentTab === 'active' && t.status !== 'In Progress') return false;
      if (currentTab === 'pending' && !(t.status === 'New' || t.status === 'Waiting for User')) return false;
      if (currentTab === 'resolved' && t.status !== 'Resolved') return false;

      // 2. Global search query (Ticket ID, Name, Phone, Email, Subject)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const match =
          t.ticketId.toLowerCase().includes(q) ||
          t.requesterName.toLowerCase().includes(q) ||
          t.requesterPhone.includes(q) ||
          t.requesterEmail.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 3. Ecosystem
      if (filters.ecosystem !== 'all' && t.ecosystem !== filters.ecosystem) return false;

      // 4. Membership Tier
      if (filters.membershipTier !== 'all' && t.membershipTier !== filters.membershipTier) return false;

      // 5. Priority
      if (filters.priority !== 'all' && t.priority !== filters.priority) return false;

      // 6. Category
      if (filters.category !== 'all' && t.category !== filters.category) return false;

      // 7. Date range (IST)
      if (filters.dateRange === 'today' && !isTodayInIST(t.createdAt)) return false;
      if (filters.dateRange === 'week') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (new Date(t.createdAt).getTime() < sevenDaysAgo) return false;
      }
      if (filters.dateRange === 'month') {
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        if (new Date(t.createdAt).getTime() < thirtyDaysAgo) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filters.sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (filters.sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (filters.sortBy === 'priority') {
        const score = (p: string) => (p === 'Urgent' ? 4 : p === 'High' ? 3 : p === 'Normal' ? 2 : 1);
        return score(b.priority) - score(a.priority);
      }
      if (filters.sortBy === 'duration') {
        const durA = a.resolutionDurationSeconds || a.activeDurationSeconds || 0;
        const durB = b.resolutionDurationSeconds || b.activeDurationSeconds || 0;
        return durB - durA;
      }
      return 0;
    });
  }, [tickets, currentTab, searchQuery, filters]);

  // 1. Public Support Portal: Strictly the support ticket submission form only
  if (currentRoute === 'public' || currentRoute === 'track') {
    return <PublicGateway />;
  }

  // 2. Admin Operations Deck: Requires Secure Authentication
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={() => setIsAuthenticated(true)}
        onBackToPublic={() => navigateTo('public')}
      />
    );
  }

  // 3. Admin Operations Deck (Authenticated)
  return (
    <div className="min-h-screen bg-void text-text-pure flex flex-row selection:bg-indigo-600 selection:text-white">
      
      {/* Left Collapsible Sidebar */}
      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={tab => {
          if (tab === 'settings') {
            setIsCloudConfigOpen(true);
          } else {
            setCurrentTab(tab);
            navigateTo('admin', tab);
          }
        }}
        collapsed={railCollapsed}
        onToggleCollapse={() => setRailCollapsed(!railCollapsed)}
        onSwitchToPublic={() => navigateTo('public')}
        onLogout={() => {
          setUserAuthenticated(false);
          setIsAuthenticated(false);
          navigateTo('public');
        }}
        ticketCounts={ticketCounts}
      />

      {/* Main Command Center Deck */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        
        {/* Top Command Bar */}
        <TopCommandBar
          title={
            currentTab === 'overview'
              ? 'Operations Command Deck'
              : currentTab === 'analytics'
              ? 'SLA Analytics Deck'
              : currentTab === 'active'
              ? 'Active Support Sessions'
              : currentTab === 'resolved'
              ? 'Resolved Archive'
              : 'Support Ticket Queue'
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onRefresh={refreshTickets}
          isRefreshing={isRefreshing}
          onOpenSettings={() => setIsCloudConfigOpen(true)}
        />

        {/* Global Page Directory Trigger */}
        <div className="px-6 pt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLinksModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5 transition font-medium"
              title="View all separate page links"
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>All Page Links</span>
            </button>
            <span className="text-xs text-text-muted hidden sm:inline">
              Click to view direct URLs for Students, Franchisees, or Support Agents
            </span>
          </div>

          <div className="text-[11px] font-mono text-text-faint hidden md:block">
            <span>Route: </span>
            <code className="text-text-pure">/{currentTab === 'analytics' ? 'analytics' : 'admin'}</code>
          </div>
        </div>

        {/* Deck Content Canvas */}
        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Top 4 KPI Summary Modules (Overview or All) */}
          {currentTab !== 'analytics' && (
            <KPICards tickets={tickets} />
          )}

          {/* SLA & Analytics View */}
          {currentTab === 'analytics' ? (
            <AnalyticsView tickets={tickets} />
          ) : (
            <>
              {/* Filter Tray */}
              <FilterTray
                filters={filters}
                onFilterChange={setFilters}
                availableCategories={availableCategories}
                totalCount={tickets.length}
                filteredCount={filteredTickets.length}
              />

              {/* View Renderers (Kanban, Modular Cards, Dense Table) */}
              {viewMode === 'kanban' && (
                <KanbanBoard
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  onStartSupport={handleStartSupport}
                  onResolveTicket={handleOpenResolveModal}
                  onStatusChange={handleStatusChange}
                />
              )}

              {viewMode === 'cards' && (
                <TicketCardGrid
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  onStartSupport={handleStartSupport}
                  onResolveTicket={handleOpenResolveModal}
                  onStatusChange={handleStatusChange}
                />
              )}

              {viewMode === 'table' && (
                <TicketTableView
                  tickets={filteredTickets}
                  onSelectTicket={handleSelectTicket}
                  onStartSupport={handleStartSupport}
                  onResolveTicket={handleOpenResolveModal}
                  onStatusChange={handleStatusChange}
                />
              )}
            </>
          )}

        </main>

      </div>

      {/* Slide-over Detail Drawer */}
      <TicketDetailDrawer
        ticket={selectedTicket}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedTicket(null);
        }}
        onStartSupport={handleStartSupport}
        onResolveTicket={handleOpenResolveModal}
        onStatusChange={handleStatusChange}
        onAddInternalNote={handleAddInternalNote}
        onOpenManualOverride={t => {
          setOverrideTicket(t);
          setIsOverrideModalOpen(true);
        }}
      />

      {/* Resolve Modal */}
      <ResolveModal
        ticket={resolvingTicket}
        isOpen={isResolveModalOpen}
        onClose={() => {
          setIsResolveModalOpen(false);
          setResolvingTicket(null);
        }}
        onConfirm={handleConfirmResolve}
      />

      {/* Manual Override Modal */}
      <ManualOverrideModal
        ticket={overrideTicket}
        isOpen={isOverrideModalOpen}
        onClose={() => {
          setIsOverrideModalOpen(false);
          setOverrideTicket(null);
        }}
        onSaveOverride={handleManualOverride}
      />

      {/* Google Sheets Cloud Config Modal */}
      <CloudConfigModal
        isOpen={isCloudConfigOpen}
        onClose={() => setIsCloudConfigOpen(false)}
        onRefreshData={refreshTickets}
      />

      {/* Portal Links Modal */}
      <PortalLinksModal
        isOpen={isLinksModalOpen}
        onClose={() => setIsLinksModalOpen(false)}
        onNavigate={navigateTo}
      />

    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
