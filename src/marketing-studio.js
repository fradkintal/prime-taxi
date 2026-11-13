// ============================================================================
// PRIME TAXI (פריים טקסי v3.0.0) — סטודיו פרסום, סרטוני וידאו (Reels/Tutorials), פוסטים, דגל לרכב ומיתוג
// ============================================================================

window.PRIME_TAXI_MARKETING = (function () {
  let activeSubTab = 'videos'; // 'videos' | 'car_branding' | 'posts' | 'growth_ideas'
  let selectedVideoId = 'vid_cust_booking';
  let isPlaying = false;
  let isRecording = false;
  let animFrameId = null;
  let playStartTime = 0;
  let currentFlagTheme = 'obsidian_gold'; // 'obsidian_gold' | 'white_gold' | 'emerald_gold'
  let currentMerchType = 'flag'; // 'flag' | 'magnet' | 'qr_sticker' | 'roof_sign'
  let postCategoryFilter = 'all'; // 'all' | 'customers' | 'drivers' | 'vip_delivery' | 'whatsapp_auto'

  const VIDEOS = [
    {
      id: 'vid_cust_booking',
      audience: 'ללקוחות (הדרכה פשוטה)',
      badgeColor: 'bg-amber-400 text-slate-950',
      durationSec: 16,
      title: '1. סרטון ללקוח פשוט: איך מזמינים מונית לנתב״ג ב-15 שניות (מחיר קבוע מראש!)',
      subtitle: 'מדגים ללקוח כמה קל לבחור עיר, מזוודות וסלקל, לראות מחיר סופי וידוע מראש ולשלוח ל-WhatsApp בקליק',
      hookText: 'טסים לחו״ל? ✈️ אל תחכו לרגע האחרון ואל תופתעו במונה!',
      ctaText: 'היכנסו עכשיו ל-פריים טקסי וחשבו מחיר קבוע ב-5 שניות!',
      shareCaption: `✈️ *טסים לחו״ל? ככה מזמינים מונית לנתב״ג ב-15 שניות ובמחיר קבוע מראש!* 🚕\n\n✅ בוחרים עיר איסוף ושעה\n✅ מסמנים כמות נוסעים, מזוודות וסלקל\n✅ מקבלים מחיר סופי ושקוף על המסך — בלי הפתעות!\n✅ לוחצים "שלח ל-WhatsApp" והמונית משובצת אליכם 24/7.\n\n🌐 *לחישוב מחיר והזמנה מיידית:*\nhttps://drllqs5t3fzo5.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'שלב 1: בוחרים עיר ומועד נסיעה', sub: 'נכנסים מהנייד, בוחרים "מונית לנתב״ג" ואת עיר האיסוף מבין 78 ערים', icon: '📍', highlight: 'תל אביב ⬅ נתב״ג טרמינל 3', priceTag: '₪150 מחיר קבוע!' },
        { time: [4, 8], header: 'שלב 2: נוסעים, מזוודות וסלקל', sub: 'מוסיפים מזוודות או מושב בטיחות — המערכת מתאימה את גודל המונית אוטומטית!', icon: '🧳', highlight: '3 נוסעים • 3 מזוודות • סדאן מרווחת', priceTag: 'ללא הפתעות במונה' },
        { time: [8, 12], header: 'שלב 3: לחיצה אחת ל-WhatsApp', sub: 'לוחצים על הכפתור הירוק — כל פרטי הנסיעה נשלחים מוכנים למוקד שלנו!', icon: '💬', highlight: 'נשלח למוקד פריים טקסי 24/7', priceTag: 'אישור מיידי' },
        { time: [12, 16], header: 'שלב 4: נהג VIP בדרך אליך!', sub: 'נהג קרוב משובץ אליך ומגיע בדיוק בזמן עד פתח הבית. טיסה נעימה!', icon: '🚕', highlight: 'פריים טקסי • PRIME TAXI', priceTag: 'זמינות 24/7 בכל הארץ' }
      ]
    },
    {
      id: 'vid_cust_landing',
      audience: 'ללקוחות (איסוף מנתב״ג)',
      badgeColor: 'bg-sky-400 text-slate-950',
      durationSec: 16,
      title: '2. סרטון ללקוח נוחת: איסוף מנתב״ג עם מעקב טיסה חי (בלי תוספת על עיכוב!)',
      subtitle: 'מרגיע את הלקוח: מזינים מספר טיסה והנהג מחכה ביציאה מטרמינל 3 בדיוק ברגע הנחיתה',
      hookText: 'נוחתים בנתב״ג באמצע הלילה? 🛬 המונית כבר מחכה לכם ביציאה!',
      ctaText: 'שריינו איסוף מנתב״ג עם מעקב מספר טיסה אוטומטי',
      shareCaption: `🛬 *חוזרים לארץ? אל תעמדו בתור למוניות בנתב״ג!* 🚕\n\nב-*פריים טקסי* מזינים את מספר הטיסה שלכם מראש:\n✅ אנחנו עוקבים אחרי הנחיתה בזמן אמת\n✅ הטיסה התעכבה? הנהג מתעדכן אוטומטית וללא שום תוספת תשלום!\n✅ יוצאים מטרמינל 3 ישר למונית ממוזגת שמחכה רק לכם.\n\n🌐 *לשריון איסוף מנתב״ג במחיר קבוע:*\nhttps://drllqs5t3fzo5.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'נוחתים בנתב״ג בלי תור ובלי לחץ', sub: 'בוחרים "איסוף מנתב״ג" ומזינים את מספר הטיסה שלכם (למשל LY316)', icon: '🛬', highlight: 'מעקב נחיתות חי בטרמינל 3 ו-1', priceTag: 'מחיר ידוע מראש' },
        { time: [4, 8], header: 'הטיסה התעכבה? עלינו!', sub: 'המערכת מסונכרנת ללוח הנחיתות — הנהג יגיע בדיוק כשאתם נוחתים ללא קנס המתנה', icon: '⏱️', highlight: '₪0 תוספת על עיכוב טיסה', priceTag: 'שקט נפשי מלא' },
        { time: [8, 12], header: 'אפשרות לשלט קבלת פנים VIP', sub: 'הנהג יכול להמתין באולם מקבלי הפנים עם שלט שמכם ועזרה מלאה במזוודות', icon: '👑', highlight: 'שירות VIP לאורחים ומשפחות', priceTag: 'חוויית פרימיום' },
        { time: [12, 16], header: 'נוחתים ונכנסים ישר למונית!', sub: 'הנהג שולח לכם הודעת WhatsApp ברגע הנחיתה ואוסף אתכם משער היציאה', icon: '🚖', highlight: 'פריים טקסי — הביתה בשלום', priceTag: '24/7 כל השבוע' }
      ]
    },
    {
      id: 'vid_driver_onboarding',
      audience: 'לנהגים (התחברות ותפיסת נסיעה)',
      badgeColor: 'bg-emerald-400 text-slate-950',
      durationSec: 16,
      title: '3. סרטון הדרכה לנהג מונית: איך מתחברים ותופסים נסיעה ב-10 שניות!',
      subtitle: 'סרטון לשליחה לכל נהג חדש שמצטרף לתחנה — מראה איך נכנסים לפורטל הנהגים ולוקחים נסיעה',
      hookText: 'נהג מונית / מיניבוס? 🚖 ככה תופסים נסיעות לנתב״ג ב-10 שניות!',
      ctaText: 'היכנס לפורטל הנהגים, סמן "פנוי בנתב״ג" ותפוס נסיעה עכשיו!',
      shareCaption: `🚖 *ברוך הבא לצוות הנהגים של פריים טקסי!* 🔥\n\nככה תופסים נסיעות בפורטל הנהגים שלנו ב-10 שניות:\n1️⃣ נכנסים מהנייד לקישור הנהגים ומזינים שם, טלפון וסוג רכב\n2️⃣ מסמנים בראש המסך: *"✈️ פנוי עכשיו בנתב״ג"* או *"🟢 פנוי באזור שלי"*\n3️⃣ רואים בלוח החי את כל הנסיעות הפנויות וכמה *כסף נטו נשאר לך בכיס!*\n4️⃣ לוחצים *"✋ תפוס נסיעה זו"* ומקבלים את פרטי הלקוח וניווט Waze!\n\n🌐 *כניסה ישירה לפורטל הנהגים:*\nhttps://d2gkypncorjpuw.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'שלב 1 לנהג: כניסה ב-10 שניות', sub: 'פותחים את פורטל הנהגים בנייד, מזינים שם, טלפון וסוג מונית (ללא צורך בהורדת אפליקציה כבדה!)', icon: '🪪', highlight: 'כניסה מהירה בלי סיסמאות מסובכות', priceTag: 'חיבור מיידי' },
        { time: [4, 8], header: 'שלב 2: מסמנים סטטוס זמינות', sub: 'לוחצים על "✈️ פנוי עכשיו בנתב״ג" או "🟢 פנוי באזור שלי" כדי שהסדרן יראה אותך בראש הרשימה', icon: '📡', highlight: 'סנכרון ענן חי מול המוקד', priceTag: 'עדיפות לנהגים זמינים' },
        { time: [8, 12], header: 'שלב 3: רואים רווח נטו שקוף', sub: 'על כל נסיעה כתוב מראש: מחיר גבייה מלקוח, עמלת תחנה (15%), וכמה נטו נשאר לך בכיס!', icon: '💰', highlight: 'גבייה: ₪200 | נטו לנהג: ₪170!', priceTag: 'שקיפות 100%' },
        { time: [12, 16], header: 'שלב 4: לוחצים "✋ תפוס נסיעה"!', sub: 'הנסיעה משוריינת לך מיד! מעבירים עמלה בביט ומקבלים טלפון לקוח וניווט Waze', icon: '🚀', highlight: 'פורטל נהגים • פריים טקסי', priceTag: 'פרנסה בשפע כל יום' }
      ]
    },
    {
      id: 'vid_driver_commission',
      audience: 'לנהגים (עמלת ביט ופתיחת לקוח)',
      badgeColor: 'bg-emerald-400 text-slate-950',
      durationSec: 16,
      title: '4. סרטון לנהג: איך מעבירים עמלה ב-Bit/PayBox ופותחים טלפון לקוח + Waze',
      subtitle: 'מסביר לנהגים בצורה ברורה ופשוטה את נוהל העבודה: בלי דמי תחנה חודשיים — רק עמלה על נסיעה שלקחת',
      hookText: 'בלי דמי סדרן חודשיים! 💸 משלמים עמלה בביט רק על נסיעה שתפסת!',
      ctaText: 'הוגן, מהיר ושקוף — כל פרטי הלקוח נפתחים מיד על המסך',
      shareCaption: `💸 *איך עובד תשלום העמלה ופתיחת פרטי הלקוח בפריים טקסי?* 🚖\n\nאצלנו אין דמי תחנה חודשיים קבועים! אתה משלם רק כשאתה מרוויח:\n1️⃣ תפסת נסיעה בלוח הנהגים? היא שמורה לך.\n2️⃣ מעביר את עמלת התחנה (15%) ב-Bit או PayBox למספר המוקדן שמופיע על המסך.\n3️⃣ לוחץ *"✅ העברתי עמלה — פתח לי פרטי לקוח"*.\n4️⃣ מיד נפתחים לך: שם וטלפון הלקוח לחיוג, כפתור WhatsApp ישיר ללקוח וכפתור ניווט ב-Waze!\n\n🌐 *ללוח הנסיעות החי לנהגים:*\nhttps://d2gkypncorjpuw.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: '0 ₪ דמי תחנה חודשיים!', sub: 'לא עבדת — לא שילמת שקל! אתה משלם עמלה אך ורק על נסיעה שתפסת בפועל', icon: '🤝', highlight: 'מודל הוגן ומשתלם לנהג', priceTag: '0 ₪ קבוע בחודש' },
        { time: [4, 8], header: 'תפסת נסיעה? העבר עמלה ב-Bit', sub: 'בכרטיס הנסיעה מופיע סכום העמלה המדויק ומספר ה-Bit/PayBox של המוקדן הפעיל (טל / אליהו)', icon: '📲', highlight: 'העברה מהירה בביט או פייבוקס', priceTag: '15% עמלת נסיעה' },
        { time: [8, 12], header: 'פתיחה מיידית של פרטי הלקוח!', sub: 'לחיצה על "העברתי עמלה" פותחת מיד את שם הלקוח, טלפון לחיוג וכתובת מלאה', icon: '🔓', highlight: '📞 חיוג + 💬 WhatsApp ללקוח', priceTag: 'פתיחה אוטומטית' },
        { time: [12, 16], header: 'ניווט Waze בלחיצה ויציאה לדרך!', sub: 'לוחצים על כפתור Waze המובנה בכרטיס הנסיעה ויוצאים לאסוף את הלקוח', icon: '🗺️', highlight: 'הכל בלחיצת כפתור אחת', priceTag: 'פריים טקסי ישראל' }
      ]
    },
    {
      id: 'vid_driver_recruit_viral',
      audience: 'גיוס נהגים (Reels / TikTok)',
      badgeColor: 'bg-purple-400 text-slate-950',
      durationSec: 16,
      title: '5. סרטון ויראלי לגיוס נהגים: "חוזר ריק מנתב״ג? בוא תרוויח משני הכיוונים!"',
      subtitle: 'סרטון שיווקי חזק לפרסום בקבוצות נהגי מוניות ומיניבוסים כדי לבנות מאגר של מאות נהגים עד הקיץ',
      hookText: 'נהג מונית או מיניבוס? 🚕 נמאס לך לחזור ריק מנתב״ג או מנסיעות בינעירוניות?',
      ctaText: 'הצטרף עכשיו בחינם למאגר הנהגים של פריים טקסי!',
      shareCaption: `🚨 *נהג מונית / מיניבוס / מרצדס V-Class? אל תחזור ריק מנתב״ג!* 🚕✈️\n\nתחנת *פריים טקסי (PRIME TAXI)* מגייסת נהגים איכותיים מכל הארץ לקראת שיא עונת הטיסות!\n🔥 נסיעות ספיישל לנתב״ג ומנתב״ג 24/7\n🔥 נסיעות בינעירוניות ומשלוחים רווחיים מעיר לעיר\n🔥 בלי דמי סדרן חודשיים — עמלה הוגנת רק על נסיעה שלקחת!\n🔥 מערכת ענן מהירה בנייד לתפיסת נסיעות בקליק.\n\n📲 *להצטרפות מיידית ב-WhatsApp או כניסה ללוח הנהגים:*\nhttps://d2gkypncorjpuw.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'מוריד נוסעים בנתב״ג וחוזר ריק?', sub: 'חבל על הדלק ועל הזמן שלך! אצלנו מחכות לך נסיעות חזור מטרמינל 3 לכל הארץ', icon: '✈️', highlight: 'נסיעות הלוך-חזור מנתב״ג 24/7', priceTag: 'מילוי יומן נסיעות' },
        { time: [4, 8], header: 'בעל מונית גדולה / V-Class / מיניבוס?', sub: 'המחשבון החכם שלנו משדרג משפחות עם מזוודות ישירות לרכבים גדולים בתעריף פרימיום!', icon: '🚐', highlight: 'תוספת +₪110 עד +₪340 לנסיעה!', priceTag: 'רווח גבוה לרכב גדול' },
        { time: [8, 12], header: 'מכרז נסיעות חי ישר לנייד שלך', sub: 'בלי מכשירי קשר ישנים — כל הנסיעות קופצות לך בנייד ב-WhatsApp ובפורטל הנהגים', icon: '⚡', highlight: 'תפיסת נסיעה בלחיצה אחת', priceTag: 'טכנולוגיה מתקדמת' },
        { time: [12, 16], header: 'הצטרף היום בחינם לצוות שלנו!', sub: 'שלח הודעה ב-WhatsApp לטל (054-6373001) או אליהו (050-7676946) והתחל לקבל נסיעות היום', icon: '👑', highlight: '054-6373001 • 050-7676946', priceTag: 'הצטרפות חינם!' }
      ]
    },
    {
      id: 'vid_cust_family_van',
      audience: 'ללקוחות (משפחות ורכבים גדולים)',
      badgeColor: 'bg-amber-400 text-slate-950',
      durationSec: 16,
      title: '6. סרטון למשפחות וקבוצות: מוניות גדולות 5–14 מקומות + סלקלים ומזוודות',
      subtitle: 'פונה למשפחות שטסות לחו״ל וצריכות רכב מרווח לכל המזוודות והעגלות בלי להזמין 2 מוניות נפרדות',
      hookText: 'טסים כל המשפחה לחו״ל? 👨‍👩‍👧‍👦 אל תזמינו 2 מוניות כשכולם נכנסים ברכב VIP אחד!',
      ctaText: 'מוניות 6 מקומות, מרצדס V-Class ומיניבוסים לנתב״ג במחיר קבוע',
      shareCaption: `👨‍👩‍👧‍👦 *טסים כל המשפחה לחו״ל עם 5 מזוודות, עגלה וילדים?* ✈️🧳\n\nבמקום להתפצל ל-2 מוניות, ב-*פריים טקסי* מזמינים מונית משפחתית מרווחת:\n🚐 מוניות 5–6 מקומות עם תא מטען ענק\n👑 מרצדס V-Class VIP ל-7–8 נוסעים\n🚌 מיניבוסים חדשים ל-10–14 נוסעים\n👶 אפשרות להזמנת סלקל או בוסטר מראש!\n\n🌐 *חשבו עכשיו מחיר מדויק לפי כמות הנוסעים והמזוודות שלכם:*\nhttps://drllqs5t3fzo5.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'טסים עם הילדים והמון מזוודות?', sub: 'מזינים במחשבון את מספר הנוסעים, המזוודות הגדולות ועגלות התינוק', icon: '👨‍👩‍👧‍👦', highlight: 'חישוב נפח תא מטען אוטומטי!', priceTag: 'התאמת רכב מושלמת' },
        { time: [4, 8], header: 'שדרוג חכם למונית גדולה או V-Class', sub: 'המערכת בוחרת עבורכם אוטומטית רכב 6 מקומות, מרצדס V-Class או מיניבוס שיכיל הכל בנוחות', icon: '🚐', highlight: 'מרצדס V-Class • 6–14 מקומות', priceTag: 'נוחות מקסימלית' },
        { time: [8, 12], header: 'סלקל ובוסטר מחכים לכם במונית!', sub: 'מסמנים במחשבון תוספת מושב בטיחות והנהג מגיע עם סלקל תקני ומחובר מראש', icon: '👶', highlight: 'בטיחות הילדים מעל הכל', priceTag: 'שירות משפחות VIP' },
        { time: [12, 16], header: 'החופשה שלכם מתחילה כבר מהבית!', sub: 'שריינו עכשיו מונית משפחתית לנתב״ג ב-WhatsApp ותיהנו מראש שקט', icon: '✨', highlight: 'פריים טקסי • PRIME TAXI', priceTag: 'הזמינו עכשיו' }
      ]
    },
    {
      id: 'vid_cust_delivery',
      audience: 'ללקוחות ועסקים (משלוחים אקספרס)',
      badgeColor: 'bg-indigo-400 text-slate-950',
      durationSec: 16,
      title: '7. סרטון משלוחים אקספרס: שליחת חבילות, מפתחות ומסמכים במונית ספיישל',
      subtitle: 'פותח ערוץ הכנסות נוסף ורווחי מאוד בשעות היום: משלוחי אקספרס מעיר לעיר עם צילום מסירה',
      hookText: 'צריכים להעביר חבילה, מפתחות או מסמך משפטי מעיר לעיר בדחיפות? 📦⚡',
      ctaText: 'משלוח אקספרס במונית ספיישל — איסוף תוך 20 דקות ומסירה מיד ליד!',
      shareCaption: `📦 *משלוח דחוף מעיר לעיר? אל תחכו לשליח שיגיע מחר!* 🚕⚡\n\nשירות *משלוחים אקספרס במונית ספיישל* של פריים טקסי:\n✅ איסוף מיידי תוך 20 דקות מבית העסק או מהבית\n✅ נסיעה ישירה (ספיישל) ליעד בכל הארץ — ללא עצירות בדרך!\n✅ מתאים למעטפות משפטיות, מפתחות, ציוד רפואי, חלקי חילוף וחבילות רגישות\n✅ אישור וצילום מסירה ב-WhatsApp בזמן אמת.\n\n🌐 *לחישוב מחיר משלוח והזמנה מיידית:*\nhttps://drllqs5t3fzo5.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: 'משלוח דחוף שחייב להגיע בשעה הקרובה?', sub: 'בוחרים באתר בלשונית "📦 משלוח / חבילה" ומזינים עיר איסוף ועיר יעד', icon: '📦', highlight: 'מונית ספיישל ישירה ליעד', priceTag: 'איסוף תוך 20 דק׳' },
        { time: [4, 8], header: 'מסמכים, מפתחות, מחשב או מתנה', sub: 'הנהג שלנו אוסף מיד ליד ונוסע ישירות לנמען ללא עיכובים וללא תחנות חלוקה', icon: '🔑', highlight: 'שמירה מלאה על חבילות רגישות', priceTag: 'אחריות וביטחון' },
        { time: [8, 12], header: 'אישור וצילום מסירה ב-WhatsApp!', sub: 'ברגע שהחבילה נמסרת לנמען, אתם מקבלים הודעת WhatsApp עם צילום אישור מסירה', icon: '📸', highlight: 'דיווח מסירה בזמן אמת', priceTag: 'שירות עסקי 24/7' },
        { time: [12, 16], header: 'הזמינו משלוח אקספרס עכשיו!', sub: 'מחיר קבוע מראש לכל עיר בארץ — חשבו באתר ושלחו ל-WhatsApp שלנו', icon: '🚀', highlight: 'פריים טקסי משלוחים', priceTag: 'זמינות מיידית' }
      ]
    },
    {
      id: 'vid_admin_guide',
      audience: 'למנהלים (טל ואליהו — תפעול מהיר)',
      badgeColor: 'bg-rose-400 text-slate-950',
      durationSec: 16,
      title: '8. סרטון הדרכה למנהלים (טל ואליהו): ניהול משמרת, שיבוץ נהג וגזירת עמלה',
      subtitle: 'מראה איך מתפעלים הזמנה שנכנסה ב-3 קליקים מהאייפון ואיך גובים עמלות בביט ופייבוקס',
      hookText: 'טל ואליהו 👑 ככה מתפעלים את התחנה מהנייד ב-10 שניות להזמנה!',
      ctaText: 'החלפת משמרת בקליק • הפצת מכרז לנהגים • גביית עמלה אוטומטית',
      shareCaption: `👑 *מרכז השליטה של טל ואליהו — פריים טקסי:*\nhttps://d1qjhe0ijgnja3.cloudfront.net/`,
      scenes: [
        { time: [0, 4], header: '1. בחירת שותף במשמרת בקליק אחד', sub: 'בראש מסך הסדרן בוחרים "משמרת טל" או "משמרת אליהו" — כל ההזמנות והביט עוברים אליו אוטומטית', icon: '👑', highlight: 'טל (054-6373001) ↔ אליהו (050-7676946)', priceTag: 'שליטה מלאה' },
        { time: [4, 8], header: '2. הפצה לקבוצת הנהגים או שיבוץ ישיר', sub: 'לוחצים "שלח מכרז לקבוצת נהגים" (ללא טלפון הלקוח!) או בוחרים נהג פנוי מהמאגר בקליק', icon: '📡', highlight: 'טלפון הלקוח מוגן עד לתשלום עמלה', priceTag: '0 זליגת נסיעות' },
        { time: [8, 12], header: '3. הנהג מעביר 15% עמלה ב-Bit/PayBox', sub: 'ברגע שהנהג מעביר את העמלה לביט שלכם, לוחצים "שלח פרטי לקוח לנהג הזוכה"', icon: '💸', highlight: 'גביית עמלות מהירה בביט ופייבוקס', priceTag: 'כסף נזיל מיידי' },
        { time: [12, 16], header: '4. מעקב רווחים וחלוקת 50/50 חיה', sub: 'בלשונית "ניתוחים ודוחות" רואים בכל רגע כמה עמלות נכנסו וכמה החלק של כל שותף', icon: '📊', highlight: 'דשבורד רווחיות בזמן אמת', priceTag: 'צמיחה עד הקיץ!' }
      ]
    }
  ];

  const SOCIAL_POSTS = [
    {
      id: 'post_airport_fixed',
      category: 'customers',
      categoryLabel: '✈️ לקוחות — נתב״ג',
      title: 'פוסט דגל ללקוחות: מונית לנתב״ג במחיר קבוע מראש (ללא הפתעות במונה!)',
      image: './public/assets/post-customer-airport.jpg',
      fallbackImage: './public/assets/hero-airport.jpg',
      targetWhere: 'קבוצות פייסבוק עירוניות, קבוצות וואטסאפ שכונתיות, קבוצות "טסים לחו״ל" ואינסטגרם',
      copyText: `✈️ *טסים לחו״ל בקרוב? אל תחכו לדקה ה-90 ואל תהמרו על המונה!* 🚕\n\nב-*פריים טקסי (PRIME TAXI)* אתם יודעים בדיוק כמה תשלמו עוד לפני שעליתם למונית:\n✅ *מחשבון מחירים חי באתר* ל-78 ערים ויישובים בישראל\n✅ *מחיר קבוע וסופי מראש* (יום / לילה) — בלי הפתעות!\n✅ *התאמת רכב אוטומטית* לכמות הנוסעים והמזוודות שלכם (סדאן, 6 מקומות, מרצדס V-Class ומיניבוסים)\n✅ *אפשרות לסלקל / בוסטר לילדים* מראש\n✅ *מעקב נחיתות בנתב״ג:* נוחתים? הנהג מחכה לכם ביציאה מטרמינל 3 גם אם הטיסה התעכבה!\n\n👇 *חשבו עכשיו את מחיר הנסיעה שלכם ב-5 שניות ושלחו הזמנה ישירות ל-WhatsApp:*\nhttps://drllqs5t3fzo5.cloudfront.net/\n\n📞 מוקד הזמנות 24/7 ב-WhatsApp: 054-6373001 / 050-7676946`
    },
    {
      id: 'post_driver_recruit_main',
      category: 'drivers',
      categoryLabel: '🚖 גיוס נהגים לתחנה',
      title: 'פוסט גיוס נהגים: קבל נסיעות לנתב״ג ובינעירוני ישר לנייד — בלי דמי תחנה חודשיים!',
      image: './public/assets/post-driver-recruit.jpg',
      fallbackImage: './public/assets/hero-airport.jpg',
      targetWhere: 'קבוצות נהגי מוניות בפייסבוק, קבוצות WhatsApp של נהגי נתב״ג ונהגי מיניבוסים',
      copyText: `🚖 *נהג מונית / מונית 6 מקומות / מרצדס V-Class / מיניבוס?* 🔥\n*רוצה לקבל נסיעות ספיישל לנתב״ג ונסיעות בינעירוניות רווחיות ישר לנייד — בלי לשלם דמי סדרן חודשיים קבועים?*\n\nתחנת *פריים טקסי (PRIME TAXI)* מצרפת נהגים איכותיים מכל הארץ!\n💰 *מודל הוגן ושקוף:* 0 ₪ דמי מנוי חודשיים! משלמים עמלה הוגנת (בביט/פייבוקס) אך ורק על נסיעה שתפסת בפועל.\n✈️ *סנכרון חי מנתב״ג:* הורדת נוסעים בטרמינל 3? סמן בפורטל הנהגים *"פנוי בנתב״ג"* וקבל נסיעה חזור!\n📲 *מערכת ענן מהירה בנייד:* רואים מראש את המסלול וכמה *כסף נטו נשאר לך בכיס*, לוחצים *"תפוס נסיעה"* ומקבלים מיד טלפון לקוח וניווט Waze.\n\n👇 *היכנס עכשיו ללוח הנסיעות החי לנהגים והירשם ב-10 שניות:*\nhttps://d2gkypncorjpuw.cloudfront.net/\n\n💬 או שלח הודעה למוקד הנהגים ב-WhatsApp: 054-6373001 / 050-7676946`
    },
    {
      id: 'post_family_van',
      category: 'customers',
      categoryLabel: '👨‍👩‍👧‍👦 משפחות ורכבים גדולים',
      title: 'פוסט למשפחות שטסות לחו״ל: מוניות גדולות 6–8 מקומות + סלקלים ומזוודות',
      image: './public/assets/post-family-safety.jpg',
      fallbackImage: './public/assets/hero-airport.jpg',
      targetWhere: 'קבוצות הורים, קבוצות חופשות משפחתיות, פייסבוק ואינסטגרם',
      copyText: `👨‍👩‍👧‍👦 *טסים כל המשפחה לחו״ל? למה להזמין 2 מוניות כשאפשר לנסוע יחד ברכב VIP מרווח אחד?* ✈️🧳\n\nבמחשבון החכם של *פריים טקסי*, אתם מזינים כמה נוסעים, כמה מזוודות גדולות וכמה עגלות יש לכם — והמערכת מתאימה לכם אוטומטית את הרכב המושלם:\n🚐 *מונית גדולה (5–6 מקומות)* עם תא מטען ענק\n👑 *מרצדס V-Class VIP (7–8 נוסעים)*\n🚌 *מיניבוס משפחות וקבוצות (10–14 נוסעים)*\n👶 *סלקל / בוסטר תקני לתינוקות וילדים* שמוכן עבורכם ברכב!\n\n👇 *בדקו מחיר קבוע מראש מעיר המגורים שלכם לנתב״ג:*\nhttps://drllqs5t3fzo5.cloudfront.net/`
    },
    {
      id: 'post_vip_delivery',
      category: 'vip_delivery',
      categoryLabel: '📦 משלוחים ועסקים VIP',
      title: 'פוסט לעסקים ומשלוחים דחופים: שליחת חבילות, חוזים ומפתחות במונית ספיישל תוך שעה',
      image: './public/assets/post-vip-business.jpg',
      fallbackImage: './public/assets/hero-airport.jpg',
      targetWhere: 'קבוצות עסקים, עורכי דין, רואי חשבון, מרפאות, חנויות אונליין ולינקדאין',
      copyText: `📦 *צריכים להעביר מעטפה דחופה, מפתחות, ציוד רפואי או חבילה רגישה מעיר לעיר עכשיו?* 🚕⚡\n\nהכירו את שירות *משלוחי האקספרס במונית ספיישל* של פריים טקסי:\n🚀 איסוף תוך 20 דקות ומסירה ישירה (מיד ליד) בכל הארץ — בלי תחנות מיון ובלי לחכות למחר!\n📸 צילום ואישור מסירה חי ב-WhatsApp ברגע שהחבילה אצל הנמען.\n💼 הסדרי נסיעות מיוחדים לחברות, משרדי עורכי דין ואנשי עסקים.\n\n👇 *לחישוב מחיר משלוח או נסיעת VIP מעיר לעיר:*\nhttps://drllqs5t3fzo5.cloudfront.net/`
    },
    {
      id: 'post_car_flag_pride',
      category: 'drivers',
      categoryLabel: '🚩 מיתוג ודגל לרכב',
      title: 'פוסט השקת מיתוג ודגלי רכב לנהגי התחנה: "הנבחרת של פריים טקסי על הכביש!"',
      image: './public/assets/car-flag-mockup.jpg',
      fallbackImage: './public/assets/logo-modern.jpg',
      targetWhere: 'קבוצת ה-WhatsApp של נהגי התחנה וסטורי באינסטגרם/פייסבוק',
      copyText: `👑 *הנבחרת של פריים טקסי (PRIME TAXI) כובשת את כבישי ישראל!* 🚕🇮🇱\n\nכל נהג שמצטרף לנבחרת שלנו מקבל:\n🚩 גישה מלאה ללוח מכרז הנסיעות החי לנתב״ג ובינעירוני\n📲 מדבקת QR אישית לחלון המונית שמייצרת הזמנות חזור מהנוסעים ב-10% הנחה\n✨ מיתוג יוקרתי וקהל לקוחות קבוע שמשלם בזמן.\n\nנהג מונית עם רכב נקי ושירות מעולה? מקומך איתנו!\n🌐 *להצטרפות וצפייה בנסיעות פנויות עכשיו:*\nhttps://d2gkypncorjpuw.cloudfront.net/`
    },
    {
      id: 'post_wa_auto_greeting',
      category: 'whatsapp_auto',
      categoryLabel: '💬 תבניות WhatsApp Business',
      title: 'הודעת פתיחה אוטומטית ל-WhatsApp Business (כמו במוניות בס״ד והכוכבים — רק משודרגת!)',
      image: './public/assets/driver-kit-merch.jpg',
      fallbackImage: './public/assets/logo-modern.jpg',
      targetWhere: 'להגדרה בתוך WhatsApp Business -> כלים עסקיים -> הודעת פתיחה / תשובה מהירה',
      copyText: `תודה שיצרת קשר עם *פריים טקסי (PRIME TAXI)* 🚕✨\nמוניות ספיישל לנתב״ג, איסוף מנתב״ג עם מעקב טיסה, נסיעות בינעירוניות ומשלוחים 24/7.\n\n⬇️ *לחישוב מחיר מיידי (כולל מזוודות וסלקל) ולהזמנת מונית בקליק לחץ על הקישור:*\nhttps://drllqs5t3fzo5.cloudfront.net/\n\n🚖 *נהג מונית? לכניסה ללוח הנסיעות הפנויות לחץ כאן:*\nhttps://d2gkypncorjpuw.cloudfront.net/\n\nמיד נחזור אליך! 👑`
    }
  ];

  // --- Sound Synthesizer for Video Reels (Zero external audio files needed) ---
  function playUiBeep(freq = 520, duration = 0.08) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  function getSelectedVideo() {
    return VIDEOS.find(v => v.id === selectedVideoId) || VIDEOS[0];
  }

  // --- HTML5 Canvas Animated Video Reel Renderer ---
  function drawVideoFrame(canvas, videoObj, elapsedSec) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const totalDur = videoObj.durationSec || 16;
    const t = elapsedSec % totalDur;
    const progress = t / totalDur;

    // Find current scene
    const sceneIdx = videoObj.scenes.findIndex(s => t >= s.time[0] && t < s.time[1]);
    const activeScene = videoObj.scenes[sceneIdx >= 0 ? sceneIdx : 0];
    const sceneLocalT = Math.max(0, t - activeScene.time[0]);
    const sceneProgress = Math.min(1, sceneLocalT / (activeScene.time[1] - activeScene.time[0]));

    // 1. Background Gradient (Luxury Obsidian & Gold / Emerald)
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#050811');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle animated golden grid/particles
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
    ctx.lineWidth = 1;
    const offset = (t * 30) % 60;
    for (let x = -60 + offset; x < W; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = -60 + offset; y < H; y += 60) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // 2. Top Brand Header Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(0, 0, W, 86);
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(0, 84, W, 3);

    // Draw Geometric Star-Crown Emblem on Canvas
    ctx.save();
    ctx.translate(W - 55, 43);
    ctx.rotate(t * 0.35);
    ctx.fillStyle = '#f59e0b';
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-14, -14, 28, 28);
    }
    ctx.fillStyle = '#070b14';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 26px Heebo, sans-serif';
    ctx.fillText('פריים טקסי | PRIME TAXI', W - 95, 42);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '700 15px Heebo, sans-serif';
    ctx.fillText(videoObj.audience + ' • מוקד ארצי 24/7', W - 95, 66);

    // Scene Step Pill on top-left
    ctx.textAlign = 'left';
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(24, 24, 150, 38, 12);
    ctx.fill();
    ctx.fillStyle = '#052e16';
    ctx.font = '900 16px Heebo, sans-serif';
    ctx.fillText(`שלב ${(sceneIdx >= 0 ? sceneIdx : 0) + 1} מתוך 4`, 42, 49);

    // 3. Hook Banner
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef3c7';
    ctx.font = '800 22px Heebo, sans-serif';
    ctx.fillText(videoObj.hookText, W / 2, 132);

    // 4. Central Animated Card (Phone / Dispatch Simulation)
    const cardW = W - 80;
    const cardH = 270;
    const cardX = 40;
    const cardY = 158;

    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 24);
    ctx.fill();
    ctx.stroke();

    // Animated Icon Circle
    const pulse = 1 + Math.sin(t * 5) * 0.06;
    ctx.save();
    ctx.translate(W / 2, cardY + 56);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '40px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(activeScene.icon, 0, 2);
    ctx.restore();

    // Scene Header
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 28px Heebo, sans-serif';
    ctx.fillText(activeScene.header, W / 2, cardY + 125);

    // Scene Subtitle
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 18px Heebo, sans-serif';
    ctx.fillText(activeScene.sub, W / 2, cardY + 162);

    // Highlight Pill + Price Tag inside Card
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(W / 2 - 230, cardY + 190, 280, 50, 14);
    ctx.fill();
    ctx.fillStyle = '#022c22';
    ctx.font = '900 19px Heebo, sans-serif';
    ctx.fillText(activeScene.highlight, W / 2 - 90, cardY + 222);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(W / 2 + 65, cardY + 190, 175, 50, 14);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 18px Heebo, sans-serif';
    ctx.fillText(activeScene.priceTag, W / 2 + 152, cardY + 222);
    ctx.restore();

    // 5. Scene Timeline Indicators (4 Steps)
    const stepW = (W - 100) / 4;
    for (let i = 0; i < 4; i++) {
      const sx = 40 + i * (stepW + 6);
      const sy = 450;
      const isCurr = i === sceneIdx;
      const isDone = i < sceneIdx;
      ctx.fillStyle = isCurr ? '#f59e0b' : (isDone ? '#10b981' : '#1e293b');
      ctx.beginPath();
      ctx.roundRect(sx, sy, stepW, 10, 5);
      ctx.fill();
    }

    // 6. Bottom Call-To-Action Footer
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.roundRect(40, 480, W - 80, 62, 18);
    ctx.fill();
    ctx.direction = 'rtl';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#070b14';
    ctx.font = '900 21px Heebo, sans-serif';
    ctx.fillText(`🚕 ${videoObj.ctaText} | 054-6373001 • 050-7676946`, W / 2, 518);

    // Overall Progress Bar at very bottom
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, H - 8, W, 8);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, H - 8, W * progress, 8);
  }

  function startVideoPlayback() {
    const canvas = document.getElementById('primeMarketingVideoCanvas');
    if (!canvas) return;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    isPlaying = true;
    playStartTime = performance.now();
    playUiBeep(660, 0.1);

    let lastSceneIdx = -1;
    const vid = getSelectedVideo();

    function loop(now) {
      if (!isPlaying) return;
      const elapsedSec = (now - playStartTime) / 1000;
      const t = elapsedSec % (vid.durationSec || 16);
      const currIdx = vid.scenes.findIndex(s => t >= s.time[0] && t < s.time[1]);
      if (currIdx !== lastSceneIdx && currIdx !== -1) {
        lastSceneIdx = currIdx;
        playUiBeep(480 + currIdx * 90, 0.07);
      }
      drawVideoFrame(canvas, vid, elapsedSec);
      animFrameId = requestAnimationFrame(loop);
    }
    animFrameId = requestAnimationFrame(loop);
    updatePlayButtonUi();
  }

  function stopVideoPlayback() {
    isPlaying = false;
    if (animFrameId) cancelAnimationFrame(animFrameId);
    updatePlayButtonUi();
  }

  function updatePlayButtonUi() {
    const btn = document.getElementById('primeVideoPlayBtn');
    if (btn) {
      btn.innerHTML = isPlaying
        ? '<span>⏸️</span><span>השהה סרטון</span>'
        : '<span>▶️</span><span>נגן סרטון הדרכה / פרסום חי</span>';
    }
  }

  // --- Record & Download Real Video File (.webm) ---
  function recordAndDownloadVideo() {
    const canvas = document.getElementById('primeMarketingVideoCanvas');
    if (!canvas || isRecording) return;
    const vid = getSelectedVideo();

    try {
      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks = [];
      isRecording = true;
      startVideoPlayback();

      const btn = document.getElementById('primeRecordVideoBtn');
      if (btn) btn.innerHTML = '🔴 מקליט סרטון... (מתבצע ייצוא מהיר)';

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        isRecording = false;
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prime-taxi-${vid.id}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        if (btn) btn.innerHTML = '⬇️ הורד קובץ וידאו מוכן לשיתוף (WebM/MP4)';
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') recorder.stop();
      }, 6500);
    } catch (e) {
      isRecording = false;
      alert('הדפדפן שלך אינו תומך בהקלטת Canvas ישירה — ניתן לשתף את הקישור והטקסט ב-WhatsApp בלחיצה אחת!');
    }
  }

  // --- Car Flag, Magnet & QR Sticker Print Canvas Renderer ---
  function drawCarMerchCanvas() {
    const canvas = document.getElementById('primeCarMerchCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;

    const themes = {
      obsidian_gold: { bg1: '#070b14', bg2: '#1e293b', accent: '#f59e0b', text: '#ffffff', sub: '#fde68a' },
      white_gold: { bg1: '#ffffff', bg2: '#f8fafc', accent: '#d97706', text: '#0f172a', sub: '#b45309' },
      emerald_gold: { bg1: '#022c22', bg2: '#064e3b', accent: '#fbbf24', text: '#ffffff', sub: '#6ee7b7' }
    };
    const th = themes[currentFlagTheme] || themes.obsidian_gold;

    ctx.clearRect(0, 0, W, H);

    // Background
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, th.bg1);
    grad.addColorStop(1, th.bg2);
    ctx.fillStyle = grad;
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.roundRect(12, 12, W - 24, H - 24, 28);
    ctx.fill();
    ctx.stroke();

    // Inner Gold Border
    ctx.strokeStyle = th.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(26, 26, W - 52, H - 52, 20);
    ctx.stroke();

    // Geometric Star-Crown Emblem on Right
    ctx.save();
    ctx.translate(W - 115, H / 2);
    ctx.fillStyle = th.accent;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-44, -44, 88, 88);
    }
    ctx.fillStyle = th.bg1;
    ctx.beginPath();
    ctx.arc(0, 0, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = th.accent;
    ctx.font = '900 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('👑', 0, 2);
    ctx.restore();

    ctx.direction = 'rtl';
    ctx.textAlign = 'right';

    if (currentMerchType === 'flag') {
      // Flag Pole Mount visual on the left
      ctx.fillStyle = '#334155';
      ctx.fillRect(14, 14, 18, H - 28);
      ctx.fillStyle = th.accent;
      ctx.font = '900 16px Heebo, sans-serif';
      ctx.fillText('🚩 דגל חלון רכב רשמי • 45×30 ס״מ (דו-צדדי עמיד ברוח)', W - 210, 66);

      ctx.fillStyle = th.text;
      ctx.font = '900 54px Heebo, sans-serif';
      ctx.fillText('פריים טקסי | PRIME TAXI', W - 210, 135);

      ctx.fillStyle = th.sub;
      ctx.font = '800 24px Heebo, sans-serif';
      ctx.fillText('מוניות ספיישל לנתב״ג • נסיעות בינעירוניות • משלוחים 24/7', W - 210, 182);

      ctx.fillStyle = th.accent;
      ctx.beginPath();
      ctx.roundRect(80, 215, W - 290, 64, 16);
      ctx.fill();
      ctx.fillStyle = '#070b14';
      ctx.textAlign = 'center';
      ctx.font = '900 25px Heebo, sans-serif';
      ctx.fillText('להזמנה ב-WhatsApp במחיר קבוע: 054-6373001 • 050-7676946', (W - 210 + 80) / 2, 255);
    } else if (currentMerchType === 'magnet') {
      ctx.fillStyle = th.accent;
      ctx.font = '900 16px Heebo, sans-serif';
      ctx.fillText('🧲 שלט מגנט יוקרתי לדלת המונית • 60×30 ס״מ', W - 210, 66);

      ctx.fillStyle = th.text;
      ctx.font = '900 52px Heebo, sans-serif';
      ctx.fillText('פריים טקסי VIP', W - 210, 132);

      ctx.fillStyle = th.sub;
      ctx.font = '800 24px Heebo, sans-serif';
      ctx.fillText('מוניות נתב״ג ובינעירוני במחיר קבוע מראש • 6–14 מקומות', W - 210, 178);

      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(60, 212, W - 270, 66, 16);
      ctx.fill();
      ctx.fillStyle = '#022c22';
      ctx.textAlign = 'center';
      ctx.font = '900 26px Heebo, sans-serif';
      ctx.fillText('מוקד הזמנות ארצי 24/7: 054-6373001 / 050-7676946', (W - 210 + 60) / 2, 253);
    } else if (currentMerchType === 'qr_sticker') {
      ctx.fillStyle = th.accent;
      ctx.font = '900 16px Heebo, sans-serif';
      ctx.fillText('📱 מדבקת חלון פנימית / משענת ראש לנוסע (מביאה לקוחות חוזרים אוטומטית!)', W - 210, 62);

      ctx.fillStyle = th.text;
      ctx.font = '900 38px Heebo, sans-serif';
      ctx.fillText('נהנית מהנסיעה? 10% הנחה לנסיעה הבאה!', W - 210, 118);

      ctx.fillStyle = th.sub;
      ctx.font = '700 21px Heebo, sans-serif';
      ctx.fillText('סרוק להזמנת מונית חזור מנתב״ג או נסיעה בינעירונית במחיר קבוע:', W - 210, 160);

      // Simulated High-Contrast QR Box on Left
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(50, 60, 190, 190, 16);
      ctx.fill();
      ctx.fillStyle = '#070b14';
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if ((r + c) % 2 === 0 || (r < 2 && c < 2) || (r < 2 && c > 4) || (r > 4 && c < 2)) {
            ctx.fillRect(68 + c * 22, 78 + r * 22, 18, 18);
          }
        }
      }
      ctx.fillStyle = th.accent;
      ctx.font = '900 22px Heebo, sans-serif';
      ctx.fillText('💬 הזמנה ב-WhatsApp בקליק: 054-6373001 • 050-7676946', W - 210, 225);
      ctx.fillStyle = th.text;
      ctx.font = '700 17px monospace';
      ctx.fillText('https://drllqs5t3fzo5.cloudfront.net', W - 210, 265);
    } else {
      ctx.fillStyle = th.accent;
      ctx.font = '900 18px Heebo, sans-serif';
      ctx.fillText('💡 כובע גג מואר למונית (TAXI ROOF SIGN) • מיתוג פריים טקסי', W - 210, 74);

      ctx.fillStyle = th.text;
      ctx.font = '900 60px Heebo, sans-serif';
      ctx.fillText('PRIME TAXI • פריים טקסי', W - 210, 155);

      ctx.fillStyle = th.sub;
      ctx.font = '900 28px Heebo, sans-serif';
      ctx.fillText('נתב״ג ✈️ בינעירוני 🚕 VIP 👑 054-6373001', W - 210, 225);
    }
  }

  function downloadMerchPng() {
    const canvas = document.getElementById('primeCarMerchCanvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `prime-taxi-${currentMerchType}-${currentFlagTheme}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function renderVideosSubTab() {
    const vid = getSelectedVideo();
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <!-- Left/Main Video Player & Recorder -->
        <div class="lg:col-span-7 bg-slate-950 text-white rounded-3xl p-5 sm:p-6 border border-amber-500/40 shadow-2xl space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <span class="px-2.5 py-0.5 rounded-full text-xs font-black ${vid.badgeColor}">${vid.audience}</span>
              <h3 class="text-lg sm:text-xl font-black text-white mt-1">${vid.title}</h3>
              <p class="text-xs text-slate-400 mt-0.5">${vid.subtitle}</p>
            </div>
          </div>

          <!-- HTML5 Canvas Video Player -->
          <div class="relative rounded-2xl overflow-hidden border-2 border-amber-400/50 bg-slate-900 shadow-inner">
            <canvas id="primeMarketingVideoCanvas" width="960" height="560" class="w-full h-auto block cursor-pointer" onclick="window.PRIME_TAXI_MARKETING.togglePlay()"></canvas>
          </div>

          <!-- Controls & 1-Click Export/Share -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <button id="primeVideoPlayBtn" onclick="window.PRIME_TAXI_MARKETING.togglePlay()"
              class="gold-button py-3 px-4 rounded-2xl font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2">
              <span>▶️</span>
              <span>נגן סרטון הדרכה / פרסום חי</span>
            </button>

            <button id="primeRecordVideoBtn" onclick="window.PRIME_TAXI_MARKETING.recordAndDownload()"
              class="py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-amber-400/40 text-amber-300 font-black text-xs sm:text-sm cursor-pointer flex items-center justify-center gap-2">
              <span>⬇️</span>
              <span>הורד קובץ וידאו מוכן (WebM)</span>
            </button>

            <a href="https://wa.me/?text=${encodeURIComponent(vid.shareCaption)}" target="_blank"
              class="whatsapp-cta-btn py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 text-center">
              <span>📲</span>
              <span>שתף סרטון וטקסט ב-WhatsApp</span>
            </a>
          </div>

          <!-- Ready Copy Box for Video -->
          <div class="bg-slate-900/90 rounded-2xl p-4 border border-slate-800 space-y-2 overflow-hidden">
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-extrabold text-amber-400">📝 קריינות / טקסט מוכן לצירוף לסרטון ב-WhatsApp / Reels / TikTok:</span>
              <button onclick="window.primeApp.copyText(${JSON.stringify(vid.shareCaption).replace(/"/g, '&quot;')}, 'טקסט הסרטון הועתק ללוח!')"
                class="px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-xs cursor-pointer shrink-0">
                📋 העתק טקסט
              </button>
            </div>
            <pre class="text-xs text-slate-200 whitespace-pre-wrap break-words overflow-x-hidden font-sans leading-relaxed">${vid.shareCaption}</pre>
          </div>
        </div>

        <!-- Right Playlist of All 8 Videos -->
        <div class="lg:col-span-5 space-y-3">
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <h3 class="text-base font-black text-slate-900 mb-1">🎬 ספריית 8 סרטוני וידאו והדרכה (בחר סרטון לניגון והורדה):</h3>
            <p class="text-xs text-slate-500 mb-3">כל סרטון מותאם במיוחד ללקוחות, לנהגי מוניות חדשים או לקמפיינים ברשתות החברתיות:</p>
            <div class="space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              ${VIDEOS.map(v => `
                <div onclick="window.PRIME_TAXI_MARKETING.selectVideo('${v.id}')"
                  class="p-3.5 rounded-2xl border-2 transition cursor-pointer ${v.id === selectedVideoId ? 'border-amber-400 bg-amber-50/70 shadow-sm' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}">
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <span class="px-2 py-0.5 rounded-md text-[10px] font-black ${v.badgeColor}">${v.audience}</span>
                    <span class="text-[11px] font-mono font-bold text-slate-500">⏱️ ${v.durationSec} שנ׳</span>
                  </div>
                  <div class="text-xs sm:text-sm font-black text-slate-900">${v.title}</div>
                  <div class="text-[11px] text-slate-600 mt-0.5">${v.subtitle}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCarBrandingSubTab() {
    return `
      <div class="space-y-6">
        <!-- Interactive Car Flag, Magnet & QR Designer -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span class="text-xs font-extrabold text-amber-600 uppercase">מעבדת מיתוג רכב ודפוס</span>
                <h3 class="text-xl font-black text-slate-900">🚩 עיצוב דגל לחלון המונית, מגנט לדלת ומדבקת QR לנוסע</h3>
              </div>
              <button onclick="window.PRIME_TAXI_MARKETING.downloadMerch()"
                class="gold-button px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer">
                🖨️ הורד קובץ מוכן להדפסה (PNG חד)
              </button>
            </div>

            <!-- Merch Type Selector -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
              ${[
                { id: 'flag', label: '🚩 דגל מתנופף לחלון רכב' },
                { id: 'magnet', label: '🧲 מגנט לדלת המונית' },
                { id: 'qr_sticker', label: '📱 מדבקת QR לנוסע' },
                { id: 'roof_sign', label: '💡 שלט גג מואר' }
              ].map(m => `
                <button onclick="window.PRIME_TAXI_MARKETING.setMerchType('${m.id}')"
                  class="py-2.5 px-3 rounded-xl text-xs font-black transition cursor-pointer ${currentMerchType === m.id ? 'bg-slate-900 text-amber-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                  ${m.label}
                </button>
              `).join('')}
            </div>

            <!-- Color Theme Selector -->
            <div class="flex flex-wrap items-center gap-2 text-xs">
              <span class="font-extrabold text-slate-600">ערכת צבעים:</span>
              ${[
                { id: 'obsidian_gold', label: '🖤 שחור אובסידיאן וזהב מלכותי' },
                { id: 'white_gold', label: '🤍 לבן פנינה וזהב יוקרתי' },
                { id: 'emerald_gold', label: '💚 ירוק אמרלד וזהב' }
              ].map(t => `
                <button onclick="window.PRIME_TAXI_MARKETING.setFlagTheme('${t.id}')"
                  class="px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${currentFlagTheme === t.id ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                  ${t.label}
                </button>
              `).join('')}
            </div>

            <!-- High-Res Print Canvas Preview -->
            <div class="rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 p-2">
              <canvas id="primeCarMerchCanvas" width="900" height="320" class="w-full h-auto block rounded-xl"></canvas>
            </div>

            <div class="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1">
              <div class="font-black">💡 למה דגל לרכב + מדבקת QR בתוך המונית זה מכפיל כוח מטורף לתחנה?</div>
              <p>1. <strong>דגל חלון ומגנט לדלת:</strong> בנתב״ג ובתל אביב כל מונית שנוסעת עם הדגל השחור-מוזהב של <strong>פריים טקסי</strong> נראית כמו צי VIP רשמי ומושכת גם נוסעים וגם נהגים אחרים שרוצים להצטרף לתחנה.</p>
              <p>2. <strong>מדבקת ה-QR על החלון האחורי מול הנוסע:</strong> כל נוסע שעולה למונית סורק את הקוד ומזמין דרככם ישירות את הנסיעה הבאה שלו — כך שכל נהג בשטח מייצר לכם לקוחות קבועים חדשים בחינם!</p>
            </div>
          </div>

          <!-- Photorealistic Mockups of Car Flag & Driver Kit -->
          <div class="lg:col-span-5 space-y-4">
            <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 class="text-base font-black text-slate-900">📸 הדמיית דגל לרכב ומיתוג מונית פריים טקסי</h4>
              <img src="./public/assets/car-flag-mockup.jpg" onerror="this.src='./public/assets/hero-airport.jpg'" alt="Car Flag Mockup" class="w-full h-56 object-cover rounded-2xl border border-amber-400/50 shadow" />
              <p class="text-xs text-slate-600">דגל בד פוליאסטר כפול (45×30 ס״מ) על מוט פלסטיק קשיח לתפיסה על חלון אחורי של המונית + סמל מגנטי לדלת.</p>
            </div>

            <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <h4 class="text-base font-black text-slate-900">🎒 ערכת נהג מלאה (Driver VIP Kit)</h4>
              <img src="./public/assets/driver-kit-merch.jpg" onerror="this.src='./public/assets/logo-modern.jpg'" alt="Driver Kit Merch" class="w-full h-56 object-cover rounded-2xl border border-amber-400/50 shadow" />
              <p class="text-xs text-slate-600">כולל: דגל חלון לרכב, מגנט לדלת, מעמד QR למשענת הראש, כובע וחולצת פולו ממותגת ועץ ריח יוקרתי שמחלקים ללקוחות בנתב״ג.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderPostsSubTab() {
    const filtered = postCategoryFilter === 'all'
      ? SOCIAL_POSTS
      : SOCIAL_POSTS.filter(p => p.category === postCategoryFilter);

    return `
      <div class="space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
          <div class="flex flex-wrap gap-2">
            ${[
              { id: 'all', label: '🔥 כל הקמפיינים והפוסטים (6)' },
              { id: 'customers', label: '✈️ פוסטים ללקוחות ומשפחות' },
              { id: 'drivers', label: '🚖 פוסטים לגיוס נהגים' },
              { id: 'vip_delivery', label: '📦 משלוחים ועסקים VIP' },
              { id: 'whatsapp_auto', label: '💬 הודעות אוטומטיות ל-WhatsApp' }
            ].map(c => `
              <button onclick="window.PRIME_TAXI_MARKETING.setPostCategory('${c.id}')"
                class="px-3.5 py-2 rounded-xl text-xs font-black transition cursor-pointer ${postCategoryFilter === c.id ? 'bg-slate-900 text-amber-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                ${c.label}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          ${filtered.map(post => `
            <div class="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <div class="relative h-56 bg-slate-950">
                  <img src="${post.image}" onerror="this.src='${post.fallbackImage}'" alt="${post.title}" class="w-full h-full object-cover" />
                  <span class="absolute top-3 right-3 px-3 py-1 rounded-full bg-slate-950/85 text-amber-400 text-xs font-black border border-amber-400/40">${post.categoryLabel}</span>
                </div>
                <div class="p-5 space-y-3">
                  <h4 class="text-base font-black text-slate-900">${post.title}</h4>
                  <div class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    🎯 איפה לפרסם: ${post.targetWhere}
                  </div>
                  <div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap break-words overflow-x-hidden max-h-52 overflow-y-auto leading-relaxed">${post.copyText}</div>
                </div>
              </div>

              <div class="p-5 pt-0 grid grid-cols-2 gap-2.5">
                <button onclick="window.primeApp.copyText(${JSON.stringify(post.copyText).replace(/"/g, '&quot;')}, 'הפוסט הועתק! מוכן להדבקה בפייסבוק / וואטסאפ')"
                  class="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs cursor-pointer">
                  📋 העתק נוסח פוסט
                </button>
                <a href="https://wa.me/?text=${encodeURIComponent(post.copyText)}" target="_blank"
                  class="py-3 px-4 rounded-xl whatsapp-cta-btn font-black text-xs text-center flex items-center justify-center gap-1.5">
                  <span>📲</span>
                  <span>שלח/פרסם ב-WhatsApp</span>
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderGrowthIdeasSubTab() {
    const ideas = [
      {
        icon: '🌳',
        title: '1. עץ ריח ממותג לרכב עם קוד QR ("המתנה שנשארת באוטו של הלקוח")',
        cost: 'עלות: כ-₪1.80 ליחידה בהזמנת 500 יח׳',
        desc: 'לקוח שטס לחו״ל או חוזר מנתב״ג מקבל מהנהג עץ ריח יוקרתי בניחוח מלון יוקרה עם הלוגו של פריים טקסי וברקוד QR להזמנת מונית. הלקוח תולה את זה ברכב הפרטי שלו ורואה את המותג שלכם כל יום!'
      },
      {
        icon: '🏨',
        title: '2. שת״פ עם פקידי קבלה במלונות בוטיק ודירות Airbnb (עמלה לפקיד בביט!)',
        cost: 'עלות: ₪0 מראש — ₪20 תגמול בביט על כל הזמנה',
        desc: 'נותנים לפקידי קבלה במלונות ולמארחי Airbnb כרטיס מעוצב עם לינק אישי. על כל תייר או אורח שמזמין דרככם מונית לנתב״ג, הפקיד מקבל מכם ₪20 בביט אוטומטית!'
      },
      {
        icon: '✈️',
        title: '3. הודעת WhatsApp אוטומטית 24 שעות לפני הטיסה חזור ("נחיתה שקטה")',
        cost: 'עלות: ₪0 — מובנה במערכת הסדרן',
        desc: 'לכל לקוח שהזמין מונית הלוך לנתב״ג, שולחים בקליק אחד מיומן ההזמנות הודעה: "היי! מתי אתם נוחתים חזרה בארץ? שריינו עכשיו איסוף מטרמינל 3 עם 10% הנחה לקוח חוזר!" — מכפיל את כמות ההזמנות מכל לקוח פי 2!'
      },
      {
        icon: '⚖️',
        title: '4. מנוי משלוחים אקספרס למשרדי עורכי דין, רואי חשבון ומרפאות שיניים',
        cost: 'רווח: ₪30–₪60 עמלת תחנה לכל משלוח בינעירוני',
        desc: 'בשעות 09:00–16:00 (כשפחות עמוס בכבישים), נהגי מוניות מתים על משלוחי מעטפות וחבילות מעיר לעיר כי אין נוסע ברכב והתשלום מיידי בביט.'
      },
      {
        icon: '🏘️',
        title: '5. "נציג שכונה" בקבוצות ה-WhatsApp של שכונות חדשות (מודיעין, ראשל״צ, פ״ת, בני ברק)',
        cost: 'עלות: ₪0 (שיווק אורגני מפה לאוזן)',
        desc: 'כשמישהו שואל בקבוצת השכונה "מישהו מכיר מונית אמינה לנתב״ג מחר ב-04:00 בבוקר?", שולחים את הקישור הישיר למחשבון שבו הוא רואה מיד את המחיר הקבוע לעיר שלו.'
      },
      {
        icon: '🎖️',
        title: '6. מועדון "נהג זהב" — הנהג שעשה 20 נסיעות בחודש מקבל נסיעה אחת ב-0% עמלה!',
        cost: 'נאמנות נהגים של 100%',
        desc: 'גורם לכל הנהגים להעדיף לתפוס נסיעות של פריים טקסי לפני כל תחנה אחרת ולשלם לכם את העמלה בביט בשנייה הראשונה.'
      }
    ];

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        ${ideas.map(item => `
          <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-3xl">${item.icon}</span>
                <span class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black">${item.cost}</span>
              </div>
              <h4 class="text-base font-black text-slate-900">${item.title}</h4>
              <p class="text-xs text-slate-600 leading-relaxed">${item.desc}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function initAfterRender() {
    if (activeSubTab === 'videos') {
      const canvas = document.getElementById('primeMarketingVideoCanvas');
      if (canvas && !isPlaying) drawVideoFrame(canvas, getSelectedVideo(), 1.2);
    } else if (activeSubTab === 'car_branding') {
      drawCarMerchCanvas();
    }
  }

  function resolveVideoId(vidId) {
    const aliasMap = {
      cust_booking_15s: 'vid_cust_booking',
      driver_login_claim: 'vid_driver_onboarding',
      driver_bit_unlock: 'vid_driver_commission'
    };
    return aliasMap[vidId] || vidId || 'vid_cust_booking';
  }

  function renderMarketingStudioView() {
    setTimeout(() => {
      initAfterRender();
    }, 30);

    return `
      <section class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6 pb-28 lg:pb-12">
        <!-- Studio Hero -->
        <div class="bg-gradient-to-l from-slate-950 via-indigo-950 to-slate-900 text-white rounded-3xl p-4 sm:p-8 border border-amber-500/40 shadow-2xl">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-extrabold mb-2">
                <span>🎬 מערך השיווק, הווידאו והמיתוג של פריים טקסי</span>
              </div>
              <h1 class="text-xl sm:text-3xl font-black leading-snug">סטודיו פרסום, סרטוני הדרכה (לנהגים וללקוחות), פוסטים ודגל לרכב</h1>
              <p class="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
                כל הכלים כדי להפוך את התחנה למותג המוניות המוביל בישראל: סרטוני וידאו מוכנים להורדה ולשיתוף, מעבדת עיצוב דגל לרכב ומדבקות QR, ופוסטים מוכנים לפרסום ב-WhatsApp ובפייסבוק.
              </p>
            </div>
          </div>

          <!-- Sub-Tabs (2x2 Grid on Mobile, Flex Row on Desktop) -->
          <div class="grid grid-cols-2 lg:flex lg:flex-wrap gap-2 mt-4 sm:mt-6 pt-4 border-t border-slate-800">
            ${[
              { id: 'videos', shortLabel: '🎬 8 סרטוני וידאו', fullLabel: '🎬 סרטוני וידאו והדרכה (8 סרטונים ללקוח ולנהג)' },
              { id: 'car_branding', shortLabel: '🚩 דגל לרכב ומדבקת QR', fullLabel: '🚩 דגל לרכב, מגנט לדלת ומדבקת QR להדפסה' },
              { id: 'posts', shortLabel: '📱 פוסטים לפרסום', fullLabel: '📱 פוסטים מוכנים לפרסום (פייסבוק / WhatsApp)' },
              { id: 'growth_ideas', shortLabel: '💡 6 רעיונות צמיחה', fullLabel: '💡 6 רעיונות זהב להכפלת הזמנות ונהגים' }
            ].map(tab => `
              <button onclick="window.PRIME_TAXI_MARKETING.setSubTab('${tab.id}')"
                class="px-3 sm:px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition cursor-pointer text-center ${activeSubTab === tab.id ? 'bg-amber-400 text-slate-950 shadow-lg' : 'bg-slate-900/90 text-slate-200 border border-slate-700 hover:bg-slate-800'}">
                <span class="sm:hidden">${tab.shortLabel}</span>
                <span class="hidden sm:inline">${tab.fullLabel}</span>
              </button>
            `).join('')}
          </div>
        </div>

        ${activeSubTab === 'videos' ? renderVideosSubTab() : ''}
        ${activeSubTab === 'car_branding' ? renderCarBrandingSubTab() : ''}
        ${activeSubTab === 'posts' ? renderPostsSubTab() : ''}
        ${activeSubTab === 'growth_ideas' ? renderGrowthIdeasSubTab() : ''}
      </section>
    `;
  }

  return {
    renderMarketingStudioView,
    renderView: renderMarketingStudioView,
    initAfterRender,
    setSubTab(tabId) {
      stopVideoPlayback();
      activeSubTab = tabId === 'merch' ? 'car_branding' : tabId;
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
      setTimeout(() => initAfterRender(), 40);
    },
    selectVideo(vidId) {
      stopVideoPlayback();
      selectedVideoId = resolveVideoId(vidId);
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
      setTimeout(() => startVideoPlayback(), 60);
    },
    selectReel(vidId) {
      stopVideoPlayback();
      selectedVideoId = resolveVideoId(vidId);
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
      setTimeout(() => startVideoPlayback(), 60);
    },
    togglePlay() {
      if (isPlaying) {
        stopVideoPlayback();
      } else {
        startVideoPlayback();
      }
    },
    recordAndDownload() {
      recordAndDownloadVideo();
    },
    setMerchType(mType) {
      currentMerchType = mType;
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
      setTimeout(() => drawCarMerchCanvas(), 40);
    },
    setFlagTheme(themeId) {
      currentFlagTheme = themeId;
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
      setTimeout(() => drawCarMerchCanvas(), 40);
    },
    downloadMerch() {
      downloadMerchPng();
    },
    setPostCategory(cat) {
      postCategoryFilter = cat;
      if (window.primeApp && window.primeApp.rerender) window.primeApp.rerender();
    }
  };
})();
