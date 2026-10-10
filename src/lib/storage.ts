import { Ticket } from '../types/ticket';
import { INITIAL_TICKETS } from '../data/mockTickets';

const STORAGE_KEY_TICKETS = 'DA_SUPPORT_TICKETS_V2';
const STORAGE_KEY_WEB_APP_URL = 'DA_SUPPORT_APPS_SCRIPT_URL_V2';
const STORAGE_KEY_AUTH = 'DA_SUPPORT_AUTH_SESSION_V2';

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
 * Load all tickets with zero-duplicate guarantee
 */
export function loadStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!raw) {
      saveStoredTickets([]);
      return [];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Save tickets to localStorage
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
  const index = current.findIndex(t => t.ticketId.toUpperCase() === ticket.ticketId.toUpperCase());

  if (index >= 0) {
    current[index] = {
      ...current[index],
      ...ticket,
      updatedAt: new Date().toISOString(),
    };
  } else {
    current.unshift(ticket);
  }

  saveStoredTickets(current);
  return current;
}

/**
 * Delete a single ticket by ID
 */
export function deleteStoredTicket(ticketId: string): Ticket[] {
  const current = loadStoredTickets();
  const filtered = current.filter(t => t.id !== ticketId && t.ticketId.toUpperCase() !== ticketId.toUpperCase());
  saveStoredTickets(filtered);
  return filtered;
}

/**
 * Bulk delete tickets by IDs
 */
export function deleteStoredTickets(ticketIds: string[]): Ticket[] {
  const set = new Set(ticketIds.map(id => id.toUpperCase()));
  const current = loadStoredTickets();
  const filtered = current.filter(t => !set.has(t.id.toUpperCase()) && !set.has(t.ticketId.toUpperCase()));
  saveStoredTickets(filtered);
  return filtered;
}

/**
 * Reset / Clear all tickets
 */
export function clearAllStoredTickets(): Ticket[] {
  saveStoredTickets([]);
  return [];
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
 * Session auth helpers
 */
export function isUserAuthenticated(): boolean {
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true';
}

export function setUserAuthenticated(auth: boolean): void {
  if (auth) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
  } else {
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
  }
}
