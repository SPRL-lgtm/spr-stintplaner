// SPR Stintplaner - Cloudflare Worker
// Speichert/lädt den globalen Plan in Workers KV

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400'
};

const KV_KEY = 'current';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // GET /plan -> aktuellen Plan laden
    if (request.method === 'GET' && url.pathname === '/plan') {
      try {
        const raw = await env.STINTPLANER.get(KV_KEY);
        if (!raw) {
          return new Response(JSON.stringify({ data: null, updatedAt: 0, updatedBy: null }), {
            headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
          });
        }
        return new Response(raw, {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // POST /plan -> Plan speichern
    if (request.method === 'POST' && url.pathname === '/plan') {
      try {
        const body = await request.json();
        const payload = {
          data: body.data || null,
          updatedAt: Date.now(),
          updatedBy: body.updatedBy || 'unbekannt'
        };
        await env.STINTPLANER.put(KV_KEY, JSON.stringify(payload));
        return new Response(JSON.stringify({ ok: true, updatedAt: payload.updatedAt }), {
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
        });
      }
    }

    // Health-Check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'spr-stintplaner-api' }), {
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS }
      });
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  }
};
