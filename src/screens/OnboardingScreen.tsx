/**
 * OnboardingScreen — 3-slide first-run intro. Shown ONCE per install,
 * before the chooser, so a brand-new user knows what Engnova is before
 * being asked to pick a track.
 *
 * Deliberately minimal: three text slides + a tiny visual per slide, dots
 * indicator, Skip in the topbar, Next / Done as the primary CTA. No
 * carousel plugin, no swipe (a swipe library is 30 KB for a 3-slide
 * screen), just left/right slide animation via CSS transform.
 *
 * On Skip or Done, sets the onboarding-done preference so bootRoute()
 * never shows this again. Users returning to a saved track never see
 * this at all — App.tsx short-circuits when getSavedTrack() is set.
 */
import { useCallback, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, GraduationCap, Sparkles, Split } from 'lucide-react';
import { useI18n } from '../i18n';
import { setOnboardingDone } from '../lib/authState';
import LanguageChip from '../components/LanguageChip';
import './OnboardingScreen.css';

type SlideKey = 's1' | 's2' | 's3';
const SLIDES: SlideKey[] = ['s1', 's2', 's3'];

const ICONS: Record<SlideKey, ReactNode> = {
    s1: <GraduationCap size={40} strokeWidth={1.4} aria-hidden="true" />,
    s2: <Split          size={40} strokeWidth={1.4} aria-hidden="true" />,
    s3: <Sparkles       size={40} strokeWidth={1.4} aria-hidden="true" />,
};

export default function OnboardingScreen({ onDone }: { onDone: () => void }) {
    const { t } = useI18n();
    const [idx, setIdx] = useState(0);
    const busyRef = useRef(false);

    const finish = useCallback(async () => {
        if (busyRef.current) return;
        busyRef.current = true;
        await setOnboardingDone(true);
        onDone();
    }, [onDone]);

    const skip = () => { void finish(); };

    const next = () => {
        if (idx < SLIDES.length - 1) setIdx(idx + 1);
        else void finish();
    };

    const isLast = idx === SLIDES.length - 1;
    const key = SLIDES[idx];

    return (
        <div className="onb">
            <header className="onb-topbar">
                <button type="button" className="onb-skip" onClick={skip}>
                    {t('onboarding.skip')}
                </button>
                <LanguageChip />
            </header>

            <div className="onb-slide" key={key /* forces the rise-in on each slide change */}>
                <div className="onb-icon" aria-hidden="true">
                    {ICONS[key]}
                </div>
                <h1 className="onb-title">{t(`onboarding.${key}.title` as Parameters<typeof t>[0])}</h1>
                <p className="onb-body">{t(`onboarding.${key}.body` as Parameters<typeof t>[0])}</p>
            </div>

            <div className="onb-controls">
                <div className="onb-dots" role="tablist" aria-label="Slide">
                    {SLIDES.map((s, i) => (
                        <button
                            key={s}
                            type="button"
                            role="tab"
                            aria-selected={i === idx}
                            className={`onb-dot${i === idx ? ' is-active' : ''}`}
                            onClick={() => setIdx(i)}
                            aria-label={`Slide ${i + 1}`}
                        />
                    ))}
                </div>
                <button type="button" className="onb-next" onClick={next}>
                    {isLast ? t('onboarding.done') : t('onboarding.next')}
                    <ArrowRight size={16} aria-hidden="true" />
                </button>
            </div>
        </div>
    );
}
