/**
 * Stand-in for an OpenAI-compatible chat endpoint, used to exercise the chat
 * pipeline without a provider key:
 *
 *   AI_BASE_URL=http://127.0.0.1:8798 AI_API_KEY=test node server/index.mjs
 *   node scripts/mock-llm.mjs
 *
 * The reply echoes how many turns it received, so a broken conversation
 * history is obvious.
 */
import { createServer } from 'node:http';

const PORT = Number(process.env.MOCK_LLM_PORT || 8798);

createServer((request, reply) => {
  const url = new URL(request.url ?? '/', 'http://localhost');
  if (request.method !== 'POST' || !url.pathname.endsWith('/chat/completions')) {
    reply.writeHead(404, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify({ error: { message: 'Not found' } }));
    return;
  }

  let body = '';
  request.on('data', (chunk) => (body += chunk));
  request.on('end', () => {
    const payload = JSON.parse(body || '{}');
    const messages = Array.isArray(payload.messages) ? payload.messages : [];
    const system = messages.find((message) => message.role === 'system');
    const turns = messages.filter((message) => message.role !== 'system');
    const last = turns[turns.length - 1]?.content ?? '';
    const mall = /for (.+?)\./.exec(system?.content ?? '')?.[1] ?? 'the mall';
    const text = `Mock reply ${turns.length}/2 to "${last}" at **${mall}**.`;

    reply.writeHead(200, { 'Content-Type': 'application/json' });
    reply.end(JSON.stringify({ choices: [{ message: { role: 'assistant', content: text } }] }));
  });
}).listen(PORT, '127.0.0.1', () => {
  console.log(`Mock LLM on http://127.0.0.1:${PORT}`);
});
