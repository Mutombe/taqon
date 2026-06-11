/**
 * Solar geyser quotation generator — opens an inline, print-ready HTML
 * quotation in a new tab and triggers the browser's print dialog so the
 * customer can save it as a PDF. Same no-server pattern as the solar package
 * brochure (lib/packageBrochure.js), kept on-brand and carrying the mandatory
 * company contact strip + generation date.
 */
import { TAQON_PHONE, TAQON_EMAIL, TAQON_ADDRESS, companyInfo } from '../data/siteData';
import { downloadsApi } from '../api/downloads';

const stamp = () =>
  new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

const money = (v) =>
  `USD ${parseFloat(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function quoteNumber(slug) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const tag = (slug || 'geyser').replace(/[^a-z0-9]/gi, '').slice(0, 5).toUpperCase();
  return `TAQ-GZ-${ymd}-${tag}`;
}

/** Open a printable quotation for a geyser package (API detail shape). */
export function openGeyserQuote(pkg, { surface = 'geyser_detail' } = {}) {
  if (!pkg) return;

  const specRows = [
    { label: 'Capacity', value: `${pkg.capacity_litres} L` },
    { label: 'System', value: pkg.system_type === 'pressure' ? 'Pressure' : 'Gravity' },
    { label: 'Version', value: pkg.is_smart ? 'Smart' : 'Standard' },
    pkg.brand && { label: 'Collector', value: pkg.brand },
  ].filter(Boolean);

  // Itemised cost build-up (only show the lines we have).
  const lines = [
    ['Equipment & materials', pkg.material_cost],
    ['Sundries & consumables', pkg.sundries_cost],
    ['Skilled labour & installation', pkg.labour_cost],
    [`Transport (within ${parseFloat(pkg.distance_km || 10)} km of Harare)`, pkg.transport_cost],
  ].filter(([, v]) => v != null && parseFloat(v) > 0);

  const includes = pkg.whats_included || [];
  const features = pkg.features || [];

  const includesHtml = includes.length
    ? `<section class="block"><h3 class="block-title">What's included</h3>
        <div class="includes-grid">${includes.map((i) => `<div class="include-card">${escapeHtml(i)}</div>`).join('')}</div></section>`
    : '';

  const featuresHtml = (pkg.is_smart && features.length)
    ? `<section class="block"><h3 class="block-title">Smart controller benefits</h3>
        <ul class="feature-list">${features.map((f) => `<li>${escapeHtml(f)}</li>`).join('')}</ul></section>`
    : '';

  const linesHtml = lines
    .map(([label, v]) => `<tr><td>${escapeHtml(label)}</td><td class="amt">${escapeHtml(money(v))}</td></tr>`)
    .join('');

  const qno = quoteNumber(pkg.slug);

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/>
<title>${escapeHtml(pkg.name)} — Taqon Electrico Quotation</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Syne:wght@500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Outfit', system-ui, sans-serif; color: #1A1A1A; background: #FFFBF5; line-height: 1.55; }
  .page { max-width: 880px; margin: 0 auto; background: #FFF; }
  header.hero { background: linear-gradient(135deg, #F26522 0%, #FF8447 100%); color: #FFFBF5; padding: 44px 56px; position: relative; }
  .eyebrow { font-size: 11px; letter-spacing: 3.2px; text-transform: uppercase; font-weight: 600; opacity: .92; }
  .h1 { font-family: 'Syne', sans-serif; font-size: 34px; font-weight: 700; line-height: 1.05; letter-spacing: -.5px; margin-top: 12px; }
  .h1-sub { font-size: 15px; margin-top: 10px; opacity: .92; max-width: 540px; }
  .qmeta { display: flex; gap: 36px; flex-wrap: wrap; margin-top: 22px; }
  .qmeta div span { display: block; font-size: 9.5px; letter-spacing: 1.6px; text-transform: uppercase; opacity: .8; }
  .qmeta div strong { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; }
  .specs { background: #0D0D0D; color: #FFFBF5; padding: 22px 56px; display: flex; gap: 40px; flex-wrap: wrap; }
  .spec-label { font-size: 9.5px; letter-spacing: 2px; text-transform: uppercase; color: #F26522; font-weight: 700; }
  .spec-value { font-family: 'Syne', sans-serif; font-size: 20px; font-weight: 700; }
  .body-content { padding: 36px 56px 0; }
  .accent-bar { width: 56px; height: 3px; background: #F26522; margin-bottom: 16px; }
  .description { font-size: 14px; line-height: 1.7; color: #1A1A1A; max-width: 660px; }
  table.costs { width: 100%; border-collapse: collapse; margin-top: 26px; }
  table.costs td { padding: 12px 4px; border-bottom: 1px solid #F3E9D9; font-size: 13.5px; }
  table.costs td.amt { text-align: right; font-variant-numeric: tabular-nums; color: #1A1A1A; }
  table.costs tr.total td { border-bottom: none; border-top: 2px solid #0D0D0D; padding-top: 16px; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 18px; }
  table.costs tr.total td.amt { color: #F26522; }
  .price-note { font-size: 11px; color: #6B7280; margin-top: 8px; }
  .block { margin-top: 34px; }
  .block-title { font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700; color: #0D0D0D; margin-bottom: 14px; }
  .includes-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .include-card { background: #FFFBF5; border: 1px solid #F3E9D9; padding: 12px 14px; border-radius: 8px; font-size: 13px; color: #0D0D0D; }
  .feature-list { list-style: none; display: grid; grid-template-columns: repeat(2,1fr); gap: 8px 16px; }
  .feature-list li { font-size: 13px; padding-left: 16px; position: relative; }
  .feature-list li::before { content: ""; width: 5px; height: 5px; border-radius: 50%; background: #F26522; position: absolute; left: 0; top: 8px; }
  .cta { margin: 38px 56px 0; padding: 20px 26px; background: #fff7ed; border-left: 4px solid #F26522; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 14px; border-radius: 6px; }
  .cta-title { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 700; color: #0D0D0D; }
  .cta-sub { font-size: 12px; color: #6B7280; margin-top: 4px; }
  .cta-phone { font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: #F26522; }
  footer.brand-footer { background: #0D0D0D; color: #FFFBF5; padding: 34px 56px; margin-top: 44px; }
  .footer-grid { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 34px; }
  .footer-logo { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; }
  .footer-logo .accent { color: #F26522; }
  .footer-tag { font-size: 11px; color: rgba(255,255,255,.55); margin-top: 8px; letter-spacing: 1.4px; text-transform: uppercase; }
  .footer-block-title { font-size: 9.5px; color: #F26522; letter-spacing: 2.2px; text-transform: uppercase; font-weight: 700; margin-bottom: 8px; }
  .footer-line { font-size: 12px; color: rgba(255,255,255,.85); line-height: 1.6; }
  .footer-meta { margin-top: 22px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,.12); font-size: 10px; color: rgba(255,255,255,.45); display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .page { max-width: 100%; } @page { size: A4; margin: 0; } }
</style></head>
<body>
  <div class="page">
    <header class="hero">
      <div class="eyebrow">Solar Geyser Quotation</div>
      <h1 class="h1">${escapeHtml(pkg.name)}</h1>
      <p class="h1-sub">${escapeHtml(pkg.short_description || pkg.description || '')}</p>
      <div class="qmeta">
        <div><span>Quotation no.</span><strong>${escapeHtml(qno)}</strong></div>
        <div><span>Date</span><strong>${escapeHtml(stamp())}</strong></div>
        <div><span>Valid for</span><strong>30 days</strong></div>
      </div>
    </header>

    <div class="specs">
      ${specRows.map((s) => `<div><div class="spec-label">${escapeHtml(s.label)}</div><div class="spec-value">${escapeHtml(s.value)}</div></div>`).join('')}
    </div>

    <div class="body-content">
      <div class="accent-bar"></div>
      <p class="description">${escapeHtml(pkg.description || '')}</p>

      <table class="costs">
        ${linesHtml}
        <tr class="total"><td>Total — supplied &amp; installed</td><td class="amt">${escapeHtml(money(pkg.price))}</td></tr>
      </table>
      <p class="price-note">Prices in USD and include professional installation within ${parseFloat(pkg.distance_km || 10)} km of Harare ($0.65/km beyond). Final pricing is confirmed after a site survey.</p>

      ${includesHtml}
      ${featuresHtml}
    </div>

    <div class="cta">
      <div>
        <div class="cta-title">Ready to go ahead, or have a question?</div>
        <div class="cta-sub">Reply to this quotation or call us to book your installation.</div>
      </div>
      <div class="cta-phone">${escapeHtml(TAQON_PHONE)}</div>
    </div>

    <footer class="brand-footer">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">TAQON <span class="accent">ELECTRICO.</span></div>
          <div class="footer-tag">${escapeHtml(companyInfo?.tagline || 'Customer is King!')}</div>
        </div>
        <div><div class="footer-block-title">Visit / Mail</div><div class="footer-line">${escapeHtml(TAQON_ADDRESS)}</div></div>
        <div><div class="footer-block-title">Reach us</div><div class="footer-line">${escapeHtml(TAQON_PHONE)}<br/>${escapeHtml(TAQON_EMAIL)}<br/>www.taqon.co.zw</div></div>
      </div>
      <div class="footer-meta">
        <span>Generated ${escapeHtml(stamp())} &middot; ${escapeHtml(qno)}</span>
        <span>This quotation is indicative. Final pricing depends on your site survey.</span>
      </div>
    </footer>
  </div>
  <script>setTimeout(function(){ window.print(); }, 350);</script>
</body></html>`;

  const win = window.open('', '_blank');
  if (win) {
    win.document.write(html);
    win.document.close();
  }

  downloadsApi.track({
    kind: 'geyser_quote',
    surface,
    target_slug: pkg.slug || '',
    target_label: pkg.name || '',
    metadata: { price: pkg.price ? String(pkg.price) : '', system: pkg.system_type, variant: pkg.variant },
  });
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
