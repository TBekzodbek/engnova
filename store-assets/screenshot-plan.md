# Engnova — Play Console Screenshot Plan

Owner: Bekzod
Package: `uz.engnova.app`
Locales published: UZ (default), RU, EN

Goal: produce the Play Store phone-screenshot set for the Engnova listing — one 4-shot set per locale (12 total), plus an optional 5th.

---

## Requirements

Google Play phone screenshots must meet these hard rules:

- **Format:** 24-bit PNG or JPEG, no alpha channel.
- **Dimensions:** each side between 320 px and 3840 px.
- **Aspect ratio:** anywhere from 9:16 (tall) to 16:9 (wide). Play crops outside this range.
- **Recommended device size:** **1080 × 2400** (18:9 modern phone) — this is what we ship.
  - Fallback acceptable: 1080 × 1920 (16:9).
- **Count:** minimum 2, maximum 8. Google's own advice is **4–6**; we ship **4 + 1 optional**.
- **Locale strategy:** Play allows sharing screenshots across locales, but localized overlay text lifts install rate double-digits in non-English markets. We produce **one set per locale** — 4 screenshots × 3 locales = **12 shots total**.

Any shot that has zero user-visible text (rare in this plan) may be reused across all three locales to save time.

---

## Shot list (4 screenshots + 1 optional)

Ordered to match how a Play viewer scans the carousel — hero first, proof of function last.

### 1. Chooser — the hero
**What it shows:** cold-boot chooser with both track cards (CEFR Academy, IELTS Level) visible, language chip visible in the top corner.
**Why first:** it is the single frame that communicates "one app, two products" — the whole thesis of the listing.
**Best capture moment:** fresh cold-boot after `pm clear uz.engnova.app`, so no cached track is highlighted.
**Device language for capture:** matches the target locale (Uzbek for `uz/`, Russian for `ru/`, English for `en/`).
**Overlay headline (top of frame):**
- UZ: `Bir ilova, ikki yo'l`
- EN: `One app, two paths`
- RU: `Одно приложение, два пути`

### 2. Login — branded, per-track
**What it shows:** the branded login screen after tapping into a track. Track color spine visible, email + password fields, "Forgot password" link.
**Why:** proves the app respects real accounts (Supabase-backed) — reassures Play reviewers there is a legitimate auth flow, not a scraper wrapper.
**Best capture moment:** after tapping CEFR Academy card so the indigo spine (`#554be7`) is applied. Fields empty, cursor not focused (no keyboard).
**Overlay headline:**
- UZ: `Xavfsiz kirish`
- EN: `Secure sign-in`
- RU: `Безопасный вход`

### 3. Product loading — proves the app actually works
**What it shows:** the branded track loading state — chooser tint applied, progress bar mid-flight, product logo centered.
**Why:** viewers who reach the third card want evidence of a working experience. This is also the highest-fidelity frame that shows Engnova's own branding (not the embedded site's).
**Best capture moment:** the moment after tapping a track card but before the site paints — throttle the WebView with `adb shell settings put global http_proxy 127.0.0.1:1` briefly, or use Chrome DevTools throttling if paired.
**Overlay headline:**
- UZ: `O'zingizga tayyorlangan reja`
- EN: `Your personalized plan`
- RU: `Ваш персональный план`

### 4. Onboarding slide 3 — "Mashq. Baholov. O'sish."
**What it shows:** the third onboarding slide (value-prop slide) with the three-word promise and the illustration.
**Why:** the emotional close. This is the frame that answers "what am I signing up for?" in one glance.
**Best capture moment:** swipe onboarding to slide index 2 (third slide), let animation settle for 500 ms, capture.
**Overlay headline:**
- UZ: `Har kuni birga o'sing`
- EN: `Grow together, every day`
- RU: `Растите вместе, каждый день`

### 5. Language sheet open (OPTIONAL)
**What it shows:** the language bottom sheet expanded, with all three languages listed and the current one checked.
**Why optional:** only adds value in markets where multilingual support is a differentiator (RU set benefits most; EN set may drop this).
**Best capture moment:** tap the language chip on the chooser; wait for sheet to fully expand; capture.
**Overlay headline:**
- UZ: `3 tilda mavjud`
- EN: `Available in 3 languages`
- RU: `Доступно на 3 языках`

---

## How to capture on a real device

Prereqs: Pixel 6a or similar 1080 × 2400 device, ADB installed on the capture machine, developer options + USB debugging on.

### Install the release build
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Set the device language for the target locale set
Settings → System → Languages & input → Languages → add and drag to top:
- `uz/` set → **O'zbek**
- `ru/` set → **Русский**
- `en/` set → **English (US)**

Then fully quit and cold-boot Engnova each time you switch locale so the chooser + onboarding pick up the new language:
```bash
adb shell pm clear uz.engnova.app
adb shell am start -n uz.engnova.app/.MainActivity
```

### Clean the status bar (optional but strongly recommended)
Enter Android demo mode so the status bar shows a fake, tidy state (full battery, full signal, no notifications, fixed clock):
```bash
adb shell settings put global sysui_demo_allowed 1
adb shell am broadcast -a com.android.systemui.demo -e command enter
adb shell am broadcast -a com.android.systemui.demo -e command clock -e hhmm 0930
adb shell am broadcast -a com.android.systemui.demo -e command battery -e plugged false -e level 100
adb shell am broadcast -a com.android.systemui.demo -e command network -e wifi show -e level 4
adb shell am broadcast -a com.android.systemui.demo -e command network -e mobile show -e datatype none -e level 4
adb shell am broadcast -a com.android.systemui.demo -e command notifications -e visible false
```
Exit demo mode when done:
```bash
adb shell am broadcast -a com.android.systemui.demo -e command exit
```

### Take the shot
- On-device: **Vol Down + Power** — file lands in `/sdcard/Pictures/Screenshots/`.
- From the host machine (preferred, no shutter animation, exact filename):
  ```bash
  adb exec-out screencap -p > store-assets/screenshots/uz/01-chooser.png
  ```

### Pull anything captured on-device
```bash
adb pull /sdcard/Pictures/Screenshots/ store-assets/screenshots/_inbox/
```

### Verify dimensions before uploading
```bash
# Windows / PowerShell
Get-Item store-assets/screenshots/uz/*.png | ForEach-Object {
  $img = [System.Drawing.Image]::FromFile($_.FullName)
  "$($_.Name): $($img.Width) x $($img.Height)"
  $img.Dispose()
}
```
Every file must be **1080 × 2400** (or the fallback 1080 × 1920) and **PNG without alpha**. If the pipeline emits alpha, flatten:
```bash
# ImageMagick — batch flatten
magick mogrify -background "#08080C" -alpha remove -alpha off store-assets/screenshots/**/*.png
```

---

## How to add overlay text

The overlay headlines above must live **on** the screenshot, not around it — Play does not display captions.

### Option A — Google Play's Screenshot Overlay Tool (RECOMMENDED for owner)
Google ships a free, visual overlay tool: https://play.google.com/console/screenshots
- Upload the raw device capture.
- Choose the "Text at top" template.
- Paste the localized headline from the shot list.
- Pick the accent color (use `#554be7` — Engnova indigo — for consistency).
- Download the composited PNG, drop it into the `store-assets/screenshots/<locale>/` folder over the raw file.

### Option B — Node script (DEFERRED)
Headless Chromium + SVG composition, run once per locale × shot. Cheaper long-term, but not needed for launch. If we do it, put the script at `store-assets/tools/overlay.mjs` and drive it from `store-assets/tools/shots.json`.

---

## Folder layout

Final tree the release process expects:

```
store-assets/
  screenshots/
    uz/
      01-chooser.png
      02-login.png
      03-loading.png
      04-onboarding.png
      05-language.png        (optional)
    ru/
      01-chooser.png
      02-login.png
      03-loading.png
      04-onboarding.png
      05-language.png        (optional)
    en/
      01-chooser.png
      02-login.png
      03-loading.png
      04-onboarding.png
      05-language.png        (optional)
    _inbox/                  (raw pulls from device; gitignored)
```

Naming rules:
- Two-digit prefix — Play uploads them in the order named.
- Kebab-case slug that matches the shot list section (`01-chooser`, `02-login`, `03-loading`, `04-onboarding`, `05-language`).
- One folder per locale; folder name matches the Play locale code (`uz`, `ru`, `en`).

Upload order in Play Console: 01 → 04 (→ 05 if used). Play uses the first screenshot as the featured card on smaller surfaces — do not reorder without a reason.
