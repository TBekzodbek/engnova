/**
 * S8 — Track confirmation (the invisible chooser). We already know which
 * track fits from S3's goal answer. Show it as a RECOMMENDATION with an
 * escape hatch, not a cold fork.
 */
import Shell from '../Shell';
import { Eyebrow, Headline, Support, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { Track } from '../../lib/tracks';

interface Props {
    recommended: Track;
    onConfirm: (t: Track) => void;
    onBack: () => void;
}

export default function S8Track({ recommended, onConfirm, onBack }: Props) {
    const { t } = useI18n();
    const other: Track = recommended === 'cefr' ? 'ielts' : 'cefr';
    return (
        <Shell
            step={8}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={() => onConfirm(recommended)}>
                    {t('onb.next')}
                </PrimaryButton>
            }
            subCta={
                <button type="button" onClick={() => onConfirm(other)}>
                    {t(`onb.s8.altLink.${recommended}` as Parameters<typeof t>[0])}
                </button>
            }
        >
            <Eyebrow>{t('onb.s8.eyebrow')}</Eyebrow>
            <Headline>{t(`onb.s8.headline.${recommended}` as Parameters<typeof t>[0])}</Headline>
            <Support>{t(`onb.s8.body.${recommended}` as Parameters<typeof t>[0])}</Support>
        </Shell>
    );
}
