<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://buildmetrics.uk');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }

$RESEND_API_KEY  = 'YOUR_RESEND_API_KEY';   // ← paste your Resend API key here
$AUDIENCE_ID     = 'YOUR_AUDIENCE_ID';       // ← paste your Resend audience ID here
$NOTIFY_EMAIL    = 'support@buildmetrics.uk';
$FROM_EMAIL      = 'BuildMetrics <noreply@buildmetrics.uk>';

$body = json_decode(file_get_contents('php://input'), true);
$name    = trim($body['name'] ?? '');
$email   = trim($body['email'] ?? '');
$company = trim($body['company'] ?? '');
$role    = trim($body['role'] ?? '');

if (!$name || !$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Name and a valid email are required.']);
    exit;
}

function resend_post($api_key, $path, $data) {
    $ch = curl_init('https://api.resend.com' . $path);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $api_key,
            'Content-Type: application/json',
        ],
        CURLOPT_POSTFIELDS => json_encode($data),
    ]);
    $res  = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($res, true)];
}

// 1. Add contact to Resend audience
resend_post($RESEND_API_KEY, "/audiences/{$AUDIENCE_ID}/contacts", [
    'email'      => $email,
    'first_name' => explode(' ', $name)[0],
    'last_name'  => implode(' ', array_slice(explode(' ', $name), 1)) ?: '',
    'unsubscribed' => false,
]);

// 2. Send confirmation to the signee
resend_post($RESEND_API_KEY, '/emails', [
    'from'    => $FROM_EMAIL,
    'to'      => [$email],
    'subject' => "You're on the BuildMetrics waitlist!",
    'html'    => "
        <div style='font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#0F172A;color:#fff;border-radius:16px;padding:40px 36px'>
            <div style='font-size:1.4rem;font-weight:800;margin-bottom:8px'>You're on the list! 🎉</div>
            <p style='color:rgba(255,255,255,0.7);line-height:1.7'>Hi {$name}, thanks for joining the BuildMetrics waitlist. We'll be in touch as soon as we're ready to open access.</p>
            <p style='color:rgba(255,255,255,0.5);font-size:0.85rem;margin-top:24px'>— The BuildMetrics team<br>support@buildmetrics.uk</p>
        </div>
    ",
]);

// 3. Notify the team
resend_post($RESEND_API_KEY, '/emails', [
    'from'    => $FROM_EMAIL,
    'to'      => [$NOTIFY_EMAIL],
    'subject' => "New waitlist signup: {$name}",
    'html'    => "
        <div style='font-family:Inter,sans-serif;max-width:480px'>
            <h2>New waitlist signup</h2>
            <table style='border-collapse:collapse;width:100%'>
                <tr><td style='padding:6px 0;color:#666'>Name</td><td><strong>{$name}</strong></td></tr>
                <tr><td style='padding:6px 0;color:#666'>Email</td><td><strong>{$email}</strong></td></tr>
                <tr><td style='padding:6px 0;color:#666'>Company</td><td><strong>" . ($company ?: '—') . "</strong></td></tr>
                <tr><td style='padding:6px 0;color:#666'>Role</td><td><strong>" . ($role ?: '—') . "</strong></td></tr>
            </table>
        </div>
    ",
]);

echo json_encode(['success' => true]);
