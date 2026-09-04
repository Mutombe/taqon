---
name: Gem Design System
description: Solar package cards use a gem-stone visual identity system — each family mapped to a precious stone with unique accent colors, gradients, and shimmer effects
type: project
---

Solar package families now use a "Gem Collection" design system where each family is mapped to a precious stone identity.

**Why:** User wanted premium, collectible, beautiful package cards that look like rare stones — not plain white boxes. Each of the 7+ families needs to be instantly visually distinguishable.

**How to apply:**
- Family identity config: `src/data/gemFamilies.js` — contains `GEM_FAMILIES`, `TIER_GEMS`, `getGemFamily()`, `getGemByKva()`
- CSS animations: `src/index.css` — `.gem-card`, `.gem-shimmer`, `.gem-glow`, `.gem-rec-card`, `.gem-family-header` classes
- Components: `src/components/GemPackageCard.jsx`, `src/components/GemFamilySection.jsx`, `src/components/GemRecommendationCard.jsx`
- Used on: Packages page, FamilyDetail page, SolarAdvisor recommendation cards

Family-to-gem mapping:
- Home Economy (1kVA) = Citrine (amber/gold)
- Home Quick Access (1.5kVA) = Peridot (lime/green)
- Home Luxury (3kVA) = Sapphire (blue)
- Home Luxury Beta (5kVA) = Amethyst (violet/purple)
- Home Deluxe (5kVA) = Emerald (emerald/teal)
- 8kVA Ultra Power = Ruby (red)
- 10kVA Premium Power = Tanzanite (indigo)
- 12kVA ProPower = Alexandrite (cyan)
- 16kVA MasterPower = Black Diamond (brand orange)
- 20-24kVA UltraMax = Imperial Topaz (pink/rose)

Tier recommendation gems: Budget=Topaz(sky), Recommended=Fire Opal(orange), Excellent=Emerald(green)

**Overflow pattern for badges:** `.gem-rec-card` uses `overflow: visible` (not hidden) so that floating badges positioned with negative top (e.g., `-top-3`) aren't clipped. A `.gem-rec-inner` wrapper (absolute, inset-0, border-radius: inherit, overflow: hidden) contains the gradient + shimmer instead. If `.gem-card` ever needs a floating badge, apply the same pattern.
