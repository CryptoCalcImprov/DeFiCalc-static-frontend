import { Button } from "@/components/ui/button";

export function CallToActionSection() {
  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-r from-primary to-accent px-10 py-12 text-slate-950 shadow-2xl">
      <h3 className="text-3xl font-bold tracking-tight">Deploy the starter to GitHub Pages in minutes.</h3>
      <p className="mt-3 max-w-2xl text-base text-slate-900/80">
        Follow the included documentation to configure your repository, automate deployments, and ship a responsive marketing
        site for your crypto product without touching a server.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Button href="https://github.com/new" target="_blank" rel="noopener noreferrer" className="bg-slate-950 text-white hover:bg-slate-900">
          Create Repository
        </Button>
        <Button
          href="https://docs.github.com/en/pages/getting-started-with-github-pages"
          target="_blank"
          rel="noopener noreferrer"
          variant="ghost"
          className="text-slate-950 hover:bg-white/20"
        >
          View GitHub Pages Docs
        </Button>
      </div>
    </div>
  );
}
