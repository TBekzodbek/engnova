/**
 * S5 — Self-report level. Plain-language descriptions (not CEFR jargon).
 * "Bilmayman" branches to the mini-quiz (S6); everything else skips it.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, Card, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { SelfLevel } from '../state';

const LEVELS: SelfLevel[] = ['a0', 'a1', 'a2', 'b1', 'unsure'];

interface Props {
    value?: SelfLevel;
    onChange: (l: SelfLevel) => void;
    onNext: () => void;
    onBack: () => void;
}

export default function S5Level({ value, onChange, onNext, onBack }: Props) {
    const { t } = useI18n();
    return (
        <Shell
            step={5}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={onNext} disabled={value == null}>
                    {t('onb.next')}
                </PrimaryButton>
            }
        >
            <Eyebrow>{t('onb.s5.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s5.headline')}</Headline>
            <Support>{t('onb.s5.support')}</Support>
            <div className="onb-stack">
                {LEVELS.map((l) => (
                    <Card
                        key={l}
                        label={t(`onb.s5.${l}` as Parameters<typeof t>[0])}
                        sub={t(`onb.s5.${l}.sub` as Parameters<typeof t>[0])}
                        selected={value === l}
                        onClick={() => onChange(l)}
                    />
                ))}
            </div>
        </Shell>
    );
}
