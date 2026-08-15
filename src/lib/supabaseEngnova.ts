/**
 * supabaseEngnova.ts — the Engnova app's OWN Supabase auth backend.
 *
 * SEPARATE from getSupabase('cefr') / getSupabase('ielts'). Engnova users
 * exist only in this project — cefracademy / ieltslevel accounts CANNOT sign
 * in here. This is the architectural decision the owner made 2026-08-13:
 * Engnova is a distinct product, not a viewer for the two sites.
 *
 * The two per-track clients in supabaseClients.ts remain in the codebase for
 * WebView content flows (if we ever open cefracademy / ielts content inside
 * the app), but they no longer drive shell auth.
 *
 * PKCE flow; sessions persist via localStorage (supabase-js default). We do
 * NOT override storageKey — supabase-js auto-namespaces per project ref, so
 * the engnova session cannot collide with any cefracademy / ielts session
 * that might also be present in the same WebView.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = (import.meta.env.VITE_ENGNOVA_SUPABASE_URL      as string | undefined) ?? '';
const KEY = (import.meta.env.VITE_ENGNOVA_SUPABASE_ANON_KEY as string | undefined) ?? '';

let cache: SupabaseClient | null = null;

/**
 * True when the Engnova Supabase creds are real (not the REPLACE_ME placeholder).
 * The login screen renders a "not-yet-configured" state when this is false so we
 * never blow up mid-render on a dev build without env vars.
 */
export function isEngnovaConfigured(): boolean {
    return !!URL && !!KEY && KEY !== 'REPLACE_ME' && !URL.includes('REPLACE');
}

export class EngnovaNotConfiguredError extends Error {
    constructor() {
        super('Engnova Supabase is not configured. Set VITE_ENGNOVA_SUPABASE_URL + VITE_ENGNOVA_SUPABASE_ANON_KEY in .env.local.');
        this.name = 'EngnovaNotConfiguredError';
    }
}

export function getEngnovaSupabase(): SupabaseClient {
    if (cache) return cache;
    if (!isEngnovaConfigured()) throw new EngnovaNotConfiguredError();
    cache = createClient(URL, KEY, {
        auth: {
            persistSession:     true,
            autoRefreshToken:   true,
            // Shell doesn't handle OAuth callback URLs in-app; Google flows
            // through @capgo/capacitor-social-login and returns an idToken
            // we hand to signInWithIdToken(). Telegram flows through a deep
            // link handled by the plugin.
            detectSessionInUrl: false,
            flowType:           'pkce',
        },
    });
    return cache;
}
