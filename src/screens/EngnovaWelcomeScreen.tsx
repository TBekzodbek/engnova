/**
 * EngnovaWelcomeScreen — the very first frame after Splash.
 *
 * Sits BEFORE login (owner rule: "Before any question in the start after
 * welcoming"). Purpose: set expectation, warm the user up, hand them one
 * clear next action. NO fields, NO questions. Two words + one button.
 *
 * The button just routes to EngnovaLoginScreen — no state written. If
 * users bounce here we lose zero data and only a few kilobytes of TCP.
 */
import { useI18n } from '../i18n';
import LanguageChip from '../components/LanguageChip';
import './EngnovaLoginScreen.css';

interface Props {
    onStart: () => void;
}

export default function EngnovaWelcomeScreen({ onStart }: Props) {
    const { t } = useI18n();

    return (
        <div className="eng-login">
            <header className="eng-login-topbar">
                <span aria-hidden="true" />
                <LanguageChip />
            </header>

            <div className="eng-login-body" style={{ paddingTop: 40 }}>
                {/* Mark — kept text-only for now; a real wordmark ships later. */}
                <div style={{
                    display: 'inline-flex',
                    alignItems: 'baseline',
                    gap: 6,
                    marginBottom: 8,
                }}>
                    <span style={{
                        fontFamily: "'Noto Serif Display', 'Times New Roman', 'PT Serif', serif",
                        fontWeight: 500,
                        fontSize: 34,
                        color: '#F0EEE6',
                        letterSpacing: '-0.02em',
                    }}>
                        Engnova
                    </span>
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: '#FFB86B',
                        boxShadow: '0 0 12px rgba(255,184,107,0.6)',
                        alignSelf: 'center',
                        marginBottom: 4,
                    }} aria-hidden="true" />
                </div>

                <h1 className="eng-login-headline" style={{ marginTop: 8 }}>
                    {t('engnova.welcome.headline')}
                </h1>
                <p className="eng-login-support">{t('engnova.welcome.support')}</p>

                <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button
                        type="button"
                        className="eng-btn eng-btn-primary"
                        onClick={onStart}
                        autoFocus
                    >
                        {t('engnova.welcome.cta')}
                    </button>
                    <p className="eng-login-support" style={{
                        margin: 0, marginTop: 4, textAlign: 'center', fontSize: 12,
                    }}>
                        {t('engnova.welcome.hint')}
                    </p>
                </div>
            </div>
        </div>
    );
}
