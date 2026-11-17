<?php
// Google Sheets gateway for the existing CREATOR_DB and Employees tabs. The service-account file is only
// referenced by path (MKP_SA_PATH) and read at request time on the host. No Sheet schema changes are made.
defined('MKP') || exit;

class MkGoogleGateway
{
    const TAB = 'CREATOR_DB';
    const EMP = 'Employees';

    private function token($write)
    {
        $scope = $write ? 'https://www.googleapis.com/auth/spreadsheets' : 'https://www.googleapis.com/auth/spreadsheets.readonly';
        $cache = sh_data_dir() . '/sa-token-' . ($write ? 'rw' : 'ro') . '.json';
        $c = is_file($cache) ? json_decode((string)@file_get_contents($cache), true) : null;
        if (is_array($c) && isset($c['exp'], $c['tok']) && $c['exp'] > time() + 120) return $c['tok'];
        if (!is_file(MKP_SA_PATH)) sh_fail(500, 'service_account_missing');
        $sa = json_decode((string)@file_get_contents(MKP_SA_PATH), true);
        if (!is_array($sa) || empty($sa['client_email']) || empty($sa['private_key'])) sh_fail(500, 'service_account_invalid');
        $now = time();
        $b = function ($s) { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); };
        $in = $b(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . $b(json_encode([
            'iss' => $sa['client_email'], 'scope' => $scope, 'aud' => 'https://oauth2.googleapis.com/token', 'exp' => $now + 3600, 'iat' => $now,
        ]));
        $sig = '';
        if (!openssl_sign($in, $sig, $sa['private_key'], OPENSSL_ALGO_SHA256)) sh_fail(500, 'service_account_sign_failed');
        $ch = curl_init('https://oauth2.googleapis.com/token');
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 15,
            CURLOPT_POSTFIELDS => http_build_query(['grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer', 'assertion' => $in . '.' . $b($sig)])]);
        $resp = curl_exec($ch);
        curl_close($ch);
        $d = json_decode((string)$resp, true);
        if (!is_array($d) || empty($d['access_token'])) sh_fail(502, 'google_token_failed');
        @file_put_contents($cache, json_encode(['tok' => $d['access_token'], 'exp' => $now + (isset($d['expires_in']) ? (int)$d['expires_in'] : 3000)]));
        @chmod($cache, 0600);
        return $d['access_token'];
    }

    private function call($method, $url, $write, $body = null)
    {
        $ch = curl_init($url);
        $hdr = ['Authorization: Bearer ' . $this->token($write)];
        $opt = [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 60, CURLOPT_CUSTOMREQUEST => $method];
        if ($body !== null) {
            $hdr[] = 'Content-Type: application/json';
            $opt[CURLOPT_POSTFIELDS] = json_encode($body, JSON_UNESCAPED_UNICODE);
        }
        $opt[CURLOPT_HTTPHEADER] = $hdr;
        curl_setopt_array($ch, $opt);
        $resp = curl_exec($ch);
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $d = json_decode((string)$resp, true);
        if ($code < 200 || $code >= 300) sh_fail(502, 'sheet_rejected', ['detail' => is_array($d) && isset($d['error']) ? $d['error'] : null]);
        return is_array($d) ? $d : [];
    }

    private function vurl($range, $suffix = '')
    {
        return 'https://sheets.googleapis.com/v4/spreadsheets/' . MKP_SHEET_ID . '/values/' . rawurlencode($range) . $suffix;
    }

    private static function cellText($c)
    {
        if (!is_array($c)) return '';
        if (isset($c['formattedValue'])) return (string)$c['formattedValue'];
        $u = isset($c['userEnteredValue']) && is_array($c['userEnteredValue']) ? $c['userEnteredValue'] : [];
        foreach (['stringValue', 'numberValue', 'boolValue', 'formulaValue'] as $k) if (isset($u[$k])) return (string)$u[$k];
        return '';
    }

    private static function cellLink($c)
    {
        if (!is_array($c) || empty($c['hyperlink'])) return null;
        $h = trim((string)$c['hyperlink']);
        return preg_match('~^https?://~i', $h) ? $h : null;
    }

    // Same shape the app already consumes from sync-data.php: header (sheet row 3), rows (row 4+), links, linkCols.
    public function syncRead()
    {
        $fields = 'sheets(properties(title,sheetId),data(rowData(values(formattedValue,userEnteredValue,hyperlink))))';
        $url = 'https://sheets.googleapis.com/v4/spreadsheets/' . MKP_SHEET_ID . '?includeGridData=true&ranges=' . rawurlencode(self::TAB . '!A1:BF3000') . '&fields=' . rawurlencode($fields);
        $d = $this->call('GET', $url, false);
        $rowData = isset($d['sheets'][0]['data'][0]['rowData']) ? $d['sheets'][0]['data'][0]['rowData'] : null;
        if (!is_array($rowData)) sh_fail(502, 'sheet_unreadable');
        $rows = [];
        $linkRows = [];
        foreach ($rowData as $r) {
            $vals = isset($r['values']) && is_array($r['values']) ? $r['values'] : [];
            $t = [];
            $l = [];
            foreach ($vals as $c) { $t[] = self::cellText($c); $l[] = self::cellLink($c); }
            $rows[] = $t;
            $linkRows[] = $l;
        }
        $header = isset($rows[2]) ? $rows[2] : [];
        $platCols = ['tiktok' => 0, 'facebook' => 0, 'instagram' => 0, 'youtube' => 0];
        foreach ($header as $i => $h) {
            $k = preg_replace('/[^a-z0-9]/', '', strtolower((string)$h));
            if (isset($platCols[$k]) && !$platCols[$k]) $platCols[$k] = $i + 1;
        }
        $links = [];
        foreach (array_slice($linkRows, 3) as $lr) {
            $o = [];
            foreach ($platCols as $p => $col) $o[$p] = ($col && isset($lr[$col - 1])) ? $lr[$col - 1] : null;
            $links[] = $o;
        }
        return ['header' => $header, 'rows' => array_slice($rows, 3), 'links' => $links, 'linkCols' => $platCols];
    }

    // Raw grid A3:BF3000; index 0 is the header row (sheet row 3).
    public function gridRead()
    {
        $d = $this->call('GET', $this->vurl(self::TAB . '!A3:BF3000', '?valueRenderOption=FORMATTED_VALUE'), false);
        return isset($d['values']) && is_array($d['values']) ? $d['values'] : [];
    }

    // $cells: list of ['row' => 1-based sheet row, 'col' => 0-based column, 'val' => string]. Always RAW.
    public function cellsWrite(array $cells)
    {
        $data = [];
        foreach ($cells as $c) $data[] = ['range' => self::TAB . '!' . self::colLetter($c['col']) . $c['row'], 'values' => [[(string)$c['val']]]];
        $this->call('POST', 'https://sheets.googleapis.com/v4/spreadsheets/' . MKP_SHEET_ID . '/values:batchUpdate', true, ['valueInputOption' => 'RAW', 'data' => $data]);
    }

    public function rowAppend(array $vals)
    {
        $this->call('POST', $this->vurl(self::TAB . '!A3:BF3000', ':append?valueInputOption=RAW&insertDataOption=INSERT_ROWS'), true, ['values' => [array_values($vals)]]);
    }

    public function employeesRead()
    {
        $d = $this->call('GET', $this->vurl(self::EMP . '!A2:C200', '?valueRenderOption=FORMATTED_VALUE'), false);
        return isset($d['values']) && is_array($d['values']) ? $d['values'] : [];
    }

    // Replaces Employees!A2:C<n>, blanking rows beyond the new list. RAW so no formula is ever evaluated.
    public function employeesWrite(array $rows, $prevCount)
    {
        $n = max(count($rows), (int)$prevCount);
        $vals = [];
        for ($i = 0; $i < $n; $i++) $vals[] = isset($rows[$i]) ? array_values($rows[$i]) : ['', '', ''];
        if (!$vals) return;
        $range = self::EMP . '!A2:C' . ($n + 1);
        $this->call('PUT', $this->vurl($range, '?valueInputOption=RAW'), true, ['range' => $range, 'majorDimension' => 'ROWS', 'values' => $vals]);
    }

    public static function colLetter($i)
    {
        $s = '';
        $i = (int)$i;
        while ($i >= 0) {
            $s = chr(65 + $i % 26) . $s;
            $i = intdiv($i, 26) - 1;
        }
        return $s;
    }
}
