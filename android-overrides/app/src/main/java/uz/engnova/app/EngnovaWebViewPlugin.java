package uz.engnova.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.view.ViewGroup;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.browser.customtabs.CustomTabsIntent;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

/**
 * EngnovaWebView — the native shell's own WebView, hosting a track's live site
 * ONLY on the app's terms.
 *
 * Why not @capacitor/inappbrowser?  That plugin opens a Chrome Custom Tab (v6+)
 * or a stock WebView activity — either way we get no hooks into
 * WebChromeClient.onPermissionRequest (mic permission dies silently for
 * speaking practice), no reliable urlChangeEvent for interception, and no way
 * to route the hardware Back button through the WebView's own navigation
 * history. Every one of those is a first-class native feature the shell has to
 * own; hence this plugin.
 *
 * JS API (see src/lib/webview.ts):
 *   open({ url, allowedHosts, paymentHosts })
 *   close()
 *   goBack() → { navigated: boolean }
 *   Events (via addListener):
 *     progress { value: 0..100 }
 *     urlBlocked { url, reason: 'payment' | 'external' }
 *     error { code, description, url }
 *
 * On close, the WebView is fully torn down (stopLoading + destroy) so the
 * chooser's Capacitor bridge WebView underneath is visible again.
 */
@CapacitorPlugin(name = "EngnovaWebView")
public class EngnovaWebViewPlugin extends Plugin {

    // Request code for the RECORD_AUDIO OS prompt. MainActivity forwards
    // onRequestPermissionsResult here via the static reference below.
    private static final int MIC_REQ_CODE = 4711;

    // MainActivity keeps this reference so it can route onRequestPermissionsResult
    // back into the plugin — the WebChromeClient callback that starts the request
    // lives OUTSIDE any PluginCall, so we can't use Capacitor's built-in permission
    // callback wiring (which requires a PluginCall to be in-flight).
    static WeakReference<EngnovaWebViewPlugin> INSTANCE;

    private WebView trackView;
    private PermissionRequest pendingWebRequest;
    private final List<String> allowedHosts = new ArrayList<>();
    private final List<String> paymentHosts = new ArrayList<>();

    @Override
    public void load() {
        super.load();
        INSTANCE = new WeakReference<>(this);
    }

    // ── Public plugin methods ────────────────────────────────────────────────

    @PluginMethod
    public void open(final PluginCall call) {
        final String url = call.getString("url");
        if (url == null) { call.reject("missing url"); return; }
        parseHosts(call);
        getActivity().runOnUiThread(() -> {
            closeInternal();
            trackView = createTrackWebView();
            trackView.loadUrl(url);
            call.resolve();
        });
    }

    @PluginMethod
    public void close(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            closeInternal();
            if (call != null) call.resolve();
        });
    }

    @PluginMethod
    public void goBack(final PluginCall call) {
        getActivity().runOnUiThread(() -> {
            JSObject res = new JSObject();
            if (trackView != null && trackView.canGoBack()) {
                trackView.goBack();
                res.put("navigated", true);
            } else {
                res.put("navigated", false);
            }
            call.resolve(res);
        });
    }

    // ── Internals ────────────────────────────────────────────────────────────

    private void parseHosts(PluginCall call) {
        allowedHosts.clear();
        paymentHosts.clear();
        JSArray a = call.getArray("allowedHosts");
        JSArray p = call.getArray("paymentHosts");
        try {
            if (a != null) for (int i = 0; i < a.length(); i++) allowedHosts.add(a.getString(i));
            if (p != null) for (int i = 0; i < p.length(); i++) paymentHosts.add(p.getString(i));
        } catch (JSONException ignored) { /* absent → empty allowlist → all external */ }
    }

    private void closeInternal() {
        if (trackView != null) {
            ViewGroup parent = (ViewGroup) trackView.getParent();
            if (parent != null) parent.removeView(trackView);
            try { trackView.stopLoading(); } catch (Exception ignored) {}
            try { trackView.destroy();     } catch (Exception ignored) {}
            trackView = null;
        }
        pendingWebRequest = null;
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private WebView createTrackWebView() {
        WebView wv = new WebView(getContext());
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        // Both tracks' listening/audio content should auto-play when the user
        // starts a session — without this getUserMedia / <audio> often stalls.
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        // Never let a compromised subpage read local files.
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        // UA suffix so the sites can detect they're inside Engnova if they want to.
        s.setUserAgentString(s.getUserAgentString() + " Engnova/1.0");
        // Debuggable in DevTools during closed-testing; drop before release build.
        WebView.setWebContentsDebuggingEnabled(true);

        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                JSObject e = new JSObject();
                e.put("value", newProgress);
                notifyListeners("progress", e);
            }
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                boolean wantsMic = false;
                for (String r : request.getResources()) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(r)) {
                        wantsMic = true; break;
                    }
                }
                if (!wantsMic) { request.deny(); return; }
                if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.RECORD_AUDIO)
                        != PackageManager.PERMISSION_GRANTED) {
                    pendingWebRequest = request;
                    ActivityCompat.requestPermissions(getActivity(),
                            new String[]{ Manifest.permission.RECORD_AUDIO }, MIC_REQ_CODE);
                } else {
                    request.grant(new String[]{ PermissionRequest.RESOURCE_AUDIO_CAPTURE });
                }
            }
            @Override
            public void onPermissionRequestCanceled(PermissionRequest request) {
                pendingWebRequest = null;
            }
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                // Neither site currently needs geolocation. Deny explicitly so a
                // rogue script can never prompt the user.
                if (callback != null) callback.invoke(origin, false, false);
            }
        });

        wv.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String host = uri.getHost();
                if (host == null) return true;
                String scheme = uri.getScheme() == null ? "" : uri.getScheme();

                // Non-http(s) — tel: / mailto: / sms: / tg: / intent: — hand to system.
                if (!"https".equals(scheme) && !"http".equals(scheme)) {
                    tryStartExternal(uri);
                    return true;
                }
                // Payment host → Chrome Custom Tab (shared cookie jar, warm-up capable).
                if (matches(host, paymentHosts)) {
                    openCustomTab(uri);
                    JSObject e = new JSObject();
                    e.put("url", uri.toString());
                    e.put("reason", "payment");
                    notifyListeners("urlBlocked", e);
                    return true;
                }
                // Allowed track host → load in this WebView.
                if (matches(host, allowedHosts)) return false;
                // Anything else → system browser (external link).
                tryStartExternal(uri);
                JSObject e = new JSObject();
                e.put("url", uri.toString());
                e.put("reason", "external");
                notifyListeners("urlBlocked", e);
                return true;
            }
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (!request.isForMainFrame()) return;
                JSObject e = new JSObject();
                e.put("code", error != null ? error.getErrorCode() : -1);
                e.put("description", error != null && error.getDescription() != null
                        ? error.getDescription().toString() : "");
                e.put("url", request.getUrl().toString());
                notifyListeners("error", e);
            }
        });

        ViewGroup decor = (ViewGroup) getActivity().getWindow().getDecorView();
        decor.addView(wv, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));
        return wv;
    }

    private boolean matches(String host, List<String> patterns) {
        for (String p : patterns) if (host.equals(p) || host.endsWith("." + p)) return true;
        return false;
    }

    private void tryStartExternal(Uri uri) {
        try { getContext().startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (Exception ignored) { /* no handler → drop silently, don't crash the WebView */ }
    }

    private void openCustomTab(Uri uri) {
        try {
            new CustomTabsIntent.Builder()
                    .setUrlBarHidingEnabled(true)
                    .build()
                    .launchUrl(getContext(), uri);
        } catch (Exception ignored) {
            tryStartExternal(uri);   // fallback: system browser
        }
    }

    /**
     * Called by MainActivity.onRequestPermissionsResult — the OS runtime
     * permission response gets routed here for the pending WebChromeClient
     * request. Public so MainActivity can reach it.
     */
    public void onNativePermissionsResult(int requestCode, int[] grantResults) {
        if (requestCode != MIC_REQ_CODE || pendingWebRequest == null) return;
        PermissionRequest req = pendingWebRequest;
        pendingWebRequest = null;
        if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
            req.grant(new String[]{ PermissionRequest.RESOURCE_AUDIO_CAPTURE });
        } else {
            req.deny();
        }
    }

    @Override
    protected void handleOnDestroy() {
        closeInternal();
        super.handleOnDestroy();
    }
}
