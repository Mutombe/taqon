/**
 * Post-build SEO + Open Graph prerenderer.
 *
 * The site is a client-side SPA, so crawlers that don't run JavaScript only see
 * the static index.html. After `vite build` this script writes per-route copies
 * of index.html with rich, keyword-heavy SEO baked into the <head> (and a
 * crawlable <noscript> fallback in the body):
 *   - each PRODUCT → its own title, meta description, keyword bank, Product
 *     structured data (with brand + price offer) and OG image, so products get
 *     indexed individually
 *   - solar advisor / inquiry → the Taqon robot promo image
 * It also writes a sitemap.xml (home + key pages + every product + locations),
 * robots.txt, and injects a Product ItemList into the homepage.
 *
 * It never fails the build: if the API is unreachable, products are skipped.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  homepageKeywords, productKeywords, LOCATIONS,
} from './seo-data.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const SITE = 'https://www.taqon.co.zw';
const API = process.env.VITE_API_URL || 'https://taqon-backend.onrender.com';
const ROBOT = `${SITE}/downloads/taqon-robot.jpeg`;

const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Return a link-preview-safe image URL. LinkedIn / WhatsApp / Facebook crawlers
 * do NOT render WebP og:image, so any non-JPEG/PNG image is routed through the
 * weserv image proxy which transcodes to a 1200×1200 white-bg JPEG on the fly.
 * JPEG/PNG/GIF URLs (already crawler-safe) are returned untouched. This affects
 * only the og:image seen by crawlers — on-page images keep their WebP.
 *
 * Once the backend supplies a self-hosted JPEG (og_image_url), prefer that and
 * the proxy is never used for that product.
 */
function crawlerSafeImage(u) {
  if (!u) return ROBOT;
  if (/^https?:\/\/[^?]*\.(jpe?g|png|gif)(\?|$)/i.test(u)) return u;
  const noScheme = u.replace(/^https?:\/\//, '');
  return `https://images.weserv.nl/?url=ssl:${encodeURIComponent(noScheme)}` +
    `&w=1200&h=1200&fit=contain&cbg=white&output=jpg&q=85`;
}

function setMeta(html, key, value) {
  const attr = key.startsWith('og:') ? 'property' : 'name';
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (re.test(html)) return html.replace(re, `$1${esc(value)}$2`);
  return html.replace('</head>', `    <meta ${attr}="${key}" content="${esc(value)}" />\n  </head>`);
}

const injectHead = (html, s) => (s ? html.replace('</head>', `${s}\n  </head>`) : html);
const injectBody = (html, s) => (s ? html.replace('</body>', `${s}\n  </body>`) : html);

function buildHtml(template, { title, description, url, image, w, h, keywords, headExtra, bodyExtra }) {
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
  if (keywords) html = setMeta(html, 'keywords', keywords);
  if (url) {
    html = setMeta(html, 'og:url', url);
    // canonical
    if (/<link rel="canonical"/.test(html)) {
      html = html.replace(/(<link rel="canonical" href=")[^"]*(")/, `$1${esc(url)}$2`);
    } else {
      html = injectHead(html, `    <link rel="canonical" href="${esc(url)}" />`);
    }
  }
  if (image) {
    html = setMeta(html, 'og:image', image);
    html = setMeta(html, 'twitter:image', image);
    html = setMeta(html, 'og:image:width', String(w || 1200));
    html = setMeta(html, 'og:image:height', String(h || 630));
  }
  if (headExtra) html = injectHead(html, headExtra);
  if (bodyExtra) html = injectBody(html, bodyExtra);
  return html;
}

async function writeRoute(route, html) {
  const flat = join(DIST, `${route}.html`);
  await mkdir(dirname(flat), { recursive: true });
  await writeFile(flat, html, 'utf8');
  const dir = join(DIST, route);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), html, 'utf8');
}

function productJsonLd(p, url, img, description) {
  const brand = p.brand?.name || p.brand || '';
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    url,
    description,
    ...(img ? { image: [img] } : {}),
    ...(p.sku ? { sku: p.sku } : {}),
    ...(p.category?.name ? { category: p.category.name } : {}),
    ...(brand ? { brand: { '@type': 'Brand', name: brand } } : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      ...(p.price != null ? { price: String(p.price) } : {}),
      availability: (p.in_stock ?? true) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Taqon Electrico' },
      areaServed: 'Zimbabwe',
    },
  };
  return `    <script type="application/ld+json">${JSON.stringify(ld)}</script>`;
}

function productNoscript(p, url, img, description) {
  const brand = p.brand?.name || p.brand || '';
  return `<noscript><article>` +
    `<h1>${esc(p.name)}</h1>` +
    (img ? `<img src="${esc(img)}" alt="${esc(p.name)} — Taqon Electrico Zimbabwe" width="320" />` : '') +
    `<p>${esc(description)}</p>` +
    (brand ? `<p>Brand: ${esc(brand)}</p>` : '') +
    (p.price != null ? `<p>Price: USD ${esc(String(p.price))}</p>` : '') +
    `<p><a href="${esc(url)}">${esc(p.name)} — buy in Zimbabwe from Taqon Electrico, Harare</a></p>` +
    `</article></noscript>`;
}

function sitemapXml(urls) {
  const today = new Date().toISOString().slice(0, 10);
  const body = urls.map((u) => {
    const loc = typeof u === 'string' ? u : u.loc;
    const priority = typeof u === 'string' ? '0.6' : (u.priority || '0.6');
    return `  <url><loc>${esc(loc)}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
  }).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

const STATIC_PAGES = [
  { loc: `${SITE}/`, priority: '1.0' },
  { loc: `${SITE}/shop`, priority: '0.9' },
  { loc: `${SITE}/packages`, priority: '0.9' },
  { loc: `${SITE}/solar-geysers`, priority: '0.8' },
  { loc: `${SITE}/solutions`, priority: '0.8' },
  { loc: `${SITE}/solar-advisor`, priority: '0.8' },
  { loc: `${SITE}/about`, priority: '0.6' },
  { loc: `${SITE}/contact`, priority: '0.6' },
  { loc: `${SITE}/blog`, priority: '0.7' },
  { loc: `${SITE}/gallery`, priority: '0.6' },
  { loc: `${SITE}/financing`, priority: '0.5' },
  { loc: `${SITE}/certifications`, priority: '0.5' },
  ...[
    'solar-installations', 'electrical-maintenance', 'solar-system-maintenance',
    'borehole-pump-installations', 'electrical-hardware', 'lighting-solutions',
    'solar-geysers', 'gas-geysers',
  ].map((s) => ({ loc: `${SITE}/solutions/${s}`, priority: '0.7' })),
  ...LOCATIONS.map((c) => ({ loc: `${SITE}/solar-installation/${c.toLowerCase()}`, priority: '0.6' })),
];

async function main() {
  let template;
  try {
    template = await readFile(join(DIST, 'index.html'), 'utf8');
  } catch {
    console.warn('[prerender-og] dist/index.html not found — skipping.');
    return;
  }

  let count = 0;

  const robotRoutes = [
    { route: 'solar-advisor', title: 'Solar Advisor | Taqon Electrico Zimbabwe',
      description: 'Find your perfect solar package in Zimbabwe. Pick your appliances and get a personalised solar recommendation with transparent pricing from Taqon Electrico, Harare.' },
    { route: 'inquiry', title: 'Get a Solar Quote | Taqon Electrico Zimbabwe',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation. Solar installers in Harare, Zimbabwe." },
    { route: 'get-quote', title: 'Get a Solar Quote | Taqon Electrico Zimbabwe',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation. Solar installers in Harare, Zimbabwe." },
    { route: 'get-recommendation', title: 'Get a Solar Recommendation | Taqon Electrico Zimbabwe',
      description: "Tell us about your home or business and we'll size a solar system around your real loads. Fast, no obligation. Solar installers in Harare, Zimbabwe." },
  ];
  for (const r of robotRoutes) {
    await writeRoute(r.route, buildHtml(template, {
      title: r.title, description: r.description,
      url: `${SITE}/${r.route}`, image: ROBOT, w: 627, h: 627,
    }));
    count++;
  }

  const sitemapUrls = [...STATIC_PAGES];

  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 45000);
    const res = await fetch(`${API}/api/v1/shop/products/?page_size=500`, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    }).finally(() => clearTimeout(timer));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const products = data.results || data || [];
    const itemList = [];

    for (const p of products) {
      if (!p.slug) continue;
      // Prefer a self-hosted JPEG derivative when the backend provides one;
      // otherwise make the primary image crawler-safe (WebP → JPEG via proxy).
      const rawImg = p.primary_image?.image || p.primary_image?.image_url || ROBOT;
      const img = p.og_image_url || crawlerSafeImage(rawImg);
      const brand = p.brand?.name || p.brand || '';
      const cat = p.category?.name || p.category || 'Solar equipment';
      const url = `${SITE}/shop/${p.slug}/`;
      const description =
        `Buy the ${p.name}${brand ? ` (${brand})` : ''} in Zimbabwe. ${cat} supplied and installed by ` +
        `Taqon Electrico — Zimbabwe's trusted solar company in Harare. Best ${cat.toLowerCase()} price, ` +
        `fast delivery and professional installation across Zimbabwe.`;

      await writeRoute(`shop/${p.slug}`, buildHtml(template, {
        title: `${p.name} | Taqon Electrico Zimbabwe`,
        description,
        keywords: productKeywords(p).join(', '),
        url,
        image: img,
        w: 1200, h: 1200,
        headExtra: productJsonLd(p, url, img, description),
        bodyExtra: productNoscript(p, url, img, description),
      }));
      count++;
      sitemapUrls.push({ loc: url, priority: '0.7' });
      itemList.push({ name: p.name, url });
    }

    // Inject a Product ItemList into the homepage so the catalogue is discoverable.
    if (itemList.length) {
      const ld = {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Taqon Electrico Solar Products',
        itemListElement: itemList.map((it, i) => ({
          '@type': 'ListItem', position: i + 1, name: it.name, url: it.url,
        })),
      };
      let home = await readFile(join(DIST, 'index.html'), 'utf8');
      home = injectHead(home, `    <script type="application/ld+json">${JSON.stringify(ld)}</script>`);
      await writeFile(join(DIST, 'index.html'), home, 'utf8');
    }
    console.log(`[prerender-og] wrote ${products.length} product pages.`);
  } catch (err) {
    console.warn(`[prerender-og] product fetch failed (${err.message}) — products skipped.`);
  }

  // Geyser packages → sitemap (best-effort; non-fatal if the API is down).
  try {
    const res = await fetch(`${API}/api/v1/geysers/packages/`, { headers: { Accept: 'application/json' } });
    if (res.ok) {
      const data = await res.json();
      const geysers = data.results || data || [];
      for (const g of geysers) {
        if (g.slug) sitemapUrls.push({ loc: `${SITE}/solar-geysers/${g.slug}`, priority: '0.7' });
      }
      console.log(`[prerender-og] added ${geysers.length} geyser package URLs to sitemap.`);
    }
  } catch (err) {
    console.warn(`[prerender-og] geyser fetch failed (${err.message}) — skipped in sitemap.`);
  }

  // sitemap.xml + robots.txt
  await writeFile(join(DIST, 'sitemap.xml'), sitemapXml(sitemapUrls), 'utf8');
  await writeFile(
    join(DIST, 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`,
    'utf8',
  );

  console.log(`[prerender-og] done — ${count} routes prerendered, sitemap has ${sitemapUrls.length} URLs.`);
}

main().catch((err) => {
  console.warn('[prerender-og] non-fatal error:', err.message);
});
