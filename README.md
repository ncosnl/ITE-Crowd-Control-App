# Crowd Control

Real-time crowd estimates and forecasts for Philippine malls, with an assistant
that points you to the quietest place to go. Ships as an installable
(progressively enhanced) web app: it can be added to a phone or desktop home
screen, launches full-screen, and keeps working offline.

## Quick start

```bash
npm install
npm run dev:all     # UI on http://localhost:3000 + crowd API on :8787
```

- `npm run dev` starts only the Vite UI. Without the API running, the app shows
  its built-in estimates.
- `npm run build && npm start` builds and serves the production app (and API) on
  http://localhost:8787.

## Live crowd data

The numbers come from [BestTime.app](https://besttime.app), which provides
relative foot-traffic intensity (0–100%) per venue and hour. A free test key is
available at <https://besttime.app/signup>.

1. Copy `.env.example` to `.env`.
2. Paste your private (and optionally public) API key.
3. Restart the server.

```bash
cp .env.example .env
# edit .env
npm run build && npm start
```

Without keys, `/api/crowd` answers `source: "unconfigured"` and the UI keeps
using its built-in estimates, labelled **Estimated**. With keys it labels the
data **Live foot traffic**.

Credits and caching:

- Creating a forecast for a venue costs 2 credits; querying an existing one
  costs 1. Results are cached in `.cache/crowd-cache.json` for
  `CROWD_CACHE_TTL_MINUTES` (default 12 hours), so the app does not spend
  credits on every page load.
- Venues live in `server/venues.json` (place id → venue id, name + address).
  The current ids were resolved from BestTime's venue filter around each mall,
  so each place maps to a real nearby venue. Places without a matching
  sub-venue (e.g. a mall's department store) point at the mall itself. To use a
  different venue, drop its `venueId` and let the name/address lookup create a
  forecast, or paste the id from BestTime.

The keys stay in the Node process. They are never sent to the browser.

## Crowd Assistant (AI chat)

`POST /api/chat` is a real multi-turn conversation: the browser sends the recent
messages plus the crowd snapshot on screen, and the server passes them to any
OpenAI-compatible chat-completions model. The API key stays server-side.

Replies stream: with `{ stream: true }` the endpoint answers with server-sent
events (`{ delta }` fragments, then `[DONE]`), so the bubble fills in as the
model writes instead of waiting for the whole answer.

```bash
# .env — defaults to Z.ai (glm-4.5-flash); any OpenAI-compatible provider works
AI_API_KEY=your_key
# AI_BASE_URL=https://api.z.ai/api/paas/v4
# AI_MODEL=glm-4.5-flash
```

Without `AI_API_KEY` the chat still works, but each reply comes from the local
rule-based answers in `src/chat.ts` instead of a model. The assistant's answers
are grounded in the live percentages and forecast for the current mall, so
"when should I go?" is answered from today's curve rather than invented.

## Install it as an app ("download")

The build is a PWA, so installation happens straight from the browser:

- **Android / Chrome desktop:** open the app, then use the **Install** button in
  the Home header (or the install icon in the address bar).
- **iOS / Safari:** Share → *Add to Home Screen*.
- **Desktop:** the same install icon turns the tab into a standalone window with
  its own dock/taskbar entry.

Installability needs a secure context: `localhost` or any HTTPS deployment.
`npm start` on localhost is enough for local installation.

## Deploying

`npm start` serves both `dist/` and `/api`, so a single Node host (Render, Fly,
Railway, a VPS, …) is all that is needed. Publish `dist/` to a static host only
if you accept estimated data, since a static host cannot run `server/index.mjs`.

### Render (free tier)

`render.yaml` is a blueprint for a single web service:

1. Push this project to a GitHub repository (`.env` and `dist/` are ignored).
2. In Render: **New → Blueprint**, pick the repository, apply.
3. Render asks for the three secrets (`BESTTIME_API_KEY_PRIVATE`,
   `BESTTIME_API_KEY_PUBLIC`, `AI_API_KEY`); the model settings are in the
   blueprint. Paste the values from your `.env`.
4. The service builds with `npm ci && npm run build` and starts with
   `npm start`; `GET /api/health` is the health check.

The free plan sleeps after inactivity (the first request is slow), and its disk
is ephemeral, so `.cache/crowd-cache.json` resets on redeploy — that only costs
BestTime credits on the next fetch. Streaming replies work because Render passes
server-sent events through; the server also sets `X-Accel-Buffering: no`.

## Android app (Capacitor)

The `android/` project is a Capacitor shell around the same UI. It bundles
`dist/` locally and calls the deployed server for crowd data and chat, so the
server URL is baked in at build time:

```bash
npm run android:build -- https://your-app.onrender.com
```

The script builds the web bundle with `VITE_NATIVE=true` and `VITE_API_BASE`
set, syncs Capacitor, and runs Gradle. It expects JDK 21 (`JAVA_HOME`) and the
Android SDK (`ANDROID_HOME`, or `~/android-sdk`); it installs nothing itself.

- Output: `android/app/build/outputs/apk/debug/app-debug.apk`, copied to
  `artifacts/crowd-control-debug.apk`. That is a **debug** APK: enable
  "install unknown apps" on the phone, or open it in Android Studio and use
  **Build → Generate Signed App Bundle** for the Play Store.
- `VITE_NATIVE` also hides the mock status bar and makes the UI full-bleed.
- The app needs a network connection: without the server it shows estimated
  crowds and the local assistant replies.

## Project layout

```
src/                 React UI (screens, gauge, forecast chart, chat)
src/live.ts          Client for the crowd API
server/index.mjs     Static server + /api/crowd -> BestTime proxy and cache
server/llm.mjs       OpenAI-compatible chat client + grounded system prompt
server/venues.json   Place id -> venue name/address used for lookups
scripts/             Icon generator, dev runner, mock crowd provider
vite.config.ts       API proxy (dev) and service-worker generation (build)
```

Useful commands:

```bash
npm run icons        # regenerate PWA icons with headless Chrome
npm run dev:api      # crowd API only
node scripts/mock-provider.mjs   # fake provider, to test the pipeline without credits
```

## How it behaves

- Crowd percentages are relative to each venue's busiest hour of the week, not
  absolute visitor counts.
- When live data is unavailable (offline, no keys, provider error) the app falls
  back to estimates and says so; the service worker also replays the last cached
  `/api/crowd` answer when the network is gone.
- The assistant answers from the same numbers shown on screen. With an AI key
  it is a real conversation; without one it falls back to `src/chat.ts`.
