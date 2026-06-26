<?php
// v2
/**
 * send-email.php — Transactional emails via Resend
 * BuildMetrics | Add RESEND_API_KEY before deploying
 *
 * POST body: { type: 'welcome'|'reset'|'notification', to, name, ...extras }
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

// ── Access control ───────────────────────────────────────────────────────────
// Allow only (a) authenticated users, or (b) trusted server-to-server callers
// (e.g. the password-reset flow) presenting the shared internal secret.
// Prevents anonymous abuse of the mail relay.
require_once __DIR__ . '/db.php';
$internal = $_SERVER['HTTP_X_INTERNAL_CALL'] ?? '';
if (!hash_equals(INTERNAL_SECRET, $internal) && !auth_user()) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorised']);
    exit;
}

// ── CONFIG ─────────────────────────────────────────────────────────────────
$RESEND_API_KEY = 're_REVOKED_KEY_PURGED';      // ← paste your Resend API key
$FROM_NAME      = 'BuildMetrics';
$FROM_EMAIL     = 'noreply@buildmetrics.uk';  // must be your verified domain
$APP_URL        = 'https://app.buildmetrics.uk';
// ───────────────────────────────────────────────────────────────────────────

$body = json_decode(file_get_contents('php://input'), true);
$type = $body['type'] ?? '';
$to   = filter_var($body['to'] ?? '', FILTER_VALIDATE_EMAIL);
$name = htmlspecialchars($body['name'] ?? 'there', ENT_QUOTES);

if (!$to) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing email address']);
    exit;
}

// ── TEMPLATES ──────────────────────────────────────────────────────────────
function baseTemplate($preheader, $content) {
    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>BuildMetrics</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">$preheader</span>
  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;">
    <tr><td align="center">
      <!-- Card -->
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);padding:32px 40px;text-align:center;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr>
                <td style="background:#2563EB;border-radius:12px;padding:10px 14px;vertical-align:middle;">
                  <span style="font-size:22px;">⬛</span>
                </td>
                <td style="padding-left:12px;vertical-align:middle;">
                  <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">BuildMetrics</span>
                </td>
              </tr>
            </table>
            <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:10px 0 0;letter-spacing:1px;text-transform:uppercase;">Structural Engineering Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px;">
            $content
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#94A3B8;">© 2025 BuildMetrics · <a href="https://buildmetrics.uk" style="color:#2563EB;text-decoration:none;">buildmetrics.uk</a></p>
            <p style="margin:6px 0 0;font-size:11px;color:#CBD5E1;">You're receiving this email because you have a BuildMetrics account.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
HTML;
}

switch ($type) {

  case 'welcome':
    $subject = "Welcome to BuildMetrics, $name!";
    $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">Welcome aboard, $name! 👋</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Your BuildMetrics account is ready. You now have access to professional structural analysis tools built around Eurocode standards.</p>

<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
  <tr>
    <td style="background:#EFF6FF;border-radius:12px;padding:20px 24px;">
      <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#1E40AF;text-transform:uppercase;letter-spacing:0.5px;">What you can do</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr><td style="padding:5px 0;font-size:14px;color:#334155;">✅ &nbsp; Beam design to EC3 (steel & timber)</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#334155;">✅ &nbsp; RC beams, slabs & columns to EC2</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#334155;">✅ &nbsp; Pad footings & retaining walls to EC7</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#334155;">✅ &nbsp; Export professional PDF reports</td></tr>
        <tr><td style="padding:5px 0;font-size:14px;color:#334155;">✅ &nbsp; AI assistant for engineering queries</td></tr>
      </table>
    </td>
  </tr>
</table>

<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
  <tr>
    <td align="center">
      <a href="{$GLOBALS['APP_URL']}/dashboard.html" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:-0.2px;">Open Dashboard →</a>
    </td>
  </tr>
</table>

<p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;">Need help getting started? Visit our <a href="{$GLOBALS['APP_URL']}/tutorials.html" style="color:#2563EB;text-decoration:none;">tutorials</a> or check the <a href="{$GLOBALS['APP_URL']}/faq.html" style="color:#2563EB;text-decoration:none;">FAQ</a>.</p>
HTML;
    break;

  case 'reset':
    $resetLink = htmlspecialchars($body['resetLink'] ?? ($GLOBALS['APP_URL'] . '/login.html'));
    $subject = 'Reset your BuildMetrics password';
    $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0F172A;letter-spacing:-0.5px;">Password reset request</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Hi $name, we received a request to reset your BuildMetrics password. Click the button below — this link expires in <strong>1 hour</strong>.</p>

<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:28px;">
  <tr>
    <td align="center">
      <a href="$resetLink" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">Reset Password →</a>
    </td>
  </tr>
</table>

<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
  <tr>
    <td style="background:#FEF3C7;border-radius:10px;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">⚠️ If you didn't request this, you can safely ignore this email. Your password won't change.</p>
    </td>
  </tr>
</table>

<p style="margin:0;font-size:12px;color:#94A3B8;">Or copy this link: <span style="color:#2563EB;">$resetLink</span></p>
HTML;
    break;

  case 'notification':
    $subject = $body['subject'] ?? 'BuildMetrics notification';
    $message = htmlspecialchars($body['message'] ?? '', ENT_QUOTES);
    $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;">Hi $name,</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">$message</p>
<table cellpadding="0" cellspacing="0" style="width:100%;">
  <tr>
    <td align="center">
      <a href="{$GLOBALS['APP_URL']}/dashboard.html" style="display:inline-block;background:#2563EB;color:#ffffff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Go to Dashboard →</a>
    </td>
  </tr>
</table>
HTML;
    break;

  default:
    http_response_code(400);
    echo json_encode(['error' => "Unknown email type: $type"]);
    exit;
}

// ── SEND VIA RESEND ────────────────────────────────────────────────────────
$APP_URL = $GLOBALS['APP_URL'] ?? 'https://app.buildmetrics.uk';
$html    = baseTemplate(strip_tags($content), $content);

$payload = json_encode([
    'from'    => "$FROM_NAME <$FROM_EMAIL>",
    'to'      => [$to],
    'subject' => $subject,
    'html'    => $html,
]);

$ch = curl_init('https://api.resend.com/emails');
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $payload,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . $RESEND_API_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT        => 10,
]);
$res    = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
// curl_close() removed — deprecated in PHP 8.0+, emits a warning before JSON output

if ($status >= 200 && $status < 300) {
    echo json_encode(['success' => true, 'id' => json_decode($res, true)['id'] ?? null]);
} else {
    http_response_code(502);
    echo json_encode(['error' => 'Email delivery failed', 'detail' => json_decode($res, true)]);
}
