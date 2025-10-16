# DeFiCalc.io Redesign Concept

A dark-themed Next.js concept that reimagines DeFiCalc.io as an approachable yet powerful analytics gateway. The current build focuses on
visual design and content structure – data plumbing, Nova integration, and calculator logic will be handled in future iterations.

## Features

- **Strategy-forward hero** – showcases the Strategy Monitor with risk badges, live health scores, and approachable messaging.
- **Protocol leaders grid** – modular cards for top protocols, governance context, and clearly marked sponsored placements.
- **Toolkit highlights** – communicates calculator sandbox, cross-chain coverage, and team collaboration benefits.
- **Nova assistant preview** – demonstrates the future AI chat experience with suggestions and sample responses.
- **Design handoff section** – summarises mood boards, wireframes, and component library deliverables for the next phase.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to view the concept.

## Static Export for GitHub Pages

1. Generate the static build:

   ```bash
   npm run export
   ```

2. Deploy the `out/` directory to GitHub Pages. You can commit the directory to the `gh-pages` branch or configure an
   action to publish it automatically.

3. Update `next.config.js` with a `basePath` if your site will be served from a project subdirectory (e.g. `/cryptocalc`).

## Customize the Starter

- Adjust colors and design tokens in `tailwind.config.ts` to tune the gradient-heavy palette.
- Update components in `src/components/sections` to explore additional modules (calculator sandbox, Nova expansions, etc.).
- Share UI primitives inside `src/components/ui` to keep styles consistent across the design system.

## Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Create a production build.
- `npm run export` – Generate static assets in the `out` directory (ready for GitHub Pages).
- `npm run lint` – Run Next.js ESLint configuration.

## License

[MIT](LICENSE)
