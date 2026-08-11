/**
 * CefrLadder — the ladder-of-levels mark for the CEFR card.
 * Five rungs A1 → C1, with B2 highlighted in the track tint (the exam-day
 * target most Uzbek IELTS-adjacent learners aim at). Line-only, no fills —
 * sits calmly against the surface, doesn't compete with the track name.
 */
export default function CefrLadder({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 96 96"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            {/* Ladder rails */}
            <line x1="26" y1="14" x2="26" y2="82" opacity="0.4" />
            <line x1="70" y1="14" x2="70" y2="82" opacity="0.4" />
            {/* Rungs, faint bottom → strong top */}
            <line x1="26" y1="74" x2="70" y2="74" opacity="0.35" />
            <line x1="26" y1="60" x2="70" y2="60" opacity="0.5" />
            <line x1="26" y1="46" x2="70" y2="46" opacity="0.65" />
            {/* B2 rung — highlighted */}
            <line x1="20" y1="32" x2="76" y2="32" stroke="var(--track-shell,currentColor)" strokeWidth="2.4" />
            <line x1="26" y1="18" x2="70" y2="18" opacity="0.35" />
            {/* Level labels */}
            <text x="6"  y="76" fontFamily="var(--font-stack)" fontSize="7"  fontWeight="600" fill="currentColor" opacity="0.5">A1</text>
            <text x="6"  y="62" fontFamily="var(--font-stack)" fontSize="7"  fontWeight="600" fill="currentColor" opacity="0.55">A2</text>
            <text x="6"  y="48" fontFamily="var(--font-stack)" fontSize="7"  fontWeight="600" fill="currentColor" opacity="0.65">B1</text>
            <text x="6"  y="34" fontFamily="var(--font-stack)" fontSize="7.5" fontWeight="700" fill="var(--track-shell,currentColor)">B2</text>
            <text x="6"  y="20" fontFamily="var(--font-stack)" fontSize="7"  fontWeight="600" fill="currentColor" opacity="0.35">C1</text>
        </svg>
    );
}
