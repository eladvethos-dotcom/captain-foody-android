package il.captainfoody.app

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.webkit.WebSettingsCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewFeature

/**
 * Single screen that shows the Captain Foody web app from the APK's own assets.
 *
 * The web files are served from https://appassets.androidplatform.net/assets/www/
 * through [WebViewAssetLoader], so the page gets a normal secure origin
 * (local storage works) without ever enabling file:// access.
 */
class MainActivity : ComponentActivity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        webView = WebView(this).apply {
            setBackgroundColor(getColor(R.color.table))
            isVerticalScrollBarEnabled = false
        }
        setContentView(webView)

        // Keep the page clear of the status bar, navigation bar and display cutouts.
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime())
            view.setPadding(bars.left, bars.top, bars.right, maxOf(bars.bottom, ime.bottom))
            WindowInsetsCompat.CONSUMED
        }

        configureSecurely(webView)

        val assetLoader = WebViewAssetLoader.Builder()
            .setDomain(AppUrls.HOST)
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()
        webView.webViewClient = SecureWebViewClient(this, assetLoader)
        webView.webChromeClient = DenyAllChromeClient()

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                // Let the web app close an open card or return to the home screen first.
                webView.evaluateJavascript(
                    "(window.__captainBack && window.__captainBack()) === true"
                ) { handled ->
                    if (handled != "true") {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                        isEnabled = true
                    }
                }
            }
        })

        if (savedInstanceState == null || webView.restoreState(savedInstanceState) == null) {
            webView.loadUrl(AppUrls.START)
        }
    }

    @SuppressLint("SetJavaScriptEnabled") // The app is JavaScript; only our own bundled code runs.
    private fun configureSecurely(view: WebView) {
        with(view.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true // saved tours and places live in local storage

            // No access to the device's files or content providers.
            allowFileAccess = false
            allowContentAccess = false

            // No pop-up windows, no geolocation, no mixed HTTP content.
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(false)
            setGeolocationEnabled(false)
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            mediaPlaybackRequiresUserGesture = true

            builtInZoomControls = false
            displayZoomControls = false
        }

        if (WebViewFeature.isFeatureSupported(WebViewFeature.SAFE_BROWSING_ENABLE)) {
            WebSettingsCompat.setSafeBrowsingEnabled(view.settings, true)
        }
        // The app draws its own dark design; don't let Android recolor it.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.ALGORITHMIC_DARKENING)) {
            WebSettingsCompat.setAlgorithmicDarkeningAllowed(view.settings, false)
        }

        // The app uses no cookies.
        CookieManager.getInstance().apply {
            setAcceptCookie(false)
            setAcceptThirdPartyCookies(view, false)
        }

        // Remote debugging only in debug builds.
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        webView.saveState(outState)
    }

    override fun onDestroy() {
        webView.apply {
            stopLoading()
            webChromeClient = null
            destroy()
        }
        super.onDestroy()
    }

    /** Refuses every permission the page could ask for (camera, microphone, location...). */
    private class DenyAllChromeClient : WebChromeClient() {
        override fun onPermissionRequest(request: PermissionRequest) {
            request.deny()
        }

        override fun onGeolocationPermissionsShowPrompt(
            origin: String?,
            callback: GeolocationPermissions.Callback
        ) {
            callback.invoke(origin, false, false)
        }
    }
}
