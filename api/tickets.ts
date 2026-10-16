import { get, put } from '@vercel/blob';

const BLOB_PATH = 'da-support/tickets.json';
const BLOB_ORIGIN_URL = 'https://y7xkgb2wwe1xtc5g.public.blob.vercel-storage.com/da-support/tickets.json';

export interface DeletedTicketRecord {
  ticketId: string;
  id?: string;
  deletedAt: string;
  deletedBy: string;
  reason?: string;
  permanent?: boolean;
  snapshot?: any; // Preserved for Recycle Bin / Trash recovery
}

export interface DeletionAuditEntry {
  id: string;
  action: 'DELETE' | 'BULK_DELETE' | 'CLEAR_ALL' | 'CLEAR_OLD' | 'RESTORE' | 'PURGE_TRASH';
  details: string;
  admin: string;
  affectedCount: number;
  ticketIds?: string[];
  timestamp: string;
}

export interface CloudDatabasePayload {
  version: number;
  lastClearedAllAt: string | null;
  tickets: any[];
  deletedTickets: DeletedTicketRecord[];
  auditLog: DeletionAuditEntry[];
}

// In-memory hot cache across warm serverless invocations for zero-latency sync
let memoryCache: CloudDatabasePayload | null = null;
let lastCacheUpdate = 0;

// Helper to set CORS and aggressive zero-cache headers for Vercel CDN
function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Pragma, Cache-Control');
  
  // Explicitly command Vercel Edge & global CDN to NEVER cache or serve stale responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0');
  res.setHeader('CDN-Cache-Control', 'no-store');
  res.setHeader('Vercel-CDN-Cache-Control', 'no-store');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
}

function parseRawBlobData(rawText: string): CloudDatabasePayload {
  if (!rawText || !rawText.trim()) {
    return {
      version: 3,
      lastClearedAllAt: null,
      tickets: [],
      deletedTickets: [],
      auditLog: [],
    };
  }

  try {
    const parsed = JSON.parse(rawText);
    // Backward compatibility: if it was a plain array of tickets
    if (Array.isArray(parsed)) {
      return {
        version: 3,
        lastClearedAllAt: null,
        tickets: parsed,
        deletedTickets: [],
        auditLog: [],
      };
    }

    if (parsed && typeof parsed === 'object') {
      return {
        version: parsed.version || 3,
        lastClearedAllAt: parsed.lastClearedAllAt || null,
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        deletedTickets: Array.isArray(parsed.deletedTickets) ? parsed.deletedTickets : [],
        auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
      };
    }
  } catch (err) {
    console.warn('[Vercel Blob] JSON parse error on raw blob:', err);
  }

  return {
    version: 3,
    lastClearedAllAt: null,
    tickets: [],
    deletedTickets: [],
    auditLog: [],
  };
}

// Read current database structure from Vercel Blob (direct origin fetch to bypass CDN)
async function readDatabaseFromBlob(): Promise<CloudDatabasePayload> {
  try {
    const originFetchUrl = `${BLOB_ORIGIN_URL}?_cb=${Date.now()}`;
    const directRes = await fetch(originFetchUrl, {
      cache: 'no-store',
      headers: {
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache, no-store',
      },
    });

    if (directRes.ok) {
      const text = await directRes.text();
      if (text && text.trim()) {
        const payload = parseRawBlobData(text);
        memoryCache = payload;
        lastCacheUpdate = Date.now();
        return payload;
      }
    }

    // Fallback: SDK get call
    const result = await get(BLOB_PATH, { access: 'public', useCache: false });
    if (!result || !result.stream) {
      return memoryCache || parseRawBlobData('');
    }
    const text = await new Response(result.stream as any).text();
    const payload = parseRawBlobData(text);
    memoryCache = payload;
    lastCacheUpdate = Date.now();
    return payload;
  } catch (err: any) {
    console.warn('[Vercel Blob] Read note/error:', err.message);
    return memoryCache || parseRawBlobData('');
  }
}

// Write database structure to Vercel Blob and update hot memory cache
async function writeDatabaseToBlob(db: CloudDatabasePayload): Promise<boolean> {
  memoryCache = db;
  lastCacheUpdate = Date.now();

  try {
    await put(BLOB_PATH, JSON.stringify(db), {
      access: 'public',
      allowOverwrite: true,
      addRandomSuffix: false,
    });
    return true;
  } catch (err: any) {
    console.error('[Vercel Blob] Write failed:', err.message);
    throw err;
  }
}

export default async function handler(req: any, res: any) {
  setCorsHeaders(res);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. GET: Fetch all active tickets, deleted registry tombstones, and sync state
    if (req.method === 'GET') {
      const db = await readDatabaseFromBlob();
      const ticketId = req.query?.ticketId as string;

      if (ticketId) {
        const clean = ticketId.trim().toUpperCase();
        const found = db.tickets.find((t: any) => 
          (t.ticketId && t.ticketId.toUpperCase() === clean) || (t.id && t.id.toUpperCase() === clean)
        );
        if (!found) {
          const inTrash = db.deletedTickets.find((d: any) => 
            (d.ticketId && d.ticketId.toUpperCase() === clean) || (d.id && d.id.toUpperCase() === clean)
          );
          if (inTrash) {
            return res.status(404).json({ success: false, error: 'Ticket was deleted', isDeleted: true, deletedInfo: inTrash });
          }
          return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        return res.status(200).json({ success: true, ticket: found, serverTime: new Date().toISOString() });
      }

      const deletedIds = db.deletedTickets.map(d => d.ticketId.toUpperCase());

      return res.status(200).json({
        success: true,
        count: db.tickets.length,
        tickets: db.tickets,
        deletedTickets: db.deletedTickets,
        deletedTicketIds: deletedIds,
        lastClearedAllAt: db.lastClearedAllAt,
        auditLog: (db.auditLog || []).slice(0, 50),
        serverTime: new Date().toISOString(),
      });
    }

    // 2. POST: Create, Sync, Update, Delete, Clear, or Restore
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || (body.ticket ? 'createTicket' : 'sync');
      const db = await readDatabaseFromBlob();
      const nowIso = new Date().toISOString();
      const adminName = body.adminName || body.deletedBy || body.clearedBy || body.restoredBy || 'Super Admin';

      // Action: Create single ticket (e.g. from Mobile /submit)
      if (action === 'createTicket') {
        const newTicket = body.ticket || body;
        if (!newTicket || !newTicket.ticketId) {
          return res.status(400).json({ success: false, error: 'Invalid ticket payload' });
        }

        const cleanId = String(newTicket.ticketId).toUpperCase();
        
        // Remove from deletedTickets tombstone if it was ever recorded
        db.deletedTickets = db.deletedTickets.filter(d => d.ticketId.toUpperCase() !== cleanId);

        const existingIdx = db.tickets.findIndex(
          (t: any) => t.ticketId && t.ticketId.toUpperCase() === cleanId
        );

        if (existingIdx >= 0) {
          db.tickets[existingIdx] = { 
            ...db.tickets[existingIdx], 
            ...newTicket,
            updatedAt: newTicket.updatedAt || nowIso,
          };
        } else {
          db.tickets.unshift(newTicket);
        }

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: 'Ticket saved to cloud',
          ticket: newTicket,
          count: db.tickets.length,
          tickets: db.tickets,
        });
      }

      // Action: Update single ticket (Status change, In Progress, Resolved, Notes)
      if (action === 'update' || action === 'updateTicket') {
        const updateData = body.ticket || body;
        const targetId = (updateData.ticketId || updateData.id || '').toUpperCase();
        
        // Don't resurrect if currently deleted, unless explicit restore action
        const isDeleted = db.deletedTickets.some(d => d.ticketId.toUpperCase() === targetId);
        if (isDeleted && action !== 'restore') {
          return res.status(200).json({
            success: false,
            message: 'Ticket is currently deleted in cloud; update ignored.',
            isDeleted: true,
            tickets: db.tickets,
          });
        }

        const idx = db.tickets.findIndex(
          (t: any) => (t.ticketId && t.ticketId.toUpperCase() === targetId) || (t.id && t.id.toUpperCase() === targetId)
        );

        let finalTicket: any;
        if (idx === -1) {
          finalTicket = {
            ...updateData,
            updatedAt: updateData.updatedAt || nowIso,
          };
          db.tickets.unshift(finalTicket);
        } else {
          finalTicket = {
            ...db.tickets[idx],
            ...updateData,
            updatedAt: updateData.updatedAt || nowIso,
          };
          db.tickets[idx] = finalTicket;
        }

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: 'Ticket updated in cloud',
          ticket: finalTicket,
          count: db.tickets.length,
          tickets: db.tickets,
        });
      }

      // Action: Delete tickets (Permanent or Move to Trash with Tombstone)
      if (action === 'delete') {
        const idsToDelete: string[] = Array.isArray(body.ticketIds) 
          ? body.ticketIds.map((id: string) => String(id).toUpperCase())
          : body.ticketId ? [String(body.ticketId).toUpperCase()] : [];

        if (idsToDelete.length === 0) {
          return res.status(400).json({ success: false, error: 'No ticketIds specified for deletion' });
        }

        const idSet = new Set(idsToDelete);
        const reason = body.reason || 'Admin deletion';
        const isPermanent = Boolean(body.permanent);

        // Find targets to snapshot before removal
        const targetTickets = db.tickets.filter(
          (t: any) => idSet.has((t.id || '').toUpperCase()) || idSet.has((t.ticketId || '').toUpperCase())
        );

        // Remove from active tickets
        db.tickets = db.tickets.filter(
          (t: any) => !idSet.has((t.id || '').toUpperCase()) && !idSet.has((t.ticketId || '').toUpperCase())
        );

        // Add or update in deletedTickets (Tombstone Registry)
        for (const target of targetTickets) {
          const tId = target.ticketId.toUpperCase();
          const existingIdx = db.deletedTickets.findIndex(d => d.ticketId.toUpperCase() === tId);
          const record: DeletedTicketRecord = {
            ticketId: target.ticketId,
            id: target.id,
            deletedAt: nowIso,
            deletedBy: adminName,
            reason,
            permanent: isPermanent,
            snapshot: isPermanent ? undefined : target,
          };

          if (existingIdx >= 0) {
            db.deletedTickets[existingIdx] = record;
          } else {
            db.deletedTickets.unshift(record);
          }
        }

        // Also add stubs for any ID not found in current tickets (in case already offline deleted)
        for (const id of idsToDelete) {
          if (!db.deletedTickets.some(d => d.ticketId.toUpperCase() === id)) {
            db.deletedTickets.unshift({
              ticketId: id,
              deletedAt: nowIso,
              deletedBy: adminName,
              reason,
              permanent: isPermanent,
            });
          }
        }

        // Keep maximum 300 recent tombstones
        if (db.deletedTickets.length > 300) {
          db.deletedTickets = db.deletedTickets.slice(0, 300);
        }

        // Add to audit trail
        db.auditLog.unshift({
          id: `audit-${Date.now()}`,
          action: idsToDelete.length > 1 ? 'BULK_DELETE' : 'DELETE',
          details: `Deleted ${idsToDelete.length} ticket(s): ${idsToDelete.slice(0, 5).join(', ')}${idsToDelete.length > 5 ? '...' : ''}`,
          admin: adminName,
          affectedCount: idsToDelete.length,
          ticketIds: idsToDelete,
          timestamp: nowIso,
        });

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: `Deleted ${idsToDelete.length} ticket(s) from cloud with anti-resurrection tombstone`,
          count: db.tickets.length,
          tickets: db.tickets,
          deletedTickets: db.deletedTickets,
        });
      }

      // Action: Clear all tickets (Admin reset)
      if (action === 'clearAll') {
        const count = db.tickets.length;
        const allIds = db.tickets.map(t => t.ticketId);

        // Move all current active tickets into deletedTickets registry (Recycle Bin)
        for (const ticket of db.tickets) {
          const tId = ticket.ticketId.toUpperCase();
          const existingIdx = db.deletedTickets.findIndex(d => d.ticketId.toUpperCase() === tId);
          const record: DeletedTicketRecord = {
            ticketId: ticket.ticketId,
            id: ticket.id,
            deletedAt: nowIso,
            deletedBy: adminName,
            reason: 'Clear All Tickets operation',
            permanent: false,
            snapshot: ticket,
          };
          if (existingIdx >= 0) {
            db.deletedTickets[existingIdx] = record;
          } else {
            db.deletedTickets.unshift(record);
          }
        }

        db.tickets = [];
        db.lastClearedAllAt = nowIso;

        db.auditLog.unshift({
          id: `audit-${Date.now()}`,
          action: 'CLEAR_ALL',
          details: `Cleared all active tickets (${count} items archived to Recycle Bin)`,
          admin: adminName,
          affectedCount: count,
          ticketIds: allIds,
          timestamp: nowIso,
        });

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: 'All tickets cleared from cloud and archived to Recycle Bin',
          count: 0,
          tickets: [],
          deletedTickets: db.deletedTickets,
          deletedTicketIds: db.deletedTickets.map(d => d.ticketId.toUpperCase()),
          lastClearedAllAt: db.lastClearedAllAt,
        });
      }

      // Action: Clear Old Data (Resolved or Older than X days)
      if (action === 'clearOldData') {
        const olderThanDays = typeof body.olderThanDays === 'number' ? body.olderThanDays : null;
        const onlyResolved = Boolean(body.onlyResolved);

        const now = Date.now();
        const cutoffTime = olderThanDays ? now - olderThanDays * 86400000 : null;

        const toDelete: any[] = [];
        const toKeep: any[] = [];

        for (const t of db.tickets) {
          let shouldDelete = false;
          if (onlyResolved && t.status === 'Resolved') {
            shouldDelete = true;
          } else if (cutoffTime && new Date(t.createdAt).getTime() < cutoffTime) {
            shouldDelete = true;
          }

          if (shouldDelete) {
            toDelete.push(t);
          } else {
            toKeep.push(t);
          }
        }

        db.tickets = toKeep;
        for (const t of toDelete) {
          db.deletedTickets.unshift({
            ticketId: t.ticketId,
            id: t.id,
            deletedAt: nowIso,
            deletedBy: adminName,
            reason: `Old data cleanup (${onlyResolved ? 'Resolved' : `${olderThanDays}d+`})`,
            permanent: false,
            snapshot: t,
          });
        }

        db.auditLog.unshift({
          id: `audit-${Date.now()}`,
          action: 'CLEAR_OLD',
          details: `Cleaned up ${toDelete.length} old/resolved ticket(s)`,
          admin: adminName,
          affectedCount: toDelete.length,
          ticketIds: toDelete.map(t => t.ticketId),
          timestamp: nowIso,
        });

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: `Cleaned up ${toDelete.length} old ticket(s)`,
          count: db.tickets.length,
          tickets: db.tickets,
        });
      }

      // Action: Restore tickets from Recycle Bin / Trash
      if (action === 'restore') {
        const idsToRestore: string[] = Array.isArray(body.ticketIds)
          ? body.ticketIds.map((id: string) => String(id).toUpperCase())
          : body.ticketId ? [String(body.ticketId).toUpperCase()] : [];

        const idSet = new Set(idsToRestore);
        const restoredTickets: any[] = [];

        db.deletedTickets = db.deletedTickets.filter(d => {
          const dId = d.ticketId.toUpperCase();
          if (idSet.has(dId)) {
            if (d.snapshot) {
              const revived = {
                ...d.snapshot,
                updatedAt: nowIso,
              };
              restoredTickets.push(revived);
            }
            return false; // remove from deleted registry
          }
          return true;
        });

        for (const r of restoredTickets) {
          const idx = db.tickets.findIndex(t => t.ticketId.toUpperCase() === r.ticketId.toUpperCase());
          if (idx >= 0) {
            db.tickets[idx] = r;
          } else {
            db.tickets.unshift(r);
          }
        }

        db.auditLog.unshift({
          id: `audit-${Date.now()}`,
          action: 'RESTORE',
          details: `Restored ${restoredTickets.length} ticket(s) from Recycle Bin`,
          admin: adminName,
          affectedCount: restoredTickets.length,
          ticketIds: restoredTickets.map(t => t.ticketId),
          timestamp: nowIso,
        });

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: `Restored ${restoredTickets.length} ticket(s) to active queue`,
          count: db.tickets.length,
          tickets: db.tickets,
        });
      }

      // Action: Purge Trash / Permanently Delete
      if (action === 'purgeTrash') {
        const idsToPurge: string[] = Array.isArray(body.ticketIds)
          ? body.ticketIds.map((id: string) => String(id).toUpperCase())
          : [];

        if (idsToPurge.length > 0) {
          const idSet = new Set(idsToPurge);
          db.deletedTickets = db.deletedTickets.map(d => {
            if (idSet.has(d.ticketId.toUpperCase())) {
              return { ...d, snapshot: undefined, permanent: true };
            }
            return d;
          });
        } else {
          // Purge all snapshots from trash
          db.deletedTickets = db.deletedTickets.map(d => ({
            ...d,
            snapshot: undefined,
            permanent: true,
          }));
        }

        db.auditLog.unshift({
          id: `audit-${Date.now()}`,
          action: 'PURGE_TRASH',
          details: idsToPurge.length > 0 ? `Purged ${idsToPurge.length} item(s) from Trash` : 'Emptied all items in Trash',
          admin: adminName,
          affectedCount: idsToPurge.length || db.deletedTickets.length,
          timestamp: nowIso,
        });

        await writeDatabaseToBlob(db);
        return res.status(200).json({
          success: true,
          message: 'Trash purged permanently',
          deletedTickets: db.deletedTickets,
        });
      }

      // Action: Sync batch tickets (With Strict Tombstone Reconciliation)
      if (action === 'sync') {
        const incomingList: any[] = Array.isArray(body.tickets) ? body.tickets : [];
        if (incomingList.length > 0) {
          const deletedSet = new Set(db.deletedTickets.map(d => d.ticketId.toUpperCase()));
          const clearCutoff = db.lastClearedAllAt ? new Date(db.lastClearedAllAt).getTime() : 0;

          const map = new Map<string, any>();
          db.tickets.forEach((t: any) => {
            if (t.ticketId) map.set(t.ticketId.toUpperCase(), t);
          });
          
          incomingList.forEach((t: any) => {
            if (!t || !t.ticketId) return;
            const clean = t.ticketId.toUpperCase();

            // STRICT ANTI-RESURRECTION: Never accept a ticket that was deleted or cleared!
            if (deletedSet.has(clean)) return;
            if (clearCutoff && t.createdAt && new Date(t.createdAt).getTime() <= clearCutoff) return;

            const existing = map.get(clean);
            if (existing) {
              const incTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
              const extTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
              if (incTime >= extTime) {
                map.set(clean, { ...existing, ...t });
              }
            } else {
              map.set(clean, t);
            }
          });

          db.tickets = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          await writeDatabaseToBlob(db);
        }

        return res.status(200).json({
          success: true,
          message: 'Synced with cloud storage',
          count: db.tickets.length,
          tickets: db.tickets,
          deletedTicketIds: db.deletedTickets.map(d => d.ticketId.toUpperCase()),
          lastClearedAllAt: db.lastClearedAllAt,
        });
      }

      return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
    }

    // 3. DELETE method: Deletes single ticket with tombstone
    if (req.method === 'DELETE') {
      const ticketId = req.query?.ticketId as string;
      if (!ticketId) {
        return res.status(400).json({ success: false, error: 'ticketId parameter required' });
      }

      const db = await readDatabaseFromBlob();
      const clean = ticketId.trim().toUpperCase();
      const nowIso = new Date().toISOString();

      const target = db.tickets.find((t: any) => 
        (t.ticketId && t.ticketId.toUpperCase() === clean) || (t.id && t.id.toUpperCase() === clean)
      );

      db.tickets = db.tickets.filter((t: any) => 
        (t.ticketId && t.ticketId.toUpperCase() !== clean) && (t.id && t.id.toUpperCase() !== clean)
      );

      db.deletedTickets.unshift({
        ticketId: clean,
        id: target?.id,
        deletedAt: nowIso,
        deletedBy: 'Admin (DELETE HTTP)',
        reason: 'HTTP DELETE request',
        permanent: false,
        snapshot: target,
      });

      await writeDatabaseToBlob(db);
      return res.status(200).json({
        success: true,
        message: `Ticket ${clean} deleted from cloud with tombstone`,
        count: db.tickets.length,
        tickets: db.tickets,
      });
    }

    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  } catch (err: any) {
    console.error('API Error in /api/tickets:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Internal server error',
    });
  }
}
