<?php
/**
 * google-auth.php - production login. POST { idToken } -> verifies the Google ID token, looks the email up in the
 * existing Employees tab, and starts a server session. Response keeps the legacy shape { name, email, role, picture }
 * and adds { ok, csrf }. The role is read from Employees only; nothing the client sends is trusted.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';

mk_run(function () {
    mk_method('POST');
    sh_origin_check();
    $b = sh_body();
    $tok = isset($b['idToken']) && is_string($b['idToken']) ? $b['idToken'] : '';
    try {
        $claims = mk_google_verify($tok);
        $emp = mk_employee_lookup($claims['email'], true);
    } catch (ShHttp $e) {
        if ($e->status === 401) usleep(250000);
        throw $e;
    }
    if (!$emp) { usleep(250000); sh_fail(401, 'not_authorized'); }
    $name = $emp['name'] !== '' ? $emp['name'] : (isset($claims['name']) ? (string)$claims['name'] : $emp['email']);
    $csrf = mk_login_session(['email' => $emp['email'], 'name' => $name]);
    return ['ok' => true, 'name' => $name, 'email' => $emp['email'], 'role' => $emp['role'], 'picture' => isset($claims['picture']) ? (string)$claims['picture'] : '', 'csrf' => $csrf];
});
