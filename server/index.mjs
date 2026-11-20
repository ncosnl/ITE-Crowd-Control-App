#!/usr/bin/env node
/**
 * Local server for Crowd Control.
 *
 *  - Serves the production build in dist/ (and the generated service worker).
 *  - Exposes /api/crowd, which resolves live crowd levels through BestTime.app.
 *    The API keys stay in this process: the browser never sees them.
 *  - Caches forecasts on disk so a refresh costs credits at most once per TTL.
 *
 * Without keys the API answers `source: "unconfigured"` and the app keeps
 * working with its built-in estimates.
 */
import { createServer } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chatReply, llmConfigured, llmModel, normaliseMessages, streamChatReply } from './llm.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(root, 'dist');
const cacheFile = join(root, '.cache', 'crowd-cache.json');

if (existsSync(join(root, '.env'))) {
  try {
    process.loadEnvFile(join(root, '.env'));
  } catch (error) {
    console.warn(`Could not read .env: ${error.message}`);
  }
}

const CONFIG = {
  port: Number(process.env.PORT || 8787),
  privateKey: (process.env.BESTTIME_API_KEY_PRIVATE || '').trim(),
  publicKey: (process.env.BESTTIME_API_KEY_PUBLIC || '').trim(),
  cacheTtlMs: Math.max(1, Number(process.env.CROWD_CACHE_TTL_MINUTES || 720)) * 60_000,
  provider: (process.env.BESTTIME_API_BASE || 'https://besttime.app/api/v1').replace(/\/$/, ''),
  requestTimeoutMs: 25_000,
};

const configured = Boolean(CONFIG.privateKey);
const venues = JSON.parse(await readFile(join(root, 'server', 'venues.json'), 'utf8'));

/** placeId -> { venueId, venueName, timezone, days: { [0-6]: number[24] }, fetchedAt, error? } */
let cache = {};
const inflight = new Map();

if (existsSync(cacheFile)) {
  try {
    cache = JSON.parse(await readFile(cacheFile, 'utf8'));
  } catch {
    cache = {};
  }
}

/** Writes are rare (once per venue per TTL), so there is no debounce to lose. */
async function persistCache() {
  try {
    await mkdir(join(root, '.cache'), { recursive: true });
    await writeFile(cacheFile, JSON.stringify(cache, null, 2));
  } catch (error) {
    console.warn(`Could not write ${cacheFile}: ${error.message}`);
  }
}

const clampPct = (value) => Math.max(0, Math.min(100, Math.round(Number(value) || 0)));

/** Keeps only the seven 24-value day arrays we actually use. */
function parseForecast(data, fallback = {}) {
  const days = {};
  for (const day of Array.isArray(data.analysis) ? data.analysis : []) {
    const dayInt = day?.day_info?.day_int;
    const raw = day?.day_raw;
    if (Number.isInteger(dayInt) && Array.isArray(raw) && raw.length === 24) {
      days[dayInt] = raw.map(clampPct);
    }
  }
  if (Object.keys(days).length === 0) {
    throw new Error('BestTime returned no foot-traffic analysis for this venue');
  }
  return {
    days,
    timezone: data.venue_info?.venue_timezone || 'Asia/Manila',
    venueName: data.venue_info?.venue_name || fallback.venueName || 'Venue',
    venueId: data.venue_info?.venue_id || fallback.venueId,
  };
}

async function callProvider(path, params, method, fallback) {
  const response = await fetch(`${CONFIG.provider}${path}?${new URLSearchParams(params)}`, {
    method,
    signal: AbortSignal.timeout(CONFIG.requestTimeoutMs),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.status !== 'OK') {
    throw new Error(data.message || `BestTime responded ${response.status}`);
  }
  return parseForecast(data, fallback);
}

const createForecast = (placeId) =>
  callProvider(
    '/forecasts',
    {
      api_key_private: CONFIG.privateKey,
      venue_name: venues[placeId].venueName,
      venue_address: venues[placeId].venueAddress,
    },
    'POST',
    { venueName: venues[placeId].venueName },
  );

const queryForecast = (venueId, fallback) =>
  callProvider('/forecasts/week', { api_key_public: CONFIG.publicKey, venue_id: venueId }, 'GET', fallback);

async function resolvePlace(placeId) {
  const entry = cache[placeId];
  if (entry && !entry.error && Date.now() - entry.fetchedAt < CONFIG.cacheTtlMs) return entry;

  if (inflight.has(placeId)) return inflight.get(placeId);

  const task = (async () => {
    try {
      // Creating a forecast costs 2 credits, querying an existing one costs 1.
      // server/venues.json pins real venue ids, so the common path is a query.
      const venueId = venues[placeId]?.venueId || entry?.venueId;
      const fresh =
        venueId && CONFIG.publicKey
          ? await queryForecast(venueId, {
              venueId,
              venueName: venues[placeId]?.venueName || entry?.venueName,
            })
          : await createForecast(placeId);

      cache[placeId] = { ...fresh, fetchedAt: Date.now() };
      await persistCache();
      return cache[placeId];
    } catch (error) {
      if (entry) {
        // Keep showing the last known forecast rather than dropping to estimates.
        cache[placeId] = { ...entry, error: error.message };
        return cache[placeId];
      }
      throw error;
    } finally {
      inflight.delete(placeId);
    }
  })();

  inflight.set(placeId, task);
  return task;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Current weekday and hour inside the venue's timezone. */
function venueClock(timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const weekday = parts.find((part) => part.type === 'weekday')?.value ?? 'Mon';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0') % 24;
  return { dayInt: Math.max(0, WEEKDAYS.indexOf(weekday)), hour };
}

/**
 * BestTime days run 6 AM to 5 AM, array index 0 is 6 AM. Converting through a
 * linear hour keeps the early-morning hours attached to the previous day.
 */
function valueAt(days, dayInt, hour) {
  const linear = dayInt * 24 + (hour - 6);
  const day = ((Math.floor(linear / 24) % 7) + 7) % 7;
  const slot = ((linear % 24) + 24) % 24;
  const raw = days[day];
  return raw ? raw[slot] : 0;
}

const offsets = [0, 2, 4, 6, 8];

function crowdPayload(placeId, entry) {
  const { dayInt, hour } = venueClock(entry.timezone);
  const points = offsets.map((offset) => {
    const absolute = hour + offset;
    return {
      hour: ((absolute % 24) + 24) % 24,
      pct: valueAt(entry.days, dayInt, absolute),
    };
  });

  return {
    placeId,
    source: 'besttime',
    venue: entry.venueName,
    venueId: entry.venueId ?? null,
    pct: points[0].pct,
    forecast: points.map((point) => point.pct),
    hours: points.map((point) => point.hour),
    updatedAt: new Date(entry.fetchedAt).toISOString(),
    stale: Boolean(entry.error),
  };
}

async function handleCrowd(ids) {
  if (!configured) {
    return ids.map((placeId) => ({
      placeId,
      source: 'unconfigured',
      reason: 'Add BESTTIME_API_KEY_PRIVATE to .env to use live crowd data.',
    }));
  }

  return Promise.all(
    ids.map(async (placeId) => {
      if (!venues[placeId]) {
        return { placeId, source: 'unavailable', reason: 'Unknown place id' };
      }
      try {
        return crowdPayload(placeId, await resolvePlace(placeId));
      } catch (error) {
        return { placeId, source: 'unavailable', reason: error.message };
      }
    }),
  );
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** Reads a JSON request body, rejecting anything larger than 64 kB. */
function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > 65_536) {
        rejectBody(Object.assign(new Error('Request body too large'), { status: 413 }));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        rejectBody(Object.assign(new Error('Invalid JSON body'), { status: 400 }));
      }
    });
    request.on('error', rejectBody);
  });
}

function sendJson(response, status, body, headOnly = false) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(headOnly ? undefined : payload);
}

/**
 * Server-sent events for the assistant: one `{ delta }` event per fragment,
 * then `[DONE]`. An `{ error, fallback }` event means "use the local replies".
 */
async function streamChat(response, messages, context) {
  response.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-store, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
    'Access-Control-Allow-Origin': '*',
  });
  response.flushHeaders?.();

  let closed = false;
  response.on('close', () => {
    closed = true;
  });

  try {
    await streamChatReply(messages, context, (delta) => {
      if (!closed) response.write(`data: ${JSON.stringify({ delta })}\n\n`);
    });
    if (!closed) response.end('data: [DONE]\n\n');
  } catch (error) {
    console.warn(`Chat stream failed: ${error.message}`);
    if (!closed) {
      response.write(`data: ${JSON.stringify({ error: error.message, fallback: true })}\n\n`);
      response.end();
    }
  }
}

async function serveStatic(pathname, response, headOnly = false) {
  const relative = decodeURIComponent(pathname === '/' ? '/index.html' : pathname);
  const filePath = resolve(distDir, `.${relative}`);
  const insideDist = filePath === distDir || filePath.startsWith(distDir + sep);

  if (insideDist && existsSync(filePath)) {
    const body = await readFile(filePath);
    const noStore =
      filePath.endsWith('sw.js') ||
      filePath.endsWith('index.html') ||
      filePath.endsWith('.webmanifest');
    response.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] ?? 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': noStore ? 'no-store' : 'public, max-age=604800, immutable',
    });
    response.end(headOnly ? undefined : body);
    return;
  }

  if (!existsSync(distDir)) {
    const message = 'No production build yet. Run `npm run build`, then start this server again.';
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(headOnly ? undefined : message);
    return;
  }

  const fallback = await readFile(join(distDir, 'index.html'));
  response.writeHead(200, {
    'Content-Type': MIME['.html'],
    'Content-Length': fallback.length,
    'Cache-Control': 'no-store',
  });
  response.end(headOnly ? undefined : fallback);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  const headOnly = request.method === 'HEAD';

  try {
    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      response.end();
      return;
    }

    if (request.method === 'POST' && url.pathname === '/api/chat') {
      const body = await readJsonBody(request);
      const messages = normaliseMessages(body.messages);
      if (messages.length === 0) {
        sendJson(response, 400, { error: 'Send { messages: [{ role, content }] }' });
        return;
      }
      if (!llmConfigured()) {
        sendJson(response, 503, { error: 'Assistant is not configured', fallback: true });
        return;
      }
      if (body.stream === true) {
        await streamChat(response, messages, body.context);
        return;
      }

      try {
        const reply = await chatReply(messages, body.context);
        sendJson(response, 200, { reply, model: llmModel() });
      } catch (error) {
        console.warn(`Chat failed: ${error.message}`);
        sendJson(response, error.status || 502, { error: error.message, fallback: true });
      }
      return;
    }

    if (request.method !== 'GET' && !headOnly) {
      sendJson(response, 405, { error: 'Method not allowed' });
      return;
    }

    if (url.pathname === '/api/health') {
      sendJson(
        response,
        200,
        {
          ok: true,
          configured,
          provider: 'besttime.app',
          assistant: llmConfigured() ? `llm:${llmModel()}` : 'fallback',
          cachedVenues: Object.keys(cache).length,
          cacheTtlMinutes: CONFIG.cacheTtlMs / 60_000,
        },
        headOnly,
      );
      return;
    }

    if (url.pathname === '/api/crowd') {
      const place = url.searchParams.get('place');
      const places = (url.searchParams.get('places') ?? '')
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);
      const ids = place ? [place] : places;

      if (ids.length === 0) {
        sendJson(response, 400, { error: 'Pass ?place=<id> or ?places=<id,id,...>' });
        return;
      }

      const results = await handleCrowd(ids);
      sendJson(response, 200, place && results.length === 1 ? results[0] : { results }, headOnly);
      return;
    }

    if (url.pathname.startsWith('/api/')) {
      sendJson(response, 404, { error: 'Unknown API route' }, headOnly);
      return;
    }

    await serveStatic(url.pathname, response, headOnly);
  } catch (error) {
    sendJson(response, error.status || 500, { error: error.message });
  }
});

server.listen(CONFIG.port, () => {
  console.log(`Crowd Control server on http://localhost:${CONFIG.port}`);
  console.log(
    configured
      ? `Live crowd data: BestTime.app (cache ${CONFIG.cacheTtlMs / 60_000} min)`
      : 'Live crowd data disabled: add BESTTIME_API_KEY_PRIVATE to .env (app falls back to built-in estimates)',
  );
  console.log(
    llmConfigured()
      ? `Crowd Assistant: ${llmModel()} (answers grounded in the live snapshot)`
      : 'Crowd Assistant: local replies only — add AI_API_KEY to .env for real conversation',
  );
  console.log(existsSync(distDir) ? 'Serving dist/' : 'dist/ missing — run `npm run build` to serve the app');
});
