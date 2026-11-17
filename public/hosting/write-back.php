<?php
/**
 * write-back.php — Ghi ngược dữ liệu đã sửa trong app lên tab CREATOR_DB (Markus Influencer OS v1.0.6)
 *
 * POST JSON: { "name": "Tên creator", "updates": { "Tier": "Celeb", "Base_Location": "..." } }
 *   - `name` khớp với cột Creator_Name (không phân biệt hoa thường, bỏ khoảng trắng thừa)
 *   - `updates` dùng ĐÚNG tên cột ở header (dòng 3); cột lạ bị bỏ qua thay vì ghi bừa
 *
 * Trả JSON: { ok, mode: "update"|"append", row, updated: [cột đã ghi] }
 * Chạy PHP 7.4+ thuần (curl), không cần composer — giống sync-data.php.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
$TAB      = 'CREATOR_DB';
$HEADER_ROW = 3;   // header nằm ở dòng 3, dữ liệu bắt đầu từ dòng 4
$SERVICE_ACCOUNT = __DIR__ . '/service-account.json';

function fail($code, $msg, $extra = null) {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg, 'detail' => $extra]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') fail(405, 'Chỉ nhận POST.');

$body = json_decode(file_get_contents('php://input'), true);

/* 1.0.7 (item 5a) — CRUD người dùng trên tab Employees (A2:C200 = Tên | Vai trò | Email),
   cùng nguồn google-auth.php dùng để xác thực. Dùng chung endpoint này vì service account
   ở đây đã có scope ghi. POST { kind:"employees", op:"list"|"save"|"delete", ... } */
if (isset($body['kind']) && $body['kind'] === 'employees') {
    handle_employees(is_array($body) ? $body : [], $SHEET_ID, $SERVICE_ACCOUNT);
    exit;
}

$name = isset($body['name']) ? trim((string)$body['name']) : '';
$updates = (isset($body['updates']) && is_array($body['updates'])) ? $body['updates'] : [];
if ($name === '') fail(400, 'Thiếu tên creator.');
if (!$updates) fail(400, 'Không có trường nào để ghi.');

// Quyền ghi → scope spreadsheets (sync-data.php chỉ cần readonly)
function sheets_access_token($saFile) {
    if (!file_exists($saFile)) return null;
    $sa = json_decode(file_get_contents($saFile), true);
    if (!$sa || empty($sa['client_email']) || empty($sa['private_key'])) return null;
    $now = time();
    $header = json_encode(['alg' => 'RS256', 'typ' => 'JWT']);
    $claim = json_encode([
        'iss'   => $sa['client_email'],
        'scope' => 'https://www.googleapis.com/auth/spreadsheets',
        'aud'   => 'https://oauth2.googleapis.com/token',
        'exp'   => $now + 3600,
        'iat'   => $now,
    ]);
    $b64h = rtrim(strtr(base64_encode($header), '+/', '-_'), '=');
    $b64c = rtrim(strtr(base64_encode($claim), '+/', '-_'), '=');
    $signInput = $b64h . '.' . $b64c;
    $sig = '';
    openssl_sign($signInput, $sig, $sa['private_key'], OPENSSL_ALGO_SHA256);
    $jwt = $signInput . '.' . rtrim(strtr(base64_encode($sig), '+/', '-_'), '=');

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

function api($token, $url, $method = 'GET', $payload = null) {
    $ch = curl_init($url);
    $opt = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token, 'Content-Type: application/json'],
        CURLOPT_TIMEOUT => 45,
        CURLOPT_CUSTOMREQUEST => $method,
    ];
    if ($payload !== null) $opt[CURLOPT_POSTFIELDS] = json_encode($payload, JSON_UNESCAPED_UNICODE);
    curl_setopt_array($ch, $opt);
    $resp = curl_exec($ch);
    curl_close($ch);
    return json_decode($resp, true);
}

/* ---------- Tab Employees: danh sách người được phép đăng nhập ---------- */
// Vai trên sheet viết hoa chữ đầu (Admin/Planner/Viewer) cho khớp google-auth.php
function employee_role_text($r) {
    $map = [
        'admin' => 'Admin', 'owner' => 'Admin',
        'planner' => 'Planner', 'manager' => 'Planner', 'account' => 'Planner',
        'viewer' => 'Viewer', 'staff' => 'Viewer',
    ];
    $k = strtolower(trim((string)$r));
    return isset($map[$k]) ? $map[$k] : 'Viewer';
}

function handle_employees($body, $SHEET_ID, $SERVICE_ACCOUNT) {
    $op = isset($body['op']) ? strtolower((string)$body['op']) : 'list';
    $token = sheets_access_token($SERVICE_ACCOUNT);
    if (!$token) fail(500, 'Không lấy được access token Google.');

    $base  = 'https://sheets.googleapis.com/v4/spreadsheets/' . $SHEET_ID;
    $range = 'Employees!A2:C200';          // dòng 1 là header: Tên | Vai trò | Email
    $read  = api($token, $base . '/values/' . rawurlencode($range));
    if (isset($read['error'])) fail(502, 'Không đọc được tab Employees.', $read['error']);

    $vals = (isset($read['values']) && is_array($read['values'])) ? $read['values'] : [];
    $list = [];
    foreach ($vals as $r) {
        $mail = isset($r[2]) ? trim((string)$r[2]) : '';
        if ($mail === '') continue;        // dòng trống / thiếu email thì bỏ qua
        $list[] = [
            'name'  => isset($r[0]) ? trim((string)$r[0]) : '',
            'role'  => isset($r[1]) ? trim((string)$r[1]) : 'Viewer',
            'email' => strtolower($mail),
        ];
    }
    $prevCount = count($list);

    if ($op === 'list') {
        echo json_encode(['ok' => true, 'rows' => $list, 'count' => $prevCount], JSON_UNESCAPED_UNICODE);
        return;
    }

    $email = strtolower(trim((string)(isset($body['email']) ? $body['email'] : '')));
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) fail(400, 'Email không hợp lệ.');

    if ($op === 'delete') {
        $left = [];
        foreach ($list as $u) { if ($u['email'] !== $email) $left[] = $u; }
        if (count($left) === $prevCount) fail(404, 'Không tìm thấy email này trong tab Employees.');
        if (!count($left)) fail(400, 'Không thể xoá người cuối cùng trong tab Employees.');
        $list = $left;
    } elseif ($op === 'save') {
        $name = trim((string)(isset($body['name']) ? $body['name'] : ''));
        if ($name === '') fail(400, 'Thiếu họ tên.');
        $role = employee_role_text(isset($body['role']) ? $body['role'] : '');
        $old  = strtolower(trim((string)(isset($body['oldEmail']) ? $body['oldEmail'] : '')));
        $target = $old !== '' ? $old : $email;

        // Không cho hai dòng cùng email
        foreach ($list as $u) {
            if ($u['email'] === $email && $u['email'] !== $target) fail(409, 'Email này đã có trong tab Employees.');
        }
        $found = false;
        foreach ($list as $i => $u) {
            if ($u['email'] === $target) { $list[$i] = ['name' => $name, 'role' => $role, 'email' => $email]; $found = true; break; }
        }
        if (!$found) $list[] = ['name' => $name, 'role' => $role, 'email' => $email];
    } else {
        fail(400, 'op không hợp lệ (list | save | delete).');
    }

    // Ghi lại NGUYÊN vùng A2:C… — dòng dư sau khi xoá được ghi rỗng thay vì để sót
    $rows = [];
    foreach ($list as $u) $rows[] = [$u['name'], employee_role_text($u['role']), $u['email']];
    for ($i = count($rows); $i < $prevCount; $i++) $rows[] = ['', '', ''];
    $lastRow = 1 + max(count($rows), 1);
    $res = api($token, $base . '/values/' . rawurlencode('Employees!A2:C' . $lastRow) . '?valueInputOption=RAW', 'PUT', ['values' => $rows]);
    if (isset($res['error'])) fail(502, 'Sheet từ chối ghi tab Employees.', $res['error']);

    echo json_encode(['ok' => true, 'op' => $op, 'count' => count($list)], JSON_UNESCAPED_UNICODE);
}

// 0 -> A, 25 -> Z, 26 -> AA … (cột CREATOR_DB chạy tới BF)
function col_letter($i) {
    $s = '';
    for ($n = $i; $n >= 0; $n = intdiv($n, 26) - 1) {
        $s = chr(65 + ($n % 26)) . $s;
    }
    return $s;
}

$token = sheets_access_token($SERVICE_ACCOUNT);
if (!$token) fail(500, 'Không lấy được access token Google.');

$base = 'https://sheets.googleapis.com/v4/spreadsheets/' . $SHEET_ID;

// Đọc header + toàn bộ dữ liệu để dò đúng dòng của creator
$read = api($token, $base . '/values/' . rawurlencode($TAB . '!A' . $HEADER_ROW . ':BF3000'));
if (!isset($read['values']) || !is_array($read['values'])) fail(502, 'Không đọc được sheet.', isset($read['error']) ? $read['error'] : null);

$grid = $read['values'];
$header = array_shift($grid);           // dòng 3
$colOf = [];                            // "Tier" => chỉ số cột (0-based)
foreach ($header as $i => $h) {
    $k = trim((string)$h);
    if ($k !== '' && !isset($colOf[$k])) $colOf[$k] = $i;
}
if (!isset($colOf['Creator_Name'])) fail(502, 'Sheet không có cột Creator_Name.');
$nameCol = $colOf['Creator_Name'];

$norm = function ($s) { return preg_replace('/\s+/u', ' ', trim(mb_strtolower((string)$s, 'UTF-8'))); };
$target = $norm($name);

$rowNum = 0;                            // số dòng thật trên sheet (1-based)
foreach ($grid as $i => $r) {
    $v = isset($r[$nameCol]) ? $r[$nameCol] : '';
    if ($v !== '' && $norm($v) === $target) { $rowNum = $HEADER_ROW + 1 + $i; break; }
}

// Chỉ ghi những cột thật sự tồn tại trong header — tránh đẩy dữ liệu sang cột sai
$data = [];
$written = [];
foreach ($updates as $colName => $val) {
    if (!isset($colOf[$colName])) continue;
    $written[] = $colName;
    if ($rowNum) {
        $a1 = $TAB . '!' . col_letter($colOf[$colName]) . $rowNum;
        $data[] = ['range' => $a1, 'values' => [[(string)$val]]];
    }
}
if (!$written) fail(400, 'Không có cột nào khớp header của sheet.');

if ($rowNum) {
    $res = api($token, $base . '/values:batchUpdate', 'POST', [
        'valueInputOption' => 'USER_ENTERED',
        'data' => $data,
    ]);
    if (isset($res['error'])) fail(502, 'Sheet từ chối ghi.', $res['error']);
    echo json_encode(['ok' => true, 'mode' => 'update', 'row' => $rowNum, 'updated' => $written], JSON_UNESCAPED_UNICODE);
    exit;
}

// Chưa có trên sheet → thêm dòng mới ở cuối, điền đúng vị trí từng cột
$newRow = array_fill(0, count($header), '');
$newRow[$nameCol] = $name;
foreach ($updates as $colName => $val) {
    if (isset($colOf[$colName])) $newRow[$colOf[$colName]] = (string)$val;
}
$res = api($token, $base . '/values/' . rawurlencode($TAB . '!A' . ($HEADER_ROW + 1)) . ':append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS', 'POST', [
    'values' => [$newRow],
]);
if (isset($res['error'])) fail(502, 'Sheet từ chối thêm dòng.', $res['error']);
echo json_encode(['ok' => true, 'mode' => 'append', 'row' => 0, 'updated' => $written], JSON_UNESCAPED_UNICODE);
