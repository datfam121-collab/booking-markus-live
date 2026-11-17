/* Booking phase 1 - pure rules (no DOM, no network).
   Loaded by preview/index.html before app.js (window.MkBookingRules) and by Node tests (module.exports).
   Rules are read-only: they flag records, they never rewrite source data. */
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.MkBookingRules = api;
})(typeof window !== "undefined" ? window : null, function () {
  "use strict";

  /* ---------- Active / Inactive / Unknown ---------- */
  var ACTIVE_STATUSES = ["active", "inactive", "unknown"];
  var ACTIVE_LABELS = { active: "Active", inactive: "Inactive", unknown: "Unknown" };

  function stripMarks(s) {
    return String(s == null ? "" : s)
      .normalize("NFD").replace(/[̀-ͯ]/g, "")
      .replace(/đ/g, "d").replace(/Đ/g, "D")
      .trim().toLowerCase();
  }

  // Anything not clearly Active/Inactive is Unknown. Never guessed from other fields (e.g. Users heartbeat).
  function normActive(v) {
    var s = stripMarks(v);
    if (!s || s === "unknown" || s === "chua ro") return "unknown";
    if (/^(inactive|not active|disabled|off|no|false|0)$/.test(s) || /(ngung|khong hoat dong|ngoai hoat dong|tam dung)/.test(s)) return "inactive";
    if (/^(active|enabled|on|yes|true|1)$/.test(s) || /(dang hoat dong|con hoat dong|hoat dong)/.test(s)) return "active";
    return "unknown";
  }

  function matchesActive(rec, filter) {
    if (!filter) return true;
    return normActive(rec && rec.activeStatus) === filter;
  }

  /* ---------- Audience (local-only free text; legacy records are Unknown; never derived from Casting_Profile) ---------- */
  var AUDIENCE_UNKNOWN = "__unknown__";
  function normAudience(v) {
    var s = String(v == null ? "" : v).replace(/\s+/g, " ").trim();
    if (!s || stripMarks(s) === "unknown" || stripMarks(s) === "chua ro") return "";
    return s.slice(0, 80);
  }
  function audienceKey(v) { return stripMarks(normAudience(v)); }
  function audienceLabel(v) { return normAudience(v) || "Unknown"; }
  function matchesAudience(rec, filter) {
    if (!filter) return true;
    var key = audienceKey(rec && rec.audience);
    if (filter === AUDIENCE_UNKNOWN) return key === "";
    return key !== "" && key === stripMarks(filter);
  }
  function audienceOptions(rows) {
    var seen = {}, out = [];
    (rows || []).forEach(function (r) {
      var a = normAudience(r && r.audience), k = stripMarks(a);
      if (a && !seen[k]) { seen[k] = 1; out.push(a); }
    });
    return out.sort(function (x, y) { return x.localeCompare(y); });
  }

  /* ---------- Casting profile (stored in field "gender", sheet column Casting_Profile) ---------- */
  function matchesCasting(rec, filter) {
    if (!filter) return true;
    return stripMarks(rec && rec.gender) === stripMarks(filter);
  }

  /* ---------- Data-quality rules ---------- */
  // Documented thresholds. Follower numbers at/above MAX_PLAUSIBLE_FOLLOWERS exceed the largest real
  // accounts on any supported platform, so they are far more likely typos or unit errors.
  var MAX_PLAUSIBLE_FOLLOWERS = 500000000;

  var DQ_CODES = {
    missing_rate: "Thiếu giá",
    missing_url: "Thiếu URL kênh",
    missing_tier: "Thiếu tier",
    missing_region: "Thiếu khu vực",
    suspicious_followers: "Follower đáng ngờ"
  };
  var DQ_RULES = {
    missing_rate: "Không có giá ước tính và không có giá theo format nào > 0.",
    missing_url: "Không có URL http(s) ở profileUrl/link, socialLinks hay platStats.",
    missing_tier: "Ô Tier trống (hoặc chỉ là dấu gạch).",
    missing_region: "Ô khu vực trống (hoặc chỉ là dấu gạch).",
    suspicious_followers: "Follower âm/không phải số, hoặc >= " + MAX_PLAUSIBLE_FOLLOWERS + ", hoặc bằng 0 trong khi có URL kênh."
  };

  function blank(v) {
    var s = String(v == null ? "" : v).trim();
    return s === "" || s === "-" || s === "—" || s === "–";
  }
  function isUrl(v) { return /^https?:\/\/\S+/i.test(String(v == null ? "" : v).trim()); }

  function urlsOf(rec) {
    var out = [];
    if (!rec) return out;
    out.push(rec.profileUrl, rec.link);
    var sl = rec.socialLinks || {};
    Object.keys(sl).forEach(function (k) { out.push(sl[k]); });
    var ps = rec.platStats || {};
    Object.keys(ps).forEach(function (k) { out.push((ps[k] || {}).url); });
    return out.filter(isUrl);
  }
  function hasUrl(rec) { return urlsOf(rec).length > 0; }

  function hasRate(rec) {
    if (!rec) return false;
    if (Number(rec.estimatedPrice) > 0) return true;
    var pbf = rec.priceByFormat || {};
    var viaFormat = Object.keys(pbf).some(function (k) { return Number((pbf[k] || {}).amount) > 0; });
    if (viaFormat) return true;
    return ["pPhoto", "pVideo", "pEvent", "pBrandvideo", "pLive"].some(function (k) { return Number(rec[k]) > 0; });
  }

  function followerValues(rec) {
    var vals = [];
    if (!rec) return vals;
    if (rec.followers != null) vals.push(rec.followers);
    ["fTiktok", "fFacebook", "fInstagram", "fYoutube"].forEach(function (k) { if (rec[k] != null) vals.push(rec[k]); });
    var ps = rec.platStats || {};
    Object.keys(ps).forEach(function (k) { if ((ps[k] || {}).followers != null) vals.push(ps[k].followers); });
    return vals;
  }

  // Returns reasons (strings) why follower counts look suspicious; empty array = fine.
  function followerProblems(rec) {
    var vals = followerValues(rec);
    var reasons = [];
    var nums = vals.map(Number);
    if (nums.some(function (n) { return !isFinite(n) || n < 0; })) reasons.push("giá trị âm hoặc không phải số");
    var finite = nums.filter(function (n) { return isFinite(n) && n >= 0; });
    var max = finite.length ? Math.max.apply(null, finite) : 0;
    if (max >= MAX_PLAUSIBLE_FOLLOWERS) reasons.push("vượt " + MAX_PLAUSIBLE_FOLLOWERS);
    if (max === 0 && hasUrl(rec)) reasons.push("bằng 0 nhưng có URL kênh");
    return reasons;
  }

  // Order is stable so UI and CSV are deterministic.
  function dataQualityFlags(rec) {
    var flags = [];
    if (!rec) return flags;
    if (!hasRate(rec)) flags.push({ code: "missing_rate", label: DQ_CODES.missing_rate });
    if (!hasUrl(rec)) flags.push({ code: "missing_url", label: DQ_CODES.missing_url });
    if (blank(rec.tier)) flags.push({ code: "missing_tier", label: DQ_CODES.missing_tier });
    if (blank(rec.region)) flags.push({ code: "missing_region", label: DQ_CODES.missing_region });
    var fp = followerProblems(rec);
    if (fp.length) flags.push({ code: "suspicious_followers", label: DQ_CODES.suspicious_followers, detail: fp.join("; ") });
    return flags;
  }

  // filter: "" (all) | "any" (at least one flag) | "clean" (no flags) | a DQ code
  function matchesDq(rec, filter) {
    if (!filter) return true;
    var flags = dataQualityFlags(rec);
    if (filter === "any") return flags.length > 0;
    if (filter === "clean") return flags.length === 0;
    return flags.some(function (f) { return f.code === filter; });
  }

  function summarizeDq(rows) {
    var out = { total: 0, clean: 0, flagged: 0, byCode: {} };
    Object.keys(DQ_CODES).forEach(function (c) { out.byCode[c] = 0; });
    (rows || []).forEach(function (r) {
      out.total++;
      var fl = dataQualityFlags(r);
      if (fl.length) out.flagged++; else out.clean++;
      fl.forEach(function (f) { out.byCode[f.code]++; });
    });
    return out;
  }

  /* ---------- Legacy demo records (counted for an honest banner, never removed) ---------- */
  var LEGACY_SEED_IDS = {
    influencers: ["i1", "i2", "i3", "i4", "i5", "i6", "i7", "i8"],
    campaigns: ["c1", "c2", "c3", "c4"],
    deals: ["d1", "d2", "d3", "d4", "d5", "d6", "d7"],
    contents: ["n1", "n2", "n3", "n4", "n5", "n6"],
    payments: ["p1", "p2", "p3", "p4", "p5"]
  };
  // Informational only: an id match does not prove a record is demo data.
  function legacySeedCounts(state) {
    var out = { total: 0 };
    Object.keys(LEGACY_SEED_IDS).forEach(function (k) {
      var ids = LEGACY_SEED_IDS[k];
      var n = ((state && state[k]) || []).filter(function (r) { return r && ids.indexOf(r.id) !== -1; }).length;
      out[k] = n;
      out.total += n;
    });
    return out;
  }

  return {
    ACTIVE_STATUSES: ACTIVE_STATUSES,
    ACTIVE_LABELS: ACTIVE_LABELS,
    normActive: normActive,
    matchesActive: matchesActive,
    matchesCasting: matchesCasting,
    AUDIENCE_UNKNOWN: AUDIENCE_UNKNOWN,
    normAudience: normAudience,
    audienceKey: audienceKey,
    audienceLabel: audienceLabel,
    matchesAudience: matchesAudience,
    audienceOptions: audienceOptions,
    MAX_PLAUSIBLE_FOLLOWERS: MAX_PLAUSIBLE_FOLLOWERS,
    DQ_CODES: DQ_CODES,
    DQ_RULES: DQ_RULES,
    hasUrl: hasUrl,
    hasRate: hasRate,
    followerProblems: followerProblems,
    dataQualityFlags: dataQualityFlags,
    matchesDq: matchesDq,
    summarizeDq: summarizeDq,
    LEGACY_SEED_IDS: LEGACY_SEED_IDS,
    legacySeedCounts: legacySeedCounts
  };
});
