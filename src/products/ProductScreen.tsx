/**
 * ProductScreen — the host that opens the chosen track's live site in an
 * in-app webview. Sits under the webview as a fallback surface.
 *
 * States shown on THIS screen (all use track-tinted CTAs / progress):
 *   • loading (default while webview boots on native)
 *   • slow-loading (kicker line changes after ~4s)
 *   • error (webview reported an error OR 10s no first-paint timeout)
 *   • offline (Capacitor Network says disconnected)
 *   • web-preview fallback (non-native; shows explainer + open-in-browser)
 *
 * The switch-track confirmation dialog lives in a sibling component so it can
 * overlay any of the above.
 *
 * Note: proper webview open/error hooks arrive in Phase 2 (ticket 10 — bridge
 * WebView plugin). For v1 this screen keeps a graceful 10s timeout so the
 * user is never stranded on a spinner.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ArrowLeftRight, ExternalLink, RefreshCw, WifiOff } from 'lucide-react';
import { TRACKS, type Track } from '../lib/tracks';
import { isNative, openTrackWebView } from '../lib/webview';
import { useI18n } from '../i18n';
import ConfirmDialog from '../components/ConfirmDialog';
import './ProductScreen.css';

type Phase = 'loading' | 'slow' | 'error' | 'offline' | 'webPreview';

const SLOW_MS  = 4000;
const TIMEOUT_MS = 10000;

export default function ProductScreen({ track, onSwitchTrack }: { track: Track; onSwitchTrack: () => void }) {
    const def = TRACKS[track];
    const { t } = useI18n();
    const [native] = useState(isNative);
    const [phase, setPhase] = useState<Phase>(native ? 'loading' : 'webPreview');
    const [confirmingSwitch, setConfirmingSwitch] = useState(false);
    const cleanupRef = useRef<null | (() => void)>(null);
    const slowTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const failTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [reloadKey, setReloadKey] = useState(0);

    // ── Open the webview + set up progressive fallbacks ─────────────────────
    useEffect(() => {
        if (!native) return;
        let disposed = false;
        setPhase('loading');
        slowTimer.current = setTimeout(() => { if (!disposed) setPhase(p => p === 'loading' ? 'slow' : p); }, SLOW_MS);
        failTimer.current = setTimeout(() => { if (!disposed) setPhase(p => (p === 'loading' || p === 'slow') ? 'error' : p); }, TIMEOUT_MS);

        openTrackWebView(track)
            .then((fn) => { if (disposed) fn(); else cleanupRef.current = fn; })
            .catch(() => { if (!disposed) setPhase('error'); });

        return () => {
            disposed = true;
            if (slowTimer.current) clearTimeout(slowTimer.current);
            if (failTimer.current) clearTimeout(failTimer.current);
            cleanupRef.current?.();
            cleanupRef.current = null;
        };
    }, [native, track, reloadKey]);

    // Track-tint injected as a local CSS custom property so buttons / progress /
    // glow all adopt the chosen track's accent (per-track shell tinting).
    const tintStyle: CSSProperties = {
        '--track-shell':      def.tint.shell,
        '--track-shell-soft': def.tint.shellSoft,
        '--track-shell-glow': def.tint.shellGlow,
    } as CSSProperties;

    const trackName = t(def.i18n.name);

    return (
        <div className="pscreen" style={tintStyle}>
            <header className="pscreen-topbar">
                <div className="pscreen-name">{trackName}</div>
                <button
                    type="button"
                    className="pscreen-switch"
                    onClick={() => setConfirmingSwitch(true)}
                    aria-label={t('switch.button.long')}
                >
                    <ArrowLeftRight size={14} aria-hidden="true" />
                    <span className="pscreen-switch-label">{t('switch.button.short')}</span>
                </button>
            </header>

            {(phase === 'loading' || phase === 'slow') && (
                <div className="pscreen-state pscreen-loading" role="status" aria-live="polite">
                    <div className="pscreen-kicker">{t('loading.kicker')}</div>
                    <div className="pscreen-loading-line">
                        <span className="pscreen-loading-text">
                            {phase === 'slow' ? t('loading.slow') : t('loading.line')}
                        </span>
                        <span className="pscreen-loading-track" aria-hidden="true">
                            <span className="pscreen-loading-fill" />
                        </span>
                    </div>
                </div>
            )}

            {phase === 'error' && (
                <div className="pscreen-state">
                    <div className="pscreen-kicker">{trackName}</div>
                    <h2 className="pscreen-state-headline">{t('error.headline')}</h2>
                    <p className="pscreen-state-body">{t('error.body', { trackName })}</p>
                    <div className="pscreen-state-actions">
                        <button
                            type="button"
                            className="pscreen-btn pscreen-btn-primary"
                            onClick={() => setReloadKey(k => k + 1)}
                        >
                            <RefreshCw size={16} aria-hidden="true" />
                            {t('error.retry')}
                        </button>
                        <button
                            type="button"
                            className="pscreen-btn pscreen-btn-ghost"
                            onClick={() => setConfirmingSwitch(true)}
                        >
                            {t('error.switch')}
                        </button>
                    </div>
                </div>
            )}

            {phase === 'offline' && (
                <div className="pscreen-state">
                    <WifiOff className="pscreen-state-icon" size={28} aria-hidden="true" />
                    <h2 className="pscreen-state-headline">{t('offline.headline')}</h2>
                    <p className="pscreen-state-body">{t('offline.body')}</p>
                    <div className="pscreen-state-actions">
                        <button
                            type="button"
                            className="pscreen-btn pscreen-btn-primary"
                            onClick={() => setReloadKey(k => k + 1)}
                        >
                            <RefreshCw size={16} aria-hidden="true" />
                            {t('offline.retry')}
                        </button>
                    </div>
                </div>
            )}

            {phase === 'webPreview' && (
                <div className="pscreen-state pscreen-preview">
                    <div className="pscreen-kicker">{trackName}</div>
                    <p className="pscreen-state-body">{t('webPreview.explainer')}</p>
                    <a
                        className="pscreen-btn pscreen-btn-primary"
                        href={def.url}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <ExternalLink size={16} aria-hidden="true" />
                        {t('webPreview.cta')}
                    </a>
                    <div className="pscreen-preview-host">{def.url.replace('https://', '')}</div>
                </div>
            )}

            <ConfirmDialog
                open={confirmingSwitch}
                title={t('switch.title')}
                body={t('switch.body', { currentTrackName: trackName })}
                confirmLabel={t('switch.confirm')}
                cancelLabel={t('switch.cancel')}
                onConfirm={() => { setConfirmingSwitch(false); onSwitchTrack(); }}
                onCancel={()  => setConfirmingSwitch(false)}
            />
        </div>
    );
}
