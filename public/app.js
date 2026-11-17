/* ============================================================
   Markus Influencer OS v1.1.4 — app.js
   Ứng dụng tĩnh, thuần JavaScript. Dữ liệu lưu ở localStorage.
   Không phụ thuộc thư viện hay công cụ build nào.
   ============================================================ */
(function () {
  "use strict";

  const STORE_KEY = "markus_influencer_os_v1_0";
  const THEME_KEY = "markus_os_theme";

  /* ---------- Tiện ích ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const uid = (p = "id") => p + "_" + Math.random().toString(36).slice(2, 9);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  /* 1.0.7 (item 6): bộ icon SVG premium (Feather/Lucide, stroke currentColor) thay emoji.
     KHÔNG áp cho icon nền tảng (TikTok/FB/IG/YT/Threads) — những cái đó giữ logo riêng. */
  const ICONS = {
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z"/><circle cx="12" cy="12" r="3"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m22 4-10 10.01-3-3"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    close: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>',
    sync: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    // R4 (mục 8): giỏ hàng dùng nét heroicons shopping-cart — cân đối hơn icon cũ.
    cart: '<path stroke-width="1.7" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272"/><circle cx="5.25" cy="20.25" r="1.35" stroke-width="1.7"/><circle cx="18" cy="20.25" r="1.35" stroke-width="1.7"/>',
    filter: '<path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    warn: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
    doc: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>',
    bot: '<rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 16h.01"/><path d="M16 16h.01"/>',
    sparkle: '<path d="M12 3l1.9 5.8L20 10l-6.1 1.2L12 17l-1.9-5.8L4 10l6.1-1.2z"/>',
    wallet: '<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-1"/><path d="M16 12h5v4h-5a2 2 0 0 1 0-4z"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/>',
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    bolt: '<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
    star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14l-5-4.87 6.91-1.01z"/>',
    menu: '<path d="M3 12h18"/><path d="M3 6h18"/><path d="M3 18h18"/>',
    arrowLeft: '<path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>',
    arrowRight: '<path d="M5 12h14"/><path d="M12 5l7 7-7 7"/>',
    send: '<path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4z"/>',
    building: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M8 10h.01"/><path d="M16 10h.01"/><path d="M8 14h.01"/><path d="M16 14h.01"/>',
  };
  function icon(name, size) {
    const p = ICONS[name];
    if (!p) return "";
    const s = size || 16;
    return `<svg class="icn icn-${name}" viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  }

  const fmtVND = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " ₫";
  // 1.0.2: không viết tắt số — hiển thị đầy đủ (610.000 thay vì 610K)
  const fmtNum = (n) => (Number(n) || 0).toLocaleString("vi-VN");
  const fmtShortVND = (n) => fmtVND(n); // giữ tên cũ nhưng trả về đầy đủ
  const fmtFollowers = (n) => fmtNum(n); // đầy đủ, không rút gọn K/M
  const SHOW_FULL_NUMBERS_KEY = "mkios_show_full_numbers";
  function compactNumber(n) {
    const value = Number(n) || 0;
    const abs = Math.abs(value);
    if (abs < 1000) return String(value);
    const units = ["K", "M", "B"];
    let unitIndex = Math.min(Math.floor(Math.log10(abs) / 3) - 1, units.length - 1);
    let scaled = value / Math.pow(1000, unitIndex + 1);
    let rounded = Math.round(scaled * 10) / 10;
    if (Math.abs(rounded) >= 1000 && unitIndex < units.length - 1) {
      unitIndex += 1;
      scaled = value / Math.pow(1000, unitIndex + 1);
      rounded = Math.round(scaled * 10) / 10;
    }
    return (Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)) + units[unitIndex];
  }
  function loadShowFullNumbers(storage) {
    try { return (storage || localStorage).getItem(SHOW_FULL_NUMBERS_KEY) === "1"; }
    catch (e) { return false; }
  }
  function saveShowFullNumbers(value, storage) {
    try { (storage || localStorage).setItem(SHOW_FULL_NUMBERS_KEY, value ? "1" : "0"); }
    catch (e) {}
  }
  let showFullBookingNumbers = loadShowFullNumbers();
  function bookingTableNumber(n, currency) {
    const value = Number(n) || 0;
    const suffix = currency ? " ₫" : "";
    const full = fmtNum(value) + suffix;
    const shown = (showFullBookingNumbers ? fmtNum(value) : compactNumber(value)) + suffix;
    return `<span class="bk-table-num" title="${esc(full)}">${esc(shown)}</span>`;
  }
  const fmtDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
  };
  const MONTHS_VI = ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"];
  const APP_VERSION = "1.1.4";
  const esc = (s) =>
    String(s == null ? "" : s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const initials = (name) =>
    String(name || "?").trim().split(/\s+/).slice(-2).map((w) => w[0] || "").join("").toUpperCase();

  // 1.0.11 (Mục A): gõ 1 ký tự = vẽ lại cả bảng 600+ dòng → lag. Gom lại, chỉ vẽ khi ngừng gõ.
  function debounce(fn, ms) {
    let t = null;
    return function () {
      const args = arguments, self = this;
      if (t) clearTimeout(t);
      t = setTimeout(() => { t = null; fn.apply(self, args); }, ms || 150);
    };
  }

  /* ---------- Danh mục cố định ---------- */
  // 1.0.2: icon nền tảng dùng SVG chính hãng (fill/stroke đơn sắc để theo theme)
  const PLATFORMS = {
    tiktok:    { label: "TikTok",    icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>` },
    instagram: { label: "Instagram", icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>` },
    youtube:   { label: "YouTube",   icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>` },
    facebook:  { label: "Facebook",  icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.8V24C19.62 23.1 24 18.1 24 12.07z"/></svg>` },
    threads:   { label: "Threads",   icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12.19 2.38a9.34 9.34 0 0 0-9.55 9.28 9.34 9.34 0 0 0 9.53 9.36 9.3 9.3 0 0 0 6.36-2.56l-.15-.2a.7.7 0 0 0-.53-.25h-.02a.7.7 0 0 0-.5.2 7.65 7.65 0 0 1-5.15 2c-4.14 0-7.1-2.99-7.1-6.56 0-3.54 2.96-6.52 7.1-6.52 3.6 0 5.76 1.7 6.5 4.43.62 2.29.3 4.16-1.05 5.15-.5.37-1.06.4-1.42.26-.44-.17-.52-.65-.4-1.25.15-.75.3-2.07-.42-3.05-.68-.93-1.94-1.16-3.16-.95-1.48.26-2.55 1.28-2.7 2.6-.12 1.04.47 2.04 1.47 2.4.63.23 1.5.24 2.26-.09.22-.1.5-.23.76-.4-.3.88-1.03 1.82-2.6 1.82-1.8 0-3.2-1.39-3.03-3.32.14-1.62 1.66-3.36 3.88-3.7 1.55-.24 3.17.19 4.07 1.32.85 1.07.93 2.51.53 3.62-.35.96-1.26 1.73-2.34 1.98-.8.19-1.6.08-2.13-.3a2.6 2.6 0 0 1-1.16-1.56 2.74 2.74 0 0 1-.07-.72c0-.32.03-.68.1-1.03a4.4 4.4 0 0 0-.86-1.04c-.1-.1-.4-.35-.55-.48-.16-.14-.32-.28-.49-.41-.33-.24-.69-.37-1.02-.26-.36.12-.62.42-.75.75-.18.47.03 1.06.2 1.4.16.32.35.63.55.93l.01.01a5.1 5.1 0 0 1-.19 1.86c-.2.65-.59 1.26-1.14 1.77-.66.61-1.5.99-2.42 1.08a6.3 6.3 0 0 1-1.72-.13c1.85 1.05 4 1.63 6.23 1.63a11.8 11.8 0 0 0 3.57-.55 4.3 4.3 0 0 0 2.8-2.66c.1-.26.18-.54.24-.84.02-.08.03-.16.05-.24.25-1.14.37-2.9-.27-4.6-.68-1.8-2.03-3.05-3.93-3.56-1.34-.36-2.77-.34-4.1.17a7.9 7.9 0 0 0-4.24 3.8c-.58 1.06-.9 2.28-.9 3.56 0 3.7 2.6 6.65 7.16 6.65a7.36 7.36 0 0 0 5.33-2.1c1.76-1.75 2.65-4.42 2.44-7.33a9.9 9.9 0 0 0-3.86-7.04 11.8 11.8 0 0 0-7.5-2.38z"/></svg>` },
    // 1.0.11 (Mục D5): SETTINGS sheet có thêm Threads / Livestream / Offline — KHÔNG đưa vào
    // PLATFORM_COL_KEYS vì không có cột follower riêng, chỉ dùng làm "nền tảng chính".
    livestream: { label: "Livestream",   icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M6.34 6.34a8 8 0 0 0 0 11.32l1.42-1.42a6 6 0 0 1 0-8.48L6.34 6.34zm11.32 0l-1.42 1.42a6 6 0 0 1 0 8.48l1.42 1.42a8 8 0 0 0 0-11.32z"/></svg>` },
    offline:    { label: "Offline / Event", icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>` },
    zalo:      { label: "Zalo OA",   icon: `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true"><path d="M12.49 10.27V7.05a.22.22 0 0 0-.22-.22h-.9a.22.22 0 0 0-.22.22v5.2c0 .12.1.22.22.22h4.64a.22.22 0 0 0 .22-.22v-.88a.22.22 0 0 0-.22-.22h-3.3a.22.22 0 0 1-.22-.22zM21.2 5.5h-4.42a.22.22 0 0 0-.22.22v.92c0 .12.1.22.22.22h4.1a.5.5 0 0 1 .5.5v5.1c0 .6-.48 1.08-1.08 1.08h-3.53a.5.5 0 0 1-.5-.5V10.3a.22.22 0 0 0-.22-.22h-.9a.22.22 0 0 0-.22.22v2.85a2.07 2.07 0 0 0 2.08 2.07h3.27a2.07 2.07 0 0 0 2.08-2.08V7.57A2.07 2.07 0 0 0 21.2 5.5zM3.3 10.55l2.48-2.9h-2.3a.22.22 0 0 1-.22-.22v-.84c0-.12.1-.22.22-.22h3.9c.1 0 .19.07.21.17.03.12-.01.24-.1.32l-2.6 3.04 2.42 3.46c.08.12.02.28-.12.32-.05.02-.1.03-.16.03h-2.4a.22.22 0 0 1-.18-.1l-2.15-3.08a.22.22 0 0 0-.36 0l-.53.77a.22.22 0 0 0 .06.3l2.62 3.75c.07.1.07.24 0 .35a.22.22 0 0 1-.18.1H1.95a.22.22 0 0 1-.18-.33L4.5 11.9a.22.22 0 0 0-.02-.25L1.6 7.5a.22.22 0 0 1 .18-.34h2.44c.08 0 .15.04.18.1z"/></svg>` },
  };
  // 1.0.5: 4 nền tảng có cột follower riêng trong header 2 tầng "Nền tảng"
  const PLATFORM_COL_KEYS = ["tiktok", "facebook", "instagram", "youtube"];
  const TIERS = {
    nano:  { label: "Nano",  hint: "1K–10K" },
    micro: { label: "Micro", hint: "10K–100K" },
    macro: { label: "Macro", hint: "100K–1M" },
    mega:  { label: "Mega",  hint: "1M+" },
  };
  // 1.0.11 (Mục D2): 20 ngành hàng LẤY ĐÚNG tab SETTINGS của sheet CREATOR_DB (bỏ list tự chế cũ)
  const NICHES = [
    "Beauty", "Fashion & Style", "Food & Cooking", "F&B Review", "Travel",
    "Mom & Baby / Parenting", "Health & Fitness", "Tech & Gadget", "Auto & Moto", "Finance & Business",
    "Education & Learning", "Home & Living", "Pet", "Gaming", "Music & Performance",
    "Comedy & Entertainment", "Lifestyle Vlog", "News & Commentary", "Sport", "Celebrity / Talent",
  ];
  const KOL_STATUS = {
    active:    { label: "Đang hợp tác", tag: "success" },
    negotiate: { label: "Đang đàm phán", tag: "warning" },
    potential: { label: "Tiềm năng",     tag: "info" },
    paused:    { label: "Tạm dừng",      tag: "danger" },
  };
  const CAMP_STATUS = {
    planning: { label: "Lên kế hoạch", tag: "info" },
    running:  { label: "Đang chạy",    tag: "success" },
    review:   { label: "Chờ duyệt",    tag: "warning" },
    done:     { label: "Hoàn thành",   tag: "primary" },
    paused:   { label: "Tạm dừng",     tag: "danger" },
  };
  const PIPELINE_STAGES = [
    { id: "lead",   label: "Tiếp cận" },
    { id: "brief",  label: "Gửi brief" },
    { id: "nego",   label: "Đàm phán giá" },
    { id: "signed", label: "Đã ký HĐ" },
    { id: "live",   label: "Đang triển khai" },
    { id: "won",    label: "Nghiệm thu" },
  ];
  const CONTENT_STATUS = {
    idea:      { label: "Ý tưởng",      tag: "info" },
    scripting: { label: "Viết kịch bản", tag: "warning" },
    filming:   { label: "Đang quay",    tag: "warning" },
    editing:   { label: "Hậu kỳ",       tag: "primary" },
    scheduled: { label: "Đã lên lịch",  tag: "info" },
    posted:    { label: "Đã đăng",      tag: "success" },
  };
  const CONTENT_TYPES = ["Video ngắn", "Reels", "Bài viết", "Livestream", "Story", "Đánh giá SP"];
  const PAY_STATUS = {
    pending: { label: "Chờ thanh toán", tag: "warning" },
    paid:    { label: "Đã thanh toán",  tag: "success" },
    overdue: { label: "Quá hạn",        tag: "danger" },
  };

  /* ============================================================
     Đăng nhập & phân quyền (prototype — không có backend thật)
     ============================================================ */
  const SESSION_KEY = "markus_os_v1_0_session";
  // 1.0.7 (item 5c): đúng 3 vai như google-auth.php + tab Employees — Admin / Planner / Viewer.
  const ROLES = {
    admin:   { label: "Admin",   tag: "admin",   hint: "Toàn quyền, kể cả quản lý người dùng" },
    planner: { label: "Planner", tag: "planner", hint: "Nghiệp vụ booking: thêm/sửa, xem giá, xuất file" },
    viewer:  { label: "Viewer",  tag: "viewer",  hint: "Xem dữ liệu, chọn KOL vào giỏ; không thấy giá & liên hệ" },
  };
  // Vai cũ (manager/staff của 1.0.6, "account" trên sheet) vẫn đăng nhập được sau khi đổi tên vai.
  const ROLE_ALIAS = { manager: "planner", staff: "viewer", account: "planner", owner: "admin", "nhân viên": "viewer" };
  const normRole = (r) => {
    const k = String(r == null ? "" : r).trim().toLowerCase();
    return ROLES[k] ? k : ROLE_ALIAS[k] || "viewer";
  };

  /* 1.0.7 (item 5a) — Người dùng KHÔNG còn nằm ở localStorage: danh sách thật là tab
     Employees trên Google Sheet (cùng nguồn google-auth.php dùng để xác thực). App đọc/ghi
     qua write-back.php (kind: "employees"). */
  let employees = [];
  /* 1.0.7 (item 5b) — bỏ toàn bộ mật khẩu. Đăng nhập chính thức = Google Sign-In.
     ?demo=1 chỉ để dev xem nhanh 3 vai, không có xác thực và không có mật khẩu. */
  const DEMO_USERS = []; const DEMO_USERS_UNUSED = [
    { name: "Đạt Phạm", email: "admin@example.com", role: "admin" },
    { name: "Planner Demo", email: "admin@example.com", role: "planner" },
    { name: "Viewer Demo", email: "admin@example.com", role: "viewer" },
  ];
  let currentUser = null;
  function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY) || "null"); }
    catch (e) { return null; }
  }
  function saveSession(user, remember) {
    const raw = JSON.stringify(user);
    if (remember) localStorage.setItem(SESSION_KEY, raw);
    sessionStorage.setItem(SESSION_KEY, raw);
  }
  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
  }
  function can(perm) {
    if (!currentUser) return false;
    const r = normRole(currentUser.role);
    switch (perm) {
      case "manage":  return r === "admin" || r === "planner"; // thêm/sửa, đổi verify status
      case "delete":  return r === "admin";                    // xóa bản ghi
      case "private": return r === "admin" || r === "planner"; // xem liên hệ + giá
      case "export":  return r === "admin" || r === "planner"; // xuất file
      case "shortlist": return true;                           // ai cũng chọn được vào giỏ
      case "manage_users": return r === "admin";               // CRUD tài khoản trên tab Employees
      default: return false;
    }
  }

  /* ---------- Danh mục Booking Database (KOL/KOC + Community) ---------- */
  // 1.0.11 (Mục D4): Base_Location = 34 tỉnh/thành đúng tab SETTINGS (danh sách cũ chỉ có 6 mục tự chế)
  const BASE_LOCATIONS = [
    "TP. Hà Nội", "TP. Huế", "TP. Hải Phòng", "TP. Đà Nẵng", "TP. Hồ Chí Minh",
    "TP. Cần Thơ", "Tỉnh Lai Châu", "Tỉnh Điện Biên", "Tỉnh Sơn La", "Tỉnh Lạng Sơn",
    "Tỉnh Quảng Ninh", "Tỉnh Thanh Hóa", "Tỉnh Nghệ An", "Tỉnh Hà Tĩnh", "Tỉnh Cao Bằng",
    "Tỉnh Tuyên Quang", "Tỉnh Lào Cai", "Tỉnh Thái Nguyên", "Tỉnh Phú Thọ", "Tỉnh Bắc Ninh",
    "Tỉnh Hưng Yên", "Tỉnh Ninh Bình", "Tỉnh Quảng Trị", "Tỉnh Quảng Ngãi", "Tỉnh Gia Lai",
    "Tỉnh Khánh Hòa", "Tỉnh Lâm Đồng", "Tỉnh Đắk Lắk", "Tỉnh Đồng Nai", "Tỉnh Tây Ninh",
    "Tỉnh Vĩnh Long", "Tỉnh Đồng Tháp", "Tỉnh Cà Mau", "Tỉnh An Giang",
  ];
  const REGIONS = BASE_LOCATIONS; // 1.0.11: giữ tên cũ để mọi chỗ đang dùng REGIONS không phải sửa
  // 1.1.1: rút gọn "Thành phố" -> "TP." để hiển thị gọn; dùng cho cả filter 2 chiều (data cũ/mới khớp nhau)
  function normRegion(s) {
    return String(s || "").replace(/\s*Thành phố\s*/gi, "TP. ").replace(/\s+/g, " ").trim();
  }
  const BOOKING_NICHES = NICHES; // 1.0.11 (Mục D2): sheet đã đủ 20 ngành, bỏ concat 2 ngành tự thêm
  // 1.0.11 (Mục D3): Casting_Profile thay cho "Giới tính" — 10 giá trị chuẩn SETTINGS
  const CASTING_PROFILES = ["Nam", "Nữ", "Nữ - Mẹ bỉm", "Nữ - Mẹ con lớn", "Nam - Ông bố", "Couple", "Family", "Nhóm / Team", "LGBTQ+", "Khác"];
  // 1.0.11 (Mục D7/D8/D9): 3 cột SETTINGS chưa có trong app
  const CREATOR_TYPES = ["Reviewer", "Expert", "Entertainer", "Lifestyle Creator", "Livestreamer", "UGC Creator", "Celebrity", "Public Figure"];
  const REPRESENTATIONS = ["Self-managed", "Manager", "MCN", "Talent Agency"];
  const CONTACT_CHANNELS = ["Zalo", "Phone", "Email", "Facebook Messenger", "Instagram DM", "TikTok DM", "Qua MCN"];
  // 1.0.11 (Mục D12): 4 trường vận hành, chỉ lưu localStorage — sheet chưa có cột nên không write-back
  const CONTRACT_STATUS = ["Chưa ký", "Đã gửi", "Đã ký", "Không cần HĐ"];
  const PAYMENT_STATUS_TXT = ["Chưa thanh toán", "Đã tạm ứng", "Đã thanh toán", "Quá hạn"];
  const RECOMMEND_AGAIN = ["Yes", "Conditional", "No"];
  const ISSUE_LEVELS = ["None", "Minor", "Major"];
  const KOL_FORMATS = ["Video ngắn", "Reels", "Bài viết", "Livestream", "Story", "Đánh giá SP"];
  const COMMUNITY_FORMATS = ["Bài viết ghim", "Bài viết thường", "Album ảnh", "Livestream", "Story"];
  const ENGAGEMENT_QUALITY = ["Cao", "Trung bình", "Thấp"];
  const STAGES = {
    research: { label: "Daily Research", tag: "warning" },
    verified: { label: "Verified Database", tag: "success" },
  };
  /* 1.0.11 (Mục D6) — cột "Xác minh" thật ra là Relationship_Status trên sheet: 7 giá trị chuẩn
     SETTINGS. Giữ tên biến VERIFY_STATUS để mọi chỗ đang đọc không phải sửa; RELATIONSHIP_STATUS
     là tên đúng nghĩa. Data cũ (unverified/checking/verified) được map lại qua normVerify(). */
  const RELATIONSHIP_STATUS = {
    uncontacted:  { label: "Chưa liên hệ",      tag: "secondary" },
    contacted:    { label: "Đã liên hệ",        tag: "info" },
    quoted:       { label: "Đã báo giá",        tag: "warning" },
    collaborated: { label: "Đã hợp tác",        tag: "success" },
    preferred:    { label: "Preferred Partner", tag: "primary" },
    watch:        { label: "Watch",             tag: "warning" },
    blacklist:    { label: "Blacklist",         tag: "danger" },
  };
  const VERIFY_STATUS = RELATIONSHIP_STATUS;
  const RELATIONSHIP_LABELS = Object.keys(RELATIONSHIP_STATUS).map((k) => RELATIONSHIP_STATUS[k].label);
  const VERIFY_LEGACY = { unverified: "uncontacted", checking: "contacted", verified: "collaborated" };
  function normVerify(v) {
    const k = String(v == null ? "" : v).trim();
    if (RELATIONSHIP_STATUS[k]) return k;
    return VERIFY_LEGACY[k.toLowerCase()] || "uncontacted";
  }
  function verifyMeta(v) { return RELATIONSHIP_STATUS[normVerify(v)]; }
  // Chữ trong ô Relationship_Status trên sheet → key trạng thái (để tô pill đúng màu)
  function relStatusKey(raw, hasPrice) {
    const l = String(raw == null ? "" : raw).toLowerCase();
    if (/black\s*list/.test(l)) return "blacklist";
    if (/preferred/.test(l)) return "preferred";
    if (/watch/.test(l)) return "watch";
    if (/đã hợp tác|da hop tac|collaborat/.test(l)) return "collaborated";
    if (/báo giá|bao gia|quote/.test(l)) return "quoted";
    if (/đã liên hệ|da lien he|contacted/.test(l)) return "contacted";
    return hasPrice ? "quoted" : "uncontacted";
  }
  function tierOf(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return "mega";
    if (n >= 1e5) return "macro";
    if (n >= 1e4) return "micro";
    return "nano";
  }
  // 1.0.12 (Mục B3): bộ lọc Tier so theo CHỮ chuẩn sheet. Record thiếu cột Tier thì suy từ follower
  // (tierOf chỉ ra 4 bậc cũ → map sang chữ; Mid-Tier chỉ có khi sheet ghi rõ).
  const TIER_KEY_TEXT = { nano: "Nano", micro: "Micro", macro: "Macro", mega: "Celeb" };
  function tierText(x, reach) {
    return String(x.tier || "").trim() || TIER_KEY_TEXT[tierOf(reach)];
  }
  // 1.0.12 (Mục B4): nhãn "Lịch sử làm việc" đang hiện trong bảng — dùng chung cho bộ lọc để khớp mắt nhìn
  function relLabel(x) {
    const key = x.verifyStatus ? normVerify(x.verifyStatus) : relStatusKey(x.relationship || x.workHistory, (x.estimatedPrice || 0) > 0);
    return RELATIONSHIP_STATUS[key].label;
  }

  /* ---------- Trạng thái ứng dụng ---------- */
  let state = load();

  function defaultState() {
    return { influencers: [], campaigns: [], deals: [], contents: [], payments: [], kolDb: [], communityDb: [], shortlist: {} };
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return defaultState();
      return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {
      console.warn("Không đọc được dữ liệu, bắt đầu với dữ liệu trống (bản gốc được giữ ở khóa _corrupt_backup_<thời điểm>).", e); try { const bad = localStorage.getItem(STORE_KEY); if (bad) localStorage.setItem(STORE_KEY + "_corrupt_backup_" + Date.now(), bad); } catch (_) {} return defaultState();
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
    catch (e) { toast("Lỗi lưu trữ", "Không thể lưu vào bộ nhớ trình duyệt.", "danger"); }
  }

  /* ---------- Dữ liệu mẫu ---------- */
  function seedData() { return { influencers: [], campaigns: [], deals: [], contents: [], payments: [], kolDb: [], communityDb: [], shortlist: {} }; }

  /* ============================================================
     1.0.3 — Đồng bộ CSDL creator từ Google Sheet CREATOR_DB
     Sheet YOUR_GOOGLE_SHEET_ID, tab CREATOR_DB.
     Backend `sync-data.php` trả { ok, header, rows, links, count, updatedAt };
     rows là mảng ô theo cột A..BF (index 0 = cột 1);
     links[i] = { tiktok, facebook, instagram, youtube } — URL thật lấy từ hyperlink của ô.
     ============================================================ */
  // v103a: cache cũ (v103) không có `links` → bump key để tự nạp lại từ sheet
  const CREATOR_CACHE_KEY = "mkios_creator_db_v103a";
  const SYNC_URL = "sync-data.php";
  const AI_PARSE_URL = "ai-parse.php";
  const AI_FETCH_URL = "ai-fetch.php";     // 1.0.9 (C2): đọc link Google Sheet/Docs/Slides + website
  const AI_CHAT_URL = "ai-chat.php";       // 1.0.7 (item 15): proxy DeepSeek chat
  const AI_HISTORY_URL = "ai-history.php"; // 1.0.7 (item 17): lịch sử hội thoại theo account
  const GOOGLE_AUTH_URL = "google-auth.php";
  const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
  const PING_URL = "ping.php";         // 1.1.3: heartbeat "đang hoạt động"
  const ACTIVITY_URL = "activity.php"; // 1.1.3: đọc trạng thái online/offline cho bảng Users

  /* ---------- 1.1.3: Heartbeat + trạng thái online/offline (Users) ---------- */
  // Phải khớp ĐÚNG quy tắc sanitize filename của hosting/ping.php — email gốc có "@" nên
  // không dùng thẳng làm key tra activitySeen[].
  function sanitizeEmailKey(email) {
    return String(email == null ? "" : email).trim().toLowerCase().replace(/[^a-z0-9._-]/g, "_");
  }
  let activitySeen = {}; // sanitizeEmailKey(email) -> unix ts (lastSeen), nạp từ activity.php
  function loadActivity() {
    return apiFetch(ACTIVITY_URL)
      .then((r) => r.json())
      .then((r) => { if (r && r.ok && r.seen) activitySeen = r.seen; return r; })
      .catch(() => null); // lỗi mạng/404 → giữ nguyên activitySeen cũ, im lặng bỏ qua
  }
  let heartbeatTimer = null;
  function pingActivity() {
    if (!currentUser || !currentUser.email) return;
    apiFetch(PING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: String(currentUser.email).toLowerCase() }),
    }).catch(() => {}); // ping lỗi (mạng/404) → bỏ qua im lặng, không toast
  }
  function startHeartbeat() {
    pingActivity();
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(pingActivity, 60000);
  }
  function stopHeartbeat() {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  /* Bug 1.0.3 → vá ở 1.0.4: file PHP nằm trong thư mục `hosting/` nhưng app gọi URL tương đối ở
     gốc → 404 trả về trang HTML → res.json() ném "Unexpected token '<'" → sync hỏng, rơi về seed.
     apiFetch() thử `hosting/<file>` trước rồi lùi về `./<file>`, nên chạy đúng cả khi PHP được
     upload cùng cấp với index.html (kiểu bundle _host cũ). */
  const API_BASES = [""];
  function apiFetch(file, init) {
    const tryAt = (i) =>
      fetch(new URL(API_BASES[i] + file, document.baseURI).href, init).then(
        (res) => (res.status === 404 && i + 1 < API_BASES.length ? tryAt(i + 1) : res),
        (err) => (i + 1 < API_BASES.length ? tryAt(i + 1) : Promise.reject(err))
      );
    return tryAt(0);
  }

  const cell = (r, col) => String(r && col && r[col - 1] != null ? r[col - 1] : "").trim();

  // Vị trí cột mặc định (1-based) đọc từ sheet thật ngày 2026-08-07.
  // Sheet có cột "Note" ở 21 nên nhóm nền tảng bắt đầu từ 22 — nhưng luôn ưu tiên
  // dò theo tên cột ở header row 3 để không vỡ nếu ai đó chèn/xóa cột.
  const CREATOR_COL_DEFAULT = {
    creator_name: 2, tier: 3, primary_category: 4, secondary_category: 5,
    creator_type: 6, // 1.0.11 (Mục D11): cột C6 Creator_Type — trước đây bỏ sót
    casting_profile: 7, year_of_birth: 8, base_location: 9, representation: 12,
    contact_person: 13, contact_channel: 14, contact_detail: 15,
    company_email: 16, company_phone: 17, personal_email: 19, personal_phone: 20,
    hero_platform: 22, tiktok: 23, sub_tiktok: 24, facebook: 25, sub_facebook: 26,
    instagram: 27, sub_ig: 28, youtube: 29, sub_youtube: 30, threads: 31,
    relationship_status: 32,
  };
  const normHdr = (s) => String(s == null ? "" : s).trim().toLowerCase().replace(/\s+/g, "_");
  let creatorCols = Object.assign({}, CREATOR_COL_DEFAULT);
  let creatorSowCols = [];

  // 1.0.7 (item 12): cột SOW dò theo TÊN header (photo/video/sự kiện/nhãn hàng/live) thay vì
  // đếm cứng "5 cột sau Relationship_Status" — chèn/xóa cột trên sheet không làm lệch giá nữa.
  const SOW_HDR_RE = /(photo|video|event|sự kiện|live|brand|nhãn hàng)/i;
  // 1.0.7 (item 3): cột "Lịch sử làm việc" — sheet có thể đặt tên Việt hoặc Anh
  const WORK_HDR_RE = /^(lịch sử làm việc|lich su lam viec|work[_ ]?history)$/i;
  function buildCreatorCols(header) {
    const map = Object.assign({}, CREATOR_COL_DEFAULT);
    (header || []).forEach((h, i) => { const k = normHdr(h); if (k) map[k] = i + 1; });
    (header || []).forEach((h, i) => { if (WORK_HDR_RE.test(String(h == null ? "" : h).trim())) map.work_history = i + 1; });
    creatorCols = map;
    creatorSowCols = [];
    (header || []).forEach((h, i) => {
      const label = String(h == null ? "" : h).trim();
      if (i + 1 > map.relationship_status && label && SOW_HDR_RE.test(label)) creatorSowCols.push({ col: i + 1, label });
    });
    // Sheet thiếu header (hoặc đổi tên hết) → lùi về cách cũ: 5 cột ngay sau Relationship_Status
    if (!creatorSowCols.length) {
      for (let c = map.relationship_status + 1; c <= map.relationship_status + 5; c++) {
        const label = header && header[c - 1] ? String(header[c - 1]).trim() : "";
        if (label) creatorSowCols.push({ col: c, label });
      }
    }
  }

  // "1,800,000" | "1.800.000" | "1.8M" | "1,8M" | "405K" → số nguyên
  function parseFollowers(s) {
    const raw = String(s == null ? "" : s).trim();
    if (!raw) return 0;
    const m = raw.match(/([\d.,]+)\s*([kKmM])?/);
    if (!m) return 0;
    if (m[2]) {
      const f = parseFloat(m[1].replace(",", "."));
      if (!isFinite(f)) return 0;
      return Math.round(f * (m[2].toLowerCase() === "m" ? 1e6 : 1e3));
    }
    return Number(m[1].replace(/[.,]/g, "")) || 0;
  }

  // Relationship_Status: số → giá; "Đã báo giá" → tag vàng; "TBU" → tag xám; trống → "—"
  function parseRelationship(v) {
    const s = String(v == null ? "" : v).trim();
    if (!s) return { price: 0, status: "", tag: "" };
    const numeric = s.replace(/(vnđ|vnd|₫|đ)\s*$/i, "").replace(/[.,\s]/g, "");
    if (/^\d+$/.test(numeric)) return { price: Number(numeric), status: "", tag: "" };
    const low = s.toLowerCase();
    const tag = low.includes("báo giá") ? "warning" : low.includes("tbu") ? "" : "info";
    return { price: 0, status: s, tag };
  }

  // Nhãn loại nội dung suy ra từ tên cột SOW ("Photo Post" → Photo, "Livestream" → Live)
  function sowLabel(s) {
    const l = String(s == null ? "" : s).toLowerCase();
    if (l.includes("photo") || l.includes("hình") || l.includes("ảnh")) return "Photo";
    if (l.includes("live")) return "Live";
    if (l.includes("sự kiện") || l.includes("event")) return "Event";
    if (l.includes("video")) return "Video";
    return String(s == null ? "" : s).trim() || "SOW";
  }

  // 1.0.7 (item 12): tên cột SOW → key format cho 5 cột giá. "Video của nhãn hàng" tách riêng khỏi "Video Post".
  function priceFormatKey(label) {
    const l = String(label == null ? "" : label).toLowerCase();
    if (l.includes("photo") || l.includes("hình") || l.includes("ảnh")) return "photo";
    if (l.includes("sự kiện") || l.includes("event")) return "event";
    if (l.includes("live")) return "live";
    if (l.includes("nhãn hàng") || l.includes("brand")) return "brandvideo";
    if (l.includes("video")) return "video";
    return null;
  }
  // 1.1.2: số tiền trong bảng Booking dùng K/M/B; title luôn giữ số đầy đủ.
  function fmtPriceShort(amount) {
    return bookingTableNumber(amount, false);
  }
  // Ô giá 1 format: có số → tiền gọn; ô ghi "TBU" → tag TBU; còn lại "—"
  function fmtPrice(rec, key) {
    const p = rec.priceByFormat && rec.priceByFormat[key];
    if (p && p.amount > 0) return fmtPriceShort(p.amount);
    if (p && /tbu/i.test(String(p.raw || ""))) return `<span class="tb">TBU</span>`;
    return "—";
  }

  /* Bóc giá VND từ câu văn trong cột SOW.
     Nhận: "40,000,000" · "40.000.000" · "10 triệu" · "5tr" · "500k" · "1.5 tỷ".
     Trả { amount: số lớn nhất, items: [{label, amount}] }. */
  const SOW_UNITS = [
    { re: /(t[yỷ]|billion)/i, mul: 1e9 },
    { re: /(tri[eệ]u|tr|m)$/i, mul: 1e6 },
    { re: /(ngh[iì]n|ng[aà]n|k)$/i, mul: 1e3 },
  ];
  function parseSOWPrice(text, label) {
    const s = String(text == null ? "" : text);
    const items = [];
    // số (có , . cách nhóm) + đơn vị chữ tùy chọn ngay sau
    const re = /(\d[\d.,]*)\s*(t[yỷ]|tri[eệ]u|tr|ngh[iì]n|ng[aà]n|[kmKM])?(?![\d.,%])/g;
    let m;
    while ((m = re.exec(s))) {
      const unit = m[2] || "";
      let amount;
      if (unit) {
        const u = SOW_UNITS.find((x) => x.re.test(unit));
        const f = parseFloat(m[1].replace(/,/g, "."));
        if (!isFinite(f) || !u) continue;
        amount = Math.round(f * u.mul);
      } else {
        // không có đơn vị → chỉ nhận số đã nhóm hàng nghìn ("40,000,000"), tránh bắt "01 Video"
        if (!/[.,]/.test(m[1])) continue;
        amount = Number(m[1].replace(/[.,]/g, ""));
      }
      // Ngưỡng thực tế: giá booking KOL luôn ≥ 100k, bỏ số lẻ như "1.5" trong "1.5 phút"
      if (amount >= 100000) items.push({ label: label || "SOW", amount });
    }
    const amount = items.reduce((mx, it) => Math.max(mx, it.amount), 0);
    return { amount, items };
  }

  function heroKey(s) {
    const l = String(s == null ? "" : s).toLowerCase();
    if (l.includes("tiktok")) return "tiktok";
    if (l.includes("insta")) return "instagram";
    if (l.includes("you")) return "youtube";
    if (l.includes("face")) return "facebook";
    if (l.includes("thread")) return "threads";
    if (l.includes("zalo")) return "zalo";
    return "tiktok";
  }
  // Ô nền tảng trên sheet thường chỉ hiển thị nhãn ("TikTok") vì URL nằm trong
  // hyperlink — Sheets values API không trả URL. Chỉ nhận khi thật sự là link.
  function handleFromLink(link) {
    const s = String(link == null ? "" : link).trim();
    if (!s) return "";
    if (s.startsWith("@")) return s;
    if (!/^https?:\/\//i.test(s)) return "";
    const seg = s.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop();
    return seg ? (seg.startsWith("@") ? seg : "@" + seg) : "";
  }
  const asUrl = (s) => (/^https?:\/\//i.test(String(s || "").trim()) ? String(s).trim() : "");

  function mapCreatorRow(r, i, linkRow) {
    const C = creatorCols;
    const name = cell(r, C.creator_name);
    if (!name) return null;
    const platform = heroKey(cell(r, C.hero_platform));
    const hl = linkRow || {};
    // Ưu tiên URL từ hyperlink (sync-data.php), fallback text trong ô
    const links = {
      tiktok: asUrl(hl.tiktok) || cell(r, C.tiktok),
      facebook: asUrl(hl.facebook) || cell(r, C.facebook),
      instagram: asUrl(hl.instagram) || cell(r, C.instagram),
      youtube: asUrl(hl.youtube) || cell(r, C.youtube),
      threads: cell(r, C.threads),
    };
    const subs  = { tiktok: cell(r, C.sub_tiktok), facebook: cell(r, C.sub_facebook), instagram: cell(r, C.sub_ig), youtube: cell(r, C.sub_youtube) };
    // 1.0.5: follower + URL riêng từng nền tảng cho header 2 tầng "Nền tảng".
    // Cột nền tảng (23/25/27/29) chứa hyperlink → URL; số follower nằm ở cột Sub_* kế bên,
    // nhưng vài dòng lại ghi thẳng số vào ô nền tảng → fallback parse text của chính ô đó.
    const platStats = {};
    PLATFORM_COL_KEYS.forEach((k) => {
      const raw = cell(r, C[k === "instagram" ? "sub_ig" : "sub_" + k]);
      const n = parseFollowers(raw) || (asUrl(links[k]) ? 0 : parseFollowers(links[k]));
      platStats[k] = { followers: n, url: asUrl(links[k]) };
    });
    const rel = parseRelationship(cell(r, C.relationship_status));
    const email = cell(r, C.personal_email) || cell(r, C.company_email);
    const phone = cell(r, C.personal_phone) || cell(r, C.company_phone);
    // Contact_Channel chỉ là nhãn kênh ("Phone"/"Email") → bỏ qua nếu không có chi tiết
    const contact = [cell(r, C.contact_person), cell(r, C.contact_detail)].filter(Boolean).join(" · ")
      || [email, phone].filter(Boolean).join(" · ");
    const sow = creatorSowCols
      .map((s) => (cell(r, s.col) ? s.label + ": " + cell(r, s.col) : ""))
      .filter(Boolean);
    // Relationship_Status thường chỉ là chữ → giá số thật nằm trong 5 cột SOW
    const priceItems = rel.price ? [] : creatorSowCols
      .reduce((acc, s) => acc.concat(parseSOWPrice(cell(r, s.col), sowLabel(s.label)).items), []);
    const sowPrice = priceItems.reduce((mx, it) => Math.max(mx, it.amount), 0);
    // 1.0.7 (item 12): giá theo từng format từ AG:AK — luôn đọc ô gốc (kể cả khi đã có giá chốt)
    const priceByFormat = {};
    creatorSowCols.forEach((s) => {
      const key = priceFormatKey(s.label);
      if (!key) return;
      const raw = cell(r, s.col);
      priceByFormat[key] = { amount: parseSOWPrice(raw, s.label).amount, raw };
    });
    const pAmt = (k) => (priceByFormat[k] || {}).amount || 0;
    const profileUrl = asUrl(links[platform]);
    return {
      id: "cdb_" + (i + 1),
      name,
      handle: handleFromLink(links[platform]),
      link: profileUrl,
      profileUrl,
      socialLinks: { tiktok: asUrl(links.tiktok), facebook: asUrl(links.facebook), instagram: asUrl(links.instagram), youtube: asUrl(links.youtube) },
      platStats,
      fTiktok: platStats.tiktok.followers,
      fFacebook: platStats.facebook.followers,
      fInstagram: platStats.instagram.followers,
      fYoutube: platStats.youtube.followers,
      platform,
      tier: cell(r, C.tier),
      // 1.0.6: Dashboard cần đúng chữ gốc trên sheet (hero platform trống ≠ TikTok,
      // Relationship_Status vẫn phải đọc được kể cả khi đã bóc ra giá từ cột SOW).
      heroRaw: cell(r, C.hero_platform),
      relationship: cell(r, C.relationship_status),
      // 1.0.7 (item 3): cột "Lịch sử làm việc" — dò theo tên header, sheet chưa đổi tên thì
      // lùi về cột AF (Relationship_Status) đúng như dữ liệu hiện tại.
      workHistory: cell(r, C.work_history || C.relationship_status),
      niche: cell(r, C.primary_category) || "—",
      niche2: cell(r, C.secondary_category),
      gender: cell(r, C.casting_profile),
      yob: cell(r, C.year_of_birth),
      region: cell(r, C.base_location) || "—",
      // 1.0.11 (Mục D11): đọc thêm C6 / C12 / C14 để form hiển thị đúng dữ liệu sheet
      creatorType: cell(r, C.creator_type),
      representation: cell(r, C.representation),
      contactChannel: cell(r, C.contact_channel),
      followers: parseFollowers(subs[platform]),
      estimatedPrice: rel.price || sowPrice,
      priceItems,
      priceStatus: rel.price || sowPrice ? "" : rel.status,
      priceTag: rel.tag,
      contact, email, phone,
      contactPerson: cell(r, C.contact_person) || "",
      priceByFormat,
      pPhoto: pAmt("photo"), pVideo: pAmt("video"), pEvent: pAmt("event"), pBrandvideo: pAmt("brandvideo"), pLive: pAmt("live"),
      format: "",
      previousCampaign: "",
      performance: sow.join(" · "),
      stage: "verified",
      // 1.0.11 (Mục D6 + B3): pill "Xác minh" bám đúng chữ Relationship_Status của sheet
      verifyStatus: relStatusKey(cell(r, C.relationship_status), !!(rel.price || sowPrice)),
      source: "sheet",
      fileRef: "",
    };
  }

  function loadCreatorCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CREATOR_CACHE_KEY) || "null");
      if (c && Array.isArray(c.rows) && c.rows.length) return c;
    } catch (e) {}
    return null;
  }
  function saveCreatorCache(rows, header, links, updatedAt) {
    try { localStorage.setItem(CREATOR_CACHE_KEY, JSON.stringify({ rows, header, links, updatedAt })); } catch (e) {}
  }
  // ponytail: không save() vào STORE_KEY — cache CREATOR_DB là nguồn sự thật, tránh nhân đôi 997 dòng
  function applyCreatorRows(rows, header, links) {
    buildCreatorCols(header);
    const L = links || [];
    const mapped = rows.map((r, i) => mapCreatorRow(r, i, L[i])).filter(Boolean);
    if (!mapped.length) return 0;
    state.kolDb = mapped;
    applyCreatorEdits();
    return mapped.length;
  }

  /* ============================================================
     1.0.6 — Ghi dữ liệu 2 đầu
     Sửa một creator trong app thì phải giữ được cả khi mất mạng lẫn khi
     người khác mở máy khác: (1) lưu phần đã sửa vào localStorage và đắp
     lại lên dữ liệu sheet mỗi lần đồng bộ, (2) đẩy ngược lên Google Sheet
     CREATOR_DB qua write-back.php. Khoá theo TÊN creator vì id chỉ là số
     thứ tự dòng — resync xong là lệch.
     ============================================================ */
  const CREATOR_EDIT_KEY = "mkios_creator_edits_v106";
  const WRITE_BACK_URL = "write-back.php";
  // Trường trong app ↔ tên cột trên sheet (header dòng 3)
  const CREATOR_SHEET_MAP = {
    name: "Creator_Name", tier: "Tier", niche: "Primary_Category", gender: "Casting_Profile",
    region: "Base_Location", relationship: "Relationship_Status",
    contact: "Contact_Detail", email: "Personal_Email", phone: "Personal_Phone",
  };
  let creatorEdits = loadCreatorEdits();
  function loadCreatorEdits() {
    try { const o = JSON.parse(localStorage.getItem(CREATOR_EDIT_KEY) || "{}"); return o && typeof o === "object" ? o : {}; }
    catch (e) { return {}; }
  }
  function saveCreatorEdits() {
    try { localStorage.setItem(CREATOR_EDIT_KEY, JSON.stringify(creatorEdits)); } catch (e) {}
  }
  function applyCreatorEdits() {
    state.kolDb.forEach((x) => { const e = creatorEdits[x.name]; if (e) Object.assign(x, e); });
  }
  // Gọi sau mỗi lần mutate một creator: vá bản ghi, lưu cache, rồi đẩy lên sheet.
  function persistCreator(rec, patch) {
    if (patch && Object.prototype.hasOwnProperty.call(patch, "name")) {
      if (patch.name !== rec.name) toast("Không đổi được tên", "Tên do Google Sheet quản lý và chỉ đọc ở đây. Các trường khác vẫn được lưu.", "warning");
      patch = Object.assign({}, patch); delete patch.name;
    }
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    const diff = {};
    Object.keys(patch).forEach((k) => { if (!same(rec[k], patch[k])) diff[k] = patch[k]; });
    const editKey = rec.name;
    Object.assign(rec, patch);
    patch = diff;
    creatorEdits[editKey] = Object.assign({}, creatorEdits[editKey], diff);
    saveCreatorEdits();
    // Chạm vào cache để updatedAt mới — dữ liệu hiển thị và cache luôn cùng một đời
    const c = loadCreatorCache();
    if (c) saveCreatorCache(c.rows, c.header, c.links, new Date().toISOString());
    pushCreatorToSheet(rec, patch);
  }
  // Đẩy lên sheet — im lặng khi thành công, chỉ báo khi hỏng để khỏi làm phiền lúc thao tác nhanh
  function pushCreatorToSheet(rec, patch) {
    const updates = {};
    Object.keys(patch).forEach((k) => { if (CREATOR_SHEET_MAP[k]) updates[CREATOR_SHEET_MAP[k]] = String(patch[k] == null ? "" : patch[k]); });
    if (updates.Contact_Detail && rec.contactPerson) {
      const pre = rec.contactPerson + " · ";
      if (updates.Contact_Detail.indexOf(pre) === 0) updates.Contact_Detail = updates.Contact_Detail.slice(pre.length);
      else if (updates.Contact_Detail === rec.contactPerson) updates.Contact_Detail = "";
    }
    if (!Object.keys(updates).length) return Promise.resolve(false);
    return apiFetch(WRITE_BACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: rec.name, updates }),
    })
      .then((res) => res.json())
      .then((j) => {
        if (!j || !j.ok) throw new Error((j && j.error) || "Sheet từ chối ghi");
        return true;
      })
      .catch((e) => {
        toast("Chưa ghi được lên sheet", "Đã lưu tạm trên máy, sẽ cần đồng bộ lại. (" + e.message + ")", "warning");
        return false;
      });
  }
  function redrawBookingIfVisible() {
    // 1.0.6: sync xong mới có CREATOR_DB thật → Tổng quan phải vẽ lại cả biểu đồ,
    // không chỉ KPI (lần đầu mở app luôn rơi vào trường hợp này).
    if ($("#dash-kpi")) { renderDashboard(); return; }
    if (!$("#booking-table")) return;
    drawFlowStepper(); drawBookingTable(); drawShortlistBar();
  }

  function syncCreatorDb(silent) {
    const btn = $("[data-action=\"sync-creator\"]");
    if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.innerHTML = "⏳ Đang đồng bộ…"; }
    return apiFetch(SYNC_URL, { cache: "no-store" })
      .then((res) => { if (!res.ok) throw new Error("HTTP " + res.status); return res.json(); })
      .then((data) => {
        const rows = (data && data.rows) || [];
        if (!rows.length) throw new Error("Sheet không có dòng dữ liệu");
        const header = (data && data.header) || [];
        const links = (data && data.links) || [];
        saveCreatorCache(rows, header, links, (data && data.updatedAt) || new Date().toISOString());
        const n = applyCreatorRows(rows, header, links);
        redrawBookingIfVisible();
        toast("Đã đồng bộ " + n + " creators", "Nguồn: Google Sheet CREATOR_DB.", "success");
        return n;
      })
      .catch((e) => {
        if (!silent) toast("Không đồng bộ được", "Đang dùng dữ liệu sẵn có. (" + e.message + ")", "danger");
        return 0;
      })
      .finally(() => {
        const b = $("[data-action=\"sync-creator\"]");
        if (b) { b.disabled = false; if (b.dataset.label) b.innerHTML = b.dataset.label; }
      });
  }

  // Mở app: có cache thì dùng ngay, chưa có thì tải 1 lần (im lặng nếu offline)
  function initCreatorDb() {
    const c = loadCreatorCache();
    if (c) { applyCreatorRows(c.rows, c.header, c.links); redrawBookingIfVisible(); return; }
    // Chưa có cache → tải 1 lần; hỏng mạng thì giữ seed cũ + cảnh báo, không crash
    syncCreatorDb(false);
  }

  /* ---------- Tra cứu nhanh ---------- */
  const kolById = (id) => state.influencers.find((k) => k.id === id) || workflowKolPool().find((k) => k.id === id);
  const kolName = (id) => (kolById(id) || {}).name || "Không rõ";
  const campById = (id) => state.campaigns.find((c) => c.id === id);
  const campName = (id) => (campById(id) || {}).name || "—";

  /* ---------- Thành phần dùng lại ---------- */
  function tag(text, kind) { return `<span class="tag dot ${kind || ""}">${esc(text)}</span>`; }
  function platformCell(p, withLabel) {
    const pl = PLATFORMS[p] || { label: p, icon: "🔗" };
    const key = Object.prototype.hasOwnProperty.call(PLATFORMS, p) ? p : "other";
    const logo = `<span class="platform-logo pf-${esc(key)}" role="img" aria-label="${esc(pl.label)}" title="${esc(pl.label)}">${pl.icon}</span>`;
    return withLabel ? `<span class="platform">${logo}<span>${esc(pl.label)}</span></span>` : logo;
  }
  function userCell(kol) {
    if (!kol) return "—";
    const pl = PLATFORMS[kol.platform] || { icon: "🔗" };
    return `<div class="cell-user">
      <span class="avatar">${esc(initials(kol.name))}</span>
      <div class="stack-sm">
        <span class="cu-name">${esc(kol.name)}</span>
        <span class="cu-sub">${pl.icon} ${esc(kol.handle)}</span>
      </div>
    </div>`;
  }

  /* ---------- Bộ định tuyến ---------- */
  const routes = {
    "tong-quan": renderDashboard,
    "kol": renderKols,
    "du-lieu": renderDataQuality,
    "group": renderGroups,
    "chien-dich": renderCampaigns,
    "shortlist": renderShortlistPage,
    "pipeline": renderPipeline,
    "noi-dung": renderContents,
    "thanh-toan": renderPayments,
    "bao-cao": renderDashboard,
    "nguoi-dung": renderUsersPage,
    "ai": renderAiWorkspace,
  };

  function currentView() {
    const h = location.hash.replace(/^#\//, "");
    return routes[h] ? h : "tong-quan";
  }
  // 1.0.3: ẩn khỏi menu nhưng router vẫn chạy nếu vào bằng URL hash trực tiếp
  // 1.0.6: "group" ở lại menu (badge "Sắp ra mắt"); Daily Research / Verified / Shortlist đã gỡ khỏi HTML.
  const HIDDEN_NAV_VIEWS = [];
  function applyNavPerms() {
    $$("#nav .nav-item").forEach((a) => {
      const perm = a.dataset.perm;
      let show = perm === "users" ? can("manage_users") : true;
      if (HIDDEN_NAV_VIEWS.includes(a.dataset.view)) show = false;
      a.style.display = show ? "" : "none";
    });
  }
  function router() {
    const view = currentView();
    // 1.1.3: rời trang Users thì tắt auto-refresh trạng thái, tránh gọi activity.php nền vô ích
    if (view !== "nguoi-dung" && usersRefreshTimer) { clearInterval(usersRefreshTimer); usersRefreshTimer = null; }
    $$("#nav .nav-item").forEach((a) => a.classList.toggle("active", a.dataset.view === view));
    routes[view]();
    $("#content").scrollTop = 0;
    closeSidebar();
  }

  /* ============================================================
     Sắp xếp cột (click header) + Resize cột (kéo thả) — v1.0.2
     ============================================================ */
  // Trạng thái sort theo bảng (key: "booking-kol", "booking-community")
  let sortState = {};
  const sortKey = () => "booking-" + bookingUi.type + "-" + (bookingUi.stage || "all");

  // Ánh xạ cột -> field dùng để so sánh
  function sortFieldFor(col) {
    const isKol = bookingUi.type === "kol";
    switch (col) {
      case "name": return isKol ? "name" : "name";
      case "platform": return "platform";
      case "niche": return isKol ? "niche" : "topic";
      case "niche2": return "niche2";
      case "work_history": return "workHistory";
      case "tier": return "tier";
      case "gender": return "gender";
      case "region": return "region";
      case "reach": return isKol ? "followers" : "membersFollowers";
      // 1.0.5: 4 cột con nền tảng — sort theo số follower của đúng nền tảng đó
      case "ft_tiktok": return "fTiktok";
      case "ft_facebook": return "fFacebook";
      case "ft_instagram": return "fInstagram";
      case "ft_youtube": return "fYoutube";
      case "price": return "estimatedPrice";
      // 1.0.7 (item 12): sort theo từng cột giá format
      case "price_photo": return "pPhoto";
      case "price_video": return "pVideo";
      case "price_event": return "pEvent";
      case "price_brandvideo": return "pBrandvideo";
      case "price_live": return "pLive";
      case "verify": return "verifyStatus";
      default: return null;
    }
  }

  // 1.0.15: cờ "vừa kéo resize xong" — click fire SAU mouseup nên nếu thả chuột trong ô tiêu đề
  // (ngoài thanh .resizer) thì header nhận click và sort nhầm. Cờ này sống đến khi click đó đi qua.
  let rzJustDragged = false;

  // Gắn sự kiện click-sort + kéo-resize cho bảng booking (1.0.7: resize theo <col> của colgroup)
  function bindBookingTableSortResize(tableEl) {
    if (!tableEl) return;
    const ths = Array.from(tableEl.querySelectorAll("thead th"));
    ths.forEach((th) => {
      const col = th.dataset.sort;
      // Click để sort (chỉ cột có data-sort)
      if (col) {
        th.style.cursor = "pointer";
        th.classList.add("sortable");
        th.addEventListener("click", (e) => {
          if (e.target.closest(".resizer")) return; // kéo resize không tính là sort
          // 1.0.15: vừa kéo resize xong, thả chuột trong th → nuốt click này, không sort
          if (rzJustDragged) { e.preventDefault(); e.stopPropagation(); return; }
          const key = sortKey();
          const cur = sortState[key] || {};
          let dir = cur.col === col ? (cur.dir === "asc" ? "desc" : "asc") : "asc";
          if (e.shiftKey) { dir = null; }
          sortState[key] = dir ? { col, dir } : {};
          bookingUi.page = 1;
          drawBookingTable();
        });
      }
      // Kéo resize: MỌI cột có data-colkey (kể cả cột mới/không sort được) trừ nhóm nền tảng
      const ck = th.dataset.colkey;
      if (ck && !th.classList.contains("group-head") && !th.querySelector(".resizer")) {
        const rz = document.createElement("div");
        rz.className = "resizer";
        rz.title = "Kéo để chỉnh độ rộng cột";
        th.appendChild(rz);
        rz.addEventListener("mousedown", (e) => {
          e.preventDefault(); e.stopPropagation();
          const colEl = tableEl.querySelector('colgroup col[data-colkey="' + ck + '"]');
          const startX = e.clientX;
          // 1.0.9 (A1): clientX + getBoundingClientRect đều bị browser zoom scale → chia devicePixelRatio để về CSS px gốc
          const zoom = window.devicePixelRatio || 1;
          const startW = (colEl && parseFloat(colEl.style.width)) || (th.getBoundingClientRect().width / zoom);
          // 1.0.15: quãng đường kéo xa nhất → phân biệt kéo resize thật vs rung tay 1-2px (vẫn coi là click)
          let moved = 0;
          const onMove = (ev) => {
            moved = Math.max(moved, Math.abs(ev.clientX - startX));
            // 1.0.7 (item 8): kéo tự do, tối thiểu 40px → hẹp hơn nội dung thì ellipsis
            const w = clamp(startW + (ev.clientX - startX) / zoom, 40, 1200);
            if (colEl) colEl.style.width = w + "px";
            th.style.width = w + "px";
          };
          const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
            // 1.0.15: kéo > 4px = drag thật → nuốt đúng 1 click kế tiếp (browser fire sau mouseup)
            // bằng listener capture tự hủy, để click không bubble tới header và gây sort.
            if (moved > 4) {
              rzJustDragged = true;
              const blockClick = (ce) => {
                ce.preventDefault(); ce.stopPropagation();
                document.removeEventListener("click", blockClick, true);
                rzJustDragged = false;
              };
              document.addEventListener("click", blockClick, true);
              // An toàn: nếu mouseup xảy ra ngoài cửa sổ → không có click nào fire, gỡ chốt sau 200ms
              setTimeout(() => {
                document.removeEventListener("click", blockClick, true);
                rzJustDragged = false;
              }, 200);
            }
            saveColWidths(tableEl);
          };
          document.addEventListener("mousemove", onMove);
          document.addEventListener("mouseup", onUp);
        });
      }
    });
    applySortIndicators(tableEl);
  }

  const COL_WIDTH_KEY = "mkios_col_widths_v107";
  // 1.0.9 (A2): sanitize width đã lưu — widths kéo ở zoom ≠ 100% trước đây bị phình (966px cho cột 128px) → bảng tràn.
  // Bỏ key vô lý (NaN, <20, >1200, hoặc > 2× default) để render fallback về BK_COL_W.
  function loadColWidths() {
    let raw = {};
    try { raw = JSON.parse(localStorage.getItem(COL_WIDTH_KEY) || "{}"); } catch (e) { return {}; }
    if (!raw || typeof raw !== "object") return {};
    const out = {}; let dropped = false;
    Object.keys(raw).forEach((k) => {
      const w = parseFloat(raw[k]);
      const max = Math.min(1200, (BK_COL_W[k] || 200) * 2);
      if (!isFinite(w) || w < 20 || w > max) { dropped = true; return; }
      out[k] = raw[k];
    });
    if (dropped) { try { localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(out)); } catch (e) {} }
    return out;
  }
  function saveColWidths(tableEl) {
    const widths = loadColWidths();
    $$("colgroup col", tableEl || document.getElementById("booking-table") || document).forEach((c) => {
      if (c.dataset.colkey && c.style.width) widths[c.dataset.colkey] = c.style.width;
    });
    try { localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(widths)); } catch (e) {}
  }
  function applySortIndicators(tableEl) {
    const key = sortKey();
    const cur = sortState[key] || {};
    $$("thead th", tableEl).forEach((th) => {
      th.classList.remove("sort-asc", "sort-desc");
      const col = th.dataset.sort;
      if (col && cur.col === col) th.classList.add(cur.dir === "desc" ? "sort-desc" : "sort-asc");
    });
  }

  function sortedBookingRows(rows) {
    const key = sortKey();
    const cur = sortState[key];
    if (!cur || !cur.col) return rows;
    const field = sortFieldFor(cur.col);
    if (!field) return rows;
    const dir = cur.dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => {
      let av = a[field], bv = b[field];
      // Giá trị số so sánh số, chuỗi so sánh chuỗi (không phân biệt hoa thường)
      // 1.0.5: cột follower nền tảng có thể thiếu ở vài bản ghi → coi như 0 thay vì so chuỗi
      if (typeof av === "number" || typeof bv === "number") return ((Number(av) || 0) - (Number(bv) || 0)) * dir;
      av = String(av == null ? "" : av).toLowerCase();
      bv = String(bv == null ? "" : bv).toLowerCase();
      return av.localeCompare(bv, "vi") * dir;
    });
  }

  /* ============================================================
     VIEW: Tổng quan
     ============================================================ */
  /* 1.0.6 — Tổng quan chạy 100% dữ liệu thật từ CREATOR_DB + giỏ hàng đang mở.
     Không còn state.influencers/campaigns/contents (dữ liệu mẫu) trong màn này. */
  const DASH_TARGET_PLATFORM = 0.6; // mục tiêu 60% creator có hero platform là TikTok

  function dashStats() {
    const db = state.kolDb || [];
    const total = db.length;
    const tally = (fn) => {
      const m = new Map();
      db.forEach((x) => { const k = fn(x); m.set(k, (m.get(k) || 0) + 1); });
      return m;
    };
    const platMap = tally((x) => {
      const k = heroKey(x.heroRaw || "");
      return x.heroRaw && PLATFORM_COL_KEYS.includes(k) ? k : "other";
    });
    const platforms = PLATFORM_COL_KEYS
      .map((k) => ({ key: k, label: (PLATFORMS[k] || {}).label || k, value: platMap.get(k) || 0 }))
      .concat([{ key: "other", label: "Khác", value: platMap.get("other") || 0 }])
      .sort((a, b) => b.value - a.value);

    const rank = (m, blankLabel) => Array.from(m, ([label, value]) => ({ label: label || blankLabel, value, blank: !label }))
      .sort((a, b) => (a.blank - b.blank) || (b.value - a.value));

    const cartRows = (cart.kol || []).map((id) => db.find((x) => x.id === id)).filter(Boolean);
    return {
      total,
      priced: db.filter((x) => (x.estimatedPrice || 0) > 0).length,
      worked: db.filter((x) => /đã hợp tác/i.test(x.relationship || "")).length,
      celeb: db.filter((x) => /celeb/i.test(x.tier || "")).length,
      platforms,
      tiers: rank(tally((x) => String(x.tier || "").trim()), "Chưa phân loại"),
      niches: rank(tally((x) => (x.niche === "—" ? "" : String(x.niche || "").trim())), "Chưa phân loại").slice(0, 6),
      regions: rank(tally((x) => (x.region === "—" ? "" : normRegion(x.region))), "Chưa rõ"),
      relations: rank(tally((x) => String(x.relationship || "").trim()), "Chưa cập nhật"),
      cartRows,
      cartCount: cartRows.length,
      cartBudget: cartRows.reduce((s, x) => s + (x.estimatedPrice || 0), 0),
    };
  }

  const pct = (n, d) => (d ? Math.round((n / d) * 1000) / 10 : 0);
  // Thanh ngang có nhãn nổi phía trên — dùng chung cho Tier / Ngành hàng / Khu vực / Hợp tác
  function hBars(items, total, tone) {
    if (!items.length) return emptyState("📊", "Chưa có dữ liệu.");
    const max = Math.max(...items.map((i) => i.value), 1);
    return `<div class="hbars ${tone || ""}">${items.map((i) => `
      <div class="hbar-row">
        <div class="hbar-label" title="${esc(i.label)}">${esc(i.label)}</div>
        <div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(3, Math.round((i.value / max) * 100))}%"><span>${fmtNum(i.value)}</span></div></div>
        <div class="hbar-pct">${pct(i.value, total)}%</div>
      </div>`).join("")}</div>`;
  }
  // Cột đứng + đường mục tiêu (đỏ, nét đứt) — "target 60% TikTok" trong bản duyệt
  function platformChart(items, total) {
    const max = Math.max(...items.map((i) => i.value), 1);
    const targetVal = total * DASH_TARGET_PLATFORM;
    const targetPct = clamp(Math.round((targetVal / max) * 100), 2, 100);
    return `<div class="vchart">
      <div class="vchart-plot">
        <div class="vchart-target" style="bottom:${targetPct}%"><span>Mục tiêu ${Math.round(DASH_TARGET_PLATFORM * 100)}% · ${fmtNum(Math.round(targetVal))}</span></div>
        ${items.map((i) => `<div class="vcol">
          <span class="vcol-num">${fmtNum(i.value)}</span>
          <div class="vcol-bar pf-${esc(i.key)}" style="height:${Math.max(2, Math.round((i.value / max) * 100))}%" title="${esc(i.label)}: ${fmtNum(i.value)}"></div>
          <small class="vcol-label">${esc(i.label)} <b>${pct(i.value, total)}%</b></small>
        </div>`).join("")}
      </div>
    </div>`;
  }

  function dashKpiGrid(s) {
    return `<div class="kpi-grid kpi-grid-6">
      ${kpi(icon("users", 20), "i-primary", fmtNum(s.total), "Tổng creators trong CSDL", "KOL/KOC", "up")}
      ${kpi(icon("star", 20), "i-info", fmtNum(s.priced), "Đã có báo giá / verify", pct(s.priced, s.total) + "%", "up")}
      ${kpi(icon("checkCircle", 20), "i-success", fmtNum(s.worked), "Creators từng làm việc với MK", pct(s.worked, s.total) + "%", "up")}
      ${kpi(icon("cart", 20), "i-primary", fmtNum(s.cartCount), "Đang trong giỏ hàng", "Cập nhật realtime", "up")}
      ${kpi(icon("wallet", 20), "i-warning", can("private") ? fmtVND(s.cartBudget) : "Ẩn", "Tổng budget giỏ hàng", "Dự kiến", "up")}
      ${kpi(icon("bolt", 20), "i-danger", fmtNum(s.celeb), "Tier cao nhất trong CSDL", "Celeb", "up")}
    </div>`;
  }

  function dashCartCard(s) {
    const rows = s.cartRows.slice(0, 8).map((x) => `<tr>
      <td>${bookingUserCell(x)}</td>
      <td class="center">${tierCell(x)}</td>
      <td class="right">${priceCell(x)}</td>
    </tr>`).join("");
    return `<div class="card-head"><div><h2>Giỏ hàng hiện tại</h2><div class="sub">KOL đã chọn cho chiến dịch</div></div><button class="btn btn-ghost btn-sm" data-action="open-cart">Mở giỏ hàng →</button></div>
      ${s.cartCount ? `<div class="table-wrap"><table>
        <thead><tr><th class="col-name">KOL</th><th>Tier</th><th class="right">Giá</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>${s.cartCount > 8 ? `<div class="card-body"><small class="muted">… và ${fmtNum(s.cartCount - 8)} KOL khác trong giỏ.</small></div>` : ""}`
      : `<div class="card-body">${emptyState("🛒", "Giỏ hàng đang trống. Tick chọn KOL trong CSDL Booking để lên báo giá.")}</div>`}`;
  }

  function renderDashboard() {
    const s = dashStats();
    setContent(`
      ${pageHead("Tổng quan", "Bức tranh toàn cảnh CSDL KOL/KOC — dữ liệu thật từ CREATOR_DB.",
        `<button class="btn btn-ghost" data-action="sync-creator" title="Tải lại CSDL creator từ Google Sheet CREATOR_DB">🔄 Đồng bộ</button>
         ${can("manage") ? `<button class="btn btn-primary" data-action="add-booking">＋ Thêm KOL/KOC</button>` : ""}`)}

      <div id="dash-kpi">${dashKpiGrid(s)}</div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div><h2>Số lượng KOL theo nền tảng</h2><div class="sub">Hero platform · ${fmtNum(s.total)} creators · mục tiêu ${Math.round(DASH_TARGET_PLATFORM * 100)}% TikTok</div></div></div>
          <div class="card-body">${platformChart(s.platforms, s.total)}</div>
        </div>
        <div class="card">
          <div class="card-head"><div><h2>Phân bổ theo Tier</h2><div class="sub">Nano → Celeb</div></div></div>
          <div class="card-body">${hBars(s.tiers, s.total)}</div>
        </div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div><h2>Top ngành hàng</h2><div class="sub">Primary Category phổ biến nhất</div></div></div>
          <div class="card-body">${hBars(s.niches, s.total, "tone-alt")}</div>
        </div>
        <div class="card" id="dash-cart">${dashCartCard(s)}</div>
      </div>

      <div class="grid-2">
        <div class="card">
          <div class="card-head"><div><h2>Khu vực hoạt động</h2><div class="sub">Base Location trên sheet</div></div></div>
          <div class="card-body">${hBars(s.regions, s.total)}</div>
        </div>
        <div class="card">
          <div class="card-head"><div><h2>Tình trạng hợp tác</h2><div class="sub">Relationship Status</div></div></div>
          <div class="card-body">${hBars(s.relations, s.total, "tone-alt")}</div>
        </div>
      </div>
    `);
  }

  // Giỏ hàng đổi → KPI + bảng giỏ trên Tổng quan cập nhật ngay, không cần tải lại trang
  function redrawDashboardIfVisible() {
    const kpiBox = $("#dash-kpi");
    if (!kpiBox) return;
    const s = dashStats();
    kpiBox.innerHTML = dashKpiGrid(s);
    const cartBox = $("#dash-cart");
    if (cartBox) cartBox.innerHTML = dashCartCard(s);
  }

  function kpi(icon, iconCls, value, label, deltaText, dir) {
    return `<div class="kpi">
      <div class="kpi-top">
        <div class="kpi-icon ${iconCls}">${icon}</div>
        <span class="kpi-delta ${dir === "down" ? "down" : "up"}">${dir === "down" ? "▼" : "▲"} ${esc(deltaText)}</span>
      </div>
      <div class="kpi-value">${esc(value)}</div>
      <div class="kpi-label">${esc(label)}</div>
    </div>`;
  }

  function barChart(data) {
    if (!data.length) return emptyState("📉", "Chưa có dữ liệu.");
    const max = Math.max(...data.map((d) => d.value), 1);
    return `<div class="bar-chart">
      ${data.map((d) => {
        const h = clamp(Math.round((d.value / max) * 100), 4, 100);
        return `<div class="bar-col">
          <span class="bv">${fmtShortVND(d.value)}</span>
          <div class="bar" style="height:${h}%" title="${esc(d.label)}: ${fmtVND(d.value)}"></div>
          <small>${esc(d.label)}</small>
        </div>`;
      }).join("")}
    </div>`;
  }

  /* ============================================================
     VIEW: KOL / KOC
     ============================================================ */
  let kolFilters = { q: "", platform: "", tier: "", status: "" };

  /* ============================================================
     VIEW: Booking Database (KOL/KOC + Community/Group) — v1.0 Round 1
     ============================================================ */
  const PAGE_SIZE_KEY = "mkios_page_size_v105";
  const PAGE_SIZES = [10, 25, 50, 100, "all"];
  function loadPageSize() {
    const v = localStorage.getItem(PAGE_SIZE_KEY);
    if (v === "all") return "all";
    const n = Number(v);
    return PAGE_SIZES.includes(n) ? n : 25;
  }
  // 1.0.12 (Mục C): view + customCols nhớ qua localStorage; view cũ (compact/full) → default
  const COL_VIEW_KEY = "mkios_col_view";
  function loadColView() {
    try { return JSON.parse(localStorage.getItem(COL_VIEW_KEY) || "null") || {}; }
    catch (e) { return {}; }
  }
  function saveColView() {
    try { localStorage.setItem(COL_VIEW_KEY, JSON.stringify({ view: bookingUi.view, customCols: bookingUi.customCols })); } catch (e) {}
  }
  // 1.0.12 (Mục C7): mẫu cột do người dùng tự lưu — [{name, cols}], tối đa 10
  const COL_PRESETS_KEY = "mkios_col_presets";
  function loadColPresets() {
    try { const a = JSON.parse(localStorage.getItem(COL_PRESETS_KEY) || "[]"); return Array.isArray(a) ? a : []; }
    catch (e) { return []; }
  }
  function saveColPresets(list) {
    try { localStorage.setItem(COL_PRESETS_KEY, JSON.stringify(list.slice(0, 10))); } catch (e) {}
  }
  let bkColPresetSel = ""; // tên mẫu đang chọn — để nút 🗑 biết xoá cái nào
  /* 1.0.14 (Mục C): GỘP 2 dropdown cột thành 1 (#bk-view).
     Giá trị option: "view:<key>" = bộ cột dựng sẵn · "preset:<tên>" = mẫu đã lưu · "__save__" = lưu mẫu mới.
     Lưu mẫu xong mẫu tự nằm trong danh sách và đang được chọn — không còn ô "Mẫu cột…" riêng. */
  function colViewOptions() {
    const presets = loadColPresets();
    const onPreset = !!bkColPresetSel && presets.some((p) => p.name === bkColPresetSel) && bookingUi.view === "custom";
    let html = `<optgroup label="Bộ cột dựng sẵn">`;
    html += Object.entries(BK_VIEW_PRESETS)
      .map(([k, v]) => `<option value="view:${k}" ${!onPreset && bookingUi.view === k ? "selected" : ""}>${esc(v.label)}</option>`)
      .join("");
    html += `</optgroup>`;
    if (presets.length) {
      html += `<optgroup label="Mẫu đã lưu">`;
      html += presets
        .map((p) => `<option value="preset:${esc(p.name)}" ${onPreset && p.name === bkColPresetSel ? "selected" : ""}>Mẫu: ${esc(p.name)}</option>`)
        .join("");
      html += `</optgroup>`;
    }
    html += `<optgroup label="Hành động"><option value="__save__">💾 Lưu bộ cột hiện tại thành mẫu…</option></optgroup>`;
    return html;
  }
  // 1.0.14 (Mục C): lưu bộ cột đang xem thành mẫu — xong là mẫu nằm ngay trong dropdown và đang chọn
  function saveColPresetPrompt() {
    const name = String(prompt("Tên mẫu cột:", bkColPresetSel || "") || "").trim();
    if (!name) { renderBookingPage(); return; }   // huỷ → vẽ lại để dropdown về đúng lựa chọn cũ
    const list = loadColPresets().filter((p) => p.name !== name);
    list.unshift({ name, cols: bkVisibleCols() });
    saveColPresets(list);
    bkColPresetSel = name;
    bookingUi.customCols = list[0].cols.slice();
    bookingUi.view = "custom";
    saveColView();
    renderBookingPage();
    toast("Đã lưu mẫu cột", `“${name}” đã nằm trong danh sách bộ cột.`, "success");
  }
  // R4 (mục 5): thêm followersMin/followersMax vào bộ lọc chi tiết
  // 1.0.12 (Mục B4): thêm 4 bộ lọc creatorType / representation / contactChannel / relationship
  const BK_MULTI_FILTER_KEYS = ["niche", "platform"];
  function bkMatchesSelected(selected, value) {
    return !Array.isArray(selected) || selected.length === 0 || selected.includes(value);
  }
  function bkFilterValueActive(value) {
    return Array.isArray(value) ? value.length > 0 : String(value || "") !== "";
  }
  function bkEmptyFilterValue(key) { return BK_MULTI_FILTER_KEYS.includes(key) ? [] : ""; }
  let bookingUi = { type: "kol", q: "", niche: [], platform: [], region: "", tier: "", maxBudget: "", budgetMin: "", followersMin: "", followersMax: "", stage: "", verify: "", creatorType: "", representation: "", contactChannel: "", relationship: "", view: loadColView().view === "custom" ? "custom" : "default", customCols: loadColView().customCols || null, page: 1, pageSize: loadPageSize(), pill: "", breakdown: "", activeStatus: "", gender: "", dq: "", audience: "" };
  // Các khoá bị "Xóa bộ lọc" reset — pill và view/cột giữ nguyên vì đó là cách xem, không phải bộ lọc
  const BK_FILTER_KEYS = ["q", "niche", "platform", "region", "tier", "maxBudget", "budgetMin", "followersMin", "followersMax", "stage", "creatorType", "representation", "contactChannel", "relationship", "activeStatus", "gender", "dq", "audience"]; // 1.0.12 · 1.1: +budgetMin
  // 1.1: key bộ lọc → id control trong panel (để chip × reset đúng ô hiển thị)
  const BK_FIELD_IDS = { niche: "bk-niche", platform: "bk-platform", region: "bk-region", tier: "bk-tier", creatorType: "bk-creator-type", representation: "bk-representation", contactChannel: "bk-contact-channel", relationship: "bk-relationship", followersMin: "bk-fmin", followersMax: "bk-fmax", maxBudget: "bk-budget", budgetMin: "bk-budget-min", stage: "bk-stage", activeStatus: "bk-active-status", gender: "bk-gender", dq: "bk-dq", audience: "bk-audience" };
  // 1.1: nhãn chip cho từng bộ lọc đang bật (q + pill không hiện chip — đã có ô tìm kiếm + pill sáng)
  function bkChipLabel(key, val, isKol) {
    switch (key) {
      case "niche": return "Ngành hàng: " + (Array.isArray(val) ? val.length : 0);
      case "platform": return "Nền tảng: " + (Array.isArray(val) ? val.length : 0);
      case "region": return "Khu vực: " + normRegion(val);
      case "tier": return "Cấp độ: " + val;
      case "creatorType": return "Creator: " + val;
      case "representation": return "Đại diện: " + val;
      case "contactChannel": return "Kênh: " + val;
      case "relationship": return "Lịch sử: " + val;
      case "activeStatus": case "gender": case "dq": case "audience": return bkExtraChipLabel(key, val);
      case "stage": return "Nguồn: " + ((STAGES[val] || {}).label || val);
      case "followersMin": return (isKol ? "Follower ≥ " : "Members ≥ ") + fmtNum(val);
      case "followersMax": return (isKol ? "Follower ≤ " : "Members ≤ ") + fmtNum(val);
      case "budgetMin": return "Ngân sách ≥ " + fmtNum(val) + " ₫";
      case "maxBudget": return "Ngân sách ≤ " + fmtNum(val) + " ₫";
      default: return key + ": " + val;
    }
  }
  function bkChipTitle(key, val) {
    if (!Array.isArray(val)) return bkChipLabel(key, val, bookingUi.type === "kol");
    const labels = key === "platform" ? val.map((v) => (PLATFORMS[v] || {}).label || v) : val;
    return labels.join(" · ");
  }
  function bkFilterActive() { return BK_FILTER_KEYS.some((k) => bkFilterValueActive(bookingUi[k])) || !!bookingUi.pill; }
  // Cột tuỳ chọn bật/tắt (checkbox, tên, tier, giá, xác minh, thao tác luôn hiển thị)
  // 1.0.5: 4 cột con nền tảng cũng bật/tắt được (kèm icon trong modal "Cột")
  const BK_PLATFORM_COLS = PLATFORM_COL_KEYS.map((k) => "ft_" + k);
  // 1.0.7 (item 12): 5 cột giá theo format lấy từ CREATOR_DB AG:AK
  const BK_PRICE_COLS = ["price_photo", "price_video", "price_event", "price_brandvideo", "price_live"];
  // 1.0.12 (Mục C6/E9): bỏ work_history (trùng verify) — thêm tier/price/verify/actions + 5 key mới
  // để panel "Tuỳ chọn cột" liệt kê ĐỦ mọi cột bật/tắt được (chỉ chk + name là cố định).
  const BK_OPTIONAL_COLS = {
    tier: "Tier (chỉ KOL)",
    niche: "Ngành hàng", niche2: "Ngành hàng phụ", region: "Khu vực", gender: "Giới tính (chỉ KOL)",
    price: "Giá ước tính",
    price_photo: "Giá Photo (KOL)", price_video: "Giá Video (KOL)", price_event: "Giá Sự kiện (KOL)",
    price_brandvideo: "Giá Video NH (KOL)", price_live: "Giá Livestream (KOL)",
    contact: "Liên hệ", reach: "Members (chỉ Community)",
    verify: "Lịch sử làm việc",
    creatorType: "Creator type", representation: "Đại diện / quản lý", contactChannel: "Kênh liên hệ",
    email: "Email", fileRef: "File tham chiếu", actions: "Thao tác",
    activeStatus: "Trạng thái hoạt động (chỉ KOL)", dq: "Cảnh báo dữ liệu (chỉ KOL)", audience: "Audience (chỉ KOL)",
  };
  /* R4 (mục 6) — 3 bộ cột dựng sẵn bám theo dữ liệu thật của CREATOR_DB.
     checkbox · tên · tier · giá ước tính · xác minh · thao tác LUÔN hiển thị (không nằm trong mảng).
     - Rút gọn: chỉ thứ cần để quyết nhanh — 4 nền tảng.
     - Mặc định: thêm bối cảnh chọn KOL (ngành hàng, khu vực, lịch sử làm việc) + 5 giá theo format.
     - Đầy đủ: thêm ngành phụ, giới tính, members, liên hệ — dùng khi lên báo giá / gửi khách. */
  // 1.0.12 (Mục C5): bỏ "Rút gọn"/"Đầy đủ" — chỉ còn Mặc định + Tùy chọn (panel cột lo phần còn lại)
  const BK_VIEW_PRESETS = {
    default: { label: "Mặc định", cols: ["chk", "name", "tier", ...BK_PLATFORM_COLS, "niche", "region", "price", "activeStatus", "verify", "actions"] },
    custom:  { label: "Tùy chọn", cols: null },
  };
  // 1.0.7 (item 8): độ rộng mặc định mỗi cột (px) cho colgroup table-layout:fixed
  // 1.0.13 (Mục B2): bộ cột "Mặc định" trước đây cộng lại 1294px > khung 1166px của desktop 1440
  // → cột cuối bị cắt. Siết lại nền tảng/giá/khu vực còn tổng 1158px = vừa khung, không tràn.
  const BK_COL_W = {
    chk: 38, name: 196, tier: 70, ft_tiktok: 78, ft_facebook: 78, ft_instagram: 78, ft_youtube: 78,
    platform: 118, niche: 112, niche2: 112, gender: 88, region: 104, reach: 96,
    work_history: 150, price: 112,
    price_photo: 84, price_video: 84, price_event: 88, price_brandvideo: 92, price_live: 96,
    contact: 196, verify: 118, actions: 96,
    // 1.0.12 (Mục C6): các cột mới bật/tắt được từ panel Tuỳ chọn cột
    creatorType: 130, representation: 140, contactChannel: 130, email: 190, fileRef: 170, activeStatus: 112, dq: 220, audience: 150,
  };
  // 1.0.12 (Mục C/H): chk + name luôn hiển thị; work_history bị loại khỏi mọi cấu hình cũ;
  // view cũ (compact/full) còn trong localStorage → rơi về "Mặc định" thay vì vỡ bảng.
  function bkVisibleCols() {
    const raw = bookingUi.view === "custom"
      ? (bookingUi.customCols || BK_VIEW_PRESETS.default.cols)
      : BK_VIEW_PRESETS.default.cols;
    const cols = raw.filter((c) => c !== "work_history");
    if (!cols.includes("name")) cols.unshift("name");
    if (!cols.includes("chk")) cols.unshift("chk");
    return cols;
  }
  /* 1.0.6 — bộ lọc nhanh dạng pill trên thanh công cụ (kiểu Ads Manager) */
  const BK_PILLS = {
    "": { label: "Tất cả", test: () => true },
    worked: { label: "Đã hợp tác", test: (x) => /đã hợp tác/i.test(x.relationship || "") },
    quoted: { label: "Đã báo giá", test: (x) => /đã báo giá/i.test(x.relationship || "") },
    priced: { label: "Có giá", test: (x) => (x.estimatedPrice || 0) > 0 },
    celeb: { label: "Celeb", test: (x) => /celeb/i.test(x.tier || "") },
  };
  const BK_BREAKDOWNS = {
    "": { label: "Không breakdown" },
    tier: { label: "Theo Tier", of: (x) => String(x.tier || "").trim() || "Chưa phân loại" },
    platform: { label: "Theo nền tảng", of: (x) => (PLATFORMS[x.platform] || {}).label || "Khác" },
    region: { label: "Theo khu vực", of: (x) => (x.region && x.region !== "—" ? normRegion(x.region) : "Chưa rõ") },
    niche: { label: "Theo ngành hàng", of: (x) => (x.niche && x.niche !== "—" ? x.niche : "Chưa phân loại") },
  };
  // Mọi thay đổi bộ lọc / tìm kiếm / view đều phải quay về trang 1 (nếu không sẽ đứng ở trang rỗng)
  function bkRedraw() { bookingUi.page = 1; drawBookingTable(); }

  function niceMap(arr) { const m = {}; arr.forEach((x) => { m[x] = { label: x }; }); return m; }

  function bkMultiSelect(id, label, items, selected, showIcons) {
    const values = Array.isArray(selected) ? selected : [];
    const picked = items.filter((item) => values.includes(item[0])).map((item) => item[1]);
    const summary = picked.length ? `${picked.length} đã chọn` : "Tất cả";
    const hint = picked.length ? picked.join(" · ") : `Tất cả ${label.toLowerCase()}`;
    return `<div class="field">
      <span class="bk-field-label" id="${id}-label">${esc(label)}</span>
      <div class="bk-multi" id="${id}" data-bk-multi>
        <button class="bk-multi-trigger" type="button" aria-haspopup="true" aria-expanded="false" aria-labelledby="${id}-label ${id}-value" title="${esc(hint)}">
          <span class="bk-multi-value" id="${id}-value">${esc(summary)}</span><span class="bk-multi-caret" aria-hidden="true">⌄</span>
        </button>
        <div class="bk-multi-menu" role="group" aria-labelledby="${id}-label" hidden>
          <div class="bk-multi-menu-head"><span>Chọn nhiều</span><button type="button" data-bk-multi-clear ${values.length ? "" : "disabled"}>Xóa chọn</button></div>
          <div class="bk-multi-options">
            ${items.map((item, i) => {
              const key = item[0], text = item[1], ico = item[2] || "";
              return `<label class="bk-multi-option" for="${id}-opt-${i}"><input id="${id}-opt-${i}" type="checkbox" value="${esc(key)}" data-label="${esc(text)}" ${values.includes(key) ? "checked" : ""} /><span class="bk-multi-check" aria-hidden="true">✓</span>${showIcons ? `<span class="bk-multi-platform pf-${esc(key)}">${ico}</span>` : ""}<span class="bk-multi-option-text">${esc(text)}</span></label>`;
            }).join("")}
          </div>
        </div>
      </div>
    </div>`;
  }

  function bkSyncMultiControl(root) {
    if (!root) return;
    const boxes = $$('input[type="checkbox"]', root);
    const checked = boxes.filter((box) => box.checked);
    const labels = checked.map((box) => box.dataset.label || box.value);
    const value = $(".bk-multi-value", root);
    const trigger = $(".bk-multi-trigger", root);
    const clear = $("[data-bk-multi-clear]", root);
    if (value) value.textContent = checked.length ? `${checked.length} đã chọn` : "Tất cả";
    if (trigger) trigger.title = labels.length ? labels.join(" · ") : "Tất cả";
    if (clear) clear.disabled = checked.length === 0;
  }

  function bkSetMultiControl(root, values) {
    const selected = Array.isArray(values) ? values : [];
    $$('input[type="checkbox"]', root).forEach((box) => { box.checked = selected.includes(box.value); });
    bkSyncMultiControl(root);
  }

  let bkMultiOutsideBound = false;
  function bindBkMultiSelect(id, key) {
    const root = document.getElementById(id);
    if (!root) return;
    const trigger = $(".bk-multi-trigger", root);
    const menu = $(".bk-multi-menu", root);
    const setOpen = (open) => {
      if (open) $$(".bk-multi.is-open").forEach((other) => { if (other !== root) { other.classList.remove("is-open"); const m = $(".bk-multi-menu", other); const t = $(".bk-multi-trigger", other); if (m) m.hidden = true; if (t) t.setAttribute("aria-expanded", "false"); } });
      root.classList.toggle("is-open", open);
      menu.hidden = !open;
      trigger.setAttribute("aria-expanded", String(open));
    };
    trigger.addEventListener("click", () => setOpen(!root.classList.contains("is-open")));
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); const first = $('input[type="checkbox"]', root); if (first) first.focus(); }
    });
    root.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.preventDefault(); setOpen(false); trigger.focus(); } });
    root.addEventListener("change", (e) => {
      if (!e.target.matches('input[type="checkbox"]')) return;
      bookingUi[key] = $$('input[type="checkbox"]', root).filter((box) => box.checked).map((box) => box.value);
      bkSyncMultiControl(root);
      bkRedraw();
    });
    root.addEventListener("click", (e) => {
      if (!e.target.closest("[data-bk-multi-clear]")) return;
      bookingUi[key] = [];
      bkSetMultiControl(root, []);
      bkRedraw();
    });
    if (!bkMultiOutsideBound) {
      document.addEventListener("click", (e) => {
        $$(".bk-multi.is-open").forEach((openRoot) => {
          if (openRoot.contains(e.target)) return;
          openRoot.classList.remove("is-open");
          const openMenu = $(".bk-multi-menu", openRoot);
          const openTrigger = $(".bk-multi-trigger", openRoot);
          if (openMenu) openMenu.hidden = true;
          if (openTrigger) openTrigger.setAttribute("aria-expanded", "false");
        });
      });
      bkMultiOutsideBound = true;
    }
  }

  function bkResetFilterKey(key) {
    bookingUi[key] = bkEmptyFilterValue(key);
    const control = document.getElementById(BK_FIELD_IDS[key] || "");
    if (!control) return;
    if (control.matches("[data-bk-multi]")) bkSetMultiControl(control, []);
    else control.value = "";
  }

    /* ---------- Phase 1 (preview): active status, casting filter, data quality, workflow honesty ---------- */
  const BR = window.MkBookingRules;
  const BK_ACTIVE_LABELS = BR.ACTIVE_LABELS;

  function bkSimpleOptions(pairs, cur, emptyLabel) {
    return `<option value="">${esc(emptyLabel)}</option>`
      + pairs.map(([v, l]) => `<option value="${esc(v)}" ${String(cur || "") === String(v) ? "selected" : ""}>${esc(l)}</option>`).join("");
  }
  function bkCastingChoices() {
    const set = new Set(CASTING_PROFILES);
    state.kolDb.forEach((x) => { const g = String(x.gender || "").trim(); if (g) set.add(g); });
    return Array.from(set);
  }
  function bkFilterFieldsExtra() {
    const active = BR.ACTIVE_STATUSES.map((k) => [k, BK_ACTIVE_LABELS[k]]);
    const casting = bkCastingChoices().map((v) => [v, v]);
    const dq = [["any", "Có cảnh báo (bất kỳ)"], ["clean", "Không có cảnh báo"]].concat(Object.entries(BR.DQ_CODES));
    const aud = [[BR.AUDIENCE_UNKNOWN, "Unknown"]].concat(BR.audienceOptions(state.kolDb).map((v) => [v, v]));
    return `<div class="field"><label>Trạng thái hoạt động</label><select id="bk-active-status">${bkSimpleOptions(active, bookingUi.activeStatus, "Tất cả")}</select></div>`
      + `<div class="field"><label>Audience</label><select id="bk-audience">${bkSimpleOptions(aud, bookingUi.audience, "Tất cả")}</select></div>`
      + `<div class="field"><label>Casting profile</label><select id="bk-gender">${bkSimpleOptions(casting, bookingUi.gender, "Tất cả")}</select></div>`
      + `<div class="field"><label>Chất lượng dữ liệu</label><select id="bk-dq">${bkSimpleOptions(dq, bookingUi.dq, "Tất cả")}</select></div>`;
  }
  function bkBindExtraFilters() {
    const on = (id, key) => { const el = $(id); if (el) el.addEventListener("change", (e) => { bookingUi[key] = e.target.value; bkRedraw(); }); };
    on("#bk-active-status", "activeStatus");
    on("#bk-audience", "audience");
    on("#bk-gender", "gender");
    on("#bk-dq", "dq");
  }
  function bkExtraChipLabel(key, val) {
    if (key === "activeStatus") return "Hoạt động: " + (BK_ACTIVE_LABELS[val] || val);
    if (key === "gender") return "Casting: " + val;
    if (key === "audience") return "Audience: " + (val === BR.AUDIENCE_UNKNOWN ? "Unknown" : val);
    return "Dữ liệu: " + (val === "any" ? "có cảnh báo" : val === "clean" ? "sạch" : (BR.DQ_CODES[val] || val));
  }
  function bkExtraFilterPass(x) {
    if (bookingUi.type !== "kol") return true;
    return BR.matchesActive(x, bookingUi.activeStatus) && BR.matchesCasting(x, bookingUi.gender) && BR.matchesDq(x, bookingUi.dq) && BR.matchesAudience(x, bookingUi.audience);
  }
  function bkRefreshAudienceOptions() {
    const sel = $("#bk-audience");
    if (sel) {
      const aud = [[BR.AUDIENCE_UNKNOWN, "Unknown"]].concat(BR.audienceOptions(state.kolDb).map((v) => [v, v]));
      sel.innerHTML = bkSimpleOptions(aud, bookingUi.audience || "", "Tất cả");
    }
    const gsel = $("#bk-gender");
    if (gsel) gsel.innerHTML = bkSimpleOptions(bkCastingChoices().map((v) => [v, v]), bookingUi.gender || "", "Tất cả");
  }
  function bkHeadAudience(rs) { return `<th data-colkey="audience"${rs}>Audience</th>`; }
  function bkCellAudience(x) { return `<td class="trunc">${esc(BR.audienceLabel(x.audience))}</td>`; }
  function bkAudienceField(k) {
    const cur = BR.normAudience(k && k.audience);
    return `<div class="form-field"><label for="f-audience">Audience <small class="muted">(dùng chung cho cả team, không lấy từ Casting_Profile; để trống = Unknown)</small></label><input id="f-audience" name="audience" type="text" maxlength="80" list="f-audience-list" value="${esc(cur)}" autocomplete="off" /><datalist id="f-audience-list">${BR.audienceOptions(state.kolDb).map((v) => `<option value="${esc(v)}"></option>`).join("")}</datalist></div>`;
  }

  function bkActivePill(x) {
    const k = BR.normActive(x.activeStatus);
    return `<span class="act-pill act-${k}">${esc(BK_ACTIVE_LABELS[k])}</span>`;
  }
  function bkHeadActive(rs) { return `<th data-colkey="activeStatus" class="center"${rs}>Hoạt động</th>`; }
  function bkCellActive(x) { return `<td class="center">${bkActivePill(x)}</td>`; }
  function bkHeadDq(rs) { return `<th data-colkey="dq"${rs}>Cảnh báo dữ liệu</th>`; }
  function bkCellDq(x) {
    const fl = BR.dataQualityFlags(x);
    if (!fl.length) return `<td class="trunc"><span class="dq-ok">Sạch</span></td>`;
    const title = fl.map((f) => f.label + (f.detail ? " (" + f.detail + ")" : "")).join(" | ");
    return `<td class="trunc" title="${esc(title)}"><span class="dq-badge">${fl.length}</span> ${esc(fl.map((f) => f.label).join(", "))}</td>`;
  }
  function bkActiveField(k) {
    const cur = BR.normActive(k && k.activeStatus);
    return `<div class="form-field"><label>Trạng thái hoạt động <small class="muted">(dùng chung cho cả team, không ghi vào Sheet)</small></label><select name="activeStatus">${BR.ACTIVE_STATUSES.map((s) => `<option value="${s}" ${s === cur ? "selected" : ""}>${esc(BK_ACTIVE_LABELS[s])}</option>`).join("")}</select></div>`;
  }

  function exportDqCsv(rows) {
    const out = [["Tên", "Tier", "Khu vực", "Follower", "Giá ước tính", "Có URL", "Trạng thái hoạt động", "Cảnh báo", "Chi tiết"]];
    rows.forEach((x) => {
      const fl = BR.dataQualityFlags(x);
      if (!fl.length) return;
      out.push([x.name, x.tier || "", normRegion(x.region) || "", x.followers || 0, x.estimatedPrice || 0, BR.hasUrl(x) ? "Có" : "Không",
        BK_ACTIVE_LABELS[BR.normActive(x.activeStatus)], fl.map((f) => f.label).join("; "), fl.map((f) => f.detail || "").filter(Boolean).join("; ")]);
    });
    downloadCSV("booking-data-quality-" + Date.now() + ".csv", out);
  }
  function drawDqBar(rows) {
    const el = $("#bk-dq-bar");
    if (!el) return;
    bkRefreshAudienceOptions();
    drawDqView();
    if (bookingUi.type !== "kol" || !rows.length) { el.innerHTML = ""; return; }
    const s = BR.summarizeDq(rows);
    const chips = Object.entries(BR.DQ_CODES).map(([code, label]) =>
      `<button type="button" class="dq-chip ${bookingUi.dq === code ? "active" : ""}" data-dq="${code}" title="${esc(BR.DQ_RULES[code])}">${esc(label)} <b>${fmtNum(s.byCode[code])}</b></button>`).join("");
    el.innerHTML = `<div class="dq-bar">
      <span class="dq-title">Chất lượng dữ liệu (tập đang lọc): <b>${fmtNum(s.flagged)}</b> / ${fmtNum(s.total)} có cảnh báo</span>
      ${chips}
      ${can("export") && s.flagged ? `<button type="button" class="btn btn-ghost btn-sm" data-dq-export="1">Xuất CSV cảnh báo</button>` : ""}
      <details class="dq-rules"><summary>Quy tắc</summary><ul>${Object.entries(BR.DQ_RULES).map(([c, r]) => `<li><b>${esc(BR.DQ_CODES[c])}</b>: ${esc(r)}</li>`).join("")}</ul><p class="muted">Chỉ cảnh báo, không tự sửa dữ liệu nguồn.</p></details>
    </div>`;
    el.querySelectorAll("[data-dq]").forEach((b) => b.addEventListener("click", () => {
      bookingUi.dq = bookingUi.dq === b.dataset.dq ? "" : b.dataset.dq;
      const sel = $("#bk-dq"); if (sel) sel.value = bookingUi.dq;
      bkRedraw();
    }));
    const ex = el.querySelector("[data-dq-export]");
    if (ex) ex.addEventListener("click", () => exportDqCsv(rows));
  }

  /* Demo cart seeding is disabled in the preview: block the action before the app's delegated handler sees it. */
  document.addEventListener("click", (e) => {
    const b = e.target && e.target.closest ? e.target.closest('[data-action="seed-shortlist"]') : null;
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    toast("Giỏ hàng demo đã tắt.");
  }, true);

  /* ---------- Data quality view (sub-tab of CSDL Booking > KOL). Uses the FULL kolDb, ignores list filters, never changes them. ---------- */
  const DQV_DEFAULT = "any";
  let dqUi = { code: DQV_DEFAULT, limit: 100 };
  function renderDataQuality() { bookingUi.type = "kol"; bookingUi.stage = ""; renderBookingPage(); }
  function dqvActive() { return bookingUi.type === "kol" && /du-lieu/.test(location.hash || ""); }
  function dqvEnsureShell() {
    if (bookingUi.type !== "kol") return null;
    const flow = $("#booking-flow");
    if (!flow) return null;
    let nav = $("#bk-subtabs");
    if (!nav) {
      flow.insertAdjacentHTML("beforebegin", `<nav id="bk-subtabs" class="bk-subtabs" aria-label="Chế độ xem CSDL Booking"></nav><section id="bk-dq-view" class="bk-dq-view" aria-label="Chất lượng dữ liệu" hidden></section>`);
      nav = $("#bk-subtabs");
    }
    return nav;
  }
  function dqvRowHtml(x) {
    const fl = BR.dataQualityFlags(x);
    const acts = `<button type="button" class="btn btn-ghost btn-sm" data-action="view-booking" data-kind="kol" data-id="${esc(x.id)}">Xem</button>`
      + (can("manage") ? ` <button type="button" class="btn btn-ghost btn-sm" data-action="edit-booking" data-kind="kol" data-id="${esc(x.id)}">Sửa</button>` : "");
    return `<tr data-id="${esc(x.id)}"><td>${esc(x.name)}</td><td>${fl.length ? esc(fl.map((f) => f.label + (f.detail ? " (" + f.detail + ")" : "")).join("; ")) : '<span class="dq-ok">Sạch</span>'}</td><td>${esc(BK_ACTIVE_LABELS[BR.normActive(x.activeStatus)])}</td><td>${esc(BR.audienceLabel(x.audience))}</td><td>${acts}</td></tr>`;
  }
  function drawDqView() {
    const nav = dqvEnsureShell();
    if (!nav) return;
    const dq = dqvActive();
    nav.dataset.mode = dq ? "dq" : "list";
    nav.innerHTML = `<a href="#/kol" ${dq ? "" : 'aria-current="page"'} class="bk-subtab ${dq ? "" : "active"}" id="bk-tab-list">Danh sách</a><a href="#/du-lieu" ${dq ? 'aria-current="page"' : ""} class="bk-subtab ${dq ? "active" : ""}" id="bk-tab-dq">Chất lượng dữ liệu</a>`;
    const view = $("#bk-dq-view");
    if (!view) return;
    view.hidden = !dq;
    if (!dq) { view.innerHTML = ""; return; }
    const all = state.kolDb;
    const s = BR.summarizeDq(all);
    const unkActive = all.filter((x) => BR.normActive(x.activeStatus) === "unknown").length;
    const unkAud = all.filter((x) => BR.audienceKey(x.audience) === "").length;
    const rows = all.filter((x) => BR.matchesDq(x, dqUi.code));
    const shown = rows.slice(0, dqUi.limit);
    const activeFilters = BK_FILTER_KEYS.filter((k) => bookingUi[k]).length + (bookingUi.q ? 1 : 0);
    const codeCards = Object.entries(BR.DQ_CODES).map(([c, l]) => `<li class="dqv-card" data-code="${c}"><span>${esc(l)}</span> <b data-count="${c}">${fmtNum(s.byCode[c])}</b></li>`).join("");
    const opts = [["any", "Có cảnh báo (mặc định)"], ["", "Tất cả bản ghi"], ["clean", "Không có cảnh báo"]].concat(Object.entries(BR.DQ_CODES));
    view.innerHTML = `
      <h2 class="dqv-title">Chất lượng dữ liệu - toàn bộ CSDL Booking</h2>
      <p class="muted">Tính trên toàn bộ ${fmtNum(s.total)} creator, không áp dụng bộ lọc của danh sách. ${activeFilters ? `Bộ lọc danh sách đang bật (${activeFilters}) được giữ nguyên khi quay lại tab Danh sách.` : "Chưa có bộ lọc danh sách nào đang bật."} Chỉ cảnh báo, không tự sửa dữ liệu.</p>
      <ul class="dqv-summary" id="dqv-summary" data-total="${s.total}" data-flagged="${s.flagged}" data-clean="${s.clean}" data-unknown-active="${unkActive}" data-unknown-audience="${unkAud}">
        <li class="dqv-card"><span>Tổng</span> <b>${fmtNum(s.total)}</b></li>
        <li class="dqv-card"><span>Có cảnh báo</span> <b>${fmtNum(s.flagged)}</b></li>
        <li class="dqv-card"><span>Sạch</span> <b>${fmtNum(s.clean)}</b></li>
        ${codeCards}
        <li class="dqv-card"><span>Hoạt động Unknown</span> <b>${fmtNum(unkActive)}</b></li>
        <li class="dqv-card"><span>Audience Unknown</span> <b>${fmtNum(unkAud)}</b></li>
      </ul>
      <div class="dqv-filter">
        <label for="dqv-code">Lọc danh sách cảnh báo</label>
        <select id="dqv-code">${bkSimpleOptions(opts.filter((o) => o[0] !== ""), dqUi.code, "Tất cả bản ghi")}</select>
        <button type="button" class="btn btn-ghost btn-sm" id="dqv-clear">Xóa bộ lọc</button>
        ${can("export") && s.flagged ? `<button type="button" class="btn btn-ghost btn-sm" id="dqv-export">Xuất CSV cảnh báo</button>` : ""}
        <span class="muted" id="dqv-count" data-count="${rows.length}">${fmtNum(rows.length)} bản ghi</span>
      </div>
      <div class="dqv-table-wrap"><table class="dqv-table" id="dqv-table"><caption class="sr-only">Danh sách creator theo cảnh báo dữ liệu</caption><thead><tr><th scope="col">Tên</th><th scope="col">Cảnh báo</th><th scope="col">Hoạt động</th><th scope="col">Audience</th><th scope="col">Thao tác</th></tr></thead><tbody>${shown.map(dqvRowHtml).join("") || '<tr><td colspan="5" class="muted">Không có bản ghi phù hợp.</td></tr>'}</tbody></table></div>
      ${rows.length > shown.length ? `<button type="button" class="btn btn-ghost btn-sm" id="dqv-more">Hiện thêm (${fmtNum(rows.length - shown.length)} còn lại)</button>` : ""}`;
    $("#dqv-code").addEventListener("change", (e) => { dqUi.code = e.target.value; dqUi.limit = 100; drawDqView(); });
    $("#dqv-clear").addEventListener("click", () => { dqUi = { code: DQV_DEFAULT, limit: 100 }; drawDqView(); });
    const more = $("#dqv-more"); if (more) more.addEventListener("click", () => { dqUi.limit += 100; drawDqView(); });
    const ex = $("#dqv-export"); if (ex) ex.addEventListener("click", () => exportDqCsv(all));
  }

  /* Workflow views (Chien dich / Hop dong / Noi dung / Thanh toan) keep their own local records.
     Creator choices come from the seed pool PLUS the Booking DB. Booking DB ids (cdb_N) are row numbers,
     so links to them can drift after a sheet resync - the banner says so. */
  function workflowKolPool() {
    const seen = new Set();
    const out = [];
    state.influencers.forEach((k) => { seen.add(k.id); out.push(k); });
    state.kolDb.forEach((r) => {
      if (seen.has(r.id)) return;
      out.push({ id: r.id, name: r.name, handle: r.handle || "", platform: PLATFORMS[r.platform] ? r.platform : "tiktok", tier: r.tier, niche: r.niche, followers: r.followers || 0 });
    });
    return out;
  }
  function wfMerge(list, id, rec) {
    const i = list.findIndex((x) => x.id === id);
    list[i] = i >= 0 ? Object.assign({}, list[i], rec) : rec;
  }
  function wfKeepUnlistedKols(id, kols) {
    const old = id ? state.campaigns.find((c) => c.id === id) : null;
    if (!old || !Array.isArray(old.kols)) return kols;
    const known = new Set(workflowKolPool().map((k) => k.id));
    return kols.concat(old.kols.filter((k) => !known.has(k) && !kols.includes(k)));
  }
  function workflowBanner() {
    const c = BR.legacySeedCounts(state);
    const legacy = c.total
      ? `<p>Có <b>${c.total}</b> bản ghi có mã trùng dữ liệu mẫu cũ (i1-i8, c1-c4, d1-d7, n1-n6, p1-p5). Chúng được giữ nguyên, không bị xóa hay gán nhãn tự động. Xóa thủ công từng dòng nếu cần.</p>`
      : "";
    return `<div class="wf-banner" role="note"><strong>Dữ liệu dùng chung</strong> - các mục này lưu trên máy chủ Booking và chia sẻ cho cả team (không ghi vào Google Sheet), không tự tạo dữ liệu mẫu mới. Danh sách KOL/KOC lấy từ CSDL Booking; creator được liên kết bằng mã ổn định của máy chủ, không theo số dòng Sheet.${legacy}</div>`;
  }

/* ---------- 1.0.7 (item 7): Changelog ở chân menu trái ---------- */
  const CHANGELOG = [
{ v: "1.1.4", date: "2026-11-12", items: [
    "Phase 1: hiện lại mục Chiến dịch, Hợp đồng, Nội dung, Thanh toán; dữ liệu dùng chung cho cả team",
    "Dừng tạo dữ liệu mẫu mới cho các mục trên; bản ghi cũ vẫn được giữ nguyên",
    "Trạng thái hoạt động của creator: Active / Inactive / Unknown (mặc định Unknown), có bộ lọc và cột",
    "Bộ lọc Casting profile và Chất lượng dữ liệu (thiếu giá, URL, tier, khu vực; follower đáng ngờ) - chỉ cảnh báo, không tự sửa",
    "Tab riêng Chất lượng dữ liệu trong CSDL Booking (toàn bộ dữ liệu, bộ lọc riêng, nhảy tới trình sửa)",
    "Audience: trường tùy chọn dùng chung cho cả team, bản ghi cũ là Unknown, có bộ lọc và cột",
    "Bản gốc dữ liệu lỗi được sao lưu sang khóa mới, không ghi đè; tắt nút giỏ hàng demo",
  ] },
{ v: "1.1.3", date: "2026-08-11", items: [
    "Cột Trạng thái online/offline cho bảng người dùng + căn giữa cột Vai trò/Thao tác",
  ] },
{ v: "1.1.2", date: "2026-08-10", items: [
    "Bộ lọc Ngành hàng và Nền tảng hỗ trợ chọn nhiều giá trị theo logic OR, có checkbox, chip tóm tắt và danh sách khi hover",
    "Bảng Booking dùng logo nền tảng gọn hơn; follower và giá rút gọn quốc tế K/M/B kèm tooltip số đầy đủ",
    "Thêm công tắc Hiển thị số đầy đủ ở chân Bộ lọc, ghi nhớ lựa chọn trên trình duyệt",
  ] },
{ v: "1.1.1", date: "2026-08-10", items: [
    "Rút gọn hiển thị địa danh: “Thành phố …” → “TP. …” (VD: TP. Hồ Chí Minh, TP. Hà Nội) cho gọn — áp dụng đồng bộ ở bảng, bộ lọc, breakdown, thống kê, xuất CSV và tìm kiếm AI; dữ liệu cũ vẫn khớp bộ lọc mới",
  ] },
{ v: "1.1", date: "2026-08-10", items: [
    "Thiết kế lại bộ lọc CSDL Booking (PC + mobile): thanh công cụ gom 1 hàng — tìm kiếm bên trái, pill lọc nhanh (kèm số đếm) ở giữa, nút Cột · Bộ lọc · Xuất bên phải",
    "Nút “Bộ lọc” có badge đếm số điều kiện đang bật; mở ra panel chia 3 nhóm rõ ràng: Hồ sơ · Quy mô & ngân sách · Quan hệ & liên hệ",
    "Thêm ô lọc “Ngân sách tối thiểu” (lọc theo giá ước tính từ mức tối thiểu trở lên)",
    "Đáy panel có dải chip các điều kiện đang lọc — bấm × để gỡ riêng từng điều kiện; nút “Xóa bộ lọc” chỉ hiện khi đang lọc",
    "Điện thoại: panel bộ lọc trượt lên từ đáy màn hình (bottom-sheet) có nút đóng và nút “Áp dụng”, thao tác gọn hơn",
  ] },
{ v: "1.0.16", date: "2026-08-09", items: [
    "Bỏ hẳn phần gắn chiến dịch / brief khỏi giỏ hàng và bước Checkout — giỏ hàng giờ độc lập với trang Chiến dịch",
    "Checkout làm lại: xem tóm tắt giỏ (KOL/Community/nền tảng/reach/ngân sách), đặt Tên báo giá (nhớ cho lần sau) và thêm ghi chú trước khi xuất file",
    "File báo giá xuất ra mở đầu bằng Tên báo giá + Ngày tạo thay cho dòng chiến dịch",
    "Đổi tên cho nhất quán: trang \"Giỏ hàng & Báo giá\", nút \"Tạo giỏ hàng demo\" và \"Xóa toàn bộ giỏ hàng\"",
  ] },
{ v: "1.0.15", date: "2026-08-09", items: [
    "Kéo chỉnh độ rộng cột xong thả chuột trong ô tiêu đề không còn bị hiểu nhầm thành bấm sắp xếp — bảng giữ nguyên thứ tự",
  ] },
{ v: "1.0.14", date: "2026-08-09", items: [
    "Điện thoại: hết dải trống bên phải — trang không còn tràn ngang, nội dung vừa khít màn hình",
    "Cột KOL / KOC căn trái cả tiêu đề lẫn nội dung ở mọi bảng (trước đây tiêu đề bị căn giữa)",
    "Gộp 2 ô chọn cột thành 1: bộ cột dựng sẵn + mẫu đã lưu + “Lưu bộ cột hiện tại thành mẫu…” nằm chung một chỗ — lưu xong mẫu hiện ngay trong danh sách",
    "Gõ chữ trong popup mượt hơn: bỏ hiệu ứng làm mờ nền và phóng to popup (đỡ tốn GPU)",
    "Điện thoại: thẻ chỉ số thấp lại, hàng lọc nhanh cuộn ngang một hàng, nút thao tác to đủ bấm",
  ] },
{ v: "1.0.13", date: "2026-08-09", items: [
    "Popup thêm/sửa KOL vừa khít màn hình điện thoại — không còn tràn mép, nút Lưu/Hủy luôn thấy",
    "Thanh kéo ngang bảng đổi màu navy/gold, dày hơn và luôn hiện + dải nhắc “Kéo ngang để xem thêm cột”",
    "Bộ cột Mặc định co lại vừa khung desktop — cột cuối không bị cắt",
    "Kéo ngang bảng vẫn thấy cột chọn + tên KOL (ghim bên trái)",
    "Gọn lại trên điện thoại: thanh công cụ, thẻ chỉ số, lịch nội dung, banner refresh, khung chat AI",
    "Nút giỏ hàng không còn che nội dung cuối trang",
  ] },
{ v: "1.0.12", date: "2026-08-09", items: [
    "Mượt hơn: debounce toàn bộ ô tìm kiếm/bộ lọc, popup mở nhanh",
    "Bộ lọc đồng bộ data mới: cấp độ 5, ngành 20, tỉnh/thành 34 + thêm Creator type, Đại diện, Kênh liên hệ, Trạng thái quan hệ",
    "Cột hiển thị gọn: chỉ 2 chế độ Mặc định / Tùy chọn + lưu được mẫu cột",
    "Trả lại thanh kéo ngang bảng (bỏ tự co cột)",
    "Gộp cột: bỏ Lịch sử làm việc trùng, đổi Xác minh → Lịch sử làm việc, form nhập khớp",
    "Ô dữ liệu căn trái hết, cột tên giữ nguyên",
    "Checkbox Chọn tất cả ở header + đếm số đã chọn (kiểu Meta Ads Manager)",
  ] },

{ v: "1.0.11", date: "2026-08-09", items: [
    "Sửa lag khi gõ tìm kiếm/lọc (debounce 150ms — hết giật khi nhập)",
    "Bảng KOL Premium: hover, badge tier màu, pill trạng thái, sort rõ ràng, đếm X–Y/Z, empty state, xuất CSV",
    "Bố cục cột hợp lý: Rút gọn/Mặc định bỏ cột giá chi tiết (dồn vào Đầy đủ)",
    "Form KOL chuẩn theo dropdown sheet: Tier 5, ngành 20, casting 10, tỉnh/thành 34, nền tảng 7, trạng thái quan hệ 7",
    "Thêm field: Creator type, Đại diện/quản lý, Kênh liên hệ, Tình trạng hợp đồng, thanh toán, hợp tác lại, mức sự cố",
    "Lịch sử làm việc: dropdown trạng thái quan hệ + ghi chú campaign",
  ] },

{ v: "1.0.10", date: "2026-08-09", items: [
    "Fix AI đọc link online: danh sách nhiều KOL không còn bị cắt JSON (tăng giới hạn + bóc JSON thông minh)",
    "Bảng KOL tự co cột vừa khung màn hình ở mọi zoom (80–150%)",
    "Form thêm/sửa KOL: nút Lưu/Hủy luôn hiện khi cuộn (sticky), modal rộng hơn",
  ] },

{ v: "1.0.9", date: "2026-08-09", items: [
    "Fix resize cột bảng sai khi zoom Chrome khác 100% (bảng tràn khung)",
    "Tự sửa bảng hỏng: bỏ col widths lưu sai từ localStorage cũ",
    "Bỏ click avatar user — tránh mất nội dung AI workspace",
    "Fix text tràn ở Tổng quan (.hbar-label) và AI (.ai-conv-title)",
    "Remake form Thêm KOL/KOC thủ công: đủ cột CREATOR_DB, giao diện premium",
    "AI đọc link online: Google Sheet / Docs / Slides + website bất kỳ",
    "Nhập nhiều KOL hàng loạt: bảng preview + thêm N KOL 1 lần",
  ] },

    { v: "1.0.8", date: "2026-08-08", items: [
      "AI Workspace: sửa lỗi tìm KOL bằng tiếng Việt (làm đẹp, ẩm thực, mẹ và bé...) — tự map sang niche tiếng Anh trong CSDL.",
      "Fix AI giỏ hàng: bỏ schema parameters rỗng gây lỗi 400 khi gọi tool export_quote/get_stats.",
    ] },

    { v: "1.0.7", date: "2026-08-08", items: [
      "Người dùng & phân quyền đọc/ghi thẳng tab Employees trên Google Sheet — bỏ hoàn toàn mật khẩu, đăng nhập bằng Google.",
      "Ba vai thống nhất: Admin · Planner · Viewer.",
      "Thêm cột “Lịch sử làm việc” (Relationship_Status) vào bảng KOL/KOC.",
      "Kéo chỉnh độ rộng được mọi cột, kể cả 4 cột con nền tảng.",
      "AI Workspace thao tác được với giỏ hàng (tìm KOL → thêm vào giỏ).",
      "Menu thu gọn hết lệch; bỏ dropdown chiến dịch demo khỏi thanh lọc booking.",
    ] },
    { v: "1.0.6", date: "2026-08-05", items: [
      "Thanh công cụ kiểu Ads Manager: pill lọc nhanh · Cột · Breakdown · Xuất.",
      "Quản lý người dùng trong app, menu dạng accordion nhớ trạng thái.",
    ] },
    { v: "1.0.5", date: "2026-08-02", items: [
      "Header 2 tầng cho nhóm nền tảng, thu gọn menu còn 64px kèm tooltip.",
    ] },
    { v: "1.0.3", date: "2026-07-28", items: [
      "Đăng nhập Google (tab Employees), đồng bộ CREATOR_DB từ Google Sheet.",
    ] },
  ];
  function renderChangelog() {
    return `<div class="changelog">${CHANGELOG.map((c) => `
      <div class="cl-item">
        <div class="cl-head"><b>v${esc(c.v)}</b> <span class="muted">${esc(c.date)}</span></div>
        <ul>${c.items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
      </div>`).join("")}</div>`;
  }

  function renderKols() { bookingUi.type = "kol"; bookingUi.stage = ""; renderBookingPage(); }
  // 1.0.6: Community/Hotpage chưa có CSDL thật → trang giới thiệu tạm thay cho bảng rỗng
  function renderGroups() {
    bookingUi.type = "community";
    setContent(`
      ${pageHead("Community / Hotpage", "Đặt bài trên group, fanpage và hotpage — module đang được xây dựng.", "")}
      <div class="card"><div class="card-body">
        <div class="coming-soon">
          <div class="cs-ico">👥</div>
          <h2>Đang hoàn thiện CSDL Community</h2>
          <p>Nhóm dữ liệu group / fanpage / hotpage đang được tổng hợp và xác minh trước khi mở cho cả team. Trong lúc chờ, anh chị cứ dùng CSDL KOL/KOC như bình thường.</p>
          <ul class="cs-list">
            <li>Hồ sơ group: số thành viên, chủ đề, khu vực, chất lượng tương tác</li>
            <li>Thông tin admin và quy định đăng bài của từng group</li>
            <li>Giá slot theo định dạng: bài ghim, bài thường, album ảnh, livestream</li>
            <li>Chọn vào chung giỏ hàng với KOL/KOC để xuất một báo giá duy nhất</li>
          </ul>
          <div class="empty-cta-actions"><a class="btn btn-primary" href="#/kol">Tới CSDL KOL/KOC →</a></div>
        </div>
      </div></div>
    `);
  }

  function renderBookingPage() {
    const isKol = bookingUi.type === "kol";
    const title = isKol ? "CSDL Booking — KOL / KOC" : "CSDL Booking — Community / Group";
    const sub = isKol ? "Danh sách creator: nghiên cứu, xác minh, rồi chọn vào chiến dịch." : "Danh sách group / page / hotpage: nghiên cứu, xác minh, rồi chọn vào chiến dịch.";
    const addLabel = isKol ? "＋ Thêm KOL/KOC" : "＋ Thêm Group/Page";
    // 1.0.11 (Mục B7): nút CSV chỉ hiện khi thật sự có dữ liệu để xuất
    const hasRows = (isKol ? state.kolDb : state.communityDb || []).length > 0;
    const headActions = (can("manage") ? `<button class="btn btn-primary btn-pill" data-action="add-booking">${addLabel}</button>` : "")
      + (can("export") && hasRows ? `<button class="btn btn-pill btn-ghost" data-action="export-booking-csv" title="Xuất đúng danh sách đang lọc ra file CSV">⬇ CSV</button>` : "")
      + (isKol ? `<button class="btn btn-pill btn-sync" data-action="sync-creator" title="Tải lại CSDL creator từ Google Sheet CREATOR_DB">🔄 Đồng bộ</button>` : "");
    setContent(`
      ${withRefreshBanner(pageHead(title, sub, headActions))}

      <div id="booking-flow"></div>

      <!-- 1.1: thanh công cụ — tìm kiếm (trái) · pill lọc nhanh kèm số đếm (giữa) · Cột/Bộ lọc/Xuất (phải) -->
      <div class="bk-toolbar">
        <div class="bk-search"><span class="bk-search-ico">${icon("search", 15)}</span><input type="search" id="bk-q" placeholder="${isKol ? "Tìm tên, @handle…" : "Tìm tên group/page…"}" value="${esc(bookingUi.q)}" /></div>
        <div class="bk-pills" id="bk-pills">
          ${Object.entries(BK_PILLS).map(([k, v]) => `<button class="bk-pill ${bookingUi.pill === k ? "active" : ""}" data-pill="${k}">${esc(v.label)} <span class="bk-pill-cnt">${fmtNum((isKol ? state.kolDb : state.communityDb || []).filter(v.test).length)}</span></button>`).join("")}
        </div>
        <div class="bk-tools">
          <button class="btn btn-ghost btn-sm bk-tool-col" data-action="customize-cols" title="Tuỳ chỉnh cột hiển thị">⚙ Cột</button>
          <select class="bk-select bk-tool-col" id="bk-breakdown" title="Breakdown: thống kê nhanh theo nhóm">${Object.entries(BK_BREAKDOWNS).map(([k, v]) => `<option value="${k}" ${bookingUi.breakdown === k ? "selected" : ""}>${esc(v.label)}</option>`).join("")}</select>
          <!-- 1.0.14 (Mục C): 1 dropdown duy nhất — bộ cột dựng sẵn + mẫu đã lưu + lưu mẫu mới -->
          <select class="bk-select bk-tool-col" id="bk-view" title="Bộ cột: mặc định, mẫu đã lưu, hoặc lưu mẫu mới">${colViewOptions()}</select>
          <button class="btn btn-ghost btn-sm bk-tool-col" data-action="del-col-preset" title="Xoá mẫu cột đang chọn">🗑</button>
          <button class="btn btn-sm bk-filter-btn" id="bk-filter-toggle" type="button" title="Mở / đóng bộ lọc chi tiết">📋 Bộ lọc <span class="bk-filter-badge" id="bk-filter-badge" hidden></span></button>
          ${can("export") ? `<button class="btn btn-ghost btn-sm bk-tool-export" data-action="export-booking-all">${icon("download", 14)} Xuất</button>` : ""}
          <!-- R4 (mục 5): đếm kết quả "X / Y" — desktop; ẩn trên mobile (đã có ở chân bảng) -->
          <span class="bk-result-count" id="bk-result-count"></span>
        </div>
      </div>

      <!-- 1.1: panel bộ lọc chi tiết — 3 nhóm logic; desktop inline · mobile bottom-sheet -->
      <details class="bk-filters" id="bk-filters">
        <summary class="bk-filters-bar" id="bk-filters-bar">
          <span class="bk-filters-title">Bộ lọc chi tiết <span class="bk-filter-count" id="bk-filter-count"></span></span>
          <button type="button" class="bk-sheet-x" id="bk-filters-close" aria-label="Đóng bộ lọc">✕</button>
        </summary>
        <div class="bk-fgroup">
          <div class="bk-fgroup-title">Hồ sơ</div>
          <div class="bk-fgrid">
            ${bkMultiSelect("bk-niche", "Ngành hàng", BOOKING_NICHES.map((v) => [v, v]), bookingUi.niche, false)}
            ${bkMultiSelect("bk-platform", "Nền tảng", Object.entries(PLATFORMS).map(([k, v]) => [k, v.label, v.icon]), bookingUi.platform, true)}
            <div class="field"><label>Khu vực</label><select id="bk-region">${optionList(niceMap(REGIONS), bookingUi.region, "Tất cả")}</select></div>
            <!-- 1.0.12 (Mục B3): Cấp độ dùng 5 bậc chuẩn sheet (TIER_TEXTS), so khớp thẳng chữ Tier của record -->
            <div class="field"><label>Cấp độ</label><select id="bk-tier">${optionList(niceMap(TIER_TEXTS), bookingUi.tier, "Tất cả")}</select></div>
            <div class="field"><label>Creator type</label><select id="bk-creator-type">${optionList(niceMap(CREATOR_TYPES), bookingUi.creatorType, "Tất cả")}</select></div>
          </div>
        </div>
        <div class="bk-fgroup">
          <div class="bk-fgroup-title">Quy mô &amp; ngân sách</div>
          <div class="bk-fgrid">
            <!-- R4 (mục 5): khoảng follower — lọc theo tổng follower (KOL) / members (Community) -->
            <div class="field bk-field-wide"><label>${isKol ? "Follower" : "Members"} từ → đến</label><div class="bk-range"><input type="number" id="bk-fmin" class="bk-num" placeholder="tối thiểu" min="0" step="1000" value="${esc(bookingUi.followersMin || "")}" /><span class="bk-range-sep">→</span><input type="number" id="bk-fmax" class="bk-num" placeholder="tối đa" min="0" step="1000" value="${esc(bookingUi.followersMax || "")}" /></div></div>
            <!-- 1.1: ngân sách nay là KHOẢNG — thêm ô tối thiểu (#bk-budget-min); #bk-budget giữ vai trò tối đa -->
            <div class="field bk-field-wide"><label>Ngân sách (₫) từ → đến</label><div class="bk-range"><input type="number" id="bk-budget-min" placeholder="tối thiểu" min="0" step="1000000" value="${esc(bookingUi.budgetMin || "")}" /><span class="bk-range-sep">→</span><input type="number" id="bk-budget" placeholder="tối đa" min="0" step="1000000" value="${esc(bookingUi.maxBudget || "")}" /></div></div>
            <div class="field"><label>Nguồn</label><select id="bk-stage">${optionList(STAGES, bookingUi.stage, "Tất cả")}</select></div>
          </div>
        </div>
        <div class="bk-fgroup">
          <div class="bk-fgroup-title">Quan hệ &amp; liên hệ</div>
          <div class="bk-fgrid">
            <!-- 1.0.12 (Mục B4): bộ lọc bám cột SETTINGS của CREATOR_DB -->
            <div class="field"><label>Lịch sử làm việc</label><select id="bk-relationship">${optionList(niceMap(RELATIONSHIP_LABELS), bookingUi.relationship, "Tất cả")}</select></div>
            <div class="field"><label>Đại diện / quản lý</label><select id="bk-representation">${optionList(niceMap(REPRESENTATIONS), bookingUi.representation, "Tất cả")}</select></div>
            <div class="field"><label>Kênh liên hệ</label><select id="bk-contact-channel">${optionList(niceMap(CONTACT_CHANNELS), bookingUi.contactChannel, "Tất cả")}</select></div>
            ${isKol ? bkFilterFieldsExtra() : ""}
          </div>
        </div>
        <div class="bk-filters-foot">
          <div class="bk-number-toggle-row">
            <label class="bk-number-toggle" for="bk-show-full-numbers" title="Chỉ đổi cách hiển thị số trong bảng dữ liệu">
              <span><b>Hiển thị số đầy đủ</b><small>Mặc định rút gọn K / M / B</small></span>
              <span class="bk-switch"><input type="checkbox" id="bk-show-full-numbers" ${showFullBookingNumbers ? "checked" : ""} /><span class="bk-switch-track" aria-hidden="true"></span></span>
            </label>
          </div>
          <div class="bk-chip-row" id="bk-chip-row"></div>
          <div class="bk-filters-foot-actions">
            <button class="btn btn-sm bk-clear-btn" id="bk-clear" type="button" hidden>${icon("close", 13)} Xóa bộ lọc</button>
            <button class="btn btn-primary btn-sm bk-apply-btn" id="bk-apply" type="button">Áp dụng</button>
          </div>
        </div>
      </details>
      <div class="bk-sheet-backdrop" id="bk-filters-backdrop" hidden></div>

      <div id="bk-dq-bar"></div>
      <div id="bk-breakdown-bar"></div>

      <div class="card table-card">
        <div class="table-wrap"><table id="booking-table" class="col-zebra"><thead></thead><tbody></tbody></table></div>
        <div id="booking-summary"></div>
        <div class="bk-pager" id="booking-pager"></div>
      </div>

      <div id="shortlist-bar-wrap"></div>
    `);

    $("#bk-pills").addEventListener("click", (e) => {
      const b = e.target.closest("[data-pill]");
      if (!b) return;
      bookingUi.pill = b.dataset.pill;
      $$("#bk-pills .bk-pill").forEach((p) => p.classList.toggle("active", p === b));
      bkRedraw();
    });
    $("#bk-breakdown").addEventListener("change", (e) => { bookingUi.breakdown = e.target.value; bkRedraw(); });
    // 1.0.11 (Mục A): 4 ô nhập tay dùng chung 1 debounce 150ms — state cập nhật ngay, vẽ lại sau
    const debounceBk = debounce(() => bkRedraw(), 150);
    $("#bk-q").addEventListener("input", (e) => { bookingUi.q = e.target.value; debounceBk(); });
    bindBkMultiSelect("bk-niche", "niche");
    bindBkMultiSelect("bk-platform", "platform");
    $("#bk-region").addEventListener("change", (e) => { bookingUi.region = e.target.value; bkRedraw(); });
    $("#bk-tier").addEventListener("change", (e) => { bookingUi.tier = e.target.value; bkRedraw(); });
    // 1.0.12 (Mục B4): 4 bộ lọc mới
    $("#bk-creator-type").addEventListener("change", (e) => { bookingUi.creatorType = e.target.value; bkRedraw(); });
    $("#bk-representation").addEventListener("change", (e) => { bookingUi.representation = e.target.value; bkRedraw(); });
    $("#bk-contact-channel").addEventListener("change", (e) => { bookingUi.contactChannel = e.target.value; bkRedraw(); });
    $("#bk-relationship").addEventListener("change", (e) => { bookingUi.relationship = e.target.value; bkRedraw(); });
    bkBindExtraFilters();
    $("#bk-budget").addEventListener("input", (e) => { bookingUi.maxBudget = e.target.value; debounceBk(); }); // 1.0.11
    $("#bk-budget-min").addEventListener("input", (e) => { bookingUi.budgetMin = e.target.value; debounceBk(); }); // 1.1: ngân sách tối thiểu
    $("#bk-fmin").addEventListener("input", (e) => { bookingUi.followersMin = e.target.value; debounceBk(); }); // 1.0.11
    $("#bk-fmax").addEventListener("input", (e) => { bookingUi.followersMax = e.target.value; debounceBk(); }); // 1.0.11
    $("#bk-show-full-numbers").addEventListener("change", (e) => {
      showFullBookingNumbers = e.target.checked;
      saveShowFullNumbers(showFullBookingNumbers);
      drawBookingTable();
    });
    // R4 (mục 5) · 1.1: xoá toàn bộ bộ lọc — reset control tại chỗ, GIỮ panel đang mở (không rebuild cả trang)
    $("#bk-clear").addEventListener("click", () => {
      BK_FILTER_KEYS.forEach(bkResetFilterKey);
      bookingUi.pill = "";
      bookingUi.page = 1;
      const qEl = $("#bk-q"); if (qEl) qEl.value = "";
      $$("#bk-pills .bk-pill").forEach((p) => p.classList.toggle("active", p.dataset.pill === ""));
      bkRedraw();
      toast("Đã xóa bộ lọc", "Bảng hiển thị lại toàn bộ danh sách.", "success");
    });
    // 1.1: mở/đóng panel bộ lọc — desktop mở inline, mobile trượt lên bottom-sheet
    const bkToggleFilters = (open) => {
      const d = $("#bk-filters"); if (!d) return;
      d.open = open === undefined ? !d.open : open;
      const btn = $("#bk-filter-toggle"); if (btn) btn.classList.toggle("is-open", d.open);
    };
    $("#bk-filter-toggle").addEventListener("click", () => bkToggleFilters());
    $("#bk-filters-close").addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); bkToggleFilters(false); });
    $("#bk-apply").addEventListener("click", () => bkToggleFilters(false)); // filter đã auto-apply qua debounce → nút chỉ đóng panel
    $("#bk-filters-backdrop").addEventListener("click", () => bkToggleFilters(false));
    // 1.1: chặn <summary> tự đóng khi chạm tiêu đề sheet (chỉ đóng bằng nút × / Áp dụng / nền mờ)
    $("#bk-filters-bar").addEventListener("click", (e) => { if (!e.target.closest("#bk-filters-close")) e.preventDefault(); });
    // 1.1: bấm × trên 1 chip → gỡ riêng điều kiện đó (reset control + vẽ lại). Uỷ quyền click cho cả dải chip.
    $("#bk-chip-row").addEventListener("click", (e) => {
      const b = e.target.closest("[data-chip-clear]");
      if (!b) return;
      const key = b.dataset.chipClear;
      bkResetFilterKey(key);
      bkRedraw();
    });
    $("#bk-stage").addEventListener("change", (e) => { bookingUi.stage = e.target.value; drawFlowStepper(); bkRedraw(); });
    // 1.0.7 (item 4): bỏ dropdown "Chiến dịch / brief" khỏi thanh lọc booking — data còn là demo.
    // Giỏ hàng/shortlist nay là GLOBAL, không gắn campaign (route #/chien-dich vẫn giữ nguyên).
    // 1.0.14 (Mục C): 1 dropdown lo cả 3 việc — chọn view dựng sẵn, áp mẫu đã lưu, lưu mẫu mới
    $("#bk-view").addEventListener("change", (e) => {
      const v = String(e.target.value || "");
      if (v === "__save__") { saveColPresetPrompt(); return; }
      if (v.indexOf("preset:") === 0) {
        const p = loadColPresets().find((x) => x.name === v.slice(7));
        if (!p) { renderBookingPage(); return; }
        bkColPresetSel = p.name;
        bookingUi.customCols = p.cols.slice();
        bookingUi.view = "custom";
        saveColView();
        renderBookingPage();
        toast("Đã áp mẫu cột", p.name, "success");
        return;
      }
      bkColPresetSel = "";
      bookingUi.view = v.indexOf("view:") === 0 ? v.slice(5) : v;
      saveColView();
      bkRedraw();
    });

    // Phân trang: uỷ quyền sự kiện cho container (nội dung được vẽ lại mỗi lần drawBookingTable)
    const pager = $("#booking-pager");
    pager.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      bookingUi.page = Number(btn.dataset.page) || 1;
      drawBookingTable();
      const wrap = $("#booking-table").closest(".table-wrap");
      if (wrap) wrap.scrollTop = 0;
    });
    pager.addEventListener("change", (e) => {
      if (e.target.id !== "bk-page-size") return;
      const v = e.target.value;
      bookingUi.pageSize = v === "all" ? "all" : Number(v);
      try { localStorage.setItem(PAGE_SIZE_KEY, String(v)); } catch (err) {}
      bkRedraw();
    });

    drawFlowStepper();
    drawBookingTable();
    drawShortlistBar();
  }

  /* ---------- Trang Giỏ hàng & Báo giá (tổng hợp cả 2 loại) ---------- */
  function renderShortlistPage() {
    setContent(`
      ${pageHead("Giỏ hàng & Báo giá", "Danh sách đã chọn — tổng ngân sách, tổng reach, sẵn sàng xuất file báo giá.", "")}
      <div id="shortlist-page-body"></div>
    `);
    drawShortlistPageBody();
  }

  function drawShortlistPageBody() {
    const wrap = $("#shortlist-page-body");
    if (!wrap) return;
    const t = computeShortlistTotals();
    const rowHtml = (kind, x) => {
      const reach = kind === "kol" ? x.followers : x.membersFollowers;
      const priceStr = can("private") ? fmtVND(x.estimatedPrice) : `<span class="masked">•••</span>`;
      return `<tr>
        <td>${kind === "kol" ? bookingUserCell(x) : bookingGroupCell(x)}</td>
        <td>${platformCell(x.platform, true)}</td>
        <td class="right mono">${fmtFollowers(reach)}</td>
        <td class="right mono">${priceStr}</td>
        <td class="right"><button class="icon-btn btn-sm" data-action="unshortlist" data-kind="${kind}" data-id="${x.id}" title="Bỏ khỏi shortlist">✕</button></td>
      </tr>`;
    };
    wrap.innerHTML = `
      <div class="kpi-grid">
        ${miniStat("Đã chọn", t.count)}
        ${miniStat("KOL / KOC", t.kol.length)}
        ${miniStat("Community / Group", t.comm.length)}
        ${miniStat("Tổng reach ước tính", fmtNum(t.totalReach))}
      </div>
      <div class="kpi-grid" style="grid-template-columns:1fr">
        ${kpi("💰", "i-warning", can("private") ? fmtVND(t.totalBudget) : "🔒 Ẩn theo phân quyền", "Tổng ngân sách ước tính (quote)", can("private") ? "Admin/Planner xem đầy đủ" : "Viewer không thấy giá chi tiết", "up")}
      </div>
      ${!t.count ? `<div class="card"><div class="card-body">
        ${emptyState("🧾", "Giỏ hàng đang trống. Tick chọn KOL/Community trong CSDL Booking để lên báo giá.")}
        <div class="empty-cta-actions">
          ${can("shortlist") ? `<button class="btn btn-primary" data-action="seed-shortlist">✨ Tạo giỏ hàng demo</button>` : ""}
          <a class="btn btn-ghost" href="#/kol">Tới CSDL Booking →</a>
        </div>
      </div></div>` : `
        <div class="card">
          <div class="card-head"><h2>KOL / KOC đã chọn</h2></div>
          <div class="table-wrap"><table><thead><tr><th class="col-name">KOL/KOC</th><th>Nền tảng</th><th class="right">Follower</th><th class="right">Giá ước tính</th><th></th></tr></thead>
          <tbody>${t.kol.length ? t.kol.map((x) => rowHtml("kol", x)).join("") : `<tr><td colspan="5">${emptyState("🌟", "Chưa chọn KOL/KOC nào.")}</td></tr>`}</tbody></table></div>
        </div>
        <div class="card">
          <div class="card-head"><h2>Community / Group đã chọn</h2></div>
          <div class="table-wrap"><table><thead><tr><th class="col-name">Group/Page</th><th>Nền tảng</th><th class="right">Members</th><th class="right">Giá ước tính</th><th></th></tr></thead>
          <tbody>${t.comm.length ? t.comm.map((x) => rowHtml("community", x)).join("") : `<tr><td colspan="5">${emptyState("👥", "Chưa chọn Community/Group nào.")}</td></tr>`}</tbody></table></div>
        </div>
      `}
      <div class="shortlist-bar" style="position:static">
        <div class="sl-stat"><strong>${t.count}</strong><small>Tổng số mục đã chọn</small></div>
        <div class="sl-stat"><strong>${fmtFollowers(t.totalReach)}</strong><small>Tổng reach ước tính</small></div>
        <div class="sl-stat"><strong>${can("private") ? fmtShortVND(t.totalBudget) : "🔒 Ẩn"}</strong><small>Tổng ngân sách ước tính</small></div>
        <div class="sl-actions">
          <button class="btn btn-ghost btn-sm" data-action="clear-shortlist">Xóa toàn bộ giỏ hàng</button>
          ${can("export") ? `<button class="btn btn-primary btn-sm" data-action="cart-checkout">⭳ Xuất báo giá</button>` : ""}
        </div>
      </div>
    `;
  }

  /* ---------- 1.0.7 (item 5) — Người dùng = tab Employees trên Google Sheet (chỉ Admin) ---------- */
  // Quyền của từng vai, dùng chung cho bảng phân quyền và phần mô tả trong form
  const ROLE_MATRIX = [
    { key: "Xem CSDL & chọn vào giỏ", of: () => true },
    { key: "Xem giá & liên hệ",       of: (r) => r === "admin" || r === "planner" },
    { key: "Thêm / sửa bản ghi",      of: (r) => r === "admin" || r === "planner" },
    { key: "Xuất file báo giá",       of: (r) => r === "admin" || r === "planner" },
    { key: "Xóa bản ghi",             of: (r) => r === "admin" },
    { key: "Quản lý người dùng",      of: (r) => r === "admin" },
  ];

  // write-back.php nhận kind:"employees" với op list | save | delete
  function employeesApi(payload) {
    return apiFetch(WRITE_BACK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.assign({ kind: "employees" }, payload)),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "Không kết nối được máy chủ." }));
  }
  function loadEmployees() {
    return employeesApi({ op: "list" }).then((r) => {
      if (r && r.ok && Array.isArray(r.rows)) employees = r.rows.map((u) => ({ name: u.name || u.email, email: String(u.email || "").toLowerCase(), role: normRole(u.role) }));
      return r;
    });
  }

  // 1.1.3: badge trạng thái hoạt động dựa trên activitySeen[] (nạp từ activity.php)
  function fmtLastSeenAt(ts) {
    const d = new Date(ts * 1000);
    const now = new Date();
    const dayStart = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diffDays = Math.round((dayStart(now) - dayStart(d)) / 86400000);
    const hm = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
    if (diffDays <= 0) return hm + " hôm nay";
    if (diffDays === 1) return hm + " hôm qua";
    return hm + " " + String(d.getDate()).padStart(2, "0") + "/" + String(d.getMonth() + 1).padStart(2, "0");
  }
  function userStatusCell(u, isMe) {
    if (isMe) return `<span class="tag success">🟢 Online</span>`; // chính mình đang mở tool
    const lastSeen = activitySeen[sanitizeEmailKey(u.email)];
    if (!lastSeen) return `<span class="tag muted">⚪ Chưa từng vào</span>`;
    const diff = Math.floor(Date.now() / 1000) - lastSeen;
    if (diff <= 5 * 60) return `<span class="tag success">🟢 Online</span>`;
    if (diff <= 30 * 60) return `<span class="tag warning">🟡 Vừa hoạt động</span>`;
    return `<span class="tag">⚪ Offline</span><div class="cu-sub">Lần cuối: ${esc(fmtLastSeenAt(lastSeen))}</div>`;
  }

  let usersRefreshTimer = null; // 1.1.3: auto-refresh trạng thái mỗi 30s khi trang Users đang mở
  function renderUsersPage() {
    if (!can("manage_users")) {
      if (usersRefreshTimer) { clearInterval(usersRefreshTimer); usersRefreshTimer = null; }
      setContent(`${pageHead("Người dùng", "Chỉ Admin mới xem được trang này.", "")}${emptyState("🔒", "Bạn không có quyền truy cập mục này. Liên hệ Admin nếu cần đổi quyền.")}`);
      return;
    }
    setContent(`
      ${pageHead("Người dùng & phân quyền", "Danh sách lấy thẳng từ tab Employees trên Google Sheet — cũng chính là danh sách được phép đăng nhập bằng Google.",
        `<button class="btn btn-primary" data-action="add-user">＋ Thêm người dùng</button>`)}
      <div class="card">
        <div class="card-head"><div><h2>Danh sách tài khoản</h2><div class="sub" id="users-count">Đang tải từ Google Sheet…</div></div></div>
        <div class="table-wrap"><table id="users-table">
          <thead><tr><th class="col-name">Tên</th><th>Email đăng nhập (Google)</th><th>Vai trò</th><th class="center">Trạng thái</th><th>Quyền chính</th><th class="center">Thao tác</th></tr></thead>
          <tbody id="users-tbody"></tbody>
        </table></div>
      </div>
      <div class="card">
        <div class="card-head"><div><h2>Bảng phân quyền</h2><div class="sub">Quyền cố định theo vai, không chỉnh lẻ từng người</div></div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>Quyền</th>${Object.entries(ROLES).map(([, v]) => `<th class="center">${esc(v.label)}</th>`).join("")}</tr></thead>
          <tbody>${ROLE_MATRIX.map((row) => `<tr>
            <td>${esc(row.key)}</td>
            ${Object.keys(ROLES).map((r) => `<td class="center">${row.of(r) ? tag("Có", "success") : tag("Không", "danger")}</td>`).join("")}
          </tr>`).join("")}</tbody>
        </table></div>
      </div>
    `);
    drawUsersTable();
    loadEmployees().then((r) => {
      if (!r || !r.ok) {
        const c = $("#users-count");
        if (c) c.textContent = "Không đọc được tab Employees: " + ((r && r.error) || "lỗi kết nối");
        return;
      }
      drawUsersTable();
    });
    loadActivity().then(() => drawUsersTable());
    if (usersRefreshTimer) clearInterval(usersRefreshTimer);
    usersRefreshTimer = setInterval(() => { loadActivity().then(() => drawUsersTable()); }, 30000);
  }

  function drawUsersTable() {
    const tb = $("#users-tbody");
    if (!tb) return;
    const c = $("#users-count");
    if (c) c.textContent = `${fmtNum(employees.length)} người dùng · tab Employees`;
    if (!employees.length) {
      tb.innerHTML = `<tr><td colspan="6">${emptyState("👥", "Chưa đọc được người dùng nào từ tab Employees.")}</td></tr>`;
      return;
    }
    tb.innerHTML = employees.map((u) => {
      const role = normRole(u.role);
      const isMe = currentUser && String(currentUser.email).toLowerCase() === String(u.email).toLowerCase();
      return `<tr>
        <td><div class="cell-user"><span class="avatar av-${avatarTone(u.name)}">${esc(initials(u.name))}</span><div class="stack-sm"><span class="cu-name">${esc(u.name)}</span>${isMe ? `<span class="cu-sub">Bạn đang đăng nhập</span>` : ""}</div></div></td>
        <td class="mono">${esc(u.email)}</td>
        <td class="center"><span class="role-pill ${role}">${esc(ROLES[role].label)}</span></td>
        <td class="center">${userStatusCell(u, isMe)}</td>
        <td class="trunc" title="${esc(ROLES[role].hint)}">${esc(ROLES[role].hint)}</td>
        <td class="center"><div class="row-actions">
          <button class="icon-btn btn-sm" data-action="edit-user" data-email="${esc(u.email)}" title="Sửa">${icon("edit")}</button>
          <button class="icon-btn btn-sm" data-action="del-user" data-email="${esc(u.email)}" title="Xóa"${isMe ? " disabled" : ""}>${icon("trash")}</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  // 1.0.7 (item 5b): không còn ô mật khẩu — đăng nhập là Google Sign-In
  function userForm(u) {
    u = u || { name: "", email: "", role: "viewer" };
    return `<div class="form-grid">
      <div class="form-field"><label>Họ tên *</label><input name="name" required value="${esc(u.name)}" placeholder="Nguyễn Văn A" /></div>
      <div class="form-field"><label>Email Google *</label><input name="email" type="email" required value="${esc(u.email)}" placeholder="admin@example.com" /></div>
      <div class="form-field full"><label>Vai trò *</label><select name="role">${Object.entries(ROLES).map(([k, v]) => `<option value="${k}" ${normRole(u.role) === k ? "selected" : ""}>${esc(v.label)} — ${esc(v.hint)}</option>`).join("")}</select></div>
      <p class="muted full" style="font-size:12.5px;margin:2px 0 0">Lưu vào tab <b>Employees</b> của Google Sheet. Người dùng đăng nhập bằng chính email Google này — hệ thống không dùng mã đăng nhập riêng.</p>
    </div>`;
  }

  // Trả Promise<""> nếu lưu được, hoặc câu báo lỗi để hiện toast
  function saveUser(d, email) {
    const name = String(d.name || "").trim();
    const mail = String(d.email || "").trim().toLowerCase();
    if (!name || !mail) return Promise.resolve("Nhập đủ họ tên và email.");
    if (employees.find((u) => u.email === mail && u.email !== email)) return Promise.resolve("Email này đã có trong tab Employees.");
    const role = normRole(d.role);
    const old = email ? employees.find((u) => u.email === email) : null;
    // Admin cuối cùng mà hạ vai thì cả hệ thống mất người quản trị
    if (old && old.role === "admin" && role !== "admin" && employees.filter((u) => u.role === "admin").length <= 1)
      return Promise.resolve("Phải còn ít nhất một tài khoản Admin.");
    return employeesApi({ op: "save", name, email: mail, role, oldEmail: email || "" }).then((r) => {
      if (!r || !r.ok) return (r && r.error) || "Ghi lên Google Sheet thất bại.";
      return loadEmployees().then(() => {
        // Sửa chính mình → cập nhật luôn session để phân quyền đổi ngay
        if (currentUser && email && String(currentUser.email).toLowerCase() === String(email).toLowerCase()) {
          currentUser = Object.assign({}, currentUser, { name, email: mail, role });
          saveSession(currentUser, true);
          renderUserChip(); applyNavPerms();
        }
        return "";
      });
    });
  }

  /* R4 (mục 4): bỏ stepper "Daily Research → Verify".
     CREATOR_DB đồng bộ từ Google Sheet KHÔNG có cột stage → 2 con số đó luôn 0/tất cả,
     vô nghĩa và gây hiểu lầm. Thay bằng 4 chỉ số ĐẾM THẬT từ dữ liệu đang có.
     Giữ nguyên id #booking-flow để mọi chỗ gọi drawFlowStepper() vẫn chạy. */
  function drawFlowStepper() {
    const el = $("#booking-flow");
    if (!el) return;
    const isKol = bookingUi.type === "kol";
    const list = (isKol ? state.kolDb : state.communityDb) || [];
    const priced = list.filter((x) => (x.estimatedPrice || 0) > 0).length;
    const worked = list.filter((x) => /đã hợp tác/i.test(x.relationship || x.workHistory || "")).length;
    const inCart = cartCount();
    const chip = (v, label, tone, sub) =>
      `<div class="bk-stat ${tone}"><span class="bs-count">${fmtNum(v)}</span><span class="bs-label">${esc(label)}</span><span class="bs-sub">${esc(sub)}</span></div>`;
    el.innerHTML = `<div class="bk-stats">
      ${chip(list.length, isKol ? "KOL / KOC trong CSDL" : "Group / Page trong CSDL", "t-primary", "Tổng bản ghi đã đồng bộ")}
      ${chip(priced, "Đã có giá", "t-success", pct(priced, list.length) + "% có giá ước tính")}
      ${chip(worked, "Đã hợp tác", "t-warning", "Có lịch sử làm việc với Markus")}
      ${chip(inCart, "Trong giỏ hàng", "t-info", "Sẵn sàng lên báo giá")}
    </div>`;
  }

  function filteredBookingRows() {
    const list = bookingUi.type === "kol" ? state.kolDb : state.communityDb;
    const q = bookingUi.q.trim().toLowerCase();
    const maxB = Number(bookingUi.maxBudget) || Infinity;
    // 1.1: ngân sách tối thiểu — để trống = 0 (không giới hạn dưới)
    const minB = bookingUi.budgetMin === "" ? 0 : (Number(bookingUi.budgetMin) || 0);
    // R4 (mục 5): khoảng follower — để trống = không giới hạn
    const fMin = bookingUi.followersMin === "" ? 0 : (Number(bookingUi.followersMin) || 0);
    const fMax = bookingUi.followersMax === "" ? Infinity : (Number(bookingUi.followersMax) || Infinity);
    const pill = (BK_PILLS[bookingUi.pill] || BK_PILLS[""]).test;
    return list.filter((x) => {
      if (!pill(x)) return false;
      const nicheVal = bookingUi.type === "kol" ? x.niche : x.topic;
      const reach = bookingUi.type === "kol" ? x.followers : x.membersFollowers;
      if (!bkMatchesSelected(bookingUi.niche, nicheVal)) return false;
      if (!bkMatchesSelected(bookingUi.platform, x.platform)) return false;
      if (bookingUi.region && normRegion(x.region) !== bookingUi.region) return false;
      // 1.0.12 (Mục B3): Tier so bằng CHỮ (Nano/Micro/Mid-Tier/Macro/Celeb) — record thiếu Tier thì suy từ follower
      if (bookingUi.tier && tierText(x, reach).toLowerCase() !== bookingUi.tier.toLowerCase()) return false;
      const reachNum = reach || 0;
      if (reachNum < fMin || reachNum > fMax) return false;
      if ((x.estimatedPrice || 0) > maxB) return false;
      if (minB && (x.estimatedPrice || 0) < minB) return false; // 1.1: ngân sách tối thiểu
      if (bookingUi.stage && x.stage !== bookingUi.stage) return false;
      // 1.0.12 (Mục B4): 4 bộ lọc mới — relationship so theo nhãn ĐANG hiện trong cột "Lịch sử làm việc"
      if (bookingUi.creatorType && String(x.creatorType || "") !== bookingUi.creatorType) return false;
      if (bookingUi.representation && String(x.representation || "") !== bookingUi.representation) return false;
      if (bookingUi.contactChannel && String(x.contactChannel || "") !== bookingUi.contactChannel) return false;
      if (bookingUi.relationship && relLabel(x) !== bookingUi.relationship) return false;
      if (!bkExtraFilterPass(x)) return false;
      if (q) {
        const hay = (bookingUi.type === "kol" ? `${x.name} ${x.handle} ${x.niche}` : `${x.name} ${x.topic}`).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function bookingUserCell(x) {
    const pl = PLATFORMS[x.platform] || { icon: "🔗" };
    // v103a: URL thật lấy từ hyperlink của ô → render link; không có thì fallback handle/khu vực
    const url = x.profileUrl || x.link;
    const sub = url
      ? `<a href="${esc(url)}" target="_blank" rel="noopener" class="cu-link" title="${esc(url)}">${esc(x.handle || shortDomain(url))}</a>`
      : esc(x.handle || normRegion(x.region) || "—");
    return `<div class="cell-user"><span class="avatar ${avatarClass(x)}">${esc(initials(x.name))}</span><div class="stack-sm"><span class="cu-name">${esc(x.name)}</span><span class="cu-sub">${pl.icon} ${sub}</span></div></div>`;
  }
  // 1.0.5: avatar lấy màu theo nền tảng chính (TikTok đen, FB xanh, IG gradient, YT đỏ);
  // creator không rõ nền tảng thì giữ màu hash theo tên như cũ.
  function avatarClass(x) {
    return PLATFORM_COL_KEYS.includes(x.platform) ? "av-p-" + x.platform : "av-" + avatarTone(x.name);
  }
  // Ô follower của một nền tảng: có link → bấm mở profile (màu xanh), không có số → "—"
  function platFollowerCell(x, key) {
    const st = (x.platStats && x.platStats[key]) || {
      followers: x.platform === key ? x.followers || 0 : 0,
      url: (x.socialLinks || {})[key] || "",
    };
    // Không có số follower → "—" (vẫn bấm được nếu ô đó có link profile)
    if (!st.followers) {
      return st.url
        ? `<a class="plat-none plat-none-link" href="${esc(st.url)}" target="_blank" rel="noopener" title="Chưa có số follower — mở ${esc((PLATFORMS[key] || {}).label || key)}">—</a>`
        : `<span class="plat-none">—</span>`;
    }
    const num = `<span class="plat-num">${bookingTableNumber(st.followers, false)}</span>`;
    if (!st.url) return num;
    return `<a class="plat-link" href="${esc(st.url)}" target="_blank" rel="noopener" title="${esc(fmtNum(st.followers) + " follower · " + st.url)}">${bookingTableNumber(st.followers, false)}</a>`;
  }
  // "https://www.tiktok.com/@abc?x=1" → "tiktok.com/@abc"
  function shortDomain(url) {
    return String(url || "").replace(/^https?:\/\/(www\.)?/i, "").replace(/[?#].*$/, "").replace(/\/+$/, "");
  }
  // 1.0.3: màu avatar ổn định theo tên (không random mỗi lần vẽ)
  function avatarTone(name) {
    let h = 0;
    String(name || "").split("").forEach((c) => { h = (h * 31 + c.charCodeAt(0)) % 6; });
    return h;
  }
  const tierSlug = (t) => String(t == null ? "" : t).toLowerCase().replace(/[^a-z]/g, "");
  function tierCell(x) {
    const label = x.tier || (TIERS[tierOf(x.followers)] || {}).label || "";
    if (!label) return "—";
    // 1.0.11 (Mục B2): badge bo tròn riêng cho Tier — mỗi bậc một màu, đọc lướt là thấy hạng
    return `<span class="tier-badge t-${esc(tierSlug(label)) || "other"}">${esc(label)}</span>`;
  }
  // 1.0.11 (Mục B3): pill Relationship_Status, màu theo từng trạng thái quan hệ
  function relPill(v) {
    const k = normVerify(v);
    return `<span class="rel-pill r-${k}">${esc(RELATIONSHIP_STATUS[k].label)}</span>`;
  }
  // Gộp priceItems trùng loại, lấy giá cao nhất mỗi loại → "Photo: 5.000.000 ₫ · Video: 40.000.000 ₫"
  function priceItemsHint(items) {
    const byLabel = new Map();
    (items || []).forEach((it) => {
      if (!it || !it.amount) return;
      byLabel.set(it.label, Math.max(byLabel.get(it.label) || 0, it.amount));
    });
    return Array.from(byLabel, ([l, a]) => l + ": " + fmtVND(a)).join(" · ");
  }
  /* 1.0.6 — Giá luôn đọc được thành câu:
     có số  → "Từ 40.000.000 ₫" (giá thấp nhất theo SOW, hover xem chi tiết từng hạng mục)
     chưa có → "TBU" kèm tình trạng quan hệ để biết vì sao chưa có giá. */
  function priceCell(x, compactTable) {
    if (!can("private")) return `<span class="masked" title="Chỉ Admin/Manager xem được">•••</span>`;
    if (x.estimatedPrice) {
      const hint = priceItemsHint(x.priceItems);
      const title = hint || ("Giá tham chiếu: " + fmtVND(x.estimatedPrice));
      const amount = compactTable ? bookingTableNumber(x.estimatedPrice, true) : fmtVND(x.estimatedPrice);
      return `<span class="mono price-num ${hint ? "has-hint" : ""}" title="${esc(title)}">Từ ${amount}</span>`;
    }
    const why = x.priceStatus || x.relationship || "Chưa có báo giá";
    return `<span class="price-tbu" title="${esc(why)}">TBU</span>`;
  }
  function bookingGroupCell(x) {
    return `<div class="stack-sm"><span class="cu-name">${esc(x.name)}</span><span class="cu-sub trunc-link">${x.link ? `<a href="${esc(x.link)}" target="_blank" rel="noopener" class="muted" title="${esc(x.link)}">${esc(x.link.replace(/^https?:\/\//, ""))}</a>` : "—"}</span></div>`;
  }

  /* 1.0.4 — Cột "Liên hệ" premium: tách SĐT / email khỏi chuỗi text để render thành link bấm
     được (tel: / mailto:) kèm icon line-style theo theme; phần chữ còn lại (tên người liên hệ,
     ghi chú kênh…) vẫn giữ nguyên nên không mất thông tin nào so với bản cũ. */
  const ICO_PHONE = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>`;
  const ICO_MAIL = `<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>`;
  const RE_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
  const RE_PHONE = /(?:\+?84|0)\d[\d.\-\s]{7,12}\d/;
  const trimSep = (s) => String(s).replace(/^[\s·,;|—-]+/, "").replace(/[\s·,;|—-]+$/, "").trim();

  // 1.0.7 (item 13): tối đa 2 dòng, không lặp — Dòng1: ☎ sđt (Người liên hệ), Dòng2: ✉ email.
  // Community/không có sđt-email → 1 dòng adminContact (icon users).
  function contactCell(rec, contactVal) {
    const raw = String(contactVal || "");
    const person = (rec && rec.contactPerson) || "";
    const phone = trimSep((rec && rec.phone) || (raw.match(RE_PHONE) || [])[0] || "");
    const email = trimSep((rec && rec.email && RE_EMAIL.test(rec.email) ? rec.email : (raw.match(RE_EMAIL) || [])[0]) || "");
    const lines = [];
    if (phone) lines.push(`<a class="ct-link" href="tel:${esc(phone.replace(/[^\d+]/g, ""))}" title="Gọi ${esc(phone)}${person ? " — " + esc(person) : ""}"><span class="ct-ico ct-ico-phone">${icon("phone", 13)}</span><span class="ct-txt">${esc(phone)}${person ? " (" + esc(person) + ")" : ""}</span></a>`);
    if (email) lines.push(`<a class="ct-link" href="mailto:${esc(email)}" title="Gửi email ${esc(email)}"><span class="ct-ico ct-ico-mail">${icon("mail", 13)}</span><span class="ct-txt">${esc(email)}</span></a>`);
    if (!lines.length) {
      const fb = raw || person;
      if (fb) lines.push(`<span class="ct-link ct-plain"><span class="ct-ico">${icon("users", 13)}</span><span class="ct-txt">${esc(fb)}</span></span>`);
    }
    return lines.length ? lines.join("") : "—";
  }

  /* ---------- 1.0.5: Phân trang bảng CSDL Booking ----------
     Dãy số trang tối đa 7 nút: luôn có trang đầu / cuối, "…" khi bị ngắt quãng. */
  function pageNumbers(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (cur <= 4) return [1, 2, 3, 4, 5, "…", total];
    if (cur >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
    return [1, "…", cur - 1, cur, cur + 1, "…", total];
  }
  function drawBookingPager(total, start, shown, pageCount) {
    const el = $("#booking-pager");
    if (!el) return;
    const unit = bookingUi.type === "kol" ? "KOL/KOC" : "group/page";
    const from = shown ? start + 1 : 0;
    const to = start + shown;
    const cur = bookingUi.page;
    const sizes = PAGE_SIZES.map((s) => {
      const v = String(s);
      const label = s === "all" ? "Tất cả" : s + " / trang";
      return `<option value="${v}" ${String(bookingUi.pageSize) === v ? "selected" : ""}>${label}</option>`;
    }).join("");
    const nums = pageNumbers(cur, pageCount).map((n) =>
      n === "…"
        ? `<span class="pg-gap">…</span>`
        : `<button class="pg-num ${n === cur ? "active" : ""}" data-page="${n}"${n === cur ? ' aria-current="page"' : ""}>${n}</button>`
    ).join("");
    el.innerHTML = `
      <!-- 1.0.11 (Mục B5): "Đang hiện X–Y / Z" ngay cạnh phân trang -->
      <div class="bkp-info">Đang hiện <b>${fmtNum(from)}–${fmtNum(to)}</b> / <b>${fmtNum(total)}</b> ${unit}</div>
      <!-- 1.0.12 (Mục G14): số dòng đang chọn + nút bỏ chọn -->
      <span class="bkp-selected" id="bk-selected-count"></span>
      <select class="bkp-size" id="bk-page-size" aria-label="Số dòng mỗi trang">${sizes}</select>
      <div class="pager">
        <button class="pg-btn" data-page="${cur - 1}" ${cur <= 1 ? "disabled" : ""} aria-label="Trang trước" title="Trang trước">‹</button>
        ${nums}
        <button class="pg-btn" data-page="${cur + 1}" ${cur >= pageCount ? "disabled" : ""} aria-label="Trang sau" title="Trang sau">›</button>
      </div>`;
  }

  /* 1.0.6 — Breakdown: thống kê nhanh nhóm nào chiếm bao nhiêu trong tập ĐANG LỌC
     (giống panel Breakdown của Ads Manager, nhưng gọn thành một dải chip). */
  function drawBreakdownBar(rows) {
    const el = $("#bk-breakdown-bar");
    if (!el) return;
    const bd = BK_BREAKDOWNS[bookingUi.breakdown];
    if (!bd || !bd.of) { el.innerHTML = ""; return; }
    const m = new Map();
    rows.forEach((x) => { const k = bd.of(x); m.set(k, (m.get(k) || 0) + 1); });
    const items = Array.from(m, ([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 12);
    el.innerHTML = `<div class="bk-breakdown">
      <span class="bkb-title">${esc(bd.label)}</span>
      ${items.map((i) => `<span class="bkb-chip"><b>${fmtNum(i.value)}</b> ${esc(i.label)} <i>${pct(i.value, rows.length)}%</i></span>`).join("")}
    </div>`;
  }

  /* 1.0.6 — Dòng tổng kết dưới bảng: tổng bản ghi / tổng follower / số đã có giá / giá trung bình.
     Để ngoài <table> chứ không nhét vào <tfoot>: ô tfoot dài sẽ kéo giãn chiều rộng bảng
     và làm cả bảng phải cuộn ngang dù các cột vẫn vừa khung. */
  function drawTableSummary(rows) {
    const el = $("#booking-summary");
    if (!el) return;
    const isKol = bookingUi.type === "kol";
    const reachOf = (x) => (isKol ? (x.fTiktok || 0) + (x.fFacebook || 0) + (x.fInstagram || 0) + (x.fYoutube || 0) : x.membersFollowers || 0);
    const reach = rows.reduce((s, x) => s + reachOf(x), 0);
    const priced = rows.filter((x) => (x.estimatedPrice || 0) > 0);
    const avg = priced.length ? Math.round(priced.reduce((s, x) => s + x.estimatedPrice, 0) / priced.length) : 0;
    el.innerHTML = `<div class="bk-summary">
      <span><b>${fmtNum(rows.length)}</b> ${isKol ? "KOL/KOC" : "group/page"} sau bộ lọc</span>
      <span>Tổng follower <b>${fmtNum(reach)}</b></span>
      <span>Đã có giá <b>${fmtNum(priced.length)}</b> (${pct(priced.length, rows.length)}%)</span>
      <span>Giá trung bình <b>${can("private") ? (avg ? fmtVND(avg) : "—") : "🔒"}</b></span>
    </div>`;
  }

  /* R4 (mục 5): "X / Y KOL" cạnh ô tìm kiếm + số bộ lọc đang bật trên nhãn "Bộ lọc chi tiết".
     Cho biết ngay đang xem bao nhiêu trên tổng bao nhiêu — trước đây phải tự đoán. */
  function drawFilterCount(shown, total) {
    const unit = bookingUi.type === "kol" ? "KOL" : "group";
    const el = $("#bk-result-count");
    if (el) {
      const filtered = shown !== total;
      el.className = "bk-result-count" + (filtered ? " is-filtered" : "");
      el.textContent = `${fmtNum(shown)} / ${fmtNum(total)} ${unit}`;
      el.title = filtered ? "Đang lọc — bấm “Xóa bộ lọc” trong Bộ lọc chi tiết để xem lại toàn bộ." : "Đang xem toàn bộ danh sách";
    }
    // 1.1: badge nút "Bộ lọc" (toolbar) · count trong panel · dải chip · hiện/ẩn "Xóa bộ lọc" · nhãn "Áp dụng (N)"
    const isKol = bookingUi.type === "kol";
    const n = BK_FILTER_KEYS.filter((k) => bkFilterValueActive(bookingUi[k])).length + (bookingUi.pill ? 1 : 0);
    const badge = $("#bk-filter-badge");
    if (badge) { badge.textContent = n ? String(n) : ""; badge.hidden = !n; }
    const cnt = $("#bk-filter-count");
    if (cnt) { cnt.textContent = n ? `${n} đang bật` : ""; cnt.style.display = n ? "" : "none"; }
    const clearBtn = $("#bk-clear");
    if (clearBtn) clearBtn.hidden = !n;
    const applyBtn = $("#bk-apply");
    if (applyBtn) applyBtn.textContent = n ? `Áp dụng (${n})` : "Áp dụng";
    // dải chip: mỗi điều kiện của panel = 1 chip (bỏ "q" + pill — đã có ô tìm kiếm & pill sáng riêng)
    const chipRow = $("#bk-chip-row");
    if (chipRow) {
      const chips = BK_FILTER_KEYS.filter((k) => k !== "q" && bkFilterValueActive(bookingUi[k]))
        .map((k) => `<span class="bk-chip" title="${esc(bkChipTitle(k, bookingUi[k]))}">${esc(bkChipLabel(k, bookingUi[k], isKol))}<button type="button" data-chip-clear="${k}" aria-label="Gỡ ${esc(bkChipLabel(k, bookingUi[k], isKol))}">✕</button></span>`);
      chipRow.innerHTML = chips.join("");
      chipRow.style.display = chips.length ? "" : "none";
    }
  }

  // 1.0.7 (item 12): metadata 5 cột giá format (colkey · key priceByFormat · header)
  const PRICE_COL_META = [
    ["price_photo", "photo", "Photo"], ["price_video", "video", "Video"],
    ["price_event", "event", "Sự kiện"], ["price_brandvideo", "brandvideo", "Video NH"],
    ["price_live", "live", "Livestream"],
  ];
  // 1.0.12 (Mục C6): 5 cột chữ thuần bật/tắt được — [colkey, header] (giá trị đọc thẳng x[colkey])
  const BK_TEXT_COLS = [
    ["creatorType", "Creator type"], ["representation", "Đại diện / quản lý"],
    ["contactChannel", "Kênh liên hệ"], ["email", "Email"], ["fileRef", "File tham chiếu"],
  ];
  function drawBookingTable() {
    const theadEl = $("#booking-table thead");
    const tbody = $("#booking-table tbody");
    if (!theadEl || !tbody) return;
    const tableEl = theadEl.parentElement;
    const isKol = bookingUi.type === "kol";
    const cols = bkVisibleCols();
    const show = (c) => cols.includes(c);
    const reachLabel = isKol ? "Follower" : "Members";
    // 1.0.5: KOL dùng header 2 tầng — nhóm "Nền tảng" gồm 4 cột con follower.
    const platCols = isKol ? PLATFORM_COL_KEYS.filter((k) => show("ft_" + k)) : [];
    const twoTier = platCols.length > 0;
    const rs = twoTier ? ` rowspan="2"` : "";
    // colKeys: thứ tự cột thật (cho <colgroup> + đếm colspan). Đẩy song song với head.
    const colKeys = ["chk", "name"];
    // 1.0.12 (Mục G13): checkbox "chọn tất cả" ngay trên header cột đầu (kiểu Ads Manager)
    let head = `<tr><th class="chk-cell"${rs}><input type="checkbox" id="bk-check-all" title="Chọn tất cả dòng đang hiện" ${can("shortlist") ? "" : "disabled"} /></th><th data-sort="name" data-colkey="name" class="col-name"${rs}>${isKol ? "KOL / KOC" : "Group / Page"}</th>`;
    if (isKol && show("tier")) { head += `<th data-sort="tier" data-colkey="tier" class="center"${rs}>Tier</th>`; colKeys.push("tier"); }
    if (twoTier) { head += `<th class="group-head" colspan="${platCols.length}">Nền tảng</th>`; platCols.forEach((k) => colKeys.push("ft_" + k)); }
    else if (!isKol) { head += `<th data-sort="platform" data-colkey="platform"${rs}>Nền tảng</th>`; colKeys.push("platform"); }
    if (show("niche")) { head += `<th data-sort="niche" data-colkey="niche" class="center"${rs}>Ngành hàng</th>`; colKeys.push("niche"); }
    if (isKol && show("niche2")) { head += `<th data-sort="niche2" data-colkey="niche2" class="center"${rs}>Ngành hàng phụ</th>`; colKeys.push("niche2"); }
    if (isKol && show("gender")) { head += `<th data-sort="gender" data-colkey="gender" class="center"${rs}>Giới tính</th>`; colKeys.push("gender"); }
    if (show("region")) { head += `<th data-sort="region" data-colkey="region" class="center"${rs}>Khu vực</th>`; colKeys.push("region"); }
    if (show("reach") && !isKol) { head += `<th data-sort="reach" data-colkey="reach" class="right"${rs}>${reachLabel}</th>`; colKeys.push("reach"); }
    // 1.0.12 (Mục E9): cột work_history bị bỏ hẳn — trùng cột "Lịch sử làm việc" (verify) bên dưới
    if (show("price")) { head += `<th data-sort="price" data-colkey="price" class="right"${rs}>Giá ước tính</th>`; colKeys.push("price"); }
    if (isKol) PRICE_COL_META.forEach(([ck, , label]) => { if (show(ck)) { head += `<th data-sort="${ck}" data-colkey="${ck}" class="right"${rs}>${label}</th>`; colKeys.push(ck); } });
    if (show("contact")) { head += `<th data-colkey="contact"${rs}>${isKol ? "Liên hệ" : "Admin / liên hệ"}</th>`; colKeys.push("contact"); }
    // 1.0.12 (Mục C6): 5 cột text mới bật/tắt từ panel Tuỳ chọn cột
    BK_TEXT_COLS.forEach(([ck, label]) => { if (show(ck)) { head += `<th data-sort="${ck}" data-colkey="${ck}"${rs}>${esc(label)}</th>`; colKeys.push(ck); } });
    // 1.0.12 (Mục E10): "Xác minh" → "Lịch sử làm việc" (giá trị vẫn là 7 trạng thái quan hệ)
    if (isKol && show("activeStatus")) { head += bkHeadActive(rs); colKeys.push("activeStatus"); }
    if (isKol && show("dq")) { head += bkHeadDq(rs); colKeys.push("dq"); }
    if (isKol && show("audience")) { head += bkHeadAudience(rs); colKeys.push("audience"); }
    if (show("verify")) { head += `<th data-sort="verify" data-colkey="verify" class="center"${rs}>Lịch sử làm việc</th>`; colKeys.push("verify"); }
    if (show("actions")) { head += `<th${rs}></th>`; colKeys.push("actions"); }
    head += `</tr>`;
    if (twoTier) {
      head += `<tr>` + platCols.map((k) => {
        const pl = PLATFORMS[k] || { label: k, icon: "" };
        return `<th class="sub-head" data-sort="ft_${k}" data-colkey="ft_${k}"><span class="sub-head-in pf-${k}" title="${esc(pl.label)}" aria-label="${esc(pl.label)}">${pl.icon}</span></th>`;
      }).join("") + `</tr>`;
    }
    theadEl.innerHTML = head;
    // 1.0.7 (item 8): colgroup + table-layout:fixed → kéo mọi cột hẹp hơn nội dung
    const savedW = loadColWidths();
    let cg = tableEl.querySelector("colgroup");
    if (!cg) { cg = document.createElement("colgroup"); tableEl.insertBefore(cg, tableEl.firstChild); }
    // R3: savedW[k] lưu dạng "360px" → phải parseFloat, nếu không thành "360pxpx" (style hỏng, mất width đã kéo)
    // 1.0.12 (Mục D8): BỎ auto-fit co cột của 1.0.10 — cột giữ đúng bề rộng đã kéo,
    // tràn khung thì .table-wrap{overflow-x:auto} cho kéo ngang như trước.
    const colW = colKeys.map((k) => parseFloat(savedW[k]) || BK_COL_W[k] || 100);
    cg.innerHTML = colKeys.map((k, i) => `<col data-colkey="${k}" style="width:${colW[i]}px">`).join("");
    // 1.0.13 (Mục C2): CSS ghim cột tên KOL cần biết bề ngang THẬT của cột checkbox (người dùng kéo được)
    tableEl.style.setProperty("--bk-c1", colW[0] + "px");
    const gh = theadEl.querySelector(".group-head");
    tableEl.style.setProperty("--thead-r1", (gh ? gh.offsetHeight : 40) + "px");
    const colCount = colKeys.length;

    // Lọc + sắp xếp chạy trên TOÀN BỘ dữ liệu, phân trang chỉ cắt phần hiển thị
    const all = sortedBookingRows(filteredBookingRows());
    const total = all.length;
    const size = bookingUi.pageSize === "all" ? total || 1 : Number(bookingUi.pageSize) || 25;
    const pageCount = Math.max(1, Math.ceil(total / size));
    if (bookingUi.page > pageCount) bookingUi.page = pageCount;
    if (bookingUi.page < 1) bookingUi.page = 1;
    const start = (bookingUi.page - 1) * size;
    const rows = all.slice(start, start + size);
    bkPageIds = rows.map((r) => r.id); // 1.0.12 (Mục G): "chọn tất cả" chỉ tác động các dòng ĐANG hiện
    drawBookingPager(total, start, rows.length, pageCount);
    drawBreakdownBar(all);
    drawDqBar(all);
    drawTableSummary(all);
    drawFilterCount(total, (isKol ? state.kolDb : state.communityDb || []).length);

    // 1.0.11 (Mục B6): rỗng vì lọc quá tay → cho nút xoá lọc ngay tại chỗ thay vì bắt tự mò lên trên
    if (!rows.length) {
      tbody.innerHTML = `<tr class="bk-empty-row"><td colspan="${colCount}"><div class="bk-empty">
        <div class="big">${icon("search", 34)}</div>
        <div class="bk-empty-title">Không tìm thấy KOL phù hợp</div>
        <div class="bk-empty-sub">Thử nới bộ lọc hoặc xoá hết để xem lại toàn bộ danh sách.</div>
        ${bkFilterActive() ? `<button class="btn btn-primary btn-sm" data-action="bk-clear-filters" type="button">Xóa bộ lọc</button>` : ""}
      </div></td></tr>`;
      bindBookingTableSortResize($("#booking-table"));
      bkSyncCheckAll(); // 1.0.12 (Mục G)
      return;
    }
    const sl = getShortlist();
    tbody.innerHTML = rows.map((x) => {
      const checked = (isKol ? sl.kol : sl.community).includes(x.id);
      const chkDisabled = !can("shortlist");
      const reach = isKol ? x.followers : x.membersFollowers;
      const kind = isKol ? "kol" : "community";
      const contactVal = isKol ? x.contact : x.adminContact;
      let tds = `<td class="chk-cell"><input type="checkbox" data-shortlist-type="${kind}" data-id="${x.id}" ${checked ? "checked" : ""} ${chkDisabled ? "disabled" : ""} /></td>`;
      tds += `<td class="col-name">${isKol ? bookingUserCell(x) : bookingGroupCell(x)}</td>`;
      if (isKol && show("tier")) tds += `<td class="center">${tierCell(x)}</td>`; // 1.0.12: tier tắt được
      if (twoTier) tds += platCols.map((k) => `<td class="plat-cell">${platFollowerCell(x, k)}</td>`).join("");
      else if (!isKol) tds += `<td>${platformCell(x.platform)}</td>`;
      if (show("niche")) { const v = (isKol ? x.niche : x.topic) || "—"; tds += `<td class="center" title="${esc(v)}">${esc(v)}</td>`; }
      if (isKol && show("niche2")) { const v = x.niche2 || "—"; tds += `<td class="center" title="${esc(v)}">${esc(v)}</td>`; }
      if (isKol && show("gender")) tds += `<td class="center" title="${esc(x.gender || "—")}">${esc(x.gender || "—")}</td>`;
      if (show("region")) { const v = normRegion(x.region) || "—"; tds += `<td class="center" title="${esc(v)}">${esc(v)}</td>`; }
      if (show("reach") && !isKol) tds += `<td class="right mono">${bookingTableNumber(reach, false)}</td>`;
      // 1.0.12 (Mục E9): cột work_history đã bỏ hẳn khỏi bảng
      if (show("price")) tds += `<td class="right">${priceCell(x, true)}</td>`;
      // 1.0.7 (item 12): 5 cột giá format, căn phải, TBU/— khi thiếu
      if (isKol) PRICE_COL_META.forEach(([ck, key]) => { if (show(ck)) tds += `<td class="right mono" title="${esc(((x.priceByFormat || {})[key] || {}).raw || "")}">${fmtPrice(x, key)}</td>`; });
      if (show("contact")) {
        tds += `<td class="cell-contact">${can("private")
          ? contactCell(x, contactVal)
          : `<span class="masked" title="Chỉ Admin/Planner xem được">•••• ••••</span>`}</td>`;
      }
      // 1.0.12 (Mục C6): 5 cột chữ mới — đọc thẳng field, thiếu thì "—"
      BK_TEXT_COLS.forEach(([ck]) => { if (show(ck)) { const v = x[ck] || "—"; tds += `<td class="trunc" title="${esc(v)}">${esc(v)}</td>`; } });
      if (isKol && show("activeStatus")) tds += bkCellActive(x);
      if (isKol && show("dq")) tds += bkCellDq(x);
      if (isKol && show("audience")) tds += bkCellAudience(x);
      if (show("verify")) tds += `<td class="center">${relPill(x.verifyStatus)}</td>`; // 1.0.11 (Mục B3)
      if (show("actions")) tds += `<td class="right"><div class="row-actions">
          <button class="icon-btn btn-sm" data-action="view-booking" data-kind="${kind}" data-id="${x.id}" title="Xem chi tiết">${icon("eye")}</button>
          ${can("manage") ? `<button class="icon-btn btn-sm" data-action="edit-booking" data-kind="${kind}" data-id="${x.id}" title="Sửa">${icon("edit")}</button>` : ""}
          ${can("manage") && x.stage === "research" ? `<button class="icon-btn btn-sm" data-action="verify-booking" data-kind="${kind}" data-id="${x.id}" title="Duyệt / Verify">${icon("check")}</button>` : ""}
          ${can("delete") ? `<button class="icon-btn btn-sm" data-action="del-booking" data-kind="${kind}" data-id="${x.id}" title="Xóa">${icon("trash")}</button>` : ""}
        </div></td>`;
      return `<tr>${tds}</tr>`;
    }).join("");
    bindBookingTableSortResize($("#booking-table"));
    bkSyncCheckAll(); // 1.0.12 (Mục G)
    scheduleScrollHints(); // 1.0.13 (Mục B1/B3): bảng vừa vẽ lại → tính lại hint kéo ngang
  }

  /* 1.0.12 (Mục G13/G14) — "Chọn tất cả" trên header cột checkbox (kiểu Ads Manager):
     tick = chọn hết dòng ĐANG hiện (theo bộ lọc + trang hiện tại), bỏ tick = bỏ hết;
     chọn một phần → indeterminate. Số đã chọn hiện cạnh phân trang kèm nút "Bỏ chọn". */
  let bkPageIds = [];
  function bkSyncCheckAll() {
    const kind = bookingUi.type === "kol" ? "kol" : "community";
    const picked = cart[kind] || [];
    const onPage = bkPageIds.filter((id) => picked.includes(id)).length;
    const box = $("#bk-check-all");
    if (box) {
      box.checked = bkPageIds.length > 0 && onPage === bkPageIds.length;
      box.indeterminate = onPage > 0 && onPage < bkPageIds.length;
      box.onclick = () => {
        if (!can("shortlist")) return;
        const on = box.checked;
        bkPageIds.forEach((id) => {
          const i = picked.indexOf(id);
          if (on && i === -1) picked.push(id);
          if (!on && i !== -1) picked.splice(i, 1);
        });
        saveCart(); // → updateCartUI(): checkbox từng dòng + badge + thanh tổng
        drawFlowStepper();
        if ($("#shortlist-page-body")) drawShortlistPageBody();
        toast(on ? "Đã chọn tất cả dòng đang hiện" : "Đã bỏ chọn dòng đang hiện", "Giỏ hàng: " + cartCount() + " mục.", "success");
      };
    }
    const el = $("#bk-selected-count");
    if (el) {
      el.innerHTML = picked.length
        ? `Đã chọn <b>${fmtNum(picked.length)}</b> <button class="bk-unselect" data-action="bk-unselect-all" type="button">Bỏ chọn</button>`
        : "";
    }
  }

  /* ---------- Giỏ hàng Booking ---------- */
  // 1.0.2: GIỎ HÀNG toàn cục — thay thế shortlist gắn campaign cũ.
  // Giỏ lưu riêng localStorage, không mất khi đổi trang/campaign.
  const CART_KEY = "mkios_cart_v102";
  // 1.0.16: tên báo giá gõ ở Checkout — nhớ lại để lần sau điền sẵn
  const QUOTE_NAME_KEY = "mkios_last_quote_name";
  function loadQuoteName() { try { return localStorage.getItem(QUOTE_NAME_KEY) || ""; } catch (e) { return ""; } }
  function saveQuoteName(v) { try { localStorage.setItem(QUOTE_NAME_KEY, v); } catch (e) {} }
  function nowStamp() {
    const d = new Date(), p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
  let cart = loadCart();
  function loadCart() {
    try { return JSON.parse(localStorage.getItem(CART_KEY) || "{\"kol\":[],\"community\":[]}"); }
    catch (e) { return { kol: [], community: [] }; }
  }
  function saveCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
    updateCartUI();
  }
  function cartCount() { return cart.kol.length + cart.community.length; }
  function cartHas(id) { return cart.kol.includes(id) || cart.community.includes(id); }
  function cartItems() {
    const kol = cart.kol.map((id) => state.kolDb.find((x) => x.id === id)).filter(Boolean);
    const comm = cart.community.map((id) => state.communityDb.find((x) => x.id === id)).filter(Boolean);
    return { kol, comm };
  }
  function cartTotals() {
    const { kol, comm } = cartItems();
    const totalBudget = kol.reduce((s, x) => s + (x.estimatedPrice || 0), 0) + comm.reduce((s, x) => s + (x.estimatedPrice || 0), 0);
    const totalReach = kol.reduce((s, x) => s + (x.followers || 0), 0) + comm.reduce((s, x) => s + (x.membersFollowers || 0), 0);
    return { kol, comm, totalBudget, totalReach, count: kol.length + comm.length };
  }
  // R4: `silent` để AI thêm nhiều KOL một lượt chỉ hiện MỘT toast tổng (thay vì n toast).
  function toggleCart(kind, id, checked, silent) {
    if (!can("shortlist")) return;
    const arr = cart[kind];
    const idx = arr.indexOf(id);
    if (checked && idx === -1) arr.push(id);
    if (!checked && idx !== -1) arr.splice(idx, 1);
    saveCart(); // → updateCartUI(): badge + checkbox + thanh tổng + drawer
    drawFlowStepper();
    if ($("#shortlist-page-body")) drawShortlistPageBody();
    if (!silent) toast(checked ? "Đã thêm vào giỏ hàng Booking" : "Đã bỏ khỏi giỏ hàng Booking", checked ? "Kiểm tra giỏ hàng góc phải dưới." : "", "success");
  }
  /* R4 (mục 8): badge nhảy khi giỏ đổi — dùng khi AI tự thêm để đại ca thấy ngay là THẬT. */
  function cartBadgePulse(n, fromAi) {
    const fab = $("#cart-fab");
    if (fab) {
      fab.classList.remove("cart-bump");
      void fab.offsetWidth; // reflow để chạy lại keyframe
      fab.classList.add("cart-bump");
      setTimeout(() => fab.classList.remove("cart-bump"), 700);
    }
    if (fromAi) toast("AI đã thêm " + n + " KOL vào giỏ", "Giỏ hàng hiện có " + cartCount() + " mục — bấm nút giỏ để xem.", "success");
  }

  // 1.0.7 (item 4): shortlist là GLOBAL — không còn khoá theo campaign demo
  function shortlistKey() { return "_no_campaign"; }
  function getShortlist() {
    // 1.0.2: giỏ hàng thay shortlist — trả về cart để mọi UI cũ chạy tiếp
    return cart;
  }
  function toggleShortlistItem(kind, id, checked) { toggleCart(kind, id, checked); }
  function computeShortlistTotals() { return cartTotals(); }
  function clearCart() { cart = { kol: [], community: [] }; saveCart(); }

  /* ---------- 1.0.4: kéo nút giỏ hàng lên/xuống dọc mép phải ----------
     Chỉ đổi trục dọc (giữ nút luôn dính mép phải), kẹp trong viewport và nhớ vị trí. */
  const CART_FAB_TOP_KEY = "mkios_cart_fab_top_v104";
  function clampFabTop(top, fab) {
    const h = fab.offsetHeight || 58;
    return Math.max(8, Math.min(top, window.innerHeight - h - 8));
  }
  function setFabTop(fab, top) {
    fab.style.top = clampFabTop(top, fab) + "px";
    fab.style.bottom = "auto";
  }
  function makeCartFabDraggable(fab) {
    let startY = 0, startTop = 0, moved = false, dragging = false;
    const pt = (e) => (e.touches && e.touches[0] ? e.touches[0] : e);
    const onMove = (e) => {
      if (!dragging) return;
      const y = pt(e).clientY;
      if (!moved && Math.abs(y - startY) <= 4) return; // rung tay khi bấm ≠ kéo
      moved = true;
      if (e.cancelable) e.preventDefault();
      setFabTop(fab, startTop + (y - startY));
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      fab.classList.remove("dragging");
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
      if (moved) {
        fab.dataset.dragged = "1"; // click ngay sau khi kéo không mở drawer
        try { localStorage.setItem(CART_FAB_TOP_KEY, String(parseFloat(fab.style.top) || 0)); } catch (e) {}
      }
    };
    const onDown = (e) => {
      if (e.button != null && e.button !== 0) return;
      dragging = true; moved = false;
      startY = pt(e).clientY;
      startTop = fab.getBoundingClientRect().top;
      fab.classList.add("dragging");
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onUp);
    };
    fab.addEventListener("mousedown", onDown);
    fab.addEventListener("touchstart", onDown, { passive: true });
    window.addEventListener("resize", () => { if (fab.style.top) setFabTop(fab, parseFloat(fab.style.top)); });
    const saved = parseFloat(localStorage.getItem(CART_FAB_TOP_KEY));
    if (isFinite(saved)) setFabTop(fab, saved); // chưa kéo lần nào → giữ mặc định góc dưới phải
  }

  // ---------- UI giỏ hàng: nút dính góc + drawer ----------
  function renderCartFab() {
    let fab = $("#cart-fab");
    if (!fab) {
      fab = document.createElement("button");
      fab.id = "cart-fab";
      fab.className = "cart-fab";
      fab.title = "Giỏ hàng Booking (KOL/KOC/Community) — kéo lên/xuống để đổi chỗ";
      fab.innerHTML = `<span class="cart-fab-ico">${icon("cart", 24)}</span><span class="cart-badge" id="cart-badge">0</span>`;
      document.body.appendChild(fab);
      fab.addEventListener("click", () => {
        if (fab.dataset.dragged) { delete fab.dataset.dragged; return; }
        toggleCartDrawer();
      });
      makeCartFabDraggable(fab);
    }
    let drawer = $("#cart-drawer");
    if (!drawer) {
      drawer = document.createElement("div");
      drawer.id = "cart-drawer";
      drawer.className = "cart-drawer";
      drawer.innerHTML = `<div class="cart-drawer-head"><span class="cart-drawer-ico">${icon("cart", 18)}</span><h3>Giỏ hàng Booking</h3><button class="icon-btn cart-drawer-x" id="cart-close" title="Đóng">${icon("close", 16)}</button></div>
        <div class="cart-drawer-body" id="cart-drawer-body"></div>
        <div class="cart-drawer-foot" id="cart-drawer-foot"></div>`;
      document.body.appendChild(drawer);
      $("#cart-close").addEventListener("click", closeCartDrawer);
    }
    updateCartUI();
  }
  // 1.0.3: một điểm cập nhật duy nhất cho badge + drawer + thanh tổng + checkbox bảng.
  // Gọi được từ mọi nơi (toggle bảng, xóa trong drawer, checkout, clear) → luôn đồng bộ ngay.
  function updateCartUI() {
    const badge = $("#cart-badge");
    if (badge) {
      const n = cartCount();
      badge.textContent = n;
      badge.style.display = n ? "" : "none";
      const fab = $("#cart-fab"); // bug 1.0.2: thiếu khai báo → ReferenceError trong strict mode
      if (fab) fab.classList.toggle("has-items", !!n);
    }
    // Checkbox trong bảng phản chiếu đúng giỏ
    $$("input[data-shortlist-type]").forEach((chk) => {
      chk.checked = (cart[chk.dataset.shortlistType] || []).includes(chk.dataset.id);
    });
    bkSyncCheckAll(); // 1.0.12 (Mục G): header "chọn tất cả" + "Đã chọn X" bám theo giỏ
    drawShortlistBar();
    // 1.0.6: Tổng quan đang mở → KPI giỏ hàng + bảng giỏ cập nhật ngay (real-time)
    redrawDashboardIfVisible();
    const body = $("#cart-drawer-body");
    if (body && body.closest(".cart-drawer").classList.contains("open")) drawCartDrawer();
  }
  function toggleCartDrawer() {
    const d = $("#cart-drawer");
    if (!d) return;
    const open = d.classList.toggle("open");
    document.body.classList.toggle("cart-open", open);
    if (open) drawCartDrawer();
  }
  function closeCartDrawer() {
    const d = $("#cart-drawer");
    if (d) { d.classList.remove("open"); document.body.classList.remove("cart-open"); }
  }
  function drawCartDrawer() {
    const body = $("#cart-drawer-body");
    if (!body) return;
    const t = cartTotals();
    const row = (kind, x) => {
      const reach = kind === "kol" ? x.followers : x.membersFollowers;
      const name = kind === "kol" ? x.name : x.name;
      const sub = kind === "kol" ? (x.handle || "") : (x.link ? x.link.replace(/^https?:\/\//, "") : "");
      const pl = PLATFORMS[x.platform] || { icon: "🔗", label: x.platform };
      // R4 (mục 8): avatar màu theo nền tảng (giống bảng CSDL) + handle + giá format VND
      return `<div class="cart-item">
        <span class="avatar cart-item-av ${avatarClass(x)}">${esc(initials(name))}</span>
        <div class="cart-item-main">
          <strong>${esc(name)}</strong>
          <small class="muted"><span class="cart-item-pl">${pl.icon}</span> ${esc(sub || "—")} · ${fmtFollowers(reach || 0)}</small>
        </div>
        <div class="cart-item-price mono">${can("private") ? fmtVND(x.estimatedPrice) : "🔒"}</div>
        <button class="icon-btn btn-sm cart-item-x" data-cart-remove="${kind}" data-id="${x.id}" title="Bỏ khỏi giỏ">${icon("close", 14)}</button>
      </div>`;
    };
    if (!t.count) {
      body.innerHTML = `<div class="cart-empty">${icon("cart", 40)}<div>Giỏ hàng Booking đang trống</div><small class="muted">Tick ô đầu mỗi dòng trong bảng KOL/Community — hoặc nhờ Markus AI “tìm KOL … và thêm vào giỏ”.</small></div>`;
      $("#cart-drawer-foot").innerHTML = "";
      return;
    }
    body.innerHTML = `
      <div class="cart-group-label">KOL / KOC (${t.kol.length})</div>
      ${t.kol.length ? t.kol.map((x) => row("kol", x)).join("") : `<div class="muted cart-group-empty">Chưa có</div>`}
      <div class="cart-group-label">Community / Page (${t.comm.length})</div>
      ${t.comm.length ? t.comm.map((x) => row("community", x)).join("") : `<div class="muted cart-group-empty">Chưa có</div>`}
    `;
    $("#cart-drawer-foot").innerHTML = `
      <div class="cart-totals">
        <div class="ct-cell"><b>${t.count}</b><small>mục</small></div>
        <div class="ct-cell"><b>${fmtFollowers(t.totalReach)}</b><small>tổng reach</small></div>
        <div class="ct-cell ct-money"><b>${can("private") ? fmtVND(t.totalBudget) : "🔒"}</b><small>tổng tiền ước tính</small></div>
      </div>
      <div class="cart-actions">
        ${can("export") ? `<button class="btn btn-primary btn-sm" data-action="cart-checkout">${icon("doc", 14)} Xuất báo giá</button>` : ""}
        <button class="btn btn-ghost btn-sm" data-action="cart-clear">${icon("trash", 14)} Xóa giỏ</button>
      </div>
    `;
  }

  // Thanh ngắn dưới bảng booking — phản chiếu giỏ hàng hiện tại
  function drawShortlistBar() {
    const wrap = $("#shortlist-bar-wrap");
    if (!wrap) return;
    const t = cartTotals();
    if (!t.count) {
      wrap.innerHTML = `<div class="shortlist-bar"><div class="sl-stat"><strong>0</strong><small>Giỏ hàng Booking trống — tick vào ô đầu mỗi dòng để thêm KOL/Community.</small></div></div>`;
      return;
    }
    wrap.innerHTML = `<div class="shortlist-bar">
      <div class="sl-stat"><strong>${t.count}</strong><small>Trong giỏ hàng Booking (${t.kol.length} KOL · ${t.comm.length} Community)</small></div>
      <div class="sl-stat"><strong>${fmtNum(t.totalReach)}</strong><small>Tổng reach ước tính</small></div>
      <div class="sl-stat"><strong>${can("private") ? fmtVND(t.totalBudget) : "🔒 Ẩn"}</strong><small>Tổng ngân sách ước tính</small></div>
      <div class="sl-actions">
        <button class="btn btn-ghost btn-sm" data-action="open-cart">🛒 Mở giỏ hàng Booking</button>
        ${can("export") ? `<button class="btn btn-primary btn-sm" data-action="cart-checkout">⭳ Xuất báo giá</button>` : ""}
      </div>
    </div>`;
  }

  /* ---------- Form thêm/sửa KOL/KOC trong Booking DB ---------- */
  // 1.0.9 (C1): Tier trên CREATOR_DB là chữ tự do (cột Tier) → dùng danh sách text, giữ giá trị lạ của sheet
  // 1.0.11 (Mục D1): Tier chuẩn SETTINGS gồm 5 bậc, bỏ "Mega" (sheet không dùng). tierOf() giữ nguyên
  // key nano/micro/macro/mega cho bộ lọc TIERS — đây chỉ là danh sách chữ hiển thị trong form.
  const TIER_TEXTS = ["Nano", "Micro", "Mid-Tier", "Macro", "Celeb"];
  const GENDERS = CASTING_PROFILES; // 1.0.11 (Mục D3): giữ name="gender", đổi list sang Casting_Profile
  const PF_FKEY = { tiktok: "fTiktok", facebook: "fFacebook", instagram: "fInstagram", youtube: "fYoutube" };
  const PRICE_FKEY = { photo: "pPhoto", video: "pVideo", event: "pEvent", brandvideo: "pBrandvideo", live: "pLive" };
  // Option text thuần: giữ luôn giá trị hiện tại nếu sheet ghi khác danh sách (không âm thầm đổi data)
  function txtOpts(list, cur, emptyLabel) {
    const c = String(cur == null ? "" : cur).trim();
    const all = c && !list.some((x) => x.toLowerCase() === c.toLowerCase()) ? list.concat([c]) : list;
    return (emptyLabel ? `<option value="">${esc(emptyLabel)}</option>` : "")
      + all.map((v) => `<option ${v.toLowerCase() === c.toLowerCase() ? "selected" : ""}>${esc(v)}</option>`).join("");
  }
  const pfFollowers = (k, p) => ((k.platStats || {})[p] || {}).followers || k[PF_FKEY[p]] || 0;
  const pfLink = (k, p) => (k.socialLinks || {})[p] || "";
  const pfPrice = (k, key) => ((k.priceByFormat || {})[key] || {}).amount || k[PRICE_FKEY[key]] || 0;

  function kolDbForm(k) {
    k = k || {};
    return `${k.id ? "" : aiFillBox()}<div class="form-grid">
      <div class="form-sec">📋 Thông tin cơ bản</div>
      <div class="form-field">${k.id ? `<label>Tên do Google Sheet quản lý - chỉ đọc</label><input name="name" required readonly aria-readonly="true" data-sheet-owned="1" value="${esc(k.name || "")}" />` : `<label>Tên creator *</label><input name="name" required value="${esc(k.name || "")}" placeholder="VD: Bùi Thanh Trúc" />`}</div>
      <div class="form-field"><label>@handle *</label><input name="handle" required value="${esc(k.handle || "")}" placeholder="@handle" /></div>
      <div class="form-field"><label>Nền tảng chính</label><select name="platform">${optionList(PLATFORMS, k.platform || "tiktok")}</select></div>
      <div class="form-field"><label>Tier <small class="muted">(tự tính theo follower, sửa được)</small></label><select name="tier" data-tier-auto="${k.tier ? "0" : "1"}">${txtOpts(TIER_TEXTS, k.tier, "— Tự động —")}</select></div>
      <div class="form-field"><label>Ngành hàng</label><select name="niche">${txtOpts(BOOKING_NICHES, k.niche, k.id && !String(k.niche || "").trim() ? "— Chưa rõ —" : "")}</select></div>
      <div class="form-field"><label>Ngành hàng phụ</label><select name="niche2">${txtOpts(BOOKING_NICHES, k.niche2, "— Không có —")}</select></div>
      <div class="form-field"><label>Casting profile</label><select name="gender">${txtOpts(GENDERS, k.gender, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Khu vực</label><select name="region">${txtOpts(BASE_LOCATIONS, k.region, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Định dạng nội dung</label><select name="format">${KOL_FORMATS.map((f) => `<option ${f === k.format ? "selected" : ""}>${f}</option>`).join("")}</select></div>
      <div class="form-field"><label>Số follower (nền tảng chính)</label><input name="followers" type="number" min="0" value="${k.followers || 0}" /></div>

      <div class="form-sec">📱 Nền tảng &amp; Follower</div>
      ${PLATFORM_COL_KEYS.map((p) => `<div class="form-pair">
        <div class="form-field"><label>${PLATFORMS[p].label} — link kênh</label><input name="link_${p}" data-plat-link="${p}" value="${esc(pfLink(k, p))}" placeholder="https://…" /></div>
        <div class="form-field"><label>Follower</label><input name="f_${p}" type="number" min="0" value="${pfFollowers(k, p)}" /></div>
      </div>`).join("")}

      <div class="form-sec">💰 Bảng giá</div>
      <div class="form-field full"><label>Giá ước tính / giá chốt (₫)</label><input name="estimatedPrice" type="number" min="0" step="500000" value="${k.estimatedPrice || 0}" /></div>
      <div class="form-price">${PRICE_COL_META.map(([, key, label]) => `<div class="form-field"><label>${esc(label)} (₫)</label><input name="price_${key}" type="number" min="0" step="500000" value="${pfPrice(k, key)}" /></div>`).join("")}</div>

      <div class="form-sec">📞 Liên hệ &amp; Ghi chú</div>
      <div class="form-field"><label>Email</label><input name="email" type="email" value="${esc(k.email || "")}" placeholder="creator@email.com" /></div>
      <div class="form-field"><label>Liên hệ</label><input name="contact" value="${esc(k.contact || "")}" placeholder="SĐT / Zalo / người đại diện" /></div>
      <!-- 1.0.11 (Mục D10): "Lịch sử hợp tác" là ô chữ tự do → đổi thành dropdown 7 trạng thái
           chuẩn sheet; phần campaign chi tiết chuyển sang ô ghi chú phụ. -->
      <div class="form-field"><label>Lịch sử hợp tác</label><select name="relationship">${txtOpts(RELATIONSHIP_LABELS, k.relationship || k.workHistory, "— Chưa liên hệ —")}</select></div>
      <div class="form-field"><label>Ghi chú hợp tác (campaign chi tiết)</label><input name="workNote" value="${esc(k.workNote || k.previousCampaign || "")}" placeholder="VD: L'Oréal — mùa hè 2026" /></div>
      <div class="form-field full"><label>Đánh giá / ghi chú hiệu quả</label><textarea name="performance">${esc(k.performance || "")}</textarea></div>

      <div class="form-sec">⚙️ Nguồn &amp; Xác minh</div>
      <div class="form-field"><label>Nguồn</label><select name="stage">${optionList(STAGES, k.stage || "research")}</select></div>
      <div class="form-field"><label>Trạng thái quan hệ</label><select name="verifyStatus">${optionList(VERIFY_STATUS, normVerify(k.verifyStatus))}</select></div>
      ${bkActiveField(k)}
      ${bkAudienceField(k)}
      <!-- 1.0.11 (Mục D7/D8/D9): 3 cột SETTINGS còn thiếu -->
      <div class="form-field"><label>Creator type</label><select name="creatorType">${txtOpts(CREATOR_TYPES, k.creatorType, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Đại diện / quản lý</label><select name="representation">${txtOpts(REPRESENTATIONS, k.representation, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Kênh liên hệ</label><select name="contactChannel">${txtOpts(CONTACT_CHANNELS, k.contactChannel, "— Chưa rõ —")}</select></div>
      <!-- 1.0.11 (Mục D12): 4 trường vận hành — chỉ lưu localStorage, sheet chưa có cột nên không đẩy lên -->
      <div class="form-field"><label>Tình trạng hợp đồng</label><select name="contractStatus">${txtOpts(CONTRACT_STATUS, k.contractStatus, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Tình trạng thanh toán</label><select name="paymentStatus">${txtOpts(PAYMENT_STATUS_TXT, k.paymentStatus, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Hợp tác lại?</label><select name="recommendAgain">${txtOpts(RECOMMEND_AGAIN, k.recommendAgain, "— Chưa đánh giá —")}</select></div>
      <div class="form-field"><label>Mức độ sự cố</label><select name="issueLevel">${txtOpts(ISSUE_LEVELS, k.issueLevel, "— Chưa rõ —")}</select></div>
      <div class="form-field full"><label>File tham chiếu (link, chỉ lưu đường dẫn)</label><input name="fileRef" value="${esc(k.fileRef || "")}" placeholder="Link brief / research doc" /></div>
    </div>`;
  }
  function createCreatorOnSheet(rec, patch) {
    const updates = { Creator_Name: rec.name };
    Object.keys(patch).forEach((k) => { if (k !== "name" && CREATOR_SHEET_MAP[k] && String(patch[k] == null ? "" : patch[k]) !== "") updates[CREATOR_SHEET_MAP[k]] = String(patch[k]); });
    const undo = (why) => { state.kolDb = state.kolDb.filter((x) => x !== rec); save(); redrawBookingIfVisible(); toast("Chưa tạo được creator trên Sheet", why + ". Creator này CHƯA được lưu.", "danger"); return false; };
    return apiFetch(WRITE_BACK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: rec.name, updates, create: true, createOnly: true }) })
      .then((res) => res.json().catch(() => null))
      .then((j) => {
        if (!j || !j.ok) return undo((j && j.error) || "Sheet từ chối ghi");
        return syncCreatorDb(true).then(() => {
          const ext = Object.assign({}, patch); delete ext.name;
          creatorEdits[rec.name] = Object.assign({}, creatorEdits[rec.name], ext);
          saveCreatorEdits(); applyCreatorEdits(); redrawBookingIfVisible();
          return true;
        });
      }, (e) => undo(String((e && e.message) || e)));
  }
  function saveKolDb(data, id) {
    // 1.0.9 (C1): data có thể đến từ bảng preview AI (thiếu ô) → không .trim() thẳng trên undefined
    const str = (v) => String(v == null ? "" : v).trim();
    const num = (v) => Number(String(v == null ? "" : v).replace(/[^\d.-]/g, "")) || 0;
    const patch = {
      name: str(data.name), handle: str(data.handle), platform: data.platform || "tiktok",
      niche: data.niche, region: data.region, format: data.format,
      followers: num(data.followers), estimatedPrice: num(data.estimatedPrice),
      contact: str(data.contact), performance: str(data.performance),
      stage: data.stage || "research", verifyStatus: normVerify(data.verifyStatus), fileRef: str(data.fileRef), // 1.0.11
    };
    // 1.0.11: form KOL không còn ô previousCampaign → chỉ ghi khi form thật sự gửi lên (giữ data cũ)
    if (data.previousCampaign !== undefined) patch.previousCampaign = str(data.previousCampaign);
    // 1.0.11 (Mục D10): dropdown quan hệ + ghi chú campaign; cột "Lịch sử làm việc" đọc workHistory
    if (data.relationship !== undefined) { patch.relationship = str(data.relationship); patch.workHistory = patch.relationship; }
    if (data.workNote !== undefined) patch.workNote = str(data.workNote);
    // 1.0.11 (Mục D7/D8/D9/D12): field mới — lưu nguyên văn, không đụng map write-back sheet
    ["creatorType", "representation", "contactChannel", "contractStatus", "paymentStatus", "recommendAgain", "issueLevel"]
      .forEach((f) => { if (data[f] !== undefined) patch[f] = str(data[f]); });
    if (data.niche2 !== undefined) patch.niche2 = str(data.niche2);
    if (data.gender !== undefined) patch.gender = str(data.gender);
    if (data.email !== undefined) patch.email = str(data.email);
    if (data.activeStatus !== undefined) patch.activeStatus = BR.normActive(data.activeStatus);
    if (data.audience !== undefined) patch.audience = BR.normAudience(data.audience);
    // Tier: để trống = tự suy theo follower (giữ đúng chữ Tier của sheet khi người dùng chọn tay)
    patch.tier = str(data.tier) || ((id && !str(((state.kolDb.find((x) => x.id === id)) || {}).tier)) ? "" : (TIERS[tierOf(patch.followers)] || {}).label || "");
    // 1.0.9 (C1): 4 link + follower riêng → cùng cấu trúc socialLinks/platStats mà bảng đang đọc
    if (PLATFORM_COL_KEYS.some((p) => data["link_" + p] !== undefined || data["f_" + p] !== undefined)) {
      const socialLinks = {}, platStats = {};
      PLATFORM_COL_KEYS.forEach((p) => {
        const url = str(data["link_" + p]);
        const f = num(data["f_" + p]);
        socialLinks[p] = url;
        platStats[p] = { followers: f, url };
        patch[PF_FKEY[p]] = f;
      });
      patch.socialLinks = socialLinks;
      patch.platStats = platStats;
      if (!patch.followers) patch.followers = platStats[patch.platform] ? platStats[patch.platform].followers : 0;
    }
    if (PRICE_COL_META.some(([, key]) => data["price_" + key] !== undefined)) {
      const priceByFormat = {};
      PRICE_COL_META.forEach(([, key]) => {
        const amt = num(data["price_" + key]);
        priceByFormat[key] = { amount: amt, raw: amt ? String(amt) : "" };
        patch[PRICE_FKEY[key]] = amt;
      });
      patch.priceByFormat = priceByFormat;
      if (!patch.estimatedPrice) patch.estimatedPrice = Math.max(...PRICE_COL_META.map(([, key]) => priceByFormat[key].amount));
    }
    const old = id ? state.kolDb.find((x) => x.id === id) : null;
    if (old) {
      // 1.0.6: vá lên bản ghi cũ thay vì thay mới — giữ platStats/socialLinks lấy từ sheet,
      // đồng thời lưu cache + đẩy ngược lên CREATOR_DB.
      persistCreator(old, patch);
    } else {
      const nk = (s) => String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim();
      if (!nk(patch.name)) { toast("Thiếu tên creator", "Nhập tên creator trước khi lưu.", "danger"); return; }
      if (state.kolDb.some((x) => nk(x.name) === nk(patch.name))) { toast("Tên creator đã tồn tại", "Không tạo trùng. Hãy sửa creator có sẵn.", "danger"); return; }
      const created = Object.assign({ id: uid("kd") }, patch);
      state.kolDb.unshift(created);
      save();
      createCreatorOnSheet(created, patch);
    }
  }

  /* ============================================================
     1.0.3 — AI điền tự động form thêm KOL/KOC từ nội dung file
     Paste text (hoặc chọn file) → ai-parse.php → DeepSeek → fill form.
     ============================================================ */
  // File thật đang chọn qua 📎 — gửi FormData lên ai-parse.php (server tự bóc text)
  let aiFile = null;

  function aiFillBox() {
    aiFile = null; // popup mở lại → không dùng lại file của lần trước
    aiMultiRows = []; // 1.0.9 (C3): và không giữ danh sách KOL của lần đọc trước
    return `<div class="ai-fill">
      <div class="ai-fill-head">
        <strong>📄 Chọn file hoặc dán nội dung (CSV / Excel / PDF / TXT)</strong>
        <div class="ai-fill-actions">
          <input type="file" id="ai-file" accept=".csv,.txt,.tsv,.md,.json,.pdf,.xls,.xlsx" hidden />
          <button type="button" class="btn btn-ghost btn-sm" data-action="ai-pick-file">📎 Chọn file</button>
          <button type="button" class="btn btn-primary btn-sm" data-action="ai-fill">🤖 AI Điền tự động</button>
        </div>
      </div>
      <textarea id="ai-paste" rows="4" placeholder="Ctrl+V dán nội dung file (danh sách KOL, bảng giá, profile…) rồi bấm 🤖 AI Điền tự động."></textarea>
      <div class="ai-fill-url">
        <input type="url" id="ai-url" placeholder="Dán link Google Sheet / Docs / Slides (công khai) hoặc link website, bài báo…" />
        <button type="button" class="btn btn-ghost btn-sm" data-action="ai-fetch-url">🔗 Đọc link online</button>
      </div>
      <div id="ai-fill-status" class="ai-fill-status muted"></div>
      <div id="ai-multi" class="ai-multi" hidden></div>
    </div>`;
  }

  // Ước lượng số KOL trong text: đếm link kênh mạng xã hội khác nhau
  function countCreatorsInText(text) {
    const m = String(text).match(/(tiktok|instagram|facebook|youtube)\.com\/[^\s,;"']+/gi) || [];
    return new Set(m.map((s) => s.toLowerCase())).size;
  }

  function setFormValue(name, value) {
    if (value == null || value === "") return false;
    const el = document.querySelector(`#modal-form [name="${name}"]`);
    if (!el) return false;
    if (el.tagName === "SELECT") {
      const want = String(value).trim().toLowerCase();
      const opt = Array.from(el.options).find((o) =>
        o.value.toLowerCase() === want || o.textContent.trim().toLowerCase() === want);
      if (!opt) return false;
      el.value = opt.value;
      return true;
    }
    el.value = value;
    return true;
  }

  // 1.0.9 (C2): điền fields vào form — dùng chung cho AI đọc file/paste và AI đọc link online
  function applyAiFields(f) {
    let filled = 0;
    const priceNum = (v) => { const s = String(v == null ? "" : v).replace(/[.,\s]/g, ""); return /^\d+$/.test(s) ? s : ""; };
    const rows = [
      ["name", f.name], ["handle", f.handle], ["platform", f.platform],
      ["niche", f.category], ["niche2", f.niche2], ["gender", f.gender], ["tier", f.tier],
      ["followers", Number(f.followers) || ""],
      ["estimatedPrice", priceNum(f.price)],
      ["email", f.email],
      ["contact", [f.contact, f.phone].filter(Boolean).join(" · ")],
    ];
    const links = f.links || {};
    const LINK_ALIAS = { tiktok: "tiktok", facebook: "fb", instagram: "ig", youtube: "yt" };
    PLATFORM_COL_KEYS.forEach((p) => {
      const url = links[p] || links[LINK_ALIAS[p]] || "";
      rows.push(["link_" + p, url]);
      const fk = f["f_" + p] || (f.followers_by_platform || {})[p];
      if (fk) rows.push(["f_" + p, Number(fk) || ""]);
    });
    PRICE_COL_META.forEach(([, key]) => rows.push(["price_" + key, priceNum(f["p_" + key])]));
    rows.forEach(([k, v]) => { if (setFormValue(k, v)) filled++; });
    // Trạng thái chưa có ô riêng — ghi vào ghi chú để không mất dữ liệu
    const notes = [f.status && "Trạng thái: " + f.status, f.note].filter(Boolean);
    const perf = document.querySelector('#modal-form [name="performance"]');
    if (perf && notes.length && !perf.value.trim()) { perf.value = notes.join(" · "); filled++; }
    return filled;
  }

  /* 1.0.9 (C3): file/link nhiều KOL → bảng preview, tick dòng nào thì thêm dòng đó.
     Sửa trực tiếp 4 ô quan trọng (tên/handle/followers/giá) ngay trên bảng. */
  let aiMultiRows = [];
  function renderAiMulti(list) {
    const box = $("#ai-multi");
    if (!box) return;
    aiMultiRows = list.slice(0, 100);
    box.hidden = false;
    box.innerHTML = `<div class="ai-multi-head"><strong>🤖 AI đọc được ${aiMultiRows.length} KOL</strong>
        <button type="button" class="btn btn-primary btn-sm" data-action="ai-add-multi">➕ Thêm KOL đã chọn vào CSDL</button></div>
      <div class="ai-multi-scroll"><table class="ai-multi-table"><thead><tr>
        <th><input type="checkbox" id="ai-multi-all" checked /></th><th>Tên</th><th>@handle</th><th>Nền tảng</th><th>Follower</th><th>Giá (₫)</th>
      </tr></thead><tbody>${aiMultiRows.map((f, i) => `<tr>
        <td><input type="checkbox" class="ai-multi-chk" data-i="${i}" checked /></td>
        <td><input value="${esc(f.name || "")}" data-i="${i}" data-f="name" /></td>
        <td><input value="${esc(f.handle || "")}" data-i="${i}" data-f="handle" /></td>
        <td><input value="${esc(f.platform || "")}" data-i="${i}" data-f="platform" /></td>
        <td><input type="number" min="0" value="${Number(f.followers) || 0}" data-i="${i}" data-f="followers" /></td>
        <td><input type="number" min="0" value="${String(f.price || "").replace(/[^\d]/g, "") || 0}" data-i="${i}" data-f="price" /></td>
      </tr>`).join("")}</tbody></table></div>`;
  }
  function aiAddMulti() {
    const picked = [];
    document.querySelectorAll("#ai-multi .ai-multi-chk").forEach((c) => {
      if (!c.checked) return;
      const i = Number(c.dataset.i);
      const f = Object.assign({}, aiMultiRows[i]);
      document.querySelectorAll(`#ai-multi input[data-i="${i}"][data-f]`).forEach((inp) => { f[inp.dataset.f] = inp.value; });
      if (String(f.name || "").trim()) picked.push(f);
    });
    if (!picked.length) { toast("Chưa chọn dòng nào", "Tick vào KOL muốn thêm.", "warning"); return; }
    picked.forEach((f) => {
      const links = f.links || {};
      const LINK_ALIAS = { tiktok: "tiktok", facebook: "fb", instagram: "ig", youtube: "yt" };
      const d = {
        name: f.name, handle: f.handle, platform: (PLATFORMS[String(f.platform || "").toLowerCase()] ? String(f.platform).toLowerCase() : "tiktok"),
        niche: f.category || "", niche2: f.niche2 || "", gender: f.gender || "", tier: f.tier || "",
        region: f.region || "", format: "", followers: f.followers, estimatedPrice: f.price,
        email: f.email || "", contact: [f.contact, f.phone].filter(Boolean).join(" · "),
        previousCampaign: "", performance: f.status ? "Trạng thái: " + f.status : "",
        stage: "research", verifyStatus: "unverified", fileRef: "",
      };
      PLATFORM_COL_KEYS.forEach((p) => { d["link_" + p] = links[p] || links[LINK_ALIAS[p]] || ""; d["f_" + p] = f["f_" + p] || 0; });
      PRICE_COL_META.forEach(([, key]) => { d["price_" + key] = f["p_" + key] || 0; });
      saveKolDb(d);
    });
    afterMutateBooking(); // đã gồm closeModal()
    toast("Đã thêm " + picked.length + " KOL", "Nguồn: AI đọc file/link.", "success");
  }
  // AI trả 1 KOL → điền form; trả nhiều KOL → bảng preview. Vẫn hiểu payload cũ (fields phẳng).
  function handleAiResult(j, status, text) {
    const list = j.mode === "multi" || Array.isArray(j.kol_list) ? (j.kol_list || []) : null;
    if (list && list.length > 1) {
      renderAiMulti(list);
      if (status) status.textContent = `✅ AI đọc được ${list.length} KOL — chọn dòng cần thêm ở bảng dưới.`;
      toast("Phát hiện " + list.length + " KOL", "Tick chọn rồi bấm ➕ Thêm KOL đã chọn.", "success");
      return;
    }
    const box = $("#ai-multi");
    if (box) { box.hidden = true; box.innerHTML = ""; } // lần đọc trước ra nhiều KOL → dọn bảng cũ
    const f = (list && list[0]) || j.fields || (j && j.name ? j : {}) || {}; // 1.0.10: salvage KOL đơn (object có name, không có fields/mode)
    const filled = applyAiFields(f);
    if (status) status.textContent = filled ? `✅ Đã điền ${filled} ô — kiểm tra lại trước khi lưu.` : "AI không đọc được ô nào, vui lòng nhập tay.";
    const n = countCreatorsInText(text || "");
    if (n > 1) toast("Phát hiện " + n + " KOL", "Đã điền KOL đầu tiên, phần còn lại thêm lần lượt.", "warning");
    else toast("AI đã điền xong", "Kiểm tra lại thông tin trước khi lưu.", "success");
  }

  // 1.0.9 (C2): user dán link Google Sheet/Docs/Slides hoặc website → server đọc nội dung → DeepSeek → điền form
  function aiFetchUrl() {
    const inp = $("#ai-url");
    const status = $("#ai-fill-status");
    const url = inp ? inp.value.trim() : "";
    if (!url) { toast("Chưa có link", "Dán link Google Sheet/Docs/Slides hoặc website trước.", "warning"); return; }
    if (!/^https?:\/\//i.test(url)) { toast("Link không hợp lệ", "Link phải bắt đầu bằng http:// hoặc https://", "warning"); return; }
    if (status) status.innerHTML = `<span class="ai-spin">🤖</span> Đang mở link và đọc nội dung…`;
    apiFetch(AI_FETCH_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) })
      .then((res) => res.json().then((j) => { if (!res.ok) throw new Error(j.error || "HTTP " + res.status); return j; }))
      .then((j) => handleAiResult(j, status, ""))
      .catch((e) => {
        if (status) status.textContent = "⚠️ " + e.message;
        toast("Không đọc được link", e.message, "danger");
      });
  }

  function aiFillForm() {
    const ta = $("#ai-paste");
    const status = $("#ai-fill-status");
    const text = ta ? ta.value.trim() : "";
    if (!text && !aiFile) { toast("Chưa có nội dung", "Dán nội dung file hoặc chọn file trước.", "warning"); return; }
    if (status) status.innerHTML = `<span class="ai-spin">🤖</span> AI đang đọc…`;
    // Có text trong ô → gửi JSON như cũ; không thì upload file nhị phân để server bóc text
    let init;
    if (text) {
      init = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text }) };
    } else {
      const fd = new FormData();
      fd.append("file", aiFile, aiFile.name);
      init = { method: "POST", body: fd }; // để browser tự set boundary
    }
    apiFetch(AI_PARSE_URL, init)
      .then((res) => res.json().then((j) => { if (!res.ok) throw new Error(j.error || "HTTP " + res.status); return j; }))
      // 1.0.9 (C2/C3): phần điền form đã tách ra dùng chung với "🔗 Đọc link online"
      .then((j) => handleAiResult(j, status, text))
      .catch((e) => {
        if (status) status.textContent = "⚠️ " + e.message;
        toast("AI không đọc được", e.message, "danger");
      });
  }

  /* ---------- Form thêm/sửa Community/Group trong Booking DB ---------- */
  function communityDbForm(c) {
    c = c || {};
    return `<div class="form-grid">
      <div class="form-field full"><label>Tên group / page / hotpage *</label><input name="name" required value="${esc(c.name || "")}" /></div>
      <div class="form-field full"><label>Link</label><input name="link" value="${esc(c.link || "")}" placeholder="https://facebook.com/groups/…" /></div>
      <div class="form-field"><label>Nền tảng</label><select name="platform">${optionList(PLATFORMS, c.platform || "facebook")}</select></div>
      <div class="form-field"><label>Ngành hàng</label><select name="topic">${txtOpts(BOOKING_NICHES, c.topic)}</select></div>
      <div class="form-field"><label>Khu vực</label><select name="region">${txtOpts(BASE_LOCATIONS, c.region, "— Chưa rõ —")}</select></div>
      <div class="form-field"><label>Slot / định dạng</label><select name="slotFormat">${COMMUNITY_FORMATS.map((f) => `<option ${f === c.slotFormat ? "selected" : ""}>${f}</option>`).join("")}</select></div>
      <div class="form-field"><label>Members / Followers</label><input name="membersFollowers" type="number" min="0" value="${c.membersFollowers || 0}" /></div>
      <div class="form-field"><label>Giá ước tính (₫)</label><input name="estimatedPrice" type="number" min="0" step="500000" value="${c.estimatedPrice || 0}" /></div>
      <div class="form-field"><label>Chất lượng tương tác</label><select name="engagementQuality">${ENGAGEMENT_QUALITY.map((e) => `<option ${e === c.engagementQuality ? "selected" : ""}>${e}</option>`).join("")}</select></div>
      <div class="form-field full"><label>Admin / liên hệ</label><input name="adminContact" value="${esc(c.adminContact || "")}" placeholder="Tên admin · SĐT / email" /></div>
      <div class="form-field full"><label>Quy định đăng bài</label><textarea name="postingRules">${esc(c.postingRules || "")}</textarea></div>
      <div class="form-field full"><label>Lịch sử hợp tác trước đây</label><input name="previousCampaign" value="${esc(c.previousCampaign || "")}" /></div>
      <div class="form-field full"><label>Đánh giá / ghi chú hiệu quả</label><textarea name="performance">${esc(c.performance || "")}</textarea></div>
      <div class="form-field"><label>Nguồn</label><select name="stage">${optionList(STAGES, c.stage || "research")}</select></div>
      <div class="form-field"><label>Trạng thái xác minh</label><select name="verifyStatus">${optionList(VERIFY_STATUS, normVerify(c.verifyStatus))}</select></div>
      <div class="form-field full"><label>File tham chiếu (link, chỉ lưu đường dẫn)</label><input name="fileRef" value="${esc(c.fileRef || "")}" placeholder="Link brief / research doc" /></div>
    </div>`;
  }
  function saveCommunityDb(data, id) {
    const rec = {
      id: id || uid("cd"), name: data.name.trim(), link: data.link.trim(), platform: data.platform,
      topic: data.topic, region: data.region, slotFormat: data.slotFormat,
      membersFollowers: Number(data.membersFollowers) || 0, estimatedPrice: Number(data.estimatedPrice) || 0,
      engagementQuality: data.engagementQuality, adminContact: data.adminContact.trim(),
      postingRules: data.postingRules.trim(), previousCampaign: data.previousCampaign.trim(), performance: data.performance.trim(),
      stage: data.stage, verifyStatus: data.verifyStatus, fileRef: data.fileRef.trim(),
    };
    if (id) state.communityDb[state.communityDb.findIndex((x) => x.id === id)] = rec;
    else state.communityDb.unshift(rec);
    save();
  }

  function viewBookingDetail(isKol, rec) {
    // 1.0.3: bản ghi từ CREATOR_DB có thể không có giá số — hiện trạng thái thay vì "0 ₫"
    const priceStr = !can("private") ? "🔒 Chỉ Admin/Planner xem được"
      : rec.estimatedPrice ? fmtVND(rec.estimatedPrice) : (rec.priceStatus || "—");
    const contactStr = can("private") ? (isKol ? rec.contact : rec.adminContact) : "🔒 Chỉ Admin/Planner xem được";
    const rows = isKol ? [
      ["Tên creator", rec.name], ["Handle", rec.handle || "—"],
      ["Link kênh", rec.profileUrl || rec.link || "—"], ["Nền tảng", (PLATFORMS[rec.platform] || {}).label],
      ["Tier", rec.tier || (TIERS[tierOf(rec.followers)] || {}).label || "—"],
      ["Giới tính / casting", rec.gender || "—"], ["Năm sinh", rec.yob || "—"],
      ["Ngành hàng", rec.niche], ["Ngành hàng phụ", rec.niche2 || "—"],
      ["Quản lý / công ty", rec.representation || "—"],
      ["Email", can("private") ? (rec.email || "—") : "🔒"], ["Điện thoại", can("private") ? (rec.phone || "—") : "🔒"],
      ["Khu vực", rec.region], ["Định dạng", rec.format],
      ["Follower", fmtFollowers(rec.followers)], ["Giá ước tính", priceStr],
      ["Giá theo loại nội dung", (can("private") && priceItemsHint(rec.priceItems)) || "—"],
      ["Liên hệ", contactStr],
      ["Lịch sử hợp tác", rec.previousCampaign || "—"], ["Đánh giá hiệu quả", rec.performance || "—"],
      ["Nguồn", (STAGES[rec.stage] || {}).label], ["Xác minh", verifyMeta(rec.verifyStatus).label],
      ["File tham chiếu", rec.fileRef || "—"],
    ] : [
      ["Tên group/page", rec.name], ["Link", rec.link || "—"], ["Nền tảng", (PLATFORMS[rec.platform] || {}).label],
      ["Ngành hàng", rec.topic], ["Khu vực", rec.region], ["Slot / định dạng", rec.slotFormat],
      ["Members/Followers", fmtFollowers(rec.membersFollowers)], ["Giá ước tính", priceStr], ["Admin / liên hệ", contactStr],
      ["Quy định đăng bài", rec.postingRules || "—"], ["Chất lượng tương tác", rec.engagementQuality || "—"],
      ["Lịch sử hợp tác", rec.previousCampaign || "—"], ["Đánh giá hiệu quả", rec.performance || "—"],
      ["Nguồn", (STAGES[rec.stage] || {}).label], ["Xác minh", verifyMeta(rec.verifyStatus).label],
      ["File tham chiếu", rec.fileRef || "—"],
    ];
    const html = `<div class="form-grid">${rows.map(([l, v]) => `<div class="form-field full"><label>${esc(l)}</label><div>${esc(String(v))}</div></div>`).join("")}</div>`;
    openModal(rec.name, html, () => closeModal(), "Đóng");
  }

  function afterMutateBooking() { closeModal(); drawFlowStepper(); drawBookingTable(); drawShortlistBar(); }

  function exportBookingAll() {
    const rows = filteredBookingRows();
    const isKol = bookingUi.type === "kol";
    const header = isKol
      ? ["Tên", "Handle", "Nền tảng", "Ngành hàng", "Khu vực", "Follower", "Định dạng", "Giá ước tính", "Liên hệ", "Lịch sử hợp tác", "Đánh giá", "Nguồn", "Xác minh"]
      : ["Tên group/page", "Link", "Nền tảng", "Ngành hàng", "Khu vực", "Members", "Slot/định dạng", "Giá ước tính", "Admin/liên hệ", "Quy định đăng bài", "Chất lượng tương tác", "Lịch sử hợp tác", "Đánh giá", "Nguồn", "Xác minh"];
    const out = [header];
    rows.forEach((x) => {
      if (isKol) out.push([x.name, x.handle, (PLATFORMS[x.platform] || {}).label, x.niche, normRegion(x.region), x.followers, x.format, x.estimatedPrice, x.contact, x.previousCampaign, x.performance, STAGES[x.stage].label, verifyMeta(x.verifyStatus).label]);
      else out.push([x.name, x.link, (PLATFORMS[x.platform] || {}).label, x.topic, normRegion(x.region), x.membersFollowers, x.slotFormat, x.estimatedPrice, x.adminContact, x.postingRules, x.engagementQuality, x.previousCampaign, x.performance, STAGES[x.stage].label, verifyMeta(x.verifyStatus).label]);
    });
    downloadCSV((isKol ? "kol-koc" : "community-group") + "-database.csv", out);
  }

  function exportShortlist(quoteName, note) {
    const t = cartTotals();
    if (!t.count) { toast("Giỏ trống", "Hãy thêm ít nhất 1 KOL/Group vào giỏ trước.", "danger"); return; }
    const rows = [["Báo giá", quoteName || loadQuoteName() || "Báo giá giỏ hàng"], ["Ngày tạo", nowStamp()]];
    if (note) rows.push(["Ghi chú", note]);
    rows.push([]);
    rows.push(["Loại", "Tên", "Nền tảng", "Ngành hàng", "Follower/Members", "Giá ước tính (₫)", "Photo (₫)", "Video (₫)", "Sự kiện (₫)", "Video NH (₫)", "Livestream (₫)", "Liên hệ", "Xác minh"]);
    t.kol.forEach((x) => rows.push(["KOL/KOC", x.name, (PLATFORMS[x.platform] || {}).label, x.niche, x.followers, x.estimatedPrice, x.pPhoto || "", x.pVideo || "", x.pEvent || "", x.pBrandvideo || "", x.pLive || "", x.contact, verifyMeta(x.verifyStatus).label]));
    t.comm.forEach((x) => rows.push(["Community", x.name, (PLATFORMS[x.platform] || {}).label, x.topic, x.membersFollowers, x.estimatedPrice, "", "", "", "", "", x.adminContact, verifyMeta(x.verifyStatus).label]));
    rows.push([]);
    rows.push(["TỔNG SỐ LƯỢNG", t.count]);
    rows.push(["TỔNG REACH ƯỚC TÍNH", t.totalReach]);
    rows.push(["TỔNG NGÂN SÁCH ƯỚC TÍNH (₫)", t.totalBudget]);
    downloadCSV("gio-hang-booking-bao-gia-" + Date.now() + ".csv", rows);
  }

  function filteredKols() {
    const q = kolFilters.q.trim().toLowerCase();
    return state.influencers.filter((k) => {
      if (kolFilters.platform && k.platform !== kolFilters.platform) return false;
      if (kolFilters.tier && k.tier !== kolFilters.tier) return false;
      if (kolFilters.status && k.status !== kolFilters.status) return false;
      if (q) {
        const hay = `${k.name} ${k.handle} ${k.niche} ${k.location}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function drawKolRows() {
    const rows = filteredKols();
    const tbody = $("#kol-table tbody");
    if (!rows.length) {
      tbody.innerHTML = `<tr><td colspan="9">${emptyState("🔍", "Không tìm thấy KOL/KOC phù hợp.")}</td></tr>`;
      return;
    }
    tbody.innerHTML = rows.map((k) => {
      const st = KOL_STATUS[k.status] || { label: k.status, tag: "" };
      const tr = TIERS[k.tier] || { label: k.tier };
      return `<tr>
        <td>${userCell(k)}</td>
        <td>${platformCell(k.platform)}</td>
        <td>${tag(tr.label, "primary")}</td>
        <td>${esc(k.niche)}</td>
        <td class="right mono">${fmtFollowers(k.followers)}</td>
        <td class="right mono">${(k.engagement || 0).toLocaleString("vi-VN")}%</td>
        <td class="right mono">${fmtShortVND(k.rate)}</td>
        <td>${tag(st.label, st.tag)}</td>
        <td class="right"><div class="row-actions">
          <button class="icon-btn btn-sm" data-action="edit-kol" data-id="${k.id}" title="Sửa">${icon("edit")}</button>
          <button class="icon-btn btn-sm" data-action="del-kol" data-id="${k.id}" title="Xóa">${icon("trash")}</button>
        </div></td>
      </tr>`;
    }).join("");
  }

  function kolForm(k) {
    k = k || {};
    return `
      <div class="form-grid">
        <div class="form-field"><label>Họ và tên *</label><input name="name" required value="${esc(k.name || "")}" placeholder="VD: Ngọc Hân" /></div>
        <div class="form-field"><label>Tài khoản (@handle) *</label><input name="handle" required value="${esc(k.handle || "")}" placeholder="@handle" /></div>
        <div class="form-field"><label>Nền tảng</label><select name="platform">${optionList(PLATFORMS, k.platform || "tiktok")}</select></div>
        <div class="form-field"><label>Cấp độ</label><select name="tier">${optionList(TIERS, k.tier || "micro")}</select></div>
        <div class="form-field"><label>Lĩnh vực</label><select name="niche">${NICHES.map((n) => `<option ${n === k.niche ? "selected" : ""}>${n}</option>`).join("")}</select></div>
        <div class="form-field"><label>Trạng thái</label><select name="status">${optionList(KOL_STATUS, k.status || "potential")}</select></div>
        <div class="form-field"><label>Số follower</label><input name="followers" type="number" min="0" value="${k.followers || 0}" /></div>
        <div class="form-field"><label>Tỷ lệ tương tác (%)</label><input name="engagement" type="number" min="0" step="0.1" value="${k.engagement || 0}" /></div>
        <div class="form-field"><label>Giá mỗi bài (₫)</label><input name="rate" type="number" min="0" step="500000" value="${k.rate || 0}" /></div>
        <div class="form-field"><label>Khu vực</label><input name="location" value="${esc(k.location || "")}" placeholder="Tỉnh / TP." /></div>
        <div class="form-field"><label>Email</label><input name="email" type="email" value="${esc(k.email || "")}" /></div>
        <div class="form-field"><label>Số điện thoại</label><input name="phone" value="${esc(k.phone || "")}" /></div>
        <div class="form-field full"><label>Ghi chú</label><textarea name="note" placeholder="Thế mạnh, lưu ý khi hợp tác…">${esc(k.note || "")}</textarea></div>
      </div>`;
  }

  function saveKol(data, id) {
    const rec = {
      id: id || uid("i"),
      name: data.name.trim(), handle: data.handle.trim(),
      platform: data.platform, tier: data.tier, niche: data.niche, status: data.status,
      followers: Number(data.followers) || 0, engagement: Number(data.engagement) || 0, rate: Number(data.rate) || 0,
      location: data.location.trim(), email: data.email.trim(), phone: data.phone.trim(), note: data.note.trim(),
    };
    if (id) state.influencers[state.influencers.findIndex((x) => x.id === id)] = rec;
    else state.influencers.unshift(rec);
    save();
  }

  /* ============================================================
     VIEW: Chiến dịch
     ============================================================ */
  function renderCampaigns() {
    setContent(`
      ${workflowBanner()}${pageHead("Chiến dịch", "Quản lý ngân sách, tiến độ và KOL tham gia từng chiến dịch.",
        (can("manage") ? `<button class="btn btn-primary" data-action="add-camp">＋ Tạo chiến dịch</button>` : ""))}
      <div class="kpi-grid">
        ${miniStat("Tổng ngân sách", fmtShortVND(state.campaigns.reduce((s, c) => s + c.budget, 0)))}
        ${miniStat("Đã chi tiêu", fmtShortVND(state.campaigns.reduce((s, c) => s + c.spent, 0)))}
        ${miniStat("Đang chạy", state.campaigns.filter((c) => c.status === "running").length)}
        ${miniStat("Hoàn thành", state.campaigns.filter((c) => c.status === "done").length)}
      </div>
      <div id="camp-grid"></div>
    `);
    drawCampaigns();
  }

  function drawCampaigns() {
    const wrap = $("#camp-grid");
    if (!state.campaigns.length) { wrap.innerHTML = emptyState("🎯", "Chưa có chiến dịch nào. Hãy tạo chiến dịch đầu tiên!"); return; }
    wrap.innerHTML = `<div class="kpi-grid" style="grid-template-columns:repeat(2,1fr)">
      ${state.campaigns.map((c) => {
        const st = CAMP_STATUS[c.status];
        const pct = c.budget ? clamp(Math.round((c.spent / c.budget) * 100), 0, 100) : 0;
        const kols = (c.kols || []).map((id) => kolById(id)).filter(Boolean);
        return `<div class="card">
          <div class="card-head">
            <div><h2>${esc(c.name)}</h2><div class="sub">${PLATFORMS[c.channel] ? PLATFORMS[c.channel].icon + " " : ""}${esc(c.brand)}</div></div>
            ${tag(st.label, st.tag)}
          </div>
          <div class="card-body">
            <p class="muted" style="margin-top:0">${esc(c.goal || "")}</p>
            <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:6px">
              <span class="muted">Ngân sách: <strong>${fmtVND(c.budget)}</strong></span><span class="mono">${pct}%</span>
            </div>
            <div class="progress"><span style="width:${pct}%"></span></div>
            <div style="display:flex;justify-content:space-between;font-size:12px;margin-top:6px" class="muted">
              <span>Đã chi ${fmtShortVND(c.spent)}</span><span>${fmtDate(c.start)} – ${fmtDate(c.end)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:10px;margin-top:14px">
              <div style="display:flex" title="${esc(kols.map((k) => k.name).join(", "))}">
                ${kols.slice(0, 4).map((k, i) => `<span class="avatar" style="width:30px;height:30px;font-size:11px;margin-left:${i ? -8 : 0}px;border:2px solid var(--bg-elev)">${esc(initials(k.name))}</span>`).join("")}
                ${kols.length > 4 ? `<span class="avatar" style="width:30px;height:30px;font-size:11px;margin-left:-8px;border:2px solid var(--bg-elev);background:var(--text-faint)">+${kols.length - 4}</span>` : ""}
              </div>
              <span class="muted" style="font-size:12.5px">${kols.length} KOL/KOC</span>
              <div class="row-actions" style="margin-left:auto">
                ${can("manage") ? `<button class="btn btn-ghost btn-sm" data-action="edit-camp" data-id="${c.id}">✏️ Sửa</button>` : ""}
                ${can("delete") ? `<button class="btn btn-ghost btn-sm" data-action="del-camp" data-id="${c.id}">${icon("trash")}</button>` : ""}
              </div>
            </div>
          </div>
        </div>`;
      }).join("")}
    </div>`;
  }

  function campForm(c) {
    c = c || {};
    const kolChecks = workflowKolPool().map((k) => {
      const on = (c.kols || []).includes(k.id);
      return `<label style="display:flex;align-items:center;gap:8px;font-weight:500;padding:5px 0">
        <input type="checkbox" name="kol_${k.id}" ${on ? "checked" : ""} style="width:auto"/>
        ${PLATFORMS[k.platform].icon} ${esc(k.name)} <span class="muted">${esc(k.handle)}</span>
      </label>`;
    }).join("");
    return `
      <div class="form-grid">
        <div class="form-field full"><label>Tên chiến dịch *</label><input name="name" required value="${esc(c.name || "")}" placeholder="VD: Ra mắt sản phẩm mùa hè" /></div>
        <div class="form-field"><label>Thương hiệu *</label><input name="brand" required value="${esc(c.brand || "")}" /></div>
        <div class="form-field"><label>Kênh chính</label><select name="channel">${optionList(PLATFORMS, c.channel || "tiktok")}</select></div>
        <div class="form-field"><label>Trạng thái</label><select name="status">${optionList(CAMP_STATUS, c.status || "planning")}</select></div>
        <div class="form-field"><label>Ngân sách (₫)</label><input name="budget" type="number" min="0" step="1000000" value="${c.budget || 0}" /></div>
        <div class="form-field"><label>Đã chi (₫)</label><input name="spent" type="number" min="0" step="1000000" value="${c.spent || 0}" /></div>
        <div class="form-field"><label>Ngày bắt đầu</label><input name="start" type="date" value="${c.start || ""}" /></div>
        <div class="form-field"><label>Ngày kết thúc</label><input name="end" type="date" value="${c.end || ""}" /></div>
        <div class="form-field full"><label>Mục tiêu</label><textarea name="goal" placeholder="KPI, mục tiêu doanh số…">${esc(c.goal || "")}</textarea></div>
        <div class="form-field full"><label>KOL/KOC tham gia</label>
          <div style="max-height:180px;overflow:auto;border:1px solid var(--border);border-radius:9px;padding:8px 12px">
            ${kolChecks || '<span class="muted">Chưa có KOL/KOC nào.</span>'}
          </div>
        </div>
      </div>`;
  }

  function saveCamp(data, id) {
    const kols = workflowKolPool().filter((k) => data["kol_" + k.id]).map((k) => k.id);
    const rec = {
      id: id || uid("c"), name: data.name.trim(), brand: data.brand.trim(),
      channel: data.channel, status: data.status,
      budget: Number(data.budget) || 0, spent: Number(data.spent) || 0,
      start: data.start, end: data.end, goal: data.goal.trim(), kols: wfKeepUnlistedKols(id, kols),
    };
    if (id) wfMerge(state.campaigns, id, rec);
    else state.campaigns.unshift(rec);
    save();
  }

  /* ============================================================
     VIEW: Hợp đồng (Kanban)
     ============================================================ */
  function renderPipeline() {
    const total = state.deals.reduce((s, d) => s + d.value, 0);
    setContent(`
      ${workflowBanner()}${pageHead("Hợp đồng", "Theo dõi tiến trình đàm phán và ký kết hợp đồng.",
        (can("manage") ? `<button class="btn btn-primary" data-action="add-deal">＋ Thêm hợp đồng</button>` : ""))}
      <div class="toolbar">
        <span class="tag primary">Tổng giá trị: ${fmtVND(total)}</span>
        <span class="tag success">Đã nghiệm thu: ${fmtShortVND(state.deals.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0))}</span>
        <span class="muted" style="margin-left:auto">Dùng nút ◄ ► để chuyển giai đoạn.</span>
      </div>
      <div id="kanban"></div>
    `);
    drawKanban();
  }

  // ponytail: tab giai đoạn + list dọc thay kanban 6 cột — hết cuộn ngang ở 1440px, vẫn giữ prev/next + edit
  let pipelineUi = { stage: PIPELINE_STAGES[0].id };
  function drawKanban() {
    const wrap = $("#kanban");
    if (!wrap) return;
    if (!PIPELINE_STAGES.some((s) => s.id === pipelineUi.stage)) pipelineUi.stage = PIPELINE_STAGES[0].id;
    const active = pipelineUi.stage;
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === active);
    const tabs = PIPELINE_STAGES.map((s) => {
      const deals = state.deals.filter((d) => d.stage === s.id);
      const sum = deals.reduce((a, d) => a + d.value, 0);
      return `<button class="stage-tab ${s.id === active ? "active" : ""}" data-stage-tab="${s.id}">
        <span class="st-label">${esc(s.label)}</span>
        <span class="st-meta"><span class="kb-count">${deals.length}</span> · ${fmtShortVND(sum)}</span>
      </button>`;
    }).join("");
    const deals = state.deals.filter((d) => d.stage === active);
    const list = deals.length ? deals.map((d) => {
      const k = kolById(d.kol);
      return `<div class="deal-row" ${can("manage") ? 'data-action="edit-deal"' : ""} data-id="${d.id}">
        <div class="deal-main">
          <div><strong>${esc(k ? k.name : "?")}</strong> <span class="muted">${k ? esc(k.handle) : ""}</span></div>
          <div class="deal-sub muted">🏷 ${esc(d.brand)} · ${esc(d.campaign || "—")}</div>
        </div>
        <div class="deal-val mono">${fmtShortVND(d.value)}</div>
        <div class="kb-move" data-noedit="1" ${can("manage") ? "" : 'hidden style="display:none"'}>
          <button data-move="prev" data-id="${d.id}" ${idx === 0 ? "disabled" : ""} title="Lùi giai đoạn">◄</button>
          <button data-move="next" data-id="${d.id}" ${idx === PIPELINE_STAGES.length - 1 ? "disabled" : ""} title="Tiến giai đoạn">►</button>
        </div>
      </div>`;
    }).join("") : `<div class="muted" style="padding:20px 8px;text-align:center">Chưa có hợp đồng ở giai đoạn này.</div>`;
    wrap.innerHTML = `<div class="stage-tabs">${tabs}</div><div class="card"><div class="deal-list">${list}</div></div>`;
  }

  function moveDeal(id, dir) {
    const d = state.deals.find((x) => x.id === id);
    if (!d) return;
    const idx = PIPELINE_STAGES.findIndex((s) => s.id === d.stage);
    const next = clamp(idx + (dir === "next" ? 1 : -1), 0, PIPELINE_STAGES.length - 1);
    d.stage = PIPELINE_STAGES[next].id;
    d.updated = new Date().toISOString().slice(0, 10);
    save(); drawKanban();
    toast("Đã cập nhật", `Hợp đồng chuyển sang “${PIPELINE_STAGES[next].label}”.`, "success");
  }

  function dealForm(d) {
    d = d || {};
    const kolOpts = workflowKolPool().map((k) => `<option value="${k.id}" ${k.id === d.kol ? "selected" : ""}>${esc(k.name)} · ${esc(k.handle)}</option>`).join("");
    const stageOpts = PIPELINE_STAGES.map((s) => `<option value="${s.id}" ${s.id === d.stage ? "selected" : ""}>${esc(s.label)}</option>`).join("");
    return `
      <div class="form-grid">
        <div class="form-field"><label>KOL/KOC *</label><select name="kol" required>${kolOpts}</select></div>
        <div class="form-field"><label>Thương hiệu *</label><input name="brand" required value="${esc(d.brand || "")}" /></div>
        <div class="form-field full"><label>Chiến dịch / mô tả</label><input name="campaign" value="${esc(d.campaign || "")}" placeholder="VD: Bộ sưu tập thu 2026" /></div>
        <div class="form-field"><label>Giá trị hợp đồng (₫)</label><input name="value" type="number" min="0" step="1000000" value="${d.value || 0}" /></div>
        <div class="form-field"><label>Giai đoạn</label><select name="stage">${stageOpts}</select></div>
      </div>`;
  }

  function saveDeal(data, id) {
    const rec = {
      id: id || uid("d"), kol: data.kol, brand: data.brand.trim(), campaign: data.campaign.trim(),
      value: Number(data.value) || 0, stage: data.stage, updated: new Date().toISOString().slice(0, 10),
    };
    if (id) wfMerge(state.deals, id, rec);
    else state.deals.unshift(rec);
    save();
  }

  /* ============================================================
     VIEW: Nội dung
     ============================================================ */
  let contentFilter = "";
  function renderContents() {
    setContent(`
      ${workflowBanner()}${pageHead("Lịch nội dung", "Theo dõi tiến độ sản xuất và đăng tải nội dung.",
        (can("manage") ? `<button class="btn btn-primary" data-action="add-content">＋ Thêm nội dung</button>` : ""))}
      <div class="toolbar">
        <div class="field"><label>Lọc trạng thái</label><select id="content-filter">${optionList(CONTENT_STATUS, contentFilter, "Tất cả")}</select></div>
        <span class="muted" style="margin-left:auto">${state.contents.length} mục nội dung</span>
      </div>
      <div id="content-wrap"></div>
    `);
    $("#content-filter").addEventListener("change", (e) => { contentFilter = e.target.value; drawContents(); });
    drawContents();
  }

  function drawContents() {
    const wrap = $("#content-wrap");
    let list = [...state.contents].sort((a, b) => new Date(a.date) - new Date(b.date));
    if (contentFilter) list = list.filter((n) => n.status === contentFilter);
    if (!list.length) { wrap.innerHTML = emptyState("🗓️", "Không có nội dung nào."); return; }
    wrap.innerHTML = `<div class="content-list">${list.map((n) => {
      const st = CONTENT_STATUS[n.status] || { label: n.status, tag: "" };
      const d = new Date(n.date);
      return `<div class="content-row">
        <div class="content-date"><div class="d">${String(d.getDate()).padStart(2, "0")}</div><div class="m">${MONTHS_VI[d.getMonth()]}</div></div>
        <div class="content-main">
          <h4>${esc(n.title)}</h4>
          <div class="meta">
            <span>👤 ${esc(kolName(n.kol))}</span>
            <span>🎬 ${esc(n.type)}</span>
            <span>🎯 ${esc(campName(n.campaign))}</span>
            ${n.views ? `<span>👁 ${fmtFollowers(n.views)}</span>` : ""}
          </div>
        </div>
        <div class="content-right">
          ${tag(st.label, st.tag)}
          ${can("manage") ? `<button class="icon-btn btn-sm" data-action="edit-content" data-id="${n.id}" title="Sửa">${icon("edit")}</button>` : ""}
          ${can("delete") ? `<button class="icon-btn btn-sm" data-action="del-content" data-id="${n.id}" title="Xóa">${icon("trash")}</button>` : ""}
        </div>
      </div>`;
    }).join("")}</div>`;
  }

  function contentForm(n) {
    n = n || {};
    const kolOpts = workflowKolPool().map((k) => `<option value="${k.id}" ${k.id === n.kol ? "selected" : ""}>${esc(k.name)}</option>`).join("");
    const campOpts = `<option value="">— Không gắn —</option>` + state.campaigns.map((c) => `<option value="${c.id}" ${c.id === n.campaign ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    return `
      <div class="form-grid">
        <div class="form-field full"><label>Tiêu đề nội dung *</label><input name="title" required value="${esc(n.title || "")}" placeholder="VD: Review sản phẩm mới" /></div>
        <div class="form-field"><label>KOL/KOC</label><select name="kol">${kolOpts}</select></div>
        <div class="form-field"><label>Chiến dịch</label><select name="campaign">${campOpts}</select></div>
        <div class="form-field"><label>Định dạng</label><select name="type">${CONTENT_TYPES.map((t) => `<option ${t === n.type ? "selected" : ""}>${t}</option>`).join("")}</select></div>
        <div class="form-field"><label>Trạng thái</label><select name="status">${optionList(CONTENT_STATUS, n.status || "idea")}</select></div>
        <div class="form-field"><label>Ngày đăng dự kiến</label><input name="date" type="date" value="${n.date || ""}" /></div>
        <div class="form-field"><label>Lượt xem</label><input name="views" type="number" min="0" value="${n.views || 0}" /></div>
      </div>`;
  }

  function saveContent(data, id) {
    const rec = {
      id: id || uid("n"), title: data.title.trim(), kol: data.kol, campaign: data.campaign,
      type: data.type, status: data.status, date: data.date, views: Number(data.views) || 0,
    };
    if (id) wfMerge(state.contents, id, rec);
    else state.contents.unshift(rec);
    save();
  }

  /* ============================================================
     VIEW: Thanh toán
     ============================================================ */
  function renderPayments() {
    const paid = state.payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
    const pending = state.payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
    const overdue = state.payments.filter((p) => p.status === "overdue").reduce((s, p) => s + p.amount, 0);
    setContent(`
      ${workflowBanner()}${pageHead("Thanh toán", "Quản lý hóa đơn và công nợ với KOL/KOC.",
        (can("manage") ? `<button class="btn btn-primary" data-action="add-pay">＋ Thêm hóa đơn</button>` : ""))}
      <div class="kpi-grid">
        ${miniStat("Đã thanh toán", fmtShortVND(paid), "success")}
        ${miniStat("Chờ thanh toán", fmtShortVND(pending), "warning")}
        ${miniStat("Quá hạn", fmtShortVND(overdue), "danger")}
        ${miniStat("Số hóa đơn", state.payments.length)}
      </div>
      <div class="card">
        <div class="table-wrap"><table id="pay-table">
          <thead><tr>
            <th>Mã HĐ</th><th class="col-name">KOL / KOC</th><th>Chiến dịch</th>
            <th class="right">Số tiền</th><th>Hạn thanh toán</th><th>Trạng thái</th><th></th>
          </tr></thead>
          <tbody></tbody>
        </table></div>
      </div>
    `);
    drawPayments();
  }

  function drawPayments() {
    const tbody = $("#pay-table tbody");
    if (!state.payments.length) { tbody.innerHTML = `<tr><td colspan="7">${emptyState("💰", "Chưa có hóa đơn nào.")}</td></tr>`; return; }
    tbody.innerHTML = state.payments.map((p) => {
      const st = PAY_STATUS[p.status] || { label: p.status, tag: "" };
      const k = kolById(p.kol);
      return `<tr>
        <td class="mono">${esc(p.invoice)}</td>
        <td>${userCell(k)}</td>
        <td>${esc(campName(p.campaign))}</td>
        <td class="right mono"><strong>${fmtVND(p.amount)}</strong></td>
        <td class="mono">${fmtDate(p.due)}</td>
        <td>${tag(st.label, st.tag)}</td>
        <td class="right"><div class="row-actions">
          ${p.status !== "paid" && can("manage") ? `<button class="btn btn-ghost btn-sm" data-action="mark-paid" data-id="${p.id}">✓ Đã trả</button>` : ""}
          ${can("manage") ? `<button class="icon-btn btn-sm" data-action="edit-pay" data-id="${p.id}" title="Sửa">${icon("edit")}</button>` : ""}
          ${can("delete") ? `<button class="icon-btn btn-sm" data-action="del-pay" data-id="${p.id}" title="Xóa">${icon("trash")}</button>` : ""}
        </div></td>
      </tr>`;
    }).join("");
  }

  function payForm(p) {
    p = p || {};
    const kolOpts = workflowKolPool().map((k) => `<option value="${k.id}" ${k.id === p.kol ? "selected" : ""}>${esc(k.name)}</option>`).join("");
    const campOpts = `<option value="">— Không gắn —</option>` + state.campaigns.map((c) => `<option value="${c.id}" ${c.id === p.campaign ? "selected" : ""}>${esc(c.name)}</option>`).join("");
    return `
      <div class="form-grid">
        <div class="form-field"><label>Mã hóa đơn *</label><input name="invoice" required value="${esc(p.invoice || "HD-" + Date.now().toString().slice(-6))}" /></div>
        <div class="form-field"><label>KOL/KOC</label><select name="kol">${kolOpts}</select></div>
        <div class="form-field"><label>Chiến dịch</label><select name="campaign">${campOpts}</select></div>
        <div class="form-field"><label>Số tiền (₫)</label><input name="amount" type="number" min="0" step="500000" value="${p.amount || 0}" /></div>
        <div class="form-field"><label>Hạn thanh toán</label><input name="due" type="date" value="${p.due || ""}" /></div>
        <div class="form-field"><label>Trạng thái</label><select name="status">${optionList(PAY_STATUS, p.status || "pending")}</select></div>
      </div>`;
  }

  function savePay(data, id) {
    const rec = {
      id: id || uid("p"), invoice: data.invoice.trim(), kol: data.kol, campaign: data.campaign,
      amount: Number(data.amount) || 0, due: data.due, status: data.status,
    };
    if (id) wfMerge(state.payments, id, rec);
    else state.payments.unshift(rec);
    save();
  }

  /* ============================================================
     VIEW: Báo cáo
     ============================================================ */
  function renderReports() {
    const viewsByKol = {};
    state.contents.forEach((n) => { viewsByKol[n.kol] = (viewsByKol[n.kol] || 0) + (n.views || 0); });
    const topKols = state.influencers.map((k) => ({ k, views: viewsByKol[k.id] || 0 }))
      .sort((a, b) => b.views - a.views).slice(0, 5);

    const tierCount = {};
    state.influencers.forEach((k) => { tierCount[k.tier] = (tierCount[k.tier] || 0) + 1; });

    const byBrand = {};
    state.campaigns.forEach((c) => { byBrand[c.brand] = (byBrand[c.brand] || 0) + c.spent; });
    const brandData = Object.entries(byBrand).map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6);

    const totalViews = Object.values(viewsByKol).reduce((s, v) => s + v, 0);
    const avgEng = state.influencers.length ? (state.influencers.reduce((s, k) => s + k.engagement, 0) / state.influencers.length) : 0;
    const costPerView = totalViews ? state.campaigns.reduce((s, c) => s + c.spent, 0) / totalViews : 0;

    setContent(`
      ${pageHead("Báo cáo & phân tích", "Hiệu quả tổng thể của hoạt động influencer marketing.",
        `<button class="btn" data-action="export-report">⭳ Xuất báo cáo CSV</button>`)}

      <div class="kpi-grid">
        ${kpi("👁", "i-info", fmtFollowers(totalViews), "Tổng lượt xem nội dung", "Toàn bộ chiến dịch", "up")}
        ${kpi("❤️", "i-primary", avgEng.toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + "%", "Tỷ lệ tương tác TB", "Trên KOL/KOC", "up")}
        ${kpi("🧾", "i-warning", fmtVND(Math.round(costPerView)), "Chi phí / lượt xem", "Ước tính", "down")}
        ${kpi("🤝", "i-success", fmtNum(state.deals.length), "Tổng số hợp đồng", `${state.deals.filter(d => d.stage === "won").length} nghiệm thu`, "up")}
      </div>

      <div class="grid-2">
        <div class="card"><div class="card-head"><h2>Chi tiêu theo thương hiệu</h2></div><div class="card-body">${barChart(brandData)}</div></div>
        <div class="card"><div class="card-head"><h2>Phân bổ theo cấp độ</h2></div><div class="card-body">${tierChart(tierCount)}</div></div>
      </div>

      <div class="card">
        <div class="card-head"><h2>Top KOL/KOC theo lượt xem</h2><div class="sub">Xếp hạng hiệu quả nội dung</div></div>
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th class="col-name">KOL / KOC</th><th>Lĩnh vực</th><th class="right">Follower</th><th class="right">Tương tác</th><th class="right">Tổng lượt xem</th></tr></thead>
          <tbody>
            ${topKols.map(({ k, views }, i) => `<tr>
              <td><strong>${i + 1}</strong></td>
              <td>${userCell(k)}</td>
              <td>${esc(k.niche)}</td>
              <td class="right mono">${fmtFollowers(k.followers)}</td>
              <td class="right mono">${k.engagement.toLocaleString("vi-VN")}%</td>
              <td class="right mono"><strong>${fmtFollowers(views)}</strong></td>
            </tr>`).join("")}
          </tbody>
        </table></div>
      </div>
    `);
  }

  function tierChart(counts) {
    const order = ["nano", "micro", "macro", "mega"];
    const data = order.filter((t) => counts[t]).map((t) => ({ label: TIERS[t].label, value: counts[t] }));
    if (!data.length) return emptyState("📊", "Chưa có dữ liệu.");
    const max = Math.max(...data.map((d) => d.value), 1);
    return `<div class="bar-chart">
      ${data.map((d) => {
        const h = clamp(Math.round((d.value / max) * 100), 8, 100);
        return `<div class="bar-col">
          <span class="bv">${d.value}</span>
          <div class="bar" style="height:${h}%;background:linear-gradient(180deg,#2a7fb8,#5b5bd6)"></div>
          <small>${esc(d.label)}</small>
        </div>`;
      }).join("")}
    </div>`;
  }

  /* ============================================================
     VIEW: AI Workspace 1.0.7 (items 14-18) — chat DeepSeek thật, 2 khung,
     tự gọi tool (search_kol/add_to_cart/export_quote/get_stats), lịch sử theo account.
     ============================================================ */
  const AI_SYSTEM_PROMPT = "Bạn là trợ lý AI của Markus Agency, chuyên hỗ trợ booking KOL/KOC tại Việt Nam. Bạn có thể tra cứu CSDL KOL (614 creators), giỏ hàng, xuất báo giá khi được yêu cầu. Trả lời ngắn gọn, tiếng Việt. Khi user hỏi ngoài lề (viết caption, tư vấn marketing...) vẫn trả lời bình thường. Khi cần dữ liệu thật, hãy gọi tool tương ứng.";
  const AI_TOOLS = [
    { type: "function", function: { name: "search_kol", description: "Tìm KOL/KOC trong CSDL theo lĩnh vực (niche), follower tối thiểu, ngân sách tối đa, khu vực, tier. Trả tối đa 5 kết quả.", parameters: { type: "object", properties: { niche: { type: "string", description: "ngành hàng, ví dụ Beauty, F&B Review, Lifestyle Vlog, Health & Fitness, Tech & Gadget (CSDL dùng tiếng Anh, nhưng vẫn hiểu từ khóa tiếng Việt như làm đẹp, ẩm thực)" }, minFollowers: { type: "number" }, maxBudget: { type: "number", description: "ngân sách tối đa VND" }, region: { type: "string" }, tier: { type: "string" } } } } },
    { type: "function", function: { name: "add_to_cart", description: "Thêm KOL vào giỏ hàng Booking theo danh sách id. BẮT BUỘC: mỗi id phải lấy nguyên văn từ field \"id\" trong kết quả search_kol ở lượt trước — KHÔNG tự bịa, không dùng tên hay handle làm id. Nếu chưa có kết quả search_kol thì gọi search_kol trước. Chỉ báo với người dùng là đã thêm khi tool này trả về added > 0.", parameters: { type: "object", properties: { ids: { type: "array", items: { type: "string", description: "id lấy từ kết quả search_kol" } } }, required: ["ids"] } } },
    { type: "function", function: { name: "export_quote", description: "Xuất file báo giá cho giỏ hàng hiện tại." } },
    { type: "function", function: { name: "get_stats", description: "Thống kê nhanh: tổng KOL, đã báo giá, đã hợp tác, số trong giỏ, tổng budget giỏ." } },
  ];
  const AI_QUICK = [
    { label: "Tìm KOL theo yêu cầu", send: "Tìm giúp mình vài KOL phù hợp — lĩnh vực Beauty, ngân sách tối đa 20 triệu." },
    { label: "Phân tích CSDL", send: "Phân tích nhanh cơ sở dữ liệu KOL hiện có (tổng số, đã báo giá, đã hợp tác, giỏ hàng)." },
    { label: "Viết brief", send: "Viết giúp mình một brief chiến dịch influencer mẫu cho một sản phẩm mỹ phẩm." },
    { label: "Xuất báo giá", send: "Xuất báo giá cho giỏ hàng hiện tại giúp mình." },
  ];
  let aiState = { convs: [], activeId: null, busy: false, loaded: false };
  let aiSaveTimer = null;

  const aiUserEmail = () => String((currentUser && currentUser.email) || "guest").toLowerCase();
  const aiUserInitial = () => String((currentUser && (currentUser.name || currentUser.email)) || "B").trim().charAt(0).toUpperCase() || "B";
  const aiActiveConv = () => aiState.convs.find((c) => c.id === aiState.activeId);
  function aiWhen(ts) {
    if (!ts) return "vừa xong";
    const d = new Date(ts);
    return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  }

  function renderAiWorkspace() {
    setContent(`
      ${pageHead("AI Workspace", "Trợ lý DeepSeek cho booking KOL — tra cứu CSDL, giỏ hàng, xuất báo giá.", `<span class="tag info">${icon("bot", 13)} DeepSeek</span>`)}
      <div class="ai-shell">
        <aside class="ai-conv-pane">
          <!-- 1.0.13 (D8): thêm tooltip cho các nút thao tác — trên mobile nút bị thu nhỏ, chữ không đủ nghĩa -->
          <button class="btn btn-primary btn-sm ai-new-btn" id="ai-new-conv" title="Mở hội thoại mới với Markus AI">${icon("plus", 14)} Hội thoại mới</button>
          <div class="ai-conv-list" id="ai-conv-list"></div>
        </aside>
        <section class="ai-chat">
          <div class="ai-chat-head">
            <span class="ai-av ai-av-bot">${icon("bot", 16)}</span>
            <div class="ai-chat-head-txt"><strong>Markus AI</strong><small id="ai-status">DeepSeek · sẵn sàng</small></div>
          </div>
          <div class="ai-messages" id="ai-messages"></div>
          <div class="ai-quick" id="ai-quick">${AI_QUICK.map((q, i) => `<button class="ai-chip" data-ai-quick="${i}" title="${esc(q.send || q.label)}">${esc(q.label)}</button>`).join("")}</div>
          <div class="ai-input-row">
            <textarea id="ai-input" class="ai-input" rows="1" placeholder="Nhắn cho Markus AI… (Enter để gửi, Shift+Enter xuống dòng)"></textarea>
            <button class="btn btn-primary ai-send-btn" id="ai-send" title="Gửi">${icon("send", 16)}</button>
          </div>
        </section>
      </div>
    `);
    aiBindWorkspace();
    aiRenderConvList();
    aiRenderMessages();
    // R4 (mục 7): trước đây mỗi lần vào #/ai đều gọi aiLoadHistory() → gán đè aiState.convs
    // bằng danh sách server; hội thoại vừa chat (debounce lưu 2s) bị xoá sạch khi đổi menu rồi
    // quay lại. Nay CHỈ nạp lịch sử MỘT LẦN mỗi phiên, các lần sau vẽ lại từ state trong RAM.
    if (aiState.loaded) return;
    aiLoadHistory().then(() => {
      if (!aiState.activeId && aiState.convs.length) aiState.activeId = aiState.convs[0].id;
      aiRenderConvList();
      aiRenderMessages();
    });
  }

  function aiBindWorkspace() {
    const input = $("#ai-input");
    const send = () => aiSend(input.value);
    $("#ai-new-conv").addEventListener("click", () => aiNewConv(true));
    $("#ai-send").addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } });
    input.addEventListener("input", () => { input.style.height = "auto"; input.style.height = Math.min(input.scrollHeight, 120) + "px"; });
    $("#ai-quick").addEventListener("click", (e) => { const b = e.target.closest("[data-ai-quick]"); if (b) aiSend(AI_QUICK[Number(b.dataset.aiQuick)].send); });
    $("#ai-conv-list").addEventListener("click", (e) => {
      const del = e.target.closest("[data-ai-del]");
      if (del) { e.stopPropagation(); aiDeleteConv(del.dataset.aiDel); return; }
      const it = e.target.closest("[data-ai-conv]");
      if (it) aiSelectConv(it.dataset.aiConv);
    });
    $("#ai-messages").addEventListener("click", (e) => {
      const c = e.target.closest("[data-ai-cart]");
      if (c && !c.disabled) { toggleCart("kol", c.dataset.aiCart, !cartHas(c.dataset.aiCart)); aiRenderMessages(); }
    });
  }

  /* ---- Lịch sử hội thoại trên server (item 17) ---- */
  // R4 (mục 7): bản sao dự phòng ngay trên máy — server lỗi/chậm thì vẫn còn hội thoại.
  const AI_LOCAL_KEY = "mkios_ai_convs_v107";
  function aiLoadLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(AI_LOCAL_KEY) || "{}");
      const arr = raw && raw[aiUserEmail()];
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  function aiSaveLocal() {
    try {
      const raw = JSON.parse(localStorage.getItem(AI_LOCAL_KEY) || "{}");
      raw[aiUserEmail()] = aiState.convs.slice(0, 30).map((c) => ({ id: c.id, title: c.title, updatedAt: c.updatedAt, messages: (c.messages || []).slice(-50) }));
      localStorage.setItem(AI_LOCAL_KEY, JSON.stringify(raw));
    } catch (e) {}
  }
  // Trộn 2 nguồn theo id, bản nào updatedAt mới hơn thì thắng — không bao giờ xoá trắng conv đang mở.
  function aiMergeConvs(a, b) {
    const byId = new Map();
    [].concat(a || [], b || []).forEach((c) => {
      if (!c || !c.id) return;
      const cur = byId.get(c.id);
      if (!cur || (c.updatedAt || 0) > (cur.updatedAt || 0)) byId.set(c.id, c);
    });
    return Array.from(byId.values()).sort((x, y) => (y.updatedAt || 0) - (x.updatedAt || 0));
  }
  function aiLoadHistory() {
    const local = aiMergeConvs(aiState.convs, aiLoadLocal());
    return apiFetch(AI_HISTORY_URL + "?email=" + encodeURIComponent(aiUserEmail()), { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => { aiState.convs = aiMergeConvs(d && d.ok && Array.isArray(d.convs) ? d.convs : [], local); })
      .catch(() => { aiState.convs = local; })
      .then(() => { aiState.loaded = true; });
  }
  function aiSaveConv(conv) {
    aiSaveLocal(); // ghi máy ngay, server thì gộp debounce 2s như cũ
    clearTimeout(aiSaveTimer);
    aiSaveTimer = setTimeout(() => {
      apiFetch(AI_HISTORY_URL, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: aiUserEmail(), action: "save", conv: { id: conv.id, title: conv.title, updatedAt: conv.updatedAt, messages: conv.messages.slice(-50) } }) }).catch(() => {});
    }, 2000);
  }
  function aiNewConv(activate) {
    const conv = { id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: "Hội thoại mới", updatedAt: Date.now(), messages: [] };
    aiState.convs.unshift(conv);
    aiState.activeId = conv.id;
    if (activate) { aiRenderConvList(); aiRenderMessages(); const i = $("#ai-input"); if (i) i.focus(); }
    return conv;
  }
  function aiSelectConv(id) { aiState.activeId = id; aiRenderConvList(); aiRenderMessages(); }
  function aiDeleteConv(id) {
    aiState.convs = aiState.convs.filter((c) => c.id !== id);
    if (aiState.activeId === id) aiState.activeId = aiState.convs[0] ? aiState.convs[0].id : null;
    aiSaveLocal(); // R4: bỏ khỏi bản dự phòng, nếu không lần merge sau nó sống lại
    apiFetch(AI_HISTORY_URL, { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: aiUserEmail(), action: "delete", id }) }).catch(() => {});
    aiRenderConvList(); aiRenderMessages();
  }

  function aiRenderConvList() {
    const el = $("#ai-conv-list"); if (!el) return;
    if (!aiState.convs.length) { el.innerHTML = `<div class="ai-conv-empty">Chưa có hội thoại.<br>Bấm “＋ Hội thoại mới”.</div>`; return; }
    el.innerHTML = aiState.convs.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map((c) => {
      const active = c.id === aiState.activeId ? " active" : "";
      const n = (c.messages || []).length;
      return `<div class="ai-conv-item${active}" data-ai-conv="${esc(c.id)}">
        <div class="ai-conv-main"><div class="ai-conv-title">${esc(c.title || "Hội thoại")}</div><div class="ai-conv-sub">${esc(aiWhen(c.updatedAt))} · ${n} tin</div></div>
        <button class="ai-conv-del" data-ai-del="${esc(c.id)}" title="Xóa hội thoại">${icon("trash", 14)}</button>
      </div>`;
    }).join("");
  }

  function aiRenderMessages() {
    const box = $("#ai-messages"); if (!box) return;
    const conv = aiActiveConv();
    const msgs = conv ? conv.messages : [];
    let html;
    if (!msgs.length) {
      html = `<div class="ai-empty">${icon("bot", 42)}<h3>Trợ lý Markus AI</h3><p>Hỏi mình tìm KOL, phân tích CSDL, viết brief hoặc xuất báo giá.</p></div>`;
    } else {
      html = msgs.map(aiMsgHtml).join("");
    }
    if (aiState.busy) html += aiTypingHtml();
    box.innerHTML = html;
    const st = $("#ai-status"); if (st) st.textContent = aiState.busy ? "DeepSeek · đang trả lời…" : "DeepSeek · sẵn sàng";
    const sb = $("#ai-send"); if (sb) sb.disabled = aiState.busy;
    box.scrollTop = box.scrollHeight;
  }
  function aiTypingHtml() {
    return `<div class="ai-msg ai-msg-bot"><span class="ai-av ai-av-bot">${icon("bot", 16)}</span><div class="ai-bubble"><div class="ai-typing"><span></span><span></span><span></span></div></div></div>`;
  }
  function aiMsgHtml(m) {
    const isUser = m.role === "user";
    const av = isUser ? `<span class="ai-av ai-av-user">${esc(aiUserInitial())}</span>` : `<span class="ai-av ai-av-bot">${icon("bot", 16)}</span>`;
    const cards = (m.cards && m.cards.length) ? `<div class="ai-cards">${m.cards.map(aiKolCard).join("")}</div>` : "";
    const note = m.toolNote ? `<div class="ai-toolnote">${esc(m.toolNote)}</div>` : "";
    const body = isUser ? esc(m.content) : mdToHtml(m.content);
    return `<div class="ai-msg ${isUser ? "ai-msg-user" : "ai-msg-bot"}">${av}<div class="ai-bubble"><div class="ai-md">${body}</div>${cards}${note}</div></div>`;
  }
  function aiKolCard(k) {
    const price = can("private") ? fmtVND(k.estimatedPrice || 0) : "•••";
    const inCart = cartHas(k.id);
    return `<div class="ai-kol-card${inCart ? " in-cart" : ""}">
      <span class="ai-kol-av avatar ${avatarClass(k)}">${esc(initials(k.name))}</span>
      <div class="ai-kol-info">
        <div class="ai-kol-name">${esc(k.name || "—")}</div>
        <div class="ai-kol-meta">${esc(k.tier || "—")} · ${esc(k.niche || "—")} · ${fmtFollowers(k.followers || 0)} follower · ${esc(normRegion(k.region) || "—")}</div>
        <div class="ai-kol-price">${price}</div>
      </div>
      <button class="btn btn-sm ${inCart ? "btn-ghost ai-kol-incart" : "btn-primary"} ai-kol-add" data-ai-cart="${esc(k.id)}" ${!can("shortlist") ? "disabled" : ""} title="${inCart ? "Bấm để bỏ khỏi giỏ" : "Thêm vào giỏ hàng Booking"}">${inCart ? icon("check", 13) + " Trong giỏ" : icon("cart", 13) + " Thêm giỏ"}</button>
    </div>`;
  }

  /* ---- Markdown an toàn XSS: escape trước, thay regex sau (item 18) ---- */
  function mdToHtml(text) {
    let s = esc(String(text == null ? "" : text));
    const blocks = [];
    s = s.replace(/```(?:[a-z0-9]*\n)?([\s\S]*?)```/gi, (m, code) => { blocks.push(`<pre>${code.replace(/\n+$/, "")}</pre>`); return " B" + (blocks.length - 1) + " "; });
    s = s.replace(/`([^`\n]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    const lines = s.split("\n");
    let html = "", listType = null;
    const closeList = () => { if (listType) { html += "</" + listType + ">"; listType = null; } };
    lines.forEach((line) => {
      let m;
      if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
        if (listType !== "ul") { closeList(); html += "<ul>"; listType = "ul"; }
        html += `<li>${m[1]}</li>`;
      } else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
        if (listType !== "ol") { closeList(); html += "<ol>"; listType = "ol"; }
        html += `<li>${m[1]}</li>`;
      } else if (line.trim() === "") {
        closeList();
      } else {
        closeList();
        html += line + "<br>";
      }
    });
    closeList();
    html = html.replace(/ B(\d+) /g, (m, i) => blocks[Number(i)] || "");
    return html.replace(/(<br>)+$/g, "");
  }

  /* ---- Gọi DeepSeek qua PHP proxy (item 15) ---- */
  function aiChatApi(messages, withTools) {
    const body = { messages, system: AI_SYSTEM_PROMPT };
    if (withTools) body.tools = AI_TOOLS;
    return apiFetch(AI_CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then((r) => r.json())
      .catch(() => ({ ok: false, error: "network" }));
  }

  /* ---- Thực thi tool phía client (item 16) ---- */
  /* CSDL lưu niche bằng tiếng Anh — map từ khóa tiếng Việt sang để tool search_kol không trả 0 kết quả */
  const AI_NICHE_VI = {
    "làm đẹp": "beauty", "mỹ phẩm": "beauty", "đẹp": "beauty",
    "ẩm thực": "f&b", "ăn uống": "f&b", "món ăn": "f&b", "đồ ăn": "f&b", food: "f&b",
    "mẹ và bé": "mom", "mẹ bỉm": "mom", "bỉm sữa": "mom", "em bé": "mom",
    "âm nhạc": "music", "ca sĩ": "music", "nhạc": "music",
    "ô tô": "auto", xe: "auto",
    "sức khỏe": "fitness", "thể hình": "fitness", gym: "fitness", yoga: "fitness",
    "tài chính": "finance", "kinh doanh": "finance",
    "công nghệ": "tech", tech: "tech",
    "nhà cửa": "home", "nội thất": "home",
    "du lịch": "travel",
    "giáo dục": "education", "học tập": "education",
    "thời trang": "fashion",
    "đời sống": "lifestyle", "phong cách sống": "lifestyle",
  };
  function aiNicheKeywords(keyword) {
    const k = String(keyword || "").trim().toLowerCase();
    if (!k) return [];
    const out = [k];
    Object.keys(AI_NICHE_VI).forEach((vi) => { if (k.includes(vi) && !out.includes(AI_NICHE_VI[vi])) out.push(AI_NICHE_VI[vi]); });
    return out;
  }
  function aiSearchKol(a) {
    a = a || {};
    const db = state.kolDb || [];
    const niches = aiNicheKeywords(a.niche);
    const nicheHit = (v) => { const s = String(v || "").toLowerCase(); return !!s && niches.some((n) => s.includes(n) || n.includes(s)); };
    const region = normRegion(a.region).toLowerCase();
    const tier = String(a.tier || "").toLowerCase();
    const minF = Number(a.minFollowers) || 0;
    const maxB = Number(a.maxBudget) || 0;
    const matched = db.filter((k) => {
      if (niches.length && !(nicheHit(k.niche) || nicheHit(k.niche2))) return false;
      if (region && !normRegion(k.region).toLowerCase().includes(region)) return false;
      if (tier && !String(k.tier || "").toLowerCase().includes(tier)) return false;
      if ((k.followers || 0) < minF) return false;
      if (maxB > 0 && (k.estimatedPrice || 0) > maxB) return false;
      return true;
    });
    const top = matched.slice().sort((x, y) => (y.followers || 0) - (x.followers || 0)).slice(0, 5);
    return { count: matched.length, top };
  }
  function aiStats() {
    const db = state.kolDb || [];
    const t = cartTotals();
    return {
      tongKol: db.length,
      daBaoGia: db.filter((x) => /đã báo giá/i.test(x.relationship || "")).length,
      daHopTac: db.filter((x) => /đã hợp tác/i.test(x.relationship || "")).length,
      trongGio: t.count,
      tongBudgetGio: t.totalBudget,
    };
  }
  function aiExecTool(name, args) {
    args = args || {};
    if (name === "search_kol") {
      const res = aiSearchKol(args);
      return { forModel: { count: res.count, results: res.top.map((k) => ({ id: k.id, name: k.name, tier: k.tier, niche: k.niche, followers: k.followers, region: normRegion(k.region), estimatedPrice: k.estimatedPrice })) }, cards: res.top };
    }
    if (name === "add_to_cart") {
      const ids = Array.isArray(args.ids) ? args.ids : (args.ids ? [args.ids] : []);
      const addedNames = [], already = [], notFound = [];
      ids.forEach((id) => {
        const rec = (state.kolDb || []).find((k) => k.id === id);
        if (!rec) { notFound.push(id); return; }           // R4: id bịa → báo rõ, không im lặng
        if (cartHas(id)) { already.push(rec.name); return; }
        toggleCart("kol", id, true, true);
        addedNames.push(rec.name);
      });
      if (addedNames.length) cartBadgePulse(addedNames.length, true);
      return { forModel: {
        added: addedNames.length, addedNames, alreadyInCart: already, notFound,
        cartCount: cartCount(),
        note: notFound.length ? "Các id trong notFound KHÔNG tồn tại trong CSDL — hãy gọi search_kol để lấy id đúng, đừng báo là đã thêm." : "",
      } };
    }
    if (name === "export_quote") { exportShortlist(); return { forModel: { status: "đã xuất báo giá" } }; }
    if (name === "get_stats") { return { forModel: aiStats() }; }
    return { forModel: { error: "unknown tool" } };
  }
  function aiToolNote(name, args, r) {
    if (name === "search_kol") return `→ tool search_kol(${aiArgsBrief(args)}) · ${r.forModel.count} kết quả`;
    if (name === "add_to_cart") {
      const f = r.forModel;
      const bits = [`đã thêm ${f.added}`];
      if (f.alreadyInCart && f.alreadyInCart.length) bits.push(`${f.alreadyInCart.length} đã có sẵn`);
      if (f.notFound && f.notFound.length) bits.push(`${f.notFound.length} id không tồn tại`);
      return `→ tool add_to_cart · ${bits.join(" · ")} · giỏ: ${f.cartCount}`;
    }
    if (name === "export_quote") return "→ tool export_quote · đã xuất báo giá";
    if (name === "get_stats") return "→ tool get_stats";
    return "→ tool " + name;
  }
  function aiArgsBrief(a) {
    return Object.keys(a || {}).filter((k) => a[k] !== "" && a[k] != null).map((k) => k + ":" + a[k]).join(", ") || "—";
  }

  async function aiSend(text) {
    text = String(text || "").trim();
    if (!text || aiState.busy) return;
    let conv = aiActiveConv() || aiNewConv();
    conv.messages.push({ role: "user", content: text });
    if (!conv.title || conv.title === "Hội thoại mới") conv.title = text.slice(0, 60);
    conv.updatedAt = Date.now();
    aiState.busy = true;
    const input = $("#ai-input"); if (input) { input.value = ""; input.style.height = "auto"; }
    aiRenderConvList();
    aiRenderMessages();
    try {
      // R4 (mục 8) — LỖI GỐC: lịch sử lưu server có assistant.tool_calls nhưng THIẾU reasoning_content
      // (lưu từ bản trước fix) → DeepSeek trả 400 → rơi vào fallback no-tools → AI "bịa" là đã thêm giỏ.
      // Gửi lại lịch sử CHỈ role + content (bỏ hẳn message role "tool" để không mồ côi tool_call_id).
      let apiMsgs = conv.messages
        .filter((m) => m.role !== "tool")
        .map((m) => ({ role: m.role, content: m.content || "" }));
      let data = await aiChatApi(apiMsgs, true);
      // Fallback (item 16): API lỗi (có thể do function calling) → thử lại chat thuần không tool
      if (!data.ok) data = await aiChatApi(apiMsgs, false);
      if (!data.ok) throw new Error(data.error || "AI lỗi");
      let cards = [], notes = [], guard = 0;
      while (data.ok && data.message && Array.isArray(data.message.tool_calls) && data.message.tool_calls.length && guard < 3) {
        guard++;
        // 1.0.7 (item 8): DeepSeek thinking mode bắt buộc trả `reasoning_content` NGUYÊN VẸN
        // kèm tool_calls; thiếu nó API trả 400 và vòng lặp tool chết (giỏ hàng không cập nhật).
        apiMsgs.push({
          role: "assistant",
          content: data.message.content || "",
          reasoning_content: data.message.reasoning_content || "",
          tool_calls: data.message.tool_calls,
        });
        data.message.tool_calls.forEach((tc) => {
          let a = {}; try { a = JSON.parse((tc.function && tc.function.arguments) || "{}"); } catch (e) {}
          const r = aiExecTool(tc.function.name, a);
          if (r.cards) cards = cards.concat(r.cards);
          notes.push(aiToolNote(tc.function.name, a, r));
          apiMsgs.push({ role: "tool", tool_call_id: tc.id, content: JSON.stringify(r.forModel) });
        });
        data = await aiChatApi(apiMsgs, true);
      }
      const content = (data.ok && data.message && data.message.content) || "(AI không trả nội dung)";
      conv.messages.push({ role: "assistant", content, cards, toolNote: notes.join(" · ") });
      conv.updatedAt = Date.now();
      aiSaveConv(conv);
    } catch (e) {
      toast("AI đang bận", "Thử lại sau ít phút.", "danger");
      conv.messages.push({ role: "assistant", content: "Xin lỗi, AI đang bận hoặc lỗi kết nối. Bạn thử lại nhé.", cards: [], toolNote: "" });
    } finally {
      aiState.busy = false;
      aiRenderConvList();
      aiRenderMessages();
    }
  }

  /* ============================================================
     Thành phần layout dùng chung
     ============================================================ */
  function pageHead(title, sub, actions) {
    return `<div class="page-head"><div><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class="page-head-actions">${actions || ""}</div></div>`;
  }
  /* 1.0.2: Nhắc refresh thứ 2 hằng tuần (chỉ số KOL/Community)
     Netlify Scheduled Function sẽ chạy 7h sáng thứ 2 — bản này dùng banner + lastRefreshed. */
  const REFRESH_KEY = "mkios_last_refresh_v102";
  function refreshDue() {
    try {
      const last = new Date(localStorage.getItem(REFRESH_KEY) || 0);
      const now = new Date();
      const days = (now - last) / 86400000;
      return days >= 7;
    } catch (e) { return true; }
  }
  function markRefreshed() {
    try { localStorage.setItem(REFRESH_KEY, new Date().toISOString()); } catch (e) {}
  }
  function renderRefreshBanner() {
    if (!refreshDue()) return "";
    return `<div class="refresh-banner">🔄 <strong>Đến hạn refresh chỉ số</strong> — Số follower/views có thể đã cũ (≥7 ngày). Planner cập nhật thứ 2 hằng tuần để dữ liệu luôn mới. <button class="btn btn-ghost btn-sm" data-action="mark-refreshed" style="margin-left:auto">✓ Đã cập nhật xong</button></div>`;
  }
  // Hiện banner ở đầu các trang chính
  function withRefreshBanner(html) {
    return renderRefreshBanner() + html;
  }
  function miniStat(label, value, tone) {
    const color = tone === "success" ? "var(--success)" : tone === "warning" ? "var(--warning)" : tone === "danger" ? "var(--danger)" : "var(--text)";
    return `<div class="kpi"><div class="kpi-value" style="color:${color}">${esc(value)}</div><div class="kpi-label">${esc(label)}</div></div>`;
  }
  function emptyState(icon, text) { return `<div class="empty"><div class="big">${icon}</div>${esc(text)}</div>`; }
  function optionList(map, selected, allLabel) {
    let out = allLabel ? `<option value="">${esc(allLabel)}</option>` : "";
    out += Object.entries(map).map(([k, v]) => `<option value="${k}" ${k === selected ? "selected" : ""}>${esc(v.label)}</option>`).join("");
    return out;
  }
  function setContent(html) { $("#content").innerHTML = html; scheduleScrollHints(); }

  /* ---------- 1.0.13 (Mục B1/B3 + D1): hint kéo ngang + placeholder theo bề ngang thật ----------
     Trên mobile thanh cuộn ngang là overlay (ẩn khi không chạm) → người dùng tưởng bảng mất cột.
     Bảng nào tràn ngang thì gắn cờ .has-xscroll + chèn dải nhắc "Kéo ngang…" ngay trên bảng. */
  let scrollHintTimer = null;
  function scheduleScrollHints() {
    clearTimeout(scrollHintTimer);
    scrollHintTimer = setTimeout(updateScrollHints, 80);
  }
  function updateScrollHints() {
    $$(".table-wrap").forEach((w) => {
      const over = w.scrollWidth - w.clientWidth > 4;
      w.classList.toggle("has-xscroll", over);
      const prev = w.previousElementSibling;
      const hint = prev && prev.classList && prev.classList.contains("xscroll-hint") ? prev : null;
      if (over && !hint && w.parentNode) {
        const el = document.createElement("div");
        el.className = "xscroll-hint";
        el.textContent = "Kéo ngang để xem thêm cột";
        w.parentNode.insertBefore(el, w);
      } else if (!over && hint) {
        hint.remove();
      }
    });
    syncSearchPlaceholder();
  }
  // D1: placeholder dài bị cắt giữa chừng trên mobile → rút gọn theo bề ngang thật
  function syncSearchPlaceholder() {
    const el = $("#global-search");
    if (el) el.placeholder = window.innerWidth <= 640 ? "Tìm kiếm…" : "Tìm KOL, group, chiến dịch…";
  }
  window.addEventListener("resize", scheduleScrollHints);

  /* ============================================================
     Modal
     ============================================================ */
  let modalSubmit = null;
  function openModal(title, bodyHtml, onSubmit, submitLabel, wide) {
    $("#modal-title").textContent = title;
    // 1.0.10 (Mục 3): reset + bật modal--wide mỗi lần mở (chỉ form KOL truyền wide=true)
    $("#modal-overlay").querySelector(".modal").classList.toggle("modal--wide", !!wide);
    const form = $("#modal-form");
    form.innerHTML = bodyHtml + `<div class="form-actions">
      <button type="button" class="btn btn-ghost" id="modal-cancel">Hủy</button>
      <button type="submit" class="btn btn-primary">${esc(submitLabel || "Lưu")}</button>
    </div>`;
    modalSubmit = onSubmit;
    $("#modal-overlay").hidden = false;
    $("#modal-cancel").addEventListener("click", closeModal);
    const first = form.querySelector("input, select, textarea");
    if (first) setTimeout(() => first.focus(), 30);
  }
  function closeModal() {
    $("#modal-overlay").hidden = true;
    $("#modal-form").innerHTML = "";
    modalSubmit = null;
  }
  function formData(form) {
    const data = {};
    $$("input, select, textarea", form).forEach((el) => {
      if (!el.name) return;
      data[el.name] = el.type === "checkbox" ? el.checked : el.value;
    });
    return data;
  }

  /* ============================================================
     Toast
     ============================================================ */
  function toast(title, msg, kind) {
    const el = document.createElement("div");
    el.className = "toast " + (kind || "");
    el.innerHTML = `<strong>${esc(title)}</strong><small>${esc(msg || "")}</small>`;
    $("#toast-stack").appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .3s"; }, 2600);
    setTimeout(() => el.remove(), 3000);
  }

  /* ============================================================
     Xóa có xác nhận
     ============================================================ */
  function confirmDelete(list, id, label, after) {
    if (!list.find((x) => x.id === id)) return;
    if (confirm(`Xóa ${label} này? Hành động không thể hoàn tác.`)) {
      list.splice(list.findIndex((x) => x.id === id), 1);
      save(); after();
      toast("Đã xóa", `${label} đã được xóa.`, "danger");
    }
  }

  /* ============================================================
     Xuất CSV
     ============================================================ */
  function downloadCSV(filename, rows) {
    const csv = rows.map((r) => r.map((c) => {
      const s = String(c == null ? "" : c);
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    }).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
    toast("Đã xuất file", filename, "success");
  }
  /* 1.0.11 (Mục B7) — CSV của bảng KOL: lấy đúng tập đang lọc + đang sắp xếp, cột cố định
     (name/handle/tier/platform/followers/price/verify) cộng thêm các cột tuỳ chọn đang bật. */
  function exportBookingCsv() {
    if (!can("export")) { toast("Không có quyền", "Chỉ Admin/Planner xuất được file.", "danger"); return; }
    const isKol = bookingUi.type === "kol";
    const rows = sortedBookingRows(filteredBookingRows());
    if (!rows.length) { toast("Không có dữ liệu", "Bộ lọc hiện tại không còn dòng nào để xuất.", "warning"); return; }
    const cols = bkVisibleCols();
    const show = (c) => cols.includes(c);
    const head = ["Tên", "Handle", "Tier", "Nền tảng chính", "Follower"];
    const get = [(x) => x.name, (x) => x.handle || "", (x) => x.tier || "", (x) => (PLATFORMS[x.platform] || {}).label || x.platform || "", (x) => (isKol ? x.followers : x.membersFollowers) || 0];
    PLATFORM_COL_KEYS.forEach((k) => {
      if (!isKol || !show("ft_" + k)) return;
      head.push("Follower " + (PLATFORMS[k] || {}).label);
      get.push((x) => ((x.platStats || {})[k] || {}).followers || 0);
    });
    if (show("niche")) { head.push("Ngành hàng"); get.push((x) => (isKol ? x.niche : x.topic) || ""); }
    if (show("niche2")) { head.push("Ngành hàng phụ"); get.push((x) => x.niche2 || ""); }
    if (show("gender")) { head.push("Casting profile"); get.push((x) => x.gender || ""); }
    if (show("region")) { head.push("Khu vực"); get.push((x) => normRegion(x.region)); }
    if (show("work_history")) { head.push("Lịch sử làm việc"); get.push((x) => x.workHistory || x.relationship || ""); }
    head.push("Giá ước tính"); get.push((x) => x.estimatedPrice || 0);
    if (isKol) PRICE_COL_META.forEach(([ck, key, label]) => {
      if (!show(ck)) return;
      head.push("Giá " + label);
      get.push((x) => ((x.priceByFormat || {})[key] || {}).amount || 0);
    });
    if (show("contact")) { head.push("Liên hệ"); get.push((x) => (isKol ? x.contact : x.adminContact) || ""); }
    head.push("Trạng thái quan hệ"); get.push((x) => verifyMeta(x.verifyStatus).label);
    const out = [head].concat(rows.map((x) => get.map((f) => f(x))));
    downloadCSV("markus-kol-export.csv", out);
  }
  function exportKols() {
    const rows = [["Tên", "Handle", "Nền tảng", "Cấp độ", "Lĩnh vực", "Follower", "Tương tác(%)", "Giá/bài", "Trạng thái", "Khu vực", "Email", "SĐT"]];
    filteredKols().forEach((k) => rows.push([
      k.name, k.handle, (PLATFORMS[k.platform] || {}).label, (TIERS[k.tier] || {}).label,
      k.niche, k.followers, k.engagement, k.rate, (KOL_STATUS[k.status] || {}).label, k.location, k.email, k.phone,
    ]));
    downloadCSV("kol-koc.csv", rows);
  }
  function exportReport() {
    const rows = [["Chiến dịch", "Thương hiệu", "Trạng thái", "Ngân sách", "Đã chi", "Bắt đầu", "Kết thúc", "Số KOL"]];
    state.campaigns.forEach((c) => rows.push([
      c.name, c.brand, (CAMP_STATUS[c.status] || {}).label, c.budget, c.spent, c.start, c.end, (c.kols || []).length,
    ]));
    downloadCSV("bao-cao-chien-dich.csv", rows);
  }

  /* ============================================================
     Xử lý sự kiện toàn cục (event delegation)
     ============================================================ */
  document.addEventListener("click", (e) => {
    const moveBtn = e.target.closest("[data-move]");
    if (moveBtn) { e.stopPropagation(); if (!can("manage")) { toast("Không có quyền", "Vai trò của bạn chỉ được xem.", "danger"); return; } moveDeal(moveBtn.dataset.id, moveBtn.dataset.move); return; }

    const tabBtn = e.target.closest("[data-stage-tab]");
    if (tabBtn) { pipelineUi.stage = tabBtn.dataset.stageTab; drawKanban(); return; }

    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "edit-deal" && e.target.closest("[data-noedit]")) return;

    const id = el.dataset.id;
    if (/^(add|edit|mark)-(camp|deal|content|pay)$|^mark-paid$/.test(el.dataset.action) && !can("manage")) { toast("Không có quyền", "Vai trò của bạn chỉ được xem.", "danger"); return; }
    if (/^del-(camp|content|pay)$/.test(el.dataset.action) && !can("delete")) { toast("Không có quyền", "Chỉ Admin được xóa.", "danger"); return; }
    switch (el.dataset.action) {
      case "add-kol":
        openModal("Thêm KOL / KOC", kolForm(), (d) => { saveKol(d); afterMutate(); toast("Đã thêm", "KOL/KOC mới đã được lưu.", "success"); });
        break;
      case "edit-kol":
        openModal("Chỉnh sửa KOL / KOC", kolForm(kolById(id)), (d) => { saveKol(d, id); afterMutate(); toast("Đã cập nhật", "Thông tin đã được lưu.", "success"); });
        break;
      case "del-kol": confirmDelete(state.influencers, id, "KOL/KOC", router); break;
      case "export-kol": exportKols(); break;

      case "add-camp":
        openModal("Tạo chiến dịch", campForm(), (d) => { saveCamp(d); afterMutate(); toast("Đã tạo", "Chiến dịch mới đã được lưu.", "success"); });
        break;
      case "edit-camp":
        openModal("Chỉnh sửa chiến dịch", campForm(campById(id)), (d) => { saveCamp(d, id); afterMutate(); toast("Đã cập nhật", "Chiến dịch đã được lưu.", "success"); });
        break;
      case "del-camp": confirmDelete(state.campaigns, id, "chiến dịch", router); break;

      case "add-deal":
        if (!workflowKolPool().length) { toast("Thiếu KOL/KOC", "Hãy thêm KOL/KOC trước.", "danger"); break; }
        openModal("Thêm hợp đồng", dealForm(), (d) => { saveDeal(d); afterMutate(); toast("Đã thêm", "Hợp đồng mới đã được lưu.", "success"); });
        break;
      case "edit-deal":
        openModal("Chỉnh sửa hợp đồng", dealForm(state.deals.find((x) => x.id === id)), (d) => { saveDeal(d, id); afterMutate(); toast("Đã cập nhật", "Hợp đồng đã được lưu.", "success"); });
        break;

      case "add-content":
        if (!workflowKolPool().length) { toast("Thiếu KOL/KOC", "Hãy thêm KOL/KOC trước.", "danger"); break; }
        openModal("Thêm nội dung", contentForm(), (d) => { saveContent(d); afterMutate(); toast("Đã thêm", "Nội dung mới đã được lưu.", "success"); });
        break;
      case "edit-content":
        openModal("Chỉnh sửa nội dung", contentForm(state.contents.find((x) => x.id === id)), (d) => { saveContent(d, id); afterMutate(); toast("Đã cập nhật", "Nội dung đã được lưu.", "success"); });
        break;
      case "del-content": confirmDelete(state.contents, id, "nội dung", router); break;

      case "add-pay":
        openModal("Thêm hóa đơn", payForm(), (d) => { savePay(d); afterMutate(); toast("Đã thêm", "Hóa đơn mới đã được lưu.", "success"); });
        break;
      case "edit-pay":
        openModal("Chỉnh sửa hóa đơn", payForm(state.payments.find((x) => x.id === id)), (d) => { savePay(d, id); afterMutate(); toast("Đã cập nhật", "Hóa đơn đã được lưu.", "success"); });
        break;
      case "del-pay": confirmDelete(state.payments, id, "hóa đơn", router); break;
      case "mark-paid": {
        const p = state.payments.find((x) => x.id === id);
        if (p) { p.status = "paid"; save(); drawPayments(); toast("Đã thanh toán", `Hóa đơn ${p.invoice} đã tất toán.`, "success"); }
        break;
      }
      case "export-report": exportReport(); break;

      case "add-booking": {
        const isKol = bookingUi.type === "kol";
        if (isKol) openModal("Thêm KOL/KOC", kolDbForm(), (d) => { saveKolDb(d); afterMutateBooking(); toast("Đã thêm", "KOL/KOC mới đã lưu vào Daily Research.", "success"); }, "Lưu", true); // 1.0.10: modal--wide
        else openModal("Thêm Group/Page", communityDbForm(), (d) => { saveCommunityDb(d); afterMutateBooking(); toast("Đã thêm", "Group/Page mới đã lưu vào Daily Research.", "success"); });
        break;
      }
      case "edit-booking": {
        const isKolKind = el.dataset.kind === "kol";
        const rec = isKolKind ? state.kolDb.find((x) => x.id === id) : state.communityDb.find((x) => x.id === id);
        if (!rec) break;
        if (isKolKind) openModal("Sửa KOL/KOC", kolDbForm(rec), (d) => { saveKolDb(d, id); afterMutateBooking(); toast("Đã cập nhật", "", "success"); }, "Lưu", true); // 1.0.10: modal--wide
        else openModal("Sửa Group/Page", communityDbForm(rec), (d) => { saveCommunityDb(d, id); afterMutateBooking(); toast("Đã cập nhật", "", "success"); });
        break;
      }
      case "del-booking": {
        const isKolKind = el.dataset.kind === "kol";
        const list = isKolKind ? state.kolDb : state.communityDb;
        confirmDelete(list, id, isKolKind ? "KOL/KOC" : "Group/Page", () => { drawFlowStepper(); drawBookingTable(); drawShortlistBar(); });
        break;
      }
      case "verify-booking": {
        const isKolKind = el.dataset.kind === "kol";
        const rec = isKolKind ? state.kolDb.find((x) => x.id === id) : state.communityDb.find((x) => x.id === id);
        if (rec) {
          if (isKolKind) persistCreator(rec, { verifyStatus: "verified", stage: "verified" });
          else { rec.verifyStatus = "verified"; rec.stage = "verified"; save(); }
          drawFlowStepper(); drawBookingTable();
          toast("Đã duyệt", `${rec.name} đã chuyển sang Verified Database.`, "success");
        }
        break;
      }
      case "view-booking": {
        const isKolKind = el.dataset.kind === "kol";
        const rec = isKolKind ? state.kolDb.find((x) => x.id === id) : state.communityDb.find((x) => x.id === id);
        if (rec) viewBookingDetail(isKolKind, rec);
        break;
      }
      case "customize-cols": {
        const cur = bkVisibleCols();
        const isKol = bookingUi.type === "kol";
        // 1.0.5: 4 cột con nền tảng lên đầu, kèm icon để nhận diện nhanh
        const platBoxes = isKol ? PLATFORM_COL_KEYS.map((k) => {
          const pl = PLATFORMS[k];
          return `<label class="col-toggle col-toggle-plat pf-${k}"><input type="checkbox" value="ft_${k}" ${cur.includes("ft_" + k) ? "checked" : ""} /><span class="ct-plat-ico">${pl.icon}</span> ${esc(pl.label)}</label>`;
        }).join("") : "";
        // 1.0.12 (Mục C6): panel liệt kê ĐỦ mọi cột bật/tắt được; chk + name cố định (checkbox khoá)
        const boxes = Object.entries(BK_OPTIONAL_COLS)
          .filter(([k]) => {
            const kolOnly = k === "tier" || k === "gender" || k === "niche2" || k.indexOf("price_") === 0;
            if (kolOnly && !isKol) return false;   // cột chỉ dành cho KOL
            if (k === "reach" && isKol) return false; // Members chỉ cho Community
            return true;
          })
          .map(([k, label]) => `<label class="col-toggle"><input type="checkbox" value="${k}" ${cur.includes(k) ? "checked" : ""} /> ${esc(label)}</label>`).join("");
        const fixedBoxes = [["chk", "Ô chọn"], ["name", isKol ? "Tên KOL / KOC" : "Tên Group / Page"]]
          .map(([k, label]) => `<label class="col-toggle col-toggle-fixed"><input type="checkbox" value="${k}" checked disabled /> ${esc(label)} <small class="muted">(cố định)</small></label>`).join("");
        const html = `<div class="form-grid"><div class="form-field full"><label>Chọn cột hiển thị trong bảng</label>
          <div class="col-toggle-list">${fixedBoxes}</div>
          ${platBoxes ? `<div class="col-toggle-list col-toggle-plats">${platBoxes}</div>` : ""}
          <div class="col-toggle-list">${boxes}</div>
          <p class="muted" style="font-size:12.5px;margin:8px 0 0">Ô chọn và tên luôn hiển thị. Bật nhiều cột có thể phải cuộn ngang — chọn “💾 Lưu bộ cột hiện tại thành mẫu…” trong dropdown bộ cột để giữ lại bộ cột ưng ý.</p></div></div>`;
        openModal("Tuỳ chỉnh cột hiển thị", html, () => {
          // checkbox cố định đang disabled → không nằm trong :checked, tự thêm lại ở bkVisibleCols()
          bookingUi.customCols = ["chk", "name"].concat(
            [...document.querySelectorAll('#modal-form input[type="checkbox"]:checked:not(:disabled)')].map((i) => i.value)
          );
          bookingUi.view = "custom";
          bkColPresetSel = ""; // 1.0.14: sửa cột tay → dropdown về "Tùy chọn", không còn bám mẫu cũ
          saveColView();
          closeModal();
          renderBookingPage();
          toast("Đã áp dụng", "Cột hiển thị đã cập nhật (View: Tùy chọn).", "success");
        }, "Áp dụng");
        break;
      }
      case "seed-shortlist": {
        const verifiedKol = state.kolDb.filter((x) => x.stage === "verified").slice(0, 4);
        const verifiedComm = state.communityDb.filter((x) => x.stage === "verified").slice(0, 2);
        if (!verifiedKol.length && !verifiedComm.length) { toast("Chưa có dữ liệu verify", "Hãy verify vài KOL/Community trước.", "warning"); break; }
        const sl = getShortlist();
        verifiedKol.forEach((x) => { if (!sl.kol.includes(x.id)) sl.kol.push(x.id); });
        verifiedComm.forEach((x) => { if (!sl.community.includes(x.id)) sl.community.push(x.id); });
        save(); drawShortlistPageBody();
        toast("Đã tạo giỏ hàng demo", `${verifiedKol.length} KOL · ${verifiedComm.length} Community đã thêm.`, "success");
        break;
      }
      case "add-user":
        openModal("Thêm người dùng", userForm(), (d) => {
          saveUser(d).then((err) => {
            if (err) { toast("Chưa lưu được", err, "danger"); return; }
            closeModal(); drawUsersTable(); toast("Đã thêm", "Tài khoản mới đã ghi vào tab Employees.", "success");
          });
        }, "Tạo tài khoản");
        break;
      case "edit-user": {
        const mail = el.dataset.email;
        const u = employees.find((x) => x.email === mail);
        if (!u) break;
        openModal("Sửa người dùng", userForm(u), (d) => {
          saveUser(d, mail).then((err) => {
            if (err) { toast("Chưa lưu được", err, "danger"); return; }
            closeModal(); drawUsersTable(); toast("Đã cập nhật", "Thông tin tài khoản đã được lưu lên Google Sheet.", "success");
          });
        });
        break;
      }
      case "del-user": {
        const mail = el.dataset.email;
        const u = employees.find((x) => x.email === mail);
        if (!u) break;
        if (u.role === "admin" && employees.filter((x) => x.role === "admin").length <= 1) {
          toast("Không xóa được", "Phải còn ít nhất một tài khoản Admin.", "danger"); break;
        }
        // 1.0.7 (item 5d): xoá là ghi thẳng lên sheet → luôn hỏi lại trước
        if (!confirm(`Xóa ${u.name} (${u.email}) khỏi tab Employees? Người này sẽ không đăng nhập được nữa.`)) break;
        employeesApi({ op: "delete", email: mail }).then((r) => {
          if (!r || !r.ok) { toast("Không xóa được", (r && r.error) || "Ghi lên Google Sheet thất bại.", "danger"); return; }
          loadEmployees().then(() => { drawUsersTable(); toast("Đã xóa", "Tài khoản đã gỡ khỏi tab Employees.", "danger"); });
        });
        break;
      }

      // 1.0.7 (item 7): Changelog mở bằng modal, không chiếm chỗ trong router
      case "changelog": openModal("Changelog — Markus Influencer OS", renderChangelog(), () => closeModal(), "Đóng"); break;

      case "sync-creator": syncCreatorDb(false); break;
      // 1.0.11 (Mục B6): nút "Xóa bộ lọc" trong empty state — dùng lại đúng luồng của nút #bk-clear
      case "bk-clear-filters": {
        BK_FILTER_KEYS.forEach((k) => { bookingUi[k] = bkEmptyFilterValue(k); });
        bookingUi.pill = "";
        bookingUi.page = 1;
        renderBookingPage();
        break;
      }
      // 1.0.12 (Mục G14): bỏ chọn toàn bộ giỏ của loại đang xem
      case "bk-unselect-all": {
        const kind = bookingUi.type === "kol" ? "kol" : "community";
        cart[kind] = [];
        saveCart();
        drawFlowStepper();
        drawBookingTable();
        break;
      }
      // 1.0.14 (Mục C): lưu mẫu nằm trong dropdown cột — nút riêng chỉ còn là lối tắt
      case "save-col-preset": saveColPresetPrompt(); break;
      case "del-col-preset": {
        const name = bkColPresetSel;
        if (!name || !loadColPresets().some((p) => p.name === name)) {
          toast("Chưa chọn mẫu", "Chọn một mẫu đã lưu trong dropdown bộ cột rồi bấm 🗑.", "warning");
          break;
        }
        saveColPresets(loadColPresets().filter((p) => p.name !== name));
        bkColPresetSel = "";
        bookingUi.view = "default";
        saveColView();
        renderBookingPage();
        toast("Đã xoá mẫu cột", name, "success");
        break;
      }
      // 1.0.11 (Mục B7): xuất CSV đúng tập đang lọc, đúng các cột đang hiển thị
      case "export-booking-csv": exportBookingCsv(); break;
      case "ai-fill": aiFillForm(); break;
      case "ai-pick-file": { const f = $("#ai-file"); if (f) f.click(); break; }
      case "ai-fetch-url": aiFetchUrl(); break;   // 1.0.9 (C2)
      case "ai-add-multi": aiAddMulti(); break;   // 1.0.9 (C3)
      case "export-booking-all": exportBookingAll(); break;
      case "export-shortlist": exportShortlist(); break;
      case "open-cart": toggleCartDrawer(); break;
      case "mark-refreshed": {
        markRefreshed();
        router();
        toast("Đã cập nhật", "Dữ liệu chỉ số đã được làm mới. Hẹn gặp lại thứ 2 tuần sau!", "success");
        break;
      }
      case "cart-clear": {
        clearCart();
        drawFlowStepper(); drawBookingTable(); drawShortlistBar();
        toast("Đã xóa giỏ", "Giỏ hàng Booking đã được làm trống.", "success");
        break;
      }
      case "cart-checkout": {
        const t = cartTotals();
        if (!t.count) { toast("Giỏ trống", "Thêm KOL/Community vào giỏ trước.", "danger"); break; }
        const byPlatform = {};
        t.kol.concat(t.comm).forEach((x) => { const k = (PLATFORMS[x.platform] || {}).label || x.platform || "—"; byPlatform[k] = (byPlatform[k] || 0) + 1; });
        const platStr = Object.keys(byPlatform).map((k) => `${k} ${byPlatform[k]}`).join(" · ") || "—";
        const sumRow = (label, value) => `<div class="ck-row"><span>${label}</span><b>${value}</b></div>`;
        openModal("Checkout giỏ hàng Booking", `
          <div class="form-grid">
            <div class="form-field full">
              <div class="ck-summary">
                ${sumRow("KOL / KOC", esc(String(t.kol.length)) + " mục")}
                ${sumRow("Community / Group", esc(String(t.comm.length)) + " mục")}
                ${sumRow("Nền tảng", esc(platStr))}
                ${sumRow("Tổng reach", fmtFollowers(t.totalReach))}
                ${can("private") ? sumRow("Tổng ngân sách ước tính", fmtVND(t.totalBudget)) : ""}
              </div>
            </div>
            <div class="form-field full"><label>Tên báo giá / brief *</label><input name="quoteName" value="${esc(loadQuoteName())}" placeholder="VD: Chiến dịch son kem mùa hè - 08/2026" required></div>
            <div class="form-field full"><label>Ghi chú (tuỳ chọn)</label><textarea name="note" rows="3" placeholder="Ghi chú cho báo giá..."></textarea></div>
          </div>`,
        (d) => {
          const name = (d.quoteName || "").trim();
          if (!name) { toast("Thiếu tên báo giá", "Nhập tên báo giá / brief trước khi xuất file.", "danger"); return; }
          saveQuoteName(name);
          closeModal();
          closeCartDrawer();
          exportShortlist(name, (d.note || "").trim());
        }, "Xuất báo giá →");
        break;
      }
      case "clear-shortlist": {
        clearCart();
        drawFlowStepper(); drawBookingTable(); drawShortlistBar(); drawShortlistPageBody();
        toast("Đã xóa", "Giỏ hàng đã được làm trống.", "success");
        break;
      }
      case "unshortlist": {
        toggleShortlistItem(el.dataset.kind, id, false);
        drawShortlistPageBody();
        break;
      }
    }
  });

  document.addEventListener("change", (e) => {
    const chk = e.target.closest("[data-shortlist-type]");
    if (chk) toggleShortlistItem(chk.dataset.shortlistType, chk.dataset.id, chk.checked);

    // 1.0.3: chọn file cho AI fill → giữ file thật, gửi nguyên bản cho server bóc text
    // (trước đây đọc readAsText nên .pdf/.xlsx ra ký tự rác)
    if (e.target.id === "ai-file" && e.target.files && e.target.files[0]) {
      aiFile = e.target.files[0];
      const ta = $("#ai-paste");
      if (ta) ta.value = ""; // ô dán có text sẽ được ưu tiên → xóa để dùng file
      const st = $("#ai-fill-status");
      if (st) st.textContent = `📎 ${aiFile.name} (${Math.max(1, Math.round(aiFile.size / 1024))} KB) — bấm 🤖 AI Điền tự động.`;
    }
    // 1.0.9 (C1): chọn Tier bằng tay → thôi tự tính theo follower
    const tierSel = e.target.closest('#modal-form [name="tier"]');
    if (tierSel) tierSel.dataset.tierAuto = "0";
    // 1.0.9 (C3): tick "chọn tất cả" trên bảng preview nhiều KOL
    if (e.target.id === "ai-multi-all") {
      document.querySelectorAll("#ai-multi .ai-multi-chk").forEach((c) => { c.checked = e.target.checked; });
    }
  });

  /* 1.0.9 (C1): form thêm/sửa KOL — tier tự tính theo follower (đến khi người dùng tự chọn),
     dán link nền tảng thì suy ra nền tảng chính + @handle cho khỏi gõ lại. */
  document.addEventListener("input", (e) => {
    // 1.0.11 (Mục A): chặn sớm — trước đây MỌI keystroke ở MỌI ô đều chạy closest() lên tận body.
    const nm = e.target.name;
    if (nm !== "followers" && !(e.target.dataset && e.target.dataset.platLink)) return;
    const form = e.target.closest("#modal-form");
    if (!form) return;
    const tierSel = form.querySelector('[name="tier"]');
    if (e.target.name === "followers" && tierSel && tierSel.dataset.tierAuto === "1") {
      const label = (TIERS[tierOf(e.target.value)] || {}).label || "";
      const opt = Array.from(tierSel.options).find((o) => o.textContent.trim() === label);
      if (opt) tierSel.value = opt.value;
    }
    const plat = e.target.dataset ? e.target.dataset.platLink : "";
    if (plat && /^https?:\/\//i.test(e.target.value.trim())) {
      const ps = form.querySelector('[name="platform"]');
      if (ps) ps.value = plat;
      const hd = form.querySelector('[name="handle"]');
      const h = handleFromLink(e.target.value.trim());
      if (hd && h && !hd.value.trim()) hd.value = h;
    }
  });

  // 1.0.2: xóa item khỏi giỏ hàng (click ✕ trong drawer)
  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-cart-remove]");
    if (rm) {
      toggleCart(rm.dataset.cartRemove, rm.dataset.id, false);
      drawCartDrawer();
      return;
    }
  });

  function afterMutate() { closeModal(); router(); }

  $("#modal-form").addEventListener("submit", (e) => {
    e.preventDefault();
    if (typeof modalSubmit === "function") modalSubmit(formData(e.target));
  });
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal-overlay").addEventListener("click", (e) => { if (e.target.id === "modal-overlay") closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal-overlay").hidden) closeModal(); });

  /* ---------- Tìm kiếm toàn cục ---------- */
  // 1.0.11 (Mục A): setTimeout(20) bắn mỗi ký tự → vẽ lại bảng liên tục. Đổi sang debounce 150ms.
  const debounceGlobal = debounce((q) => {
    bookingUi.q = q;
    const input = $("#bk-q");
    if (input) input.value = q;
    bkRedraw();
  }, 150);
  $("#global-search").addEventListener("input", (e) => {
    const q = e.target.value.trim();
    if (!q) return;
    if (currentView() !== "kol") location.hash = "#/kol";
    debounceGlobal(q);
  });

  /* ---------- Sidebar: mobile trượt / desktop thu gọn 64px (1.0.5) ---------- */
  function closeSidebar() { $("#sidebar").classList.remove("open"); const s = $("#scrim"); if (s) s.remove(); }
  const SIDEBAR_COLLAPSE_KEY = "mkios_sidebar_collapsed_v105";
  const MOBILE_MQ = "(max-width: 760px)";
  const isMobileNav = () => window.matchMedia(MOBILE_MQ).matches;
  // Nhãn ngắn hiện dưới icon khi thu gọn (kiểu YouTube) — tên đầy đủ nằm ở tooltip
  const NAV_SHORT = {
    "tong-quan": "Tổng quan", kol: "KOL/KOC", group: "Group", "daily-research": "Daily",
    verified: "Verified", shortlist: "Giỏ hàng", "chien-dich": "Chiến dịch", pipeline: "Hợp đồng",
    "noi-dung": "Nội dung", "thanh-toan": "Thanh toán", "nguoi-dung": "Users", ai: "AI",
  };
  // Bọc phần chữ của mỗi mục menu vào <span> để thu gọn có thể ẩn/đổi nhãn bằng CSS
  function prepareNavLabels() {
    $$("#nav .nav-item").forEach((a) => {
      if (a.querySelector(".nav-txt")) return;
      const txt = Array.from(a.childNodes)
        .filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent.trim()).join(" ");
      if (!txt) return;
      Array.from(a.childNodes).forEach((n) => { if (n.nodeType === 3) a.removeChild(n); });
      const span = document.createElement("span");
      span.className = "nav-txt";
      span.textContent = txt;
      const caret = a.querySelector(".nav-caret");
      a.insertBefore(span, caret || null);
      a.dataset.tip = txt;
      // 1.0.7 (item 1): nhóm menu (details > summary) không có data-view → nhãn ngắn riêng,
      // nếu không rail thu gọn sẽ mất hẳn lối vào CSDL Booking khi <details> đóng
      const short = NAV_SHORT[a.dataset.view] || (a.classList.contains("nav-group-head") ? "CSDL" : null);
      if (short) {
        const mini = document.createElement("span");
        mini.className = "nav-mini";
        mini.textContent = short;
        a.appendChild(mini);
      }
    });
  }
  // Tooltip render ở body với position:fixed → không bị .nav (overflow auto) cắt mất
  function setupNavTooltip() {
    let tip = null;
    const hide = () => { if (tip) tip.classList.remove("show"); };
    $("#nav").addEventListener("mouseover", (e) => {
      const item = e.target.closest(".nav-item");
      if (!item || !document.getElementById("app").classList.contains("sb-collapsed") || isMobileNav()) return hide();
      if (!tip) { tip = document.createElement("div"); tip.className = "nav-tip"; document.body.appendChild(tip); }
      tip.textContent = item.dataset.tip || item.textContent.trim();
      const r = item.getBoundingClientRect();
      tip.style.top = Math.round(r.top + r.height / 2) + "px";
      tip.style.left = Math.round(r.right + 10) + "px";
      requestAnimationFrame(() => tip.classList.add("show"));
    });
    $("#nav").addEventListener("mouseleave", hide);
    window.addEventListener("scroll", hide, true);
  }
  let navCollapseSyncing = false;
  // Khai báo trước applySidebarCollapsed vì hàm đó chạy ngay lúc khởi động (trước initNavAccordion)
  const ACCORDION_KEY = "mkios_accordion_v106";
  function applySidebarCollapsed(on) {
    document.getElementById("app").classList.toggle("sb-collapsed", !!on);
    /* 1.0.7 (item 1): rail 64px ẩn .nav-group-head, nên nhóm phải MỞ khi thu gọn — đóng lại
       thì KOL/KOC và Community biến mất khỏi rail. Thu gọn: mở hết để mọi icon nằm trên rail
       (CSS .sb-collapsed .nav-sub đã bỏ thụt lề/vạch trái nên không còn lệch). Bung menu:
       trả lại đúng trạng thái đóng/mở người dùng đã lưu.
       navCollapseSyncing để sự kiện toggle không ghi đè trạng thái đã lưu. */
    navCollapseSyncing = true;
    let savedAcc = {};
    try { savedAcc = JSON.parse(localStorage.getItem(ACCORDION_KEY) || "{}"); } catch (e) {}
    $$("#nav .nav-group").forEach((d) => {
      const k = d.dataset.accKey;
      d.open = on ? true : (k && Object.prototype.hasOwnProperty.call(savedAcc, k) ? !!savedAcc[k] : true);
    });
    navCollapseSyncing = false;
    const btn = $("#menu-toggle");
    if (btn) {
      btn.classList.toggle("is-collapsed", !!on);
      btn.setAttribute("aria-expanded", on ? "false" : "true");
      btn.title = on ? "Mở rộng menu" : "Thu gọn menu";
    }
  }
  prepareNavLabels();
  setupNavTooltip();
  applySidebarCollapsed(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1");
  $("#menu-toggle").addEventListener("click", () => {
    // Mobile: giữ nguyên hành vi cũ (trượt sidebar + lớp phủ)
    if (isMobileNav()) {
      const sb = $("#sidebar");
      sb.classList.toggle("open");
      if (sb.classList.contains("open")) {
        const scrim = document.createElement("div");
        scrim.className = "scrim"; scrim.id = "scrim";
        scrim.addEventListener("click", closeSidebar);
        document.body.appendChild(scrim);
      } else closeSidebar();
      return;
    }
    const on = !document.getElementById("app").classList.contains("sb-collapsed");
    applySidebarCollapsed(on);
    try { localStorage.setItem(SIDEBAR_COLLAPSE_KEY, on ? "1" : "0"); } catch (e) {}
  });

  /* ---------- 1.0.6: Accordion menu nhớ trạng thái đóng/mở (ACCORDION_KEY khai báo ở trên) ---------- */
  function initNavAccordion() {
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem(ACCORDION_KEY) || "{}"); } catch (e) {}
    $$("#nav .nav-group").forEach((d, i) => {
      // Khoá theo tên nhóm để không lệch khi thêm/bớt mục menu
      const key = (d.querySelector(".nav-group-head") || {}).textContent || ("group" + i);
      d.dataset.accKey = key.trim();
      // 1.0.7 (item 1): đang thu gọn thì giữ nhóm mở (rail cần đủ icon), không khôi phục trạng thái đã lưu
      const collapsed = document.getElementById("app").classList.contains("sb-collapsed");
      if (!collapsed && Object.prototype.hasOwnProperty.call(saved, d.dataset.accKey)) d.open = !!saved[d.dataset.accKey];
      d.addEventListener("toggle", () => {
        if (navCollapseSyncing) return;
        let cur = {};
        try { cur = JSON.parse(localStorage.getItem(ACCORDION_KEY) || "{}"); } catch (e) {}
        cur[d.dataset.accKey] = d.open;
        try { localStorage.setItem(ACCORDION_KEY, JSON.stringify(cur)); } catch (e) {}
      });
    });
  }
  initNavAccordion();

  /* ---------- Nút dữ liệu (1.0.6: đã gỡ khỏi chân menu, giữ handler cho bản cũ) ---------- */
  const btnSeed = $("#btn-seed");
  const btnWipe = $("#btn-wipe");
  if (btnSeed) btnSeed.addEventListener("click", () => {
    if (false) {
      state = seedData(); save(); router();
      toast("Đã nạp dữ liệu mẫu", "Ứng dụng đã được khôi phục.", "success");
    }
  });
  if (btnWipe) btnWipe.addEventListener("click", () => {
    if (false) {
      state = defaultState(); save(); router();
      toast("Đã xóa dữ liệu", "Bắt đầu lại từ đầu.", "danger");
    }
  });

  /* ---------- Giao diện sáng/tối ---------- */
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("#theme-toggle").textContent = t === "dark" ? "☀️" : "🌙";
    localStorage.setItem(THEME_KEY, t);
  }
  $("#theme-toggle").addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(cur);
  });
  applyTheme(localStorage.getItem(THEME_KEY) || "light");

  /* ---------- Đăng nhập / đăng xuất ---------- */
  /* ---------- 1.0.3: Đăng nhập Google (Google Identity Services) ---------- */
  // Script gsi/client nạp async → chờ tới khi có `google.accounts.id`.
  function initGoogleLogin(tries) {
    tries = tries || 0;
    const box = $("#google-signin");
    if (!box) return;
    if (!(window.google && google.accounts && google.accounts.id)) {
      if (tries < 40) setTimeout(() => initGoogleLogin(tries + 1), 250);
      else { const h = $("#google-hint"); if (h) h.textContent = "Không tải được Google Sign-In — kiểm tra kết nối mạng rồi tải lại trang."; }
      return;
    }
    if (box.dataset.ready) return;
    box.dataset.ready = "1";
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: onGoogleCredential });
    google.accounts.id.renderButton(box, { theme: "outline", size: "large", text: "continue_with", shape: "pill" });
  }

  function onGoogleCredential(resp) {
    const err = $("#login-error");
    const idToken = resp && resp.credential;
    if (!idToken) return;
    apiFetch(GOOGLE_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    })
      .then((res) => res.json().then((j) => {
        if (res.status === 401) throw new Error("Email chưa được cấp quyền, liên hệ Admin.");
        if (!res.ok) throw new Error(j.error || "Đăng nhập thất bại (HTTP " + res.status + ")");
        return j;
      }))
      .then((u) => {
        if (err) err.hidden = true;
        currentUser = { email: u.email, name: u.name, role: normRole(u.role), picture: u.picture || "" };
        saveSession(currentUser, true);
        enterApp();
        toast("Đăng nhập thành công", `Xin chào ${u.name} (${(ROLES[currentUser.role] || {}).label || currentUser.role}).`, "success");
      })
      .catch((e) => {
        if (err) { err.textContent = e.message; err.hidden = false; }
        toast("Không đăng nhập được", e.message, "danger");
      });
  }

  // Vào app sau khi xác thực (dùng chung cho Google + login demo + khôi phục session)
  function enterApp() {
    startHeartbeat();
    hideLogin();
    renderCartFab();
    initCreatorDb();
    if (!location.hash) location.hash = "#/tong-quan";
    router();
  }

  // 1.0.4: màn đăng nhập live chỉ có Google Sign-In. Đăng nhập demo giữ nguyên code cho dev,
  // chỉ hiện khi URL có ?demo=1 — và chỉ khi đó mới render danh sách tài khoản/mật khẩu ra DOM.
  const DEMO_LOGIN = /(^|[?&])demo=1(&|$)/.test(location.search);
  function showLogin() {
    $("#login-overlay").hidden = false;
    const demo = $("#demo-login");
    if (demo) demo.hidden = !DEMO_LOGIN;
    if (DEMO_LOGIN) renderQuickLogin();
    initGoogleLogin();
  }
  function hideLogin() { $("#login-overlay").hidden = true; renderUserChip(); applyNavPerms(); }
  // 1.0.7 (item 5b): danh sách demo không còn mật khẩu — chỉ là 3 vai để dev xem giao diện
  function renderQuickLogin() {
    $("#login-quick").innerHTML = DEMO_USERS.map((u) =>
      `<button type="button" data-quick-email="${esc(u.email)}"><strong>${esc(u.name)} — ${esc(ROLES[u.role].label)}</strong><small>${esc(u.email)}</small></button>`
    ).join("");
    $$("#login-quick button").forEach((b) => b.addEventListener("click", () => attemptLogin(b.dataset.quickEmail)));
  }
  function attemptLogin(email) {
    const mail = String(email || "").trim().toLowerCase();
    const u = DEMO_USERS.find((x) => x.email === mail);
    const err = $("#login-error");
    if (!u) { err.textContent = "Email không có trong danh sách demo — dùng Google Sign-In."; err.hidden = false; return; }
    err.hidden = true;
    currentUser = { email: u.email, name: u.name, role: normRole(u.role) };
    saveSession(currentUser, true);
    enterApp();
    toast("Đăng nhập thành công", `Xin chào ${u.name} (${ROLES[currentUser.role].label}).`, "success");
  }
  function renderUserChip() {
    if (!currentUser) return;
    const av = $("#user-avatar");
    av.textContent = currentUser.picture ? "" : initials(currentUser.name);
    av.style.backgroundImage = currentUser.picture ? `url("${currentUser.picture}")` : "";
    av.style.backgroundSize = "cover";
    $("#user-name").textContent = currentUser.name;
    const r = normRole(currentUser.role);
    $("#user-role").innerHTML = `<span class="role-pill ${r}">${esc(ROLES[r].label)}</span>`;
  }
  function doLogout() {
    clearSession();
    currentUser = null;
    stopHeartbeat();
    // Không auto-login lại bằng Google ngay sau khi đăng xuất
    try { if (window.google && google.accounts && google.accounts.id) google.accounts.id.disableAutoSelect(); } catch (e) {}
    showLogin();
  }

  $("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    attemptLogin($("#login-email").value);
  });
  $("#btn-logout").addEventListener("click", doLogout);

  function initAuth() {
    const sess = loadSession();
    // 1.0.3: session Google không nằm trong danh sách local — chỉ cần email + role hợp lệ
    // 1.0.7 (item 5c): session cũ lưu vai manager/staff vẫn vào được nhờ normRole
    if (sess && sess.email) {
      currentUser = Object.assign({}, sess, { role: normRole(sess.role) });
      enterApp();
    } else {
      showLogin();
    }
  }

  /* ---------- Khởi động ---------- */
  window.addEventListener("hashchange", router);
  if (!location.hash) location.hash = "#/tong-quan";
  initAuth();
})();
