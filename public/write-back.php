<?php
/**
 * write-back.php - hardened Sheet write-back for the existing CREATOR_DB and Employees tabs.
 *
 * Creator:   POST { name, updates:{SheetColumn:value}, create?:true }   (planner|admin, CSRF)
 * Employees: POST { kind:"employees", op:"list"|"save"|"delete", email, name, role, oldEmail }   (admin, CSRF)
 *
 * Changes vs baseline: session/role/CSRF; RAW writes (no formula evaluation); ambiguous or unknown names never write
 * (409 / 404) and a row is appended only with explicit create:true; unknown columns are reported in `skipped`, never
 * silently dropped; Creator_Name renames are validated and cannot collide with another row.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';
require __DIR__ . '/_mk/shared.php';

function mk_wb_role_label($raw)
{
    $r = mk_role_text($raw);
    return $r === 'admin' ? 'Admin' : ($r === 'planner' ? 'Planner' : 'Viewer');
}

function mk_wb_value($v)
{
    if (is_bool($v)) return $v ? 'TRUE' : 'FALSE';
    if (is_int($v) || is_float($v)) return (string)$v;
    if ($v === null) return '';
    if (!is_string($v)) sh_fail(422, 'bad_value');
    if (mb_strlen($v, 'UTF-8') > 2000) sh_fail(422, 'value_too_long');
    if (preg_match('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', $v)) sh_fail(422, 'bad_value');
    return $v;
}

function mk_wb_lock()
{
    $fh = fopen(sh_data_dir() . '/sheet-write.lock', 'c');
    if (!$fh) sh_fail(500, 'lock_unavailable');
    flock($fh, LOCK_EX);
    return $fh;
}

function mk_wb_creator($u, array $b)
{
    $name = isset($b['name']) && is_string($b['name']) ? $b['name'] : '';
    $updates = isset($b['updates']) && is_array($b['updates']) ? $b['updates'] : [];
    if (trim($name) === '' || !$updates) sh_fail(400, 'name_and_updates_required');
    $create = isset($b['create']) && $b['create'] === true;
    $lock = mk_wb_lock();
    try {
        $gw = mk_gateway();
        $grid = $gw->gridRead();
        if (!$grid) sh_fail(502, 'sheet_unreadable');
        $header = array_map(function ($h) { return trim((string)$h); }, $grid[0]);
        $colOf = [];
        foreach ($header as $i => $h) if ($h !== '' && !isset($colOf[$h])) $colOf[$h] = $i;
        if (!isset($colOf['Creator_Name'])) sh_fail(500, 'creator_name_column_missing');
        $nameCol = $colOf['Creator_Name'];
        $want = sh_norm_name($name);
        $hits = [];
        $taken = [];
        for ($i = 1; $i < count($grid); $i++) {
            $n = sh_norm_name(isset($grid[$i][$nameCol]) ? $grid[$i][$nameCol] : '');
            if ($n === '') continue;
            $taken[$n][] = $i;
            if ($n === $want) $hits[] = $i;
        }
        $cells = [];
        $skipped = [];
        $updated = [];
        $vals = [];
        foreach ($updates as $col => $val) {
            $col = trim((string)$col);
            if (!isset($colOf[$col])) { $skipped[] = $col; continue; }
            $vals[$col] = mk_wb_value($val);
        }
        if (!$vals) sh_fail(400, 'no_matching_columns', ['skipped' => $skipped]);
        if (isset($vals['Creator_Name'])) {
            $new = sh_norm_name($vals['Creator_Name']);
            if ($new === '' || preg_match('/[\r\n]/', $vals['Creator_Name'])) sh_fail(422, 'bad_name');
            if ($new !== $want && isset($taken[$new])) sh_fail(409, 'name_taken');
        }
        if (count($hits) > 1) sh_fail(409, 'ambiguous_name', ['count' => count($hits)]);
        if (count($hits) === 1 && isset($b['createOnly']) && $b['createOnly'] === true) sh_fail(409, 'name_taken');
        if (count($hits) === 1) {
            $idx = $hits[0];
            foreach ($vals as $col => $val) { $cells[] = ['row' => $idx + 3, 'col' => $colOf[$col], 'val' => $val]; $updated[] = $col; }
            $gw->cellsWrite($cells);
            mk_sheet_flush();
            return ['ok' => true, 'mode' => 'update', 'row' => $idx + 3, 'updated' => $updated, 'skipped' => $skipped];
        }
        if (!$create) sh_fail(404, 'creator_not_found');
        if (!isset($vals['Creator_Name']) || sh_norm_name($vals['Creator_Name']) === '') sh_fail(422, 'name_required_for_create');
        if (isset($taken[sh_norm_name($vals['Creator_Name'])])) sh_fail(409, 'name_taken');
        $row = array_fill(0, count($header), '');
        foreach ($vals as $col => $val) { $row[$colOf[$col]] = $val; $updated[] = $col; }
        $gw->rowAppend($row);
        mk_sheet_flush();
        return ['ok' => true, 'mode' => 'append', 'row' => 0, 'updated' => $updated, 'skipped' => $skipped];
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function mk_wb_employees($u, array $b)
{
    $op = isset($b['op']) ? $b['op'] : '';
    $lock = mk_wb_lock();
    try {
        $gw = mk_gateway();
        $raw = $gw->employeesRead();
        $rows = [];
        foreach ($raw as $r) {
            $email = strtolower(trim(isset($r[2]) ? (string)$r[2] : ''));
            if ($email === '') continue;
            $rows[] = [trim(isset($r[0]) ? (string)$r[0] : ''), isset($r[1]) ? (string)$r[1] : '', $email];
        }
        $prev = count($raw);
        if ($op === 'list') {
            return ['ok' => true, 'rows' => array_map(function ($r) { return ['name' => $r[0], 'role' => $r[1], 'email' => $r[2]]; }, $rows), 'count' => count($rows)];
        }
        $email = strtolower(trim(isset($b['email']) ? (string)$b['email'] : ''));
        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 200) sh_fail(400, 'bad_email');
        if ($op === 'delete') {
            $i = null;
            foreach ($rows as $k => $r) if ($r[2] === $email) { $i = $k; break; }
            if ($i === null) sh_fail(404, 'employee_not_found');
            if (count($rows) <= 1) sh_fail(400, 'cannot_delete_last');
            if ($email === $u['email']) sh_fail(400, 'cannot_delete_self');
            array_splice($rows, $i, 1);
        } elseif ($op === 'save') {
            $name = trim(isset($b['name']) ? (string)$b['name'] : '');
            if ($name === '' || mb_strlen($name, 'UTF-8') > 120 || preg_match('/[\r\n]/', $name)) sh_fail(400, 'name_required');
            $role = mk_wb_role_label(isset($b['role']) ? $b['role'] : '');
            $old = strtolower(trim(isset($b['oldEmail']) ? (string)$b['oldEmail'] : ''));
            $target = null;
            foreach ($rows as $k => $r) if ($r[2] === ($old !== '' ? $old : $email)) { $target = $k; break; }
            foreach ($rows as $k => $r) if ($r[2] === $email && $k !== $target) sh_fail(409, 'duplicate_email');
            if ($target === null) {
                $rows[] = [$name, $role, $email];
            } else {
                if ($rows[$target][2] === $u['email'] && $role !== 'Admin') sh_fail(400, 'cannot_demote_self');
                $rows[$target] = [$name, $role, $email];
            }
            $admins = 0;
            foreach ($rows as $r) if (mk_role_text($r[1]) === 'admin') $admins++;
            if ($admins === 0) sh_fail(400, 'no_admin_left');
        } else {
            sh_fail(400, 'bad_op');
        }
        $gw->employeesWrite($rows, $prev);
        mk_employees_flush();
        return ['ok' => true, 'op' => $op, 'count' => count($rows)];
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

mk_run(function () {
    mk_method('POST');
    $b = sh_body();
    if (isset($b['kind']) && $b['kind'] === 'employees') {
        $u = sh_require_write('admin');
        return mk_wb_employees($u, $b);
    }
    $u = sh_require_write('planner');
    return mk_wb_creator($u, $b);
});
