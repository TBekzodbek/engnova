/**
 * SplashCover — the seamless-boot mask.
 *
 * The native Android SplashScreen (styles.xml @drawable/ic_splash) is dismissed
 * automatically the moment React's first frame renders. On cold-open, that
 * happens FAR before bootRoute() has decided which screen to show — meaning
 * without this cover, the user sees a black flash → LoginScreen briefly →
 * ProductScreen. This component is that flash killer: identical bg color +
 * centred neon star, rendered until bootRoute resolves.
 *
 * Matches:
 *   - windowSplashScreenBackground #08080C (values/colors.xml)
 *   - ic_splash.xml layout (star at centre, halo aura)
 * so the fade from native splash → SplashCover → real UI is one continuous
 * moment — the user never sees the seam.
 */
export default function SplashCover() {
    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 999,
                background:
                    'radial-gradient(60% 55% at 50% 46%, rgba(85,75,231,0.28), transparent 70%), #08080C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'splash-cover-in 200ms ease-out both',
            }}
            aria-hidden="true"
        >
            <svg viewBox="0 0 108 108" width="96" height="96" role="presentation">
                <defs>
                    <radialGradient id="sc-halo" cx="0.5" cy="0.46" r="0.5">
                        <stop offset="0"    stopColor="#F5F8FF" stopOpacity="0.95" />
                        <stop offset="0.10" stopColor="#C7C8FF" stopOpacity="0.85" />
                        <stop offset="0.28" stopColor="#7B72EE" stopOpacity="0.55" />
                        <stop offset="0.55" stopColor="#4136C4" stopOpacity="0.30" />
                        <stop offset="0.85" stopColor="#1EA8FF" stopOpacity="0.10" />
                        <stop offset="1"    stopColor="#1EA8FF" stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id="sc-star" x1="0" y1="0" x2="0.7" y2="1">
                        <stop offset="0" stopColor="#FFFFFF" />
                        <stop offset="1" stopColor="#C7D6FF" />
                    </linearGradient>
                </defs>
                <rect width="108" height="108" fill="url(#sc-halo)" />
                <path
                    d="M 54 22 L 61.64 41.36 L 81 49 L 61.64 56.64 L 54 76 L 46.36 56.64 L 27 49 L 46.36 41.36 Z"
                    fill="url(#sc-star)"
                />
                <circle cx="54" cy="49" r="1.5" fill="#FFFFFF" />
            </svg>
            <style>{`@keyframes splash-cover-in { from { opacity: 0; } to { opacity: 1; } }`}</style>
        </div>
    );
}
