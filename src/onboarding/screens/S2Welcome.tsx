/**
 * S2 — Warm welcome. Anchors the tone: "30 seconds, not a form." Sets
 * expectations so drop-off after this screen is minimal. One CTA, no branch.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';

export default function S2Welcome({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
    const { t } = useI18n();
    return (
        <Shell
            step={2}
            onSkip={onSkip}
            skipLabel={t('onb.skip')}
            cta={<PrimaryButton onClick={onNext}>{t('onb.continue')}</PrimaryButton>}
        >
            <Eyebrow>{t('onb.s2.eyebrow')}</Eyebrow>
            <Headline>{t('onb.s2.headline')}</Headline>
            <Support>{t('onb.s2.support')}</Support>
        </Shell>
    );
}
