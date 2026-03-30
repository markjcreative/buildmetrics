/**
 * BuildMetrics — Imposed Loads Database (EN 1991-1-1)
 * Table of recommended values for imposed loads on buildings.
 *
 * Fields:
 *   category      — EN 1991-1-1 category letter
 *   subCategory   — sub-category code
 *   description   — human-readable description
 *   qk_min        — minimum distributed load (kN/m²)
 *   qk_max        — maximum distributed load (kN/m²)
 *   Qk            — concentrated load (kN)
 *   notes         — additional notes
 */
window.ImposedLoads = [
  // Category A: Domestic, residential
  { category: 'A', subCategory: 'A1', description: 'Rooms in residential buildings',               qk_min: 1.5, qk_max: 2.0, Qk: 2.0,  notes: 'Bedrooms, living rooms' },
  { category: 'A', subCategory: 'A2', description: 'Bedrooms in hotels/hospitals',                 qk_min: 1.5, qk_max: 2.0, Qk: 2.0,  notes: 'Similar to domestic' },
  { category: 'A', subCategory: 'A3', description: 'Bedrooms in hospitals',                        qk_min: 2.0, qk_max: 3.0, Qk: 3.0,  notes: '' },
  { category: 'A', subCategory: 'A4', description: 'Communal areas in hotels (corridors, stairs)', qk_min: 2.0, qk_max: 4.0, Qk: 3.0,  notes: '' },

  // Category B: Office areas
  { category: 'B', subCategory: 'B1', description: 'General office use',                           qk_min: 2.0, qk_max: 3.0, Qk: 4.5,  notes: '' },
  { category: 'B', subCategory: 'B2', description: 'Office areas at or below ground level',        qk_min: 3.0, qk_max: 4.0, Qk: 4.5,  notes: '' },

  // Category C: Areas of congregation
  { category: 'C', subCategory: 'C1', description: 'Areas with tables (restaurants, cafes)',           qk_min: 2.0, qk_max: 3.0, Qk: 4.0,  notes: '' },
  { category: 'C', subCategory: 'C2', description: 'Areas with fixed seats (lecture halls)',            qk_min: 3.0, qk_max: 4.0, Qk: 4.0,  notes: '' },
  { category: 'C', subCategory: 'C3', description: 'Areas without obstacles (museums, foyers)',         qk_min: 3.0, qk_max: 5.0, Qk: 4.0,  notes: '' },
  { category: 'C', subCategory: 'C4', description: 'Areas with possible physical activities (gyms)',    qk_min: 4.5, qk_max: 5.0, Qk: 7.0,  notes: '' },
  { category: 'C', subCategory: 'C5', description: 'Areas susceptible to crowding (concert halls)',     qk_min: 5.0, qk_max: 7.5, Qk: 4.5,  notes: '' },

  // Category D: Shopping areas
  { category: 'D', subCategory: 'D1', description: 'General retail areas',                         qk_min: 4.0, qk_max: 5.0, Qk: 3.5,  notes: '' },
  { category: 'D', subCategory: 'D2', description: 'Supermarkets, department stores',              qk_min: 4.0, qk_max: 5.0, Qk: 4.5,  notes: '' },

  // Category E: Storage
  { category: 'E', subCategory: 'E1', description: 'Areas susceptible to accumulation of goods',   qk_min: 7.5, qk_max: 10.0, Qk: 7.0, notes: 'Incl. warehouses' },
  { category: 'E', subCategory: 'E2', description: 'Industrial use',                               qk_min: 7.5, qk_max: 10.0, Qk: 7.0, notes: '' },

  // Category F: Vehicle areas
  { category: 'F', subCategory: 'F',  description: 'Parking / car parks (\u226430 kN per axle)',   qk_min: 1.5, qk_max: 2.5,  Qk: 10.0, notes: 'Gross vehicle weight \u2264 30 kN' },
  { category: 'G', subCategory: 'G',  description: 'Traffic areas (30\u2013160 kN per axle)',      qk_min: 5.0, qk_max: 7.0,  Qk: 45.0, notes: 'Gross vehicle weight \u2264 160 kN' },

  // Roofs
  { category: 'H', subCategory: 'H',  description: 'Roofs not accessible (maintenance only)',      qk_min: 0.25, qk_max: 0.75, Qk: 0.9,  notes: '' },
  { category: 'I', subCategory: 'I',  description: 'Roofs accessible with occupancy as A\u2013D',  qk_min: 3.0,  qk_max: 5.0,  Qk: 4.0,  notes: 'Roof terraces, gardens' },
  { category: 'K', subCategory: 'K',  description: 'Roofs accessible for helicopters',             qk_min: 0,    qk_max: 0,    Qk: 20.0, notes: 'Helicopter operations' },

  // Horizontal loads (balustrades)
  { category: 'H_horiz', subCategory: 'Balustrade A/B', description: 'Balustrades, parapets \u2014 domestic',     qk_min: 0.36, qk_max: 0.74, Qk: 1.5, notes: 'Linear load kN/m' },
  { category: 'H_horiz', subCategory: 'Balustrade C/D', description: 'Balustrades \u2014 public areas',           qk_min: 0.74, qk_max: 3.0,  Qk: 3.0, notes: 'Linear load kN/m' },
];
