/**
 * Engnova track definitions
 * ─────────────────────────
 * Two independent products the shell can host. The chooser saves the selection;
 * ProductScreen loads that track's live site in the in-app webview.
 *
 * Copy lives in i18n JSON files — this file only carries structure (URLs,
 * host allowlists, path bounce patterns, tint tokens) and keys used to look
 * strings up.
 *
 * Old inline taglines removed 2026-08-11 (the previous 'IELTS 9.0 gacha
 * tayyorgarlik' violated the no-outcome-guarantees rule and was a Play policy
 * risk — see brief-chooser-copy-ux §0). Never reintroduce.
 */

export type Track = 'cefr' | 'ielts';

export interface TrackDef {
    id: Track;
    /** Live site loaded in the in-app webview. */
    url: string;
    /** Where an unpaid user is sent to activate — opened in the SYSTEM browser,
     *  never as an in-app purchase (Google Play billing-policy compliance). */
    activateUrl: string;
    /**
     * Hosts (bare or subdomain-parent) whose pages LOAD inside the app webview.
     * Anything not on this list is routed to the system browser by the native
     * plugin (WebViewClient.shouldOverrideUrlLoading — see EngnovaWebViewPlugin).
     * Match is exact OR endsWith(".<host>"), so "cefracademy.uz" matches both
     * `cefracademy.uz` and `www.cefracademy.uz`, but not `evil-cefracademy.uz`.
     */
    allowedHosts: string[];
    /**
     * Payment/checkout hosts. A hit here is bounced OUT to a Chrome Custom Tab
     * (shared cookie jar, warm-up capable) — payment NEVER renders inside the
     * app, per Google Play's billing-policy compliance rule. Same match rules
     * as allowedHosts.
     */
    paymentHosts: string[];
    /**
     * Path-based bounce patterns: `"host/pathprefix"` entries whose match ALSO
     * routes to a Chrome Custom Tab, same as paymentHosts. Used to redirect
     * top-level marketing PRICING pages (which live on our own hosts, so
     * paymentHosts can't catch them) so a Play reviewer never sees digital-
     * goods prices rendered inside the app shell. Belt-and-braces on top of
     * the real defense (Google Play Billing is unavailable in Uzbekistan for
     * paycom.uz / click.uz, so no policy violation is possible).
     *
     * Deliberately does NOT include /dashboard/pricing — that's the in-app
     * paywall path for expired users; bouncing it would break the renewal
     * flow. The pay-click on that page already lands on paycom.uz / click.uz,
     * which paymentHosts bounces out.
     */
    paymentPatterns: string[];
    /** CSS custom-property names for this track's shell tints (defined in globals.css). */
    tint: {
        shell:     string;   // solid, for status bar / progress bar / CTA
        shellSoft: string;   // low-alpha for backgrounds / glows
        shellGlow: string;   // box-shadow value
    };
    /** i18n key roots — the actual strings live in src/i18n/{lang}.json. */
    i18n: {
        name:     'track.cefr.name'     | 'track.ielts.name';
        tagline:  'track.cefr.tagline'  | 'track.ielts.tagline';
        features: readonly [string, string, string];
        audience: 'track.cefr.audience' | 'track.ielts.audience';
    };
}

export const TRACKS: Record<Track, TrackDef> = {
    cefr: {
        id: 'cefr',
        url: 'https://cefracademy.uz',
        activateUrl: 'https://cefracademy.uz',
        allowedHosts: ['cefracademy.uz', 'supabase.co', 'googleusercontent.com'],
        paymentHosts: ['paycom.uz', 'checkout.paycom.uz', 'click.uz', 'my.click.uz'],
        paymentPatterns: ['cefracademy.uz/pricing'],
        tint: {
            shell:     'var(--track-cefr-shell)',
            shellSoft: 'var(--track-cefr-shell-soft)',
            shellGlow: 'var(--track-cefr-shell-glow)',
        },
        i18n: {
            name:     'track.cefr.name',
            tagline:  'track.cefr.tagline',
            features: ['track.cefr.feature.1', 'track.cefr.feature.2', 'track.cefr.feature.3'] as const,
            audience: 'track.cefr.audience',
        },
    },
    ielts: {
        id: 'ielts',
        url: 'https://ieltslevel.uz',
        activateUrl: 'https://ieltslevel.uz',
        allowedHosts: ['ieltslevel.uz', 'supabase.co', 'vercel.app'],
        paymentHosts: [
            'paycom.uz', 'checkout.paycom.uz',
            'click.uz', 'my.click.uz',
            'stripe.com', 'checkout.stripe.com', 'js.stripe.com',
        ],
        // Next.js locale routing serves /pricing under each locale prefix,
        // hence three entries. If a new locale ships, add it here.
        paymentPatterns: [
            'ieltslevel.uz/pricing',
            'ieltslevel.uz/en/pricing',
            'ieltslevel.uz/ru/pricing',
        ],
        tint: {
            shell:     'var(--track-ielts-shell)',
            shellSoft: 'var(--track-ielts-shell-soft)',
            shellGlow: 'var(--track-ielts-shell-glow)',
        },
        i18n: {
            name:     'track.ielts.name',
            tagline:  'track.ielts.tagline',
            features: ['track.ielts.feature.1', 'track.ielts.feature.2', 'track.ielts.feature.3'] as const,
            audience: 'track.ielts.audience',
        },
    },
};

// ── Remembered track choice (switchable, not hardcoded at install) ───────────
const TRACK_KEY = 'engnova.track';

export function getSavedTrack(): Track | null {
    try {
        const t = localStorage.getItem(TRACK_KEY);
        return t === 'cefr' || t === 'ielts' ? t : null;
    } catch {
        return null;
    }
}

export function saveTrack(t: Track): void {
    try { localStorage.setItem(TRACK_KEY, t); } catch { /* ignore */ }
}

export function clearTrack(): void {
    try { localStorage.removeItem(TRACK_KEY); } catch { /* ignore */ }
}
