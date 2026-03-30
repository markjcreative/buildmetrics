/**
 * upgrade-modal.js — Reusable upgrade gate modal for Kinecalc
 * Injected into the DOM on first call. Shows plan comparison + CTA.
 */

const UpgradeModal = (() => {
    let _injected = false;

    const COPY = {
        projects: {
            headline: 'You\'ve reached your project limit',
            sub: 'Free accounts are limited to <strong>1 project</strong>. Upgrade to Pro to create unlimited projects.',
        },
        calcs: {
            headline: 'You\'ve reached your calculation limit',
            sub: 'Free accounts are limited to <strong>5 saved calculations</strong> total. Upgrade to Pro to save unlimited calculations.',
        },
        generic: {
            headline: 'Upgrade to Kinecalc Pro',
            sub: 'Unlock unlimited projects, calculations, and premium features.',
        }
    };

    function _inject() {
        if (_injected) return;
        _injected = true;

        const style = document.createElement('style');
        style.textContent = `
            #upgrade-modal-overlay {
                display: none;
                position: fixed;
                inset: 0;
                background: rgba(15,15,25,0.60);
                z-index: 10000;
                align-items: center;
                justify-content: center;
                padding: 20px;
                backdrop-filter: blur(4px);
            }
            #upgrade-modal-overlay.open { display: flex; }

            #upgrade-modal-box {
                background: #fff;
                border-radius: 20px;
                width: 100%;
                max-width: 520px;
                box-shadow: 0 32px 80px rgba(0,0,0,0.22);
                overflow: hidden;
                animation: umPopIn 0.25s cubic-bezier(0.34,1.56,0.64,1);
            }
            @keyframes umPopIn {
                from { opacity: 0; transform: scale(0.92) translateY(16px); }
                to   { opacity: 1; transform: scale(1) translateY(0); }
            }

            .um-header {
                background: linear-gradient(135deg, #3730A3 0%, #4F46E5 50%, #7C3AED 100%);
                padding: 30px 32px 26px;
                color: white;
                position: relative;
            }
            .um-header-icon {
                width: 48px; height: 48px;
                background: rgba(255,255,255,0.15);
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                font-size: 22px;
                margin-bottom: 14px;
                backdrop-filter: blur(8px);
            }
            .um-headline {
                font-size: 1.25rem;
                font-weight: 800;
                letter-spacing: -0.4px;
                margin-bottom: 6px;
                font-family: 'Inter', sans-serif;
            }
            .um-sub {
                font-size: 0.85rem;
                color: rgba(255,255,255,0.80);
                line-height: 1.55;
                font-family: 'Inter', sans-serif;
            }
            .um-sub strong { color: #C7D2FE; }
            .um-close {
                position: absolute;
                top: 18px; right: 18px;
                width: 30px; height: 30px;
                background: rgba(255,255,255,0.15);
                border: none; border-radius: 8px;
                color: white; font-size: 16px;
                cursor: pointer;
                display: flex; align-items: center; justify-content: center;
                transition: background 0.15s;
                font-family: sans-serif;
            }
            .um-close:hover { background: rgba(255,255,255,0.25); }

            .um-body { padding: 26px 32px 30px; }

            .um-plans {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 14px;
                margin-bottom: 22px;
            }
            .um-plan {
                border-radius: 12px;
                padding: 18px;
                border: 1.5px solid #E5E5E5;
            }
            .um-plan.pro {
                border-color: #4F46E5;
                background: #F5F4FF;
            }
            .um-plan-label {
                font-size: 0.72rem;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                color: #A3A3A3;
                margin-bottom: 8px;
                font-family: 'Inter', sans-serif;
            }
            .um-plan.pro .um-plan-label { color: #4F46E5; }
            .um-plan-price {
                font-size: 1.5rem;
                font-weight: 800;
                color: #111;
                letter-spacing: -0.5px;
                margin-bottom: 2px;
                font-family: 'Inter', sans-serif;
            }
            .um-plan.pro .um-plan-price { color: #4F46E5; }
            .um-plan-period {
                font-size: 0.75rem;
                color: #A3A3A3;
                margin-bottom: 14px;
                font-family: 'Inter', sans-serif;
            }
            .um-plan-features {
                list-style: none;
                padding: 0; margin: 0;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .um-plan-features li {
                font-size: 0.78rem;
                color: #525252;
                display: flex;
                align-items: flex-start;
                gap: 7px;
                font-family: 'Inter', sans-serif;
                line-height: 1.4;
            }
            .um-plan-features li .check { color: #16A34A; font-size: 12px; flex-shrink: 0; margin-top: 1px; }
            .um-plan-features li .cross { color: #D1D5DB; font-size: 12px; flex-shrink: 0; margin-top: 1px; }
            .um-plan.pro .um-plan-features li { color: #1E1B4B; }

            .um-cta {
                display: flex;
                flex-direction: column;
                gap: 10px;
            }
            .um-btn-upgrade {
                width: 100%;
                padding: 14px;
                background: linear-gradient(135deg, #4F46E5, #7C3AED);
                color: white;
                border: none;
                border-radius: 10px;
                font-family: 'Inter', sans-serif;
                font-size: 0.95rem;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.2s;
                letter-spacing: -0.1px;
                box-shadow: 0 4px 16px rgba(79,70,229,0.30);
            }
            .um-btn-upgrade:hover {
                transform: translateY(-1px);
                box-shadow: 0 8px 24px rgba(79,70,229,0.40);
            }
            .um-btn-cancel {
                width: 100%;
                padding: 11px;
                background: transparent;
                color: #A3A3A3;
                border: 1.5px solid #E5E5E5;
                border-radius: 10px;
                font-family: 'Inter', sans-serif;
                font-size: 0.85rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.15s;
            }
            .um-btn-cancel:hover { border-color: #A3A3A3; color: #525252; }
        `;
        document.head.appendChild(style);

        const overlay = document.createElement('div');
        overlay.id = 'upgrade-modal-overlay';
        overlay.innerHTML = `
            <div id="upgrade-modal-box">
                <div class="um-header">
                    <button class="um-close" onclick="UpgradeModal.hide()">✕</button>
                    <div class="um-header-icon">⚡</div>
                    <div class="um-headline" id="um-headline">Upgrade to Pro</div>
                    <div class="um-sub" id="um-sub">Unlock the full power of Kinecalc.</div>
                </div>
                <div class="um-body">
                    <div class="um-plans">
                        <div class="um-plan">
                            <div class="um-plan-label">Free</div>
                            <div class="um-plan-price">$0</div>
                            <div class="um-plan-period">forever</div>
                            <ul class="um-plan-features">
                                <li><span class="check">✓</span> 1 project</li>
                                <li><span class="check">✓</span> 5 calculations total</li>
                                <li><span class="check">✓</span> PDF &amp; CSV export</li>
                                <li><span class="cross">✕</span> Unlimited projects</li>
                                <li><span class="cross">✕</span> Unlimited calculations</li>
                            </ul>
                        </div>
                        <div class="um-plan pro">
                            <div class="um-plan-label">⚡ Pro</div>
                            <div class="um-plan-price">$59</div>
                            <div class="um-plan-period">per month</div>
                            <ul class="um-plan-features">
                                <li><span class="check">✓</span> Unlimited projects</li>
                                <li><span class="check">✓</span> Unlimited calculations</li>
                                <li><span class="check">✓</span> PDF &amp; CSV export</li>
                                <li><span class="check">✓</span> Priority support</li>
                                <li><span class="check">✓</span> Early access to new features</li>
                            </ul>
                        </div>
                    </div>
                    <div class="um-cta">
                        <button class="um-btn-upgrade" id="um-btn-upgrade" onclick="UpgradeModal.goToPricing()">
                            ⚡ Upgrade to Pro — $59/month
                        </button>
                        <button class="um-btn-cancel" onclick="UpgradeModal.hide()">
                            Maybe later
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Close on backdrop click
        overlay.addEventListener('click', e => { if (e.target === overlay) UpgradeModal.hide(); });
    }

    function show(reason = 'generic') {
        _inject();
        const copy = COPY[reason] || COPY.generic;
        document.getElementById('um-headline').textContent = copy.headline;
        document.getElementById('um-sub').innerHTML = copy.sub;
        document.getElementById('upgrade-modal-overlay').classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function hide() {
        const overlay = document.getElementById('upgrade-modal-overlay');
        if (overlay) overlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    function goToPricing() {
        window.location.href = '/pricing.html';
    }

    return { show, hide, goToPricing };
})();

window.UpgradeModal = UpgradeModal;
