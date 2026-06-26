<?php
/**
 * send-email.php — Transactional emails (thin wrapper over mailer.php)
 *
 * POST body: { type: 'welcome'|'reset'|'notification', to, name, ...extras }
 * Access: authenticated users OR trusted internal callers (X-Internal-Call).
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://app.buildmetrics.uk');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Internal-Call');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

// ── Access control: authenticated user OR trusted internal caller ────────────
$internal = $_SERVER['HTTP_X_INTERNAL_CALL'] ?? '';
if (!hash_equals(INTERNAL_SECRET, $internal) && !auth_user()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorised']);
    exit;
}

$body = json_decode(file_get_contents('php://input'), true) ?: [];
$type = $body['type'] ?? '';
$to   = filter_var($body['to'] ?? '', FILTER_VALIDATE_EMAIL);
$name = $body['name'] ?? 'there';

if (!$to)   { http_response_code(400); echo json_encode(['error' => 'Invalid or missing email address']); exit; }
if (!$type) { http_response_code(400); echo json_encode(['error' => 'Missing email type']); exit; }

// Pass through optional template fields (resetLink, subject, message)
$extras = [
    'resetLink' => $body['resetLink'] ?? null,
    'subject'   => $body['subject']   ?? null,
    'message'   => $body['message']   ?? null,
];

$result = mail_send_templated($type, $to, $name, $extras);

if ($result['ok']) {
    echo json_encode(['success' => true, 'id' => $result['body']['id'] ?? null]);
} else {
    http_response_code($result['status'] === 0 ? 400 : 502);
    echo json_encode(['error' => 'Email delivery failed', 'detail' => $result['body']]);
}
