<?php
// v1
/**
 * report-versions.php — Report Version History & Activity Log
 *
 * POST {action:'snapshot', report_id, version_label?, blocks_json}
 *   → create a report_versions record, log 'snapshot' to report_activity
 *   → return {id, version_label, created_at}
 *
 * GET  ?action=list&report_id=xxx
 *   → return last 20 versions for this report
 *   → [{id, version_label, created_at, block_count}]
 *
 * GET  ?action=get&id=xxx
 *   → return full version with blocks_snapshot (decoded)
 *
 * POST {action:'restore', report_id, version_id}
 *   → load blocks_snapshot from version, replace all report_blocks for that report
 *   → log 'restore' to report_activity
 *   → return {success: true}
 *
 * GET  ?action=log&report_id=xxx
 *   → return last 50 activity entries for this report
 *   → [{action, detail, created_at}]
 */
require_once __DIR__ . '/db.php';
cors();
$u = require_auth();
$m = $_SERVER['REQUEST_METHOD'];

// ── UUID helper ──────────────────────────────────────────────────────────────
function new_uuid() {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,
        mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
}

// ── Ownership check ──────────────────────────────────────────────────────────
function _check_report_owner($report_id, $user_id) {
    $chk = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
    $chk->execute([$report_id, $user_id]);
    return $chk->fetch() !== false;
}

// ── Activity logger ──────────────────────────────────────────────────────────
function _log_activity($report_id, $user_id, $action, $detail = null) {
    db()->prepare(
        'INSERT INTO report_activity (id, report_id, user_id, action, detail)
         VALUES (?, ?, ?, ?, ?)'
    )->execute([new_uuid(), $report_id, $user_id, $action, $detail]);
}

// ── GET ──────────────────────────────────────────────────────────────────────
if ($m === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // LIST — last 20 versions for a report
    if ($action === 'list') {
        $report_id = $_GET['report_id'] ?? null;
        if (!$report_id) json_err('report_id required');
        if (!_check_report_owner($report_id, $u['id'])) json_err('Report not found', 404);

        $stmt = db()->prepare(
            'SELECT id, version_label, created_at,
                    JSON_LENGTH(blocks_snapshot) AS block_count
             FROM report_versions
             WHERE report_id = ?
             ORDER BY created_at DESC
             LIMIT 20'
        );
        $stmt->execute([$report_id]);
        json_out($stmt->fetchAll());
    }

    // GET single version with full snapshot
    if ($action === 'get') {
        $id = $_GET['id'] ?? null;
        if (!$id) json_err('id required');

        $stmt = db()->prepare(
            'SELECT rv.id, rv.report_id, rv.version_label, rv.created_at, rv.blocks_snapshot
             FROM report_versions rv
             JOIN reports r ON r.id = rv.report_id AND r.user_id = ?
             WHERE rv.id = ?'
        );
        $stmt->execute([$u['id'], $id]);
        $v = $stmt->fetch();
        if (!$v) json_err('Version not found', 404);

        $v['blocks'] = $v['blocks_snapshot'] ? json_decode($v['blocks_snapshot'], true) : [];
        unset($v['blocks_snapshot']);
        json_out($v);
    }

    // ACTIVITY LOG — last 50 entries for a report
    if ($action === 'log') {
        $report_id = $_GET['report_id'] ?? null;
        if (!$report_id) json_err('report_id required');
        if (!_check_report_owner($report_id, $u['id'])) json_err('Report not found', 404);

        $stmt = db()->prepare(
            'SELECT action, detail, created_at
             FROM report_activity
             WHERE report_id = ?
             ORDER BY created_at DESC
             LIMIT 50'
        );
        $stmt->execute([$report_id]);
        json_out($stmt->fetchAll());
    }

    json_err('Unknown action', 400);
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($m === 'POST') {
    $b      = body();
    $action = $b['action'] ?? '';

    // SNAPSHOT — save a version
    if ($action === 'snapshot') {
        $report_id    = $b['report_id']    ?? null;
        $version_label = trim($b['version_label'] ?? 'Auto-save') ?: 'Auto-save';
        $blocks_json  = $b['blocks_json']  ?? null;

        if (!$report_id) json_err('report_id required');
        if (!_check_report_owner($report_id, $u['id'])) json_err('Report not found', 404);

        // Encode blocks to JSON string if it's already an array/object
        if (is_array($blocks_json) || is_object($blocks_json)) {
            $blocks_json = json_encode($blocks_json);
        }
        if (!$blocks_json) $blocks_json = '[]';

        $id = new_uuid();
        db()->prepare(
            'INSERT INTO report_versions (id, report_id, user_id, version_label, blocks_snapshot)
             VALUES (?, ?, ?, ?, ?)'
        )->execute([$id, $report_id, $u['id'], $version_label, $blocks_json]);

        _log_activity($report_id, $u['id'], 'snapshot', $version_label);

        $stmt = db()->prepare('SELECT id, version_label, created_at FROM report_versions WHERE id = ?');
        $stmt->execute([$id]);
        json_out($stmt->fetch(), 201);
    }

    // RESTORE — replace report_blocks from a version snapshot
    if ($action === 'restore') {
        $report_id  = $b['report_id']  ?? null;
        $version_id = $b['version_id'] ?? null;

        if (!$report_id || !$version_id) json_err('report_id and version_id required');
        if (!_check_report_owner($report_id, $u['id'])) json_err('Report not found', 404);

        // Load the version snapshot
        $stmt = db()->prepare(
            'SELECT rv.id, rv.version_label, rv.blocks_snapshot
             FROM report_versions rv
             JOIN reports r ON r.id = rv.report_id AND r.user_id = ?
             WHERE rv.id = ? AND rv.report_id = ?'
        );
        $stmt->execute([$u['id'], $version_id, $report_id]);
        $version = $stmt->fetch();
        if (!$version) json_err('Version not found', 404);

        $blocks = json_decode($version['blocks_snapshot'], true) ?? [];

        // Replace all existing blocks for this report
        db()->prepare('DELETE FROM report_blocks WHERE report_id = ?')->execute([$report_id]);

        foreach ($blocks as $idx => $block) {
            $block_id = $block['id'] ?? new_uuid();
            db()->prepare(
                'INSERT INTO report_blocks (id, report_id, type, order_index, label, config_json, results_json, validated)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
            )->execute([
                $block_id,
                $report_id,
                $block['type'] ?? 'text',
                $block['order_index'] ?? $idx,
                $block['label'] ?? null,
                isset($block['config']) ? json_encode($block['config']) : ($block['config_json'] ?? null),
                isset($block['results']) ? json_encode($block['results']) : ($block['results_json'] ?? null),
                $block['validated'] ? 1 : 0,
            ]);
        }

        // Update report updated_at
        db()->prepare('UPDATE reports SET updated_at = NOW() WHERE id = ?')->execute([$report_id]);

        _log_activity($report_id, $u['id'], 'restore', $version['version_label']);

        json_out(['success' => true]);
    }

    json_err('Unknown action', 400);
}

json_err('Bad request', 400);
