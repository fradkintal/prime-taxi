// ============================================================================
// PRIME TAXI (פריים טקסי) — מנוע תמחור ארצי מלא (מבוסס מודל Stars Taxi & Basad)
// ============================================================================

window.PRIME_TAXI_DATA = {
  defaultSettings: {
    brandNameHe: 'פריים טקסי',
    brandNameEn: 'PRIME TAXI',
    brandSlogan: 'הסטנדרט החדש של מוניות לנתב״ג, נסיעות בינעירוניות ומשלוחים בישראל',
    logoStyle: 'modern', // 'modern' (לוגו גיאומטרי כברירת מחדל) | 'crest'
    activePartnerId: 'tal', // 'tal' | 'eliyahu'
    dispatcherPhone: '054-6373001',
    whatsappPhone: '054-6373001',
    whatsappIntl: '972546373001',
    partnerPhone: '050-7676946',
    partnerIntl: '972507676946',
    bitPhone: '054-6373001',
    payboxPhone: '054-6373001',
    defaultCommissionPct: 15,
    nightStartHour: 20, // 20:30
    nightStartMin: 30,
    nightEndHour: 5,    // 05:30
    nightEndMin: 30,
    freeSuitcasesIncluded: 3,
    extraSuitcasePrice: 15,
    roundTripDiscountPct: 10,
    globalPriceMultiplier: 1.0,
    otpGatewayMode: 'green_api_whatsapp', // 'green_api_whatsapp' | 'elgarasi_sms' | 'firebase_free'
    greenApiInstanceId: '',
    greenApiToken: '',
    customSmsWebhookUrl: '',
    cloudApiUrl: ''
  },

  // שותפים ומנהלי מערכת ראשיים (הרשאה מלאה להכל)
  owners: [
    {
      id: 'tal',
      name: 'טל פרדקין',
      role: 'super_admin',
      badge: 'בעלים ומנהל מערכת',
      phone: '054-6373001',
      cleanPhone: '0546373001',
      intlPhone: '972546373001',
      bitPhone: '054-6373001',
      payboxPhone: '054-6373001',
      username: 'טל',
      usernames: ['tal', 'טל', 'papoosh', 'פפוש', '0546373001', '054-6373001'],
      masterPin: '1234',
      quickPin: '1234'
    },
    {
      id: 'eliyahu',
      name: 'אליהו',
      role: 'super_admin',
      badge: 'שותף ומנהל ראשי (גישה להכל)',
      phone: '050-7676946',
      cleanPhone: '0507676946',
      intlPhone: '972507676946',
      bitPhone: '050-7676946',
      payboxPhone: '050-7676946',
      username: 'אליהו',
      usernames: ['eliyahu', 'אליהו', 'eli', 'אלי', '0507676946', '050-7676946'],
      masterPin: '1234',
      quickPin: '1234'
    }
  ],

  defaultDrivers: [
    {
      id: 'drv-101',
      name: 'יוסי לוי',
      phone: '052-8441920',
      vehicleTierId: 'sedan',
      vehicleName: 'מרצדס E-Class מונית סדאן',
      plateNumber: '84-291-26',
      region: 'נתב״ג וגוש דן',
      status: 'available_airport', // 'available_airport' | 'available' | 'busy' | 'offline'
      statusLabel: '✈️ ממתין עכשיו בנתב״ג (טרמינל 3)',
      completedRides: 42,
      totalCommissionsPaid: 1180,
      rating: 4.95
    },
    {
      id: 'drv-102',
      name: 'דוד אברהם',
      phone: '050-9114823',
      vehicleTierId: 'van7',
      vehicleName: 'מרצדס V-Class VIP (7 מקומות)',
      plateNumber: '39-882-04',
      region: 'ירושלים ונתב״ג',
      status: 'available',
      statusLabel: '🟢 פנוי לנסיעות (ירושלים / נתב״ג)',
      completedRides: 31,
      totalCommissionsPaid: 1640,
      rating: 4.98
    },
    {
      id: 'drv-103',
      name: 'שמעון מזרחי',
      phone: '054-3329104',
      vehicleTierId: 'van6',
      vehicleName: 'מונית גדולה 6 מקומות + תא מטען ענק',
      plateNumber: '55-710-26',
      region: 'גוש דן והשרון',
      status: 'available',
      statusLabel: '🟢 פנוי לנסיעות (תל אביב / השרון)',
      completedRides: 27,
      totalCommissionsPaid: 990,
      rating: 4.92
    },
    {
      id: 'drv-104',
      name: 'אבי ביטון',
      phone: '053-7741209',
      vehicleTierId: 'minibus10',
      vehicleName: 'מיניבוס מרצדס ספרינטר (10-14 מקומות)',
      plateNumber: '91-402-01',
      region: 'כל הארץ ונתב״ג',
      status: 'available_airport',
      statusLabel: '✈️ פנוי בנתב״ג לקבוצות ומשפחות',
      completedRides: 19,
      totalCommissionsPaid: 1420,
      rating: 5.0
    }
  ],

  brandPresets: [
    {
      id: 'prime',
      nameHe: 'פריים טקסי',
      nameEn: 'PRIME TAXI',
      slogan: 'הסטנדרט החדש של מוניות לנתב״ג, נסיעות בינעירוניות ומשלוחים בישראל',
      logoStyle: 'modern'
    },
    {
      id: 'crown',
      nameHe: 'מוניות הכתר',
      nameEn: 'CROWN TAXI VIP',
      slogan: 'מוניות ספיישל לנתב״ג, נסיעות מעיר לעיר ומשלוחים מהירים 24/7',
      logoStyle: 'crest'
    },
    {
      id: 'starway',
      nameHe: 'מוניות כוכב הדרך',
      nameEn: 'STARWAY TAXI',
      slogan: 'מחיר קבוע וידוע מראש לנתב״ג ולכל הארץ — ללא הפתעות במונה',
      logoStyle: 'modern'
    }
  ],

  // 78 ערים ויישובים מרכזיים בישראל עם מחירון קבוע לנתב"ג (תעריף יום / תעריף לילה וסופ"ש) + קואורדינטות לחישוב מעיר לעיר
  cities: [
    // גוש דן והמרכז
    { id: 'tlv', name: 'תל אביב - יפו', region: 'גוש דן והמרכז', airportDay: 150, airportNight: 175, kmAirport: 22, etaAirportMin: 24, lat: 32.0853, lng: 34.7818, popular: true },
    { id: 'ramat-gan', name: 'רמת גן', region: 'גוש דן והמרכז', airportDay: 145, airportNight: 170, kmAirport: 20, etaAirportMin: 22, lat: 32.0684, lng: 34.8248, popular: true },
    { id: 'givatayim', name: 'גבעתיים', region: 'גוש דן והמרכז', airportDay: 145, airportNight: 170, kmAirport: 20, etaAirportMin: 22, lat: 32.0722, lng: 34.8089, popular: false },
    { id: 'bnei-brak', name: 'בני ברק', region: 'גוש דן והמרכז', airportDay: 145, airportNight: 170, kmAirport: 21, etaAirportMin: 23, lat: 32.0849, lng: 34.8352, popular: true },
    { id: 'holon', name: 'חולון', region: 'גוש דן והמרכז', airportDay: 135, airportNight: 160, kmAirport: 17, etaAirportMin: 19, lat: 32.0158, lng: 34.7874, popular: true },
    { id: 'bat-yam', name: 'בת ים', region: 'גוש דן והמרכז', airportDay: 140, airportNight: 165, kmAirport: 20, etaAirportMin: 22, lat: 32.0132, lng: 34.7480, popular: true },
    { id: 'petah-tikva', name: 'פתח תקווה', region: 'גוש דן והמרכז', airportDay: 140, airportNight: 165, kmAirport: 19, etaAirportMin: 21, lat: 32.0840, lng: 34.8878, popular: true },
    { id: 'kiryat-ono', name: 'קריית אונו', region: 'גוש דן והמרכז', airportDay: 130, airportNight: 155, kmAirport: 15, etaAirportMin: 18, lat: 32.0622, lng: 34.8553, popular: false },
    { id: 'ganei-tikva', name: 'גני תקווה', region: 'גוש דן והמרכז', airportDay: 135, airportNight: 160, kmAirport: 16, etaAirportMin: 18, lat: 32.0597, lng: 34.8732, popular: false },
    { id: 'or-yehuda', name: 'אור יהודה', region: 'גוש דן והמרכז', airportDay: 110, airportNight: 130, kmAirport: 10, etaAirportMin: 13, lat: 32.0292, lng: 34.8579, popular: false },
    { id: 'yehud', name: 'יהוד-מונוסון', region: 'גוש דן והמרכז', airportDay: 105, airportNight: 125, kmAirport: 9, etaAirportMin: 12, lat: 32.0332, lng: 34.8881, popular: false },
    { id: 'savyon', name: 'סביון', region: 'גוש דן והמרכז', airportDay: 120, airportNight: 140, kmAirport: 12, etaAirportMin: 15, lat: 32.0469, lng: 34.8772, popular: false },
    { id: 'azur', name: 'אזור', region: 'גוש דן והמרכז', airportDay: 125, airportNight: 145, kmAirport: 14, etaAirportMin: 16, lat: 32.0243, lng: 34.8043, popular: false },
    { id: 'elad', name: 'אלעד', region: 'גוש דן והמרכז', airportDay: 135, airportNight: 160, kmAirport: 18, etaAirportMin: 20, lat: 32.0520, lng: 34.9512, popular: false },
    { id: 'rosh-haayin', name: 'ראש העין', region: 'גוש דן והמרכז', airportDay: 150, airportNight: 175, kmAirport: 23, etaAirportMin: 24, lat: 32.0958, lng: 34.9566, popular: false },
    { id: 'shoham', name: 'שוהם', region: 'גוש דן והמרכז', airportDay: 100, airportNight: 120, kmAirport: 9, etaAirportMin: 12, lat: 31.9986, lng: 34.9456, popular: false },

    // השפלה
    { id: 'rishon', name: 'ראשון לציון', region: 'השפלה', airportDay: 130, airportNight: 155, kmAirport: 16, etaAirportMin: 18, lat: 31.9730, lng: 34.7925, popular: true },
    { id: 'rehovot', name: 'רחובות', region: 'השפלה', airportDay: 140, airportNight: 165, kmAirport: 22, etaAirportMin: 23, lat: 31.8928, lng: 34.8113, popular: true },
    { id: 'ness-ziona', name: 'נס ציונה', region: 'השפלה', airportDay: 135, airportNight: 160, kmAirport: 19, etaAirportMin: 20, lat: 31.9293, lng: 34.7987, popular: false },
    { id: 'beer-yaakov', name: 'באר יעקב', region: 'השפלה', airportDay: 125, airportNight: 150, kmAirport: 15, etaAirportMin: 17, lat: 31.9408, lng: 34.8364, popular: false },
    { id: 'ramla', name: 'רמלה', region: 'השפלה', airportDay: 105, airportNight: 125, kmAirport: 12, etaAirportMin: 15, lat: 31.9279, lng: 34.8624, popular: false },
    { id: 'lod', name: 'לוד', region: 'השפלה', airportDay: 95, airportNight: 115, kmAirport: 8, etaAirportMin: 11, lat: 31.9514, lng: 34.8881, popular: false },
    { id: 'modiin', name: 'מודיעין-מכבים-רעות', region: 'השפלה', airportDay: 145, airportNight: 170, kmAirport: 24, etaAirportMin: 23, lat: 31.8969, lng: 35.0104, popular: true },
    { id: 'modiin-illit', name: 'מודיעין עילית', region: 'השפלה', airportDay: 165, airportNight: 190, kmAirport: 30, etaAirportMin: 29, lat: 31.9331, lng: 35.0436, popular: false },
    { id: 'yavne', name: 'יבנה', region: 'השפלה', airportDay: 165, airportNight: 190, kmAirport: 29, etaAirportMin: 27, lat: 31.8781, lng: 34.7393, popular: false },
    { id: 'gedera', name: 'גדרה', region: 'השפלה', airportDay: 175, airportNight: 205, kmAirport: 33, etaAirportMin: 30, lat: 31.8146, lng: 34.7797, popular: false },
    { id: 'mazkeret-batya', name: 'מזכרת בתיה', region: 'השפלה', airportDay: 155, airportNight: 180, kmAirport: 26, etaAirportMin: 26, lat: 31.8536, lng: 34.8415, popular: false },

    // השרון
    { id: 'herzliya', name: 'הרצליה', region: 'השרון', airportDay: 175, airportNight: 205, kmAirport: 31, etaAirportMin: 29, lat: 32.1624, lng: 34.8447, popular: true },
    { id: 'ramat-hasharon', name: 'רמת השרון', region: 'השרון', airportDay: 170, airportNight: 200, kmAirport: 29, etaAirportMin: 27, lat: 32.1461, lng: 34.8394, popular: false },
    { id: 'raanana', name: 'רעננה', region: 'השרון', airportDay: 185, airportNight: 215, kmAirport: 34, etaAirportMin: 31, lat: 32.1848, lng: 34.8713, popular: true },
    { id: 'kfar-saba', name: 'כפר סבא', region: 'השרון', airportDay: 185, airportNight: 215, kmAirport: 33, etaAirportMin: 30, lat: 32.1780, lng: 34.9065, popular: true },
    { id: 'hod-hasharon', name: 'הוד השרון', region: 'השרון', airportDay: 175, airportNight: 205, kmAirport: 30, etaAirportMin: 28, lat: 32.1524, lng: 34.8947, popular: false },
    { id: 'netanya', name: 'נתניה', region: 'השרון', airportDay: 220, airportNight: 255, kmAirport: 46, etaAirportMin: 38, lat: 32.3215, lng: 34.8532, popular: true },
    { id: 'even-yehuda', name: 'אבן יהודה / קדימה-צורן', region: 'השרון', airportDay: 210, airportNight: 245, kmAirport: 42, etaAirportMin: 36, lat: 32.2703, lng: 34.8875, popular: false },
    { id: 'kfar-yona', name: 'כפר יונה', region: 'השרון', airportDay: 235, airportNight: 270, kmAirport: 50, etaAirportMin: 42, lat: 32.3167, lng: 34.9358, popular: false },
    { id: 'hadera', name: 'חדרה', region: 'השרון', airportDay: 280, airportNight: 325, kmAirport: 61, etaAirportMin: 48, lat: 32.4340, lng: 34.9197, popular: true },
    { id: 'caesarea', name: 'קיסריה / אור עקיבא', region: 'השרון', airportDay: 305, airportNight: 350, kmAirport: 68, etaAirportMin: 52, lat: 32.5000, lng: 34.9000, popular: false },
    { id: 'pardes-hanna', name: 'פרדס חנה-כרכור', region: 'השרון', airportDay: 310, airportNight: 355, kmAirport: 69, etaAirportMin: 54, lat: 32.4714, lng: 34.9706, popular: false },
    { id: 'zikhron', name: 'זכרון יעקב / בנימינה', region: 'השרון', airportDay: 340, airportNight: 390, kmAirport: 77, etaAirportMin: 58, lat: 32.5708, lng: 34.9517, popular: false },

    // ירושלים והסביבה
    { id: 'jerusalem', name: 'ירושלים', region: 'ירושלים והסביבה', airportDay: 270, airportNight: 310, kmAirport: 54, etaAirportMin: 44, lat: 31.7683, lng: 35.2137, popular: true },
    { id: 'beit-shemesh', name: 'בית שמש', region: 'ירושלים והסביבה', airportDay: 210, airportNight: 245, kmAirport: 42, etaAirportMin: 36, lat: 31.7470, lng: 34.9881, popular: true },
    { id: 'mevaseret', name: 'מבשרת ציון', region: 'ירושלים והסביבה', airportDay: 245, airportNight: 285, kmAirport: 46, etaAirportMin: 38, lat: 31.8022, lng: 35.1581, popular: false },
    { id: 'abu-ghosh', name: 'אבו גוש / הר אדר', region: 'ירושלים והסביבה', airportDay: 235, airportNight: 270, kmAirport: 43, etaAirportMin: 36, lat: 31.8058, lng: 35.1094, popular: false },
    { id: 'maale-adumim', name: 'מעלה אדומים', region: 'ירושלים והסביבה', airportDay: 310, airportNight: 355, kmAirport: 65, etaAirportMin: 52, lat: 31.7772, lng: 35.2992, popular: false },
    { id: 'givon-zeev', name: 'גבעת זאב', region: 'ירושלים והסביבה', airportDay: 270, airportNight: 310, kmAirport: 52, etaAirportMin: 43, lat: 31.8614, lng: 35.1681, popular: false },
    { id: 'beitar-illit', name: 'ביתר עילית', region: 'ירושלים והסביבה', airportDay: 295, airportNight: 340, kmAirport: 62, etaAirportMin: 52, lat: 31.6978, lng: 35.1156, popular: false },
    { id: 'efrat', name: 'אפרת / גוש עציון', region: 'ירושלים והסביבה', airportDay: 315, airportNight: 360, kmAirport: 67, etaAirportMin: 56, lat: 31.6544, lng: 35.1508, popular: false },

    // הדרום והנגב
    { id: 'ashdod', name: 'אשדוד', region: 'הדרום והנגב', airportDay: 200, airportNight: 235, kmAirport: 42, etaAirportMin: 35, lat: 31.8044, lng: 34.6553, popular: true },
    { id: 'ashkelon', name: 'אשקלון', region: 'הדרום והנגב', airportDay: 250, airportNight: 290, kmAirport: 56, etaAirportMin: 44, lat: 31.6688, lng: 34.5743, popular: true },
    { id: 'kiryat-malachi', name: 'קריית מלאכי', region: 'הדרום והנגב', airportDay: 210, airportNight: 245, kmAirport: 44, etaAirportMin: 36, lat: 31.7294, lng: 34.7461, popular: false },
    { id: 'kiryat-gat', name: 'קריית גת', region: 'הדרום והנגב', airportDay: 265, airportNight: 305, kmAirport: 58, etaAirportMin: 45, lat: 31.6100, lng: 34.7642, popular: false },
    { id: 'sderot', name: 'שדרות', region: 'הדרום והנגב', airportDay: 300, airportNight: 345, kmAirport: 71, etaAirportMin: 54, lat: 31.5250, lng: 34.5969, popular: false },
    { id: 'netivot', name: 'נתיבות', region: 'הדרום והנגב', airportDay: 330, airportNight: 380, kmAirport: 82, etaAirportMin: 60, lat: 31.4231, lng: 34.5886, popular: false },
    { id: 'ofakim', name: 'אופקים', region: 'הדרום והנגב', airportDay: 355, airportNight: 410, kmAirport: 92, etaAirportMin: 66, lat: 31.3142, lng: 34.6203, popular: false },
    { id: 'beer-sheva', name: 'באר שבע', region: 'הדרום והנגב', airportDay: 380, airportNight: 440, kmAirport: 101, etaAirportMin: 68, lat: 31.2530, lng: 34.7915, popular: true },
    { id: 'dimona', name: 'דימונה', region: 'הדרום והנגב', airportDay: 470, airportNight: 540, kmAirport: 136, etaAirportMin: 90, lat: 31.0694, lng: 35.0331, popular: false },
    { id: 'arad', name: 'ערד', region: 'הדרום והנגב', airportDay: 480, airportNight: 550, kmAirport: 138, etaAirportMin: 92, lat: 31.2589, lng: 35.2128, popular: false },
    { id: 'dead-sea', name: 'ים המלח (עין בוקק / מלונות)', region: 'הדרום והנגב', airportDay: 520, airportNight: 600, kmAirport: 152, etaAirportMin: 105, lat: 31.1986, lng: 35.3631, popular: false },
    { id: 'mitzpe-ramon', name: 'מצפה רמון', region: 'הדרום והנגב', airportDay: 650, airportNight: 750, kmAirport: 182, etaAirportMin: 120, lat: 30.6103, lng: 34.8019, popular: false },
    { id: 'eilat', name: 'אילת', region: 'הדרום והנגב', airportDay: 1390, airportNight: 1590, kmAirport: 338, etaAirportMin: 215, lat: 29.5577, lng: 34.9519, popular: true },

    // חיפה והצפון
    { id: 'haifa', name: 'חיפה', region: 'חיפה והצפון', airportDay: 440, airportNight: 510, kmAirport: 104, etaAirportMin: 72, lat: 32.7940, lng: 34.9896, popular: true },
    { id: 'tirat-carmel', name: 'טירת כרמל / נשר', region: 'חיפה והצפון', airportDay: 430, airportNight: 495, kmAirport: 99, etaAirportMin: 68, lat: 32.7606, lng: 34.9719, popular: false },
    { id: 'krayot', name: 'הקריות (ביאליק / מוצקין / אתא / ים)', region: 'חיפה והצפון', airportDay: 470, airportNight: 540, kmAirport: 114, etaAirportMin: 78, lat: 32.8304, lng: 35.0768, popular: true },
    { id: 'akko', name: 'עכו', region: 'חיפה והצפון', airportDay: 510, airportNight: 585, kmAirport: 124, etaAirportMin: 85, lat: 32.9278, lng: 35.0817, popular: false },
    { id: 'nahariya', name: 'נהריה', region: 'חיפה והצפון', airportDay: 550, airportNight: 635, kmAirport: 134, etaAirportMin: 92, lat: 33.0059, lng: 35.0941, popular: false },
    { id: 'karmiel', name: 'כרמיאל', region: 'חיפה והצפון', airportDay: 540, airportNight: 620, kmAirport: 132, etaAirportMin: 90, lat: 32.9136, lng: 35.2961, popular: false },
    { id: 'yokneam', name: 'יקנעם עילית / טבעון', region: 'חיפה והצפון', airportDay: 390, airportNight: 450, kmAirport: 91, etaAirportMin: 64, lat: 32.6594, lng: 35.1050, popular: false },
    { id: 'afula', name: 'עפולה', region: 'חיפה והצפון', airportDay: 420, airportNight: 485, kmAirport: 102, etaAirportMin: 70, lat: 32.6078, lng: 35.2897, popular: false },
    { id: 'nazareth', name: 'נצרת / נוף הגליל', region: 'חיפה והצפון', airportDay: 450, airportNight: 520, kmAirport: 112, etaAirportMin: 76, lat: 32.7021, lng: 35.2978, popular: false },
    { id: 'beit-shean', name: 'בית שאן', region: 'חיפה והצפון', airportDay: 490, airportNight: 565, kmAirport: 126, etaAirportMin: 86, lat: 32.4972, lng: 35.4972, popular: false },
    { id: 'tiberias', name: 'טבריה / סובב כנרת', region: 'חיפה והצפון', airportDay: 550, airportNight: 630, kmAirport: 140, etaAirportMin: 95, lat: 32.7922, lng: 35.5312, popular: true },
    { id: 'safed', name: 'צפת / ראש פינה', region: 'חיפה והצפון', airportDay: 610, airportNight: 700, kmAirport: 158, etaAirportMin: 108, lat: 32.9646, lng: 35.4960, popular: false },
    { id: 'maalot', name: 'מעלות-תרשיחא', region: 'חיפה והצפון', airportDay: 600, airportNight: 690, kmAirport: 152, etaAirportMin: 105, lat: 33.0156, lng: 35.2739, popular: false },
    { id: 'kiryat-shmona', name: 'קריית שמונה / אצבע הגליל', region: 'חיפה והצפון', airportDay: 740, airportNight: 850, kmAirport: 188, etaAirportMin: 125, lat: 33.2073, lng: 35.5697, popular: false },
    { id: 'katzrin', name: 'קצרין / רמת הגולן', region: 'חיפה והצפון', airportDay: 690, airportNight: 795, kmAirport: 174, etaAirportMin: 118, lat: 32.9925, lng: 35.6914, popular: false },

    // יהודה ושומרון
    { id: 'ariel', name: 'אריאל', region: 'יהודה ושומרון', airportDay: 210, airportNight: 245, kmAirport: 44, etaAirportMin: 38, lat: 32.1047, lng: 35.1844, popular: false },
    { id: 'karnei-shomron', name: 'קרני שומרון / עמנואל', region: 'יהודה ושומרון', airportDay: 220, airportNight: 255, kmAirport: 46, etaAirportMin: 40, lat: 32.1714, lng: 35.0972, popular: false },
    { id: 'oranim', name: 'אורנית / שערי תקווה', region: 'יהודה ושומרון', airportDay: 170, airportNight: 195, kmAirport: 29, etaAirportMin: 28, lat: 32.1286, lng: 34.9917, popular: false }
  ],

  // מחירון בינעירוני ישיר (מעיר לעיר) — צמדים מובילים קבועים (והשאר מחושבים אוטומטית לפי מרחק כביש מדויק)
  intercityFixedPairs: {
    'tlv__jerusalem': { day: 310, night: 355, km: 64, min: 52 },
    'tlv__haifa': { day: 420, night: 485, km: 95, min: 65 },
    'tlv__beer-sheva': { day: 420, night: 485, km: 108, min: 72 },
    'tlv__eilat': { day: 1450, night: 1650, km: 346, min: 220 },
    'tlv__netanya': { day: 165, night: 190, km: 32, min: 28 },
    'tlv__ashdod': { day: 195, night: 225, km: 41, min: 34 },
    'tlv__ashkelon': { day: 250, night: 290, km: 56, min: 44 },
    'tlv__rishon': { day: 115, night: 135, km: 16, min: 19 },
    'tlv__rehovot': { day: 145, night: 170, km: 24, min: 25 },
    'tlv__modiin': { day: 185, night: 215, km: 36, min: 32 },
    'tlv__herzliya': { day: 105, night: 125, km: 14, min: 17 },
    'tlv__raanana': { day: 135, night: 155, km: 21, min: 23 },
    'tlv__kfar-saba': { day: 140, night: 165, km: 23, min: 25 },
    'tlv__hadera': { day: 235, night: 270, km: 49, min: 40 },
    'tlv__tiberias': { day: 560, night: 645, km: 136, min: 95 },
    'jerusalem__haifa': { day: 630, night: 725, km: 152, min: 105 },
    'jerusalem__beer-sheva': { day: 450, night: 520, km: 104, min: 75 },
    'jerusalem__eilat': { day: 1420, night: 1630, km: 315, min: 205 },
    'jerusalem__beit-shemesh': { day: 180, night: 210, km: 34, min: 32 },
    'jerusalem__modiin': { day: 190, night: 220, km: 36, min: 33 },
    'jerusalem__ashdod': { day: 290, night: 335, km: 64, min: 52 },
    'jerusalem__bnei-brak': { day: 295, night: 340, km: 61, min: 50 },
    'jerusalem__netanya': { day: 380, night: 435, km: 86, min: 65 },
    'jerusalem__dead-sea': { day: 390, night: 450, km: 92, min: 68 },
    'jerusalem__tiberias': { day: 670, night: 770, km: 168, min: 115 },
    'haifa__tiberias': { day: 330, night: 380, km: 68, min: 52 },
    'haifa__nahariya': { day: 210, night: 245, km: 36, min: 34 },
    'haifa__netanya': { day: 295, night: 340, km: 66, min: 48 },
    'beer-sheva__eilat': { day: 980, night: 1125, km: 242, min: 155 },
    'beer-sheva__ashdod': { day: 340, night: 390, km: 78, min: 56 }
  },

  // קטגוריות כלי רכב (כולל לוגיקת שדרוג אוטומטי לפי יחידות נפח של נוסעים + מזוודות)
  vehicleTiers: [
    {
      id: 'sedan',
      name: 'מונית סדאן רגילה',
      subtitle: 'עד 4 נוסעים • עד 3 מזוודות',
      maxPassengers: 4,
      maxSuitcases: 3,
      maxSpaceUnits: 7, // 4 נוסעים + 3 מזוודות
      multiplier: 1.0,
      fixedAdd: 0,
      badge: 'הנמכר ביותר',
      icon: '🚕',
      desc: 'מונית חדישה וממוזגת (סקודה אוקטביה / טויוטה קאמרי היברידית או שווה ערך)'
    },
    {
      id: 'station',
      name: 'מונית סטיישן / תא מטען גדול',
      subtitle: 'עד 4 נוסעים • עד 4 מזוודות + עגלה',
      maxPassengers: 4,
      maxSuitcases: 4,
      maxSpaceUnits: 9,
      multiplier: 1.0,
      fixedAdd: 45,
      badge: 'מומלץ למשפחות לנתב״ג',
      icon: '🚙',
      desc: 'תא מטען עמוק ומרווח במיוחד המתאים ל-4 מזוודות גדולות, עגלת תינוק וציוד יד'
    },
    {
      id: 'vip',
      name: 'מונית מנהלים VIP (מרצדס)',
      subtitle: 'עד 4 נוסעים • אירוח מחלקה ראשונה',
      maxPassengers: 4,
      maxSuitcases: 3,
      maxSpaceUnits: 7,
      multiplier: 1.30,
      fixedAdd: 0,
      badge: 'מחלקת עסקים',
      icon: '✨',
      desc: 'מרצדס E/S Class או רכב יוקרה מקביל, נהג ייצוגי, מושבי עור ומטענים מהירים'
    },
    {
      id: 'minivan6',
      name: 'מונית גדולה / מיניוואן (6 מקומות)',
      subtitle: 'עד 6 נוסעים • עד 6 מזוודות גדולות',
      maxPassengers: 6,
      maxSuitcases: 6,
      maxSpaceUnits: 13,
      multiplier: 1.45,
      fixedAdd: 0,
      badge: '5–6 נוסעים',
      icon: '🚐',
      desc: 'מרצדס ויטו / V-Class או מיניוואן מרווח ל-6 נוסעים עם תא מטען גדול'
    },
    {
      id: 'minibus10',
      name: 'מיניבוס מרווח (עד 10 נוסעים)',
      subtitle: 'עד 10 נוסעים • עד 10 מזוודות',
      maxPassengers: 10,
      maxSuitcases: 10,
      maxSpaceUnits: 21,
      multiplier: 1.95,
      fixedAdd: 0,
      badge: 'קבוצות ומשפחות',
      icon: '🚌',
      desc: 'מיניבוס מרצדס ספרינטר חדיש לקבוצות, משפחות מרובות ילדים והסעות לנתב״ג'
    },
    {
      id: 'minibus14',
      name: 'מיניבוס קבוצות (עד 14 נוסעים)',
      subtitle: 'עד 14 נוסעים • עד 14 מזוודות',
      maxPassengers: 14,
      maxSuitcases: 14,
      maxSpaceUnits: 29,
      multiplier: 2.35,
      fixedAdd: 0,
      badge: '11–14 נוסעים',
      icon: '🚌',
      desc: 'מיניבוס תיירים מאובזר עם תא מטען ענק לקבוצות, אירועים וטיסות'
    },
    {
      id: 'minibus19',
      name: 'מיניבוס תיירים ענק (עד 19 נוסעים)',
      subtitle: 'עד 19 נוסעים • עד 19 מזוודות',
      maxPassengers: 19,
      maxSuitcases: 19,
      maxSpaceUnits: 40,
      multiplier: 2.75,
      fixedAdd: 0,
      badge: '15–19 נוסעים',
      icon: '🚍',
      desc: 'מיניבוס VIP רחב לקבוצות גדולות, משלחות ואירועים בכל רחבי הארץ'
    }
  ],

  // תוספות מיוחדות (בדיוק לפי מודל מוניות הכוכבים ובס"ד)
  extras: [
    { id: 'childSeat', name: 'סלקל / כיסא תינוק / בוסטר', price: 30, type: 'counter', max: 3, icon: '👶', desc: 'כיסא בטיחות תקני מותקן ברכב מראש' },
    { id: 'extraStop', name: 'עצירה נוספת בדרך (איסוף/הורדה)', price: 35, type: 'counter', max: 3, icon: '📍', desc: 'איסוף או הורדת נוסע נוסף על ציר הנסיעה' },
    { id: 'route6', name: 'נסיעה דרך כביש 6 (מהיר)', price: 25, type: 'toggle', icon: '🛣️', desc: 'קיצור זמן הנסיעה דרך כביש חוצה ישראל (אגרה כלולה)' },
    { id: 'specialGear', name: 'ציוד חריג (גלשן / סקי / אופניים)', price: 40, type: 'toggle', icon: '🎿', desc: 'תיאום מראש לציוד ארוך או כבד במיוחד' },
    { id: 'pet', name: 'בעל חיים בכלוב נשיאה', price: 35, type: 'toggle', icon: '🐾', desc: 'נהג ידידותי לבעלי חיים (נדרש מנשא תקני)' },
    { id: 'meetGreet', name: 'המתנה עם שלט שמי בטרמינל (VIP)', price: 60, type: 'toggle', airportOnly: true, icon: '🪧', desc: 'הנהג ממתין באולם מקבלי הפנים בנתב״ג עם שלט על שמכם ועוזר עם המזוודות' }
  ],

  // סוגי משלוחים (עבור לשונית משלוחים אקספרס)
  deliveryPackages: [
    { id: 'envelope', name: 'מעטפה / מסמכים / מפתחות', multiplier: 0.90, minPrice: 85, icon: '✉️', desc: 'משלוח ישיר ומהיר למסמכים משפטיים, חוזים, דרכונים או מפתחות' },
    { id: 'box_std', name: 'חבילה רגילה / קרטון (עד 15 ק"ג)', multiplier: 1.0, minPrice: 100, icon: '📦', desc: 'משלוח ספיישל מנקודה לנקודה בתא המטען של המונית' },
    { id: 'box_heavy', name: 'משלוח גדול / ציוד רגיש (עד 35 ק"ג)', multiplier: 1.18, minPrice: 135, icon: '🏗️', desc: 'ציוד אלקטרוניקה, מארזים גדולים או מספר קרטונים' }
  ]
};
