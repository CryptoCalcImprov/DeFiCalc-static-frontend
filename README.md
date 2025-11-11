# CryptoCalc.io Static Site Framework

A reusable Next.js + Tailwind CSS starter designed for static exports and GitHub Pages hosting. The project ships with a
component-driven architecture to help you assemble marketing pages quickly while keeping the codebase maintainable.

## Features

- **Static export ready** – preconfigured `next.config.js` for `next export` compatibility and GitHub Pages hosting.
- **Tailwind CSS** – extendable design system with reusable layout, section, and UI components.
- **Modular structure** – feature-focused folders keep components isolated and easy to reuse.

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run dev
 ```

3. Open [http://localhost:3000](http://localhost:3000) to view the site.

### CoinDesk Asset Search

The calculator workspace token selector can surface live results from the CoinDesk API. To enable this during development,
create a `.env.local` file and add your API key:

```bash
NEXT_PUBLIC_COINDESK_API_KEY=your_api_key_here
```

Without a key the selector will continue to work using a curated list of popular assets.

## Static Export for GitHub Pages

1. Generate the static build:

   ```bash
   npm run export
   ```

2. Deploy the `out/` directory to GitHub Pages. You can commit the directory to the `gh-pages` branch or configure an
   action to publish it automatically.

3. Update `next.config.js` with a `basePath` if your site will be served from a project subdirectory (e.g. `/cryptocalc`).

## Customize the Starter

- Adjust colors and design tokens in `tailwind.config.ts`.
- Add new sections to `src/components/sections` and assemble them within `src/app/page.tsx` using the `Section` layout
  wrapper.
- Share UI primitives inside `src/components/ui` to keep styles consistent across pages.

## Scripts

- `npm run dev` – Start the development server.
- `npm run build` – Create a production build.
- `npm run export` – Generate static assets in the `out` directory (ready for GitHub Pages).
- `npm run lint` – Run Next.js ESLint configuration.

## License

[MIT](LICENSE)
