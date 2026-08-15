/**
 * EngnovaHomeScreen — placeholder post-login home.
 *
 * Real product surface will land in a later turn (survey, first-step card,
 * lessons, engagement). For now: greet the user, show their identifier,
 * offer a Sign Out that clears the Engnova session cleanly.
 */
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useI18n } from '../i18n';
import { getEngnovaSupabase } from '../lib/supabaseEngnova';
import LanguageChip from '../components/LanguageChip';
import { signOutFromGoogle } from '../lib/googleAuth';
import './EngnovaLoginScreen.css';

interface Props {
    onSignOut: () => void;
}

export default function EngnovaHomeScreen({ onSignOut }: Props) {
    const { t } = useI18n();
    const [displayName, setDisplayName] = useState<string>('');

    useEffect(() => {
        let cancel = false;
        (async () => {
            try {
                const { data } = await getEngnovaSupabase().auth.getUser();
                const u = data?.user;
                if (!cancel && u) {
                    const name = (u.user_metadata?.full_name as string | undefined)
                              ?? (u.user_metadata?.name      as string | undefined)
                              ?? u.email
                              ?? u.phone
                              ?? '';
                    setDisplayName(name);
                }
            } catch { /* not configured or offline — leave blank */ }
        })();
        return () => { cancel = true; };
    }, []);

    async function handleSignOut() {
        try {
            await getEngnovaSupabase().auth.signOut();
        } catch { /* fallthrough */ }
        try { await signOutFromGoogle(); } catch { /* nothing to sign out of */ }
        onSignOut();
    }

    return (
        <div className="eng-login">
            <header className="eng-login-topbar">
                <span aria-hidden="true" />
                <LanguageChip />
            </header>

            <div className="eng-login-body">
                <h1 className="eng-login-headline">
                    {displayName
                        ? t('engnova.home.hello', { name: displayName })
                        : t('engnova.home.hello.generic')}
                </h1>
                <p className="eng-login-support">{t('engnova.home.placeholder')}</p>

                <div style={{
                    marginTop: 24,
                    padding: 16,
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(240, 238, 230, 0.10)',
                    borderRadius: 14,
                    color: 'rgba(240, 238, 230, 0.7)',
                    fontSize: 14,
                    lineHeight: 1.55,
                    textWrap: 'pretty',
                }}>
                    {t('engnova.home.roadmap')}
                </div>

                <button
                    type="button"
                    className="eng-btn"
                    onClick={handleSignOut}
                    style={{
                        marginTop: 24,
                        background: 'transparent',
                        color: 'rgba(240, 238, 230, 0.72)',
                        border: '1px solid rgba(240, 238, 230, 0.14)',
                    }}
                >
                    <LogOut size={16} aria-hidden="true" />
                    <span>{t('engnova.home.signout')}</span>
                </button>
            </div>
        </div>
    );
}
