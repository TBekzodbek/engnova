# Engnova — Design & Product Brief

> Standalone brief for anyone (designer, Replit AI, contractor) picking up Engnova without prior context. Read top to bottom in ~15 minutes. Everything you need to design or build for this app.

---

## 1. What Engnova is (30 seconds)

**Engnova** is a native Android app for Uzbek English learners. It's a thin native shell (Capacitor) that hosts two independent live-web products behind a chooser:

- **CEFR Academy** (cefracademy.uz) — 0 → C1 English curriculum. Daily plan, mock exams, writing & speaking practice.
- **IELTS Level** (ieltslevel.uz) — official IELTS band preparation across all 4 sections.

The app owns: onboarding, login, chooser, native paywall (planned), and the WebView hosting the two sites. The websites own: the actual learning content, lessons, mock exams, plan generation, everything post-login.

**Package name (locked forever):** `uz.engnova.app`
**Primary market:** Uzbekistan
**Languages shipped:** UZ (default), RU, EN
**Owner-facing repo:** https://github.com/TBekzodbek/engnova
**Owner contact:** engnovaapp@gmail.com

---

## 2. Business context (why the design matters)

- **~250 paying customers on the CEFR side today.** Not thousands — real, small, engaged base.
- **Instagram is the acquisition channel** — ~50% of traffic. Design must feel Instagram-native (young, warm, mobile-first, faces, short-form energy).
- **Uzbekistan's payment gateways are paycom.uz + click.uz.** Google Play Billing is NOT available for these providers — this is why Engnova legally routes ALL payments OUT of the app to the browser (Play policy compliance).
- **Common failure mode observed:** users see "RAVNAQ TALIM AKADEMIYA" on the payment page (Payme/Click's registered merchant name for this business) and abandon because they don't recognize it. Losing ~85% of pay-clickers at handoff. Any paywall design MUST inoculate against this.
- **Conversion baseline:** ~2.5% pricing → pay-click. Every design decision should either raise that number or protect it.

---

## 3. Tech stack

**App shell (this repo, D:\engnova):**
- Vite 8 + React 19 + TypeScript 6
- Capacitor 8 (Android target only for v1)
- @supabase/supabase-js 2.105+ for auth (both tracks use Supabase, different projects)
- @capgo/capacitor-social-login for Google Sign-In
- Sharp + puppeteer-core for image/screenshot tooling
- No CSS framework — hand-written CSS with custom-property tokens
- Font: system-ui stack primarily. Onboarding uses Inter (body) + Noto Serif Display (level badges only)

**Cannot use in this codebase (deliberate):**
- Tailwind — the design is intentionally token-driven with vertical CSS. Switching would fight the existing system.
- Any icon set beyond `lucide-react` (already installed) — adding another creates visual inconsistency.
- Server-side rendering — this is a static Vite bundle wrapped in Capacitor. No SSR.
- Google Play Billing — Play policy blocks it for our payment providers.

**Websites (separate repos, do NOT touch from this repo):**
- `D:\cefrprep` — CEFR Academy site (Vite SPA). Owner controls; deploys to Vercel.
- `D:\ieltslevel\repo` — IELTS Level site (Next.js 15 App Router). Owner controls.

---

## 4. Repo file map (only the parts you'll touch)

```
D:\engnova\
├── src\
│   ├── App.tsx                         top-level phase machine
│   ├── main.tsx                        React root
│   ├── i18n\
│   │   ├── {uz,ru,en}.json             all copy in 3 languages
│   │   └── index.tsx                   useI18n() hook + provider
│   ├── design\
│   │   └── tokens.ts                   MAIN app design tokens
│   ├── styles\
│   │   └── globals.css                 tokens as CSS custom properties
│   ├── components\
│   │   ├── LanguageChip.tsx            top-right lang picker
│   │   ├── LanguageSheet.tsx           bottom-sheet lang selector
│   │   ├── ConfirmDialog.tsx           reusable modal
│   │   └── SplashCover.tsx             matches native splash
│   ├── screens\
│   │   ├── ChooserScreen.tsx           OLD track picker (still used as fallback)
│   │   ├── LoginScreen.tsx             email+password + Google Sign-In button
│   │   └── OnboardingScreen.tsx        LEGACY 3-slide intro (deprecated)
│   ├── onboarding\                     NEW 10-screen flow (built 2026-08-13)
│   │   ├── tokens.css                  scoped --onb-* palette
│   │   ├── Spine.{tsx,css}             signature amber spine
│   │   ├── Shell.{tsx,css}             screen layout wrapper
│   │   ├── primitives.{tsx,css}        Card/PrimaryButton/VerdictBadge/etc
│   │   ├── state.ts                    answer types + localStorage persistence
│   │   ├── OnboardingFlow.tsx          10-screen state machine
│   │   └── screens\
│   │       ├── S1Language.tsx          language pick
│   │       ├── S2Welcome.tsx           30-sec expectation
│   │       ├── S3Goal.tsx              5 goal cards (drives everything)
│   │       ├── S4Deadline.tsx          4 timeline cards
│   │       ├── S5Level.tsx             self-report level
│   │       ├── S6MiniQuiz.tsx          3 grammar cloze questions
│   │       ├── S7Verdict.tsx           BIG level badge + aspiration
│   │       ├── S8Track.tsx             track recommendation (with escape)
│   │       ├── S9Social.tsx            3 testimonial cards
│   │       ├── S10Commitment.tsx       daily-minutes
│   │       └── shared.css              stack/testi/aspiration/langcode
│   ├── products\
│   │   └── ProductScreen.tsx           post-login WebView host
│   ├── lib\
│   │   ├── tracks.ts                   CEFR + IELTS definitions
│   │   ├── supabaseClients.ts          per-track Supabase clients
│   │   ├── authState.ts                @capacitor/preferences wrapper
│   │   ├── authFlow.ts                 logout / session helpers
│   │   ├── mapAuthError.ts             Supabase error → i18n key
│   │   ├── googleAuth.ts               @capgo/capacitor-social-login wrapper
│   │   └── webview.ts                  native EngnovaWebView plugin bridge
│   └── illustrations\
│       ├── CefrLadder.tsx              A1-C1 SVG ladder
│       └── IeltsArc.tsx                4-9 SVG arc (band gauge)
├── android\                            gitignored — regenerated by cap add
├── android-overrides\                  tracked; copied into android/ by sync script
│   └── app\src\main\
│       ├── AndroidManifest.xml
│       ├── java\uz\engnova\app\
│       │   ├── MainActivity.java
│       │   └── EngnovaWebViewPlugin.java  ~300 LOC custom native plugin
│       └── res\
│           ├── drawable\               launcher icon VectorDrawables
│           ├── mipmap-{d}\             density-specific PNG launcher icons
│           └── values\styles.xml       Android 12+ SplashScreen theme
├── assets\brand\
│   ├── icon-full.svg                   512x512 static peak-frame Northstar Neon
│   ├── icon-animated.svg               SMIL animated variant
│   └── icon-monochrome.svg             silhouette for themed icons
├── store-assets\                       Play Console upload assets
│   ├── icon-512.png                    launcher, no alpha
│   ├── feature-graphic.png             1024x500 store hero
│   ├── screenshots\{uz,ru,en}\         4 shots per locale
│   ├── store-listing.md                short + full descriptions in 3 langs
│   ├── data-safety-form.md             Play Data Safety walkthrough
│   ├── privacy-policy.{md,html}        published at cefracademy.uz/engnova-privacy.html
│   ├── SUBMISSION-CHECKLIST.md         master Play Console walkthrough
│   ├── google-signin-setup.md          Google Cloud + Supabase config
│   ├── onboarding-research.md          2800-word competitor research
│   ├── tester-recruitment.md           templates for 12-tester recruitment
│   ├── assetlinks-cefracademy.public.json
│   └── assetlinks-ieltslevel.public.json
├── scripts\
│   ├── apply-android-overrides.mjs     sync android-overrides/ → android/
│   ├── export-store-graphics.mjs       sharp: SVG → PNG at all sizes
│   ├── capture-screenshots.mjs         puppeteer: 12 Play screenshots
│   ├── capture-onboarding.mjs          puppeteer: walk new onboarding
│   ├── generate-upload-keystore.mjs    interactive keystore setup
│   └── preflight-check.mjs             greps for regression of 8 audit fixes
├── capacitor.config.ts                 Capacitor config (no server.url — offline-safe)
├── package.json                        npm scripts (see §11)
└── vite.config.ts                      Vite build config
```

---

## 5. Design system

### 5a. Main app tokens (`src/design/tokens.ts` + `src/styles/globals.css`)

The MAIN app (post-onboarding) uses an indigo-on-black palette:

| Token | Value | Role |
|---|---|---|
| `--color-bg` | `#08080C` | Splash + app ground |
| `--color-surface` | `#141420` | Card / panel |
| `--color-surface-hi` | `#1F1F30` | Hover / pressed |
| `--color-ink` | `#EDEFF6` | Primary text |
| `--color-muted` | `#9AA0B1` | Secondary text |
| `--color-accent` | `#554be7` | **Indigo spine — brand primary** |
| `--color-accent-soft` | `rgba(85, 75, 231, 0.15)` | Accent tint |
| `--color-line` | `rgba(237, 239, 246, 0.08)` | Borders |
| `--color-line-hi` | `rgba(237, 239, 246, 0.16)` | Borders (hover) |
| `--track-cefr-shell` | `#554be7` | CEFR-track tint (matches accent) |
| `--track-ielts-shell` | `#6b56ff` | IELTS-track tint (slightly warmer indigo) |
| `--radius-sm` / `-md` / `-full` | 8/14/9999px | Corner radii |
| `--motion-fast` / `-base` / `-slow` | 160/260/460ms | Duration scale |
| `--ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Quart-out ease |

### 5b. Onboarding tokens (`src/onboarding/tokens.css`)

**Deliberately different palette** — the onboarding is a "welcome experience" with its own visual voice (mentor/notebook), then the user "graduates" into the main app which is indigo:

| Token | Value | Role |
|---|---|---|
| `--onb-ground` | `#0C0A1A` | Warm dark navy (NOT pure black) |
| `--onb-paper` | `#16132B` | Card background |
| `--onb-paper-hi` | `#211D3B` | Hover |
| `--onb-ink` | `#F0EEE6` | Warm cream (NOT #FFF — ink-on-paper feel) |
| `--onb-muted` | `#837CA0` | Muted lavender-gray |
| **`--onb-spine`** | **`#FFB86B`** | **AMBER — the signature. Every English app is green/blue/red/white; amber = study lamp** |
| `--onb-accent` | `#8B7CFF` | Softer indigo for CTAs (secondary role) |

**Typography split:**
- Body: Inter (system stack fallback) — reliable Cyrillic + Latin for UZ/RU/EN
- Display: **Noto Serif Display used ONLY for level badges** (A2, B1, IELTS 7.0) — serif = "grade on a report card" — emotional hook

**Motion tokens:** same ease curve as main app (`cubic-bezier(0.22, 1, 0.36, 1)`), 3 durations (fast 160, base 280, slow 420ms), plus one special 900ms for the S7 verdict badge reveal.

### 5c. Visual hierarchy rules (both palettes)

- **Text sizes:** eyebrow 11px, meta 13px, body 15-16px, headline 28-32px, verdict badge 72px
- **Spacing:** 4/8/12/16/24/28/32/48 px scale (via `gap` in flex/grid, NOT margin — margin collapsing bugs)
- **Focus rings:** 2px offset ring in the accent color (amber for onb, indigo for main)
- **Corner radii:** 8 (chips), 14 (cards/buttons), 22 (large panels), full (pills)
- **Every color has DARK theme only** — the app is dark-only intentionally (matches Uzbek learner Instagram-consumption context; light theme not planned)

---

## 6. Current screens (what exists on 2026-08-13)

### 6a. Main app phase machine

```
booting → onboarding → chooser → login → product
                    ↘ (skipped if track saved) ↗
```

- **booting** (`<SplashCover>`) — renders while `bootRoute()` resolves
- **onboarding** (`<OnboardingFlow>`) — NEW 10-screen amber flow, only on first launch
- **chooser** (`<ChooserScreen>`) — 2-card CEFR vs IELTS picker; escape hatch from onboarding, also destination for "Switch track" from ProductScreen
- **login** (`<LoginScreen>`) — email + password + Google Sign-In button, per-track branded
- **product** (`<ProductScreen>`) — native shell holding the site in a WebView with track-tinted loading/error states

### 6b. Onboarding — the 10 screens shipped 2026-08-13

Each has an amber vertical **Spine** on the left (12-dot progression, fills bottom-up with amber as user advances).

| # | Screen | Question / What it does |
|---|---|---|
| S1 | Language | Silent default UZ; 3 flag cards; sets `engnova.lang` |
| S2 | Welcome | "30 seconds — not a form"; expectation-setting; Skip escape hatch → old chooser |
| S3 | **Goal** | 5 cards: IELTS / DTM / Work / Travel / From-zero. This drives S8's recommendation |
| S4 | Deadline | 1mo / 3mo / 6mo / no rush; feeds the aspiration line on S7 |
| S5 | Level | 5 self-report cards (plain UZ, not CEFR jargon); "Not sure" → S6, else → S7 |
| S6 | Mini-quiz | 3 grammar cloze q's (A1/A2/B1); scoring: 3/3→B2, 2/3→B1, 1/3→A2, 0/3→A1 |
| S7 | **Verdict** | Big serif band + amber halo + aspiration ("3 oyda B1 ga chiqishingiz mumkin"); Spine reveals CEFR ladder labels (A0..C1) |
| S8 | Track | Recommendation card (not fork) with escape link to the other track |
| S9 | Social proof | 3 Uzbek testimonial cards (currently amber-initial faces; owner to swap for real photos) |
| S10 | Commitment | 4 daily-minutes cards; final CTA → LoginScreen (with saved track) |

State persists to `localStorage` (`engnova.onboarding.answers.v1`) between screens — a backgrounded app resumes at `firstIncompleteStep()`.

### 6c. Screenshots available

- `store-assets/screenshots/uz/{01..04}.png` — chooser, onboarding-old (screens will need re-capture after new flow deploys), login-cefr, language-sheet — all at 1080×1920
- `D:/tmp/onb-shots/*.png` — captured walkthrough of new 10-screen onboarding (S1..S10 in UZ)

---

## 7. What still needs designing

### 7a. S11 — Register (deferred within onboarding)

Currently the flow hands off to the existing `<LoginScreen>` after S10. Research says the correct pattern is: onboarding should end at a REGISTER form (with Google Sign-In prominent), NOT the login form — because most users at this point are new, and having "Google" as a primary CTA is what closes them.

**To design:** an S11 that:
- Has "Continue with Google" as the primary CTA above the fold
- Below it: email + password fields (for people who don't want Google)
- Uses answers from S3+S4+S7+S10 to personalize the headline ("Rejangizni saqlaymiz — email kiriting")
- Preserves all the onboarding answers into Supabase user metadata on first sign-up so the site can pick up the plan config
- Bounces existing users to the login flow if the email is already registered

### 7b. S12 — Native paywall (deferred)

Currently the paywall lives on the SITE (cefracademy.uz/dashboard/pricing). Research says a NATIVE paywall in the shell can lift conversion because:
- We can personalize the headline with the user's stated goal + deadline verbatim
- We can put the **merchant-name inoculation card** ("To'lov sahifasida RAVNAQ TALIM AKADEMIYA deb chiqadi — bu bizmiz") RIGHT ABOVE the pay CTA
- The pay button then hands off to paycom.uz / click.uz in Chrome Custom Tab (already wired via `paymentHosts` in `src/lib/tracks.ts`)

**To design:** an S12 that:
- Dynamic headline built from S3 (goal) + S4 (deadline) + S7 (verdict): "**IELTS 7.0** ni **3 oy**da olish uchun — to'liq reja tayyor"
- Two tier cards side-by-side (1-month / 3-month with "-25%" badge)
- Social proof strip: "⭐ 4.9 · 250+ to'lovchi o'quvchi"
- **The merchant-name warning card** immediately above the pay CTA — this is the single most important element
- Pay CTA opens the site's checkout in a Chrome Custom Tab
- Small "Skip for now — try one lesson first" link at the bottom (routes to LoginScreen)

### 7c. Post-login product screens (mostly out of scope)

The dashboard, lessons, mock exams, plan view, pricing, all live on cefracademy.uz + ieltslevel.uz (different repos). The APP just hosts them in a WebView. Any design change to the actual learning experience happens on the SITE, not here.

**Exceptions the app does control:**
- Loading state / error state / offline state of the WebView (`src/products/ProductScreen.tsx`) — already designed, could be refined
- Track-switching confirmation dialog (already exists)
- The topbar with track name + Switch + Logout buttons — could be redesigned

### 7d. Real testimonial photos

S9 currently uses amber-initial circles ("A", "S", "K") for the 3 testimonials. Owner needs to provide real photos + real quotes with signed permission. Design task: replace initial circles with 44px round photos while keeping the amber ring styling.

---

## 8. Design constraints (non-negotiable)

1. **No in-app payments** — Play policy. All pay goes to browser via Chrome Custom Tab. Design accordingly (paywall is a pitch + a button, never a checkout form).
2. **Trilingual UZ/RU/EN, UZ default** — every string must have all 3. Copy in the informal Instagram-audience register (see existing i18n JSON files for tone reference). NO time-to-result claims, NO outcome guarantees, NO refund/money-back copy — house rules.
3. **Mobile-first** — primary viewport 375×812. Also render clean at 1080×1920 (Play screenshot size). Test both.
4. **No auto-play sound** — Uzbek learners open the app in public / class / late-night. Audio only on explicit tap.
5. **No dark/light toggle** — dark-only.
6. **Amber spine STAYS in onboarding only** — the main app is indigo. Don't leak amber into ProductScreen; the user "graduates" into indigo after login.
7. **Serif display face STAYS in onboarding only** — level badges are the only serif surface in the whole app.
8. **No text below 12px on mobile viewport** — 11px is the floor for eyebrows/labels only.
9. **Every question must change a later screen** — see `store-assets/onboarding-research.md`. If you add a question that doesn't feed the paywall or the recommendation, cut it.
10. **The RAVNAQ TALIM merchant-name inoculation must appear ABOVE any pay CTA** — biggest silent bounce cause in Uzbekistan checkout.

---

## 9. Brand assets

- Icon source: `assets/brand/icon-full.svg` — "Northstar Neon" — 4-point compass star + chromatic halo + spark rays on dark ground. Signature indigo bloom.
- Animated icon: `assets/brand/icon-animated.svg` — SMIL animation (halo breathes, rays drift, hot spot twinkles)
- Monochrome silhouette: `assets/brand/icon-monochrome.svg` — for Android 13+ themed icons
- Play graphics: `store-assets/icon-512.png`, `store-assets/feature-graphic.png` — already rasterized
- No wordmark yet — brand name is currently rendered as text in Inter Bold. Design opportunity here.

---

## 10. How to run in Replit (or any browser IDE)

**Import from GitHub:** `TBekzodbek/engnova` on Replit.

**Install:**
```bash
npm install
```

**Start dev server:**
```bash
npm run dev
# → http://localhost:5174
```

Replit's built-in browser preview will render the app at whatever viewport it defaults to. To simulate mobile:

- Open Chrome DevTools (F12) inside Replit's preview
- Toggle device toolbar (Ctrl+Shift+M)
- Select "iPhone SE" (375×667) or custom (375×812)

**To reset onboarding while iterating** (paste in Chrome console):
```js
Object.keys(localStorage).forEach(k => localStorage.removeItem(k))
localStorage.setItem('engnova.lang', 'uz')
location.reload()
```

**To skip to a specific onboarding screen** (paste in Chrome console, then reload):
```js
// Skip to S7 (verdict) with B2 result
localStorage.setItem('CapacitorStorage.engnova.onboardingDone.v1', '0')
localStorage.setItem('engnova.onboarding.answers.v1', JSON.stringify({
  goal: 'ielts', deadline: 'in3', selfLevel: 'unsure',
  quiz: { correct: 3, total: 3, verdict: 'B2' }
}))
location.reload()
```

**What Replit CAN'T do:**
- Build Android APKs (needs JDK 21 + Android SDK + gradle — ~4 GB of tooling)
- Run the native EngnovaWebView plugin (Java-only, needs real Android runtime)
- Anything native — Replit is web-preview only

**What Replit IS good for:**
- Designing new screens / iterating on colors, typography, layout
- Copy edits across `src/i18n/*.json`
- Playing with animations and transitions
- Prototyping S11 register and S12 paywall (the two deferred screens)
- Trying different palettes and testing them across all screens quickly

**Workflow for designer/Replit-user + owner:**
1. Designer works in Replit, iterates on screens in web preview
2. Commits changes to a branch (e.g. `design/paywall-v1`)
3. Owner (or me) pulls the branch locally, runs `npm run build:apk:release` to produce a signed APK with the design baked in
4. Install APK, test on real Android device
5. Merge to main when approved

---

## 11. npm scripts (all defined in `package.json`)

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server at :5174 (hot reload) |
| `npm run build` | `tsc --noEmit && vite build` — type-check + production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run sync:android` | Copy `android-overrides/` into `android/` (idempotent) |
| `npm run cap:android` | Full pipeline: web build + cap sync + apply overrides |
| `npm run keystore:generate` | Interactive: create the Play upload keystore |
| `npm run graphics:export` | Rasterize icon + feature graphic + launcher PNGs via sharp |
| `npm run screenshots:capture` | Puppeteer: capture 12 Play-spec screenshots (needs dev server running) |
| `npm run build:apk:debug` | Debug APK for local install (unsigned or auto-debug-signed) |
| `npm run build:apk:release` | Signed release APK (needs keystore configured) |
| `npm run build:aab` | Signed release AAB (what you upload to Play Console) |
| `npm run preflight` | Grep-based regression check on 10 known-invariant fixes |

---

## 12. Auth architecture (Supabase)

**Two separate Supabase projects, one per track.** Same email can have accounts in both (they're independent user pools).

| Track | Supabase URL | Anon key env var |
|---|---|---|
| CEFR | `https://mctcstvjdpcnzypfjhka.supabase.co` | `VITE_CEFR_SUPABASE_ANON_KEY` |
| IELTS | `https://qpukasdtcwwgnehpjhud.supabase.co` | `VITE_IELTS_SUPABASE_ANON_KEY` |

Both use `sb_publishable_*` new-format keys (2024+) OR legacy `eyJ...` JWT anon keys. Both formats work with `@supabase/supabase-js@2.105+`.

`src/lib/supabaseClients.ts` handles lazy per-track instantiation with `flowType: 'pkce'` and `detectSessionInUrl: false`.

**Email confirmation is currently DISABLED on both projects.** New signups get `email_confirmed_at` set immediately. This makes testing easy but should probably flip ON before shipping to production.

**Google Sign-In:** wired via `@capgo/capacitor-social-login`. Owner-side Google Cloud setup docs in `store-assets/google-signin-setup.md`. Button is HIDDEN in the app until `VITE_GOOGLE_WEB_CLIENT_ID` is populated.

**Working test accounts** (for design iteration — both accounts have empty progress, no premium):

| Track | Email | Password |
|---|---|---|
| CEFR | `engnova.test.alpha@gmail.com` | `AlphaTest2026!` |
| CEFR | `engnova.test.beta@gmail.com` | `BetaTest2026!` |

---

## 13. Play Store status

- Package: `uz.engnova.app`
- Upload keystore: generated + backed up locally (owner has it)
- SHA-1 of upload key: `4C:C8:38:1F:F8:0D:C4:16:14:50:EB:8F:AE:D6:0A:7D:75:39:13:C5`
- SHA-256: `1E:E5:98:0B:AB:64:22:CA:E4:C5:82:86:5E:C8:B7:7F:CC:BF:51:25:99:4A:17:22:B1:82:49:79:A5:3A:FE:67`
- Play Console app: created; identity verification pending Google (24-48h)
- Privacy policy live: https://cefracademy.uz/engnova-privacy.html
- App Links assetlinks published for cefracademy.uz (ieltslevel pending git-proxy push)
- Not yet submitted for review — waiting on 12-tester recruitment for closed testing 14-day window

Full walkthrough: `store-assets/SUBMISSION-CHECKLIST.md`

---

## 14. Memory / rules that came from prior incidents

These are historical decisions that MUST NOT be reversed even if the design refresh suggests it:

- **NEVER touch pre-dashboard site code from this repo** — landing, survey, plan, results, pricing all live in `D:\cefrprep` and have their own owner-approved constraints. Any change to the site requires a separate PR in that repo.
- **NEVER write time-to-result claims in real copy** — "Learn English in 2 weeks" is forbidden. Fake social-proof notifications on the site are exempted per owner's earlier decision.
- **NEVER route in-app payments through Google Play Billing** — Play policy exemption relies on external browser handoff.
- **NEVER write user passwords to disk (including memory files) — even briefly.** The two test accounts above are the only exception because they're throwaway test accounts on a controlled email.
- **NEVER regress the 8 audit fixes captured in `scripts/preflight-check.mjs`** — running `npm run preflight` should always return 10/10 PASS.

---

## 15. Quick "what should I design first?" recommendation

If you're picking this up and want the highest-impact 5 hours:

1. **S11 register** with Google Sign-In prominent (see §7a) — closes the onboarding→signup gap that currently drops users onto the plain LoginScreen
2. **S12 paywall** with the RAVNAQ TALIM inoculation card (see §7b) — biggest expected conversion lift
3. **Replace the 3 amber-initial testimonial faces on S9** with real photo cards (44px round, amber ring border) — trust signal
4. **Chooser refresh** — current `ChooserScreen.tsx` is functional but dated. Since S8 is the new primary chooser, the fallback chooser deserves a matching refresh
5. **Login/logout error states polish** — currently functional but not distinctive

Anything past that is icing — the above 5 are the ones the research report + observed conversion data actually justify.

---

**Questions? Read `store-assets/onboarding-research.md` for the 2800-word competitor + conversion research report that informed the amber-spine design direction.**
