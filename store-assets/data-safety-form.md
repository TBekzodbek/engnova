# Engnova — Google Play Data Safety questionnaire

Package: `uz.engnova.app`
Grounded in: `AndroidManifest.xml`, `EngnovaWebViewPlugin.java`, `src/lib/webview.ts`, `src/lib/supabaseClients.ts`.

Two products live in the app (CEFR Academy at `cefracademy.uz`, IELTS Level at `ieltslevel.uz`) but from Play's point of view Engnova is one app collecting one bundle of data types. Where the questionnaire cares about *who* the data is shared with, both back-ends are the developer's own Supabase projects — no third-party SDK sits between the user and either database.

---

## Data collection (top of the form)

**Does your app collect or share any of the required user data types?** → **YES**

We collect four Play-defined types: `Personal info · Email address`, `Personal info · User IDs`, `Audio files · Voice or sound recordings`, and `App activity · Other user-generated content`. Nothing else on Play's list applies — the justifications for every unchecked category are in the section below.

---

## Data types collected

### 1. Personal info — Email address

| Field | Answer |
|---|---|
| Collected | **YES** |
| Shared with third parties | **NO** |
| Processing type | **Persistent** |
| Optional or required | **Required** (email + password is the only sign-in method) |
| Purposes | **Account management**, **App functionality** |

**Why.** Sign-in is Supabase email+password (`src/lib/supabaseClients.ts`: `flowType: 'pkce'`). The user's email is the account primary key on both CEFR and IELTS Supabase projects and is used for password reset, magic-link recovery, and receipt/reminder emails. Sign-up itself happens on the site inside the WebView (or in a Custom Tab), but the entered email lands in a Supabase project we own; Play treats developer-owned back-ends as first-party, so this is collected-not-shared. Reset and confirmation mails are transactional only — no marketing, no ad partner, no analytics SDK.

### 2. Personal info — User IDs

| Field | Answer |
|---|---|
| Collected | **YES** |
| Shared with third parties | **NO** |
| Processing type | **Persistent** |
| Optional or required | **Required** (issued automatically at sign-up; user cannot opt out) |
| Purposes | **Account management**, **App functionality** |

**Why.** Supabase Auth issues a UUID (`user.id`) per account and the sites use it as the foreign key on every progress/score/attempt row. The shell reads it back only to build the authed-open handoff URL/bootstrap (`webview.ts`: `refreshedTokens` → `openTrackWebViewAuthed`). Session tokens (access + refresh JWTs) live in supabase-js's per-project storage in the WebView's own storage and are not persisted anywhere else the app can see — they are not backed up (`allowBackup=false`, `data_extraction_rules` excludes everything) and Chrome DevTools debugging is off in release (WebView `setWebContentsDebuggingEnabled` gated on `FLAG_DEBUGGABLE`).

### 3. Audio files — Voice or sound recordings

| Field | Answer |
|---|---|
| Collected | **YES** |
| Shared with third parties | **NO** |
| Processing type | **Persistent** (audio blobs are saved as part of the user's mock-exam history) |
| Optional or required | **Optional** — only captured when the user starts a speaking mock and grants mic permission |
| Purposes | **App functionality** |

**Why.** Both tracks have a speaking-practice section that calls `getUserMedia({ audio: true })` inside the WebView. The plugin's `WebChromeClient.onPermissionRequest` (line 279) is what triggers the OS `RECORD_AUDIO` prompt — the only sensitive runtime permission the app declares. Recordings upload directly from the WebView to the track's own Supabase Storage bucket over HTTPS so the user can replay them and see the AI band-score breakdown. No third-party ASR SDK is bundled in the shell; if the site later calls out to a scoring model, that call is server-side within our Supabase Edge Functions.

`android:required="false"` on the microphone feature so devices without a mic can still install the app; users on those devices simply cannot take a speaking mock.

### 4. App activity — Other user-generated content

| Field | Answer |
|---|---|
| Collected | **YES** |
| Shared with third parties | **NO** |
| Processing type | **Persistent** |
| Optional or required | **Optional** — only when the user opts into writing tasks, mock exams, or the free grader |
| Purposes | **App functionality**, **Personalization** (adaptive lesson plan uses past scores) |

**Why.** The tracks are language-learning products: users type essay answers, reading/listening responses, and open-ended survey answers into the site inside the WebView. Those submissions are stored in the same first-party Supabase projects so the user can see history, retake mocks, and see level progression. Personalization is limited to the user's own plan — no cross-user profiling, no ad targeting.

---

## LEAVE UNCHECKED — with justification

- **Financial info · Payment info, purchase history, credit score, other financial info** — the pricing page and every payment gateway (`click.uz`, `payme.uz` / `paycom.uz` — same provider, two hostnames) are matched against `paymentHosts` / `paymentPatterns` in `EngnovaWebViewPlugin.java` (line 340–362) and bounced out to a **Chrome Custom Tab** via `openCustomTab`. Play's policy: data the user enters in a Chrome Custom Tab is not the app's collection — it's Chrome's session, running the site's own checkout under the user's Chrome cookie jar. The shell never sees card numbers, never has a form field for them, and never has a payment SDK.
- **Location** — no `ACCESS_FINE_LOCATION` / `ACCESS_COARSE_LOCATION` in the manifest. `WebChromeClient.onGeolocationPermissionsShowPrompt` explicitly **denies** any site-side geolocation request (line 301).
- **Personal info · Name, address, phone number, race/ethnicity, political/religious views, sexual orientation, other info** — none of these are collected. The account model is email + password only; the site does not ask for name, phone, or address at sign-up.
- **Device or other IDs (advertising ID, IMEI, MAC)** — no `READ_PHONE_STATE`, no ads SDK, no `google_play_services_ads` dependency. The Advertising ID is not queried.
- **Contacts, Calendar, Messages (SMS/MMS), Files and docs, Photos and videos** — no `READ_CONTACTS`, `READ_CALENDAR`, `READ_SMS`, `READ_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES/VIDEO/AUDIO` in the manifest. `WebSettings.setAllowFileAccess(false)` + `setAllowContentAccess(false)` also block the WebView from touching device files.
- **Web browsing history** — the shell does not read or transmit the device's browsing history. WebView history exists per-session but is wiped on logout via `clearData()` and is not exported anywhere.
- **Health and fitness** — no fitness / body-metric data is collected. No BODY_SENSORS, no ACTIVITY_RECOGNITION.
- **App activity · App interactions, In-app search history, Installed apps, Other actions** — **no analytics SDK is installed** in the shell. There is no Firebase Analytics, no Amplitude, no Mixpanel, no PostHog. The sites themselves may run product analytics inside the WebView, but that is a first-party page on our own domain, not the app.
- **App info and performance · Crash logs, Diagnostics, Other performance data** — **no crash reporter is installed** in the shell. There is no Firebase Crashlytics, no Sentry, no Bugsnag. Standard Android Vitals crash sampling that Google Play itself performs is a Play platform capability and does not need to be disclosed here.

---

## Security section

| Question | Answer | Notes |
|---|---|---|
| Data is encrypted in transit | **YES** | HTTPS is the only scheme the WebView allowlist honours. Non-`http(s)` schemes hand off to the OS. Supabase URLs are HTTPS with TLS 1.2+. |
| You provide a way for users to request that their data be deleted | **YES** | Users can request deletion from the account settings pages inside each product: `https://cefracademy.uz/account` and `https://ieltslevel.uz/account`. Owner processes the request against the relevant Supabase project. |
| Data is committed to the [Play Families Policy](https://support.google.com/googleplay/android-developer/answer/9893335) | N/A | Engnova is not a Families app. Target audience is 13+. |

---

## Summary for a Play reviewer

If the reviewer pushes back on any of the above, here is the concise story.

**Why `RECORD_AUDIO` is declared.** Both tracks include speaking mock-exams — a core skill for CEFR levelling and for IELTS Speaking Band prep. The site calls `getUserMedia({ audio: true })` from inside the WebView; without `RECORD_AUDIO` and `WebChromeClient.onPermissionRequest` wiring, the speaking module can't function. The permission is requested only when the user first taps into a speaking task, not at install time (`targetSdk` is 33+, so all dangerous permissions are runtime). `uses-feature android:name="android.hardware.microphone" android:required="false"` keeps the app installable on mic-less devices — those users just can't take a speaking mock.

**Why no `Financial info` disclosure even though the app shows pricing.** The shell never renders a payment form. `EngnovaWebViewPlugin.shouldOverrideUrlLoading` matches host+path patterns for the pricing marketing page and every payment gateway host (`click.uz`, `payme.uz` / `paycom.uz`, checkout subdomains) and routes them to `androidx.browser.customtabs.CustomTabsIntent` — a Chrome Custom Tab, running in the user's own Chrome session with Chrome's cookie jar and Chrome's autofill. Card numbers and bank-app handoffs happen inside Chrome, not inside Engnova. Play's Data Safety guidance treats data collected in a Custom Tab as the browser's collection, not the app's.

**Why Play Billing is not the payment method.** Uzbekistan's national payment providers — `paycom.uz` (Payme) and `click.uz` (Click) — are the only two rails that reliably clear on Uzbek-issued Humo/Uzcard/UnionPay cards, which is what our users have. **Google Play Billing does not currently support these gateways as a payout method for Uzbekistan.** Requiring Play Billing here would leave the app with no functional way to accept payment from its actual market. This is the same regional-necessity carve-out that Play's payments policy contemplates for services whose users cannot transact via Play Billing in their region. Compounding this: the products we sell are **language-tutoring services with a real human/AI assessment component**, not virtual currency or in-game items — the classic Play-Billing digital-goods category — and even where Play Billing would be otherwise available, service-based subscriptions are eligible for the external-payment carve-outs. The Custom Tab handoff is our defense on both fronts.

**Why no analytics disclosure.** The shell has zero third-party analytics/crash/ads SDKs. `package.json` has no Firebase, no Sentry, no Mixpanel/Amplitude/PostHog dependencies. The only network endpoints the app itself talks to are the two Supabase project URLs (`VITE_CEFR_SUPABASE_URL`, `VITE_IELTS_SUPABASE_URL`) — both first-party. Anything analytics-shaped that runs inside the WebView is code served from our own domain and hits our own back-end.

**Why data retention is safe.** `allowBackup=false` + `android:dataExtractionRules` explicitly opt the app out of Google Auto Backup and Android 12+ device-to-device transfer, so the Supabase session cookies in the WebView jar are not uploaded to the user's Drive or copied to a new phone. On logout, `EngnovaWebViewPlugin.clearData()` wipes WebView cookies, Web storage, cache, history and form data, so the next login on the same device isn't silently the previous user.
