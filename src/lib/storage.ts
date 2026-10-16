import { Ticket } from '../types/ticket';
import { INITIAL_TICKETS } from '../data/mockTickets';

const STORAGE_KEY_TICKETS = 'DA_SUPPORT_TICKETS_V2';
const STORAGE_KEY_WEB_APP_URL = 'DA_SUPPORT_APPS_SCRIPT_URL_V2';
const STORAGE_KEY_AUTH = 'DA_SUPPORT_AUTH_SESSION_V2';
const STORAGE_KEY_DELETED_TICKETS = 'DA_SUPPORT_DELETED_TICKETS_V3';
const STORAGE_KEY_LAST_CLEARED_AT = 'DA_SUPPORT_LAST_CLEARED_AT_V3';
const STORAGE_KEY_DELETION_AUDIT_LOG = 'DA_SUPPORT_DELETION_AUDIT_LOG_V3';

export interface StoredDeletedTicket {
  ticketId: string;
  id?: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  permanent?: boolean;
  snapshot?: Ticket;
}

export interface StoredDeletionAudit {
  id: string;
  action: 'DELETE' | 'BULK_DELETE' | 'CLEAR_ALL' | 'CLEAR_OLD' | 'RESTORE' | 'PURGE_TRASH';
  details: string;
  admin: string;
  affectedCount: number;
  ticketIds?: string[];
  timestamp: string;
}

/**
 * Generate unique, authoritative Ticket ID: DA-YYYY-XXXX
 */
export function generateDATicketId(): string {
  const year = new Date().getFullYear();
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DA-${year}-${rand}`;
}

/**
 * Get Last Cleared All timestamp
 */
export function getLastClearedAllAt(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY_LAST_CLEARED_AT);
  } catch {
    return null;
  }
}

/**
 * Set Last Cleared All timestamp
 */
export function setLastClearedAllAt(isoString: string | null): void {
  try {
    if (isoString) {
      localStorage.setItem(STORAGE_KEY_LAST_CLEARED_AT, isoString);
    } else {
      localStorage.removeItem(STORAGE_KEY_LAST_CLEARED_AT);
    }
  } catch (err) {
    console.error('Failed to set lastClearedAllAt in localStorage:', err);
  }
}

/**
 * Load Deleted Tickets (Recycle Bin / Tombstone Registry)
 */
export function loadDeletedTickets(): StoredDeletedTicket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETED_TICKETS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save Deleted Tickets (Recycle Bin / Tombstone Registry)
 */
export function saveDeletedTickets(deletedList: StoredDeletedTicket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DELETED_TICKETS, JSON.stringify(deletedList.slice(0, 300)));
  } catch (err) {
    console.error('Failed to save deleted tickets to localStorage:', err);
  }
}

/**
 * Load Deletion Audit Trail
 */
export function loadDeletionAuditLog(): StoredDeletionAudit[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DELETION_AUDIT_LOG);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Append Deletion Audit Entry
 */
export function addDeletionAuditEntry(
  action: StoredDeletionAudit['action'],
  details: string,
  admin: string,
  affectedCount: number,
  ticketIds?: string[]
): void {
  try {
    const current = loadDeletionAuditLog();
    const entry: StoredDeletionAudit = {
      id: `audit-${Date.now()}`,
      action,
      details,
      admin: admin || 'Admin',
      affectedCount,
      ticketIds,
      timestamp: new Date().toISOString(),
    };
    current.unshift(entry);
    localStorage.setItem(STORAGE_KEY_DELETION_AUDIT_LOG, JSON.stringify(current.slice(0, 100)));
  } catch (err) {
    console.error('Failed to append deletion audit log:', err);
  }
}

/**
 * Load all active tickets with zero-duplicate and anti-resurrection guarantees
 */
export function loadStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Build tombstone set from deleted tickets
    const deletedList = loadDeletedTickets();
    const deletedSet = new Set<string>();
    for (const d of deletedList) {
      if (d.ticketId) deletedSet.add(d.ticketId.toUpperCase());
      if (d.id) deletedSet.add(d.id.toUpperCase());
    }

    const lastCleared = getLastClearedAllAt();
    const clearCutoff = lastCleared ? new Date(lastCleared).getTime() : 0;

    // Filter out any tickets that were deleted or created before clearAll
    const valid = parsed.filter(t => {
      if (!t) return false;
      const tKey = (t.ticketId || '').toUpperCase();
      const idKey = (t.id || '').toUpperCase();
      if (tKey && deletedSet.has(tKey)) return false;
      if (idKey && deletedSet.has(idKey)) return false;
      if (clearCutoff && t.createdAt && new Date(t.createdAt).getTime() <= clearCutoff) return false;
      return true;
    });

    // If any items were purged, save the cleaned array back
    if (valid.length !== parsed.length) {
      saveStoredTickets(valid);
    }

    return valid;
  } catch {
    return [];
  }
}

/**
 * Save active tickets to localStorage
 */
export function saveStoredTickets(tickets: Ticket[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(tickets));
  } catch (err) {
    console.error('Failed to save tickets to localStorage:', err);
  }
}

/**
 * Upsert a single ticket by ticketId (Zero Duplicate Guarantee)
 */
export function upsertStoredTicket(ticket: Ticket): Ticket[] {
  const current = loadStoredTickets();
  const cleanId = ticket.ticketId.toUpperCase();

  // If this ticket was in deleted tickets, remove it from deleted list since it's actively created/restored
  const deletedList = loadDeletedTickets();
  const filteredDeleted = deletedList.filter(d => d.ticketId.toUpperCase() !== cleanId && (!d.id || d.id.toUpperCase() !== cleanId));
  if (filteredDeleted.length !== deletedList.length) {
    saveDeletedTickets(filteredDeleted);
  }

  const index = current.findIndex(t => t.ticketId.toUpperCase() === cleanId);

  if (index >= 0) {
    current[index] = {
      ...current[index],
      ...ticket,
      updatedAt: new Date().toISOString(),
    };
  } else {
    current.unshift(ticket);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('DA_NEW_TICKET', { detail: ticket }));
    }
  }

  saveStoredTickets(current);
  return current;
}

/**
 * Record a local deletion in the Tombstone Registry / Recycle Bin
 */
export function recordLocalDeletion(
  ticket: Ticket, 
  deletedBy: string = 'Admin', 
  reason: string = 'Manual deletion', 
  permanent: boolean = false
): void {
  const deletedList = loadDeletedTickets();
  const cleanId = ticket.ticketId.toUpperCase();
  const filtered = deletedList.filter(d => d.ticketId.toUpperCase() !== cleanId);

  filtered.unshift({
    ticketId: ticket.ticketId,
    id: ticket.id,
    deletedAt: new Date().toISOString(),
    deletedBy,
    reason,
    permanent,
    snapshot: permanent ? undefined : ticket,
  });

  saveDeletedTickets(filtered);
  addDeletionAuditEntry('DELETE', `Deleted ticket ${ticket.ticketId}`, deletedBy, 1, [ticket.ticketId]);
}

/**
 * Record multiple local deletions in the Tombstone Registry / Recycle Bin
 */
export function recordLocalDeletions(
  tickets: Ticket[], 
  deletedBy: string = 'Admin', 
  reason: string = 'Bulk deletion', 
  permanent: boolean = false
): void {
  const deletedList = loadDeletedTickets();
  const ticketIdSet = new Set(tickets.map(t => t.ticketId.toUpperCase()));
  const filtered = deletedList.filter(d => !ticketIdSet.has(d.ticketId.toUpperCase()));
  const now = new Date().toISOString();

  for (const t of tickets) {
    filtered.unshift({
      ticketId: t.ticketId,
      id: t.id,
      deletedAt: now,
      deletedBy,
      reason,
      permanent,
      snapshot: permanent ? undefined : t,
    });
  }

  saveDeletedTickets(filtered);
  addDeletionAuditEntry('BULK_DELETE', `Bulk deleted ${tickets.length} tickets`, deletedBy, tickets.length, tickets.map(t => t.ticketId));
}

/**
 * Delete a single ticket by ID
 */
export function deleteStoredTicket(ticketId: string, deletedBy: string = 'Admin', reason?: string): Ticket[] {
  const current = loadStoredTickets();
  const clean = ticketId.trim().toUpperCase();
  const target = current.find(t => t.id === ticketId || t.ticketId.toUpperCase() === clean);
  
  if (target) {
    recordLocalDeletion(target, deletedBy, reason || 'Individual record deletion');
  } else {
    // Add stub tombstone so it's never synced from cloud
    const deletedList = loadDeletedTickets();
    deletedList.unshift({
      ticketId: clean,
      deletedAt: new Date().toISOString(),
      deletedBy,
      reason: reason || 'Individual record deletion stub',
    });
    saveDeletedTickets(deletedList);
  }

  const filtered = current.filter(t => t.id !== ticketId && t.ticketId.toUpperCase() !== clean);
  saveStoredTickets(filtered);
  return filtered;
}

/**
 * Bulk delete tickets by IDs
 */
export function deleteStoredTickets(ticketIds: string[], deletedBy: string = 'Admin', reason?: string): Ticket[] {
  const set = new Set(ticketIds.map(id => id.toUpperCase()));
  const current = loadStoredTickets();
  const targets = current.filter(t => set.has(t.id.toUpperCase()) || set.has(t.ticketId.toUpperCase()));
  
  if (targets.length > 0) {
    recordLocalDeletions(targets, deletedBy, reason || 'Bulk deletion');
  }

  const filtered = current.filter(t => !set.has(t.id.toUpperCase()) && !set.has(t.ticketId.toUpperCase()));
  saveStoredTickets(filtered);
  return filtered;
}

/**
 * Reset / Clear all tickets
 */
export function clearAllStoredTickets(clearedBy: string = 'Admin', reason: string = 'Clear All Tickets'): Ticket[] {
  const current = loadStoredTickets();
  if (current.length > 0) {
    recordLocalDeletions(current, clearedBy, reason);
  }

  const nowIso = new Date().toISOString();
  setLastClearedAllAt(nowIso);
  saveStoredTickets([]);
  addDeletionAuditEntry('CLEAR_ALL', `Cleared all active tickets (${current.length} archived to Recycle Bin)`, clearedBy, current.length);
  return [];
}

/**
 * Restore a deleted ticket from the Recycle Bin
 */
export function restoreStoredDeletedTicket(ticketId: string, restoredBy: string = 'Admin'): Ticket | null {
  const cleanId = ticketId.toUpperCase();
  const deletedList = loadDeletedTickets();
  const target = deletedList.find(d => d.ticketId.toUpperCase() === cleanId);

  if (!target || !target.snapshot) {
    return null;
  }

  // Remove from deleted list
  const filtered = deletedList.filter(d => d.ticketId.toUpperCase() !== cleanId);
  saveDeletedTickets(filtered);

  // Restore snapshot with updated timestamp
  const revived: Ticket = {
    ...target.snapshot,
    updatedAt: new Date().toISOString(),
  };

  upsertStoredTicket(revived);
  addDeletionAuditEntry('RESTORE', `Restored ticket ${target.ticketId} from Recycle Bin`, restoredBy, 1, [target.ticketId]);
  return revived;
}

/**
 * Permanently purge a deleted ticket from the Recycle Bin
 */
export function purgeStoredDeletedTicket(ticketId: string, adminName: string = 'Admin'): void {
  const cleanId = ticketId.toUpperCase();
  const deletedList = loadDeletedTickets();
  const updated = deletedList.map(d => {
    if (d.ticketId.toUpperCase() === cleanId) {
      return { ...d, snapshot: undefined, permanent: true };
    }
    return d;
  });
  saveDeletedTickets(updated);
  addDeletionAuditEntry('PURGE_TRASH', `Permanently purged ticket ${ticketId}`, adminName, 1, [ticketId]);
}

/**
 * Permanently purge all items in the Recycle Bin
 */
export function purgeAllStoredDeletedTickets(adminName: string = 'Admin'): void {
  const deletedList = loadDeletedTickets();
  const count = deletedList.length;
  // Retain tombstone stubs without full snapshots to maintain anti-resurrection protection
  const stubs = deletedList.map(d => ({
    ...d,
    snapshot: undefined,
    permanent: true,
  }));
  saveDeletedTickets(stubs);
  addDeletionAuditEntry('PURGE_TRASH', `Emptied Recycle Bin (${count} items purged)`, adminName, count);
}

/**
 * Get configured Google Apps Script Webhook URL
 */
export function getSavedAppsScriptUrl(): string {
  return localStorage.getItem(STORAGE_KEY_WEB_APP_URL) || '';
}

/**
 * Save Google Apps Script Webhook URL
 */
export function saveAppsScriptUrl(url: string): void {
  if (url) {
    localStorage.setItem(STORAGE_KEY_WEB_APP_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_WEB_APP_URL);
  }
}

const STORAGE_KEY_SPREADSHEET_URL = 'DIGITAL_AZADI_SPREADSHEET_URL';

/**
 * Get configured Google Spreadsheet URL
 */
export function getSavedSpreadsheetUrl(): string {
  return localStorage.getItem(STORAGE_KEY_SPREADSHEET_URL) || 'https://docs.google.com/spreadsheets/d/16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k/edit#gid=1624538793';
}

/**
 * Save Google Spreadsheet URL
 */
export function saveSpreadsheetUrl(url: string): void {
  if (url) {
    localStorage.setItem(STORAGE_KEY_SPREADSHEET_URL, url.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_SPREADSHEET_URL);
  }
}

/**
 * Role-Based Admin Session Types
 */
export type AdminRole = 'super_admin' | 'meta_lead';

export interface AdminUserSession {
  username: string;
  name: string;
  role: AdminRole;
  title: string;
  avatar: string;
}

const STORAGE_KEY_AUTH_USER = 'DA_SUPPORT_AUTH_USER_V2';

export const DEFAULT_SACHIN_USER: AdminUserSession = {
  username: 'sachin',
  name: 'Sachin Sir',
  role: 'super_admin',
  title: 'Super Admin',
  avatar: 'SS',
};

export const DEFAULT_ONKAR_USER: AdminUserSession = {
  username: 'onkar',
  name: 'Onkar Kulkarni',
  role: 'meta_lead',
  title: 'Meta Specialist Lead',
  avatar: 'OK',
};

/**
 * Session auth helpers
 */
export function isUserAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
}

export function setUserAuthenticated(auth: boolean): void {
  if (auth) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    if (!sessionStorage.getItem(STORAGE_KEY_AUTH_USER)) {
      sessionStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(DEFAULT_SACHIN_USER));
    }
  } else {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}

export function getAuthenticatedUser(): AdminUserSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) return JSON.parse(raw);
    if (isUserAuthenticated()) return DEFAULT_SACHIN_USER;
    return null;
  } catch {
    return isUserAuthenticated() ? DEFAULT_SACHIN_USER : null;
  }
}

export function setAuthenticatedUser(user: AdminUserSession | null): void {
  if (user) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    sessionStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(user));
  } else {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    sessionStorage.removeItem(STORAGE_KEY_AUTH_USER);
  }
}
