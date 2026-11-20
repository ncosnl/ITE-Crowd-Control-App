/**
 * Stand-in for the BestTime API, used to exercise the full data pipeline when
 * no real key is available:
 *
 *   BESTTIME_API_BASE=http://127.0.0.1:8799 BESTTIME_API_KEY_PRIVATE=test PORT=8788 npm start
 *   node scripts/mock-provider.mjs
 *
 * Returns a fixed weekday forecast (6 AM → 5 AM) so the current-hour values are
 * deterministic within a day.
 */
import { createServer } from 'node:http';

const day = (offset) =>
  Array.from({ length: 24 }, (_, index) => {
    const hour = (index + 6) % 24;
    const lunch = Math.max(0, 90 - Math.abs(hour - 13) * 14);
    const dinner = Math.max(0, 95 - Math.abs(hour - 19) * 12);
    return Math.min(100, Math.round(10 + lunch + dinner + offset * 4));
  });

const response = {
  status: 'OK',
  venue_info: {
    venue_id: 'ven_mock_123',
    venue_name: 'Mock Venue',
    venue_timezone: 'Asia/Manila',
  },
  analysis: Array.from({ length: 7 }, (_, dayInt) => ({
    day_info: { day_int: dayInt },
    day_raw: day(dayInt),
  })),
};

createServer((request, reply) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (url.pathname.endsWith('/forecasts')) {
    const body = JSON.stringify(response);
    reply.writeHead(200, { 'Content-Type': 'application/json' });
    reply.end(body);
    return;
  }
  reply.writeHead(404, { 'Content-Type': 'application/json' });
  reply.end(JSON.stringify({ status: 'ERROR', message: 'Not found' }));
}).listen(8799, '127.0.0.1', () => {
  console.log('Mock crowd provider on http://127.0.0.1:8799');
});
