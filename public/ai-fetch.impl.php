<?php if (!defined('MKP_GATED')) { http_response_code(404); exit; }
/**
 * ai-fetch.php — 1.0.9 (C2): AI đọc LINK ONLINE rồi trả JSON để fill popup thêm KOL
 * POST JSON { url }
 *   - Google Sheets / Docs / Slides (công khai) → export CSV/TXT
 *   - Website / bài báo bất kỳ → tải HTML, bóc text
 * → cắt 30000 ký tự → DeepSeek → { ok, mode, fields } hoặc { ok, mode:"multi", kol_list:[...] }
 *
 * SSRF: chỉ http/https, chỉ cổng 80/443, chặn IP nội bộ/loopback/link-local,
 * tự đi theo redirect (tối đa 4) và kiểm tra lại IP ở MỖI chặng, ghim IP đã kiểm
 * bằng CURLOPT_RESOLVE để không bị DNS rebinding.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

const MAX_CHARS = 30000;
const MAX_BYTES = 4194304;   // 4MB — sheet lớn vẫn đủ, không để server hút file khổng lồ
const MAX_REDIRECT = 4;

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

$DEEPSEEK_KEY = getenv('DEEPSEEK_API_KEY');
if (!$DEEPSEEK_KEY) {
    $cfgFile = MKP_AI_KEY_PATH;
    if (file_exists($cfgFile)) $DEEPSEEK_KEY = trim(file_get_contents($cfgFile));
}
if (!$DEEPSEEK_KEY) fail(500, 'Thiếu DeepSeek API key.');

/* ---------- SSRF guard ---------- */

// IP công cộng thật sự: loại private (10/172.16/192.168/fc00::), reserved (127/169.254/0.0.0.0/::1)
function ip_is_public($ip) {
    return mk_ip_public($ip);
}

// Trả IP đã kiểm để ghim vào curl, hoặc null nếu link không an toàn
function safe_resolve($url) {
    $p = parse_url($url);
    if (!$p || empty($p['scheme']) || empty($p['host']) || isset($p['user']) || isset($p['pass']) || preg_match('~[\x00-\x20\x7f\\\\]~', $url)) return null;
    $scheme = strtolower($p['scheme']);
    if ($scheme !== 'http' && $scheme !== 'https') return null;
    $port = isset($p['port']) ? (int)$p['port'] : ($scheme === 'https' ? 443 : 80);
    if ($port !== 80 && $port !== 443) return null;
    $host = trim($p['host'], '[]');

    if (filter_var($host, FILTER_VALIDATE_IP)) {
        return ip_is_public($host) ? ['host' => $host, 'port' => $port, 'ip' => $host] : null;
    }
    // Chặn tên nội bộ hay dùng làm bàn đạp (localhost, *.local, metadata cloud)
    if (preg_match('~(^|\.)(localhost|local|internal|localdomain)$~i', $host)) return null;

    $ips = [];
    $a = @dns_get_record($host, DNS_A);
    if (is_array($a)) foreach ($a as $r) { if (!empty($r['ip'])) $ips[] = $r['ip']; }
    $aaaa = @dns_get_record($host, DNS_AAAA);
    if (is_array($aaaa)) foreach ($aaaa as $r) { if (!empty($r['ipv6'])) $ips[] = $r['ipv6']; }
    if (!$ips) {
        $one = gethostbyname($host);
        if ($one && $one !== $host) $ips[] = $one;
    }
    if (!$ips) return null;
    // Một IP nội bộ trong danh sách là đủ để từ chối (tránh round-robin lách)
    foreach ($ips as $ip) { if (!ip_is_public($ip)) return null; }
    return ['host' => $host, 'port' => $port, 'ip' => $ips[0]];
}

/* Tải 1 chặng, KHÔNG để curl tự follow — mỗi Location phải qua safe_resolve lại. */
function fetch_once($url, $target) {
    $body = '';
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_CONNECTTIMEOUT => 10,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_PROTOCOLS => CURLPROTO_HTTP | CURLPROTO_HTTPS,
        CURLOPT_RESOLVE => [$target['host'] . ':' . $target['port'] . ':' . $target['ip']],
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; MarkusInfluencerOS/1.0.9)',
        CURLOPT_ACCEPT_ENCODING => '',
        CURLOPT_WRITEFUNCTION => function ($c, $chunk) use (&$body) {
            $body .= $chunk;
            if (strlen($body) > MAX_BYTES) return 0; // vượt hạn mức → curl dừng
            return strlen($chunk);
        },
    ]);
    curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $hlen = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $ctype = (string)curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($code === 0 && $body === '') return ['error' => $err ?: 'Không kết nối được'];
    $head = substr($body, 0, $hlen);
    $data = substr($body, $hlen);
    $loc = '';
    if (preg_match('~^location:\s*(.+)$~mi', $head, $m)) $loc = trim($m[1]);
    return ['code' => $code, 'ctype' => $ctype, 'body' => $data, 'location' => $loc];
}

function abs_url($base, $loc) {
    if (preg_match('~^https?://~i', $loc)) return $loc;
    $p = parse_url($base);
    if (!$p) return '';
    $root = $p['scheme'] . '://' . $p['host'] . (isset($p['port']) ? ':' . $p['port'] : '');
    if ($loc === '' ) return '';
    if ($loc[0] === '/') return $root . $loc;
    $dir = isset($p['path']) ? preg_replace('~/[^/]*$~', '/', $p['path']) : '/';
    return $root . $dir . $loc;
}

function fetch_url($url) {
    for ($i = 0; $i <= MAX_REDIRECT; $i++) {
        $target = safe_resolve($url);
        if (!$target) fail(400, 'Link không hợp lệ hoặc trỏ vào địa chỉ nội bộ — chỉ nhận link http/https công khai.');
        $r = fetch_once($url, $target);
        if (isset($r['error'])) fail(502, 'Không tải được link: ' . $r['error']);
        if ($r['code'] >= 300 && $r['code'] < 400 && $r['location'] !== '') {
            $url = abs_url($url, $r['location']);
            if ($url === '') fail(502, 'Link chuyển hướng không hợp lệ.');
            continue;
        }
        if ($r['code'] >= 400) fail(502, 'Link trả về HTTP ' . $r['code'] . ' (kiểm tra quyền chia sẻ "bất kỳ ai có link").');
        return $r;
    }
    fail(502, 'Link chuyển hướng quá nhiều lần.');
}

/* ---------- Google Docs/Sheets/Slides → link export text ---------- */
function google_export($url) {
    if (!preg_match('~^https?://docs\.google\.com/(spreadsheets|document|presentation)/d/([a-zA-Z0-9_-]+)~i', $url, $m)) return '';
    $kind = strtolower($m[1]);
    $id = $m[2];
    if ($kind === 'spreadsheets') {
        $gid = preg_match('~[#?&]gid=(\d+)~', $url, $g) ? $g[1] : '';
        return 'https://docs.google.com/spreadsheets/d/' . $id . '/export?format=csv' . ($gid !== '' ? '&gid=' . $gid : '');
    }
    if ($kind === 'document') return 'https://docs.google.com/document/d/' . $id . '/export?format=txt';
    return 'https://docs.google.com/presentation/d/' . $id . '/export/txt'; // Slides không nhận ?format=txt
}

function html_to_text($html) {
    $s = preg_replace('~<(script|style|noscript|svg|head)\b[^>]*>.*?</\1>~is', ' ', $html);
    $s = preg_replace('~<!--.*?-->~s', ' ', $s);
    $s = preg_replace('~</(p|div|tr|li|h[1-6]|br)\s*>~i', "\n", $s);
    $s = preg_replace('~<br\s*/?>~i', "\n", $s);
    $s = preg_replace('~</t[dh]>~i', "\t", $s);
    $s = strip_tags($s);
    $s = html_entity_decode($s, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    $s = preg_replace('~[ \t\x{00A0}]+~u', ' ', $s);
    $s = preg_replace('~\n\s*\n\s*\n+~', "\n\n", $s);
    return trim($s);
}

/* 1.0.10 (Mục 1): trích khối JSON bằng scan depth.
   Cũ: strpos('{') + strrpos('}') → khi output AI bị cắt giữa chừng thì '}' cuối là của
   object con → cắt sai. Mới: 1 lượt duyệt, đếm depth ('{' +1, '}' -1, bỏ qua nội dung
   trong "..." kể cả escape \"), mỗi '}' cân bằng cho ra 1 khối; thử decode khối DÀI NHẤT
   trước, lấy khối đầu tiên decode được và có mode/fields/kol_list/name. */
function extract_json_block($s) {
    $blocks = []; $stack = [];
    $len = strlen($s); $inStr = false; $esc = false;
    for ($i = 0; $i < $len; $i++) {
        $c = $s[$i];
        if ($inStr) {
            if ($esc) $esc = false;
            elseif ($c === '\\') $esc = true;
            elseif ($c === '"') $inStr = false;
            continue;
        }
        if ($c === '"') { $inStr = true; }
        elseif ($c === '{') { $stack[] = $i; }
        elseif ($c === '}' && $stack) { $st = array_pop($stack); $blocks[] = [$st, $i - $st + 1]; }
    }
    usort($blocks, function ($a, $b) { return $b[1] - $a[1]; });
    $n = 0;
    foreach ($blocks as $b) {
        if (++$n > 50) break; // ponytail: 50 lần thử là quá đủ, khối to nhất luôn nằm đầu
        $try = json_decode(substr($s, $b[0], $b[1]), true);
        if (is_array($try) && (isset($try['mode']) || isset($try['fields']) || isset($try['kol_list']) || isset($try['name']))) return $try;
    }
    return null;
}

/* ---------- Lấy nội dung ---------- */
$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
$url = isset($body['url']) ? trim((string)$body['url']) : '';
if ($url === '') fail(400, 'Thiếu link.');
if (!preg_match('~^https?://~i', $url)) fail(400, 'Link phải bắt đầu bằng http:// hoặc https://');

$gexport = google_export($url);
$res = fetch_url($gexport !== '' ? $gexport : $url);
$text = $res['body'];
$ctype = strtolower($res['ctype']);

if (strpos($ctype, 'html') !== false || preg_match('~^\s*<(!doctype|html)~i', $text)) {
    $text = html_to_text($text);
} elseif (strpos($ctype, 'pdf') !== false) {
    fail(422, 'Link là file PDF — tải về rồi dùng 📎 Chọn file để AI đọc.');
}

$text = trim($text);
if ($text === '') fail(422, 'Link không có nội dung đọc được (có thể chưa bật chia sẻ công khai).');
if (!mb_check_encoding($text, 'UTF-8')) {
    $conv = @mb_convert_encoding($text, 'UTF-8', 'Windows-1252');
    $text = ($conv !== false && $conv !== '') ? $conv : preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '', $text);
    if (trim($text) === '') fail(422, 'Không đọc được nội dung link (mã hóa không hỗ trợ).');
}
if (mb_strlen($text) > MAX_CHARS) $text = mb_substr($text, 0, MAX_CHARS);

/* ---------- DeepSeek ---------- */
$prompt = <<<EOT
Bạn là trợ lý nhập liệu KOL/KOC cho agency Markus. Đọc nội dung lấy từ một link online (bảng Google Sheet dạng CSV, tài liệu Docs/Slides, hoặc text của một trang web/bài báo — tiếng Việt hoặc tiếng Anh) rồi trả về JSON THUẦN (không markdown, không giải thích).

Nếu chỉ có 1 KOL/KOC:
{"mode":"single","fields":{KOL}}
Nếu có nhiều KOL/KOC (bảng nhiều dòng):
{"mode":"multi","kol_list":[{KOL},{KOL}]}

{KOL} có cấu trúc:
{"name":"","tier":"","category":"","niche2":"","gender":"","platform":"","handle":"","followers":0,"contact":"","phone":"","email":"","price":"","status":"","links":{"tiktok":"","fb":"","ig":"","yt":""},"p_photo":"","p_video":"","p_event":"","p_brandvideo":"","p_live":""}

Quy tắc:
- name: tên KOL/KOC (tiếng Việt có dấu)
- tier: Celeb/Macro/Micro/Nano (suy từ followers: >1tr=Macro, >100k=Micro, còn lại Nano, celeb nổi tiếng=Celeb)
- category: ngành hàng chính; niche2: ngành hàng phụ nếu có
- gender: Nam/Nữ
- platform: tiktok/instagram/youtube/facebook (nền tảng chính)
- handle: username hoặc link kênh
- followers: số nguyên (parse "1,8M"=1800000, "1.800.000"=1800000, "405K"=405000)
- links: link kênh từng nền tảng nếu có
- price: giá chốt/ước tính (VND, chỉ số); p_photo/p_video/p_event/p_brandvideo/p_live: giá theo từng format nếu bảng có cột riêng (chỉ số)
- contact/phone/email/status: lấy nếu có
Không đoán bừa: ô nào không có thì để "" hoặc 0. Tối đa 50 KOL.

NỘI DUNG:
EOT;

$prompt .= "\n\n" . $text;

$payload = json_encode([
    'model' => 'deepseek-chat',
    'messages' => [
        ['role' => 'system', 'content' => 'Bạn là AI nhập liệu chính xác, chỉ trả JSON.'],
        ['role' => 'user', 'content' => $prompt],
    ],
    'temperature' => 0.1,
    'max_tokens' => 8000, // 1.0.10: 4000 cắt JSON khi sheet nhiều KOL — 8k là mức tối đa deepseek-chat
]);

$ch = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $DEEPSEEK_KEY],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 90,
]);
$resp = curl_exec($ch);
$httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'DeepSeek API lỗi: HTTP ' . $httpCode, 'detail' => substr((string)$resp, 0, 300)]);
    exit;
}

$data = json_decode((string)$resp, true);
$content = isset($data['choices'][0]['message']['content']) ? $data['choices'][0]['message']['content'] : '';
$content = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
$content = preg_replace('/```\s*$/', '', trim($content));
$out = json_decode($content, true);
// 1.0.10: thay strpos/strrpos bằng scan depth (xem extract_json_block)
if (!is_array($out)) $out = extract_json_block($content);
if (!is_array($out)) {
    http_response_code(502);
    echo json_encode(['error' => 'AI trả nội dung quá dài hoặc không phải JSON, thử tách file nhỏ hơn (dưới 30 KOL).', 'raw' => substr($content, 0, 300)]);
    exit;
}

// Backward-compat: AI trả thẳng object fields kiểu cũ (có "name") vẫn hiểu là 1 KOL
if (isset($out['kol_list']) && is_array($out['kol_list'])) {
    echo json_encode(['ok' => true, 'mode' => 'multi', 'kol_list' => array_slice($out['kol_list'], 0, 50)]);
} elseif (isset($out['fields']) && is_array($out['fields'])) {
    echo json_encode(['ok' => true, 'mode' => 'single', 'fields' => $out['fields']]);
} else {
    echo json_encode(['ok' => true, 'mode' => 'single', 'fields' => $out]);
}
