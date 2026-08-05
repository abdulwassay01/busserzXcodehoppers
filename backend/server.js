const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.PORT || 4000);
const dataDir = path.join(__dirname, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
    const data = readJson(filePath, null);
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
        // clear change flag since we just updated the persisted data
        clearChangeFlag(key);
        sendJson(res, 200, { ok: true, key, storedAt: new Date().toISOString() });
      } catch (error) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
      }
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
    } catch {
      // ignore if missing
    }
    // also clear change flag
    clearChangeFlag(key);
    sendJson(res, 200, { ok: true, key });
    return;
  }

  if (req.method === 'POST' && url.pathname === '/api/webhook') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        const key = payload.key;
        const changed = payload.changed === undefined ? true : !!payload.changed;
        if (!key) {
          sendJson(res, 400, { error: 'Missing key' });
          return;
        }

        setChangeFlag(key, changed);
        sendJson(res, 200, { ok: true, key, changed });
      } catch (err) {
        sendJson(res, 400, { error: 'Invalid JSON body' });
      }
    });
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
});
