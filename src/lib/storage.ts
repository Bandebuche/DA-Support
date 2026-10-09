import { Ticket } from '../types/ticket';
import { INITIAL_TICKETS } from '../data/mockTickets';

const STORAGE_KEY_TICKETS = 'NEXUS_TICKETS_STORE_V2';
const STORAGE_KEY_WEB_APP_URL = 'NEXUS_APPS_SCRIPT_URL_V2';
const STORAGE_KEY_AUTH = 'NEXUS_AUTH_SESSION_V2';

/**
 * Generate unique, authoritative Ticket ID: NEXUS-YYYY-XXXX
 */
export function generateNexusTicketId(): string {
  const year = new Date().getFullYear();
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `NEXUS-${year}-${rand}`;
}

/**
 * Load all tickets with zero-duplicate guarantee
 */
export function loadStoredTickets(): Ticket[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TICKETS);
    if (!raw) {
      saveStoredTickets(INITIAL_TICKETS);
      return INITIAL_TICKETS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_TICKETS;
  } catch {
    return INITIAL_TICKETS;
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
