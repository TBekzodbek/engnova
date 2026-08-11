/**
 * authFlow.ts — the "log out" orchestrator.
 *
 * Order matters. We do all three steps even if any single one fails, because
 * a partial logout is worse than a slightly-noisy full one: if we left the
 * Supabase session behind but wiped the hint, bootRoute() would send the
 * user back to LoginScreen and the SDK would silently refresh the ghost
 * session next time signInWithPassword is called.
 *
 * scope='local' on the Supabase signOut is deliberate — we're revoking the
 * device's session only. A user might have Engnova on their phone AND the
 * site open on their laptop; wiping global would kill their desktop
 * session too, which is unfriendly.
 */
import { getSupabase, isTrackConfigured } from './supabaseClients';
import { setAuthHint } from './authState';
import { clearTrackWebViewStorage } from './webview';
import type { Track } from './tracks';

export async function logout(track: Track): Promise<void> {
    // 1. Ask the SDK to invalidate the session on this device.
    //    Wrapped defensively — if the track isn't configured, or the SDK
    //    throws for any reason (offline, revoked already), we still want
    //    steps 2 and 3 to run.
    if (isTrackConfigured(track)) {
        try {
            await getSupabase(track).auth.signOut({ scope: 'local' });
        } catch { /* keep going */ }
    }

    // 2. Flip the boot-hint so cold-start of the app goes to LoginScreen
    //    instead of instant Product open.
    try { await setAuthHint(track, false); } catch { /* keep going */ }

    // 3. Wipe the WebView cookies + Web storage so the next login for a
    //    different user on this device doesn't inherit the previous
    //    session cookies from cefracademy.uz / ieltslevel.uz.
    try { await clearTrackWebViewStorage(); } catch { /* keep going */ }
}
