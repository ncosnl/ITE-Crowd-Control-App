import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Android app bundles `dist/` locally and calls the deployed server for
 * crowd data and chat. Set VITE_API_BASE before building (see
 * scripts/build-android.mjs) so the WebView knows where that server lives.
 */
const config: CapacitorConfig = {
  appId: 'com.crowdcontrol.app',
  appName: 'Crowd Control',
  // Kept apart from the web `dist/` so a native build never contaminates the
  // deployed site (which must call its own origin).
  webDir: 'dist-native',
  android: {
    allowMixedContent: false,
  },
};

export default config;
