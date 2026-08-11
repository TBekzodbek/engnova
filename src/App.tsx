/**
 * Engnova shell — top-level phase machine.
 *
 *   Phase =
 *     'booting'       bootRoute() resolving — SplashCover masks this
 *     'onboarding'    first-run, no saved track — 3-slide intro
 *     'chooser'       user hasn't picked a track (or tapped Switch)
 *     'login'         track picked, no valid session
 *     'product'       valid session — webview open with auth handoff
 *
 * bootRoute() is a fast, network-free decision:
 *   1. If a track is saved → skip onboarding (returning user, they've seen it).
 *   2. If NO saved track AND onboarding-done pref not set → onboarding.
 *   3. If NO saved track AND pref set → chooser.
 *   4. Saved track:
 *        - not configured (IELTS placeholder) → login (renders coming-soon state)
 *        - hint says logged in AND SDK has in-memory session → product
 *        - anything else → login
 *
 * Web-logout sync: the plugin fires 'webLogoutDetected' when the webview
 * navigates to the site's /login page (user clicked Log out on the site).
 * We correlate with current phase — only trigger native logout if we're
 * actually in Product; a stray /login visit before login shouldn't do
 * anything.
 */
import { useEffect, useRef, useState } from 'react';
import { getSavedTrack, saveTrack, clearTrack, type Track } from './lib/tracks';
import { getSupabase, isTrackConfigured } from './lib/supabaseClients';
import { getAuthHint, getOnboardingDone, setAuthHint } from './lib/authState';
import { logout as authLogout } from './lib/authFlow';
import { onWebLogoutDetected } from './lib/webview';
import ChooserScreen from './screens/ChooserScreen';
import LoginScreen from './screens/LoginScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import ProductScreen from './products/ProductScreen';
import SplashCover from './components/SplashCover';

type Phase =
    | { kind: 'booting' }
    | { kind: 'onboarding' }
    | { kind: 'chooser' }
    | { kind: 'login';   track: Track }
    | { kind: 'product'; track: Track };

/**
 * Fast path: known track + known-good session → product.
 * Any error → login (safest — user proves they're still real).
 */
async function bootRoute(): Promise<Phase> {
    const track = getSavedTrack();

    // First-time users see onboarding before the chooser. Returning users
    // (saved track present) skip straight through.
    if (!track) {
        const done = await getOnboardingDone();
        return { kind: done ? 'chooser' : 'onboarding' };
    }

    // Track picked but its Supabase creds aren't set (IELTS placeholder in dev):
    // show the login screen so the user sees the "coming soon" state, not a
    // broken auto-login attempt.
    if (!isTrackConfigured(track)) return { kind: 'login', track };

    const hint = await getAuthHint();
    if (!hint[track]) return { kind: 'login', track };

    // Confirm the SDK actually has a live session. In-memory + local storage
    // read — no network. Rare failure modes fall through to login.
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
    // Kept in sync so the web-logout listener (registered once on mount) always
    // reads the CURRENT phase, not the one captured at listener-register time.
    const phaseRef = useRef(phase);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // Boot on mount. The SplashCover renders until this resolves so users
    // never see the wrong intermediate frame.
    useEffect(() => {
        let cancelled = false;
        bootRoute().then((p) => { if (!cancelled) setPhase(p); });
        return () => { cancelled = true; };
    }, []);

    // Web-side logout detection. When the WebView navigates to the site's
    // /login (user clicked Log out inside the webview), sync the native side.
    // Registered ONCE on mount; unsubscribes on unmount.
    useEffect(() => {
        let cleanup: (() => void) | null = null;
        onWebLogoutDetected(() => {
            const cur = phaseRef.current;
            if (cur.kind !== 'product') return;      // stray /login navigation before login — ignore
            // Match the shape of handleLogout below so the two paths behave identically.
            const track = cur.track;
            setPhase({ kind: 'booting' });
            void (async () => {
                await authLogout(track);
                setPhase({ kind: 'login', track });
            })();
        }).then((c) => { cleanup = c; });
        return () => { cleanup?.(); };
    }, []);

    const finishOnboarding = () => setPhase({ kind: 'chooser' });

    const choose = (t: Track) => { saveTrack(t); setPhase({ kind: 'login', track: t }); };

    const back = () => { clearTrack(); setPhase({ kind: 'chooser' }); };

    const loginSuccess = (t: Track) => setPhase({ kind: 'product', track: t });

    const handleLogout = async (t: Track) => {
        setPhase({ kind: 'booting' });
        await authLogout(t);
        setPhase({ kind: 'login', track: t });
    };

    // ── Render ─────────────────────────────────────────────────────────────
    if (phase.kind === 'booting')    return <SplashCover />;
    if (phase.kind === 'onboarding') return <OnboardingScreen onDone={finishOnboarding} />;
    if (phase.kind === 'chooser')    return <ChooserScreen onChoose={choose} />;

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
