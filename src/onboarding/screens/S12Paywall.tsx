/**
 * S12 Native Paywall — the last rung. Amber returns at ceremonial strength
 * one final time in onboarding: hero-scale verdict restatement + aspiration
 * bar echoing S7 + inoculation card.
 *
 * MVP scope: VISUAL ONLY. No native payment initiation. The value is the
 * inoculation card landing at the peak emotional moment ("RAVNAQ TALIM
 * AKADEMIYA = us"), and the verdict recap keeping the promise fresh. Users
 * tap "See plans" and land in Product → WebView → dashboard. The site's own
 * paywall + payment flow (paycom.uz / click.uz via Custom Tab) is unchanged.
 *
 * A future extension can bounce the CTA into a Custom Tab with an invoice URL
 * once the session-transfer + invoice-creation contract is ready. Today we
 * keep the surface simple and low-risk.
 */
import Shell from '../Shell';
import { Eyebrow, PrimaryButton } from '../primitives';
import { useI18n } from '../../i18n';
import type { LevelBand, Commitment } from '../state';
import { nextBand } from '../state';

interface Props {
    verdict?:    LevelBand;
    commitment?: Commitment;
    onDone: () => void;
    onBack: () => void;
}

const COMMITMENT_MINUTES: Record<Commitment, number> = { m5: 5, m10: 10, m15: 15, m20: 20 };

export default function S12Paywall({ verdict, commitment, onDone, onBack }: Props) {
    const { t } = useI18n();
    const band    = verdict ?? 'A2';
    const target  = nextBand(band);
    const minutes = commitment ? COMMITMENT_MINUTES[commitment] : 15;

    return (
        <Shell
            step={12}
            labeled
            hereBand={band}
            onSkip={onBack}
            skipLabel={t('onb.back')}
            cta={
                <PrimaryButton onClick={onDone}>
                    {t('onb.s12.cta')}
                </PrimaryButton>
            }
            subCta={
                <button type="button" className="onb-link-quiet" onClick={onDone}>
                    {t('onb.s12.later')}
                </button>
            }
        >
            <Eyebrow>{t('onb.s12.eyebrow')}</Eyebrow>

            {/* Hero: verdict at ceremonial size — the promise made large.
                Same serif face + amber underline as the S7 verdict badge, so
                the emotional beat carries across the flow. */}
            <div className="onb-s12-hero">
                <span className="onb-s12-hero-you">{t('onb.s12.hero.you')}</span>
                <span className="onb-s12-hero-band onb-badge-face">{band}</span>
                <span className="onb-s12-hero-arrow" aria-hidden="true">→</span>
                <span className="onb-s12-hero-band onb-badge-face">{target}</span>
            </div>

            {/* Aspiration bar — echoes S7's shape (amber left rule) with copy
                tied to the daily commitment the user chose on S10. */}
            <div className="onb-aspiration">
                {t('onb.s12.aspiration', { n: String(minutes), band: target })}
            </div>

            {/* 3 tier cards — VISUAL ONLY in MVP (no prices to avoid drift with
                the site). Middle tier gets amber outline + "Tavsiya" chip so
                the user still perceives a default recommendation. */}
            <div className="onb-s12-tiers">
                <div className="onb-s12-tier">
                    <span className="onb-s12-tier-name">{t('onb.s12.tier1.name')}</span>
                    <span className="onb-s12-tier-desc">{t('onb.s12.tier1.desc')}</span>
                </div>
                <div className="onb-s12-tier onb-s12-tier-recommended">
                    <span className="onb-s12-tier-badge onb-badge-face">{t('onb.s12.tier2.badge')}</span>
                    <span className="onb-s12-tier-name">{t('onb.s12.tier2.name')}</span>
                    <span className="onb-s12-tier-desc">{t('onb.s12.tier2.desc')}</span>
                </div>
                <div className="onb-s12-tier">
                    <span className="onb-s12-tier-name">{t('onb.s12.tier3.name')}</span>
                    <span className="onb-s12-tier-desc">{t('onb.s12.tier3.desc')}</span>
                </div>
            </div>

            {/* Inoculation card — the single largest silent-bounce fix.
                Users will see "RAVNAQ TALIM AKADEMIYA" on Payme/Click's own
                page (both use the legal merchant entity name). Prep them
                here, at the emotional peak, in our warm-navy tone. */}
            <div className="onb-inoculation">
                <span className="onb-inoculation-icon" aria-hidden="true">i</span>
                <span className="onb-inoculation-text">
                    {t('onb.s12.inoculation.pre')}
                    <strong>{t('onb.s12.inoculation.merchant')}</strong>
                    {t('onb.s12.inoculation.post')}
                </span>
            </div>

            <p className="onb-terms onb-s12-footer">{t('onb.s12.footer')}</p>
        </Shell>
    );
}
