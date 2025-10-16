import Link from "next/link";

export function LaunchAppFab() {
  return (
    <Link
      href="https://app.deficalc.io"
      className="fixed bottom-6 left-6 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-brand-teal px-5 py-2.5 text-sm font-semibold text-brand-midnight shadow-glow transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-brand-teal/40 lg:hidden"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
      </svg>
      Launch App
    </Link>
  );
}
