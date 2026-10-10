/**
 * Digital Azadi Support - Production Local Server
 * Zero-dependency native Node.js HTTP server (works without npm install)
 * Supports clean URL routing:
 *  - /         -> index.html
 *  - /submit   -> submit.html
 *  - /admin    -> admin.html
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=UTF-8'
};

const server = http.createServer((req, res) => {
  // Parse clean URL pathname
  let reqPath = req.url.split('?')[0];

  // Handle /api/tickets REST API
  if (reqPath.startsWith('/api/tickets')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=UTF-8');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    const dataDir = path.join(ROOT_DIR, 'data');
    const dataFile = path.join(dataDir, 'tickets.json');

    const readLocalDb = () => {
      try {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        if (!fs.existsSync(dataFile)) {
          fs.writeFileSync(dataFile, '[]', 'utf8');
          return [];
        }
        return JSON.parse(fs.readFileSync(dataFile, 'utf8') || '[]');
      } catch {
        return [];
      }
    };

    const writeLocalDb = (data) => {
      try {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
      } catch (err) {
        console.error('Failed to write tickets.json:', err);
      }
    };

    if (req.method === 'GET') {
      const tickets = readLocalDb();
      res.writeHead(200);
      res.end(JSON.stringify({ success: true, count: tickets.length, tickets }));
      return;
    }

    if (req.method === 'POST') {
      let bodyStr = '';
      req.on('data', chunk => { bodyStr += chunk; });
      req.on('end', () => {
        try {
          const body = JSON.parse(bodyStr || '{}');
          let tickets = readLocalDb();
          const action = body.action || 'sync';

          if (action === 'createTicket') {
            const newTicket = body.ticket || body;
            const idx = tickets.findIndex(t => t.ticketId === newTicket.ticketId);
            if (idx >= 0) tickets[idx] = newTicket;
            else tickets.unshift(newTicket);
            writeLocalDb(tickets);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, ticket: newTicket, count: tickets.length }));
            return;
          }

          if (action === 'update' || action === 'updateTicket') {
            const updateTicket = body.ticket || body;
            const idx = tickets.findIndex(t => t.ticketId === updateTicket.ticketId);
            if (idx >= 0) {
              tickets[idx] = { ...tickets[idx], ...updateTicket };
              writeLocalDb(tickets);
            }
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, ticket: tickets[idx] }));
            return;
          }

          if (action === 'delete') {
            const delIds = new Set((body.ticketIds || [body.ticketId]).map(String));
            tickets = tickets.filter(t => !delIds.has(String(t.ticketId)));
            writeLocalDb(tickets);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: tickets.length, tickets }));
            return;
          }

          if (action === 'clearAll') {
            writeLocalDb([]);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: 0, tickets: [] }));
            return;
          }

          if (action === 'sync') {
            const incoming = Array.isArray(body.tickets) ? body.tickets : [];
            const map = new Map();
            tickets.forEach(t => map.set(t.ticketId, t));
            incoming.forEach(t => map.set(t.ticketId, { ...(map.get(t.ticketId) || {}), ...t }));
            tickets = Array.from(map.values());
            writeLocalDb(tickets);
            res.writeHead(200);
            res.end(JSON.stringify({ success: true, count: tickets.length, tickets }));
            return;
          }

          res.writeHead(400);
          res.end(JSON.stringify({ success: false, error: 'Unknown action' }));
        } catch (e) {
          res.writeHead(500);
          res.end(JSON.stringify({ success: false, error: e.message }));
        }
      });
      return;
    }
  }

  // Route aliases
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  } else if (reqPath === '/submit' || reqPath === '/submit/') {
    reqPath = '/submit.html';
  } else if (reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = '/admin.html';
  }

  // Safe file path resolution
  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  let filePath = path.join(ROOT_DIR, safePath);

  // If directory requested, check for index.html
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // If file does not exist, try with .html extension
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath = filePath + '.html';
  }

  // Check file existence
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>404 - Not Found</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2 style="color: #0B2545;">404 - Page Not Found</h2>
          <p>Requested URL: <code>${req.url}</code></p>
          <p><a href="/" style="color: #FF6F00; font-weight: bold;">Return to Digital Azadi Hub</a></p>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // CORS & Cache headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

function startServer(port) {
  server.listen(port, () => {
    console.log(`\n======================================================`);
    console.log(`  DIGITAL AZADI SUPPORT - DUAL-PORTAL SERVER ACTIVE`);
    console.log(`======================================================`);
    console.log(`  🌐 Central Hub:        http://localhost:${port}/`);
    console.log(`  📝 Public Portal:      http://localhost:${port}/submit`);
    console.log(`  🛡️ SLA Ops Dashboard:  http://localhost:${port}/admin`);
    console.log(`======================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying port ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
