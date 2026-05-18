/**
 * BuildMetrics — Engineering Materials Database
 */
window.EngineeringMaterials = {
    steel: {
        'S275': { label: 'S275', fy: 275, fu: 410, E: 210000, density: 7850, poisson: 0.3 },
        'S355': { label: 'S355', fy: 355, fu: 510, E: 210000, density: 7850, poisson: 0.3 },
        'S460': { label: 'S460', fy: 460, fu: 550, E: 210000, density: 7850, poisson: 0.3 },
        'A36':  { label: 'A36 (US)', fy: 250, fu: 400, E: 200000, density: 7850, poisson: 0.3 },
        'A572-50': { label: 'A572 Gr.50 (US)', fy: 345, fu: 450, E: 200000, density: 7850, poisson: 0.3 },
        'Fe 250 (IS)': { label: 'Fe 250 (IS)', fy: 250, fu: 410, E: 200000, density: 7850, poisson: 0.3 },
        'Fe 415 (IS)': { label: 'Fe 415 (IS)', fy: 415, fu: 485, E: 200000, density: 7850, poisson: 0.3 },
        'Fe 500 (IS)': { label: 'Fe 500 (IS)', fy: 500, fu: 545, E: 200000, density: 7850, poisson: 0.3 },
    },
    concrete: {
        'C20/25': { label: 'C20/25', fck: 20, fctm: 2.2, Ecm: 29000, density: 2400 },
        'C25/30': { label: 'C25/30', fck: 25, fctm: 2.6, Ecm: 31000, density: 2400 },
        'C30/37': { label: 'C30/37', fck: 30, fctm: 2.9, Ecm: 32000, density: 2400 },
        'C35/45': { label: 'C35/45', fck: 35, fctm: 3.2, Ecm: 34000, density: 2400 },
        'C40/50': { label: 'C40/50', fck: 40, fctm: 3.5, Ecm: 35000, density: 2400 },
        'C45/55': { label: 'C45/55', fck: 45, fctm: 3.8, Ecm: 36000, density: 2400 },
        'C50/60': { label: 'C50/60', fck: 50, fctm: 4.1, Ecm: 37000, density: 2400 },
        'f\'c 3000 psi': { label: 'f\'c 3000 psi (ACI)', fck: 20.7, fctm: 2.0, Ecm: 24900, density: 2400 },
        'f\'c 4000 psi': { label: 'f\'c 4000 psi (ACI)', fck: 27.6, fctm: 2.3, Ecm: 28700, density: 2400 },
        'f\'c 5000 psi': { label: 'f\'c 5000 psi (ACI)', fck: 34.5, fctm: 2.6, Ecm: 32100, density: 2400 },
        'M20 (IS)': { label: 'M20 (IS)', fck: 20, fctm: 2.2, Ecm: 22360, density: 2400 },
        'M25 (IS)': { label: 'M25 (IS)', fck: 25, fctm: 2.6, Ecm: 25000, density: 2400 },
        'M30 (IS)': { label: 'M30 (IS)', fck: 30, fctm: 2.9, Ecm: 27386, density: 2400 },
    },
    rebar: {
        'B500B (EC2)': { label: 'B500B', fyk: 500, E: 200000 },
        'B500C (EC2)': { label: 'B500C', fyk: 500, E: 200000 },
        'Grade 60 (ACI)': { label: 'Grade 60', fyk: 414, E: 200000 },
        'Grade 75 (ACI)': { label: 'Grade 75', fyk: 517, E: 200000 },
        'Fe 415 (IS)': { label: 'Fe 415', fyk: 415, E: 200000 },
        'Fe 500 (IS)': { label: 'Fe 500', fyk: 500, E: 200000 },
    },
    timber: {
        'C16': { label: 'C16', fm_k: 16, fv_k: 1.8, fc_0_k: 17, fc_90_k: 2.2, ft_0_k: 10, E0mean: 8000, E05: 5400, density: 310 },
        'C24': { label: 'C24', fm_k: 24, fv_k: 2.5, fc_0_k: 21, fc_90_k: 2.5, ft_0_k: 14, E0mean: 11000, E05: 7400, density: 350 },
        'C27': { label: 'C27', fm_k: 27, fv_k: 2.8, fc_0_k: 22, fc_90_k: 2.6, ft_0_k: 16, E0mean: 11500, E05: 7700, density: 370 },
        'GL24h': { label: 'GL24h (Glulam)', fm_k: 24, fv_k: 2.5, fc_0_k: 24, fc_90_k: 2.5, ft_0_k: 16.5, E0mean: 11600, E05: 9400, density: 385 },
        'GL28h': { label: 'GL28h (Glulam)', fm_k: 28, fv_k: 2.7, fc_0_k: 26.5, fc_90_k: 3.0, ft_0_k: 19.5, E0mean: 12600, E05: 10200, density: 410 },
        'GL32h': { label: 'GL32h (Glulam)', fm_k: 32, fv_k: 3.2, fc_0_k: 29, fc_90_k: 3.3, ft_0_k: 22.5, E0mean: 13700, E05: 11100, density: 430 },
    }
};
