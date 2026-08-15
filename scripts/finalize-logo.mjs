/**
 * Finalize the chosen Engnova logo — take the G6 master PNG and produce every
 * variant we need: site favicons, launcher-density PNGs, Play Store 512.
 *
 * Owner-chosen master: G6 (dark navy + rainbow "Engnova" wordmark + education
 * objects — book / cap / speech bubble / globe / stars).
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE = 'D:/engnova-blueprint/12-logo/png/gemini/g6-education-objects.png';
const BLUEPRINT_OUT = 'D:/engnova-blueprint/12-logo/final';
const SITE_PUBLIC   = 'D:/engnova/public';
const STORE_ASSETS  = 'D:/engnova/store-assets';
const MIPMAP_BASE   = 'D:/engnova/android-overrides/app/src/main/res';

mkdirSync(BLUEPRINT_OUT, { recursive: true });

// Archive the master file at the blueprint root as the source-of-truth
copyFileSync(SOURCE, join(BLUEPRINT_OUT, 'mark.png'));
console.log(`  master: ${join(BLUEPRINT_OUT, 'mark.png')}`);

const MASTER = readFileSync(SOURCE);

async function emit(px, path) {
  await sharp(MASTER)
    .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(path);
  console.log(`  wrote ${path.replace(/^D:\//, '')} (${px}x${px})`);
}

// ── Blueprint reference sizes ─────────────────────────────────────────
for (const px of [16, 32, 48, 64, 96, 192, 512, 1024]) {
  await emit(px, join(BLUEPRINT_OUT, `mark-${px}.png`));
}

// ── Site public folder ─────────────────────────────────────────────────
await emit(32,  join(SITE_PUBLIC, 'favicon.png'));
await emit(192, join(SITE_PUBLIC, 'mark-192.png'));
await emit(512, join(SITE_PUBLIC, 'mark-512.png'));

// ── Play Store listing icon ────────────────────────────────────────────
await emit(512, join(STORE_ASSETS, 'icon-512.png'));

// ── Android launcher densities (both regular + round variants) ─────────
const DENSITIES = [
  { name: 'mdpi',    px: 48  },
  { name: 'hdpi',    px: 72  },
  { name: 'xhdpi',   px: 96  },
  { name: 'xxhdpi',  px: 144 },
  { name: 'xxxhdpi', px: 192 },
];
for (const { name, px } of DENSITIES) {
  const dir = join(MIPMAP_BASE, `mipmap-${name}`);
  await emit(px, join(dir, 'ic_launcher.png'));
  await emit(px, join(dir, 'ic_launcher_round.png'));
}

console.log('\nDone. Logo finalized to all targets.');
