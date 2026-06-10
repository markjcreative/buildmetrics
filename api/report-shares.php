<?php
/**
 * report-shares.php — Manage public share links for reports
 * POST {action:'create', report_id}    → create share token, return {token, share_url}
 * GET  ?action=list&report_id=xxx      → list active shares for a report
 * POST {action:'revoke', id}           → deactivate a share link
 * GET  ?action=view&token=xxx          → PUBLIC — no auth — get report data for share page
 */
require_once __DIR__ . '/db.php';
cors();

$m = $_SERVER['REQUEST_METHOD'];

// ── Public view (no auth) ──────────────────────────────────────────────────
if ($m === 'GET' && ($_GET['action'] ?? '') === 'view') {
    $token = trim($_GET['token'] ?? '');
    if (!$token) json_err('Token required', 400);

    $stmt = db()->prepare(
        'SELECT rs.*, r.title, r.status, r.project_id, r.updated_at, r.created_at
         FROM report_shares rs
         JOIN reports r ON r.id = rs.report_id
         WHERE rs.token = ? AND rs.active = 1'
    );
    $stmt->execute([$token]);
    $share = $stmt->fetch();
    if (!$share) json_err('Share link not found or expired', 404);

    // Increment view count
    db()->prepare('UPDATE report_shares SET view_count = view_count + 1 WHERE token = ?')
        ->execute([$token]);

    // Load blocks
    $bs = db()->prepare(
        'SELECT * FROM report_blocks WHERE report_id = ? ORDER BY order_index ASC'
    );
    $bs->execute([$share['report_id']]);
    $blocks = $bs->fetchAll();
    foreach ($blocks as &$b) {
        $b['config']  = $b['config_json']  ? json_decode($b['config_json'],  true) : (object)[];
        $b['results'] = $b['results_json'] ? json_decode($b['results_json'], true) : (object)[];
        // Remove raw JSON strings — prevent data leak and reduce payload size
        unset($b['config_json'], $b['results_json']);
    }

    json_out([
        'id'         => $share['report_id'],
        'title'      => $share['title'],
        'status'     => $share['status'],
        'created_at' => $share['created_at'],
        'updated_at' => $share['updated_at'],
        'blocks'     => $blocks,
        'view_count' => (int)$share['view_count'] + 1,
    ]);
}

// ── Authenticated actions ─────────────────────────────────────────────────
$u = require_auth();

if ($m === 'GET' && ($_GET['action'] ?? '') === 'list') {
    $report_id = $_GET['report_id'] ?? '';
    // Verify ownership
    $rStmt = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
    $rStmt->execute([$report_id, $u['id']]);
    if (!$rStmt->fetch()) json_err('Not found', 404);

    $stmt = db()->prepare(
        'SELECT id, token, view_count, active, created_at, expires_at
         FROM report_shares WHERE report_id = ? AND user_id = ? ORDER BY created_at DESC'
    );
    $stmt->execute([$report_id, $u['id']]);
    json_out($stmt->fetchAll());
}

$b = body();
$action = $b['action'] ?? '';

if ($action === 'create') {
    $report_id = $b['report_id'] ?? '';
    // Verify ownership
    $rStmt = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
    $rStmt->execute([$report_id, $u['id']]);
    if (!$rStmt->fetch()) json_err('Report not found', 404);

    // Deactivate old shares for this report (one active share at a time)
    db()->prepare('UPDATE report_shares SET active = 0 WHERE report_id = ? AND user_id = ?')
       ->execute([$report_id, $u['id']]);

    // Generate secure token
    $token = bin2hex(random_bytes(24)); // 48-char hex token
    $id    = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));

    db()->prepare(
        'INSERT INTO report_shares (id, report_id, user_id, token) VALUES (?, ?, ?, ?)'
    )->execute([$id, $report_id, $u['id'], $token]);

    $shareUrl = (isset($_SERVER['HTTPS']) ? 'https' : 'http') . '://' . $_SERVER['HTTP_HOST'] . '/shared-report.html?token=' . $token;
    json_out(['token' => $token, 'share_url' => $shareUrl, 'id' => $id]);
}

if ($action === 'revoke') {
    $id = $b['id'] ?? '';
    db()->prepare('UPDATE report_shares SET active = 0 WHERE id = ? AND user_id = ?')
       ->execute([$id, $u['id']]);
    json_out(['success' => true]);
}

json_err('Unknown action', 400);
