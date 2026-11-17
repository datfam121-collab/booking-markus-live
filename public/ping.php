<?php
/**
 * ping.php - heartbeat. POST (body ignored). The email is the SESSION email, never a client value.
 * Writes <state>/activity/<safe>.json with the same key rule activity.php / app.js use.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';

mk_run(function () {
    mk_method('POST');
    $u = sh_require_write('viewer');
    $safe = preg_replace('/[^a-z0-9._-]/', '_', strtolower($u['email']));
    $t = time();
    if (@file_put_contents(sh_sub_dir('activity') . '/' . $safe . '.json', json_encode(['lastSeen' => $t]), LOCK_EX) === false) sh_fail(500, 'activity_write_failed');
    return ['ok' => true, 't' => $t];
});
