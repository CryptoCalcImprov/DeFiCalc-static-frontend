export const navigationLinks = [
  { href: "#features", label: "Features" },
  { href: "#workflow", label: "Workflow" },
  { href: "#cta", label: "Get Started" }
] as const;

export const featureCards = [
  {
    title: "Reusable components",
    description: "Composable layout, section, and UI primitives keep your marketing pages consistent without repetition."
  },
  {
    title: "Static export ready",
    description: "Opinionated Next.js configuration optimised for GitHub Pages, including unoptimised images and trailing slashes."
  },
  {
    title: "Tailwind design system",
    description: "Extendable color palette and utility-first styles make it easy to adapt the branding to your product."
  }
] as const;

export const workflowSteps = [
  {
    title: "1. Customize",
    description: "Update the Tailwind theme, metadata, and reusable components to match your product branding."
  },
  {
    title: "2. Compose",
    description: "Assemble sections by combining layout primitives with feature-specific content components."
  },
  {
    title: "3. Deploy",
    description: "Run `npm run export` and publish the generated `out` directory with GitHub Pages."
  }
] as const;

export const footerLinks = [
  { href: "https://github.com/", label: "GitHub" },
  { href: "https://nextjs.org/", label: "Next.js" },
  { href: "https://tailwindcss.com/", label: "Tailwind" }
] as const;
