#!/usr/bin/env node
/**
 * export-play-icon.mjs
 * ────────────────────
 * Renders assets/brand/icon-full.svg into store-assets/icon-512.png, the
 * PNG that Google Play Console's "App icon" slot expects.
 *
 * Play Console requirements enforced here:
 *   • Exactly 512x512
 *   • PNG WITHOUT alpha channel  (Play rejects transparent store icons —
 *     they render on a white card and look wrong with the neon glow bleeding
 *     onto a checkerboard)
 *   • Under 1024 KB
 *
 * Rendering backend, tried in order:
 *   1. ImageMagick   `magick`   (v7)
 *   2. ImageMagick   `convert`  (v6, legacy)
 *   3. Inkscape      `inkscape`
 *   4. → clear install instructions, then exit non-zero.
 *
 * ImageMagick is preferred because `-background '#08080C' -flatten -alpha off`
 * plus the `PNG24:` output specifier reliably produces a truecolor, no-alpha
 * PNG that flattens the neon halo onto the splash-background ink. Inkscape's
 * PNG output still carries an alpha channel even with a solid background; if
 * that's the only tool available we render anyway, then the verify() step
 * warns and exits non-zero so the caller knows to install ImageMagick before
 * uploading.
 *
 * Output is verified by reading the PNG IHDR chunk directly — no third-party
 * PNG library, no NPM install, works on a clean machine.
 *
 * Usage:  node scripts/export-play-icon.mjs
 *   or:  npm run icon:export
 */
import { promises as fs } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT     = fileURLToPath(new URL('..', import.meta.url));
const SRC      = join(ROOT, 'assets', 'brand', 'icon-full.svg');
const OUT_DIR  = join(ROOT, 'store-assets');
const OUT      = join(OUT_DIR, 'icon-512.png');
const BG       = '#08080C';   // splash background, matches src/design/tokens.ts
const SIZE     = 512;
const MAX_KB   = 1024;

// ── backend detection ──────────────────────────────────────────────────────
function has(cmd) {
    const isWin = process.platform === 'win32';
    const res = isWin
        ? spawnSync('where', [cmd], { stdio: 'ignore', shell: true, timeout: 5000 })
        : spawnSync('command', ['-v', cmd], { stdio: 'ignore', shell: true, timeout: 5000 });
    return res.status === 0;
}

function run(cmd, args) {
    const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
    if (res.error) throw res.error;
    if (res.status !== 0) throw new Error(`${cmd} exited with status ${res.status}`);
}

// ── renderers ──────────────────────────────────────────────────────────────
function renderWithMagick(bin) {
    // -density 300  rasterize SVG at high dpi first so the -resize downsample
    //               is clean; without it MagickWand renders at 96dpi and edges
    //               end up mushy.
    // -background   solid ink underneath.
    // -flatten      composite over the background — kills transparency.
    // -alpha off    strip the alpha channel from the pixel array itself.
    // PNG24:        force 24-bit truecolor output, no alpha byte per pixel.
    run(bin, [
        '-background', BG,
        '-density', '300',
        `"${SRC}"`,
        '-resize', `${SIZE}x${SIZE}`,
        '-flatten',
        '-alpha', 'off',
        `PNG24:"${OUT}"`,
    ]);
}

function renderWithInkscape() {
    run('inkscape', [
        '--export-type=png',
        `--export-width=${SIZE}`,
        `--export-height=${SIZE}`,
        `--export-background=${BG}`,
        '--export-background-opacity=1',
        `--export-filename="${OUT}"`,
        `"${SRC}"`,
    ]);
}

// ── verification (raw PNG header parse, no dependencies) ───────────────────
function verify(buf) {
    // 8-byte PNG signature followed by an IHDR chunk:
    //   [8]  signature 89 50 4E 47 0D 0A 1A 0A
    //   [4]  chunk length (13)
    //   [4]  chunk type "IHDR"
    //   [4]  width  (BE u32)
    //   [4]  height (BE u32)
    //   [1]  bit depth
    //   [1]  color type  ( 2 = RGB truecolor, 6 = RGBA, 4 = gray+alpha )
    //   ...
    if (buf.length < 26 || buf.readUInt32BE(0) !== 0x89504e47) {
        throw new Error('Output file is not a valid PNG.');
    }
    const width     = buf.readUInt32BE(16);
    const height    = buf.readUInt32BE(20);
    const bitDepth  = buf.readUInt8(24);
    const colorType = buf.readUInt8(25);

    const problems = [];
    if (width !== SIZE || height !== SIZE) {
        problems.push(`dimensions are ${width}x${height}, want ${SIZE}x${SIZE}`);
    }
    if (colorType === 4 || colorType === 6) {
        problems.push(
            `PNG carries an alpha channel (color type ${colorType}). ` +
            `Play rejects alpha on the store icon. ` +
            `Install ImageMagick and re-run — its PNG24 output has no alpha.`
        );
    }
    const kb = buf.length / 1024;
    if (kb >= MAX_KB) {
        problems.push(`file is ${kb.toFixed(1)} KB, must be under ${MAX_KB} KB`);
    }
    return { width, height, bitDepth, colorType, bytes: buf.length, kb, problems };
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
    try { await fs.access(SRC); }
    catch { console.error(`Missing source SVG: ${SRC}`); process.exit(1); }

    await fs.mkdir(OUT_DIR, { recursive: true });

    let backend = null;
    if      (has('magick'))   backend = { name: 'ImageMagick (magick)',  run: () => renderWithMagick('magick') };
    else if (has('convert'))  backend = { name: 'ImageMagick (convert)', run: () => renderWithMagick('convert') };
    else if (has('inkscape')) backend = { name: 'Inkscape',              run: renderWithInkscape };

    if (!backend) {
        console.error(
`No SVG rasterizer found on PATH.

Install one of these and re-run (ImageMagick is strongly preferred — its
PNG24 output is guaranteed to be alpha-free):

  ImageMagick
      Windows:   winget install ImageMagick.ImageMagick
      macOS:     brew install imagemagick
      Linux:     sudo apt install imagemagick   # or dnf/pacman equivalent

  Inkscape (fallback; output may still carry alpha)
      Windows:   winget install Inkscape.Inkscape
      macOS:     brew install --cask inkscape
      Linux:     sudo apt install inkscape

Then:   npm run icon:export
`);
        process.exit(1);
    }

    console.log(`Rendering  ${SRC}`);
    console.log(`       →   ${OUT}`);
    console.log(`Backend:   ${backend.name}   Size: ${SIZE}x${SIZE}   Background: ${BG}\n`);

    backend.run();

    const buf = await fs.readFile(OUT);
    const report = verify(buf);

    console.log(
        `\nResult:  ${report.width}x${report.height}   ` +
        `bit-depth ${report.bitDepth}   color-type ${report.colorType}   ` +
        `${report.kb.toFixed(1)} KB`
    );

    if (report.problems.length > 0) {
        console.error('\nPlay Console will REJECT this icon:');
        for (const p of report.problems) console.error(`  ✗ ${p}`);
        process.exit(2);
    }
    console.log('✓ Ready for Play Console upload.');
}

main().catch((e) => { console.error(e); process.exit(1); });
