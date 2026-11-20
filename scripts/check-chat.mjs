/**
 * Drives the Assistant screen in headless Chrome over the DevTools protocol and
 * prints the bot replies, proving the client posts the conversation and renders
 * each answer. Requires: chrome --headless=new --remote-debugging-port=9333
 *
 *   node scripts/check-chat.mjs
 */
const PORT = Number(process.env.CDP_PORT || 9333);
const APP = process.env.APP_URL || 'http://localhost:8787/';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((target) => target.type === 'page');
if (!page) throw new Error('No page target found');

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.onopen = resolve;
  socket.onerror = reject;
});

let id = 0;
const pending = new Map();
socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    pending.get(data.id)(data);
    pending.delete(data.id);
  }
};

const send = (method, params = {}) =>
  new Promise((resolve) => {
    const messageId = ++id;
    pending.set(messageId, resolve);
    socket.send(JSON.stringify({ id: messageId, method, params }));
  });

const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.result?.exceptionDetails) throw new Error(result.result.exceptionDetails.text);
  return result.result?.result?.value;
};

await send('Page.enable');
await send('Page.navigate', { url: APP });
await sleep(3500);

const type = (text) => `(() => {
  const input = document.querySelector('.chat-input');
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  setter.call(input, ${JSON.stringify(text)});
  input.dispatchEvent(new Event('input', { bubbles: true }));
  document.querySelector('.chat-input-row').requestSubmit();
  return true;
})()`;

const botCount = () => evaluate("document.querySelectorAll('.bubble-bot:not(.typing)').length");
const lastBot = () => evaluate("[...document.querySelectorAll('.bubble-bot:not(.typing)')].pop()?.textContent ?? ''");
const userCount = () => evaluate("document.querySelectorAll('.bubble-user').length");

const before = { bot: await botCount(), user: await userCount() };

const waitForReply = async (expected) => {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if ((await botCount()) >= expected) return;
    await sleep(500);
  }
};

const waitForInput = async () => {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (await evaluate("!document.querySelector('.chat-input').disabled")) return true;
    await sleep(250);
  }
  return false;
};

await evaluate(type('When should I go today?'));
await waitForReply(before.bot + 1);

// Sample the growing bubble: more than one distinct length means it streamed.
const growth = [];
for (let attempt = 0; attempt < 20; attempt += 1) {
  const text = await lastBot();
  if (text && growth[growth.length - 1] !== text.length) growth.push(text.length);
  await sleep(200);
}
const partial = await lastBot();

await waitForInput();
const first = await lastBot();

await evaluate(type('And what about the cinema?'));
await waitForReply(before.bot + 2);
await waitForInput();
const second = await lastBot();

console.log(JSON.stringify({
  botsBefore: before.bot,
  usersBefore: before.user,
  botsAfter: await botCount(),
  usersAfter: await userCount(),
  streamGrowth: growth.length > 1 ? growth : 'not observed',
  partialSeenAt: partial.length,
  firstReplyChars: first.length,
  firstReply: first,
  secondReply: second,
}, null, 2));

socket.close();
