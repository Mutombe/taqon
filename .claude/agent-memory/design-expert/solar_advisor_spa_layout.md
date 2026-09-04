---
name: Solar Advisor SPA Layout
description: SolarAdvisor uses a split-panel SPA layout on desktop (all inputs left, sticky preview right) and step wizard on mobile
type: project
---

SolarAdvisor page was redesigned from a 4-step wizard to a split-panel SPA layout on desktop.

**Why:** Users lost context switching between wizard steps. Seeing inputs and results simultaneously reduces cognitive load and makes the flow feel like a single-page app.

**How to apply:**
- Desktop (lg:+): `hidden lg:flex lg:gap-8 lg:items-start` — left column (flex-1) has all 3 input sections stacked with numbered headers; right column (w-[380px]) is a sticky sidebar with PP/EP meters, selected appliances list, map preview, analysis terminal, and preferences summary
- Mobile (<lg:): `lg:hidden` wraps the original AnimatePresence step-by-step wizard (4 steps) with MobileBottomBar
- The step indicators in the hero are hidden on desktop (`lg:hidden`) since steps don't exist in the SPA layout
- Recommendation cards grid uses `md:items-start` (not stretch) so the highlighted card with "Why this matches you" content can be taller than budget/excellent cards
- `h-full` was removed from `.gem-rec-card` to allow natural card heights
- The old `DesktopSidebar` component was removed — sidebar is now inline in the right column
- Right sidebar uses `position: sticky` with `top: SIDEBAR_TOP` and scrollable overflow
- Desktop results section appears in the left column below inputs when `step === 4 && analysisComplete`
- Desktop client details form uses a 2x2 grid layout for compactness
