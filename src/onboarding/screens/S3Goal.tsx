/**
 * S3 — Goal question. THE most important screen: the answer routes the
 * whole rest of the flow (which product recommendation, which paywall
 * copy). One choice, big cards, clear pictograms.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Card, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { Goal } from '../state';

const GOALS: { key: Goal; icon: string }[] = [
    { key: 'ielts',  icon: '🎓' },
    { key: 'dtm',    icon: '📚' },
    { key: 'work',   icon: '💼' },
    { key: 'travel', icon: '✈️' },
    { key: 'zero',   icon: '🌱' },
];

interface S3Props {
    value?: Goal;
    onChange: (g: Goal) => void;
    onNext: () => void;
}

export default function S3Goal({ value, onChange, onNext }: S3Props) {
    const { t } = useI18n();
    return (
        <Shell
            step={3}
            cta={
                <PrimaryButton onClick={onNext} disabled={value == null}>
                    {t('onb.next')}
                </PrimaryButton>
            }
        >
            <Eyebrow>{t('onb.s3.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s3.headline')}</Headline>
            <div className="onb-stack">
                {GOALS.map(({ key, icon }) => (
                    <Card
                        key={key}
                        icon={<span>{icon}</span>}
                        label={t(`onb.s3.goal.${key}` as Parameters<typeof t>[0])}
                        sub={t(`onb.s3.goal.${key}.sub` as Parameters<typeof t>[0])}
                        selected={value === key}
                        onClick={() => onChange(key)}
                    />
                ))}
            </div>
        </Shell>
    );
}
