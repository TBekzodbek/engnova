# Engnova Privacy Policy

**Effective date:** 2026-08-11

## 1. Who we are

Engnova is a mobile app shell (package `uz.engnova.app`) that hosts two independent English-learning products behind a chooser:

- **CEFR Academy** — 0 to C1 English course, published at [cefracademy.uz](https://cefracademy.uz).
- **IELTS Level** — IELTS band preparation, published at [ieltslevel.uz](https://ieltslevel.uz).

The Engnova app itself is a thin native shell: after you pick a track, the product's live website loads inside a native WebView. This policy covers what the **app shell** does. Each underlying site has its own separate privacy policy (linked below) that governs everything you do inside that track.

## 2. What the app collects

The Engnova app collects only what is strictly required for you to sign in and use the speaking features.

- **Login credentials (email + password).** When you sign in from inside the app, the email and password you enter are passed directly to the Supabase Auth service for the track you selected. We do not read, log, store, or forward them anywhere else.
  - CEFR Academy uses Supabase project `mctcstvjdpcnzypfjhka`.
  - IELTS Level uses Supabase project `qpukasdtcwwgnehpjhud`.
- **Microphone audio.** The `RECORD_AUDIO` permission is only requested when you start a speaking-practice task. The audio is captured via the standard `getUserMedia` API in the WebView and sent to the selected track's own backend for grading. It is not sent to Engnova servers and is not recorded outside the active exercise.
- **Nothing else.** The app does **not** collect:
  - Location (no `ACCESS_FINE_LOCATION` or `ACCESS_COARSE_LOCATION`).
  - Device identifiers, IMEI, or MAC address.
  - Advertising ID.
  - Contacts, calendar, photos, or files.
  - Crash reports or performance telemetry.
  - Analytics events. No analytics SDK, no crash-reporting SDK, and no advertising SDK are bundled in the app.

## 3. What the underlying sites collect

Once a track loads inside the WebView, you are using that track's website, and its own privacy policy applies to any data you enter or generate there (profile, learning progress, mock scores, chat history, etc.).

- CEFR Academy site policy: <https://cefracademy.uz/privacy>
- IELTS Level site policy: <https://ieltslevel.uz/privacy>

## 4. Data retention

- The app itself stores only two things on the device: a small **boot hint** remembering which track you last used (so the chooser can jump you back in), and your **language preference** (Uzbek, Russian, or English).
- Android auto-backup is disabled (`android:allowBackup="false"`) and `data_extraction_rules` exclude all app data, so none of the app's local state is uploaded to Google Drive or copied off the device.
- Retention of anything you create or submit inside a track (progress, mock scores, account records) is governed by that track's own site policy.

## 5. Payments

Engnova processes **no payments in-app**. All purchases happen on the website, opened in a Chrome Custom Tab, via Uzbekistan's national payment gateways:

- Payme — `paycom.uz`
- Click — `click.uz`

Google Play Billing is not available for these Uzbekistan-national payment gateways, which is why checkout is delegated to the site.

## 6. Data deletion

You can request deletion of your account and associated data through each track's account settings on the website:

- CEFR Academy: sign in at <https://cefracademy.uz> and use the account settings page.
- IELTS Level: sign in at <https://ieltslevel.uz> and use the account settings page.

Because the app shell keeps no server-side data of its own, uninstalling the app removes the boot hint and language preference from the device. Uninstalling does not by itself delete your account on either track's website — use the site to do that.

## 7. Children

The app is suitable for all ages and does not knowingly collect personal information from children under 13. Sign-up is not directed at children under 13.

## 8. Changes to this policy

If this policy changes materially, a notice is shown inside the app on first launch after the update, and the "Effective date" at the top of this page is updated. Continued use of the app after the notice constitutes acceptance of the revised policy.

## 9. Contact

Questions about this policy or about the Engnova app can be sent to:

**engnovaapp@gmail.com**

For questions about a specific track's site, please use the contact channels on that track's own website.
