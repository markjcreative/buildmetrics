/**
 * xlsxExport.js — Excel export module for BuildMetrics
 * Uses SheetJS (xlsx) loaded lazily from CDN.
 * Exposes: window.XlsxExport
 */

const XlsxExport = (() => {
    const CDN = 'https://cdn.jsdelivr.net/npm/xlsx/dist/xlsx.full.min.js';

    function _loadSheetJS() {
        return new Promise((resolve, reject) => {
            if (window.XLSX) { resolve(window.XLSX); return; }
            const s = document.createElement('script');
            s.src = CDN;
            s.onload = () => resolve(window.XLSX);
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    /**
     * exportBeam(calcData, filename)
     * calcData shape:
     * {
     *   projectName, calcName, date, standard,
     *   inputs:  [{ label, value, unit }],
     *   results: [{ label, value, unit, pass }],
     *   summary: string,
     *   rawData?: object[]   // optional — written to a second 'Data' sheet
     * }
     */
    async function exportBeam(calcData, filename = 'beam-calculation.xlsx') {
        // Gate: check Plans.canExportExcel() — if false, show upgrade modal
        if (window.Plans && !Plans.canExportExcel()) {
            if (window.UpgradeModal) UpgradeModal.show('Excel Export is a Pro feature. Upgrade to export calculations as Excel spreadsheets.');
            return;
        }

        const XLSX = await _loadSheetJS();

        const wb = XLSX.utils.book_new();

        // Sheet 1: Summary
        const summaryData = [
            ['BuildMetrics \u2014 Structural Calculation'],
            [],
            ['Project:', calcData.projectName || '\u2014'],
            ['Calculation:', calcData.calcName || '\u2014'],
            ['Date:', calcData.date || new Date().toLocaleDateString()],
            ['Standard:', calcData.standard || '\u2014'],
            [],
            ['INPUTS'],
            ['Parameter', 'Value', 'Unit'],
            ...(calcData.inputs || []).map(r => [r.label, r.value, r.unit || '']),
            [],
            ['RESULTS'],
            ['Check', 'Value', 'Unit', 'Status'],
            ...(calcData.results || []).map(r => [r.label, r.value, r.unit || '', r.pass === true ? 'PASS' : r.pass === false ? 'FAIL' : '']),
            [],
            ['SUMMARY'],
            [calcData.summary || ''],
        ];

        const ws1 = XLSX.utils.aoa_to_sheet(summaryData);

        // Column widths
        ws1['!cols'] = [{ wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 10 }];

        XLSX.utils.book_append_sheet(wb, ws1, 'Calculation');

        // Sheet 2: Raw data (for further processing)
        if (calcData.rawData) {
            const ws2 = XLSX.utils.json_to_sheet(calcData.rawData);
            XLSX.utils.book_append_sheet(wb, ws2, 'Data');
        }

        XLSX.writeFile(wb, filename);
    }

    /**
     * exportHistory(calcs, filename)
     * Export multiple calculations from history to a single sheet.
     * calcs: array of history records from bcp_history localStorage key.
     */
    async function exportHistory(calcs, filename = 'buildmetrics-history.xlsx') {
        if (window.Plans && !Plans.canExportExcel()) {
            if (window.UpgradeModal) UpgradeModal.show('Excel Export is a Pro feature.');
            return;
        }

        const XLSX = await _loadSheetJS();
        const wb = XLSX.utils.book_new();

        const rows = [['Date', 'Project', 'Calculation Name', 'Type', 'Summary']];
        calcs.forEach(c => {
            rows.push([
                new Date(c.timestamp).toLocaleDateString(),
                c.projectId || '\u2014',
                c.name || '\u2014',
                (c.config && c.config.calcType) || 'beam',
                c.summary || '',
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{ wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, ws, 'History');
        XLSX.writeFile(wb, filename);
    }

    return { exportBeam, exportHistory };
})();

window.XlsxExport = XlsxExport;
