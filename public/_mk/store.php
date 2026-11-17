<?php
// JSON + flock atomic persistence in the private state dir. db.json guarded by db.lock; temp file then rename.
defined('MKP') || exit;

function sh_db_empty()
{
    return ['v' => 1, 'identity' => [], 'ext' => [], 'workflow' => ['deals' => [], 'campaigns' => [], 'contents' => [], 'payments' => []],
        'audit' => [], 'quarantine' => [], 'migrations' => []];
}

function sh_db_normalize($db)
{
    $e = sh_db_empty();
    foreach ($e as $k => $v) if (!isset($db[$k])) $db[$k] = $v;
    foreach (['identity', 'ext', 'migrations', 'quarantine'] as $k) if (!is_array($db[$k])) $db[$k] = [];
    if (!is_array($db['workflow'])) $db['workflow'] = [];
    foreach (['deals', 'campaigns', 'contents', 'payments'] as $k) if (!isset($db['workflow'][$k]) || !is_array($db['workflow'][$k])) $db['workflow'][$k] = [];
    return $db;
}

function sh_db_write($path, $db)
{
    $json = json_encode($db, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
    if ($json === false) sh_fail(500, 'db_encode_failed');
    $tmp = $path . '.tmp' . getmypid();
    if (file_put_contents($tmp, $json) === false) sh_fail(500, 'db_write_failed');
    @chmod($tmp, 0600);
    if (!rename($tmp, $path)) { @unlink($tmp); sh_fail(500, 'db_rename_failed'); }
}

// $fn receives the db array by reference. Nothing is written if $fn throws (unless ->persist is set).
function sh_tx($write, $fn)
{
    $dir = sh_data_dir();
    $lock = fopen($dir . '/db.lock', 'c');
    if (!$lock) sh_fail(500, 'lock_unavailable');
    flock($lock, $write ? LOCK_EX : LOCK_SH);
    try {
        $path = $dir . '/db.json';
        $raw = is_file($path) ? file_get_contents($path) : '';
        if ($raw === false) sh_fail(500, 'db_unreadable');
        if (trim($raw) === '') {
            $db = sh_db_normalize([]);
        } else {
            $db = json_decode($raw, true);
            if (!is_array($db)) sh_fail(500, 'db_corrupt');
            $db = sh_db_normalize($db);
        }
        try {
            $res = $fn($db);
        } catch (ShHttp $e) {
            if ($write && $e->persist) sh_db_write($path, $db);
            throw $e;
        }
        if ($write) sh_db_write($path, $db);
        return $res;
    } finally {
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}

function sh_audit(array &$db, $actor, $action, $target, $before, $after)
{
    $db['audit'][] = ['ts' => sh_now(), 'actor' => $actor['email'], 'role' => $actor['role'], 'action' => $action, 'target' => $target, 'before' => $before, 'after' => $after];
    if (count($db['audit']) > 5000) $db['audit'] = array_slice($db['audit'], -5000);
}

function sh_backup_db($label)
{
    $dir = sh_data_dir();
    $path = $dir . '/db.json';
    if (!is_file($path)) return null;
    $bdir = sh_sub_dir('backups');
    $dest = $bdir . '/db-' . gmdate('Ymd-His') . '-' . preg_replace('/[^a-z0-9_-]/i', '', $label) . '-' . bin2hex(random_bytes(2)) . '.json';
    return copy($path, $dest) ? basename($dest) : null;
}
