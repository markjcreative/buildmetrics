/**
 * results.js — Summary results table renderer
 */

function renderResults(results, config) {
    const { summary, reactions } = results;
    const span = config.span;
    const maxDeflMM = (summary.maxDeflection * 1000).toFixed(3);
    const spanRatio = Math.abs(summary.maxDeflection) > 1e-9
        ? Math.round(span / Math.abs(summary.maxDeflection))
        : '∞';

    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';

    const rows = [
        ['Max Positive Moment', `${BeamUtils.formatValue(summary.maxPositiveMoment, 3)} kNm`, `x = ${BeamUtils.formatValue(summary.maxPositiveMomentPos, 2)} m`, 'bm-pos'],
        ['Max Negative Moment', `${BeamUtils.formatValue(summary.maxNegativeMoment, 3)} kNm`, `x = ${BeamUtils.formatValue(summary.maxNegativeMomentPos, 2)} m`, 'bm-neg'],
        ['Max Absolute Moment', `${BeamUtils.formatValue(summary.maxAbsMoment, 3)} kNm`, '—', 'highlight'],
        ['Max Shear Force (+)', `${BeamUtils.formatValue(summary.maxShear, 3)} kN`, `x = ${BeamUtils.formatValue(summary.maxShearPos, 2)} m`, 'shear-pos'],
        ['Max Shear Force (−)', `${BeamUtils.formatValue(summary.minShear, 3)} kN`, '—', 'shear-neg'],
        ['Max Shear Absolute', `${BeamUtils.formatValue(summary.maxAbsShear, 3)} kN`, '—', 'highlight'],
        ['Max Deflection (sag)', `${maxDeflMM} mm`, `x = ${BeamUtils.formatValue(summary.maxDeflectionPos, 2)} m`, 'deflection'],
        ['Span/Deflection Ratio', `L / ${spanRatio}`, 'L/300 = serviceability limit (guide)', 'spanratio'],
    ];

    // Add reactions
    reactions.forEach((r, i) => {
        rows.push([
            `Reaction — ${capitalise(r.type)} at ${BeamUtils.formatValue(r.position, 2)}m`,
            `Fy = ${BeamUtils.formatValue(r.Fy, 3)} kN`,
            Math.abs(r.M) > 1e-6 ? `M = ${BeamUtils.formatValue(r.M, 3)} kNm` : '—',
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
    document.getElementById('badge-moment').textContent = `${BeamUtils.formatValue(summary.maxAbsMoment, 2)} kNm`;
    document.getElementById('badge-shear').textContent = `${BeamUtils.formatValue(summary.maxAbsShear, 2)} kN`;
    document.getElementById('badge-deflection').textContent = `${maxDeflMM} mm`;
    document.getElementById('badge-ratio').textContent = `L/${spanRatio}`;
}

function capitalise(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

window.BeamResults = { renderResults };
