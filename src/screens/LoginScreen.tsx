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

                {/* Persistent Google-user banner — a lot of registered users signed
                    up with Google and have NO password. Without this they'd try
                    their (nonexistent) password, get "invalid credentials",
                    and bounce. */}
                <div className="login-banner" role="note">
                    {t('login.google.banner')}
                </div>

                <form className="login-form" onSubmit={handleSubmit} noValidate>
                    <label className="login-field">
                        <span className="login-field-label">{t('login.email.label')}</span>
                        <input
                            className="login-input"
                            type="email"
                            autoComplete="email"
                            inputMode="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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

                    {errKey && (
                        <div className="login-error" role="alert">
                            {/* i18n key is dynamic — cast so t() accepts it */}
                            {t(errKey as Parameters<typeof t>[0])}
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
