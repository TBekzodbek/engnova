/**
 * EngnovaSetPasswordScreen — the post-OAuth gate.
 *
 * Fires immediately after a Google or Telegram sign-in. The user MUST set a
 * password before landing on Home. This is the "no lockout" invariant: every
 * Engnova account has a fallback password stored in auth.users, so if the
 * user later loses access to Google or Telegram they can still sign in.
 *
 * Storage: supabase.auth.updateUser({ password, data: { has_password: true } }).
 * Password is bcrypt-hashed by Supabase into auth.users.encrypted_password —
 * never displayed back to anyone, including the user themselves.
 *
 * We deliberately do NOT offer a "Skip" here — Engnova is a fresh install,
 * this is the ONE opportunity to guarantee a fallback. The alternative
 * (offering skip and re-prompting later) has been shown to leave ~40% of
 * users lockable-out forever in similar apps.
 */
import { useState, type FormEvent } from 'react';
import { Shield, Loader2, CheckCircle } from 'lucide-react';
import { useI18n } from '../i18n';
import { getEngnovaSupabase } from '../lib/supabaseEngnova';
import './EngnovaLoginScreen.css';

interface Props {
    /** The OAuth-provided identifier (email for Google, tg-<phone>@engnova.uz
     *  for Telegram) — displayed so the user knows which account they're
     *  setting a password for. */
    email: string | null;
    /** Called when password is set. Parent should land on Home. */
    onDone: () => void;
}

export default function EngnovaSetPasswordScreen({ email, onDone }: Props) {
    const { t } = useI18n();

    const [pw,   setPw]   = useState('');
    const [pw2,  setPw2]  = useState('');
    const [busy, setBusy] = useState(false);
    const [err,  setErr]  = useState<string | null>(null);
    const [done, setDone] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErr(null);
        if (pw.length < 8) { setErr(t('engnova.setpw.err.weak')); return; }
        if (pw !== pw2)     { setErr(t('engnova.setpw.err.match')); return; }
        setBusy(true);
        try {
            const client = getEngnovaSupabase();
            const { error } = await client.auth.updateUser({
                password: pw,
                data: { has_password: true, has_password_at: new Date().toISOString() },
            });
            setBusy(false);
            if (error) { setErr(error.message || 'Error'); return; }
            setDone(true);
            setTimeout(onDone, 900);
        } catch (e2) {
            setBusy(false);
            setErr(e2 instanceof Error ? e2.message : 'Error');
        }
    }

    if (done) {
        return (
            <div className="eng-login">
                <div className="eng-login-body" style={{ alignItems: 'center', textAlign: 'center', paddingTop: 60 }}>
                    <CheckCircle size={48} color="#34D399" />
                    <h1 className="eng-login-headline" style={{ marginTop: 20 }}>{t('engnova.setpw.done.title')}</h1>
                    <p className="eng-login-support" style={{ textAlign: 'center' }}>{t('engnova.setpw.done.body')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="eng-login">
            <header className="eng-login-topbar">
                <span aria-hidden="true" />
                <span aria-hidden="true" />
            </header>

            <div className="eng-login-body">
                <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'rgba(255, 184, 107, 0.14)',
                    border: '1px solid rgba(255, 184, 107, 0.35)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#FFB86B', margin: '8px 0 4px',
                }}>
                    <Shield size={24} />
                </div>

                <h1 className="eng-login-headline">{t('engnova.setpw.headline')}</h1>
                <p className="eng-login-support">{t('engnova.setpw.support')}</p>
                {email && (
                    <p className="eng-login-support" style={{ marginTop: -4, fontSize: 13, color: 'rgba(240,238,230,0.55)' }}>
                        {t('engnova.setpw.for')} <strong style={{ color: '#F0EEE6' }}>{email}</strong>
                    </p>
                )}

                <form className="eng-form" onSubmit={handleSubmit} noValidate>
                    <input
                        className="eng-input"
                        type="password" autoComplete="new-password"
                        autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={8}
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                        placeholder={t('engnova.setpw.pw.placeholder')}
                        disabled={busy}
                        aria-label={t('engnova.setpw.pw.placeholder')}
                        autoFocus
                    />
                    <input
                        className="eng-input"
                        type="password" autoComplete="new-password"
                        autoCapitalize="none" autoCorrect="off" spellCheck={false} minLength={8}
                        value={pw2}
                        onChange={(e) => setPw2(e.target.value)}
                        placeholder={t('engnova.setpw.pw2.placeholder')}
                        disabled={busy}
                        aria-label={t('engnova.setpw.pw2.placeholder')}
                    />

                    {err && (
                        <div className="eng-error" role="alert">{err}</div>
                    )}

                    <button
                        type="submit"
                        className="eng-btn eng-btn-primary"
                        disabled={busy || !pw || !pw2}
                    >
                        {busy
                            ? (<><Loader2 size={16} className="eng-spin" aria-hidden="true" /> {t('engnova.setpw.saving')}</>)
                            : t('engnova.setpw.save')
                        }
                    </button>
                </form>
            </div>
        </div>
    );
}
