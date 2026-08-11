/**
 * IeltsArc — a band-score dial pointing at 6.5 (the common IELTS target).
 * Half-arc from 4.0 to 9.0, with tick marks; the "needle" is a track-tinted
 * chord terminating at 6.5. No band promises — 6.5 is where the arc's meta
 * label sits, not a promise the shell makes.
 */
export default function IeltsArc({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            viewBox="0 0 96 96"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
        >
            {/* Track (gray semi-circle) */}
            <path d="M 12 68 A 36 36 0 0 1 84 68" strokeWidth="1.6" opacity="0.3" />
            {/* Progress arc (0..6.5 out of 4..9 = 50% of the arc) */}
            <path
                d="M 12 68 A 36 36 0 0 1 48 32"
                strokeWidth="3.2"
                stroke="var(--track-shell,currentColor)"
            />
            {/* Ticks at 4.0, 5.0, 6.0, 6.5, 7.0, 8.0, 9.0 (angles derived on the arc) */}
            {[
                { a: 180, o: 0.35 },  // 4.0
                { a: 162, o: 0.35 },  // 5.0
                { a: 144, o: 0.35 },  // 6.0
                { a: 135, o: 0.9,  hi: true }, // 6.5
                { a: 126, o: 0.35 },  // 7.0
                { a: 108, o: 0.35 },  // 8.0
                { a:  90, o: 0.35 },  // 9.0 (right end)
            ].map((tk, i) => {
                const r1 = 36, r2 = 42;
                const rad = (tk.a * Math.PI) / 180;
                const cx = 48, cy = 68;
                const x1 = cx + r1 * Math.cos(rad);
                const y1 = cy - r1 * Math.sin(rad);
                const x2 = cx + r2 * Math.cos(rad);
                const y2 = cy - r2 * Math.sin(rad);
                return (
                    <line
                        key={i}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        strokeWidth={tk.hi ? 2.2 : 1.4}
                        stroke={tk.hi ? 'var(--track-shell,currentColor)' : 'currentColor'}
                        opacity={tk.o}
                    />
                );
            })}
            {/* Endpoint dot at 6.5 */}
            <circle cx="48" cy="32" r="3" fill="var(--track-shell,currentColor)" stroke="none" />
            {/* Center label */}
            <text
                x="48" y="60"
                textAnchor="middle"
                fontFamily="var(--font-stack)"
                fontSize="14"
                fontWeight="700"
                fill="currentColor"
                opacity="0.9"
            >6.5</text>
            <text
                x="48" y="72"
                textAnchor="middle"
                fontFamily="var(--font-stack)"
                fontSize="6"
                fontWeight="600"
                letterSpacing="0.1em"
                fill="currentColor"
                opacity="0.5"
            >BAND</text>
        </svg>
    );
}
