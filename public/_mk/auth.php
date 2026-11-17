<?php
// Sessions, Google ID-token verification, Employees lookup. Roles come ONLY from the Employees tab.
defined('MKP') || exit;

const SH_RANK = ['viewer' => 1, 'planner' => 2, 'admin' => 3];
const MK_SESSION_IDLE = 28800;
const MK_SESSION_ABS = 86400;
const MK_EMP_TTL = 60;
const MK_EMP_STALE_MAX = 900;

function mk_role_text($raw)
{
    $r = strtolower(trim((string)$raw));
    if ($r === 'admin' || $r === 'owner') return 'admin';
    if ($r === 'planner' || $r === 'manager' || $r === 'account') return 'planner';
    return 'viewer';
}

function mk_gateway()
{
    static $gw = null;
    $h = sh_hook('gateway');
    if ($h) return $h;
    if ($gw === null) {
        require_once __DIR__ . '/gateway.php';
        $gw = new MkGoogleGateway();
    }
    return $gw;
}

/* ---------- Employees directory (cached, fail closed) ---------- */

function mk_employees_flush()
{
    @unlink(sh_data_dir() . '/employees-cache.json');
}

function mk_employees($fresh = false)
{
    $path = sh_data_dir() . '/employees-cache.json';
    $cache = null;
    if (is_file($path)) {
        $c = json_decode((string)@file_get_contents($path), true);
        if (is_array($c) && isset($c['ts'], $c['rows']) && is_array($c['rows'])) $cache = $c;
    }
    if (!$fresh && $cache && time() - (int)$cache['ts'] < MK_EMP_TTL) return $cache['rows'];
    try {
        $raw = mk_gateway()->employeesRead();
        $rows = [];
        foreach ($raw as $r) {
            $email = strtolower(trim(isset($r[2]) ? (string)$r[2] : ''));
            if ($email === '') continue;
            $rows[] = ['name' => trim(isset($r[0]) ? (string)$r[0] : ''), 'role' => mk_role_text(isset($r[1]) ? $r[1] : ''), 'email' => $email];
        }
        $tmp = $path . '.tmp' . getmypid();
        if (@file_put_contents($tmp, json_encode(['ts' => time(), 'rows' => $rows])) !== false) @rename($tmp, $path);
        return $rows;
    } catch (Throwable $e) {
        if (!$fresh && $cache && time() - (int)$cache['ts'] < MK_EMP_STALE_MAX) return $cache['rows'];
        error_log('[mkp] employees lookup failed: ' . $e->getMessage());
        sh_fail(503, 'directory_unavailable');
    }
}

function mk_employee_lookup($email, $fresh = false)
{
    $email = strtolower(trim((string)$email));
    if ($email === '') return null;
    foreach (mk_employees($fresh) as $r) if ($r['email'] === $email) return $r;
    return null;
}

/* ---------- Google ID token ---------- */

function mk_b64u($s)
{
    $s = strtr((string)$s, '-_', '+/');
    $pad = strlen($s) % 4;
    if ($pad) $s .= str_repeat('=', 4 - $pad);
    return base64_decode($s, true);
}

function mk_der_len($l)
{
    if ($l < 128) return chr($l);
    $s = ltrim(pack('N', $l), "\0");
    return chr(0x80 | strlen($s)) . $s;
}

function mk_der_int($b)
{
    if ($b === '' || (ord($b[0]) & 0x80)) $b = "\0" . $b;
    return "\x02" . mk_der_len(strlen($b)) . $b;
}

function mk_jwk_pem($n, $e)
{
    $ints = mk_der_int($n) . mk_der_int($e);
    $seq = "\x30" . mk_der_len(strlen($ints)) . $ints;
    $bit = "\x03" . mk_der_len(strlen($seq) + 1) . "\0" . $seq;
    $algo = hex2bin('300d06092a864886f70d0101010500');
    $spki = "\x30" . mk_der_len(strlen($algo . $bit)) . $algo . $bit;
    return "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($spki), 64, "\n") . "-----END PUBLIC KEY-----\n";
}

function mk_http_get_json($url)
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => true]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $j = json_decode((string)$resp, true);
    return is_array($j) ? $j : null;
}

function mk_jwks($force)
{
    $path = sh_data_dir() . '/jwks-cache.json';
    $c = is_file($path) ? json_decode((string)@file_get_contents($path), true) : null;
    $age = is_array($c) && isset($c['ts']) ? time() - (int)$c['ts'] : PHP_INT_MAX;
    if (is_array($c) && isset($c['keys']) && $age < 3600 && !($force && $age > 300)) return $c['keys'];
    $j = mk_http_get_json('https://www.googleapis.com/oauth2/v3/certs');
    if (!$j || empty($j['keys'])) {
        if (is_array($c) && isset($c['keys']) && $age < 86400) return $c['keys'];
        sh_fail(503, 'jwks_unavailable');
    }
    @file_put_contents($path, json_encode(['ts' => time(), 'keys' => $j['keys']]));
    return $j['keys'];
}

// Returns verified claims or throws ShHttp(401).
function mk_google_verify($idToken)
{
    $h = sh_hook('verify_token');
    if ($h) return $h($idToken);
    if (!is_string($idToken) || strlen($idToken) > 4096 || substr_count($idToken, '.') !== 2) sh_fail(401, 'bad_token');
    list($h64, $p64, $s64) = explode('.', $idToken);
    $head = json_decode((string)mk_b64u($h64), true);
    $claims = json_decode((string)mk_b64u($p64), true);
    $sig = mk_b64u($s64);
    if (!is_array($head) || !is_array($claims) || $sig === false || $sig === '') sh_fail(401, 'bad_token');
    if (!isset($head['alg']) || $head['alg'] !== 'RS256' || empty($head['kid'])) sh_fail(401, 'bad_token');
    $jwk = null;
    foreach ([false, true] as $force) {
        foreach (mk_jwks($force) as $k) if (isset($k['kid'], $k['n'], $k['e']) && $k['kid'] === $head['kid']) { $jwk = $k; break; }
        if ($jwk) break;
    }
    if (!$jwk) sh_fail(401, 'unknown_key');
    $n = mk_b64u($jwk['n']);
    $e = mk_b64u($jwk['e']);
    if ($n === false || $e === false) sh_fail(401, 'bad_key');
    $ok = openssl_verify($h64 . '.' . $p64, $sig, mk_jwk_pem($n, $e), OPENSSL_ALGO_SHA256);
    if ($ok !== 1) sh_fail(401, 'bad_signature');
    $iss = isset($claims['iss']) ? $claims['iss'] : '';
    if ($iss !== 'https://accounts.google.com' && $iss !== 'accounts.google.com') sh_fail(401, 'bad_issuer');
    if (!isset($claims['aud']) || $claims['aud'] !== MKP_CLIENT_ID) sh_fail(401, 'bad_audience');
    if (!isset($claims['exp']) || (int)$claims['exp'] + 60 < time()) sh_fail(401, 'token_expired');
    if (empty($claims['email']) || empty($claims['email_verified'])) sh_fail(401, 'email_unverified');
    return $claims;
}

/* ---------- Server sessions ---------- */

function mk_session_boot()
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_save_path(sh_sub_dir('sessions'));
    session_name('MKSID');
    ini_set('session.use_strict_mode', '1');
    ini_set('session.use_only_cookies', '1');
    ini_set('session.gc_maxlifetime', (string)MK_SESSION_IDLE);
    ini_set('session.gc_probability', '1');
    ini_set('session.gc_divisor', '50');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => sh_https(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

function mk_login_session(array $acct)
{
    mk_session_boot();
    session_regenerate_id(true);
    $csrf = bin2hex(random_bytes(32));
    $_SESSION = ['email' => $acct['email'], 'name' => $acct['name'], 'csrf' => $csrf, 'created' => time(), 'last' => time()];
    session_write_close();
    return $csrf;
}

function mk_logout_session()
{
    mk_session_boot();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => $p['path'], 'secure' => sh_https(), 'httponly' => true, 'samesite' => 'Lax']);
    }
    session_destroy();
}

// Current user or null. The role is re-derived from the Employees directory on every request.
function sh_current_user()
{
    static $cached = false;
    if ($cached !== false) return $cached;
    $name = 'MKSID';
    if (empty($_COOKIE[$name])) return $cached = null;
    mk_session_boot();
    $s = $_SESSION;
    session_write_close();
    if (empty($s['email']) || empty($s['csrf'])) return $cached = null;
    $age = time() - (int)$s['created'];
    $idle = time() - (int)$s['last'];
    if ($age > MK_SESSION_ABS || $idle > MK_SESSION_IDLE) { mk_logout_session(); return $cached = null; }
    $emp = mk_employee_lookup($s['email']);
    if (!$emp) { mk_logout_session(); return $cached = null; }
    if ($idle > 300) {
        mk_session_boot();
        $_SESSION['last'] = time();
        session_write_close();
    }
    return $cached = ['email' => $emp['email'], 'name' => $emp['name'] !== '' ? $emp['name'] : $s['name'], 'role' => $emp['role'], 'csrf' => $s['csrf']];
}

function sh_require($min)
{
    $u = sh_current_user();
    if (!$u) sh_fail(401, 'unauthenticated');
    if (SH_RANK[$u['role']] < SH_RANK[$min]) sh_fail(403, 'forbidden');
    return $u;
}

function sh_require_write($min)
{
    $u = sh_require($min);
    sh_origin_check();
    $t = isset($_SERVER['HTTP_X_CSRF_TOKEN']) ? $_SERVER['HTTP_X_CSRF_TOKEN'] : '';
    if (!is_string($t) || $t === '' || !hash_equals($u['csrf'], $t)) sh_fail(403, 'csrf_invalid');
    return $u;
}

function mk_rate_limit($u, $bucket, $max, $window)
{
    $dir = sh_sub_dir('ratelimit');
    $f = $dir . '/' . $bucket . '-' . sha1($u['email']) . '.json';
    $fh = fopen($f, 'c+');
    if (!$fh) return;
    flock($fh, LOCK_EX);
    $d = json_decode((string)stream_get_contents($fh), true);
    $now = time();
    if (!is_array($d) || $now - (int)$d['t'] >= $window) $d = ['t' => $now, 'n' => 0];
    $d['n']++;
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($d));
    flock($fh, LOCK_UN);
    fclose($fh);
    if ($d['n'] > $max) sh_fail(429, 'rate_limited');
}
