'use strict';
(() => {
const HEB=['א','ב','ג','ד','ה','ו','ז','ח','ט','י','יא','יב','יג','יד','טו','טז','יז','יח','יט','כ','כא','כב','כג','כד','כה','כו','כז','כח','כט','ל'];
const heb=i=>HEB[i]||String(i+1);
const W=800,H=1100, KEY='food-map-tours.v1';
const TYPES=['בית קפה','מאפייה','מזרח תיכוני','אוכל רחוב','אסייתי','איטלקי','בשרים וגריל','דגים ופירות ים','טבעוני','קינוחים','בר ויין','שוק ודוכנים'];
const DESSERT='קינוחים';
const WALK=40; // map units per walking minute (about 80 m)
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const uid=()=>Math.random().toString(36).slice(2,10);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){return()=>{seed=(seed+0x6D2B79F5)|0;let t=seed;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function fmt(m){m=Math.round(m);if(m<60)return `${m} דק׳`;const h=Math.floor(m/60),r=m%60;const hs=h===1?'שעה':h===2?'שעתיים':`${h} שעות`;return r?`${hs} ו־${r} דק׳`:hs}
const walkMin=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)/WALK;
const walkOf=pts=>{let c=0;for(let i=1;i<pts.length;i++)c+=walkMin(pts[i-1],pts[i]);return c};
const eatOf=pts=>pts.reduce((a,s)=>a+(+s.minutes||0),0);
function typeOpts(sel){return `<option value="">בלי סוג</option>`+TYPES.map(t=>`<option${t===sel?' selected':''}>${t}</option>`).join('')}
function smooth(pts){
  if(!pts.length) return '';
  let d=`M${pts[0].x} ${pts[0].y}`;
  for(let i=0;i<pts.length-1;i++){
    const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;
    const c1x=p1.x+(p2.x-p0.x)/6,c1y=p1.y+(p2.y-p0.y)/6,c2x=p2.x-(p3.x-p1.x)/6,c2y=p2.y-(p3.y-p1.y)/6;
    d+=` C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

/* ---------- Sample data ---------- */
function P(area,name,type,dish,story,tip,minutes,x,y){return {id:uid(),area,name,type,dish,story,tip,minutes,x,y}}
function samplePlaces(){
  const TA='תל אביב', JA='יפו';
  return [
    P(TA,'דוכן הבורקס בשוק','מאפייה','בורקס גבינה ותפוחי אדמה עם ביצה חומה','הבורקס הגיע לכאן עם יהודי טורקיה והבלקן. הבצק נמתח דק מאוד, ולצידו מגישים ביצה חומה שבושלה לאט שעות ארוכות.','קחו אחד לחלוקה. יש עוד הרבה תחנות.',15,370,385),
    P(TA,"ג'חנון בכרם התימנים",'מזרח תיכוני',"ג'חנון עם רסק עגבניות וסחוג","הג'חנון נאפה בתנור כל הלילה של שבת, כדי שיהיה חם בבוקר בלי לבשל ביום עצמו. השכונה נוסדה בתחילת המאה ה-20 על ידי עולים מתימן.",'שאלו על החילבה.',20,225,450),
    P(TA,'דוכן הסביח','אוכל רחוב','חציל מטוגן, ביצה, טחינה ועמבה בפיתה','הסביח מגיע מהמטבח של יהודי עיראק, שאכלו חציל מטוגן וביצה קשה בבוקר שבת.','עמבה היא רוטב מנגו חמוץ. בפעם הראשונה בקשו רק קצת.',15,300,525),
    P(TA,'מלבי בסוף הסמטה','קינוחים','מלבי עם מי ורדים ובוטנים','מלבי הוא פודינג חלב רך עם מי ורדים וסירופ. מכירים אותו בכל המזרח התיכון, ותמיד הוא מגיע בסוף הארוחה.','',15,190,585),
    P(TA,'בית קפה בנחלת בנימין','בית קפה','קפה הפוך ומאפה חמאה','מדרחוב נחלת בנימין מתמלא בימי שלישי ושישי ביריד אמנים, ובתי הקפה בו הם נקודת עצירה מצוינת.','שבו בחוץ ותסתכלו על היריד.',20,505,505),
    P(TA,'ראמן בפלורנטין','אסייתי','קערת ראמן עם ציר עשיר','ראמן הוא מרק אטריות יפני. הציר מתבשל שעות ארוכות, וכל מסעדה שומרת את המתכון שלה.','אפשר לבקש קערה קטנה לטעימה.',30,470,930),
    P(TA,'פיצרייה ברחוב אלנבי','איטלקי','פיצה נפוליטנית מתנור עצים','פיצה נפוליטנית נאפית בתנור חם מאוד לזמן קצר מאוד, ולכן השוליים תפוחים ומעט חרוכים.','',25,565,430),
    P(TA,'חומוסייה ליד השוק','מזרח תיכוני','חומוס חם עם גרגירים ושמן זית','חומוס טוב מגישים חם ורך, עם גרגירים שלמים, שמן זית, פפריקה וחצי בצל.','נגבו עם פיתה, בלי מזלג.',20,330,290),
    P(TA,'גלידה איטלקית','קינוחים','גלידת פיסטוק ושוקולד מריר','ג׳לטו מכילה פחות אוויר מגלידה רגילה, ולכן היא סמיכה יותר והטעם חזק יותר.','',10,420,610),
    P(TA,'מעדניית גבינות בשוק','שוק ודוכנים','מגש טעימות גבינות וזיתים','המעדניות בשוק מוכרות גבינות מקומיות ממחלבות קטנות לצד גבינות מאירופה.','בקשו לטעום לפני שקונים.',15,335,445),
    P(TA,'בר יין קטן','בר ויין','כוס יין מקומי עם כמה נשנושים','ישראל מגדלת יין כבר אלפי שנים, וכיום יש יקבים קטנים כמעט בכל אזור בארץ.','',30,235,760),
    P(TA,'באן מדוכן אסייתי','אסייתי','באן מאודה עם בטן חזיר או פטריות','באן הוא לחמניה רכה שמאדים בסל במבוק וממלאים במילוי עשיר.','',15,640,900),
    P(TA,'מטבח טבעוני בסמטה','טבעוני','ירקות קלויים על טחינה ירוקה','המטבח הטבעוני של תל אביב נחשב לאחד המגוונים בעולם.','',20,270,655),
    P(JA,'מגדל השעון','שוק ודוכנים','תה עם נענע מדוכן ברחבה','המגדל נבנה בתחילת המאה ה-20 לכבוד יובל שלטונו של הסולטן העות׳מאני עבדול חמיד השני.','קבעו כאן נקודת מפגש לקבוצה.',10,380,300),
    P(JA,'מאפייה ותיקה','מאפייה','בייגלה יפואי עם זעתר וביצה','מאפיות יפו עובדות כמעט מסביב לשעון, והבייגלה עם הזעתר הוא הסמל שלהן.','אכלו אותו חם, ישר מהשקית.',15,395,400),
    P(JA,'שוק הפשפשים','שוק ודוכנים','מיץ תמרהינדי קר','בין דוכני העתיקות מסתתרים בתי קפה ודוכנים קטנים. השוק מתמלא בעיקר בימי שישי.','',20,520,470),
    P(JA,'דג בנמל','דגים ופירות ים','דג טרי על הגריל עם לימון','יפו היא אחד הנמלים העתיקים בעולם. דייגים עדיין יוצאים מכאן לים.','בשקיעה הנמל יפה במיוחד.',30,290,650),
    P(JA,'שקשוקה בסמטה','מזרח תיכוני','שקשוקה במחבת ברזל','שקשוקה הגיעה לכאן עם יהודי צפון אפריקה: ביצים שמתבשלות ברוטב עגבניות ופלפלים.','',25,480,560),
    P(JA,'כנאפה חמה','קינוחים','כנאפה עם גבינה מלוחה וסירופ','כנאפה היא קינוח של בצק קדאיף וגבינה, שנאפה ומגישים חם עם סירופ סוכר.','',15,440,700),
    P(JA,'קפה טורקי','בית קפה','קפה עם הל בפינג׳אן','קפה טורקי מבשלים בפינג׳אן קטן ומגישים בלי לסנן, כך שהמשקע נשאר בתחתית.','אל תשתו עד הסוף.',15,330,600)
  ];
}
function cityPlaces(){
  const JR='ירושלים', HF='חיפה', AK='עכו', NZ='נצרת';
  return [
    P(JR,'בייגלה בשוק מחנה יהודה','מאפייה','בייגלה ירושלמי עם זעתר','הבייגלה הירושלמי הוא מאפה מוארך ומכוסה שומשום, קרוב לכעכים של העיר העתיקה. מגישים אותו עם קצת זעתר בצד.','קנו אחד חם ותאכלו תוך כדי הליכה.',10,150,350),
    P(JR,'מרק קובה בשוק','מזרח תיכוני','קובה במרק חמוסטה או סלק','הקובה הגיעה עם יהודי עיראק וכורדיסטן: כיסוני סולת ממולאים בבשר שמתבשלים במרק חמוץ.','שאלו איזה מרק מומלץ היום.',25,310,420),
    P(JR,'מעורב ירושלמי','בשרים וגריל','מעורב ירושלמי בפיתה','מנה של בשר עוף ובצל על פלנצ׳ה לוהטת עם תבלינים. לפי המסורת המקומית היא נולדה באזור שוק מחנה יהודה.','',20,300,510),
    P(JR,'רוגלך מהמאפייה בשוק','מאפייה','רוגלך שוקולד חם','מאפיות השוק אופות רוגלך שוקולד דביק, ובימי שישי בבוקר התורים ארוכים במיוחד.','',10,240,395),
    P(JR,'בית קפה בנחלאות','בית קפה','קפה ועוגת שמרים','נחלאות היא אוסף של שכונות קטנות שנבנו מסוף המאה ה-19, עם חצרות פנימיות וסמטאות צרות.','הסתובבו בסמטאות לפני שמתיישבים.',20,200,545),
    P(JR,'חומוסייה בעיר העתיקה','מזרח תיכוני','חומוס עם פול','בסמטאות העיר העתיקה פועלות חומוסיות ותיקות שנפתחות מוקדם בבוקר ונסגרות אחרי הצהריים.','הגיעו לפני הצהריים.',20,640,730),
    P(JR,'כנאפה ליד שער שכם','קינוחים','כנאפה חמה עם פיסטוק','כנאפה של בצק קדאיף וגבינה מלוחה, אפויה ומוגשת חמה עם סירופ סוכר.','',15,600,545),
    P(HF,'פלאפל בוואדי ניסנאס','אוכל רחוב','פלאפל בפיתה עם סלט וטחינה','ואדי ניסנאס היא שכונה ערבית ותיקה במרכז חיפה. בדצמבר מתקיים בה פסטיבל "החג של החגים", שמציין יחד חגים של כמה דתות.','',15,330,520),
    P(HF,'מאפייה בוואדי ניסנאס','מאפייה','מנאקיש זעתר','מנאקיש הוא מאפה שטוח עם זעתר ושמן זית, ארוחת בוקר נפוצה בכל הלבנט.','',10,410,565),
    P(HF,'בקלאווה בוואדי','קינוחים','בקלאווה עם אגוזים ודבש','בקלאווה עשויה משכבות דקות של בצק פילו, אגוזים וסירופ.','בקשו מגש טעימות קטן.',10,330,610),
    P(HF,'שוק תלפיות','שוק ודוכנים','פירות יבשים ותבלינים','שוק תלפיות בשכונת הדר נבנה בסוף שנות השלושים, והיה מהשווקים המקורים הראשונים בארץ.','',20,520,550),
    P(HF,'שווארמה בהדר','בשרים וגריל','שווארמה בלאפה','שכונת הדר הייתה המרכז המסחרי של חיפה, ועד היום יש בה דוכני אוכל רחוב ותיקים.','',20,560,700),
    P(HF,'בית קפה ברחוב מסדה','בית קפה','קפה וכריך','רחוב מסדה בהדר מלא בבתי קפה קטנים, חנויות יד שנייה וגלריות.','',20,635,830),
    P(HF,'דגים במושבה הגרמנית','דגים ופירות ים','דג על הגריל עם סלטים','המושבה הגרמנית נוסדה ב-1868 על ידי הטמפלרים. השדרה הראשית שלה מובילה ישר אל הגנים הבהאיים.','צלמו את המדרגות של הגנים מהשדרה.',30,240,380),
    P(AK,'חומוסייה בעכו העתיקה','מזרח תיכוני','חומוס חם עם שמן זית ופטרוזיליה','עכו מפורסמת בחומוסיות שלה, ויש מי שנוסעים לעיר במיוחד בשבילן.','',20,420,480),
    P(AK,'השוק העתיק','שוק ודוכנים','תבלינים, פירות ומיץ טרי','השוק עובר בין בתי אבן מהתקופה העות׳מאנית. העיר העתיקה של עכו מוכרזת אתר מורשת עולמית.','',20,340,600),
    P(AK,'קפה ליד ח׳אן אל-עומדאן','בית קפה','קפה עם הל','ח׳אן אל-עומדאן הוא אכסניית שיירות עות׳מאנית עם מגדל שעון, ליד הנמל.','',15,420,790),
    P(AK,'כנאפה בשוק','קינוחים','כנאפה חמה','מגישים אותה ישר מהמגש הגדול, חמה ונמתחת.','',15,480,650),
    P(AK,'דגים בנמל הדייגים','דגים ופירות ים','דג טרי על הגריל','דייגים עדיין יוצאים מנמל עכו, ובמסעדות שליד החומה מגישים את מה שעלה ברשת באותו בוקר.','שבו ליד החומה בשקיעה.',30,280,880),
    P(NZ,'בית קלייה בשוק העתיק','שוק ודוכנים','קפה עם הל ותערובות תבלינים','בשוק העתיק של נצרת יש בתי קלייה ותיקים שקולים קפה וטוחנים תבלינים במקום.','הריחו לפני שבוחרים.',15,520,430),
    P(NZ,'מאפייה בשוק','מאפייה','פיתה זעתר וסמבוסק','המאפיות הקטנות בשוק אופות בתנורי אבן מהבוקר המוקדם.','',10,460,500),
    P(NZ,'מטבח גלילי','מזרח תיכוני','מקלובה','מקלובה פירושה "הפוכה" בערבית: אורז, ירקות ובשר שמתבשלים בסיר, ולפני ההגשה הופכים את הסיר על המגש.','',30,310,760),
    P(NZ,'כנאפה בעיר העתיקה','קינוחים','כנאפה עם גבינה נאבלסית','נצרת נחשבת לאחד המקומות המפורסמים בארץ לכנאפה.','',15,400,590)
  ];
}
function samples(){
  const S=(title,type,dish,story,tip,minutes,x,y)=>({id:uid(),title,type,dish,story,tip,minutes,x,y});
  return [
  {id:'carmel',name:'שוק הכרמל וכרם התימנים',area:'תל אביב',intro:'סיור לדוגמה: מסלול רגלי של כשעה וחצי, מהשער של השוק דרך סמטאות כרם התימנים ועד קינוח בסוף הדרך.',stops:[
    S('שער השוק','שוק ודוכנים','מיץ רימונים סחוט טרי','שוק הכרמל קם בשנות העשרים של המאה הקודמת. היום זה השוק הגדול בעיר: ירקות, תבלינים, דגים ומאפים לאורך רחוב אחד ארוך.','בבוקר השוק שקט, ויש זמן לדבר עם המוכרים.',10,440,330),
    S('דוכן הבורקס','מאפייה','בורקס גבינה ותפוחי אדמה עם ביצה חומה','הבורקס הגיע לכאן עם יהודי טורקיה והבלקן. הבצק נמתח דק מאוד, והמילויים הקלאסיים הם גבינה, תפוחי אדמה ותרד.','קחו אחד לחלוקה. יש עוד הרבה תחנות.',15,370,385),
    S('כרם התימנים','מזרח תיכוני',"ג'חנון עם רסק עגבניות וסחוג","השכונה נוסדה בתחילת המאה ה-20 על ידי עולים מתימן. הג'חנון נאפה בתנור כל הלילה של שבת, כדי שיהיה חם בבוקר.",'שאלו על החילבה.',20,225,450),
    S('דוכן הסביח','אוכל רחוב','חציל מטוגן, ביצה, טחינה ועמבה בפיתה','הסביח מגיע מהמטבח של יהודי עיראק, שאכלו חציל מטוגן וביצה קשה בבוקר שבת.','עמבה היא רוטב מנגו חמוץ. בפעם הראשונה בקשו רק קצת.',15,300,525),
    S('בית הקפה בסוף הסמטה','קינוחים','מלבי עם מי ורדים, וקפה עם הל','מלבי הוא פודינג חלב רך עם מי ורדים, סירופ ואגוזים קצוצים. כאן נגמר המסלול, והאוצר מחכה בצלחת.','זה הזמן לשאול את הקבוצה איזה טעם הכי נזכר.',20,190,585)
  ]},
  {id:'jaffa',name:'סמטאות יפו',area:'יפו',intro:'סיור לדוגמה: מהשעון ועד הנמל, עם מאפה חם, שוק פשפשים ודג על הגריל.',stops:[
    S('מגדל השעון','שוק ודוכנים','תה עם נענע מדוכן ברחבה','המגדל נבנה בתחילת המאה ה-20 לכבוד יובל שלטונו של הסולטן העות׳מאני עבדול חמיד השני.','קבעו כאן נקודת מפגש לקבוצה.',10,380,300),
    S('מאפייה ותיקה','מאפייה','בייגלה יפואי עם זעתר וביצה','מאפיות יפו עובדות כמעט מסביב לשעון, והתורים לא נגמרים גם בלילה.','אכלו אותו חם, ישר מהשקית.',15,395,400),
    S('שוק הפשפשים','שוק ודוכנים','מיץ תמרהינדי קר','בין דוכני העתיקות והרהיטים הישנים מסתתרים בתי קפה ודוכנים קטנים.','כל משתתף בוחר חפץ ישן אחד ומספר מה הסיפור שלו.',20,520,470),
    S('נמל יפו','דגים ופירות ים','דג טרי על הגריל עם לימון','יפו היא אחד הנמלים העתיקים בעולם. במסעדות ליד הרציף מגישים את מה שעלה ברשת באותו בוקר.','בשקיעה הנמל יפה במיוחד.',30,290,650)
  ]}];
}

/* ---------- Stored data validation (defense in depth) ---------- */
const cleanStr=(v,max)=>typeof v==='string'?v.slice(0,max):'';
const cleanNum=(v,a,b,d)=>{v=+v;return Number.isFinite(v)?clamp(v,a,b):d};
const cleanId=v=>/^[A-Za-z0-9_-]{1,40}$/.test(v||'')?v:uid();
function cleanStop(x){x=x||{};const o={id:cleanId(x.id),x:cleanNum(x.x,0,800,400),y:cleanNum(x.y,0,1100,550),title:cleanStr(x.title,60),addr:cleanStr(x.addr,120),type:cleanStr(x.type,30),dish:cleanStr(x.dish,120),story:cleanStr(x.story,3000),tip:cleanStr(x.tip,200),minutes:cleanNum(x.minutes,0,600,15),visited:x.visited===true};if(x.placeId)o.placeId=cleanId(x.placeId);return o}
function cleanPlace(p){p=p||{};return {id:cleanId(p.id),area:cleanStr(p.area,40),name:cleanStr(p.name,60),addr:cleanStr(p.addr,120),type:cleanStr(p.type,30),dish:cleanStr(p.dish,120),story:cleanStr(p.story,3000),tip:cleanStr(p.tip,200),minutes:cleanNum(p.minutes,0,600,15),x:cleanNum(p.x,0,800,400),y:cleanNum(p.y,0,1100,550)}}
function cleanState(s){
  if(!s||typeof s!=='object'||!Array.isArray(s.tours)) return null;
  const o={tours:s.tours.slice(0,500).filter(t=>t&&typeof t==='object').map(t=>({id:cleanId(t.id),name:cleanStr(t.name,60),area:cleanStr(t.area,40),intro:cleanStr(t.intro,1000),stops:Array.isArray(t.stops)?t.stops.slice(0,60).map(cleanStop):[]}))};
  if(Array.isArray(s.places)) o.places=s.places.slice(0,2000).map(cleanPlace);
  ['seeded','cities2','maps3','addr4'].forEach(k=>{if(s[k]===true)o[k]=true});
  return o;
}
let state={tours:[]};
try{const s=cleanState(JSON.parse(localStorage.getItem(KEY)||'null')); if(s) state=s;}catch(e){}
if(!state.seeded){state={tours:samples(),places:samplePlaces(),seeded:true};}
if(!Array.isArray(state.places)) state.places=samplePlaces();
if(!state.cities2){const have=new Set(state.places.map(p=>p.area));cityPlaces().forEach(p=>{if(!have.has(p.area))state.places.push(p)});state.cities2=true;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}
if(!state.addr4){
  const A={'תל אביב':{'דוכן הבורקס בשוק':'שוק הכרמל',"ג'חנון בכרם התימנים":'כרם התימנים','דוכן הסביח':'כרם התימנים','מלבי בסוף הסמטה':'כרם התימנים','בית קפה בנחלת בנימין':'נחלת בנימין','ראמן בפלורנטין':'פלורנטין','פיצרייה ברחוב אלנבי':'אלנבי','חומוסייה ליד השוק':'שוק הכרמל','גלידה איטלקית':'שוק הכרמל','מעדניית גבינות בשוק':'שוק הכרמל','בר יין קטן':'נווה צדק','באן מדוכן אסייתי':'פלורנטין','מטבח טבעוני בסמטה':'כרם התימנים','שער השוק':'שוק הכרמל','דוכן הבורקס':'שוק הכרמל','כרם התימנים':'כרם התימנים','בית הקפה בסוף הסמטה':'כרם התימנים'},
   'יפו':{'מגדל השעון':'מגדל השעון יפו','מאפייה ותיקה':'רחוב יפת','שוק הפשפשים':'שוק הפשפשים יפו','דג בנמל':'נמל יפו','נמל יפו':'נמל יפו','שקשוקה בסמטה':'שוק הפשפשים יפו','כנאפה חמה':'רחוב יפת','קפה טורקי':'יפו העתיקה'},
   'ירושלים':{'בייגלה בשוק מחנה יהודה':'שוק מחנה יהודה','רוגלך מהמאפייה בשוק':'שוק מחנה יהודה','מרק קובה בשוק':'שוק מחנה יהודה','מעורב ירושלמי':'רחוב אגריפס','בית קפה בנחלאות':'נחלאות','חומוסייה בעיר העתיקה':'הרובע המוסלמי, העיר העתיקה','כנאפה ליד שער שכם':'שער שכם'},
   'חיפה':{'פלאפל בוואדי ניסנאס':'ואדי ניסנאס','מאפייה בוואדי ניסנאס':'ואדי ניסנאס','בקלאווה בוואדי':'ואדי ניסנאס','שוק תלפיות':'שוק תלפיות','שווארמה בהדר':'הדר הכרמל','בית קפה ברחוב מסדה':'רחוב מסדה','דגים במושבה הגרמנית':'המושבה הגרמנית'},
   'עכו':{'חומוסייה בעכו העתיקה':'העיר העתיקה','השוק העתיק':'השוק העתיק','קפה ליד ח׳אן אל-עומדאן':'חאן אל עומדאן','כנאפה בשוק':'השוק העתיק','דגים בנמל הדייגים':'נמל עכו'},
   'נצרת':{'בית קלייה בשוק העתיק':'השוק העתיק','מאפייה בשוק':'השוק העתיק','מטבח גלילי':'רחוב פאולוס השישי','כנאפה בעיר העתיקה':'העיר העתיקה'}};
  state.places.forEach(p=>{const a=(A[p.area]||{})[p.name];if(a&&!p.addr)p.addr=a});
  state.tours.forEach(t=>t.stops.forEach(x=>{const a=(A[t.area]||{})[x.title];if(a&&!x.addr)x.addr=a}));
  state.addr4=true;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
}
if(!state.maps3){
  const pos={};samplePlaces().concat(cityPlaces()).forEach(p=>pos[p.area+'|'+p.name]=p);
  state.places.forEach(p=>{const q=pos[p.area+'|'+p.name];if(q){p.x=q.x;p.y=q.y}});
  const tp={};samples().forEach(t=>t.stops.forEach(x=>tp[t.id+'|'+x.title]=x));
  const byId={};state.places.forEach(p=>byId[p.id]=p);
  state.tours.forEach(t=>t.stops.forEach(x=>{const q=tp[t.id+'|'+x.title]||byId[x.placeId];if(q){x.x=q.x;x.y=q.y}}));
  state.maps3=true;try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}
}
function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){}}

let view={screen:'home',tourId:null,edit:false};
let sug=null;
let bankFilter={area:'',type:''};
const app=document.getElementById('app'), layer=document.getElementById('layer');
const tour=()=>state.tours.find(t=>t.id===view.tourId);
const areas=()=>[...new Set(state.places.map(p=>p.area||'בלי אזור'))];
function go2(screen,extra){view={screen,...extra};render(screen==='tour');scrollTo(0,0)}

/* ---------- Logo ---------- */
function logoSVG(){
  return `<svg class="logo" viewBox="0 0 200 200" role="img" aria-label="הלוגו של קפטן פודי: ראש של פיראט מעל בגט ואקלר מוצלבים וכוס קפה">
    <defs><radialGradient id="flag" cx="50%" cy="40%" r="65%"><stop offset="0" stop-color="#3a2618"/><stop offset="1" stop-color="#140c07"/></radialGradient></defs>
    <circle cx="100" cy="100" r="96" fill="url(#flag)" stroke="#c8953a" stroke-width="6"/>
    <circle cx="100" cy="100" r="86" fill="none" stroke="#ecd9ab" stroke-opacity=".45" stroke-width="1.5" stroke-dasharray="3 5"/>
    <g transform="rotate(-38 100 108)">
      <rect x="22" y="95" width="156" height="26" rx="13" fill="#d9a456" stroke="#140c07" stroke-width="2.5"/>
      <path d="M48 101 l10 14 M72 101 l10 14 M96 101 l10 14 M120 101 l10 14 M144 101 l10 14" stroke="#f3d79a" stroke-width="4" stroke-linecap="round"/>
    </g>
    <g transform="rotate(38 100 108)">
      <rect x="30" y="96" width="140" height="24" rx="12" fill="#e7bd74" stroke="#140c07" stroke-width="2.5"/>
      <path d="M34 108 Q34 96 46 96 L154 96 Q166 96 166 108 q-8 4 -14 0 q-8 5 -16 0 q-8 5 -16 0 q-8 5 -16 0 q-8 5 -16 0 q-8 5 -16 0 q-8 5 -16 0 q-8 4 -14 0Z" fill="#4a2716"/>
      <path d="M52 100 L120 100" stroke="#f6e3c0" stroke-opacity=".55" stroke-width="2.5" stroke-linecap="round"/>
    </g>
    <g>
      <ellipse cx="100" cy="171" rx="24" ry="5" fill="#ecd9ab" stroke="#140c07" stroke-width="2"/>
      <path d="M118 148 q12 0 12 9 q0 9 -14 9" fill="none" stroke="#ecd9ab" stroke-width="4"/>
      <path d="M83 142 L117 142 L113 165 Q100 170 87 165Z" fill="#ecd9ab" stroke="#140c07" stroke-width="2"/>
      <ellipse cx="100" cy="143" rx="16" ry="3" fill="#4a2716"/>
      <path d="M92 154 h16" stroke="#86201a" stroke-width="3"/>
    </g>
    <g>
      <circle cx="100" cy="94" r="33" fill="#f3e3c0" stroke="#140c07" stroke-width="2.5"/>
      <path d="M48 78 Q62 52 78 50 Q100 6 122 50 Q138 52 152 78 Q126 64 100 70 Q74 64 48 78Z" fill="#86201a" stroke="#140c07" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M56 72 Q100 50 144 72" fill="none" stroke="#c8953a" stroke-width="3"/>
      <radialGradient id="praline" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="#8a5530"/><stop offset=".55" stop-color="#4a2716"/><stop offset="1" stop-color="#24120a"/></radialGradient>
      <circle cx="100" cy="44" r="9.5" fill="url(#praline)" stroke="#140c07" stroke-width="1.5"/>
      <path d="M92 46 q4 -3 8 0 t8 0" fill="none" stroke="#ecd9ab" stroke-opacity=".8" stroke-width="1.3" stroke-linecap="round"/>
      <ellipse cx="96.5" cy="40" rx="2.6" ry="1.7" fill="#f6e3c0" fill-opacity=".7"/>
      <path d="M68 80 L134 104" stroke="#140c07" stroke-width="2.5"/>
      <circle cx="113" cy="91" r="9" fill="#140c07"/>
      <path d="M80 83 q6 -4 12 0" fill="none" stroke="#140c07" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="86" cy="92" r="4" fill="#140c07"/>
      <path d="M99 96 q4 6 0 9" fill="none" stroke="#140c07" stroke-width="2" stroke-linecap="round"/>
      <path d="M100 108 q-9 -6 -19 2 q-4 4 -1 7 q2 -6 9 -5 q6 0 11 -4Z M100 108 q9 -6 19 2 q4 4 1 7 q-2 -6 -9 -5 q-6 0 -11 -4Z" fill="#4a2716" stroke="#140c07" stroke-width="1"/>
      <path d="M89 117 Q100 125 111 117" fill="none" stroke="#140c07" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="102" y="118" width="4" height="4" fill="#c8953a"/>
      <circle cx="131" cy="104" r="3.5" fill="none" stroke="#c8953a" stroke-width="2"/>
    </g>
  </svg>`;
}

/* ---------- Treasure chest (realistic) ---------- */
function chestSVG(){
  return `<svg viewBox="44 24 312 250" aria-hidden="true">
<defs>
<linearGradient id="rWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9a5f2c"></stop><stop offset="0.55" stop-color="#7a4520"></stop><stop offset="1" stop-color="#4a2810"></stop></linearGradient>
<linearGradient id="rLid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b3c1a"></stop><stop offset="1" stop-color="#2a160a"></stop></linearGradient>
<linearGradient id="rSide" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3a200e"></stop><stop offset="1" stop-color="#6b3c1a"></stop></linearGradient>
<linearGradient id="rIron" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#77716a"></stop><stop offset="0.45" stop-color="#3f3a35"></stop><stop offset="1" stop-color="#1f1c19"></stop></linearGradient>
<linearGradient id="rBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b0"></stop><stop offset="0.35" stop-color="#e2b04a"></stop><stop offset="0.7" stop-color="#a8761f"></stop><stop offset="1" stop-color="#6a4410"></stop></linearGradient>
<radialGradient id="rCoin" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#fff6c4"></stop><stop offset="0.4" stop-color="#f0c040"></stop><stop offset="1" stop-color="#9a6410"></stop></radialGradient>
<radialGradient id="rHeap" cx="50%" cy="20%" r="80%"><stop offset="0" stop-color="#ffe27a"></stop><stop offset="0.6" stop-color="#d79a22"></stop><stop offset="1" stop-color="#7a4c0a"></stop></radialGradient>
<radialGradient id="rGlow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd77a" stop-opacity="0.55"></stop><stop offset="1" stop-color="#ffd77a" stop-opacity="0"></stop></radialGradient>
<radialGradient id="rRuby" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ff9a8a"></stop><stop offset="0.45" stop-color="#d0180c"></stop><stop offset="1" stop-color="#4a0200"></stop></radialGradient>
<radialGradient id="rShadow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity="0.6"></stop><stop offset="1" stop-color="#000" stop-opacity="0"></stop></radialGradient>
<linearGradient id="rPlate" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8c06a"></stop><stop offset="1" stop-color="#a87a28"></stop></linearGradient>
</defs>
<ellipse cx="200" cy="268" rx="160" ry="12" fill="url(#rShadow)"></ellipse>
<ellipse class="ch-glow" cx="200" cy="104" rx="150" ry="70" fill="url(#rGlow)"></ellipse>
<g class="lid-open"><path d="M78 154 L70 74 Q70 58 86 60 L94 66 Q82 70 84 84 L92 154Z" fill="url(#rSide)"></path>
<path d="M322 154 L330 74 Q330 58 314 60 L306 66 Q318 70 316 84 L308 154Z" fill="url(#rSide)"></path>
<path d="M88 154 L92 66 Q200 30 308 66 L312 154Z" fill="url(#rLid)"></path>
<path d="M92 66 Q200 30 308 66" fill="none" stroke="url(#rIron)" stroke-width="8"></path>
<path d="M90 104 Q200 72 310 104 M89 132 Q200 104 311 132" fill="none" stroke="#1e0f05" stroke-width="2" stroke-opacity="0.8"></path>
<path d="M100 86 Q160 70 220 66 M110 118 Q190 98 290 104 M120 146 Q200 128 300 134" fill="none" stroke="#a0683a" stroke-width="0.8" stroke-opacity="0.45"></path>
</g>
<path d="M76 156 Q118 98 200 102 Q282 98 324 156Z" fill="url(#rHeap)"></path>
<g fill="url(#rCoin)" stroke="#8a5a10" stroke-width="0.9">
<ellipse cx="250" cy="118" rx="10.5" ry="6" transform="rotate(6 250 118)"></ellipse><ellipse cx="196" cy="116" rx="10.5" ry="6" transform="rotate(-8 196 116)"></ellipse><ellipse cx="172" cy="122" rx="10.5" ry="6" transform="rotate(5 172 122)"></ellipse><ellipse cx="150" cy="130" rx="10.5" ry="6" transform="rotate(-20 150 130)"></ellipse><ellipse cx="246" cy="126" rx="10.5" ry="6" transform="rotate(-15 246 126)"></ellipse><ellipse cx="128" cy="138" rx="10.5" ry="6" transform="rotate(15 128 138)"></ellipse><ellipse cx="186" cy="136" rx="10.5" ry="6" transform="rotate(18 186 136)"></ellipse><ellipse cx="210" cy="132" rx="10.5" ry="6" transform="rotate(-6 210 132)"></ellipse><ellipse cx="236" cy="138" rx="10.5" ry="6" transform="rotate(10 236 138)"></ellipse><ellipse cx="292" cy="140" rx="10.5" ry="6" transform="rotate(10 292 140)"></ellipse><ellipse cx="160" cy="144" rx="10.5" ry="6" transform="rotate(-12 160 144)"></ellipse><ellipse cx="110" cy="146" rx="10.5" ry="6" transform="rotate(-10 110 146)"></ellipse><ellipse cx="260" cy="146" rx="10.5" ry="6" transform="rotate(-18 260 146)"></ellipse><ellipse cx="310" cy="148" rx="10.5" ry="6" transform="rotate(-5 310 148)"></ellipse><ellipse cx="200" cy="148" rx="10.5" ry="6"></ellipse><ellipse cx="120" cy="150" rx="10.5" ry="6" transform="rotate(8 120 150)"></ellipse><ellipse cx="176" cy="150" rx="10.5" ry="6" transform="rotate(-4 176 150)"></ellipse><ellipse cx="284" cy="150" rx="10.5" ry="6" transform="rotate(6 284 150)"></ellipse><ellipse cx="228" cy="152" rx="10.5" ry="6" transform="rotate(14 228 152)"></ellipse><ellipse cx="140" cy="152" rx="10.5" ry="6" transform="rotate(-16 140 152)"></ellipse>
</g>
<g fill="#fff8d8"><circle cx="193" cy="113" r="1.6"></circle><circle cx="147" cy="127" r="1.4"></circle><circle cx="232" cy="135" r="1.5"></circle><circle cx="288" cy="137" r="1.4"></circle><circle cx="157" cy="141" r="1.3"></circle><circle cx="246" cy="115" r="1.5"></circle></g>
<g transform="translate(140 124) rotate(-12) scale(1.35)"><ellipse rx="10" ry="5.5" fill="none" stroke="url(#rBrass)" stroke-width="3.2"></ellipse><path d="M-5 -6 h10 l-2 -3 h-6z" fill="url(#rBrass)"></path><path d="M0 -19 l6.5 6 l-6.5 5 l-6.5 -5z" fill="url(#rRuby)"></path><path d="M-2.5 -14 l2.5 -2.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.85"></path></g>
<g transform="translate(214 112) rotate(10) scale(1.35)"><ellipse rx="10" ry="5.5" fill="none" stroke="url(#rBrass)" stroke-width="3.2"></ellipse><path d="M-5 -6 h10 l-2 -3 h-6z" fill="url(#rBrass)"></path><path d="M0 -19 l6.5 6 l-6.5 5 l-6.5 -5z" fill="url(#rRuby)"></path><path d="M-2.5 -14 l2.5 -2.5" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-opacity="0.85"></path></g>
<g transform="translate(270 128) rotate(14)"><path d="M-19 0 L-21 -22 L-11 -11 L0 -26 L11 -11 L21 -22 L19 0Z" fill="url(#rBrass)" stroke="#6a4410" stroke-width="0.8"></path><rect x="-20" y="-6" width="40" height="9" rx="2" fill="url(#rBrass)" stroke="#6a4410" stroke-width="0.8"></rect><circle cx="-21" cy="-24" r="2.8" fill="#f6eedd"></circle><circle cx="0" cy="-28" r="3" fill="#f6eedd"></circle><circle cx="21" cy="-24" r="2.8" fill="#f6eedd"></circle><path d="M0 -6 l4 4.5 l-4 4.5 l-4 -4.5z" fill="url(#rRuby)"></path><circle cx="-11" cy="-1.5" r="2.6" fill="#1f7a4a"></circle><circle cx="11" cy="-1.5" r="2.6" fill="#1f7a4a"></circle></g>
<g class="lid-closed">
<path d="M62 152 L62 116 Q200 62 338 116 L338 152Z" fill="url(#rWood)"></path>
<path d="M66 132 Q200 88 334 132 M66 144 Q200 104 334 144" fill="none" stroke="#2a1608" stroke-width="1.6"></path>
<path d="M80 124 Q150 98 220 94 M120 138 Q200 116 300 124" fill="none" stroke="#b07440" stroke-width="0.8" stroke-opacity="0.5"></path>
<path d="M74 111 L94 104 L94 152 L74 152Z" fill="url(#rIron)"></path><path d="M306 104 L326 111 L326 152 L306 152Z" fill="url(#rIron)"></path>
<path d="M62 116 Q200 62 338 116" fill="none" stroke="url(#rIron)" stroke-width="8"></path>
<g fill="#b8b0a4"><circle cx="84" cy="120" r="2.2"></circle><circle cx="84" cy="138" r="2.2"></circle><circle cx="316" cy="120" r="2.2"></circle><circle cx="316" cy="138" r="2.2"></circle></g>
<rect x="190" y="128" width="20" height="22" rx="2" fill="url(#rBrass)"></rect>
</g>
<rect x="68" y="152" width="264" height="112" rx="3" fill="url(#rWood)"></rect>
<path d="M70 198 H330 M70 232 H330" stroke="#2a1608" stroke-width="2"></path>
<path d="M74 176 Q140 170 200 178 T326 174 M74 214 Q150 220 220 212 T326 216 M74 250 Q130 244 210 252 T326 248" fill="none" stroke="#3a1f0c" stroke-width="0.9" stroke-opacity="0.55"></path>
<path d="M90 184 q30 -4 60 0 M230 190 q40 4 80 -2 M100 224 q24 3 50 -1 M250 240 q30 -3 60 1" fill="none" stroke="#b07440" stroke-width="0.8" stroke-opacity="0.5"></path>
<rect x="68" y="160" width="264" height="10" fill="#000" fill-opacity="0.25"></rect>
<rect x="62" y="146" width="276" height="18" rx="3" fill="url(#rIron)"></rect>
<rect x="74" y="146" width="20" height="118" fill="url(#rIron)"></rect><rect x="306" y="146" width="20" height="118" fill="url(#rIron)"></rect>
<g fill="#b8b0a4"><circle cx="84" cy="172" r="2.4"></circle><circle cx="84" cy="200" r="2.4"></circle><circle cx="84" cy="228" r="2.4"></circle><circle cx="84" cy="254" r="2.4"></circle><circle cx="316" cy="172" r="2.4"></circle><circle cx="316" cy="200" r="2.4"></circle><circle cx="316" cy="228" r="2.4"></circle><circle cx="316" cy="254" r="2.4"></circle><circle cx="110" cy="155" r="2"></circle><circle cx="150" cy="155" r="2"></circle><circle cx="250" cy="155" r="2"></circle><circle cx="290" cy="155" r="2"></circle></g>
<ellipse cx="60" cy="214" rx="6" ry="12" fill="none" stroke="url(#rIron)" stroke-width="3.5"></ellipse>
<ellipse cx="340" cy="214" rx="6" ry="12" fill="none" stroke="url(#rIron)" stroke-width="3.5"></ellipse>
<rect x="190" y="146" width="20" height="26" rx="2" fill="url(#rBrass)"></rect>
<path d="M193 180 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="url(#rIron)" stroke-width="3.5"></path>
<rect x="186" y="178" width="28" height="22" rx="4" fill="url(#rBrass)"></rect><circle cx="200" cy="187" r="2.8" fill="#1a0f05"></circle><path d="M198.7 188 h2.6 l.9 6.5 h-4.4z" fill="#1a0f05"></path>
<rect x="132" y="210" width="136" height="38" rx="3" fill="url(#rPlate)" stroke="#5a3a10" stroke-width="1.2"></rect>
<rect x="135" y="213" width="130" height="32" rx="2" fill="none" stroke="#fff3c4" stroke-opacity="0.5" stroke-width="0.8"></rect>
<g fill="#5a3a10"><circle cx="139" cy="217" r="1.8"></circle><circle cx="261" cy="217" r="1.8"></circle><circle cx="139" cy="241" r="1.8"></circle><circle cx="261" cy="241" r="1.8"></circle></g>
<text x="200" y="237" text-anchor="middle" font-family="Suez One, Frank Ruhl Libre, serif" font-size="21" fill="#fff3c4" fill-opacity="0.55">בנק האתרים</text>
<text x="200" y="236" text-anchor="middle" font-family="Suez One, Frank Ruhl Libre, serif" font-size="21" fill="#3a2410">בנק האתרים</text>
</svg>`;
}

/* ---------- Home ---------- */
function renderHome(){
  const tiles=state.tours.map(t=>`
    <article class="scroll">
      <button class="scroll-open" data-open="${t.id}" aria-label="פתיחת ${esc(t.name)}">
        <svg class="mini" viewBox="0 0 ${W} ${H}" aria-hidden="true">
          <path class="mini-street" d="M0 300 L800 250 M0 720 L800 780 M240 0 L300 1100 M570 0 L520 1100"/>
          <path class="mini-route" d="${smooth(t.stops)}"/>
          ${t.stops.map(s=>`<circle class="mini-dot" cx="${s.x}" cy="${s.y}" r="30"/>`).join('')}
        </svg>
        <div class="scroll-text">
          <h3>${esc(t.name)}</h3>
          ${t.area?`<div class="area">${esc(t.area)}</div>`:''}
          <div class="meta">${t.stops.length} תחנות${t.stops.length?` · כ-${fmt(eatOf(t.stops)+walkOf(t.stops))}`:''}</div>
        </div>
      </button>
      <div class="scroll-foot"><button class="del" data-del="${t.id}">מחיקת הסיור</button></div>
    </article>`).join('');
  const nA=areas().length;
  app.innerHTML=`
    <header class="home-head">
      ${logoSVG()}
      <div class="brand">קפטן פודי</div>
      <h1>הפיראט הרעב</h1>
      <p class="lede">כל סיור אוכל הוא מפת מטמון: תחנות, סיפורים ומנות לאורך הדרך, וקלף ישן לכל תחנה.</p>
      <div class="home-actions">
        <button class="seal-btn" id="newTour">＋ סיור חדש</button>
        <button class="seal-btn gold" id="suggestBtn">הציעו לי סיור</button>
      </div>
    </header>
    <button class="chest" id="bankBtn" aria-label="פתיחת בנק האתרים: ${state.places.length} אתרים">
      ${chestSVG()}
    </button>
    <div class="chest-cta">${state.places.length} אתרים ב-${nA} ${nA===1?'אזור':'אזורים'} · פתחו את התיבה</div>
    <h2 class="shelf-title">הסיורים שלי</h2>
    ${tiles?`<div class="scrolls">${tiles}</div>`:`<div class="empty-shelf">המדף ריק. התחילו סיור חדש או בקשו הצעה.</div>`}`;
  app.querySelector('#newTour').onclick=()=>openTourForm(null);
  app.querySelector('#suggestBtn').onclick=()=>go2('suggest');
  const cb=app.querySelector('#bankBtn');
  cb.onclick=()=>{ if(cb.classList.contains('open')) return; cb.classList.add('open'); setTimeout(()=>go2('places'), reduce?0:(matchMedia('(hover: hover)').matches?350:750)); };
  app.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>go2('tour',{tourId:b.dataset.open,edit:false}));
  app.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{
    if(b.classList.contains('arm')){state.tours=state.tours.filter(t=>t.id!==b.dataset.del);save();renderHome();}
    else{b.classList.add('arm');b.textContent='בטוח? לחצו שוב כדי למחוק';setTimeout(()=>{if(b.isConnected){b.classList.remove('arm');b.textContent='מחיקת הסיור'}},3500);}
  });
}

/* ---------- City map drawing ---------- */
function sealPath(r){
  let d='';for(let i=0;i<=24;i++){const a=i/24*Math.PI*2, rr=r+(i%2?2.4:-1.2)+(i%5===0?1.5:0);d+=(i?'L':'M')+(Math.cos(a)*rr).toFixed(1)+' '+(Math.sin(a)*rr).toFixed(1)}
  return d+'Z';
}
const SEAL=sealPath(28);
/* ---------- Real city layouts (schematic, north up) ---------- */
const CITY_SPECS={
 'תל אביב':{
  sea:[[30,30],[120,30],[128,300],[118,600],[132,900],[120,1070],[30,1070]],
  areas:[{c:'market',pts:[[440,288],[458,316],[330,470],[285,566],[250,548],[300,440],[400,318]]}],
  streets:[
   {n:'טיילת הרברט סמואל',pts:[[152,170],[142,450],[150,760],[142,1040]],w:22,at:30},
   {n:'אלנבי',pts:[[150,252],[300,272],[430,300],[540,400],[640,560],[760,720]],w:32,at:62},
   {n:"קינג ג'ורג'",pts:[[430,300],[520,220],[650,140]],w:26,at:60},
   {n:'שינקין',pts:[[430,300],[600,318],[780,330]],w:24,at:65},
   {n:'הכרמל',pts:[[430,300],[360,380],[300,470],[262,560]],w:20,at:40},
   {n:'נחלת בנימין',pts:[[462,322],[482,460],[505,640]],w:20,at:62},
   {n:'שדרות רוטשילד',pts:[[372,720],[520,622],[700,500],[790,450]],w:34,at:58},
   {n:'הרצל',pts:[[372,720],[362,860],[352,1070]],w:24,at:45},
   {n:'אילת',pts:[[140,812],[360,806],[560,796],[790,806]],w:24,at:80}],
  labels:[['הים התיכון',75,560,-90],['כרם התימנים',215,375],['נווה צדק',235,690],['פלורנטין',545,1000],['שוק הכרמל',395,500,-58]]},
 'יפו':{
  sea:[[30,30],[200,30],[214,250],[180,480],[170,560],[245,575],[255,690],[160,705],[150,900],[170,1070],[30,1070]],
  areas:[{c:'oldcity',pts:[[215,325],[330,318],[352,420],[322,515],[232,535],[200,450]]}],
  streets:[
   {n:'יפת',pts:[[380,300],[400,600],[420,1070]],w:28,at:55},
   {n:'שדרות ירושלים',pts:[[400,320],[560,560],[720,900],[790,1010]],w:32,at:62},
   {n:'אילת',pts:[[380,300],[480,220],[600,140],[790,120]],w:26,at:62},
   {n:'עולי ציון',pts:[[420,400],[480,452],[560,500],[720,560]],w:20,at:72}],
  labels:[['הים התיכון',90,800,-90],['יפו העתיקה',275,430],['נמל יפו',300,745],['עג׳מי',270,920]]},
 'ירושלים':{
  contours:['M40 900 Q160 860 280 930 T520 1000','M40 980 Q200 940 330 1010','M600 200 Q690 170 770 230','M560 140 Q680 110 770 160'],
  areas:[{c:'market',pts:[[120,322],[312,390],[302,456],[120,397]]},{c:'oldcity',pts:[[470,640],[740,620],[760,930],[480,950]]}],
  streets:[
   {n:'רחוב יפו',pts:[[60,282],[240,350],[380,480],[440,620],[470,740]],w:30,at:40},
   {n:'אגריפס',pts:[[60,368],[200,420],[330,470]],w:22,at:45},
   {n:"המלך ג'ורג'",pts:[[350,240],[380,480],[360,700],[340,1070]],w:26,at:70},
   {n:'הנביאים',pts:[[380,480],[500,540],[600,622]],w:20,at:55},
   {n:'בצלאל',pts:[[110,610],[260,575],[370,545]],w:20,at:40},
   {n:'דרך חברון',pts:[[520,950],[500,1070]],w:24,at:50}],
  labels:[['שוק מחנה יהודה',190,290,20],['נחלאות',190,650],['מרכז העיר',540,400],['העיר העתיקה',620,880]],
  marks:[['שער יפו',470,742],['שער שכם',612,626]]},
 'חיפה':{
  sea:[[30,30],[770,30],[770,232],[500,250],[300,240],[150,270],[110,420],[100,700],[90,1070],[30,1070]],
  contours:['M300 780 Q450 740 600 800 T780 790','M320 860 Q480 820 620 880 T780 870','M340 940 Q500 900 640 960 T780 950','M360 1020 Q520 990 660 1040'],
  areas:[{c:'park',pts:[[192,640],[268,640],[300,900],[160,900]]},{c:'market',pts:[[480,515],[560,515],[560,585],[480,585]]}],
  streets:[
   {n:'העצמאות',pts:[[150,292],[400,276],[770,262]],w:30,at:45},
   {n:'שדרות בן גוריון',pts:[[222,282],[226,450],[230,640]],w:32,at:40},
   {n:'אלנבי',pts:[[140,472],[300,452],[460,432],[620,400]],w:24,at:70},
   {n:'הרצל',pts:[[420,642],[580,622],[780,600]],w:26,at:72},
   {n:'מסדה',pts:[[600,622],[620,760],[662,920]],w:20,at:45}],
  labels:[['מפרץ חיפה',560,170],['נמל חיפה',660,225],['המושבה הגרמנית',360,350],['ואדי ניסנאס',330,690],['הדר הכרמל',660,520],['הגנים הבהאיים',230,950],['הר הכרמל',520,1000]]},
 'עכו':{
  sea:[[30,30],[150,30],[160,380],[150,700],[180,962],[600,982],[770,962],[770,1070],[30,1070]],
  areas:[{c:'oldcity',pts:[[165,392],[560,380],[582,600],[560,950],[190,950],[162,700]]}],
  streets:[
   {n:'ויצמן',pts:[[500,150],[490,280],[470,388]],w:26,at:40},
   {n:'בן עמי',pts:[[290,232],[500,242],[770,252]],w:26,at:68},
   {n:'ההגנה',pts:[[620,390],[650,600],[700,945]],w:22,at:50}],
  labels:[['הים התיכון',90,640,-90],['עכו העתיקה',300,430],['נמל הדייגים',380,1015],['העיר החדשה',640,330]],
  marks:[["ח׳אן אל-עומדאן",470,870],['המצודה',250,470]]},
 'נצרת':{
  contours:['M40 200 Q150 160 240 230 T300 420','M40 300 Q130 270 200 340 T240 520','M560 760 Q680 720 780 790','M520 860 Q650 820 780 880','M600 960 Q700 930 780 970','M40 820 Q140 790 220 860','M40 900 Q150 870 230 950'],
  areas:[{c:'market',pts:[[420,380],[600,370],[620,525],[440,532]]}],
  streets:[
   {n:'פאולוס השישי',pts:[[280,1070],[300,800],[330,560],[360,330],[480,220],[650,160]],w:32,at:30},
   {n:'הבשורה',pts:[[332,640],[440,630],[560,612]],w:22,at:50},
   {n:'קאזה נובה',pts:[[430,480],[470,550],[500,612]],w:18,at:50}],
  labels:[['השוק העתיק',520,350],['העיר העתיקה',560,720]],
  marks:[['בזיליקת הבשורה',560,650],['מעיין מרים',390,300]]}
};
function inPoly(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];if(((yi>p[1])!==(yj>p[1]))&&(p[0]<(xj-xi)*(p[1]-yi)/(yj-yi)+xi))c=!c}return c}
function specMap(key,s){
  const f=n=>n.toFixed(1), id='m'+hash(key).toString(36), r=rng(hash('spec:'+key));
  const P=pts=>pts.map(p=>({x:p[0],y:p[1]})), poly=pts=>'M'+pts.map(p=>p.join(' ')).join(' L')+'Z';
  let o='';
  (s.contours||[]).forEach(d=>o+=`<path class="contour" d="${d}"/>`);
  if(s.sea){
    o+=`<path class="sea" d="${poly(s.sea)}"/>`;
    const xs=s.sea.map(p=>p[0]),ys=s.sea.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    let n=0;for(let i=0;i<400&&n<16;i++){const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0);
      if(inPoly([x-26,y],s.sea)&&inPoly([x+26,y],s.sea)&&inPoly([x,y-14],s.sea)&&inPoly([x,y+14],s.sea)){o+=`<path class="wave" d="M${f(x-18)} ${f(y)} q9 -8 18 0 t18 0"/>`;n++}}
  }
  (s.areas||[]).forEach((a,k)=>{
    const d=poly(a.pts);
    if(a.c==='oldcity'){
      const xs=a.pts.map(p=>p[0]),ys=a.pts.map(p=>p[1]);let tex='';
      for(let i=0;i<260;i++){const x=Math.min(...xs)+r()*(Math.max(...xs)-Math.min(...xs)),y=Math.min(...ys)+r()*(Math.max(...ys)-Math.min(...ys)),w=10+r()*18,h=8+r()*14;
        if(inPoly([x,y],a.pts)&&inPoly([x+w,y+h],a.pts))tex+=`<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" transform="rotate(${f(r()*30-15)} ${f(x)} ${f(y)})"/>`}
      o+=`<clipPath id="${id}c${k}"><path d="${d}"/></clipPath><path class="oldcity" d="${d}"/><g class="oldtex" clip-path="url(#${id}c${k})">${tex}</g><path class="oldcity-crenel" d="${d}"/>`;
    }else if(a.c==='park'){
      let t='';const xs=a.pts.map(p=>p[0]),ys=a.pts.map(p=>p[1]);
      for(let y=Math.min(...ys)+22;y<Math.max(...ys);y+=30)t+=`<path class="terrace" d="M${Math.min(...xs)} ${y} H${Math.max(...xs)}"/>`;
      o+=`<clipPath id="${id}c${k}"><path d="${d}"/></clipPath><path class="park" d="${d}"/><g clip-path="url(#${id}c${k})">${t}</g>`;
    }else o+=`<path class="${a.c}" d="${d}"/>`;
  });
  s.streets.forEach(st=>{const d=smooth(P(st.pts)),w=st.w||24;o+=`<path class="ave-edge" style="stroke-width:${w+7}px" d="${d}"/><path class="ave" style="stroke-width:${w}px" d="${d}"/>`});
  s.streets.forEach((st,i)=>{let pts=st.pts.slice();const a0=pts[0],a1=pts[pts.length-1],dx=a1[0]-a0[0],dy=a1[1]-a0[1];
    if(dx<-Math.abs(dy)*.25||(Math.abs(dx)<=Math.abs(dy)*.25&&dy<0))pts.reverse();
    o+=`<path id="${id}s${i}" d="${smooth(P(pts))}" fill="none"/><text class="st-label" dy="9"><textPath href="#${id}s${i}" startOffset="${st.at||50}%" text-anchor="middle">${st.n}</textPath></text>`});
  (s.labels||[]).forEach(l=>o+=`<text class="district" x="${l[1]}" y="${l[2]}"${l[3]?` transform="rotate(${l[3]} ${l[1]} ${l[2]})"`:''}>${l[0]}</text>`);
  (s.marks||[]).forEach(m=>o+=`<circle class="mark-dot" cx="${m[1]}" cy="${m[2]}" r="7"/><text class="mark-label" x="${m[1]}" y="${m[2]+32}">${m[0]}</text>`);
  return o;
}
const cityCache=new Map();
function city(key){
  key=key||'עיר';
  if(cityCache.has(key)) return cityCache.get(key);
  const r=rng(hash('city:'+key)), f=n=>n.toFixed(1), jn=()=>r()*3-1.5;
  const ang=r()*26-13, C=118, S=26;
  let b='',pk='';
  const quad=(x,y,w,h)=>`<polygon points="${f(x+jn())},${f(y+jn())} ${f(x+w+jn())},${f(y+jn())} ${f(x+w+jn())},${f(y+h+jn())} ${f(x+jn())},${f(y+h+jn())}"/>`;
  for(let gx=-6;gx<=6;gx++)for(let gy=-7;gy<=7;gy++){
    const x=gx*C-C/2+S/2, y=gy*C-C/2+S/2, w=C-S, h=C-S;
    if(Math.hypot(x+w/2,y+h/2)>760) continue;
    const k=r();
    if(k<.06){
      pk+=`<rect class="park" x="${f(x)}" y="${f(y)}" width="${w}" height="${h}" rx="6"/>`;
      for(let t=0;t<5;t++) pk+=`<circle class="ptree" cx="${f(x+14+r()*(w-28))}" cy="${f(y+14+r()*(h-28))}" r="${f(7+r()*4)}"/>`;
    }else if(k<.09){
      pk+=`<rect class="plaza" x="${f(x+4)}" y="${f(y+4)}" width="${w-8}" height="${h-8}"/><circle class="fountain" cx="${f(x+w/2)}" cy="${f(y+h/2)}" r="15"/>`;
    }else{
      const vert=r()<.5, n=2+Math.floor(r()*3), g=5, ws=[];let tot=0;
      for(let i=0;i<n;i++){const v=.6+r();ws.push(v);tot+=v}
      let acc=0; const span=(vert?w:h)-g*(n-1);
      ws.forEach(v=>{const len=v/tot*span;
        if(r()<.08){acc+=len+g;return}
        b+= vert?quad(x+acc,y,len,h):quad(x,y+acc,w,len); acc+=len+g;});
    }
  }
  const spec=CITY_SPECS[key];
  if(spec){const out=`<g clip-path="url(#inner)"><g class="blocks" transform="translate(400 560) rotate(${f(ang)})">${pk}${b}</g>${specMap(key,spec)}</g>`;cityCache.set(key,out);return out;}
  const ave=d=>`<path class="ave-edge" d="${d}"/><path class="ave" d="${d}"/><path class="ave-mid" d="${d}"/>`;
  const y1=300+r()*260, y2=y1+(r()*260-130), x1=230+r()*340, x2=x1+(r()*280-140);
  let av=ave(`M-30 ${f(y1)} C250 ${f(y1+r()*180-90)} 550 ${f(y2+r()*180-90)} 830 ${f(y2)}`);
  av+=ave(`M${f(x1)} -30 C${f(x1+r()*180-90)} 400 ${f(x2+r()*180-90)} 750 ${f(x2)} 1130`);
  let coast='';
  if(r()<.45){
    const left=r()<.5, base=80+r()*60, ph=r()*6;
    const pts=[];for(let y=-10;y<=1110;y+=40){let x=base+Math.sin(y/95+ph)*16+r()*6;pts.push([left?x:800-x,y])}
    const outer=left?-20:820;
    coast=`<path class="sea" d="M${outer} -20 L${pts.map(p=>f(p[0])+' '+p[1]).join(' L')} L${outer} 1120Z"/>`;
    for(let i=0;i<9;i++){const y=60+r()*980, x=left?20+r()*(base-60):800-(20+r()*(base-60));
      coast+=`<path class="wave" d="M${f(x-18)} ${f(y)} q9 -8 18 0 t18 0"/>`;}
  }
  const out=`<g clip-path="url(#inner)"><g class="blocks" transform="translate(400 560) rotate(${f(ang)})">${pk}${b}</g>${av}${coast}</g>`;
  cityCache.set(key,out);
  return out;
}
function defs(){
  return `<filter id="rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
    <filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="9"/><feColorMatrix values="0 0 0 0 0.36  0 0 0 0 0.22  0 0 0 0 0.09  1.4 0 0 0 -0.55"/></filter>
    <radialGradient id="burn" cx="50%" cy="48%" r="72%"><stop offset="55%" stop-color="#8a5a24" stop-opacity="0"/><stop offset="88%" stop-color="#8a5a24" stop-opacity=".35"/><stop offset="100%" stop-color="#4a2c10" stop-opacity=".75"/></radialGradient>
    <pattern id="hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line class="hatch-l" x1="0" y1="0" x2="0" y2="9"/></pattern>
    <clipPath id="inner"><rect x="35" y="35" width="${W-70}" height="${H-70}"/></clipPath>`;
}
function paperBase(key){
  return `<rect class="paper" width="${W}" height="${H}"/>
    ${city(key)}
    <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".45"/>
    <rect width="${W}" height="${H}" fill="url(#burn)"/>
    <g filter="url(#rough)"><rect class="frame" x="24" y="24" width="${W-48}" height="${H-48}"/><rect class="frame2" x="34" y="34" width="${W-68}" height="${H-68}"/></g>`;
}
function compass(){
  let pts='';
  for(let k=0;k<8;k++){
    const big=k%2===0, L=big?66:40, w=big?12:8;
    pts+=`<g transform="rotate(${k*45})"><path class="${k===0?'pt-red':(big?'pt-dark':'pt-light')}" d="M0 ${-L} L${w} -6 L0 0Z"/><path class="pt-light" d="M0 ${-L} L${-w} -6 L0 0Z"/></g>`;
  }
  return `<g class="compass" transform="translate(120,985)"><circle class="ring" r="52"/><circle class="ring2" r="44"/>${pts}<circle class="pt-dark" r="5"/><text y="-74">צ</text></g>`;
}
function stopsSVG(stops){
  const n=stops.length;
  return stops.map((s,i)=>{
    const last=i===n-1&&n>1, title=s.title||'תחנה ללא שם';
    const w=Math.min(300,Math.max(70,title.length*11.5+28));
    let dx=0; if(s.x-w/2<40) dx=40-(s.x-w/2); if(s.x+w/2>760) dx=760-(s.x+w/2);
    const below=s.y<990;
    return `<g class="stop${last?' treasure':''}${s.visited?' visited':''}" data-i="${i}" transform="translate(${s.x.toFixed(1)},${s.y.toFixed(1)})" tabindex="0" role="button" aria-label="תחנה ${heb(i)}: ${esc(title)}">
      ${last?`<g class="x-mark"><line x1="-40" y1="-40" x2="40" y2="40"/><line x1="40" y1="-40" x2="-40" y2="40"/></g>`:''}
      <path class="seal-out" d="${SEAL}"/><circle class="seal-in" r="21"/>
      <text class="seal-num" y="8">${heb(i)}</text>
      ${s.visited?`<text class="check" x="24" y="-22">✓</text>`:''}
      <g class="tag" transform="translate(${dx.toFixed(1)},${below?58:-58})"><rect x="${-w/2}" y="-19" width="${w}" height="34" rx="2"/><text y="7">${esc(title)}</text></g>
    </g>`;
  }).join('');
}
function mapSVG(t,opts={}){
  const nameSize=Math.max(26,Math.min(44,620/Math.max(8,t.name.length)*1.55));
  const hint=!t.stops.length?`<g class="map-hint"><rect x="170" y="510" width="460" height="120" rx="3"/><text x="400" y="560">${opts.edit?'הקישו על המפה כדי לסמן':'המפה עדיין ריקה'}</text><text x="400" y="608">${opts.edit?'את התחנה הראשונה':'לחצו על "עריכת מסלול"'}</text></g>`:'';
  const d=smooth(t.stops);
  return `<svg id="${opts.id||'map'}" viewBox="0 0 ${W} ${H}" role="img" aria-label="מפת ${esc(t.name)}">
    <defs>${defs()}
      <mask id="reveal" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}"><path id="revealPath" d="${d}" fill="none" stroke="#fff" stroke-width="26" stroke-linecap="round"/></mask>
    </defs>
    ${paperBase(t.area||t.id)}
    <g class="cartouche"><path d="M120 52 L680 52 L654 88 L680 124 L120 124 L146 88Z" filter="url(#rough)"/><text x="400" y="${88+nameSize*0.36}" font-size="${nameSize.toFixed(0)}">${esc(t.name)}</text></g>
    ${compass()}
    <g class="scale" transform="translate(500,1018)"><rect class="bg" x="-14" y="-38" width="228" height="62" rx="2"/><rect class="a" x="0" y="0" width="50" height="10"/><rect class="b" x="50" y="0" width="50" height="10"/><rect class="a" x="100" y="0" width="50" height="10"/><rect class="b" x="150" y="0" width="50" height="10"/><text x="100" y="-10">5 דקות הליכה</text></g>
    ${hint}
    <g id="route"><path class="route-halo" d="${d}"/><path class="route" d="${d}" mask="url(#reveal)" filter="url(#rough)"/></g>
    <g id="stops">${stopsSVG(t.stops)}</g>
  </svg>`;
}

/* ---------- Tour screen ---------- */
function renderTour(animate){
  const t=tour(); if(!t){view={screen:'home'};return renderHome();}
  const done=t.stops.filter(s=>s.visited).length, eat=eatOf(t.stops), walk=walkOf(t.stops);
  app.innerHTML=`
    <div class="tour-bar">
      <button class="back" id="back">→ כל הסיורים</button>
      <div class="tb-title">${esc(t.name)}</div>
      <div class="tb-actions">
        <button class="btn ghost" id="toggleEdit">${view.edit?'סיום עריכה':'עריכת מסלול'}</button>
        <button class="btn" id="openDeck" ${t.stops.length?'':'disabled'}>קלפי הסיור</button>
      </div>
    </div>
    ${t.intro&&!view.edit?`<p class="intro">${esc(t.intro)}</p>`:''}
    ${view.edit?`<div class="edit-hint"><p>הקישו על מקום פנוי במפה כדי להוסיף תחנה · גררו תחנה כדי להזיז · הקישו על תחנה כדי לערוך</p><div class="btns"><button class="btn" id="fromBank">הוספה מבנק האתרים</button><button class="btn ghost" id="editMeta">פרטי הסיור</button></div></div>`:''}
    <div class="map-wrap${view.edit?' editing':''}">${mapSVG(t,{edit:view.edit})}</div>
    ${t.stops.length?`<section class="legend">
      <div class="legend-head"><h2>תחנות המסלול</h2><span>טעמנו ${done} מתוך ${t.stops.length} · ${fmt(eat+walk)} (${fmt(walk)} הליכה)</span></div>
      <div class="gm-row"><a class="gm-route" href="${routeUrl(t.stops,t.area)}" target="_blank" rel="noopener">${gmIcon}כל המסלול בגוגל מפות</a>${t.stops.length>10?'<small>גוגל מפות מקבל עד 10 נקודות, אז יוצגו רק 10 הראשונות.</small>':''}</div>
      <ol>${t.stops.map((s,i)=>`${i?`<li class="walk-leg">↓ ${Math.max(1,Math.round(walkMin(t.stops[i-1],s)))} דק׳ הליכה</li>`:''}<li class="${s.visited?'visited':''}"><button data-card="${i}"><span class="mini-seal">${heb(i)}</span><span class="lt"><b>${esc(s.title||'תחנה ללא שם')}</b><small>${[s.type,s.dish].filter(Boolean).map(esc).join(' · ')}</small></span><span class="mins">${+s.minutes||0} דק׳</span></button></li>`).join('')}</ol>
    </section>`:''}`;
  app.querySelector('#back').onclick=()=>go2('home');
  app.querySelector('#toggleEdit').onclick=()=>{view.edit=!view.edit;renderTour(!view.edit)};
  app.querySelector('#openDeck').onclick=()=>openDeck(0);
  const em=app.querySelector('#editMeta'); if(em) em.onclick=()=>openTourForm(t);
  const fb=app.querySelector('#fromBank'); if(fb) fb.onclick=()=>openBankPicker(t);
  app.querySelectorAll('[data-card]').forEach(b=>b.onclick=()=>view.edit?openEditor(+b.dataset.card,false):openDeck(+b.dataset.card));
  bindMap(t);
  if(animate&&!reduce){
    const rp=document.getElementById('revealPath');
    if(rp&&t.stops.length>1){const L=rp.getTotalLength();rp.style.strokeDasharray=L;rp.style.strokeDashoffset=L;rp.getBoundingClientRect();rp.style.transition='stroke-dashoffset 1.8s ease-in-out';rp.style.strokeDashoffset=0;}
  }
}
function svgPoint(svg,e){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;return p.matrixTransform(svg.getScreenCTM().inverse())}
function bindMap(t){
  const svg=document.getElementById('map');
  let drag=null;
  svg.addEventListener('pointerdown',e=>{
    const g=e.target.closest('.stop');
    if(g){drag={i:+g.dataset.i,g,cx:e.clientX,cy:e.clientY,moved:false};
      if(view.edit){svg.setPointerCapture(e.pointerId);g.classList.add('dragging');}}
    else if(view.edit){drag={bg:true,start:svgPoint(svg,e),cx:e.clientX,cy:e.clientY,moved:false};}
  });
  svg.addEventListener('pointermove',e=>{
    if(!drag) return;
    if(Math.hypot(e.clientX-drag.cx,e.clientY-drag.cy)>7) drag.moved=true;
    if(drag.bg||!view.edit||!drag.moved) return;
    const p=svgPoint(svg,e), s=t.stops[drag.i];
    s.x=clamp(p.x,60,740); s.y=clamp(p.y,160,1040);
    drag.g.setAttribute('transform',`translate(${s.x.toFixed(1)},${s.y.toFixed(1)})`);
    const d=smooth(t.stops);
    svg.querySelectorAll('#route path').forEach(el=>el.setAttribute('d',d));
    document.getElementById('revealPath').setAttribute('d',d);
  });
  svg.addEventListener('pointerup',()=>{
    if(!drag) return; const d=drag; drag=null;
    if(d.bg){ if(!d.moved) addStopAt(t,d.start); return; }
    if(view.edit){ if(d.moved){save();renderTour(false);} else openEditor(d.i,false); }
    else if(!d.moved) openDeck(d.i);
  });
  svg.addEventListener('pointercancel',()=>{drag=null});
  svg.addEventListener('keydown',e=>{
    const g=e.target.closest&&e.target.closest('.stop');
    if(g&&(e.key==='Enter'||e.key===' ')){e.preventDefault(); view.edit?openEditor(+g.dataset.i,false):openDeck(+g.dataset.i);}
  });
}
function addStopAt(t,p){
  if(p.x<40||p.x>760||p.y<140||p.y>1060) return;
  t.stops.push({id:uid(),x:clamp(p.x,60,740),y:clamp(p.y,160,1040),title:'',type:'',dish:'',story:'',tip:'',minutes:15});
  save(); renderTour(false); openEditor(t.stops.length-1,true);
}
const stopFromPlace=p=>({id:uid(),placeId:p.id,x:p.x,y:p.y,title:p.name,addr:p.addr||'',type:p.type,dish:p.dish,story:p.story,tip:p.tip,minutes:p.minutes});
function gq(s,area){const base=(s.addr||s.title||s.name||'').trim();return area&&!base.includes(area)?`${base}, ${area}`:base}
const GM='https://www.google.com/maps/';
const navUrl=(s,area)=>`${GM}dir/?api=1&destination=${encodeURIComponent(gq(s,area))}&travelmode=walking`;
function routeUrl(stops,area){
  if(!stops.length) return '';
  if(stops.length===1) return navUrl(stops[0],area);
  const q=stops.map(x=>encodeURIComponent(gq(x,area)));
  const mid=q.slice(1,-1).slice(0,8);
  return `${GM}dir/?api=1&origin=${q[0]}&destination=${q[q.length-1]}${mid.length?`&waypoints=${mid.join('%7C')}`:''}&travelmode=walking`;
}
const gmIcon='<svg class="gm-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c-4 0-7 3-7 7 0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"/></svg>';

/* ---------- Places bank ---------- */
function renderPlaces(){
  const all=areas();
  if(bankFilter.area&&!all.includes(bankFilter.area)) bankFilter.area='';
  const list=state.places.filter(p=>(!bankFilter.area||(p.area||'בלי אזור')===bankFilter.area)&&(!bankFilter.type||p.type===bankFilter.type));
  const groups={}; list.forEach(p=>{(groups[p.area||'בלי אזור']??=[]).push(p)});
  app.innerHTML=`
    <div class="tour-bar">
      <button class="back" id="back">→ מסך הבית</button>
      <div class="tb-title">בנק האתרים</div>
      <div class="tb-actions"><button class="btn" id="addPlace">＋ אתר חדש</button><button class="btn ghost" id="toSuggest">הציעו לי סיור</button></div>
    </div>
    <p class="bank-intro">כאן שומרים מקומות: בית קפה, דוכן, מאפייה. לכל אתר יש סוג אוכל, זמן ביקור ומיקום על מפת האזור, ומהם האפליקציה בונה הצעה לסיור. האתרים שמופיעים עכשיו הם דוגמאות, ואפשר לערוך או למחוק אותם.</p>
    <div class="filters">
      <div class="chips dark" role="group" aria-label="סינון לפי אזור"><button class="chip" data-fa="" aria-pressed="${!bankFilter.area}">כל האזורים</button>${all.map(a=>`<button class="chip" data-fa="${esc(a)}" aria-pressed="${bankFilter.area===a}">${esc(a)}</button>`).join('')}</div>
      <div class="chips dark" role="group" aria-label="סינון לפי סוג"><button class="chip" data-ft="" aria-pressed="${!bankFilter.type}">כל הסוגים</button>${TYPES.filter(t=>state.places.some(p=>p.type===t)).map(t=>`<button class="chip" data-ft="${t}" aria-pressed="${bankFilter.type===t}">${t}</button>`).join('')}</div>
    </div>
    <div class="chest-body">${Object.keys(groups).length?Object.entries(groups).map(([a,ps])=>`<h2 class="area-title">${esc(a)}</h2><div class="cards">${ps.map(p=>`<button class="pcard" data-pid="${p.id}" style="--tilt:${((hash(p.id)%5)-2)*0.5}deg"><span class="ptype">${esc(p.type||'בלי סוג')} · ${+p.minutes||0} דק׳</span><b>${esc(p.name)}</b><span>${esc(p.dish)}</span></button>`).join('')}</div>`).join(''):`<div class="empty-shelf">התיבה ריקה. הוסיפו את האתר הראשון.</div>`}</div>`;
  app.querySelector('#back').onclick=()=>go2('home');
  app.querySelector('#addPlace').onclick=()=>openPlaceForm(null);
  app.querySelector('#toSuggest').onclick=()=>go2('suggest');
  app.querySelectorAll('[data-fa]').forEach(b=>b.onclick=()=>{bankFilter.area=b.dataset.fa;renderPlaces()});
  app.querySelectorAll('[data-ft]').forEach(b=>b.onclick=()=>{bankFilter.type=b.dataset.ft;renderPlaces()});
  app.querySelectorAll('[data-pid]').forEach(b=>b.onclick=()=>openPlaceForm(state.places.find(p=>p.id===b.dataset.pid)));
}
function pickerSVG(area,pin,selfId){
  const others=state.places.filter(p=>(p.area||'')===area&&p.id!==selfId);
  return `<svg id="picker" viewBox="0 0 ${W} ${H}" role="img" aria-label="מיקום האתר על מפת האזור"><defs>${defs()}</defs>
    ${paperBase(area||'עיר')}
    ${others.map(p=>`<circle class="ghost-dot" cx="${p.x}" cy="${p.y}" r="16"><title>${esc(p.name)}</title></circle>`).join('')}
    <g id="pin" class="stop" transform="translate(${pin.x},${pin.y})"><path class="seal-out" d="${SEAL}" transform="scale(1.3)"/><circle class="seal-in" r="27"/><text class="seal-num" y="9">✦</text></g>
  </svg>`;
}
function openPlaceForm(p){
  const isNew=!p;
  const pin={x:p?.x??(200+Math.random()*400),y:p?.y??(300+Math.random()*500)};
  const defArea=p?.area??(bankFilter.area||areas()[0]||'');
  openLayer(`<div class="overlay"><form class="sheet" id="placeForm">
    <div class="sheet-head"><span class="mini-seal">✦</span><h2>${isNew?'אתר חדש':'עריכת אתר'}</h2></div>
    <label>שם המקום<input id="p-name" required maxlength="40" value="${esc(p?.name||'')}" placeholder="למשל: המאפייה של רחוב לוינסקי"></label>
    <div class="two">
      <label>אזור או שכונה<input id="p-area" list="areaList" maxlength="40" value="${esc(defArea)}" placeholder="למשל: יפו"><datalist id="areaList">${areas().map(a=>`<option value="${esc(a)}">`).join('')}</datalist></label>
      <label>סוג אוכל<select id="p-type">${typeOpts(p?.type||'')}</select></label>
    </div>
    <label>מה טועמים כאן<input id="p-dish" maxlength="80" value="${esc(p?.dish||'')}"></label>
    <label>הסיפור של המקום<textarea id="p-story" rows="3">${esc(p?.story||'')}</textarea></label>
    <div class="two">
      <label>טיפ של המדריך<input id="p-tip" maxlength="120" value="${esc(p?.tip||'')}"></label>
    </div>
    <label>כתובת לניווט בגוגל מפות<input id="p-addr" maxlength="120" value="${esc(p?.addr||'')}" placeholder="למשל: רחוב יפת 7, או שם העסק"></label>
    <div class="two">
      <label>זמן ביקור (דקות)<input id="p-min" type="number" min="0" max="240" value="${p?.minutes??15}"></label>
    </div>
    <div class="picker"><span class="plab">איפה זה? הקישו או גררו את החותם על מפת האזור</span><div id="pickerBox">${pickerSVG(defArea,pin,p?.id)}</div></div>
    <div class="sheet-actions"><button class="btn" type="submit">שמירה</button><button class="btn ghost" type="button" data-cancel>ביטול</button>${isNew?'':`<button class="btn danger" type="button" id="delPlace">מחיקת האתר</button>`}</div>
  </form></div>`);
  const $=q=>layer.querySelector(q);
  $('#p-name').focus();
  const bindPicker=()=>{
    const svg=$('#picker'); let down=false;
    const set=e=>{const q=svgPoint(svg,e);pin.x=Math.round(clamp(q.x,60,740));pin.y=Math.round(clamp(q.y,160,1040));$('#pin').setAttribute('transform',`translate(${pin.x},${pin.y})`)};
    svg.addEventListener('pointerdown',e=>{down=true;svg.setPointerCapture(e.pointerId);set(e)});
    svg.addEventListener('pointermove',e=>{if(down)set(e)});
    svg.addEventListener('pointerup',()=>down=false);
    svg.addEventListener('pointercancel',()=>down=false);
  };
  bindPicker();
  let tm; $('#p-area').addEventListener('input',()=>{clearTimeout(tm);tm=setTimeout(()=>{$('#pickerBox').innerHTML=pickerSVG($('#p-area').value.trim(),pin,p?.id);bindPicker()},350)});
  $('[data-cancel]').onclick=closeLayer;
  $('#placeForm').onsubmit=e=>{e.preventDefault();
    const v={name:$('#p-name').value.trim()||'אתר ללא שם',area:$('#p-area').value.trim(),type:$('#p-type').value,dish:$('#p-dish').value.trim(),story:$('#p-story').value.trim(),tip:$('#p-tip').value.trim(),addr:$('#p-addr').value.trim(),minutes:+$('#p-min').value||0,x:pin.x,y:pin.y};
    if(isNew) state.places.push({id:uid(),...v}); else Object.assign(p,v);
    save(); closeLayer(); render(false);
  };
  const dp=$('#delPlace'); if(dp) dp.onclick=()=>{
    if(dp.dataset.arm){state.places=state.places.filter(x=>x!==p);save();closeLayer();render(false);}
    else{dp.dataset.arm='1';dp.textContent='לחצו שוב כדי למחוק';}
  };
}
function openBankPicker(t){
  const used=new Set(t.stops.map(s=>s.placeId).filter(Boolean));
  let list=state.places.filter(p=>!used.has(p.id));
  const same=list.filter(p=>p.area===t.area);
  if(same.length) list=same;
  openLayer(`<div class="overlay"><div class="sheet">
    <div class="sheet-head"><span class="mini-seal">✦</span><h2>הוספה מבנק האתרים</h2></div>
    ${list.length?`<div class="pick-list">${list.map(p=>`<button data-add="${p.id}"><b>${esc(p.name)}</b><small>${[p.area,p.type,p.dish].filter(Boolean).map(esc).join(' · ')}</small></button>`).join('')}</div>`:`<p>כל האתרים מהבנק כבר נמצאים בסיור הזה.</p>`}
    <div class="sheet-actions"><button class="btn ghost" type="button" data-cancel>סגירה</button></div>
  </div></div>`);
  layer.querySelector('[data-cancel]').onclick=closeLayer;
  layer.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{
    const p=state.places.find(x=>x.id===b.dataset.add); t.stops.push(stopFromPlace(p)); save(); closeLayer(); renderTour(false);
  });
}

/* ---------- Tour suggestion ---------- */
function orderRoute(set){
  const n=set.length; if(n<2) return set.slice();
  const hasD=set.some(p=>p.type===DESSERT);
  const cost=o=>walkOf(o)+(hasD&&o[o.length-1].type!==DESSERT?8:0)+(o[0].type===DESSERT&&n>2?5:0);
  let best=null,bc=Infinity;
  for(let s=0;s<n;s++){
    const left=set.slice(), o=[left.splice(s,1)[0]];
    while(left.length){let bi=0,bd=Infinity;left.forEach((p,i)=>{const d=walkMin(o[o.length-1],p);if(d<bd){bd=d;bi=i}});o.push(left.splice(bi,1)[0])}
    let improved=true,guard=0;
    while(improved&&guard++<60){improved=false;
      for(let i=0;i<n-1;i++)for(let k=i+1;k<n;k++){
        const c=o.slice(0,i).concat(o.slice(i,k+1).reverse(),o.slice(k+1));
        if(cost(c)<cost(o)-1e-6){o.splice(0,n,...c);improved=true}
      }}
    const c=cost(o); if(c<bc){bc=c;best=o}
  }
  return best;
}
function planTour(o){
  const pool=state.places.filter(p=>(p.area||'בלי אזור')===o.area);
  const must=pool.filter(p=>o.must.includes(p.id));
  const cands=pool.filter(p=>!o.must.includes(p.id)&&(!o.types.length||o.types.includes(p.type)));
  const r=rng(o.seed*7919+1), jit={}; cands.forEach(p=>jit[p.id]=r());
  const total=set=>{const ord=orderRoute(set);return eatOf(ord)+walkOf(ord)};
  const chosen=must.slice(), target=o.count||Infinity;
  while(chosen.length<target){
    const have=new Set(chosen.map(p=>p.type));
    const rest=cands.filter(p=>!chosen.includes(p)).map(p=>{
      const near=chosen.length?Math.min(...chosen.map(c=>walkMin(c,p))):0;
      return {p,s:jit[p.id]*1.1+(have.has(p.type)?0:1)-near/8};
    }).sort((a,b)=>b.s-a.s);
    const pick=rest.find(({p})=>total([...chosen,p])<=o.budget);
    if(!pick) break;
    chosen.push(pick.p);
  }
  const ord=orderRoute(chosen), eat=eatOf(ord), walk=walkOf(ord);
  const warn=[];
  if(!pool.length) warn.push('אין עדיין אתרים באזור הזה. הוסיפו אתרים בבנק האתרים.');
  else{
    if(eat+walk>o.budget) warn.push(`האתרים שסימנתם כחובה לבדם לוקחים ${fmt(eat+walk)}, יותר מהזמן שבחרתם.`);
    if(o.count&&ord.length<o.count){
      const avail=must.length+cands.length;
      warn.push(avail<o.count?`יש באזור רק ${avail} אתרים שמתאימים לסוגי האוכל שבחרתם. הוסיפו סוגים או אתרים.`:`בזמן שבחרתם נכנסות רק ${ord.length} תחנות. האריכו את הזמן כדי לקבל ${o.count}.`);
    }
    if(!ord.length&&!warn.length) warn.push('לא נמצא אתר שנכנס בזמן שבחרתם. נסו להאריך את הזמן.');
  }
  return {ord,eat,walk,warn};
}
function renderSuggest(){
  const all=areas();
  if(!state.places.length){
    app.innerHTML=`<div class="tour-bar"><button class="back" id="back">→ מסך הבית</button><div class="tb-title">הצעת סיור</div></div>
      <div class="no-places"><p>כדי לקבל הצעה צריך קודם כמה אתרים בבנק האתרים.</p><button class="btn" id="toBank">לבנק האתרים</button></div>`;
    app.querySelector('#back').onclick=()=>go2('home');
    app.querySelector('#toBank').onclick=()=>go2('places');
    return;
  }
  if(!sug||!all.includes(sug.area)) sug={area:all[0],types:[],budget:120,count:0,must:[],seed:1,name:''};
  const pool=state.places.filter(p=>(p.area||'בלי אזור')===sug.area);
  const counts={}; pool.forEach(p=>counts[p.type]=(counts[p.type]||0)+1);
  const res=planTour(sug);
  const name=sug.name||`סיור טעמים ב${sug.area}`;
  const preview={id:'preview',name,area:sug.area,stops:res.ord.map(p=>({...p,title:p.name}))};
  app.innerHTML=`
    <div class="tour-bar"><button class="back" id="back">→ מסך הבית</button><div class="tb-title">הצעת סיור</div><div class="tb-actions"><button class="btn ghost" id="toBank">בנק האתרים</button></div></div>
    <section class="panel">
      <div class="field"><span class="flabel">באיזה אזור?</span>
        <div class="chips">${all.map(a=>`<button class="chip" data-area="${esc(a)}" aria-pressed="${a===sug.area}">${esc(a)}<span class="n">${state.places.filter(p=>(p.area||'בלי אזור')===a).length}</span></button>`).join('')}</div></div>
      <div class="field"><span class="flabel">איזה אוכל? <small>בלי בחירה = הכול</small></span>
        <div class="chips">${TYPES.map(t=>`<button class="chip" data-type="${t}" aria-pressed="${sug.types.includes(t)}" ${counts[t]?'':'disabled'}>${t}${counts[t]?`<span class="n">${counts[t]}</span>`:''}</button>`).join('')}</div></div>
      <div class="field"><label class="flabel" for="s-time">כמה זמן יש לנו? <output id="timeOut">${fmt(sug.budget)}</output></label>
        <input type="range" id="s-time" min="30" max="360" step="15" value="${sug.budget}"></div>
      <div class="field"><span class="flabel">כמה תחנות?</span>
        <div class="chips"><button class="chip" data-count="0" aria-pressed="${!sug.count}">כמה שנכנס בזמן</button>${[2,3,4,5,6,7,8].map(n=>`<button class="chip" data-count="${n}" aria-pressed="${sug.count===n}">${n}</button>`).join('')}</div></div>
      <div class="field"><span class="flabel">אתרים שחייבים לבקר בהם <small>אופציונלי</small></span>
        <div class="chips">${pool.map(p=>`<button class="chip" data-must="${p.id}" aria-pressed="${sug.must.includes(p.id)}">${esc(p.name)}</button>`).join('')}</div></div>
    </section>
    <div class="result-head"><h2>ההצעה שלנו</h2>
      <div class="tally"><span>${res.ord.length} תחנות</span><span>${fmt(res.eat)} אוכל</span><span>${fmt(res.walk)} הליכה</span><span>סה״כ ${fmt(res.eat+res.walk)}</span></div></div>
    ${res.warn.map(w=>`<div class="warn">${esc(w)}</div>`).join('')}
    <div class="map-wrap">${mapSVG(preview,{id:'previewMap'})}</div>
    ${res.ord.length?`<section class="legend"><div class="legend-head"><h2>סדר התחנות</h2><span>המסלול הקצר ביותר ביניהן${res.ord.some(p=>p.type===DESSERT)?', עם קינוח בסוף':''}</span></div><div class="gm-row"><a class="gm-route" href="${routeUrl(res.ord.map(p=>({...p,title:p.name})),sug.area)}" target="_blank" rel="noopener">${gmIcon}המסלול בגוגל מפות</a></div>
      <ol>${res.ord.map((p,i)=>`${i?`<li class="walk-leg">↓ ${Math.max(1,Math.round(walkMin(res.ord[i-1],p)))} דק׳ הליכה</li>`:''}<li><button data-peek="${p.id}"><span class="mini-seal">${heb(i)}</span><span class="lt"><b>${esc(p.name)}</b><small>${[p.type,p.dish].filter(Boolean).map(esc).join(' · ')}</small></span><span class="mins">${+p.minutes||0} דק׳</span></button></li>`).join('')}</ol></section>
    <div class="make-row">
      <label>שם לסיור<input id="s-name" maxlength="60" value="${esc(name)}"></label>
      <button class="btn ghost" id="again">הצעה אחרת</button>
      <button class="btn red" id="make">יצירת הסיור</button>
    </div>`:''}`;
  const rerender=()=>{const y=scrollY;renderSuggest();scrollTo(0,y)};
  app.querySelector('#back').onclick=()=>go2('home');
  app.querySelector('#toBank').onclick=()=>go2('places');
  app.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{sug.area=b.dataset.area;sug.types=[];sug.must=[];sug.name='';rerender()});
  app.querySelectorAll('[data-type]').forEach(b=>b.onclick=()=>{const t=b.dataset.type;sug.types=sug.types.includes(t)?sug.types.filter(x=>x!==t):[...sug.types,t];rerender()});
  app.querySelectorAll('[data-count]').forEach(b=>b.onclick=()=>{sug.count=+b.dataset.count;rerender()});
  app.querySelectorAll('[data-must]').forEach(b=>b.onclick=()=>{const id=b.dataset.must;sug.must=sug.must.includes(id)?sug.must.filter(x=>x!==id):[...sug.must,id];rerender()});
  app.querySelectorAll('[data-peek]').forEach(b=>b.onclick=()=>openPlaceForm(state.places.find(p=>p.id===b.dataset.peek)));
  const tr=app.querySelector('#s-time');
  tr.oninput=()=>{app.querySelector('#timeOut').textContent=fmt(+tr.value)};
  tr.onchange=()=>{sug.budget=+tr.value;rerender()};
  const nm=app.querySelector('#s-name'); if(nm) nm.oninput=()=>{sug.name=nm.value};
  const ag=app.querySelector('#again'); if(ag) ag.onclick=()=>{sug.seed++;rerender()};
  const mk=app.querySelector('#make'); if(mk) mk.onclick=()=>{
    const nt={id:uid(),name:(nm.value.trim()||name),area:sug.area,intro:`${res.ord.length} תחנות, כ-${fmt(res.eat+res.walk)} כולל ${fmt(res.walk)} הליכה.`,stops:res.ord.map(stopFromPlace)};
    state.tours.unshift(nt); save(); sug.name=''; go2('tour',{tourId:nt.id,edit:false});
  };
}

/* ---------- Overlays ---------- */
let lastFocus=null;
function openLayer(html){lastFocus=document.activeElement;layer.innerHTML=html;document.body.style.overflow='hidden';}
function closeLayer(){layer.innerHTML='';document.body.style.overflow='';deck=null;if(lastFocus&&lastFocus.isConnected)lastFocus.focus();}
document.addEventListener('keydown',e=>{
  if(!layer.innerHTML) return;
  if(e.key==='Escape'){ const c=layer.querySelector('[data-cancel]'); c?c.click():closeLayer(); }
  if(deck&&e.key==='ArrowLeft') go(1);
  if(deck&&e.key==='ArrowRight') go(-1);
});

function openTourForm(t){
  const isNew=!t;
  openLayer(`<div class="overlay"><form class="sheet" id="tourForm">
    <div class="sheet-head"><span class="mini-seal">✦</span><h2>${isNew?'סיור אוכל חדש':'פרטי הסיור'}</h2></div>
    <label>שם הסיור<input id="t-name" required maxlength="60" value="${esc(t?.name||'')}" placeholder="למשל: טעמים של שוק הפשפשים"></label>
    <label>שכונה או עיר<input id="t-area" list="tAreaList" maxlength="40" value="${esc(t?.area||'')}" placeholder="למשל: יפו"><datalist id="tAreaList">${areas().map(a=>`<option value="${esc(a)}">`).join('')}</datalist></label>
    <label>כמה מילים על הסיור<textarea id="t-intro" rows="3" placeholder="מה מחכה למשתתפים בדרך?">${esc(t?.intro||'')}</textarea></label>
    <div class="sheet-actions"><button class="btn" type="submit">${isNew?'יצירת המפה':'שמירה'}</button><button class="btn ghost" type="button" data-cancel>ביטול</button></div>
  </form></div>`);
  layer.querySelector('#t-name').focus();
  layer.querySelector('[data-cancel]').onclick=closeLayer;
  layer.querySelector('#tourForm').onsubmit=e=>{
    e.preventDefault();
    const v={name:layer.querySelector('#t-name').value.trim()||'סיור ללא שם',area:layer.querySelector('#t-area').value.trim(),intro:layer.querySelector('#t-intro').value.trim()};
    if(isNew){const nt={id:uid(),...v,stops:[]};state.tours.unshift(nt);view={screen:'tour',tourId:nt.id,edit:true};}
    else Object.assign(t,v);
    save(); closeLayer(); renderTour(false); if(isNew) scrollTo(0,0);
  };
}

function openEditor(i,isNew){
  const t=tour(), s=t.stops[i];
  openLayer(`<div class="overlay"><form class="sheet" id="stopForm">
    <div class="sheet-head"><span class="mini-seal">${heb(i)}</span><h2>${isNew?'תחנה חדשה':'עריכת תחנה'}</h2></div>
    <label>שם המקום<input id="f-title" required maxlength="40" value="${esc(s.title)}" placeholder="למשל: הקונדיטוריה של זיוה"></label>
    <div class="two">
      <label>סוג אוכל<select id="f-type">${typeOpts(s.type||'')}</select></label>
      <label>זמן בתחנה (דקות)<input id="f-min" type="number" min="0" max="240" value="${+s.minutes||0}"></label>
    </div>
    <label>מה טועמים כאן<input id="f-dish" maxlength="80" value="${esc(s.dish)}" placeholder="המנה של התחנה"></label>
    <label>הסיפור של המקום<textarea id="f-story" rows="4" placeholder="היסטוריה, אנשים, עובדה מפתיעה">${esc(s.story)}</textarea></label>
    <label>טיפ של המדריך<input id="f-tip" maxlength="120" value="${esc(s.tip)}"></label>
    <label>כתובת לניווט בגוגל מפות<input id="f-addr" maxlength="120" value="${esc(s.addr||'')}" placeholder="למשל: רחוב הכרמל 20, או שם העסק"></label>
    ${t.stops.length>1?`<div class="order">מקום במסלול: ${heb(i)} מתוך ${t.stops.length}
      <button type="button" class="btn ghost" id="earlier" ${i===0?'disabled':''}>מוקדם יותר</button>
      <button type="button" class="btn ghost" id="later" ${i===t.stops.length-1?'disabled':''}>מאוחר יותר</button></div>`:''}
    ${s.placeId?'':`<label style="display:flex;gap:8px;align-items:center;font-family:var(--body);font-size:16px;font-weight:400;color:var(--ink)"><input type="checkbox" id="f-bank" style="width:auto"> לשמור גם בבנק האתרים</label>`}
    <div class="sheet-actions"><button class="btn" type="submit">שמירה</button><button class="btn ghost" type="button" data-cancel>ביטול</button><button class="btn danger" type="button" id="delStop">מחיקת התחנה</button></div>
  </form></div>`);
  const $=q=>layer.querySelector(q);
  $('#f-title').focus();
  const grab=()=>{s.title=$('#f-title').value.trim();s.type=$('#f-type').value;s.dish=$('#f-dish').value.trim();s.story=$('#f-story').value.trim();s.tip=$('#f-tip').value.trim();s.addr=$('#f-addr').value.trim();s.minutes=+$('#f-min').value||0;};
  $('[data-cancel]').onclick=()=>{ if(isNew&&!s.title){t.stops.splice(i,1);save();renderTour(false);} closeLayer(); };
  $('#stopForm').onsubmit=e=>{e.preventDefault();grab();if(!s.title)s.title='תחנה '+heb(i);
    if($('#f-bank')?.checked){const p={id:uid(),area:t.area||'',name:s.title,addr:s.addr||'',type:s.type,dish:s.dish,story:s.story,tip:s.tip,minutes:s.minutes,x:Math.round(s.x),y:Math.round(s.y)};state.places.push(p);s.placeId=p.id;}
    save();closeLayer();renderTour(false);};
  const move=dir=>{grab();if(!s.title)s.title='תחנה '+heb(i);const j=i+dir;[t.stops[i],t.stops[j]]=[t.stops[j],t.stops[i]];save();renderTour(false);openEditor(j,false);};
  if($('#earlier')) $('#earlier').onclick=()=>move(-1);
  if($('#later')) $('#later').onclick=()=>move(1);
  $('#delStop').onclick=e=>{const b=e.currentTarget;
    if(b.dataset.arm){t.stops.splice(i,1);save();closeLayer();renderTour(false);}
    else{b.dataset.arm='1';b.textContent='לחצו שוב כדי למחוק';}
  };
}

/* ---------- Card deck ---------- */
let deck=null;
function torn(seed){
  const r=rng(seed), p=[], n=11, j=()=>(r()*1.3).toFixed(2);
  for(let k=0;k<=n;k++) p.push(`${(k/n*100).toFixed(1)}% ${j()}%`);
  for(let k=1;k<=n;k++) p.push(`${(100-r()*1.3).toFixed(2)}% ${(k/n*100).toFixed(1)}%`);
  for(let k=n-1;k>=0;k--) p.push(`${(k/n*100).toFixed(1)}% ${(100-r()*1.3).toFixed(2)}%`);
  for(let k=n-1;k>0;k--) p.push(`${j()}% ${(k/n*100).toFixed(1)}%`);
  return `polygon(${p.join(',')})`;
}
function cardHTML(t,i){
  const s=t.stops[i], n=t.stops.length, last=i===n-1&&n>1;
  return `<article class="card${s.visited?' visited':''}" style="clip-path:${torn(hash(s.id))}" aria-live="polite">
    <div class="card-top"><div class="card-seal">${heb(i)}</div>
      <div><div class="card-kicker">${last?'תחנת האוצר':'תחנה '+heb(i)}${s.type?' · '+esc(s.type):''} · ${+s.minutes||0} דק׳</div><h2>${esc(s.title||'תחנה ללא שם')}</h2></div></div>
    ${s.dish?`<div class="dish"><span class="lbl">על הצלחת</span><span class="dish-name">${esc(s.dish)}</span></div>`:''}
    ${s.story?`<p class="story">${esc(s.story)}</p>`:`<p class="story" style="color:var(--ink-soft)">עוד לא נכתב סיפור לתחנה הזאת. אפשר להוסיף אותו במצב עריכת מסלול.</p>`}
    ${s.tip?`<div class="tip">טיפ של המדריך: ${esc(s.tip)}</div>`:''}
    <a class="gm-link" href="${navUrl(s,t.area)}" target="_blank" rel="noopener">${gmIcon}ניווט לכאן בגוגל מפות</a>
    ${i<n-1?`<div class="pg" style="font-size:21px">התחנה הבאה: ${esc(t.stops[i+1].title||'')} · ${Math.max(1,Math.round(walkMin(s,t.stops[i+1])))} דק׳ הליכה</div>`:''}
    <div class="card-foot"><button class="taste${s.visited?' on':''}" id="taste">${s.visited?'✓ טעמנו!':'סמנו: טעמנו'}</button><span class="pg">${i+1} / ${n}</span></div>
  </article>`;
}
function openDeck(i){
  const t=tour(); if(!t||!t.stops.length) return;
  deck={i};
  openLayer(`<div class="overlay">
    <button class="close" data-cancel aria-label="סגירת הקלפים">✕</button>
    <div class="deck"><div class="stack s2" style="clip-path:${torn(7)}"></div><div class="stack s1" style="clip-path:${torn(13)}"></div><div class="card-wrap" id="cardWrap"></div></div>
    <div class="deck-nav"><button class="btn ghost" id="prev">→ הקודם</button><div class="dots" id="dots"></div><button class="btn ghost" id="next">הבא ←</button></div>
    <div class="swipe-note">אפשר גם להחליק את הקלף</div>
  </div>`);
  layer.querySelector('[data-cancel]').onclick=closeLayer;
  layer.querySelector('#prev').onclick=()=>go(-1);
  layer.querySelector('#next').onclick=()=>go(1);
  const wrap=layer.querySelector('#cardWrap');
  let sw=null;
  wrap.addEventListener('pointerdown',e=>{ if(e.target.closest('button,a')) return; sw={x:e.clientX,dx:0,id:e.pointerId}; });
  wrap.addEventListener('pointermove',e=>{
    if(!sw) return; sw.dx=e.clientX-sw.x;
    if(Math.abs(sw.dx)>8&&!sw.cap){sw.cap=true;try{wrap.setPointerCapture(sw.id)}catch(_){} wrap.style.transition='none';}
    if(sw.cap) wrap.style.transform=`translateX(${sw.dx}px) rotate(${sw.dx/22}deg)`;
  });
  const end=()=>{ if(!sw) return; const dx=sw.dx, cap=sw.cap; sw=null; if(!cap) return;
    wrap.style.transition=''; if(dx<-70) go(1); else if(dx>70) go(-1); else wrap.style.transform=''; };
  wrap.addEventListener('pointerup',end); wrap.addEventListener('pointercancel',end);
  paintCard();
  layer.querySelector('#next').focus();
}
function paintCard(){
  const t=tour(), wrap=layer.querySelector('#cardWrap'); if(!wrap) return;
  wrap.innerHTML=cardHTML(t,deck.i);
  layer.querySelector('#dots').innerHTML=t.stops.map((_,k)=>`<button class="dot${k===deck.i?' on':''}" data-k="${k}" aria-label="תחנה ${heb(k)}"></button>`).join('');
  layer.querySelectorAll('.dot').forEach(d=>d.onclick=()=>{const k=+d.dataset.k;if(k!==deck.i)go(k-deck.i)});
  layer.querySelector('#prev').disabled=deck.i===0;
  layer.querySelector('#next').disabled=deck.i===t.stops.length-1;
  wrap.querySelector('#taste').onclick=()=>{const s=t.stops[deck.i];s.visited=!s.visited;save();paintCard();renderTour(false);};
}
function go(dir){
  const t=tour(); if(!deck) return;
  const j=deck.i+dir, wrap=layer.querySelector('#cardWrap');
  if(j<0||j>=t.stops.length){ if(wrap) wrap.style.transform=''; return; }
  if(reduce){deck.i=j;paintCard();return;}
  const out=dir>0?-1:1;
  wrap.style.transition='transform .22s ease-in, opacity .22s ease-in';
  wrap.style.transform=`translateX(${out*110}%) rotate(${out*14}deg)`; wrap.style.opacity='0';
  setTimeout(()=>{
    if(!deck) return;
    deck.i=j; paintCard();
    wrap.style.transition='none'; wrap.style.transform=`translateX(${-out*60}%) rotate(${-out*8}deg)`;
    wrap.getBoundingClientRect();
    wrap.style.transition='transform .28s ease-out, opacity .28s ease-out'; wrap.style.transform=''; wrap.style.opacity='1';
  },220);
}

/* ---------- Ghost ship backdrop ---------- */
function ghostShip(){
  const r=rng(1717), f=n=>n.toFixed(1);
  const sail=(cx,y,w,h)=>{
    const L=cx-w/2,R=cx+w/2,n=8;let d=`M${L} ${y} L${R} ${y} Q${f(R+w*.12)} ${f(y+h*.55)} ${R-4} ${y+h}`;
    for(let i=n-1;i>=0;i--){const x=L+4+(w-8)*i/n, yy=y+h-(i%2?r()*16+4:r()*6)-(i===0?0:0);d+=` L${f(x)} ${f(yy)}`}
    d+=` Q${f(L-w*.12)} ${f(y+h*.55)} ${L} ${y}Z`;
    const hx=L+w*(.25+r()*.5), hy=y+h*(.3+r()*.35);
    return `<path class="gs-fill" d="${d}"/><ellipse class="gs-hole" cx="${f(hx)}" cy="${f(hy)}" rx="${f(5+r()*7)}" ry="${f(4+r()*5)}" transform="rotate(${f(r()*60-30)} ${f(hx)} ${f(hy)})"/><line class="gs-line" x1="${L-8}" y1="${y}" x2="${R+8}" y2="${y}"/>`;
  };
  const masts=[[200,92,300],[330,48,300],[455,104,300]];
  let rig='';masts.forEach(([x,top])=>{rig+=`<line class="gs-thin" x1="${x}" y1="${top}" x2="78" y2="262"/><line class="gs-thin" x1="${x}" y1="${top}" x2="560" y2="292"/>`});
  let ports='';for(let i=0;i<7;i++){const x=150+i*52;ports+=`<circle class="gs-glow" cx="${x}" cy="320" r="4.5" filter="url(#gsGlow)"/>`}
  let fog='';for(let i=0;i<9;i++)fog+=`<ellipse class="gs-fog" cx="${f(r()*700-20)}" cy="${f(372+r()*40)}" rx="${f(90+r()*120)}" ry="${f(14+r()*14)}" filter="url(#gsBlur)"/>`;
  return `<svg viewBox="0 0 680 430"><defs>
      <filter id="gsGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      <filter id="gsBlur" x="-20%" y="-100%" width="140%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
    </defs>
    <g filter="url(#gsGlow)">
      ${rig}
      ${masts.map(([x,top,b])=>`<line class="gs-line" x1="${x}" y1="${top}" x2="${x}" y2="${b}"/>`).join('')}
      ${sail(200,104,104,82)}${sail(200,196,124,86)}
      ${sail(330,64,118,90)}${sail(330,166,140,108)}
      ${sail(455,116,96,74)}${sail(455,198,116,84)}
      <path class="gs-fill" d="M330 48 q14 -6 26 0 t26 0 l-4 16 q-12 -6 -24 0 t-24 0Z"/>
      <circle class="gs-hole" cx="355" cy="52" r="3.5"/>
      <path class="gs-line" d="M560 292 L640 250"/>
      <path class="gs-fill" d="M60 258 L172 258 L172 296 L560 292 L522 352 Q330 378 120 354 L74 300Z"/>
      <path class="gs-thin" d="M90 310 Q330 334 545 306 M108 336 Q330 356 532 330"/>
      <path class="gs-line" d="M56 246 L176 246 M66 246 V258 M96 246 V258 M126 246 V258 M156 246 V258"/>
      ${ports}
    </g>
    ${fog}
  </svg>`;
}
document.querySelector('.ghost-ship').innerHTML=ghostShip();

function render(anim){
  if(view.screen==='tour') renderTour(anim);
  else if(view.screen==='places') renderPlaces();
  else if(view.screen==='suggest') renderSuggest();
  else renderHome();
}
/* ---------- System back button (called by the Android wrapper) ---------- */
window.__captainBack=function(){
  if(layer.innerHTML){const c=layer.querySelector('[data-cancel]');c?c.click():closeLayer();return true}
  if(view.screen!=='home'){go2('home');return true}
  return false;
};
render(false);
})();
