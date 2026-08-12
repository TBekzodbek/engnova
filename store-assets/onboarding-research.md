# English-Learning App Onboarding Research

**Purpose:** Inform the redesign of Engnova's (Capacitor Android shell over cefracademy.uz + ieltslevel.uz) onboarding to lift the free→paid conversion rate. Current entrance is a 3-slide static intro → track chooser → login, which the owner rightly calls too shallow to sell.

**Method:** Public sources — Play Store, App Store, developer teardowns, UX case studies, growth-marketing blogs. Where a source directly documents a screen or verbatim copy, it is cited. Where a flow is reconstructed from multiple partial sources, that is stated. Englify was intentionally researched with more effort than the others because it is the most direct competitor; even so, Englify's public teardowns are thin and its live app was not installable in this environment.

---

## 1. Englify's onboarding flow (best-effort reconstruction)

Englify (uz.englify.englify_client_mobile, iOS id 6499320034) has ~460K downloads and 22K downloads/mo, 4.24–4.6 stars, developer Mirazam Abdullaev / EnglifySchool. It is Engnova's closest cultural competitor and the one to beat on onboarding.

Public sources do not include an annotated screen-by-screen teardown of Englify's onboarding, so the below is reconstructed from: the Play Store / App Store listings, the Englify web app's registration page, the Englify website (englify.uz), and their public offer page. Steps marked (inferred) are inferred from surrounding evidence, not directly observed.

**Reconstructed flow, in order:**

1. **Splash / brand screen.** Logo + tagline. Standard.
2. **Language of app UI.** The public site is Uzbek-only. The app likely defaults to UZ with no chooser at all (this is a differentiator from Duolingo, which asks source language).
3. **"Xush kelibsiz do'stim 👋"** — this exact copy is on the live registration page (`app.englify.uz/auth/registration`). Warm/informal greeting with a waving-hand emoji. Sets a very casual tone.
4. **Phone number or email registration.** (Inferred from user reviews complaining about "difficulty logging in with foreign phone numbers.") Registration is asked **early**, likely before any placement or personalization — this is a friction point Engnova can beat.
5. **SMS OTP.** Standard.
6. **Age / audience segmentation.** englify.uz segments courses by audience: high-school students, university students, professionals, aspiring students, language enthusiasts, expats. The app likely asks something equivalent in a category picker.
7. **Placement / level.** A dedicated placement test exists at `englify.uz/testing` and app reviewers reference "daraja" (level) selection. Whether it's an adaptive quiz or a self-select A1–C1 is not confirmed publicly; the web version is a form-based quiz.
8. **Course/tier suggestion.** Based on the audience + level, a recommended tier is shown. Two SKUs are documented: UCHQUN ("Spark" — $39.99/3mo, self-study only) and JO'SHQIN ("Vibrant" — $120.99/3mo, $214.99/6mo, $349/yr — includes 3–6 weekly live Zoom sessions plus 1–2 dedicated instructors and a Telegram cohort of 14–16 students). Uzbek-som web pricing is 750,000 UZS/mo (JO'SHQIN 3mo bundle) and 820,000 UZS/mo (BO'TALOG'IM tier).
9. **Live-class scheduling / trial booking.** (Inferred.) Because JO'SHQIN's value is the Zoom class, they likely surface a schedule preview or a cohort start-date to create urgency ("next cohort starts Monday").
10. **First lesson or dashboard.** After the paywall, users enter the app with lesson content plus the Telegram-group invite.

**Approx. taps to paywall:** ~7–9 (splash → register → OTP → audience → level → recommendation → pay).

**Notable differences vs. Engnova:**
- Englify puts **registration and OTP before any personalization**. Multiple ELSA and Duolingo reviews call this exact pattern out as a drop-off trigger.
- Englify has **only one product** but two tiers; Engnova has two products (CEFR vs IELTS) that both have their own tier structures.
- Englify's monetization anchor is **live human classes plus Telegram cohort belonging** — a social proof lever Engnova does not currently use. This is worth stealing.
- Englify UI is **UZ-only** despite Uzbekistan's real trilingualism; Engnova defaulting to UZ but offering a fast RU/EN toggle is a small competitive edge with the ~30% RU-preferring segment.

**Sources:**
- Play Store — https://play.google.com/store/apps/details?id=uz.englify.englify_client_mobile&hl=en_US
- App Store (US) — https://apps.apple.com/us/app/englify/id6499320034
- Register page — https://app.englify.uz/auth/registration
- englify.uz — pricing, tier names, audience segmentation
- englify.uz/testing — placement test entry (existence confirmed, contents behind gate)

---

## 2. Common patterns across the top 5

Recurring moves across Duolingo, Busuu, ELSA Speak, Preply, Cambly, Babbel (and referenced against Englify):

| # | Pattern | Which apps | Why it works |
|---|---------|------------|--------------|
| 1 | **Goal / motivation asked in the first 3 screens** ("Why are you learning?") | Duolingo, Preply, Cambly, Babbel | The answer feeds the paywall copy verbatim later. Duolingo grew MAU→paid ~4% → ~9% between 2020 and 2025 largely by putting goal first. |
| 2 | **Level assessment presented as adaptive quiz, not a "test"** | Duolingo, Busuu, ELSA, Babbel | Busuu's adaptive quiz is 5 minutes; Duolingo's is "starts easy, gets harder." Framed as help, not judgment. |
| 3 | **Mascot / friendly persona narrates decisions** | Duolingo (Duo owl), Speak (AI tutor voice) | Emotional anchor. Sound + animation land where flat UI cannot. |
| 4 | **Daily commitment slider (5/10/15/20 min)** | Duolingo, ELSA | Micro-commitment. Once picked, the streak counter has meaning immediately. |
| 5 | **First lesson BEFORE paywall** | Duolingo, Busuu (kind of — sample after signup), Speak | Aha moment first, ask for money second. Every credible source (Airbridge, Adapty, RevenueCat) says this beats a hard front paywall for any content-based app. |
| 6 | **Signup deferred until after value is felt** | Duolingo (strong), Speak | Duolingo lets you complete a lesson without an account; sign-up appears "at logical moments" after the win. Contrast: Englify and Busuu both ask for account upfront and are criticized for it. |
| 7 | **Soft paywall with "Try now" primary CTA, price secondary** | Duolingo, Busuu | Duolingo shows 4 offers, half family plans; the visible CTA is Try now, not the $/mo. |
| 8 | **Answers reflected back in paywall copy** | Duolingo, Preply (via post-onboarding email with a "50%-off with deadline" tied to their stated goal), Noom (canonical outside language) | "You said you want IELTS 7.0 by December" beats a generic feature list. |
| 9 | **Permission asks (notifications, mic) after the aha moment** | Duolingo, ELSA | Asking before value = decline. Asking after = 2–3x acceptance. |
| 10 | **Aspirational proof anchor before pricing** (users like you, results, cohort size) | Preply (tutor count / reviews), Cambly (native-speaker tutor pool), Englify (Telegram cohort of 14–16), Busuu (4.7-star badge on paywall) | Social proof positioned adjacent to price, not on a separate screen. |

---

## 3. What drives conversion — the specific mechanisms

Concrete moments where the top apps hook users hard. Each of these is the sort of thing Engnova should aim to replicate:

1. **Duolingo's "path preview" moment.** After the placement test, Duolingo shows the user their placement on the learning tree — "Here's where you'll start" — with a visible ladder of future units they can see (but not yet unlock). This creates aspiration + a mental commitment to a specific route. It is the pattern behind Duolingo's ~10% paid conversion rate versus a 4–5% industry norm. (Sources: Airbridge, Juno School, Appcues.)

2. **Duolingo's daily-goal-becomes-streak conversion.** The onboarding asks "How many minutes per day?" (5/10/15/20). The very next thing shown is a Day 1 streak. Users who set a goal at onboarding and complete one lesson enter the app with a streak of 1 — losing it feels expensive by day 3. This is why Duolingo can front-load the paywall soft-ask: users already have skin in the game.

3. **ELSA Speak's live mic scoring.** ELSA drops the user into a pronunciation reading almost immediately and returns a numeric score on Pronunciation / Intonation / Fluency (0–100). It works because a personal, quantified verdict about the user's actual voice cannot be handwaved. It creates both a diagnosis ("your intonation is 42") and a promise (ELSA can raise it). The paywall lands right after this.

4. **Preply's tutor-list-as-paywall.** Preply narrows 11,000 tutors → 400 → 10 based on the user's answers, then presents them like a shopping list. The user has already picked *which specific human* they want to book with before hitting checkout — dramatically higher intent than a generic "$19/mo, try now." This is why Preply's tutor-marketplace positioning survives against Duolingo's freemium.

5. **Busuu's "5-minute adaptive placement" framed as saving time.** Busuu explicitly promises the placement test "only takes 5 minutes." Framing the assessment as a *service to the user* ("we won't waste your time on lessons you already know") rather than as a *filter for us* ("we need to gate you") is a subtle but well-documented conversion lever.

**The consolidating principle** (Adapty, Airbridge, RevenueCat all agree): every onboarding question should change a later screen. If an answer doesn't change the paywall copy, the recommendation, or the branch, cut the question. Users who see their own words in the paywall convert measurably better than users who see a generic pitch — often 1.5–2× on install-to-trial rate. Onboarding + trial paywall benchmarks at ~1.78% install-to-conversion; a well-personalized version can hit 3–4%.

---

## 4. Anti-patterns to avoid

Things the sources measurably identify as conversion killers:

1. **Asking for phone/email/password before showing any value.** Englify does this. Busuu does this. Both are called out. ELSA reviews specifically complain about being "asked to create an account and forced through another flow" mid-onboarding.
2. **Placement quizzes longer than ~7 minutes.** Drop-off spikes. Busuu's own claim of "only 5 minutes" is a defensive framing precisely because longer versions bled users. Keep the quiz to 3–5 questions if the goal is conversion (deep diagnostics can come later, post-payment).
3. **Feature lists on the paywall.** Users don't buy features; they buy outcomes tied to the goal they just told you. "Grammar exercises, vocabulary decks, speaking practice" converts worse than "Reach B2 in 12 weeks — start today."
4. **Same paywall for every user.** If one user said "IELTS 7.0 for university" and another said "learn from zero to travel," they should see two different paywall headlines. This is trivial with a template + string replace and it works.
5. **Asking for notifications permission on screen 1.** Universal anti-pattern. Iron-clad: ask *after* the first aha, when the user has something to be reminded about.
6. **Multiple product choices before understanding the user.** Engnova currently shows CEFR vs IELTS *before* asking anything. If a user hasn't told you their goal, they will guess based on a name — most guess wrong and pick the wrong track. Ask the goal first, then route them.
7. **Hard paywall with the price as the headline.** Duolingo, Busuu, and every teardown agree: lead with "Try free" or "Start now," put the price below. Uzbekistan-specific twist: the price *number* in UZS is scary-looking (six digits, "750,000" reads as huge even though it's $60). Framing per month + per day helps ("750,000 UZS/oy • 25,000 UZS/kun bilan barobar").
8. **A merchant name on the payment page that doesn't match the app.** Documented Engnova problem: Payme and Click both show "RAVNAQ TALIM AKADEMIYA" not "CEFR Academy / Engnova," and this is the biggest silent bounce cause at handoff. Warn the user *inside the app* before handoff: "You'll see 'RAVNAQ TALIM' on the payment page — that's us."
9. **Restarting onboarding for returning cross-device users.** Engnova specifically documented this bug — users who pay in the Payme app get returned in a different browser and lose their session. Onboarding must recognize a returning user by email/phone, not require a fresh flow.
10. **Loading spinners on the very first screen.** Englify's register page shows "Loading..." forever. First impression = broken. Every screen must render *something* immediately even if data is still fetching.

---

## 5. Concrete proposal for Engnova onboarding (12 screens)

Design constraints being respected: two products (CEFR + IELTS), UZ default with RU/EN toggle, WebView shell, payments external, existing paid base of ~250+, no in-app learning UI (the site does that), no chat/community feature, Instagram is the acquisition channel so the copy must feel native to a reels-driven audience.

**Design principles for this flow:**
- Every question changes something later (paywall copy, recommendation, or branch).
- Goal is asked before the product chooser — the goal picks the product, not the reverse.
- Personal verdict ("You're at ~A2") is the aspiration hook — placed *before* the price.
- The paywall lives inside the shell (native screen), with the pay button doing the WebView/browser handoff — this lets us pre-warn about the RAVNAQ TALIM merchant name.
- Registration is deferred to just before the paywall (so most drop-off happens *before* we ask for personal data, and the completed users convert at higher rates).
- Uzbek copy below is written in the informal register the audience actually uses on Instagram — the same register Englify uses ("do'stim").

---

### Screen 1 — Language of the app (silent default)

- **Shows:** Logo + three flag chips: 🇺🇿 O'zbekcha (preselected), 🇷🇺 Русский, 🇬🇧 English.
- **User action:** Tap flag or just tap "Davom etish."
- **Learns:** UI language preference. Persists.
- **Copy:** *"Til tanlang"* / small button *"Davom etish →"*
- **Why:** No auto-detect surprises. Tiny screen; passes in ~2 seconds.

### Screen 2 — Warm welcome + one line of promise

- **Shows:** Animated hand-wave illustration or short Lottie of a smiling character. One-line headline. One CTA.
- **Copy:**
  - Headline: *"Xush kelibsiz! 30 soniyada sizga eng mos yo'lni tanlaymiz."*
  - CTA: *"Boshlash"*
- **Why:** Sets expectation (30 seconds = manageable). Anchors the whole flow as a service, not a form. Copies Duolingo's "no lengthy tutorial" tone.

### Screen 3 — GOAL question (the most important screen in the whole flow)

- **Shows:** Big heading + 5 chunky picture-cards, tap-to-select (single choice).
- **Copy heading:** *"Ingliz tilini nima uchun o'rganmoqchisiz?"*
- **Options (each with a small icon):**
  1. 🎓 *IELTS topshiraman* (Career/study abroad)
  2. 📚 *DTM/Universitetga tayyorlanaman* (School exam — CEFR B1/B2)
  3. 💼 *Ish/karyera uchun* (Work)
  4. ✈️ *Sayohat va muloqot uchun* (Travel/conversation)
  5. 🌱 *Noldan boshlab o'rganaman* (Absolute beginner)
- **What it does:** Maps to the two products invisibly. Option 1 → IELTS track. Options 2–5 → CEFR track. But we do NOT tell the user that yet; we tell them at Screen 8. This is the goal-drives-chooser inversion.
- **Learns:** Primary goal (feeds paywall headline verbatim).

### Screen 4 — Deadline / urgency

- **Shows:** Timeline slider or 4 tap cards.
- **Copy heading:** *"Qachonga qadar natijaga erishmoqchisiz?"*
- **Options:** *1 oy ichida* / *3 oyda* / *6 oyda* / *Shoshilmayapman*
- **What it does:** For IELTS branch, this becomes "exam date" (drives study intensity — see D:\cefrprep memory: plan intensity by exam proximity). For CEFR branch, becomes plan pace.
- **Why:** Deadline = urgency = paywall lands harder. Sources: Preply's "50%-off with deadline" post-onboarding email uses the same lever.

### Screen 5 — Current level self-report

- **Shows:** 5 cards with plain-language descriptions, not CEFR codes (users don't know CEFR).
- **Copy heading:** *"Hozirgi darajangiz qaysi?"*
- **Options:**
  1. *Yangi boshlanuvchi* (I know almost nothing) → A0/A1
  2. *Oddiy so'zlar bilaman* (Basic words/phrases) → A1/A2
  3. *Kundalik gaplasha olaman* (Everyday conversation) → A2/B1
  4. *Erkin gaplasha olaman* (Fluent-ish) → B1/B2
  5. *Bilmayman — tekshirib bering* (Not sure — test me) → forces mini-quiz
- **What it does:** Options 1–4 skip the quiz (self-report is fine for initial routing). Option 5 goes to Screen 6.

### Screen 6 — 3-question mini placement (only if Screen 5 → "Bilmayman")

- **Shows:** 3 multiple-choice questions, each on its own screen with a progress bar (1/3, 2/3, 3/3).
- **Question type:** grammar cloze — one A1/A2, one B1, one B2. This is enough to place ±1 CEFR band and takes under 90 seconds.
- **Why 3 not 10:** Sources are unanimous — longer than ~5 minutes = drop-off. Busuu's 5-minute quiz is the industry ceiling; we choose to undercut it at ~90 sec.
- **Note:** Not a rigorous placement — that comes post-signup via the site's real placement quiz. This 3-question is *aspirational verdict theatre*, not diagnostic.

### Screen 7 — VERDICT + LEVEL BADGE (the aspiration hook)

- **Shows:** Big level badge (e.g., "A2") with CEFR meaning in plain UZ + a progress bar showing where the user is on the 0→C1 or 0→IELTS-9 ladder.
- **Copy:**
  - Headline (dynamic): *"Sizning hozirgi darajangiz: **A2**"*
  - Subline: *"Kundalik gaplarni tushunasiz, lekin murakkab matnlarda qiynalasiz."*
  - Aspiration: *"Yaxshi xabar: 3 oyda **B1** ga chiqishingiz mumkin — biz siz kabi 250+ o'quvchini bu yo'lni bosib o'tishga o'rgatganmiz."*
- **What it does:** Puts a concrete verdict in front of the user. Duolingo's placement-preview pattern (§3.1) applied to CEFR. Uses the existing 250-paid-user base as native social proof.

### Screen 8 — Track/product confirmation (the invisible chooser)

- **Shows:** A single card with a recommendation, plus a "Show me the other one" secondary link.
- **Copy (branches on Screen 3 answer):**
  - If IELTS-goal: *"Sizga eng mos: **IELTS Level** — bandingizni ko'tarish uchun."* → CTA *"Davom etish"* / small link *"CEFR ni ko'rish"*
  - Otherwise: *"Sizga eng mos: **CEFR Academy** — 0 dan C1 gacha."* → CTA *"Davom etish"* / small link *"IELTS ni ko'rish"*
- **Why:** We're presenting the chooser AS a personalized recommendation, not as a fork the user has to reason about. The escape hatch respects users who genuinely wanted the other track. This is the key architectural move: Screen 8 replaces the current cold two-product chooser.

### Screen 9 — Social proof + Instagram continuity

- **Shows:** 3 short testimonials (photo + one-line quote) from real Uzbek learners — preferably reels-friendly names/faces the user has already seen on IG.
- **Copy heading:** *"Boshqalar qanday natijaga erishgan"*
- **Cards:** e.g., *"Aziza, 19 — IELTS 7.5 (3 oy)"* / *"Sardor, 22 — DTM 90 ball (5 oy)"* / *"Kamola, 26 — B2 (4 oy)"*
- **Why:** Instagram is Engnova's main channel and Uzbek learners over-index on trust-through-faces. Duolingo doesn't need this because its brand does the work; Engnova needs to build brand-adjacent trust here.
- **Bonus:** small note *"Instagram'da @cefracademy'da yana ko'ring"*

### Screen 10 — Daily commitment (streak setup)

- **Shows:** 4 chunky cards.
- **Copy heading:** *"Kuniga qancha vaqt ajratasiz?"*
- **Options:** *5 daq — Yengil* / *10 daq — Barqaror* (preselected default) / *15 daq — Jiddiy* / *20 daq — Intensiv*
- **What it does:** Sets daily target; feeds the streak counter that begins on Day 1.
- **Why:** Duolingo's playbook exactly (§3.2). Users who set a daily target and complete Day 1 have a live streak by the time the paywall appears — the "sunk cost" primes the yes.

### Screen 11 — Register (deferred, just now)

- **Shows:** Only now do we ask for phone/email. Two tabs: *Telefon raqami* (default) / *Email*. Google button visible. No password on this screen (magic link or OTP only).
- **Copy heading:** *"Rejangizni saqlab qo'yamiz — telefon raqamingizni kiriting"*
- **Subline (frames it as a benefit, not a wall):** *"OTP kod yuboramiz. Boshqa hech narsa so'ramaymiz."*
- **Why:** Placing register at Screen 11 means the users who reach here are already 80% mentally sold. Englify asks at Screen 3-4; that's where they lose people. Compare: Duolingo defers to *after* the first lesson.
- **Note:** For CEFR the site allows password-free continue; keep parity. For returning users, matching by phone/email must resume their existing plan — do NOT re-run onboarding for known users (Login guard rule from D:\cefrprep memory).

### Screen 12 — PAYWALL, in the shell, warmed up

- **Shows:** Personalized headline, tier cards, social proof badge, small merchant-name warning card.
- **Copy heading (dynamic, uses Screens 3 + 4 + 7 answers):**
  - Example: *"**IELTS 7.0** ni **3 oy**da olish uchun: to'liq reja tayyor"*
  - Or: *"**B1** ga chiqish uchun: to'liq reja tayyor"*
- **Two tier cards** (keep CEFR Academy's existing tiers; do not touch pricing engine — the site handles that; the shell just previews):
  - Left card: 1-month, primary CTA *"Boshlash"*, price shown small.
  - Right card: 3-month with "Eng mashhur" badge, discount shown as "-25%", CTA same.
- **Social proof strip:** *"⭐ 4.9 • 250+ to'lovchi o'quvchi"* (matches the existing rating policy per D:\cefrprep memory).
- **Small warning card ABOVE the pay CTA** (the merchant-name inoculation):
  - *"Eslatma: to'lov sahifasida **RAVNAQ TALIM AKADEMIYA** deb chiqadi — bu bizmiz. Bu rasmiy nomimiz."*
  - This one screen alone likely recovers a chunk of the ~85% pricing→pay-click leak documented in the checkout-handoff memory.
- **Payment handoff:** Tapping *"Boshlash"* opens the site's existing paycom.uz / click.uz flow in an in-app WebView (CEFR) or external Chrome (IELTS — because Click needs to escape the Capacitor webview per the checkout-handoff memory).
- **Why in-shell not on-site:** By keeping the paywall UI native in the Capacitor shell, we (a) control the personalization strings freely, (b) can A/B copy without a site deploy, (c) can show the merchant-name warning immediately adjacent to the pay button (impossible if the paywall is on the site because the warning wouldn't fit the site's design system).

---

### Optional Screen 13 — First micro-win (post-paywall, for both payers and non-payers)

- **For payers:** Drop them into the site dashboard's first lesson via WebView.
- **For non-payers who dismissed the paywall:** Show ONE free lesson unit (or a 60-second speaking prompt if they picked IELTS) in the shell before routing to the site. The Duolingo pattern — a lesson-completion win — makes them come back for the paywall on Day 2 or Day 3 with the streak counter incremented.
- **Why:** RevenueCat's data (§3, §4) shows onboarding + trial converts at ~1.78% install-to-conversion; onboarding + first-value + trial (multi-touch paywall) is where the ~3–4% winners live.

---

### Summary of what each screen learns

| Screen | Question | Feeds |
|--------|----------|-------|
| 1 | UI language | All copy |
| 3 | Goal | Product routing (S8), paywall headline (S12) |
| 4 | Deadline | Plan pace, urgency framing on paywall |
| 5 | Self-reported level | Skip / show mini-quiz (S6) |
| 6 | 3-question quiz | Level verdict (S7) |
| 7 | (Verdict) | Aspiration → paywall aspiration line |
| 8 | Product confirmation | Which site loads |
| 10 | Daily commitment | Streak counter on Day 1 |
| 11 | Phone/email | Account + returning-user recognition |

Any question that doesn't map to a later screen was cut. This is the Adapty / Airbridge rule and it is why competitors like Duolingo — with 38 screens — still convert at ~10%: every screen has a job.

---

## Appendix — Sources

- Duolingo teardowns: tasu.ai/library/duolingo · userguiding.com/blog/duolingo-onboarding-ux · goodux.appcues.com/blog/duolingo-user-onboarding · junoschool.org/article/duolingo-onboarding-experience · duoplanet.com/duolingo-learning-path
- Busuu: screensdesign.com/showcase/busuu-language-learning · blog.busuu.com/find-your-level · help.busuu.com Placement Test article · tech.busuu.com adaptive-testing series
- ELSA Speak: apps.apple.com/us/app/elsa-speak-english-learning/id1083804886 · elsaspeak.com/en/web-assessment-test · Product Hunt & Capterra reviews
- Preply: mobbin.com Preply iOS Onboarding flow · growthcasestudies.com anti-Duolingo Preply onboarding
- Cambly: leonardoenglish.com/blog/cambly-review · studentsupport.cambly.com/hc Try Cambly
- Babbel: support.babbel.com Placement Quiz article · languavibe.com babbel-review
- Englify: play.google.com/store/apps/details?id=uz.englify.englify_client_mobile · apps.apple.com/us/app/englify/id6499320034 · englify.uz · englify.uz/testing · app.englify.uz/auth/registration
- Best-practice / benchmarks: airbridge.io 5-steps-app-onboarding-before-the-paywall · adapty.io how-to-personalize-onboarding-and-paywalls-in-your-mobile-app · revenuecat.com/blog/growth/paywall-placement · funnelfox.com effective-paywall-screen-designs-mobile-apps · dev.to/paywallpro subscription-onboarding-15-patterns-you-must-know · uxcam.com/blog/10-apps-with-great-user-onboarding
