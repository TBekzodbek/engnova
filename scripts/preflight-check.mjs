#!/usr/bin/env node
/**
 * preflight-check.mjs
 * ───────────────────
 * Fast regression sweep for the 8 pre-submission audit fixes (+ 2 bonus
 * hygiene checks). Run it before every release build; CI can gate on the
 * non-zero exit.
 *
 *   npm run preflight
 *
 * Each check is a small function returning { ok, detail } so a future
 * hand can add / edit / remove one without spelunking through anything
 * clever. No regex golf, no promise chains — plain sync fs + spawnSync.
 *
 * Runtime target: <1s on a warm disk. All file reads are absolute and
 * fixed; no directory walks.
 */
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

// ─── file paths (all resolved off repo root) ────────────────────────────────
const PATHS = {
    webviewPlugin: resolve(ROOT, 'android-overrides/app/src/main/java/uz/engnova/app/EngnovaWebViewPlugin.java'),
    mainActivity:  resolve(ROOT, 'android-overrides/app/src/main/java/uz/engnova/app/MainActivity.java'),
    manifest:      resolve(ROOT, 'android-overrides/app/src/main/AndroidManifest.xml'),
    tracks:        resolve(ROOT, 'src/lib/tracks.ts'),
    webviewTs:     resolve(ROOT, 'src/lib/webview.ts'),
    capacitorCfg:  resolve(ROOT, 'capacitor.config.ts'),
};

// ─── small helpers ──────────────────────────────────────────────────────────
function readLines(path) {
    return readFileSync(path, 'utf8').split(/\r?\n/);
}
function read(path) {
    return readFileSync(path, 'utf8');
}
function fileLine(path, lineIdx) {
    // lineIdx is 0-based; report as 1-based
    return `${path.replace(ROOT + '\\', '').replace(ROOT + '/', '')}:${lineIdx + 1}`;
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 1 — setWebContentsDebuggingEnabled(true) must be gated
// ══════════════════════════════════════════════════════════════════════════
function check1_debugGated() {
    const label = 'setWebContentsDebuggingEnabled gated (not leaked in release)';
    const files = [PATHS.webviewPlugin, PATHS.mainActivity].filter(existsSync);
    const pattern = /setWebContentsDebuggingEnabled\s*\(\s*true\s*\)/;

    for (const file of files) {
        const lines = readLines(file);
        for (let i = 0; i < lines.length; i++) {
            if (!pattern.test(lines[i])) continue;
            const sameLine = lines[i];
            const prevLine = i > 0 ? lines[i - 1] : '';
            const nearby = sameLine + '\n' + prevLine;
            const gated = /\bif\b/.test(nearby) || /FLAG_DEBUGGABLE/.test(nearby);
            if (!gated) {
                return {
                    ok: false,
                    detail: `${fileLine(file, i)} — setWebContentsDebuggingEnabled(true) is UNGATED (no "if" or FLAG_DEBUGGABLE on this line or the one above). Release AAB would leak DevTools.`,
                };
            }
        }
    }
    return { ok: true, detail: 'GATED via ApplicationInfo.FLAG_DEBUGGABLE' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 2 — shouldOverrideUrlLoading must dispatch on scheme BEFORE host
// ══════════════════════════════════════════════════════════════════════════
function check2_schemeBeforeHost() {
    const label = 'shouldOverrideUrlLoading scheme-first ordering';
    if (!existsSync(PATHS.webviewPlugin)) {
        return { ok: false, detail: `missing ${PATHS.webviewPlugin}` };
    }
    const lines = readLines(PATHS.webviewPlugin);

    // Find the method signature line, then find matching brace for its body.
    const sigIdx = lines.findIndex((l) => /shouldOverrideUrlLoading\s*\(/.test(l));
    if (sigIdx < 0) {
        return { ok: false, detail: 'shouldOverrideUrlLoading method not found' };
    }
    // Body starts at the first "{" on or after sigIdx.
    let bodyStart = sigIdx;
    while (bodyStart < lines.length && !lines[bodyStart].includes('{')) bodyStart++;
    // Body ends at matching close brace — walk depth from bodyStart.
    let depth = 0;
    let bodyEnd = bodyStart;
    for (let i = bodyStart; i < lines.length; i++) {
        for (const ch of lines[i]) {
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) { bodyEnd = i; break; }
            }
        }
        if (depth === 0 && i > bodyStart) { bodyEnd = i; break; }
    }

    let schemeIdx = -1;
    let hostNullIdx = -1;
    for (let i = bodyStart; i <= bodyEnd; i++) {
        if (schemeIdx < 0 && lines[i].includes('getScheme()')) schemeIdx = i;
        if (hostNullIdx < 0 && /if\s*\(\s*host\s*==\s*null\s*\)/.test(lines[i])) hostNullIdx = i;
    }

    if (schemeIdx < 0) {
        return { ok: false, detail: 'getScheme() call not found in shouldOverrideUrlLoading body' };
    }
    if (hostNullIdx < 0) {
        return { ok: false, detail: '"if (host == null)" guard not found in shouldOverrideUrlLoading body' };
    }
    if (schemeIdx >= hostNullIdx) {
        return {
            ok: false,
            detail: `scheme dispatch (${fileLine(PATHS.webviewPlugin, schemeIdx)}) is NOT before host==null guard (${fileLine(PATHS.webviewPlugin, hostNullIdx)}); tel:/mailto:/sms:/intent: URIs will die`,
        };
    }
    return { ok: true, detail: `scheme@L${schemeIdx + 1} precedes host==null@L${hostNullIdx + 1}` };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 3 — paymentPatterns field on TrackDef + non-empty in both TRACKS
// ══════════════════════════════════════════════════════════════════════════
function check3_paymentPatterns() {
    if (!existsSync(PATHS.tracks)) return { ok: false, detail: `missing ${PATHS.tracks}` };
    const src = read(PATHS.tracks);

    // Field declaration on the interface
    if (!/paymentPatterns\s*:\s*string\[\]/.test(src)) {
        return { ok: false, detail: 'TrackDef.paymentPatterns: string[] field not declared in src/lib/tracks.ts' };
    }

    // Both TRACKS entries: pull each object block and check paymentPatterns array is non-empty.
    // Cheap parse: find "cefr: {" and "ielts: {", read the object literal by brace-balance,
    // then extract the paymentPatterns array.
    for (const key of ['cefr', 'ielts']) {
        const keyRe = new RegExp(`\\b${key}\\s*:\\s*\\{`);
        const m = keyRe.exec(src);
        if (!m) return { ok: false, detail: `TRACKS.${key} object not found` };
        // Walk braces from m.index + m[0].length - 1 (points at the "{")
        let i = m.index + m[0].length - 1;
        let depth = 0;
        let end = -1;
        for (; i < src.length; i++) {
            const ch = src[i];
            if (ch === '{') depth++;
            else if (ch === '}') {
                depth--;
                if (depth === 0) { end = i; break; }
            }
        }
        if (end < 0) return { ok: false, detail: `TRACKS.${key} object literal not closed?` };
        const block = src.slice(m.index, end + 1);
        const ppMatch = /paymentPatterns\s*:\s*\[([\s\S]*?)\]/.exec(block);
        if (!ppMatch) {
            return { ok: false, detail: `TRACKS.${key}.paymentPatterns array is missing` };
        }
        const inner = ppMatch[1].trim();
        // Non-empty means at least one string literal
        if (!/['"`]/.test(inner)) {
            return { ok: false, detail: `TRACKS.${key}.paymentPatterns is empty — /pricing bounce disabled for this track` };
        }
    }
    return { ok: true, detail: 'paymentPatterns declared + populated for cefr & ielts' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 4 — blockedPatterns must not exist (was replaced by paymentPatterns)
// ══════════════════════════════════════════════════════════════════════════
function check4_noBlockedPatterns() {
    // Search src/**/*.ts and android-overrides/**/*.java for "blockedPatterns".
    // Do the file listing via git ls-files (fast + respects .gitignore).
    const git = spawnSync('git', ['ls-files', 'src', 'android-overrides'], {
        cwd: ROOT,
        encoding: 'utf8',
    });
    if (git.status !== 0) {
        return { ok: false, detail: `git ls-files failed: ${git.stderr?.trim() || 'unknown error'}` };
    }
    const files = git.stdout.split(/\r?\n/).filter((f) => /\.(ts|tsx|java)$/i.test(f));
    const hits = [];
    for (const rel of files) {
        const abs = resolve(ROOT, rel);
        if (!existsSync(abs)) continue;
        const lines = readLines(abs);
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('blockedPatterns')) {
                hits.push(`${rel}:${i + 1}`);
            }
        }
    }
    if (hits.length > 0) {
        return {
            ok: false,
            detail: `"blockedPatterns" resurfaced (was renamed to paymentPatterns): ${hits.join(', ')}`,
        };
    }
    return { ok: true, detail: 'no "blockedPatterns" in src/ or android-overrides/' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 5 — allowBackup=false + dataExtractionRules present in manifest
// ══════════════════════════════════════════════════════════════════════════
function check5_manifestBackupPosture() {
    if (!existsSync(PATHS.manifest)) return { ok: false, detail: `missing ${PATHS.manifest}` };
    const src = read(PATHS.manifest);

    const hasAllowBackupFalse = /android:allowBackup\s*=\s*"false"/.test(src);
    const hasDataExtractRules = /android:dataExtractionRules\s*=\s*"@xml\/data_extraction_rules"/.test(src);

    if (!hasAllowBackupFalse && !hasDataExtractRules) {
        return { ok: false, detail: 'AndroidManifest.xml missing BOTH allowBackup="false" AND dataExtractionRules — auth tokens can be Auto-Backed to Drive' };
    }
    if (!hasAllowBackupFalse) {
        return { ok: false, detail: 'AndroidManifest.xml missing android:allowBackup="false"' };
    }
    if (!hasDataExtractRules) {
        return { ok: false, detail: 'AndroidManifest.xml missing android:dataExtractionRules="@xml/data_extraction_rules" — Android 12+ D2D transfer uncovered' };
    }
    return { ok: true, detail: 'allowBackup="false" + dataExtractionRules both set' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 6 — only INTERNET + RECORD_AUDIO permitted; 4 dead perms banned
// ══════════════════════════════════════════════════════════════════════════
function check6_permissionsClean() {
    if (!existsSync(PATHS.manifest)) return { ok: false, detail: `missing ${PATHS.manifest}` };
    const lines = readLines(PATHS.manifest);
    const forbidden = [
        'MODIFY_AUDIO_SETTINGS',
        'ACCESS_NETWORK_STATE',
        'POST_NOTIFICATIONS',
        'VIBRATE',
    ];
    const hits = [];
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // Look at uses-permission declarations only (guarded).
        if (!/<uses-permission\b/.test(l)) continue;
        for (const bad of forbidden) {
            if (l.includes(bad)) hits.push(`${bad} @ ${fileLine(PATHS.manifest, i)}`);
        }
    }
    if (hits.length > 0) {
        return {
            ok: false,
            detail: `dead permission(s) re-added — remove or wire the plugin that needs it in the SAME commit: ${hits.join('; ')}`,
        };
    }
    return { ok: true, detail: 'only INTERNET + RECORD_AUDIO declared' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 7 — parseHosts(call) inside runOnUiThread for open() + loadBootstrapHtml()
// ══════════════════════════════════════════════════════════════════════════
function check7_parseHostsUiThread() {
    if (!existsSync(PATHS.webviewPlugin)) return { ok: false, detail: `missing ${PATHS.webviewPlugin}` };
    const src = read(PATHS.webviewPlugin);
    const lines = src.split(/\r?\n/);

    // Find both method bodies by name; each begins at the annotation line
    // above the method signature and ends at the balanced close brace.
    function bodyRangeFor(methodName) {
        const sigIdx = lines.findIndex((l) => l.includes(`void ${methodName}(`));
        if (sigIdx < 0) return null;
        let bodyStart = sigIdx;
        while (bodyStart < lines.length && !lines[bodyStart].includes('{')) bodyStart++;
        let depth = 0;
        let bodyEnd = bodyStart;
        for (let i = bodyStart; i < lines.length; i++) {
            for (const ch of lines[i]) {
                if (ch === '{') depth++;
                else if (ch === '}') {
                    depth--;
                    if (depth === 0) { bodyEnd = i; break; }
                }
            }
            if (depth === 0 && i > bodyStart) { bodyEnd = i; break; }
        }
        return [bodyStart, bodyEnd];
    }

    for (const method of ['open', 'loadBootstrapHtml']) {
        const range = bodyRangeFor(method);
        if (!range) return { ok: false, detail: `method ${method}() not found in EngnovaWebViewPlugin.java` };
        const [start, end] = range;
        let runIdx = -1;
        let parseIdx = -1;
        for (let i = start; i <= end; i++) {
            if (runIdx < 0 && /runOnUiThread\s*\(\s*\(\s*\)\s*->/.test(lines[i])) runIdx = i;
            if (parseIdx < 0 && /parseHosts\s*\(\s*call\s*\)/.test(lines[i])) parseIdx = i;
        }
        if (runIdx < 0) return { ok: false, detail: `${method}(): runOnUiThread lambda not found` };
        if (parseIdx < 0) return { ok: false, detail: `${method}(): parseHosts(call) call not found` };
        if (parseIdx <= runIdx) {
            return {
                ok: false,
                detail: `${method}(): parseHosts(call) at L${parseIdx + 1} runs BEFORE runOnUiThread at L${runIdx + 1} — first shouldOverrideUrlLoading callback can see an empty allowlist`,
            };
        }
    }
    return { ok: true, detail: 'parseHosts(call) inside runOnUiThread for open() + loadBootstrapHtml()' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 8 — refreshedTokens: "return null;" inside near-expiry branch
// ══════════════════════════════════════════════════════════════════════════
function check8_refreshedTokensReturnNull() {
    if (!existsSync(PATHS.webviewTs)) return { ok: false, detail: `missing ${PATHS.webviewTs}` };
    const src = read(PATHS.webviewTs);

    // Locate the "expires_at" near-expiry sentinel — the "< 60_000" (or
    // "< 60000") threshold check. Regex would need nested-paren awareness
    // to match the whole if-condition (Date.now() has parens), so instead
    // find the sentinel substring and walk forward to the next "{" to find
    // the block body, then brace-balance.
    const sentinelIdx = (() => {
        const withUnderscore = src.indexOf('< 60_000');
        if (withUnderscore >= 0) return withUnderscore;
        return src.indexOf('< 60000');
    })();
    if (sentinelIdx < 0) {
        return {
            ok: false,
            detail: 'near-expiry threshold (< 60_000) not found in src/lib/webview.ts',
        };
    }
    // Confirm we're inside the intended if-condition — the same statement
    // must mention expires_at (otherwise we've hit an unrelated < 60_000).
    const contextBefore = src.slice(Math.max(0, sentinelIdx - 200), sentinelIdx);
    if (!contextBefore.includes('expires_at')) {
        return {
            ok: false,
            detail: 'sentinel "< 60_000" found but not tied to expires_at check — the branch shape has changed',
        };
    }
    // Walk to the next "{" after the sentinel — that's the block open.
    let start = src.indexOf('{', sentinelIdx);
    if (start < 0) return { ok: false, detail: 'near-expiry if-block "{" not found after sentinel' };
    let depth = 0;
    let end = -1;
    for (let i = start; i < src.length; i++) {
        const ch = src[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) { end = i; break; }
        }
    }
    if (end < 0) return { ok: false, detail: 'near-expiry if-block braces not balanced' };
    const block = src.slice(start, end + 1);

    if (!/return\s+null\s*;/.test(block)) {
        return {
            ok: false,
            detail: 'near-expiry branch does NOT return null on refresh failure — will fall through to return the stale/expired token and hand the webview a soon-to-401 session',
        };
    }
    return { ok: true, detail: 'refreshedTokens returns null on refresh failure inside near-expiry branch' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 9 — keystore.properties / *.jks must NOT be committed
// ══════════════════════════════════════════════════════════════════════════
function check9_noKeystoreCommitted() {
    const git = spawnSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' });
    if (git.status !== 0) {
        return { ok: false, detail: `git ls-files failed: ${git.stderr?.trim() || 'unknown error'}` };
    }
    const files = git.stdout.split(/\r?\n/);
    const bad = files.filter((f) => {
        if (!f) return false;
        if (f.endsWith('keystore.properties.example')) return false;   // template is fine
        if (f.endsWith('keystore.properties')) return true;
        if (/\.jks$/i.test(f)) return true;
        return false;
    });
    if (bad.length > 0) {
        return {
            ok: false,
            detail: `signing artefact(s) committed to git — REMOVE + rotate the key: ${bad.join(', ')}`,
        };
    }
    return { ok: true, detail: 'no keystore.properties or *.jks in git' };
}

// ══════════════════════════════════════════════════════════════════════════
// CHECK 10 — capacitor.config.ts must not set server.url (breaks offline)
// ══════════════════════════════════════════════════════════════════════════
function check10_noServerUrl() {
    if (!existsSync(PATHS.capacitorCfg)) return { ok: false, detail: `missing ${PATHS.capacitorCfg}` };
    const lines = readLines(PATHS.capacitorCfg);
    for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        // strip a "//" line comment before matching so the "no server.url" comment doesn't false-fire
        const code = l.replace(/\/\/.*$/, '');
        if (/\bserver\s*:/.test(code)) {
            // A `server: { url: ... }` block would hit here — good enough for our fixed config file.
            // If found, warn — the check is really about server.url specifically.
            // Walk a few lines ahead for a "url:" key.
            const window = lines.slice(i, i + 8).map((x) => x.replace(/\/\/.*$/, '')).join(' ');
            if (/\burl\s*:\s*['"`]/.test(window)) {
                return {
                    ok: false,
                    detail: `${fileLine(PATHS.capacitorCfg, i)} — capacitor.config.ts has server.url set; app would depend on the URL being reachable (breaks offline + Play review)`,
                };
            }
        }
    }
    return { ok: true, detail: 'no server.url set (app bundles the shell)' };
}

// ══════════════════════════════════════════════════════════════════════════
// Runner
// ══════════════════════════════════════════════════════════════════════════
const CHECKS = [
    { title: 'setWebContentsDebuggingEnabled gated (release DevTools closed)', fn: check1_debugGated },
    { title: 'shouldOverrideUrlLoading scheme-first ordering',                fn: check2_schemeBeforeHost },
    { title: 'paymentPatterns on TrackDef + populated for both tracks',        fn: check3_paymentPatterns },
    { title: 'no "blockedPatterns" resurfaced in src/ or android-overrides/',  fn: check4_noBlockedPatterns },
    { title: 'AndroidManifest: allowBackup=false + dataExtractionRules set',   fn: check5_manifestBackupPosture },
    { title: 'AndroidManifest: 4 dead permissions stay removed',               fn: check6_permissionsClean },
    { title: 'parseHosts(call) runs inside runOnUiThread (thread-safety)',     fn: check7_parseHostsUiThread },
    { title: 'refreshedTokens returns null on refresh failure',                fn: check8_refreshedTokensReturnNull },
    { title: 'no keystore.properties or *.jks committed to git',               fn: check9_noKeystoreCommitted },
    { title: 'capacitor.config.ts has no server.url (offline-safe)',           fn: check10_noServerUrl },
];

function run() {
    const t0 = Date.now();
    const results = [];
    for (const c of CHECKS) {
        let r;
        try {
            r = c.fn();
        } catch (e) {
            r = { ok: false, detail: `check threw: ${e && e.message ? e.message : String(e)}` };
        }
        results.push({ ...c, ...r });
    }

    const total = results.length;
    const passed = results.filter((r) => r.ok).length;

    // Padded, aligned output
    const widest = Math.max(...results.map((r) => r.title.length));
    for (let i = 0; i < results.length; i++) {
        const r = results[i];
        const idx = `[${String(i + 1).padStart(2, ' ')}/${total}]`;
        const title = r.title.padEnd(widest, ' ');
        const status = r.ok ? '✓ PASS' : '✗ FAIL';
        // eslint-disable-next-line no-console
        console.log(`${idx} ${title}   ${status}`);
        if (!r.ok) {
            // eslint-disable-next-line no-console
            console.log(`         ${r.detail}`);
        }
    }

    const ms = Date.now() - t0;
    // eslint-disable-next-line no-console
    console.log('');
    // eslint-disable-next-line no-console
    console.log(`Summary: ${passed}/${total} PASS  (${ms}ms)`);
    process.exit(passed === total ? 0 : 1);
}

run();
