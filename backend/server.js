const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4000);
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const BUSSERZ_API_BASE = process.env.BUSSERZ_API_BASE || 'https://data.busserz.com/v2';
const BUSSERZ_API_KEY = process.env.BUSSERZ_API_KEY || 'Y2tqOjpuAUmjo9Gqsayc1o1KKVSfkXsq';
const BUSSERZ_SPACE_ID = process.env.BUSSERZ_SPACE_ID || 'PK00001002';

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf8');
}

function getFilePath(key) {
  return path.join(dataDir, `${key}.json`);
}

function getChangeFilePath(key) {
  return path.join(dataDir, `change_${key}.json`);
}

function setChangeFlag(key, value) {
  const filePath = getChangeFilePath(key);
  writeJson(filePath, { changed: !!value, at: new Date().toISOString() });
}

function readChangeFlag(key) {
  const filePath = getChangeFilePath(key);
  return readJson(filePath, null);
}

function clearChangeFlag(key) {
  const filePath = getChangeFilePath(key);
  try {
    fs.unlinkSync(filePath);
  } catch {
    // ignore
  }
}

function sendJson(res, statusCode, payload) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(payload));
}

function fetchFromBusserz(pathSegment) {
  return new Promise((resolve) => {
    const url = `${BUSSERZ_API_BASE}/${pathSegment}`;
    const req = https.get(url, {
      headers: {
        'x-bz-api-key': BUSSERZ_API_KEY,
        'x-bz-space-id': BUSSERZ_SPACE_ID,
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(JSON.parse(body));
          } else {
            console.warn(`[BUSSERZ SYNC] API returned status ${res.statusCode} for ${pathSegment}`);
            resolve(null);
          }
        } catch (e) {
          console.warn(`[BUSSERZ SYNC] Failed to parse JSON for ${pathSegment}:`, e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (err) => {
      console.warn(`[BUSSERZ SYNC] HTTPS request error for ${pathSegment}:`, err.message);
      resolve(null);
    });
    req.end();
  });
}

async function syncBusserzData(targetKey = null) {
  console.log(`[BUSSERZ SYNC] Fetching fresh data directly from Busserz API...`);
  const timestamp = new Date().toISOString();

  if (!targetKey || targetKey === 'products' || targetKey.includes('product')) {
    const productsRes = await fetchFromBusserz('products');
    if (productsRes && Array.isArray(productsRes.items)) {
      const payload = {
        data: productsRes.items,
        savedAt: timestamp,
        apiKey: BUSSERZ_API_KEY,
        spaceId: BUSSERZ_SPACE_ID
      };
      writeJson(getFilePath('products'), payload);
      clearChangeFlag('products');
      console.log(`[BUSSERZ SYNC] Successfully updated backend/data/products.json (${productsRes.items.length} items)`);
    }
  }

  if (!targetKey || targetKey === 'menus' || targetKey.includes('menu')) {
    const menusRes = await fetchFromBusserz('menus');
    if (menusRes && Array.isArray(menusRes.items)) {
      const payload = {
        data: menusRes.items,
        savedAt: timestamp,
        apiKey: BUSSERZ_API_KEY,
        spaceId: BUSSERZ_SPACE_ID
      };
      writeJson(getFilePath('menus'), payload);
      clearChangeFlag('menus');
      console.log(`[BUSSERZ SYNC] Successfully updated backend/data/menus.json (${menusRes.items.length} items)`);
    }
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  console.log(`[REQ] ${req.method} ${url.pathname}${url.search}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
      'Access-Control-Allow-Headers': 'Content-Type, Accept',
    });
    res.end();
    return;
  }

  if (req.method === 'GET' && url.pathname === '/health') {
    sendJson(res, 200, { ok: true, service: 'busserz-backend' });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/data') {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const filePath = getFilePath(key);
    let data = readJson(filePath, null);

    // If data file doesn't exist yet, trigger on-demand sync and return fresh data
    if (!data) {
      syncBusserzData(key).then(() => {
        data = readJson(filePath, null);
        sendJson(res, 200, { key, data });
      });
      return;
    }

    sendJson(res, 200, { key, data });
    return;
  }

  if (req.method === 'GET' && url.pathname === '/api/changed') {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const flag = readChangeFlag(key);
    sendJson(res, 200, { key, changed: !!(flag && flag.changed), at: flag?.at ?? null });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/data') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const key = payload.key;
        const data = payload.data;
        if (!key || data === undefined) {
          sendJson(res, 400, { error: 'Missing key or data' });
          return;
        }
        writeJson(getFilePath(key), data);
        clearChangeFlag(key);
        sendJson(res, 200, { ok: true, key, storedAt: new Date().toISOString() });
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // WEBHOOK & MANUAL SYNC ENDPOINTS:
  // Handles POST /api/webhook, GET /api/webhook, POST /api/sync, GET /api/sync
  if (url.pathname.includes('/api/webhook') || url.pathname.includes('/api/sync')) {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      let targetKey = url.searchParams.get('key');
      try {
        if (body) {
          const payload = JSON.parse(body);
          targetKey = payload.key || payload.event || payload.type || targetKey;
        }
      } catch { }

      console.log(`[BUSSERZ WEBHOOK] Webhook received! Triggering automatic sync from Busserz API...`);
      sendJson(res, 200, {
        ok: true,
        message: 'Webhook received. Busserz API data sync triggered.',
        timestamp: new Date().toISOString()
      });

      // Execute sync asynchronously
      await syncBusserzData(targetKey);
    });
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/data') {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const filePath = getFilePath(key);
    try {
      fs.unlinkSync(filePath);
    } catch { }
    clearChangeFlag(key);
    sendJson(res, 200, { ok: true, key });
    return;
  }

  if (req.method === 'DELETE' && url.pathname === '/api/changed') {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }
    clearChangeFlag(key);
    sendJson(res, 200, { ok: true, key });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  // Perform initial auto-sync on server startup so backend/data is populated immediately!
  syncBusserzData();
});
