<?php
/**
 * sync-data.php - GET: CREATOR_DB snapshot in the native shape { header, rows, links, linkCols, count, updatedAt }
 * plus server-computed creator `uids` (parallel to rows). Requires a logged-in session (any role). Same-origin only.
 * Viewers receive price/contact cells blanked server-side (admin/planner get the full row).
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';
require __DIR__ . '/_mk/shared.php';

mk_run(function () {
    mk_method('GET');
    $u = sh_require('viewer');
    return mk_sync_payload($u['role']);
});
