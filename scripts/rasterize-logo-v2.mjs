/**
 * Rasterize the v2 + v3 logo experiments (Englify-style chunky bubble letters)
 * for owner review. Outputs to D:/engnova-blueprint/12-logo/png/preview/.
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LOGO_DIR = 'D:/engnova-blueprint/12-logo';
const OUT      = join(LOGO_DIR, 'png', 'preview');
mkdirSync(OUT, { recursive: true });

const VARIANTS = [
  { name: 'v2-chunky-En',   svg: 'mark-v2-chunky.svg' },
  { name: 'v3-wordmark',    svg: 'mark-v3-wordmark.svg' },
];

for (const v of VARIANTS) {
  const svg = readFileSync(join(LOGO_DIR, 'svg', v.svg));
  for (const px of [512, 192, 64]) {
    await sharp(svg, { density: 384 })
      .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(join(OUT, `${v.name}-${px}.png`));
    console.log(`  wrote ${v.name}-${px}.png`);
  }
}
console.log('\nAll previews at', OUT);
