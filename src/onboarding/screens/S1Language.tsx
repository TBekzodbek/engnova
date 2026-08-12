/**
 * S1 — Language picker. Fastest, gentlest first tap. Preselects the value
 * already in localStorage (or 'uz' by default), lets user retap to change,
 * then continues.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, Card, PrimaryButton } from '../primitives';
import { useI18n, type Lang } from '../../i18n';

const LANGS: { code: Lang; label: string; native: string }[] = [
    { code: 'uz', label: 'UZ', native: "O'zbekcha"  },
    { code: 'ru', label: 'RU', native: 'Русский'    },
    { code: 'en', label: 'EN', native: 'English'    },
];

export default function S1Language({ onNext }: { onNext: () => void }) {
    const { t, lang, setLang } = useI18n();
    return (
        <Shell step={1} cta={<PrimaryButton onClick={onNext}>{t('onb.next')}</PrimaryButton>}>
            <Eyebrow>{t('onb.s1.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s1.headline')}</Headline>
            <Support>{t('onb.s1.support')}</Support>
            <div className="onb-stack">
                {LANGS.map(({ code, label, native }) => (
                    <Card
                        key={code}
                        icon={<span className="onb-lang-code">{label}</span>}
                        label={native}
                        selected={lang === code}
                        onClick={() => setLang(code)}
                    />
                ))}
            </div>
        </Shell>
    );
}
