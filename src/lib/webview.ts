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
import { TrackNotConfiguredError, getSupabase } from './supabaseClients';

/** Native plugin interface — one file for the whole surface. */
export interface EngnovaWebViewPlugin {
    open(opts: { url: string; allowedHosts: string[]; paymentHosts: string[] }): Promise<void>;
    /** Load an inline HTML bootstrap under `baseUrl`. Used by the IELTS handoff
     *  where a tiny page POSTs tokens to /api/auth/native-session from INSIDE
     *  the WebView's cookie jar (so Set-Cookie lands where the site can read it). */
    loadBootstrapHtml(opts: { baseUrl: string; html: string; allowedHosts: string[]; paymentHosts: string[] }): Promise<void>;
    close(): Promise<void>;
    goBack(): Promise<{ navigated: boolean }>;
    /** Hard-wipes WebView cookies + Web storage + current WebView cache/history/formData.
     *  Called on logout so the next login isn't silently the previous user. */
    clearData(): Promise<void>;
    addListener(event: 'progress',   cb: (e: { value: number }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'error',      cb: (e: { code: number; description: string; url: string }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'urlBlocked', cb: (e: { url: string; reason: 'payment' | 'external' }) => void): Promise<PluginListenerHandle>;
    /** Fired when the WebView navigates to the site's own /login page — the
     *  signal that the user just logged out on the WEB side. App.tsx uses
     *  this to sync the native side (clear the boot hint, invalidate the SDK
     *  session) so the two never drift. */
    addListener(event: 'webLogoutDetected', cb: (e: { url: string }) => void): Promise<PluginListenerHandle>;
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

/**
 * Subscribe to the "user logged out on the site" signal. Fires on any
 * webview navigation to /login on either track's site. Web-preview stub
 * never fires. Returns a cleanup that removes the listener.
 */
export async function onWebLogoutDetected(cb: (e: { url: string }) => void): Promise<() => void> {
    try {
        const h = await EngnovaWebView.addListener('webLogoutDetected', cb);
        return () => { try { h.remove(); } catch { /* noop */ } };
    } catch {
        return () => { /* nothing to unsubscribe */ };
    }
}

// ══ Authenticated open — the handoff ═════════════════════════════════════
// Two different mechanisms because the two tracks have different auth
// libraries:
//   • CEFR is a Vite SPA using client-side supabase-js + localStorage. Tokens
//     can travel in the URL fragment (# never leaves the client), the site's
//     main.tsx bootstrap consumes them via supabase.auth.setSession() BEFORE
//     React mounts, then strips the fragment.
//   • IELTS is Next.js 15 App Router using @supabase/ssr with httpOnly cookies.
//     A URL fragment cannot write httpOnly cookies — the server must set them.
//     We load a tiny bootstrap HTML into the WebView (via loadDataWithBaseURL
//     so the fetch is same-origin) that POSTs the tokens to
//     /api/auth/native-session; the API route calls supabase.auth.setSession
//     which writes the cookies inline in the same round-trip.

async function refreshedTokens(track: Track): Promise<{ access_token: string; refresh_token: string } | null> {
    try {
        const client = getSupabase(track);
        const { data } = await client.auth.getSession();
        if (!data.session) return null;
        // Refresh proactively when <60 s left — otherwise the site sees a 401
        // on its first authenticated fetch and the user thinks the app broke.
        if (data.session.expires_at && data.session.expires_at * 1000 - Date.now() < 60_000) {
            const r = await client.auth.refreshSession({ refresh_token: data.session.refresh_token });
            if (r.data.session) {
                return { access_token: r.data.session.access_token, refresh_token: r.data.session.refresh_token };
            }
        }
        return { access_token: data.session.access_token, refresh_token: data.session.refresh_token };
    } catch (e) {
        if (e instanceof TrackNotConfiguredError) return null;
        return null;
    }
}

/**
 * Open the chosen track's live site WITH the native app's Supabase session
 * pre-injected. Falls back to a plain open when no session is available or
 * the token refresh fails — the user just sees the site's own login instead
 * of an error. Wires progress/error/urlBlocked listeners identically to
 * openTrackWebView.
 */
export async function openTrackWebViewAuthed(track: Track, cb: TrackWebViewCallbacks = {}): Promise<() => Promise<void>> {
    const def = TRACKS[track];
    const tokens = await refreshedTokens(track);

    // No live session → fall through to unauthed open. The user will hit the
    // site's own login inside the webview; not ideal but never a broken state.
    if (!tokens) return openTrackWebView(track, cb);

    const handles: PluginListenerHandle[] = [];
    if (cb.onProgress)   handles.push(await EngnovaWebView.addListener('progress',   (e) => cb.onProgress!(e.value)));
    if (cb.onError)      handles.push(await EngnovaWebView.addListener('error',      cb.onError));
    if (cb.onUrlBlocked) handles.push(await EngnovaWebView.addListener('urlBlocked', cb.onUrlBlocked));

    if (track === 'cefr') {
        // URL-fragment handoff. main.tsx's bootstrap() consumes and strips it.
        const at = encodeURIComponent(tokens.access_token);
        const rt = encodeURIComponent(tokens.refresh_token);
        // Include a benign 'eng_v=1' marker so the site can add analytics
        // for how many opens are Engnova-authed vs cold web.
        const url = `${def.url}/#eng_v=1&eng_at=${at}&eng_rt=${rt}`;
        await EngnovaWebView.open({
            url,
            allowedHosts: def.allowedHosts,
            paymentHosts: def.paymentHosts,
        });
    } else {
        // IELTS: POST-inside-webview bootstrap. loadDataWithBaseURL runs the
        // page as if served from ieltslevel.uz so /api/auth/native-session is
        // same-origin and cookies land in the right jar.
        const html = buildIeltsBootstrapHtml(tokens.access_token, tokens.refresh_token, '/en/dashboard');
        await EngnovaWebView.loadBootstrapHtml({
            baseUrl: def.url + '/',   // trailing slash — some webview versions insist on it
            html,
            allowedHosts: def.allowedHosts,
            paymentHosts: def.paymentHosts,
        });
    }

    return async () => {
        for (const h of handles) { try { await h.remove(); } catch { /* noop */ } }
        try { await EngnovaWebView.close(); } catch { /* already gone */ }
    };
}

/**
 * IELTS bootstrap page. POSTs tokens to /api/auth/native-session (which sets
 * cookies via @supabase/ssr's server client), then navigates to `next`.
 * On error, navigates to /en/login as a graceful fallback — the user sees
 * the site's login and can re-enter credentials.
 *
 * Keep this HTML small and self-contained — it flashes for ~200ms during
 * the round-trip. A dark background matching the shell splash bg avoids
 * a white flash. Language-agnostic; the destination path picks the site's
 * own locale flow.
 */
function buildIeltsBootstrapHtml(accessToken: string, refreshToken: string, next: string): string {
    // JSON.stringify handles any special chars in the tokens safely.
    const body = JSON.stringify({ access_token: accessToken, refresh_token: refreshToken });
    // Escape close-script tags to prevent HTML parser from ending our script early.
    const safeBody = body.replace(/<\/script>/gi, '<\\/script>');
    return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Engnova</title><style>html,body{margin:0;height:100%;background:#08080C;color:#EDEFF6;font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center}.d{opacity:.65;font-size:13px;letter-spacing:.06em}</style></head><body><div class="d">Ochilmoqda…</div><script>
(async function(){
  try {
    const r = await fetch('/api/auth/native-session', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'X-Engnova-Client': '1' },
      body: ${JSON.stringify(safeBody)}
    });
    if (r.ok) { location.replace(${JSON.stringify(next)}); return; }
  } catch (e) {}
  location.replace('/en/login');
})();
</script></body></html>`;
}
