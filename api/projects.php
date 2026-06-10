<?php
// v2
/**
 * projects.php — Projects CRUD
 * GET    /api/projects.php          → list user's projects
 * POST   /api/projects.php          → create project
 * PUT    /api/projects.php?id=xx    → update project
 * DELETE /api/projects.php?id=xx   → delete project
 */
require_once __DIR__ . '/db.php';
cors();
$u  = require_auth();
$m  = $_SERVER['REQUEST_METHOD'];
$id = $_GET['id'] ?? null;

// LIST
if ($m === 'GET') {
    $stmt = db()->prepare(
        'SELECT p.*, COUNT(c.id) AS calc_count
         FROM projects p
         LEFT JOIN calculations c ON c.project_id = p.id
         WHERE p.user_id = ?
         GROUP BY p.id
         ORDER BY p.updated_at DESC'
    );
    $stmt->execute([$u['id']]);
    json_out($stmt->fetchAll());
}

// CREATE
if ($m === 'POST') {
    $b    = body();
    $name = trim($b['name'] ?? '');
    if (!$name) json_err('Project name is required');
    $pid    = sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff),
        mt_rand(0,0x0fff)|0x4000, mt_rand(0,0x3fff)|0x8000,
        mt_rand(0,0xffff), mt_rand(0,0xffff), mt_rand(0,0xffff));
    $colour   = $b['colour'] ?? '#2563EB';
    // description may be a JSON string or an object/array — handle both safely
    $desc_raw = $b['description'] ?? '';
    $desc     = is_string($desc_raw) ? trim($desc_raw) : json_encode($desc_raw);
    db()->prepare('INSERT INTO projects (id, user_id, name, description, colour) VALUES (?, ?, ?, ?, ?)')
        ->execute([$pid, $u['id'], $name, $desc, $colour]);
    $stmt = db()->prepare('SELECT * FROM projects WHERE id = ?');
    $stmt->execute([$pid]);
    json_out($stmt->fetch(), 201);
}

// UPDATE
if ($m === 'PUT' && $id) {
    $b    = body();
    $stmt = db()->prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $u['id']]);
    if (!$stmt->fetch()) json_err('Project not found', 404);

    $allowed = ['name', 'description', 'colour'];
    $sets = []; $vals = [];
    foreach ($allowed as $k) {
        if (isset($b[$k])) { $sets[] = "$k = ?"; $vals[] = $b[$k]; }
    }
    if ($sets) {
        $vals[] = $id; $vals[] = $u['id'];
        db()->prepare('UPDATE projects SET ' . implode(', ', $sets) . ' WHERE id = ? AND user_id = ?')->execute($vals);
    }
    $stmt = db()->prepare('SELECT * FROM projects WHERE id = ?');
    $stmt->execute([$id]);
    json_out($stmt->fetch());
}

// DELETE
if ($m === 'DELETE' && $id) {
    $stmt = db()->prepare('SELECT id FROM projects WHERE id = ? AND user_id = ?');
    $stmt->execute([$id, $u['id']]);
    if (!$stmt->fetch()) json_err('Project not found', 404);
    db()->prepare('DELETE FROM projects WHERE id = ? AND user_id = ?')->execute([$id, $u['id']]);
    json_out(['success' => true]);
}

json_err('Bad request', 400);
