<?php
/**
 * sync-data.php — Đồng bộ CREATOR_DB từ Google Sheets cho Markus Influencer OS v1.0.3
 * GET → đọc tab CREATOR_DB → trả JSON { header, rows, links, updatedAt }
 * Dùng spreadsheets.get + includeGridData để lấy được cả `hyperlink` của ô
 * (URL kênh TikTok/FB/IG/YT nằm trong hyperlink — values API chỉ trả nhãn "TikTok").
 * Chạy PHP 7.4+ thuần (curl), không cần composer.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Cache-Control: no-store');

$SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
$TAB      = 'CREATOR_DB';
$SERVICE_ACCOUNT = __DIR__ . '/service-account.json';

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
if (!$token) {
    http_response_code(500);
    echo json_encode(['error' => 'Không lấy được access token Google.']);
    exit;
}

// Chữ hiển thị của ô — formattedValue giữ đúng chuỗi như values API cũ ("1,800,000")
function cell_text($c) {
    if (!is_array($c)) return '';
    if (isset($c['formattedValue'])) return (string)$c['formattedValue'];
    $u = isset($c['userEnteredValue']) && is_array($c['userEnteredValue']) ? $c['userEnteredValue'] : [];
    foreach (['stringValue', 'numberValue', 'boolValue', 'formulaValue'] as $k) {
        if (isset($u[$k])) return (string)$u[$k];
    }
    return '';
}
// Chỉ nhận link http(s), còn lại null
function cell_link($c) {
    if (!is_array($c) || empty($c['hyperlink'])) return null;
    $h = trim((string)$c['hyperlink']);
    return preg_match('~^https?://~i', $h) ? $h : null;
}

// Đọc CREATOR_DB A1:BF3000 (58 cột) kèm grid data để lấy hyperlink
// 1.0.4: nới từ 1000 → 3000 dòng. Header ở dòng 3 nên A1:BF1000 chỉ trả tối đa 997 creator —
// đúng bằng số hiện có, thêm 1 creator là bị cắt âm thầm.
$fields = 'sheets(properties(title,sheetId),data(rowData(values(formattedValue,userEnteredValue,hyperlink))))';
$url = 'https://sheets.googleapis.com/v4/spreadsheets/' . $SHEET_ID
     . '?includeGridData=true&ranges=' . rawurlencode($TAB . '!A1:BF3000')
     . '&fields=' . rawurlencode($fields);
$ch = curl_init($url);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $token],
    CURLOPT_TIMEOUT => 60,
]);
$resp = curl_exec($ch);
curl_close($ch);
$data = json_decode($resp, true);

$rowData = isset($data['sheets'][0]['data'][0]['rowData']) ? $data['sheets'][0]['data'][0]['rowData'] : null;
if (!is_array($rowData)) {
    http_response_code(502);
    echo json_encode(['error' => 'Không đọc được sheet.', 'detail' => isset($data['error']) ? $data['error'] : null]);
    exit;
}

$rows = [];
$linkRows = [];
foreach ($rowData as $r) {
    $vals = isset($r['values']) && is_array($r['values']) ? $r['values'] : [];
    $texts = [];
    $links = [];
    foreach ($vals as $c) { $texts[] = cell_text($c); $links[] = cell_link($c); }
    $rows[] = $texts;
    $linkRows[] = $links;
}

// Header thật là row index 2 (dòng 3), data từ row index 3 (dòng 4)
$header = isset($rows[2]) ? $rows[2] : [];
$dataRows = array_slice($rows, 3);
$dataLinks = array_slice($linkRows, 3);

// Dò cột nền tảng theo tên header, khớp CHÍNH XÁC để không nhầm với Sub_TikTok
$platCols = ['tiktok' => 0, 'facebook' => 0, 'instagram' => 0, 'youtube' => 0];
foreach ($header as $i => $h) {
    $k = preg_replace('/[^a-z0-9]/', '', strtolower((string)$h));
    if (isset($platCols[$k]) && !$platCols[$k]) $platCols[$k] = $i + 1;
}

// links[] song song rows[]: mỗi phần tử { tiktok, facebook, instagram, youtube }
$links = [];
foreach ($dataLinks as $lr) {
    $o = [];
    foreach ($platCols as $p => $col) {
        $o[$p] = ($col && isset($lr[$col - 1])) ? $lr[$col - 1] : null;
    }
    $links[] = $o;
}

echo json_encode([
    'ok'        => true,
    'header'    => $header,
    'rows'      => $dataRows,
    'links'     => $links,
    'linkCols'  => $platCols,
    'count'     => count($dataRows),
    'updatedAt' => date('c'),
]);
