#!/usr/bin/env node
/**
 * apply-android-overrides.mjs
 * ───────────────────────────
 * Copies every file under `android-overrides/` into `android/` at the same
 * relative path. Run this AFTER any `npx cap add android` regen (which resets
 * `android/` to Capacitor defaults, blowing away our neon icon + splash theme
 * + minSdk bump + MainActivity SplashScreen wiring).
 *
 * `android/` is gitignored end-to-end (per Capacitor convention). This mirror
 * folder is the source of truth for every native customization we ship.
 *
 * Idempotent: overwrites the target file each time. Reports a diff summary.
 *
 * Usage:   node scripts/apply-android-overrides.mjs
 *   or:   npm run sync:android
 */
import { promises as fs } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC  = join(ROOT, 'android-overrides');
const DST  = join(ROOT, 'android');

async function walk(dir) {
    const out = [];
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
        const p = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...(await walk(p)));
        else out.push(p);
    }
    return out;
}

async function main() {
    try { await fs.access(SRC); }
    catch { console.error(`Nothing to sync — ${SRC} does not exist.`); process.exit(0); }
    try { await fs.access(DST); }
    catch {
        console.error(`android/ does not exist. Run \`npx cap add android\` first, then re-run this.`);
        process.exit(1);
    }

    const files = await walk(SRC);
    let copied = 0, skipped = 0;
    for (const s of files) {
        const rel = relative(SRC, s);
        const d = join(DST, rel);
        await fs.mkdir(dirname(d), { recursive: true });
        // Compare bytes; skip when identical so re-runs are quiet.
        let identical = false;
        try {
            const [a, b] = await Promise.all([fs.readFile(s), fs.readFile(d)]);
            identical = a.equals(b);
        } catch { /* target missing → not identical → copy */ }
        if (identical) { skipped++; continue; }
        await fs.copyFile(s, d);
        console.log(`  ✓ ${rel}`);
        copied++;
    }
    console.log(`\nSynced ${copied} file(s); ${skipped} already up-to-date.`);
    if (copied > 0) {
        console.log(`Next: \`npx cap sync android\` if you want capacitor to also refresh its own bits.`);
    }
}

main().catch((e) => { console.error(e); process.exit(1); });
