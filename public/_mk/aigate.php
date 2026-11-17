<?php
// Gate in front of the unchanged baseline AI endpoints (shipped as ai-*.impl.php by build-production.mjs).
defined('MKP') || exit;

// Fail-closed public-address check used by ai-fetch (PHP 7.4 filter_var misses mapped/CGNAT/doc/benchmark ranges).
function mk_ip_public($ip)
{
    $bin = @inet_pton((string)$ip);
    if ($bin === false) return false;
    if (strlen($bin) === 4) {
        $n = unpack('N', $bin);
        $a = $n[1];
        $deny = [
            [0x00000000, 8], [0x0A000000, 8], [0x64400000, 10], [0x7F000000, 8], [0xA9FE0000, 16],
            [0xAC100000, 12], [0xC0000000, 24], [0xC0000200, 24], [0xC0586300, 24], [0xC0A80000, 16],
            [0xC6120000, 15], [0xC6336400, 24], [0xCB007100, 24], [0xE0000000, 4], [0xF0000000, 4],
        ];
        foreach ($deny as $d) {
            $mask = $d[1] === 0 ? 0 : ((0xFFFFFFFF << (32 - $d[1])) & 0xFFFFFFFF);
            if (($a & $mask) === $d[0]) return false;
        }
        return true;
    }
    if (strlen($bin) !== 16) return false;
    $b0 = ord($bin[0]);
    $b1 = ord($bin[1]);
    if (($b0 & 0xE0) !== 0x20) return false;
    if ($b0 === 0x20 && $b1 === 0x02) return false;
    if ($b0 === 0x20 && $b1 === 0x01) {
        $b2 = ord($bin[2]);
        if ($b2 <= 0x01 || ($b2 === 0x0D && ord($bin[3]) === 0xB8)) return false;
    }
    return true;
}

function mk_ai_gate($impl, $bucket)
{
    try {
        $m = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
        if ($m !== 'POST') sh_fail(405, 'method_not_allowed');
        $u = sh_require_write('viewer');
        mk_rate_limit($u, $bucket, 30, 60);
    } catch (ShHttp $e) {
        sh_send(array_merge(['ok' => false, 'error' => $e->errCode], $e->extra), $e->status);
        exit;
    } catch (Throwable $e) {
        error_log('[mkp] ai gate: ' . $e->getMessage());
        sh_send(['ok' => false, 'error' => 'server_error'], 500);
        exit;
    }
    // The baseline file sends "Access-Control-Allow-Origin: *"; drop it right before headers go out.
    header_register_callback(function () { header_remove('Access-Control-Allow-Origin'); header_remove('Access-Control-Allow-Methods'); header_remove('Access-Control-Allow-Headers'); });
    define('MKP_GATED', 1);
    require MKP_ROOT . '/' . $impl;
}
