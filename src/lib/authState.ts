/**
 * authState.ts — persistent boot-hints for the shell.
 *
 * Two decisions we make BEFORE we're willing to instantiate a supabase-js
 * client (which parses ~40 KB of code and touches localStorage):
 *   1. Has the user finished the first-run onboarding? (drives Phase.onboarding)
 *   2. Which tracks are they signed into? (drives Phase.chooser/login/product)
 *
 * Both go through @capacitor/preferences — a thin wrapper over Android's
 * SharedPreferences. Survives cold-starts + reboots + storage-permission
 * changes; does NOT survive uninstall/reinstall (which is what we want —
 * a fresh install should re-onboard).
 *
 * We deliberately DON'T store the auth session itself here — supabase-js
 * owns that (in the WebView's localStorage). Storing a duplicate would race
 * with supabase-js and one would win silently. The hint is a small boolean
 * so bootRoute() can decide "skip login screen" without waiting on the SDK.
 *
 * All setters/getters swallow errors — on the web preview @capacitor/preferences
 * proxies to localStorage which can be disabled in incognito. Missing/broken
 * values return safe defaults (false / not-onboarded).
 */
import { Preferences } from '@capacitor/preferences';
import type { Track } from './tracks';

const HINT_KEY = 'engnova.authHint.v1';
const ONBOARD_KEY = 'engnova.onboardingDone.v1';
const ENGNOVA_AUTH_KEY = 'engnova.selfAuth.v1';

export interface AuthHint {
    cefr:  boolean;
    ielts: boolean;
}

const EMPTY: AuthHint = { cefr: false, ielts: false };

export async function getAuthHint(): Promise<AuthHint> {
    try {
        const { value } = await Preferences.get({ key: HINT_KEY });
        if (!value) return { ...EMPTY };
        const parsed = JSON.parse(value) as Partial<AuthHint>;
        // Coerce back to strict booleans — malformed values (a stray "true"
        // string from an old version, a null from a race) must never leak into
        // the phase machine or the "auto-login" branch fires on a garbage hint.
        return { cefr: !!parsed.cefr, ielts: !!parsed.ielts };
    } catch {
        return { ...EMPTY };
    }
}

export async function setAuthHint(track: Track, loggedIn: boolean): Promise<void> {
    try {
        const current = await getAuthHint();
        const next: AuthHint = { ...current, [track]: loggedIn };
        await Preferences.set({ key: HINT_KEY, value: JSON.stringify(next) });
    } catch {
        /* private mode / no storage — auto-login just won't fire next time */
    }
}

export async function clearAuthHint(): Promise<void> {
    try { await Preferences.remove({ key: HINT_KEY }); } catch { /* ignore */ }
}

// ── First-run onboarding gate ────────────────────────────────────────────────

export async function getOnboardingDone(): Promise<boolean> {
    try {
        const { value } = await Preferences.get({ key: ONBOARD_KEY });
        return value === '1';
    } catch {
        return false;
    }
}

export async function setOnboardingDone(done: boolean): Promise<void> {
    try {
        if (done) await Preferences.set({ key: ONBOARD_KEY, value: '1' });
        else      await Preferences.remove({ key: ONBOARD_KEY });
    } catch { /* ignore */ }
}

// ── Engnova self-auth hint ───────────────────────────────────────────────────
// Separate from the per-track hint above. Tells bootRoute whether the user
// has an active Engnova session so we can skip Welcome → Login on relaunch.
// Set true after successful sign-in / signup; cleared on sign-out.

export async function getEngnovaAuthHint(): Promise<boolean> {
    try {
        const { value } = await Preferences.get({ key: ENGNOVA_AUTH_KEY });
        return value === '1';
    } catch {
        return false;
    }
}

export async function setEngnovaAuthHint(loggedIn: boolean): Promise<void> {
    try {
        if (loggedIn) await Preferences.set({ key: ENGNOVA_AUTH_KEY, value: '1' });
        else          await Preferences.remove({ key: ENGNOVA_AUTH_KEY });
    } catch { /* ignore */ }
}
