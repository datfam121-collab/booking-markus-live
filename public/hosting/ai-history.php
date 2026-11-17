<?php
/**
 * ai-history.php — lịch sử hội thoại AI theo account (item 17).
 * GET  ?email=<user>                         → { ok:true, convs:[{id,title,updatedAt,messages}] }
 * POST { email, action:"save", conv:{...} }   → upsert (giới hạn 20 hội thoại, 50 tin/hội thoại)
 * POST { email, action:"delete", id }
 * POST { email, action:"rename", id, title }
 * Lưu hosting/ai_history/<sanitized-email>.json (mkdir nếu chưa có).
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$DIR = __DIR__ . '/ai_history';
if (!is_dir($DIR)) @mkdir($DIR, 0775, true);

function sanitize_email($e) {
    $e = strtolower(trim((string)$e));
    $e = preg_replace('/[^a-z0-9@._-]/', '_', $e);
    if ($e === '') $e = 'guest';
    return substr($e, 0, 120);
}
function conv_file($DIR, $email) { return $DIR . '/' . sanitize_email($email) . '.json'; }
function load_convs($file) {
    if (!file_exists($file)) return [];
    $j = json_decode((string)file_get_contents($file), true);
    return is_array($j) ? $j : [];
}
function save_convs($file, $convs) {
    usort($convs, function ($a, $b) { return ($b['updatedAt'] ?? 0) <=> ($a['updatedAt'] ?? 0); });
    $convs = array_slice($convs, 0, 20); // tối đa 20 hội thoại/user
    @file_put_contents($file, json_encode($convs, JSON_UNESCAPED_UNICODE), LOCK_EX);
}
function trim_conv($conv) {
    $out = [
        'id' => isset($conv['id']) ? (string)$conv['id'] : uniqid('c_'),
        'title' => isset($conv['title']) ? mb_substr((string)$conv['title'], 0, 120) : 'Hội thoại',
        'updatedAt' => isset($conv['updatedAt']) ? (int)$conv['updatedAt'] : (int)round(microtime(true) * 1000),
        'messages' => [],
    ];
    if (!empty($conv['messages']) && is_array($conv['messages'])) {
        foreach (array_slice($conv['messages'], -50) as $m) { // tối đa 50 tin/hội thoại
            if (!is_array($m)) continue;
            $out['messages'][] = [
                'role' => isset($m['role']) ? (string)$m['role'] : 'user',
                'content' => isset($m['content']) ? (string)$m['content'] : '',
                'cards' => (isset($m['cards']) && is_array($m['cards'])) ? array_slice($m['cards'], 0, 8) : [],
                'toolNote' => isset($m['toolNote']) ? (string)$m['toolNote'] : '',
            ];
        }
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $email = isset($_GET['email']) ? $_GET['email'] : '';
    echo json_encode(['ok' => true, 'convs' => load_convs(conv_file($DIR, $email))], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($body)) { http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Body không hợp lệ']); exit; }
    $file = conv_file($DIR, isset($body['email']) ? $body['email'] : '');
    $action = isset($body['action']) ? $body['action'] : '';
    $convs = load_convs($file);

    if ($action === 'save' && !empty($body['conv'])) {
        $conv = trim_conv($body['conv']);
        $found = false;
        foreach ($convs as $i => $c) { if (($c['id'] ?? '') === $conv['id']) { $convs[$i] = $conv; $found = true; break; } }
        if (!$found) $convs[] = $conv;
        save_convs($file, $convs);
        echo json_encode(['ok' => true]); exit;
    }
    if ($action === 'delete' && isset($body['id'])) {
        $id = (string)$body['id'];
        $convs = array_values(array_filter($convs, function ($c) use ($id) { return ($c['id'] ?? '') !== $id; }));
        save_convs($file, $convs);
        echo json_encode(['ok' => true]); exit;
    }
    if ($action === 'rename' && isset($body['id'])) {
        $id = (string)$body['id'];
        $title = isset($body['title']) ? mb_substr((string)$body['title'], 0, 120) : '';
        foreach ($convs as $i => $c) { if (($c['id'] ?? '') === $id) { $convs[$i]['title'] = $title; break; } }
        save_convs($file, $convs);
        echo json_encode(['ok' => true]); exit;
    }
    http_response_code(400); echo json_encode(['ok' => false, 'error' => 'Action không hợp lệ']); exit;
}

http_response_code(405); echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
