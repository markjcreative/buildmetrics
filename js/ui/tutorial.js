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
                position:fixed;inset:0;background:rgba(15,23,42,0.55);z-index:8000;
                pointer-events:none;transition:opacity .25s;
            }
            /* Card sits ABOVE the highlighted element (which is raised to 8002),
               so text is never covered by the thing being pointed at. */
            #tut-overlay {
                position:fixed;z-index:8010;
                background:#fff;border-radius:16px;
                box-shadow:0 18px 50px rgba(15,23,42,0.24), 0 2px 6px rgba(15,23,42,0.08);
                padding:22px 22px 16px;width:340px;max-width:calc(100vw - 28px);
                transition:top .28s cubic-bezier(.4,0,.2,1),left .28s cubic-bezier(.4,0,.2,1);
                font-family:'Inter',system-ui,sans-serif;
            }
            #tut-bar-track{position:absolute;top:0;left:0;right:0;height:4px;
                background:#EEF2F7;border-radius:16px 16px 0 0;overflow:hidden}
            #tut-bar{height:100%;width:0;background:#2563EB;transition:width .3s ease}
            #tut-arrow{position:absolute;width:14px;height:14px;background:#fff;
                transform:rotate(45deg);border-radius:2px;display:none;z-index:-1}
            #tut-header{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin:6px 0 8px}
            #tut-title{font-size:1.02rem;font-weight:750;color:#0F172A;line-height:1.3;letter-spacing:-.01em}
            #tut-close{background:none;border:none;cursor:pointer;font-size:1rem;color:#94A3B8;
                padding:4px;margin:-4px -4px 0 0;line-height:1;border-radius:6px;flex-shrink:0}
            #tut-close:hover{color:#0F172A;background:#F1F5F9}
            #tut-body{font-size:0.875rem;color:#475569;line-height:1.62;margin-bottom:18px}
            #tut-body strong{color:#0F172A;font-weight:650}
            #tut-footer{display:flex;align-items:center;justify-content:space-between;gap:12px}
            #tut-actions{display:flex;align-items:center;gap:8px}
            #tut-counter{font-size:0.75rem;font-weight:600;color:#94A3B8;white-space:nowrap;margin-right:2px;font-variant-numeric:tabular-nums}
            #tut-skip{font-size:0.8rem;font-weight:600;color:#94A3B8;background:none;border:none;cursor:pointer;
                padding:8px 4px;font-family:inherit;border-radius:6px}
            #tut-skip:hover{color:#475569}
            #tut-prev,#tut-next{
                padding:8px 16px;border-radius:9px;border:none;cursor:pointer;
                font-size:0.82rem;font-weight:650;font-family:inherit;transition:background .14s,opacity .14s;
            }
            #tut-prev{background:#F1F5F9;color:#334155}
            #tut-prev:hover{background:#E2E8F0}
            #tut-next{background:#2563EB;color:#fff}
            #tut-next:hover{background:#1D4ED8}
            .tut-highlight{
                outline:3px solid #2563EB !important;
                outline-offset:3px !important;
                border-radius:8px !important;
                box-shadow:0 0 0 6px rgba(37,99,235,0.18) !important;
                position:relative;z-index:8002 !important;
                transition:outline-offset .2s ease;
            }
        `;
        document.head.appendChild(style);

        backdrop = document.createElement('div');
        backdrop.id = 'tut-backdrop';

        box = document.createElement('div');
        box.id = 'tut-overlay';
        box.innerHTML = `
            <div id="tut-bar-track"><div id="tut-bar"></div></div>
            <div id="tut-arrow"></div>
            <div id="tut-header">
                <div id="tut-title"></div>
                <button id="tut-close" onclick="Tutorial.stop()" aria-label="Close tour">✕</button>
            </div>
            <div id="tut-body"></div>
            <div id="tut-footer">
                <button id="tut-skip" onclick="Tutorial.stop()">Skip tour</button>
                <div id="tut-actions">
                    <span id="tut-counter"></span>
                    <button id="tut-prev" onclick="Tutorial.prev()">Back</button>
                    <button id="tut-next" onclick="Tutorial.next()">Next</button>
                </div>
            </div>
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

    // Place the card on whichever side of the target has room, offset by a gap
    // so it NEVER overlaps the highlighted element, then point an arrow at it.
    function positionNear(el) {
        const r  = el.getBoundingClientRect();
        const bw = box.offsetWidth  || 340;
        const bh = box.offsetHeight || 200;
        const vw = window.innerWidth, vh = window.innerHeight;
        const gap = 16, m = 14;               // gap to target, margin to viewport
        box.style.transform = '';

        const clampH = x => Math.max(m, Math.min(x, vw - bw - m));
        const clampV = y => Math.max(m, Math.min(y, vh - bh - m));

        let top, left, place;
        if (vh - r.bottom >= bh + gap)      { place = 'bottom'; top = r.bottom + gap;   left = clampH(r.left + r.width / 2 - bw / 2); }
        else if (r.top >= bh + gap)         { place = 'top';    top = r.top - bh - gap; left = clampH(r.left + r.width / 2 - bw / 2); }
        else if (vw - r.right >= bw + gap)  { place = 'right';  left = r.right + gap;   top = clampV(r.top + r.height / 2 - bh / 2); }
        else if (r.left >= bw + gap)        { place = 'left';   left = r.left - bw - gap; top = clampV(r.top + r.height / 2 - bh / 2); }
        else { positionCenter(); return; }   // no room anywhere — centre, card stays above via z-index

        box.style.top  = top  + 'px';
        box.style.left = left + 'px';
        _placeArrow(place, r, top, left, bw, bh);
    }

    function _placeArrow(place, r, top, left, bw, bh) {
        const arrow = document.getElementById('tut-arrow');
        if (!arrow) return;
        const off = -6, edge = 16;
        arrow.style.display = 'block';
        if (place === 'bottom' || place === 'top') {
            const x = Math.max(edge, Math.min(r.left + r.width / 2 - left, bw - edge));
            arrow.style.left = (x - 7) + 'px';
            arrow.style.right = 'auto';
            arrow.style.top = place === 'bottom' ? off + 'px' : (bh + off) + 'px';
        } else {
            const y = Math.max(edge, Math.min(r.top + r.height / 2 - top, bh - edge));
            arrow.style.top = (y - 7) + 'px';
            arrow.style.left = place === 'right' ? off + 'px' : (bw + off) + 'px';
            arrow.style.right = 'auto';
        }
    }

    function positionCenter() {
        const arrow = document.getElementById('tut-arrow');
        if (arrow) arrow.style.display = 'none';
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

window.Tutorial = Tutorial;

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
