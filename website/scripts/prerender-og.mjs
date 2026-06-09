/**
 * Post-build Open Graph prerenderer.
 *
 * The site is a client-side SPA, so social crawlers (WhatsApp, Facebook, X)
 * that don't run JavaScript only ever see the static index.html. This script
 * runs after `vite build` and writes per-route copies of index.html with the
 * right OG/Twitter tags baked in, so a shared link shows the correct image:
 *   - each product → its own photo + name
 *   - solar advisor / inquiry → the Taqon robot image
 * The generated files load the same JS bundle, so real users still get the
 * full SPA; only the <head> meta differs (which is all the crawler reads).
 *
 * It never fails the build: if the API is unreachable, products are skipped
 * and the static default (robot image) still applies site-wide.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SITE = 'https://www.taqon.co.zw';
const API = process.env.VITE_API_URL || 'https://taqon-backend.onrender.com';
const ROBOT = `${SITE}/downloads/taqon-robot.jpeg`;

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Replace the content of a single <meta property|name="key"> tag.
function setMeta(html, key, value) {
  const attr = key.startsWith('og:') ? 'property' : 'name';
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`);
  // Tag not present in template — inject before </head>.
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`);
}

function buildHtml(template, { title, description, url, image, w, h }) {
  let html = template;
  if (title) {
    html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
    html = setMeta(html, 'og:title', title);
    html = setMeta(html, 'twitter:title', title);
  }
  if (description) {
    html = html.replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(description)}$2`);
    html = setMeta(html, 'og:description', description);
    html = setMeta(html, 'twitter:description', description);
  }
  if (url) html = setMeta(html, 'og:url', url);
  if (image) {
    html = setMeta(html, 'og:image', image);
    html = setMeta(html, 'twitter:image', image);
    html = setMeta(html, 'og:image:width', String(w || 1200));
    html = setMeta(html, 'og:image:height', String(h || 630));
  }
  return html;
}

async function writeRoute(route, html) {
  const dir = join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}

async function main() {
  let template;
  try {
    template = await readFile(join(DIST, 'index.html'), 'utf8');
  } catch {
    console.warn('[prerender-og] dist/index.html not found — skipping.');
    return;
  }

  let count = 0;

  // Static, brand-image routes (solar advisor + inquiry family).
  const robotRoutes = [
    { route: 'solar-advisor', title: 'Solar Advisor | Taqon Electrico',
      description: 'Find your perfect solar package. Pick your appliances and get a personalised recommendation with transparent pricing.' },
    { route: 'inquiry', title: 'Get a Quote | Taqon Electrico',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation." },
    { route: 'get-quote', title: 'Get a Quote | Taqon Electrico',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation." },
    { route: 'get-recommendation', title: 'Get a Recommendation | Taqon Electrico',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation." },
  ];
  for (const r of robotRoutes) {
    const html = buildHtml(template, {
      title: r.title, description: r.description,
      url: `${SITE}/${r.route}`, image: ROBOT, w: 627, h: 627,
    });
    await writeRoute(r.route, html);
    count++;
  }

  // Per-product routes — each shows its own photo.
  try {
    // Cap the wait so a cold backend (Render free tier) can't hang the deploy.
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const res = await fetch(`${API}/api/v1/shop/products/?page_size=200`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const products = data.results || data || [];
    for (const p of products) {
      if (!p.slug) continue;
      const img = p.primary_image?.image || p.primary_image?.image_url || ROBOT;
      const bits = [p.brand?.name, p.category?.name].filter(Boolean).join(' · ');
      const description = `${p.name}${bits ? ` — ${bits}` : ''}. Quality solar equipment from Taqon Electrico, Zimbabwe.`;
      const html = buildHtml(template, {
        title: `${p.name} | Taqon Electrico`,
        description,
        url: `${SITE}/shop/${p.slug}`,
        image: img,
        w: 1200, h: 1200,
      });
      await writeRoute(`shop/${p.slug}`, html);
      count++;
    }
    console.log(`[prerender-og] wrote ${products.length} product pages.`);
  } catch (err) {
    console.warn(`[prerender-og] product fetch failed (${err.message}) — products will use the site default image.`);
  }

  console.log(`[prerender-og] done — ${count} routes prerendered.`);
}

main().catch((err) => {
  // Never break the deploy over link previews.
  console.warn('[prerender-og] non-fatal error:', err.message);
});
