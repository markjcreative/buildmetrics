<?php
// v1
/**
 * report-templates.php — Built-in Engineering Canvas report templates
 *
 * GET  → returns JSON array of all 8 hardcoded templates (no DB required)
 */
require_once __DIR__ . '/db.php';
cors();
require_auth(); // templates are user-scoped (auth required, no user-specific data)

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_err('Method not allowed', 405);

$templates = [

    // 1 ── Steel Beam Design Report ──────────────────────────────────────────
    [
        'id'          => 'tpl-steel-beam',
        'name'        => 'Steel Beam Design Report',
        'category'    => 'Structural Steel',
        'description' => 'Complete steel beam design calculation package per EN 1993-1-1.',
        'icon'        => '🏗',
        'sort_order'  => 1,
        'blocks'      => [
            ['type' => 'title',          'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',   'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',   'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'section_header', 'label' => '1.0 Design Inputs',             'default_config' => ['number' => '1.0', 'title' => 'Design Inputs']],
            ['type' => 'code_ref',       'label' => 'Code References',               'default_config' => ['codes' => ['EN 1993-1-1:2005', 'UK National Annex to EN 1993-1-1']]],
            ['type' => 'calc_beam',      'label' => 'Steel Beam Design',             'default_config' => null],
            ['type' => 'section_header', 'label' => '2.0 Design Checks',             'default_config' => ['number' => '2.0', 'title' => 'Design Checks']],
            ['type' => 'checks_summary', 'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes', 'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',        'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 2 ── RC Frame Analysis ──────────────────────────────────────────────────
    [
        'id'          => 'tpl-rc-frame',
        'name'        => 'RC Frame Analysis',
        'category'    => 'Reinforced Concrete',
        'description' => 'Reinforced concrete beam and column design per EN 1992-1-1.',
        'icon'        => '🧱',
        'sort_order'  => 2,
        'blocks'      => [
            ['type' => 'title',          'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',   'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',   'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',       'label' => 'Code References',               'default_config' => ['codes' => ['EN 1992-1-1:2004', 'UK National Annex to EN 1992-1-1']]],
            ['type' => 'section_header', 'label' => '1.0 RC Beam Design',            'default_config' => ['number' => '1.0', 'title' => 'RC Beam Design']],
            ['type' => 'calc_rc_beam',   'label' => 'RC Beam Design',                'default_config' => null],
            ['type' => 'section_header', 'label' => '2.0 RC Column Design',          'default_config' => ['number' => '2.0', 'title' => 'RC Column Design']],
            ['type' => 'calc_rc_column', 'label' => 'RC Column Design',              'default_config' => null],
            ['type' => 'checks_summary', 'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes', 'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',        'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 3 ── Foundation Design Package ─────────────────────────────────────────
    [
        'id'          => 'tpl-foundation',
        'name'        => 'Foundation Design Package',
        'category'    => 'Foundation',
        'description' => 'Load takedown and pad footing design per EN 1997-1 and EN 1992-1-1.',
        'icon'        => '🏗',
        'sort_order'  => 3,
        'blocks'      => [
            ['type' => 'title',               'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',        'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',        'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',            'label' => 'Code References',               'default_config' => ['codes' => ['EN 1997-1:2004', 'EN 1992-1-1:2004']]],
            ['type' => 'section_header',      'label' => '1.0 Load Takedown',             'default_config' => ['number' => '1.0', 'title' => 'Load Takedown']],
            ['type' => 'calc_load_takedown',  'label' => 'Load Takedown',                 'default_config' => null],
            ['type' => 'section_header',      'label' => '2.0 Pad Footing Design',        'default_config' => ['number' => '2.0', 'title' => 'Pad Footing Design']],
            ['type' => 'calc_footing',        'label' => 'Pad Footing Design',            'default_config' => null],
            ['type' => 'checks_summary',      'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',      'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',             'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 4 ── Retaining Wall Report ──────────────────────────────────────────────
    [
        'id'          => 'tpl-retaining',
        'name'        => 'Retaining Wall Report',
        'category'    => 'Geotechnical',
        'description' => 'Retaining wall stability and structural design per EN 1997-1 and EN 1992-1-1.',
        'icon'        => '🧱',
        'sort_order'  => 4,
        'blocks'      => [
            ['type' => 'title',           'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',    'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',    'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',        'label' => 'Code References',               'default_config' => ['codes' => ['EN 1997-1:2004', 'EN 1992-1-1:2004']]],
            ['type' => 'calc_retaining',  'label' => 'Retaining Wall Design',         'default_config' => null],
            ['type' => 'checks_summary',  'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',  'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',         'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 5 ── Full Structural Package ────────────────────────────────────────────
    [
        'id'          => 'tpl-full-structural',
        'name'        => 'Full Structural Package',
        'category'    => 'Structural',
        'description' => 'Comprehensive structural design package covering steel, RC, and foundations.',
        'icon'        => '📋',
        'sort_order'  => 5,
        'blocks'      => [
            ['type' => 'title',              'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',       'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',       'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',           'label' => 'Code References',               'default_config' => ['codes' => ['EN 1993-1-1:2005', 'EN 1992-1-1:2004', 'EN 1991-1-1:2002']]],
            ['type' => 'calc_load_takedown', 'label' => 'Load Takedown',                 'default_config' => null],
            ['type' => 'calc_beam',          'label' => 'Steel Beam Design',             'default_config' => null],
            ['type' => 'calc_column',        'label' => 'Steel Column Design',           'default_config' => null],
            ['type' => 'calc_rc_beam',       'label' => 'RC Beam Design',                'default_config' => null],
            ['type' => 'calc_slab',          'label' => 'RC Slab Design',                'default_config' => null],
            ['type' => 'calc_footing',       'label' => 'Pad Footing Design',            'default_config' => null],
            ['type' => 'checks_summary',     'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',     'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',            'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 6 ── Steel Column Design ────────────────────────────────────────────────
    [
        'id'          => 'tpl-steel-column',
        'name'        => 'Steel Column Design',
        'category'    => 'Structural Steel',
        'description' => 'Steel column design and EC3 member verification per EN 1993-1-1.',
        'icon'        => '⚙',
        'sort_order'  => 6,
        'blocks'      => [
            ['type' => 'title',             'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',      'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',      'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',          'label' => 'Code References',               'default_config' => ['codes' => ['EN 1993-1-1:2005']]],
            ['type' => 'calc_column',       'label' => 'Steel Column Design',           'default_config' => null],
            ['type' => 'calc_steel_member', 'label' => 'EC3 Member Verification',       'default_config' => null],
            ['type' => 'checks_summary',    'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',    'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',           'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 7 ── Timber Structure Report ────────────────────────────────────────────
    [
        'id'          => 'tpl-timber',
        'name'        => 'Timber Structure Report',
        'category'    => 'Timber',
        'description' => 'Timber beam and column design per EN 1995-1-1.',
        'icon'        => '🌲',
        'sort_order'  => 7,
        'blocks'      => [
            ['type' => 'title',           'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',    'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',    'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',        'label' => 'Code References',               'default_config' => ['codes' => ['EN 1995-1-1:2004']]],
            ['type' => 'calc_beam',       'label' => 'Timber Beam Design',            'default_config' => null],
            ['type' => 'calc_timber_col', 'label' => 'Timber Column Design',          'default_config' => null],
            ['type' => 'checks_summary',  'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',  'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',         'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 8 ── Wind & Load Assessment ─────────────────────────────────────────────
    [
        'id'          => 'tpl-wind-load',
        'name'        => 'Wind & Load Assessment',
        'category'    => 'Loading',
        'description' => 'EC1 wind loading and load takedown assessment per EN 1991-1-4 and EN 1991-1-1.',
        'icon'        => '🌬',
        'sort_order'  => 8,
        'blocks'      => [
            ['type' => 'title',              'label' => 'Report Title',                  'default_config' => null],
            ['type' => 'project_info',       'label' => 'Project Information',           'default_config' => null],
            ['type' => 'design_basis',       'label' => 'Design Basis & Assumptions',    'default_config' => null],
            ['type' => 'code_ref',           'label' => 'Code References',               'default_config' => ['codes' => ['EN 1991-1-4:2005', 'EN 1991-1-1:2002']]],
            ['type' => 'calc_wind',          'label' => 'EC1 Wind Loading',              'default_config' => null],
            ['type' => 'calc_load_takedown', 'label' => 'Load Takedown',                 'default_config' => null],
            ['type' => 'checks_summary',     'label' => 'Design Checks Summary',         'default_config' => null],
            ['type' => 'engineer_notes',     'label' => 'Engineer Notes & Conclusions',  'default_config' => null],
            ['type' => 'signoff',            'label' => 'Engineer Sign-off',             'default_config' => null],
        ],
    ],

    // 9 ── Temporary Works Hoarding (TwF2012) ────────────────────────────────
    // Mirrors the TwF2012 reference calculation structure: project details →
    // wind / post / rail / fixing / facing / foundation → results summary →
    // design basis & references → sign-off.
    [
        'id'          => 'tpl-hoarding-twf2012',
        'name'        => 'Temporary Works Hoarding (TwF2012)',
        'category'    => 'Temporary Works',
        'description' => 'Timber-post hoarding to TwF2012: 3-case wind (EN 1991-1-4), post cantilever & rail (EN 1995-1-1), Johansen fixings, ply facing and dug-in foundation overturning.',
        'icon'        => '🚧',
        'sort_order'  => 9,
        'blocks'      => [
            ['type' => 'title',             'label' => 'Report Title',                 'default_config' => ['title' => 'Temporary Works — Hoarding Design Calculation (Timber Posts)']],
            ['type' => 'section_header',    'label' => '1.0 Project Details',          'default_config' => ['number' => '1.0', 'title' => 'Project Details']],
            ['type' => 'project_info',      'label' => 'Project Information',          'default_config' => null],
            ['type' => 'section_header',    'label' => '2.0 Hoarding Design',          'default_config' => ['number' => '2.0', 'title' => 'Hoarding Design — Wind, Post, Rail, Fixing, Facing & Foundation']],
            ['type' => 'calc_hoarding',     'label' => 'Hoarding Design (TwF2012)',    'default_config' => null],
            ['type' => 'section_header',    'label' => '3.0 Results Summary',          'default_config' => ['number' => '3.0', 'title' => 'Results Summary']],
            ['type' => 'checks_summary',    'label' => 'Design Checks Summary',        'default_config' => null],
            ['type' => 'utilisation_chart', 'label' => 'Utilisation Chart',            'default_config' => null],
            ['type' => 'section_header',    'label' => '4.0 Design Basis & References','default_config' => ['number' => '4.0', 'title' => 'Design Basis & References']],
            ['type' => 'design_basis',      'label' => 'Design Basis & Assumptions',   'default_config' => ['text' => 'Hoarding designed as a vertical cantilever per TwF2012 "Hoardings: a guide to good practice" (dug-in post method, Table 1 soil factors). Wind actions per BS EN 1991-1-4 + UK NA with three detail cases (Normal ×1.00, Next-to-end ×1.25, End ×1.50); governing case carried through all member checks. Timber design per BS EN 1995-1-1 (γM = 1.30); fixings by Johansen yield theory (Eq. 8.6 bolts / Eq. 8.7 nails). Deflection limits: post δ = wL⁴/8EI ≤ Leff/40; rail & facing δ = 5wL⁴/384EI ≤ L/40, on characteristic loads. Foundation FOS ≥ 1.5 on overturning.']],
            ['type' => 'code_ref',          'label' => 'Code References',              'default_config' => ['codes' => ['TwF2012 — Hoardings: a guide to good practice', 'BS EN 1990:2002 + UK NA (γQ = 1.5)', 'BS EN 1991-1-4:2005 + UK NA', 'BS EN 1995-1-1:2004 + UK NA', 'BS EN 1997-1:2004 + UK NA']]],
            ['type' => 'engineer_notes',    'label' => 'Engineer Notes & Conclusions', 'default_config' => null],
            ['type' => 'signoff',           'label' => 'Engineer Sign-off',            'default_config' => null],
            ['type' => 'revision_history',  'label' => 'Revision History',             'default_config' => null],
        ],
    ],

];

json_out($templates);
