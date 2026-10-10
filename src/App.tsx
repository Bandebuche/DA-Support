import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Ticket, TicketStatus } from './types/ticket';
import { ticketService } from './services/ticketService';
import { isTodayInIST } from './lib/timezone';
import { ToastProvider, useToast } from './components/ui/Toast';
import { ThemeProvider } from './context/ThemeContext';

// Layout & Navigation
import { AdminSidebar, NavItemKey } from './components/navigation/AdminSidebar';
import { TopCommandBar, ViewMode, TicketAlertItem } from './components/navigation/TopCommandBar';
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
import { 
  isUserAuthenticated, 
  setUserAuthenticated, 
  getAuthenticatedUser, 
  setAuthenticatedUser, 
  AdminUserSession 
} from './lib/storage';
import { audioNotification } from './lib/audioNotification';
import { Globe, Link2 } from 'lucide-react';

export type RouteType = 'public' | 'admin' | 'track' | 'analytics' | 'onkar';

function parseCurrentRoute(): { route: RouteType; tab: NavItemKey } {
  if (typeof window === 'undefined') return { route: 'public', tab: 'overview' };

  const path = window.location.pathname.toLowerCase();
  const search = new URLSearchParams(window.location.search);
  const hash = window.location.hash.toLowerCase();

  // 1. Onkar Meta Desk direct route (e.g. /onkar, ?portal=onkar, ?role=onkar, #onkar)
  if (path.includes('onkar') || search.get('portal') === 'onkar' || search.get('role') === 'onkar' || hash === '#onkar') {
    return { route: 'onkar', tab: 'overview' };
  }

  // 2. Admin Command Deck route (e.g. /admin, ?portal=admin, ?page=admin, #admin)
  if (path.includes('admin') || search.get('portal') === 'admin' || search.get('page') === 'admin' || hash === '#admin') {
    const tabParam = (search.get('tab') || 'overview') as NavItemKey;
    return { route: 'admin', tab: tabParam };
  }

  // 3. Analytics direct route (part of Admin)
  if (path.includes('analytics') || search.get('page') === 'analytics' || search.get('tab') === 'analytics' || hash === '#analytics') {
    return { route: 'admin', tab: 'analytics' };
  }

  // 4. Default: Public Submission Gateway (/submit or /)
  return { route: 'public', tab: 'overview' };
}

function AppContent() {
  const { toast } = useToast();

  // Routing State
  const [currentRoute, setCurrentRoute] = useState<RouteType>(() => parseCurrentRoute().route);
  const [currentTab, setCurrentTab] = useState<NavItemKey>(() => parseCurrentRoute().tab);
  const [isLinksModalOpen, setIsLinksModalOpen] = useState(false);

  // Authentication State with User Roles
  const [currentUser, setCurrentUser] = useState<AdminUserSession | null>(() => getAuthenticatedUser());
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => isUserAuthenticated());

  // Real-time Notifications & Alert Queue
  const [notifications, setNotifications] = useState<TicketAlertItem[]>([]);
  const [knownTicketIds, setKnownTicketIds] = useState<Set<string>>(() => {
    return new Set(ticketService.getAllTickets().map(t => t.ticketId));
  });

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
    } else if (resolvedRoute === 'onkar') {
      newPath = basePath ? `${basePath}/onkar` : '/onkar';
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    ecosystem: 'all',
    membershipTier: 'all',
    priority: 'all',
    category: 'all',
    specialist: 'all',
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
    ticketService.fetchCloudTickets().then(fresh => {
      setTickets(fresh);
      if (selectedTicket) {
        const updated = fresh.find(t => t.ticketId === selectedTicket.ticketId);
        if (updated) setSelectedTicket(updated);
      }
      setIsRefreshing(false);
    }).catch(() => {
      const fallback = ticketService.getAllTickets();
      setTickets(fallback);
      setIsRefreshing(false);
    });
  }, [selectedTicket]);

  // Initial fetch from cloud database on load to sync cross-device submissions
  useEffect(() => {
    ticketService.fetchCloudTickets().then(cloudTickets => {
      setTickets(cloudTickets);
      setKnownTicketIds(new Set(cloudTickets.map(t => t.ticketId)));
    }).catch(console.warn);
  }, []);

  // Real-time audio alerts & Cross-tab notifications listener
  useEffect(() => {
    // Unlock browser audio context on user interaction
    const handleUserInteraction = () => {
      audioNotification.unlockAudio();
      window.removeEventListener('click', handleUserInteraction);
    };
    window.addEventListener('click', handleUserInteraction);

    // Listen for custom ticket creation event
    const handleNewTicketEvent = (e: any) => {
      const newTicket: Ticket = e.detail;
      if (!newTicket) return;

      const isMetaTicket = 
        (newTicket.assignedSpecialist || '').toLowerCase().includes('onkar') ||
        (newTicket.category || '').toLowerCase().includes('meta') ||
        (newTicket.subject || '').toLowerCase().includes('meta');

      // If logged in as Onkar Sir, only chime for Meta queries
      if (currentUser?.role === 'meta_lead' && !isMetaTicket) return;

      // Play chime sound
      audioNotification.playNewTicketChime();

      // Show toast
      toast({
        title: `🔔 New Query: ${newTicket.ticketId}`,
        description: `From ${newTicket.requesterName} • ${newTicket.subject}`,
        type: 'info',
      });

      // Append to alert queue
      setNotifications(prev => [
        {
          id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ticketId: newTicket.ticketId,
          title: newTicket.subject,
          requesterName: newTicket.requesterName,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
        ...prev,
      ]);

      refreshTickets();
    };

    window.addEventListener('DA_NEW_TICKET', handleNewTicketEvent);

    // Cross-tab storage change listener
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'DA_SUPPORT_TICKETS_V2') {
        refreshTickets();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Polling interval (every 3.5 seconds) to auto-detect incoming tickets from Cloud / Mobile / Other tabs
    const pollTimer = setInterval(async () => {
      try {
        const latest = await ticketService.fetchCloudTickets();
        setKnownTicketIds(prevIds => {
          const newArrivals = latest.filter(t => !prevIds.has(t.ticketId));
          if (newArrivals.length > 0) {
            newArrivals.forEach(newTicket => {
              const isMetaTicket = 
                (newTicket.assignedSpecialist || '').toLowerCase().includes('onkar') ||
                (newTicket.category || '').toLowerCase().includes('meta') ||
                (newTicket.subject || '').toLowerCase().includes('meta');

              if (currentUser?.role === 'meta_lead' && !isMetaTicket) return;

              audioNotification.playNewTicketChime();
              toast({
                title: `🔔 New Query: ${newTicket.ticketId}`,
                description: `From ${newTicket.requesterName} • ${newTicket.subject}`,
                type: 'info',
              });
              setNotifications(prev => [
                {
                  id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                  ticketId: newTicket.ticketId,
                  title: newTicket.subject,
                  requesterName: newTicket.requesterName,
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
                ...prev,
              ]);
            });
            setTickets(latest);
            return new Set(latest.map(t => t.ticketId));
          } else {
            // Keep ticket state in sync in case status, deletion or notes changed in cloud
            setTickets(latest);
          }
          return prevIds;
        });
      } catch {
        // Safe silent fallback
      }
    }, 3500);

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('DA_NEW_TICKET', handleNewTicketEvent);
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollTimer);
    };
  }, [currentUser, toast, refreshTickets]);

  // Ticket Action Handlers
  const handleStartSupport = async (ticketId: string) => {
    try {
      const agentName = currentUser?.name || 'Agent Lead';
      const updated = await ticketService.startSupport(ticketId, agentName);
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
      const agentName = currentUser?.name || 'Agent Lead';
      const updated = await ticketService.resolveTicket(ticketId, resolutionNotes, agentName);
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      setIsResolveModalOpen(false);
      setResolvingTicket(null);
      toast({
        title: 'Ticket Resolved',
        description: `Ticket ${ticketId} resolved with SLA logged`,
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
      const agentName = currentUser?.name || 'Agent Lead';
      const updated = await ticketService.updateStatus(ticketId, newStatus, agentName);
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
      const agentName = currentUser?.name || 'Support Agent';
      const updated = await ticketService.addInternalNote(ticketId, content, agentName);
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

  const handleDeleteTicket = (ticketId: string) => {
    try {
      ticketService.deleteTicket(ticketId);
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(null);
        setIsDrawerOpen(false);
      }
      toast({
        title: 'Ticket Deleted',
        description: `Ticket ${ticketId} was permanently removed`,
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error Deleting Ticket',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleDeleteTickets = (ticketIds: string[]) => {
    try {
      ticketService.deleteTickets(ticketIds);
      refreshTickets();
      if (selectedTicket && ticketIds.includes(selectedTicket.ticketId)) {
        setSelectedTicket(null);
        setIsDrawerOpen(false);
      }
      toast({
        title: 'Tickets Deleted',
        description: `Successfully removed ${ticketIds.length} ticket(s)`,
        type: 'info',
      });
    } catch (err: any) {
      toast({
        title: 'Error Deleting Tickets',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleResetAllTickets = () => {
    try {
      ticketService.clearAllTickets();
      refreshTickets();
      setSelectedTicket(null);
      setIsDrawerOpen(false);
      toast({
        title: 'All Tickets Cleared',
        description: 'Operations database was reset successfully',
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Resetting Tickets',
        description: err.message,
        type: 'error',
      });
    }
  };

  const handleReassignSpecialist = async (ticketId: string, specialist: string) => {
    try {
      const agentName = currentUser?.name || 'Admin';
      const updated = await ticketService.reassignSpecialist(ticketId, specialist, agentName);
      refreshTickets();
      if (selectedTicket?.ticketId === ticketId) {
        setSelectedTicket(updated);
      }
      toast({
        title: 'Specialist Reassigned',
        description: `Ticket ${ticketId} handed over to ${specialist}`,
        type: 'success',
      });
    } catch (err: any) {
      toast({
        title: 'Error Reassigning Specialist',
        description: err.message,
        type: 'error',
      });
    }
  };

  // Role-based tickets scoping:
  // Onkar Sir sees ONLY Meta queries.
  // Sachin Sir sees all operations queries.
  const isMetaLead = currentUser?.role === 'meta_lead' || currentRoute === 'onkar';

  const roleScopedTickets = useMemo(() => {
    if (isMetaLead) {
      return tickets.filter(t => {
        const spec = (t.assignedSpecialist || '').toLowerCase();
        const cat = (t.category || '').toLowerCase();
        const subj = (t.subject || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        return (
          spec.includes('onkar') || 
          cat.includes('meta') || 
          subj.includes('meta') || 
          desc.includes('meta')
        );
      });
    }
    return tickets;
  }, [tickets, isMetaLead]);

  // Nav counts based on role-scoped tickets
  const ticketCounts = useMemo(() => {
    return {
      all: roleScopedTickets.length,
      active: roleScopedTickets.filter(t => t.status === 'In Progress').length,
      pending: roleScopedTickets.filter(t => t.status === 'New' || t.status === 'Waiting for User').length,
      resolved: roleScopedTickets.filter(t => t.status === 'Resolved').length,
    };
  }, [roleScopedTickets]);

  // Unique categories for filter tray
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    roleScopedTickets.forEach(t => {
      if (t.category) set.add(t.category);
    });
    return Array.from(set);
  }, [roleScopedTickets]);

  // Filtering Logic
  const filteredTickets = useMemo(() => {
    return roleScopedTickets.filter(t => {
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

      // 7. Assigned Specialist
      if (filters.specialist !== 'all') {
        const currentSpec = t.assignedSpecialist || 'General Support Desk';
        if (currentSpec !== filters.specialist) return false;
      }

      // 8. Date range (IST)
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
        const priorityOrder: Record<string, number> = { Critical: 4, High: 3, Normal: 2, Low: 1 };
        return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
      }
      if (filters.sortBy === 'duration') {
        return (b.activeDurationSeconds || 0) - (a.activeDurationSeconds || 0);
      }
      return 0;
    });
  }, [roleScopedTickets, currentTab, searchQuery, filters]);

  // 1. Public Support Portal: Strictly the support ticket submission form only
  if (currentRoute === 'public' || currentRoute === 'track') {
    return <PublicGateway />;
  }

  // 2. Admin Operations Deck: Requires Secure Authentication
  if (!isAuthenticated) {
    return (
      <AdminLogin
        initialRole={currentRoute === 'onkar' ? 'meta_lead' : 'super_admin'}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        onBackToPublic={() => navigateTo('public')}
      />
    );
  }

  // 3. Admin Operations Deck (Authenticated)
  return (
    <div className="min-h-screen bg-[#F0F4FA] dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex p-0 lg:p-4 justify-center items-stretch antialiased selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-[1750px] bg-white dark:bg-slate-900 rounded-none lg:rounded-[32px] shadow-2xl shadow-blue-900/10 border-0 lg:border border-slate-200/80 dark:border-slate-800 flex flex-row relative">
        
        {/* Left Collapsible Sidebar */}
        <AdminSidebar
          currentTab={currentTab}
          onSelectTab={tab => {
            if (tab === 'settings') {
              setIsCloudConfigOpen(true);
            } else {
              setCurrentTab(tab);
              navigateTo(isMetaLead ? 'onkar' : 'admin', tab);
            }
          }}
          collapsed={railCollapsed}
          onToggleCollapse={() => setRailCollapsed(!railCollapsed)}
          onSwitchToPublic={() => navigateTo('public')}
          onLogout={() => {
            setAuthenticatedUser(null);
            setUserAuthenticated(false);
            setCurrentUser(null);
            setIsAuthenticated(false);
            navigateTo('public');
          }}
          ticketCounts={ticketCounts}
          isMobileOpen={isMobileNavOpen}
          onMobileClose={() => setIsMobileNavOpen(false)}
        />

        {/* Main Command Center Deck */}
        <div className="flex-1 flex flex-col min-w-0 h-[100dvh] lg:h-[calc(100vh-2rem)] overflow-hidden bg-white dark:bg-slate-900 relative">
          
          {/* Sticky Top Command Bar */}
          <TopCommandBar
            title={
              isMetaLead
                ? 'Meta Operations Deck'
                : currentTab === 'overview'
                ? 'Operations Dashboard'
                : currentTab === 'analytics'
                ? 'SLA Analytics Deck'
                : currentTab === 'active'
                ? 'Active Support Sessions'
                : currentTab === 'resolved'
                ? 'Resolved Archive'
                : 'Support Ticket Queue'
            }
            ticketCount={filteredTickets.length}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRefresh={refreshTickets}
            isRefreshing={isRefreshing}
            onOpenSettings={() => setIsCloudConfigOpen(true)}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            currentUser={currentUser}
            notifications={notifications}
            onClearNotifications={() => setNotifications([])}
            onSelectAlertTicket={ticketId => {
              const target = tickets.find(t => t.ticketId === ticketId);
              if (target) handleSelectTicket(target);
            }}
          />

          {/* Scrollable Content Container (Below Sticky Header) */}
          <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">

            {/* Global Page Directory Trigger */}
            <div className="px-4 sm:px-6 pt-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsLinksModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-elevated border border-surface-border text-indigo-600 dark:text-indigo-400 text-xs flex items-center gap-1.5 transition font-medium cursor-pointer"
                  title="View all separate page links"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>All Page Links</span>
                </button>
                <span className="text-xs text-text-muted hidden sm:inline">
                  {isMetaLead 
                    ? 'Logged in as Onkar Kulkarni (Meta Ads Support Desk)' 
                    : 'Logged in as Sachin Sir (Super Admin Operations)'}
                </span>
              </div>

              <div className="text-[11px] font-mono text-text-faint hidden md:block">
                <span>Route: </span>
                <code className="text-text-pure">/{isMetaLead ? 'onkar' : currentTab === 'analytics' ? 'analytics' : 'admin'}</code>
              </div>
            </div>

            {/* Deck Content Canvas */}
            <main className="flex-1 p-3.5 sm:p-6 space-y-6 max-w-7xl w-full mx-auto pb-12">
              
              {/* Top 4 KPI Summary Modules & Dynamic Daily Histogram */}
              {currentTab !== 'analytics' && (
                <KPICards tickets={roleScopedTickets} />
              )}

              {/* SLA & Analytics View */}
              {currentTab === 'analytics' ? (
                <AnalyticsView tickets={roleScopedTickets} />
              ) : (
                <>
                  {/* Filter Tray */}
                  <FilterTray
                    filters={filters}
                    onFilterChange={setFilters}
                    availableCategories={availableCategories}
                    totalCount={roleScopedTickets.length}
                    filteredCount={filteredTickets.length}
                  />

                  {/* View Renderers (Dense Table, Modular Cards, Kanban) */}
                  {viewMode === 'table' && (
                    <TicketTableView
                      tickets={filteredTickets}
                      onSelectTicket={handleSelectTicket}
                      onStartSupport={handleStartSupport}
                      onResolveTicket={handleOpenResolveModal}
                      onStatusChange={handleStatusChange}
                      onDeleteTicket={handleDeleteTicket}
                      onDeleteTickets={handleDeleteTickets}
                      onResetAllTickets={handleResetAllTickets}
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

                  {viewMode === 'kanban' && (
                    <KanbanBoard
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
        onDeleteTicket={handleDeleteTicket}
        onReassignSpecialist={handleReassignSpecialist}
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
