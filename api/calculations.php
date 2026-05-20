<?php
// v2
/**
 * calculations.php — Calculation history CRUD
 * GET    /api/calculations.php              → list (optional ?project_id=xx or ?type=xx)
 * POST   /api/calculations.php              → save calculation
 * PUT    /api/calculations.php?id=xx        → update
 * DELETE /api/calculations.php?id=xx        → delete one
 * DELETE /api/calculations.php?clear=1      → clear all history
 */
require_once __DIR__ . '/db.php';
cors();
$u = require_auth();
$m = $_SERVER['REQUEST_METHOD'];

// LIST
if ($m === 'GET') {
    $where = ['c.user_id = ?']; $vals = [$u['id']];
    if (!empty($_GET['project_id'])) { $where[] = 'c.project_id = ?'; $vals[] = $_GET['project_id']; }
    if (!empty($_GET['type']))       { $where[] = 'c.calc_type = ?'; $vals[] = $_GET['type']; }
    $sql  = 'SELECT c.*, p.name AS project_name FROM calculations c
             LEFT JOIN projects p ON p.id = c.project_id
             WHERE ' . implode(' AND ', $where) . '
             ORDER BY c.updated_at DESC LIMIT 200';
    $stmt = db()->prepare($sql);
    $stmt->execute($vals);
    $rows = $stmt->fetchAll();
    // Decode JSON fields
    foreach ($rows as &$r) {
        $r['inputs']  = $r['inputs']  ? json_decode($r['inputs'],  true) : null;
        $r['results'] = $r['results'] ? json_decode($r['results'], true) : null;
    }
    json_out($rows);
}

// SAVE (create or upsert)
if ($m === 'POST') {
    $b = body();
    $id        = $b['id'] ?? sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000,mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff),mt_rand(0,0xffff),mt_rand(0,0xffff));
    $calc_type  = $b['calc_type']  ?? $b['type'] ?? '';
    $name       = $b['name']       ?? 'Untitled Calculation';
    $project_id = $b['project_id'] ?? null;
    $inputs     = isset($b['inputs'])  ? json_encode($b['inputs'])  : null;
    $results    = isset($b['results']) ? json_encode($b['results']) : null;

    if (!$calc_type) json_err('calc_type is required');

    // Verify project belongs to user if provided
    if ($project_id) {
        $ps = db()->prepare('SELECT id FROM projects WHERE id=? AND user_id=?');
        $ps->execute([$project_id, $u['id']]);
        if (!$ps->fetch()) $project_id = null;
    }

    db()->prepare(
        'INSERT INTO calculations (id, user_id, project_id, calc_type, name, inputs, results)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE project_id=VALUES(project_id), name=VALUES(name),
                                 inputs=VALUES(inputs), results=VALUES(results), updated_at=NOW()'
    )->execute([$id, $u['id'], $project_id, $calc_type, $name, $inputs, $results]);

    $stmt = db()->prepare('SELECT * FROM calculations WHERE id=?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $row['inputs']  = $row['inputs']  ? json_decode($row['inputs'],  true) : null;
    $row['results'] = $row['results'] ? json_decode($row['results'], true) : null;
    json_out($row, 201);
}

// UPDATE
if ($m === 'PUT') {
    $id   = $_GET['id'] ?? null;
    if (!$id) json_err('id required');
    $b    = body();
    $allowed = ['name', 'project_id', 'inputs', 'results'];
    $sets = []; $vals = [];
    foreach ($allowed as $k) {
        if (!array_key_exists($k, $b)) continue;
        $val = in_array($k, ['inputs','results']) ? json_encode($b[$k]) : $b[$k];
        $sets[] = "$k = ?"; $vals[] = $val;
    }
    if ($sets) {
        $vals[] = $id; $vals[] = $u['id'];
        db()->prepare('UPDATE calculations SET ' . implode(', ', $sets) . ', updated_at=NOW() WHERE id=? AND user_id=?')->execute($vals);
    }
    json_out(['success' => true]);
}

// DELETE one or clear all
if ($m === 'DELETE') {
    if (!empty($_GET['clear'])) {
        db()->prepare('DELETE FROM calculations WHERE user_id=?')->execute([$u['id']]);
        json_out(['success' => true]);
    }
    $id = $_GET['id'] ?? null;
    if (!$id) json_err('id required');
    db()->prepare('DELETE FROM calculations WHERE id=? AND user_id=?')->execute([$id, $u['id']]);
    json_out(['success' => true]);
}

json_err('Bad request', 400);
