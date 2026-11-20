/**
 * Client for the local crowd API (server/index.mjs).
 *
 * The API returns BestTime.app data when keys are configured, and
 * `source: "unconfigured"` otherwise. A network failure resolves to null so
 * callers can keep their built-in estimates instead of showing an error.
 */
export type LiveSource = 'besttime' | 'unconfigured' | 'unavailable';

export type LiveCrowd = {
  placeId: string;
  source: LiveSource;
  pct?: number;
  forecast?: number[];
  hours?: number[];
  venue?: string;
  updatedAt?: string;
  stale?: boolean;
  reason?: string;
};

/**
 * The web build talks to its own origin. The native shell is served from a
 * local WebView origin, so it needs the deployed API baked in at build time
 * (`VITE_API_BASE=https://your-app.onrender.com`).
 */
const API_BASE = ((import.meta.env.VITE_API_BASE as string | undefined) ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

const hourFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric' });

/** "Now", "2 PM", "4 PM" … labels for the forecast chart. */
export function forecastLabels(hours?: number[]): string[] | undefined {
  if (!hours?.length) return undefined;
  return hours.map((hour, index) => {
    if (index === 0) return 'Now';
    const date = new Date(2000, 0, 1, hour % 24);
    return hourFormat.format(date);
  });
}

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export type ChatContext = {
  mallName: string;
  localTime: string;
  places: {
    name: string;
    level: string;
    pct: number;
    status: string;
    walk: [number, number];
    forecast: number[];
    labels: string[];
  }[];
};

/**
 * Streams the assistant's answer, calling `onDelta` for every fragment so the
 * bubble can grow as tokens arrive. Resolves with the full reply, or null when
 * the assistant is unavailable and the caller should use its local replies.
 */
export async function streamAssistant(
  messages: ChatTurn[],
  context: ChatContext,
  onDelta: (delta: string) => void,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const response = await fetch(apiUrl('/api/chat'), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ messages, context, stream: true }),
      signal,
    });
    if (!response.ok || !response.body) return null;

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

        let event: { delta?: string; error?: string };
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }
        if (event.delta) {
          text += event.delta;
          onDelta(event.delta);
        }
      }
    }

    return text.trim() ? text : null;
  } catch {
    return null;
  }
}

export async function fetchLiveCrowd(
  placeIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, LiveCrowd> | null> {
  if (placeIds.length === 0) return {};

  try {
    const response = await fetch(apiUrl(`/api/crowd?places=${encodeURIComponent(placeIds.join(','))}`), {
      signal,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) return null;

    const data = (await response.json()) as { results?: LiveCrowd[] } & LiveCrowd;
    const results = Array.isArray(data.results) ? data.results : [data];

    return Object.fromEntries(results.map((entry) => [entry.placeId, entry]));
  } catch {
    // Offline, or `npm run dev` without the API server running.
    return null;
  }
}
