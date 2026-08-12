/**
 * S10 — Daily commitment. Final onboarding question before the shell hands
 * off to LoginScreen. Sets the streak's daily target so Day 1's counter
 * starts with meaning.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, Card, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { Commitment } from '../state';

const COMMITMENTS: Commitment[] = ['m5', 'm10', 'm15', 'm20'];

interface Props {
    value?: Commitment;
    onChange: (c: Commitment) => void;
    onDone: () => void;
    onBack: () => void;
}

export default function S10Commitment({ value, onChange, onDone, onBack }: Props) {
    const { t } = useI18n();
    return (
        <Shell
            step={10}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={onDone} disabled={value == null}>
                    {t('onb.continue')}
                </PrimaryButton>
            }
        >
            <Eyebrow>{t('onb.s10.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s10.headline')}</Headline>
            <Support>{t('onb.s10.support')}</Support>
            <div className="onb-stack">
                {COMMITMENTS.map((c) => (
                    <Card
                        key={c}
                        label={t(`onb.s10.${c}` as Parameters<typeof t>[0])}
                        sub={t(`onb.s10.${c}.sub` as Parameters<typeof t>[0])}
                        selected={value === c}
                        onClick={() => onChange(c)}
                    />
                ))}
            </div>
        </Shell>
    );
}
