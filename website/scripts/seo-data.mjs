/**
 * Keyword banks transcribed from the Taqon Electrico SEO documents
 * (MASTER SEO DOCUMENT + PRODUCT SEO KEYWORDS). Used to pack heavy, redundant
 * SEO into index.html and every prerendered product page.
 */

export const COMPANY_KEYWORDS = [
  'solar company Zimbabwe', 'solar installers Zimbabwe', 'solar installation Harare',
  'solar systems Zimbabwe', 'solar power Zimbabwe', 'solar energy Zimbabwe',
  'commercial solar Zimbabwe', 'residential solar Zimbabwe', 'solar solutions Zimbabwe',
  'best solar company Zimbabwe', 'solar experts Zimbabwe', 'solar contractors Harare',
  'solar engineering Zimbabwe', 'solar power systems Harare', 'Taqon Electrico',
];

export const CATEGORY_KEYWORDS = {
  panel: [
    'solar panels Zimbabwe', 'solar panels Harare', 'buy solar panels Zimbabwe',
    'best solar panels Zimbabwe', 'high efficiency solar panels', 'solar panel installation Zimbabwe',
    'solar panel prices Zimbabwe', 'commercial solar panels', 'residential solar panels',
    'solar modules Zimbabwe', 'best solar panels for homes Zimbabwe', 'solar panel suppliers Harare',
    'solar panels for businesses Zimbabwe', 'high power solar panels Zimbabwe', 'solar panel installers Harare',
  ],
  battery: [
    'solar batteries Zimbabwe', 'lithium batteries Zimbabwe', 'lithium ion batteries Zimbabwe',
    'LiFePO4 batteries Zimbabwe', 'solar battery suppliers Zimbabwe', 'battery storage systems Zimbabwe',
    'solar backup batteries', 'deep cycle lithium batteries', 'home battery backup Zimbabwe',
    'best solar battery Zimbabwe', 'lithium battery price Zimbabwe', 'solar battery installation Harare',
    'battery backup for load shedding', 'battery storage for solar systems',
  ],
  inverter: [
    'solar inverter Zimbabwe', 'hybrid inverter Zimbabwe', 'solar inverter suppliers Zimbabwe',
    'hybrid solar inverter', 'off-grid inverter', 'grid-tied inverter', 'solar inverter Harare',
    'best solar inverter Zimbabwe', 'hybrid inverter price Zimbabwe', 'solar inverter installation Harare',
    'home solar inverter Zimbabwe', 'commercial solar inverter Zimbabwe',
  ],
};

export const BRAND_KEYWORDS = {
  sunsynk: [
    'Sunsynk Zimbabwe', 'Sunsynk inverter Zimbabwe', 'Sunsynk 5kVA', 'Sunsynk 8kVA', 'Sunsynk 10kVA',
    'Sunsynk 12kVA', 'Sunsynk 16kVA', 'Sunsynk 20kVA', 'Sunsynk batteries', 'Sunsynk solar systems',
    'Sunsynk inverter price Zimbabwe', 'buy Sunsynk inverter Harare', 'Sunsynk installer Zimbabwe',
    'Sunsynk battery compatibility', 'Sunsynk hybrid inverter Zimbabwe',
  ],
  deye: [
    'Deye Zimbabwe', 'Deye inverter Zimbabwe', 'Deye hybrid inverter', 'Deye 5kW inverter',
    'Deye 8kW inverter', 'Deye 12kW inverter', 'Deye lithium battery', 'Deye solar systems',
    'Deye inverter price Zimbabwe', 'buy Deye inverter Harare', 'Deye installer Zimbabwe',
    'best Deye inverter Zimbabwe', 'Deye hybrid systems',
  ],
  growatt: [
    'Growatt Zimbabwe', 'Growatt inverter Zimbabwe', 'Growatt SPF 3000TL', 'Growatt 6kVA inverter',
    'Growatt hybrid inverter', 'Growatt inverter price Zimbabwe', 'buy Growatt inverter Harare',
    'Growatt solar systems Zimbabwe',
  ],
  kodak: [
    'Kodak inverter Zimbabwe', 'Kodak solar inverter', 'Kodak OG Plus', 'Kodak inverter price Zimbabwe',
    'Kodak hybrid inverter',
  ],
  must: [
    'Must inverter Zimbabwe', 'Must solar inverter', 'Must 3kVA inverter', 'Must inverter price Zimbabwe',
  ],
  pylontech: [
    'Pylontech Zimbabwe', 'Pylontech batteries Zimbabwe', 'Pylontech US5000', 'Pylontech US3000',
    'Pylontech UP2500', 'Pylontech lithium batteries', 'Pylontech battery price Zimbabwe',
    'buy Pylontech batteries Harare', 'Pylontech installer Zimbabwe', 'best lithium batteries Zimbabwe',
  ],
  dyness: [
    'Dyness Zimbabwe', 'Dyness batteries Zimbabwe', 'Dyness lithium battery', 'Dyness 100Ah battery',
    'Dyness 200Ah battery', 'Dyness 280Ah battery', 'Dyness battery price Zimbabwe',
    'buy Dyness batteries Harare', 'Dyness installer Zimbabwe',
  ],
  jinko: [
    'Jinko solar panels Zimbabwe', 'Jinko solar Harare', 'Jinko 620W panel', 'Jinko bifacial panel',
    'Jinko solar supplier Zimbabwe', 'Jinko solar panel price Zimbabwe', 'buy Jinko panels Harare',
    'best Jinko solar panel Zimbabwe',
  ],
  'ja solar': [
    'JA Solar Zimbabwe', 'JA Solar panels Zimbabwe', 'JA Solar 585W', 'JA Solar bifacial panel',
    'JA Solar double glass module', 'JA Solar panel price Zimbabwe', 'buy JA Solar panels Harare',
    'JA Solar installer Zimbabwe',
  ],
  victron: [
    'Victron Energy Zimbabwe', 'Victron inverter Zimbabwe', 'Victron solar Zimbabwe',
  ],
};

export const SERVICE_KEYWORDS = [
  'home solar installation Zimbabwe', 'residential solar systems', 'solar backup for homes',
  'load shedding solutions Zimbabwe', 'solar power for houses', 'best solar system for home Zimbabwe',
  'commercial solar Zimbabwe', 'business solar systems', 'office solar systems',
  'commercial solar installation', 'industrial solar systems', 'solar systems for businesses',
  'solar for factories Zimbabwe', 'school solar systems Zimbabwe', 'solar for schools',
  'school backup power systems', 'farm solar systems Zimbabwe', 'agricultural solar systems',
  'solar irrigation Zimbabwe', 'solar power for farms', 'solar borehole Zimbabwe', 'solar borehole pumps',
  'borehole solar systems', 'water pumping solar systems', 'service station solar systems',
  'fuel station solar systems', 'petrol station solar installation', 'energy management systems',
  'office solar installation Zimbabwe', 'industrial solar Zimbabwe', 'factory solar systems',
  'warehouse solar installation', 'manufacturing solar systems',
];

export const LOCATIONS = [
  'Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Kwekwe', 'Masvingo', 'Chinhoyi',
  'Marondera', 'Kadoma', 'Bindura',
];

export const LOCATION_KEYWORDS = LOCATIONS.flatMap((c) => [
  `solar ${c}`, `solar installation ${c}`, `solar installer ${c}`, `solar company ${c}`,
]);

export const BLOG_KEYWORDS = [
  'how many solar panels do I need', 'best solar battery Zimbabwe', 'Sunsynk vs Deye',
  'solar battery sizing guide', 'solar inverter sizing guide', 'how solar works',
  'how much solar costs in Zimbabwe', 'solar return on investment', 'solar for boreholes',
  'solar for schools', 'solar for farms', 'solar for businesses', 'load shedding solutions Zimbabwe',
  'lithium battery buying guide', 'solar panel buying guide',
];

export const ALL_BRANDS = [
  'Sunsynk', 'Deye', 'Growatt', 'Kodak', 'Must', 'Pylontech', 'Dyness', 'Jinko Solar',
  'JA Solar', 'Victron Energy', 'Sigenergy',
];

export const SERVICES = [
  'Solar installation', 'Residential solar', 'Commercial solar', 'Industrial solar',
  'School solar systems', 'Farm & agricultural solar', 'Solar borehole pumping',
  'Service station solar', 'Solar inverters', 'Solar batteries', 'Solar panels',
  'Solar maintenance', 'Electrical maintenance', 'Solar geysers', 'Gas geysers',
];

/** All homepage keywords as a single de-duplicated list. */
export function homepageKeywords() {
  const all = [
    ...COMPANY_KEYWORDS,
    ...CATEGORY_KEYWORDS.panel, ...CATEGORY_KEYWORDS.inverter, ...CATEGORY_KEYWORDS.battery,
    ...Object.values(BRAND_KEYWORDS).flat(),
    ...SERVICE_KEYWORDS, ...LOCATION_KEYWORDS, ...BLOG_KEYWORDS,
  ];
  return [...new Set(all)];
}

const CAT_OF = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('panel') || n.includes('module')) return 'panel';
  if (n.includes('inverter')) return 'inverter';
  if (n.includes('batter')) return 'battery';
  return null;
};

const BRAND_OF = (name = '') => {
  const n = name.toLowerCase();
  return Object.keys(BRAND_KEYWORDS).find((k) => n.includes(k));
};

/** Keyword string for a single product, blending its brand + category banks. */
export function productKeywords(p) {
  const brandName = p.brand?.name || p.brand || '';
  const catName = p.category?.name || p.category || '';
  const out = [p.name];
  if (brandName) out.push(brandName, `${brandName} Zimbabwe`, `buy ${brandName} Harare`, `${brandName} price Zimbabwe`);
  const bk = BRAND_OF(brandName);
  if (bk) out.push(...BRAND_KEYWORDS[bk]);
  const ck = CAT_OF(catName);
  if (ck) out.push(...CATEGORY_KEYWORDS[ck]);
  out.push(`buy ${p.name} Zimbabwe`, `${p.name} price Zimbabwe`, `${p.name} Harare`, 'Taqon Electrico');
  return [...new Set(out)];
}
