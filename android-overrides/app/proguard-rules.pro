# ─────────────────────────────────────────────────────────────────────────
#  Engnova · R8/ProGuard keep rules
# ─────────────────────────────────────────────────────────────────────────
#  With `minifyEnabled true`, R8 strips + renames anything it thinks is
#  unreachable. Capacitor + our custom EngnovaWebViewPlugin depend on
#  reflection from the JS bridge — the JS side calls methods by their
#  ORIGINAL Java names, so any renaming = "plugin not registered" or
#  "method not found" at runtime, on RELEASE builds only.
#
#  The rules below keep the surfaces that reflection sees. Everything
#  else can shrink freely.
# ─────────────────────────────────────────────────────────────────────────

# ══ Capacitor bridge core ═══════════════════════════════════════════════
# The bridge itself resolves plugin classes + methods by name at runtime.
-keep public class com.getcapacitor.** { *; }
-keep public interface com.getcapacitor.** { *; }
-keep enum com.getcapacitor.** { *; }

# Any class annotated @CapacitorPlugin is a plugin — keep the whole thing.
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * { *; }

# Members Capacitor invokes reflectively via annotations. Losing any of
# these means the JS `Plugin.method()` call silently no-ops on release.
-keepclassmembers class * {
    @com.getcapacitor.PluginMethod                    <methods>;
    @com.getcapacitor.annotation.PermissionCallback   <methods>;
    @com.getcapacitor.annotation.ActivityCallback     <methods>;
    @com.getcapacitor.annotation.Permission           *;
}

# Some Capacitor internals use com.getcapacitor.plugin.** helper packages.
-keep class com.getcapacitor.plugin.** { *; }

# ══ Cordova compatibility shim ══════════════════════════════════════════
# capacitor-cordova-android-plugins bridges legacy Cordova plugins;
# keep the whole runtime so any transitive Cordova dep still works.
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# ══ @JavascriptInterface (WebView JS ↔ Java bridge) ═════════════════════
# Every method exposed to JS via addJavascriptInterface must keep its name.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ══ Our custom plugin ═══════════════════════════════════════════════════
# EngnovaWebViewPlugin + its listeners are called by the JS shell via the
# bridge. Keep the whole package so nothing gets stripped.
-keep class uz.engnova.app.** { *; }

# ══ WebView subclasses ══════════════════════════════════════════════════
# WebViewClient / WebChromeClient overrides are invoked by the OS via
# name-based dispatch; R8 sometimes misses this.
-keep public class * extends android.webkit.WebViewClient { *; }
-keep public class * extends android.webkit.WebChromeClient { *; }

# ══ Third-party plugins we bundle ═══════════════════════════════════════
# @capacitor/browser (Chrome Custom Tabs) + @capacitor/preferences.
# They ship consumer-proguard-files that R8 respects, but a belt-and-
# braces keep guards against any release-only regressions.
-keep class com.capacitorjs.plugins.browser.** { *; }
-keep class com.capacitorjs.plugins.preferences.** { *; }

# ══ Chrome Custom Tabs (androidx.browser) ═══════════════════════════════
# The AndroidX artifact ships its own consumer rules. Silence any stray
# warnings from optional deps R8 can't fully resolve on this classpath.
-dontwarn androidx.browser.customtabs.**

# ══ JSON serialization ══════════════════════════════════════════════════
# Capacitor exchanges data as org.json.JSONObject / JSObject / JSArray.
# Keep those + generic type-parameter attributes so nested types survive.
-keep class org.json.** { *; }
-keepattributes Signature,InnerClasses,EnclosingMethod

# ══ Reflection attributes ═══════════════════════════════════════════════
# Needed by @CapacitorPlugin(name = "…"), permission attribute readers,
# and by any dep that inspects annotations at runtime.
-keepattributes *Annotation*,RuntimeVisibleAnnotations,RuntimeVisibleParameterAnnotations

# ══ Crash reports ═══════════════════════════════════════════════════════
# Keep source-file + line-number info so Play Console crash traces map
# to real lines (rename the source-file attribute to "SourceFile" to
# collapse fingerprint noise).
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ══ Kotlin metadata (harmless if not used) ══════════════════════════════
# Capacitor 8 is Kotlin-friendly; keep metadata so reflective libs can
# read parameter names / nullability. A no-op when no Kotlin classes.
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
