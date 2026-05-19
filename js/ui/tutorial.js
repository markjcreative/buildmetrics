/**
 * tutorial.js — Lightweight step-by-step tutorial overlay for calc pages
 * Usage: Tutorial.start(steps) where steps = [{title, text, target?}]
 * target is a CSS selector; if provided, the element is highlighted.
 */

const Tutorial = (() => {
    let steps = [], current = 0, overlay, box, backdrop;

    function inject() {
        if (document.getElementById('tut-overlay')) return;

        const style = document.createElement('style');
        style.textContent = `
            #tut-backdrop {
                position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:8000;
                pointer-events:none;transition:opacity .25s;
            }
            #tut-overlay {
                position:fixed;z-index:8001;
                background:#fff;border-radius:14px;
                box-shadow:0 24px 60px rgba(0,0,0,0.22);
                padding:24px 22px 20px;width:320px;max-width:90vw;
                transition:top .3s ease,left .3s ease;
                font-family:'Inter',sans-serif;
            }
            #tut-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
            #tut-title{font-size:0.95rem;font-weight:700;color:#111}
            #tut-close{background:none;border:none;cursor:pointer;font-size:1.1rem;color:#9CA3AF;padding:2px 6px}
            #tut-close:hover{color:#111}
            #tut-body{font-size:0.84rem;color:#374151;line-height:1.6;margin-bottom:16px}
            #tut-footer{display:flex;align-items:center;gap:10px}
            #tut-progress{flex:1;height:4px;background:#E5E7EB;border-radius:99px;overflow:hidden}
            #tut-bar{height:100%;background:#4F46E5;border-radius:99px;transition:width .3s}
            #tut-counter{font-size:0.75rem;color:#9CA3AF;white-space:nowrap}
            #tut-prev,#tut-next{
                padding:7px 14px;border-radius:8px;border:none;cursor:pointer;
                font-size:0.82rem;font-weight:600;font-family:'Inter',sans-serif;
            }
            #tut-prev{background:#F3F4F6;color:#374151}
            #tut-prev:hover{background:#E5E7EB}
            #tut-next{background:#4F46E5;color:#fff}
            #tut-next:hover{background:#4338CA}
            .tut-highlight{
                outline:3px solid #4F46E5 !important;
                outline-offset:4px !important;
                border-radius:6px !important;
                position:relative;z-index:8002 !important;
            }
            #tut-skip{font-size:0.75rem;color:#9CA3AF;background:none;border:none;cursor:pointer;margin-left:auto;text-decoration:underline}
            #tut-skip:hover{color:#374151}
        `;
        document.head.appendChild(style);

        backdrop = document.createElement('div');
        backdrop.id = 'tut-backdrop';

        box = document.createElement('div');
        box.id = 'tut-overlay';
        box.innerHTML = `
            <div id="tut-header">
                <div id="tut-title"></div>
                <button id="tut-close" onclick="Tutorial.stop()" title="Close">✕</button>
            </div>
            <div id="tut-body"></div>
            <div id="tut-footer">
                <button id="tut-prev" onclick="Tutorial.prev()">← Back</button>
                <div style="flex:1">
                    <div id="tut-progress"><div id="tut-bar"></div></div>
                    <div id="tut-counter" style="margin-top:4px;text-align:center"></div>
                </div>
                <button id="tut-next" onclick="Tutorial.next()">Next →</button>
            </div>
            <button id="tut-skip" onclick="Tutorial.stop()">Skip tutorial</button>
        `;

        document.body.appendChild(backdrop);
        document.body.appendChild(box);
    }

    function render() {
        const s = steps[current];
        document.getElementById('tut-title').textContent = s.title;
        document.getElementById('tut-body').innerHTML   = s.text;
        document.getElementById('tut-bar').style.width  = ((current + 1) / steps.length * 100) + '%';
        document.getElementById('tut-counter').textContent = `${current + 1} of ${steps.length}`;
        document.getElementById('tut-prev').style.opacity = current === 0 ? '0.4' : '1';
        document.getElementById('tut-next').textContent   = current === steps.length - 1 ? 'Done ✓' : 'Next →';

        // Clear previous highlight
        document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));

        // Highlight target and position box near it
        if (s.target) {
            const el = document.querySelector(s.target);
            if (el) {
                el.classList.add('tut-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setTimeout(() => positionNear(el), 320);
            } else {
                positionCenter();
            }
        } else {
            positionCenter();
        }
    }

    function positionNear(el) {
        const rect = el.getBoundingClientRect();
        const bw = box.offsetWidth || 320;
        const bh = box.offsetHeight || 200;
        const vw = window.innerWidth, vh = window.innerHeight;
        let top = rect.bottom + 14;
        let left = rect.left;
        if (top + bh > vh - 20) top = rect.top - bh - 14;
        if (left + bw > vw - 20) left = vw - bw - 20;
        if (left < 10) left = 10;
        if (top < 10) top = 10;
        box.style.top  = top + 'px';
        box.style.left = left + 'px';
    }

    function positionCenter() {
        box.style.top  = '50%';
        box.style.left = '50%';
        box.style.transform = 'translate(-50%,-50%)';
    }

    return {
        start(stepsArr) {
            inject();
            steps = stepsArr;
            current = 0;
            backdrop.style.opacity = '1';
            box.style.display = 'block';
            box.style.transform = '';
            render();
        },
        next() {
            if (current < steps.length - 1) { current++; render(); }
            else this.stop();
        },
        prev() {
            if (current > 0) { current--; render(); }
        },
        stop() {
            document.querySelectorAll('.tut-highlight').forEach(el => el.classList.remove('tut-highlight'));
            if (backdrop) backdrop.style.opacity = '0';
            if (box)      box.style.display = 'none';
        },
    };
})();

// ── Per-page tutorial definitions ─────────────────────────────────────────────
window.TUTORIALS = {
    beam: [
        { title: '👋 Welcome to Beam Design', text: 'This calculator designs steel and timber beams to Eurocode 3 and Eurocode 5. Follow these steps to run your first calculation.' },
        { title: '1 · Select Material', text: 'Choose <strong>Steel (EC3)</strong> for structural steel beams or <strong>Timber (EC5)</strong> for timber joists and beams.', target: '.mat-tabs' },
        { title: '2 · Choose a Section', text: 'Pick a section type (UB, UC, etc.) and select a designation from the Blue Book dropdown — section properties auto-fill.', target: '#s-type' },
        { title: '3 · Set Span & Support', text: 'Enter the beam span and select the support condition: simply supported, fixed-fixed, cantilever, or multi-span continuous.', target: '#b-support' },
        { title: '4 · Apply Loads', text: 'Enter <strong>Gk</strong> (permanent) and <strong>Qk</strong> (imposed) — the design combination 1.35Gk + 1.5Qk is calculated automatically.', target: '#sec-loads' },
        { title: '5 · Calculate', text: 'Click <strong>⚡ Calculate</strong> to run bending, shear, and deflection checks. The results panel shows utilisation ratios, diagrams, and pass/fail status.', target: '.calc-action-bar' },
        { title: '6 · Save & Export', text: 'Save the calculation to your active project using the 💾 Save button. You can then export to PDF or Word from the confirmation modal.' },
    ],
    'rc-beam': [
        { title: '👋 RC Beam Design (EC2)', text: 'Design reinforced concrete beams for flexure, shear, and deflection to Eurocode 2.' },
        { title: '1 · Section Geometry', text: 'Enter beam width <strong>b</strong>, overall depth <strong>h</strong>, cover, and bar diameter. Effective depth d is calculated automatically.', target: '#sec-geom' },
        { title: '2 · Materials', text: 'Select concrete class and rebar grade — characteristic strengths auto-fill. You can override manually.', target: '#sec-mat' },
        { title: '3 · Applied Forces', text: 'Enter the <strong>factored ULS</strong> design moment MEd and shear VEd (already multiplied by load factors).', target: '#sec-forces' },
        { title: '4 · Reinforcement', text: 'Enter the <strong>provided</strong> tension steel area (mm²) and stirrup details. Use the bar suggestion table in results to find the right arrangement.', target: '#sec-reinf' },
        { title: '5 · Calculate', text: 'Click ⚡ Calculate to check flexure (MEd≤MRd), shear (VEd≤VRd), deflection (l/d), and minimum reinforcement. Each check shows utilisation η.', target: '.calc-action-bar' },
    ],
    'timber-column': [
        { title: '👋 Timber Column (EC5)', text: 'Design timber columns for axial compression with buckling to Eurocode 5 §6.3.2.' },
        { title: '1 · Timber Grade', text: 'Select grade (C16, C24, GL24h etc.) — compression strength fc,0,k and E05 auto-fill from the EC5 material table.', target: '#inp-grade' },
        { title: '2 · Cross-Section', text: 'Choose rectangular or circular cross-section and enter dimensions. The section area is shown as a hint.', target: '#sec-mem' },
        { title: '3 · End Conditions', text: 'Select end conditions (pinned-pinned, fixed-pinned, etc.) — the effective length factor k and Le are calculated.', target: '#inp-end' },
        { title: '4 · Design Load', text: 'Enter the factored ULS axial force NEd. Optionally add bending moments for the combined N+M interaction check.', target: '#inp-NEd' },
        { title: '5 · Results', text: 'Results show the buckling reduction kc, slenderness λrel, NRd for each axis, and a governing utilisation ratio with PASS/FAIL.', target: '.calc-action-bar' },
    ],
    footing: [
        { title: '👋 Pad Footing Design', text: 'Size and check a reinforced concrete pad footing to EC2 and EC7 principles.' },
        { title: '1 · Column Loads', text: 'Enter the characteristic permanent (Gk) and variable (Qk) column loads. The ULS combination is applied automatically.', target: '#inp-Gk' },
        { title: '2 · Soil Parameters', text: 'Enter the allowable bearing capacity of the soil (kN/m²). This is used to size the footing area at SLS.', target: '#inp-bearing' },
        { title: '3 · Auto-Size', text: 'Click <strong>Auto-Size Footing</strong> to let the engine iteratively find the minimum footing dimensions that satisfy all checks.', target: '#btn-autosize' },
        { title: '4 · Review Results', text: 'Check bearing pressure, punching shear, wide-beam shear, and bending reinforcement utilisation ratios.' },
    ],
    column: [
        { title: '👋 Steel Column Design (EC3)', text: 'Check a steel column for axial buckling resistance to Eurocode 3 §6.3.1.' },
        { title: '1 · Section', text: 'Select section type and designation — properties A, Iyy, Ixx auto-fill from the Blue Book database.', target: '#sectionType' },
        { title: '2 · Effective Length', text: 'Set the column height and effective length factor k. The hint shows the calculated Le.', target: '#inp-keff' },
        { title: '3 · Applied Load', text: 'Enter the design axial force NEd (factored ULS). Select which axis to check or use "Both axes (governing)".', target: '#inp-NEd' },
        { title: '4 · Results', text: 'Results show the buckling curve, reduction factor χ, non-dimensional slenderness λ̄, and Nb,Rd for each axis with a utilisation ring.' },
    ],
};
