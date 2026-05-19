/**
 * multiSpanSolver.js — Continuous beam analysis using the Three-Moment Theorem
 * Supports: 2-span, 3-span, overhanging configurations with UDL and point loads
 * Returns: reactions[], M[], V[], deflection[] arrays for the full beam
 */

window.MultiSpanSolver = {

    /**
     * @param {Object} config
     * @param {number[]} config.spans        — array of span lengths [L1, L2, ...] in metres
     * @param {number[]} config.udl          — UDL per span [w1, w2, ...] kN/m (ULS)
     * @param {Object[]} config.pointLoads   — [{span:0, pos:2.0, P:20}, ...] pos from left of that span
     * @param {string[]} config.endConditions— ['pinned','pinned'] or ['fixed','pinned'] etc.
     * @param {number}   config.EI           — kNm² (for deflection)
     */
    solve(config) {
        const { spans, udl, pointLoads = [], endConditions = ['pinned', 'pinned'], EI } = config;
        const n = spans.length; // number of spans
        const nsup = n + 1;     // number of supports

        // ── Build three-moment system ────────────────────────────────────────
        // Interior support moments: M[1] … M[n-1] (M[0]=M[n]=0 for pinned ends)
        // Three-moment equation for interior support i:
        //   M[i-1]*L[i-1] + 2*M[i]*(L[i-1]+L[i]) + M[i+1]*L[i] = RHS[i]
        // RHS contribution from UDL w on span i: -w*L³/4 (both sides)
        // RHS contribution from point load P at 'a' from left of span (b=L-a):
        //   Left side:  -P*a*(L²-a²)/L
        //   Right side: -P*b*(L²-b²)/L

        // Build RHS vector for interior supports 1..n-1
        const nInt = n - 1; // number of interior supports
        if (nInt === 0) throw new Error('Use single-span solver for 1-span beams.');

        const A = Array.from({ length: nInt }, () => new Array(nInt).fill(0));
        const RHS = new Array(nInt).fill(0);

        for (let i = 0; i < nInt; i++) {
            const iSup = i + 1; // support index (1-based)
            const Li_prev = spans[iSup - 1]; // span to the left
            const Li_next = spans[iSup];     // span to the right
            const w_prev = udl[iSup - 1] || 0;
            const w_next = udl[iSup] || 0;

            A[i][i] = 2 * (Li_prev + Li_next);
            if (i > 0)     A[i][i - 1] = Li_prev;
            if (i < nInt - 1) A[i][i + 1] = Li_next;

            RHS[i] = -(w_prev * Li_prev ** 3 / 4 + w_next * Li_next ** 3 / 4);

            // Point load contributions
            for (const pl of pointLoads) {
                const spanIdx = pl.span; // 0-based span index
                const P = pl.P;
                const L = spans[spanIdx];
                const a = Math.min(pl.pos, L);
                const b = L - a;
                if (spanIdx === iSup - 1) { // point load in left span
                    RHS[i] -= P * a * (L ** 2 - a ** 2) / L;
                }
                if (spanIdx === iSup) { // point load in right span
                    RHS[i] -= P * b * (L ** 2 - b ** 2) / L;
                }
            }
        }

        // Handle fixed end conditions (modify boundary equations)
        // Fixed left end: M[0] = -w0*L0²/12 etc. (placeholder — use pinned for now)
        // For simplicity, pinned ends give M[0]=M[n]=0

        // Solve tridiagonal system with Thomas algorithm
        const M_int = this._thomasSolve(A, RHS);

        // Full moment array at supports
        const M_sup = [0, ...M_int, 0]; // M[0]=0, interior, M[n]=0

        // ── Compute reactions ───────────────────────────────────────────────
        // For each span i: R_left and R_right from simple equilibrium
        const spanReactions = spans.map((L, i) => {
            const w = udl[i] || 0;
            const M_L = M_sup[i];
            const M_R = M_sup[i + 1];
            // ΣM about right: R_L*L - w*L²/2 + M_R - M_L = 0
            let R_L = w * L / 2 + (M_L - M_R) / L;
            let R_R = w * L / 2 - (M_L - M_R) / L;

            // Add point load contributions
            for (const pl of pointLoads) {
                if (pl.span !== i) continue;
                const a = Math.min(pl.pos, L);
                const b = L - a;
                R_L += pl.P * b / L;
                R_R += pl.P * a / L;
            }
            return { R_L, R_R };
        });

        // Aggregate to support reactions
        const reactions = Array(nsup).fill(0);
        for (let i = 0; i < n; i++) {
            reactions[i]     += spanReactions[i].R_L;
            reactions[i + 1] += spanReactions[i].R_R;
        }

        // ── Build full SFD, BMD arrays ───────────────────────────────────────
        const N_PER_SPAN = 200;
        const xs_all = [], V_all = [], M_all = [];
        let xOffset = 0;

        for (let i = 0; i < n; i++) {
            const L = spans[i];
            const w = udl[i] || 0;
            const M_L = M_sup[i];
            const { R_L } = spanReactions[i];
            const dx = L / N_PER_SPAN;

            for (let j = 0; j <= N_PER_SPAN; j++) {
                const x = j * dx;
                let V = R_L - w * x;
                let M = M_L + R_L * x - w * x ** 2 / 2;

                // Add point load effects within this span
                for (const pl of pointLoads) {
                    if (pl.span !== i) continue;
                    if (x > pl.pos) {
                        V -= pl.P;
                        M -= pl.P * (x - pl.pos);
                    }
                }

                xs_all.push(+(xOffset + x).toFixed(4));
                V_all.push(+V.toFixed(4));
                M_all.push(+M.toFixed(4));
            }
            xOffset += L;
        }

        // ── Deflection by double numerical integration ────────────────────────
        const deflection = this._computeDeflection(xs_all, M_all, EI || 1e6, spans);

        const totalSpan = spans.reduce((a, b) => a + b, 0);

        return {
            xs: xs_all,
            V: V_all,
            M: M_all,
            deflection,
            reactions,
            M_supports: M_sup,
            span: totalSpan,
            spanCount: n,
            maxM: Math.max(...M_all.map(Math.abs)),
            maxV: Math.max(...V_all.map(Math.abs)),
            maxDefl: Math.max(...deflection.map(Math.abs)),
        };
    },

    /** Piecewise deflection: double-integrate M/EI, enforce y=0 at support points */
    _computeDeflection(xs, M, EI, spans) {
        const n = xs.length;
        const dy = new Array(n).fill(0); // first integral (slope)
        const y  = new Array(n).fill(0); // second integral (deflection)

        // Cumulative integration using trapezoidal rule
        for (let i = 1; i < n; i++) {
            const dx = xs[i] - xs[i - 1];
            dy[i] = dy[i - 1] + 0.5 * (M[i - 1] + M[i]) * dx / EI;
            y[i]  = y[i - 1]  + 0.5 * (dy[i - 1] + dy[i]) * dx;
        }

        // Find support x-positions and enforce y=0 via linear correction per span
        let cumX = 0;
        let prevIdx = 0;

        for (const L of spans) {
            cumX += L;
            // Find index nearest to cumX
            let nextIdx = xs.findIndex(x => x >= cumX - 1e-6 && x <= cumX + 1e-6);
            if (nextIdx === -1) nextIdx = xs.reduce((best, x, i) =>
                Math.abs(x - cumX) < Math.abs(xs[best] - cumX) ? i : best, 0);

            // Linear correction so y=0 at both ends
            const delta = y[nextIdx];
            for (let i = prevIdx; i <= nextIdx; i++) {
                const t = (i - prevIdx) / Math.max(nextIdx - prevIdx, 1);
                y[i] -= t * delta;
            }
            prevIdx = nextIdx;
        }

        return y;
    },

    /** Thomas algorithm for tridiagonal system Ax=b */
    _thomasSolve(A, b) {
        const n = b.length;
        if (n === 1) return [b[0] / A[0][0]];

        const c = A.map((row, i) => i < n - 1 ? row[i + 1] : 0);
        const a = A.map((row, i) => i > 0 ? row[i - 1] : 0);
        const d = [...b];
        const diag = A.map((row, i) => row[i]);

        // Forward sweep
        const c2 = [...c];
        const d2 = [...d];
        c2[0] = c[0] / diag[0];
        d2[0] = d[0] / diag[0];
        for (let i = 1; i < n; i++) {
            const m = diag[i] - a[i] * c2[i - 1];
            c2[i] = c[i] / m;
            d2[i] = (d[i] - a[i] * d2[i - 1]) / m;
        }

        // Back substitution
        const x = new Array(n).fill(0);
        x[n - 1] = d2[n - 1];
        for (let i = n - 2; i >= 0; i--) {
            x[i] = d2[i] - c2[i] * x[i + 1];
        }
        return x;
    },

    /** Overhanging beam: simply supported main span + cantilever overhang */
    solveOverhanging(config) {
        const { mainSpan, overhangLength, udl_main, udl_overhang, pointLoads = [], EI } = config;
        // The overhang applies a moment M = w_oh*L_oh²/2 + P_oh*a_oh at the far support
        const M_oh = (udl_overhang || 0) * overhangLength ** 2 / 2;
        // Treat main span as simply supported with end moment at right support
        // M_A = 0, M_B = M_oh (hogging)
        const L = mainSpan;
        const w = udl_main || 0;
        const N = 400;
        const dx = L / N;
        const R_A = w * L / 2 + (0 - (-M_oh)) / L; // R_A*L = w*L²/2 + M_oh
        const R_B_main = w * L / 2 - (0 - (-M_oh)) / L;
        const R_B_oh = (udl_overhang || 0) * overhangLength;
        const R_B = R_B_main + R_B_oh;

        const xs = [], V = [], M = [], defl = [];

        for (let j = 0; j <= N; j++) {
            const x = j * dx;
            xs.push(+x.toFixed(4));
            V.push(+(R_A - w * x).toFixed(4));
            M.push(+(-M_oh + R_A * x - w * x ** 2 / 2).toFixed(4));
        }

        // Overhang portion (x from 0 to L_oh beyond B)
        const dxOh = overhangLength / 100;
        for (let j = 1; j <= 100; j++) {
            const x_oh = j * dxOh;
            const x_glob = L + x_oh;
            xs.push(+x_glob.toFixed(4));
            const V_oh = -(udl_overhang || 0) * (overhangLength - x_oh);
            const M_oh_x = -(udl_overhang || 0) * (overhangLength - x_oh) ** 2 / 2;
            V.push(+V_oh.toFixed(4));
            M.push(+M_oh_x.toFixed(4));
        }

        const totalSpan = mainSpan + overhangLength;
        const deflection = this._computeDeflection(xs, M, EI || 1e6, [mainSpan, overhangLength]);

        return {
            xs, V, M, deflection,
            reactions: [R_A, R_B],
            span: totalSpan, spanCount: 1,
            maxM: Math.max(...M.map(Math.abs)),
            maxV: Math.max(...V.map(Math.abs)),
            maxDefl: Math.max(...deflection.map(Math.abs)),
        };
    },
};
