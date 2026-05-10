/**
 * Package brochure generator — opens an inline HTML brochure in a new
 * tab and triggers the browser's print dialog so the customer can save
 * it as a PDF (or print on paper) without round-tripping the server.
 *
 * Same pattern as the product brochure on /shop/:slug, kept in a
 * shared module so the family listing card and the detail page stay
 * in sync if we tweak the layout.
 *
 * Every brochure carries the company contact strip + generation date
 * — required on any downloaded Taqon document.
 */
import {
  TAQON_PHONE,
  TAQON_EMAIL,
  TAQON_ADDRESS,
  companyInfo,
} from '../data/siteData';
import { downloadsApi } from '../api/downloads';

const todayStamp = () => {
  const d = new Date();
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Open the brochure for a package family (or single package).
 *
 * @param {Object} pkg          API package object (or family-shaped obj)
 * @param {Object} family       Optional family record { name, kva_rating, short_description }
 * @param {Array}  includes     Optional list of "what's included" items
 *                              [{ name, description, warranty }]
 * @param {Array}  appliances   Optional "what it can power" labels
 */
export function openPackageBrochure(pkg, { family, includes = [], appliances = [], surface = 'package_card' } = {}) {
  if (!pkg) return;

  const familyName = family?.name || pkg.family?.name || pkg.name || 'Solar Package';
  const kvaRating = pkg.inverter_kva || family?.kva_rating || pkg.kvaRating || '';
  const batteryKwh = pkg.battery_capacity_kwh || pkg.battery_kwh || '';
  const panelCount = pkg.panel_count || pkg.panels || '';
  const tier = pkg.tier || '';
  const description =
    pkg.description ||
    pkg.short_description ||
    family?.short_description ||
    'A complete solar solution from Taqon Electrico.';

  // Compose the spec strip — only show keys we actually have
  const specRows = [
    kvaRating && { label: 'Inverter Capacity', value: `${kvaRating} kVA` },
    batteryKwh && { label: 'Battery Storage', value: `${batteryKwh} kWh` },
    panelCount && { label: 'Solar Panels', value: `${panelCount} panels` },
    tier && { label: 'Tier', value: tier.charAt(0).toUpperCase() + tier.slice(1) },
  ].filter(Boolean);

  const includesHtml = includes.length
    ? `
      <section class="block">
        <h3 class="block-title">What's Included</h3>
        <div class="includes-grid">
          ${includes
            .map(
              (i) => `
            <div class="include-card">
              <div class="include-name">${escapeHtml(i.name)}</div>
              ${i.description ? `<div class="include-desc">${escapeHtml(i.description)}</div>` : ''}
              ${i.warranty ? `<div class="include-warranty">${escapeHtml(i.warranty)}</div>` : ''}
            </div>`,
            )
            .join('')}
        </div>
      </section>`
    : '';

  const appliancesHtml = appliances.length
    ? `
      <section class="block">
        <h3 class="block-title">What It Can Power</h3>
        <ul class="appliance-list">
          ${appliances.map((a) => `<li>${escapeHtml(typeof a === 'string' ? a : a.title || a.name || '')}</li>`).join('')}
        </ul>
      </section>`
    : '';

  const brochureHtml = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>${escapeHtml(familyName)} — Taqon Electrico Brochure</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Outfit', system-ui, sans-serif;
    color: #1A1A1A;
    background: #FFFBF5;
    line-height: 1.55;
  }
  .page { max-width: 880px; margin: 0 auto; background: #FFFFFF; }

  /* ---- Header ---- */
  header.hero {
    background: linear-gradient(135deg, #F26522 0%, #FF8447 100%);
    color: #FFFBF5;
    padding: 48px 56px 56px;
    position: relative;
  }
  header.hero::after {
    content: "";
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }
  header.hero > * { position: relative; z-index: 1; }
  .eyebrow {
    font-size: 11px; letter-spacing: 3.2px; text-transform: uppercase;
    font-weight: 600; opacity: 0.92;
  }
  .h1 {
    font-family: 'Syne', sans-serif;
    font-size: 38px; font-weight: 700; line-height: 1.05;
    letter-spacing: -0.5px; margin-top: 14px;
  }
  .h1-sub {
    font-size: 16px; margin-top: 12px; opacity: 0.92; max-width: 520px;
  }

  /* ---- Spec strip ---- */
  .specs {
    background: #0D0D0D; color: #FFFBF5;
    padding: 24px 56px;
    display: flex; gap: 40px; flex-wrap: wrap;
  }
  .spec { display: flex; flex-direction: column; gap: 4px; }
  .spec-label {
    font-size: 9.5px; letter-spacing: 2px; text-transform: uppercase;
    color: #F26522; font-weight: 700;
  }
  .spec-value {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 700;
  }

  /* ---- Body blocks ---- */
  .body-content { padding: 40px 56px 0; }
  .description {
    font-size: 14.5px; line-height: 1.7; color: #1A1A1A; max-width: 660px;
  }
  .accent-bar { width: 56px; height: 3px; background: #F26522; margin-bottom: 18px; }

  .block { margin-top: 36px; }
  .block-title {
    font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
    color: #0D0D0D; letter-spacing: -0.2px; margin-bottom: 16px;
  }

  .includes-grid {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px;
  }
  .include-card {
    background: #FFFBF5; border: 1px solid #F3E9D9;
    padding: 14px 16px; border-radius: 8px;
  }
  .include-name {
    font-weight: 600; color: #0D0D0D; font-size: 13.5px;
  }
  .include-desc {
    font-size: 11.5px; color: #6B7280; margin-top: 4px; line-height: 1.5;
  }
  .include-warranty {
    display: inline-block; font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.8px;
    background: #fff7ed; color: #F26522;
    padding: 3px 9px; border-radius: 999px; margin-top: 8px;
  }

  .appliance-list {
    list-style: none; display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 8px 16px;
  }
  .appliance-list li {
    font-size: 13px; color: #1A1A1A;
    padding-left: 16px; position: relative;
  }
  .appliance-list li::before {
    content: ""; width: 5px; height: 5px; border-radius: 50%;
    background: #F26522; position: absolute; left: 0; top: 8px;
  }

  /* ---- CTA strip ---- */
  .cta {
    margin: 40px 56px 0; padding: 22px 28px;
    background: #fff7ed; border-left: 4px solid #F26522;
    display: flex; justify-content: space-between; align-items: center;
    flex-wrap: wrap; gap: 16px; border-radius: 6px;
  }
  .cta-title {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
    color: #0D0D0D;
  }
  .cta-sub {
    font-size: 12px; color: #6B7280; margin-top: 4px;
  }
  .cta-phone {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
    color: #F26522;
  }

  /* ---- Footer (mandatory contact strip) ---- */
  footer.brand-footer {
    background: #0D0D0D; color: #FFFBF5;
    padding: 36px 56px; margin-top: 48px;
  }
  .footer-grid {
    display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 36px;
    align-items: start;
  }
  .footer-logo {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800;
    letter-spacing: -0.4px;
  }
  .footer-logo .accent { color: #F26522; }
  .footer-tag {
    font-size: 11px; color: rgba(255,255,255,0.55); margin-top: 8px;
    letter-spacing: 1.4px; text-transform: uppercase; font-weight: 500;
  }
  .footer-block-title {
    font-size: 9.5px; color: #F26522; letter-spacing: 2.2px;
    text-transform: uppercase; font-weight: 700; margin-bottom: 8px;
  }
  .footer-line {
    font-size: 12px; color: rgba(255,255,255,0.85); line-height: 1.6;
  }
  .footer-meta {
    margin-top: 24px; padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.12);
    font-size: 10px; color: rgba(255,255,255,0.45);
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px;
    letter-spacing: 0.8px;
  }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 100%; }
    @page { size: A4; margin: 0; }
  }
</style></head>
<body>
  <div class="page">
    <header class="hero">
      <div class="eyebrow">Solar System Brochure</div>
      <h1 class="h1">${escapeHtml(familyName)}</h1>
      <p class="h1-sub">${escapeHtml(description)}</p>
    </header>

    ${
      specRows.length
        ? `
      <div class="specs">
        ${specRows
          .map(
            (s) => `
          <div class="spec">
            <span class="spec-label">${escapeHtml(s.label)}</span>
            <span class="spec-value">${escapeHtml(s.value)}</span>
          </div>`,
          )
          .join('')}
      </div>`
        : ''
    }

    <div class="body-content">
      <div class="accent-bar"></div>
      <p class="description">
        Every Taqon installation is sized from the customer's actual load profile,
        installed by certified engineers, and backed by ongoing maintenance and
        a 1-year workmanship warranty. We use only tier-1 components &mdash;
        no grey-market hardware.
      </p>

      ${includesHtml}

      ${appliancesHtml}
    </div>

    <div class="cta">
      <div>
        <div class="cta-title">Ready to size this for your home or business?</div>
        <div class="cta-sub">No obligation site survey &mdash; we'll quote based on your actual loads.</div>
      </div>
      <div class="cta-phone">${escapeHtml(TAQON_PHONE)}</div>
    </div>

    <footer class="brand-footer">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">TAQON <span class="accent">ELECTRICO.</span></div>
          <div class="footer-tag">${escapeHtml(companyInfo?.tagline || 'Customer is King!')}</div>
        </div>
        <div>
          <div class="footer-block-title">Visit / Mail</div>
          <div class="footer-line">${escapeHtml(TAQON_ADDRESS)}</div>
        </div>
        <div>
          <div class="footer-block-title">Reach us</div>
          <div class="footer-line">
            ${escapeHtml(TAQON_PHONE)}<br/>
            ${escapeHtml(TAQON_EMAIL)}<br/>
            www.taqon.co.zw
          </div>
        </div>
      </div>
      <div class="footer-meta">
        <span>Generated ${escapeHtml(todayStamp())}</span>
        <span>This document is informational. Final pricing depends on your site survey.</span>
      </div>
    </footer>
  </div>
  <script>
    setTimeout(function() { window.print(); }, 350);
  </script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(brochureHtml);
    win.document.close();
  }

  // Fire-and-forget tracking ping. We don't await it so a slow API
  // never delays the print dialog appearing.
  downloadsApi.track({
    kind: 'package_brochure',
    surface,
    target_slug: pkg.slug || '',
    target_label: familyName,
    metadata: {
      kva: kvaRating ? String(kvaRating) : '',
      battery_kwh: batteryKwh ? String(batteryKwh) : '',
      panel_count: panelCount || null,
    },
  });
}

/* Tiny HTML-escape so a package name containing & or < doesn't blow up
   the inline template. */
function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
