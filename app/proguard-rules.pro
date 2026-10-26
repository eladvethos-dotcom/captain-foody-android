# The app exposes no JavaScript interface to the web content,
# so no @JavascriptInterface keep rules are needed.

# Strip verbose and debug logging from release builds.
-assumenosideeffects class android.util.Log {
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
