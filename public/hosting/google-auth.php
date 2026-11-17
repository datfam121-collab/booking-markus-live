<?php
/**
 * google-auth.php — Đăng nhập Google cho Markus Influencer OS v1.0.3
 * POST { idToken } → verify JWT Google → check tab Employees trong Google Sheet → trả {name,email,role,picture}
 * Chạy PHP 7.4+ thuần (openssl + curl), không cần composer.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

// ---------- Cấu hình ----------
$CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
$SHEET_ID  = 'YOUR_GOOGLE_SHEET_ID';   // Markus_Influencer_OS_v1
$SERVICE_ACCOUNT = __DIR__ . '/service-account.json';          // key service account (server-side, không lộ)

// ---------- Nhận body ----------
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$idToken = isset($body['idToken']) ? trim((string)$body['idToken']) : '';
if ($idToken === '') { http_response_code(400); echo json_encode(['error' => 'Thiếu idToken.']); exit; }

// ---------- Verify Google ID Token (JWT RSA) ----------
function b64url_decode($s) {
    $r = strtr($s, '-_', '+/');
    return base64_decode($r . str_repeat('=', (4 - strlen($r) % 4) % 4));
}

function verify_google_token($idToken, $clientId) {
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) return null;
    list($h64, $p64, $s64) = $parts;

    $header = json_decode(b64url_decode($h64), true);
    $payload = json_decode(b64url_decode($p64), true);
    if (!$header || !$payload) return null;

    // Check exp
    if (isset($payload['exp']) && time() > $payload['exp'] + 60) return null;
    // Check iss
    $iss = $payload['iss'] ?? '';
    if (!in_array($iss, ['accounts.google.com', 'https://accounts.google.com'])) return null;
    // Check aud
    if (($payload['aud'] ?? '') !== $clientId) return null;
    // Check email_verified
    if (empty($payload['email_verified'])) return null;

    // Lấy certs Google
    $ch = curl_init('https://www.googleapis.com/oauth2/v3/certs');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);
    $certsResp = curl_exec($ch);
    curl_close($ch);
    if (!$certsResp) return null;
    $certs = json_decode($certsResp, true);
    if (!isset($certs['keys'])) return null;

    $kid = $header['kid'] ?? '';
    $key = null;
    foreach ($certs['keys'] as $k) {
        if (($k['kid'] ?? '') === $kid) { $key = $k; break; }
    }
    if (!$key || !isset($key['n']) || !isset($key['e'])) return null;

    // RSA public key từ n,e
    $n = b64url_decode($key['n']);
    $e = b64url_decode($key['e']);
    if (!$n || !$e) return null;
    $pem = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode(
        "\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00\x03" .
        "\x82\x01\x01\x00" . $n
    )) . "-----END PUBLIC KEY-----";
    // (Cách trên đơn giản; nếu lỗi sẽ fallback dùng openssl_pkey_get_public từ JWK)

    $pub = openssl_pkey_get_public($pem);
    if (!$pub) {
        // Fallback: build DER đầy đủ
        $der = "\x30\x82\x01\x22\x30\x0d\x06\x09\x2a\x86\x48\x86\xf7\x0d\x01\x01\x01\x05\x00\x03\x82\x01\x0f\x00\x30\x82\x01\x0a\x02\x82\x01\x01\x00" . $n . "\x02\x03\x01\x00\x01";
        $pem2 = "-----BEGIN PUBLIC KEY-----\n" . chunk_split(base64_encode($der)) . "-----END PUBLIC KEY-----";
        $pub = openssl_pkey_get_public($pem2);
    }
    if (!$pub) return null;

    $ok = openssl_verify($h64 . '.' . $p64, b64url_decode($s64), $pub, OPENSSL_ALGO_SHA256);
    if ($ok !== 1) return null;

    return $payload;
}

$payload = verify_google_token($idToken, $CLIENT_ID);
if (!$payload) { http_response_code(401); echo json_encode(['error' => 'Token Google không hợp lệ.']); exit; }

$email = strtolower(trim((string)$payload['email']));

// ---------- Đọc tab Employees từ Google Sheets (service account) ----------
function sheets_access_token($saFile) {
    if (!file_exists($saFile)) return null;
    $sa = json_decode(file_get_contents($saFile), true);
    if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) return null;

    $now = time();
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $claim = json_encode([
        'iss'   => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/spreadsheets.readonly',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
    ]);
    $b64h = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $b64c = rtrim(strtr(base64_encode($claim), '+/', '-_'), '=');
    $signInput = $b64h . '.' . $b64c;
    $sig = '';
    openssl_sign($signInput, $sig, $sa['private_key'], OPENSSL_ALGO_SHA256);
    $b64s = rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');
    $jwt = $signInput . '.' . $b64s;

    $ch = curl_init('https://oauth2.googleapis.com/token');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion'  => $jwt,
        ]),
        CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($resp, true);
    return isset($data['access_token']) ? $data['access_token'] : null;
}

$token = sheets_access_token($SERVICE_ACCOUNT);
if (!$token) { http_response_code(500); echo json_encode(['error' => 'Không lấy được access token Google.']); exit; }

$ch = curl_init('https://sheets.googleapis.com/v4/spreadsheets/' . $SHEET_ID . '/values/Employees!A2:C200');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
    CURLOPT_TIMEOUT => 15,
]);
$empResp = curl_exec($ch);
curl_close($ch);
$empData = json_decode($empResp, true);
$rows = isset($empData['values']) ? $empData['values'] : [];

// Tìm email trong Employees (cột C)
$found = null;
foreach ($rows as $r) {
    $mail = isset($r[2]) ? strtolower(trim((string)$r[2])) : '';
    if ($mail === $email) {
        $found = [
            'name' => isset($r[0]) ? (string)$r[0] : $email,
            'role' => isset($r[1]) ? (string)$r[1] : 'Viewer',
        ];
        break;
    }
}

if (!$found) {
    http_response_code(401);
    echo json_encode(['error' => 'Email chưa được cấp quyền. Liên hệ Admin để được thêm vào danh sách.']);
    exit;
}

// Role map
$role = strtolower($found['role']);
if (in_array($role, ['admin', 'planner', 'viewer'])) {
    // ok
} elseif ($role === 'admin') { $role = 'admin'; }
elseif ($role === 'planner' || $role === 'account') { $role = 'planner'; }
else { $role = 'viewer'; }

echo json_encode([
    'name'    => $found['name'],
    'email'   => $email,
    'role'    => $role,
    'picture' => isset($payload['picture']) ? $payload['picture'] : '',
]);
