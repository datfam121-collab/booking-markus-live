<?php
/**
 * ping.php — Heartbeat "đang hoạt động" cho Markus Influencer OS v1.1.3
 * POST JSON { email } → ghi mốc thời gian hiện tại vào hosting/activity/<sanitized-email>.json
 * Trả { ok:true, t:<unix-ts> }. Không auth (chỉ ghi mốc thời gian, không dữ liệu nhạy cảm).
 * Chạy PHP 7.4+ thuần, không cần composer — giống các file hosting/*.php khác.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method not allowed']); exit; }

$body = json_decode(file_get_contents('php://input'), true);
$email = strtolower(trim((string)(isset($body['email']) ? $body['email'] : '')));
if ($email === '') { http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Thiếu email.']); exit; }

// Chỉ giữ [a-z0-9._-], ký tự lạ (kể cả "@") thay bằng "_" — app.js dùng ĐÚNG cùng quy tắc này
// khi tra cứu activitySeen[] nên vẫn khớp dù tên file không phải email gốc.
$safe = preg_replace('/[^a-z0-9._-]/', '_', $email);
if ($safe === '' || $safe === null) { http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Email không hợp lệ.']); exit; }

$dir = __DIR__ . '/activity';
if (!is_dir($dir)) mkdir($dir, 0775, true);

$t = time();
file_put_contents($dir . '/' . $safe . '.json', json_encode(['lastSeen' => $t]));

echo json_encode(['ok' => true, 't' => $t]);
