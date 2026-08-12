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
    // Google Sign-In is provided by @capgo/capacitor-social-login and
    // configured at runtime via SocialLogin.initialize({ google: {...} })
    // in src/lib/googleAuth.ts. The Web Client ID comes from the
    // VITE_GOOGLE_WEB_CLIENT_ID env var at build time — see
    // store-assets/google-signin-setup.md for the Google Cloud + Supabase
    // provisioning walkthrough.
  },
};

export default config;
