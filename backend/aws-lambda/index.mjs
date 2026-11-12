import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const BUCKET = process.env.STATE_BUCKET || 'papoosh-bridge-904610892841';
const KEY = process.env.STATE_KEY || 'prime-taxi/live-state.json';
const s3 = new S3Client({});

let cachedState = null;

async function loadStateFromS3() {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: KEY }));
    const raw = await res.Body.transformToString('utf8');
    cachedState = JSON.parse(raw);
    return cachedState;
  } catch (err) {
    if (cachedState) return cachedState;
    return {
      updatedAt: new Date().toISOString(),
      orders: null,
      drivers: null,
      settings: null,
      cityOverrides: null
    };
  }
}

async function saveStateToS3(nextState) {
  nextState.updatedAt = new Date().toISOString();
  cachedState = nextState;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: KEY,
      Body: JSON.stringify(nextState, null, 2),
      ContentType: 'application/json; charset=utf-8'
    })
  );
  return nextState;
}

export const handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8'
  };

  const method = event?.requestContext?.http?.method || event?.httpMethod || 'GET';
  const rawPath = event?.rawPath || event?.path || '/';

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  try {
    if (method === 'GET') {
      const state = await loadStateFromS3();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, region: process.env.AWS_REGION || 'eu-central-1', state })
      };
    }

    if (method === 'POST') {
      const payload = event.body ? JSON.parse(event.body) : {};

      // OTP Sending Endpoint (/api/auth/send-otp)
      if (rawPath.includes('send-otp') || payload.action === 'send-otp') {
        const phone = String(payload.phone || '').replace(/\D/g, '');
        const otpCode = String(Math.floor(1000 + Math.random() * 9000));
        let deliveryChannel = 'instant_preview';

        if (payload.greenApiInstanceId && payload.greenApiToken && phone) {
          try {
            const intl = phone.startsWith('0') ? '972' + phone.slice(1) : phone;
            const greenUrl = `https://api.green-api.com/waInstance${payload.greenApiInstanceId}/sendMessage/${payload.greenApiToken}`;
            const gRes = await fetch(greenUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chatId: `${intl}@c.us`,
                message: `🚕 *פריים טקסי (PRIME TAXI)*\nקוד ההתחברות המהיר שלך הוא: *${otpCode}*`
              })
            });
            if (gRes.ok) deliveryChannel = 'green_api_whatsapp';
          } catch (_) {}
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ ok: true, previewCode: otpCode, deliveryChannel })
        };
      }

      const current = await loadStateFromS3();

      // Atomic single order upsert (when customer books or driver claims/pays)
      if (payload.action === 'upsert_order' && payload.order) {
        const list = Array.isArray(current.orders) ? [...current.orders] : [];
        const idx = list.findIndex((o) => o.id === payload.order.id);
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...payload.order };
        } else {
          list.unshift(payload.order);
        }
        current.orders = list.slice(0, 200);
        const saved = await saveStateToS3(current);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, state: saved }) };
      }

      // Atomic single driver upsert (when driver registers or toggles availability)
      if (payload.action === 'upsert_driver' && payload.driver) {
        const list = Array.isArray(current.drivers) ? [...current.drivers] : [];
        const idx = list.findIndex(
          (d) => d.id === payload.driver.id || (d.phone && d.phone === payload.driver.phone)
        );
        if (idx >= 0) {
          list[idx] = { ...list[idx], ...payload.driver };
        } else {
          list.unshift(payload.driver);
        }
        current.drivers = list.slice(0, 200);
        const saved = await saveStateToS3(current);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true, state: saved }) };
      }

      // Full or partial state sync
      const next = {
        ...current,
        orders: payload.orders !== undefined ? payload.orders : current.orders,
        drivers: payload.drivers !== undefined ? payload.drivers : current.drivers,
        settings: payload.settings !== undefined ? payload.settings : current.settings,
        cityOverrides: payload.cityOverrides !== undefined ? payload.cityOverrides : current.cityOverrides
      };
      const saved = await saveStateToS3(next);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: true, state: saved })
      };
    }

    return { statusCode: 405, headers, body: JSON.stringify({ ok: false, error: 'Method not allowed' }) };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ ok: false, error: String(err) })
    };
  }
};
