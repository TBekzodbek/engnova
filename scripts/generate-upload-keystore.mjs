#!/usr/bin/env node
/**
 * generate-upload-keystore.mjs
 * ────────────────────────────
 *  Interactive helper for the ONE-TIME Play Store upload keystore setup.
 *
 *  Spawns keytool with stdio inherited so YOU type the passwords directly
 *  into keytool's own prompts — Node never sees them, never logs them.
 *
 *  Output:  android/engnova-upload.jks
 *  Alias:   engnova-upload   (matches keystore.properties.example)
 *  Algo:    RSA / 2048       (Play Store minimum)
 *  Valid:   10000 days       (Play recommendation — 27+ years)
 *
 *  After creation, this ALSO:
 *    1. Prompts you for the keystore password ONE more time so it can read
 *       the SHA-256 fingerprint out of the cert.
 *    2. Rewrites store-assets/assetlinks-{cefracademy,ieltslevel}.json,
 *       replacing the <REPLACE_WITH_UPLOAD_KEY_SHA256> placeholder with the
 *       real hash — App Links verification requires this.
 *    3. Writes a keystore-integrity.txt next to the .jks with a SHA-256 of
 *       the FILE (not the cert) so you can verify a backup is the same file
 *       later. Handy when you're paranoid the USB stick got corrupted.
 *
 *  Losing the .jks file OR forgetting its passwords = you can NEVER update
 *  the app on Play again (the upload key IS the app's identity — Google
 *  verifies every uploaded AAB against it). See the checklist printed at end.
 *
 *  Usage:   npm run keystore:generate
 *    or:    node scripts/generate-upload-keystore.mjs
 */
import { spawnSync } from 'node:child_process';
import { promises as fs, existsSync, createReadStream } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const ROOT     = fileURLToPath(new URL('..', import.meta.url));
const ANDROID  = join(ROOT, 'android');
const OUT      = join(ANDROID, 'engnova-upload.jks');
const INTEG    = join(ANDROID, 'engnova-upload.jks.sha256.txt');
const ASSETS   = join(ROOT, 'store-assets');
const LINK_A   = join(ASSETS, 'assetlinks-cefracademy.json');
const LINK_B   = join(ASSETS, 'assetlinks-ieltslevel.json');
const ALIAS    = 'engnova-upload';

// ── Sanity ─────────────────────────────────────────────────────────────────
if (!existsSync(ANDROID)) {
    console.error('android/ does not exist. Run `npx cap add android` first.');
    process.exit(1);
}
if (existsSync(OUT)) {
    console.error(`Refusing to overwrite existing keystore:\n  ${OUT}`);
    console.error('\nIf you REALLY want to regenerate (WARNING: this changes the app identity,');
    console.error('meaning any AAB you already uploaded to Play cannot be updated by future');
    console.error('builds signed with the new key), delete it manually and re-run.');
    process.exit(1);
}

function locateKeytool() {
    const exe = platform() === 'win32' ? 'keytool.exe' : 'keytool';
    if (process.env.JAVA_HOME) {
        const c = join(process.env.JAVA_HOME, 'bin', exe);
        if (existsSync(c)) return c;
    }
    return exe;
}
const KEYTOOL = locateKeytool();

// ── Step 1 · keytool -genkeypair (interactive) ─────────────────────────────
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│  Engnova · upload keystore setup                                    │');
console.log('├─────────────────────────────────────────────────────────────────────┤');
console.log('│  keytool will now prompt you for:                                   │');
console.log('│    1. Keystore password (STRONG, min 6 chars)                       │');
console.log('│    2. Certificate identity — Name / Org / City / Country            │');
console.log('│       (any real-ish values are fine; Play does not verify them)     │');
console.log('│    3. Confirm identity                                              │');
console.log('│    4. Key password — press ENTER to reuse the keystore password     │');
console.log('│                                                                     │');
console.log('│  WRITE YOUR PASSWORDS DOWN BEFORE YOU TYPE THEM.                    │');
console.log('│  Losing them = never being able to update the app on Play.          │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log('');

const genArgs = [
    '-genkeypair', '-v',
    '-keystore', OUT,
    '-alias', ALIAS,
    '-keyalg', 'RSA', '-keysize', '2048',
    '-validity', '10000',
];
const gen = spawnSync(KEYTOOL, genArgs, { stdio: 'inherit' });

if (gen.error) {
    console.error(`\nFailed to run keytool at "${KEYTOOL}".`);
    if (gen.error.code === 'ENOENT') {
        console.error('keytool not found. Make sure JAVA_HOME points at your JDK 21 install, e.g.:');
        console.error('  set JAVA_HOME=C:\\Program Files\\Java\\jdk-21');
    } else {
        console.error(gen.error.message);
    }
    process.exit(1);
}
if (gen.status !== 0 || !existsSync(OUT)) {
    console.error(`\nkeytool exited with status ${gen.status ?? '?'} — keystore not created.`);
    process.exit(gen.status ?? 1);
}

// ── Step 2 · File integrity SHA-256 (of the .jks file itself) ──────────────
async function fileSha256(path) {
    return new Promise((resolve, reject) => {
        const h = createHash('sha256');
        createReadStream(path).on('data', (c) => h.update(c)).on('end', () => resolve(h.digest('hex'))).on('error', reject);
    });
}
const fileHash = await fileSha256(OUT);
await fs.writeFile(INTEG,
    `# engnova-upload.jks · file integrity checksum\n` +
    `# Generated ${new Date().toISOString()}\n` +
    `# Verify a backup with: sha256sum engnova-upload.jks (Linux/macOS)\n` +
    `#                       Get-FileHash engnova-upload.jks -Algorithm SHA256 (PowerShell)\n` +
    `\n${fileHash}  engnova-upload.jks\n`,
    'utf8'
);

// ── Step 3 · Certificate SHA-256 (for App Links assetlinks.json) ───────────
console.log('');
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│  Extracting SHA-256 for App Links                                   │');
console.log('├─────────────────────────────────────────────────────────────────────┤');
console.log('│  keytool needs your KEYSTORE password one more time to read the     │');
console.log('│  cert fingerprint. Same password you just typed above.              │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log('');

// stdin inherited → owner types password; stdout piped → we capture cert data
const listArgs = ['-list', '-v', '-keystore', OUT, '-alias', ALIAS];
const list = spawnSync(KEYTOOL, listArgs, {
    stdio: ['inherit', 'pipe', 'inherit'],
    encoding: 'utf8',
});

let certSha256 = null;
if (list.status === 0 && list.stdout) {
    // keytool 8+ uses "SHA256:" ; older releases use "SHA-256:". Accept both.
    const m = list.stdout.match(/SHA-?256[:\s]+([0-9A-Fa-f:]{95,})/);
    if (m) certSha256 = m[1].toUpperCase();
}

// ── Step 4 · Inject into assetlinks-*.json ─────────────────────────────────
async function injectSha(path, hash) {
    if (!existsSync(path)) return { path, ok: false, reason: 'file missing' };
    const before = await fs.readFile(path, 'utf8');
    if (!before.includes('REPLACE_WITH_UPLOAD_KEY_SHA256')) {
        return { path, ok: false, reason: 'placeholder already replaced (or file altered)' };
    }
    const after = before.replace(/<?REPLACE_WITH_UPLOAD_KEY_SHA256>?/g, hash);
    await fs.writeFile(path, after, 'utf8');

    // Also emit a header-stripped, valid-JSON companion at .public.json —
    // the .well-known/ file MUST be valid JSON, and stripping the /* ... */
    // header by hand is the exact step owners forget.
    const publicPath = path.replace(/\.json$/, '.public.json');
    const cleaned = after.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
    await fs.writeFile(publicPath, cleaned, 'utf8');

    return { path, publicPath, ok: true };
}

const injected = [];
if (certSha256) {
    for (const p of [LINK_A, LINK_B]) injected.push(await injectSha(p, certSha256));
}

// ── Step 5 · Print the finale ──────────────────────────────────────────────
const stat = await fs.stat(OUT);
console.log('');
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│  DONE                                                               │');
console.log('├─────────────────────────────────────────────────────────────────────┤');
console.log(`│  Keystore:      ${OUT.padEnd(52)}│`);
console.log(`│  Size:          ${(stat.size + ' bytes').padEnd(52)}│`);
console.log(`│  File SHA-256:  ${fileHash.slice(0, 16)}…                                 │`);
if (certSha256) {
    console.log(`│  Cert SHA-256:  ${certSha256.slice(0, 47)}…│`);
    console.log(`│  assetlinks:    ${injected.filter(i => i.ok).length}/2 file(s) auto-updated                        │`);
} else {
    console.log('│  Cert SHA-256:  NOT captured — see manual step below                │');
}
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log('');

if (!certSha256) {
    console.log('SHA-256 auto-extract failed. Run this manually:');
    console.log(`  "${KEYTOOL}" -list -v -keystore "${OUT}" -alias ${ALIAS}`);
    console.log('  → copy the SHA-256 line, replace <REPLACE_WITH_UPLOAD_KEY_SHA256>');
    console.log('    in both store-assets/assetlinks-*.json.');
    console.log('');
}

console.log('NEXT — 4 things:');
console.log('');
console.log('  1. FILL keystore.properties with the passwords you just chose:');
console.log('       cp android/keystore.properties.example android/keystore.properties');
console.log('       # edit android/keystore.properties → storePassword + keyPassword');
console.log('');
console.log('  2. BACK UP the keystore in 3 places, TODAY:');
console.log('       (a) Password manager (1Password / Bitwarden) — attach the .jks file');
console.log('           AND save the passwords in the same entry.');
console.log('       (b) Encrypted USB stick, stored separately from the dev laptop.');
console.log('       (c) Encrypted cloud (e.g. Cryptomator vault on Google Drive).');
console.log('     Integrity file: android/engnova-upload.jks.sha256.txt — use it to');
console.log('     verify backups later (Get-FileHash / sha256sum).');
console.log('');
if (certSha256) {
    console.log('  3. PUBLISH assetlinks.json to both hosts (App Links verification):');
    console.log('     Ready-to-upload files (header stripped, valid JSON):');
    console.log('       · store-assets/assetlinks-cefracademy.public.json');
    console.log('           → cefracademy.uz/.well-known/assetlinks.json');
    console.log('           Fastest path: cp to D:/cefrprep/public/.well-known/assetlinks.json,');
    console.log('           git commit + push (Vercel deploys in ~30 s).');
    console.log('       · store-assets/assetlinks-ieltslevel.public.json');
    console.log('           → ieltslevel.uz/.well-known/assetlinks.json');
    console.log('           Fastest path: cp to D:/ieltslevel/repo/public/.well-known/assetlinks.json,');
    console.log('           git commit + push.');
    console.log('     Verify after each deploys:');
    console.log('       curl -sI https://cefracademy.uz/.well-known/assetlinks.json');
    console.log('       curl -sI https://ieltslevel.uz/.well-known/assetlinks.json');
    console.log('     Both should return HTTP/2 200 + Content-Type: application/json.');
} else {
    console.log('  3. (skipped — resolve SHA-256 manually first, then publish assetlinks.json)');
}
console.log('');
console.log('  4. VERIFY the build path works:');
console.log('       npm run build:aab');
console.log('     → android/app/build/outputs/bundle/release/app-release.aab');
console.log('     Upload that file in Play Console → Testing → Closed testing.');
console.log('');
console.log('Losing the keystore is one of the very few app-store mistakes that has NO');
console.log('recovery path — spend 10 minutes on the backup NOW, thank yourself later.');
