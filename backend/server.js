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

// Fetch fresh data from Busserz API and save to backend/data/*.json
async function syncBusserzData(targetKey = null) {
  console.log(`[BUSSERZ SYNC] Alert/Initial fetch: Calling Busserz API for ${targetKey || 'all'}...`);
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
      console.log(`[BUSSERZ SYNC] Saved backend/data/products.json (${productsRes.items.length} items)`);
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
      console.log(`[BUSSERZ SYNC] Saved backend/data/menus.json (${menusRes.items.length} items)`);
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

  // GET /api/data?key=products or key=menus
  if (req.method === 'GET' && (url.pathname === '/api/data' || url.pathname === '/busserz/api/data')) {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const filePath = getFilePath(key);
    const flag = readChangeFlag(key);
    let data = readJson(filePath, null);

    // Rule 1: If JSON does not exist OR webhook flagged a change -> Fetch from Busserz API
    if (!data || (flag && flag.changed)) {
      const reason = !data ? 'No JSON file found' : 'Webhook change alert received';
      console.log(`[BUSSERZ] ${reason} for key=${key}. Calling Busserz API...`);
      syncBusserzData(key).then(() => {
        data = readJson(filePath, null);
        sendJson(res, 200, { key, data });
      });
      return;
    }

    // Rule 2: JSON exists and no change alert -> Return cached JSON directly (NO API CALL)
    sendJson(res, 200, { key, data });
    return;
  }

  if (req.method === 'GET' && (url.pathname === '/api/changed' || url.pathname === '/busserz/api/changed')) {
    const key = url.searchParams.get('key');
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const flag = readChangeFlag(key);
    sendJson(res, 200, { key, changed: !!(flag && flag.changed), at: flag?.at ?? null });
    return;
  }

  if (req.method === 'POST' && (url.pathname === '/api/data' || url.pathname === '/busserz/api/data')) {
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

  // WEBHOOK ALERT ENDPOINT:
  // Triggered by Busserz when product or menu updates occur!
  if (url.pathname.includes('/webhook') || url.pathname.includes('/sync')) {
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

      console.log(`[BUSSERZ WEBHOOK] Change alert received from Busserz! Re-fetching updated products and menus...`);
      
      // Mark change flag so backend knows an update occurred
      if (targetKey) {
        setChangeFlag(targetKey, true);
      } else {
        setChangeFlag('products', true);
        setChangeFlag('menus', true);
      }

      sendJson(res, 200, {
        ok: true,
        message: 'Webhook change alert received. Busserz API re-fetch triggered.',
        timestamp: new Date().toISOString()
      });

      // Instantly re-fetch fresh data from Busserz API and update backend/data/*.json
      await syncBusserzData(targetKey);
    });
    return;
  }

  if (req.method === 'DELETE' && (url.pathname === '/api/data' || url.pathname === '/busserz/api/data')) {
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

  if (req.method === 'DELETE' && (url.pathname === '/api/changed' || url.pathname === '/busserz/api/changed')) {
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
  // Perform initial auto-sync if JSON files do not exist
  const productsExist = fs.existsSync(getFilePath('products'));
  const menusExist = fs.existsSync(getFilePath('menus'));
  if (!productsExist || !menusExist) {
    console.log(`[BUSSERZ] Initial startup: JSON files missing. Fetching initial data from Busserz API...`);
    syncBusserzData();
  } else {
    console.log(`[BUSSERZ] Startup: Existing JSON files found in backend/data/. No API calls needed.`);
  }
});
