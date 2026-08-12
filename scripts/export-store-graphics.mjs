#!/usr/bin/env node
/**
 * export-store-graphics.mjs
 * ─────────────────────────
 * Rasterizes every icon Engnova needs, from source SVGs via `sharp`
 * (pure Node, no external binary).
 *
 * Outputs:
 *
 *   Play Store (24-bit PNG, NO alpha — Play spec):
 *     store-assets/icon-512.png            512x512    launcher icon
 *     store-assets/feature-graphic.png    1024x500    Play listing hero
 *
 *   Android launcher bitmaps (WEBP with alpha, one per density):
 *     android-overrides/…/mipmap-mdpi/    ic_launcher.png    48x48
 *     android-overrides/…/mipmap-hdpi/    ic_launcher.png    72x72
 *     android-overrides/…/mipmap-xhdpi/   ic_launcher.png    96x96
 *     android-overrides/…/mipmap-xxhdpi/  ic_launcher.png   144x144
 *     android-overrides/…/mipmap-xxxhdpi/ ic_launcher.png   192x192
 *     (plus ic_launcher_round.png at same sizes — circle-cropped)
 *
 *   Why the density-specific launcher bitmaps: MIUI and some legacy
 *   Android launchers IGNORE mipmap-anydpi-v26/ic_launcher.xml (the
 *   adaptive-icon spec) and use the density bitmaps directly. Capacitor
 *   scaffolds default bugdroid PNGs at those paths — without these
 *   overrides, MIUI shows the Android robot icon regardless of what
 *   our adaptive XML says.
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

const ICON_SRC = join(ROOT, 'assets/brand/icon-full.svg');

const STORE_JOBS = [
    {
        label:  'Play launcher icon',
        input:  ICON_SRC,
        output: join(ROOT, 'store-assets/icon-512.png'),
        width:  512, height: 512,
        flatten: true,   // Play rejects alpha
    },
    {
        label:  'Play feature graphic',
        input:  join(ROOT, 'store-assets/feature-graphic.svg'),
        output: join(ROOT, 'store-assets/feature-graphic.png'),
        width:  1024, height: 500,
        flatten: true,
    },
];

// Android density buckets → launcher icon pixel size.
// (Reference: developer.android.com/design/ui/mobile/guides/foundations/iconography)
const DENSITIES = [
    ['mdpi',    48],
    ['hdpi',    72],
    ['xhdpi',   96],
    ['xxhdpi', 144],
    ['xxxhdpi', 192],
];

const MIPMAP_ROOT = join(ROOT, 'android-overrides/app/src/main/res');

/**
 * Circle-crop mask for round launcher variants. Sharp composites this over
 * the resized square icon; anything outside the circle becomes transparent.
 */
function roundMaskSvg(size) {
    return Buffer.from(
        `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">` +
        `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/>` +
        `</svg>`
    );
}

async function renderStoreJob(job) {
    process.stdout.write(`  ${job.label.padEnd(24)} ${job.width}x${job.height}  … `);
    if (!existsSync(job.input)) {
        console.log(`SKIP (source missing: ${job.input})`);
        return { ok: false };
    }
    try {
        await fs.mkdir(dirname(job.output), { recursive: true });
        let pipe = sharp(job.input).resize(job.width, job.height, { fit: 'fill' });
        if (job.flatten) pipe = pipe.flatten({ background: BG });
        const meta = await pipe.png({ compressionLevel: 9, palette: false }).toFile(job.output);
        console.log(`OK (${(meta.size / 1024).toFixed(1)} KB)`);
        return { ok: true, meta };
    } catch (e) {
        console.log(`FAIL — ${e.message}`);
        return { ok: false, error: e.message };
    }
}

async function renderLauncherBitmap({ variant, density, size }) {
    const dir  = join(MIPMAP_ROOT, `mipmap-${density}`);
    const name = variant === 'round' ? 'ic_launcher_round.png' : 'ic_launcher.png';
    const out  = join(dir, name);
    await fs.mkdir(dir, { recursive: true });

    // Base: full-bleed icon at the target density.
    let pipe = sharp(ICON_SRC).resize(size, size, { fit: 'fill' });

    if (variant === 'round') {
        // Circle-crop. Rendered on a transparent PNG so launchers that don't
        // clip get a natural circle; ones that DO clip end up with the same
        // shape rather than a square-in-circle-in-square look.
        const roundedIcon = await pipe.png().toBuffer();
        await sharp({
            create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
        })
            .composite([
                { input: roundedIcon, blend: 'over' },
                { input: roundMaskSvg(size), blend: 'dest-in' },
            ])
            .png({ compressionLevel: 9 })
            .toFile(out);
    } else {
        // Square variant — full-bleed, keeps the star + halo + rays visible.
        // MIUI + most modern launchers apply their own rounded-corner mask
        // on top; because our design has visible content near the center,
        // the mask crop looks fine.
        await pipe.png({ compressionLevel: 9 }).toFile(out);
    }
    return out;
}

let failed = 0;

console.log('Play Store graphics:');
for (const job of STORE_JOBS) {
    const r = await renderStoreJob(job);
    if (!r.ok) failed++;
}

console.log('\nAndroid launcher bitmaps (overrides Capacitor scaffold):');
for (const [density, size] of DENSITIES) {
    process.stdout.write(`  mipmap-${density.padEnd(8)} ${size.toString().padStart(3)}x${size.toString().padEnd(3)}  … `);
    try {
        const sq = await renderLauncherBitmap({ variant: 'square', density, size });
        const rd = await renderLauncherBitmap({ variant: 'round',  density, size });
        const [ss, rs] = await Promise.all([fs.stat(sq), fs.stat(rd)]);
        console.log(`OK (sq ${(ss.size / 1024).toFixed(1)} KB, round ${(rs.size / 1024).toFixed(1)} KB)`);
    } catch (e) {
        console.log(`FAIL — ${e.message}`);
        failed++;
    }
}

if (failed) {
    console.error(`\n${failed} job(s) failed.`);
    process.exit(1);
}

console.log(`\nDone.`);
console.log(`  Play Store:  store-assets/{icon-512,feature-graphic}.png`);
console.log(`  App icon:    android-overrides/…/mipmap-*/ic_launcher{,_round}.png`);
console.log(`  → run \`npm run sync:android\` then a release build to ship the app icon.`);
