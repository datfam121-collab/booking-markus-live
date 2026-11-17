<?php
/**
 * activity.php - GET { ok, seen: { <safe-email-key>: <unix-ts> } } from <state>/activity/*.json. Session required.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';

mk_run(function () {
    mk_method('GET');
    sh_require('viewer');
    $seen = [];
    $files = glob(sh_sub_dir('activity') . '/*.json');
    if (is_array($files)) {
        foreach ($files as $file) {
            $d = json_decode((string)@file_get_contents($file), true);
            if (!is_array($d) || !isset($d['lastSeen'])) continue;
            $ts = (int)$d['lastSeen'];
            if ($ts > 0) $seen[basename($file, '.json')] = $ts;
        }
    }
    return ['ok' => true, 'seen' => $seen];
});
