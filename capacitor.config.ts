import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'uz.engnova.app',
  appName: 'Engnova',
  webDir: 'dist',
  // The app bundles the shell only — no `server.url`. Each track's live site
  // opens inside an in-app webview (see src/lib/webview.ts).
  plugins: {
    // Native Android 12+ SplashScreen API handles the splash directly via
    // themes.xml (windowSplashScreenBackground + windowSplashScreenAnimatedIcon).
    // If @capacitor/splash-screen is ever installed, keep it out of the way so
    // the JS layer doesn't render a second splash on top of the native one.
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: '#08080C',
      androidSplashResourceName: 'ic_splash',
      showSpinner: false,
    },
  },
};

export default config;
