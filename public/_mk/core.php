<?php
// Shared core for the Booking production endpoints (PHP 7.4). Not directly reachable: _mk/.htaccess denies all.
defined('MKP') || exit;

if (!defined('MKP_ROOT')) define('MKP_ROOT', dirname(__DIR__));
if (!defined('MKP_STATE_DIR')) define('MKP_STATE_DIR', getenv('MKP_STATE_DIR') ?: '/srv/booking-state');
// Credentials stay where they already are on the host (absolute paths, so the live docroot and any stage dir work without copying keys). Paths only; contents are read at use time.
if (!defined('MKP_HOSTING_DIR')) define('MKP_HOSTING_DIR', getenv('MKP_HOSTING_DIR') ?: '/srv/booking-private');
if (!defined('MKP_SA_PATH')) define('MKP_SA_PATH', getenv('MKP_SA_PATH') ?: MKP_HOSTING_DIR . '/service-account.json');
if (!defined('MKP_AI_KEY_PATH')) define('MKP_AI_KEY_PATH', getenv('MKP_AI_KEY_PATH') ?: MKP_HOSTING_DIR . '/deepseek-key.txt');
if (!defined('MKP_CLIENT_ID')) define('MKP_CLIENT_ID', 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com');
if (!defined('MKP_SHEET_ID')) define('MKP_SHEET_ID', 'YOUR_GOOGLE_SHEET_ID');

class ShHttp extends Exception
{
    public $status;
    public $errCode;
    public $extra;
    public $persist = false;

    public function __construct($status, $errCode, array $extra = [])
    {
        parent::__construct($errCode);
        $this->status = $status;
        $this->errCode = $errCode;
        $this->extra = $extra;
    }
}

function sh_fail($status, $code, array $extra = [])
{
    throw new ShHttp($status, $code, $extra);
}

function sh_now()
{
    return gmdate('Y-m-d\TH:i:s\Z');
}

function sh_send($payload, $status = 200)
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
    }
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PARTIAL_OUTPUT_ON_ERROR);
}

function sh_data_dir()
{
    $d = rtrim(MKP_STATE_DIR, '/\\');
    if (!is_dir($d) && !@mkdir($d, 0700, true) && !is_dir($d)) sh_fail(500, 'state_dir_unavailable');
    return $d;
}

function sh_sub_dir($name)
{
    $d = sh_data_dir() . '/' . $name;
    if (!is_dir($d) && !@mkdir($d, 0700, true) && !is_dir($d)) sh_fail(500, 'state_dir_unavailable');
    return $d;
}

function sh_is_loopback()
{
    $ra = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : '';
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    $hostOk = preg_match('~^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$~', $host) === 1;
    return ($ra === '127.0.0.1' || $ra === '::1') && $hostOk;
}

function sh_hook($name)
{
    return isset($GLOBALS['MKP_HOOKS'][$name]) ? $GLOBALS['MKP_HOOKS'][$name] : null;
}

// Test-only injection point. In production MKP_ENV is unset, so nothing below this line ever runs.
if (getenv('MKP_ENV') === 'test') {
    $mkpBoot = getenv('MKP_TEST_BOOT');
    if ($mkpBoot && is_file($mkpBoot) && is_file(sh_data_dir() . '/TEST_ONLY.marker') && sh_is_loopback()) {
        $GLOBALS['MKP_HOOKS'] = [];
        require $mkpBoot;
    }
}

function sh_https()
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strtolower($_SERVER['HTTP_X_FORWARDED_PROTO']) === 'https');
}

function sh_origin_check()
{
    $host = isset($_SERVER['HTTP_HOST']) ? strtolower($_SERVER['HTTP_HOST']) : '';
    $o = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : null;
    if ($o === null) {
        $ref = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : null;
        if ($ref === null) sh_fail(403, 'origin_required');
        $o = $ref;
    }
    $oh = parse_url($o, PHP_URL_HOST);
    $op = parse_url($o, PHP_URL_PORT);
    if (!$oh) sh_fail(403, 'origin_mismatch');
    $oh = strtolower($oh) . ($op ? ':' . $op : '');
    if ($oh !== $host) sh_fail(403, 'origin_mismatch');
}

function sh_body()
{
    $ct = isset($_SERVER['CONTENT_TYPE']) ? strtolower($_SERVER['CONTENT_TYPE']) : '';
    if (strpos($ct, 'application/json') !== 0) sh_fail(415, 'json_required');
    $raw = file_get_contents('php://input', false, null, 0, 262145);
    if ($raw === false || strlen($raw) > 262144) sh_fail(413, 'body_too_large');
    $b = json_decode($raw, true);
    if (!is_array($b)) sh_fail(400, 'bad_json');
    return $b;
}

function mk_run($fn)
{
    try {
        $out = $fn();
        if ($out !== null) sh_send($out);
    } catch (ShHttp $e) {
        sh_send(array_merge(['ok' => false, 'error' => $e->errCode], $e->extra), $e->status);
    } catch (Throwable $e) {
        error_log('[mkp] ' . get_class($e) . ': ' . $e->getMessage());
        sh_send(['ok' => false, 'error' => 'server_error'], 500);
    }
}

function mk_method($allowed)
{
    $m = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
    if (!in_array($m, (array)$allowed, true)) sh_fail(405, 'method_not_allowed');
    return $m;
}

require_once __DIR__ . '/auth.php';
