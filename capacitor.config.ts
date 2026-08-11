import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.engnova.app',
  appName: 'Engnova',
  webDir: 'dist',
  // The app bundles each product's built assets (offline-capable, Play-quality).
  // No `server.url` — we do NOT remote-load the live websites.
};

export default config;
