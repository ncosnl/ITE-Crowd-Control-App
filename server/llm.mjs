/**
 * Server-side LLM client for the crowd assistant.
 *
 * Any OpenAI-compatible chat-completions endpoint works. Point AI_BASE_URL at
 * your provider and set AI_API_KEY; the key never leaves this process.
 * Without a key the server answers 503 and the client keeps its local replies.
 */

/**
 * Read at call time, not import time: index.mjs loads .env after its imports
 * are evaluated, so a module-level snapshot would miss AI_API_KEY.
 */
const config = () => ({
  baseUrl: (process.env.AI_BASE_URL || 'https://api.z.ai/api/paas/v4').replace(/\/$/, ''),
  apiKey: (process.env.AI_API_KEY || process.env.ZAI_API_KEY || '').trim(),
  model: (process.env.AI_MODEL || 'glm-4.5-flash').trim(),
  timeoutMs: Math.max(5, Number(process.env.AI_TIMEOUT_SECONDS || 60)) * 1000,
});

export const llmConfigured = () => Boolean(config().apiKey);
export const llmModel = () => config().model;

const MAX_HISTORY = 12;
const MAX_CHARS = 1500;

const clean = (value, limit = MAX_CHARS) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);

/** Trims a client-supplied conversation into safe chat-completions messages. */
export function normaliseMessages(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: clean(message.content),
    }))
    .filter((message) => message.content)
    .slice(-MAX_HISTORY);
}

/**
 * Builds the system prompt from the snapshot the app is showing, so the model
 * talks about real numbers and never invents places that do not exist.
 */
export function systemPrompt(context) {
  const mallName = clean(context?.mallName) || 'the mall';
  const localTime = clean(context?.localTime, 40) || 'now';
  const places = Array.isArray(context?.places) ? context.places.slice(0, 12) : [];

  const lines = places.map((place) => {
    const labels = Array.isArray(place.labels) ? place.labels : [];
    const forecast = Array.isArray(place.forecast) ? place.forecast : [];
    const curve = forecast
      .map((value, index) => `${labels[index] ?? `+${index}`} ${Math.round(Number(value) || 0)}%`)
      .join(', ');
    const walk = Array.isArray(place.walk) ? `${place.walk[0]}–${place.walk[1]} min walk from the entrance` : '';
    return `- ${clean(place.name, 60)} (${clean(place.level, 40) || 'level unknown'}): ${Math.round(
      Number(place.pct) || 0,
    )}% crowded right now, ${clean(place.status, 40) || 'unknown'}; forecast ${curve || 'unavailable'}${
      walk ? `; ${walk}` : ''
    }`;
  });

  return [
    `You are the Crowd Assistant inside a shopping-mall crowd app for ${mallName}.`,
    `The local time at the mall is ${localTime}.`,
    'How the data works: percentages are relative foot traffic from 0–100, not a headcount. 0% usually means the venue has not opened yet. The forecast is the predicted crowd level for the rest of today.',
    '',
    'Current snapshot:',
    ...(lines.length ? lines : ['- No places are loaded.']),
    '',
    'How to answer:',
    '- Be a helpful, natural conversational assistant. Answer the actual question, then add one useful detail.',
    '- Keep replies to 1–3 short sentences (under 60 words) unless the user asks for a list.',
    '- Use the exact percentages from the snapshot; never invent places, numbers or hours.',
    '- For "when should I go" or prediction questions, name the quietest upcoming window and the peak window from the forecast.',
    '- If the snapshot looks empty (all 0% before opening), say the mall is likely closed and give the forecast peak instead.',
    '- When comparing places, mention the walking distance.',
    '- Use **bold** for place names and key numbers. No markdown headings, no bullets unless asked.',
    '- You only help with this mall: crowds, food, shopping and trip planning. If asked for anything else (code, homework, essays, general knowledge), do not fulfil it. Reply with one sentence saying you can only help with mall crowds and the best time to visit.',
  ].join('\n');
}

function buildPayload(settings, messages, context, stream) {
  const payload = {
    model: settings.model,
    messages: [{ role: 'system', content: systemPrompt(context) }, ...messages],
    max_tokens: 320,
    temperature: 0.6,
    stream,
  };

  // GLM reasons out loud by default: ~30 s per reply, and the visible content
  // comes back empty. Turning thinking off makes it ~1.5 s and usable in chat.
  if (/z\.ai|bigmodel\.cn/.test(settings.baseUrl) && process.env.AI_THINKING !== 'on') {
    payload.thinking = { type: 'disabled' };
  }

  return payload;
}

function requireKey() {
  const settings = config();
  if (!settings.apiKey) {
    throw Object.assign(new Error('Assistant is not configured'), { status: 503 });
  }
  return settings;
}

async function request(settings, payload) {
  const response = await fetch(`${settings.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${settings.apiKey}`,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(settings.timeoutMs),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const detail = data?.error?.message || data?.message || `LLM responded ${response.status}`;
    throw Object.assign(new Error(detail), { status: 502 });
  }
  return response;
}

export async function chatReply(messages, context) {
  const settings = requireKey();
  const response = await request(settings, buildPayload(settings, messages, context, false));
  const data = await response.json().catch(() => ({}));

  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw Object.assign(new Error('The assistant returned an empty reply'), { status: 502 });
  }
  return text.trim();
}

/**
 * Same conversation, streamed: calls `onDelta` with each text fragment as the
 * provider emits it and resolves with the full reply.
 */
export async function streamChatReply(messages, context, onDelta) {
  const settings = requireKey();
  const response = await request(settings, buildPayload(settings, messages, context, true));
  if (!response.body) {
    throw Object.assign(new Error('The assistant returned no stream'), { status: 502 });
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let text = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newline;
    while ((newline = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;

      let chunk;
      try {
        chunk = JSON.parse(data);
      } catch {
        continue;
      }
      if (chunk?.error?.message) {
        throw Object.assign(new Error(chunk.error.message), { status: 502 });
      }
      const delta = chunk?.choices?.[0]?.delta?.content;
      if (typeof delta === 'string' && delta) {
        text += delta;
        onDelta(delta);
      }
    }
  }

  if (!text.trim()) {
    throw Object.assign(new Error('The assistant returned an empty reply'), { status: 502 });
  }
  return text.trim();
}
