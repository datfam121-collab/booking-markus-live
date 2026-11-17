<?php
// Shared-state logic: extension fields (rev/409), workflow records, Sheet snapshot + identity reconcile.
defined('MKP') || exit;
require_once __DIR__ . '/ident.php';
require_once __DIR__ . '/store.php';

const SH_KINDS = ['deals', 'campaigns', 'contents', 'payments'];
// Fields that live in the Sheet. They are written through write-back.php ONLY and are rejected here, never silently dropped.
const SH_SHEET_FIELDS = ['name', 'tier', 'niche', 'gender', 'region', 'relationship', 'contact', 'email', 'phone'];
const SH_EXT_STR = ['verifyStatus', 'stage', 'niche2', 'fileRef', 'previousCampaign', 'performance', 'note', 'handle', 'format', 'priceStatus', 'profileUrl', 'audience'];
const SH_EXT_NUM = ['estimatedPrice', 'followers'];
const SH_ACTIVE = ['Active', 'Inactive', 'Unknown'];
const SH_RESERVED = ['uid', 'rev', 'id', 'createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'deleted', 'author', 'role', 'actor', 'creatorUid', 'csrf'];
const SH_SEED_ID = '/^(i[1-8]|c[1-4]|d[1-7]|n[1-6]|p[1-5]|kd[1-9]|cd[1-8])$/';

function sh_obj($a) { return (is_array($a) && !$a) ? new stdClass() : $a; }

function sh_idlike($s, $max = 64) { return is_string($s) && preg_match('/^[A-Za-z0-9_-]{1,' . $max . '}$/', $s) === 1; }

function sh_len($s) { return mb_strlen((string)$s, 'UTF-8'); }

function sh_validate_fields($set)
{
    if (!is_array($set)) sh_fail(422, 'set_must_be_object');
    if (count($set) > 64) sh_fail(422, 'too_many_fields');
    $known = [];
    $meta = [];
    foreach ($set as $k => $v) {
        if (!is_string($k) || !preg_match('/^[A-Za-z_][A-Za-z0-9_]{0,47}$/', $k)) sh_fail(422, 'bad_field_key', ['key' => (string)$k]);
        if (in_array($k, SH_RESERVED, true)) sh_fail(422, 'reserved_field', ['key' => $k]);
        if (in_array($k, SH_SHEET_FIELDS, true)) sh_fail(422, 'sheet_field_use_write_back', ['key' => $k]);
        if ($k === 'activeStatus') {
            if ($v !== null && !in_array($v, SH_ACTIVE, true)) sh_fail(422, 'bad_active_status');
            $known[$k] = $v;
        } elseif (in_array($k, SH_EXT_NUM, true)) {
            if ($v !== null && (!(is_int($v) || is_float($v)) || !is_finite((float)$v) || $v < 0)) sh_fail(422, 'bad_number', ['key' => $k]);
            $known[$k] = $v;
        } elseif (in_array($k, SH_EXT_STR, true)) {
            if ($v !== null && (!is_string($v) || sh_len($v) > ($k === 'audience' ? 200 : 2000))) sh_fail(422, 'bad_string', ['key' => $k]);
            $known[$k] = $v;
        } else {
            if ($v !== null) {
                if (is_string($v) && sh_len($v) > 2000) sh_fail(422, 'meta_too_long', ['key' => $k]);
                if (is_array($v) && strlen((string)json_encode($v)) > 4096) sh_fail(422, 'meta_too_large', ['key' => $k]);
                if (!is_scalar($v) && !is_array($v)) sh_fail(422, 'bad_meta_type', ['key' => $k]);
            }
            $meta[$k] = $v;
        }
    }
    return [$known, $meta];
}

function sh_ext_get(array $db, $uid)
{
    return isset($db['ext'][$uid]) ? $db['ext'][$uid] : ['uid' => $uid, 'rev' => 0, 'fields' => [], 'meta' => [], 'createdBy' => null, 'createdAt' => null, 'updatedBy' => null, 'updatedAt' => null, 'deleted' => null];
}

function sh_ext_public($e)
{
    return ['uid' => $e['uid'], 'rev' => $e['rev'], 'fields' => sh_obj($e['fields']), 'meta' => sh_obj($e['meta']), 'deleted' => $e['deleted'], 'updatedBy' => $e['updatedBy'], 'updatedAt' => $e['updatedAt']];
}

function sh_ext_apply(array &$db, $actor, $uid, $baseRev, array $known, array $meta, $action)
{
    if (!isset($db['identity'][$uid])) sh_fail(404, 'unknown_uid');
    $e = sh_ext_get($db, $uid);
    if ($e['deleted']) sh_fail(409, 'creator_deleted', ['current' => sh_ext_public($e)]);
    if ((int)$baseRev !== (int)$e['rev']) sh_fail(409, 'stale_revision', ['current' => sh_ext_public($e)]);
    $before = ['fields' => $e['fields'], 'meta' => $e['meta']];
    foreach ($known as $k => $v) { if ($v === null) unset($e['fields'][$k]); else $e['fields'][$k] = $v; }
    foreach ($meta as $k => $v) { if ($v === null) unset($e['meta'][$k]); else $e['meta'][$k] = $v; }
    if ((int)$e['rev'] === 0) { $e['createdBy'] = $actor['email']; $e['createdAt'] = sh_now(); }
    $e['rev'] = (int)$e['rev'] + 1;
    $e['updatedBy'] = $actor['email'];
    $e['updatedAt'] = sh_now();
    $db['ext'][$uid] = $e;
    sh_audit($db, $actor, $action, 'creator:' . $uid, $before, ['fields' => $e['fields'], 'meta' => $e['meta'], 'rev' => $e['rev']]);
    return $e;
}

/* ---------- Sheet snapshot (15s cache, flushed by every Sheet write) ---------- */

function mk_sheet_flush() { @unlink(sh_data_dir() . '/sheet-cache.json'); }

function mk_sheet_read()
{
    $path = sh_data_dir() . '/sheet-cache.json';
    if (is_file($path)) {
        $c = json_decode((string)@file_get_contents($path), true);
        if (is_array($c) && isset($c['ts'], $c['data']) && time() - (int)$c['ts'] < 15) return $c['data'];
    }
    $d = mk_gateway()->syncRead();
    $d['updatedAt'] = date('c');
    $tmp = $path . '.tmp' . getmypid();
    if (@file_put_contents($tmp, json_encode(['ts' => time(), 'data' => $d])) !== false) { @chmod($tmp, 0600); @rename($tmp, $path); }
    return $d;
}

function sh_reconciled(array &$db)
{
    $sheet = mk_sheet_read();
    $res = sh_ident_reconcile($db, $sheet['rows'], isset($sheet['links']) && is_array($sheet['links']) ? $sheet['links'] : []);
    foreach ($res as $r) {
        if ($r['status'] !== 'quarantine') continue;
        $key = 'sheet:' . $r['index'] . ':' . $r['reason'];
        $db['quarantine'][$key] = ['key' => $key, 'kind' => 'sheet_row', 'name' => $r['name'], 'reason' => $r['reason'], 'ts' => sh_now()];
    }
    foreach ($db['identity'] as $uid => $idn) {
        $key = 'identity:' . $uid . ':missing';
        if (!empty($idn['missing'])) {
            if (!isset($db['quarantine'][$key])) $db['quarantine'][$key] = ['key' => $key, 'kind' => 'identity_missing', 'uid' => $uid, 'name' => $idn['name'], 'reason' => 'no_unambiguous_match', 'ts' => sh_now()];
        } else {
            unset($db['quarantine'][$key]);
        }
    }
    return [$sheet, $res];
}

function sh_snapshot_creators(array $db, array $res, $role = 'viewer')
{
    $out = [];
    foreach ($res as $r) {
        $e = $r['uid'] ? sh_ext_get($db, $r['uid']) : null;
        $out[] = ['index' => $r['index'], 'uid' => $r['uid'], 'name' => $r['name'], 'status' => $r['status'], 'reason' => isset($r['reason']) ? $r['reason'] : null,
            'rev' => $e ? $e['rev'] : 0, 'fields' => $e ? sh_obj(sh_can_private($role) ? $e['fields'] : sh_redact_ext_fields($e['fields'])) : new stdClass(), 'meta' => $e ? sh_obj(sh_can_private($role) ? $e['meta'] : sh_redact_ext_fields($e['meta'])) : new stdClass(), 'deleted' => $e ? $e['deleted'] : null];
    }
    return $out;
}

/* ---------- Workflow records ---------- */

function sh_wf_public($w)
{
    return ['id' => $w['id'], 'rev' => $w['rev'], 'record' => sh_obj($w['record']), 'createdBy' => $w['createdBy'], 'createdAt' => $w['createdAt'], 'updatedBy' => $w['updatedBy'], 'updatedAt' => $w['updatedAt'], 'deleted' => $w['deleted']];
}

function sh_has_raw_creator_ref($v)
{
    if (is_string($v)) return preg_match('/^(unresolved:)?cdb_[0-9]+$/', $v) === 1;
    if (is_array($v)) { foreach ($v as $x) if (sh_has_raw_creator_ref($x)) return true; }
    return false;
}

function sh_wf_clean($rec, $id)
{
    if (!is_array($rec)) sh_fail(422, 'record_must_be_object');
    if (sh_has_raw_creator_ref($rec)) sh_fail(422, 'raw_creator_ref_rejected');
    foreach (['createdBy', 'createdAt', 'updatedBy', 'updatedAt', 'rev', 'deleted', 'author', 'actor', 'csrf'] as $k) unset($rec[$k]);
    $rec['id'] = $id;
    if (strlen((string)json_encode($rec)) > 16384) sh_fail(422, 'record_too_large');
    return $rec;
}

function sh_wf_check_id($kind, $id)
{
    if (!in_array($kind, SH_KINDS, true)) sh_fail(404, 'unknown_kind');
    if (!sh_idlike($id)) sh_fail(422, 'bad_id');
    if (preg_match(SH_SEED_ID, $id)) sh_fail(422, 'seed_id_rejected');
}

function sh_wf_put(array &$db, $actor, $kind, $id, $baseRev, $rec, $action = 'workflow.put')
{
    $cur = isset($db['workflow'][$kind][$id]) ? $db['workflow'][$kind][$id] : null;
    $rec = sh_wf_clean($rec, $id);
    if (!$cur) {
        if ((int)$baseRev !== 0) sh_fail(409, 'stale_revision', ['current' => null]);
        $w = ['id' => $id, 'rev' => 1, 'record' => $rec, 'createdBy' => $actor['email'], 'createdAt' => sh_now(), 'updatedBy' => $actor['email'], 'updatedAt' => sh_now(), 'deleted' => null];
        $before = null;
    } else {
        if ($cur['deleted']) sh_fail(409, 'record_deleted', ['current' => sh_wf_public($cur)]);
        if ((int)$baseRev !== (int)$cur['rev']) sh_fail(409, 'stale_revision', ['current' => sh_wf_public($cur)]);
        $before = $cur['record'];
        $w = $cur;
        $w['record'] = array_merge($cur['record'], $rec);
        $w['rev'] = $cur['rev'] + 1;
        $w['updatedBy'] = $actor['email'];
        $w['updatedAt'] = sh_now();
    }
    $db['workflow'][$kind][$id] = $w;
    sh_audit($db, $actor, $action, $kind . ':' . $id, $before, $w['record']);
    return $w;
}

/* ---------- Role privacy: price + contact cells are admin/planner only (mirrors the client can("private")) ---------- */

function sh_can_private($role) { return $role === 'admin' || $role === 'planner'; }

// 0-based indexes of private columns. Fail closed: the UNION of (a) the client's positional defaults (CREATOR_COL_DEFAULT),
// (b) wherever the header names put them and (c) any header that looks like contact/price data.
// Renamed, moved or missing headers can only widen the redaction, never shrink it.
function sh_private_cols(array $header)
{
    $named = ['contact_person' => 1, 'contact_detail' => 1, 'company_email' => 1, 'company_phone' => 1, 'personal_email' => 1, 'personal_phone' => 1];
    $plain = [12 => true, 14 => true, 15 => true, 16 => true, 18 => true, 19 => true];
    $status = [31 => true];
    $sow = [32 => true, 33 => true, 34 => true, 35 => true, 36 => true];
    foreach ($header as $i => $h) {
        $label = trim((string)$h);
        if ($label === '') continue;
        $k = preg_replace('/\s+/u', '_', mb_strtolower($label, 'UTF-8'));
        if (isset($named[$k]) || ($k !== 'contact_channel' && preg_match('/(e-?mail|phone|sđt|số_điện_thoại|zalo|liên_hệ|contact)/u', $k))) $plain[$i] = true;
        if ($k === 'relationship_status') $status[$i] = true;
        if ($i >= 31 && preg_match('/(photo|video|event|sự kiện|live|brand|nhãn hàng|price|giá|quote|budget|sow)/iu', $label)) $sow[$i] = true;
    }
    return ['plain' => array_keys($plain + $sow), 'status' => array_keys($status)];
}

// Blank private cells in place; header, identity columns (name/region/profile URLs) and row count stay untouched.
function sh_redact_rows(array $header, array $rows)
{
    $c = sh_private_cols($header);
    foreach ($rows as $ri => $r) {
        if (!is_array($r)) continue;
        foreach ($c['plain'] as $ci) if (isset($r[$ci])) $r[$ci] = '';
        foreach ($c['status'] as $si) {
            if (!isset($r[$si])) continue;
            $s = trim((string)$r[$si]);
            $numeric = preg_replace('/[.,\s]/', '', preg_replace('/(vnđ|vnd|₫|đ)\s*$/iu', '', $s));
            if ($numeric !== '' && ctype_digit($numeric)) $r[$si] = '';
        }
        $rows[$ri] = $r;
    }
    return $rows;
}

// Extension fields/meta a viewer must not see: known price fields plus any key that names price/contact data (meta keys are free-form).
function sh_redact_ext_fields($fields)
{
    if (!is_array($fields)) return $fields;
    unset($fields['estimatedPrice'], $fields['priceStatus']);
    foreach ($fields as $k => $v) {
        if (preg_match('/(price|giá|quote|budget|rate|fee|phone|sdt|e-?mail|zalo|contact|liên)/iu', (string)$k)) unset($fields[$k]);
        elseif (is_array($v)) $fields[$k] = sh_redact_ext_fields($v);
    }
    return $fields;
}

// Viewer snapshot: money fields in workflow records (deal value, campaign budget/spent, payment amounts) are zeroed, never omitted, so the UI keeps rendering.
const SH_MONEY_KEY = '/(value|amount|price|giá|tiền|budget|spent|cost|fee|paid|total|deposit|payout|invoice|quote|rate|commission|revenue|balance|sum)/iu';

// Recursive at every depth (records are free-form JSON): a money-named key is zeroed whatever it holds; other containers are walked.
function sh_redact_workflow_record($rec, $depth = 0)
{
    if (!is_array($rec) || $depth > 24) return $rec;
    foreach ($rec as $k => $v) {
        if (is_string($k) && preg_match(SH_MONEY_KEY, $k)) $rec[$k] = (is_int($v) || is_float($v) || (is_string($v) && is_numeric($v))) ? 0 : (is_array($v) ? [] : (is_bool($v) || $v === null ? $v : ''));
        elseif (is_array($v)) $rec[$k] = sh_redact_workflow_record($v, $depth + 1);
    }
    return $rec;
}

// sync-data payload: native shape + server-computed uids. Soft-deleted creators are blanked in place so row indexes never shift.
function mk_sync_payload($role = 'viewer')
{
    return sh_tx(true, function (&$db) use ($role) {
        list($sheet, $res) = sh_reconciled($db);
        $rows = $sheet['rows'];
        $uids = [];
        foreach ($res as $r) {
            $uids[$r['index']] = $r['uid'];
            if ($r['uid'] && sh_ext_get($db, $r['uid'])['deleted'] && isset($rows[$r['index']])) $rows[$r['index']] = array_fill(0, max(1, count($rows[$r['index']])), '');
        }
        if (!sh_can_private($role)) $rows = sh_redact_rows($sheet['header'], $rows);
        $n = count($rows);
        $flat = [];
        for ($i = 0; $i < $n; $i++) $flat[] = isset($uids[$i]) ? $uids[$i] : null;
        return ['ok' => true, 'header' => $sheet['header'], 'rows' => $rows, 'links' => $sheet['links'], 'linkCols' => $sheet['linkCols'], 'count' => $n, 'updatedAt' => $sheet['updatedAt'], 'uids' => $flat];
    });
}
