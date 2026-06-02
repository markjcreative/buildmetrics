<?php
// v1
/**
 * reports.php — Engineering Canvas Report CRUD
 *
 * GET  ?action=list         → list all reports for authenticated user
 * GET  ?action=get&id=XXX   → single report + blocks
 * POST {action:'create', project_id?, title?}          → create report
 * POST {action:'update', id, title?, status?}          → update report
 * POST {action:'delete', id}                           → delete report + blocks
 */
require_once __DIR__ . '/db.php';
cors();
$u = require_auth();
$m = $_SERVER['REQUEST_METHOD'];

// ── GET ──────────────────────────────────────────────────────────────────────
if ($m === 'GET') {
    $action = $_GET['action'] ?? 'list';

    // LIST
    if ($action === 'list') {
        $stmt = db()->prepare(
            'SELECT r.id, r.project_id, p.name AS project_name,
                    r.title, r.status, r.created_at, r.updated_at,
                    (SELECT COUNT(*) FROM report_blocks rb WHERE rb.report_id = r.id) AS block_count
             FROM reports r
             LEFT JOIN projects p ON p.id = r.project_id
             WHERE r.user_id = ?
             ORDER BY r.updated_at DESC'
        );
        $stmt->execute([$u['id']]);
        json_out($stmt->fetchAll());
    }

    // GET single
    if ($action === 'get') {
        $id = $_GET['id'] ?? null;
        if (!$id) json_err('id required');

        $stmt = db()->prepare(
            'SELECT r.*, p.name AS project_name
             FROM reports r
             LEFT JOIN projects p ON p.id = r.project_id
             WHERE r.id = ? AND r.user_id = ?'
        );
        $stmt->execute([$id, $u['id']]);
        $report = $stmt->fetch();
        if (!$report) json_err('Report not found', 404);

        // Fetch blocks
        $bstmt = db()->prepare(
            'SELECT * FROM report_blocks WHERE report_id = ? ORDER BY order_index ASC'
        );
        $bstmt->execute([$id]);
        $blocks = $bstmt->fetchAll();
        foreach ($blocks as &$b) {
            $b['config']    = $b['config_json']  ? json_decode($b['config_json'],  true) : null;
            $b['results']   = $b['results_json'] ? json_decode($b['results_json'], true) : null;
            $b['validated'] = (bool)$b['validated'];
            unset($b['config_json'], $b['results_json']);
        }
        unset($b);

        $report['blocks'] = $blocks;
        json_out($report);
    }

    json_err('Unknown action', 400);
}

// ── POST ─────────────────────────────────────────────────────────────────────
if ($m === 'POST') {
    $b      = body();
    $action = $b['action'] ?? '';

    // CREATE
    if ($action === 'create') {
        $id         = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
            mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
            mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
        $title      = $b['title']      ?? 'Untitled Report';
        $project_id = $b['project_id'] ?? null;

        // Verify project belongs to user if provided
        if ($project_id) {
            $ps = db()->prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?');
            $ps->execute([$project_id, $u['id']]);
            if (!$ps->fetch()) $project_id = null;
        }

        db()->prepare(
            'INSERT INTO reports (id, user_id, project_id, title, status)
             VALUES (?, ?, ?, ?, "draft")'
        )->execute([$id, $u['id'], $project_id, $title]);

        $stmt = db()->prepare(
            'SELECT r.*, p.name AS project_name
             FROM reports r
             LEFT JOIN projects p ON p.id = r.project_id
             WHERE r.id = ?'
        );
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        $report['blocks'] = [];
        json_out($report, 201);
    }

    // UPDATE
    if ($action === 'update') {
        $id = $b['id'] ?? null;
        if (!$id) json_err('id required');

        // Verify ownership
        $chk = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
        $chk->execute([$id, $u['id']]);
        if (!$chk->fetch()) json_err('Report not found', 404);

        $allowed = ['title', 'status'];
        $sets = []; $vals = [];
        foreach ($allowed as $k) {
            if (!array_key_exists($k, $b)) continue;
            $sets[] = "$k = ?";
            $vals[] = $b[$k];
        }
        if ($sets) {
            $vals[] = $id;
            $vals[] = $u['id'];
            db()->prepare(
                'UPDATE reports SET ' . implode(', ', $sets) . ', updated_at = NOW()
                 WHERE id = ? AND user_id = ?'
            )->execute($vals);
        }
        json_out(['success' => true]);
    }

    // DELETE
    if ($action === 'delete') {
        $id = $b['id'] ?? null;
        if (!$id) json_err('id required');

        // Verify ownership
        $chk = db()->prepare('SELECT id FROM reports WHERE id = ? AND user_id = ?');
        $chk->execute([$id, $u['id']]);
        if (!$chk->fetch()) json_err('Report not found', 404);

        // Delete blocks first, then report
        db()->prepare('DELETE FROM report_blocks WHERE report_id = ?')->execute([$id]);
        db()->prepare('DELETE FROM reports WHERE id = ? AND user_id = ?')->execute([$id, $u['id']]);
        json_out(['success' => true]);
    }

    json_err('Unknown action', 400);
}

json_err('Bad request', 400);
