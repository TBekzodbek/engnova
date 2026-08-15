/**
 * LoginScreen — email + password login for the chosen track.
 *
 * Signup + password reset intentionally punt to the site in a Custom Tab
 * (same pattern as payment) so we don't rebuild every auth flow natively
 * for v1. Users returning from the Custom Tab hit the login screen again
 * with an email pre-filled if we can capture it.
 *
 * IELTS-specific: when the anon key is the REPLACE_ME placeholder,
 * isTrackConfigured('ielts') is false and we render a friendly
 * "coming soon — continue on the site" state instead of a broken form.
 */
import { useState, type FormEvent, type CSSProperties } from 'react';
import { Browser } from '@capacitor/browser';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail, LifeBuoy, ArrowRight } from 'lucide-react';
import { TRACKS, type Track } from '../lib/tracks';
import { useI18n } from '../i18n';
import { getSupabase, isTrackConfigured } from '../lib/supabaseClients';
import { mapAuthError } from '../lib/mapAuthError';
import { isGoogleSignInAvailable, signInWithGoogle } from '../lib/googleAuth';
import LanguageChip from '../components/LanguageChip';
import './LoginScreen.css';

interface Props {
    track: Track;
    /** Called on successful sign-in. App.tsx transitions to Phase.product. */
    onSuccess: () => void;
    /** Chooser back button — user wants to switch track before logging in. */
    onBack: () => void;
}

// URLs for the "open on website" affordances. Kept per-track so the site's
// own auth flow (email confirm, promo code, whatever) stays in one place.
const SIGNUP_URL: Record<Track, string> = {
    cefr:  'https://cefracademy.uz/login?signup=1',
    ielts: 'https://ieltslevel.uz/en/signup',
};
const RESET_URL: Record<Track, string> = {
    cefr:  'https://cefracademy.uz/login?forgot=1',
    ielts: 'https://ieltslevel.uz/en/forgot-password',
};

export default function LoginScreen({ track, onSuccess, onBack }: Props) {
    const def = TRACKS[track];
    const { t } = useI18n();
    const configured = isTrackConfigured(track);

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [busy,     setBusy]     = useState(false);
    const [errKey,   setErrKey]   = useState<string | null>(null);
    // Google button only renders when the plugin is registered AND a Web
    // Client ID was baked into the build. On dev preview / older APKs /
    // owner-not-yet-configured builds, the button stays hidden so users
    // never see a broken affordance.
    const googleReady = isGoogleSignInAvailable();

    const tintStyle: CSSProperties = {
        '--track-shell':      def.tint.shell,
        '--track-shell-soft': def.tint.shellSoft,
        '--track-shell-glow': def.tint.shellGlow,
    } as CSSProperties;

    const trackName = t(def.i18n.name);

    // Custom Tab (shared cookie jar) so the user's site session survives the
    // round-trip if they end up logging in there. Hoisted above the not-
    // configured branch so both call sites share the same window.open
    // fallback — a Custom Tab failure on a device without a browser handling
    // http (corp policy, no default browser) then still lands the user
    // somewhere useful instead of a silent no-op button.
    const openInBrowser = (url: string) => {
        Browser.open({ url }).catch(() => { window.open(url, '_blank', 'noopener,noreferrer'); });
    };

    // ── IELTS not-yet-configured state ─────────────────────────────────────
    // Shown when the IELTS anon key hasn't been set (dev/staging). Falls back
    // gracefully to opening the site in a Custom Tab instead of crashing.
    if (!configured) {
        return (
            <div className="login" style={tintStyle}>
                <header className="login-topbar">
                    <button type="button" className="login-back" onClick={onBack} aria-label={t('login.back')}>
                        <ArrowLeft size={18} /> <span>{t('login.back')}</span>
                    </button>
                    <LanguageChip />
                </header>
                <div className="login-body login-not-ready">
                    <h1 className="login-headline">{trackName}</h1>
                    <p className="login-body-text">{t('login.ielts.notReady')}</p>
                    <button
                        type="button"
                        className="login-btn login-btn-primary"
                        onClick={() => openInBrowser(def.url)}
                    >
                        {t('login.ielts.openSite')} <ArrowRight size={16} />
                    </button>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (busy) return;
        setErrKey(null);
        setBusy(true);
        try {
            const client = getSupabase(track);
            const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
            if (error) {
                const m = mapAuthError(error);
                setErrKey(m.i18nKey);
                setBusy(false);
                return;
            }
            // Set the auth hint AFTER the SDK has written its own session.
            // Ordering matters — if we set the hint first and the SDK write
            // fails, bootRoute() would auto-login on a session that isn't there.
            const { setAuthHint } = await import('../lib/authState');
            await setAuthHint(track, true);
            onSuccess();
        } catch (err) {
            const m = mapAuthError(err);
            setErrKey(m.i18nKey);
            setBusy(false);
        }
    }

    async function handleGoogleSignIn() {
        if (busy) return;
        setErrKey(null);
        setBusy(true);
        try {
            const { idToken } = await signInWithGoogle();
            const client = getSupabase(track);
            // signInWithIdToken verifies the token against Supabase's
            // configured Google provider — the Web Client ID in Google
            // Cloud must match the one this app used to obtain the token.
            const { error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken });
            if (error) {
                const m = mapAuthError(error);
                setErrKey(m.i18nKey);
                setBusy(false);
                return;
            }
            const { setAuthHint } = await import('../lib/authState');
            await setAuthHint(track, true);
            onSuccess();
        } catch (err) {
            // Plugin throws on cancel + on any provider error — either way,
            // map to a friendly i18n line and stop the spinner.
            const m = mapAuthError(err);
            setErrKey(m.i18nKey === 'auth.err.unknown' ? 'login.google.error' : m.i18nKey);
            setBusy(false);
        }
    }

    return (
        <div className="login" style={tintStyle}>
            <header className="login-topbar">
                <button type="button" className="login-back" onClick={onBack} aria-label={t('login.back')}>
                    <ArrowLeft size={18} /> <span>{t('login.back')}</span>
                </button>
                <LanguageChip />
            </header>

            <div className="login-body">
                <h1 className="login-headline">{t('login.headline', { trackName })}</h1>

                {/* When the native Google plugin is available (native platform +
                    Web Client ID configured), lead with the "Continue with
                    Google" button + a divider — this is the primary path for
                    the ~30% of cefracademy users who signed up via Google.
                    Below the divider is the classic email/password form for
                    everyone else. */}
                {googleReady && (
                    <>
                        <button
                            type="button"
                            className="login-btn login-btn-google"
                            onClick={handleGoogleSignIn}
                            disabled={busy}
                            aria-label={t('login.google.button')}
                        >
                            {busy ? (
                                <Loader2 size={16} className="login-spin" aria-hidden="true" />
                            ) : (
                                <span className="login-google-mark" aria-hidden="true">
                                    {/* Google G mark — inline SVG so no external asset */}
                                    <svg viewBox="0 0 48 48" width="18" height="18">
                                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                    </svg>
                                </span>
                            )}
                            <span>{t('login.google.button')}</span>
                        </button>
                        <div className="login-divider" aria-hidden="true">
                            <span>{t('login.divider.or')}</span>
                        </div>
                    </>
                )}

                {/* Persistent Google-user banner — shown ONLY when the native
                    Google button is NOT available (dev preview, old APK,
                    owner hasn't finished Google Cloud setup). Tells those
                    users to use the forgot-password fallback. Once the
                    button ships, this banner disappears automatically. */}
                {!googleReady && (
                    <div className="login-banner" role="note">
                        {t('login.google.banner')}
                    </div>
                )}

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <label className="login-field">
                        <span className="login-field-label">{t('login.email.label')}</span>
                        <input
                            className="login-input"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            required
                            /* Xiaomi/MIUI keyboards aggressively title-case
                               the first letter of any input. Emails are
                               case-sensitive on some servers — disable it. */
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.trim())}
                            placeholder={t('login.email.placeholder')}
                            disabled={busy}
                        />
                    </label>

                    <label className="login-field">
                        <span className="login-field-label">{t('login.password.label')}</span>
                        <div className="login-input-wrap">
                            <input
                                className="login-input"
                                type={showPw ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                minLength={1}
                                /* Passwords MUST bypass every keyboard hint —
                                   Xiaomi's Gboard has been observed to auto-
                                   capitalize / auto-correct password characters
                                   even when the field type is password. This
                                   used to silently break login on Redmi. */
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck="false"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={busy}
                            />
                            <button
                                type="button"
                                className="login-eye"
                                onClick={() => setShowPw(v => !v)}
                                aria-label={showPw ? t('login.password.hide') : t('login.password.show')}
                                tabIndex={-1}
                            >
                                {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                            </button>
                        </div>
                    </label>

                    {/* Generic error line for anything EXCEPT invalid-credentials
                        (which gets its own actionable card below with a Google
                        button + reset link — the far more common recovery path). */}
                    {errKey && errKey !== 'auth.err.invalid_credentials' && (
                        <div className="login-error" role="alert">
                            {/* i18n key is dynamic — cast so t() accepts it */}
                            {t(errKey as Parameters<typeof t>[0])}
                        </div>
                    )}

                    {/* On invalid_credentials, replace the plain error line with
                        a card that names the most common cause (they signed up
                        with Google, don't have a password) and offers one-tap
                        recovery paths. Fixes the loop where users typed a
                        password that never existed until they gave up. */}
                    {errKey === 'auth.err.invalid_credentials' && (
                        <div className="login-invalid-card" role="alert">
                            <div className="login-invalid-card-title">{t('login.invalid.title')}</div>
                            <div className="login-invalid-card-body">{t('login.invalid.body')}</div>
                            <div className="login-invalid-card-actions">
                                {googleReady && (
                                    <button
                                        type="button"
                                        className="login-btn login-btn-google login-btn-compact"
                                        onClick={handleGoogleSignIn}
                                        disabled={busy}
                                    >
                                        <span className="login-google-mark" aria-hidden="true">
                                            <svg viewBox="0 0 48 48" width="14" height="14">
                                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                            </svg>
                                        </span>
                                        <span>{t('login.invalid.googleBtn')}</span>
                                    </button>
                                )}
                                <button
                                    type="button"
                                    className="login-link login-link-strong login-invalid-reset"
                                    onClick={() => openInBrowser(RESET_URL[track])}
                                    disabled={busy}
                                >
                                    {t('login.invalid.resetBtn')}
                                </button>
                            </div>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-btn login-btn-primary login-submit"
                        disabled={busy || !email || !password}
                    >
                        {busy
                            ? (<><Loader2 size={16} className="login-spin" /> {t('login.submitting')}</>)
                            : t('login.submit')
                        }
                    </button>
                </form>

                <button
                    type="button"
                    className="login-link"
                    onClick={() => openInBrowser(RESET_URL[track])}
                    disabled={busy}
                >
                    {t('login.forgot')}
                </button>

                <div className="login-signup">
                    <span className="login-signup-text">{t('login.signup.line')}</span>
                    <button
                        type="button"
                        className="login-link login-link-strong"
                        onClick={() => openInBrowser(SIGNUP_URL[track])}
                        disabled={busy}
                    >
                        {t('login.signup.link')} <Mail size={13} aria-hidden="true" />
                    </button>
                </div>

                <div className="login-support">
                    <LifeBuoy size={13} aria-hidden="true" /> {t('login.support')}
                </div>
            </div>
        </div>
    );
}
