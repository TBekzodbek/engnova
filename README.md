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

Requires **JDK 21** (Capacitor 8 baseline — every module is compiled at
`JavaVersion.VERSION_21` + `jvmToolchain(21)`, so JDK 17 fails) and **Android
Studio** (SDK/emulator). Then:

```bash
npx cap add android
```

**Post-regen step (required — do this once after every `cap add android`):**
open `android/variables.gradle` and set:

```
minSdkVersion = 26
```

The default Capacitor scaffold writes `24`, but `@capacitor/inappbrowser@4`
pulls `io.ionic.libs:ioninappbrowser-android:2.0.1`, which declares `minSdk 26`
— the manifest merger fails with `uses-sdk:minSdkVersion 24 cannot be smaller
than version 26` otherwise. `android/` is gitignored, so this can't be checked
in; the note must live here.

Then:

```bash
npx cap sync
JAVA_HOME="/c/Program Files/Java/jdk-21" ./android/gradlew -p android assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk (~12 MB)
```

Or, for interactive work, `npx cap open android` and build from Android Studio.

## Still to do on device (can't be verified in the web preview)

- Tune the in-app webview options + the payment-route interception against real navigation.
- Android permissions for the microphone (speaking/pronunciation/shadowing).
- Push notifications (FCM), app icon/splash, then Play closed-testing.
