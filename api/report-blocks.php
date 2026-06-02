<?php
// v1
/**
 * report-blocks.php — CRUD for individual blocks within a report
 *
 * All actions via POST with JSON body:
 *
 * {action:'create',  report_id, type, order_index, label?, config_json?}
 * {action:'update',  id, label?, config_json?, results_json?, validated?, order_index?}
 * {action:'delete',  id}
 * {action:'reorder', report_id, order:[{id, order_index},...]}
 */
require_once __DIR__ . '/db.php';
cors();
$u = require_auth();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_err('Method not allowed', 405);

$b      = body();
$action = $b['action'] ?? '';

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Verify that a report exists and belongs to the authenticated user.
 */
function report_owned(string $report_id, string $user_id): bool {
    $stmt = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
    $stmt->execute([$report_id, $user_id]);
    return (bool)$stmt->fetch();
}

/**
 * Given a block id, return its report_id if the report belongs to the user.
 */
function block_report_id(string $block_id, string $user_id): ?string {
    $stmt = db()->prepare(
        'SELECT rb.report_id FROM report_blocks rb
         JOIN reports r ON r.id = rb.report_id
         WHERE rb.id = ? AND r.user_id = ?'
    );
    $stmt->execute([$block_id, $user_id]);
    $row = $stmt->fetch();
    return $row ? $row['report_id'] : null;
}

/**
 * Fetch and return a single block row with decoded JSON fields.
 */
function fetch_block(string $id): ?array {
    $stmt = db()->prepare('SELECT * FROM report_blocks WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $row['config']    = $row['config_json']  ? json_decode($row['config_json'],  true) : null;
    $row['results']   = $row['results_json'] ? json_decode($row['results_json'], true) : null;
    $row['validated'] = (bool)$row['validated'];
    unset($row['config_json'], $row['results_json']);
    return $row;
}

// ── CREATE ───────────────────────────────────────────────────────────────────
if ($action === 'create') {
    $report_id   = $b['report_id']   ?? null;
    $type        = $b['type']        ?? null;
    $order_index = $b['order_index'] ?? 0;
    $label       = $b['label']       ?? null;
    // config_json may arrive as a JSON string (already encoded by JS) or as an object.
    // If it's already a string, store it directly. If it's an object/array, encode it.
    if (isset($b['config_json'])) {
        $config_json = is_string($b['config_json']) ? $b['config_json'] : json_encode($b['config_json']);
    } else {
        $config_json = null;
    }

    if (!$report_id) json_err('report_id required');
    if (!$type)      json_err('type required');
    if (!report_owned($report_id, $u['id'])) json_err('Report not found', 404);

    $id = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));

    db()->prepare(
        'INSERT INTO report_blocks (id, report_id, type, order_index, label, config_json)
         VALUES (?, ?, ?, ?, ?, ?)'
    )->execute([$id, $report_id, $type, $order_index, $label, $config_json]);

    json_out(fetch_block($id), 201);
}

// ── UPDATE ───────────────────────────────────────────────────────────────────
if ($action === 'update') {
    $id = $b['id'] ?? null;
    if (!$id) json_err('id required');
    if (!block_report_id($id, $u['id'])) json_err('Block not found', 404);

    $sets = []; $vals = [];

    if (array_key_exists('label', $b)) {
        $sets[] = 'label = ?';
        $vals[] = $b['label'];
    }
    if (array_key_exists('config_json', $b)) {
        $sets[] = 'config_json = ?';
        // config_json may arrive as a string (already encoded by JS) or as an object
        $vals[] = is_string($b['config_json']) ? $b['config_json'] : json_encode($b['config_json']);
    }
    if (array_key_exists('results_json', $b)) {
        $sets[] = 'results_json = ?';
        // results_json may arrive as a string (already encoded by JS) or as an object
        $vals[] = is_string($b['results_json']) ? $b['results_json'] : json_encode($b['results_json']);
    }
    if (array_key_exists('validated', $b)) {
        $sets[] = 'validated = ?';
        $vals[] = $b['validated'] ? 1 : 0;
    }
    if (array_key_exists('order_index', $b)) {
        $sets[] = 'order_index = ?';
        $vals[] = (int)$b['order_index'];
    }

    if ($sets) {
        $vals[] = $id;
        db()->prepare(
            'UPDATE report_blocks SET ' . implode(', ', $sets) . ', updated_at = NOW()
             WHERE id = ?'
        )->execute($vals);
    }

    json_out(['success' => true]);
}

// ── DELETE ───────────────────────────────────────────────────────────────────
if ($action === 'delete') {
    $id = $b['id'] ?? null;
    if (!$id) json_err('id required');
    if (!block_report_id($id, $u['id'])) json_err('Block not found', 404);

    db()->prepare('DELETE FROM report_blocks WHERE id = ?')->execute([$id]);
    json_out(['success' => true]);
}

// ── REORDER ──────────────────────────────────────────────────────────────────
if ($action === 'reorder') {
    $report_id = $b['report_id'] ?? null;
    $order     = $b['order']     ?? [];

    if (!$report_id) json_err('report_id required');
    if (!is_array($order)) json_err('order must be an array');
    if (!report_owned($report_id, $u['id'])) json_err('Report not found', 404);

    $stmt = db()->prepare(
        'UPDATE report_blocks SET order_index = ?, updated_at = NOW()
         WHERE id = ? AND report_id = ?'
    );
    foreach ($order as $item) {
        if (empty($item['id']) || !isset($item['order_index'])) continue;
        $stmt->execute([(int)$item['order_index'], $item['id'], $report_id]);
    }
    json_out(['success' => true]);
}

json_err('Unknown action', 400);
