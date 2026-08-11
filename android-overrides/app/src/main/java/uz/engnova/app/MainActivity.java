package uz.engnova.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebView;

import androidx.annotation.NonNull;
import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

/**
 * Engnova single-activity shell.
 *
 * Two overrides on Capacitor's BridgeActivity, both load-bearing:
 *
 *   1. Install the Android 12+ SplashScreen API BEFORE super.onCreate.
 *      Without this the styles.xml `windowSplashScreenAnimatedIcon` +
 *      `windowSplashScreenBackground` attributes are silently ignored and
 *      cold launches flash a black frame.
 *
 *   2. Register EngnovaWebViewPlugin in the Bridge so the shell's JS side
 *      can call `EngnovaWebView.open()`. registerPlugin() must run BEFORE
 *      super.onCreate() so the plugin instance exists by the time the bridge
 *      exposes its RPC surface to the WebView.
 *
 * onRequestPermissionsResult forwards the RECORD_AUDIO grant/deny back into
 * the plugin — the WebChromeClient's onPermissionRequest fires outside any
 * PluginCall flow, so Capacitor's built-in permission callback wiring
 * (which requires a live PluginCall) can't route the result. A weak static
 * reference in EngnovaWebViewPlugin.INSTANCE bridges that gap.
 *
 * App Links (onCreate deep-link + onNewIntent):
 * When the OS routes a verified https://cefracademy.uz/* or
 * https://ieltslevel.uz/* tap into us, we write two keys into the shell's
 * WebView localStorage so the SPA can pick up the intent on boot:
 *   - engnova.track            → "cefr" | "ielts"      (chooser hint)
 *   - engnova.pendingDeepLink  → full uri.toString()   (path + query)
 * The chooser JS reads engnova.track on cold-start and skips the picker
 * when it's already set; the destination page reads pendingDeepLink to
 * restore intra-app navigation. If NO deep link is present (regular
 * launcher tap), handleDeepLink is a no-op — the chooser still fires.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(EngnovaWebViewPlugin.class);
        super.onCreate(savedInstanceState);
        // Cold-start: an App Links tap that launched the process arrives
        // as getIntent() on this activity. Warm-start arrives via
        // onNewIntent below (singleTask launchMode routes both paths).
        handleDeepLink(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        // Update getIntent() so any later reads see the new URI too.
        setIntent(intent);
        handleDeepLink(intent);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        EngnovaWebViewPlugin plugin =
                EngnovaWebViewPlugin.INSTANCE != null ? EngnovaWebViewPlugin.INSTANCE.get() : null;
        if (plugin != null) plugin.onNativePermissionsResult(requestCode, grantResults);
    }

    /**
     * Persist deep-link state into the WebView's localStorage.
     *
     * Guards (return silently on any miss — MUST NOT interfere with a
     * regular launcher cold-start where the chooser still needs to run):
     *   - intent == null                → launcher without extras
     *   - data == null                  → MAIN/LAUNCHER intent (no VIEW URI)
     *   - scheme != https               → some other URI shape slipped in
     *   - host not on our allow-list    → mis-routed VIEW intent
     *
     * The eval is posted to the WebView on the UI thread. On cold-start
     * the WebView is still mid-load when onCreate returns; posting via
     * webView.post() queues the JS to run once the message loop picks it
     * up, by which point the Capacitor bridge origin is live and
     * localStorage writes stick. Warm-start (onNewIntent) runs against
     * a fully-loaded page and lands immediately.
     */
    private void handleDeepLink(Intent intent) {
        if (intent == null) return;
        Uri data = intent.getData();
        if (data == null) return;

        String scheme = data.getScheme();
        String host = data.getHost();
        if (scheme == null || host == null) return;
        if (!"https".equalsIgnoreCase(scheme)) return;

        String normalized = host.toLowerCase();
        String track;
        if ("cefracademy.uz".equals(normalized) || "www.cefracademy.uz".equals(normalized)) {
            track = "cefr";
        } else if ("ieltslevel.uz".equals(normalized) || "www.ieltslevel.uz".equals(normalized)) {
            track = "ielts";
        } else {
            return;
        }

        // Escape for a single-quoted JS string literal. Order matters:
        // backslashes first, then single quotes.
        String uriStr = data.toString()
                .replace("\\", "\\\\")
                .replace("'", "\\'");

        final String js =
                "try {"
              + "  window.localStorage.setItem('engnova.track', '" + track + "');"
              + "  window.localStorage.setItem('engnova.pendingDeepLink', '" + uriStr + "');"
              + "} catch (e) {}";

        if (getBridge() == null) return;
        final WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // webView.post hops onto the WebView's UI thread; evaluateJavascript
        // must not be called from a background thread. Callback is null —
        // we don't care about the return value, and any failure (page not
        // ready yet on very-early cold-start) is swallowed by the try/catch.
        webView.post(() -> webView.evaluateJavascript(js, null));
    }
}
