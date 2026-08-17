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
  console.log(`[BUSSERZ SYNC] Fetching fresh data directly from Busserz API for ${targetKey || 'all'}...`);
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

  // Extract key parameter from query or pathname
  const key = url.searchParams.get('key') || 
              (url.pathname.includes('product') ? 'products' : 
               url.pathname.includes('menu') ? 'menus' : null);

  // WEBHOOK ENDPOINT (POST /webhook or POST /api/webhook)
  if (url.pathname.includes('webhook') || url.pathname.includes('sync')) {
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

      console.log(`[BUSSERZ WEBHOOK] Alert received from Busserz! Re-fetching updated products/menus...`);
      
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

      await syncBusserzData(targetKey);
    });
    return;
  }

  // GET DATA: Supports http://localhost:4000?key=products, /api/data?key=products, /busserz/api/data?key=products, etc.
  if (req.method === 'GET' && (key || url.pathname === '/' || url.pathname.includes('data'))) {
    if (!key) {
      sendJson(res, 400, { error: 'Missing key parameter' });
      return;
    }

    const filePath = getFilePath(key);
    const flag = readChangeFlag(key);
    let data = readJson(filePath, null);

    // Rule 1: If JSON file does not exist OR webhook flagged a change -> Fetch from Busserz API
    if (!data || (flag && flag.changed)) {
      const reason = !data ? 'No JSON file found' : 'Webhook change alert received';
      console.log(`[BUSSERZ] ${reason} for key=${key}. Calling Busserz API...`);
      syncBusserzData(key).then(() => {
        data = readJson(filePath, null);
        sendJson(res, 200, { key, data });
      });
      return;
    }

    // Rule 2: JSON exists and no change alert -> Serve cached JSON directly (0 external API calls)
    sendJson(res, 200, { key, data });
    return;
  }

  // POST DATA: Fetch or Save JSON (Supports POST to get products and menus)
  if (req.method === 'POST' && (key || url.pathname === '/' || url.pathname.includes('data') || url.pathname.includes('products') || url.pathname.includes('menus'))) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const targetKey = payload.key || key || (url.pathname.includes('product') ? 'products' : url.pathname.includes('menu') ? 'menus' : null);
        const action = payload.action;
        const data = payload.data;

        // If action is "get" or data is undefined, this POST request is GETTING products/menus data
        if (action === 'get' || data === undefined) {
          if (!targetKey) {
            sendJson(res, 400, { error: 'Missing key parameter' });
            return;
          }

          const filePath = getFilePath(targetKey);
          const flag = readChangeFlag(targetKey);
          let fileData = readJson(filePath, null);

          if (!fileData || (flag && flag.changed)) {
            console.log(`[BUSSERZ POST] Syncing fresh data for key=${targetKey} from API...`);
            await syncBusserzData(targetKey);
            fileData = readJson(filePath, null);
          }

          sendJson(res, 200, { key: targetKey, data: fileData });
          return;
        }

        // Write data if provided
        writeJson(getFilePath(targetKey), data);
        clearChangeFlag(targetKey);
        sendJson(res, 200, { ok: true, key: targetKey, storedAt: new Date().toISOString() });
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    });
    return;
  }

  // DELETE DATA: Purge JSON file
  if (req.method === 'DELETE' && (key || url.pathname === '/' || url.pathname.includes('data'))) {
    if (!key) {
      sendJson(res, 400, { error: 'Missing key' });
      return;
    }

    const filePath = getFilePath(key);
    try {
      fs.unlinkSync(filePath);
    } catch { }
    clearChangeFlag(key);
    console.log(`[BUSSERZ] Deleted backend/data/${key}.json.`);
    sendJson(res, 200, { ok: true, key, message: `Deleted ${key}.json cache.` });
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[BUSSERZ BACKEND ERROR] Port ${port} is already in use by an existing process.`);
    console.error(`To kill the existing process on port ${port}, run: fuser -k ${port}/tcp`);
    process.exit(1);
  } else {
    console.error(`[BUSSERZ BACKEND ERROR]`, err);
  }
});

server.listen(port, () => {
  console.log(`Backend listening on http://localhost:${port}`);
  const productsExist = fs.existsSync(getFilePath('products'));
  const menusExist = fs.existsSync(getFilePath('menus'));
  if (!productsExist || !menusExist) {
    console.log(`[BUSSERZ] Initial startup: JSON files missing. Fetching initial data from Busserz API...`);
    syncBusserzData();
  } else {
    console.log(`[BUSSERZ] Startup: Existing JSON files found in backend/data/. No external API calls needed.`);
  }
});
