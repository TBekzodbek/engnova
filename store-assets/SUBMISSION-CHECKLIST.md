# Engnova — Play Console Submission Checklist

Single walk-through doc. Open Play Console side-by-side and tick each box as you go. Section order matches the Play Console left-nav so nothing gets skipped.

Package name (locked, cannot ever change): **uz.engnova.app**
App name: **Engnova**
Category: **Education**

Everything upstream of Play Console is assumed done:
- Upload keystore generated + backed up (see release-build path, Ticket 1)
- Signed AAB built via `npm run build:aab` → `android/app/build/outputs/bundle/release/app-release.aab`
- 512 PNG icon exportable via `npm run icon:export` → `store-assets/icon-512.png`
- Feature graphic SVG in `store-assets/feature-graphic.svg` (rasterize to 1024x500 PNG before upload)
- Store listing copy drafted in `store-assets/store-listing.md`
- Data Safety declarations drafted in `store-assets/data-safety-form.md`
- Privacy policy drafted in `store-assets/privacy-policy.md`
- Screenshot plan in `store-assets/screenshot-plan.md`

---

## 0. Prerequisites (~1 day, one-time)

- [ ] Google Play Developer account paid ($25 USD one-time, personal or organization)
- [ ] Google account has 2FA enabled (Play requires it for publishers)
- [ ] Developer identity verification submitted (Play now requires ID + address for new personal-account developers — this can take up to 48 h to clear before you can publish)
- [ ] Merchant profile — **SKIP**. Free app with no in-app billing. Uzbekistan's paycom.uz / click.uz do not go through Google Play Billing and are declared as external.
- [ ] Privacy policy published at a stable, public HTTPS URL (paste the final URL below when you have it):
      URL: `________________________________________`
      Constraint: must be reachable without login, must mention "Engnova" by name, must list every data type declared in Data Safety.

---

## 1. Create app (Play Console → All apps → Create app)

- [ ] App name: **Engnova**
- [ ] Default language: **Uzbek (uz-UZ)** if the dropdown offers it; otherwise **English (en-US)** and add Uzbek as an additional language on the Store Listing page.
- [ ] App or game: **App**
- [ ] Free or paid: **Free**
- [ ] Declarations (checkboxes at the bottom of Create app):
  - [ ] "This app is compliant with the Developer Program Policies" — YES
  - [ ] "This app is compliant with US export laws" — YES
- [ ] Click **Create app**.

---

## 2. Dashboard → Set up your app (top task list)

Play surfaces a task checklist on the app dashboard. You will complete every task before the **Send for review** button unlocks. Sections 3–13 below map to these tasks in order.

---

## 3. Store listing (Grow → Store presence → Main store listing)

- [ ] Short description (80 chars max) — paste per locale from `store-assets/store-listing.md`:
  - [ ] Uzbek
  - [ ] Russian
  - [ ] English
- [ ] Full description (4000 chars max) — paste per locale from `store-assets/store-listing.md`:
  - [ ] Uzbek
  - [ ] Russian
  - [ ] English
- [ ] App icon → upload `store-assets/icon-512.png` (512x512, 32-bit PNG with alpha, <1 MB)
- [ ] Feature graphic → rasterize `store-assets/feature-graphic.svg` to 1024x500 PNG, upload (required, cannot be transparent)
- [ ] Phone screenshots — 2 to 8 per locale, 16:9 or 9:16, 320–3840 px per side. Upload from:
  - [ ] `store-assets/screenshots/uz/` (2–8 files)
  - [ ] `store-assets/screenshots/ru/` (2–8 files)
  - [ ] `store-assets/screenshots/en/` (2–8 files)
- [ ] 7-inch tablet screenshots — **SKIP for v1** (phone-only launch)
- [ ] 10-inch tablet screenshots — **SKIP for v1**
- [ ] Promo video (YouTube URL) — **SKIP for v1**
- [ ] Tags — pick 1–5 from Play's list (suggested: Education, Language learning). Only shown once app hits enough installs; still safe to add.
- [ ] Category (in the sidebar):
  - [ ] App category: **Education**
- [ ] Contact details:
  - [ ] Email: `________________________________` (required; must be a mailbox you monitor — this is where Play sends rejection notices)
  - [ ] Phone: `________________________________` (optional; leave blank if you don't want it public)
  - [ ] Website: `https://engnova.uz` (or whichever landing you're using)
- [ ] External marketing → **OFF** (Play may promote us organically without pre-launch marketing consent)
- [ ] Click **Save**.

---

## 4. Store settings (Grow → Store presence → Store settings)

- [ ] App category: **Education** (mirrors the store-listing choice)
- [ ] Store listing contact details — mirror what you set above.
- [ ] External marketing: **OFF**.

---

## 5. Content rating (Policy → App content → Content ratings)

Click **Start questionnaire**. Provide the same contact email as above; category = **Reference, News, or Educational**.

Answer YES / NO honestly — the entries below are what Engnova should truthfully answer:

- [ ] Violence — **None**
- [ ] Sexuality / nudity — **None**
- [ ] Profanity / crude humor — **None**
- [ ] Controlled substances (alcohol / tobacco / drugs) — **None**
- [ ] Gambling / simulated gambling — **None**
- [ ] Horror / fear-inducing content — **None**
- [ ] Users can interact / communicate — **YES**. Speaking-mock uses the microphone, and the site's own systems accept free-form writing. There is no user-to-user chat; make that clear in the "Describe the interaction" free-text field.
- [ ] User-generated content shared publicly — **NO**. All writing/speaking is private to the learner + graders.
- [ ] Users can share their location — **NO**
- [ ] Digital purchases inside the app — **NO** (external checkout in Chrome Custom Tab; declared separately in Data Safety and Ads sections)
- [ ] Web browsing (unrestricted) — **NO**. The WebView loads only two allow-listed domains (cefracademy.uz, ieltslevel.uz).
- [ ] Submit questionnaire. Target rating badges: **IARC 3+ / ESRB Everyone / PEGI 3 / USK 0**.

---

## 6. Target audience and content (Policy → App content → Target audience)

- [ ] Target age groups — check **13, 14–15, 16–17, 18+**. Do NOT check 12 and under (would trigger the Designed for Families / COPPA compliance regime, which we don't need and don't want to sign the extra attestations for).
- [ ] Appeal to children — **NO**
- [ ] Ads shown to children — N/A (no ads at all)

---

## 7. News apps (Policy → App content → News apps)

- [ ] Is your app a news app? — **NO**

---

## 8. COVID-19 contact tracing or status apps

- [ ] Is your app a COVID-19 contact tracing or status app? — **NO**

---

## 9. Data safety (Policy → App content → Data safety)

Walk through the form with `store-assets/data-safety-form.md` open next to you — that file is the source of truth for every answer.

- [ ] Does your app collect or share any of the required user data types? — **YES** (email, user IDs, audio recordings, other user-generated content) — the exact four types declared in `data-safety-form.md` §"Data types collected"
- [ ] For each declared data type, complete: collected / shared / optional / purpose / encryption / user can request deletion.
- [ ] Data is encrypted in transit — **YES** (HTTPS + Supabase TLS)
- [ ] User can request data deletion — **YES**; deletion URL and email are on the privacy-policy page.
- [ ] Independent security review — **NO** (leave unchecked; declaring YES obliges you to publish the report).
- [ ] Play Families Policy compliance — **NO** (not targeted at children).
- [ ] Certify accuracy → check the box and click **Submit**.

---

## 10. Government apps

- [ ] Is your app a government app? — **NO**

---

## 11. Financial features

- [ ] Does your app provide financial features? — **NO**. Paycom / Click integrations open in an external Chrome Custom Tab; the APK ships no financial UI, no billing, no crypto, no lending, no PFM.
- [ ] If Play insists on more detail: choose **Not a financial app**.

---

## 12. Health apps

- [ ] Is your app a health app? — **NO**

---

## 13. Ads (Policy → App content → Ads)

- [ ] Does your app contain ads? — **NO**
      (Confirms the "Contains ads" badge stays OFF in the store.)

---

## 14. App access (Policy → App content → App access)

Login is required to reach most functionality (dashboard, mocks, speaking, writing), so the reviewer needs a test account for **each** track. Create dedicated review-only accounts on both products (never share a real user's credentials):

- [ ] Create review account for **CEFR Academy** on cefracademy.uz. Suggested email: `play-review+cefr@engnova.uz`.
- [ ] Create review account for **IELTS Level** on ieltslevel.uz. Suggested email: `play-review+ielts@engnova.uz`.
- [ ] Both accounts must have an active (dev-comped) subscription so the reviewer can open paywalled screens.
- [ ] In Play Console → App access, choose **All or some functionality is restricted**.
- [ ] Add two instruction blocks (one per track). For each:
  - [ ] Username: the review email
  - [ ] Password: the review password
  - [ ] Any other information: "From the chooser screen, tap [track name] to enter this account's product."
- [ ] Save.

---

## 15. Government apps + News + Financial + Health

(Already covered above — just make sure each shows the green check on the App content page.)

---

## 16. Advertising ID (Policy → App content → Advertising ID)

- [ ] Does your app use advertising ID? — **NO** (we ship no analytics or ad SDK, no `com.google.android.gms.permission.AD_ID`; permission has been removed from the manifest so Play accepts NO without warning).

---

## 17. Actions on Google, Health Connect, VPN, etc.

- [ ] Any dedicated question that appears: answer **NO**. Engnova uses none of these APIs.

---

## 18. Upload the app bundle (Release → Testing → Closed testing)

We publish through **closed testing** first, not straight to production — Play's personal-account rule requires 14 continuous days of closed testing with 12+ opted-in testers before your first production release is unblocked.

- [ ] In Release → Testing → **Closed testing**, click **Create track**. Name it `initial-closed` (Play defaults it to "Alpha", either is fine).
- [ ] **Create new release**.
- [ ] Play offers to enable **Play App Signing** — accept (upload key stays with you; Play signs the deployed APK). This is mandatory for new apps.
- [ ] App bundles → **Upload** → pick `android/app/build/outputs/bundle/release/app-release.aab`.
- [ ] Wait for Play's automatic scan. Verify in the bundle explorer:
  - [ ] versionCode + versionName match `android-overrides/app/build.gradle`
  - [ ] targetSdk ≥ Play's current-year floor (2026 floor is SDK 35; verify Play's rejection banner if any)
  - [ ] Native ABIs include arm64-v8a (Play requires 64-bit)
  - [ ] Permissions list matches the manifest — only `INTERNET`, `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `POST_NOTIFICATIONS` (if declared) should appear. If any surprise permission shows up, stop and audit.
  - [ ] Zero policy warnings on the release page (blue info banners are fine; red or yellow warnings must be resolved first)
- [ ] Release name — leave as versionName.
- [ ] Release notes — 500 chars max per locale. First release suggestion: "Birinchi versiya — CEFR Academy va IELTS Level'ni bitta ilovada." (add RU + EN translations).
- [ ] Click **Save**, then **Review release**, then **Start rollout to Closed testing**.

---

## 19. Recruit closed testers (Release → Testing → Closed testing → Testers tab)

- [ ] Create a Google Group or email list with **≥ 12** tester Gmail addresses (Play counts opted-in installs, not invites — you likely need 15+ invites to land 12 opt-ins).
- [ ] Add the list under **Testers → Add email list**.
- [ ] Copy the **Opt-in URL** and share it with every tester along with clear instructions: open the link on their Android phone, accept, wait ~15 min, then install from Play.
- [ ] Confirm each tester actually installs — Play's dashboard shows opted-in tester count. Do not start the 14-day clock until you see 12+ opted in.
- [ ] Ship the release and start the 14-day timer. Note the date the counter starts here: `______________`.

---

## 20. Pre-launch report (Release → Testing → Pre-launch report)

Play auto-runs the AAB on a farm of physical devices (~10 min after upload). Review the report:

- [ ] Crashes — target zero. If any: reproduce with `adb logcat`, fix, bump versionCode, upload a new bundle to the same closed track.
- [ ] Performance — no obvious jank in the trace, cold start under a few seconds.
- [ ] Accessibility — review flagged items (contrast, tap targets); fix any low-hanging ones.
- [ ] Security & trust — must be all-green. Any WebView JS-interface / mixed-content / deprecated-crypto flags block promotion.
- [ ] Screenshots per device — spot-check that the chooser + login screens rendered correctly on every device the farm tried.

---

## 21. During the 14-day closed test

- [ ] Ask testers for real feedback (both tracks, both languages, screen readers where possible).
- [ ] Watch **Quality → Android vitals** daily for crashes and ANRs. Crash-free rate below 99% before day 14 = fix + reset the clock.
- [ ] Answer any tester reviews (they show up under Ratings, even in closed testing).
- [ ] Keep the release live on the closed track for the full 14 continuous days. Uploading a fix does not reset the clock as long as the track never goes dark.

---

## 22. Promote to production (Release → Production)

Only after the 14 days elapse AND opted-in tester count stayed ≥ 12 the whole time:

- [ ] Release → Production → **Create new release** → **Promote from Closed testing** → pick the release you just qualified.
- [ ] Release notes — copy the closed-testing notes.
- [ ] **Countries / regions** — start with **Uzbekistan** only. Add RU + KZ + KG once first-week vitals look clean.
- [ ] **Staged rollout** — set to **20 %**.
- [ ] Save → Review release → **Start rollout to Production**.
- [ ] Play submits for human review (usually 24–72 h, sometimes up to 7 days for first-timers).
- [ ] Monitor for 3 days: Android vitals crash-free rate ≥ 99.5 %, no spike in 1-star ratings, no policy notices in Inbox. If clean, bump the rollout to 50 %, then 100 %.

---

## 23. After launch — for every update, forever

- [ ] Bump `versionCode` (integer, +1) and `versionName` (semver, e.g. 1.0.1) in `android-overrides/app/build.gradle`.
- [ ] `npm run build:aab` → new signed AAB.
- [ ] Release → Production → **Create new release** → upload the AAB.
- [ ] Fill release notes in every locale (Uzbek, Russian, English).
- [ ] Start rollout at 20 %, ramp after vitals clear.
- [ ] For risky changes, ship to Closed testing first, run for a few days, then promote.

---

## 24. Common rejections + how to preempt them

**Payments policy (Play billing violations).** Google's blanket rule is "digital content sold inside your app must use Play Billing." Our escape hatch: we sell nothing inside the APK. The pricing pages, checkout screens, and success/cancel returns all open in a Chrome Custom Tab against paycom.uz and click.uz, which are Uzbekistan's national payment gateways and are ineligible for Play Billing (Play Billing does not support UZS through paycom/click). Data Safety declares zero "purchases" data types and the Ads section confirms no in-app monetization. If a reviewer flags this, point to the Uzbek regional carve-out and the fact that no purchase UI exists inside the APK bundle.

**Sensitive permission (RECORD_AUDIO).** Any app requesting RECORD_AUDIO gets extra scrutiny. Justification lives in the full description ("Speaking practice — the app records short audio when you tap the record button in a speaking mock") and in the runtime prompt copy. The permission is used only inside `getUserMedia()` when the learner opens a speaking mock; nothing runs in the background, no continuous capture, no upload without an explicit tap. Do NOT add FOREGROUND_SERVICE_MICROPHONE — that triggers the enterprise-level microphone declaration form and we don't need it.

**Broken functionality.** Play's pre-launch farm catches most crashes. The habitual foot-guns for a WebView app: login flow that opens a Custom Tab and never returns, cleartext HTTP anywhere (blocked by network-security-config), a WebView loading a URL that 404s under a slow reviewer network. Test both tracks under airplane mode → reconnect, and on a device with Uzbek locale selected.

**Metadata policy (deceptive claims).** Play rejects hyperbole in descriptions and store text: "#1", "best", "top-rated", "guaranteed", medal / award emojis you didn't earn, testimonials without attribution, before/after promises. Scrub `store-assets/store-listing.md` before pasting — the drafted copy is already conservative; keep it that way. Screenshots must show real UI, not mock-ups labeled as real screens.

**Deceptive behavior via WebView debugging.** Google now flags any release build that calls `WebView.setWebContentsDebuggingEnabled(true)` unconditionally — it exposes user data to anyone with USB access. In this audit we gated it behind `BuildConfig.DEBUG` so the flag is baked to `false` in release AABs. If Play ever pings this, confirm with `apkanalyzer` that the release bundle contains no `setWebContentsDebuggingEnabled(true)` call reachable from the release code path.

**Advertising ID declaration mismatch.** If your manifest still has `com.google.android.gms.permission.AD_ID` (Play Services pulls it in transitively) but you declared **NO** on the Advertising ID form, Play auto-rejects. We explicitly `tools:node="remove"` the AD_ID permission in the manifest so Play accepts NO. Do not remove that manifest suppression when refactoring.

**Target SDK level below Play's floor.** Play raises the required targetSdk every August. Verify `android-overrides/app/build.gradle` `targetSdkVersion` is at or above the current year's floor before every submission — Play's upload dialog will refuse otherwise.
