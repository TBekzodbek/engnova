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
├── src/
│   ├── design/tokens.ts       colors / radii / motion / type (single source of truth)
│   ├── styles/globals.css     tokens as CSS custom properties (dark+light)
│   ├── i18n/                  UZ default + RU + EN; ready-to-paste key spine
│   ├── lib/tracks.ts          track defs: live URL, blocked payment patterns, tint tokens
│   ├── lib/webview.ts         opens the site in @capacitor/inappbrowser; blocked URL
│   │                          → bounced OUT to the system browser (@capacitor/browser)
│   ├── screens/ChooserScreen  hero + subhead + rich track cards + language chip
│   ├── products/ProductScreen loading / slow / error / offline / web-preview states
│   └── components/            LanguageChip, LanguageSheet, ConfirmDialog
├── assets/brand/              source-of-truth icon SVGs (see "App icon" below)
└── android-overrides/         native customizations mirrored → android/ (see "Android" below)
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

## Building the Android app

Requires **JDK 21** (Capacitor 8 baseline — every module is compiled at
`JavaVersion.VERSION_21` + `jvmToolchain(21)`, so JDK 17 fails) and **Android
Studio** (SDK/emulator).

### First-time setup (from a fresh clone or after deleting `android/`)

```bash
npx cap add android          # capacitor scaffolds the default android/ folder
npm run sync:android         # copies our native customizations from android-overrides/ → android/
```

`npm run sync:android` restores every file we've customized on top of Capacitor's
scaffold: the neon adaptive app icon (foreground + background + monochrome), the
Android 12+ SplashScreen theme, the splash icon drawable, the notification icon,
the `minSdkVersion=26` bump (required by `@capacitor/inappbrowser@4`), and the
MainActivity SplashScreen wiring.

**Why the mirror pattern:** `android/` is gitignored (Capacitor convention — the
folder is largely generated). But we still need our native customizations under
source control. `android-overrides/` is the tracked source of truth; the sync
script copies files at their exact relative paths into `android/`. Idempotent —
re-runs are no-ops when files are identical. See `scripts/apply-android-overrides.mjs`.

### Everyday build

```bash
npm run cap:android          # web build + capacitor sync + apply overrides
JAVA_HOME="/c/Program Files/Java/jdk-21" ./android/gradlew -p android assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk (~12 MB)
```

Or, for interactive work, `npx cap open android` and build from Android Studio.

## App icon — "Northstar Neon"

Source SVGs in `assets/brand/`:

- `icon-full.svg` — static 512×512 peak-frame (used as the launcher icon)
- `icon-animated.svg` — SMIL-animated variant (in-app splash / hero)
- `icon-monochrome.svg` — silhouette (Android 13+ themed icons + notifications)

Wired into Android as VectorDrawables under `android-overrides/app/src/main/res/`:

- `drawable/ic_launcher_background.xml`  bg gradient + bloom + halo
- `drawable/ic_launcher_foreground.xml`  spark rays + star + hot spot
- `drawable/ic_launcher_monochrome.xml`  Material You themed icon
- `drawable/ic_splash.xml`               splash screen mark (transparent bg)
- `drawable/ic_notification.xml`         24dp status-bar silhouette
- `mipmap-anydpi-v26/ic_launcher.xml`    adaptive-icon spec (fg + bg + mono)
- `mipmap-anydpi-v26/ic_launcher_round.xml`  same for round-icon launchers

**512×512 Play Store icon PNG** — export once from `assets/brand/icon-full.svg`
via any SVG-to-PNG tool (e.g. `magick -density 300 icon-full.svg -resize 512x512 icon-512.png`
or a browser screenshot at 512 zoom). No alpha. Sits at `store-assets/icon-512.png`.

## Still to do on device (can't be verified in the web preview)

- Rip out `@capacitor/inappbrowser` in favour of a custom bridge WebView plugin
  (unblocks microphone / hardware-back / URL-allowlist / real error events).
- Android permissions for microphone (speaking practice on both tracks).
- Push notifications (FCM) + deep-link intent filters (App Links).
- Play closed testing (needs 12 opted-in testers × 14 continuous days for
  personal-account first submission).
