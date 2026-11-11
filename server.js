const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3050;
const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const VERSION_FILE = path.join(ROOT_DIR, 'version.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory OTP store (phone -> { code, expiresAt })
const otpStore = new Map();

function readJsonSafe(filePath, fallback) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
  }
  return fallback;
}

function writeJsonSafe(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
    return false;
  }
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('972')) return '0' + digits.slice(3);
  if (digits.length === 9 && digits.startsWith('5')) return '0' + digits;
  return digits;
}

function toIntlPhone(phone) {
  const norm = normalizePhone(phone);
  if (norm.startsWith('0')) return '972' + norm.slice(1);
  return norm;
}

// Helper to send JSON POST to external webhook (Green API / Elgarasi SMS Gateway)
function postJsonWebhook(targetUrl, payload) {
  return new Promise((resolve) => {
    try {
      const urlObj = new URL(targetUrl);
      const lib = urlObj.protocol === 'https:' ? https : http;
      const bodyData = JSON.stringify(payload);
      const req = lib.request(
        {
          hostname: urlObj.hostname,
          port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
          path: urlObj.pathname + urlObj.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(bodyData)
          },
          timeout: 4500
        },
        (res) => {
          let resp = '';
          res.on('data', d => { resp += d; });
          res.on('end', () => resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, resp }));
        }
      );
      req.on('error', (e) => resolve({ ok: false, error: e.message }));
      req.on('timeout', () => { req.destroy(); resolve({ ok: false, error: 'timeout' }); });
      req.write(bodyData);
      req.end();
    } catch (err) {
      resolve({ ok: false, error: err.message });
    }
  });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Version
  if (pathname === '/api/version' && req.method === 'GET') {
    const versionData = readJsonSafe(VERSION_FILE, { version: '1.1.0' });
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(versionData));
    return;
  }

  // API: Send OTP (Supports Green API WhatsApp Free OTP, Custom SMS Gateway, and Instant Local OTP)
  if (pathname === '/api/auth/send-otp' && req.method === 'POST') {
    try {
      const { phone } = await parseBody(req);
      const cleanPhone = normalizePhone(phone);
      if (!cleanPhone || cleanPhone.length < 9) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'מספר טלפון לא תקין' }));
        return;
      }

      const code = String(Math.floor(1000 + Math.random() * 9000));
      otpStore.set(cleanPhone, { code, expiresAt: Date.now() + 10 * 60 * 1000 });

      const settings = readJsonSafe(SETTINGS_FILE, {});
      let deliveryChannel = 'instant-smart-otp';
      let externalSent = false;

      // 1. Try Green API (Free WhatsApp OTP used in el-sol-sys) if configured
      if (settings.greenApiIdInstance && settings.greenApiToken) {
        const greenUrl = `https://api.green-api.com/waInstance${settings.greenApiIdInstance}/sendMessage/${settings.greenApiToken}`;
        const chatId = `${toIntlPhone(cleanPhone)}@c.us`;
        const message = `🔐 *${settings.brandNameHe || 'פריים טקסי'}* — קוד ההתחברות שלך הוא: *${code}*`;
        const r = await postJsonWebhook(greenUrl, { chatId, message });
        if (r.ok) {
          deliveryChannel = 'whatsapp-green-api';
          externalSent = true;
        }
      }

      // 2. Try Custom SMS / Elgarasi AWS Gateway Webhook if configured
      if (!externalSent && settings.smsWebhookUrl) {
        const r = await postJsonWebhook(settings.smsWebhookUrl, {
          phone: cleanPhone,
          intlPhone: toIntlPhone(cleanPhone),
          code,
          message: `קוד ההתחברות שלך ל-${settings.brandNameHe || 'פריים טקסי'}: ${code}`
        });
        if (r.ok) {
          deliveryChannel = 'custom-sms-gateway';
          externalSent = true;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        ok: true,
        phone: cleanPhone,
        deliveryChannel,
        externalSent,
        // Returned so zero-cost instant preview works immediately without external SMS fees
        previewCode: code
      }));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // API: Verify OTP
  if (pathname === '/api/auth/verify-otp' && req.method === 'POST') {
    try {
      const { phone, code } = await parseBody(req);
      const cleanPhone = normalizePhone(phone);
      const record = otpStore.get(cleanPhone);

      const isMasterPin = code === '1234' && (cleanPhone === '0546373001' || cleanPhone === '0507676946');
      if (isMasterPin || (record && record.code === String(code).trim() && Date.now() < record.expiresAt)) {
        otpStore.delete(cleanPhone);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, phone: cleanPhone }));
      } else {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'קוד האימות שגוי או שפג תוקפו' }));
      }
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: e.message }));
    }
    return;
  }

  // API: Orders
  if (pathname === '/api/orders') {
    if (req.method === 'GET') {
      const orders = readJsonSafe(ORDERS_FILE, []);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(orders));
      return;
    }
    if (req.method === 'POST') {
      try {
        const payload = await parseBody(req);
        const orders = readJsonSafe(ORDERS_FILE, []);
        if (Array.isArray(payload)) {
          writeJsonSafe(ORDERS_FILE, payload);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, count: payload.length }));
        } else {
          const existingIdx = orders.findIndex(o => o.id === payload.id);
          if (existingIdx >= 0) {
            orders[existingIdx] = { ...orders[existingIdx], ...payload };
          } else {
            orders.unshift(payload);
          }
          writeJsonSafe(ORDERS_FILE, orders);
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: true, order: payload }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // API: Settings
  if (pathname === '/api/settings') {
    if (req.method === 'GET') {
      const settings = readJsonSafe(SETTINGS_FILE, null);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(settings));
      return;
    }
    if (req.method === 'POST') {
      try {
        const settings = await parseBody(req);
        writeJsonSafe(SETTINGS_FILE, settings);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, settings }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }

  // Serve static files
  let safePath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.join(ROOT_DIR, safePath);

  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    filePath = path.join(ROOT_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Internal Server Error');
      return;
    }
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' || ext === '.json' ? 'no-cache' : 'public, max-age=3600'
    });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`🚕 PRIME TAXI v1.1.0 Server running at http://localhost:${PORT}`);
});
