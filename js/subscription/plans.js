/**
 * plans.js — All features open, no subscription gates.
 * Subscription system disabled. All users have full access.
 */

// Stub Subscription so any existing references don't throw
const Subscription = (() => {
    function get() { return { plan: 'open' }; }
    function isPro() { return true; }
    function canSaveCalc() { return true; }
    function usage() { return { projects: 0, calculations: 0 }; }
    function getBillingHistory() { return []; }
    return { get, isPro, canSaveCalc, usage, getBillingHistory };
})();
window.Subscription = Subscription;

// Plans — all export capabilities open for everyone
const Plans = (() => {
    function canExportExcel()       { return true; }
    function canExportWord()        { return true; }
    function canExportEnhancedPdf() { return true; }
    function isPro()                { return true; }
    return { canExportExcel, canExportWord, canExportEnhancedPdf, isPro };
})();
window.Plans = Plans;
