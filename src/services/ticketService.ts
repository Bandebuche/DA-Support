import { Ticket, TicketFormData, TicketStatus } from '../types/ticket';
import { 
  loadStoredTickets, 
  saveStoredTickets, 
  upsertStoredTicket, 
  deleteStoredTicket,
  deleteStoredTickets,
  clearAllStoredTickets,
  generateDATicketId 
} from '../lib/storage';
import { computeElapsedSeconds } from '../lib/stopwatch';
import { 
  syncTicketCreateToSheets, 
  syncStartSupportToSheets, 
  syncResolveToSheets 
} from './sheetsSync';

// Helper to push cloud operations asynchronously without blocking UI
async function pushToCloudApi(body: any): Promise<any> {
  try {
    const res = await fetch('/api/tickets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.warn(`[Cloud Sync] API responded with HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[Cloud Sync] Deferred sync error (offline or local mode):', err.message);
    return null;
  }
}

export const ticketService = {
  /**
   * Fetch all tickets from local storage (immediate render)
   */
  getAllTickets(): Ticket[] {
    const list = loadStoredTickets();
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Synchronize tickets with centralized Cloud Storage (Vercel Blob & Backend)
   * Ensures mobile submissions and laptop admin deck are 100% in sync
   */
  async fetchCloudTickets(): Promise<Ticket[]> {
    try {
      const res = await fetch(`/api/tickets?_t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tickets)) {
          const cloudTickets: Ticket[] = data.tickets;
          const localList = loadStoredTickets();
          const cloudIdSet = new Set(cloudTickets.map(t => (t.ticketId || '').toUpperCase()));

          // Identify any tickets created locally while offline
          const unsyncedLocal = localList.filter(
            t => !cloudIdSet.has((t.ticketId || '').toUpperCase())
          );

          if (unsyncedLocal.length > 0) {
            // Push unsynced local tickets to cloud in background
            pushToCloudApi({ action: 'sync', tickets: unsyncedLocal }).catch(console.warn);
          }

          // Merge cloud & unsynced, sorted latest first
          const merged = [...cloudTickets, ...unsyncedLocal].sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          saveStoredTickets(merged);
          return merged;
        }
      }
    } catch (err: any) {
      console.warn('[Cloud Sync] Failed to fetch cloud tickets, using local fallback:', err.message);
    }

    return this.getAllTickets();
  },

  /**
   * Find single ticket by public ticketId (local + cloud lookup)
   */
  getTicketById(ticketId: string): Ticket | undefined {
    const clean = ticketId.trim().toUpperCase();
    const list = loadStoredTickets();
    return list.find(t => (t.ticketId || '').toUpperCase() === clean);
  },

  /**
   * Fetch single ticket authoritative from cloud (useful for public tracking)
   */
  async fetchTicketById(ticketId: string): Promise<Ticket | undefined> {
    const clean = ticketId.trim().toUpperCase();
    const local = this.getTicketById(clean);

    try {
      const res = await fetch(`/api/tickets?ticketId=${encodeURIComponent(clean)}&_t=${Date.now()}`, {
        cache: 'no-store',
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.ticket) {
          upsertStoredTicket(data.ticket);
          return data.ticket;
        }
      }
    } catch {
      // Return local fallback
    }

    return local;
  },

  /**
   * Create new support ticket from public form (Multi-Device Cloud Synchronized)
   */
  async submitTicket(data: TicketFormData): Promise<Ticket> {
    const nowIso = new Date().toISOString();
    const ticketId = generateDATicketId();

    const newTicket: Ticket = {
      id: `da-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ticketId,
      requesterName: data.fullName.trim(),
      requesterEmail: data.email.trim(),
      requesterPhone: data.mobile.trim(),
      city: data.city?.trim() || undefined,
      userType: data.userType,
      membershipTier: data.membershipTier,
      ecosystem: data.ecosystem,
      category: data.category,
      subject: data.subject.trim(),
      description: data.description.trim(),
      websiteUrl: data.websiteUrl?.trim() || undefined,
      status: 'New',
      priority: (data.membershipTier === 'Diamond Member' || data.membershipTier === 'Diamond Elite' || data.membershipTier === 'PMP Member') ? 'High' : 'Normal',
      assignedSpecialist: data.assignedSpecialist || ((data.category?.includes('Meta') || data.subject?.toLowerCase().includes('meta')) ? 'Onkar Kulkarni' : 'Sachin Sir'),
      assignedAgent: data.assignedSpecialist || ((data.category?.includes('Meta') || data.subject?.toLowerCase().includes('meta')) ? 'Onkar Kulkarni' : 'Sachin Sir'),
      createdAt: nowIso,
      updatedAt: nowIso,
      activeDurationSeconds: 0,
      auditHistory: [
        {
          id: `audit-${Date.now()}`,
          action: 'Ticket Created',
          timestamp: nowIso,
          performedBy: data.fullName,
        },
      ],
    };

    // 1. Store locally for instant offline reliability
    upsertStoredTicket(newTicket);

    // 2. Synchronously push to Cloud Database so Laptop Admin Deck detects it immediately
    try {
      await pushToCloudApi({
        action: 'createTicket',
        ticket: newTicket,
      });
    } catch (err: any) {
      console.warn('Deferred cloud push:', err.message);
    }

    // 3. Sync to Google Sheets in background
    syncTicketCreateToSheets(newTicket).catch(err => {
      console.warn('Deferred sheets sync:', err);
    });

    return newTicket;
  },

  /**
   * Start Support Session (Authoritative Stopwatch & Cloud Synced)
   */
  async startSupport(ticketId: string, agentName: string): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();

    const updatedTicket: Ticket = {
      ...ticket,
      status: 'In Progress',
      assignedAgent: ticket.assignedAgent || agentName,
      supportStartedAt: ticket.supportStartedAt || nowIso,
      updatedAt: nowIso,
      auditHistory: [
        ...(ticket.auditHistory || []),
        {
          id: `audit-${Date.now()}`,
          action: 'Support Session Started',
          timestamp: nowIso,
          performedBy: agentName,
        },
      ],
    };

    upsertStoredTicket(updatedTicket);

    // Push update to cloud
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);

    // Sync to Google Sheets
    syncStartSupportToSheets(ticketId, nowIso).catch(console.warn);

    return updatedTicket;
  },

  /**
   * Resolve Ticket & Record Authoritative Duration
   */
  async resolveTicket(ticketId: string, resolutionNotes: string, agentName: string): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();
    
    // Calculate total duration
    let durationSeconds = ticket.activeDurationSeconds;
    if (ticket.supportStartedAt) {
      durationSeconds = computeElapsedSeconds(ticket.supportStartedAt, nowIso);
    }
    if (durationSeconds <= 0) durationSeconds = 60; // Minimum 1 minute recorded

    const updatedTicket: Ticket = {
      ...ticket,
      status: 'Resolved',
      supportEndedAt: nowIso,
      activeDurationSeconds: durationSeconds,
      resolutionDurationSeconds: durationSeconds,
      resolutionNotes: resolutionNotes.trim(),
      updatedAt: nowIso,
      auditHistory: [
        ...(ticket.auditHistory || []),
        {
          id: `audit-${Date.now()}`,
          action: 'Ticket Resolved',
          timestamp: nowIso,
          performedBy: agentName,
          details: `Resolution duration: ${Math.round(durationSeconds / 60)} minutes`,
        },
      ],
    };

    upsertStoredTicket(updatedTicket);

    // Push update to cloud
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);

    // Sync to Google Sheets
    syncResolveToSheets(updatedTicket, resolutionNotes, nowIso).catch(console.warn);

    return updatedTicket;
  },

  /**
   * Update Status
   */
  async updateStatus(ticketId: string, newStatus: TicketStatus, agentName: string): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();
    const updatedTicket: Ticket = {
      ...ticket,
      status: newStatus,
      updatedAt: nowIso,
      auditHistory: [
        ...(ticket.auditHistory || []),
        {
          id: `audit-${Date.now()}`,
          action: `Status changed to ${newStatus}`,
          timestamp: nowIso,
          performedBy: agentName,
        },
      ],
    };

    upsertStoredTicket(updatedTicket);
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);
    return updatedTicket;
  },

  /**
   * Add Internal Agent Note
   */
  async addInternalNote(ticketId: string, content: string, author: string): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();
    const note = {
      id: `note-${Date.now()}`,
      author,
      content: content.trim(),
      createdAt: nowIso,
    };

    const updatedTicket: Ticket = {
      ...ticket,
      internalNotes: [...(ticket.internalNotes || []), note],
      updatedAt: nowIso,
    };

    upsertStoredTicket(updatedTicket);
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);
    return updatedTicket;
  },

  /**
   * Manual Duration & Details Override
   */
  async manualOverride(
    ticketId: string, 
    data: { 
      status?: TicketStatus; 
      durationSeconds?: number; 
      resolutionNotes?: string;
      agentName: string;
    }
  ): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();
    const updatedTicket: Ticket = {
      ...ticket,
      status: data.status || ticket.status,
      activeDurationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : ticket.activeDurationSeconds,
      resolutionDurationSeconds: data.durationSeconds !== undefined ? data.durationSeconds : ticket.resolutionDurationSeconds,
      resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : ticket.resolutionNotes,
      updatedAt: nowIso,
      auditHistory: [
        ...(ticket.auditHistory || []),
        {
          id: `audit-${Date.now()}`,
          action: 'Manual Timing / Record Override Applied',
          timestamp: nowIso,
          performedBy: data.agentName,
        },
      ],
    };

    upsertStoredTicket(updatedTicket);
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);
    return updatedTicket;
  },

  /**
   * Delete a single ticket (Locally and from Cloud)
   */
  deleteTicket(ticketId: string): void {
    deleteStoredTicket(ticketId);
    pushToCloudApi({ action: 'delete', ticketIds: [ticketId] }).catch(console.warn);
  },

  /**
   * Bulk delete tickets (Locally and from Cloud)
   */
  deleteTickets(ticketIds: string[]): void {
    deleteStoredTickets(ticketIds);
    pushToCloudApi({ action: 'delete', ticketIds }).catch(console.warn);
  },

  /**
   * Reset / clear all tickets (Locally and from Cloud)
   */
  clearAllTickets(): void {
    clearAllStoredTickets();
    pushToCloudApi({ action: 'clearAll' }).catch(console.warn);
  },

  /**
   * Reassign ticket specialist
   */
  async reassignSpecialist(ticketId: string, specialist: string, agentName: string = 'Admin'): Promise<Ticket> {
    const ticket = this.getTicketById(ticketId);
    if (!ticket) throw new Error(`Ticket ${ticketId} not found`);

    const nowIso = new Date().toISOString();
    const updatedTicket: Ticket = {
      ...ticket,
      assignedSpecialist: specialist,
      assignedAgent: specialist,
      updatedAt: nowIso,
      auditHistory: [
        ...(ticket.auditHistory || []),
        {
          id: `audit-${Date.now()}`,
          action: `Reassigned to ${specialist}`,
          timestamp: nowIso,
          performedBy: agentName,
        },
      ],
    };

    upsertStoredTicket(updatedTicket);
    pushToCloudApi({ action: 'update', ticket: updatedTicket }).catch(console.warn);
    return updatedTicket;
  },
};
