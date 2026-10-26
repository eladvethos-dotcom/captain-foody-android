# אבטחה – קפטן פודי לאנדרואיד

המסמך עובר על דרישות של Google Play, על [רשימת האבטחה של אנדרואיד](https://developer.android.com/privacy-and-security/security-tips), על ההנחיות ל-[WebView](https://developer.android.com/develop/ui/views/layout/webapps/load-local-content), ועל קטגוריות OWASP MASVS שרלוונטיות לאפליקציה מקומית בלי שרת ובלי משתמשים. לכל דרישה מצוין איפה היא מטופלת בקוד.

## 1. דרישות Google Play

| דרישה | איך זה מטופל | איפה |
|---|---|---|
| יעד API עדכני: Android 16 (API 36) מ-31 באוגוסט 2026 | `targetSdk = 36`, `compileSdk = 36` | `app/build.gradle.kts` |
| פורמט Android App Bundle | בונים `.aab` דרך Generate Signed App Bundle | README |
| Play App Signing | מפתח החתימה הסופי נשמר אצל גוגל. מפתח ההעלאה נשמר אצל המפתח ולא בקוד | README |
| מדיניות פרטיות ו-Data safety | טיוטת מדיניות ותשובות לטופס | `PRIVACY.md`, סעיף 6 כאן |
| מסך מלא (edge-to-edge) ב-API 35 ומעלה | `enableEdgeToEdge()`, והתוכן מרופד לפי ה-insets של המערכת | `MainActivity.kt` |
| חזרה חזויה (predictive back) | `enableOnBackInvokedCallback="true"` ו-`OnBackPressedCallback` | Manifest, `MainActivity.kt` |

## 2. רשת

| דרישה | איך זה מטופל | איפה |
|---|---|---|
| HTTPS בלבד | `usesCleartextTraffic="false"` ו-`cleartextTrafficPermitted="false"` | Manifest, `network_security_config.xml` |
| אמון רק ברשויות האישורים של המערכת | רק `<certificates src="system"/>`, בלי אישורים שהמשתמש התקין | `network_security_config.xml` |
| לא לעקוף שגיאות TLS | `onReceivedSslError` לא נדרס, כך שה-WebView מבטל כברירת מחדל | `SecureWebViewClient.kt` |
| רשימת כתובות מותרות | כל בקשה עוברת דרך `shouldInterceptRequest`: קבצי האפליקציה, ו-fonts.googleapis.com ו-fonts.gstatic.com בלבד. כל השאר מקבל 403 בלי לצאת מהמכשיר | `SecureWebViewClient.kt` |
| הרשאות מינימליות | `INTERNET` בלבד, וגם היא רק בשביל הגופנים (ראו סעיף 7) | Manifest |

## 3. WebView

| דרישה | איך זה מטופל |
|---|---|
| טעינת תוכן מקומי בלי `file://` | `WebViewAssetLoader` מגיש את `assets/www` מ-`https://appassets.androidplatform.net` |
| בלי גישה לקבצים ולספקי תוכן | `allowFileAccess = false`, `allowContentAccess = false` |
| בלי גשר JavaScript ל-Kotlin | אין `addJavascriptInterface`. כפתור החזרה משתמש ב-`evaluateJavascript` לכיוון אחד בלבד |
| בלי חלונות קופצים | `setSupportMultipleWindows(false)`, `javaScriptCanOpenWindowsAutomatically = false` |
| בלי תוכן מעורב | `MIXED_CONTENT_NEVER_ALLOW` |
| ניווט מבוקר | `shouldOverrideUrlLoading` חוסם כל מעבר מחוץ לאפליקציה. רק קישור של גוגל מפות, ורק אחרי לחיצה של המשתמש, נפתח ב-Intent לאפליקציה חיצונית |
| דחיית בקשות הרשאה מהדף | `onPermissionRequest` → `deny()`, ומיקום → `false` |
| Safe Browsing | פעיל במניפסט ובקוד |
| ניפוי באגים מרחוק | רק ב-debug: `setWebContentsDebuggingEnabled(BuildConfig.DEBUG)` |
| עוגיות | כבויות, כולל עוגיות של צד שלישי |
| קריסת תהליך הרינדור | `onRenderProcessGone` מאתחל את המסך במקום להפיל את האפליקציה |

## 4. קוד הווב

| דרישה | איך זה מטופל | איפה |
|---|---|---|
| Content Security Policy | `default-src 'none'`. סקריפטים רק מהאפליקציה עצמה, בלי סקריפט inline ובלי `eval`. בלי `fetch`, בלי טפסים ובלי מסגרות | `index.html` |
| מניעת XSS | כל טקסט של משתמש עובר `esc()` לפני שהוא נכנס ל-HTML | `app.js` |
| אימות מידע שמור | `cleanState()` בודק ומגביל כל שדה (סוג, אורך, טווח מספרים, מזהים) לפני השימוש | `app.js` |
| קישורים חיצוניים | `rel="noopener"`, ו-`no-referrer` ברמת הדף | `app.js`, `index.html` |
| מצב קפדני | `'use strict'` | `app.js` |

**פשרה ידועה:** `style-src` כולל `'unsafe-inline'`, כי המפה, הקלפים והאנימציות משתמשים במאפייני `style` שנבנים בקוד. אין לזה השפעה על הרצת קוד, כי `script-src` נשאר קפדני.

## 5. אחסון וגיבוי

| דרישה | איך זה מטופל | איפה |
|---|---|---|
| איפה המידע נשמר | הסיורים והאתרים נשמרים ב-local storage של ה-WebView, בתוך התיקייה הפרטית של האפליקציה | — |
| גיבוי מוגבל ומוצפן | Android 12 ומעלה: גיבוי לענן רק אם יש הצפנה מקצה לקצה (`disableIfNoEncryptionCapabilities`), ורק של תיקיית ה-local storage. Android 8 עד 11: `requireFlags="clientSideEncryption"` | `data_extraction_rules.xml`, `backup_rules.xml` |
| בלי מידע רגיש | האפליקציה לא שומרת סיסמאות, פרטי תשלום או מידע אישי. לכן לא נדרשת הצפנה נוספת של האחסון ולא `FLAG_SECURE` | — |

## 6. Data safety בגוגל פליי

- **Data collected:** לא. האפליקציה לא אוספת נתונים ולא שולחת אותם למפתח.
- **Data shared:** לא.
- **הערה:** הגופנים נטענים מ-Google Fonts. השרת של גוגל רואה את כתובת ה-IP של הבקשה, כמו בכל אתר. לפי הגדרות גוגל, זו לא איסוף נתונים על ידי האפליקציה, אבל כדאי לציין את זה במדיניות הפרטיות. סעיף 7 מסביר איך מבטלים את זה לגמרי.

## 7. לא חובה: בלי אינטרנט בכלל

כדי להסיר גם את הרשאת `INTERNET`:

1. מורידים מ-[Google Fonts](https://fonts.google.com) את הגופנים Suez One, Amatic SC ו-Frank Ruhl Libre, בקבצי `woff2`. הם ברישיון OFL, שמתיר אריזה בתוך אפליקציה.
2. שמים אותם ב-`assets/www/fonts/`, ויוצרים `fonts.css` עם `@font-face` לכל גופן.
3. ב-`index.html` מחליפים את הקישור ל-Google Fonts ב-`<link rel="stylesheet" href="fonts/fonts.css">`, ומוחקים את `https://fonts.googleapis.com` ו-`https://fonts.gstatic.com` מה-CSP.
4. ב-`SecureWebViewClient.kt` מרוקנים את `FONT_HOSTS`.
5. מוחקים את שורת `INTERNET` מהמניפסט.

## 8. לפני כל גרסה

- [ ] `versionCode` עלה
- [ ] בנייה ב-`release` (R8 פעיל, `isDebuggable = false`)
- [ ] ב-Android Studio: **Analyze › Inspect Code**, ובדיקה שאין אזהרות אבטחה
- [ ] בדיקה ידנית: שהאפליקציה עובדת במצב טיסה (חוץ מהגופנים), ושקישור ניווט פותח את גוגל מפות
- [ ] הספריות ב-`libs.versions.toml` עודכנו לגרסאות יציבות
