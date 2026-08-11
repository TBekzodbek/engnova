/**
 * supabaseClients.ts — one client per track, instantiated lazily.
 *
 * We keep the two products' clients SEPARATE because:
 *   - Each project has its own users, tables, RLS, service-role key.
 *   - Supabase-js's default storageKey `sb-<project-ref>-auth-token`
 *     already namespaces per project, so a CEFR session and an IELTS
 *     session coexist in localStorage without collision. NEVER override
 *     `storageKey` — doing so would silently make the two tracks share
 *     the same auth blob and one would clobber the other on sign-in.
 *   - Lazy instantiation means we don't pay the ~40 KB supabase-js parse
 *     cost for the OTHER track the user never picked.
 *
 * flowType 'pkce' is the modern default for password + magic-link auth and
 * plays cleanly with future deep-link OAuth (v2). detectSessionInUrl is off
 * because the shell isn't handling OAuth callbacks in-app — payment and
 * signup redirects are handled by Custom Tabs on the site itself.
 *
 * When IELTS_SUPABASE_ANON_KEY is the placeholder `REPLACE_ME` the IELTS
 * client throws on getSupabase('ielts') so the UI can render a friendly
 * "IELTS login coming soon" state instead of blowing up mid-render.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Track } from './tracks';

const ENV = {
    cefr: {
        url: import.meta.env.VITE_CEFR_SUPABASE_URL as string | undefined,
        key: import.meta.env.VITE_CEFR_SUPABASE_ANON_KEY as string | undefined,
    },
    ielts: {
        url: import.meta.env.VITE_IELTS_SUPABASE_URL as string | undefined,
        key: import.meta.env.VITE_IELTS_SUPABASE_ANON_KEY as string | undefined,
    },
} satisfies Record<Track, { url?: string; key?: string }>;

const cache: Partial<Record<Track, SupabaseClient>> = {};

/** True when the track's Supabase credentials are real (not the placeholder). */
export function isTrackConfigured(track: Track): boolean {
    const { url, key } = ENV[track];
    return !!url && !!key && key !== 'REPLACE_ME' && !url.includes('REPLACE');
}

export class TrackNotConfiguredError extends Error {
    constructor(track: Track) {
        super(`Supabase for track "${track}" is not configured (VITE_${track.toUpperCase()}_SUPABASE_ANON_KEY missing or placeholder).`);
        this.name = 'TrackNotConfiguredError';
    }
}

export function getSupabase(track: Track): SupabaseClient {
    const cached = cache[track];
    if (cached) return cached;
    if (!isTrackConfigured(track)) throw new TrackNotConfiguredError(track);
    const { url, key } = ENV[track];
    const client = createClient(url!, key!, {
        auth: {
            persistSession:      true,
            autoRefreshToken:    true,
            // Shell never handles OAuth callbacks in-app (v1). When we ship
            // deep-link OAuth (v2), flip this on for the callback route only.
            detectSessionInUrl:  false,
            flowType:            'pkce',
            // No storageKey override — supabase-js auto-namespaces per project ref.
        },
    });
    cache[track] = client;
    return client;
}
