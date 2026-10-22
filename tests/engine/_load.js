// Loads the browser solver files into an isolated VM context so they can be
// tested in Node exactly as the browser runs them (each assigns window.X).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..', '..');
const BASE = ['js/engine/utils.js', 'js/engine/solver.js'];

function load(file) {
  const ctx = { console, Math };
  ctx.window = ctx;
  vm.createContext(ctx);
  for (const f of [...BASE, file]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
  }
  return ctx;
}

// Relative-tolerance comparison with a readable failure message.
function near(assert, actual, expected, tol = 0.005, label = '') {
  const ok = Number.isFinite(actual) &&
    Math.abs(actual - expected) <= Math.abs(expected) * tol + 1e-9;
  assert.ok(ok, `${label}: expected ≈ ${expected} (±${(tol * 100).toFixed(1)}%), got ${actual}`);
}

module.exports = { load, near };
