<?php
/**
 * db.php — MySQL connection for BuildMetrics
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'u668627379_buildmetrics');
define('DB_USER', 'u668627379_buildmetrics');
define('DB_PASS', '/Hl9SlF2rT');
define('DB_CHARSET', 'utf8mb4');

function db(): PDO {
    static $pdo = null;
    if ($pdo) return $pdo;
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
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Content-Type: application/json');
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

function body(): array {
    return json_decode(file_get_contents('php://input'), true) ?? [];
}

// ── Auth token helpers ─────────────────────────────────────────────────────
define('TOKEN_SECRET', 'bm_s3cr3t_' . DB_PASS);
define('TOKEN_TTL', 60 * 60 * 24 * 30); // 30 days

function generate_token(int $user_id): string {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + TOKEN_TTL);
    db()->prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)')
        ->execute([$user_id, $token, $expires]);
    return $token;
}

function auth_user(): ?array {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(\S+)$/i', $header, $m)) return null;
    $token = $m[1];
    $stmt = db()->prepare(
        'SELECT u.* FROM users u
         JOIN sessions s ON s.user_id = u.id
         WHERE s.token = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([$token]);
    return $stmt->fetch() ?: null;
}

function require_auth(): array {
    $u = auth_user();
    if (!$u) json_err('Unauthorised', 401);
    return $u;
}
