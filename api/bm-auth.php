<?php
// v2
/**
 * bm-auth.php — Authentication endpoints
 * POST /api/auth.php?action=register|login|logout|me|update|google
 */
require_once __DIR__ . '/db.php';
cors();

$action = $_GET['action'] ?? '';

// ── REGISTER ───────────────────────────────────────────────────────────────
if ($action === 'register') {
    $b = body();
    $email    = strtolower(trim($b['email'] ?? ''));
    $name     = trim($b['name'] ?? '');
    $password = $b['password'] ?? '';

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_err('Invalid email address');
    if (!$name)     json_err('Name is required');
    if (strlen($password) < 8) json_err('Password must be at least 8 characters');

    $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ($exists->fetch()) json_err('An account with this email already exists');

    // bcrypt — embeds its own per-password salt. The legacy `salt` column is
    // kept (empty) only for schema compatibility with older rows.
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $salt = '';

    db()->prepare('INSERT INTO users (email, name, password_hash, salt, provider) VALUES (?, ?, ?, ?, ?)')
        ->execute([$email, $name, $hash, $salt, 'email']);
    $user_id = (int)db()->lastInsertId();

    $token = generate_token($user_id);
    $user  = db()->prepare('SELECT id,email,name,picture,designation,company,plan,provider,created_at FROM users WHERE id=?');
    $user->execute([$user_id]);

    json_out(['token' => $token, 'user' => $user->fetch()]);
}

// ── LOGIN ──────────────────────────────────────────────────────────────────
if ($action === 'login') {
    $b = body();
    $email    = strtolower(trim($b['email'] ?? ''));
    $password = $b['password'] ?? '';

    if (!$email || !$password) json_err('Email and password are required');

    // Brute-force protection: block after 10 failed attempts from an IP in 15 min.
    // Degrades gracefully if the login_attempts table hasn't been created yet.
    $ip = client_ip();
    try {
        $att = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE ip = ? AND created_at > (NOW() - INTERVAL 15 MINUTE)');
        $att->execute([$ip]);
        if ((int)$att->fetchColumn() >= 10) {
            json_err('Too many failed attempts. Please wait 15 minutes and try again.', 429);
        }
    } catch (PDOException $e) { /* table not migrated yet — skip rate limiting */ }

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row) json_err('No account found with this email address');
    if ($row['provider'] === 'google') json_err('This account uses Google Sign-In. Please use the Google button.');

    // Verify password. Supports both modern bcrypt hashes and legacy
    // salted-SHA-256 hashes, transparently upgrading the latter on success.
    $stored = $row['password_hash'];
    $info   = password_get_info($stored);
    $ok     = false;

    if (!empty($info['algo'])) {
        // Modern hash (bcrypt/argon2)
        $ok = password_verify($password, $stored);
        if ($ok && password_needs_rehash($stored, PASSWORD_DEFAULT)) {
            $new = password_hash($password, PASSWORD_DEFAULT);
            db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([$new, $row['id']]);
        }
    } else {
        // Legacy salted SHA-256 — constant-time compare, then upgrade to bcrypt
        $legacy = hash('sha256', $password . ($row['salt'] ?? ''));
        $ok = hash_equals($stored, $legacy);
        if ($ok) {
            $new = password_hash($password, PASSWORD_DEFAULT);
            db()->prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?')->execute([$new, '', $row['id']]);
        }
    }

    if (!$ok) {
        try { db()->prepare('INSERT INTO login_attempts (ip, email) VALUES (?, ?)')->execute([$ip, $email]); }
        catch (PDOException $e) { /* table not migrated yet */ }
        json_err('Incorrect password. Please try again.');
    }

    // Success — clear this IP's failed-attempt history
    try { db()->prepare('DELETE FROM login_attempts WHERE ip = ?')->execute([$ip]); }
    catch (PDOException $e) { /* table not migrated yet */ }

    $token = generate_token((int)$row['id']);
    unset($row['password_hash'], $row['salt']);
    json_out(['token' => $token, 'user' => $row]);
}

// ── GOOGLE AUTH ────────────────────────────────────────────────────────────
if ($action === 'google') {
    $GOOGLE_CLIENT_ID = '440038191618-he1pm3lglml6r6trivqce2q6u8sjbon8.apps.googleusercontent.com';
    $b = body();
    $credential = trim($b['credential'] ?? '');
    if (!$credential) json_err('Missing Google credential');

    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $res = @file_get_contents('https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($credential), false, $ctx);
    if (!$res) json_err('Could not verify Google token', 502);

    $payload = json_decode($res, true);
    if (isset($payload['error']) || ($payload['aud'] ?? '') !== $GOOGLE_CLIENT_ID) json_err('Invalid Google token', 401);

    $email   = $payload['email'];
    $name    = $payload['name'] ?? 'BuildMetrics User';
    $picture = $payload['picture'] ?? '';
    $gid     = $payload['sub'];

    // Find or create user
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row) {
        db()->prepare('INSERT INTO users (email, name, google_id, picture, provider) VALUES (?, ?, ?, ?, ?)')
            ->execute([$email, $name, $gid, $picture, 'google']);
        $user_id = (int)db()->lastInsertId();
        $is_new  = true;
    } else {
        $user_id = (int)$row['id'];
        db()->prepare('UPDATE users SET google_id=?, picture=? WHERE id=?')->execute([$gid, $picture, $user_id]);
        $is_new  = false;
    }

    $token = generate_token($user_id);
    $user  = db()->prepare('SELECT id,email,name,picture,designation,company,plan,provider,created_at FROM users WHERE id=?');
    $user->execute([$user_id]);
    json_out(['token' => $token, 'user' => $user->fetch(), 'is_new' => $is_new]);
}

// ── LOGOUT ─────────────────────────────────────────────────────────────────
if ($action === 'logout') {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) {
        // Delete by hashed token (new sessions) or raw token (legacy sessions)
        db()->prepare('DELETE FROM sessions WHERE token = ? OR token = ?')
            ->execute([_hash_token($m[1]), $m[1]]);
    }
    json_out(['success' => true]);
}

// ── ME (current user) ──────────────────────────────────────────────────────
if ($action === 'me') {
    $u = require_auth();
    unset($u['password_hash'], $u['salt']);
    json_out($u);
}

// ── UPDATE PROFILE ─────────────────────────────────────────────────────────
if ($action === 'update') {
    $u = require_auth();
    $b = body();
    $allowed = ['name', 'designation', 'company'];
    $sets = []; $vals = [];
    foreach ($allowed as $k) {
        if (isset($b[$k])) { $sets[] = "$k = ?"; $vals[] = trim($b[$k]); }
    }
    if ($sets) {
        $vals[] = $u['id'];
        db()->prepare('UPDATE users SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
    }
    $stmt = db()->prepare('SELECT id,email,name,picture,designation,company,plan,provider,created_at FROM users WHERE id=?');
    $stmt->execute([$u['id']]);
    json_out($stmt->fetch());
}

// ── CHANGE PASSWORD (authenticated) ─────────────────────────────────────────
if ($action === 'change-password') {
    $u = require_auth();
    $b = body();
    $current = $b['current'] ?? '';
    $newPw   = $b['password'] ?? '';

    if ($u['provider'] === 'google') json_err('Google accounts manage their password with Google.');
    if (strlen($newPw) < 8) json_err('New password must be at least 8 characters');

    // Re-fetch full row (require_auth returns the user but we need the hash)
    $stmt = db()->prepare('SELECT password_hash, salt FROM users WHERE id=?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();

    $info = password_get_info($row['password_hash']);
    $ok = !empty($info['algo'])
        ? password_verify($current, $row['password_hash'])
        : hash_equals($row['password_hash'], hash('sha256', $current . ($row['salt'] ?? '')));
    if (!$ok) json_err('Current password is incorrect');

    $hash = password_hash($newPw, PASSWORD_DEFAULT);
    db()->prepare('UPDATE users SET password_hash=?, salt=? WHERE id=?')->execute([$hash, '', $u['id']]);
    json_out(['success' => true, 'message' => 'Password changed successfully.']);
}

// ── EXPORT MY DATA (GDPR Art. 20 — portability) ─────────────────────────────
if ($action === 'export') {
    $u = require_auth();
    $uid = $u['id'];

    $profile = db()->prepare('SELECT id,email,name,picture,designation,company,plan,provider,created_at FROM users WHERE id=?');
    $profile->execute([$uid]);

    $projects = db()->prepare('SELECT * FROM projects WHERE user_id=?');
    $projects->execute([$uid]);

    $reports = db()->prepare('SELECT * FROM reports WHERE user_id=?');
    $reports->execute([$uid]);
    $reportRows = $reports->fetchAll();

    // attach blocks to each report
    $blkStmt = db()->prepare('SELECT * FROM report_blocks WHERE report_id=? ORDER BY order_index ASC');
    foreach ($reportRows as &$r) {
        $blkStmt->execute([$r['id']]);
        $r['blocks'] = $blkStmt->fetchAll();
    }
    unset($r);

    $calcs = db()->prepare('SELECT c.* FROM calculations c JOIN projects p ON p.id = c.project_id WHERE p.user_id=?');
    $calcs->execute([$uid]);

    header('Content-Disposition: attachment; filename="buildmetrics-data-export.json"');
    json_out([
        'exported_at' => date('c'),
        'profile'     => $profile->fetch(),
        'projects'    => $projects->fetchAll(),
        'reports'     => $reportRows,
        'calculations'=> $calcs->fetchAll(),
    ]);
}

// ── DELETE ACCOUNT (GDPR Art. 17 — erasure) ─────────────────────────────────
// POST { confirm: true } — irreversibly deletes the user and all their data.
if ($action === 'delete-account') {
    $u = require_auth();
    $b = body();
    if (($b['confirm'] ?? false) !== true) json_err('Account deletion must be explicitly confirmed');
    $uid = $u['id'];

    $pdo = db();
    try {
        $pdo->beginTransaction();
        // Children of reports
        $pdo->prepare('DELETE FROM report_blocks   WHERE report_id IN (SELECT id FROM reports WHERE user_id=?)')->execute([$uid]);
        $pdo->prepare('DELETE FROM report_versions WHERE report_id IN (SELECT id FROM reports WHERE user_id=?)')->execute([$uid]);
        $pdo->prepare('DELETE FROM report_activity WHERE report_id IN (SELECT id FROM reports WHERE user_id=?)')->execute([$uid]);
        $pdo->prepare('DELETE FROM report_shares   WHERE user_id=?')->execute([$uid]);
        $pdo->prepare('DELETE FROM reports          WHERE user_id=?')->execute([$uid]);
        // Children of projects
        $pdo->prepare('DELETE FROM calculations     WHERE project_id IN (SELECT id FROM projects WHERE user_id=?)')->execute([$uid]);
        $pdo->prepare('DELETE FROM projects         WHERE user_id=?')->execute([$uid]);
        // Auth artefacts
        $pdo->prepare('DELETE FROM password_resets  WHERE user_id=?')->execute([$uid]);
        $pdo->prepare('DELETE FROM sessions         WHERE user_id=?')->execute([$uid]);
        // The user
        $pdo->prepare('DELETE FROM users            WHERE id=?')->execute([$uid]);
        $pdo->commit();
    } catch (Throwable $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        json_err('Could not delete account. Please try again.', 500);
    }
    json_out(['success' => true, 'message' => 'Your account and all associated data have been permanently deleted.']);
}

// ── PASSWORD RESET: REQUEST ─────────────────────────────────────────────────
// POST { email } — always returns success (no account enumeration).
if ($action === 'reset-request') {
    $b     = body();
    $email = strtolower(trim($b['email'] ?? ''));
    $generic = ['success' => true, 'message' => 'If that email is registered, a reset link has been sent.'];

    if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) json_out($generic);

    $stmt = db()->prepare('SELECT id, name, provider FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    // Only email-provider accounts can reset a password (Google users sign in via Google)
    if ($row && ($row['provider'] ?? 'email') !== 'google') {
        $token   = bin2hex(random_bytes(32));
        $expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour
        db()->prepare('INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)')
            ->execute([$row['id'], hash('sha256', $token), $expires]);
        $resetLink = 'https://app.buildmetrics.uk/reset-password.html?token=' . $token;
        _send_reset_email($email, $row['name'] ?? 'there', $resetLink);
    }
    json_out($generic);
}

// ── PASSWORD RESET: CONFIRM ─────────────────────────────────────────────────
// POST { token, password }
if ($action === 'reset-confirm') {
    $b        = body();
    $token    = trim($b['token'] ?? '');
    $password = $b['password'] ?? '';

    if (!$token) json_err('Invalid reset link');
    if (strlen($password) < 8) json_err('Password must be at least 8 characters');

    $stmt = db()->prepare(
        'SELECT id, user_id FROM password_resets
         WHERE token_hash = ? AND used = 0 AND expires_at > NOW()'
    );
    $stmt->execute([hash('sha256', $token)]);
    $pr = $stmt->fetch();
    if (!$pr) json_err('This reset link is invalid or has expired. Please request a new one.');

    $hash = password_hash($password, PASSWORD_DEFAULT);
    db()->prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?')->execute([$hash, '', $pr['user_id']]);
    db()->prepare('UPDATE password_resets SET used = 1 WHERE id = ?')->execute([$pr['id']]);
    // Invalidate every existing session for this user — force re-login everywhere
    db()->prepare('DELETE FROM sessions WHERE user_id = ?')->execute([$pr['user_id']]);

    json_out(['success' => true, 'message' => 'Password updated. You can now sign in.']);
}

// Internal helper — sends the reset email via the existing send-email endpoint
function _send_reset_email(string $to, string $name, string $resetLink): void {
    $payload = json_encode(['type' => 'reset', 'to' => $to, 'name' => $name, 'resetLink' => $resetLink]);
    $ch = curl_init('https://app.buildmetrics.uk/api/send-email.php');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => $payload,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 8,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'X-Internal-Call: ' . INTERNAL_SECRET],
    ]);
    curl_exec($ch);
}

json_err('Unknown action', 404);
