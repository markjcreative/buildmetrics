/**
 * results.js — Summary results table renderer
 */

function renderResults(results, config) {
    const { summary, reactions } = results;
    // config is always in SI — results arrays are in SI
    const imp = window.InputPanel && InputPanel.isImperial();
    const U = BeamUtils.TO_IMPERIAL;
    const sys = imp ? BeamUtils.UNITS.IMPERIAL : BeamUtils.UNITS.SI;

    const cv = (v, quantity) => imp ? BeamUtils.convertValue(v, quantity, true) : v;
    const fv = (v, d = 3) => BeamUtils.formatValue(v, d);

    const span = config.span;
    const maxDefl = summary.maxDeflection;
    // Deflection: SI → mm, Imperial → inches
    const deflDisplay = imp
        ? `${fv(cv(maxDefl, 'deflection'), 3)} in`
        : `${fv(maxDefl * 1000, 3)} mm`;
    const spanRatio = Math.abs(maxDefl) > 1e-9
        ? Math.round(span / Math.abs(maxDefl))
        : '∞';
    const lenUnit = sys.length;
    const forceUnit = sys.force;
    const momentUnit = sys.moment;

    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';

    const rows = [
        ['Max Positive Moment', `${fv(cv(summary.maxPositiveMoment, 'moment'))} ${momentUnit}`, `x = ${fv(cv(summary.maxPositiveMomentPos, 'length'), 2)} ${lenUnit}`, 'bm-pos'],
        ['Max Negative Moment', `${fv(cv(summary.maxNegativeMoment, 'moment'))} ${momentUnit}`, `x = ${fv(cv(summary.maxNegativeMomentPos, 'length'), 2)} ${lenUnit}`, 'bm-neg'],
        ['Max Absolute Moment', `${fv(cv(summary.maxAbsMoment, 'moment'))} ${momentUnit}`, '—', 'highlight'],
        ['Max Shear Force (+)', `${fv(cv(summary.maxShear, 'force'))} ${forceUnit}`, `x = ${fv(cv(summary.maxShearPos, 'length'), 2)} ${lenUnit}`, 'shear-pos'],
        ['Max Shear Force (−)', `${fv(cv(summary.minShear, 'force'))} ${forceUnit}`, '—', 'shear-neg'],
        ['Max Shear Absolute', `${fv(cv(summary.maxAbsShear, 'force'))} ${forceUnit}`, '—', 'highlight'],
        ['Max Deflection (sag)', deflDisplay, `x = ${fv(cv(summary.maxDeflectionPos, 'length'), 2)} ${lenUnit}`, 'deflection'],
        ['Span/Deflection Ratio', `L / ${spanRatio}`, 'L/300 = serviceability limit (guide)', 'spanratio'],
    ];

    // Add reactions
    reactions.forEach(r => {
        rows.push([
            `Reaction — ${capitalise(r.type)} at ${fv(cv(r.position, 'length'), 2)} ${lenUnit}`,
            `Fy = ${fv(cv(r.Fy, 'force'))} ${forceUnit}`,
            Math.abs(r.M) > 1e-6 ? `M = ${fv(cv(r.M, 'moment'))} ${momentUnit}` : '—',
            'reaction'
        ]);
    });

    rows.forEach(([label, value, location, cls]) => {
        const tr = document.createElement('tr');
        tr.className = `result-row ${cls}`;
        tr.innerHTML = `<td class="res-label">${label}</td><td class="res-value">${value}</td><td class="res-location">${location}</td>`;
        tbody.appendChild(tr);
    });

    // Update summary badges
    document.getElementById('badge-moment').textContent = `${fv(cv(summary.maxAbsMoment, 'moment'), 2)} ${momentUnit}`;
    document.getElementById('badge-shear').textContent = `${fv(cv(summary.maxAbsShear, 'force'), 2)} ${forceUnit}`;
    document.getElementById('badge-deflection').textContent = deflDisplay;
    document.getElementById('badge-ratio').textContent = `L/${spanRatio}`;
}

function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

window.BeamResults = { renderResults };
