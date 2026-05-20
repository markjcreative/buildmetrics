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
    if (strlen($password) < 6) json_err('Password must be at least 6 characters');

    $exists = db()->prepare('SELECT id FROM users WHERE email = ?');
    $exists->execute([$email]);
    if ($exists->fetch()) json_err('An account with this email already exists');

    $salt = bin2hex(random_bytes(16));
    $hash = hash('sha256', $password . $salt);

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

    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row) json_err('No account found with this email address');
    if ($row['provider'] === 'google') json_err('This account uses Google Sign-In. Please use the Google button.');

    $hash = hash('sha256', $password . $row['salt']);
    if ($hash !== $row['password_hash']) json_err('Incorrect password. Please try again.');

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
        db()->prepare('DELETE FROM sessions WHERE token = ?')->execute([$m[1]]);
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

json_err('Unknown action', 404);
