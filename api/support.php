<?php
/**
 * support.php — receives a support / contact submission, logs it, and emails
 * the support inbox (with the user's address as reply-to) plus a confirmation
 * to the user.
 *
 * POST { name?, email, category?, subject?, message, page_url? }
 *
 * Auth is optional: a signed-out user who can't log in must still reach
 * support. If a valid bearer token is present, the user id is attached.
 */
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$SUPPORT_EMAIL = defined('SUPPORT_EMAIL') ? SUPPORT_EMAIL : 'support@buildmetrics.uk';
$CATEGORIES    = ['question' => 'Question', 'bug' => 'Bug report',
                  'idea' => 'Idea / feature request', 'account' => 'Account help', 'other' => 'Other'];

$b        = body();
$name     = trim($b['name'] ?? '');
$email    = strtolower(trim($b['email'] ?? ''));
$category = $b['category'] ?? 'question';
$subject  = trim($b['subject'] ?? '');
$message  = trim($b['message'] ?? '');
$pageUrl  = trim($b['page_url'] ?? '');
$ip       = client_ip();

// ── Validate ────────────────────────────────────────────────────────────────
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('A valid email address is required.');
if (mb_strlen($message) < 10)   json_err('Please describe the issue in a little more detail (at least 10 characters).');
if (mb_strlen($message) > 5000) json_err('That message is too long — please keep it under 5000 characters.');
if (!isset($CATEGORIES[$category])) $category = 'question';
if ($name    !== '') $name    = mb_substr($name, 0, 120);
if ($subject !== '') $subject = mb_substr($subject, 0, 200);

// ── Rate limit: max 5 messages per IP per hour (degrades if table missing) ───
try {
    $c = db()->prepare('SELECT COUNT(*) FROM support_messages WHERE ip = ? AND created_at > (NOW() - INTERVAL 1 HOUR)');
    $c->execute([$ip]);
    if ((int)$c->fetchColumn() >= 5) {
        json_err('You have sent several messages recently. Please wait a little while before sending another.', 429);
    }
} catch (PDOException $e) { /* table not migrated yet — skip rate limiting */ }

// ── Attach user id if a valid token is present (optional — signed-out users
//    with login trouble must still be able to reach support) ─────────────────
$userId = null;
$authed = auth_user();           // returns null when no/invalid token
if ($authed) {
    $userId = (int)$authed['id'];
    if ($name === '')  $name  = $authed['name']  ?? '';
    // Trust the account's own email over a typed one when logged in.
    if (!empty($authed['email'])) $email = strtolower($authed['email']);
}

// ── Persist the ticket ───────────────────────────────────────────────────────
$ticketId = null;
try {
    $ins = db()->prepare(
        'INSERT INTO support_messages (user_id, name, email, category, subject, message, page_url, ip)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $ins->execute([$userId, $name ?: null, $email, $category, $subject ?: null, $message, $pageUrl ?: null, $ip]);
    $ticketId = (int)db()->lastInsertId();
} catch (PDOException $e) { /* logging is best-effort; still try to email */ }

// ── Email the support inbox (reply-to = the user) ────────────────────────────
$catLabel = $CATEGORIES[$category];
$esc = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$ref = $ticketId ? ('BM-' . str_pad((string)$ticketId, 5, '0', STR_PAD_LEFT)) : 'BM-NEW';

$adminHtml =
    '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111">' .
    '<h2 style="margin:0 0 4px">New support message · ' . $esc($ref) . '</h2>' .
    '<p style="margin:0 0 16px;color:#555">' . $esc($catLabel) . '</p>' .
    '<table style="border-collapse:collapse;width:100%;max-width:560px">' .
    '<tr><td style="padding:6px 10px;background:#f4f6fb;font-weight:600;width:120px">From</td><td style="padding:6px 10px">' . $esc($name ?: '—') . ' &lt;' . $esc($email) . '&gt;</td></tr>' .
    '<tr><td style="padding:6px 10px;background:#f4f6fb;font-weight:600">Category</td><td style="padding:6px 10px">' . $esc($catLabel) . '</td></tr>' .
    ($subject ? '<tr><td style="padding:6px 10px;background:#f4f6fb;font-weight:600">Subject</td><td style="padding:6px 10px">' . $esc($subject) . '</td></tr>' : '') .
    ($pageUrl ? '<tr><td style="padding:6px 10px;background:#f4f6fb;font-weight:600">Page</td><td style="padding:6px 10px">' . $esc($pageUrl) . '</td></tr>' : '') .
    ($userId ? '<tr><td style="padding:6px 10px;background:#f4f6fb;font-weight:600">User ID</td><td style="padding:6px 10px">' . $userId . '</td></tr>' : '') .
    '</table>' .
    '<div style="margin-top:16px;padding:14px 16px;border:1px solid #e4e7ec;border-radius:8px;white-space:pre-wrap;line-height:1.6">' . $esc($message) . '</div>' .
    '<p style="margin-top:16px;color:#888;font-size:12px">Reply directly to this email to respond to ' . $esc($email) . '.</p>' .
    '</div>';

$sent = mail_send($SUPPORT_EMAIL, "[Support · {$catLabel}] {$ref}", $adminHtml, $email);

if (!empty($sent['ok']) && $ticketId) {
    try { db()->prepare('UPDATE support_messages SET emailed = 1 WHERE id = ?')->execute([$ticketId]); }
    catch (PDOException $e) { /* best-effort */ }
}

// ── Confirmation to the user (best-effort; failure doesn't fail the request) ──
$userHtml =
    '<div style="font-family:Inter,Arial,sans-serif;font-size:14px;color:#111;line-height:1.6">' .
    '<p>Hi ' . $esc($name ?: 'there') . ',</p>' .
    '<p>Thanks for contacting BuildMetrics support — we\'ve received your message and will get back to you by email as soon as we can.</p>' .
    '<p style="margin:16px 0;padding:12px 16px;background:#f4f6fb;border-radius:8px"><strong>Your reference:</strong> ' . $esc($ref) . '<br><strong>Category:</strong> ' . $esc($catLabel) . '</p>' .
    '<div style="padding:14px 16px;border:1px solid #e4e7ec;border-radius:8px;white-space:pre-wrap">' . $esc($message) . '</div>' .
    '<p style="margin-top:20px;color:#888;font-size:12px">BuildMetrics · buildmetrics.uk</p>' .
    '</div>';
mail_send($email, 'We received your message — BuildMetrics support (' . $ref . ')', $userHtml);

// ── Respond ──────────────────────────────────────────────────────────────────
if (empty($sent['ok'])) {
    // The ticket is logged even if the email transport failed, so nothing is lost.
    json_out([
        'success'   => true,
        'reference' => $ref,
        'warning'   => 'Your message was received but our email notification is delayed. We still have it and will respond.',
    ]);
}
json_out(['success' => true, 'reference' => $ref, 'message' => 'Your message has been sent. We\'ll reply by email soon.']);
