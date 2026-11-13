// ============================================================================
// PRIME TAXI (פריים טקסי) — אפליקציית הזמנות חכמה + מנוע תמחור + שיבוץ ועמלות ב-WhatsApp
// ============================================================================

(function () {
  const DATA = window.PRIME_TAXI_DATA;
  const STORAGE_KEYS = {
    SETTINGS: 'prime_taxi_settings_v2',
    ORDERS: 'prime_taxi_orders_v1',
    DRIVERS: 'prime_taxi_drivers_v1',
    ACTIVE_DRIVER: 'prime_taxi_active_driver_v1',
    CITY_OVERRIDES: 'prime_taxi_city_overrides_v1',
    AUTH_USER: 'prime_taxi_auth_user_v1'
  };

  // --- State ---
  let settings = loadSettings();
  let cityOverrides = loadCityOverrides();
  let orders = loadOrders();
  let drivers = loadDrivers();
  let activeDriver = loadActiveDriver();
  let currentUser = loadAuthUser();

  let state = {
    activeView: detectInitialView(), // 'booking' | 'driver' | 'marketing' | 'pricelist' | 'admin'
    adminTab: 'orders',    // 'orders' | 'drivers' | 'analytics' | 'marketing' | 'pricing' | 'branding' | 'auth_servers'
    adminOrderStatusFilter: 'all', // 'all' | 'new' | 'broadcasted' | 'assigned' | 'paid'
    adminOrderSearch: '',
    driverFilter: 'all',   // 'all' | 'airport' | 'intercity' | 'delivery' | 'my_rides'
    cloudStatus: 'connected', // 'connected' | 'syncing' | 'local'
    lastCloudSyncAt: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    authMode: 'phone_otp',
    authStep: 'input',
    authPhoneInput: '',
    authNameInput: '',
    authUsernameInput: '',
    authPinInput: '',
    authOtpSentCode: '',
    pendingAdminRedirect: false,
    serviceType: 'to_airport', // 'to_airport' | 'from_airport' | 'intercity' | 'delivery'
    originCityId: 'tlv',
    destCityId: 'jerusalem',
    streetOrigin: '',
    streetDest: '',
    terminal: '3',
    flightNumber: '',
    pickupTiming: 'now', // 'now' | 'scheduled'
    pickupDate: getTodayIso(),
    pickupTime: getDefaultTimeStr(),
    tariffOverride: 'auto', // 'auto' | 'day' | 'night'
    roundTrip: false,
    returnDate: getTomorrowIso(),
    returnTime: '14:00',
    passengers: 2,
    suitcases: 2,
    handLuggage: 1,
    strollers: 0,
    vehicleTierId: 'sedan',
    manualVehicleSelected: false,
    autoUpgradeReason: '',
    extrasState: {
      childSeat: 0,
      extraStop: 0,
      route6: false,
      specialGear: false,
      pet: false,
      meetGreet: false
    },
    deliveryPackageId: 'box_std',
    deliveryUrgent: true,
    deliveryPhotoProof: true,
    recipientName: '',
    recipientPhone: '',
    customerName: '',
    customerPhone: '',
    customerNotes: '',
    paymentMethod: 'bit', // 'bit' | 'paybox' | 'cash' | 'credit'
    priceSearchQuery: '',
    priceRegionFilter: 'all',
    lastCreatedOrder: null
  };

  function getTodayIso() {
    const d = new Date();
    return d.toISOString().split('T')[0];
  }

  function getTomorrowIso() {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().split('T')[0];
  }

  function getDefaultTimeStr() {
    const d = new Date(Date.now() + 30 * 60000);
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function detectInitialView() {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('view');
      if (v === 'driver' || v === 'admin' || v === 'marketing' || v === 'pricelist' || v === 'booking') return v;
      const host = (window.location.hostname || '').toLowerCase();
      if (host.includes('d2gkypncorjpuw')) return 'driver';
      if (host.includes('d1qjhe0ijgnja3')) return 'admin';
    } catch (e) {}
    return 'booking';
  }

  function getCloudApiUrl() {
    return (settings && settings.cloudApiUrl) || (DATA.defaultSettings && DATA.defaultSettings.cloudApiUrl) || '';
  }

  async function syncWithAwsCloud(silent = true) {
    const apiUrl = getCloudApiUrl();
    if (!apiUrl) return;
    try {
      if (!silent) state.cloudStatus = 'syncing';
      const res = await fetch(apiUrl, { method: 'GET' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.ok && data.state) {
        let changed = false;
        if (Array.isArray(data.state.orders) && data.state.orders.length > 0) {
          const newOrdersJson = JSON.stringify(data.state.orders);
          if (newOrdersJson !== JSON.stringify(orders)) {
            orders = data.state.orders;
            localStorage.setItem(STORAGE_KEYS.ORDERS, newOrdersJson);
            changed = true;
          }
        }
        if (Array.isArray(data.state.drivers) && data.state.drivers.length > 0) {
          const newDriversJson = JSON.stringify(data.state.drivers);
          if (newDriversJson !== JSON.stringify(drivers)) {
            drivers = data.state.drivers;
            localStorage.setItem(STORAGE_KEYS.DRIVERS, newDriversJson);
            changed = true;
          }
        }
        if (data.state.settings && typeof data.state.settings === 'object') {
          settings = { ...settings, ...data.state.settings };
          localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        }
        if (data.state.cityOverrides && typeof data.state.cityOverrides === 'object') {
          cityOverrides = { ...cityOverrides, ...data.state.cityOverrides };
          localStorage.setItem(STORAGE_KEYS.CITY_OVERRIDES, JSON.stringify(cityOverrides));
        }
        state.cloudStatus = 'connected';
        state.lastCloudSyncAt = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        if (changed || !silent) renderAll();
      }
    } catch (e) {
      state.cloudStatus = 'local';
    }
  }

  async function pushToAwsCloud(payload = {}) {
    const apiUrl = getCloudApiUrl();
    if (!apiUrl) return;
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orders,
          drivers,
          settings,
          cityOverrides,
          ...payload
        })
      });
      if (res.ok) {
        state.cloudStatus = 'connected';
        state.lastCloudSyncAt = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
    } catch (e) {}
  }

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (DATA.defaultSettings.cloudApiUrl && !parsed.cloudApiUrl) {
          parsed.cloudApiUrl = DATA.defaultSettings.cloudApiUrl;
        }
        return { ...DATA.defaultSettings, ...parsed };
      }
    } catch (e) {}
    return { ...DATA.defaultSettings };
  }

  function loadAuthUser() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return null;
  }

  function saveAuthUser(user) {
    currentUser = user;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
        if (user.name && !state.customerName) state.customerName = user.name;
        if (user.phone && !state.customerPhone) state.customerPhone = user.phone;
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }
    } catch (e) {}
    renderAll();
  }

  function isSuperAdminUser(user) {
    if (!user) return false;
    return user.role === 'super_admin';
  }

  function findOwnerByInput(inputStr) {
    const clean = String(inputStr || '').trim().toLowerCase();
    const digits = clean.replace(/\D/g, '');
    const normDigits = digits.startsWith('972') ? '0' + digits.slice(3) : digits;
    const allOwners = DATA.owners || settings.owners || [];
    return allOwners.find(o =>
      o.id === clean ||
      o.cleanPhone === normDigits ||
      (o.usernames && o.usernames.some(u => u.toLowerCase() === clean))
    );
  }

  function saveSettings(newSettings) {
    settings = { ...settings, ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {}
    pushToAwsCloud({ settings });
    renderAll();
  }

  function loadCityOverrides() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CITY_OVERRIDES);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return {};
  }

  function saveCityOverride(cityId, dayPrice, nightPrice) {
    cityOverrides[cityId] = { airportDay: Number(dayPrice), airportNight: Number(nightPrice) };
    try {
      localStorage.setItem(STORAGE_KEYS.CITY_OVERRIDES, JSON.stringify(cityOverrides));
    } catch (e) {}
    pushToAwsCloud({ cityOverrides });
    renderAll();
  }

  function loadDrivers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.DRIVERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const seed = DATA.defaultDrivers ? [...DATA.defaultDrivers] : [];
    try {
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(seed));
    } catch (e) {}
    return seed;
  }

  function saveDrivers(singleDriver = null) {
    try {
      localStorage.setItem(STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    } catch (e) {}
    if (singleDriver) {
      pushToAwsCloud({ action: 'upsert_driver', driver: singleDriver });
    } else {
      pushToAwsCloud({ drivers });
    }
  }

  function loadActiveDriver() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_DRIVER);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return (DATA.defaultDrivers && DATA.defaultDrivers[0]) || null;
  }

  function saveActiveDriver(drv) {
    activeDriver = drv;
    try {
      if (drv) {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_DRIVER, JSON.stringify(drv));
      } else {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_DRIVER);
      }
    } catch (e) {}
  }

  function getSeedOrders() {
    return [
      {
        id: 'PT-8492',
        createdAt: 'היום, 12:10',
        serviceType: 'to_airport',
        serviceLabel: 'מונית לנתב״ג (טרמינל 3)',
        originLabel: 'תל אביב - יפו (שדרות רוטשילד 45)',
        destLabel: 'נמל התעופה בן גוריון — טרמינל 3',
        pickupTimeLabel: 'היום, 15:30',
        passengers: 3,
        suitcases: 3,
        vehicleName: 'מונית סדאן רגילה',
        extrasSummary: 'כביש 6',
        customerName: 'עומר לוי',
        customerPhone: '052-8491023',
        paymentMethod: 'ביט (Bit)',
        totalPrice: 175,
        commissionPct: 15,
        commissionAmount: 26,
        driverNet: 149,
        status: 'new', // 'new' | 'broadcasted' | 'assigned' | 'paid'
        assignedDriverName: '',
        assignedDriverPhone: ''
      },
      {
        id: 'PT-8491',
        createdAt: 'היום, 11:45',
        serviceType: 'from_airport',
        serviceLabel: 'איסוף מנתב״ג (טיסה LY316)',
        originLabel: 'נתב״ג — טרמינל 3 (נחיתה מלונדון)',
        destLabel: 'ירושלים (רחוב יפו 97)',
        pickupTimeLabel: 'היום, 18:00',
        passengers: 5,
        suitcases: 5,
        vehicleName: 'מונית גדולה / מיניוואן (6 מקומות)',
        extrasSummary: 'סלקל/בוסטר ×1',
        customerName: 'משפחת כהן',
        customerPhone: '054-3918820',
        paymentMethod: 'אשראי / ביט',
        totalPrice: 420,
        commissionPct: 15,
        commissionAmount: 63,
        driverNet: 357,
        status: 'assigned',
        assignedDriverName: 'אבי מוניות המרכז',
        assignedDriverPhone: '050-7712345'
      },
      {
        id: 'PT-8488',
        createdAt: 'היום, 10:20',
        serviceType: 'intercity',
        serviceLabel: 'נסיעה בינעירונית ספיישל',
        originLabel: 'ראשון לציון (רוטשילד 60)',
        destLabel: 'חיפה (שדרות הנשיא 110)',
        pickupTimeLabel: 'מחר, 08:30',
        passengers: 2,
        suitcases: 1,
        vehicleName: 'מונית מנהלים VIP (מרצדס)',
        extrasSummary: 'נסיעה דרך כביש 6',
        customerName: 'ד״ר רונית שגב',
        customerPhone: '050-9124455',
        paymentMethod: 'פייבוקס (PayBox)',
        totalPrice: 590,
        commissionPct: 15,
        commissionAmount: 89,
        driverNet: 501,
        status: 'paid',
        assignedDriverName: 'יוסי VIP',
        assignedDriverPhone: '052-4433221'
      }
    ];
  }

  function loadOrders() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    const seed = getSeedOrders();
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(seed));
    } catch (e) {}
    return seed;
  }

  function saveOrders(singleOrder = null) {
    try {
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    } catch (e) {}
    if (singleOrder) {
      pushToAwsCloud({ action: 'upsert_order', order: singleOrder });
    } else {
      pushToAwsCloud({ orders });
    }
  }

  // --- City & Route Helpers ---
  function getCityById(id) {
    const base = DATA.cities.find(c => c.id === id) || DATA.cities[0];
    const override = cityOverrides[base.id];
    if (override) {
      return { ...base, ...override };
    }
    return base;
  }

  function getAllCities() {
    return DATA.cities.map(c => {
      const override = cityOverrides[c.id];
      return override ? { ...c, ...override } : c;
    });
  }

  // Haversine distance in km -> road distance estimate
  function computeIntercityMetrics(cityA, cityB) {
    if (cityA.id === cityB.id) {
      return { day: 65, night: 80, km: 6, min: 12 };
    }
    const key1 = `${cityA.id}__${cityB.id}`;
    const key2 = `${cityB.id}__${cityA.id}`;
    if (DATA.intercityFixedPairs[key1]) return DATA.intercityFixedPairs[key1];
    if (DATA.intercityFixedPairs[key2]) return DATA.intercityFixedPairs[key2];

    const R = 6371;
    const dLat = ((cityB.lat - cityA.lat) * Math.PI) / 180;
    const dLng = ((cityB.lng - cityA.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((cityA.lat * Math.PI) / 180) *
        Math.cos((cityB.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const airKm = R * c;
    const roadKm = Math.max(8, Math.round(airKm * 1.29));
    const estMin = Math.max(14, Math.round(roadKm * 0.72 + 8));

    // Stars Taxi & Basad Intercity Formula: Base flag + per-km rate rounded to 5 NIS
    const rawDay = 42 + roadKm * 4.15;
    const day = Math.round(rawDay / 5) * 5;
    const night = Math.round((day * 1.16) / 5) * 5;
    return { day, night, km: roadKm, min: estMin };
  }

  function isNightOrWeekendTariff() {
    if (state.tariffOverride === 'day') return false;
    if (state.tariffOverride === 'night') return true;

    let checkDate = new Date();
    if (state.pickupTiming === 'scheduled' && state.pickupDate && state.pickupTime) {
      const [yyyy, mm, dd] = state.pickupDate.split('-').map(Number);
      const [hh, min] = state.pickupTime.split(':').map(Number);
      checkDate = new Date(yyyy, mm - 1, dd, hh || 0, min || 0);
    }

    const dayOfWeek = checkDate.getDay(); // 5 = Friday, 6 = Saturday
    const hour = checkDate.getHours();
    const minute = checkDate.getMinutes();
    const totalMinutes = hour * 60 + minute;

    // Night hours: 20:30 (1230) to 05:30 (330)
    if (totalMinutes >= 20 * 60 + 30 || totalMinutes <= 5 * 60 + 30) {
      return true;
    }
    // Friday from 15:00 & all Saturday
    if (dayOfWeek === 5 && totalMinutes >= 15 * 60) return true;
    if (dayOfWeek === 6) return true;

    return false;
  }

  // --- Auto-Upgrade Vehicle by Passengers & Luggage (Stars Taxi Space Units Logic) ---
  function enforceVehicleCapacity() {
    if (state.serviceType === 'delivery') {
      state.vehicleTierId = 'sedan';
      state.autoUpgradeReason = '';
      return;
    }

    const pax = state.passengers;
    const largeBags = state.suitcases;
    const strollers = state.strollers;
    const handBags = state.handLuggage;
    // Space unit calculation: 1 passenger = 1 unit, 1 large bag = 1 unit, 1 stroller = 1 unit, every 2 hand bags = 1 unit
    const effectiveBags = largeBags + strollers + Math.floor(handBags / 2);
    const totalSpaceUnits = pax + effectiveBags;

    let minRequiredTierIdx = 0; // 0: sedan, 1: station, 2: vip, 3: minivan6, 4: minibus10, 5: minibus14, 6: minibus19
    let reason = '';

    if (pax > 14 || effectiveBags > 14) {
      minRequiredTierIdx = 6;
      reason = `שודרג אוטומטית למיניבוס 19 מקומות עקב ${pax} נוסעים ו-${largeBags} מזוודות`;
    } else if (pax > 10 || effectiveBags > 10) {
      minRequiredTierIdx = 5;
      reason = `שודרג אוטומטית למיניבוס 14 מקומות עקב ${pax} נוסעים ו-${largeBags} מזוודות`;
    } else if (pax > 6 || effectiveBags > 6) {
      minRequiredTierIdx = 4;
      reason = `שודרג אוטומטית למיניבוס 10 מקומות עקב ${pax} נוסעים ו-${largeBags} מזוודות`;
    } else if (pax >= 5 || effectiveBags >= 5 || totalSpaceUnits > 9) {
      minRequiredTierIdx = 3;
      reason = pax >= 5
        ? `שודרג אוטומטית למיניוואן (6 מקומות) עבור ${pax} נוסעים`
        : `שודרג אוטומטית למיניוואן (6 מקומות) עקב כמות הכבודה (${largeBags} מזוודות)`;
    } else if (effectiveBags === 4 || (pax === 4 && effectiveBags >= 3 && strollers >= 1)) {
      minRequiredTierIdx = 1; // station
      reason = `שודרג אוטומטית למונית סטיישן (תא מטען מוגדל) עבור ${largeBags} מזוודות${strollers ? ' ועגלה' : ''}`;
    }

    const currentIdx = DATA.vehicleTiers.findIndex(v => v.id === state.vehicleTierId);
    // Allow VIP (index 2) if minRequiredTierIdx === 0
    if (currentIdx < minRequiredTierIdx || (state.vehicleTierId === 'vip' && minRequiredTierIdx > 0)) {
      state.vehicleTierId = DATA.vehicleTiers[minRequiredTierIdx].id;
      state.autoUpgradeReason = reason;
    } else if (!state.manualVehicleSelected && minRequiredTierIdx !== currentIdx) {
      state.vehicleTierId = DATA.vehicleTiers[minRequiredTierIdx].id;
      state.autoUpgradeReason = reason;
    } else {
      state.autoUpgradeReason = minRequiredTierIdx > 0 ? reason : '';
    }
  }

  // --- Full Price Calculation Engine ---
  function calculatePricing() {
    enforceVehicleCapacity();

    const originCity = getCityById(state.originCityId);
    const destCity = getCityById(state.destCityId);
    const isNight = isNightOrWeekendTariff();

    let baseRouteFare = 0;
    let roadKm = 0;
    let estMin = 0;
    let routeTitle = '';
    let routeSubtitle = '';

    if (state.serviceType === 'to_airport') {
      baseRouteFare = isNight ? originCity.airportNight : originCity.airportDay;
      roadKm = originCity.kmAirport;
      estMin = originCity.etaAirportMin;
      routeTitle = `${originCity.name}  נתב״ג (טרמינל ${state.terminal})`;
      routeSubtitle = `איסוף ספיישל מהבית ישירות לטרמינל ${state.terminal}`;
    } else if (state.serviceType === 'from_airport') {
      baseRouteFare = isNight ? destCity.airportNight : destCity.airportDay;
      roadKm = destCity.kmAirport;
      estMin = destCity.etaAirportMin;
      routeTitle = `נתב״ג (טרמינל ${state.terminal})  ${destCity.name}`;
      routeSubtitle = state.flightNumber
        ? `מעקב נחיתה אוטומטי אחר טיסה ${state.flightNumber.toUpperCase()}`
        : `איסוף מטרמינל ${state.terminal} בתיאום נחיתה`;
    } else if (state.serviceType === 'intercity') {
      const metrics = computeIntercityMetrics(originCity, destCity);
      baseRouteFare = isNight ? metrics.night : metrics.day;
      roadKm = metrics.km;
      estMin = metrics.min;
      routeTitle = `${originCity.name}  ${destCity.name}`;
      routeSubtitle = `נסיעה בינעירונית ישירה מנקודה לנקודה`;
    } else if (state.serviceType === 'delivery') {
      const metrics = computeIntercityMetrics(originCity, destCity);
      const rawFare = isNight ? metrics.night : metrics.day;
      const pkg = DATA.deliveryPackages.find(p => p.id === state.deliveryPackageId) || DATA.deliveryPackages[1];
      baseRouteFare = Math.max(pkg.minPrice, Math.round((rawFare * pkg.multiplier) / 5) * 5);
      roadKm = metrics.km;
      estMin = metrics.min;
      routeTitle = `משלוח: ${originCity.name}  ${destCity.name}`;
      routeSubtitle = `${pkg.name} • מסירה ישירה`;
    }

    baseRouteFare = Math.round((baseRouteFare * (settings.globalPriceMultiplier || 1)) / 5) * 5;

    // Vehicle tier surcharge
    const vehicle = DATA.vehicleTiers.find(v => v.id === state.vehicleTierId) || DATA.vehicleTiers[0];
    let vehicleSurcharge = 0;
    if (state.serviceType !== 'delivery') {
      if (vehicle.fixedAdd > 0) {
        vehicleSurcharge = vehicle.fixedAdd;
      } else if (vehicle.multiplier > 1.0) {
        vehicleSurcharge = Math.round((baseRouteFare * (vehicle.multiplier - 1.0)) / 5) * 5;
      }
    }

    // Extra suitcases fee (beyond freeSuitcasesIncluded if using standard/station, or included in larger vehicles)
    let extraLuggageFee = 0;
    const freeBags = Math.max(settings.freeSuitcasesIncluded || 3, vehicle.maxSuitcases);
    if (state.serviceType !== 'delivery' && state.suitcases > (settings.freeSuitcasesIncluded || 3) && vehicle.id === 'sedan') {
      extraLuggageFee = (state.suitcases - (settings.freeSuitcasesIncluded || 3)) * (settings.extraSuitcasePrice || 15);
    }

    // Extras breakdown
    const extrasItems = [];
    let extrasTotal = 0;

    if (state.serviceType === 'delivery') {
      if (state.deliveryPhotoProof) {
        extrasItems.push({ label: 'מסירה אישית לדלת + צילום אישור ב-WhatsApp', amount: 25 });
        extrasTotal += 25;
      }
    } else {
      DATA.extras.forEach(ext => {
        if (ext.airportOnly && state.serviceType !== 'from_airport') return;
        const val = state.extrasState[ext.id];
        if (ext.type === 'counter' && val > 0) {
          const amt = val * ext.price;
          extrasItems.push({ label: `${ext.name} (×${val})`, amount: amt });
          extrasTotal += amt;
        } else if (ext.type === 'toggle' && val) {
          extrasItems.push({ label: ext.name, amount: ext.price });
          extrasTotal += ext.price;
        }
      });
    }

    const oneWayTotal = baseRouteFare + vehicleSurcharge + extraLuggageFee + extrasTotal;

    // Round-trip calculation
    let returnTripRaw = 0;
    let roundTripDiscountAmount = 0;
    let finalTotal = oneWayTotal;

    if (state.roundTrip && state.serviceType !== 'delivery') {
      returnTripRaw = baseRouteFare + vehicleSurcharge;
      roundTripDiscountAmount = Math.round((returnTripRaw * (settings.roundTripDiscountPct || 10)) / 100);
      finalTotal = oneWayTotal + (returnTripRaw - roundTripDiscountAmount);
    }

    // Commission calculation for Tal's station
    const commissionPct = Number(settings.defaultCommissionPct || 15);
    const commissionAmount = Math.round((finalTotal * commissionPct) / 100);
    const driverNet = finalTotal - commissionAmount;

    return {
      originCity,
      destCity,
      isNight,
      baseRouteFare,
      roadKm,
      estMin,
      routeTitle,
      routeSubtitle,
      vehicle,
      vehicleSurcharge,
      extraLuggageFee,
      extrasItems,
      extrasTotal,
      oneWayTotal,
      returnTripRaw,
      roundTripDiscountAmount,
      finalTotal,
      commissionPct,
      commissionAmount,
      driverNet
    };
  }

  // --- WhatsApp Message Builders ---
  function buildCustomerOrderWhatsAppText(order, calc) {
    const lines = [
      `🚕 *הזמנת נסיעה חדשה — ${settings.brandNameHe} (${order.id})* 🚕`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📌 *סוג שירות:* ${order.serviceLabel}`,
      `📍 *מוצא / איסוף:* ${order.originLabel}`,
      `🏁 *יעד:* ${order.destLabel}`,
      `🕒 *מועד איסוף:* ${order.pickupTimeLabel} (${calc.isNight ? 'תעריף לילה/סופ״ש' : 'תעריף יום'})`
    ];

    if (state.serviceType === 'from_airport' && state.flightNumber) {
      lines.push(`✈️ *מספר טיסה למעקב:* ${state.flightNumber.toUpperCase()} (טרמינל ${state.terminal})`);
    } else if (state.serviceType === 'to_airport') {
      lines.push(`✈️ *טרמינל הורדה:* טרמינל ${state.terminal}`);
    }

    if (state.serviceType === 'delivery') {
      const pkg = DATA.deliveryPackages.find(p => p.id === state.deliveryPackageId);
      lines.push(`📦 *סוג משלוח:* ${pkg ? pkg.name : 'חבילה'}`);
      if (state.recipientName || state.recipientPhone) {
        lines.push(`👤 *מקבל המשלוח:* ${state.recipientName || '-'} (${state.recipientPhone || '-'})`);
      }
    } else {
      lines.push(`👥 *נוסעים:* ${state.passengers} | 🧳 *מזוודות:* ${state.suitcases} גדולות, ${state.handLuggage} טרולי${state.strollers ? `, ${state.strollers} עגלות` : ''}`);
      lines.push(`🚘 *סוג רכב:* ${calc.vehicle.name}`);
    }

    if (calc.extrasItems.length > 0) {
      lines.push(`➕ *תוספות:* ${calc.extrasItems.map(i => `${i.label} (₪${i.amount})`).join(', ')}`);
    }

    if (state.roundTrip) {
      lines.push(`🔄 *כולל נסיעת חזור:* ${state.returnDate} בשעה ${state.returnTime} (כולל ${settings.roundTripDiscountPct}% הנחת הלוך-חזור)`);
    }

    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`💰 *מחיר סופי קבוע מראש: ₪${calc.finalTotal}*`);
    lines.push(`💳 *אמצעי תשלום מועדף:* ${getPaymentMethodLabel(state.paymentMethod)}`);
    lines.push(`━━━━━━━━━━━━━━━━━━━━`);
    lines.push(`👤 *שם המזמין:* ${order.customerName}`);
    lines.push(`📱 *טלפון לחזרה:* ${order.customerPhone}`);
    if (state.customerNotes) {
      lines.push(`📝 *הערות לנהג:* ${state.customerNotes}`);
    }
    lines.push(`\nאשמח לאישור ההזמנה ופרטי הנהג המשובץ 🙏`);
    return lines.join('\n');
  }

  // הודעה לקבוצת נהגים (ללא טלפון הלקוח כדי לשמור על העמלה של טל!)
  function buildDriverGroupBroadcastText(order) {
    return [
      `🚕 *נסיעה פנויה לביצוע — ${settings.brandNameHe} (#${order.id})* 🚕`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `🔹 *שירות:* ${order.serviceLabel}`,
      `📍 *איסוף:* ${order.originLabel}`,
      `🏁 *יעד:* ${order.destLabel}`,
      `🕒 *מועד:* ${order.pickupTimeLabel}`,
      `👥 *נוסעים:* ${order.passengers} | 🧳 *מזוודות:* ${order.suitcases}`,
      `🚘 *רכב נדרש:* ${order.vehicleName}`,
      order.extrasSummary ? `➕ *דגשים/תוספות:* ${order.extrasSummary}` : null,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *גבייה מהלקוח:* ₪${order.totalPrice} (${order.paymentMethod})`,
      `💎 *עמלת תחנה (${order.commissionPct}%):* ₪${order.commissionAmount} (העברה בביט/פייבוקס ל-${settings.bitPhone})`,
      `💵 *נטו לנהג:* *₪${order.driverNet}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👈 *נהג פנוי לאיסוף?* שלח הודעה בפרטי "אני #${order.id}" לקבלת טלפון הלקוח וכתובת מדויקת!`
    ].filter(Boolean).join('\n');
  }

  // הודעה לנהג שזכה בנסיעה (כולל טלפון הלקוח + לינק ל-Waze + תזכורת ביט/פייבוקס)
  function buildWinningDriverPrivateText(order) {
    const wazeQuery = encodeURIComponent(order.originLabel);
    return [
      `✅ *פרטי נסיעה מלאים לביצוע (#${order.id}) — ${settings.brandNameHe}*`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `👤 *שם הלקוח:* ${order.customerName}`,
      `📞 *טלפון הלקוח:* ${order.customerPhone}`,
      `📍 *כתובת איסוף:* ${order.originLabel}`,
      `🏁 *כתובת יעד:* ${order.destLabel}`,
      `🕒 *שעת איסוף:* ${order.pickupTimeLabel}`,
      `🚘 *רכב:* ${order.vehicleName} (${order.passengers} נוסעים, ${order.suitcases} מזוודות)`,
      order.extrasSummary ? `➕ *תוספות:* ${order.extrasSummary}` : null,
      `🗺️ *ניווט מהיר ב-Waze:* https://waze.com/ul?q=${wazeQuery}&navigate=yes`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `💰 *לגבות מהלקוח:* ₪${order.totalPrice} (${order.paymentMethod})`,
      `📲 *עמלת תחנה להעברה ב-Bit / PayBox:* *₪${order.commissionAmount}* למספר *${settings.bitPhone}*`,
      `נסיעה טובה ובטוחה! צור קשר עם הלקוח לעדכון הגעה 🚕`
    ].filter(Boolean).join('\n');
  }

  // הודעת אישור ללקוח שהמונית שובצה
  function buildCustomerConfirmationText(order) {
    return [
      `✨ *שלום ${order.customerName}, הזמנתך ב-${settings.brandNameHe} (#${order.id}) אושרה!* 🚕`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `📍 *איסוף:* ${order.originLabel}`,
      `🏁 *יעד:* ${order.destLabel}`,
      `🕒 *מועד:* ${order.pickupTimeLabel}`,
      `🚘 *רכב:* ${order.vehicleName}`,
      order.assignedDriverName ? `👨‍✈️ *נהג משובץ:* ${order.assignedDriverName} (${order.assignedDriverPhone || 'ייצור קשר בקרוב'})` : `👨‍✈️ *סטטוס:* נהג משובץ וייצור איתך קשר לפני האיסוף`,
      `💰 *מחיר סופי קבוע:* ₪${order.totalPrice}`,
      `━━━━━━━━━━━━━━━━━━━━`,
      `תודה שבחרת ב-${settings.brandNameHe}! שתהיה נסיעה טובה ובטוחה 🌟`
    ].join('\n');
  }

  function getPaymentMethodLabel(method) {
    const map = {
      bit: 'Bit (ביט)',
      paybox: 'PayBox (פייבוקס)',
      cash: 'מזומן לנהג',
      credit: 'כרטיס אשראי / קישור תשלום'
    };
    return map[method] || method;
  }

  function formatCleanIntlPhone(phoneStr) {
    const digits = String(phoneStr || '').replace(/\D/g, '');
    if (!digits) return settings.whatsappIntl;
    if (digits.startsWith('972')) return digits;
    if (digits.startsWith('0')) return '972' + digits.slice(1);
    return '972' + digits;
  }

  // --- Submit Order & Open WhatsApp ---
  function submitBookingToWhatsApp() {
    const calc = calculatePricing();
    const name = state.customerName.trim() || 'לקוח באתר';
    const phone = state.customerPhone.trim() || 'לא הוזן';

    if (!state.customerPhone.trim()) {
      const phoneInput = document.getElementById('customerPhoneInput');
      if (phoneInput) {
        phoneInput.focus();
        phoneInput.classList.add('ring-4', 'ring-amber-400');
        setTimeout(() => phoneInput.classList.remove('ring-4', 'ring-amber-400'), 2200);
      }
      showToast('נא להזין מספר טלפון נייד לתיאום הנהג 📱', 'warning');
      return;
    }

    const orderId = 'PT-' + Math.floor(1000 + Math.random() * 9000);
    const serviceLabels = {
      to_airport: `מונית לנתב״ג (טרמינל ${state.terminal})`,
      from_airport: `איסוף מנתב״ג (${state.flightNumber ? 'טיסה ' + state.flightNumber.toUpperCase() : 'טרמינל ' + state.terminal})`,
      intercity: 'נסיעה בינעירונית ספיישל',
      delivery: 'משלוח אקספרס ישיר'
    };

    const originLabel = state.serviceType === 'from_airport'
      ? `נמל התעופה בן גוריון — טרמינל ${state.terminal}`
      : `${calc.originCity.name}${state.streetOrigin ? ' (' + state.streetOrigin + ')' : ''}`;

    const destLabel = state.serviceType === 'to_airport'
      ? `נמל התעופה בן גוריון — טרמינל ${state.terminal}`
      : `${calc.destCity.name}${state.streetDest ? ' (' + state.streetDest + ')' : ''}`;

    const pickupTimeLabel = state.pickupTiming === 'now'
      ? 'מיידי — לעכשיו (הגעה מהירה)'
      : `${state.pickupDate} בשעה ${state.pickupTime}`;

    const newOrder = {
      id: orderId,
      createdAt: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) + ' (היום)',
      serviceType: state.serviceType,
      serviceLabel: serviceLabels[state.serviceType],
      originLabel,
      destLabel,
      pickupTimeLabel,
      passengers: state.serviceType === 'delivery' ? 0 : state.passengers,
      suitcases: state.serviceType === 'delivery' ? 1 : state.suitcases,
      vehicleName: state.serviceType === 'delivery' ? 'משלוח אקספרס במונית' : calc.vehicle.name,
      extrasSummary: calc.extrasItems.map(e => e.label).join(', ') || (state.roundTrip ? 'הלוך-חזור' : 'ללא תוספות'),
      customerName: name,
      customerPhone: phone,
      paymentMethod: getPaymentMethodLabel(state.paymentMethod),
      totalPrice: calc.finalTotal,
      commissionPct: calc.commissionPct,
      commissionAmount: calc.commissionAmount,
      driverNet: calc.driverNet,
      status: 'new',
      assignedDriverName: '',
      assignedDriverPhone: ''
    };

    orders.unshift(newOrder);
    saveOrders();
    state.lastCreatedOrder = newOrder;

    const waText = buildCustomerOrderWhatsAppText(newOrder, calc);
    const waUrl = `https://wa.me/${formatCleanIntlPhone(settings.whatsappPhone)}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');

    renderOrderSuccessModal(newOrder, waText, waUrl);
    renderAll();
  }

  function showToast(msg, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const bg = type === 'warning' ? 'bg-amber-500 text-slate-950' : 'bg-emerald-600 text-white';
    const el = document.createElement('div');
    el.className = `${bg} font-bold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 transform transition-all duration-300`;
    el.innerHTML = `<span>${type === 'warning' ? '⚠️' : '✅'}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      setTimeout(() => el.remove(), 300);
    }, 3500);
  }

  function copyToClipboard(text, label = 'ההודעה הועתקה ללוח!') {
    navigator.clipboard.writeText(text).then(() => {
      showToast(label, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast(label, 'success');
    });
  }

  // --- Render Functions ---
  function renderHeader() {
    const logoSrc = settings.logoStyle === 'crest'
      ? './public/assets/logo-crest.jpg'
      : './public/assets/logo-modern.jpg';

    const newOrdersCount = orders.filter(o => o.status === 'new').length;
    const openForDriversCount = orders.filter(o => o.status === 'new' || o.status === 'broadcasted').length;

    const headerEl = document.getElementById('appHeader');
    if (!headerEl) return;

    headerEl.innerHTML = `
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-2">
        <!-- Brand Identity -->
        <div class="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0" onclick="window.primeApp.setView('booking')">
          <div class="relative">
            <img src="${logoSrc}" alt="${settings.brandNameHe}" class="w-11 h-11 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-amber-400/80 shadow-lg shadow-amber-500/20" />
            <span class="absolute -bottom-1 -left-1 bg-emerald-500 w-3.5 h-3.5 rounded-full border-2 border-slate-950" title="מחובר לענן AWS חי 24/7"></span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base sm:text-2xl font-black tracking-tight text-white">${settings.brandNameHe}</span>
              <span class="hidden lg:inline-block text-xs font-extrabold px-2 py-0.5 rounded-md bg-amber-400/15 text-amber-300 border border-amber-400/30">${settings.brandNameEn}</span>
            </div>
            <p class="text-[11px] text-slate-300 hidden xl:block">${settings.brandSlogan}</p>
          </div>
        </div>

        <!-- Navigation & Auth Pills -->
        <div class="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
          <button onclick="window.primeApp.setView('booking')"
            class="px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer ${state.activeView === 'booking' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800'}">
            <span>🚕</span>
            <span class="hidden sm:inline">הזמנת מונית</span>
            <span class="sm:hidden">הזמנה</span>
          </button>

          <button onclick="window.primeApp.setView('driver')"
            class="relative px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 border cursor-pointer ${state.activeView === 'driver' ? 'bg-emerald-400 text-slate-950 border-emerald-400 shadow-md' : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'}">
            <span>🚖</span>
            <span class="hidden md:inline">כניסת נהגים</span>
            <span class="md:hidden">נהגים</span>
            ${openForDriversCount > 0 ? `<span class="bg-emerald-500 text-slate-950 text-[11px] font-black px-1.5 py-0.2 rounded-full">${openForDriversCount}</span>` : ''}
          </button>

          <button onclick="window.primeApp.setView('marketing')"
            class="px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 border cursor-pointer ${state.activeView === 'marketing' ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md' : 'bg-indigo-950/80 text-amber-300 border-amber-400/40 hover:bg-indigo-900/70'}">
            <span>🎬</span>
            <span class="hidden lg:inline">סרטונים, פוסטים ודגל לרכב</span>
            <span class="lg:hidden">סרטונים/דגל</span>
          </button>

          <button onclick="window.primeApp.setView('pricelist')"
            class="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 cursor-pointer ${state.activeView === 'pricelist' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-200 hover:bg-slate-800'}">
            <span>📋</span>
            <span class="hidden xl:inline">מחירון</span>
          </button>

          <button onclick="window.primeApp.setView('admin')"
            class="relative px-2.5 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition flex items-center gap-1.5 border cursor-pointer ${state.activeView === 'admin' ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-md' : 'bg-slate-900/90 text-amber-300 border-amber-500/40 hover:bg-slate-800'}">
            <span>⚡</span>
            <span class="hidden sm:inline">ניהול וסדרן</span>
            <span class="sm:hidden">סדרן</span>
            ${newOrdersCount > 0 ? `<span class="bg-rose-500 text-white text-[11px] font-black px-1.5 py-0.2 rounded-full">${newOrdersCount}</span>` : ''}
          </button>

          ${currentUser ? `
            <button onclick="window.primeApp.openAuthModal()"
              class="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/25 transition flex items-center gap-1.5 cursor-pointer">
              <span>${currentUser.role === 'super_admin' ? '👑' : (currentUser.role === 'driver' ? '🚖' : '👤')}</span>
              <span class="max-w-[80px] truncate">${currentUser.name}</span>
            </button>
          ` : `
            <button onclick="window.primeApp.openAuthModal()"
              class="px-2.5 sm:px-3 py-2 rounded-xl text-xs sm:text-sm font-extrabold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition flex items-center gap-1.5 cursor-pointer">
              <span>🔐</span>
              <span class="hidden sm:inline">התחברות</span>
            </button>
          `}
        </div>
      </div>
    `;
  }

  function renderPopularQuickRoutes() {
    const quickRoutes = [
      { label: 'תל אביב  נתב״ג', cityId: 'tlv', mode: 'to_airport', price: getCityById('tlv').airportDay },
      { label: 'ירושלים  נתב״ג', cityId: 'jerusalem', mode: 'to_airport', price: getCityById('jerusalem').airportDay },
      { label: 'ראשון לציון  נתב״ג', cityId: 'rishon', mode: 'to_airport', price: getCityById('rishon').airportDay },
      { label: 'רמת גן / ב״ב  נתב״ג', cityId: 'ramat-gan', mode: 'to_airport', price: getCityById('ramat-gan').airportDay },
      { label: 'מודיעין  נתב״ג', cityId: 'modiin', mode: 'to_airport', price: getCityById('modiin').airportDay },
      { label: 'נתניה  נתב״ג', cityId: 'netanya', mode: 'to_airport', price: getCityById('netanya').airportDay },
      { label: 'חיפה  נתב״ג', cityId: 'haifa', mode: 'to_airport', price: getCityById('haifa').airportDay },
      { label: 'באר שבע  נתב״ג', cityId: 'beer-sheva', mode: 'to_airport', price: getCityById('beer-sheva').airportDay }
    ];

    return quickRoutes.map(r => `
      <button onclick="window.primeApp.selectQuickRoute('${r.cityId}', '${r.mode}')"
        class="flex items-center gap-2 bg-slate-900/85 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/60 text-white px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition shadow-sm">
        <span>✈️</span>
        <span>${r.label}</span>
        <span class="text-amber-400 font-black">₪${r.price}</span>
      </button>
    `).join('');
  }

  function renderCityOptions(selectedId) {
    const regions = {};
    getAllCities().forEach(c => {
      if (!regions[c.region]) regions[c.region] = [];
      regions[c.region].push(c);
    });

    return Object.keys(regions).map(regionName => `
      <optgroup label="── ${regionName} ──">
        ${regions[regionName].map(c => `
          <option value="${c.id}" ${c.id === selectedId ? 'selected' : ''}>
            ${c.name} ${state.serviceType.includes('airport') ? `(נתב״ג: ₪${c.airportDay})` : ''}
          </option>
        `).join('')}
      </optgroup>
    `).join('');
  }

  function renderBookingView() {
    const calc = calculatePricing();
    const isAirport = state.serviceType === 'to_airport' || state.serviceType === 'from_airport';
    const isDelivery = state.serviceType === 'delivery';

    return `
      <!-- Hero Banner -->
      <section class="hero-backdrop text-white pt-6 pb-10 sm:py-12 border-b border-amber-500/20">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="max-w-3xl">
            <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-extrabold mb-4">
              <span>⭐</span>
              <span>מחיר פיקס ידוע מראש • ללא הפתעות במונה • זמינות 24/7 בכל הארץ</span>
            </div>
            <h1 class="text-3xl sm:text-5xl font-black leading-tight mb-3">
              מוניות ספיישל לנתב״ג, <span class="gold-gradient-text">נסיעות בינעירוניות ומשלוחים</span> בקליק ל-WhatsApp
            </h1>
            <p class="text-slate-200 text-sm sm:text-lg mb-5 leading-relaxed">
              מחשבון מחירים שקוף ומדויק מכל יישוב בארץ לנתב״ג ומעיר לעיר. בחרו מסלול, מספר נוסעים ומזוודות — וקבלו מונית חדישה ישירות ב-WhatsApp עם תשלום נוח ב-<strong>Bit</strong>, <strong>PayBox</strong>, מזומן או אשראי.
            </p>
            <!-- Quick Popular Routes Strip -->
            <div class="mb-4">
              <div class="text-xs font-bold text-amber-300/90 mb-2">🔥 מסלולים מבוקשים בלחיצה מהירה (תעריף יום קבוע):</div>
              <div class="flex flex-wrap gap-2">
                ${renderPopularQuickRoutes()}
              </div>
            </div>

            <!-- Interactive Video Tutorials & Car Flag Quick Strip -->
            <div class="bg-slate-950/85 border border-amber-400/40 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div class="flex items-center gap-2.5">
                <span class="text-2xl">🎬</span>
                <div>
                  <div class="text-xs font-black text-amber-300">חדש! סרטוני הדרכה קצרים (15 שניות) + מיתוג ודגל לרכב</div>
                  <div class="text-[11px] text-slate-300">צפה איך מזמינים מונית לנתב״ג בקליק, או איך נהגים מתחברים ותופסים נסיעות בפורטל</div>
                </div>
              </div>
              <div class="flex flex-wrap gap-1.5 shrink-0">
                <button onclick="window.primeApp.openVideoReelShortcut('cust_booking_15s')"
                  class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer">
                  ▶️ סרטון ללקוח
                </button>
                <button onclick="window.primeApp.openVideoReelShortcut('driver_login_claim')"
                  class="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black cursor-pointer">
                  🚖 סרטון לנהג
                </button>
                <button onclick="window.primeApp.openMerchShortcut()"
                  class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 text-xs font-bold cursor-pointer">
                  🚩 דגל לרכב ופוסטים
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      ${state.lastCreatedOrder ? (() => {
        const liveOrd = orders.find(o => o.id === state.lastCreatedOrder.id) || state.lastCreatedOrder;
        const stepNum = liveOrd.status === 'paid' || liveOrd.status === 'assigned' ? 3 : (liveOrd.status === 'broadcasted' ? 2 : 1);
        return `
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4 mb-6">
            <div class="bg-emerald-950 text-white rounded-3xl p-4 sm:p-5 border-2 border-emerald-400 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-xs font-black">מעקב הזמנה חי #${liveOrd.id}</span>
                  <span class="text-sm font-black text-emerald-300">${stepNum === 3 ? `✅ נהג שובץ לנסיעה שלך (${liveOrd.assignedDriverName || 'נהג פריים טקסי'})!` : (stepNum === 2 ? '📢 הנסיעה שלך במכרז נהגים חי באזורך' : '⚡ ההזמנה נקלטה במוקד וממתינה לשיבוץ נהג')}</span>
                </div>
                <div class="text-xs text-slate-200 mt-1">📍 ${liveOrd.originLabel} ⬅ ${liveOrd.destLabel} | 💰 מחיר קבוע: ₪${liveOrd.totalPrice}</div>
              </div>
              <div class="flex items-center gap-2 text-xs font-black">
                <span class="px-3 py-1.5 rounded-xl ${stepNum >= 1 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}">1. נקלט במוקד</span>
                <span>←</span>
                <span class="px-3 py-1.5 rounded-xl ${stepNum >= 2 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}">2. במכרז נהגים</span>
                <span>←</span>
                <span class="px-3 py-1.5 rounded-xl ${stepNum >= 3 ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-400'}">3. נהג שובץ!</span>
              </div>
            </div>
          </div>
        `;
      })() : ''}

      <!-- Main Booking Calculator & Live Receipt Grid -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 pb-28 lg:pb-16 relative z-10">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <!-- Right Column (RTL): Interactive Booking Form (7 cols) -->
          <div class="lg:col-span-7 bg-white rounded-3xl shadow-xl border border-slate-200/90 p-5 sm:p-7">

            <!-- Step 1: Service Mode Tabs -->
            <div class="mb-6">
              <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">שלב 1 — בחר את סוג הנסיעה או המשלוח</label>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button onclick="window.primeApp.setServiceType('to_airport')"
                  class="service-tab rounded-2xl p-3.5 text-right flex flex-col justify-between ${state.serviceType === 'to_airport' ? 'active' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'}">
                  <span class="text-2xl mb-1">🛫</span>
                  <span class="font-black text-sm">מונית לנתב״ג</span>
                  <span class="text-[11px] opacity-80">מהבית לטרמינל 3 / 1</span>
                </button>

                <button onclick="window.primeApp.setServiceType('from_airport')"
                  class="service-tab rounded-2xl p-3.5 text-right flex flex-col justify-between ${state.serviceType === 'from_airport' ? 'active' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'}">
                  <span class="text-2xl mb-1">🛬</span>
                  <span class="font-black text-sm">איסוף מנתב״ג</span>
                  <span class="text-[11px] opacity-80">כולל מעקב נחיתה</span>
                </button>

                <button onclick="window.primeApp.setServiceType('intercity')"
                  class="service-tab rounded-2xl p-3.5 text-right flex flex-col justify-between ${state.serviceType === 'intercity' ? 'active' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'}">
                  <span class="text-2xl mb-1">🛣️</span>
                  <span class="font-black text-sm">נסיעה מעיר לעיר</span>
                  <span class="text-[11px] opacity-80">ספיישל לכל הארץ</span>
                </button>

                <button onclick="window.primeApp.setServiceType('delivery')"
                  class="service-tab rounded-2xl p-3.5 text-right flex flex-col justify-between ${state.serviceType === 'delivery' ? 'active' : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'}">
                  <span class="text-2xl mb-1">📦</span>
                  <span class="font-black text-sm">משלוח אקספרס</span>
                  <span class="text-[11px] opacity-80">חבילות ומעטפות</span>
                </button>
              </div>
            </div>

            <!-- Step 2: Route & Addresses -->
            <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mb-6">
              <div class="flex items-center justify-between mb-3">
                <span class="text-sm font-black text-slate-800 flex items-center gap-2">
                  <span>📍</span>
                  <span>שלב 2 — מסלול הנסיעה וכתובת איסוף</span>
                </span>
                ${!isAirport ? `
                  <button onclick="window.primeApp.swapCities()" class="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 flex items-center gap-1">
                    <span>⇅</span>
                    <span>החלף מוצא ויעד</span>
                  </button>
                ` : ''}
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                ${state.serviceType === 'from_airport' ? `
                  <!-- Origin is Ben Gurion Airport -->
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">נקודת איסוף בנתב״ג</label>
                    <select onchange="window.primeApp.updateField('terminal', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none">
                      <option value="3" ${state.terminal === '3' ? 'selected' : ''}>✈️ נתב״ג — טרמינל 3 (טיסות בינלאומיות)</option>
                      <option value="1" ${state.terminal === '1' ? 'selected' : ''}>✈️ נתב״ג — טרמינל 1 (לואו-קוסט / פנים)</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">מספר טיסה (למעקב נחיתה אוטומטי)</label>
                    <input type="text" value="${state.flightNumber}" placeholder="לדוגמה: LY316 / W6128"
                      oninput="window.primeApp.updateField('flightNumber', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">עיר יעד (פיזור)</label>
                    <select onchange="window.primeApp.updateField('destCityId', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none">
                      ${renderCityOptions(state.destCityId)}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">כתובת יעד בעיר (רחוב ומספר בית)</label>
                    <input type="text" value="${state.streetDest}" placeholder="לדוגמה: הרצל 24, דירה 5"
                      oninput="window.primeApp.updateField('streetDest', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                ` : state.serviceType === 'to_airport' ? `
                  <!-- Destination is Ben Gurion Airport -->
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">עיר איסוף</label>
                    <select onchange="window.primeApp.updateField('originCityId', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none">
                      ${renderCityOptions(state.originCityId)}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">כתובת איסוף מדויקת (רחוב ומספר)</label>
                    <input type="text" value="${state.streetOrigin}" placeholder="לדוגמה: דיזנגוף 120"
                      oninput="window.primeApp.updateField('streetOrigin', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div class="sm:col-span-2">
                    <label class="block text-xs font-bold text-slate-600 mb-1">טרמינל יעד בנתב״ג</label>
                    <div class="grid grid-cols-2 gap-3">
                      <button type="button" onclick="window.primeApp.updateField('terminal', '3')"
                        class="py-2.5 px-4 rounded-xl font-bold text-sm border transition ${state.terminal === '3' ? 'bg-slate-900 text-amber-400 border-amber-500' : 'bg-white text-slate-700 border-slate-300'}">
                        ✈️ טרמינל 3 (ראשי)
                      </button>
                      <button type="button" onclick="window.primeApp.updateField('terminal', '1')"
                        class="py-2.5 px-4 rounded-xl font-bold text-sm border transition ${state.terminal === '1' ? 'bg-slate-900 text-amber-400 border-amber-500' : 'bg-white text-slate-700 border-slate-300'}">
                        ✈️ טרמינל 1 (לואו-קוסט)
                      </button>
                    </div>
                  </div>
                ` : `
                  <!-- Intercity or Delivery -->
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">עיר מוצא (איסוף)</label>
                    <select onchange="window.primeApp.updateField('originCityId', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none">
                      ${renderCityOptions(state.originCityId)}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">כתובת איסוף (רחוב ומספר)</label>
                    <input type="text" value="${state.streetOrigin}" placeholder="רחוב ומספר בית באיסוף"
                      oninput="window.primeApp.updateField('streetOrigin', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">עיר יעד (מסירה / הורדה)</label>
                    <select onchange="window.primeApp.updateField('destCityId', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none">
                      ${renderCityOptions(state.destCityId)}
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-600 mb-1">כתובת יעד (רחוב ומספר)</label>
                    <input type="text" value="${state.streetDest}" placeholder="רחוב ומספר בית ביעד"
                      oninput="window.primeApp.updateField('streetDest', this.value)"
                      class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                  </div>
                `}
              </div>

              <!-- Timing & Round-trip bar -->
              <div class="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">מועד הנסיעה</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="window.primeApp.updateField('pickupTiming', 'now')"
                      class="py-2 px-3 rounded-xl text-xs font-extrabold border transition ${state.pickupTiming === 'now' ? 'bg-slate-900 text-amber-400 border-amber-500' : 'bg-white text-slate-700 border-slate-300'}">
                      ⚡ מיידי (לעכשיו)
                    </button>
                    <button type="button" onclick="window.primeApp.updateField('pickupTiming', 'scheduled')"
                      class="py-2 px-3 rounded-xl text-xs font-extrabold border transition ${state.pickupTiming === 'scheduled' ? 'bg-slate-900 text-amber-400 border-amber-500' : 'bg-white text-slate-700 border-slate-300'}">
                      📅 הזמנה מראש
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">סוג תעריף (מזוהה אוטומטית לפי שעה)</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button type="button" onclick="window.primeApp.updateField('tariffOverride', 'day')"
                      class="py-2 px-3 rounded-xl text-xs font-extrabold border transition ${!calc.isNight ? 'bg-amber-400 text-slate-950 border-amber-500' : 'bg-white text-slate-600 border-slate-300'}">
                      ☀️ תעריף יום (א׳)
                    </button>
                    <button type="button" onclick="window.primeApp.updateField('tariffOverride', 'night')"
                      class="py-2 px-3 rounded-xl text-xs font-extrabold border transition ${calc.isNight ? 'bg-indigo-950 text-amber-300 border-indigo-700' : 'bg-white text-slate-600 border-slate-300'}">
                      🌙 לילה / סופ״ש (ב׳)
                    </button>
                  </div>
                </div>
              </div>

              ${state.pickupTiming === 'scheduled' ? `
                <div class="mt-3 grid grid-cols-2 gap-3 bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">תאריך איסוף</label>
                    <input type="date" value="${state.pickupDate}" onchange="window.primeApp.updateField('pickupDate', this.value)"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" />
                  </div>
                  <div>
                    <label class="block text-xs font-bold text-slate-700 mb-1">שעת איסוף</label>
                    <input type="time" value="${state.pickupTime}" onchange="window.primeApp.updateField('pickupTime', this.value)"
                      class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" />
                  </div>
                </div>
              ` : ''}

              ${!isDelivery ? `
                <div class="mt-3 flex items-center justify-between bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                  <label class="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-extrabold text-emerald-950">
                    <input type="checkbox" ${state.roundTrip ? 'checked' : ''} onchange="window.primeApp.updateField('roundTrip', this.checked)"
                      class="w-4 h-4 accent-emerald-600 rounded" />
                    <span>🔄 סגור גם מונית חזור מראש וקבל <strong>${settings.roundTripDiscountPct}% הנחה</strong> על החזור!</span>
                  </label>
                </div>
                ${state.roundTrip ? `
                  <div class="mt-2 grid grid-cols-2 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200">
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">תאריך נסיעת חזור</label>
                      <input type="date" value="${state.returnDate}" onchange="window.primeApp.updateField('returnDate', this.value)"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                    <div>
                      <label class="block text-xs font-bold text-slate-700 mb-1">שעת איסוף בחזור</label>
                      <input type="time" value="${state.returnTime}" onchange="window.primeApp.updateField('returnTime', this.value)"
                        class="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold" />
                    </div>
                  </div>
                ` : ''}
              ` : ''}
            </div>

            ${isDelivery ? renderDeliveryOptionsSection() : renderPassengersAndVehiclesSection(calc)}

            <!-- Step 5: Customer Details & Payment Preference -->
            <div class="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 mt-6">
              <div class="text-sm font-black text-slate-800 mb-3 flex items-center gap-2">
                <span>👤</span>
                <span>פרטי המזמין ואמצעי תשלום מועדף</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-4">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">שם מלא</label>
                  <input type="text" value="${state.customerName}" placeholder="הכנס שם מלא"
                    oninput="window.primeApp.updateFieldSilent('customerName', this.value)"
                    class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">טלפון נייד (חובה לתיאום הנהג) *</label>
                  <input id="customerPhoneInput" type="tel" dir="ltr" value="${state.customerPhone}" placeholder="05X-XXXXXXX"
                    oninput="window.primeApp.updateFieldSilent('customerPhone', this.value)"
                    class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm font-bold text-slate-900 text-right focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              <div class="mb-3">
                <label class="block text-xs font-bold text-slate-600 mb-1.5">איך תרצו לשלם על הנסיעה?</label>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  ${[
                    { id: 'bit', label: 'Bit (ביט)', icon: '📲' },
                    { id: 'paybox', label: 'PayBox', icon: '💜' },
                    { id: 'cash', label: 'מזומן לנהג', icon: '💵' },
                    { id: 'credit', label: 'אשראי', icon: '💳' }
                  ].map(pm => `
                    <button type="button" onclick="window.primeApp.updateField('paymentMethod', '${pm.id}')"
                      class="py-2.5 px-3 rounded-xl text-xs font-extrabold border flex items-center justify-center gap-1.5 transition ${state.paymentMethod === pm.id ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-sm' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}">
                      <span>${pm.icon}</span>
                      <span>${pm.label}</span>
                    </button>
                  `).join('')}
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">הערות לנהג / קוד אינטרקום / דגשים (אופציונלי)</label>
                <input type="text" value="${state.customerNotes}" placeholder="לדוגמה: להמתין ליד שער הכניסה, יש 2 מזוודות גדולות..."
                  oninput="window.primeApp.updateFieldSilent('customerNotes', this.value)"
                  class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-amber-500 focus:outline-none" />
              </div>
            </div>

          </div>

          <!-- Left Column (RTL): Sticky Live Pricing & WhatsApp Dispatch Receipt (5 cols) -->
          <div class="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <div class="receipt-card rounded-3xl p-6 text-white relative overflow-hidden">
              <div class="flex items-center justify-between border-b border-slate-700/80 pb-4 mb-4">
                <div>
                  <span class="text-xs font-extrabold uppercase tracking-wider text-amber-400 block">סיכום והצעת מחיר מיידית</span>
                  <h2 class="text-xl font-black text-white mt-0.5">${calc.routeTitle}</h2>
                  <p class="text-xs text-slate-300 mt-0.5">${calc.routeSubtitle}</p>
                </div>
                <div class="text-left">
                  <span class="inline-block px-2.5 py-1 rounded-lg text-xs font-extrabold ${calc.isNight ? 'bg-indigo-500/20 text-indigo-200 border border-indigo-400/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}">
                    ${calc.isNight ? '🌙 תעריף לילה/סופ״ש' : '☀️ תעריף יום'}
                  </span>
                </div>
              </div>

              <!-- Route Metrics Pills -->
              <div class="grid grid-cols-3 gap-2.5 mb-5">
                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span class="text-[11px] text-slate-400 block">מרחק משוער</span>
                  <span class="text-base font-black text-white">${calc.roadKm} ק״מ</span>
                </div>
                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span class="text-[11px] text-slate-400 block">זמן נסיעה</span>
                  <span class="text-base font-black text-white">~${calc.estMin} דק׳</span>
                </div>
                <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center">
                  <span class="text-[11px] text-slate-400 block">סוג רכב</span>
                  <span class="text-xs font-black text-amber-400 truncate block">${isDelivery ? 'משלוח מונית' : calc.vehicle.name.replace('מונית ', '')}</span>
                </div>
              </div>

              <!-- Transparent Breakdown Lines -->
              <div class="space-y-2.5 text-sm border-b border-slate-700/80 pb-4 mb-4">
                <div class="flex justify-between items-center">
                  <span class="text-slate-300">תעריף מסלול בסיס (${calc.isNight ? 'לילה/סופ״ש' : 'יום'}):</span>
                  <span class="font-bold text-white">₪${calc.baseRouteFare}</span>
                </div>

                ${calc.vehicleSurcharge > 0 ? `
                  <div class="flex justify-between items-center text-amber-300">
                    <span>שדרוג רכב (${calc.vehicle.name}):</span>
                    <span class="font-bold">+₪${calc.vehicleSurcharge}</span>
                  </div>
                ` : ''}

                ${calc.extraLuggageFee > 0 ? `
                  <div class="flex justify-between items-center text-amber-300">
                    <span>תוספת כבודה מעבר ל-${settings.freeSuitcasesIncluded} מזוודות:</span>
                    <span class="font-bold">+₪${calc.extraLuggageFee}</span>
                  </div>
                ` : `
                  <div class="flex justify-between items-center text-emerald-400 text-xs">
                    <span>✓ עד ${Math.max(settings.freeSuitcasesIncluded, calc.vehicle.maxSuitcases)} מזוודות כלולות במחיר ללא תוספת</span>
                    <span class="font-bold">₪0</span>
                  </div>
                `}

                ${calc.extrasItems.map(item => `
                  <div class="flex justify-between items-center text-slate-200">
                    <span>+ ${item.label}:</span>
                    <span class="font-bold">+₪${item.amount}</span>
                  </div>
                `).join('')}

                ${state.roundTrip && !isDelivery ? `
                  <div class="flex justify-between items-center text-slate-200 pt-1 border-t border-slate-800">
                    <span>נסיעת חזור (${state.returnDate}):</span>
                    <span class="font-bold">+₪${calc.returnTripRaw}</span>
                  </div>
                  <div class="flex justify-between items-center text-emerald-400">
                    <span>הנחת סגירת הלוך-חזור (${settings.roundTripDiscountPct}%-):</span>
                    <span class="font-bold">-₪${calc.roundTripDiscountAmount}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Final Fixed Price Display -->
              <div class="flex items-end justify-between mb-5">
                <div>
                  <span class="text-xs text-amber-300 font-bold block">מחיר סופי קבוע וידוע מראש</span>
                  <span class="text-[11px] text-slate-400">כולל מע״מ • ללא הפתעות במונה</span>
                </div>
                <div class="text-left">
                  <span class="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">₪${calc.finalTotal}</span>
                </div>
              </div>

              <!-- Primary WhatsApp CTA Button -->
              <button type="button" onclick="window.primeApp.submitBooking()"
                class="w-full whatsapp-cta-btn py-4 px-6 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-3 cursor-pointer">
                <span class="text-2xl">💬</span>
                <span>שלח הזמנה עכשיו ב-WhatsApp</span>
              </button>

              <div class="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>⚡ אישור ושיבוץ נהג מיידי ב-WhatsApp</span>
                <span>🔒 תשלום ב-Bit / PayBox / מזומן / אשראי</span>
              </div>
            </div>

            <!-- Trust & Benefits Card -->
            <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
              <div class="text-xs font-black uppercase tracking-wider text-slate-400">למה אלפי נוסעים מזמינים ב-${settings.brandNameHe}?</div>
              <div class="grid grid-cols-2 gap-3 text-xs">
                <div class="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                  <span class="text-lg">🛡️</span>
                  <div>
                    <div class="font-extrabold text-slate-900">מחיר פיקס סגור</div>
                    <div class="text-slate-500">המחיר שמופיע במחשבון הוא המחיר הסופי בהזמנה</div>
                  </div>
                </div>
                <div class="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                  <span class="text-lg">✈️</span>
                  <div>
                    <div class="font-extrabold text-slate-900">מעקב נחיתות חי</div>
                    <div class="text-slate-500">הנהג מתעדכן אוטומטית אם הטיסה הקדימה או התעכבה</div>
                  </div>
                </div>
                <div class="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                  <span class="text-lg">👶</span>
                  <div>
                    <div class="font-extrabold text-slate-900">סלקל ובוסטר מראש</div>
                    <div class="text-slate-500">נסיעה בטוחה למשפחות עם ילדים ותינוקות</div>
                  </div>
                </div>
                <div class="flex items-start gap-2.5 bg-slate-50 p-3 rounded-2xl">
                  <span class="text-lg">📲</span>
                  <div>
                    <div class="font-extrabold text-slate-900">ביט ופייבוקס בקליק</div>
                    <div class="text-slate-500">גמישות מלאה בכל אמצעי התשלום הנוחים בישראל</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      ${renderLandingBottomSections()}

      <!-- Mobile Sticky Bottom Bar -->
      <div class="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-slate-950/95 backdrop-blur-md border-t border-amber-500/30 px-4 py-3 flex items-center justify-between gap-3">
        <div>
          <span class="text-[11px] text-slate-400 block">${calc.routeTitle}</span>
          <div class="flex items-baseline gap-2">
            <span class="text-2xl font-black text-amber-400">₪${calc.finalTotal}</span>
            <span class="text-[11px] text-emerald-400 font-bold">מחיר קבוע</span>
          </div>
        </div>
        <button type="button" onclick="window.primeApp.submitBooking()"
          class="whatsapp-cta-btn px-5 py-3 rounded-xl text-sm font-black flex items-center gap-2">
          <span>💬</span>
          <span>הזמן ב-WhatsApp</span>
        </button>
      </div>
    `;
  }

  function renderPassengersAndVehiclesSection(calc) {
    return `
      <!-- Step 3: Passengers & Suitcases Smart Counter -->
      <div class="mb-6">
        <div class="flex items-center justify-between mb-2.5">
          <label class="text-xs font-extrabold uppercase tracking-wider text-slate-400">שלב 3 — כמות נוסעים וכבודה (+ מזוודות)</label>
          <span class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            🧳 עד ${settings.freeSuitcasesIncluded} מזוודות כלולות חינם!
          </span>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          ${[
            { key: 'passengers', label: 'נוסעים', icon: '👥', min: 1, max: 19, val: state.passengers },
            { key: 'suitcases', label: 'מזוודות גדולות', icon: '🧳', min: 0, max: 19, val: state.suitcases },
            { key: 'handLuggage', label: 'טרולי / תיק יד', icon: '🎒', min: 0, max: 12, val: state.handLuggage },
            { key: 'strollers', label: 'עגלת תינוק', icon: '🍼', min: 0, max: 4, val: state.strollers }
          ].map(counter => `
            <div class="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col justify-between">
              <div class="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
                <span>${counter.icon}</span>
                <span>${counter.label}</span>
              </div>
              <div class="flex items-center justify-between bg-white rounded-xl border border-slate-200 px-2 py-1">
                <button type="button" onclick="window.primeApp.adjustCounter('${counter.key}', -1, ${counter.min}, ${counter.max})"
                  class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-black text-slate-800 flex items-center justify-center">-</button>
                <span class="text-base font-black text-slate-900">${counter.val}</span>
                <button type="button" onclick="window.primeApp.adjustCounter('${counter.key}', 1, ${counter.min}, ${counter.max})"
                  class="w-7 h-7 rounded-lg bg-amber-400 hover:bg-amber-500 font-black text-slate-950 flex items-center justify-center">+</button>
              </div>
            </div>
          `).join('')}
        </div>

        ${state.autoUpgradeReason ? `
          <div class="mt-3 bg-amber-50 border border-amber-300 text-amber-950 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
            <span>💡</span>
            <span>${state.autoUpgradeReason}</span>
          </div>
        ` : ''}
      </div>

      <!-- Step 4: Vehicle Tier Selection -->
      <div class="mb-6">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">שלב 4 — בחר סוג מונית / מיניוואן</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${DATA.vehicleTiers.map(v => {
            const isSelected = state.vehicleTierId === v.id;
            const tierPrice = v.fixedAdd > 0
              ? calc.baseRouteFare + v.fixedAdd
              : Math.round((calc.baseRouteFare * v.multiplier) / 5) * 5;
            return `
              <div onclick="window.primeApp.selectVehicle('${v.id}')"
                class="vehicle-card rounded-2xl p-3.5 flex items-center justify-between gap-3 ${isSelected ? 'selected' : 'bg-white'}">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-slate-900 text-2xl flex items-center justify-center shrink-0">
                    ${v.icon}
                  </div>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-black text-sm text-slate-900">${v.name}</span>
                    </div>
                    <span class="text-xs text-slate-500 block">${v.subtitle}</span>
                  </div>
                </div>
                <div class="text-left shrink-0">
                  <span class="text-base font-black text-slate-900 block">₪${tierPrice}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-100 text-slate-600'}">${v.badge}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Extras & Surcharges (Stars Taxi Model) -->
      <div>
        <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">תוספות מיוחדות לנסיעה (סלקל, כביש 6, עצירות וציוד)</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${DATA.extras.filter(ext => !ext.airportOnly || state.serviceType === 'from_airport').map(ext => {
            const val = state.extrasState[ext.id];
            const isActive = ext.type === 'counter' ? val > 0 : Boolean(val);
            return `
              <div class="extra-chip rounded-2xl p-3 flex items-center justify-between gap-2 ${isActive ? 'active' : 'bg-white'}">
                <div class="flex items-center gap-2.5">
                  <span class="text-xl">${ext.icon}</span>
                  <div>
                    <div class="text-xs font-black text-slate-900">${ext.name}</div>
                    <div class="text-[11px] text-amber-700 font-bold">+₪${ext.price}${ext.type === 'counter' ? ' ליחידה' : ''}</div>
                  </div>
                </div>
                ${ext.type === 'counter' ? `
                  <div class="flex items-center gap-2 bg-slate-100 rounded-xl px-2 py-1">
                    <button type="button" onclick="window.primeApp.adjustExtra('${ext.id}', -1, ${ext.max})" class="w-6 h-6 rounded bg-white font-black text-xs">-</button>
                    <span class="text-xs font-black w-4 text-center">${val || 0}</span>
                    <button type="button" onclick="window.primeApp.adjustExtra('${ext.id}', 1, ${ext.max})" class="w-6 h-6 rounded bg-amber-400 font-black text-xs">+</button>
                  </div>
                ` : `
                  <input type="checkbox" ${val ? 'checked' : ''} onchange="window.primeApp.toggleExtra('${ext.id}', this.checked)"
                    class="w-5 h-5 accent-amber-500 rounded cursor-pointer" />
                `}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderDeliveryOptionsSection() {
    return `
      <div class="mb-6">
        <label class="block text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5">שלב 3 — בחר סוג משלוח ופרטי מקבל החבילה</label>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
          ${DATA.deliveryPackages.map(pkg => {
            const selected = state.deliveryPackageId === pkg.id;
            return `
              <div onclick="window.primeApp.updateField('deliveryPackageId', '${pkg.id}')"
                class="vehicle-card rounded-2xl p-3.5 ${selected ? 'selected' : 'bg-white'}">
                <div class="text-2xl mb-1">${pkg.icon}</div>
                <div class="font-black text-sm text-slate-900">${pkg.name}</div>
                <div class="text-xs text-slate-500 mt-1">${pkg.desc}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">שם מקבל המשלוח ביעד</label>
            <input type="text" value="${state.recipientName}" placeholder="למי למסור את החבילה?"
              oninput="window.primeApp.updateFieldSilent('recipientName', this.value)"
              class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-1">טלפון מקבל המשלוח</label>
            <input type="tel" dir="ltr" value="${state.recipientPhone}" placeholder="05X-XXXXXXX"
              oninput="window.primeApp.updateFieldSilent('recipientPhone', this.value)"
              class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-right" />
          </div>
          <div class="sm:col-span-2 pt-1">
            <label class="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input type="checkbox" ${state.deliveryPhotoProof ? 'checked' : ''}
                onchange="window.primeApp.updateField('deliveryPhotoProof', this.checked)"
                class="w-4 h-4 accent-amber-500 rounded" />
              <span>📸 מסירה אישית לדלת + שליחת צילום אישור מסירה ב-WhatsApp (+₪25)</span>
            </label>
          </div>
        </div>
      </div>
    `;
  }

  function renderLandingBottomSections() {
    return `
      <!-- Section 1: 3-Step How It Works -->
      <section class="bg-white border-t border-b border-slate-200 py-14">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="text-center max-w-2xl mx-auto mb-10">
            <span class="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">איך המערכת עובדת?</span>
            <h2 class="text-2xl sm:text-4xl font-black text-slate-900 mt-2">מזמינים מונית ספיישל ב-30 שניות</h2>
            <p class="text-slate-500 text-sm sm:text-base mt-1">ללא הורדת אפליקציה כבדה, ללא המתנה על הקו וללא הפתעות במחיר בסוף הנסיעה.</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 relative">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center mb-4 shadow-md">1</div>
              <h3 class="text-lg font-black text-slate-900 mb-1.5">מחשבים מחיר פיקס שקוף</h3>
              <p class="text-sm text-slate-600 leading-relaxed">בוחרים מוצא, יעד (נתב״ג, מעיר לעיר או משלוח), כמות נוסעים, מזוודות ותוספות כמו סלקל או כביש 6 — ורואים מיד את המחיר הסופי.</p>
            </div>
            <div class="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 relative">
              <div class="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 font-black text-xl flex items-center justify-center mb-4 shadow-md">2</div>
              <h3 class="text-lg font-black text-slate-900 mb-1.5">שולחים בקליק ל-WhatsApp</h3>
              <p class="text-sm text-slate-600 leading-relaxed">לחיצה אחת משגרת את כרטיס ההזמנה המלא ישירות למוקד ה-WhatsApp שלנו ופותחת קריאה מיידית לנהג הקרוב ביותר באזורכם.</p>
            </div>
            <div class="bg-slate-50 rounded-3xl p-6 border border-slate-200/80 relative">
              <div class="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-xl flex items-center justify-center mb-4 shadow-md">3</div>
              <h3 class="text-lg font-black text-slate-900 mb-1.5">הנהג מתייצב בכתובת</h3>
              <p class="text-sm text-slate-600 leading-relaxed">מקבלים אישור שיבוץ עם פרטי הנהג ב-WhatsApp. בסיום הנסיעה משלמים בנוחות ב-Bit, PayBox, מזומן או אשראי.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Section 2: Fleet Showcase -->
      <section class="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <span class="text-xs font-extrabold uppercase tracking-wider text-amber-600">צי הרכבים שלנו</span>
            <h2 class="text-2xl sm:text-3xl font-black text-slate-900 mt-1">התאמה מושלמת לכל נסיעה וכמות מזוודות</h2>
          </div>
          <button onclick="window.scrollTo({top: 220, behavior: 'smooth'})" class="text-xs font-extrabold text-slate-900 bg-amber-400 hover:bg-amber-500 px-4 py-2.5 rounded-xl transition">
            חשב מחיר לפי סוג רכב 🚕
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          ${DATA.vehicleTiers.slice(0, 4).map(v => `
            <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-3">
                  <span class="text-3xl bg-slate-900 w-12 h-12 rounded-2xl flex items-center justify-center">${v.icon}</span>
                  <span class="text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900">${v.badge}</span>
                </div>
                <h3 class="font-black text-base text-slate-900">${v.name}</h3>
                <p class="text-xs font-bold text-emerald-700 mt-0.5">${v.subtitle}</p>
                <p class="text-xs text-slate-500 mt-2 leading-relaxed">${v.desc}</p>
              </div>
              <button onclick="window.primeApp.selectVehicle('${v.id}'); window.scrollTo({top: 240, behavior: 'smooth'});"
                class="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-extrabold transition">
                בחר רכב זה במחשבון
              </button>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- Section 3: Driver Recruitment Banner (גיוס נהגים לתחנה לעמלות) -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div class="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-10 border border-amber-400/40 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
          <div class="max-w-2xl">
            <span class="inline-block text-xs font-extrabold px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-3">
              🚖 לנהגי מוניות, סטיישן ומיניוואנים מכל הארץ
            </span>
            <h2 class="text-2xl sm:text-3xl font-black">רוצה לקבל נסיעות לנתב״ג ונסיעות בינעירוניות ישירות ל-WhatsApp?</h2>
            <p class="text-slate-300 text-sm sm:text-base mt-2 leading-relaxed">
              הצטרף למאגר הנהגים של <strong>${settings.brandNameHe}</strong> בהנהלת טל ואליהו! קבל התראות על נסיעות פנויות באזורך ללא דמי מנוי חודשיים — משלמים עמלה הוגנת ב-Bit או PayBox רק על נסיעה שלקחת.
            </p>
          </div>
          <div class="shrink-0 w-full lg:w-auto">
            <a href="https://wa.me/${formatCleanIntlPhone(settings.whatsappPhone)}?text=${encodeURIComponent('שלום טל ואליהו, אני נהג מונית ומעוניין להצטרף לקבוצת הנסיעות של ' + settings.brandNameHe + ' 🚕')}"
              target="_blank"
              class="w-full lg:w-auto gold-button px-7 py-4 rounded-2xl text-sm sm:text-base font-black flex items-center justify-center gap-2.5">
              <span>📲</span>
              <span>הצטרף כנהג ב-WhatsApp</span>
            </a>
          </div>
        </div>
      </section>

      <!-- Section 4: FAQ & Customer Confidence -->
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <h2 class="text-xl sm:text-2xl font-black text-slate-900 mb-5 text-center">שאלות נפוצות — כל מה שחשוב לדעת לפני הנסיעה</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <div class="font-black text-slate-900 mb-1">✈️ מה קורה אם הטיסה שלי לנתב״ג מתעכבת או מקדימה?</div>
            <p class="text-slate-600 text-xs leading-relaxed">כשמזינים מספר טיסה בטופס האיסוף מנתב״ג, המוקד והנהג עוקבים אחרי זמן הנחיתה בזמן אמת וממתינים לכם ביציאה מהטרמינל ללא חיוב על עיכובי טיסה.</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <div class="font-black text-slate-900 mb-1">🧳 כמה מזוודות נכנסות במונית רגילה ומתי צריך סטיישן או מיניוואן?</div>
            <p class="text-slate-600 text-xs leading-relaxed">במונית סדאן רגילה נכנסות עד 3 מזוודות גדולות. עבור 4 מזוודות המחשבון ישדרג אתכם אוטומטית למונית סטיישן, ועבור 5–6 נוסעים או כבודה מרובה למיניוואן מרווח.</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <div class="font-black text-slate-900 mb-1">👶 האם אפשר להזמין מונית עם סלקל, כיסא בטיחות או בוסטר?</div>
            <p class="text-slate-600 text-xs leading-relaxed">בוודאי! סמנו במחשבון "סלקל / כיסא תינוק / בוסטר" והנהג יגיע עם מושב בטיחות תקני ומותקן מראש.</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-slate-200">
            <div class="font-black text-slate-900 mb-1">💳 באילו אמצעי תשלום ניתן לשלם?</div>
            <p class="text-slate-600 text-xs leading-relaxed">ניתן לשלם ב-Bit (ביט), PayBox (פייבוקס), מזומן ישירות לנהג או כרטיס אשראי בתיאום מול המוקד.</p>
          </div>
        </div>
      </section>
    `;
  }

  // --- Full National & Airport Pricelist View ---
  function renderPricelistView() {
    const allCities = getAllCities();
    const regions = ['all', ...new Set(allCities.map(c => c.region))];

    const filtered = allCities.filter(c => {
      const matchesRegion = state.priceRegionFilter === 'all' || c.region === state.priceRegionFilter;
      const matchesQuery = !state.priceSearchQuery || c.name.includes(state.priceSearchQuery) || c.region.includes(state.priceSearchQuery);
      return matchesRegion && matchesQuery;
    });

    return `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 mb-8 border border-amber-500/30 shadow-xl">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span class="text-xs font-extrabold text-amber-400 uppercase tracking-wider">מחירון רשמי ושקוף — ${settings.brandNameHe}</span>
              <h1 class="text-2xl sm:text-4xl font-black mt-1">מחירון מוניות לנתב״ג ונסיעות בינעירוניות</h1>
              <p class="text-slate-300 text-sm mt-1">כל המחירים קבועים וידועים מראש. לחיצה על כל עיר תפתח מיד את מחשבון ההזמנה עם המחיר המדויק.</p>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <input type="text" value="${state.priceSearchQuery}" placeholder="🔍 חפש עיר או יישוב..."
                oninput="window.primeApp.setPriceSearch(this.value)"
                class="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none" />
              <select onchange="window.primeApp.setPriceRegion(this.value)"
                class="rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none">
                <option value="all">כל האזורים בארץ (${allCities.length} יישובים)</option>
                ${regions.filter(r => r !== 'all').map(r => `
                  <option value="${r}" ${state.priceRegionFilter === r ? 'selected' : ''}>${r}</option>
                `).join('')}
              </select>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-3xl shadow-lg border border-slate-200 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-right border-collapse">
              <thead>
                <tr class="bg-slate-900 text-amber-300 text-xs uppercase font-extrabold">
                  <th class="py-4 px-5">יישוב / עיר</th>
                  <th class="py-4 px-4">אזור</th>
                  <th class="py-4 px-4">מרחק לנתב״ג</th>
                  <th class="py-4 px-4">☀️ תעריף יום לנתב״ג</th>
                  <th class="py-4 px-4">🌙 תעריף לילה / סופ״ש</th>
                  <th class="py-4 px-4">🚐 מיניוואן 6 מקומות</th>
                  <th class="py-4 px-5 text-left">הזמנה מהירה</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200 text-sm">
                ${filtered.map(c => {
                  const minivanPrice = Math.round((c.airportDay * 1.45) / 5) * 5;
                  return `
                    <tr class="hover:bg-amber-50/50 transition">
                      <td class="py-3.5 px-5 font-black text-slate-900">${c.name}</td>
                      <td class="py-3.5 px-4 text-xs text-slate-500 font-bold">${c.region}</td>
                      <td class="py-3.5 px-4 text-xs text-slate-600">${c.kmAirport} ק״מ (~${c.etaAirportMin} דק׳)</td>
                      <td class="py-3.5 px-4 font-black text-emerald-700 text-base">₪${c.airportDay}</td>
                      <td class="py-3.5 px-4 font-bold text-indigo-900">₪${c.airportNight}</td>
                      <td class="py-3.5 px-4 font-bold text-slate-700">₪${minivanPrice}</td>
                      <td class="py-3.5 px-5 text-left">
                        <button onclick="window.primeApp.selectQuickRoute('${c.id}', 'to_airport')"
                          class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl transition shadow-sm">
                          הזמן עכשיו 🚕
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    `;
  }

  // --- Taxi Driver Live Portal (מכרז נסיעות חי, תפיסת נסיעה, תשלום עמלה ב-Bit/PayBox ופתיחת פרטי לקוח) ---
  function renderDriverView() {
    const drv = activeDriver || (drivers && drivers[0]) || {
      id: 'drv-guest',
      name: 'נהג אורח (הירשם ב-10 שניות)',
      phone: '',
      vehicleName: 'מונית סדאן 4 מקומות',
      plateNumber: '',
      region: 'נתב״ג וגוש דן',
      status: 'available_airport',
      statusLabel: '✈️ זמין לנסיעות'
    };

    const openOrders = orders.filter(o => o.status === 'new' || o.status === 'broadcasted');
    const myClaimedOrders = orders.filter(
      o => (o.status === 'assigned' || o.status === 'paid') &&
           (o.assignedDriverPhone === drv.phone || o.assignedDriverName === drv.name || state.driverFilter === 'my_rides')
    );
    const totalMyNet = myClaimedOrders.reduce((s, o) => s + Number(o.driverNet || 0), 0);

    let filteredOpen = openOrders;
    if (state.driverFilter === 'airport') {
      filteredOpen = openOrders.filter(o => o.serviceType === 'to_airport' || o.serviceType === 'from_airport');
    } else if (state.driverFilter === 'intercity') {
      filteredOpen = openOrders.filter(o => o.serviceType === 'intercity');
    } else if (state.driverFilter === 'delivery') {
      filteredOpen = openOrders.filter(o => o.serviceType === 'delivery');
    }

    const activeDispatcherName = settings.whatsappPhone === '050-7676946' ? 'אליהו (שותף)' : 'טל פרדקין';
    const activeDispatcherPhone = settings.bitPhone || settings.whatsappPhone || '054-6373001';

    return `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <!-- Driver Hero & Status Control -->
        <div class="bg-gradient-to-l from-slate-950 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 border border-emerald-500/40 shadow-2xl">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-extrabold mb-2">
                <span>🚖 פורטל נהגי מוניות ומיניבוסים — ${settings.brandNameHe}</span>
                <span>•</span>
                <span>סנכרון ענן חי (${state.lastCloudSyncAt})</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black">לוח מכרז נסיעות חי לנתב״ג ובינעירוני</h1>
              <p class="text-slate-300 text-sm mt-1">
                תפוס נסיעה בלחיצה אחת, העבר <strong>${settings.defaultCommissionPct}% עמלת תחנה</strong> ב-Bit או PayBox למוקדן הפעיל (<strong>${activeDispatcherName}: <span dir="ltr">${activeDispatcherPhone}</span></strong>), וקבל מיד את מספר הטלפון של הלקוח וניווט Waze לכתובת האיסוף!
              </p>
            </div>

            <div class="flex flex-wrap gap-2 shrink-0">
              <button onclick="window.primeApp.openDriverProfileModal()"
                class="gold-button px-4 py-3 rounded-2xl text-xs sm:text-sm font-black cursor-pointer flex items-center gap-2">
                <span>🪪</span>
                <span>עדכן פרטי נהג / החלף נהג</span>
              </button>
              <button onclick="window.primeApp.refreshCloudNow()"
                class="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs sm:text-sm font-bold cursor-pointer">
                🔄 רענן נסיעות מהענן
              </button>
            </div>
          </div>

          <!-- Active Driver Identity & Quick Switcher -->
          <div class="mt-5 pt-5 border-t border-emerald-800/60 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            <div class="lg:col-span-7 bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="text-xs text-emerald-300 font-extrabold">נהג מחובר כעת במכשיר זה:</div>
                <div class="text-lg font-black text-white mt-0.5">🚖 ${drv.name} <span dir="ltr" class="text-sm text-amber-300 font-mono">(${drv.phone || 'ללא טלפון'})</span></div>
                <div class="text-xs text-slate-300 mt-0.5">🚘 ${drv.vehicleName} ${drv.plateNumber ? `• מספר רישוי: ${drv.plateNumber}` : ''} • 📍 ${drv.region}</div>
              </div>
              <div class="flex flex-col gap-1.5 shrink-0">
                <select onchange="window.primeApp.updateDriverAvailability(this.value)"
                  class="rounded-xl bg-emerald-500 text-slate-950 font-black text-xs px-3 py-2.5 outline-none cursor-pointer">
                  <option value="available_airport" ${drv.status === 'available_airport' ? 'selected' : ''}>✈️ פנוי עכשיו בנתב״ג (טרמינל 3)</option>
                  <option value="available" ${drv.status === 'available' ? 'selected' : ''}>🟢 פנוי לנסיעות באזור שלי</option>
                  <option value="busy" ${drv.status === 'busy' ? 'selected' : ''}>🟡 בנסיעה כרגע (זמין להזמנה עתידית)</option>
                  <option value="offline" ${drv.status === 'offline' ? 'selected' : ''}>🔴 לא פנוי כרגע (בהפסקה)</option>
                </select>
              </div>
            </div>

            <div class="lg:col-span-5 grid grid-cols-3 gap-2.5 text-center">
              <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                <span class="text-[11px] text-slate-400 block">נסיעות פתוחות לתפיסה</span>
                <span class="text-2xl font-black text-emerald-400 mt-0.5 block">${openOrders.length}</span>
              </div>
              <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                <span class="text-[11px] text-slate-400 block">נסיעות שתפסתי</span>
                <span class="text-2xl font-black text-amber-400 mt-0.5 block">${myClaimedOrders.length}</span>
              </div>
              <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-3">
                <span class="text-[11px] text-slate-400 block">נטו לכיס שלי</span>
                <span class="text-2xl font-black text-white mt-0.5 block">₪${totalMyNet.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <!-- Quick Demo Driver Switcher Bar -->
          <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span class="text-slate-400 font-bold">החלפה מהירה לבדיקת נהגים במאגר:</span>
            ${drivers.map(d => `
              <button onclick="window.primeApp.selectActiveDriver('${d.id}')"
                class="px-3 py-1 rounded-xl font-bold transition cursor-pointer ${drv.id === d.id ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'}">
                🚖 ${d.name} (${d.vehicleName.split(' ')[0]})
              </button>
            `).join('')}
          </div>

          <!-- Driver Video Guides & Car Flag Kit Banner -->
          <div class="mt-4 pt-4 border-t border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/70 p-3.5 rounded-2xl border border-amber-400/30">
            <div class="flex items-center gap-2.5">
              <span class="text-2xl">🎬</span>
              <div>
                <div class="text-xs font-black text-amber-300">סרטוני הדרכה לנהגים + דגל לרכב ומגנט רשמי של התחנה</div>
                <div class="text-[11px] text-slate-300">צפה איך תופסים נסיעה בפורטל, איך מעבירים עמלה ב-Bit/PayBox ואיך מקבלים ערכת דגל לרכב</div>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 shrink-0">
              <button onclick="window.primeApp.openVideoReelShortcut('driver_login_claim')"
                class="px-3 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black cursor-pointer">
                ▶️ איך מתחברים ותופסים נסיעה
              </button>
              <button onclick="window.primeApp.openVideoReelShortcut('driver_bit_unlock')"
                class="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer">
                💸 תשלום עמלה בביט ופתיחת לקוח
              </button>
              <button onclick="window.primeApp.openMerchShortcut()"
                class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-400/40 text-xs font-bold cursor-pointer">
                🚩 דגל לרכב וערכת נהג
              </button>
            </div>
          </div>
        </div>

        <!-- My Claimed Rides (Commission Payment & Customer Unlock) -->
        ${myClaimedOrders.length > 0 ? `
          <div class="bg-amber-50/90 border-2 border-amber-400 rounded-3xl p-5 sm:p-6 shadow-md space-y-4">
            <div class="flex items-center justify-between border-b border-amber-200 pb-3">
              <div>
                <span class="text-xs font-extrabold text-amber-800 uppercase">הנסיעות המשובצות אליך</span>
                <h2 class="text-xl font-black text-slate-900">📲 הנסיעות שתפסת — תשלום עמלה ב-Bit/PayBox ופרטי לקוח</h2>
              </div>
              <span class="px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black">${myClaimedOrders.length} נסיעות שלך</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${myClaimedOrders.map(order => {
                const isUnlocked = order.status === 'paid';
                return `
                  <div class="bg-white rounded-2xl p-5 border-2 ${isUnlocked ? 'border-emerald-500' : 'border-amber-400'} shadow-sm space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="bg-slate-900 text-amber-400 font-black text-xs px-3 py-1 rounded-lg">נסיעה #${order.id}</span>
                      <span class="text-xs font-black px-2.5 py-1 rounded-full ${isUnlocked ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}">
                        ${isUnlocked ? '✅ עמלה שולמה — פרטי לקוח פתוחים!' : `⏳ ממתין להעברת עמלה (₪${order.commissionAmount})`}
                      </span>
                    </div>

                    <div class="text-sm font-black text-slate-900">
                      📍 איסוף: ${order.originLabel} <br/>
                      🏁 יעד: ${order.destLabel}
                    </div>
                    <div class="text-xs text-slate-600 font-bold">
                      🕒 שעה: ${order.pickupTimeLabel} | 👥 ${order.passengers} נוסעים | 🧳 ${order.suitcases} מזוודות | 🚘 ${order.vehicleName}
                    </div>

                    <div class="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
                      <div>
                        <span class="text-slate-500 block">גבייה מלקוח</span>
                        <span class="font-black text-slate-900 text-base">₪${order.totalPrice}</span>
                      </div>
                      <div>
                        <span class="text-rose-600 font-bold block">עמלת תחנה (${order.commissionPct}%)</span>
                        <span class="font-black text-rose-600 text-base">₪${order.commissionAmount}</span>
                      </div>
                      <div>
                        <span class="text-emerald-700 font-bold block">נטו לכיס שלך</span>
                        <span class="font-black text-emerald-700 text-base">₪${order.driverNet}</span>
                      </div>
                    </div>

                    ${isUnlocked ? `
                      <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 space-y-2.5">
                        <div class="text-xs font-black text-emerald-950">🔓 פרטי הלקוח המלאים פתוחים עבורך:</div>
                        <div class="text-sm font-black text-slate-900">
                          👤 שם הלקוח: ${order.customerName} | 📞 טלפון: <a href="tel:${order.customerPhone}" dir="ltr" class="underline text-emerald-700">${order.customerPhone}</a>
                        </div>
                        <div class="text-xs font-bold text-slate-700">💳 אמצעי תשלום של הלקוח: ${order.paymentMethod}</div>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                          <a href="tel:${order.customerPhone}"
                            class="py-2.5 px-3 rounded-xl bg-slate-900 text-white font-black text-xs text-center flex items-center justify-center gap-1.5">
                            📞 חייג ללקוח
                          </a>
                          <a href="https://wa.me/${formatCleanIntlPhone(order.customerPhone)}?text=${encodeURIComponent(`שלום ${order.customerName}, אני ${drv.name} נהג המונית שלך מתחנת ${settings.brandNameHe} (${drv.vehicleName}). הנסיעה שלך (#${order.id}) משובצת אליי ואני זמין עבורך!`)}" target="_blank"
                            class="py-2.5 px-3 rounded-xl whatsapp-cta-btn font-black text-xs text-center flex items-center justify-center gap-1.5">
                            💬 WhatsApp ללקוח
                          </a>
                          <a href="https://waze.com/ul?q=${encodeURIComponent(order.originLabel)}&navigate=yes" target="_blank"
                            class="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-black text-xs text-center flex items-center justify-center gap-1.5">
                            🗺️ נווט ב-Waze
                          </a>
                        </div>
                      </div>
                    ` : `
                      <div class="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-2.5">
                        <div class="text-xs font-black text-amber-950">
                          🔒 לקבלת טלפון הלקוח ופתיחת ניווט Waze, העבר כעת עמלה של <span class="text-rose-600 underline">₪${order.commissionAmount}</span> ב-Bit או PayBox למספר <span dir="ltr" class="font-mono font-black">${activeDispatcherPhone}</span> (${activeDispatcherName}):
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <a href="https://wa.me/${formatCleanIntlPhone(activeDispatcherPhone)}?text=${encodeURIComponent(`אהלן ${activeDispatcherName}, כאן הנהג ${drv.name} (${drv.phone}). תפסתי את נסיעה #${order.id} (${order.originLabel} -> ${order.destLabel}) והעברתי עכשיו עמלה של ₪${order.commissionAmount} בביט/פייבוקס!`)}" target="_blank"
                            class="py-2.5 px-3 rounded-xl whatsapp-cta-btn font-black text-xs text-center flex items-center justify-center gap-1.5">
                            💸 שלח אישור העברת ביט ב-WhatsApp
                          </a>
                          <button onclick="window.primeApp.driverConfirmCommissionPaid('${order.id}')"
                            class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs cursor-pointer">
                            ✅ העברתי עמלה — פתח לי פרטי לקוח!
                          </button>
                        </div>
                      </div>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Open Rides Filter Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap gap-2">
            ${[
              { id: 'all', label: `🔥 כל הנסיעות הפנויות (${openOrders.length})` },
              { id: 'airport', label: '✈️ נתב״ג (המראות ונחיתות)' },
              { id: 'intercity', label: '🛣️ בינעירוני ספיישל' },
              { id: 'delivery', label: '📦 משלוחים אקספרס' }
            ].map(f => `
              <button onclick="window.primeApp.setDriverFilter('${f.id}')"
                class="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition cursor-pointer ${state.driverFilter === f.id ? 'bg-slate-900 text-amber-400 shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}">
                ${f.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Open Rides Cards Grid -->
        ${filteredOpen.length === 0 ? `
          <div class="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
            <div class="text-4xl mb-2">🚕</div>
            <h3 class="text-lg font-black text-slate-900">אין כרגע נסיעות פנויות בסינון זה</h3>
            <p class="text-xs text-slate-500 mt-1">כל נסיעה חדשה שמזמין לקוח באתר מופיעה כאן אוטומטית תוך שניות!</p>
          </div>
        ` : `
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            ${filteredOpen.map(order => {
              const safeOriginCityOnly = String(order.originLabel || '').split('(')[0].trim();
              const safeDestCityOnly = String(order.destLabel || '').split('(')[0].trim();
              return `
                <div class="bg-white rounded-3xl p-6 border-2 border-slate-200 hover:border-emerald-500 transition shadow-sm flex flex-col justify-between gap-4">
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <span class="bg-slate-900 text-amber-400 font-black text-xs px-3 py-1 rounded-xl">#${order.id}</span>
                        <span class="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-full">פנוי לתפיסה מיידית 🔥</span>
                      </div>
                      <span class="text-xs font-bold text-slate-500">🕒 ${order.pickupTimeLabel}</span>
                    </div>

                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                      <div class="text-base font-black text-slate-900">📍 איסוף מאזור: ${safeOriginCityOnly}</div>
                      <div class="text-base font-black text-indigo-950">🏁 יעד: ${safeDestCityOnly}</div>
                      <div class="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg inline-block">
                        🔒 כתובת מדויקת וטלפון הלקוח ייפתחו מיד לאחר תפיסת הנסיעה
                      </div>
                    </div>

                    <div class="flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                      <span class="px-2.5 py-1 rounded-lg bg-slate-100">🚘 ${order.vehicleName}</span>
                      <span class="px-2.5 py-1 rounded-lg bg-slate-100">👥 ${order.passengers} נוסעים</span>
                      <span class="px-2.5 py-1 rounded-lg bg-slate-100">🧳 ${order.suitcases} מזוודות</span>
                      <span class="px-2.5 py-1 rounded-lg bg-slate-100">✨ ${order.extrasSummary}</span>
                    </div>
                  </div>

                  <div class="space-y-3 pt-3 border-t border-slate-100">
                    <div class="grid grid-cols-3 gap-2 bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-center">
                      <div>
                        <span class="text-[11px] text-slate-500 font-bold block">מחיר מלקוח</span>
                        <span class="text-lg font-black text-slate-900">₪${order.totalPrice}</span>
                      </div>
                      <div>
                        <span class="text-[11px] text-rose-600 font-bold block">עמלת תחנה (${order.commissionPct}%)</span>
                        <span class="text-lg font-black text-rose-600">₪${order.commissionAmount}</span>
                      </div>
                      <div>
                        <span class="text-[11px] text-emerald-800 font-extrabold block">💰 נטו לנהג</span>
                        <span class="text-xl font-black text-emerald-700">₪${order.driverNet}</span>
                      </div>
                    </div>

                    <button onclick="window.primeApp.driverClaimOrder('${order.id}')"
                      class="w-full whatsapp-cta-btn py-3.5 px-5 rounded-2xl text-sm font-black cursor-pointer flex items-center justify-center gap-2 shadow-md">
                      <span>✋</span>
                      <span>תפוס נסיעה זו עכשיו (רווח נטו: ₪${order.driverNet})</span>
                    </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </section>
    `;
  }

  // --- Tal & Eliyahu Dispatcher, WhatsApp Driver Broadcast & Bit/PayBox Commission Studio ---
  function renderAdminView() {
    if (!isSuperAdminUser(currentUser)) {
      return `
        <section class="max-w-xl mx-auto px-4 py-16 text-center">
          <div class="bg-slate-950 text-white rounded-3xl p-8 border border-amber-500/40 shadow-2xl">
            <img src="./public/assets/logo-modern.jpg" class="w-20 h-20 rounded-2xl mx-auto mb-4 border-2 border-amber-400" />
            <span class="text-xs font-extrabold text-amber-400 uppercase tracking-wider">אזור מוגן — הנהלת התחנה</span>
            <h2 class="text-2xl font-black mt-1 mb-2">כניסת מנהלים ושותפים (טל ואליהו)</h2>
            <p class="text-sm text-slate-300 mb-6">גישה למערכת הסדרן, הפצת נסיעות לקבוצות נהגים, מעקב עמלות ב-Bit/PayBox, מאגר נהגים ודוחות רווחיות שמורה לבעלי התחנה בלבד.</p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button onclick="window.primeApp.quickPartnerLogin('tal')"
                class="py-3.5 px-4 rounded-2xl gold-button text-slate-950 text-sm font-black cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                <span>👑 כניסה מהירה: טל פרדקין</span>
              </button>
              <button onclick="window.primeApp.quickPartnerLogin('eliyahu')"
                class="py-3.5 px-4 rounded-2xl whatsapp-cta-btn text-white text-sm font-black cursor-pointer flex items-center justify-center gap-2 shadow-lg">
                <span>👑 כניסה מהירה: אליהו (שותף)</span>
              </button>
            </div>
            <button onclick="window.primeApp.openAuthModal('')"
              class="w-full py-3 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold cursor-pointer">
              🔐 או התחבר עם קוד אימות לטלפון / שם משתמש
            </button>
          </div>
        </section>
      `;
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const totalCommissions = orders.reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
    const paidCommissions = orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
    const availableDriversCount = drivers.filter(d => d.status === 'available' || d.status === 'available_airport').length;

    return `
      <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Studio Header Banner -->
        <div class="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 mb-6 border border-amber-500/30 shadow-xl">
          <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-extrabold mb-2">
                <span>👑</span>
                <span>מחובר כרגע: ${currentUser.name} (${currentUser.badge || 'מנהל ראשי ושותף'})</span>
                <span>•</span>
                <span class="text-emerald-300">☁️ ענן AWS מסונכרן (${state.lastCloudSyncAt})</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black">מרכז שליטה, סדרן נהגים, עמלות וניתוחים — טל ואליהו</h1>
              <p class="text-slate-300 text-sm mt-1">
                כל נסיעה מהאתר וכל תפיסת נסיעה של נהג מתעדכנות כאן בזמן אמת. תוכל להוציא מכרז לקבוצת הנהגים ב-WhatsApp, לשבץ נהג זמין מהמאגר ולגבות <strong>${settings.defaultCommissionPct}% עמלה</strong> ב-Bit או PayBox למספר <strong>${settings.bitPhone}</strong>.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button onclick="window.primeApp.openQuickManualOrderModal()"
                class="gold-button px-4 py-3 rounded-2xl text-sm font-black flex items-center gap-2 cursor-pointer">
                <span>➕</span>
                <span>הזן נסיעה חדשה ידנית</span>
              </button>
              <button onclick="window.primeApp.refreshCloudNow()"
                class="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold cursor-pointer">
                🔄 סנכרן עכשיו
              </button>
            </div>
          </div>

          <!-- Active Partner Dispatcher Switcher (Tal <-> Eliyahu) -->
          <div class="mt-5 pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div>
              <span class="text-xs font-extrabold text-amber-400 block">📲 מוקדן פעיל לקבלת הזמנות WhatsApp והעברות עמלה ב-Bit/PayBox:</span>
              <span class="text-xs text-slate-300">החלף בלחיצה אחת לאיזה מספר טלפון יישלחו ההזמנות של הלקוחות והעמלות של הנהגים:</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button onclick="window.primeApp.switchActivePartner('tal')"
                class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${settings.whatsappPhone === '054-6373001' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                👑 משמרת טל פרדקין (054-6373001)
              </button>
              <button onclick="window.primeApp.switchActivePartner('eliyahu')"
                class="px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${settings.whatsappPhone === '050-7676946' ? 'bg-amber-400 text-slate-950 shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">
                👑 משמרת אליהו — שותף (050-7676946)
              </button>
            </div>
          </div>

          <!-- KPI Cards -->
          <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5">
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <span class="text-xs text-slate-400 block">סה״כ הזמנות</span>
              <span class="text-2xl sm:text-3xl font-black text-white mt-1 block">${totalOrders}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <span class="text-xs text-slate-400 block">היקף נסיעות ברוטו</span>
              <span class="text-2xl sm:text-3xl font-black text-amber-400 mt-1 block">₪${totalRevenue.toLocaleString()}</span>
            </div>
            <div class="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4">
              <span class="text-xs text-amber-300 font-bold block">עמלות תחנה (${settings.defaultCommissionPct}%)</span>
              <span class="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">₪${totalCommissions.toLocaleString()}</span>
            </div>
            <div class="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
              <span class="text-xs text-slate-400 block">נגבו ב-Bit/PayBox</span>
              <span class="text-2xl sm:text-3xl font-black text-sky-400 mt-1 block">₪${paidCommissions.toLocaleString()}</span>
            </div>
            <div class="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 col-span-2 sm:col-span-1">
              <span class="text-xs text-emerald-300 font-bold block">נהגים זמינים כעת</span>
              <span class="text-2xl sm:text-3xl font-black text-emerald-400 mt-1 block">${availableDriversCount}/${drivers.length}</span>
            </div>
          </div>
        </div>

        <!-- Admin Sub-navigation -->
        <div class="flex flex-wrap gap-2 mb-6">
          ${[
            { id: 'orders', label: '📲 יומן נסיעות ושיבוץ נהגים', count: orders.length },
            { id: 'drivers', label: '🚖 מאגר נהגים וזמינות חיה', count: drivers.length },
            { id: 'marketing', label: '🎬 סטודיו פרסום, סרטונים, פוסטים ודגל לרכב', count: 8 },
            { id: 'analytics', label: '📊 ניתוחים ודוחות רווחיות (BI)' },
            { id: 'pricing', label: '💰 עריכת מחירון ואחוזי עמלה' },
            { id: 'branding', label: '🎨 מיתוג ולוגו' },
            { id: 'auth_servers', label: '🔐 שותפים, ענן AWS ושרתי SMS' }
          ].map(tab => `
            <button onclick="window.primeApp.setAdminTab('${tab.id}')"
              class="px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition flex items-center gap-2 cursor-pointer ${state.adminTab === tab.id ? 'bg-slate-900 text-amber-400 shadow-md' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'}">
              <span>${tab.label}</span>
              ${tab.count !== undefined ? `<span class="bg-amber-400 text-slate-950 text-xs font-black px-2 py-0.5 rounded-full">${tab.count}</span>` : ''}
            </button>
          `).join('')}
        </div>

        ${state.adminTab === 'orders' ? renderAdminOrdersTab() : ''}
        ${state.adminTab === 'drivers' ? renderAdminDriversTab() : ''}
        ${state.adminTab === 'marketing' ? (window.PRIME_TAXI_MARKETING ? window.PRIME_TAXI_MARKETING.renderView(settings) : '') : ''}
        ${state.adminTab === 'analytics' ? renderAdminAnalyticsTab() : ''}
        ${state.adminTab === 'auth_servers' ? renderAdminAuthServersTab() : ''}
        ${state.adminTab === 'branding' ? renderAdminBrandingTab() : ''}
        ${state.adminTab === 'pricing' ? renderAdminPricingTab() : ''}
      </section>
    `;
  }

  function renderAdminOrdersTab() {
    const statusBadges = {
      new: { label: 'חדש — ממתין להפצה', cls: 'bg-rose-100 text-rose-800 border-rose-300' },
      broadcasted: { label: 'פורסם בקבוצת נהגים', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
      assigned: { label: 'שובץ לנהג — ממתין לעמלה', cls: 'bg-sky-100 text-sky-900 border-sky-300' },
      paid: { label: 'בוצע + עמלה שולמה בביט/פייבוקס ✅', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
    };

    const counts = {
      all: orders.length,
      new: orders.filter(o => o.status === 'new').length,
      broadcasted: orders.filter(o => o.status === 'broadcasted').length,
      assigned: orders.filter(o => o.status === 'assigned').length,
      paid: orders.filter(o => o.status === 'paid').length
    };

    const q = (state.adminOrderSearch || '').trim().toLowerCase();
    const filteredOrders = orders.filter(o => {
      if (state.adminOrderStatusFilter !== 'all' && o.status !== state.adminOrderStatusFilter) return false;
      if (!q) return true;
      return (
        String(o.id || '').toLowerCase().includes(q) ||
        String(o.customerName || '').toLowerCase().includes(q) ||
        String(o.customerPhone || '').toLowerCase().includes(q) ||
        String(o.originLabel || '').toLowerCase().includes(q) ||
        String(o.destLabel || '').toLowerCase().includes(q) ||
        String(o.assignedDriverName || '').toLowerCase().includes(q)
      );
    });

    return `
      <!-- Dispatcher Filter, Search & Excel Export Toolbar -->
      <div class="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex flex-wrap gap-2">
          ${[
            { id: 'all', label: `הכל (${counts.all})` },
            { id: 'new', label: `🔥 חדשות (${counts.new})` },
            { id: 'broadcasted', label: `📢 במכרז נהגים (${counts.broadcasted})` },
            { id: 'assigned', label: `🚖 שובצו וממתינות לעמלה (${counts.assigned})` },
            { id: 'paid', label: `✅ שולמו בביט/פייבוקס (${counts.paid})` }
          ].map(f => `
            <button onclick="window.primeApp.setAdminOrderFilter('${f.id}')"
              class="px-3.5 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${state.adminOrderStatusFilter === f.id ? 'bg-slate-900 text-amber-400 shadow' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
              ${f.label}
            </button>
          `).join('')}
        </div>

        <div class="flex flex-wrap items-center gap-2.5">
          <input type="text" value="${state.adminOrderSearch || ''}" placeholder="🔍 חפש לפי שם לקוח, טלפון, עיר או #הזמנה..."
            oninput="window.primeApp.setAdminOrderSearch(this.value)"
            class="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-900 min-w-[230px] focus:border-amber-500 focus:outline-none" />
          <button onclick="window.primeApp.exportOrdersCsv()"
            class="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer">
            <span>📊</span>
            <span>ייצוא דוח ל-Excel / CSV</span>
          </button>
        </div>
      </div>

      <div class="space-y-4">
        ${filteredOrders.length === 0 ? `
          <div class="bg-white rounded-3xl p-10 text-center border border-slate-200">
            <div class="text-3xl mb-2">🚕</div>
            <div class="font-black text-slate-900">לא נמצאו הזמנות בסינון הנוכחי</div>
          </div>
        ` : filteredOrders.map(order => {
          const st = statusBadges[order.status] || statusBadges.new;
          return `
            <div class="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm hover:shadow-md transition">
              <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div class="flex flex-wrap items-center gap-2.5">
                  <span class="bg-slate-900 text-amber-400 font-black text-sm px-3 py-1 rounded-xl">#${order.id}</span>
                  <span class="text-xs font-extrabold px-3 py-1 rounded-full border ${st.cls}">${st.label}</span>
                  <span class="text-xs text-slate-500 font-bold">🕒 ${order.createdAt}</span>
                  <span class="text-xs font-extrabold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">${order.serviceLabel}</span>
                  ${order.assignedDriverName ? `
                    <span class="text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-lg">
                      🚖 נהג משובץ: ${order.assignedDriverName} (${order.assignedDriverPhone || ''})
                    </span>
                  ` : ''}
                </div>

                <!-- Price & Commission Breakdown Pill -->
                <div class="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200">
                  <div>
                    <span class="text-[11px] text-slate-500 block">מחיר ללקוח</span>
                    <span class="text-lg font-black text-slate-900">₪${order.totalPrice}</span>
                  </div>
                  <div class="text-slate-300">|</div>
                  <div>
                    <span class="text-[11px] text-emerald-700 font-bold block">עמלת תחנה (${order.commissionPct}%)</span>
                    <span class="text-lg font-black text-emerald-600">₪${order.commissionAmount}</span>
                  </div>
                  <div class="text-slate-300">|</div>
                  <div>
                    <span class="text-[11px] text-slate-500 block">נטו לנהג</span>
                    <span class="text-base font-bold text-slate-700">₪${order.driverNet}</span>
                  </div>
                </div>
              </div>

              <!-- Trip & Customer Info Grid -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 text-sm">
                <div class="bg-slate-50 p-3.5 rounded-2xl">
                  <span class="text-xs font-bold text-slate-400 block mb-1">מסלול ומועד איסוף</span>
                  <div class="font-bold text-slate-900">📍 מאיסוף: ${order.originLabel}</div>
                  <div class="font-bold text-slate-900 mt-0.5">🏁 ליעד: ${order.destLabel}</div>
                  <div class="text-xs font-extrabold text-amber-700 mt-1">🕒 מועד: ${order.pickupTimeLabel}</div>
                </div>

                <div class="bg-slate-50 p-3.5 rounded-2xl">
                  <span class="text-xs font-bold text-slate-400 block mb-1">רכב, נוסעים ותוספות</span>
                  <div class="font-bold text-slate-900">🚘 ${order.vehicleName}</div>
                  <div class="text-xs text-slate-600 mt-0.5">👥 ${order.passengers} נוסעים • 🧳 ${order.suitcases} מזוודות</div>
                  <div class="text-xs text-slate-600 mt-0.5">➕ ${order.extrasSummary}</div>
                </div>

                <div class="bg-amber-50/60 border border-amber-200/80 p-3.5 rounded-2xl">
                  <span class="text-xs font-bold text-amber-800 block mb-1">🔒 פרטי לקוח (חסוי מקבוצת הנהגים)</span>
                  <div class="font-black text-slate-900">👤 ${order.customerName}</div>
                  <div class="font-black text-slate-900 mt-0.5" dir="ltr">${order.customerPhone}</div>
                  <div class="text-xs text-slate-600 mt-0.5">💳 תשלום: ${order.paymentMethod}</div>
                </div>
              </div>

              <!-- Direct Driver Assignment Bar -->
              <div class="mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <span class="font-extrabold text-slate-700">🚖 שיבוץ ישיר לנהג מהמאגר (או החלפת נהג בקליק):</span>
                <div class="flex flex-wrap gap-1.5">
                  ${drivers.map(d => `
                    <button onclick="window.primeApp.assignDriverToOrder('${order.id}', '${d.id}')"
                      class="px-3 py-1.5 rounded-xl font-bold border transition cursor-pointer ${order.assignedDriverPhone === d.phone ? 'bg-emerald-600 text-white border-emerald-700 font-black' : 'bg-white hover:bg-amber-50 text-slate-800 border-slate-300'}">
                      ${order.assignedDriverPhone === d.phone ? '✓ ' : ''}${d.name} (${d.vehicleName.split(' ')[0]})
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- 3-Step Driver Dispatch & Commission Actions -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div class="flex flex-wrap gap-2">
                  <button onclick="window.primeApp.broadcastOrderToDrivers('${order.id}')"
                    class="bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                    <span>📢</span>
                    <span>1. שלח מכרז לקבוצת נהגים (ללא טלפון לקוח)</span>
                  </button>

                  <button onclick="window.primeApp.sendFullOrderToWinningDriver('${order.id}')"
                    class="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                    <span>🔐</span>
                    <span>2. שלח פרטי לקוח + Waze לנהג שזכה</span>
                  </button>

                  <button onclick="window.primeApp.confirmOrderToCustomer('${order.id}')"
                    class="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm transition cursor-pointer">
                    <span>✨</span>
                    <span>3. שלח אישור שיבוץ ללקוח</span>
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button onclick="window.primeApp.toggleOrderPaid('${order.id}')"
                    class="px-3.5 py-2 rounded-xl text-xs font-extrabold border transition cursor-pointer ${order.status === 'paid' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-sky-50 text-sky-900 border-sky-200 hover:bg-sky-100'}">
                    ${order.status === 'paid' ? '✅ העמלה שולמה בביט/פייבוקס' : `💸 סמן שקיבלת ₪${order.commissionAmount} בביט/פייבוקס`}
                  </button>
                  <button onclick="window.primeApp.deleteOrder('${order.id}')" title="מחק הזמנה"
                    class="px-2.5 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderAdminBrandingTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
          <h3 class="text-lg font-black text-slate-900">🎨 בחירת שם מותג, סגנון לוגו ומספרי תחנה</h3>
          <p class="text-xs text-slate-500">תוכל לבחור אחד משלושת הקונספטים שעיצבנו או להקליד כל שם מותג שתרצה — האתר וההודעות ב-WhatsApp יתעדכנו מיד.</p>

          <!-- Brand Presets -->
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-2">ערכות מיתוג מוכנות בלחיצה:</label>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              ${DATA.brandPresets.map(p => `
                <button type="button" onclick="window.primeApp.applyBrandPreset('${p.id}')"
                  class="p-3.5 rounded-2xl border text-right transition ${settings.brandNameHe === p.nameHe ? 'border-amber-500 bg-amber-50/70' : 'border-slate-200 hover:bg-slate-50'}">
                  <div class="font-black text-sm text-slate-900">${p.nameHe}</div>
                  <div class="text-[11px] font-bold text-amber-700">${p.nameEn}</div>
                </button>
              `).join('')}
            </div>
          </div>

          <!-- Logo Switcher -->
          <div>
            <label class="block text-xs font-bold text-slate-600 mb-2">בחר את סמל הלוגו של המערכת:</label>
            <div class="grid grid-cols-2 gap-4">
              <div onclick="window.primeApp.saveSettingField('logoStyle', 'crest')"
                class="cursor-pointer rounded-2xl p-4 border-2 flex items-center gap-3.5 ${settings.logoStyle === 'crest' ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200'}">
                <img src="./public/assets/logo-crest.jpg" class="w-16 h-16 rounded-2xl object-cover border border-amber-400" />
                <div>
                  <div class="font-black text-sm text-slate-900">סמל הכתר והכנפיים (מלכותי)</div>
                  <div class="text-xs text-slate-500">לוגו יוקרתי עם כתר, כוכב וכנפי זהב</div>
                </div>
              </div>

              <div onclick="window.primeApp.saveSettingField('logoStyle', 'modern')"
                class="cursor-pointer rounded-2xl p-4 border-2 flex items-center gap-3.5 ${settings.logoStyle === 'modern' ? 'border-amber-500 bg-amber-50/40' : 'border-slate-200'}">
                <img src="./public/assets/logo-modern.jpg" class="w-16 h-16 rounded-2xl object-cover border border-amber-400" />
                <div>
                  <div class="font-black text-sm text-slate-900">כוכב התנועה הגיאומטרי (הייטק)</div>
                  <div class="text-xs text-slate-500">לוגו מודרני חד ומינימליסטי</div>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">שם המותג בעברית</label>
              <input type="text" value="${settings.brandNameHe}"
                onchange="window.primeApp.saveSettingField('brandNameHe', this.value)"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">שם המותג באנגלית</label>
              <input type="text" value="${settings.brandNameEn}"
                onchange="window.primeApp.saveSettingField('brandNameEn', this.value)"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold" />
            </div>
            <div class="sm:col-span-2">
              <label class="block text-xs font-bold text-slate-600 mb-1">סלוגן תחתון בראש האתר</label>
              <input type="text" value="${settings.brandSlogan}"
                onchange="window.primeApp.saveSettingField('brandSlogan', this.value)"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">מספר WhatsApp לקבלת הזמנות</label>
              <input type="text" dir="ltr" value="${settings.whatsappPhone}"
                onchange="window.primeApp.saveSettingField('whatsappPhone', this.value)"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-right" />
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">מספר טלפון להעברת עמלות ב-Bit / PayBox</label>
              <input type="text" dir="ltr" value="${settings.bitPhone}"
                onchange="window.primeApp.saveSettingField('bitPhone', this.value)"
                class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-bold text-right" />
            </div>
          </div>
        </div>

        <div class="lg:col-span-5 bg-slate-900 text-white rounded-3xl p-6 border border-amber-500/30 space-y-4">
          <span class="text-xs font-extrabold text-amber-400 uppercase">איך העסק עובד חכם מהיום הראשון?</span>
          <h3 class="text-xl font-black">מודל "הכוכבים" + גזירת עמלות ב-WhatsApp</h3>
          <ol class="space-y-3 text-sm text-slate-200 list-decimal list-inside leading-relaxed">
            <li><strong>הלקוח מזמין באתר:</strong> בוחר עיר, נתב״ג או משלוח, מסמן מזוודות וסלקל ולוחץ על כפתור ה-WhatsApp הירוק.</li>
            <li><strong>ההזמנה נוחתת אצלך ב-WhatsApp:</strong> מסודרת עם כל הפרטים והמחיר הקבוע מראש.</li>
            <li><strong>מכרז מהיר בקבוצת הנהגים:</strong> בלחיצה אחת כאן בלשונית "סדרן", אתה מפיק הודעה לקבוצת הנהגים <strong>בלי הטלפון של הלקוח</strong> ועם ציון גובה העמלה (למשל 15%).</li>
            <li><strong>הנהג מעביר לך ביט/פייבוקס ומקבל את הלקוח:</strong> בלחיצה שנייה אתה שולח לנהג שזכה את הטלפון של הלקוח + קישור ניווט ב-Waze!</li>
          </ol>
        </div>
      </div>
    `;
  }

  function renderAdminPricingTab() {
    const allCities = getAllCities();
    return `
      <div class="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">אחוז עמלת תחנה מהנהגים (%)</label>
            <input type="number" min="5" max="35" value="${settings.defaultCommissionPct}"
              onchange="window.primeApp.saveSettingField('defaultCommissionPct', Number(this.value))"
              class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-black text-emerald-700" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">כמות מזוודות כלולות חינם במונית</label>
            <input type="number" min="0" max="6" value="${settings.freeSuitcasesIncluded}"
              onchange="window.primeApp.saveSettingField('freeSuitcasesIncluded', Number(this.value))"
              class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-black" />
          </div>
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1">הנחת סגירת הלוך-חזור (%)</label>
            <input type="number" min="0" max="25" value="${settings.roundTripDiscountPct}"
              onchange="window.primeApp.saveSettingField('roundTripDiscountPct', Number(this.value))"
              class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-black" />
          </div>
        </div>

        <div>
          <h3 class="text-base font-black text-slate-900 mb-3">עריכת מחירי בסיס לנתב״ג לפי עיר (מתעדכן מיד במחשבון האתר):</h3>
          <div class="overflow-x-auto max-h-96 border border-slate-200 rounded-2xl">
            <table class="w-full text-right text-sm">
              <thead class="bg-slate-900 text-amber-300 text-xs sticky top-0">
                <tr>
                  <th class="py-3 px-4">עיר</th>
                  <th class="py-3 px-4">אזור</th>
                  <th class="py-3 px-4">מחיר יום לנתב״ג (₪)</th>
                  <th class="py-3 px-4">מחיר לילה/סופ״ש (₪)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                ${allCities.map(c => `
                  <tr>
                    <td class="py-2.5 px-4 font-bold">${c.name}</td>
                    <td class="py-2.5 px-4 text-xs text-slate-500">${c.region}</td>
                    <td class="py-2.5 px-4">
                      <input type="number" value="${c.airportDay}" step="5"
                        onchange="window.primeApp.updateCityPrice('${c.id}', this.value, ${c.airportNight})"
                        class="w-24 rounded-lg border border-slate-300 px-2.5 py-1 font-bold text-emerald-700" />
                    </td>
                    <td class="py-2.5 px-4">
                      <input type="number" value="${c.airportNight}" step="5"
                        onchange="window.primeApp.updateCityPrice('${c.id}', ${c.airportDay}, this.value)"
                        class="w-24 rounded-lg border border-slate-300 px-2.5 py-1 font-bold text-indigo-900" />
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminDriversTab() {
    const statusMap = {
      available_airport: { label: '✈️ פנוי בנתב״ג עכשיו', cls: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
      available: { label: '🟢 פנוי לנסיעות', cls: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      busy: { label: '🟡 בנסיעה כרגע', cls: 'bg-amber-100 text-amber-900 border-amber-300' },
      offline: { label: '🔴 לא פנוי / הפסקה', cls: 'bg-slate-100 text-slate-600 border-slate-300' }
    };

    return `
      <div class="space-y-6">
        <div class="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 class="text-xl font-black text-slate-900">🚖 מאגר נהגי התחנה וזמינות בזמן אמת (${drivers.length} נהגים)</h3>
            <p class="text-xs text-slate-500 mt-1">כל נהג שנרשם בפורטל הנהגים או מעדכן סטטוס ("פנוי בנתב״ג") מופיע כאן מיד עם כפתור שיבוץ ו-WhatsApp ישיר</p>
          </div>
          <button onclick="window.primeApp.openDriverProfileModal(true)"
            class="gold-button px-4 py-3 rounded-2xl text-xs font-black cursor-pointer shrink-0">
            ➕ הוסף נהג חדש למאגר התחנה
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${drivers.map(d => {
            const st = statusMap[d.status] || statusMap.available;
            return `
              <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between gap-4">
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-lg font-black text-slate-900">🚖 ${d.name}</span>
                      <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${st.cls}">${st.label}</span>
                    </div>
                    <div class="text-xs font-bold text-slate-600 mt-1">
                      📞 טלפון: <a href="tel:${d.phone}" dir="ltr" class="font-black text-slate-900 underline">${d.phone}</a> | 📍 אזור: ${d.region}
                    </div>
                    <div class="text-xs font-bold text-indigo-900 mt-1">
                      🚘 ${d.vehicleName} ${d.plateNumber ? `• רישוי: <span class="font-mono">${d.plateNumber}</span>` : ''}
                    </div>
                  </div>
                  <div class="text-left shrink-0">
                    <span class="text-[11px] text-slate-400 block">עמלות ששילם</span>
                    <span class="text-lg font-black text-emerald-700">₪${Number(d.totalCommissionsPaid || 0).toLocaleString()}</span>
                    <span class="text-[10px] text-slate-500 block">${d.completedRides || 0} נסיעות</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
                  <a href="https://wa.me/${formatCleanIntlPhone(d.phone)}?text=${encodeURIComponent(`אהלן ${d.name}, כאן מוקד ${settings.brandNameHe}. יש לנו נסיעה חדשה שמתאימה לך — פנוי לקחת?`)}" target="_blank"
                    class="flex-1 py-2.5 px-3 rounded-xl whatsapp-cta-btn text-xs font-black text-center">
                    💬 שלח הודעה לנהג ב-WhatsApp
                  </a>
                  <button onclick="window.primeApp.selectActiveDriver('${d.id}'); window.primeApp.setView('driver');"
                    class="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer">
                    👁️ צפה בפורטל כנהג זה
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderAdminAnalyticsTab() {
    const totalOrders = orders.length || 1;
    const totalRevenue = orders.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
    const totalComm = orders.reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
    const paidComm = orders.filter(o => o.status === 'paid').reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
    const pendingComm = totalComm - paidComm;
    const avgOrderPrice = Math.round(totalRevenue / totalOrders);
    const avgComm = Math.round(totalComm / totalOrders);
    const partnerShareEach = Math.round(totalComm / 2);

    const byType = [
      { id: 'to_airport', label: '✈️ מונית לנתב״ג (המראות)', icon: '🛫' },
      { id: 'from_airport', label: '🛬 איסוף מנתב״ג (נחיתות)', icon: '🛬' },
      { id: 'intercity', label: '🛣️ נסיעות בינעירוניות ספיישל', icon: '🚕' },
      { id: 'delivery', label: '📦 משלוחים וחבילות אקספרס', icon: '📦' }
    ].map(t => {
      const list = orders.filter(o => o.serviceType === t.id);
      const rev = list.reduce((s, o) => s + Number(o.totalPrice || 0), 0);
      const comm = list.reduce((s, o) => s + Number(o.commissionAmount || 0), 0);
      return { ...t, count: list.length, rev, comm, pct: Math.round((list.length / totalOrders) * 100) };
    });

    return `
      <div class="space-y-6">
        <!-- Executive Financial Summary -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <span class="text-xs font-bold text-slate-500 block">ממוצע מחיר נסיעה ללקוח</span>
            <span class="text-3xl font-black text-slate-900 mt-1 block">₪${avgOrderPrice}</span>
            <span class="text-[11px] text-emerald-700 font-bold mt-1 block">עמלה ממוצעת לנסיעה: ₪${avgComm}</span>
          </div>
          <div class="bg-white rounded-3xl p-5 border border-emerald-300 shadow-sm">
            <span class="text-xs font-bold text-emerald-800 block">סה״כ עמלות שנגבו ב-Bit/PayBox</span>
            <span class="text-3xl font-black text-emerald-600 mt-1 block">₪${paidComm.toLocaleString()}</span>
            <span class="text-[11px] text-slate-500 font-bold mt-1 block">ממתין לגבייה מנהגים: ₪${pendingComm.toLocaleString()}</span>
          </div>
          <div class="bg-amber-50 rounded-3xl p-5 border border-amber-300 shadow-sm">
            <span class="text-xs font-extrabold text-amber-900 block">👑 חלק טל פרדקין (50% מעמלות)</span>
            <span class="text-3xl font-black text-amber-950 mt-1 block">₪${partnerShareEach.toLocaleString()}</span>
            <span class="text-[11px] text-amber-800 font-bold mt-1 block">טלפון מוקד וביט: 054-6373001</span>
          </div>
          <div class="bg-emerald-50 rounded-3xl p-5 border border-emerald-300 shadow-sm">
            <span class="text-xs font-extrabold text-emerald-900 block">👑 חלק אליהו — שותף (50% מעמלות)</span>
            <span class="text-3xl font-black text-emerald-950 mt-1 block">₪${partnerShareEach.toLocaleString()}</span>
            <span class="text-[11px] text-emerald-800 font-bold mt-1 block">טלפון מוקד וביט: 050-7676946</span>
          </div>
        </div>

        <!-- Breakdown by Service Type & Driver Leaderboard -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div class="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 class="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">📊 פילוח הכנסות ועמלות לפי סוג שירות</h3>
            <div class="space-y-4">
              ${byType.map(row => `
                <div class="space-y-1.5">
                  <div class="flex items-center justify-between text-xs font-bold">
                    <span class="text-slate-900 font-black">${row.label} (${row.count} הזמנות)</span>
                    <span class="text-emerald-700 font-black">היקף: ₪${row.rev.toLocaleString()} | עמלת תחנה: ₪${row.comm.toLocaleString()}</span>
                  </div>
                  <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div class="h-full bg-gradient-to-l from-amber-400 to-emerald-500 rounded-full" style="width: ${Math.max(8, row.pct)}%"></div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 class="text-lg font-black text-slate-900 border-b border-slate-100 pb-3">🏆 דירוג נהגים משלמי עמלות (Top Drivers)</h3>
            <div class="space-y-3">
              ${drivers.slice().sort((a, b) => (b.totalCommissionsPaid || 0) - (a.totalCommissionsPaid || 0)).map((d, idx) => `
                <div class="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                  <div class="flex items-center gap-2.5">
                    <span class="w-7 h-7 rounded-xl bg-slate-900 text-amber-400 font-black flex items-center justify-center">${idx + 1}</span>
                    <div>
                      <div class="font-black text-slate-900">${d.name}</div>
                      <div class="text-[11px] text-slate-500">${d.vehicleName} • ${d.completedRides || 0} נסיעות</div>
                    </div>
                  </div>
                  <div class="text-left">
                    <span class="font-black text-emerald-700 text-sm">₪${Number(d.totalCommissionsPaid || 0).toLocaleString()}</span>
                    <span class="text-[10px] text-slate-400 block">עמלות בביט/פייבוקס</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAdminAuthServersTab() {
    const owners = DATA.owners || settings.owners || DATA.defaultSettings.owners || [];
    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div class="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div class="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <h3 class="text-lg font-black text-slate-900">👑 בעלים ושותפים עם הרשאת ניהול מלאה (Super Admin)</h3>
              <p class="text-xs text-slate-500">טל פרדקין ואליהו מוגדרים כבעלי גישה מלאה לכל המערכות, התמחור והעמלות</p>
            </div>
            <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">2 שותפים פעילים</span>
          </div>

          <div class="space-y-3">
            ${owners.map(o => `
              <div class="p-4 rounded-2xl border-2 ${settings.dispatcherPhone === o.phone ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200 bg-slate-50'} flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-base font-black text-slate-900">👑 ${o.name}</span>
                    <span class="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-900 text-amber-400">${o.role === 'super_admin' ? 'גישה מלאה להכל' : o.role}</span>
                  </div>
                  <div class="text-xs font-bold text-slate-600 mt-1">
                    📱 טלפון: <span dir="ltr" class="font-black text-slate-900">${o.phone}</span> | 👤 שם משתמש: <span class="font-mono font-black text-slate-800">${o.username}</span> | 🔑 קוד מהיר: <span class="font-mono font-black text-emerald-700">${o.masterPin}</span>
                  </div>
                  <div class="text-[11px] font-bold text-emerald-700 mt-0.5">
                    💸 ביט / פייבוקס לעמלות נהגים: <span dir="ltr">${o.bitPhone || o.phone}</span>
                  </div>
                </div>
                <button onclick="window.primeApp.switchActivePartner('${o.id}')"
                  class="px-3.5 py-2 rounded-xl text-xs font-black cursor-pointer shrink-0 ${settings.dispatcherPhone === o.phone ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-amber-300 hover:bg-slate-800'}">
                  ${settings.dispatcherPhone === o.phone ? '✓ מוקדן משמרת פעיל כעת' : 'העבר משמרת וביט אליו'}
                </button>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 class="text-lg font-black text-slate-900 border-b border-slate-200 pb-3">📡 שרתי קוד אימות (SMS / WhatsApp OTP) ב-₪0 עלות</h3>
          <p class="text-xs text-slate-600 leading-relaxed">
            המערכת מחוברת לשרת המקומי (<code class="font-mono bg-slate-100 px-1.5 py-0.5 rounded">/api/auth/send-otp</code>) ותומכת ב-3 מסלולים חינמיים לחלוטין מתוך השרתים הקיימים שלך:
          </p>

          <div class="space-y-3 text-xs">
            <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200">
              <div class="font-black text-emerald-950 mb-1">1. שליחת קוד ב-WhatsApp דרך Green API (קיים אצלך ב-el-sol-sys — ₪0 לחלוטין!)</div>
              <p class="text-emerald-800 mb-2">שולח את קוד האימות ישירות ל-WhatsApp של המשתמש ללא עלות SMS. הזן מזהה מופע וטוקן:</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input type="text" dir="ltr" value="${settings.greenApiInstanceId || ''}" placeholder="Green API Instance ID"
                  onchange="window.primeApp.saveSettingField('greenApiInstanceId', this.value)"
                  class="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-mono text-xs" />
                <input type="password" dir="ltr" value="${settings.greenApiToken || ''}" placeholder="Green API Token"
                  onchange="window.primeApp.saveSettingField('greenApiToken', this.value)"
                  class="rounded-xl border border-emerald-300 bg-white px-3 py-2 font-mono text-xs" />
              </div>
            </div>

            <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div class="font-black text-slate-900 mb-1">2. שרת ה-SMS הקיים שלך ב-AWS (elgarasi / the-team-sys Webhook)</div>
              <p class="text-slate-600 mb-2">חיבור ישיר ל-Endpoint הקיים של שליחת ה-SMS שלך ב-AWS Lambda / API Gateway:</p>
              <input type="text" dir="ltr" value="${settings.customSmsWebhookUrl || ''}" placeholder="https://your-api-id.execute-api.il-central-1.amazonaws.com/prod/send-sms"
                onchange="window.primeApp.saveSettingField('customSmsWebhookUrl', this.value)"
                class="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 font-mono text-xs" />
            </div>

            <div class="p-3.5 rounded-2xl bg-amber-50 border border-amber-200">
              <div class="font-black text-amber-950 mb-1">3. מצב קוד מיידי חכם + Google Firebase Phone Auth (10,000 SMS חינם בחודש)</div>
              <p class="text-amber-900">
                כל עוד לא הוזן Webhook חיצוני, המערכת מפיקה קוד OTP בן 4 ספרות ומציגה אותו מיידית על המסך עם מילוי אוטומטי בקליק, ובנוסף טל (<span dir="ltr">054-6373001</span>) ואליהו (<span dir="ltr">050-7676946</span>) יכולים תמיד להיכנס גם עם הקוד הקבוע <span class="font-mono font-black">1234</span>.
              </p>
            </div>
          </div>
        </div>

        <div class="lg:col-span-12 bg-slate-900 text-white rounded-3xl border border-amber-500/40 p-6 shadow-xl">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold mb-1">☁️ תשתית ענן ופריסה אוטומטית (CI/CD) מחוברת</span>
              <h3 class="text-xl font-black text-white">חיבורי GitHub Actions • AWS • Firebase</h3>
              <p class="text-xs text-slate-400">כל דחיפה לענף <code class="text-amber-300 font-mono">main</code> בונה ומעלה אוטומטית את האתר לאוויר תוך 45 שניות</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a href="https://fradkintal.github.io/prime-taxi/" target="_blank"
                class="gold-button px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                <span>🌐 פתח את האתר החי באוויר</span>
              </a>
              <a href="https://wa.me/972507676946?text=${encodeURIComponent('אליהו אחי, המערכת שלנו (פריים טקסי) באוויר! 🚕🔥\n\n🌐 כניסה לאתר ולממשק הסדרן:\nhttps://fradkintal.github.io/prime-taxi/\n\n🔐 פרטי ההתחברות שלך (גישה מלאה להכל):\nטלפון: 050-7676946 (או שם משתמש: אליהו)\nקוד כניסה מהיר: 1234')}" target="_blank"
                class="whatsapp-cta-btn px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5">
                <span>📲 שלח לאליהו (050-7676946) קישור ופרטי גישה ב-WhatsApp</span>
              </a>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div class="flex items-center justify-between mb-2">
                <span class="font-black text-amber-400 text-sm">🐙 GitHub + GitHub Actions</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px]">ACTIVE</span>
              </div>
              <div class="text-slate-300 space-y-1 font-mono text-[11px]" dir="ltr">
                <div>Repo: fradkintal/prime-taxi</div>
                <div>Workflow: .github/workflows/deploy.yml</div>
                <div>Live: fradkintal.github.io/prime-taxi</div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div class="flex items-center justify-between mb-2">
                <span class="font-black text-amber-400 text-sm">🔥 Google Firebase</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px]">CONFIGURED</span>
              </div>
              <div class="text-slate-300 space-y-1 font-mono text-[11px]" dir="ltr">
                <div>Project: tlator-759c6 (.firebaserc)</div>
                <div>Config: firebase.json (Hosting + Headers)</div>
                <div>Phone Auth: 10,000 SMS/mo Free Tier</div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-800/90 border border-slate-700">
              <div class="flex items-center justify-between mb-2">
                <span class="font-black text-amber-400 text-sm">☁️ AWS Cloud (S3 + CloudFront)</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-black text-[10px]">READY</span>
              </div>
              <div class="text-slate-300 space-y-1 font-mono text-[11px]" dir="ltr">
                <div>Account: 714303613666</div>
                <div>Region: il-central-1 (Tel Aviv) / eu-west-1</div>
                <div>CI/CD: S3 immutable + CloudFront invalidation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAuthModal(mode = 'phone', step = 'request', targetPhone = '', previewOtp = '') {
    const modalRoot = document.getElementById('modalRoot');
    if (!modalRoot) return;

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border-2 border-amber-400 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <div class="flex items-center gap-3">
              <img src="./public/assets/logo-modern.jpg" alt="Logo" class="w-11 h-11 rounded-xl object-cover border border-amber-400" />
              <div>
                <span class="text-[11px] font-extrabold text-amber-700 uppercase">כניסה מהירה וקלילה</span>
                <h3 class="text-lg font-black text-slate-900">התחברות למערכת ${settings.brandNameHe}</h3>
              </div>
            </div>
            <button onclick="window.primeApp.closeModal()" class="text-slate-400 hover:text-slate-700 text-xl font-black cursor-pointer">✕</button>
          </div>

          <div class="grid grid-cols-2 gap-1.5 bg-slate-100 p-1.5 rounded-2xl mb-5">
            <button onclick="window.primeApp.setAuthMode('phone')"
              class="py-2 rounded-xl text-xs font-black transition cursor-pointer ${mode === 'phone' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600 hover:text-slate-900'}">
              📱 טלפון + קוד אימות
            </button>
            <button onclick="window.primeApp.setAuthMode('username')"
              class="py-2 rounded-xl text-xs font-black transition cursor-pointer ${mode === 'username' ? 'bg-slate-900 text-amber-400 shadow' : 'text-slate-600 hover:text-slate-900'}">
              👤 שם משתמש / קוד
            </button>
          </div>

          ${mode === 'phone' ? `
            ${step === 'request' ? `
              <div class="space-y-4">
                <div>
                  <label class="block text-xs font-extrabold text-slate-700 mb-1">מספר טלפון נייד (בעלים / נהג / לקוח)</label>
                  <input id="authPhoneInput" type="tel" dir="ltr" value="${targetPhone}" placeholder="050-7676946 / 054-6373001"
                    class="w-full rounded-xl border-2 border-slate-300 focus:border-amber-500 px-4 py-3 font-black text-base text-right outline-none" />
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-700 mb-1">שם מלא (אופציונלי ללקוח/נהג חדש)</label>
                  <input id="authNameInput" type="text" placeholder="למשל: אליהו / טל / ישראל"
                    class="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-bold text-sm outline-none" />
                </div>
                <button onclick="window.primeApp.sendOtpCode()"
                  class="w-full gold-button py-3.5 rounded-2xl font-black text-sm shadow-md cursor-pointer">
                  📲 שלח קוד התחברות מהיר (חינם)
                </button>
              </div>
            ` : `
              <div class="space-y-4">
                <div class="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-950">
                  ✅ קוד נשלח למספר <span dir="ltr" class="font-black">${targetPhone}</span>
                  ${previewOtp ? `<div class="mt-1.5 p-2 rounded-xl bg-white border border-emerald-300 flex items-center justify-between">
                    <span>קוד אימות מהיר שלך:</span>
                    <span class="font-mono text-base font-black text-emerald-700 tracking-widest">${previewOtp}</span>
                  </div>` : ''}
                </div>
                <div>
                  <label class="block text-xs font-extrabold text-slate-700 mb-1">הזן קוד בן 4 ספרות (או 1234 לבעלים)</label>
                  <input id="authOtpInput" type="text" dir="ltr" maxlength="6" value="${previewOtp || ''}" placeholder="1234"
                    class="w-full rounded-xl border-2 border-amber-400 px-4 py-3 font-mono font-black text-xl text-center tracking-widest outline-none" />
                </div>
                <button onclick="window.primeApp.verifyOtpAndLogin('${targetPhone}')"
                  class="w-full whatsapp-cta-btn py-3.5 rounded-2xl font-black text-sm shadow-md cursor-pointer">
                  🔓 אמת קוד והתחבר עכשיו
                </button>
                <button onclick="window.primeApp.setAuthMode('phone')"
                  class="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer">
                  ← חזרה לשינוי מספר טלפון
                </button>
              </div>
            `}
          ` : `
            <div class="space-y-4">
              <div>
                <label class="block text-xs font-extrabold text-slate-700 mb-1">שם משתמש או מספר טלפון</label>
                <input id="authUserInput" type="text" placeholder=" למשל: אליהו / טל / eliyahu / tal / 0507676946"
                  class="w-full rounded-xl border-2 border-slate-300 focus:border-amber-500 px-4 py-3 font-bold text-sm outline-none" />
              </div>
              <div>
                <label class="block text-xs font-extrabold text-slate-700 mb-1">קוד כניסה / סיסמה (ברירת מחדל לשותפים: 1234)</label>
                <input id="authPassInput" type="password" dir="ltr" value="1234" placeholder="1234"
                  class="w-full rounded-xl border border-slate-300 px-4 py-2.5 font-mono font-bold text-base text-center outline-none" />
              </div>
              <button onclick="window.primeApp.loginWithUsername()"
                class="w-full gold-button py-3.5 rounded-2xl font-black text-sm shadow-md cursor-pointer">
                🔓 התחבר למערכת
              </button>
            </div>
          `}

          <div class="mt-5 pt-4 border-t border-slate-200">
            <div class="text-[11px] font-extrabold text-slate-500 mb-2 text-center">⚡ כניסת שותפים מהירה בקליק אחד (גישה מלאה להכל):</div>
            <div class="grid grid-cols-2 gap-2">
              <button onclick="window.primeApp.quickPartnerLogin('tal')"
                class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5">
                <span>👑 טל פרדקין</span>
                <span dir="ltr" class="text-[10px] text-slate-400">054-6373001</span>
              </button>
              <button onclick="window.primeApp.quickPartnerLogin('eliyahu')"
                class="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black text-xs cursor-pointer flex items-center justify-center gap-1.5">
                <span>👑 אליהו (שותף)</span>
                <span dir="ltr" class="text-[10px] text-slate-400">050-7676946</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderOrderSuccessModal(order, waText, waUrl) {
    const modalRoot = document.getElementById('modalRoot');
    if (!modalRoot) return;
    const driverBroadcastText = buildDriverGroupBroadcastText(order);

    modalRoot.innerHTML = `
      <div class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-400 animate-fade-in">
          <div class="flex items-center justify-between border-b border-slate-200 pb-4 mb-4">
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-2xl bg-emerald-500 text-white text-2xl flex items-center justify-center font-black">✓</div>
              <div>
                <span class="text-xs font-extrabold text-emerald-700">ההזמנה נקלטה במערכת (#${order.id})</span>
                <h3 class="text-xl font-black text-slate-900">מוכנה לשליחה ב-WhatsApp!</h3>
              </div>
            </div>
            <button onclick="window.primeApp.closeModal()" class="text-slate-400 hover:text-slate-700 text-xl font-black">✕</button>
          </div>

          <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs whitespace-pre-wrap font-mono text-slate-800 max-h-56 overflow-y-auto mb-4">${waText}</div>

          <div class="space-y-2.5">
            <a href="${waUrl}" target="_blank"
              class="w-full whatsapp-cta-btn py-3.5 px-5 rounded-2xl text-sm font-black flex items-center justify-center gap-2">
              <span>💬</span>
              <span>פתח WhatsApp ושלח הזמנה עכשיו</span>
            </a>

            <div class="grid grid-cols-2 gap-2.5">
              <button onclick="window.primeApp.copyText(${JSON.stringify(waText).replace(/"/g, '&quot;')}, 'פרטי ההזמנה הועתקו!')"
                class="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs">
                📋 העתק נוסח הזמנה
              </button>
              <button onclick="window.primeApp.closeModal(); window.primeApp.setView('admin');"
                class="py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs">
                ⚡ עבור למסך סדרן וגזירת עמלה (₪${order.commissionAmount})
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAll() {
    renderHeader();
    const mainEl = document.getElementById('appMain');
    if (!mainEl) return;

    if (state.activeView === 'booking') {
      mainEl.innerHTML = renderBookingView();
    } else if (state.activeView === 'driver') {
      mainEl.innerHTML = renderDriverView();
    } else if (state.activeView === 'marketing') {
      mainEl.innerHTML = window.PRIME_TAXI_MARKETING ? window.PRIME_TAXI_MARKETING.renderView(settings) : '';
      setTimeout(() => {
        if (window.PRIME_TAXI_MARKETING) window.PRIME_TAXI_MARKETING.initAfterRender(settings);
      }, 60);
    } else if (state.activeView === 'pricelist') {
      mainEl.innerHTML = renderPricelistView();
    } else if (state.activeView === 'admin') {
      mainEl.innerHTML = renderAdminView();
      if (state.adminTab === 'marketing') {
        setTimeout(() => {
          if (window.PRIME_TAXI_MARKETING) window.PRIME_TAXI_MARKETING.initAfterRender(settings);
        }, 60);
      }
    }
  }

  // --- Public Controller API ---
  window.primeApp = {
    rerender() {
      renderAll();
    },

    openVideoReelShortcut(reelId) {
      state.activeView = 'marketing';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderAll();
      setTimeout(() => {
        if (window.PRIME_TAXI_MARKETING) {
          window.PRIME_TAXI_MARKETING.setSubTab('videos');
          if (reelId) window.PRIME_TAXI_MARKETING.selectReel(reelId);
        }
      }, 90);
    },

    openMerchShortcut() {
      state.activeView = 'marketing';
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderAll();
      setTimeout(() => {
        if (window.PRIME_TAXI_MARKETING) {
          window.PRIME_TAXI_MARKETING.setSubTab('merch');
        }
      }, 90);
    },

    setAdminOrderFilter(filterId) {
      state.adminOrderStatusFilter = filterId;
      renderAll();
    },

    setAdminOrderSearch(query) {
      state.adminOrderSearch = query;
      renderAll();
    },

    assignDriverToOrder(orderId, driverId) {
      const order = orders.find(o => o.id === orderId);
      const drv = drivers.find(d => d.id === driverId);
      if (!order || !drv) return;
      order.status = order.status === 'paid' ? 'paid' : 'assigned';
      order.assignedDriverName = drv.name;
      order.assignedDriverPhone = drv.phone;
      order.assignedDriverVehicle = drv.vehicleName;
      saveOrders(order);
      showToast(`נהג ${drv.name} (${drv.phone}) שובץ לנסיעה #${order.id}! 🚖`);
      renderAll();
    },

    deleteOrder(orderId) {
      orders = orders.filter(o => o.id !== orderId);
      saveOrders();
      showToast(`הזמנה #${orderId} הוסרה מיומן הנסיעות 🗑️`);
      renderAll();
    },

    exportOrdersCsv() {
      const headers = ['מספר הזמנה', 'זמן יצירה', 'שירות', 'מוצא', 'יעד', 'שעת איסוף', 'שם לקוח', 'טלפון לקוח', 'מחיר ללקוח (₪)', 'עמלת תחנה (₪)', 'נטו לנהג (₪)', 'סטטוס', 'נהג משובץ', 'טלפון נהג'];
      const rows = orders.map(o => [
        o.id,
        o.createdAt,
        o.serviceLabel,
        o.originLabel,
        o.destLabel,
        o.pickupTimeLabel,
        o.customerName,
        o.customerPhone,
        o.totalPrice,
        o.commissionAmount,
        o.driverNet,
        o.status,
        o.assignedDriverName || '',
        o.assignedDriverPhone || ''
      ].map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','));
      const csv = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prime-taxi-orders-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      showToast('דוח ההזמנות והעמלות יורד כעת כקובץ Excel / CSV! 📊');
    },

    openAuthModal(defaultPhone = '') {
      if (typeof defaultPhone === 'boolean') {
        state.pendingAdminRedirect = defaultPhone;
        defaultPhone = '';
      }
      renderAuthModal('phone', 'request', defaultPhone, '');
    },

    setAuthMode(mode) {
      renderAuthModal(mode, 'request', '', '');
    },

    async sendOtpCode() {
      const phoneEl = document.getElementById('authPhoneInput');
      const nameEl = document.getElementById('authNameInput');
      const rawPhone = (phoneEl?.value || '').trim();
      const rawName = (nameEl?.value || '').trim();
      if (!rawPhone || rawPhone.replace(/\D/g, '').length < 9) {
        showToast('אנא הזן מספר טלפון נייד תקין (למשל 050-7676946)', 'warning');
        return;
      }
      state._pendingAuthName = rawName;
      const randomOtp = String(Math.floor(1000 + Math.random() * 9000));
      state._pendingOtpCode = randomOtp;

      const otpEndpoint = getCloudApiUrl() || '/api/auth/send-otp';
      try {
        const res = await fetch(otpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'send-otp',
            phone: rawPhone,
            greenApiInstanceId: settings.greenApiInstanceId || '',
            greenApiToken: settings.greenApiToken || '',
            customSmsWebhookUrl: settings.customSmsWebhookUrl || ''
          })
        });
        if (res.ok) {
          const data = await res.json();
          const codeToShow = data.previewCode || randomOtp;
          state._pendingOtpCode = codeToShow;
          showToast(`קוד התחברות נשלח (${data.deliveryChannel === 'green_api_whatsapp' ? 'WhatsApp' : 'קוד מהיר'}): ${codeToShow} 📲`);
          renderAuthModal('phone', 'verify', rawPhone, codeToShow);
          return;
        }
      } catch (_) {}

      showToast(`קוד האימות המהיר שלך: ${randomOtp} 📲`);
      renderAuthModal('phone', 'verify', rawPhone, randomOtp);
    },

    async verifyOtpAndLogin(targetPhone) {
      const otpEl = document.getElementById('authOtpInput');
      const enteredCode = (otpEl?.value || '').trim();
      if (!enteredCode) {
        showToast('אנא הזן את קוד האימות', 'warning');
        return;
      }

      const matchedOwner = findOwnerByInput(targetPhone);
      const isValidLocal =
        enteredCode === state._pendingOtpCode ||
        enteredCode === '1234' ||
        (matchedOwner && (enteredCode === matchedOwner.masterPin || enteredCode === matchedOwner.quickPin));

      if (!isValidLocal) {
        showToast('קוד האימות שגוי — נסה שוב או הזן 1234 לבעלים', 'warning');
        return;
      }

      const loggedUser = matchedOwner
        ? {
            id: matchedOwner.id,
            name: matchedOwner.name,
            badge: matchedOwner.badge,
            phone: matchedOwner.phone,
            role: 'super_admin'
          }
        : {
            id: 'user_' + Date.now(),
            name: state._pendingAuthName || 'לקוח / נהג מחובר',
            phone: targetPhone,
            role: 'customer'
          };

      if (!state.customerName && loggedUser.name) state.customerName = loggedUser.name;
      if (!state.customerPhone && loggedUser.phone) state.customerPhone = loggedUser.phone;

      window.primeApp.closeModal();
      if (loggedUser.role === 'super_admin') {
        state.activeView = 'admin';
      }
      saveAuthUser(loggedUser);
      showToast(`ברוך הבא, ${loggedUser.name}! התחברת בהצלחה 🎉`);
    },

    loginWithUsername() {
      const userEl = document.getElementById('authUserInput');
      const passEl = document.getElementById('authPassInput');
      const rawUser = (userEl?.value || '').trim();
      const rawPass = (passEl?.value || '').trim();

      if (!rawUser) {
        showToast('אנא הזן שם משתמש או מספר טלפון', 'warning');
        return;
      }

      const matchedOwner = findOwnerByInput(rawUser);
      if (matchedOwner) {
        if (rawPass && rawPass !== matchedOwner.masterPin && rawPass !== matchedOwner.quickPin && rawPass !== '1234') {
          showToast('סיסמה / קוד שגוי עבור מנהל מערכת', 'warning');
          return;
        }
        window.primeApp.closeModal();
        state.activeView = 'admin';
        saveAuthUser({
          id: matchedOwner.id,
          name: matchedOwner.name,
          badge: matchedOwner.badge,
          phone: matchedOwner.phone,
          role: 'super_admin'
        });
        showToast(`ברוך הבא, ${matchedOwner.name}! גישת ניהול מלאה הופעלה 👑`);
        return;
      }

      window.primeApp.closeModal();
      saveAuthUser({
        id: 'user_' + Date.now(),
        name: rawUser,
        phone: '',
        role: 'customer'
      });
      if (!state.customerName) state.customerName = rawUser;
      showToast(`שלום ${rawUser}, התחברת בהצלחה! 👋`);
    },

    quickPartnerLogin(ownerId) {
      const owners = DATA.owners || settings.owners || [];
      const found = owners.find(o => o.id === ownerId) || owners[0];
      if (!found) return;
      window.primeApp.closeModal();
      state.activeView = 'admin';
      saveAuthUser({
        id: found.id,
        name: found.name,
        badge: found.badge || 'מנהל ראשי ושותף',
        phone: found.phone,
        role: 'super_admin'
      });
      showToast(`מחובר כעת בתור ${found.name} (${found.phone}) — גישה מלאה להכל! 👑`);
    },

    switchActivePartner(ownerId) {
      const owners = DATA.owners || settings.owners || [];
      const found = owners.find(o => o.id === ownerId);
      if (!found) return;
      saveSettings({
        activePartnerId: found.id,
        whatsappPhone: found.phone,
        dispatcherPhone: found.phone,
        bitPhone: found.bitPhone || found.phone,
        payboxPhone: found.payboxPhone || found.phone
      });
      showToast(`מוקד ההזמנות והביט/פייבוקס הועבר ל-${found.name} (${found.phone})! 📲`);
    },

    logout() {
      saveAuthUser(null);
      showToast('התנתקת מהמערכת בהצלחה 👋');
    },

    // --- Driver Portal Actions ---
    setDriverFilter(filterId) {
      state.driverFilter = filterId;
      renderAll();
    },

    selectActiveDriver(driverId) {
      const found = drivers.find(d => d.id === driverId);
      if (!found) return;
      saveActiveDriver(found);
      showToast(`נהג פעיל הוחלף ל-${found.name} (${found.vehicleName}) 🚖`);
      renderAll();
    },

    updateDriverAvailability(statusVal) {
      if (!activeDriver) return;
      const labels = {
        available_airport: '✈️ פנוי עכשיו בנתב״ג (טרמינל 3)',
        available: '🟢 פנוי לנסיעות באזור שלי',
        busy: '🟡 בנסיעה כרגע',
        offline: '🔴 לא פנוי כרגע'
      };
      activeDriver.status = statusVal;
      activeDriver.statusLabel = labels[statusVal] || labels.available;
      saveActiveDriver(activeDriver);

      const idx = drivers.findIndex(d => d.id === activeDriver.id || d.phone === activeDriver.phone);
      if (idx >= 0) {
        drivers[idx] = { ...drivers[idx], ...activeDriver };
      } else {
        drivers.unshift(activeDriver);
      }
      saveDrivers(activeDriver);
      showToast(`סטטוס הזמינות שלך עודכן בענן: ${activeDriver.statusLabel}`);
      renderAll();
    },

    driverClaimOrder(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const drv = activeDriver || drivers[0];
      if (!drv || !drv.phone) {
        window.primeApp.openDriverProfileModal();
        showToast('אנא הזן שם ומספר טלפון של נהג כדי לתפוס נסיעה', 'warning');
        return;
      }
      order.status = 'assigned';
      order.assignedDriverName = drv.name;
      order.assignedDriverPhone = drv.phone;
      order.assignedDriverVehicle = drv.vehicleName;
      saveOrders(order);
      showToast(`נסיעה #${order.id} נתפסה על ידך! העבר עמלה של ₪${order.commissionAmount} בביט/פייבוקס לפתיחת פרטי הלקוח 🚖`);
      window.scrollTo({ top: 120, behavior: 'smooth' });
      renderAll();
    },

    driverConfirmCommissionPaid(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      order.status = 'paid';
      saveOrders(order);

      const drv = activeDriver || drivers[0];
      if (drv) {
        const idx = drivers.findIndex(d => d.id === drv.id || d.phone === drv.phone);
        if (idx >= 0) {
          drivers[idx].completedRides = (drivers[idx].completedRides || 0) + 1;
          drivers[idx].totalCommissionsPaid = (drivers[idx].totalCommissionsPaid || 0) + Number(order.commissionAmount || 0);
          saveDrivers(drivers[idx]);
        }
      }

      showToast(`תודה! העמלה (₪${order.commissionAmount}) נרשמה — פרטי הלקוח וניווט Waze פתוחים כעת עבורך! 🔓`);
      renderAll();
    },

    openDriverProfileModal(isNewDriver = false) {
      const modalRoot = document.getElementById('modalRoot');
      if (!modalRoot) return;
      const d = isNewDriver ? { name: '', phone: '', vehicleName: 'מונית סדאן 4 מקומות', plateNumber: '', region: 'נתב״ג וגוש דן' } : (activeDriver || drivers[0] || {});
      modalRoot.innerHTML = `
        <div class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-emerald-500">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 class="text-lg font-black text-slate-900">🚖 ${isNewDriver ? 'הוספת נהג חדש למאגר התחנה' : 'פרטי נהג מונית / מיניבוס'}</h3>
              <button onclick="window.primeApp.closeModal()" class="text-slate-400 hover:text-slate-700 font-black cursor-pointer">✕</button>
            </div>
            <div class="space-y-3 text-sm">
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">שם מלא של הנהג</label>
                <input id="drvNameInput" type="text" value="${d.name || ''}" placeholder="לדוגמה: משה כהן" class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">טלפון נייד (ל-WhatsApp וביט)</label>
                <input id="drvPhoneInput" type="tel" dir="ltr" value="${d.phone || ''}" placeholder="052-XXXXXXX" class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold text-right" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-700 mb-1">סוג רכב וקיבולת</label>
                <select id="drvVehicleInput" class="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-bold">
                  <option value="מונית סדאן 4 מקומות" ${d.vehicleName?.includes('סדאן') ? 'selected' : ''}>🚕 מונית סדאן רגילה (עד 4 נוסעים)</option>
                  <option value="סדאן פרימיום / סטיישן תא מטען גדול" ${d.vehicleName?.includes('סטיישן') ? 'selected' : ''}>✨ סדאן פרימיום / סטיישן (תא מטען גדול)</option>
                  <option value="מונית גדולה 6 מקומות" ${d.vehicleName?.includes('6') ? 'selected' : ''}>🚐 מונית גדולה / מיניוואן (5–6 מקומות)</option>
                  <option value="מרצדס V-Class VIP (7-8 מקומות)" ${d.vehicleName?.includes('V-Class') ? 'selected' : ''}>👑 מרצדס V-Class VIP (7–8 מקומות)</option>
                  <option value="מיניבוס מרצדס (10-14 מקומות)" ${d.vehicleName?.includes('מיניבוס') ? 'selected' : ''}>🚌 מיניבוס לקבוצות (10–14 מקומות)</option>
                </select>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">מספר רישוי / כובע</label>
                  <input id="drvPlateInput" type="text" dir="ltr" value="${d.plateNumber || ''}" placeholder="84-291-26" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono font-bold text-center" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-700 mb-1">אזור עבודה עיקרי</label>
                  <input id="drvRegionInput" type="text" value="${d.region || 'נתב״ג וגוש דן'}" placeholder="נתב״ג וגוש דן" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                </div>
              </div>
              <button onclick="window.primeApp.saveDriverProfile()"
                class="w-full whatsapp-cta-btn py-3.5 rounded-2xl font-black text-sm mt-2 cursor-pointer">
                שמור והתחבר לפורטל הנהגים 🚖
              </button>
            </div>
          </div>
        </div>
      `;
    },

    saveDriverProfile() {
      const name = (document.getElementById('drvNameInput')?.value || '').trim();
      const phone = (document.getElementById('drvPhoneInput')?.value || '').trim();
      const vehicleName = document.getElementById('drvVehicleInput')?.value || 'מונית סדאן 4 מקומות';
      const plateNumber = (document.getElementById('drvPlateInput')?.value || '').trim();
      const region = (document.getElementById('drvRegionInput')?.value || 'נתב״ג וגוש דן').trim();

      if (!name || !phone) {
        showToast('אנא הזן שם נהג ומספר טלפון נייד', 'warning');
        return;
      }

      const existingIdx = drivers.findIndex(d => d.phone === phone);
      const drvObj = existingIdx >= 0
        ? { ...drivers[existingIdx], name, phone, vehicleName, plateNumber, region }
        : {
            id: 'drv-' + Math.floor(100 + Math.random() * 900),
            name,
            phone,
            vehicleName,
            plateNumber,
            region,
            status: 'available_airport',
            statusLabel: '✈️ פנוי עכשיו בנתב״ג',
            completedRides: 0,
            totalCommissionsPaid: 0,
            rating: 5.0
          };

      if (existingIdx >= 0) {
        drivers[existingIdx] = drvObj;
      } else {
        drivers.unshift(drvObj);
      }
      saveActiveDriver(drvObj);
      saveDrivers(drvObj);
      window.primeApp.closeModal();
      showToast(`ברוך הבא ${name}! הפרופיל שלך נשמר בענן התחנה 🚖`);
      renderAll();
    },

    refreshCloudNow() {
      syncWithAwsCloud(false);
      showToast('מסנכרן נתונים חיים מול ענן AWS... ☁️');
    },

    setView(view) {
      state.activeView = view;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      renderAll();
    },

    setAdminTab(tab) {
      state.adminTab = tab;
      renderAll();
    },

    setServiceType(type) {
      state.serviceType = type;
      state.manualVehicleSelected = false;
      renderAll();
    },

    selectQuickRoute(cityId, mode) {
      state.serviceType = mode || 'to_airport';
      if (state.serviceType === 'from_airport') {
        state.destCityId = cityId;
      } else {
        state.originCityId = cityId;
      }
      state.activeView = 'booking';
      window.scrollTo({ top: 240, behavior: 'smooth' });
      renderAll();
    },

    swapCities() {
      const tmpOrigin = state.originCityId;
      state.originCityId = state.destCityId;
      state.destCityId = tmpOrigin;
      const tmpStreet = state.streetOrigin;
      state.streetOrigin = state.streetDest;
      state.streetDest = tmpStreet;
      renderAll();
    },

    updateField(key, val) {
      state[key] = val;
      renderAll();
    },

    updateFieldSilent(key, val) {
      state[key] = val;
    },

    adjustCounter(key, delta, min, max) {
      const next = Math.min(max, Math.max(min, (state[key] || 0) + delta));
      state[key] = next;
      state.manualVehicleSelected = false;
      renderAll();
    },

    selectVehicle(tierId) {
      state.vehicleTierId = tierId;
      state.manualVehicleSelected = true;
      renderAll();
    },

    adjustExtra(extraId, delta, max) {
      const curr = state.extrasState[extraId] || 0;
      state.extrasState[extraId] = Math.min(max, Math.max(0, curr + delta));
      renderAll();
    },

    toggleExtra(extraId, checked) {
      state.extrasState[extraId] = Boolean(checked);
      renderAll();
    },

    setPriceSearch(q) {
      state.priceSearchQuery = q;
      renderAll();
    },

    setPriceRegion(region) {
      state.priceRegionFilter = region;
      renderAll();
    },

    submitBooking() {
      submitBookingToWhatsApp();
    },

    closeModal() {
      const modalRoot = document.getElementById('modalRoot');
      if (modalRoot) modalRoot.innerHTML = '';
    },

    copyText(text, msg) {
      copyToClipboard(text, msg);
    },

    broadcastOrderToDrivers(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      order.status = order.status === 'new' ? 'broadcasted' : order.status;
      saveOrders();
      const text = buildDriverGroupBroadcastText(order);
      copyToClipboard(text, 'נוסח המכרז לקבוצת הנהגים הועתק! פותח WhatsApp...');
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      renderAll();
    },

    sendFullOrderToWinningDriver(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      order.status = 'assigned';
      saveOrders();
      const text = buildWinningDriverPrivateText(order);
      copyToClipboard(text, 'פרטי הלקוח המלאים לנהג הועתקו! פותח WhatsApp...');
      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      renderAll();
    },

    confirmOrderToCustomer(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      const text = buildCustomerConfirmationText(order);
      const custIntl = formatCleanIntlPhone(order.customerPhone);
      window.open(`https://wa.me/${custIntl}?text=${encodeURIComponent(text)}`, '_blank');
    },

    toggleOrderPaid(orderId) {
      const order = orders.find(o => o.id === orderId);
      if (!order) return;
      order.status = order.status === 'paid' ? 'assigned' : 'paid';
      saveOrders();
      showToast(order.status === 'paid' ? `עמלה של ₪${order.commissionAmount} סומנה כשולמה בביט/פייבוקס! 💸` : 'סטטוס העמלה עודכן', 'success');
      renderAll();
    },

    applyBrandPreset(presetId) {
      const p = DATA.brandPresets.find(b => b.id === presetId);
      if (!p) return;
      saveSettings({
        brandNameHe: p.nameHe,
        brandNameEn: p.nameEn,
        brandSlogan: p.slogan,
        logoStyle: p.logoStyle
      });
      showToast(`המותג עודכן ל-"${p.nameHe}"! ✨`);
    },

    saveSettingField(key, val) {
      saveSettings({ [key]: val });
      showToast('ההגדרה נשמרה ועודכנה באתר ✅');
    },

    updateCityPrice(cityId, dayPrice, nightPrice) {
      saveCityOverride(cityId, dayPrice, nightPrice);
      showToast('מחיר העיר עודכן במחירון ובמחשבון! 💰');
    },

    openQuickManualOrderModal() {
      const modalRoot = document.getElementById('modalRoot');
      if (!modalRoot) return;
      modalRoot.innerHTML = `
        <div class="fixed inset-0 z-50 modal-backdrop flex items-center justify-center p-4">
          <div class="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-amber-400">
            <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
              <h3 class="text-lg font-black text-slate-900">➕ הזנת נסיעה מהירה לשיבוץ וגזירת עמלה</h3>
              <button onclick="window.primeApp.closeModal()" class="text-slate-400 hover:text-slate-700 font-black">✕</button>
            </div>
            <div class="space-y-3 text-sm">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">איסוף (עיר וכתובת)</label>
                <input id="manOrigin" type="text" placeholder="לדוגמה: תל אביב, הירקון 80" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">יעד</label>
                <input id="manDest" type="text" placeholder="לדוגמה: נתב״ג טרמינל 3" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">מחיר ללקוח (₪)</label>
                  <input id="manPrice" type="number" value="160" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-black text-emerald-700" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">שעת איסוף</label>
                  <input id="manTime" type="text" value="מיידי (לעכשיו)" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">שם הלקוח</label>
                  <input id="manCustName" type="text" placeholder="שם הלקוח" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold" />
                </div>
                <div>
                  <label class="block text-xs font-bold text-slate-600 mb-1">טלפון הלקוח</label>
                  <input id="manCustPhone" type="tel" dir="ltr" placeholder="05X-XXXXXXX" class="w-full rounded-xl border border-slate-300 px-3 py-2 font-bold text-right" />
                </div>
              </div>
              <button onclick="window.primeApp.saveQuickManualOrder()"
                class="w-full gold-button py-3 rounded-2xl font-black text-sm mt-2 cursor-pointer">
                שמור והפק הודעת מכרז לנהגים 🚕
              </button>
            </div>
          </div>
        </div>
      `;
    },

    saveQuickManualOrder() {
      const origin = document.getElementById('manOrigin')?.value || 'תל אביב';
      const dest = document.getElementById('manDest')?.value || 'נתב״ג טרמינל 3';
      const price = Number(document.getElementById('manPrice')?.value || 150);
      const time = document.getElementById('manTime')?.value || 'מיידי';
      const custName = document.getElementById('manCustName')?.value || 'לקוח טלפוני';
      const custPhone = document.getElementById('manCustPhone')?.value || '050-0000000';
      const commPct = Number(settings.defaultCommissionPct || 15);
      const commAmt = Math.round((price * commPct) / 100);

      const newOrder = {
        id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
        createdAt: 'עכשיו (ידני)',
        serviceType: 'to_airport',
        serviceLabel: 'הזמנת מוקד מהירה',
        originLabel: origin,
        destLabel: dest,
        pickupTimeLabel: time,
        passengers: 2,
        suitcases: 2,
        vehicleName: 'מונית סדאן רגילה',
        extrasSummary: 'ללא תוספות',
        customerName: custName,
        customerPhone: custPhone,
        paymentMethod: 'ביט / מזומן',
        totalPrice: price,
        commissionPct: commPct,
        commissionAmount: commAmt,
        driverNet: price - commAmt,
        status: 'new',
        assignedDriverName: '',
        assignedDriverPhone: ''
      };

      orders.unshift(newOrder);
      saveOrders();
      window.primeApp.closeModal();
      showToast(`נסיעה #${newOrder.id} נוספה! עמלת תחנה: ₪${commAmt}`);
      renderAll();
    }
  };

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const partnerParam = params.get('partner');
      if (partnerParam === 'tal' || partnerParam === 'eliyahu') {
        window.primeApp.quickPartnerLogin(partnerParam);
      }
    } catch (e) {}
    renderAll();
    syncWithAwsCloud(true);
    setInterval(() => {
      syncWithAwsCloud(true);
    }, 7000);
  });
})();
