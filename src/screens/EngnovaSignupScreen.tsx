/**
 * EngnovaSignupScreen — email + password signup.
 *
 * Users on the OAuth paths (Google, Telegram) skip this — they land on
 * EngnovaSetPasswordScreen instead. This screen is for people who don't
 * want to use an OAuth provider.
 */
import { useState, type FormEvent } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { getEngnovaSupabase, isEngnovaConfigured } from '../lib/supabaseEngnova';
import LanguageChip from '../components/LanguageChip';
import './EngnovaLoginScreen.css';

interface Props {
    /** Called when signup succeeds. sessionCreated=false when email
     *  verification is on (session is null; user must confirm inbox). */
    onSuccess: (info: { sessionCreated: boolean; email: string }) => void;
    /** Called when user taps back — parent shows EngnovaLoginScreen. */
    onBack: () => void;
}

export default function EngnovaSignupScreen({ onSuccess, onBack }: Props) {
    const { t } = useI18n();
    const configured = isEngnovaConfigured();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [busy,     setBusy]     = useState(false);
    const [errKey,   setErrKey]   = useState<string | null>(null);
    const [sent,     setSent]     = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (busy || !configured) return;
        if (!email) { setErrKey('engnova.signup.err.email'); return; }
        if (password.length < 8) { setErrKey('engnova.signup.err.weak'); return; }
        setErrKey(null); setBusy(true);
        try {
            const client = getEngnovaSupabase();
            const { data, error } = await client.auth.signUp({ email: email.trim(), password });
            if (error) {
                const key = (error.message || '').toLowerCase().includes('already')
                    ? 'engnova.signup.err.taken'
                    : 'engnova.signup.err.unknown';
                setErrKey(key); setBusy(false); return;
            }
            if (data.session) {
                onSuccess({ sessionCreated: true, email: email.trim() });
            } else {
                setSent(true);
                setTimeout(() => onSuccess({ sessionCreated: false, email: email.trim() }), 900);
            }
        } catch {
            setErrKey('engnova.signup.err.unknown'); setBusy(false);
        }
    }

    return (
        <div className="eng-login">
            <header className="eng-login-topbar">
                <button type="button" className="eng-link" onClick={onBack} aria-label={t('engnova.back')}>
                    <ArrowLeft size={16} /> <span>{t('engnova.back')}</span>
                </button>
                <LanguageChip />
            </header>

            <div className="eng-login-body">
                <h1 className="eng-login-headline">{t('engnova.signup.headline')}</h1>
                <p className="eng-login-support">{t('engnova.signup.support')}</p>

                {!configured && (
                    <div className="eng-login-notready" role="note">{t('engnova.login.notReady')}</div>
                )}

                <form className="eng-form" onSubmit={handleSubmit} noValidate>
                    <input
                        className="eng-input"
                        type="email" autoComplete="email" inputMode="email" required
                        autoCapitalize="none" autoCorrect="off" spellCheck={false}
                        value={email}
                        onChange={(e) => setEmail(e.target.value.trim())}
                        placeholder={t('engnova.signup.email.placeholder')}
                        disabled={busy}
                        aria-label={t('engnova.signup.email.placeholder')}
                    />
                    <div className="eng-input-wrap">
                        <input
                            className="eng-input"
                            type={showPw ? 'text' : 'password'}
                            autoComplete="new-password" required minLength={8}
                            autoCapitalize="none" autoCorrect="off" spellCheck={false}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('engnova.signup.password.placeholder')}
                            disabled={busy}
                            aria-label={t('engnova.signup.password.placeholder')}
                        />
                        <button
                            type="button" className="eng-eye"
                            onClick={() => setShowPw(v => !v)}
                            aria-label={showPw ? t('engnova.login.password.hide') : t('engnova.login.password.show')}
                            tabIndex={-1}
                        >
                            {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    </div>

                    {errKey && (
                        <div className="eng-error" role="alert">
                            {t(errKey as Parameters<typeof t>[0])}
                        </div>
                    )}
                    {sent && !errKey && (
                        <div className="eng-inline-note" role="status" style={{ fontSize: 13, color: '#FFB86B', marginTop: 2 }}>
                            {t('engnova.signup.emailSent')}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="eng-btn eng-btn-primary"
                        disabled={busy || !email || password.length < 8 || !configured}
                    >
                        {busy
                            ? (<><Loader2 size={16} className="eng-spin" aria-hidden="true" /> {t('engnova.signup.creating')}</>)
                            : t('engnova.signup.submit')
                        }
                    </button>
                </form>

                <p className="eng-login-support" style={{ fontSize: 12, marginTop: 8 }}>
                    {t('engnova.signup.terms')}
                </p>
            </div>
        </div>
    );
}
