/**
 * pdfReportEnhanced.js — Enhanced PDF export module for BuildMetrics
 * Uses jsPDF loaded lazily from CDN.
 * Produces a professional A4 PDF with full workings, colour-coded results,
 * section dividers, and a sign-off register.
 * Exposes: window.PdfReportEnhanced
 */

const PdfReportEnhanced = (() => {
    const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

    // Colours [R, G, B]
    const BLUE  = [37,  99, 235];   // --accent
    const GREEN = [22, 163,  74];
    const RED   = [220,  38,  38];
    const DARK  = [15,  23,  42];
    const GREY  = [100, 116, 139];
    const LIGHT = [248, 250, 252];

    function _loadJsPDF() {
        return new Promise((resolve, reject) => {
            if (window.jspdf) { resolve(window.jspdf.jsPDF); return; }
            const s = document.createElement('script');
            s.src = JSPDF_CDN;
            s.onload = () => resolve(window.jspdf.jsPDF);
            s.onerror = reject;
            document.head.appendChild(s);
        });
    }

    /**
     * exportBeam(calcData, filename)
     * calcData shape:
     * {
     *   projectName, calcName, calcRef, preparedBy, checkedBy,
     *   date, revision, standard, company?,
     *   inputs:   [{ label, value, unit, formula? }],
     *   workings: [{ label, formula, value, unit }],  // step-by-step workings
     *   results:  [{ label, value, unit, pass }],
     *   summary:  string,
     * }
     */
    async function exportBeam(calcData, filename = 'calculation.pdf') {
        if (window.Plans && !Plans.canExportEnhancedPdf()) {
            if (window.UpgradeModal) UpgradeModal.show('Enhanced PDF with full workings is a Pro feature.');
            return;
        }

        const jsPDF = await _loadJsPDF();
        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

        const PW = 210, PH = 297;
        const ML = 18, MR = 18, MT = 20;
        const CW = PW - ML - MR;  // content width = 174 mm
        let y = MT;

        // ── Helper: add a new page and reset y, then draw running header ──────
        const checkPage = (needed = 10) => {
            if (y + needed > PH - 20) {
                doc.addPage();
                y = MT;
                _drawPageHeader(doc, calcData, ML, y, CW, PW, MR);
                y += 14;
            }
        };

        // ── Cover / header block ──────────────────────────────────────────────
        // Blue banner
        doc.setFillColor(...BLUE);
        doc.rect(0, 0, PW, 36, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('BuildMetrics', ML, 14);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Structural Engineering Calculation', ML, 21);
        doc.setFontSize(8);
        doc.text('buildmetrics-one.vercel.app', ML, 27);

        // Calc ref / revision — top right
        doc.setFontSize(9);
        doc.text((calcData.calcRef || 'REF: \u2014') + '   Rev: ' + (calcData.revision || 'A'), PW - MR, 14, { align: 'right' });
        doc.text('Date: ' + (calcData.date || new Date().toLocaleDateString()), PW - MR, 21, { align: 'right' });

        y = 44;

        // Project info row
        doc.setTextColor(...DARK);
        doc.setFillColor(...LIGHT);
        doc.rect(ML, y, CW, 22, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Project:', ML + 4, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(calcData.projectName || '\u2014', ML + 22, y + 7);
        doc.setFont('helvetica', 'bold');
        doc.text('Calculation:', ML + 4, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(calcData.calcName || '\u2014', ML + 27, y + 14);
        doc.setFont('helvetica', 'bold');
        doc.text('Standard:', ML + 95, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(calcData.standard || '\u2014', ML + 113, y + 7);
        doc.setFont('helvetica', 'bold');
        doc.text('Prepared by:', ML + 95, y + 14);
        doc.setFont('helvetica', 'normal');
        doc.text(calcData.preparedBy || '\u2014', ML + 118, y + 14);

        y += 28;

        // ── Section: Inputs ───────────────────────────────────────────────────
        _sectionTitle(doc, 'INPUT PARAMETERS', ML, y, CW);
        y += 8;

        const inputRows = (calcData.inputs || []).map(r => [r.label, String(r.value), r.unit || '', r.formula || '']);
        _table(doc, ['Parameter', 'Value', 'Unit', 'Formula / Notes'], inputRows, ML, y, CW, [80, 28, 24, 42]);
        y += 8 + (inputRows.length + 1) * 7;

        // ── Section: Workings ─────────────────────────────────────────────────
        if (calcData.workings && calcData.workings.length) {
            checkPage(20);
            _sectionTitle(doc, 'DESIGN CALCULATIONS', ML, y, CW);
            y += 8;

            calcData.workings.forEach(w => {
                checkPage(8);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...DARK);
                doc.text(w.label || '', ML + 2, y);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...GREY);
                doc.text(w.formula || '', ML + 60, y);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...BLUE);
                doc.text((String(w.value || '')) + (w.unit ? ' ' + w.unit : ''), PW - MR, y, { align: 'right' });
                doc.setDrawColor(230, 230, 240);
                doc.setLineWidth(0.2);
                doc.line(ML, y + 2, PW - MR, y + 2);
                y += 7;
            });
            y += 4;
        }

        // ── Section: Results ──────────────────────────────────────────────────
        checkPage(20);
        _sectionTitle(doc, 'DESIGN RESULTS', ML, y, CW);
        y += 8;

        (calcData.results || []).forEach(r => {
            checkPage(8);
            const passColor = r.pass === true ? GREEN : r.pass === false ? RED : GREY;
            const passText  = r.pass === true ? 'PASS' : r.pass === false ? 'FAIL' : '\u2014';

            // Tinted row background for pass / fail
            if (r.pass === true)  { doc.setFillColor(240, 253, 244); doc.rect(ML, y - 5, CW, 7, 'F'); }
            if (r.pass === false) { doc.setFillColor(254, 242, 242); doc.rect(ML, y - 5, CW, 7, 'F'); }

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...DARK);
            doc.text(r.label || '', ML + 2, y);
            doc.text((String(r.value || '')) + (r.unit ? ' ' + r.unit : ''), ML + 100, y);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...passColor);
            doc.text(passText, PW - MR, y, { align: 'right' });
            doc.setDrawColor(230, 230, 240);
            doc.setLineWidth(0.2);
            doc.line(ML, y + 2, PW - MR, y + 2);
            doc.setTextColor(...DARK);
            y += 7;
        });
        y += 6;

        // ── Section: Summary ──────────────────────────────────────────────────
        checkPage(20);
        _sectionTitle(doc, 'SUMMARY', ML, y, CW);
        y += 8;
        const summaryLines = doc.splitTextToSize(calcData.summary || '\u2014', CW - 4);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        summaryLines.forEach(line => {
            checkPage(7);
            doc.text(line, ML + 2, y);
            y += 6;
        });
        y += 6;

        // ── Signature block ───────────────────────────────────────────────────
        checkPage(50);
        _signatureBlock(doc, calcData, ML, y, CW);

        // ── Page numbers ──────────────────────────────────────────────────────
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(...GREY);
            doc.text(`Page ${i} of ${totalPages}`, PW / 2, PH - 8, { align: 'center' });
            doc.text('BuildMetrics \u2014 Confidential', ML, PH - 8);
            doc.text(calcData.calcRef || '', PW - MR, PH - 8, { align: 'right' });
        }

        doc.save(filename);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /**
     * Draw a compact running header used on continuation pages.
     */
    function _drawPageHeader(doc, calcData, x, y, width, pageWidth, marginRight) {
        doc.setFillColor(...BLUE);
        doc.rect(0, y - 4, pageWidth, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('BuildMetrics', x, y + 3);
        doc.setFont('helvetica', 'normal');
        doc.text((calcData.calcName || '') + ' \u2014 ' + (calcData.calcRef || ''), pageWidth / 2, y + 3, { align: 'center' });
        doc.text('Rev: ' + (calcData.revision || 'A'), pageWidth - marginRight, y + 3, { align: 'right' });
    }

    /**
     * Draw a blue section title bar.
     */
    function _sectionTitle(doc, text, x, y, width) {
        doc.setFillColor(...BLUE);
        doc.rect(x, y - 5, width, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(text, x + 3, y);
    }

    /**
     * Draw a simple striped table.
     * headers: string[]
     * rows: string[][]
     * colWidths: number[] (mm) — must sum to totalWidth
     */
    function _table(doc, headers, rows, x, y, totalWidth, colWidths) {
        const rowH = 7;

        // Header row
        let cx = x;
        doc.setFillColor(226, 232, 240);
        doc.rect(x, y, totalWidth, rowH, 'F');
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        headers.forEach((h, i) => {
            doc.text(h, cx + 2, y + 5);
            cx += colWidths[i];
        });
        y += rowH;

        rows.forEach((row, ri) => {
            if (ri % 2 === 0) {
                doc.setFillColor(...LIGHT);
                doc.rect(x, y, totalWidth, rowH, 'F');
            }
            cx = x;
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...DARK);
            row.forEach((cell, i) => {
                const txt = doc.splitTextToSize(String(cell || ''), colWidths[i] - 4);
                doc.text(txt[0] || '', cx + 2, y + 5);
                cx += colWidths[i];
            });
            y += rowH;
        });
    }

    /**
     * Draw the sign-off register at the bottom of the document.
     */
    function _signatureBlock(doc, calcData, x, y, width) {
        doc.setDrawColor(200, 210, 230);
        doc.setLineWidth(0.4);
        doc.rect(x, y, width, 44);

        // Block header
        doc.setFillColor(226, 232, 240);
        doc.rect(x, y, width, 7, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        doc.text('SIGN-OFF REGISTER', x + 3, y + 5);
        y += 10;

        const colW = width / 4;
        ['Role', 'Name', 'Signature', 'Date'].forEach((h, i) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...DARK);
            doc.text(h, x + i * colW + 2, y);
        });
        y += 5;

        [
            ['Prepared by', calcData.preparedBy || ''],
            ['Checked by',  calcData.checkedBy  || ''],
            ['Approved by', ''],
        ].forEach(([role, name]) => {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            doc.text(role, x + 2, y + 5);
            doc.text(name, x + colW + 2, y + 5);
            // Signature and date underlines
            doc.setDrawColor(200, 210, 230);
            doc.setLineWidth(0.3);
            doc.line(x + 2 * colW, y + 8, x + 3 * colW - 2, y + 8);
            doc.line(x + 3 * colW, y + 8, x + 4 * colW - 2, y + 8);
            y += 10;
        });
    }

    return { exportBeam };
})();

window.PdfReportEnhanced = PdfReportEnhanced;
