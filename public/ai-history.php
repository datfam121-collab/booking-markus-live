<?php
/**
 * ai-history.php - per-account AI chat history. Same actions as before (GET, save/delete/rename), but the account is
 * ALWAYS the session email (client `email` is ignored) and files live in <state>/ai_history (private).
 * Reads fall back to the legacy docroot ai_history/<safe>.json copy until the first save, so old history is not lost.
 */
define('MKP', 1);
require __DIR__ . '/_mk/core.php';

function mk_aih_safe($e)
{
    $e = preg_replace('/[^a-z0-9@._-]/', '_', strtolower(trim((string)$e)));
    return substr($e === '' ? 'guest' : $e, 0, 120);
}

function mk_aih_load($file)
{
    if (!is_file($file)) return null;
    $j = json_decode((string)@file_get_contents($file), true);
    return is_array($j) ? $j : [];
}

function mk_aih_trim($conv)
{
    $out = [
        'id' => isset($conv['id']) ? mb_substr((string)$conv['id'], 0, 64) : uniqid('c_'),
        'title' => isset($conv['title']) ? mb_substr((string)$conv['title'], 0, 120) : 'Hội thoại',
        'updatedAt' => isset($conv['updatedAt']) ? (int)$conv['updatedAt'] : (int)round(microtime(true) * 1000),
        'messages' => [],
    ];
    if (!empty($conv['messages']) && is_array($conv['messages'])) {
        foreach (array_slice($conv['messages'], -50) as $m) {
            if (!is_array($m)) continue;
            $out['messages'][] = [
                'role' => isset($m['role']) ? mb_substr((string)$m['role'], 0, 20) : 'user',
                'content' => isset($m['content']) ? mb_substr((string)$m['content'], 0, 20000) : '',
                'cards' => (isset($m['cards']) && is_array($m['cards'])) ? array_slice($m['cards'], 0, 8) : [],
                'toolNote' => isset($m['toolNote']) ? mb_substr((string)$m['toolNote'], 0, 500) : '',
            ];
        }
    }
    return $out;
}

mk_run(function () {
    $method = mk_method(['GET', 'POST']);
    $dir = sh_sub_dir('ai_history');
    if ($method === 'GET') {
        $u = sh_require('viewer');
        $safe = mk_aih_safe($u['email']);
        $convs = mk_aih_load($dir . '/' . $safe . '.json');
        if ($convs === null) $convs = mk_aih_load(MKP_ROOT . '/ai_history/' . $safe . '.json');
        return ['ok' => true, 'convs' => $convs === null ? [] : $convs];
    }
    $u = sh_require_write('viewer');
    $b = sh_body();
    $safe = mk_aih_safe($u['email']);
    $file = $dir . '/' . $safe . '.json';
    $action = isset($b['action']) ? $b['action'] : '';
    $fh = fopen($dir . '/' . $safe . '.lock', 'c');
    if (!$fh) sh_fail(500, 'lock_unavailable');
    flock($fh, LOCK_EX);
    try {
        $convs = mk_aih_load($file);
        if ($convs === null) $convs = mk_aih_load(MKP_ROOT . '/ai_history/' . $safe . '.json');
        if ($convs === null) $convs = [];
        if ($action === 'save' && !empty($b['conv']) && is_array($b['conv'])) {
            $conv = mk_aih_trim($b['conv']);
            $found = false;
            foreach ($convs as $i => $c) if (($c['id'] ?? '') === $conv['id']) { $convs[$i] = $conv; $found = true; break; }
            if (!$found) $convs[] = $conv;
        } elseif ($action === 'delete' && isset($b['id'])) {
            $id = (string)$b['id'];
            $convs = array_values(array_filter($convs, function ($c) use ($id) { return ($c['id'] ?? '') !== $id; }));
        } elseif ($action === 'rename' && isset($b['id'])) {
            $id = (string)$b['id'];
            $title = isset($b['title']) ? mb_substr((string)$b['title'], 0, 120) : '';
            foreach ($convs as $i => $c) if (($c['id'] ?? '') === $id) { $convs[$i]['title'] = $title; break; }
        } else {
            sh_fail(400, 'bad_action');
        }
        usort($convs, function ($a, $b2) { return ($b2['updatedAt'] ?? 0) <=> ($a['updatedAt'] ?? 0); });
        $convs = array_slice($convs, 0, 20);
        if (file_put_contents($file, json_encode($convs, JSON_UNESCAPED_UNICODE)) === false) sh_fail(500, 'history_write_failed');
    } finally {
        flock($fh, LOCK_UN);
        fclose($fh);
    }
    return ['ok' => true];
});
