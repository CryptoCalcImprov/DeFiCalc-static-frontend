# DeFiCalc.io Redesign Concept

## 1. High-Level Vision

### Theme and Feel
- **Modern dark mode:** Adopt a deep navy backdrop with subtle gradients inspired by Stohn to frame data visualizations and CTAs.
- **Vibrant blues and greens:** Use saturated blues (#0D3B66, #1D69A3) and teals (#14B8A6, #28C9B9) for highlights, supported by occasional PancakeSwap-inspired pastels for warmth.
- **Familiar but upgraded:** Borrow trusted layout patterns from CoinMarketCap/CoinGecko while elevating them with refined typography, spacing, and animation polish.
- **Accessible and inviting:** Maintain high-contrast text, approachable microcopy, and iconography that demystifies DeFi concepts for newcomers.
- **Flexible platform:** Design modular regions that can accommodate future modules like Calculator Sandbox and Nova assistant without major rework.

## 2. Layout & Page Structure

### 2.1 Navigation Bar
- Sticky header with logo, links (Overview, Markets, Protocols, Toolkit, Insights), and a gradient "Launch App" CTA.
- Secondary "View Toolkit" button linking to calculators.
- Mobile: collapse into hamburger-triggered drawer; keep "Launch App" as floating action button.

### 2.2 Hero Section
- Two-column hero: copy-led left column, interactive Strategy Monitor widget on right.
- Headline example: "Make sharper DeFi moves with live market, protocol, and risk analytics in one place."
- Supporting copy explains actionable insights for novices and pros.
- Strategy Monitor shows strategies (e.g., Stable Yield Loop, ETH Liquid Staking) with Net APR, Rewards, Health, and risk pills (Safe/Balanced/High) using semantic colors.
- Primary CTA: **Explore Dashboard** (gradient, animated hover). Secondary CTA: **View Market Data** (outlined accent).

### 2.3 Protocol Leaders Section
- Responsive card grid (2–4 columns) featuring protocol logo, chain badge, category pill, TVL + 24h change, and brief governance note.
- Sorting/filtering controls for TVL, category, growth, chain, governance.
- Sponsored placements labeled clearly yet styled consistently.

### 2.4 Analyst Toolkit & Feature Highlights
- Horizontal cards highlighting:
  1. **Cross-chain coverage** with network icon strip.
  2. **Risk-scored strategies** with infographic icons and progress bars.
  3. **Team-ready workspaces** promoting collaboration, exports, scheduling.
  4. *(Optional)* **Calculator Sandbox** teaser with draggable component mock.

### 2.5 Nova AI Assistant Panel
- Persistent "Ask Nova" chat bubble bottom-right.
- Slide-in panel with conversational UI, suggested prompts, and rounded, tinted message bubbles.
- Hidden behind button until integration ships.

### 2.6 Footer
- Slim dark footer with columns: Platform, Solutions, Resources, Company; include social icons.
- Add disclaimer: "DeFiCalc is a community-led initiative and not officially part of the Stohn ecosystem."

## 3. Visual Style Guidelines
- **Color palette:** Deep backgrounds (#0C1A2B), blue-green primaries, purple secondary (#6D4AFF), neutral text (#8CA2B6), accent pastels sparingly.
- **Typography:** Inter/Poppins/Manrope; hero headings 48–64px (weight 700), section headers 28–32px, body text 16–18px with 1.5 line-height.
- **Icons & illustrations:** Minimal line icons, rounded charts with soft gradients, friendly onboarding graphics.
- **Spacing & grids:** 12-column grid (24px gutters) on desktop, 4-column (16px gutters) on mobile; cards with 8–12px radii and subtle shadows.
- **Animations:** Gentle scroll fade-ins, hover color shifts, smooth Nova panel transitions.

## 4. Content & Tone
- Onboarding tooltips/info icons clarifying TVL, APY, collateral; prominent "Getting Started" link.
- Sponsored call-outs integrated in grid/sidebar with "Sponsored" label.
- Community messaging underscores volunteer roots and invites feedback.

## 5. Responsiveness & Accessibility
- Responsive stacking for hero and card grids; thumb-friendly CTAs.
- Ensure WCAG-compliant contrast, keyboard focus styles, aria labels, and icon alt text.
- Reinforce status cues with icons plus color to support colorblind users.

## 6. Deliverables & Next Steps
1. **Mood boards & palette:** Inspiration collages and swatches to validate look-and-feel.
2. **Wireframes:** Low-fidelity desktop/mobile layouts for hero, protocol grid, feature highlights, Nova panel.
3. **High-fidelity mockups:** Polished visuals with states (hover, active, responsive breakpoints).
4. **Component library:** Reusable buttons, cards, tags, modals, chat elements (e.g., Figma).
5. **Handoff package:** Annotated specs (spacing, typography, colors, breakpoints) aligned with engineering plans for dynamic data.

## 7. Future Considerations
- Reserve layout slots for Calculator Sandbox expansion and Nova enhancements.
- Plan for modular sponsored placements that can be toggled without layout shifts.
- Coordinate with functional teams on real-time data feeds to match live metrics envisioned in widgets.

