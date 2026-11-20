/**
 * Renders the PWA icons with headless Chrome, so the repo does not need an
 * image library. Run with `npm run icons` whenever the mark changes.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const outDir = join(root, 'public', 'icons');
const work = mkdtempSync(join(tmpdir(), 'crowd-icons-'));

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

const chrome = chromeCandidates.find((path) => {
  try {
    execFileSync(path, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
});

if (!chrome) {
  console.error('Chrome not found. Set CHROME_PATH to generate the icons.');
  process.exit(1);
}

/** Full-bleed square: Android/iOS apply their own mask, so no rounded corners here. */
const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; }
      .mark {
        width: 100vw; height: 100vh;
        background: radial-gradient(120% 120% at 20% 0%, #f0914f 0%, #e8792f 45%, #d2621c 100%);
        display: grid; place-items: center;
      }
      /* 70% keeps every element inside the maskable-icon safe circle. */
      svg { width: 70%; height: 70%; display: block; }
    </style>
  </head>
  <body>
    <div class="mark">
      <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Crowd Control">
        <g fill="#ffffff">
          <circle cx="256" cy="196" r="58" />
          <path d="M141 386c0-62 51-102 115-102s115 40 115 102z" />
        </g>
        <g fill="#ffffff" opacity="0.55">
          <circle cx="118" cy="252" r="30" />
          <path d="M63 352c0-33 25-55 55-55s55 22 55 55z" />
          <circle cx="394" cy="252" r="30" />
          <path d="M339 352c0-33 25-55 55-55s55 22 55 55z" />
        </g>
      </svg>
    </div>
  </body>
</html>`;

const page = join(work, 'icon.html');
writeFileSync(page, html, 'utf8');
mkdirSync(outDir, { recursive: true });

const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['apple-touch-icon.png', 180],
];

for (const [name, size] of sizes) {
  execFileSync(
    chrome,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      '--force-device-scale-factor=1',
      `--user-data-dir=${join(work, 'profile')}`,
      `--window-size=${size},${size}`,
      `--screenshot=${join(outDir, name)}`,
      pathToFileURL(page).href,
    ],
    { stdio: 'ignore' },
  );
  console.log(`wrote public/icons/${name} (${size}x${size})`);
}

rmSync(work, { recursive: true, force: true });
