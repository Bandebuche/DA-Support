import { Ticket } from '../types/ticket';
import { getSavedAppsScriptUrl } from '../lib/storage';
import { formatISTDate, formatISTTime, formatISTFull } from '../lib/timezone';
import { formatHHMM } from '../lib/stopwatch';

/**
 * GOOGLE SHEETS CLOUD SYNCHRONIZATION SERVICE
 * Connects to Google Apps Script Web App deployed for Technical_Support_DB
 * Spreadsheet ID: 16D1TXnUvGxPhp6YDwq9l0rCoBXnTwsDAHOe-0Z5uu1k
 */

export interface SyncResponse {
  success: boolean;
  message?: string;
  serverTimeIST?: string;
  error?: string;
}

/**
 * Checks if a live Web App URL is configured
 */
export function isLiveSheetsConnected(): boolean {
  const url = getSavedAppsScriptUrl();
  return Boolean(url && url.startsWith('http'));
}

/**
 * Sync Ticket Creation to Google Sheets
 */
export async function syncTicketCreateToSheets(ticket: Ticket): Promise<SyncResponse> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) {
    return { success: true, message: 'Saved locally (Sheets Web App not configured)' };
  }

  const payload = {
    action: 'createTicket',
    ticketId: ticket.ticketId,
    submissionDate: formatISTDate(ticket.createdAt),
    submissionTime: formatISTTime(ticket.createdAt),
    fullName: ticket.requesterName,
    mobileNumber: ticket.requesterPhone,
    emailAddress: ticket.requesterEmail,
    userCategory: ticket.userType === 'Franchise Hub' ? 'Franchise' : 'Student',
    membershipType: ticket.membershipTier,
    city: ticket.city || '',
    platform: ticket.ecosystem,
    queryDescription: `${ticket.subject ? `[${ticket.subject}] ` : ''}${ticket.description}`,
    currentStatus: ticket.status,
    supportStartTime: '',
    supportEndTime: '',
    totalTimeTaken: '',
    remarks: ticket.city ? `City: ${ticket.city}` : '',
    lastUpdated: formatISTFull(ticket.updatedAt),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Avoid CORS preflight in Apps Script
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    return {
      success: Boolean(data && data.success),
      message: data.message || 'Synced to Google Sheet',
    };
  } catch (err: any) {
    console.warn('Google Sheets sync deferred:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sync Support Start Event to Google Sheets
 */
export async function syncStartSupportToSheets(ticketId: string, startedAtUtc: string): Promise<SyncResponse> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) {
    return { success: true, message: 'Updated locally' };
  }

  const payload = {
    action: 'startSupport',
    ticketId,
    supportStartTime: formatISTTime(startedAtUtc),
    lastUpdated: formatISTFull(startedAtUtc),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { success: Boolean(data && data.success), message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Sync Resolution Event to Google Sheets
 */
export async function syncResolveToSheets(
  ticket: Ticket,
  resolutionNotes: string,
  endedAtUtc: string
): Promise<SyncResponse> {
  const url = getSavedAppsScriptUrl();
  if (!url || !url.startsWith('http')) {
    return { success: true, message: 'Resolved locally' };
  }

  const durationStr = formatHHMM(ticket.activeDurationSeconds);

  const payload = {
    action: 'completeSupport',
    ticketId: ticket.ticketId,
    currentStatus: 'Done',
    supportStartTime: ticket.supportStartedAt ? formatISTTime(ticket.supportStartedAt) : formatISTTime(endedAtUtc),
    supportEndTime: formatISTTime(endedAtUtc),
    totalTimeTaken: durationStr,
    remarks: resolutionNotes,
    lastUpdated: formatISTFull(endedAtUtc),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { success: Boolean(data && data.success), message: data.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Test connectivity with Apps Script Web App
 */
export async function testSheetsConnection(url: string): Promise<{ success: boolean; message: string }> {
  if (!url || !url.startsWith('http')) {
    return { success: false, message: 'Invalid URL. Must begin with https://' };
  }

  try {
    const res = await fetch(`${url}?action=ping&_t=${Date.now()}`);
    const data = await res.json();
    if (data && data.success) {
      return { 
        success: true, 
        message: `Connected! Server IST: ${data.serverTimeIST || 'Verified'}` 
      };
    }
    return { success: false, message: data.error || 'Unexpected server response' };
  } catch (err: any) {
    return { success: false, message: `Connection failed: ${err.message}` };
  }
}
