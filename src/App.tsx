/**
 * Engnova shell — top-level phase machine.
 *
 *   Phase =
 *     'booting'     bootRoute() is still resolving — SplashCover masks this
 *     'chooser'     user hasn't picked a track (or tapped Switch)
 *     'login'       track picked, no valid session — show LoginScreen
 *     'product'     valid session — hand off to the track's webview
 *
 * bootRoute() is a fast, network-free decision:
 *   1. Read persisted track (localStorage).                  no track → chooser
 *   2. If configured, ask the SDK for the in-memory session. no sess  → login
 *   3. Session present.                                              → product
 *
 * We DON'T call the network here (getSession() is a memory read; the SDK's
 * autoRefreshToken handles token refresh in the background). This keeps the
 * splash → first-frame gap under ~50 ms for returning users.
 *
 * Auto-login logic is deliberately conservative: the auth-hint is a boolean
 * that says "we succeeded a sign-in on this device once" — but the SOURCE OF
 * TRUTH is what the SDK has in its in-memory session (which is hydrated from
 * localStorage on module load). If the hint says "yes" but the SDK has no
 * session (localStorage wiped by the user in Settings → Clear data), we
 * fall back to login.
 */
import { useEffect, useState } from 'react';
import { getSavedTrack, saveTrack, clearTrack, type Track } from './lib/tracks';
import { getSupabase, isTrackConfigured } from './lib/supabaseClients';
import { getAuthHint, setAuthHint } from './lib/authState';
import { logout as authLogout } from './lib/authFlow';
import ChooserScreen from './screens/ChooserScreen';
import LoginScreen from './screens/LoginScreen';
import ProductScreen from './products/ProductScreen';
import SplashCover from './components/SplashCover';

type Phase =
    | { kind: 'booting' }
    | { kind: 'chooser' }
    | { kind: 'login';   track: Track }
    | { kind: 'product'; track: Track };

/**
 * Compute the initial phase. Fast path: known track + known-good session.
 * Any error → login (safest fallback — user proves they're still real).
 */
async function bootRoute(): Promise<Phase> {
    const track = getSavedTrack();
    if (!track) return { kind: 'chooser' };

    // Track picked but its Supabase creds aren't set (IELTS placeholder in dev):
    // show the login screen so the user sees the "coming soon" state, not a
    // broken auto-login attempt.
    if (!isTrackConfigured(track)) return { kind: 'login', track };

    const hint = await getAuthHint();
    if (!hint[track]) return { kind: 'login', track };

    // Confirm the SDK actually has a live session. Uses in-memory + local
    // storage — no network. Rare failure modes (SDK constructor throws,
    // localStorage disabled): fall through to login.
    try {
        const client = getSupabase(track);
        const { data } = await client.auth.getSession();
        if (data.session) return { kind: 'product', track };
        // Hint said yes, SDK says no — clear the hint so we don't flip-flop.
        await setAuthHint(track, false);
        return { kind: 'login', track };
    } catch {
        return { kind: 'login', track };
    }
}

export default function App() {
    const [phase, setPhase] = useState<Phase>({ kind: 'booting' });

    // Boot on mount. The SplashCover renders until this resolves so users
    // never see the wrong intermediate frame.
    useEffect(() => {
        let cancelled = false;
        bootRoute().then((p) => { if (!cancelled) setPhase(p); });
        return () => { cancelled = true; };
    }, []);

    const choose = (t: Track) => { saveTrack(t); setPhase({ kind: 'login', track: t }); };

    const back = () => { clearTrack(); setPhase({ kind: 'chooser' }); };

    const loginSuccess = (t: Track) => setPhase({ kind: 'product', track: t });

    const handleLogout = async (t: Track) => {
        // Set booting first so the UI doesn't render the "logged in" product
        // screen while the async logout is unwinding — flicker-free transition.
        setPhase({ kind: 'booting' });
        await authLogout(t);
        setPhase({ kind: 'login', track: t });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    if (phase.kind === 'booting') return <SplashCover />;

    if (phase.kind === 'chooser') return <ChooserScreen onChoose={choose} />;

    if (phase.kind === 'login') {
        return (
            <LoginScreen
                track={phase.track}
                onSuccess={() => loginSuccess(phase.track)}
                onBack={back}
            />
        );
    }

    // product
    return (
        <ProductScreen
            track={phase.track}
            onSwitchTrack={back}
            onLogout={() => handleLogout(phase.track)}
        />
    );
}
