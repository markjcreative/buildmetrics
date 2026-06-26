<?php
/**
 * waitlist.php — public pre-launch waitlist capture.
 *
 * POST { name, email, company?, role? }
 * Public (no auth). Stores the lead, dedupes by email, light per-IP rate limit,
 * and sends a best-effort confirmation email.
 */
require_once __DIR__ . '/db.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$b       = body();
$name    = trim($b['name'] ?? '');
$email   = strtolower(trim($b['email'] ?? ''));
$company = trim($b['company'] ?? '');
$role    = trim($b['role'] ?? '');

if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Please enter a valid email address.');
if (mb_strlen($name) > 120 || mb_strlen($company) > 160 || mb_strlen($role) > 80) json_err('Input too long.');

$ip = client_ip();

// Light anti-spam: max 5 submissions per IP per 10 minutes. Degrades gracefully
// if the waitlist table hasn't been migrated yet.
try {
    $rl = db()->prepare('SELECT COUNT(*) FROM waitlist WHERE ip = ? AND created_at > (NOW() - INTERVAL 10 MINUTE)');
    $rl->execute([$ip]);
    if ((int)$rl->fetchColumn() >= 5) json_err('Too many requests. Please try again shortly.', 429);
} catch (PDOException $e) { /* table not migrated yet */ }

// Insert (dedupe by unique email — duplicates are treated as success)
try {
    db()->prepare(
        'INSERT INTO waitlist (name, email, company, role, ip)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE name = VALUES(name), company = VALUES(company), role = VALUES(role)'
    )->execute([$name, $email, $company, $role, $ip]);
} catch (PDOException $e) {
    json_err('Waitlist is not available yet. Please try again later.', 503);
}

// Best-effort confirmation email (never blocks signup)
try {
    require_once __DIR__ . '/mailer.php';
    mail_send_templated('notification', $email, $name ?: 'there', [
        'subject' => "You're on the BuildMetrics waitlist 🎉",
        'message' => "Thanks for joining the BuildMetrics waitlist! We're launching in October 2026 and you'll be among the first to get access. We'll email you the moment your spot is ready.",
    ]);
} catch (Throwable $e) { /* email optional */ }

json_out(['success' => true, 'message' => "You're on the list."]);
