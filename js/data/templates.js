/**
 * BuildMetrics — Calculation Templates
 */
window.CalcTemplates = [
  // ── Beam Templates ──
  {
    id: 'tpl_beam_ss_floor',
    calcType: 'beam',
    category: 'Residential',
    name: 'Simply Supported Floor Beam',
    description: 'Typical residential floor beam, 6m span, UDL dead + live load',
    icon: '🔩',
    tags: ['beam', 'residential', 'floor', 'simply supported'],
    href: '/index.html',
    config: {
      span: 6.0, material: 'steel', section: '356x171x51',
      E: 210000000, I: 0.00014100, A: 0.0000649,
      supports: [{ type: 'pin', position: 0 }, { type: 'roller', position: 6 }],
      loads: [
        { type: 'udl', category: 'dead', start: 0, end: 6, magnitude: 12 },
        { type: 'udl', category: 'live', start: 0, end: 6, magnitude: 5 }
      ]
    }
  },
  {
    id: 'tpl_beam_cantilever',
    calcType: 'beam',
    category: 'Commercial',
    name: 'Cantilever Beam (Balcony)',
    description: '2m cantilever with point load at tip and UDL self-weight',
    icon: '🏗️',
    tags: ['beam', 'cantilever', 'balcony'],
    href: '/index.html',
    config: {
      span: 2.0, material: 'steel', section: '254x146x37',
      E: 210000000, I: 0.00005540, A: 0.0000472,
      supports: [{ type: 'fixed', position: 0 }],
      loads: [
        { type: 'point', category: 'live', position: 2.0, magnitude: 15 },
        { type: 'udl', category: 'dead', start: 0, end: 2, magnitude: 3 }
      ]
    }
  },
  {
    id: 'tpl_beam_continuous',
    calcType: 'beam',
    category: 'Commercial',
    name: 'Continuous Beam (2-span)',
    description: '2×6m continuous beam, typical office floor',
    icon: '📏',
    tags: ['beam', 'continuous', 'commercial', 'office'],
    href: '/index.html',
    config: {
      span: 12.0, material: 'steel', section: '457x191x82',
      E: 210000000, I: 0.00037100, A: 0.000104,
      supports: [{ type: 'pin', position: 0 }, { type: 'roller', position: 6 }, { type: 'roller', position: 12 }],
      loads: [
        { type: 'udl', category: 'dead', start: 0, end: 12, magnitude: 15 },
        { type: 'udl', category: 'live', start: 0, end: 12, magnitude: 7.5 }
      ]
    }
  },
  {
    id: 'tpl_beam_transfer',
    calcType: 'beam',
    category: 'Commercial',
    name: 'Transfer Beam (Point Loads)',
    description: 'Transfer beam carrying column loads above',
    icon: '⚡',
    tags: ['beam', 'transfer', 'point load', 'commercial'],
    href: '/index.html',
    config: {
      span: 8.0, material: 'steel', section: '610x229x113',
      E: 210000000, I: 0.00087300, A: 0.000144,
      supports: [{ type: 'pin', position: 0 }, { type: 'roller', position: 8 }],
      loads: [
        { type: 'point', category: 'dead', position: 2.0, magnitude: 150 },
        { type: 'point', category: 'dead', position: 4.0, magnitude: 200 },
        { type: 'point', category: 'dead', position: 6.0, magnitude: 150 },
        { type: 'udl', category: 'dead', start: 0, end: 8, magnitude: 5 }
      ]
    }
  },
  // ── Column Templates ──
  {
    id: 'tpl_col_internal',
    calcType: 'column',
    category: 'Commercial',
    name: 'Internal Column (UC)',
    description: 'Typical internal column, 4m storey height, heavy floor load',
    icon: '🏛️',
    tags: ['column', 'internal', 'commercial'],
    href: '/calcs/column.html',
    config: {
      sectionType: 'UC', sectionDesig: '254x254x89',
      A: 113, Iyy: 4860, Ixx: 14300, fy: 355, E: 210000,
      length: 4.0, keff: 1.0, NEd: 800
    }
  },
  {
    id: 'tpl_col_perimeter',
    calcType: 'column',
    category: 'Residential',
    name: 'Perimeter Column (UC)',
    description: 'Perimeter column, 3m storey, medium load, wind sway frame',
    icon: '🏠',
    tags: ['column', 'perimeter', 'residential'],
    href: '/calcs/column.html',
    config: {
      sectionType: 'UC', sectionDesig: '203x203x52',
      A: 66.4, Iyy: 1780, Ixx: 5260, fy: 275, E: 210000,
      length: 3.0, keff: 1.2, NEd: 300
    }
  },
  {
    id: 'tpl_col_chs',
    calcType: 'column',
    category: 'Commercial',
    name: 'Circular Hollow Column (CHS)',
    description: 'Exposed CHS column, typical atrium/feature column',
    icon: '⭕',
    tags: ['column', 'CHS', 'circular', 'architectural'],
    href: '/calcs/column.html',
    config: {
      sectionType: 'CHS', sectionDesig: '219.1x8.0',
      A: 52.8, Iyy: 2088, Ixx: 2088, fy: 355, E: 210000,
      length: 5.0, keff: 2.0, NEd: 200
    }
  },
  // ── Slab Templates ──
  {
    id: 'tpl_slab_residential',
    calcType: 'slab',
    category: 'Residential',
    name: 'Residential RC Floor Slab',
    description: '4.5m simply supported slab, 200mm thick, light loading',
    icon: '🏠',
    tags: ['slab', 'residential', 'simply supported'],
    href: '/calcs/slab.html',
    config: {
      span: 4.5, thickness: 200, width: 1.0, fck: 25, fyk: 500,
      cover: 25, barDia: 12, gk: 1.5, qk: 2.0,
      supportType: 'simply_supported', selfWeight: true
    }
  },
  {
    id: 'tpl_slab_office',
    calcType: 'slab',
    category: 'Commercial',
    name: 'Office Floor Slab (Continuous)',
    description: '6m continuous interior slab, 250mm thick, office loading',
    icon: '🏢',
    tags: ['slab', 'office', 'continuous', 'commercial'],
    href: '/calcs/slab.html',
    config: {
      span: 6.0, thickness: 250, width: 1.0, fck: 30, fyk: 500,
      cover: 30, barDia: 16, gk: 2.5, qk: 3.0,
      supportType: 'continuous_int', selfWeight: true
    }
  },
  // ── Footing Templates ──
  {
    id: 'tpl_footing_residential',
    calcType: 'footing',
    category: 'Residential',
    name: 'Pad Footing — Residential Column',
    description: 'Square pad footing under residential column, medium bearing',
    icon: '⬜',
    tags: ['footing', 'pad', 'residential'],
    href: '/calcs/footing.html',
    config: {
      Gk: 300, Qk: 100, columnW: 300, soilBearing: 150,
      footThick: 450, fck: 25, fyk: 500, cover: 75, barDia: 16,
      footingType: 'square'
    }
  },
  {
    id: 'tpl_footing_commercial',
    calcType: 'footing',
    category: 'Commercial',
    name: 'Pad Footing — Heavy Column',
    description: 'Larger pad footing under commercial building column',
    icon: '🏢',
    tags: ['footing', 'pad', 'commercial'],
    href: '/calcs/footing.html',
    config: {
      Gk: 800, Qk: 300, columnW: 400, soilBearing: 200,
      footThick: 600, fck: 30, fyk: 500, cover: 75, barDia: 20,
      footingType: 'square'
    }
  },
  // ── Retaining Wall Templates ──
  {
    id: 'tpl_retwall_garden',
    calcType: 'retaining_wall',
    category: 'Residential',
    name: 'Garden Retaining Wall (1.5m)',
    description: 'Low retaining wall for residential landscape/garden',
    icon: '🧱',
    tags: ['retaining wall', 'residential', 'garden'],
    href: '/calcs/retaining-wall.html',
    config: {
      H: 1.5, surcharge: 5, soilDensity: 1800, phi: 30,
      wallDensity: 24, baseWidth: 1.2, stemThick: 0.25,
      toeLength: 0.3, heelLength: 0.65, baseThick: 0.25, soilBearing: 100, mu: 0.5
    }
  },
  {
    id: 'tpl_retwall_highway',
    calcType: 'retaining_wall',
    category: 'Infrastructure',
    name: 'Highway Retaining Wall (3m)',
    description: 'Medium retaining wall with vehicle surcharge',
    icon: '🛣️',
    tags: ['retaining wall', 'highway', 'surcharge'],
    href: '/calcs/retaining-wall.html',
    config: {
      H: 3.0, surcharge: 20, soilDensity: 1900, phi: 28,
      wallDensity: 24, baseWidth: 2.5, stemThick: 0.35,
      toeLength: 0.6, heelLength: 1.55, baseThick: 0.4, soilBearing: 150, mu: 0.45
    }
  },
];
