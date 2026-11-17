<?php
// Immutable server-generated creator UIDs + sidecar identity table (no Creator_UID column in the Sheet).
// Fail closed: ambiguous matches are quarantined (no uid, writes refused) instead of guessed.
defined('MKP') || exit;

// 1-based CREATOR_DB columns of the profile cells, in the order of the sync-data `links` objects {tiktok,facebook,instagram,youtube}.
const SH_URL_COLS = [23, 25, 27, 29];
const SH_URL_PLATFORMS = ['tiktok', 'facebook', 'instagram', 'youtube'];
// Identity table schema. v2 = urls come from validated hyperlinks (v1 stored raw display labels, which collide across rows).
const SH_IDENT_V = 2;

function sh_lower($s) { return mb_strtolower((string)$s, 'UTF-8'); }

function sh_norm_name($s) { return trim(preg_replace('/\s+/u', ' ', sh_lower($s))); }

function sh_norm_url($u)
{
    $u = sh_lower(trim((string)$u));
    if ($u === '') return '';
    $u = preg_replace('#^https?://(www\.)?#', '', $u);
    $u = preg_replace('/#.*$/', '', $u);
    $q = '';
    $qp = strpos($u, '?');
    if ($qp !== false) {
        $query = substr($u, $qp + 1);
        $u = substr($u, 0, $qp);
        // Facebook profile.php?id=N: the id IS the profile; dropping the query would merge every such profile.
        if (preg_match('#/profile\.php/?$#', $u) && preg_match('/(?:^|&)id=([0-9]+)(?:&|$)/', $query, $m)) $q = '?id=' . $m[1];
    }
    return rtrim($u, '/') . $q;
}

// A usable profile identifier: absolute http(s) URL with a dotted host and a real path (a bare domain is shared by many creators). Display labels never qualify.
function sh_valid_profile_url($u)
{
    $u = trim((string)$u);
    if ($u === '' || strlen($u) > 2048 || preg_match('~[\x00-\x20\x7f\\\\]~', $u) || !preg_match('~^https?://~i', $u)) return '';
    $p = parse_url($u);
    if (!is_array($p) || empty($p['host']) || isset($p['user']) || isset($p['pass']) || strpos($p['host'], '.') === false) return '';
    if (trim(isset($p['path']) ? $p['path'] : '', '/') === '') return '';
    $n = sh_norm_url($u);
    // profile.php without a numeric id cannot identify a profile: reject so it is never used for matching.
    if (preg_match('#/profile\.php$#', $n)) return '';
    return $n;
}

// $links = the sync-data links object for this row ({tiktok,facebook,instagram,youtube} => hyperlink|null). The true hyperlink wins; the raw cell is used only when it is itself a valid URL.
function sh_row_fp(array $row, $links = null)
{
    $urls = [];
    foreach (SH_URL_COLS as $k => $c) {
        $n = '';
        $p = SH_URL_PLATFORMS[$k];
        if (is_array($links) && isset($links[$p]) && is_string($links[$p])) $n = sh_valid_profile_url($links[$p]);
        if ($n === '') $n = sh_valid_profile_url(isset($row[$c - 1]) ? $row[$c - 1] : '');
        if ($n !== '') $urls[] = $n;
    }
    $urls = array_values(array_unique($urls));
    sort($urls);
    $name = sh_norm_name(isset($row[1]) ? $row[1] : '');
    return ['nameN' => $name, 'urls' => $urls, 'region' => sh_norm_name(isset($row[8]) ? $row[8] : ''), 'blank' => ($name === '' && !$urls), 'display' => trim((string)(isset($row[1]) ? $row[1] : ''))];
}

function sh_new_uid() { return 'cr_' . bin2hex(random_bytes(8)); }

// Conservative one-time repair of identity tables written by the v1 code (urls were raw display labels).
// Nothing is deleted or re-pointed: uids, ext data and workflow stay as they are. Stored urls are cleared (untrusted) and kept as legacyUrls;
// stale sheet_row quarantine entries (derived diagnostics, regenerated below) are dropped. Identities then re-bind ONLY through the existing
// rule: exactly one sheet row and exactly one unbound identity share name+region; anything else stays quarantined (never guessed).
function sh_ident_upgrade(array &$db)
{
    if ((int)(isset($db['identity_v']) ? $db['identity_v'] : 1) >= SH_IDENT_V) return;
    $cleared = 0;
    foreach ($db['identity'] as $uid => $idn) {
        $db['identity'][$uid]['legacyUrls'] = isset($idn['urls']) && is_array($idn['urls']) ? $idn['urls'] : [];
        $db['identity'][$uid]['urls'] = [];
        $cleared++;
    }
    $dropped = 0;
    foreach ($db['quarantine'] as $k => $q) {
        if (isset($q['kind']) && $q['kind'] === 'sheet_row') { unset($db['quarantine'][$k]); $dropped++; }
    }
    $db['identity_v'] = SH_IDENT_V;
    $db['identity_repair'] = ['ts' => sh_now(), 'identities_urls_cleared' => $cleared, 'sheet_row_quarantine_dropped' => $dropped];
}

function sh_ident_reconcile(array &$db, array $rows, array $links = [])
{
    sh_ident_upgrade($db);
    $ids =& $db['identity'];
    $fps = [];
    foreach ($rows as $i => $r) $fps[$i] = sh_row_fp($r, isset($links[$i]) ? $links[$i] : null);
    $res = [];
    $bound = [];
    $cand = [];
    // Current-row URL overlaps are resolved BEFORE any bind/rebind/new uid: every row that shares any profile URL with another row fails closed on the first pass.
    $urlRows = [];
    $keyRows = [];
    foreach ($fps as $i => $fp) {
        if ($fp['blank']) continue;
        foreach ($fp['urls'] as $url) $urlRows[$url][$i] = true;
        $keyRows[$fp['nameN'] . '|' . $fp['region'] . '|' . implode(',', $fp['urls'])][] = $i;
    }
    $shared = [];
    foreach ($urlRows as $url => $set) if (count($set) > 1) foreach ($set as $i => $_) $shared[$i] = true;
    foreach ($fps as $i => $fp) {
        if ($fp['blank']) { $res[$i] = ['index' => $i, 'uid' => null, 'status' => 'blank', 'name' => '']; continue; }
        if (isset($shared[$i])) {
            $dup = count($keyRows[$fp['nameN'] . '|' . $fp['region'] . '|' . implode(',', $fp['urls'])]) > 1;
            $res[$i] = ['index' => $i, 'uid' => null, 'status' => 'quarantine', 'reason' => $dup ? 'duplicate_fingerprint' : 'shared_url', 'name' => $fp['display']];
            continue;
        }
        $c = [];
        foreach ($ids as $uid => $idn) {
            $iu = isset($idn['urls']) ? $idn['urls'] : [];
            if ($fp['urls'] && $iu) { if (array_intersect($fp['urls'], $iu)) $c[] = $uid; }
            elseif (!$fp['urls'] && !$iu && $fp['nameN'] === $idn['nameN'] && $fp['region'] === $idn['region']) $c[] = $uid;
        }
        $cand[$i] = $c;
    }
    $want = [];
    foreach ($cand as $i => $c) foreach ($c as $u) $want[$u][] = $i;
    $zero = [];
    foreach ($cand as $i => $c) {
        if (count($c) === 1 && count($want[$c[0]]) === 1) {
            $res[$i] = ['index' => $i, 'uid' => $c[0], 'status' => 'bound', 'name' => $fps[$i]['display']];
            $bound[$c[0]] = $i;
        } elseif (count($c) >= 1) {
            $res[$i] = ['index' => $i, 'uid' => null, 'status' => 'quarantine', 'reason' => 'ambiguous_identity', 'name' => $fps[$i]['display'], 'candidates' => $c];
        } else {
            $zero[] = $i;
        }
    }
    $groups = [];
    $nameRegion = [];
    foreach ($zero as $i) {
        $groups[$fps[$i]['nameN'] . '|' . $fps[$i]['region'] . '|' . implode(',', $fps[$i]['urls'])][] = $i;
        $nr = $fps[$i]['nameN'] . '|' . $fps[$i]['region'];
        $nameRegion[$nr] = (isset($nameRegion[$nr]) ? $nameRegion[$nr] : 0) + 1;
    }
    foreach ($groups as $g) {
        if (count($g) > 1) {
            foreach ($g as $i) $res[$i] = ['index' => $i, 'uid' => null, 'status' => 'quarantine', 'reason' => 'duplicate_fingerprint', 'name' => $fps[$i]['display']];
            continue;
        }
        $i = $g[0];
        $fp = $fps[$i];
        $re = [];
        foreach ($ids as $uid => $idn) {
            if (isset($bound[$uid]) || isset($want[$uid])) continue;
            if ($idn['nameN'] === $fp['nameN'] && $idn['region'] === $fp['region']) $re[] = $uid;
        }
        if (count($re) > 1 || ($re && $nameRegion[$fp['nameN'] . '|' . $fp['region']] > 1)) {
            $res[$i] = ['index' => $i, 'uid' => null, 'status' => 'quarantine', 'reason' => 'ambiguous_rebind', 'name' => $fp['display'], 'candidates' => $re];
        } elseif (count($re) === 1) {
            $res[$i] = ['index' => $i, 'uid' => $re[0], 'status' => 'bound', 'name' => $fp['display']];
            $bound[$re[0]] = $i;
        } else {
            $uid = sh_new_uid();
            $ids[$uid] = ['uid' => $uid, 'nameN' => $fp['nameN'], 'name' => $fp['display'], 'urls' => $fp['urls'], 'region' => $fp['region'], 'aliases' => [], 'createdAt' => sh_now(), 'missing' => false];
            $res[$i] = ['index' => $i, 'uid' => $uid, 'status' => 'new', 'name' => $fp['display']];
            $bound[$uid] = $i;
        }
    }
    foreach ($bound as $uid => $i) {
        $idn =& $ids[$uid];
        $fp = $fps[$i];
        if ($idn['nameN'] !== $fp['nameN']) {
            $al = isset($idn['aliases']) ? $idn['aliases'] : [];
            $al[] = $idn['nameN'];
            $idn['aliases'] = array_slice(array_values(array_unique($al)), -20);
        }
        $idn['nameN'] = $fp['nameN'];
        $idn['name'] = $fp['display'];
        $idn['urls'] = $fp['urls'];
        $idn['region'] = $fp['region'];
        $idn['missing'] = false;
        unset($idn);
    }
    foreach ($ids as $uid => &$idn2) { if (!isset($bound[$uid])) $idn2['missing'] = true; }
    unset($idn2);
    ksort($res);
    return $res;
}

function sh_ident_by_name(array $res, $name)
{
    $n = sh_norm_name($name);
    $hits = [];
    foreach ($res as $r) if ($r['uid'] && sh_norm_name($r['name']) === $n) $hits[] = $r['uid'];
    $hits = array_values(array_unique($hits));
    $quar = 0;
    foreach ($res as $r) if (!$r['uid'] && $r['status'] === 'quarantine' && sh_norm_name($r['name']) === $n) $quar++;
    if (count($hits) === 1 && $quar === 0) return ['uid' => $hits[0], 'status' => 'unique'];
    if (count($hits) + $quar > 1 || $quar > 0) return ['uid' => null, 'status' => 'ambiguous'];
    return ['uid' => null, 'status' => 'unmatched'];
}
