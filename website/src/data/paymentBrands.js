// Canonical payment method → brand logo mapping.
// Logos live in `website/public/payment-brands/` and ship as static assets.

export const PAYMENT_BRAND_LOGOS = {
  ecocash:       '/payment-brands/pm_ecocash.jpg',
  onemoney:      '/payment-brands/pm_onemoney.jpg',
  innbucks:      '/payment-brands/pm_innbucks.png',
  zimswitch:     '/payment-brands/pm_zimswitch.png',
  card:          '/payment-brands/pm_visa.jpg',
  bank_transfer: null, // no dedicated brand logo — falls back to a generic glyph
  omari:         '/payment-brands/pm_omari.png',
};

export const PAYMENT_BRAND_LABELS = {
  ecocash:       'EcoCash',
  onemoney:      'OneMoney',
  innbucks:      'InnBucks',
  zimswitch:     'ZimSwitch',
  card:          'Visa / Mastercard',
  bank_transfer: 'Bank Transfer',
  omari:         'O\u2019Mari',
};
