/**
 * Spine — the signature element of Engnova onboarding.
 *
 * A slim amber column down the left edge that fills from bottom-up as the
 * user progresses through the 12 screens. NOT a progress bar (which the
 * user has seen a thousand times) — this is content. On the verdict screen
 * (S7) it reveals CEFR band labels (A0 → C1) aligned to the dot positions
 * so the user sees their level on a real ladder, not an abstract chart.
 *
 * Why amber (#FFB86B): every English-learning app in this category lives in
 * green / red / corporate blue / plain white. Amber-on-dark-navy reads as
 * "study lamp, highlighter pen, patient warmth." If Engnova gets one memory
 * hook, this is it.
 */
import type { CSSProperties } from 'react';
import './Spine.css';

interface SpineProps {
    /** 1..12 — which step the user is currently ON (that step's dot is highlighted). */
    step: number;
    /** Total steps (default 12). Override for stub flows. */
    total?: number;
    /**
     * When true, the dot labels (A0/A1/A2/B1/B2/C1) render alongside the six
     * CEFR-aligned positions. Only true on the verdict screen (S7) and beyond —
     * the reveal is the "aha, this ladder is MY ladder" moment.
     */
    labeled?: boolean;
    /** Which CEFR band to visually mark as "you are here". Only shown when labeled. */
    hereBand?: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
}

/**
 * Six CEFR band labels mapped to fixed vertical positions across the 12
 * dots so the same spine that shows step progress ALSO shows the level
 * ladder on S7+. Positions 2, 4, 6, 8, 10, 12 → A0..C1 respectively.
 * (Not 1..6 because we want visual breathing room between the ladder rungs
 * and the top/bottom safe-area edges.)
 */
const BAND_AT_STEP: Record<number, 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1'> = {
    2:  'A0',
    4:  'A1',
    6:  'A2',
    8:  'B1',
    10: 'B2',
    12: 'C1',
};

export default function Spine({ step, total = 12, labeled = false, hereBand }: SpineProps) {
    const dots = Array.from({ length: total }, (_, i) => i + 1);
    return (
        <aside
            className="spine"
            aria-label={`Onboarding progress: step ${step} of ${total}`}
            style={{ '--spine-fill-pct': `${((step - 1) / (total - 1)) * 100}%` } as CSSProperties}
        >
            {/* The continuous amber fill — visualizes % progress as a rising
                warm column behind the dots. Height animates on state change. */}
            <div className="spine-fill" aria-hidden="true" />
            <ol className="spine-dots" aria-hidden="true">
                {dots.map((n) => {
                    const state =
                        n < step  ? 'past' :
                        n === step ? 'current' :
                                     'future';
                    const band = BAND_AT_STEP[n];
                    const showLabel = labeled && band != null;
                    const isHereBand = showLabel && band === hereBand;
                    return (
                        <li
                            key={n}
                            className={`spine-dot spine-dot-${state}${isHereBand ? ' spine-dot-here' : ''}`}
                        >
                            {showLabel && (
                                <span className="spine-dot-label onb-badge-face">
                                    {band}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </aside>
    );
}
