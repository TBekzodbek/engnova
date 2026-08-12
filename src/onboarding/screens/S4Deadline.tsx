/**
 * S4 — Deadline / urgency. Feeds pace + the paywall's "reach X in Y" line.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Card, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { Deadline } from '../state';

const DEADLINES: Deadline[] = ['in1', 'in3', 'in6', 'later'];

interface Props {
    value?: Deadline;
    onChange: (d: Deadline) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function S4Deadline({ value, onChange, onNext, onBack }: Props) {
    const { t } = useI18n();
    return (
        <Shell
            step={4}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={onNext} disabled={value == null}>
                    {t('onb.next')}
                </PrimaryButton>
            }
        >
            <Eyebrow>{t('onb.s4.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s4.headline')}</Headline>
            <div className="onb-stack">
                {DEADLINES.map((d) => (
                    <Card
                        key={d}
                        label={t(`onb.s4.deadline.${d}` as Parameters<typeof t>[0])}
                        sub={t(`onb.s4.deadline.${d}.sub` as Parameters<typeof t>[0])}
                        selected={value === d}
                        onClick={() => onChange(d)}
                    />
                ))}
            </div>
        </Shell>
    );
}
