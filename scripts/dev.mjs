/** Runs the Vite dev server and the crowd API together. */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const children = [
  spawn(process.execPath, ['server/index.mjs'], { cwd: root, stdio: 'inherit' }),
  spawn(npm, ['run', 'dev'], { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill());
  process.exitCode = code;
}

children.forEach((child) => {
  child.on('exit', (code) => {
    if (!stopping && code) {
      console.error(`Process exited with code ${code}`);
      stop(code);
    }
  });
});

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
