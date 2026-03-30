/**
 * BuildMetrics — Section Properties Calculator
 * IIFE module exposing window.SectionProps
 * All dimensions in mm, outputs: A (mm²), I (mm⁴), Z (mm³), r (mm)
 */
const SectionProps = (() => {

    /**
     * Calculate section properties for a given shape and dimensions.
     * @param {string} shape - 'rectangle'|'circle'|'hollow_rectangle'|'hollow_circle'|'I_section'|'T_section'|'angle'
     * @param {object} dims - Shape-specific dimensions (all in mm)
     * @returns {object} Section properties
     */
    function calculate(shape, dims) {
        switch (shape) {
            case 'rectangle':     return _rectangle(dims);
            case 'circle':        return _circle(dims);
            case 'hollow_rectangle': return _hollowRectangle(dims);
            case 'hollow_circle': return _hollowCircle(dims);
            case 'I_section':     return _iSection(dims);
            case 'T_section':     return _tSection(dims);
            case 'angle':         return _angle(dims);
            default: throw new Error(`Unknown shape: ${shape}`);
        }
    }

    function _rectangle({ b, d }) {
        const A   = b * d;
        const Ixx = b * d * d * d / 12;
        const Iyy = d * b * b * b / 12;
        const Zxx = b * d * d / 6;
        const Zyy = d * b * b / 6;
        const rxx = Math.sqrt(Ixx / A);
        const ryy = Math.sqrt(Iyy / A);
        return { shape: 'rectangle', A, Ixx, Iyy, Zxx, Zyy, rxx, ryy };
    }

    function _circle({ d }) {
        const r   = d / 2;
        const A   = Math.PI * r * r;
        const I   = Math.PI * d * d * d * d / 64;
        const Z   = Math.PI * d * d * d / 32;
        const rg  = d / 4; // radius of gyration = d/4
        return { shape: 'circle', A, Ixx: I, Iyy: I, Zxx: Z, Zyy: Z, rxx: rg, ryy: rg };
    }

    function _hollowRectangle({ B, D, t }) {
        const bi = B - 2 * t;
        const di = D - 2 * t;
        const A   = B * D - bi * di;
        const Ixx = (B * D * D * D - bi * di * di * di) / 12;
        const Iyy = (D * B * B * B - di * bi * bi * bi) / 12;
        const Zxx = Ixx / (D / 2);
        const Zyy = Iyy / (B / 2);
        const rxx = Math.sqrt(Ixx / A);
        const ryy = Math.sqrt(Iyy / A);
        return { shape: 'hollow_rectangle', A, Ixx, Iyy, Zxx, Zyy, rxx, ryy };
    }

    function _hollowCircle({ D, t }) {
        const d   = D - 2 * t; // inner diameter
        const A   = Math.PI / 4 * (D * D - d * d);
        const I   = Math.PI / 64 * (D * D * D * D - d * d * d * d);
        const Z   = I / (D / 2);
        const rg  = Math.sqrt(I / A);
        return { shape: 'hollow_circle', A, Ixx: I, Iyy: I, Zxx: Z, Zyy: Z, rxx: rg, ryy: rg };
    }

    function _iSection({ bf, tf, hw, tw }) {
        // Total depth H = hw + 2*tf
        const H = hw + 2 * tf;
        const A = 2 * bf * tf + hw * tw;

        // Ixx: flanges (parallel axis) + web
        const I_flange = bf * tf * tf * tf / 12; // own axis
        const d_flange = (hw / 2 + tf / 2);      // distance from NA to flange centroid
        const Ixx = 2 * (I_flange + bf * tf * d_flange * d_flange) +
                    tw * hw * hw * hw / 12;
        const Zxx = Ixx / (H / 2);

        // Iyy: sum of both flanges + web (web contribution minimal but included)
        const Iyy = 2 * (tf * bf * bf * bf / 12) + hw * tw * tw * tw / 12;
        const Zyy = Iyy / (bf / 2);

        const rxx = Math.sqrt(Ixx / A);
        const ryy = Math.sqrt(Iyy / A);

        return { shape: 'I_section', A, Ixx, Iyy, Zxx, Zyy, rxx, ryy, H };
    }

    function _tSection({ bf, tf, hw, tw }) {
        // T-section: flange on top, web hanging down
        // Total height H = tf + hw
        const H = tf + hw;
        const A = bf * tf + hw * tw;

        // Centroid y̅ measured from BOTTOM of web
        const ybar = (bf * tf * (hw + tf / 2) + hw * tw * (hw / 2)) / A;

        // Ixx about centroid
        const I_flange_own = bf * tf * tf * tf / 12;
        const d_flange = (hw + tf / 2) - ybar;
        const I_web_own = tw * hw * hw * hw / 12;
        const d_web = hw / 2 - ybar;
        const Ixx = I_flange_own + bf * tf * d_flange * d_flange +
                    I_web_own    + tw * hw * d_web * d_web;

        const y_top    = H - ybar;  // distance from NA to top fibre
        const y_bottom = ybar;      // distance from NA to bottom fibre
        const Ztop     = Ixx / y_top;
        const Zbottom  = Ixx / y_bottom;

        // Iyy (symmetric about web centre line)
        const Iyy = tf * bf * bf * bf / 12 + hw * tw * tw * tw / 12;
        const Zyy = Iyy / (bf / 2);

        const rxx = Math.sqrt(Ixx / A);
        const ryy = Math.sqrt(Iyy / A);

        return { shape: 'T_section', A, ybar, Ixx, Iyy, Ztop, Zbottom, Zxx: Math.min(Ztop, Zbottom), Zyy, rxx, ryy, H };
    }

    function _angle({ b, d, t }) {
        // Equal or unequal angle, legs b (horizontal) and d (vertical), thickness t
        // Components: horizontal leg and vertical leg (overlap at corner counted once)
        // Horizontal leg: b × t, centroid at (b/2, t/2) from bottom-left corner
        // Vertical leg: (d-t) × t, centroid at (t/2, t + (d-t)/2)

        const A = b * t + (d - t) * t;

        const xbar = (b * t * (b / 2) + (d - t) * t * (t / 2)) / A;
        const ybar = (b * t * (t / 2) + (d - t) * t * (t + (d - t) / 2)) / A;

        // Ixx about centroid (horizontal axis)
        const I1x_own = b * t * t * t / 12;
        const d1x = ybar - t / 2;
        const I2x_own = t * (d - t) * (d - t) * (d - t) / 12;
        const d2x = (t + (d - t) / 2) - ybar;
        const Ixx = I1x_own + b * t * d1x * d1x + I2x_own + (d - t) * t * d2x * d2x;

        // Iyy about centroid (vertical axis)
        const I1y_own = t * b * b * b / 12;
        const d1y = b / 2 - xbar;
        const I2y_own = (d - t) * t * t * t / 12;
        const d2y = t / 2 - xbar;
        const Iyy = I1y_own + b * t * d1y * d1y + I2y_own + (d - t) * t * d2y * d2y;

        // Approximate elastic moduli (distance to extreme fibres)
        const Zxx = Ixx / Math.max(ybar, d - ybar);
        const Zyy = Iyy / Math.max(xbar, b - xbar);

        const rxx = Math.sqrt(Ixx / A);
        const ryy = Math.sqrt(Iyy / A);

        return { shape: 'angle', A, xbar, ybar, Ixx, Iyy, Zxx, Zyy, rxx, ryy };
    }

    return { calculate };
})();

window.SectionProps = SectionProps;
