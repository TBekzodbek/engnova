/**
 * OnboardingShell — the layout wrapper every S1..S12 screen sits inside.
 *
 * Responsibilities: place the Spine on the left, the language chip in the
 * top-right, a content column in the middle, and a persistent CTA area at
 * the bottom (safe-area padded so it never hides behind the gesture bar).
 *
 * Content itself is passed as children; screens keep their own composition
 * of heading + input + micro-copy. The shell just enforces rhythm, safe
 * areas, and the fade-in-from-bottom entrance animation per screen change.
 */
import type { ReactNode } from 'react';
import Spine from './Spine';
import LanguageChip from '../components/LanguageChip';
import './Shell.css';

interface ShellProps {
    /** 1..12 — current step, drives Spine + entrance animation reset key. */
    step: number;
    /** Show CEFR band labels on the Spine (S7+). */
    labeled?: boolean;
    /** Which band to mark as "here" on the Spine (S7+). */
    hereBand?: 'A0' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
    /** Content column — usually eyebrow + headline + inputs. */
    children: ReactNode;
    /** Bottom CTA — a single primary button, or a row for back+forward. */
    cta?: ReactNode;
    /** Optional secondary link under the CTA (e.g. "Show me the other track"). */
    subCta?: ReactNode;
    /** Skip button in the top-left. Used on screens 2, 9 where advancing without answering is allowed. */
    onSkip?: () => void;
    /** Label for the skip button ("Skip"/"O'tkazib yuborish"/etc). */
    skipLabel?: string;
}

export default function Shell({
    step, labeled, hereBand, children, cta, subCta, onSkip, skipLabel,
}: ShellProps) {
    return (
        <div className="onb" data-step={step}>
            <Spine step={step} labeled={labeled} hereBand={hereBand} />

            <header className="onb-topbar">
                {onSkip ? (
                    <button
                        type="button"
                        className="onb-skip"
                        onClick={onSkip}
                        aria-label={skipLabel}
                    >
                        {skipLabel}
                    </button>
                ) : <span aria-hidden="true" />}
                <LanguageChip />
            </header>

            {/* Content column — keyed on step so React remounts and the
                fade-in-from-bottom entrance animation replays every screen. */}
            <main className="onb-body" key={step}>
                {children}
            </main>

            <footer className="onb-footer">
                {cta}
                {subCta && <div className="onb-sub-cta">{subCta}</div>}
            </footer>
        </div>
    );
}
