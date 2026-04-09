/**
 * Gem Family Identity System
 *
 * Each solar package family is mapped to a precious stone identity,
 * giving it a unique visual signature across the platform.
 * Colors are chosen for:
 *   - Visual distinction between families
 *   - WCAG AA contrast on both light and dark backgrounds
 *   - Harmony with the taqon-orange (#F26522) brand color
 *   - Gem-like richness that conveys premium value
 */

export const GEM_FAMILIES = {
  // ── Home Economy (1kVA) — Citrine: warm golden yellow, entry-level warmth
  'home-economy': {
    gem: 'Citrine',
    slug: 'home-economy',
    accent: '#E5A835',        // warm gold
    accentLight: '#FDF3DC',   // pale gold tint
    accentDark: '#B8861A',    // deep gold
    gradient: 'from-amber-400/20 via-yellow-300/10 to-amber-500/20',
    gradientSolid: 'from-amber-400 to-yellow-500',
    glowColor: 'rgba(229, 168, 53, 0.35)',
    glowColorSubtle: 'rgba(229, 168, 53, 0.15)',
    borderColor: 'border-amber-300/40 dark:border-amber-400/25',
    badgeBg: 'bg-amber-100 dark:bg-amber-500/15',
    badgeText: 'text-amber-700 dark:text-amber-300',
    specBg: 'bg-amber-50/80 dark:bg-amber-500/8',
    headerGradient: 'from-amber-500/10 via-yellow-400/5 to-transparent',
    shimmerColor: 'rgba(229, 168, 53, 0.3)',
    ringColor: 'ring-amber-400/30',
  },

  // ── Home Quick Access (1.5kVA) — Peridot: fresh olive green, accessible energy
  'home-quick-access': {
    gem: 'Peridot',
    slug: 'home-quick-access',
    accent: '#7CB342',
    accentLight: '#EDF6E1',
    accentDark: '#558B2F',
    gradient: 'from-lime-400/20 via-green-300/10 to-lime-500/20',
    gradientSolid: 'from-lime-500 to-green-500',
    glowColor: 'rgba(124, 179, 66, 0.35)',
    glowColorSubtle: 'rgba(124, 179, 66, 0.15)',
    borderColor: 'border-lime-300/40 dark:border-lime-400/25',
    badgeBg: 'bg-lime-100 dark:bg-lime-500/15',
    badgeText: 'text-lime-700 dark:text-lime-300',
    specBg: 'bg-lime-50/80 dark:bg-lime-500/8',
    headerGradient: 'from-lime-500/10 via-green-400/5 to-transparent',
    shimmerColor: 'rgba(124, 179, 66, 0.3)',
    ringColor: 'ring-lime-400/30',
  },

  // ── Home Luxury (3kVA) — Sapphire: deep trustworthy blue, the popular choice
  'home-luxury': {
    gem: 'Sapphire',
    slug: 'home-luxury',
    accent: '#2563EB',
    accentLight: '#DBEAFE',
    accentDark: '#1D4ED8',
    gradient: 'from-blue-500/20 via-indigo-400/10 to-blue-600/20',
    gradientSolid: 'from-blue-500 to-indigo-500',
    glowColor: 'rgba(37, 99, 235, 0.35)',
    glowColorSubtle: 'rgba(37, 99, 235, 0.15)',
    borderColor: 'border-blue-300/40 dark:border-blue-400/25',
    badgeBg: 'bg-blue-100 dark:bg-blue-500/15',
    badgeText: 'text-blue-700 dark:text-blue-300',
    specBg: 'bg-blue-50/80 dark:bg-blue-500/8',
    headerGradient: 'from-blue-500/10 via-indigo-400/5 to-transparent',
    shimmerColor: 'rgba(37, 99, 235, 0.3)',
    ringColor: 'ring-blue-400/30',
  },

  // ── Home Luxury Beta (5kVA) — Amethyst: rich purple, premium versatility
  'home-luxury-beta': {
    gem: 'Amethyst',
    slug: 'home-luxury-beta',
    accent: '#8B5CF6',
    accentLight: '#EDE9FE',
    accentDark: '#7C3AED',
    gradient: 'from-violet-500/20 via-purple-400/10 to-violet-600/20',
    gradientSolid: 'from-violet-500 to-purple-600',
    glowColor: 'rgba(139, 92, 246, 0.35)',
    glowColorSubtle: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'border-violet-300/40 dark:border-violet-400/25',
    badgeBg: 'bg-violet-100 dark:bg-violet-500/15',
    badgeText: 'text-violet-700 dark:text-violet-300',
    specBg: 'bg-violet-50/80 dark:bg-violet-500/8',
    headerGradient: 'from-violet-500/10 via-purple-400/5 to-transparent',
    shimmerColor: 'rgba(139, 92, 246, 0.3)',
    ringColor: 'ring-violet-400/30',
  },

  // ── Home Deluxe (5kVA) — Emerald: lush green, true independence
  'home-deluxe': {
    gem: 'Emerald',
    slug: 'home-deluxe',
    accent: '#059669',
    accentLight: '#D1FAE5',
    accentDark: '#047857',
    gradient: 'from-emerald-500/20 via-teal-400/10 to-emerald-600/20',
    gradientSolid: 'from-emerald-500 to-teal-500',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    glowColorSubtle: 'rgba(5, 150, 105, 0.15)',
    borderColor: 'border-emerald-300/40 dark:border-emerald-400/25',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    specBg: 'bg-emerald-50/80 dark:bg-emerald-500/8',
    headerGradient: 'from-emerald-500/10 via-teal-400/5 to-transparent',
    shimmerColor: 'rgba(5, 150, 105, 0.3)',
    ringColor: 'ring-emerald-400/30',
  },

  // ── 8kVA Ultra Power — Ruby: bold red, commercial power
  '8kva-ultra-power': {
    gem: 'Ruby',
    slug: '8kva-ultra-power',
    accent: '#DC2626',
    accentLight: '#FEE2E2',
    accentDark: '#B91C1C',
    gradient: 'from-red-500/20 via-rose-400/10 to-red-600/20',
    gradientSolid: 'from-red-500 to-rose-600',
    glowColor: 'rgba(220, 38, 38, 0.35)',
    glowColorSubtle: 'rgba(220, 38, 38, 0.15)',
    borderColor: 'border-red-300/40 dark:border-red-400/25',
    badgeBg: 'bg-red-100 dark:bg-red-500/15',
    badgeText: 'text-red-700 dark:text-red-300',
    specBg: 'bg-red-50/80 dark:bg-red-500/8',
    headerGradient: 'from-red-500/10 via-rose-400/5 to-transparent',
    shimmerColor: 'rgba(220, 38, 38, 0.3)',
    ringColor: 'ring-red-400/30',
  },

  // ── 10kVA Premium Power — Tanzanite: vivid blue-violet, smart commercial
  '10kva-premium-power': {
    gem: 'Tanzanite',
    slug: '10kva-premium-power',
    accent: '#6366F1',
    accentLight: '#E0E7FF',
    accentDark: '#4F46E5',
    gradient: 'from-indigo-500/20 via-blue-400/10 to-indigo-600/20',
    gradientSolid: 'from-indigo-500 to-blue-600',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    glowColorSubtle: 'rgba(99, 102, 241, 0.15)',
    borderColor: 'border-indigo-300/40 dark:border-indigo-400/25',
    badgeBg: 'bg-indigo-100 dark:bg-indigo-500/15',
    badgeText: 'text-indigo-700 dark:text-indigo-300',
    specBg: 'bg-indigo-50/80 dark:bg-indigo-500/8',
    headerGradient: 'from-indigo-500/10 via-blue-400/5 to-transparent',
    shimmerColor: 'rgba(99, 102, 241, 0.3)',
    ringColor: 'ring-indigo-400/30',
  },

  // ── 12kVA ProPower — Alexandrite: teal-cyan, professional-grade
  '12kva-propower': {
    gem: 'Alexandrite',
    slug: '12kva-propower',
    accent: '#0891B2',
    accentLight: '#CFFAFE',
    accentDark: '#0E7490',
    gradient: 'from-cyan-500/20 via-teal-400/10 to-cyan-600/20',
    gradientSolid: 'from-cyan-500 to-teal-500',
    glowColor: 'rgba(8, 145, 178, 0.35)',
    glowColorSubtle: 'rgba(8, 145, 178, 0.15)',
    borderColor: 'border-cyan-300/40 dark:border-cyan-400/25',
    badgeBg: 'bg-cyan-100 dark:bg-cyan-500/15',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    specBg: 'bg-cyan-50/80 dark:bg-cyan-500/8',
    headerGradient: 'from-cyan-500/10 via-teal-400/5 to-transparent',
    shimmerColor: 'rgba(8, 145, 178, 0.3)',
    ringColor: 'ring-cyan-400/30',
  },

  // ── 16kVA MasterPower — Black Diamond: sophisticated dark, enterprise authority
  '16kva-masterpower': {
    gem: 'Black Diamond',
    slug: '16kva-masterpower',
    accent: '#F26522',         // uses brand orange on dark surface
    accentLight: '#FFF7ED',
    accentDark: '#EA580C',
    gradient: 'from-orange-500/20 via-amber-400/10 to-orange-600/20',
    gradientSolid: 'from-orange-500 to-amber-500',
    glowColor: 'rgba(242, 101, 34, 0.35)',
    glowColorSubtle: 'rgba(242, 101, 34, 0.15)',
    borderColor: 'border-orange-300/40 dark:border-orange-400/25',
    badgeBg: 'bg-orange-100 dark:bg-orange-500/15',
    badgeText: 'text-orange-700 dark:text-orange-300',
    specBg: 'bg-orange-50/80 dark:bg-orange-500/8',
    headerGradient: 'from-orange-500/10 via-amber-400/5 to-transparent',
    shimmerColor: 'rgba(242, 101, 34, 0.3)',
    ringColor: 'ring-orange-400/30',
  },

  // ── 20-24kVA UltraMax — Imperial Topaz: radiant warm rose-gold, the pinnacle
  '20-24kva-ultramax': {
    gem: 'Imperial Topaz',
    slug: '20-24kva-ultramax',
    accent: '#DB2777',
    accentLight: '#FCE7F3',
    accentDark: '#BE185D',
    gradient: 'from-pink-500/20 via-rose-400/10 to-pink-600/20',
    gradientSolid: 'from-pink-500 to-rose-600',
    glowColor: 'rgba(219, 39, 119, 0.35)',
    glowColorSubtle: 'rgba(219, 39, 119, 0.15)',
    borderColor: 'border-pink-300/40 dark:border-pink-400/25',
    badgeBg: 'bg-pink-100 dark:bg-pink-500/15',
    badgeText: 'text-pink-700 dark:text-pink-300',
    specBg: 'bg-pink-50/80 dark:bg-pink-500/8',
    headerGradient: 'from-pink-500/10 via-rose-400/5 to-transparent',
    shimmerColor: 'rgba(219, 39, 119, 0.3)',
    ringColor: 'ring-pink-400/30',
  },
};

/**
 * Resolve a gem identity from a family slug.
 * Falls back through common slug variations, then to a neutral default.
 */
export function getGemFamily(familySlug) {
  if (!familySlug) return DEFAULT_GEM;

  const slug = familySlug.toLowerCase().trim();

  // Direct match
  if (GEM_FAMILIES[slug]) return GEM_FAMILIES[slug];

  // Partial matching — check if slug contains a known key
  for (const [key, gem] of Object.entries(GEM_FAMILIES)) {
    if (slug.includes(key) || key.includes(slug)) return gem;
  }

  // Keyword matching for API family names
  const keywordMap = {
    economy: 'home-economy',
    'quick-access': 'home-quick-access',
    'quick access': 'home-quick-access',
    luxury: 'home-luxury',
    'luxury-beta': 'home-luxury-beta',
    'luxury beta': 'home-luxury-beta',
    deluxe: 'home-deluxe',
    ultra: '8kva-ultra-power',
    premium: '10kva-premium-power',
    propower: '12kva-propower',
    'pro-power': '12kva-propower',
    'pro power': '12kva-propower',
    masterpower: '16kva-masterpower',
    'master-power': '16kva-masterpower',
    'master power': '16kva-masterpower',
    ultramax: '20-24kva-ultramax',
    'ultra-max': '20-24kva-ultramax',
    'ultra max': '20-24kva-ultramax',
  };

  for (const [keyword, familyKey] of Object.entries(keywordMap)) {
    if (slug.includes(keyword)) return GEM_FAMILIES[familyKey];
  }

  return DEFAULT_GEM;
}

/**
 * Resolve gem by kVA rating as a secondary matcher.
 */
export function getGemByKva(kvaRating) {
  if (!kvaRating) return DEFAULT_GEM;
  const kva = parseFloat(kvaRating);
  if (kva <= 1) return GEM_FAMILIES['home-economy'];
  if (kva <= 1.5) return GEM_FAMILIES['home-quick-access'];
  if (kva <= 3) return GEM_FAMILIES['home-luxury'];
  if (kva <= 5) return GEM_FAMILIES['home-luxury-beta'];
  if (kva <= 5.5) return GEM_FAMILIES['home-deluxe'];
  if (kva <= 8) return GEM_FAMILIES['8kva-ultra-power'];
  if (kva <= 10) return GEM_FAMILIES['10kva-premium-power'];
  if (kva <= 12) return GEM_FAMILIES['12kva-propower'];
  if (kva <= 16) return GEM_FAMILIES['16kva-masterpower'];
  return GEM_FAMILIES['20-24kva-ultramax'];
}

/** Neutral fallback */
const DEFAULT_GEM = {
  gem: 'Quartz',
  slug: 'default',
  accent: '#6B7280',
  accentLight: '#F3F4F6',
  accentDark: '#4B5563',
  gradient: 'from-gray-400/20 via-gray-300/10 to-gray-500/20',
  gradientSolid: 'from-gray-400 to-gray-500',
  glowColor: 'rgba(107, 114, 128, 0.35)',
  glowColorSubtle: 'rgba(107, 114, 128, 0.15)',
  borderColor: 'border-gray-300/40 dark:border-gray-400/25',
  badgeBg: 'bg-gray-100 dark:bg-gray-500/15',
  badgeText: 'text-gray-700 dark:text-gray-300',
  specBg: 'bg-gray-50/80 dark:bg-gray-500/8',
  headerGradient: 'from-gray-500/10 via-gray-400/5 to-transparent',
  shimmerColor: 'rgba(107, 114, 128, 0.3)',
  ringColor: 'ring-gray-400/30',
};

/**
 * Tier-specific gem overrides for the SolarAdvisor recommendation cards.
 * These overlay the family gem with tier-specific semantic color.
 */
export const TIER_GEMS = {
  budget: {
    label: 'Budget',
    gem: 'Topaz',
    accent: '#0EA5E9',
    glowColor: 'rgba(14, 165, 233, 0.3)',
    glowColorSubtle: 'rgba(14, 165, 233, 0.12)',
    gradient: 'from-sky-500/15 via-blue-400/8 to-sky-600/15',
    borderColor: 'border-sky-300/40 dark:border-sky-400/25',
    badgeBg: 'bg-sky-100 dark:bg-sky-500/15',
    badgeText: 'text-sky-700 dark:text-sky-300',
    specBg: 'bg-sky-50/80 dark:bg-sky-500/8',
    shimmerColor: 'rgba(14, 165, 233, 0.25)',
    ringColor: 'ring-sky-400/30',
  },
  good_fit: {
    label: 'Recommended',
    gem: 'Fire Opal',
    accent: '#F26522',
    glowColor: 'rgba(242, 101, 34, 0.4)',
    glowColorSubtle: 'rgba(242, 101, 34, 0.15)',
    gradient: 'from-orange-500/20 via-amber-400/10 to-orange-600/20',
    borderColor: 'border-taqon-orange/40 dark:border-taqon-orange/30',
    badgeBg: 'bg-taqon-orange/10',
    badgeText: 'text-taqon-orange',
    specBg: 'bg-orange-50/80 dark:bg-orange-500/8',
    shimmerColor: 'rgba(242, 101, 34, 0.3)',
    ringColor: 'ring-taqon-orange/30',
  },
  excellent: {
    label: 'Excellent',
    gem: 'Emerald',
    accent: '#059669',
    glowColor: 'rgba(5, 150, 105, 0.35)',
    glowColorSubtle: 'rgba(5, 150, 105, 0.12)',
    gradient: 'from-emerald-500/15 via-teal-400/8 to-emerald-600/15',
    borderColor: 'border-emerald-300/40 dark:border-emerald-400/25',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-500/15',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    specBg: 'bg-emerald-50/80 dark:bg-emerald-500/8',
    shimmerColor: 'rgba(5, 150, 105, 0.25)',
    ringColor: 'ring-emerald-400/30',
  },
};
