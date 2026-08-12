/**
 * Onboarding primitives — small components shared across all 10 screens.
 * Kept in one file because they're tiny and always used together; splitting
 * them into separate files would create import noise for zero benefit.
 */
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import './primitives.css';

// ── Eyebrow ──────────────────────────────────────────────────────────────
// The tiny uppercase label above each screen's headline. Establishes the
// hierarchy without shouting. E.g. "3 / 10" or "Yo'nalish".
export function Eyebrow({ children }: { children: ReactNode }) {
    return <div className="onb-eyebrow">{children}</div>;
}

// ── Headline ─────────────────────────────────────────────────────────────
// Screen headline. NOT the display face — that's reserved for level badges
// only. Uses the body face at a larger weight so screens don't compete
// with the verdict moment.
export function Headline({ children }: { children: ReactNode }) {
    return <h1 className="onb-headline">{children}</h1>;
}

// ── Support text ─────────────────────────────────────────────────────────
export function Support({ children }: { children: ReactNode }) {
    return <p className="onb-support">{children}</p>;
}

// ── Card (tap-selectable option) ─────────────────────────────────────────
// The workhorse. Used for goal options, deadline options, level self-report,
// commitment. Emoji/icon on the left, label + optional sub-label in the
// middle, subtle amber check on the right when selected.
interface CardProps {
    icon?:     ReactNode;
    label:     ReactNode;
    sub?:      ReactNode;
    selected?: boolean;
    onClick:   () => void;
    disabled?: boolean;
}
export function Card({ icon, label, sub, selected, onClick, disabled }: CardProps) {
    return (
        <button
            type="button"
            className={`onb-card${selected ? ' onb-card-selected' : ''}`}
            onClick={onClick}
            disabled={disabled}
            aria-pressed={selected}
        >
            {icon && <span className="onb-card-icon" aria-hidden="true">{icon}</span>}
            <span className="onb-card-text">
                <span className="onb-card-label">{label}</span>
                {sub && <span className="onb-card-sub">{sub}</span>}
            </span>
            <span
                className="onb-card-mark"
                aria-hidden="true"
                data-selected={selected ? 'true' : 'false'}
            />
        </button>
    );
}

// ── PrimaryButton — the amber "Davom etish" ──────────────────────────────
// Deliberately amber-outlined-on-dark, not solid amber. Amber solid on
// #FFB86B is unreadable with dark text and blinding with light. Outline +
// filled-on-hover threads that needle.
interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    variant?: 'primary' | 'ghost';
}
export function PrimaryButton({
    children, variant = 'primary', className, ...rest
}: PrimaryButtonProps) {
    return (
        <button
            type="button"
            className={`onb-btn onb-btn-${variant}${className ? ' ' + className : ''}`}
            {...rest}
        >
            {children}
        </button>
    );
}

// ── VerdictBadge — the moment the whole flow builds to (S7) ──────────────
// Big serif-display CEFR band (A2 / B1 / etc.) with a subtle amber glow
// underneath. Uses the display face — this is the ONLY place display type
// shows up in the whole onboarding, which is why it lands.
export function VerdictBadge({ band }: { band: string }) {
    return (
        <div
            className="onb-verdict"
            style={{ '--verdict-glow-x': '50%' } as CSSProperties}
            aria-live="polite"
        >
            <span className="onb-verdict-band onb-badge-face">{band}</span>
            <span className="onb-verdict-halo" aria-hidden="true" />
        </div>
    );
}
