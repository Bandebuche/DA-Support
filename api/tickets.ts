import { get, put, del } from '@vercel/blob';

const BLOB_PATH = 'da-support/tickets.json';
const BLOB_ORIGIN_URL = 'https://y7xkgb2wwe1xtc5g.public.blob.vercel-storage.com/da-support/tickets.json';

// In-memory hot cache across warm serverless invocations for zero-latency sync
let memoryCache: any[] | null = null;
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

// Read current tickets array from Vercel Blob (direct origin fetch to bypass CDN)
async function readTicketsFromBlob(): Promise<any[]> {
  try {
    // Direct fetch with cache-busting timestamp to bypass Vercel Blob's public CDN cache
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
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          memoryCache = parsed;
          lastCacheUpdate = Date.now();
          return parsed;
        }
      }
    }

    // Fallback: SDK get call
    const result = await get(BLOB_PATH, { access: 'public', useCache: false });
    if (!result || !result.stream) {
      return memoryCache || [];
    }
    const text = await new Response(result.stream as any).text();
    if (!text || !text.trim()) return memoryCache || [];
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      memoryCache = parsed;
      lastCacheUpdate = Date.now();
      return parsed;
    }
    return memoryCache || [];
  } catch (err: any) {
    console.warn('[Vercel Blob] Read note/error:', err.message);
    return memoryCache || [];
  }
}

// Write tickets array to Vercel Blob and update hot memory cache
async function writeTicketsToBlob(tickets: any[]): Promise<boolean> {
  memoryCache = tickets;
  lastCacheUpdate = Date.now();

  try {
    await put(BLOB_PATH, JSON.stringify(tickets), {
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
    // 1. GET: Fetch all tickets or single ticket by ticketId
    if (req.method === 'GET') {
      const tickets = await readTicketsFromBlob();
      const ticketId = req.query?.ticketId as string;

      if (ticketId) {
        const clean = ticketId.trim().toUpperCase();
        const found = tickets.find((t: any) => t.ticketId && t.ticketId.toUpperCase() === clean);
        if (!found) {
          return res.status(404).json({ success: false, error: 'Ticket not found' });
        }
        return res.status(200).json({ success: true, ticket: found, serverTime: new Date().toISOString() });
      }

      return res.status(200).json({
        success: true,
        count: tickets.length,
        tickets,
        serverTime: new Date().toISOString(),
      });
    }

    // 2. POST: Create, Sync, Update, Delete, or Clear
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const action = body.action || (body.ticket ? 'createTicket' : 'sync');
      let tickets = await readTicketsFromBlob();

      // Action: Create single ticket (e.g. from Mobile /submit)
      if (action === 'createTicket') {
        const newTicket = body.ticket || body;
        if (!newTicket || !newTicket.ticketId) {
          return res.status(400).json({ success: false, error: 'Invalid ticket payload' });
        }

        const cleanId = String(newTicket.ticketId).toUpperCase();
        const existingIdx = tickets.findIndex(
          (t: any) => t.ticketId && t.ticketId.toUpperCase() === cleanId
        );

        if (existingIdx >= 0) {
          tickets[existingIdx] = { 
            ...tickets[existingIdx], 
            ...newTicket,
            updatedAt: newTicket.updatedAt || new Date().toISOString(),
          };
        } else {
          tickets.unshift(newTicket);
        }

        await writeTicketsToBlob(tickets);
        return res.status(200).json({
          success: true,
          message: 'Ticket saved to cloud',
          ticket: newTicket,
          count: tickets.length,
          tickets,
        });
      }

      // Action: Update single ticket (Status change, In Progress, Resolved, Notes)
      if (action === 'update' || action === 'updateTicket') {
        const updateData = body.ticket || body;
        const targetId = (updateData.ticketId || updateData.id || '').toUpperCase();
        
        const idx = tickets.findIndex(
          (t: any) => (t.ticketId && t.ticketId.toUpperCase() === targetId) || (t.id && t.id.toUpperCase() === targetId)
        );

        let finalTicket: any;
        if (idx === -1) {
          // If not in array yet, unshift it so update is never lost
          finalTicket = {
            ...updateData,
            updatedAt: updateData.updatedAt || new Date().toISOString(),
          };
          tickets.unshift(finalTicket);
        } else {
          finalTicket = {
            ...tickets[idx],
            ...updateData,
            updatedAt: updateData.updatedAt || new Date().toISOString(),
          };
          tickets[idx] = finalTicket;
        }

        await writeTicketsToBlob(tickets);
        return res.status(200).json({
          success: true,
          message: 'Ticket updated in cloud on-time',
          ticket: finalTicket,
          count: tickets.length,
          tickets,
        });
      }

      // Action: Delete tickets
      if (action === 'delete') {
        const idsToDelete: string[] = Array.isArray(body.ticketIds) 
          ? body.ticketIds.map((id: string) => String(id).toUpperCase())
          : body.ticketId ? [String(body.ticketId).toUpperCase()] : [];

        const idSet = new Set(idsToDelete);
        tickets = tickets.filter(
          (t: any) => !idSet.has((t.id || '').toUpperCase()) && !idSet.has((t.ticketId || '').toUpperCase())
        );

        await writeTicketsToBlob(tickets);
        return res.status(200).json({
          success: true,
          message: `Deleted ${idsToDelete.length} ticket(s) from cloud`,
          count: tickets.length,
          tickets,
        });
      }

      // Action: Clear all tickets (Admin reset)
      if (action === 'clearAll') {
        await writeTicketsToBlob([]);
        return res.status(200).json({
          success: true,
          message: 'All tickets erased from cloud',
          count: 0,
          tickets: [],
        });
      }

      // Action: Sync batch tickets
      if (action === 'sync') {
        const incomingList: any[] = Array.isArray(body.tickets) ? body.tickets : [];
        if (incomingList.length > 0) {
          const map = new Map<string, any>();
          tickets.forEach((t: any) => {
            if (t.ticketId) map.set(t.ticketId.toUpperCase(), t);
          });
          
          incomingList.forEach((t: any) => {
            if (t.ticketId) {
              const clean = t.ticketId.toUpperCase();
              const existing = map.get(clean);
              if (existing) {
                // Keep the one with latest timestamp
                const incTime = new Date(t.updatedAt || t.createdAt || 0).getTime();
                const extTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                if (incTime >= extTime) {
                  map.set(clean, { ...existing, ...t });
                }
              } else {
                map.set(clean, t);
              }
            }
          });

          tickets = Array.from(map.values()).sort(
            (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
          );

          await writeTicketsToBlob(tickets);
        }

        return res.status(200).json({
          success: true,
          message: 'Synced with cloud storage',
          count: tickets.length,
          tickets,
        });
      }

      return res.status(400).json({ success: false, error: `Unknown action: ${action}` });
    }

    // 3. DELETE method
    if (req.method === 'DELETE') {
      const ticketId = req.query?.ticketId as string;
      if (!ticketId) {
        return res.status(400).json({ success: false, error: 'ticketId parameter required' });
      }

      let tickets = await readTicketsFromBlob();
      const clean = ticketId.trim().toUpperCase();
      tickets = tickets.filter(
        (t: any) => (t.ticketId && t.ticketId.toUpperCase() !== clean) && (t.id && t.id.toUpperCase() !== clean)
      );

      await writeTicketsToBlob(tickets);
      return res.status(200).json({
        success: true,
        message: `Ticket ${clean} deleted from cloud`,
        count: tickets.length,
        tickets,
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
