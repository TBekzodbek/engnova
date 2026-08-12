/**
 * S9 — Social proof. Three Uzbek learners' quotes with initials in an
 * amber circle (in place of real photos until owner provides them).
 * Instagram-continuity trust anchor.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';

const TESTIS: { id: 't1' | 't2' | 't3'; initial: string }[] = [
    { id: 't1', initial: 'A' },
    { id: 't2', initial: 'S' },
    { id: 't3', initial: 'K' },
];

interface Props {
    onNext: () => void;
    onBack: () => void;
}

export default function S9Social({ onNext, onBack }: Props) {
    const { t } = useI18n();
    return (
        <Shell
            step={9}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={<PrimaryButton onClick={onNext}>{t('onb.next')}</PrimaryButton>}
        >
            <Eyebrow>{t('onb.s9.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s9.headline')}</Headline>
            <div className="onb-stack onb-testimonials">
                {TESTIS.map(({ id, initial }) => (
                    <article className="onb-testi" key={id}>
                        <div className="onb-testi-face" aria-hidden="true">{initial}</div>
                        <div className="onb-testi-text">
                            <div className="onb-testi-name">{t(`onb.s9.${id}.name` as Parameters<typeof t>[0])}</div>
                            <div className="onb-testi-quote">{t(`onb.s9.${id}.quote` as Parameters<typeof t>[0])}</div>
                        </div>
                    </article>
                ))}
            </div>
        </Shell>
    );
}
