/**
 * Engnova shell — top-level phase machine (v2, 2026-08-13 pivot).
 *
 * Engnova is now a STANDALONE product with its own auth backend
 * (getEngnovaSupabase). Cefracademy / ieltslevel accounts CANNOT sign in
 * here — those two sites become potential content sources, not auth
 * partners. See lib/supabaseEngnova.ts for the rationale.
 *
 *   Phase =
 *     'booting'      bootRoute() resolving — SplashCover masks this
 *     'welcome'      first frame: brand + one-line + "Let's begin"
 *     'login'        EngnovaLoginScreen (Google / Telegram / Email)
 *     'signup'       EngnovaSignupScreen (email path)
 *     'setpw'        EngnovaSetPasswordScreen (post-OAuth gate)
 *     'home'         EngnovaHomeScreen (placeholder for the real product)
 *
 * bootRoute() decides on cold start:
 *   1. If Engnova auth is not configured → welcome (shows "server not
 *      connected" once on login; harmless).
 *   2. If we have a hint that the user is signed in AND the SDK confirms
 *      an active session → home.
 *   3. Otherwise → welcome.
 *
 * The old two-track flow (chooser → per-track login → webview product) is
 * retained in the codebase (ChooserScreen, LoginScreen, ProductScreen)
 * for the day we want to open cefracademy / ielts inside Engnova as
 * content, but it no longer runs at boot.
 */
import { useEffect, useRef, useState } from 'react';
import EngnovaWelcomeScreen     from './screens/EngnovaWelcomeScreen';
import EngnovaLoginScreen       from './screens/EngnovaLoginScreen';
import EngnovaSignupScreen      from './screens/EngnovaSignupScreen';
import EngnovaSetPasswordScreen from './screens/EngnovaSetPasswordScreen';
import EngnovaHomeScreen        from './screens/EngnovaHomeScreen';
import SplashCover              from './components/SplashCover';
import { getEngnovaSupabase, isEngnovaConfigured } from './lib/supabaseEngnova';
import { getEngnovaAuthHint, setEngnovaAuthHint } from './lib/authState';

type Phase =
    | { kind: 'booting' }
    | { kind: 'welcome' }
    | { kind: 'login' }
    | { kind: 'signup' }
    | { kind: 'setpw';   email: string | null }
    | { kind: 'home' };

/**
 * Fast path: known-good Engnova session → home.
 * Anything else → welcome (the user re-authenticates through the door).
 */
async function bootRoute(): Promise<Phase> {
    if (!isEngnovaConfigured()) return { kind: 'welcome' };
    const hint = await getEngnovaAuthHint();
    if (!hint) return { kind: 'welcome' };
    try {
        const client = getEngnovaSupabase();
        const { data } = await client.auth.getSession();
        if (data.session) return { kind: 'home' };
        // Hint said yes, SDK says no — clear the hint so we don't flip-flop
        // on future boots.
        await setEngnovaAuthHint(false);
        return { kind: 'welcome' };
    } catch {
        return { kind: 'welcome' };
    }
}

export default function App() {
    const [phase, setPhase] = useState<Phase>({ kind: 'booting' });
    const phaseRef = useRef(phase);
    useEffect(() => { phaseRef.current = phase; }, [phase]);

    // Boot on mount. SplashCover renders until bootRoute resolves so the
    // user never sees a wrong intermediate frame.
    useEffect(() => {
        let cancelled = false;
        bootRoute().then((p) => { if (!cancelled) setPhase(p); });
        return () => { cancelled = true; };
    }, []);

    // ── Render ──────────────────────────────────────────────────────────
    if (phase.kind === 'booting') return <SplashCover />;

    if (phase.kind === 'welcome') {
        return <EngnovaWelcomeScreen onStart={() => setPhase({ kind: 'login' })} />;
    }

    if (phase.kind === 'login') {
        return (
            <EngnovaLoginScreen
                onSuccess={async ({ needsPassword, email }) => {
                    await setEngnovaAuthHint(true);
                    setPhase(needsPassword ? { kind: 'setpw', email } : { kind: 'home' });
                }}
                onWantSignup={() => setPhase({ kind: 'signup' })}
            />
        );
    }

    if (phase.kind === 'signup') {
        return (
            <EngnovaSignupScreen
                onSuccess={async ({ sessionCreated, email }) => {
                    if (sessionCreated) {
                        // Auto-confirm was on OR the user was already
                        // verified — hint the session and drop into
                        // password-set (they already have one from signup,
                        // so straight to home).
                        await setEngnovaAuthHint(true);
                        setPhase({ kind: 'home' });
                    } else {
                        // Email confirmation pending — bounce to login with
                        // a helpful message (user must confirm email first).
                        // Fall back to login so they can try after confirming.
                        void email; // captured for future prefill
                        setPhase({ kind: 'login' });
                    }
                }}
                onBack={() => setPhase({ kind: 'login' })}
            />
        );
    }

    if (phase.kind === 'setpw') {
        return (
            <EngnovaSetPasswordScreen
                email={phase.email}
                onDone={() => setPhase({ kind: 'home' })}
            />
        );
    }

    // home
    return (
        <EngnovaHomeScreen
            onSignOut={async () => {
                await setEngnovaAuthHint(false);
                setPhase({ kind: 'welcome' });
            }}
        />
    );
}
