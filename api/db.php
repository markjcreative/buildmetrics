<?php
// v2
/**
 * db.php — MySQL connection for BuildMetrics
 */

// Secrets live in the gitignored config.php (uploaded to the server manually).
require_once __DIR__ . '/config.php';

// Non-secret connection params fall back to sensible defaults; the password
// MUST come from config.php (no value is hardcoded in version control).
if (!defined('DB_HOST'))    define('DB_HOST', 'localhost');
if (!defined('DB_NAME'))    define('DB_NAME', 'u668627379_buildmetrics');
if (!defined('DB_USER'))    define('DB_USER', 'u668627379_buildmetrics');
if (!defined('DB_CHARSET')) define('DB_CHARSET', 'utf8mb4');

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
    if (!defined('DB_PASS')) {
        http_response_code(500);
        echo json_encode(['error' => 'Server configuration error']);
        exit;
    }
    try {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET,
            DB_USER, DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed']);
        exit;
    }
    return $pdo;
}

// ── Helpers ────────────────────────────────────────────────────────────────
function json_out($data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data);
    exit;
}

function json_err(string $msg, int $code = 400): void {
    json_out(['error' => $msg], $code);
}

function cors(): void {
    // Allowlist of trusted front-end origins (Bearer-token auth, so no cookies/credentials)
    $allowed = [
        'https://app.buildmetrics.uk',
        'https://buildmetrics.uk',
        'https://www.buildmetrics.uk',
    ];
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    header('Content-Type: application/json');
    if (in_array($origin, $allowed, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Vary: Origin');
    } else {
        header('Access-Control-Allow-Origin: https://app.buildmetrics.uk');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Internal-Call');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// Best-effort client IP (honours Hostinger's forwarding proxy)
function client_ip(): string {
    $fwd = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? '';
    if ($fwd) { $parts = explode(',', $fwd); return trim($parts[0]); }
    return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
}

// ── Auth token helpers ─────────────────────────────────────────────────────
// Derive secrets from DB_PASS for entropy; guard so an incomplete config never
// triggers a fatal "undefined constant" before the graceful checks run.
define('_SECRET_SEED', defined('DB_PASS') ? DB_PASS : 'unconfigured');
define('TOKEN_SECRET', 'bm_s3cr3t_' . _SECRET_SEED);
define('TOKEN_TTL', 60 * 60 * 24 * 30); // 30 days
// Shared secret for server-to-server (internal) API calls, e.g. auth → send-email
define('INTERNAL_SECRET', hash('sha256', 'bm_internal_' . _SECRET_SEED));

// Store only a hash of the session token in the DB — a DB leak then cannot be
// replayed as a live session. The raw token is returned to the client once.
function _hash_token(string $token): string {
    return hash('sha256', $token);
}

function generate_token(int $user_id): string {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + TOKEN_TTL);
    db()->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
        ->execute([$user_id, _hash_token($token), $expires]);
    return $token;
}

function auth_user(): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) return null;
    $token = $m[1];
    // Match the hashed token (new sessions) OR the raw token (legacy sessions
    // created before token hashing — they keep working until they expire).
    $stmt = db()->prepare(
        'SELECT u.* FROM users u
         JOIN sessions s ON s.user_id = u.id
         WHERE (s.token = ? OR s.token = ?) AND s.expires_at > NOW()'
    );
    $stmt->execute([_hash_token($token), $token]);
    return $stmt->fetch() ?: null;
}

function require_auth(): array {
    $u = auth_user();
    if (!$u) json_err('Unauthorised', 401);
    return $u;
}
