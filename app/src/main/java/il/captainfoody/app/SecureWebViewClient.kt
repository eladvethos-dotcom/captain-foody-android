package il.captainfoody.app

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.webkit.RenderProcessGoneDetail
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import android.widget.Toast
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import java.io.ByteArrayInputStream

object AppUrls {
    /** Reserved host that never reaches the network; WebViewAssetLoader answers it from the APK. */
    const val HOST = "appassets.androidplatform.net"
    const val START = "https://$HOST/assets/www/index.html"

    /** The only outside addresses the page may load: the three Google Fonts. */
    val FONT_HOSTS = setOf("fonts.googleapis.com", "fonts.gstatic.com")

    /** The only outside links the app will open: Google Maps navigation, handed to the Maps app. */
    private val MAPS_HOSTS = setOf("www.google.com", "google.com", "maps.google.com")

    fun isGoogleMapsLink(uri: Uri): Boolean =
        uri.scheme == "https" &&
            uri.host in MAPS_HOSTS &&
            (uri.path ?: "").startsWith("/maps")

    fun isAppPage(uri: Uri): Boolean = uri.scheme == "https" && uri.host == HOST
}

/**
 * Network and navigation gatekeeper for the WebView:
 * - the app's own files come from the APK,
 * - Google Fonts may load over HTTPS,
 * - every other request is refused before it leaves the device,
 * - Google Maps links open in the Maps app; nothing else can navigate the WebView away.
 */
class SecureWebViewClient(
    private val activity: Activity,
    private val assetLoader: WebViewAssetLoader
) : WebViewClientCompat() {

    override fun shouldInterceptRequest(
        view: WebView,
        request: WebResourceRequest
    ): WebResourceResponse? {
        val uri = request.url
        return when {
            AppUrls.isAppPage(uri) -> assetLoader.shouldInterceptRequest(uri) ?: refuse(404, "Not Found")
            uri.scheme == "https" && uri.host in AppUrls.FONT_HOSTS -> null // let WebView fetch it over HTTPS
            else -> refuse(403, "Forbidden")
        }
    }

    override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
        val uri = request.url
        if (AppUrls.isAppPage(uri)) return false
        if (AppUrls.isGoogleMapsLink(uri) && request.hasGesture()) openInMaps(uri)
        return true // block every other navigation
    }

    override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean {
        // The page's renderer crashed or was killed; restart cleanly instead of crashing the app.
        activity.recreate()
        return true
    }

    private fun openInMaps(uri: Uri) {
        val intent = Intent(Intent.ACTION_VIEW, uri)
            .addCategory(Intent.CATEGORY_BROWSABLE)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            activity.startActivity(intent)
        } catch (e: ActivityNotFoundException) {
            Toast.makeText(activity, R.string.no_maps_app, Toast.LENGTH_LONG).show()
        }
    }

    private fun refuse(code: Int, reason: String) = WebResourceResponse(
        "text/plain", "utf-8", code, reason, emptyMap(), ByteArrayInputStream(ByteArray(0))
    )
}
