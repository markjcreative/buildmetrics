/**
 * utils.js — Math helpers and unit conversion utilities
 */

const UNITS = {
  SI: { force: 'kN', moment: 'kNm', length: 'm', distLoad: 'kN/m', stress: 'kN/m²', area: 'm²', inertia: 'm⁴', modulus: 'kN/m²' },
  IMPERIAL: { force: 'kips', moment: 'kip·ft', length: 'ft', distLoad: 'kips/ft', stress: 'ksi', area: 'in²', inertia: 'in⁴', modulus: 'ksi' }
};

// Unit conversion factors (from SI to Imperial)
const TO_IMPERIAL = {
  force: 0.224809,       // kN → kips
  length: 3.28084,       // m → ft
  moment: 0.737562,      // kNm → kip·ft
  distLoad: 0.0685218,   // kN/m → kips/ft
  deflection: 39.3701,   // m → inches
  area: 1550.003,        // m² → in²
  inertia: 2.4025e6,     // m⁴ → in⁴
  modulus: 0.000145038   // kN/m² → ksi
};

function convertValue(value, quantity, toImperial) {
  if (!toImperial) return value;
  const factor = TO_IMPERIAL[quantity] || 1;
  return value * factor;
}

function formatValue(value, decimals = 3) {
  if (Math.abs(value) < 1e-10) return '0.000';
  return value.toFixed(decimals);
}

function round(value, decimals = 6) {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

// Simpson's rule numerical integration
function simpsonsIntegrate(values, dx) {
  const n = values.length - 1;
  if (n < 2) return 0;
  let sum = values[0] + values[n];
  for (let i = 1; i < n; i++) {
    sum += (i % 2 === 0 ? 2 : 4) * values[i];
  }
  return (dx / 3) * sum;
}

// Cumulative trapezoidal integration (returns array)
function cumulativeTrapz(y, dx) {
  const result = [0];
  for (let i = 1; i < y.length; i++) {
    result.push(result[i - 1] + 0.5 * (y[i - 1] + y[i]) * dx);
  }
  return result;
}

function linspace(start, end, n) {
  const arr = [];
  const step = (end - start) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(start + i * step);
  return arr;
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function arrayMax(arr) {
  return arr.reduce((a, b) => Math.max(a, b), -Infinity);
}
function arrayMin(arr) {
  return arr.reduce((a, b) => Math.min(a, b), Infinity);
}
function arrayAbsMax(arr) {
  return arr.reduce((a, b) => Math.max(Math.abs(a), Math.abs(b)), 0);
}

window.BeamUtils = {
  UNITS, TO_IMPERIAL,
  convertValue, formatValue, round,
  simpsonsIntegrate, cumulativeTrapz,
  linspace, clamp,
  arrayMax, arrayMin, arrayAbsMax
};
