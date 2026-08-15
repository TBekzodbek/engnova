/**
 * EngnovaLoginScreen — the ONE login surface for Engnova's own auth.
 *
 * Three sign-in paths, in priority order:
 *   1. Google  (Continue with Google — big amber-tinted primary button)
 *   2. Telegram (Continue with Telegram — pill secondary)
 *   3. Email + password (form below the divider)
 *
 * Google + Telegram users are pushed to EngnovaSetPasswordScreen right
 * after auth, so every user ends up with a password backup — no more
 * "I signed up with Google and can't get back in" support tickets.
 *
 * Buttons that require config are hidden when the env vars aren't set —
 * same "no broken affordances" discipline as the old LoginScreen.
 */
import { useState, type FormEvent, type CSSProperties } from 'react';
import { Loader2, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import { getEngnovaSupabase, isEngnovaConfigured } from '../lib/supabaseEngnova';
import { isGoogleSignInAvailable, signInWithGoogle } from '../lib/googleAuth';
import { isTelegramAuthAvailable, launchTelegramLogin, pollTelegramSession } from '../lib/telegramAuth';
import LanguageChip from '../components/LanguageChip';
import './EngnovaLoginScreen.css';

interface Props {
    /** Called with { session, needsPassword } once auth succeeds. Parent (App.tsx)
     *  decides whether to show EngnovaSetPasswordScreen or land on Home. */
    onSuccess: (info: { needsPassword: boolean; email: string | null }) => void;
    /** Called when user taps "Sign up" — parent shows EngnovaSignupScreen. */
    onWantSignup: () => void;
}

export default function EngnovaLoginScreen({ onSuccess, onWantSignup }: Props) {
    const { t } = useI18n();
    const configured  = isEngnovaConfigured();
    const googleReady = isGoogleSignInAvailable() && configured;
    const tgReady     = isTelegramAuthAvailable() && configured;

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [busy,     setBusy]     = useState(false);
    const [tgBusy,   setTgBusy]   = useState(false);
    const [errKey,   setErrKey]   = useState<string | null>(null);

    async function handleGoogle() {
        if (busy || !googleReady) return;
        setErrKey(null); setBusy(true);
        try {
            const { idToken, email: gEmail } = await signInWithGoogle();
            const client = getEngnovaSupabase();
            const { error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken });
            if (error) { setErrKey('engnova.auth.err.google'); setBusy(false); return; }
            // Every Google-authed user MUST set a password before landing.
            onSuccess({ needsPassword: true, email: gEmail ?? null });
        } catch {
            setErrKey('engnova.auth.err.google'); setBusy(false);
        }
    }

    async function handleTelegram() {
        if (tgBusy || !tgReady) return;
        setErrKey(null); setTgBusy(true);
        try {
            const { nonce } = launchTelegramLogin();
            // Poll our server for the OTP the bot delivers.
            // 60s hard cap, 2s interval — matches the "check Telegram — did
            // you tap Share?" hint UX.
            const deadline = Date.now() + 60_000;
            let session: { email: string; token: string } | null = null;
            while (Date.now() < deadline) {
                await sleep(2000);
                session = await pollTelegramSession(getEngnovaSupabase, nonce);
                if (session) break;
            }
            if (!session) { setErrKey('engnova.auth.err.tg.timeout'); setTgBusy(false); return; }
            const client = getEngnovaSupabase();
            const { error } = await client.auth.verifyOtp({
                email: session.email,
                token: session.token,
                type:  'email',
            });
            if (error) { setErrKey('engnova.auth.err.tg'); setTgBusy(false); return; }
            // Telegram user's phone lives in auth.users.phone (set by the
            // Edge Function). They still set a password to sign back in later.
            onSuccess({ needsPassword: true, email: session.email });
        } catch {
            setErrKey('engnova.auth.err.tg'); setTgBusy(false);
        }
    }

    async function handleEmail(e: FormEvent) {
        e.preventDefault();
        if (busy || !configured) return;
        setErrKey(null); setBusy(true);
        try {
            const client = getEngnovaSupabase();
            const { error } = await client.auth.signInWithPassword({
                email: email.trim(),
                password,
            });
            if (error) { setErrKey('engnova.auth.err.invalid'); setBusy(false); return; }
            // Email users already have a password — skip the gate.
            onSuccess({ needsPassword: false, email: email.trim() });
        } catch {
            setErrKey('engnova.auth.err.unknown'); setBusy(false);
        }
    }

    const canSubmit = !!email && password.length > 0 && !busy && configured;

    return (
        <div className="eng-login">
            <header className="eng-login-topbar">
                <span aria-hidden="true" />
                <LanguageChip />
            </header>

            <div className="eng-login-body">
                <h1 className="eng-login-headline">{t('engnova.login.headline')}</h1>
                <p className="eng-login-support">{t('engnova.login.support')}</p>

                {!configured && (
                    <div className="eng-login-notready" role="note">
                        {t('engnova.login.notReady')}
                    </div>
                )}

                {googleReady && (
                    <button
                        type="button"
                        className="eng-btn eng-btn-google"
                        onClick={handleGoogle}
                        disabled={busy || tgBusy}
                        aria-label={t('engnova.login.google')}
                    >
                        {busy ? (
                            <Loader2 size={16} className="eng-spin" aria-hidden="true" />
                        ) : (
                            <span className="eng-google-mark" aria-hidden="true">
                                <svg viewBox="0 0 48 48" width="16" height="16">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                            </span>
                        )}
                        <span>{t('engnova.login.google')}</span>
                    </button>
                )}

                {tgReady && (
                    <button
                        type="button"
                        className="eng-btn eng-btn-telegram"
                        onClick={handleTelegram}
                        disabled={busy || tgBusy}
                        aria-label={t('engnova.login.telegram')}
                    >
                        {tgBusy ? (
                            <Loader2 size={16} className="eng-spin" aria-hidden="true" />
                        ) : (
                            <MessageCircle size={16} aria-hidden="true" />
                        )}
                        <span>{tgBusy ? t('engnova.login.tg.waiting') : t('engnova.login.telegram')}</span>
                    </button>
                )}

                {(googleReady || tgReady) && (
                    <div className="eng-divider" aria-hidden="true">
                        <span>{t('engnova.login.or')}</span>
                    </div>
                )}

                <form className="eng-form" onSubmit={handleEmail} noValidate>
                    <input
                        className="eng-input"
                        type="email"
                        autoComplete="email"
                        inputMode="email"
                        required
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        placeholder={t('engnova.login.email.placeholder')}
                        disabled={busy}
                        aria-label={t('engnova.login.email.placeholder')}
                    />
                    <div className="eng-input-wrap">
                        <input
                            className="eng-input"
                            type={showPw ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            minLength={1}
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck={false}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('engnova.login.password.placeholder')}
                            disabled={busy}
                            aria-label={t('engnova.login.password.placeholder')}
                        />
                        <button
                            type="button"
                            className="eng-eye"
                            onClick={() => setShowPw(v => !v)}
                            aria-label={showPw ? t('engnova.login.password.hide') : t('engnova.login.password.show')}
                            tabIndex={-1}
                            style={{ ...(undefined as unknown as CSSProperties) }}
                        >
                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>

                    {errKey && (
                        <div className="eng-error" role="alert">
                            {t(errKey as Parameters<typeof t>[0])}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="eng-btn eng-btn-primary"
                        disabled={!canSubmit}
                    >
                        {busy
                            ? (<><Loader2 size={16} className="eng-spin" aria-hidden="true" /> {t('engnova.login.signingin')}</>)
                            : t('engnova.login.signin')
                        }
                    </button>
                </form>

                <div className="eng-signup-row">
                    <span className="eng-signup-text">{t('engnova.login.noaccount')}</span>
                    <button
                        type="button"
                        className="eng-link"
                        onClick={onWantSignup}
                        disabled={busy}
                    >
                        {t('engnova.login.signup')}
                    </button>
                </div>
            </div>
        </div>
    );
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
