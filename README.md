# Engnova

One Android app (Google Play) that hosts **two independent products** behind a chooser:

- **CEFR Academy** (cefracademy.uz) — 0 → C1 English  · Vite/React SPA
- **IELTS Level** (ieltslevel.uz) — IELTS band prep · Next.js 15 server app

The user picks one track at first run; the app then loads **only** that product.
The choice is stored and **switchable** (`lib/tracks.ts`), not hardcoded at install.

## Architecture — Path A (uniform webview)

The two products are different stacks (SPA vs Next.js server app), so neither is
bundled as a component. Instead the native shell opens each track's **live site**
in a full-screen in-app webview.

```
Engnova shell (this repo)
├── ChooserScreen        CEFR | IELTS  (remembered, switchable)
├── lib/tracks.ts        track defs: live url, activate url, blocked payment patterns
├── lib/webview.ts       opens the track's site in @capacitor/inappbrowser;
│                        a blocked (pricing/checkout) URL is bounced OUT to the
│                        system browser (@capacitor/browser)
└── products/
    └── ProductScreen.tsx  native → in-app webview; web preview → open-site fallback
```

## Hard rules (Google Play compliance)

- The app **sells nothing** and shows **no prices**. Navigation to any track's
  `blockedPatterns` (pricing / checkout / payment gateways) never renders inside
  the app — it's bounced to the **system browser**. Payment happens on the website.
- Capacitor loads the bundled shell (`capacitor.config.ts` has no `server.url`);
  only the *product* content is remote, inside the controlled in-app webview.

## Setup

```bash
npm install
npm run dev        # web preview (native webview no-ops → shows the fallback)
```

## Build the Android app (needs the toolchain)

Requires **JDK 17+** and **Android Studio** (SDK/emulator). Then:

```bash
npx cap add android
npx cap sync
npx cap open android   # build / run the APK from Android Studio
```

## Still to do on device (can't be verified in the web preview)

- Tune the in-app webview options + the payment-route interception against real navigation.
- Android permissions for the microphone (speaking/pronunciation/shadowing).
- Push notifications (FCM), app icon/splash, then Play closed-testing.
