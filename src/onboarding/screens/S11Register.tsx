/**
 * S11 Register — the second-to-last rung. Google Sign-In primary (dominant
 * mobile-handoff conversion pattern), email/password secondary. Spine at 11/12.
 *
 * Ground stays warm navy — this is still the notebook. Filled indigo inputs
 * would read as "the main app breaking in", so email/password use ghost
 * inputs (transparent + hairline border + amber focus ring on tap).
 *
 * On success:
 *  - Google path: session created → setAuthHint → advance to S12
 *  - Email path: user created, session may be null (email-verification is on
 *    in prod) → show inline "check email" line and STILL advance to S12
 *    (they've registered — the paywall is worth seeing). App routes to Login
 *    afterward so they can sign in once they confirm.
 */
import { useState, type FormEvent } from 'react';
import { Loader2 } from 'lucide-react';
import Shell from '../Shell';
import { Eyebrow, Headline, Support, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { Track } from '../../lib/tracks';
import { TRACKS } from '../../lib/tracks';
import { getSupabase, isTrackConfigured } from '../../lib/supabaseClients';
import { mapAuthError } from '../../lib/mapAuthError';
import { isGoogleSignInAvailable, signInWithGoogle } from '../../lib/googleAuth';
import { setAuthHint } from '../../lib/authState';
import type { LevelBand } from '../state';

interface Props {
    track:    Track;
    verdict?: LevelBand;
    /** onNext: caller advances to S12; email is captured for later prefill. */
    onNext:   (email: string, sessionCreated: boolean) => void;
    onBack:   () => void;
}

export default function S11Register({ track, verdict, onNext, onBack }: Props) {
    const { t } = useI18n();
    const trackName = t(TRACKS[track].i18n.name);
    const googleReady = isGoogleSignInAvailable();
    const configured  = isTrackConfigured(track);

    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [busy,      setBusy]      = useState(false);
    const [errKey,    setErrKey]    = useState<string | null>(null);
    const [emailSent, setEmailSent] = useState(false);

    async function handleGoogle() {
        if (busy || !googleReady || !configured) return;
        setErrKey(null); setBusy(true);
        try {
            const { idToken, email: gEmail } = await signInWithGoogle();
            const client = getSupabase(track);
            const { error } = await client.auth.signInWithIdToken({ provider: 'google', token: idToken });
            if (error) { setErrKey(mapAuthError(error).i18nKey); setBusy(false); return; }
            await setAuthHint(track, true);
            onNext(gEmail ?? '', true);
        } catch (err) {
            const m = mapAuthError(err);
            setErrKey(m.i18nKey === 'auth.err.unknown' ? 'login.google.error' : m.i18nKey);
            setBusy(false);
        }
    }

    async function handleEmail(e: FormEvent) {
        e.preventDefault();
        if (busy || !configured) return;
        if (!email) { setErrKey('onb.s11.err.email.required'); return; }
        if (password.length < 8) { setErrKey('onb.s11.err.password.weak'); return; }

        setErrKey(null); setBusy(true);
        try {
            const client = getSupabase(track);
            const { data, error } = await client.auth.signUp({ email: email.trim(), password });
            if (error) {
                // Common: 'user already registered' — map to a helpful message.
                const key = (error.message || '').toLowerCase().includes('already')
                    ? 'onb.s11.err.email.taken'
                    : mapAuthError(error).i18nKey;
                setErrKey(key); setBusy(false); return;
            }
            // Email verification is ON in prod → session is null → user must
            // confirm before they can log in. Verification OFF → session exists.
            if (data.session) {
                await setAuthHint(track, true);
                onNext(email.trim(), true);
            } else {
                setEmailSent(true);
                // Brief pause so the "check inbox" line is readable, then advance.
                // Payment doesn't need a session in this MVP (S12 is visual only).
                setTimeout(() => onNext(email.trim(), false), 900);
            }
        } catch (err) {
            setErrKey(mapAuthError(err).i18nKey); setBusy(false);
        }
    }

    const chipLabel = verdict ? `${verdict} · ${trackName}` : trackName;

    return (
        <Shell
            step={11}
            labeled
            hereBand={verdict}
            onSkip={onBack}
            skipLabel={t('onb.back')}
        >
            <div className="onb-eyebrow-row">
                <Eyebrow>{t('onb.s11.eyebrow')}</Eyebrow>
                <span className="onb-verdict-chip onb-badge-face">{chipLabel}</span>
            </div>
            <Headline>{t('onb.s11.headline', { track: trackName })}</Headline>
            <Support>{t('onb.s11.support')}</Support>

            {googleReady && (
                <>
                    <button
                        type="button"
                        className="onb-btn onb-btn-primary onb-btn-google"
                        onClick={handleGoogle}
                        disabled={busy || !configured}
                        aria-label={t('onb.s11.google')}
                    >
                        {busy ? (
                            <Loader2 size={16} className="onb-spin" aria-hidden="true" />
                        ) : (
                            <span className="onb-google-mark" aria-hidden="true">
                                <svg viewBox="0 0 48 48" width="16" height="16">
                                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.7 1.22 9.18 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                </svg>
                            </span>
                        )}
                        <span>{t('onb.s11.google')}</span>
                    </button>
                    <div className="onb-divider" aria-hidden="true">
                        <span>{t('onb.s11.divider')}</span>
                    </div>
                </>
            )}

            <form className="onb-form" onSubmit={handleEmail} noValidate>
                <input
                    className="onb-ghost-input"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.trim())}
                    placeholder={t('onb.s11.email.placeholder')}
                    disabled={busy}
                    aria-label={t('onb.s11.email.placeholder')}
                />
                <input
                    className="onb-ghost-input"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('onb.s11.password.placeholder')}
                    disabled={busy}
                    aria-label={t('onb.s11.password.placeholder')}
                />

                {errKey && (
                    <div className="onb-inline-error" role="alert">
                        {t(errKey as Parameters<typeof t>[0])}
                    </div>
                )}
                {emailSent && !errKey && (
                    <div className="onb-inline-note" role="status">
                        {t('onb.s11.email.sent')}
                    </div>
                )}

                <PrimaryButton
                    type="submit"
                    variant="ghost"
                    disabled={busy || !email || password.length < 8 || !configured}
                >
                    {busy
                        ? (<><Loader2 size={16} className="onb-spin" aria-hidden="true" /> {t('onb.s11.submitting')}</>)
                        : t('onb.s11.email.submit')
                    }
                </PrimaryButton>
            </form>

            <p className="onb-terms">{t('onb.s11.terms')}</p>
        </Shell>
    );
}
