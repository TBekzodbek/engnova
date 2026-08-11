#!/usr/bin/env node
/**
 * capture-screenshots.mjs
 * ───────────────────────
 * Drives the Vite dev server via headless Chrome to capture 4 phone-frame
 * screenshots × 3 locales = 12 spec-compliant Play Store screenshots.
 *
 * Output:  store-assets/screenshots/{uz,ru,en}/{01-chooser,02-onboarding,03-login,04-language}.png
 * Size:    1080x1920 (exactly 9:16, Play's sweet spot)
 *
 * Prereqs: `npm run dev` running on http://localhost:5174.
 *          System Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe.
 *
 * Usage:   npm run screenshots:capture
 */
import puppeteer from 'puppeteer-core';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const OUT_ROOT = join(ROOT, 'store-assets/screenshots');
const DEV_URL = 'http://localhost:5174';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const LANGS = ['uz', 'ru', 'en'];
const VIEWPORT = { width: 1080, height: 1920, deviceScaleFactor: 1 };

// Preflight: dev server reachable? Node's fetch is unambiguous cross-shell.
try {
    const r = await fetch(DEV_URL);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
} catch (e) {
    console.error(`Dev server not reachable at ${DEV_URL}: ${e.message}`);
    console.error('Run `npm run dev` first (leave it running in another terminal).');
    process.exit(1);
}

console.log('Launching headless Chrome…');
const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

async function shoot(page, lang, shotName, setup) {
    // Fresh state per shot — wipe localStorage, set the language, apply per-shot setup.
    await page.evaluate(({ lang: l }) => {
        Object.keys(localStorage).forEach((k) => localStorage.removeItem(k));
        localStorage.setItem('engnova.lang', l);
    }, { lang });

    await setup(page);
    // Let framer-motion / react settle.
    await new Promise((r) => setTimeout(r, 900));

    const dir = join(OUT_ROOT, lang);
    await fs.mkdir(dir, { recursive: true });
    const file = join(dir, `${shotName}.png`);
    await page.screenshot({ path: file, type: 'png', omitBackground: false, fullPage: false });
    console.log(`  ✓ ${lang}/${shotName}.png`);
}

const SHOTS = [
    {
        name: '01-chooser',
        setup: async (page) => {
            // Skip onboarding by pretending it's already done, then reload.
            await page.evaluate(() => localStorage.setItem('CapacitorStorage.engnova.onboardingDone.v1', '1'));
            await page.reload({ waitUntil: 'networkidle0' });
        },
    },
    {
        name: '02-onboarding',
        setup: async (page) => {
            // Fresh state (onboarding not seen) — advance to slide 3.
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise((r) => setTimeout(r, 500));
            // Click the Next button twice to reach slide 3 (the "Boshlaymiz" / "Get started" one).
            for (let i = 0; i < 2; i++) {
                await page.evaluate(() => {
                    const btn = document.querySelector('.onb-next');
                    if (btn) btn.click();
                });
                await new Promise((r) => setTimeout(r, 350));
            }
        },
    },
    {
        name: '03-login-cefr',
        setup: async (page) => {
            // Skip onboarding, then click the CEFR card.
            await page.evaluate(() => {
                localStorage.setItem('CapacitorStorage.engnova.onboardingDone.v1', '1');
                localStorage.setItem('engnova.track', 'cefr');   // getSavedTrack() reads plain localStorage
            });
            await page.reload({ waitUntil: 'networkidle0' });
        },
    },
    {
        name: '04-language-sheet',
        setup: async (page) => {
            // Chooser state, then open the language sheet.
            await page.evaluate(() => localStorage.setItem('CapacitorStorage.engnova.onboardingDone.v1', '1'));
            await page.reload({ waitUntil: 'networkidle0' });
            await new Promise((r) => setTimeout(r, 400));
            await page.evaluate(() => {
                // The chip is a <button> with aria-haspopup, or class 'lang-chip'
                const chip =
                    document.querySelector('.lang-chip') ||
                    document.querySelector('[aria-haspopup]');
                if (chip) chip.click();
            });
        },
    },
];

const page = await browser.newPage();
await page.setViewport(VIEWPORT);
await page.goto(DEV_URL, { waitUntil: 'networkidle0' });

for (const lang of LANGS) {
    console.log(`\n[${lang.toUpperCase()}] captures`);
    for (const shot of SHOTS) {
        try {
            await shoot(page, lang, shot.name, shot.setup);
        } catch (e) {
            console.error(`  ✗ ${lang}/${shot.name} — ${e.message}`);
        }
    }
}

await browser.close();

console.log(`\nDone. Screenshots in ${OUT_ROOT}/{${LANGS.join(',')}}/`);
console.log('Play Console → Store listing → Phone screenshots: upload the 4 files per locale.');
