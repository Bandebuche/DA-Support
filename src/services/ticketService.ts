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

// Live cloud endpoint fallback for Hostinger and static domain hosting
const CLOUD_FALLBACK_BASE = 'https://digital-azadi-support.vercel.app';

function getApiEndpoint(endpoint: string): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname.toLowerCase();
    // If running on Vercel or local dev server, use relative endpoint
    if (host.includes('vercel.app') || host === 'localhost' || host === '127.0.0.1') {
      return endpoint;
    }
  }
  // If deployed to Hostinger (or other static hosting without Node.js backend), connect to live Vercel Cloud API
  return `${CLOUD_FALLBACK_BASE}${endpoint}`;
}

// Multi-tab BroadcastChannel & window CustomEvent for zero-latency local sync
let broadcastChan: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChan = new BroadcastChannel('DA_CLOUD_SYNC');
  }
} catch {
  broadcastChan = null;
}

export function notifyTicketSync(action: 'create' | 'update' | 'delete' | 'clearAll', data: any) {
  try {
    if (broadcastChan) {
      broadcastChan.postMessage({ type: 'TICKET_SYNC', action, data });
    }
  } catch {
    // Ignore BroadcastChannel errors in restrictive environments
  }
  try {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('DA_TICKET_SYNC', { detail: { action, data } }));
    }
  } catch {
    // Ignore CustomEvent errors
  }
}

// Helper to push cloud operations with timeout protection
async function pushToCloudApi(body: any): Promise<any> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(getApiEndpoint('/api/tickets'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`[Cloud Sync] API responded with HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (err: any) {
    console.warn('[Cloud Sync] Cloud push notice:', err.message);
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
   * Uses bidirectional timestamp reconciliation so neither mobile nor desktop overwrites newer work.
   */
  async fetchCloudTickets(): Promise<Ticket[]> {
    try {
      const res = await fetch(getApiEndpoint(`/api/tickets?_t=${Date.now()}`), {
        method: 'GET',
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache, no-store',
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.tickets)) {
          const cloudTickets: Ticket[] = data.tickets;
          const localList = loadStoredTickets();

          const localMap = new Map<string, Ticket>();
          for (const lt of localList) {
            if (lt.ticketId) localMap.set(lt.ticketId.toUpperCase(), lt);
            if (lt.id) localMap.set(lt.id.toUpperCase(), lt);
          }

          const localTicketsToPush: Ticket[] = [];
          const mergedMap = new Map<string, Ticket>();

          // Process cloud tickets against local copies using authoritative timestamps
          for (const ct of cloudTickets) {
            const key = (ct.ticketId || ct.id || '').toUpperCase();
            if (!key) continue;
            const lt = localMap.get(key);
            if (!lt) {
              mergedMap.set(key, ct);
            } else {
              const cloudTime = new Date(ct.updatedAt || ct.createdAt || 0).getTime();
              const localTime = new Date(lt.updatedAt || lt.createdAt || 0).getTime();

              // If local copy is newer than cloud by > 500ms, prioritize local and push it to cloud
              if (localTime > cloudTime + 500) {
                mergedMap.set(key, lt);
                localTicketsToPush.push(lt);
              } else {
                mergedMap.set(key, ct);
              }
            }
          }

          // Retain any locally created tickets that have not yet reached the cloud
          for (const lt of localList) {
            const key = (lt.ticketId || lt.id || '').toUpperCase();
            if (key && !mergedMap.has(key)) {
              mergedMap.set(key, lt);
              localTicketsToPush.push(lt);
            }
          }

          // Push any newer local tickets to cloud in background
          if (localTicketsToPush.length > 0) {
            pushToCloudApi({ action: 'sync', tickets: localTicketsToPush }).catch(console.warn);
          }

          const merged = Array.from(mergedMap.values()).sort(
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
      const res = await fetch(getApiEndpoint(`/api/tickets?ticketId=${encodeURIComponent(clean)}&_t=${Date.now()}`), {
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

    // 1. Store locally for instant UI update
    upsertStoredTicket(newTicket);
    notifyTicketSync('create', newTicket);

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

    // 1. Store locally & notify multi-tab
    upsertStoredTicket(updatedTicket);
    notifyTicketSync('update', updatedTicket);

    // 2. Push update to cloud (awaited for immediate cross-device consistency)
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });

    // 3. Sync to Google Sheets
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

    // 1. Store locally & notify multi-tab
    upsertStoredTicket(updatedTicket);
    notifyTicketSync('update', updatedTicket);

    // 2. Push update to cloud (awaited for immediate cross-device consistency)
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });

    // 3. Sync to Google Sheets
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
    notifyTicketSync('update', updatedTicket);
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });
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
    notifyTicketSync('update', updatedTicket);
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });
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
    notifyTicketSync('update', updatedTicket);
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });
    return updatedTicket;
  },

  /**
   * Delete a single ticket (Locally and from Cloud)
   */
  async deleteTicket(ticketId: string): Promise<void> {
    deleteStoredTicket(ticketId);
    notifyTicketSync('delete', [ticketId]);
    await pushToCloudApi({ action: 'delete', ticketIds: [ticketId] });
  },

  /**
   * Bulk delete tickets (Locally and from Cloud)
   */
  async deleteTickets(ticketIds: string[]): Promise<void> {
    deleteStoredTickets(ticketIds);
    notifyTicketSync('delete', ticketIds);
    await pushToCloudApi({ action: 'delete', ticketIds });
  },

  /**
   * Reset / clear all tickets (Locally and from Cloud)
   */
  async clearAllTickets(): Promise<void> {
    clearAllStoredTickets();
    notifyTicketSync('clearAll', null);
    await pushToCloudApi({ action: 'clearAll' });
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
    notifyTicketSync('update', updatedTicket);
    await pushToCloudApi({ action: 'update', ticket: updatedTicket });
    return updatedTicket;
  },
};
