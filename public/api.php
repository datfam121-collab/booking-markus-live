<?php
/**
 * api.php - shared state API. Routes via ?r=/path (or PATH_INFO). Same-origin, session + role + CSRF on every write.
 * Sheet-backed creator columns are NOT writable here (they go through write-back.php); this API stores the
 * extension fields (Active, Audience, ...), workflow records, identity sidecar, audit and quarantine.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';
require __DIR__ . '/_mk/shared.php';

function mk_api_route()
{
    $method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
    $r = isset($_GET['r']) && is_string($_GET['r']) ? $_GET['r'] : (isset($_SERVER['PATH_INFO']) ? $_SERVER['PATH_INFO'] : '');
    $seg = array_values(array_filter(array_map('rawurldecode', explode('/', trim($r, '/'))), 'strlen'));
    $n = count($seg);
    $s0 = $n ? $seg[0] : '';

    if ($s0 === 'health' && $n === 1 && $method === 'GET') return ['ok' => true];

    if ($s0 === 'session' && $n === 1 && $method === 'GET') {
        $u = sh_current_user();
        if (!$u) return ['ok' => true, 'authenticated' => false];
        return ['ok' => true, 'authenticated' => true, 'csrf' => $u['csrf'], 'user' => ['email' => $u['email'], 'name' => $u['name'], 'role' => $u['role']]];
    }

    if ($s0 === 'logout' && $n === 1) {
        if ($method !== 'POST') sh_fail(405, 'method_not_allowed');
        sh_require_write('viewer');
        mk_logout_session();
        return ['ok' => true];
    }

    if ($s0 === 'snapshot' && $n === 1) {
        if ($method !== 'GET') sh_fail(405, 'method_not_allowed');
        $u = sh_require('viewer');
        return sh_tx(true, function (&$db) use ($u) {
            list($sheet, $res) = sh_reconciled($db);
            $wf = [];
            foreach (SH_KINDS as $k) { $wf[$k] = []; foreach ($db['workflow'][$k] as $w) if (!$w['deleted']) { $p = sh_wf_public($w); if (!sh_can_private($u['role'])) $p['record'] = sh_obj(sh_redact_workflow_record($w['record'])); $wf[$k][] = $p; } }
            return ['ok' => true, 'user' => ['email' => $u['email'], 'name' => $u['name'], 'role' => $u['role']], 'creators' => sh_snapshot_creators($db, $res, $u['role']), 'workflow' => $wf,
                'quarantined' => count($db['quarantine']), 'sheetUpdatedAt' => $sheet['updatedAt']];
        });
    }

    if ($s0 === 'creators') {
        if ($n === 2 && $method === 'DELETE') sh_fail(405, 'hard_delete_disabled');
        if ($n === 2 && $method === 'PATCH' && $seg[1] === 'by-name') {
            $u = sh_require_write('planner');
            $b = sh_body();
            $name = isset($b['name']) && is_string($b['name']) ? $b['name'] : '';
            if ($name === '') sh_fail(422, 'name_required');
            list($known, $meta) = sh_validate_fields(isset($b['set']) ? $b['set'] : null);
            $baseRev = isset($b['baseRev']) ? $b['baseRev'] : null;
            if (!is_int($baseRev)) sh_fail(422, 'baseRev_required');
            return sh_tx(true, function (&$db) use ($u, $name, $known, $meta, $baseRev) {
                list($sheet, $res) = sh_reconciled($db);
                $m = sh_ident_by_name($res, $name);
                if (!$m['uid']) {
                    $key = 'name:' . sh_norm_name($name) . ':' . $m['status'];
                    $db['quarantine'][$key] = ['key' => $key, 'kind' => 'by_name_write', 'name' => $name, 'reason' => $m['status'], 'fields' => $known + $meta, 'ts' => sh_now()];
                    $ex = new ShHttp($m['status'] === 'ambiguous' ? 409 : 404, 'identity_' . $m['status']);
                    $ex->persist = true;
                    throw $ex;
                }
                $e = sh_ext_apply($db, $u, $m['uid'], $baseRev, $known, $meta, 'creator.patch');
                return ['ok' => true, 'uid' => $m['uid'], 'ext' => sh_ext_public($e)];
            });
        }
        if ($n === 2 && $method === 'PATCH') {
            $u = sh_require_write('planner');
            if (!sh_idlike($seg[1], 40)) sh_fail(422, 'bad_uid');
            $b = sh_body();
            list($known, $meta) = sh_validate_fields(isset($b['set']) ? $b['set'] : null);
            $baseRev = isset($b['baseRev']) ? $b['baseRev'] : null;
            if (!is_int($baseRev)) sh_fail(422, 'baseRev_required');
            $uid = $seg[1];
            return sh_tx(true, function (&$db) use ($u, $uid, $known, $meta, $baseRev) {
                sh_reconciled($db);
                $e = sh_ext_apply($db, $u, $uid, $baseRev, $known, $meta, 'creator.patch');
                return ['ok' => true, 'uid' => $uid, 'ext' => sh_ext_public($e)];
            });
        }
        if ($n === 3 && $method === 'POST' && ($seg[2] === 'soft-delete' || $seg[2] === 'restore')) {
            $u = sh_require_write('admin');
            if (!sh_idlike($seg[1], 40)) sh_fail(422, 'bad_uid');
            $b = sh_body();
            $baseRev = isset($b['baseRev']) ? $b['baseRev'] : null;
            if (!is_int($baseRev)) sh_fail(422, 'baseRev_required');
            $uid = $seg[1];
            $del = $seg[2] === 'soft-delete';
            return sh_tx(true, function (&$db) use ($u, $uid, $baseRev, $del) {
                if (!isset($db['identity'][$uid])) sh_fail(404, 'unknown_uid');
                $e = sh_ext_get($db, $uid);
                if ((int)$baseRev !== (int)$e['rev']) sh_fail(409, 'stale_revision', ['current' => sh_ext_public($e)]);
                if ($del && $e['deleted']) sh_fail(409, 'already_deleted');
                if (!$del && !$e['deleted']) sh_fail(409, 'not_deleted');
                $before = $e['deleted'];
                $e['deleted'] = $del ? ['at' => sh_now(), 'by' => $u['email']] : null;
                $e['rev'] = (int)$e['rev'] + 1;
                $e['updatedBy'] = $u['email'];
                $e['updatedAt'] = sh_now();
                $db['ext'][$uid] = $e;
                sh_audit($db, $u, $del ? 'creator.soft_delete' : 'creator.restore', 'creator:' . $uid, $before, $e['deleted']);
                return ['ok' => true, 'ext' => sh_ext_public($e)];
            });
        }
        sh_fail(405, 'method_not_allowed');
    }

    if ($s0 === 'workflow' && $n >= 3) {
        $kind = $seg[1];
        $id = $seg[2];
        sh_wf_check_id($kind, $id);
        if ($n === 3 && $method === 'PUT') {
            $u = sh_require_write('planner');
            $b = sh_body();
            $baseRev = isset($b['baseRev']) ? $b['baseRev'] : null;
            if (!is_int($baseRev)) sh_fail(422, 'baseRev_required');
            $rec = isset($b['record']) ? $b['record'] : null;
            return sh_tx(true, function (&$db) use ($u, $kind, $id, $baseRev, $rec) {
                return ['ok' => true, 'item' => sh_wf_public(sh_wf_put($db, $u, $kind, $id, $baseRev, $rec))];
            });
        }
        if ($n === 3 && $method === 'DELETE') {
            $u = sh_require_write('admin');
            $baseRev = isset($_GET['baseRev']) && ctype_digit((string)$_GET['baseRev']) ? (int)$_GET['baseRev'] : null;
            if ($baseRev === null) sh_fail(422, 'baseRev_required');
            return sh_tx(true, function (&$db) use ($u, $kind, $id, $baseRev) {
                if (!isset($db['workflow'][$kind][$id])) sh_fail(404, 'not_found');
                $w = $db['workflow'][$kind][$id];
                if ($w['deleted']) sh_fail(409, 'already_deleted');
                if ((int)$baseRev !== (int)$w['rev']) sh_fail(409, 'stale_revision', ['current' => sh_wf_public($w)]);
                $w['deleted'] = ['at' => sh_now(), 'by' => $u['email'], 'undo' => $w['record']];
                $w['rev']++;
                $w['updatedBy'] = $u['email'];
                $w['updatedAt'] = sh_now();
                $db['workflow'][$kind][$id] = $w;
                sh_audit($db, $u, 'workflow.soft_delete', $kind . ':' . $id, $w['record'], null);
                return ['ok' => true, 'item' => sh_wf_public($w)];
            });
        }
        if ($n === 4 && $seg[3] === 'restore' && $method === 'POST') {
            $u = sh_require_write('admin');
            $b = sh_body();
            $baseRev = isset($b['baseRev']) ? $b['baseRev'] : null;
            if (!is_int($baseRev)) sh_fail(422, 'baseRev_required');
            return sh_tx(true, function (&$db) use ($u, $kind, $id, $baseRev) {
                if (!isset($db['workflow'][$kind][$id])) sh_fail(404, 'not_found');
                $w = $db['workflow'][$kind][$id];
                if (!$w['deleted']) sh_fail(409, 'not_deleted');
                if ((int)$baseRev !== (int)$w['rev']) sh_fail(409, 'stale_revision', ['current' => sh_wf_public($w)]);
                $w['deleted'] = null;
                $w['rev']++;
                $w['updatedBy'] = $u['email'];
                $w['updatedAt'] = sh_now();
                $db['workflow'][$kind][$id] = $w;
                sh_audit($db, $u, 'workflow.restore', $kind . ':' . $id, null, $w['record']);
                return ['ok' => true, 'item' => sh_wf_public($w)];
            });
        }
        sh_fail(405, 'method_not_allowed');
    }

    if ($s0 === 'migrate' && $n === 1) {
        if ($method !== 'POST') sh_fail(405, 'method_not_allowed');
        $u = sh_require_write('admin');
        $b = sh_body();
        $dry = !isset($b['dryRun']) || $b['dryRun'] !== false;
        $payload = ['workflow' => isset($b['workflow']) && is_array($b['workflow']) ? $b['workflow'] : [], 'creatorEdits' => isset($b['creatorEdits']) && is_array($b['creatorEdits']) ? $b['creatorEdits'] : []];
        $runId = substr(sha1(json_encode($payload)), 0, 16);
        $backup = $dry ? null : sh_backup_db('premigrate');
        $report = sh_tx(!$dry, function (&$db) use ($u, $payload, $dry, $runId) {
            $rep = ['runId' => $runId, 'dryRun' => $dry, 'workflow' => ['created' => 0, 'skipped_exists' => 0, 'skipped_seed' => 0, 'invalid' => 0],
                'creatorEdits' => ['applied' => 0, 'skipped_newer_shared' => 0, 'quarantined' => 0, 'invalid' => 0, 'sheet_fields_ignored' => 0]];
            foreach (SH_KINDS as $kind) {
                $list = isset($payload['workflow'][$kind]) && is_array($payload['workflow'][$kind]) ? $payload['workflow'][$kind] : [];
                foreach ($list as $rec) {
                    $id = is_array($rec) && isset($rec['id']) ? $rec['id'] : null;
                    if (!sh_idlike($id)) { $rep['workflow']['invalid']++; continue; }
                    if (preg_match(SH_SEED_ID, $id)) { $rep['workflow']['skipped_seed']++; continue; }
                    if (isset($db['workflow'][$kind][$id])) { $rep['workflow']['skipped_exists']++; continue; }
                    try {
                        if (!$dry) sh_wf_put($db, $u, $kind, $id, 0, $rec, 'migrate.workflow');
                        else sh_wf_clean($rec, $id);
                        $rep['workflow']['created']++;
                    } catch (ShHttp $e) { $rep['workflow']['invalid']++; }
                }
            }
            $res = null;
            if ($payload['creatorEdits']) {
                if ($dry) { $copy = $db; list($s, $res) = sh_reconciled($copy); } else { list($s, $res) = sh_reconciled($db); }
            }
            foreach ($payload['creatorEdits'] as $name => $fields) {
                $name = (string)$name;
                if (is_array($fields)) {
                    foreach (SH_SHEET_FIELDS as $sf) if (array_key_exists($sf, $fields)) { unset($fields[$sf]); $rep['creatorEdits']['sheet_fields_ignored']++; }
                }
                if (!$fields) continue;
                try { list($known, $meta) = sh_validate_fields($fields); } catch (ShHttp $e) { $rep['creatorEdits']['invalid']++; continue; }
                $m = sh_ident_by_name($res, $name);
                if (!$m['uid']) {
                    $rep['creatorEdits']['quarantined']++;
                    if (!$dry) { $key = 'name:' . sh_norm_name($name) . ':' . $m['status']; $db['quarantine'][$key] = ['key' => $key, 'kind' => 'legacy_creator_edit', 'name' => $name, 'reason' => $m['status'], 'fields' => $known + $meta, 'ts' => sh_now()]; }
                    continue;
                }
                $e = sh_ext_get($db, $m['uid']);
                if ($e['rev'] > 0) { $rep['creatorEdits']['skipped_newer_shared']++; continue; }
                if (!$dry) sh_ext_apply($db, $u, $m['uid'], 0, $known, $meta, 'migrate.creator_edit');
                $rep['creatorEdits']['applied']++;
            }
            if (!$dry) {
                $db['migrations'][$runId] = ['runId' => $runId, 'lastRunAt' => sh_now(), 'by' => $u['email'], 'report' => $rep];
                sh_audit($db, $u, 'migrate.apply', 'run:' . $runId, null, $rep);
            }
            return $rep;
        });
        $report['backup'] = $backup;
        return ['ok' => true, 'report' => $report];
    }

    if (($s0 === 'audit' || $s0 === 'quarantine') && $n === 1) {
        if ($method !== 'GET') sh_fail(405, 'method_not_allowed');
        sh_require('admin');
        return sh_tx(false, function (&$db) use ($s0) {
            return $s0 === 'audit' ? ['ok' => true, 'audit' => array_slice($db['audit'], -200)] : ['ok' => true, 'quarantine' => array_values($db['quarantine'])];
        });
    }

    sh_fail(404, 'not_found');
}

mk_run('mk_api_route');
