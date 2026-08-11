package uz.engnova.app;

import android.os.Bundle;

import androidx.core.splashscreen.SplashScreen;

import com.getcapacitor.BridgeActivity;

/**
 * Engnova single-activity shell. The only override is to install the Android 12+
 * SplashScreen API BEFORE the parent onCreate — this is what tells the platform to
 * render `windowSplashScreenAnimatedIcon` inside its 160dp mask centered on the
 * background color, then flip to postSplashScreenTheme when the WebView's first
 * frame is ready. Without this line, the styles.xml splash attributes are
 * silently ignored and the launch flashes a black frame instead.
 *
 * We deliberately don't call setKeepOnScreenCondition — the WebView is fast
 * enough (bundled shell, no server.url) that the platform's default "dismiss
 * when the first frame is drawn" is exactly right. If cold-start feels too
 * abrupt in on-device testing, we can add a min-visible-duration here.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
    }
}
