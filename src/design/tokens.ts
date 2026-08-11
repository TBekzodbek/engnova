/**
 * Engnova design tokens
 * ─────────────────────
 * Single source of truth for color, radii, spacing, motion, type.
 * Every shell surface (chooser, product host, loading, error, dialogs)
 * references these — never hard-coded hex.
 *
 * Palette rationale (from brand + live-sites research 2026-08-11):
 *  - Shared indigo spine ~#554be7 = midpoint of CEFR #5b50e8 and IELTS #4f46e5,
 *    so the shell reads as in-family with both underlying products.
 *  - IELTS-style hairline borders (not CEFR's heavier slate edges) so the
 *    shell holds a lobby-quiet discipline that doesn't fight either product.
 *  - Per-track shell tints (`--track-cefr-shell` / `--track-ielts-shell`)
 *    are exposed as separate tokens so status-bar / progress-bar / chooser
 *    glow can adopt the active track's accent (owner picked per-track tinting).
 *
 * Motion follows the IELTS ease `cubic-bezier(.22,1,.36,1)` (quart-out) at
 * ~460ms for signature transitions — no ambient orbs, no shimmer at shell
 * layer (both products spend their own motion budgets).
 */

export const tokens = {
    color: {
        // ── Dark theme (default; system-preference-aware) ──────────────────
        dark: {
            bg:            '#08080C',   // deeper than IELTS's #0a0d16 — reads AMOLED-crisp
            surface:       '#111219',   // card background
            surfaceHi:     '#1A1B25',   // elevated card / dialog
            line:          '#232435',   // hairline border (IELTS-style)
            lineHi:        '#343550',   // divider
            ink:           '#EDEFF6',   // primary text
            muted:         '#A0A7BD',   // secondary text
            subtle:        '#6B7088',   // tertiary / labels

            accent:        '#7B72EE',   // indigo, dark-theme readable
            accentSoft:    '#7B72EE1F', // ~12% for tints
            accentGlow:    '0 12px 30px -8px #554be780',

            success:       '#3ECB8C',
            warning:       '#F0A63C',
            danger:        '#F2585E',
        },
        // ── Light theme ────────────────────────────────────────────────────
        light: {
            bg:            '#F6F7FB',   // canvas
            surface:       '#FFFFFF',   // card
            surfaceHi:     '#FCFCFF',   // elevated
            line:          '#E9EAF1',   // hairline
            lineHi:        '#D2D5E2',
            ink:           '#0B1020',
            muted:         '#565E72',
            subtle:        '#9098AC',

            accent:        '#554BE7',   // the shared indigo spine
            accentSoft:    '#554BE71A',
            accentGlow:    '0 12px 30px -8px #554be750',

            success:       '#1F9D6B',
            warning:       '#D98A1F',
            danger:        '#E0464C',
        },
        // ── Per-track shell tints (theme-neutral, only used as accents) ────
        // Rendered on top of shell chrome (status bar, progress bar, chooser
        // card glow) when a track is chosen — brings the shell into visual
        // continuity with the product about to open.
        track: {
            cefr: {
                shell:      '#5B50E8',   // CEFR primary
                shellSoft:  '#5B50E829',
                shellGlow:  '0 20px 40px -12px #5B50E866',
            },
            ielts: {
                shell:      '#4F46E5',   // IELTS accent-deep (its dark-mode reads more indigo than cyan)
                shellSoft:  '#4F46E529',
                shellGlow:  '0 20px 40px -12px #4F46E566',
            },
        },
    },

    // ── Corners: sit between IELTS's fine ladder and CEFR's chunky one ────
    radius: {
        sm:   '8px',
        md:   '12px',
        lg:   '16px',
        xl:   '20px',   // signature shell radius (cards, dialogs)
        full: '999px',
    },

    // ── 4-step space scale (matches Tailwind rhythm without the whole set) ─
    space: {
        xs:   '4px',
        sm:   '8px',
        md:   '16px',
        lg:   '24px',
        xl:   '32px',
        xxl:  '48px',
    },

    // ── Motion (IELTS quart-out ease; three durations) ─────────────────────
    motion: {
        fast:   '160ms',
        base:   '260ms',
        slow:   '460ms',   // signature chooser→product hand-off
        ease:   'cubic-bezier(0.22, 1, 0.36, 1)',
        easeIn: 'cubic-bezier(0.32, 0, 0.67, 0)',
    },

    // ── Type scale (system stack; Inter Variable can replace later) ────────
    type: {
        stack:
            "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        stackMono:
            "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
        // rem-based; assumes html font-size: 16px
        size: {
            xs:   '0.75rem',   // 12
            sm:   '0.8125rem', // 13 — footer trust link
            base: '0.9375rem', // 15 — body / feature bullets
            md:   '1rem',      // 16 — card titles
            lg:   '1.125rem',  // 18 — subheads
            xl:   '1.5rem',    // 24 — track name
            xxl:  '1.875rem',  // 30 — hero
            display: '2.25rem',// 36 — display / splash mark
        },
        weight: {
            regular:   400,
            medium:    500,
            semibold:  600,
            bold:      700,
            heavy:     800,
        },
        lh: {
            tight:  1.15,   // hero / display
            snug:   1.3,    // subheads
            normal: 1.5,    // body
        },
        // Inter-style feature-settings for narrow ambiguity (l/i/1)
        featureSettings: "'cv11', 'ss01'",
        tracking: {
            tight:  '-0.01em',
            normal: '0',
            wide:   '0.06em',   // small-caps kickers
        },
    },
} as const;

export type Tokens = typeof tokens;
