# 🚕 פריים טקסי (`PRIME TAXI v1.2.0`) — מערכת הזמנות ארצית, סדרן WhatsApp וגזירת עמלות

* **🌐 האתר החי באוויר (GitHub Pages PWA):** [https://fradkintal.github.io/prime-taxi/](https://fradkintal.github.io/prime-taxi/)
* **🐙 מאגר GitHub + GitHub Actions CI/CD:** [https://github.com/fradkintal/prime-taxi](https://github.com/fradkintal/prime-taxi)
* **👑 בעלים ושותפים (`Super Admin`):**
  * **טל פרדקין:** `054-6373001` (שם משתמש: `טל` / `tal` | קוד מהיר: `1234`)
  * **אליהו (שותף):** `050-7676946` (שם משתמש: `אליהו` / `eliyahu` | קוד מהיר: `1234`)

---

## חיבורי ענן מובנים (`GitHub Actions` • `Firebase` • `AWS`)

1. **GitHub Actions (`.github/workflows/deploy.yml`):**
   * בכל `git push origin main`, ה-Workflow מריץ בדיקת תקינות (`npm run check`), בונה את חבילת הייצור (`npm run build` לתוך `dist/`), ומעלה אוטומטית את האתר ל-**GitHub Pages** בכתובת `https://fradkintal.github.io/prime-taxi/`.
2. **Google Firebase (`firebase.json` + `.firebaserc`):**
   * מחובר לפרויקט הקיים שלך `tlator-759c6` עם הגדרות `Cache-Control: no-cache` עבור `index.html` ו-`version.json`, פלוס תמיכה ב-Firebase Phone Auth (עד 10,000 SMS חינם בחודש).
3. **AWS S3 + CloudFront (`714303613666` / `il-central-1`):**
   * מוגדר ב-`deploy.yml` להעלאה אוטומטית של נכסים עם Cache ארוך וניקוי מטמון (`CloudFront Invalidation`) ל-`index.html` ו-`version.json` ברגע שמוגדר `AWS_DEPLOY_ENABLED=true`.
4. **שרתי קוד אימות בחינם (`Green API WhatsApp` / `AWS SMS`):**
   * תמיכה מובנית בשליחת קודי OTP ב-WhatsApp בחינם דרך **Green API** (מתוך `el-sol-sys`) או דרך שרת ה-SMS הקיים ב-AWS (`elgarasi`).
