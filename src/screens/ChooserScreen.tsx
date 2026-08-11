/**
 * ChooserScreen — Engnova's one screen.
 * Hero question + two-line subhead + two rich track cards + language chip +
 * trust footer. On tap, saves the track and hands off to ProductScreen with
 * a 460ms card-scale transition.
 *
 * Per-track shell tinting: each card exposes its own --track-shell locally
 * so the illustration + tagline chip pick up the CEFR/IELTS accent.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Browser } from '@capacitor/browser';
import { TRACKS, type Track } from '../lib/tracks';
import { useI18n } from '../i18n';
import CefrLadder from '../illustrations/CefrLadder';
import IeltsArc from '../illustrations/IeltsArc';
import LanguageChip from '../components/LanguageChip';
import './ChooserScreen.css';

const PRIVACY_URL = 'https://www.engnova.uz/privacy';

export default function ChooserScreen({ onChoose }: { onChoose: (t: Track) => void }) {
    const { t } = useI18n();
    const [pressed, setPressed] = useState<Track | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const handleChoose = (track: Track) => {
        if (pressed) return;   // guard against double-tap
        setPressed(track);
        // Let the press-scale + fade play (matches --motion-slow) before handoff.
        timer.current = setTimeout(() => onChoose(track), 380);
    };

    const openPrivacy = async () => {
        // Open in system browser: URL bar is a trust artifact.
        try { await Browser.open({ url: PRIVACY_URL }); }
        catch { window.open(PRIVACY_URL, '_blank', 'noopener,noreferrer'); }
    };

    const cards = useMemo(() => [
        { track: 'cefr' as const, illust: <CefrLadder className="track-illust" /> },
        { track: 'ielts' as const, illust: <IeltsArc  className="track-illust" /> },
    ], []);

    return (
        <div className={`chooser${pressed ? ' is-handing-off' : ''}`}>
            <header className="chooser-topbar">
                <span className="chooser-brand" aria-hidden="true">Engnova</span>
                <LanguageChip />
            </header>

            <div className="chooser-hero">
                <h1 className="chooser-title">{t('chooser.hero')}</h1>
                <p className="chooser-subhead">
                    <span className="chooser-subhead-line">{t('chooser.subhead.cefr')}</span>
                    <span className="chooser-subhead-line">{t('chooser.subhead.ielts')}</span>
                </p>
            </div>

            <div className="chooser-cards" role="list">
                {cards.map(({ track, illust }) => {
                    const def = TRACKS[track];
                    const isPressed = pressed === track;
                    const isDimmed = pressed && !isPressed;
                    return (
                        <button
                            key={track}
                            type="button"
                            role="listitem"
                            aria-label={t(def.i18n.name)}
                            className={`track-card${isPressed ? ' is-pressed' : ''}${isDimmed ? ' is-dimmed' : ''}`}
                            style={{
                                '--track-shell':       def.tint.shell,
                                '--track-shell-soft':  def.tint.shellSoft,
                                '--track-shell-glow':  def.tint.shellGlow,
                            } as CSSProperties}
                            onClick={() => handleChoose(track)}
                            disabled={!!pressed}
                        >
                            <div className="track-illust-wrap" aria-hidden="true">
                                <div className="track-illust-glow" />
                                {illust}
                            </div>
                            <div className="track-body">
                                <div className="track-name">{t(def.i18n.name)}</div>
                                <div className="track-tagline">{t(def.i18n.tagline)}</div>
                                <ul className="track-features" role="list">
                                    {def.i18n.features.map((k) => (
                                        <li key={k} className="track-feature">
                                            <span className="track-feature-dot" aria-hidden="true" />
                                            {t(k as Parameters<typeof t>[0])}
                                        </li>
                                    ))}
                                </ul>
                                <div className="track-audience">{t(def.i18n.audience)}</div>
                            </div>
                        </button>
                    );
                })}
            </div>

            <footer className="chooser-foot">
                <span className="chooser-foot-line">{t('chooser.footer.line')}</span>
                <span className="chooser-foot-sep" aria-hidden="true">·</span>
                <button type="button" className="chooser-foot-link" onClick={openPrivacy}>
                    {t('chooser.footer.link')}
                </button>
            </footer>
        </div>
    );
}
