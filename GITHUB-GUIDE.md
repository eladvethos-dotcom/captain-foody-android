# מדריך: מ-GitHub לגוגל פליי, בלי להתקין כלום

כל השלבים נעשים בדפדפן. צריך שני קבצים שקיבלת:
- `captain-foody-android.zip`: הפרויקט.
- `captain-foody-secrets.txt`: מפתח החתימה והסיסמאות. **לא מעלים אותו ל-GitHub.**

---

## חלק א׳ – GitHub: בניית האפליקציה בענן

### 1. פתיחת חשבון
נרשמים ב-https://github.com/signup. החשבון חינמי.

### 2. יצירת מאגר
1. למעלה מימין: **+** › **New repository**.
2. **Repository name:** `captain-foody-android`
3. **Public**. אין בקוד שום סוד, כי המפתח נשמר בנפרד. במאגר ציבורי הבנייה חינמית ואפשר לפרסם את דף מדיניות הפרטיות בחינם.
4. לא מסמנים אף תיבה (README וכו').
5. **Create repository**.

### 3. העלאת הקבצים
1. מחלצים את `captain-foody-android.zip` במחשב.
2. בדף המאגר החדש לוחצים על הקישור **uploading an existing file**.
3. פותחים את התיקייה `captain-foody-android` שחילצת, מסמנים את **כל מה שבתוכה** וגוררים לדפדפן. גוררים את התוכן, לא את התיקייה עצמה. עדיף בכרום או באדג׳.
4. למטה: **Commit changes**.
5. **בדיקה חשובה:** במאגר צריכה להופיע תיקייה בשם `.github`. אם היא חסרה (ב-Mac ובחלק ממערכות Windows תיקיות שמתחילות בנקודה מוסתרות):
   - **Add file** › **Create new file**
   - בשם הקובץ מקלידים בדיוק: `.github/workflows/build.yml`
   - פותחים את הקובץ `build.yml` מה-ZIP בעורך טקסט (Notepad / TextEdit), מעתיקים את כל התוכן ומדביקים.
   - **Commit changes**.

### 4. הוספת הסודות (מפתח החתימה)
1. במאגר: **Settings** › בתפריט הצד **Secrets and variables** › **Actions**.
2. **New repository secret**, ארבע פעמים, לפי `captain-foody-secrets.txt`:

| Name | Secret |
|---|---|
| `KEY_ALIAS` | `upload` |
| `KEYSTORE_PASSWORD` | הסיסמה מהקובץ |
| `KEY_PASSWORD` | אותה סיסמה |
| `KEYSTORE_BASE64` | השורה הארוכה מהקובץ, כולה |

GitHub מצפין את הסודות. אף אחד, גם לא אתה, לא יכול לראות אותם שוב אחרי השמירה. לכן שמור את קובץ הסודות במקום בטוח, למשל במנהל סיסמאות.

### 5. הרצת הבנייה
1. לשונית **Actions**. אם מופיעה הודעה, לוחצים **I understand my workflows, go ahead and enable them**.
2. בצד: **Build Captain Foody** › **Run workflow** › **Run workflow**.
3. מחכים 5–10 דקות לוי ירוק. ריצה אדומה ראשונה, שרצה לפני שהוספת את הסודות, היא תקינה ואפשר להתעלם ממנה.
4. נכנסים לריצה הירוקה, ולמטה ב-**Artifacts** מורידים את `captain-foody-…`. בתוך ה-ZIP יש:
   - `app-release.aab`: לגוגל פליי.
   - `app-release.apk`: להתקנה ישירה לבדיקה. שולחים לטלפון, פותחים, ומאשרים "התקנה ממקורות לא ידועים".

### 6. דף מדיניות פרטיות (גוגל פליי דורש קישור)
1. במאגר פותחים את `docs/privacy.html` › אייקון העיפרון ✏️ › מחליפים את `[תאריך]` ואת `[כתובת המייל שלכם]` › **Commit changes**.
2. **Settings** › **Pages** › **Source:** Deploy from a branch › **Branch:** `main`, תיקייה `/docs` › **Save**.
3. אחרי דקה-שתיים הדף זמין בכתובת:
   `https://<שם-המשתמש-שלך>.github.io/captain-foody-android/privacy.html`

---

## חלק ב׳ – Google Play Console: פרסום לחברים

### 1. חשבון מפתח
- נרשמים ב-https://play.google.com/console/signup, חשבון **Personal**.
- יש דמי רישום חד-פעמיים, אימות זהות עם תעודה, ואימות שיש לך טלפון אנדרואיד דרך אפליקציית Play Console.
- האישור יכול לקחת כמה ימים.

### 2. יצירת האפליקציה
**Create app** › שם: קפטן פודי › שפה: עברית › **App** › **Free** › מאשרים את ההצהרות › **Create app**.

### 3. רשימת בודקים
**Test and release** › **Testing** › **Internal testing** › לשונית **Testers** › **Create email list**. מוסיפים את כתובות ה-Gmail של החברים (עד 100) › **Save**.

### 4. העלאת הגרסה
1. באותו מסך: **Create new release**.
2. **Play App Signing:** משאירים את ברירת המחדל, כלומר גוגל מנהל את מפתח האפליקציה. המפתח שלך הוא רק "מפתח העלאה".
3. גוררים את `app-release.aab`.
4. בהערות הגרסה כותבים משהו קצר, למשל "גרסה ראשונה".
5. **Next** › **Save and publish**.

### 5. משימות חובה (Dashboard › App content)
Play Console מציג רשימה. אלה התשובות:

| משימה | מה לענות |
|---|---|
| Privacy policy | הקישור מסעיף א׳6 |
| App access | All functionality is available without special access |
| Ads | No, my app does not contain ads |
| Content rating | ממלאים את השאלון, ועונים "לא" על אלימות, תוכן מיני וכו׳ |
| Target audience | 18+. בחירת גילאי ילדים מפעילה כללים נוספים (Families) |
| Data safety | Does your app collect or share any of the required user data types? › **No** |
| Government apps / Financial features / Health | No / None |
| Store listing | תיאור קצר ומלא, אייקון 512×512, תמונה ראשית 1024×500 ולפחות 2 צילומי מסך |

### 6. שליחה לחברים
**Internal testing** › **Testers** › מעתיקים את קישור **Join on the web** ושולחים. החברים מאשרים את ההזמנה ומתקינים מגוגל פליי.

---

## עדכון גרסה

1. משנים קבצים ב-GitHub (עיפרון ✏️ › Commit). הבנייה רצה לבד.
2. מורידים את ה-`.aab` החדש מ-**Actions**.
3. ב-Play Console: **Internal testing** › **Create new release** › מעלים › **Save and publish**.

מספר הגרסה עולה אוטומטית בכל בנייה, כך שאין צורך לשנות אותו.

## לפני פרסום לכולם

בחשבון פרטי חדש, גוגל דורש קודם **Closed testing** עם לפחות 12 בודקים במשך 14 ימים רצופים, ורק אחר כך אפשר לבקש Production. לבדיקה פנימית הדרישה לא חלה.
