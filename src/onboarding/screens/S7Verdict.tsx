/**
 * S7 — Verdict + level badge. The aspiration hook. Big serif band, warm
 * amber halo, plain-language description of what the level means for THEM,
 * plus the "here → next in X months" promise built from S4's deadline.
 *
 * This is the FIRST screen where the Spine reveals its band labels (A0..C1)
 * — the ladder becomes personalized.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, VerdictBadge, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import { nextBand, type LevelBand, type Deadline } from '../state';

/**
 * Translate the S4 deadline choice into an i18n months-text token used inside
 * the aspiration sentence. When the user picked "later" we fall back to
 * a soft "a few months" line rather than a specific number.
 */
function deadlineToMonthsKey(d: Deadline | undefined): 'onb.months.1' | 'onb.months.3' | 'onb.months.6' | 'onb.months.long' {
    switch (d) {
        case 'in1':   return 'onb.months.1';
        case 'in3':   return 'onb.months.3';
        case 'in6':   return 'onb.months.6';
        case 'later':
        default:      return 'onb.months.long';
    }
}

interface Props {
    band:     LevelBand;
    deadline?: Deadline;
    onNext: () => void;
}

export default function S7Verdict({ band, deadline, onNext }: Props) {
    const { t } = useI18n();
    const next = nextBand(band);
    const monthsText = t(deadlineToMonthsKey(deadline));
    return (
        <Shell
            step={7}
            labeled
            hereBand={band}
            cta={<PrimaryButton onClick={onNext}>{t('onb.next')}</PrimaryButton>}
        >
            <Eyebrow>{t('onb.s7.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s7.headline')}</Headline>
            <VerdictBadge band={band} />
            <Support>{t(`onb.s7.body.${band}` as Parameters<typeof t>[0])}</Support>
            <div className="onb-aspiration">
                {t('onb.s7.aspiration', { nextBand: next, monthsText })}
            </div>
        </Shell>
    );
}
