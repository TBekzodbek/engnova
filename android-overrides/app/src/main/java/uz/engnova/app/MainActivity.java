package uz.engnova.app;

import android.os.Bundle;

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
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        registerPlugin(EngnovaWebViewPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        EngnovaWebViewPlugin plugin =
                EngnovaWebViewPlugin.INSTANCE != null ? EngnovaWebViewPlugin.INSTANCE.get() : null;
        if (plugin != null) plugin.onNativePermissionsResult(requestCode, grantResults);
    }
}
