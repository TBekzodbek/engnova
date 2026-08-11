#!/usr/bin/env node
/**
 * export-store-graphics.mjs
 * ─────────────────────────
 * Rasterizes Play Store graphics from source SVGs using `sharp`
 * (pure Node — no external binary required).
 *
 * Outputs (all Play-spec-compliant: 24-bit PNG, NO alpha):
 *   store-assets/icon-512.png            512x512   — launcher icon
 *   store-assets/feature-graphic.png    1024x500   — Play listing hero
 *
 * Alpha is stripped by flattening onto the brand splash background
 * (#08080C) — matches the actual splash-screen color the user sees on
 * cold-launch, so the store icon and the first frame of the app agree.
 *
 * Usage:  npm run graphics:export
 *   or:   node scripts/export-store-graphics.mjs
 */
import sharp from 'sharp';
import { promises as fs, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const BG   = '#08080C';   // splash bg — matches values/colors.xml `splash_bg`

const JOBS = [
    {
        label:  'launcher icon',
        input:  join(ROOT, 'assets/brand/icon-full.svg'),
        output: join(ROOT, 'store-assets/icon-512.png'),
        width:  512,
        height: 512,
    },
    {
        label:  'feature graphic',
        input:  join(ROOT, 'store-assets/feature-graphic.svg'),
        output: join(ROOT, 'store-assets/feature-graphic.png'),
        width:  1024,
        height: 500,
    },
];

let failed = 0;
for (const job of JOBS) {
    process.stdout.write(`  ${job.label.padEnd(20)} ${job.width}x${job.height}  … `);
    if (!existsSync(job.input)) {
        console.log(`SKIP (source missing: ${job.input})`);
        failed++;
        continue;
    }
    try {
        await fs.mkdir(dirname(job.output), { recursive: true });
        const meta = await sharp(job.input)
            // flatten onto the brand splash bg — Play rejects alpha channels.
            .flatten({ background: BG })
            .resize(job.width, job.height, { fit: 'fill' })
            .png({ compressionLevel: 9, palette: false })
            .toFile(job.output);
        console.log(`OK (${(meta.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
        console.log(`FAIL — ${e.message}`);
        failed++;
    }
}

if (failed) {
    console.error(`\n${failed} job(s) failed.`);
    process.exit(1);
}

console.log(`\nDone. Upload these files in Play Console → Store listing:`);
for (const job of JOBS) console.log(`  ${job.output}`);
