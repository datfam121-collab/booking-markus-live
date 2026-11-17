/* Booking production adapter. Loaded in place of the static app.js tag; loads booking-rules.js and app.js itself.
   - Auth: the server session (cookie, set by google-auth.php) is the only source of identity and role. The app's own
     Google login flow is untouched; after a successful login the page reloads so the second boot starts from server data.
   - Data: the app keeps fetching sync-data.php natively. This adapter only preloads shared state (workflow records and
     extension fields such as Active/Audience), keeps the cdb_N <-> uid map, and writes changes through with baseRev.
   - The 9 Sheet columns are written by the app itself through write-back.php; they are never sent to the extension store.
   - A 409/401/403 halts further shared writes and shows a gate; nothing is merged automatically. */
(function (win) {
  "use strict";

  var STORE_KEY = "markus_influencer_os_v1_0";
  var EDIT_KEY = "mkios_creator_edits_v106";
  var CACHE_KEY = "mkios_creator_db_v103a";
  var SESSION_KEY = "markus_os_v1_0_session";
  var CART_KEY = "mkios_cart_v102";
  var NATIVE_KEY = "mkprod_native_session";
  var CART_OWNER_KEY = "mkprod_cart_owner";
  var CART_SIDE_PREFIX = "mkprod_cart_uid__";
  var CART_BACKUP_PREFIX = "mkprod_cart_backup__";
  var API = "api.php";
  var KINDS = ["deals", "campaigns", "contents", "payments"];
  var SHEET_FIELDS = ["name", "tier", "niche", "gender", "region", "relationship", "contact", "email", "phone"];
  var EXT_NUM = ["estimatedPrice", "followers"];
  var EXT_STR = ["verifyStatus", "stage", "niche2", "fileRef", "previousCampaign", "performance", "note", "handle", "format", "priceStatus", "profileUrl", "audience"];
  var RESERVED = ["uid", "rev", "id", "createdBy", "createdAt", "updatedBy", "updatedAt", "deleted", "author", "role", "actor", "creatorUid", "csrf"];

  var loc = win.location;
  var realFetch = win.fetch.bind(win);
  var rawSet = Storage.prototype.setItem;
  var rawRemove = Storage.prototype.removeItem;
  var S = { user: null, csrf: null, halted: false, writesOn: false, awaitLogin: false, wfRev: {}, wfShadow: {}, editRev: {}, editShadow: {}, ambiguousNames: [], queue: Promise.resolve(), uids: [], idToUid: {}, uidToId: {}, unresolved: [], names: {}, nameCol: 1, sheetChanged: false, cart: { status: "none", backups: [], missing: [], legacyKolCleared: 0, restored: 0, unmapped: 0, foreign: false }, cartReady: false };
  win.__MK_PROD__ = { state: S, version: 1 };

  function setLocal(k, v) { rawSet.call(win.localStorage, k, v); }
  function lsGet(k) { try { return win.localStorage.getItem(k); } catch (e) { return null; } }
  function normName(s) { return String(s == null ? "" : s).toLowerCase().replace(/\s+/g, " ").trim(); }
  function el(tag, attrs, text) { var e = document.createElement(tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); if (text) e.textContent = text; return e; }
  function jsonResponse(obj, status) { return new win.Response(JSON.stringify(obj), { status: status || 200, headers: { "Content-Type": "application/json" } }); }

  /* The demo login must never be reachable in production. */
  if (/(^|[?&])demo=1(&|$)/.test(loc.search || "") && win.history && win.history.replaceState) {
    win.history.replaceState(null, "", loc.pathname + (loc.search.replace(/([?&])demo=1(&|$)/, "$1").replace(/[?&]$/, "")) + (loc.hash || ""));
  }

  /* ---------- UI ---------- */
  var css = "#mkprod-banner{position:sticky;top:0;z-index:2147483000;background:#7a4b00;color:#fff;font:600 12px/1.4 system-ui,sans-serif;padding:4px 10px;display:none;gap:10px;align-items:center;flex-wrap:wrap}" +
    "#mkprod-banner.on{display:flex}#mkprod-banner button{font:inherit;padding:1px 8px;cursor:pointer}" +
    "#mkprod-gate{position:fixed;inset:0;z-index:2147483100;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;font:14px system-ui,sans-serif}" +
    "#mkprod-gate .box{background:#fff;color:#111;padding:20px 24px;border-radius:8px;max-width:460px;box-shadow:0 8px 30px rgba(0,0,0,.4)}" +
    "#mkprod-gate button{display:block;width:100%;margin:8px 0 0;padding:8px;font-size:14px;cursor:pointer}";
  function addStyle() { if (document.getElementById("mkprod-style")) return; var s = el("style", { id: "mkprod-style" }); s.textContent = css; document.head.appendChild(s); }

  function banner() {
    addStyle();
    var b = document.getElementById("mkprod-banner");
    if (!b) { b = el("div", { id: "mkprod-banner", role: "status" }); document.body.insertBefore(b, document.body.firstChild); }
    b.textContent = "";
    var n = 0;
    function add(id, t) { b.appendChild(el("span", { id: id }, t)); n++; }
    if (S.sheetChanged) add("mkprod-sheetchanged", "Google Sheet đã thay đổi thứ tự dòng. Tải lại trang để áp dụng; các thay đổi dùng chung đang tạm dừng.");
    if (S.unresolved.length) add("mkprod-unresolved", S.unresolved.length + " liên kết creator trong chiến dịch/hợp đồng không khớp dòng nào trên Sheet; giữ nguyên, không tự gán lại theo tên.");
    if (S.cart.legacyKolCleared) add("mkprod-cart-legacy", "Giỏ KOL cũ (" + S.cart.legacyKolCleared + " mục) chưa có định danh creator nên không được ghép vào Sheet hiện tại và đã bỏ chọn. Bản gốc còn lưu ở khóa localStorage " + S.cart.legacyBackup + ".");
    if (S.cart.missing.length) add("mkprod-cart-missing", S.cart.missing.length + " creator trong giỏ không còn trên Sheet và đã bỏ chọn. Bản giỏ trước còn lưu ở khóa localStorage " + S.cart.backups[S.cart.backups.length - 1] + ".");
    if (S.cart.unmapped) add("mkprod-cart-unmapped", S.cart.unmapped + " creator trong giỏ chưa có định danh ổn định nên sẽ không khôi phục sau khi tải lại.");
    if (S.ambiguousNames.length) add("mkprod-ambiguous", "Creator trùng tên chỉ đọc đối với dữ liệu dùng chung: " + S.ambiguousNames.join(", "));
    if (S.notice) add("mkprod-notice", S.notice);
    if (n) {
      var r = el("button", { id: "mkprod-reload", type: "button" }, "Tải lại");
      r.addEventListener("click", function () { location.reload(); });
      b.appendChild(r);
    }
    b.className = n ? "on" : "";
  }

  function gate(title, msg, id, withReload) {
    addStyle();
    var old = document.getElementById("mkprod-gate");
    if (old) old.remove();
    var d = el("div", { id: "mkprod-gate" });
    var box = el("div", { "class": "box" });
    box.appendChild(el("h3", {}, title));
    box.appendChild(el("p", { id: id }, msg));
    if (withReload) {
      var b = el("button", { id: id + "-reload", type: "button" }, "Tải lại dữ liệu mới nhất");
      b.addEventListener("click", function () { location.reload(); });
      box.appendChild(b);
    }
    d.appendChild(box);
    document.body.appendChild(d);
  }

  function showConflict(kind, detail) {
    S.halted = true;
    gate(kind === "stale" ? "Có người vừa thay đổi bản ghi này" : kind === "auth" ? "Phiên đăng nhập đã hết" : kind === "forbidden" ? "Không đủ quyền" : "Không lưu được",
      kind === "stale" ? "Thay đổi của bạn CHƯA được lưu vì dữ liệu dùng chung đã được cập nhật bởi phiên khác. Tải lại để xem bản mới nhất rồi làm lại. Hệ thống không tự gộp."
        : kind === "auth" ? "Đăng nhập lại để tiếp tục. Thay đổi gần nhất có thể chưa được lưu."
          : "Thay đổi của bạn CHƯA được lưu (" + detail + "). Tải lại để đồng bộ với dữ liệu dùng chung.", "mkprod-conflict-msg", true);
  }

  function showFatal(msg) { S.halted = true; gate("Không khởi động được", msg, "mkprod-fatal", true); }

  /* ---------- API ---------- */
  function api(method, path, body) {
    var h = {};
    if (S.csrf && method !== "GET") h["X-CSRF-Token"] = S.csrf;
    if (body !== undefined) h["Content-Type"] = "application/json";
    return realFetch(path, { method: method, headers: h, body: body === undefined ? undefined : JSON.stringify(body), credentials: "same-origin" })
      .then(function (r) { return r.json().catch(function () { return null; }).then(function (d) { return { status: r.status, data: d }; }); });
  }
  function failed(res) {
    if (res.status === 409) showConflict("stale", res.data && res.data.error);
    else if (res.status === 401) showConflict("auth", "401");
    else if (res.status === 403) showConflict("forbidden", res.data && res.data.error);
    else showConflict("error", (res.data && res.data.error) || res.status);
  }

  /* ---------- network boundary ---------- */
  function sameOriginPhp(input) {
    var raw = typeof input === "string" ? input : (input && input.url) || "";
    try { var u = new URL(raw, loc.href); return u.origin === loc.origin ? u : null; } catch (e) { return null; }
  }
  function withCsrf(init) {
    var out = Object.assign({}, init || {});
    var h = new Headers(out.headers || {});
    if (S.csrf) h.set("X-CSRF-Token", S.csrf);
    out.headers = h;
    return out;
  }
  win.fetch = function (input, init) {
    var u = sameOriginPhp(input);
    if (!u) return realFetch(input, init);
    var name = u.pathname.split("/").pop();
    if (!/\.php$/i.test(name)) return realFetch(input, init);
    var method = String((init && init.method) || (typeof input === "object" && input.method) || "GET").toUpperCase();
    var i2 = init;
    if (method !== "GET" && method !== "HEAD") i2 = withCsrf(init);

    if (name === "google-auth.php") {
      return realFetch(input, i2).then(function (res) {
        if (!res.ok) return res;
        return res.clone().json().then(function (d) {
          if (!d || !d.ok) return res;
          S.csrf = d.csrf || null;
          S.awaitLogin = true;
          setTimeout(function () { if (S.awaitLogin) { S.awaitLogin = false; location.reload(); } }, 4000);
          return res;
        }, function () { return res; });
      });
    }

    if (name === "write-back.php" && method === "POST" && i2 && typeof i2.body === "string") {
      var b = null;
      try { b = JSON.parse(i2.body); } catch (e) {}
      if (b && b.kind !== "employees" && typeof b.name === "string") {
        if (S.names[normName(b.name)]) delete b.create; else b.create = true;
        i2 = Object.assign({}, i2, { body: JSON.stringify(b) });
      }
      var isCreator = !!(b && b.kind !== "employees");
      return realFetch(input, i2).then(function (res) {
        if (isCreator) {
          res.clone().json().then(function (d) {
            if (res.ok && d && d.ok) { if (d.mode === "append" && b && b.name) S.names[normName(b.name)] = 1; return; }
            var msg = res.status === 401 ? "Phiên đăng nhập đã hết, hãy tải lại." : res.status === 403 ? "Không đủ quyền ghi lên Sheet." : res.status === 409 ? "Ghi lên Sheet bị từ chối (" + ((d && d.error) || "xung đột") + "). Thay đổi này CHƯA được lưu." : "Ghi lên Sheet thất bại (" + ((d && d.error) || res.status) + "). Thay đổi này CHƯA được lưu.";
            S.notice = msg; banner();
          }, function () {});
        }
        return res;
      });
    }

    if (name === "sync-data.php") {
      return realFetch(input, i2).then(function (res) {
        if (res.ok) res.clone().json().then(function (d) { checkSheet(d); }, function () {});
        else if (res.status === 401) showConflict("auth", "401");
        return res;
      });
    }

    return realFetch(input, i2).then(function (res) {
      if (res.status === 401 && name !== "google-auth.php") showConflict("auth", "401");
      return res;
    });
  };

  // Append-only growth keeps every existing cdb_N stable; anything else means the row order changed under this page.
  function checkSheet(d) {
    if (!d || !Array.isArray(d.uids) || !S.uids.length) return;
    for (var i = 0; i < S.uids.length; i++) {
      if ((S.uids[i] || null) !== (d.uids[i] || null)) { S.sheetChanged = true; S.halted = true; banner(); showConflict("stale", "sheet reordered"); return; }
    }
    if (d.uids.length > S.uids.length) { S.uids = d.uids.slice(); buildMaps(S.uids); }
    indexNames(d);
  }

  /* ---------- data mapping ---------- */
  var statusToServer = function (v) { v = String(v || "").toLowerCase(); return v === "active" ? "Active" : v === "inactive" ? "Inactive" : "Unknown"; };
  var statusToApp = function (v) { return String(v || "Unknown").toLowerCase(); };

  function editToServer(fields) {
    var out = {};
    Object.keys(fields).forEach(function (k) {
      var v = fields[k];
      if (RESERVED.indexOf(k) !== -1 || SHEET_FIELDS.indexOf(k) !== -1 || !/^[A-Za-z_][A-Za-z0-9_]{0,47}$/.test(k)) return;
      if (k === "activeStatus") out[k] = statusToServer(v);
      else if (EXT_NUM.indexOf(k) !== -1) { var n = Number(v); out[k] = (v === null || v === "" || !isFinite(n) || n < 0) ? null : n; }
      else if (EXT_STR.indexOf(k) !== -1) out[k] = v === null || v === undefined ? null : String(v);
      else out[k] = v === undefined ? null : v;
    });
    return out;
  }
  function editFromServer(c) {
    var o = {};
    Object.keys(c.meta || {}).forEach(function (k) { o[k] = c.meta[k]; });
    Object.keys(c.fields || {}).forEach(function (k) { o[k] = k === "activeStatus" ? statusToApp(c.fields[k]) : c.fields[k]; });
    return o;
  }

  var CDB = /^cdb_\d+$/, UIDREF = /^uid:cr_[0-9a-f]{16}$/, UNRES = "unresolved:";
  function buildMaps(uids) {
    S.idToUid = {}; S.uidToId = {};
    (uids || []).forEach(function (u, i) { if (u) { S.idToUid["cdb_" + (i + 1)] = u; S.uidToId[u] = "cdb_" + (i + 1); } });
  }
  function indexNames(d) {
    var h = d.header || [], col = -1, i;
    for (i = 0; i < h.length; i++) if (String(h[i]).trim() === "Creator_Name") { col = i; break; }
    if (col < 0) return;
    S.names = {};
    (d.rows || []).forEach(function (r) { var n = normName(r && r[col]); if (n) S.names[n] = 1; });
  }
  function walk(v, fn) {
    if (typeof v === "string") return fn(v);
    if (Array.isArray(v)) return v.map(function (x) { return walk(x, fn); });
    if (v && typeof v === "object") { var o = {}; Object.keys(v).forEach(function (k) { o[k] = walk(v[k], fn); }); return o; }
    return v;
  }
  function toClientRecord(rec) {
    return walk(rec, function (s) {
      if (UIDREF.test(s)) { var id = S.uidToId[s.slice(4)]; if (id) return id; if (S.unresolved.indexOf(s) === -1) S.unresolved.push(s); return UNRES + s; }
      if (CDB.test(s)) { if (S.unresolved.indexOf(s) === -1) S.unresolved.push(s); return UNRES + s; }
      return s;
    });
  }
  function toServerRecord(rec) {
    var bad = [];
    var out = walk(rec, function (s) {
      if (CDB.test(s)) { var u = S.idToUid[s]; if (u) return "uid:" + u; bad.push(s); return s; }
      if (s.indexOf(UNRES) === 0 && (UIDREF.test(s.slice(UNRES.length)) || CDB.test(s.slice(UNRES.length)))) return s.slice(UNRES.length);
      return s;
    });
    return { rec: out, bad: bad };
  }

  function hydrate(snap) {
    var prev = {};
    S.wfRev = {}; S.wfShadow = {}; S.unresolved = [];
    KINDS.forEach(function (k) {
      prev[k] = (snap.workflow[k] || []).map(function (w) { S.wfRev[k + ":" + w.id] = w.rev; return toClientRecord(w.record); });
    });
    setLocal(STORE_KEY, JSON.stringify(prev));
    var edits = {}, counts = {};
    S.editRev = {}; S.ambiguousNames = [];
    snap.creators.forEach(function (c) { if (c.name) counts[normName(c.name)] = (counts[normName(c.name)] || 0) + 1; });
    snap.creators.forEach(function (c) {
      if (!c.name) return;
      if (counts[normName(c.name)] > 1) { if (S.ambiguousNames.indexOf(c.name) === -1) S.ambiguousNames.push(c.name); return; }
      if (!c.uid || c.deleted) return;
      S.editRev[c.name] = { uid: c.uid, rev: c.rev };
      if (c.rev > 0) edits[c.name] = editFromServer(c);
    });
    setLocal(EDIT_KEY, JSON.stringify(edits));
    rawRemove.call(win.localStorage, CACHE_KEY);
  }

  function stable(v) {
    if (Array.isArray(v)) return "[" + v.map(stable).join(",") + "]";
    if (v && typeof v === "object") return "{" + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ":" + stable(v[k]); }).join(",") + "}";
    return JSON.stringify(v);
  }
  function snapshotShadow() {
    S.wfShadow = {}; S.editShadow = {};
    try {
      var st = JSON.parse(win.localStorage.getItem(STORE_KEY) || "{}") || {};
      KINDS.forEach(function (k) { (st[k] || []).forEach(function (r) { if (r && r.id) S.wfShadow[k + ":" + r.id] = stable(r); }); });
      var ed = JSON.parse(win.localStorage.getItem(EDIT_KEY) || "{}") || {};
      Object.keys(ed).forEach(function (n) { S.editShadow[n] = stable(ed[n]); });
    } catch (e) {}
  }

  /* ---------- write-through ---------- */
  function enqueue(fn) { S.queue = S.queue.then(function () { return S.halted ? null : fn(); }).catch(function () {}); }

  function pushWorkflow(value) {
    var st; try { st = JSON.parse(value); } catch (e) { return; }
    if (!st) return;
    KINDS.forEach(function (kind) {
      var seen = {};
      (st[kind] || []).forEach(function (r) {
        if (!r || !r.id) return;
        var key = kind + ":" + r.id; seen[key] = true;
        var sig = stable(r);
        if (S.wfShadow[key] === sig) return;
        S.wfShadow[key] = sig;
        var conv = toServerRecord(r);
        if (conv.bad.length) { showConflict("unmapped", "creator " + conv.bad.join(", ") + " chưa có định danh ổn định (dòng trống, trùng hoặc đang cách ly); chưa gửi gì lên máy chủ"); return; }
        enqueue(function () {
          var baseRev = S.wfRev[key] || 0;
          return api("PUT", API + "?r=/workflow/" + kind + "/" + encodeURIComponent(r.id), { baseRev: baseRev, record: conv.rec }).then(function (res) {
            if (res.status === 200) S.wfRev[key] = res.data.item.rev; else failed(res);
          });
        });
      });
      Object.keys(S.wfShadow).forEach(function (key) {
        if (key.indexOf(kind + ":") !== 0 || seen[key]) return;
        var id = key.slice(kind.length + 1);
        delete S.wfShadow[key];
        enqueue(function () {
          if (!(key in S.wfRev)) return null;
          return api("DELETE", API + "?r=/workflow/" + kind + "/" + encodeURIComponent(id) + "&baseRev=" + S.wfRev[key]).then(function (res) {
            if (res.status === 200) delete S.wfRev[key]; else failed(res);
          });
        });
      });
    });
  }

  function pushEdits(value) {
    var ed; try { ed = JSON.parse(value); } catch (e) { return; }
    if (!ed || typeof ed !== "object") return;
    Object.keys(ed).forEach(function (name) {
      var sig = stable(ed[name]);
      if (S.editShadow[name] === sig) return;
      var prevSig = S.editShadow[name];
      S.editShadow[name] = sig;
      var set = editToServer(ed[name] || {});
      if (prevSig) {
        try {
          var old = JSON.parse(prevSig);
          Object.keys(old).forEach(function (k) {
            if (!(k in ed[name]) && SHEET_FIELDS.indexOf(k) === -1 && RESERVED.indexOf(k) === -1 && /^[A-Za-z_][A-Za-z0-9_]{0,47}$/.test(k)) set[k] = null;
          });
        } catch (e) {}
      }
      if (!Object.keys(set).length) return;
      enqueue(function () {
        var info = S.editRev[name];
        return api("PATCH", API + "?r=/creators/by-name", { name: name, baseRev: info ? info.rev : 0, set: set }).then(function (res) {
          if (res.status === 200) S.editRev[name] = { uid: res.data.uid, rev: res.data.ext.rev }; else failed(res);
        });
      });
    });
  }

  /* ---------- local-only cart identity (never sent to the server) ---------- */
  function cartNs(email) { return encodeURIComponent(String(email || "unowned").toLowerCase()); }
  function cartBackup(ns, raw, why) {
    var key;
    do { key = CART_BACKUP_PREFIX + cartNs(ns) + "__" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 10); } while (lsGet(key) !== null);
    setLocal(key, JSON.stringify({ savedAt: new Date().toISOString(), owner: ns, reason: why, raw: raw }));
    S.cart.backups.push(key);
    return key;
  }
  function readSidecar(email) {
    var raw = lsGet(CART_SIDE_PREFIX + cartNs(email));
    if (raw === null) return null;
    try { var o = JSON.parse(raw); if (o && Array.isArray(o.kol)) return o; } catch (e) {}
    cartBackup(email, raw, "unreadable cart identity sidecar");
    return null;
  }
  function writeSidecar(email, cart) {
    var uids = [], unmapped = 0;
    (Array.isArray(cart.kol) ? cart.kol : []).forEach(function (id) {
      var u = S.idToUid[id];
      if (u) { if (uids.indexOf(u) === -1) uids.push(u); } else unmapped++;
    });
    S.cart.unmapped = unmapped;
    setLocal(CART_SIDE_PREFIX + cartNs(email), JSON.stringify({ v: 1, kol: uids, community: Array.isArray(cart.community) ? cart.community : [], savedAt: new Date().toISOString() }));
    setLocal(CART_OWNER_KEY, String(email).toLowerCase());
  }
  function cartBoot() {
    var email = String(S.user.email).toLowerCase(), c = S.cart;
    var liveRaw = lsGet(CART_KEY), owner = lsGet(CART_OWNER_KEY), sc = readSidecar(email), live = null;
    if (liveRaw !== null) { try { live = JSON.parse(liveRaw); } catch (e) {} }
    if (!live || typeof live !== "object" || Array.isArray(live)) live = null;
    if (liveRaw !== null) {
      if (owner && owner !== email) { cartBackup(owner, liveRaw, "cart left in this browser by another identity"); c.foreign = true; live = null; }
      else if (!(owner === email && sc)) {
        c.legacyBackup = cartBackup(owner ? email : "unowned", liveRaw, "legacy cart without recorded creator identity");
        c.legacyKolCleared = live && Array.isArray(live.kol) ? live.kol.length : 0;
      }
    }
    if (!live && !sc) { c.status = "empty"; return null; }
    var ids = [];
    ((sc && sc.kol) || []).forEach(function (u) { var id = S.uidToId[u]; if (id) { if (ids.indexOf(id) === -1) ids.push(id); } else c.missing.push(u); });
    if (c.missing.length) cartBackup(email, JSON.stringify(sc), "saved cart creators missing from the current sheet");
    var out = Object.assign({}, live || {});
    out.kol = ids;
    if (!Array.isArray(out.community)) out.community = (sc && Array.isArray(sc.community)) ? sc.community : [];
    c.restored = ids.length;
    c.status = c.legacyKolCleared ? "legacy-quarantined" : c.missing.length ? "partial" : "restored";
    return out;
  }

  Storage.prototype.setItem = function (k, v) {
    rawSet.apply(this, arguments);
    if (this !== win.localStorage) return;
    if (k === SESSION_KEY && S.awaitLogin) {
      S.awaitLogin = false;
      S.halted = true;
      setLocal(NATIVE_KEY, String(v));
      setTimeout(function () { location.reload(); }, 30);
      return;
    }
    if (k === CART_KEY && S.cartReady && !S.halted && S.user) {
      try { var cobj = JSON.parse(String(v)); if (cobj && typeof cobj === "object") { writeSidecar(S.user.email, cobj); banner(); } } catch (e) {}
      return;
    }
    if (!S.writesOn) return;
    if (k === STORE_KEY) pushWorkflow(String(v));
    else if (k === EDIT_KEY) pushEdits(String(v));
  };

  /* ---------- session / boot ---------- */
  function clearData() {
    [STORE_KEY, EDIT_KEY, CACHE_KEY, SESSION_KEY].forEach(function (k) { rawRemove.call(win.localStorage, k); });
    try { rawRemove.call(win.sessionStorage, SESSION_KEY); } catch (e) {}
  }
  function clearAll() { clearData(); rawRemove.call(win.localStorage, NATIVE_KEY); }

  function doLogout() {
    S.halted = true; S.writesOn = false;
    var done = function () { clearAll(); location.reload(); };
    api("POST", API + "?r=/logout", {}).then(done, done);
  }

  function loadScript(src) {
    return new Promise(function (ok, bad) { var s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = function () { bad(new Error("không tải được " + src)); }; document.body.appendChild(s); });
  }

  function nativeSessionFor(user) {
    var raw = lsGet(NATIVE_KEY);
    if (!raw) return null;
    var obj; try { obj = JSON.parse(raw); } catch (e) { return null; }
    if (!obj || typeof obj !== "object") return null;
    var t = obj.user && typeof obj.user === "object" ? obj.user : obj;
    if (String(t.email || "").toLowerCase() !== String(user.email).toLowerCase()) return null;
    t.role = user.role;
    if (user.name) t.name = user.name;
    return JSON.stringify(obj);
  }

  function startAuthed(sess) {
    S.user = sess.user; S.csrf = sess.csrf;
    var snapRes, syncRes;
    return api("GET", API + "?r=/snapshot").then(function (res) {
      if (res.status !== 200) throw new Error("snapshot lỗi " + res.status);
      snapRes = res;
      return api("GET", "sync-data.php");
    }).then(function (sres) {
      syncRes = sres;
      if (sres.status !== 200) throw new Error("sync-data lỗi " + sres.status);
      var uids = sres.data.uids || [], cr = snapRes.data.creators;
      if (uids.length !== cr.length || cr.some(function (c, i) { return (c.uid || null) !== (uids[i] || null); })) throw new Error("Sheet vừa thay đổi trong lúc tải; hãy tải lại trang.");
      S.uids = uids.slice();
      buildMaps(S.uids);
      indexNames(sres.data);
      S.user = snapRes.data.user;
      var nat = nativeSessionFor(S.user);
      if (!nat) { // server session without a matching local app session: force a clean native Google login
        var clear = function () { S.user = null; S.csrf = null; return null; };
        return api("POST", API + "?r=/logout", {}).then(clear, clear);
      }
      S.cartReady = false;
      S.cart = { status: "none", backups: [], missing: [], legacyKolCleared: 0, restored: 0, unmapped: 0, foreign: false };
      var cartOut = cartBoot();
      clearData();
      setLocal(SESSION_KEY, nat);
      try { rawSet.call(win.sessionStorage, SESSION_KEY, nat); } catch (e) {}
      hydrate(snapRes.data);
      if (cartOut) { setLocal(CART_KEY, JSON.stringify(cartOut)); writeSidecar(S.user.email, cartOut); }
      S.cartReady = true;
      banner();
      return true;
    }).then(function (ok) { return startApp(!!ok); });
  }

  function startApp(authed) {
    if (!authed) { clearData(); rawRemove.call(win.localStorage, NATIVE_KEY); }
    return loadScript("booking-rules.js").then(function () { return loadScript("app.js"); }).then(function () {
      if (!authed) return;
      var sess = null; try { sess = JSON.parse(win.sessionStorage.getItem(SESSION_KEY) || win.localStorage.getItem(SESSION_KEY) || "null"); } catch (e) {}
      var t = sess && sess.user && typeof sess.user === "object" ? sess.user : sess;
      if (!t || t.role !== S.user.role) { showFatal("Vai trò trong ứng dụng không khớp vai trò trên máy chủ. Ghi dữ liệu dùng chung đã tắt."); return; }
      setTimeout(function () { snapshotShadow(); S.writesOn = true; }, 600);
    });
  }

  function boot() {
    addStyle();
    api("GET", API + "?r=/session").then(function (res) {
      if (res.status === 200 && res.data && res.data.authenticated) return startAuthed(res.data);
      if (res.status === 200 || res.status === 401) return startApp(false);
      throw new Error("máy chủ trả về " + res.status);
    }).catch(function (e) { showFatal(String(e && e.message || e)); });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("#btn-logout") : null;
    if (t && S.user) { e.preventDefault(); e.stopImmediatePropagation(); doLogout(); }
  }, true);
})(window);
