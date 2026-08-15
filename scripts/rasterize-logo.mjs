/**
 * Rasterize D:/engnova-blueprint/12-logo/svg/mark.svg to all needed PNG sizes.
 * Lives inside engnova/scripts/ so `sharp` resolves cleanly; writes PNGs back
 * to the blueprint folder.
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const LOGO_DIR = 'D:/engnova-blueprint/12-logo';
const SVG      = readFileSync(join(LOGO_DIR, 'svg', 'mark.svg'));
const OUT      = join(LOGO_DIR, 'png');
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: 'mark-1024',                  px: 1024 },
  { name: 'mark-512',                   px: 512  },  // Play Store listing icon
  { name: 'mark-192',                   px: 192  },  // web manifest icon
  { name: 'mark-96',                    px: 96   },
  { name: 'mark-64',                    px: 64   },  // email header
  { name: 'mark-48',                    px: 48   },
  { name: 'mark-32',                    px: 32   },  // favicon
  { name: 'mark-16',                    px: 16   },
  { name: 'mipmap-mdpi-ic_launcher',    px: 48   },
  { name: 'mipmap-hdpi-ic_launcher',    px: 72   },
  { name: 'mipmap-xhdpi-ic_launcher',   px: 96   },
  { name: 'mipmap-xxhdpi-ic_launcher',  px: 144  },
  { name: 'mipmap-xxxhdpi-ic_launcher', px: 192  },
];

for (const { name, px } of SIZES) {
  const outPath = join(OUT, `${name}.png`);
  await sharp(SVG, { density: 384 })
    .resize(px, px, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(outPath);
  console.log(`  wrote ${name}.png  (${px}x${px})`);
}

console.log('\nAll sizes rasterized to', OUT);
