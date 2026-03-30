/**
 * csvExport.js — CSV export of full SFD, BMD, and deflection data
 */

function exportCSV(results, config) {
    const { xs, V, M, deflection, reactions, summary } = results;
    const { span, material, E, I, A, supports, loads } = config;

    let csv = '';

    // Header
    csv += `"KINECALC — RESULTS REPORT"\n`;
    csv += `"Generated: ${new Date().toLocaleString()}"\n\n`;

    // Beam properties
    csv += '"BEAM PROPERTIES"\n';
    csv += `"Span","${span}","m"\n`;
    csv += `"Material","${material}",""\n`;
    csv += `"Young's Modulus (E)","${E}","kN/m²"\n`;
    csv += `"Moment of Inertia (I)","${I}","m⁴"\n`;
    csv += `"Cross-sectional Area (A)","${A}","m²"\n\n`;

    // Supports
    csv += '"SUPPORTS"\n';
    csv += '"Type","Position (m)"\n';
    supports.forEach(s => { csv += `"${s.type}","${s.position}"\n`; });
    csv += '\n';

    // Loads
    csv += '"APPLIED LOADS"\n';
    csv += '"Type","Category","Position/Start (m)","End (m)","Magnitude","Magnitude End"\n';
    loads.forEach(l => {
        csv += `"${l.type}","${l.category || ''}","${l.position ?? l.start ?? ''}","${l.end ?? ''}","${l.magnitude ?? l.magnitudeStart ?? ''}","${l.magnitudeEnd ?? ''}"\n`;
    });
    csv += '\n';

    // Reactions
    csv += '"REACTIONS"\n';
    csv += '"Support Type","Position (m)","Vertical Reaction Fy (kN)","Moment M (kNm)"\n';
    reactions.forEach(r => {
        csv += `"${r.type}","${r.position}","${BeamUtils.formatValue(r.Fy, 4)}","${BeamUtils.formatValue(r.M, 4)}"\n`;
    });
    csv += '\n';

    // Summary
    csv += '"SUMMARY RESULTS"\n';
    csv += `"Max Positive Moment","${BeamUtils.formatValue(summary.maxPositiveMoment, 4)}","kNm","at x=","${BeamUtils.formatValue(summary.maxPositiveMomentPos, 3)}","m"\n`;
    csv += `"Max Negative Moment","${BeamUtils.formatValue(summary.maxNegativeMoment, 4)}","kNm","at x=","${BeamUtils.formatValue(summary.maxNegativeMomentPos, 3)}","m"\n`;
    csv += `"Max Shear Force (+)","${BeamUtils.formatValue(summary.maxShear, 4)}","kN"\n`;
    csv += `"Max Shear Force (-)","${BeamUtils.formatValue(summary.minShear, 4)}","kN"\n`;
    csv += `"Max Deflection","${(summary.maxDeflection * 1000).toFixed(4)}","mm","at x=","${BeamUtils.formatValue(summary.maxDeflectionPos, 3)}","m"\n\n`;

    // Full distribution table
    csv += '"DISTRIBUTION DATA"\n';
    csv += '"x (m)","Shear V (kN)","Moment M (kNm)","Deflection δ (m)"\n';
    xs.forEach((x, i) => {
        csv += `"${BeamUtils.formatValue(x, 4)}","${BeamUtils.formatValue(V[i], 4)}","${BeamUtils.formatValue(M[i], 4)}","${BeamUtils.formatValue(deflection[i], 6)}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, `beam_results_${Date.now()}.csv`);
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

window.CSVExport = { exportCSV };
