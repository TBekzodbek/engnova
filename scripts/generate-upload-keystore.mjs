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
 *  Losing this file OR forgetting its passwords = you can NEVER update the
 *  app on Play again (the upload key IS the app's identity — Google verifies
 *  every uploaded AAB against it). See the checklist printed at the end.
 *
 *  Usage:   npm run keystore:generate
 *    or:    node scripts/generate-upload-keystore.mjs
 */
import { spawnSync } from 'node:child_process';
import { promises as fs, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { platform } from 'node:os';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const ANDROID = join(ROOT, 'android');
const OUT = join(ANDROID, 'engnova-upload.jks');
const ALIAS = 'engnova-upload';

// ── 1. Sanity: android/ must exist ──────────────────────────────────────
if (!existsSync(ANDROID)) {
    console.error('android/ does not exist. Run `npx cap add android` first.');
    process.exit(1);
}

// ── 2. Never overwrite an existing keystore. That's an app-identity change
//      — if you truly need to rotate, delete the file by hand first.
if (existsSync(OUT)) {
    console.error(`Refusing to overwrite existing keystore:\n  ${OUT}`);
    console.error('\nIf you REALLY want to regenerate (WARNING: this changes the app identity,');
    console.error('meaning any AAB you already uploaded to Play cannot be updated by future');
    console.error('builds signed with the new key), delete it manually and re-run.');
    process.exit(1);
}

// ── 3. Locate keytool. Prefer JAVA_HOME (JDK 21 install), then PATH ─────
function locateKeytool() {
    const exe = platform() === 'win32' ? 'keytool.exe' : 'keytool';
    if (process.env.JAVA_HOME) {
        const candidate = join(process.env.JAVA_HOME, 'bin', exe);
        if (existsSync(candidate)) return candidate;
    }
    // Fall back to PATH — keytool is usually on it once a JDK is installed
    return exe;
}
const KEYTOOL = locateKeytool();

console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│  Engnova · upload keystore setup                                    │');
console.log('├─────────────────────────────────────────────────────────────────────┤');
console.log('│  keytool will now prompt you for:                                   │');
console.log('│    1. Keystore password (choose a STRONG password, min 6 chars)     │');
console.log('│    2. Certificate identity — Name, Org, City, Country               │');
console.log('│       (any real-ish values are fine; Play does not verify them)     │');
console.log('│    3. Confirm identity                                              │');
console.log('│    4. Key password — PRESS ENTER to reuse the keystore password     │');
console.log('│                                                                     │');
console.log('│  WRITE YOUR PASSWORDS DOWN BEFORE YOU TYPE THEM.                    │');
console.log('│  Losing them = never being able to update the app on Play.         │');
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log('');

// ── 4. Run keytool with inherited stdio. Node sees no passwords. ────────
const args = [
    '-genkeypair',
    '-v',
    '-keystore', OUT,
    '-alias', ALIAS,
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10000',
];

const result = spawnSync(KEYTOOL, args, { stdio: 'inherit' });

if (result.error) {
    console.error(`\nFailed to run keytool at "${KEYTOOL}".`);
    if (result.error.code === 'ENOENT') {
        console.error('keytool not found. Make sure JAVA_HOME points at your JDK 21 install, e.g.:');
        console.error('  set JAVA_HOME=C:\\Program Files\\Java\\jdk-21');
    } else {
        console.error(result.error.message);
    }
    process.exit(1);
}
if (result.status !== 0) {
    console.error(`\nkeytool exited with status ${result.status}. Keystore not created.`);
    process.exit(result.status ?? 1);
}

// ── 5. Sanity: it wrote the file ────────────────────────────────────────
if (!existsSync(OUT)) {
    console.error(`\nkeytool reported success but no file at ${OUT}. Aborting.`);
    process.exit(1);
}
const stat = await fs.stat(OUT);

console.log('');
console.log('┌─────────────────────────────────────────────────────────────────────┐');
console.log('│  Keystore created                                                   │');
console.log('├─────────────────────────────────────────────────────────────────────┤');
console.log(`│  Path:  ${OUT.padEnd(60)}│`);
console.log(`│  Alias: ${ALIAS.padEnd(60)}│`);
console.log(`│  Size:  ${(stat.size + ' bytes').padEnd(60)}│`);
console.log('└─────────────────────────────────────────────────────────────────────┘');
console.log('');
console.log('NEXT — 3 things, in order:');
console.log('');
console.log('  1. COPY the template into place:');
console.log('       cp android/keystore.properties.example android/keystore.properties');
console.log('     Then fill in storePassword + keyPassword with what you just typed.');
console.log('     (keyAlias + storeFile already match the defaults.)');
console.log('');
console.log('  2. BACK UP the keystore file in 3 places — TODAY:');
console.log(`       · Password manager attachment (recommended: 1Password / Bitwarden)`);
console.log(`       · Encrypted USB stick, stored separately from your dev laptop`);
console.log(`       · Encrypted cloud backup (e.g. Cryptomator on Google Drive)`);
console.log('     Also write the passwords into your password manager.');
console.log('');
console.log('  3. VERIFY the build path works:');
console.log('       npm run build:aab');
console.log('     The output AAB lives at:');
console.log('       android/app/build/outputs/bundle/release/app-release.aab');
console.log('     That is the file you upload to Play Console.');
console.log('');
console.log('Once done, add the release setup date to your notes. Losing the keystore');
console.log('is one of the very few app-store mistakes that has no recovery path.');
