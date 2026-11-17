<?php
/**
 * activity.php — Đọc trạng thái online/offline cho bảng Users (Markus Influencer OS v1.1.3)
 * GET → quét hosting/activity/*.json (ghi bởi ping.php) → trả { ok:true, seen: { <key>: <unix-ts>, ... } }
 * <key> = phần tên file trước ".json" (chính là email đã sanitize bởi ping.php — app.js tra cứu
 * bằng cùng quy tắc sanitize nên vẫn khớp). File hỏng/thiếu lastSeen → bỏ qua.
 * Không auth (chỉ expose mốc thời gian hoạt động, không dữ liệu nhạy cảm).
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$dir = __DIR__ . '/activity';
$seen = [];
if (is_dir($dir)) {
    $files = glob($dir . '/*.json');
    if (is_array($files)) {
        foreach ($files as $file) {
            $raw = @file_get_contents($file);
            if ($raw === false) continue;
            $data = json_decode($raw, true);
            if (!is_array($data) || !isset($data['lastSeen'])) continue;
            $ts = (int)$data['lastSeen'];
            if ($ts <= 0) continue;
            $key = basename($file, '.json');
            $seen[$key] = $ts;
        }
    }
}

echo json_encode(['ok' => true, 'seen' => $seen], JSON_UNESCAPED_UNICODE);
