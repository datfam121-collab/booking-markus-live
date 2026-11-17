<?php if (!defined('MKP_GATED')) { http_response_code(404); exit; }
/**
 * ai-chat.php — proxy chat DeepSeek cho AI Workspace 1.0.7 (giấu key).
 * POST JSON { messages:[{role,content,...}], system?, tools? }
 *   → gọi DeepSeek chat/completions (model deepseek-v4-flash, fallback deepseek-v4-pro)
 *   → trả { ok:true, message:{role,content,tool_calls?} } | { ok:false, error }
 * PHP 7.4+ thuần (curl), không cần composer. Key đọc từ deepseek-key.txt.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method not allowed']); exit; }

$DEEPSEEK_KEY = getenv('DEEPSEEK_API_KEY');
if (!$DEEPSEEK_KEY) {
    $cfg = MKP_AI_KEY_PATH;
    if (file_exists($cfg)) $DEEPSEEK_KEY = trim(file_get_contents($cfg));
}
if (!$DEEPSEEK_KEY) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'Thiếu DeepSeek API key.']); exit; }

$raw = file_get_contents('php://input');
$body = json_decode($raw, true);
if (!is_array($body) || empty($body['messages']) || !is_array($body['messages'])) {
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Thiếu messages.']); exit;
}

$system = isset($body['system']) ? (string)$body['system'] : 'Bạn là trợ lý AI của Markus Agency.';
$messages = array_merge([['role' => 'system', 'content' => $system]], $body['messages']);

/* 1.0.7 R3: KHÔNG gửi 'thinking' => ['type' => 'disabled'] — đã test thật 3 lần, cờ này làm
   deepseek-v4 BỎ QUA function calling (trả text "đã thêm KOL" mà không gọi tool).
   Để thinking mặc định (bật) → model trả reasoning_content kèm tool_calls; app.js đã giữ
   reasoning_content khi push assistant message nên vòng lặp tool chạy đúng. */
$payload = [
    'model' => 'deepseek-v4-flash',
    'messages' => $messages,
    'temperature' => 0.7,
    'max_tokens' => 2000,
    'stream' => false,
];
if (!empty($body['tools']) && is_array($body['tools'])) {
    $payload['tools'] = $body['tools'];
    $payload['tool_choice'] = 'auto';
}

function ds_call($model, $payload, $key) {
    $payload['model'] = $model;
    $ch = curl_init('https://api.deepseek.com/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Authorization: Bearer ' . $key],
        CURLOPT_POSTFIELDS => json_encode($payload, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT => 60,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $resp];
}

// deepseek-v4-flash trước; lỗi thì fallback -pro
list($code, $resp) = ds_call('deepseek-v4-flash', $payload, $DEEPSEEK_KEY);
if ($code !== 200) list($code, $resp) = ds_call('deepseek-v4-pro', $payload, $DEEPSEEK_KEY);

if ($code !== 200) {
    http_response_code(502);
    echo json_encode(['ok' => false, 'error' => 'DeepSeek lỗi HTTP ' . $code, 'detail' => substr((string)$resp, 0, 300)]);
    exit;
}

$data = json_decode($resp, true);
$msg = isset($data['choices'][0]['message']) ? $data['choices'][0]['message'] : null;
if (!is_array($msg)) { http_response_code(502); echo json_encode(['ok' => false, 'error' => 'Không đọc được phản hồi AI.']); exit; }

echo json_encode(['ok' => true, 'message' => $msg], JSON_UNESCAPED_UNICODE);
