/**
 * BuildMetrics — Load Combinations
 * IIFE module exposing window.LoadCombinations
 * Supports Eurocode (EN 1990) and ACI 318
 */
const LoadCombinations = (() => {

    /**
     * Calculate load combinations.
     * @param {{ Gk?: number, Qk?: number, Wk?: number, Sk?: number }} loads
     * @param {'EC'|'ACI'} [standard='EC']
     * @returns {{ standard: string, uls: {label:string, value:number, governing:boolean}[], sls: {label:string, value:number, governing:boolean}[]|null }}
     */
    function calculate(loads, standard = 'EC') {
        const Gk = loads.Gk || 0;
        const Qk = loads.Qk || 0;
        const Wk = loads.Wk || 0;
        const Sk = loads.Sk || 0;

        let uls, sls;

        if (standard === 'ACI') {
            uls = _aciUls(Gk, Qk, Wk, Sk);
            sls = null; // ACI doesn't define SLS combinations the same way
        } else {
            uls = _ecUls(Gk, Qk, Wk, Sk);
            sls = _ecSls(Gk, Qk);
        }

        // Mark governing (max value)
        _markGoverning(uls);
        if (sls) _markGoverning(sls);

        return { standard, uls, sls };
    }

    function _markGoverning(combos) {
        let maxVal = -Infinity;
        combos.forEach(c => { if (c.value > maxVal) maxVal = c.value; });
        combos.forEach(c => { c.governing = c.value === maxVal; });
    }

    function _ecUls(Gk, Qk, Wk, Sk) {
        return [
            { label: '1.35G',                               value: 1.35*Gk },
            { label: '1.35G + 1.5Q',                        value: 1.35*Gk + 1.5*Qk },
            { label: '1.35G + 1.5W',                        value: 1.35*Gk + 1.5*Wk },
            { label: '1.35G + 1.5Q + 0.9W',                 value: 1.35*Gk + 1.5*Qk + 0.9*Wk },
            { label: '1.35G + 1.5W + 1.05Q',                value: 1.35*Gk + 1.5*Wk + 1.05*Qk },
            { label: '1.0G + 1.5W',                         value: 1.0*Gk + 1.5*Wk },
            { label: '1.35G + 1.5S',                        value: 1.35*Gk + 1.5*Sk },
            { label: '1.35G + 1.05Q + 1.5S',                value: 1.35*Gk + 1.05*Qk + 1.5*Sk }
        ].map(c => ({ ...c, value: +c.value.toFixed(4), governing: false }));
    }

    function _ecSls(Gk, Qk) {
        return [
            { label: 'G + Q (characteristic)',     value: +(Gk + Qk).toFixed(4) },
            { label: 'G + 0.7Q (frequent)',         value: +(Gk + 0.7*Qk).toFixed(4) },
            { label: 'G + 0.3Q (quasi-permanent)',  value: +(Gk + 0.3*Qk).toFixed(4) }
        ].map(c => ({ ...c, governing: false }));
    }

    function _aciUls(D, L, W, S) {
        return [
            { label: '1.4D',                               value: 1.4*D },
            { label: '1.2D + 1.6L',                        value: 1.2*D + 1.6*L },
            { label: '1.2D + 1.6S + max(L, 0.5W)',         value: 1.2*D + 1.6*S + Math.max(L, 0.5*W) },
            { label: '1.2D + 1.0W + L + 0.5S',             value: 1.2*D + 1.0*W + L + 0.5*S },
            { label: '0.9D + 1.0W',                        value: 0.9*D + 1.0*W }
        ].map(c => ({ ...c, value: +c.value.toFixed(4), governing: false }));
    }

    return { calculate };
})();

window.LoadCombinations = LoadCombinations;
