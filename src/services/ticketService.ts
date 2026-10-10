import { Ticket, TicketFormData, TicketStatus } from '../types/ticket';
import { 
  loadStoredTickets, 
  saveStoredTickets, 
  upsertStoredTicket, 
  generateDATicketId 
} from '../lib/storage';
import { computeElapsedSeconds } from '../lib/stopwatch';
import { 
  syncTicketCreateToSheets, 
  syncStartSupportToSheets, 
  syncResolveToSheets 
} from './sheetsSync';

export const ticketService = {
  /**
   * Fetch all tickets sorted latest first
   */
  getAllTickets(): Ticket[] {
    const list = loadStoredTickets();
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Find single ticket by public ticketId
   */
  getTicketById(ticketId: string): Ticket | undefined {
    const clean = ticketId.trim().toUpperCase();
    const list = loadStoredTickets();
    return list.find(t => t.ticketId.toUpperCase() === clean);
  },

  /**
   * Create new support ticket from public form
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

    // Store locally with zero-duplicate guarantee
    upsertStoredTicket(newTicket);

    // Sync to Google Sheets in background
    syncTicketCreateToSheets(newTicket).catch(err => {
      console.warn('Deferred sheets sync:', err);
    });

    return newTicket;
  },

  /**
   * Start Support Session (Authoritative Stopwatch)
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
    return updatedTicket;
  },
};
