/**
 * webview.ts — thin JS wrapper around the native EngnovaWebView plugin.
 *
 * The plugin (Android: android-overrides/…/EngnovaWebViewPlugin.java) mounts
 * a full-screen native WebView over the shell's Capacitor bridge, so the
 * shell owns:
 *   - loading progress (WebChromeClient.onProgressChanged  → 'progress' event)
 *   - main-frame errors  (WebViewClient.onReceivedError    → 'error' event)
 *   - allowlist routing (shouldOverrideUrlLoading → 'urlBlocked' event when a
 *      URL leaves the allowlist; payment hosts → Chrome Custom Tab)
 *   - runtime mic permission (WebChromeClient.onPermissionRequest → the OS
 *      RECORD_AUDIO prompt on first speaking-practice tap)
 *   - hardware back  (goBack() → walk the WebView history first)
 *
 * On the web preview (`npm run dev`), the plugin is unregistered → isNative()
 * returns false → callers fall back to the "open the site in the browser"
 * message in ProductScreen.
 */
import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { TRACKS, type Track } from './tracks';

/** Native plugin interface — one file for the whole surface. */
export interface EngnovaWebViewPlugin {
    open(opts: { url: string; allowedHosts: string[]; paymentHosts: string[] }): Promise<void>;
    close(): Promise<void>;
    goBack(): Promise<{ navigated: boolean }>;
    /** Hard-wipes WebView cookies + Web storage + current WebView cache/history/formData.
     *  Called on logout so the next login isn't silently the previous user. */
    clearData(): Promise<void>;
    addListener(event: 'progress',   cb: (e: { value: number }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'error',      cb: (e: { code: number; description: string; url: string }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'urlBlocked', cb: (e: { url: string; reason: 'payment' | 'external' }) => void): Promise<PluginListenerHandle>;
}

// registerPlugin returns a stub on web; native platforms wire up the real one.
const EngnovaWebView = registerPlugin<EngnovaWebViewPlugin>('EngnovaWebView');

export function isNative(): boolean {
    try { return Capacitor.isNativePlatform(); } catch { return false; }
}

/**
 * Callbacks the caller wires up so the shell UI can react to what's happening
 * inside the WebView (branded loading bar, error state, etc.).
 */
export interface TrackWebViewCallbacks {
    onProgress?:   (value: number) => void;
    onError?:      (e: { code: number; description: string; url: string }) => void;
    onUrlBlocked?: (e: { url: string; reason: 'payment' | 'external' }) => void;
}

/**
 * Open the chosen track's live site in the native EngnovaWebView. Wires up
 * listeners the shell UI cares about. Returns a cleanup that unwinds every
 * listener AND closes the WebView — call it when the shell wants to return
 * to the chooser (switch-track) or on unmount.
 */
export async function openTrackWebView(track: Track, cb: TrackWebViewCallbacks = {}): Promise<() => Promise<void>> {
    const def = TRACKS[track];

    const handles: PluginListenerHandle[] = [];
    if (cb.onProgress)   handles.push(await EngnovaWebView.addListener('progress',   (e) => cb.onProgress!(e.value)));
    if (cb.onError)      handles.push(await EngnovaWebView.addListener('error',      cb.onError));
    if (cb.onUrlBlocked) handles.push(await EngnovaWebView.addListener('urlBlocked', cb.onUrlBlocked));

    await EngnovaWebView.open({
        url:            def.url,
        allowedHosts:   def.allowedHosts,
        paymentHosts:   def.paymentHosts,
    });

    return async () => {
        for (const h of handles) { try { await h.remove(); } catch { /* noop */ } }
        try { await EngnovaWebView.close(); } catch { /* already gone */ }
    };
}

/**
 * Walk the WebView's own back history first — this is what makes the Android
 * hardware Back button behave the way users expect inside a browser-like host.
 * Returns true if navigation happened; false means the WebView is at its root
 * and the shell should decide (close it → return to chooser, etc.).
 */
export async function webViewGoBack(): Promise<boolean> {
    try {
        const r = await EngnovaWebView.goBack();
        return !!r?.navigated;
    } catch {
        return false;
    }
}

/**
 * Wipe the WebView's cookies + Web storage. Safe to call on web preview
 * (the stub plugin no-ops). Fire on logout so the next user on the same
 * device isn't silently the previous one.
 */
export async function clearTrackWebViewStorage(): Promise<void> {
    try { await EngnovaWebView.clearData(); } catch { /* web preview / plugin missing */ }
}
