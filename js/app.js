/**
 * app.js — Application bootstrap and event binding
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize input panel
    InputPanel.initInputPanel();

    // Export buttons
    document.getElementById('btn-export-pdf').addEventListener('click', async () => {
        const projectInfo = await PDFReport.showProjectInfoModal();
        if (!projectInfo) return;
        const btn = document.getElementById('btn-export-pdf');
        btn.textContent = '⏳ Generating PDF...';
        btn.disabled = true;
        try {
            await PDFReport.exportPDF(window._lastResults, window._lastConfig, projectInfo);
        } catch (e) {
            alert('PDF generation failed: ' + e.message);
        }
        btn.textContent = '📄 Download PDF';
        btn.disabled = false;
    });

    document.getElementById('btn-export-csv').addEventListener('click', () => {
        if (window._lastResults && window._lastConfig) {
            CSVExport.exportCSV(window._lastResults, window._lastConfig);
        }
    });

    // Welcome state animation
    setTimeout(() => {
        document.getElementById('welcome-banner').style.opacity = '1';
        document.getElementById('welcome-banner').style.transform = 'translateY(0)';
    }, 200);
});
