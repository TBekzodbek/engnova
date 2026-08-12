# Google Sign-In setup — Google Cloud Console + Supabase + Engnova

One-time setup. ~30 minutes total. Do everything in this order or the token verification will fail.

**What you need before starting:**
- Access to https://console.cloud.google.com signed in as engnovaapp@gmail.com
- Access to both Supabase project dashboards:
  - CEFR: https://supabase.com/dashboard/project/mctcstvjdpcnzypfjhka
  - IELTS: https://supabase.com/dashboard/project/qpukasdtcwwgnehpjhud
- The Engnova upload key's SHA-1 fingerprint (already extracted):
  ```
  4C:C8:38:1F:F8:0D:C4:16:14:50:EB:8F:AE:D6:0A:7D:75:39:13:C5
  ```
- Later — the Play App Signing SHA-1 (get it from Play Console after your first AAB upload; see §5)

---

## 1. Google Cloud Console — Create a project (5 min)

If you already have a Google Cloud project for Engnova, skip to §2.

1. Open https://console.cloud.google.com
2. Top bar → project dropdown → **New Project**
3. Project name: **Engnova**
4. Location: leave default (No organization)
5. Click **Create**
6. Wait ~30 seconds for the project to be created, then select it from the top-bar dropdown

## 2. Configure the OAuth consent screen (5 min)

Sign-in only works after this exists.

1. Left nav → **APIs & Services → OAuth consent screen**
2. User Type → **External** → Create
3. Fill in:
   - App name: **Engnova**
   - User support email: **engnovaapp@gmail.com**
   - App logo: upload `store-assets/icon-512.png` (optional but nicer)
   - Application home page: `https://cefracademy.uz`
   - Application privacy policy: `https://cefracademy.uz/engnova-privacy.html`
   - Application terms of service: leave blank (optional)
   - Authorized domains: add `cefracademy.uz` and `ieltslevel.uz` (press Enter after each; Google verifies you own these — should pass instantly since both have live HTTPS)
   - Developer contact: **engnovaapp@gmail.com**
4. Next → Scopes → click **Add or Remove Scopes** → check **`openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`** → Update → Save and Continue
5. Test users → **Add users** → add your own email + 2-3 test emails → Save and Continue
6. Summary → **Back to Dashboard**
7. Publishing status is **In testing** — click **Publish app** → Confirm. This moves you to Production and removes the 100-user test cap. Google may ask for verification later if you have >100 users, but sign-in works either way.

## 3. Create OAuth 2.0 client IDs (10 min — this is the important part)

You need TWO clients: one **Web** (Supabase uses this to verify tokens) and one **Android** (the app uses this to request tokens).

### 3a. Web application client

1. Left nav → **APIs & Services → Credentials**
2. **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. Name: `Engnova Web` (for your own reference)
5. Authorised JavaScript origins → **+ Add URI**:
   - `https://cefracademy.uz`
   - `https://ieltslevel.uz`
   - `https://mctcstvjdpcnzypfjhka.supabase.co`
   - `https://qpukasdtcwwgnehpjhud.supabase.co`
6. Authorised redirect URIs → **+ Add URI**:
   - `https://mctcstvjdpcnzypfjhka.supabase.co/auth/v1/callback`
   - `https://qpukasdtcwwgnehpjhud.supabase.co/auth/v1/callback`
7. Click **Create**
8. A dialog shows **Your Client ID** and **Your Client Secret**. **COPY BOTH.**
   - **Client ID** looks like: `987654321000-abc123def456ghi789jkl.apps.googleusercontent.com`
   - **Client Secret** looks like: `GOCSPX-XXXXXXXXXXXXXXXXXXXX`
9. **Save both to your paper backup NOW** alongside the keystore password. You'll paste these into Supabase and into the app config.

### 3b. Android client (for our app to request tokens from Google)

1. Same **Credentials** page → **+ Create Credentials → OAuth client ID**
2. Application type: **Android**
3. Name: `Engnova Android`
4. Package name: `uz.engnova.app` (exactly this — case matters)
5. SHA-1 certificate fingerprint: `4C:C8:38:1F:F8:0D:C4:16:14:50:EB:8F:AE:D6:0A:7D:75:39:13:C5`
6. Click **Create**
7. This client gets no secret (Android clients are public). You don't need to copy anything — Google just needs to know your app's identity exists.

## 4. Configure Supabase to accept Google tokens (5 min — for BOTH projects)

Do this once for CEFR, once for IELTS. Same steps.

### 4a. CEFR Supabase

1. Open https://supabase.com/dashboard/project/mctcstvjdpcnzypfjhka
2. Left nav → **Authentication → Providers**
3. Find **Google** → toggle **Enabled**
4. Paste:
   - **Client ID (for OAuth):** the Web Client ID from §3a
   - **Client Secret (for OAuth):** the Web Client Secret from §3a
   - **Authorized Client IDs:** paste the Web Client ID again here (comma-separated if you had multiple — for us it's just one)
5. Click **Save**

### 4b. IELTS Supabase

Repeat §4a for https://supabase.com/dashboard/project/qpukasdtcwwgnehpjhud, using the SAME Client ID + Secret from §3a. One Web client works for both Supabase projects.

## 5. (Later, after first Play upload) Add the Play App Signing SHA-1

**Skip this step until you've uploaded your first AAB to Play Console closed testing.** Once uploaded:

1. Play Console → your app → **Test and release → Setup → App integrity**
2. Copy the **App signing key certificate → SHA-1 certificate fingerprint** (Google's key, not your upload key)
3. Back in Google Cloud → **APIs & Services → Credentials → Engnova Android** (edit)
4. **+ Add fingerprint** → paste the Play App Signing SHA-1 → Save

Without this step, users who install from Play Store (once you go live) won't be able to sign in — only sideload-installers get tokens. Do it BEFORE promoting to production.

## 6. Wire the Web Client ID into Engnova app config (2 min)

Open `D:\engnova\.env.local` in an editor. Find this line at the bottom:

```
VITE_GOOGLE_WEB_CLIENT_ID=
```

Paste the Web Client ID from §3a after the `=`:

```
VITE_GOOGLE_WEB_CLIENT_ID=987654321000-abc123def456ghi789jkl.apps.googleusercontent.com
```

Save the file.

## 7. Rebuild + reinstall the app

```bash
cd /d/engnova
npm run build:apk:release
```

The new APK at `android/app/build/outputs/apk/release/app-release.apk` now has the "Continue with Google" button visible on the login screen. Uninstall the old Engnova from your phone, install this new one, test.

## 8. Verify end-to-end

1. Open the app on your phone → Chooser → CEFR Academy
2. Login screen — you should see the **"Google bilan davom etish"** button ABOVE the email/password form, with an OR divider between them
3. Tap the button — native Google account picker appears
4. Pick your account → screen briefly shows a loading spinner → you land on the CEFR dashboard inside the app
5. Log out → try again with IELTS Level → same flow works

If the button doesn't appear, `VITE_GOOGLE_WEB_CLIENT_ID` didn't reach the build. Check that the value is set in `.env.local` and that you ran `npm run build:apk:release` (not just `sync:android`).

If the button appears but sign-in fails silently:
- SHA-1 mismatch (Android client wasn't created with the right fingerprint) — re-check §3b
- Web Client ID mismatch (Supabase provider not configured with same ID) — re-check §4
- OAuth consent screen not published — re-check §2 last step

If sign-in works locally but fails once the app is on Play Store: you forgot §5 (Play App Signing SHA-1).

## Troubleshooting shortcuts

**Get the SHA-1 from any keystore any time:**
```bash
JAVA_HOME="/c/Program Files/Java/jdk-21" "$JAVA_HOME/bin/keytool.exe" \
  -list -v -keystore android/engnova-upload.jks -alias engnova-upload \
  -storepass 'Begzodbek0207-EngnovaPlay!2026' | grep SHA1
```

**Verify Supabase accepts the client ID:**
```bash
curl -s "https://mctcstvjdpcnzypfjhka.supabase.co/auth/v1/settings" | grep -o '"external":{[^}]*}'
```
Look for `"google":{"enabled":true...`. If false, §4a wasn't saved.

**Force the app to re-init Google auth (during debug):**
Uninstall + reinstall the APK. The plugin caches the client ID init at first launch.
