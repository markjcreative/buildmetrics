<?php
/**
 * mailer.php — shared transactional email (Resend) for BuildMetrics.
 * Templates + send live here so both send-email.php (client-facing) and
 * bm-auth.php (password reset) use one reliable path — no self-HTTP loopback.
 *
 * RESEND_API_KEY is read from the gitignored api/config.php (never committed).
 */

require_once __DIR__ . '/config.php';

if (!defined('MAIL_FROM_NAME'))  define('MAIL_FROM_NAME',  'BuildMetrics');
if (!defined('MAIL_FROM_EMAIL')) define('MAIL_FROM_EMAIL', 'noreply@buildmetrics.uk');
if (!defined('APP_URL'))         define('APP_URL',         'https://app.buildmetrics.uk');

function _mail_base(string $preheader, string $content): string {
    return <<<HTML
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">$preheader</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:40px 16px;"><tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#0F172A 0%,#1E3A8A 100%);padding:32px 40px;text-align:center;">
        <span style="font-size:22px;font-weight:800;color:#fff;letter-spacing:-0.5px;">⬛ BuildMetrics</span>
        <p style="color:rgba(255,255,255,0.55);font-size:12px;margin:10px 0 0;letter-spacing:1px;text-transform:uppercase;">Structural Engineering Platform</p>
      </td></tr>
      <tr><td style="padding:40px 40px 32px;">$content</td></tr>
      <tr><td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:24px 40px;text-align:center;">
        <p style="margin:0;font-size:12px;color:#94A3B8;">© BuildMetrics · <a href="https://buildmetrics.uk" style="color:#2563EB;text-decoration:none;">buildmetrics.uk</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>
HTML;
}

/**
 * Build [subject, html] for a given email type.
 * Caller is responsible for escaping any user-controlled $extras values.
 */
function mail_build(string $type, string $name, array $extras = []): ?array {
    $name = htmlspecialchars($name, ENT_QUOTES);
    switch ($type) {
        case 'welcome':
            $subject = "Welcome to BuildMetrics, $name!";
            $url = APP_URL;
            $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Welcome aboard, $name! 👋</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Your BuildMetrics account is ready — Eurocode-compliant structural design tools at your fingertips.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;"><tr><td align="center">
  <a href="$url/dashboard.html" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">Open Dashboard →</a>
</td></tr></table>
HTML;
            return [$subject, _mail_base("Welcome to BuildMetrics", $content)];

        case 'reset':
            $link = htmlspecialchars($extras['resetLink'] ?? (APP_URL . '/login'), ENT_QUOTES);
            $subject = 'Reset your BuildMetrics password';
            $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#0F172A;">Password reset request</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">Hi $name, click below to set a new password — this link expires in <strong>1 hour</strong>.</p>
<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;"><tr><td align="center">
  <a href="$link" style="display:inline-block;background:#2563EB;color:#fff;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;">Reset Password →</a>
</td></tr></table>
<table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;"><tr><td style="background:#FEF3C7;border-radius:10px;padding:16px 20px;">
  <p style="margin:0;font-size:13px;color:#92400E;line-height:1.5;">⚠️ If you didn't request this, ignore this email — your password won't change.</p>
</td></tr></table>
<p style="margin:0;font-size:12px;color:#94A3B8;">Or copy this link: <span style="color:#2563EB;">$link</span></p>
HTML;
            return [$subject, _mail_base("Reset your BuildMetrics password", $content)];

        case 'notification':
            $subject = $extras['subject'] ?? 'BuildMetrics notification';
            $message = htmlspecialchars($extras['message'] ?? '', ENT_QUOTES);
            $url = APP_URL;
            $content = <<<HTML
<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#0F172A;">Hi $name,</h1>
<p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">$message</p>
<table cellpadding="0" cellspacing="0" style="width:100%;"><tr><td align="center">
  <a href="$url/dashboard.html" style="display:inline-block;background:#2563EB;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;">Go to Dashboard →</a>
</td></tr></table>
HTML;
            return [htmlspecialchars($subject, ENT_QUOTES), _mail_base("BuildMetrics notification", $content)];
    }
    return null;
}

/**
 * Send an email via Resend. Returns ['ok'=>bool, 'status'=>int, 'body'=>mixed].
 */
function mail_send(string $to, string $subject, string $html): array {
    $key = defined('RESEND_API_KEY') ? RESEND_API_KEY : '';
    if (!$key) return ['ok' => false, 'status' => 0, 'body' => 'RESEND_API_KEY not configured'];

    $payload = json_encode([
        'from'    => MAIL_FROM_NAME . ' <' . MAIL_FROM_EMAIL . '>',
        'to'      => [$to],
        'subject' => $subject,
        'html'    => $html,
    ]);
    $ch = curl_init('https://api.resend.com/emails');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . $key,
            'Content-Type: application/json',
        ],
    ]);
    $res    = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $ok     = $status >= 200 && $status < 300;
    return ['ok' => $ok, 'status' => $status, 'body' => json_decode($res, true)];
}

/** Convenience: build + send a templated email. */
function mail_send_templated(string $type, string $to, string $name, array $extras = []): array {
    $tpl = mail_build($type, $name, $extras);
    if (!$tpl) return ['ok' => false, 'status' => 0, 'body' => "Unknown email type: $type"];
    return mail_send($to, $tpl[0], $tpl[1]);
}
