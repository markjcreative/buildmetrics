<?php
// v2
/**
 * google-auth.php — Verify Google Identity Services JWT
 * BuildMetrics | Add GOOGLE_CLIENT_ID before deploying
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// ── CONFIG ─────────────────────────────────────────────────────────────────
$GOOGLE_CLIENT_ID = '440038191618-he1pm3lglml6r6trivqce2q6u8sjbon8.apps.googleusercontent.com';   // ← paste your Client ID here
// ───────────────────────────────────────────────────────────────────────────

$body = json_decode(file_get_contents('php://input'), true);
$credential = trim($body['credential'] ?? '');

if (!$credential) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing credential']);
    exit;
}

// Verify token with Google's tokeninfo endpoint
$url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential);

$ctx = stream_context_create([
    'http' => ['timeout' => 8, 'ignore_errors' => true]
]);
$response = @file_get_contents($url, false, $ctx);

if (!$response) {
    http_response_code(502);
    echo json_encode(['error' => 'Could not reach Google verification API']);
    exit;
}

$payload = json_decode($response, true);

// Check for Google-side error
if (isset($payload['error'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Invalid or expired token']);
    exit;
}

// Verify the token was issued for our app
if (($payload['aud'] ?? '') !== $GOOGLE_CLIENT_ID) {
    http_response_code(401);
    echo json_encode(['error' => 'Token audience mismatch']);
    exit;
}

// All good — return the verified user profile
echo json_encode([
    'id'      => 'g_' . ($payload['sub'] ?? ''),
    'email'   => $payload['email']  ?? '',
    'name'    => $payload['name']   ?? 'BuildMetrics User',
    'picture' => $payload['picture'] ?? '',
    'provider'=> 'google',
    'verified'=> ($payload['email_verified'] ?? 'false') === 'true',
]);
