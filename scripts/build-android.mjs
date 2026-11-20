/**
 * Builds the Android app: web bundle -> Capacitor sync -> Gradle debug APK.
 *
 * The WebView has no server of its own, so the deployed API URL is baked into
 * the bundle:
 *
 *   npm run android:build -- https://your-app.onrender.com
 *   NATIVE_API_BASE=https://your-app.onrender.com npm run android:build
 *
 * The APK lands in android/app/build/outputs/apk/debug/app-debug.apk and is
 * copied to artifacts/crowd-control-debug.apk.
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

const base = (process.env.NATIVE_API_BASE || process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Usage: npm run android:build -- https://your-app.onrender.com');
  console.error('The URL must be the deployed server, because the app calls its /api routes.');
  process.exit(1);
}

const javaHome =
  process.env.JAVA_HOME ||
  ['C:/Program Files/Microsoft/jdk-21.0.13.102-hotspot', 'C:/Program Files/Microsoft/jdk-21'].find((dir) =>
    existsSync(dir),
  );
const androidHome = process.env.ANDROID_HOME || join(homedir(), 'android-sdk');

if (!javaHome || !existsSync(javaHome)) {
  console.error('JDK 21 not found. Set JAVA_HOME (winget install Microsoft.OpenJDK.21).');
  process.exit(1);
}
if (!existsSync(androidHome)) {
  console.error(`Android SDK not found at ${androidHome}. Set ANDROID_HOME.`);
  process.exit(1);
}

const env = {
  ...process.env,
  JAVA_HOME: javaHome,
  ANDROID_HOME: androidHome,
  ANDROID_SDK_ROOT: androidHome,
  VITE_NATIVE: 'true',
  VITE_API_BASE: base,
};

const run = (command, args, cwd = process.cwd()) => {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit', shell: true });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

// Build into dist-native, not dist: the web deploy keeps its own bundle.
run('npx', ['tsc', '--noEmit']);
run('npx', ['vite', 'build', '--outDir', 'dist-native']);
run('npx', ['cap', 'sync', 'android']);

// Gradle needs to be told where the SDK is for this machine.
writeFileSync(join('android', 'local.properties'), `sdk.dir=${androidHome.replace(/\\/g, '\\\\')}\n`);

run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', ['assembleDebug'], join(process.cwd(), 'android'));

const apk = join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
if (!existsSync(apk)) {
  console.error(`Gradle finished but ${apk} is missing.`);
  process.exit(1);
}
mkdirSync('artifacts', { recursive: true });
copyFileSync(apk, join('artifacts', 'crowd-control-debug.apk'));
console.log(`\nAPK: android/app/build/outputs/apk/debug/app-debug.apk`);
console.log(`Copied to artifacts/crowd-control-debug.apk (API: ${base})`);
