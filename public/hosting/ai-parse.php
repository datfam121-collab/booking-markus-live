<?php
/**
 * ai-parse.php — AI đọc file KOL/KOC và trả JSON cấu trúc để fill popup
 * POST multipart/form-data (field `file`: csv/txt/xlsx/pdf) HOẶC POST JSON { text }
 * → trích text phía server → gọi DeepSeek API → trả { ok, fields: {...} }
 * Chạy PHP 7.4+ thuần (curl + zip + zlib), không cần composer.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$DEEPSEEK_KEY = getenv('DEEPSEEK_API_KEY');
if (!$DEEPSEEK_KEY) {
    // Fallback: đọc từ file config riêng (không commit)
    $cfgFile = __DIR__ . '/deepseek-key.txt';
    if (file_exists($cfgFile)) {
        $DEEPSEEK_KEY = trim(file_get_contents($cfgFile));
    }
}
if (!$DEEPSEEK_KEY) {
    http_response_code(500);
    echo json_encode(['error' => 'Thiếu DeepSeek API key.']);
    exit;
}

const MAX_CHARS = 30000;

function fail($code, $msg) {
    http_response_code($code);
    echo json_encode(['error' => $msg]);
    exit;
}

function xml_unesc($s) { return html_entity_decode($s, ENT_QUOTES | ENT_XML1, 'UTF-8'); }

/* .xlsx = zip → sharedStrings.xml (bảng chuỗi) + worksheets/sheet1.xml (ô).
   Nối các ô thành dòng tab-separated, giữ thứ tự dòng. */
function xlsx_text($path) {
    if (!class_exists('ZipArchive')) return '';
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) return '';
    $shared = [];
    $ss = $zip->getFromName('xl/sharedStrings.xml');
    if ($ss !== false && preg_match_all('~<si\b[^>]*>(.*?)</si>~s', $ss, $m)) {
        foreach ($m[1] as $si) {
            preg_match_all('~<t\b[^>]*>(.*?)</t>~s', $si, $t);
            $shared[] = xml_unesc(implode('', $t[1]));
        }
    }
    $sheet = $zip->getFromName('xl/worksheets/sheet1.xml');
    $zip->close();
    if ($sheet === false) return '';
    $out = [];
    preg_match_all('~<row\b[^>]*>(.*?)</row>~s', $sheet, $rows);
    foreach ($rows[1] as $row) {
        $cells = [];
        preg_match_all('~<c\b([^>]*)(?:/>|>(.*?)</c>)~s', $row, $cs, PREG_SET_ORDER);
        foreach ($cs as $c) {
            $attr = $c[1];
            $inner = isset($c[2]) ? $c[2] : '';
            $type = preg_match('~t="([^"]+)"~', $attr, $tm) ? $tm[1] : 'n';
            if ($type === 's') {
                $idx = preg_match('~<v\b[^>]*>(.*?)</v>~s', $inner, $vm) ? (int)$vm[1] : -1;
                $cells[] = isset($shared[$idx]) ? $shared[$idx] : '';
            } elseif ($type === 'inlineStr') {
                preg_match_all('~<t\b[^>]*>(.*?)</t>~s', $inner, $t);
                $cells[] = xml_unesc(implode('', $t[1]));
            } else {
                $cells[] = preg_match('~<v\b[^>]*>(.*?)</v>~s', $inner, $vm) ? xml_unesc($vm[1]) : '';
            }
        }
        $line = trim(implode("\t", $cells));
        if ($line !== '') $out[] = $line;
    }
    return implode("\n", $out);
}

// Bóc escape trong string literal của PDF: \053 (octal), \n, \(, \\ …
function pdf_unesc($s) {
    $s = preg_replace_callback('~\\\\([0-7]{1,3})~', function ($m) { return chr(octdec($m[1])); }, $s);
    return strtr($s, ['\\n' => "\n", '\\r' => "\r", '\\t' => "\t", '\\(' => '(', '\\)' => ')', '\\\\' => '\\']);
}

/* Best effort: bóc text từ content stream đã giải nén.
   Cắt dòng theo lệnh Td / TD / T* / ET, lấy string literal trong ( ) trước Tj / TJ. */
function pdf_ops_text($d) {
    if (strpos($d, 'Tj') === false && strpos($d, 'TJ') === false) return '';
    $lines = [];
    foreach (preg_split('~(?:\bTd\b|\bTD\b|\bT\*|\bET\b)~', $d) as $chunk) {
        if (strpos($chunk, '(') === false) continue;
        $buf = '';
        if (preg_match_all('~\((?:\\\\.|[^\\\\()])*\)~s', $chunk, $sm)) {
            foreach ($sm[0] as $lit) {
                $s = pdf_unesc(substr($lit, 1, -1));
                // Chuỗi Unicode trong PDF là UTF-16BE có BOM þÿ (hay gặp với tiếng Việt)
                if (strncmp($s, "\xFE\xFF", 2) === 0) $s = (string)mb_convert_encoding(substr($s, 2), 'UTF-8', 'UTF-16BE');
                $buf .= $s;
            }
        }
        $buf = trim($buf);
        if ($buf !== '') $lines[] = $buf;
    }
    return implode("\n", $lines);
}

function pdf_text($path) {
    $raw = file_get_contents($path);
    if ($raw === false || $raw === '') return '';
    $out = '';
    if (preg_match_all('~stream\r?\n(.*?)endstream~s', $raw, $m)) {
        foreach ($m[1] as $s) {
            $d = @gzuncompress($s);
            if ($d === false) $d = @gzinflate($s);
            if ($d === false) $d = $s; // stream không nén
            $out .= pdf_ops_text($d) . "\n";
        }
    }
    if (trim($out) === '') $out = pdf_ops_text($raw); // PDF không có stream nén
    return trim(preg_replace('/\n{3,}/', "\n\n", $out));
}

$text = '';
if (!empty($_FILES['file']['tmp_name']) && is_uploaded_file($_FILES['file']['tmp_name'])) {
    $up = $_FILES['file'];
    if (!empty($up['error'])) fail(400, 'Upload lỗi (code ' . $up['error'] . ').');
    if ($up['size'] > 10 * 1024 * 1024) fail(413, 'File quá lớn (tối đa 10MB).');
    $ext = strtolower(pathinfo((string)$up['name'], PATHINFO_EXTENSION));
    if ($ext === 'xlsx' || $ext === 'xlsm') {
        $text = xlsx_text($up['tmp_name']);
        if (trim($text) === '') fail(422, 'Không đọc được nội dung Excel (thử lưu lại dạng .xlsx hoặc .csv).');
    } elseif ($ext === 'pdf') {
        $text = pdf_text($up['tmp_name']);
        if (trim($text) === '') fail(422, 'Không đọc được nội dung PDF (file scan ảnh không hỗ trợ).');
    } elseif ($ext === 'xls' || $ext === 'doc' || $ext === 'docx') {
        fail(422, 'Định dạng .' . $ext . ' chưa hỗ trợ — lưu lại dạng .xlsx / .csv hoặc dán text.');
    } else {
        $text = (string)file_get_contents($up['tmp_name']); // csv / tsv / txt / md / json
    }
} else {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $text = isset($body['text']) ? (string)$body['text'] : '';
}

$text = trim($text);
if ($text === '') fail(400, 'Thiếu nội dung file.');
// Payload gửi DeepSeek là JSON → text phải là UTF-8 hợp lệ, nếu không json_encode trả false
if (!mb_check_encoding($text, 'UTF-8')) {
    $conv = @mb_convert_encoding($text, 'UTF-8', 'Windows-1252');
    $text = ($conv !== false && $conv !== '') ? $conv : preg_replace('/[^\x09\x0A\x0D\x20-\x7E]/', '', $text);
    if (trim($text) === '') fail(422, 'Không đọc được nội dung file (mã hóa không hỗ trợ).');
}
// Cắt bớt thay vì báo lỗi: file dài chỉ cần đủ ngữ cảnh cho KOL đầu tiên
if (mb_strlen($text) > MAX_CHARS) $text = mb_substr($text, 0, MAX_CHARS);

// 1.0.9 (C3): file nhiều KOL → trả kol_list để app hiện bảng preview thêm hàng loạt
$prompt = <<<EOT
Bạn là trợ lý nhập liệu KOL/KOC cho agency Markus. Đọc nội dung file dưới đây (có thể là CSV/Excel/PDF/TXT lộn xộn, tiếng Việt hoặc tiếng Anh) rồi trả về JSON THUẦN (không markdown, không giải thích).

Nếu file chỉ có 1 KOL/KOC:
{"mode":"single","fields":{KOL}}
Nếu file có nhiều KOL/KOC (bảng nhiều dòng):
{"mode":"multi","kol_list":[{KOL},{KOL}]}

{KOL} có cấu trúc:
{"name":"","tier":"","category":"","niche2":"","gender":"","platform":"","handle":"","followers":0,"contact":"","phone":"","email":"","price":"","status":"","links":{"tiktok":"","fb":"","ig":"","yt":""},"p_photo":"","p_video":"","p_event":"","p_brandvideo":"","p_live":""}

Quy tắc:
- name: tên KOL/KOC (tiếng Việt có dấu)
- tier: Celeb/Macro/Micro/Nano (suy đoán từ số followers: >1tr=Macro, >100k=Micro, còn lại Nano, celeb nổi tiếng=Celeb)
- category: lĩnh vực (Beauty, Fashion, Lifestyle, Food, Gaming...); niche2: ngành hàng phụ nếu có
- gender: Nam/Nữ
- platform: tiktok/instagram/youtube/facebook (từ link hoặc tên nền tảng)
- handle: username hoặc link kênh; links: link kênh từng nền tảng nếu có
- followers: số nguyên (parse "1,8M"=1800000, "1.800.000"=1800000, "405K"=405000)
- contact/phone/email: thông tin liên hệ nếu có
- price: số tiền nếu có (VND), nếu chỉ có trạng thái thì để "Đã báo giá"/"TBU" theo text
- p_photo/p_video/p_event/p_brandvideo/p_live: giá theo từng format nếu bảng có cột riêng (chỉ số)
- status: trạng thái nếu có
Không đoán bừa: ô nào không có thì để "" hoặc 0. Tối đa 50 KOL.

FILE CONTENT:
EOT;

$prompt .= "\n\n" . $text;

$payload = json_encode([
    'model' => 'deepseek-chat',
    'messages' => [
        ['role' => 'system', 'content' => 'Bạn là AI nhập liệu chính xác, chỉ trả JSON.'],
        ['role' => 'user', 'content' => $prompt],
    ],
    'temperature' => 0.1,
    'max_tokens' => 4000, // 1.0.9 (C3): đủ chỗ cho danh sách nhiều KOL
]);

$ch = curl_init('https://api.deepseek.com/chat/completions');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $DEEPSEEK_KEY,
    ],
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_TIMEOUT => 60,
]);
$resp = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    http_response_code(502);
    echo json_encode(['error' => 'DeepSeek API lỗi: HTTP ' . $httpCode, 'detail' => substr($resp, 0, 300)]);
    exit;
}

$data = json_decode($resp, true);
$content = isset($data['choices'][0]['message']['content']) ? $data['choices'][0]['message']['content'] : '';
// Strip markdown fence nếu có
$content = preg_replace('/^```(?:json)?\s*/i', '', trim($content));
$content = preg_replace('/```\s*$/', '', trim($content));
$fields = json_decode($content, true);
if (!is_array($fields)) {
    // 1.0.9 (C3): JSON giờ có object lồng nhau → lấy khối { … } ngoài cùng thay vì regex nông
    $s = strpos($content, '{');
    $e = strrpos($content, '}');
    if ($s !== false && $e !== false && $e > $s) $fields = json_decode(substr($content, $s, $e - $s + 1), true);
}
if (!is_array($fields)) {
    http_response_code(502);
    echo json_encode(['error' => 'Không parse được JSON từ AI.', 'raw' => substr($content, 0, 300)]);
    exit;
}

// 1.0.9 (C3): giữ tương thích ngược — payload cũ (object fields phẳng) vẫn trả về như trước
if (isset($fields['kol_list']) && is_array($fields['kol_list'])) {
    echo json_encode(['ok' => true, 'mode' => 'multi', 'kol_list' => array_slice($fields['kol_list'], 0, 50)]);
} elseif (isset($fields['fields']) && is_array($fields['fields'])) {
    echo json_encode(['ok' => true, 'mode' => 'single', 'fields' => $fields['fields']]);
} else {
    echo json_encode(['ok' => true, 'fields' => $fields]);
}
