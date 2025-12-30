"use client";

import { useEffect, useMemo, useState } from "react";

type CalculatorDeckItem = {
  id: string;
  label: string;
  description?: string;
};

type CalculatorDeckProps = {
  calculators: CalculatorDeckItem[];
  activeId: string;
  recentIds: string[];
  favoriteIds: string[];
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

function DeckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3.5" y="3.5" width="8" height="8" rx="1.6" />
      <rect x="12.5" y="12.5" width="8" height="8" rx="1.6" />
      <path d="M7 17.5h-2.9A1.6 1.6 0 0 1 2.5 15V7.9" />
      <path d="M17 7h2.9A1.6 1.6 0 0 1 21.5 8.6v7.1" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M7 10l5 5 5-5" />
    </svg>
  );
}

function StarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 4.5l2.21 4.48 4.94.72-3.57 3.48.84 4.92L12 15.9l-4.42 2.32.84-4.92-3.57-3.48 4.94-.72L12 4.5z" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M20 20l-3.15-3.15" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M6 6l12 12M6 18L18 6" />
    </svg>
  );
}

function getCalculatorById(calculators: CalculatorDeckItem[], id: string | null) {
  if (!id) {
    return null;
  }
  return calculators.find((calculator) => calculator.id === id) ?? null;
}

export function CalculatorDeck({
  calculators,
  activeId,
  recentIds,
  favoriteIds,
  isOpen,
  onOpen,
  onClose,
  onSelect,
  onToggleFavorite,
}: CalculatorDeckProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(activeId);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setHoveredId(activeId);
      setSearchQuery("");
    }
  }, [isOpen, activeId]);

  const favorites = useMemo(() => {
    return favoriteIds
      .map((id) => getCalculatorById(calculators, id))
      .filter((item): item is CalculatorDeckItem => Boolean(item));
  }, [favoriteIds, calculators]);

  const recent = useMemo(() => {
    return recentIds
      .map((id) => getCalculatorById(calculators, id))
      .filter((item): item is CalculatorDeckItem => Boolean(item))
      .filter((item) => !favoriteIds.includes(item.id));
  }, [recentIds, calculators, favoriteIds]);

  const activeCalculator = getCalculatorById(calculators, activeId);
  const previewCalculator = getCalculatorById(calculators, hoveredId) ?? activeCalculator;

  const filteredCalculators = useMemo(() => {
    if (!searchQuery.trim()) {
      return calculators;
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    return calculators.filter((calculator) => {
      const label = calculator.label.toLowerCase();
      const description = calculator.description?.toLowerCase() ?? "";
      return label.includes(normalizedQuery) || description.includes(normalizedQuery);
    });
  }, [calculators, searchQuery]);

  const hasMultipleCalculators = calculators.length > 1;

  const handleSelectCalculator = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="group inline-flex items-center gap-3 rounded-full border border-mint/35 bg-slate-950/60 px-4 py-2 text-sm font-semibold text-slate-100 shadow-[0_12px_28px_rgba(6,21,34,0.32)] transition hover:border-mint hover:bg-slate-900/60 hover:shadow-[0_18px_32px_rgba(6,21,34,0.45)] focus:outline-none focus:ring-2 focus:ring-mint/40 sm:text-base disabled:cursor-not-allowed disabled:opacity-60"
          onClick={calculators.length > 0 ? onOpen : undefined}
          disabled={calculators.length === 0}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          title="Open calculator deck"
        >
          <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-mint/40 bg-slate-950/80 text-mint shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_12px_rgba(58,198,255,0.35)] transition group-hover:border-mint group-hover:text-white">
            <span className="absolute inset-0 bg-mint/15 opacity-0 transition group-hover:opacity-100" />
            <DeckIcon className="relative h-3.5 w-3.5 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-3" />
          </span>
          <div className="flex flex-col items-start text-left leading-none">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-mint/90">Active calculator</span>
            <span className="text-sm sm:text-base">{activeCalculator?.label ?? "Select calculator"}</span>
          </div>
          <ChevronIcon className="h-4 w-4 opacity-70 transition group-hover:translate-y-0.5 group-hover:opacity-100" />
        </button>
      </div>

      {hasMultipleCalculators ? (
        <div className="flex min-h-[44px] items-center gap-2 overflow-x-auto rounded-2xl border border-ocean/60 bg-slate-950/55 px-3 py-2 sm:flex-wrap sm:overflow-visible sm:px-4">
          {favorites.length > 0 ? (
            favorites.map((calculator) => (
              <button
                key={calculator.id}
                type="button"
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                  calculator.id === activeId
                    ? "border-mint/60 bg-mint/15 text-mint"
                    : "border-ocean/60 bg-slate-900/70 text-slate-100 hover:border-mint/40 hover:text-mint",
                ].join(" ")}
                onClick={() => handleSelectCalculator(calculator.id)}
              >
                <StarIcon className="h-3.5 w-3.5" filled />
                {calculator.label}
              </button>
            ))
          ) : null}
          {recent.length > 0
            ? recent.map((calculator) => (
                <button
                  key={calculator.id}
                  type="button"
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm",
                    calculator.id === activeId
                      ? "border-mint/60 bg-mint/15 text-mint"
                      : "border-ocean/60 bg-slate-900/70 text-slate-100 hover:border-mint/40 hover:text-mint",
                  ].join(" ")}
                  onClick={() => handleSelectCalculator(calculator.id)}
                >
                  {calculator.label}
                </button>
              ))
            : null}
          {favorites.length === 0 && recent.length === 0 ? (
            <span className="text-xs text-muted sm:text-sm">Run a calculator to pin it here for quick access.</span>
          ) : null}
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end sm:justify-center">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
          <div className="relative mx-auto mt-auto w-full max-w-4xl rounded-t-3xl border border-ocean/60 bg-slate-950/95 shadow-[0_24px_48px_rgba(4,14,24,0.6)] sm:mt-0 sm:rounded-3xl">
            <div className="flex items-center justify-between px-5 py-4 sm:px-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-mint/80">Nova deck</p>
                <h2 className="text-lg font-semibold text-white sm:text-xl">Swap calculators instantly</h2>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ocean/70 bg-slate-900/70 text-slate-200 transition hover:border-mint/50 hover:text-mint focus:outline-none focus:ring-2 focus:ring-mint/40"
                onClick={onClose}
                aria-label="Close calculator deck"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-5 px-5 pb-6 sm:grid-cols-[minmax(0,1fr)_minmax(240px,0.85fr)] sm:px-6 sm:pb-7">
              <div className="flex flex-col gap-4">
                <div className="relative">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search calculators or type to filter..."
                    className="h-11 w-full rounded-xl border border-ocean/65 bg-slate-900/80 pl-10 pr-4 text-sm text-slate-50 placeholder:text-slate-500 focus:border-mint focus:outline-none focus:ring-2 focus:ring-mint/30 sm:text-base"
                    autoFocus
                  />
                </div>
                {!hasMultipleCalculators ? (
                  <div className="rounded-2xl border border-dashed border-ocean/60 bg-slate-900/55 px-4 py-3 text-xs text-slate-400 sm:text-sm">
                    DCA is live today, and more calculators are on the way. Preview the upcoming layout or pin Nova&rsquo;s
                    favorites so they&rsquo;re ready once unlocked.
                  </div>
                ) : null}
                <div className="max-h-[320px] overflow-y-auto rounded-2xl border border-ocean/60 bg-slate-950/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_22px_rgba(6,21,34,0.45)]">
                  {filteredCalculators.length > 0 ? (
                    <ul className="divide-y divide-ocean/50">
                      {filteredCalculators.map((calculator) => {
                        const isActive = calculator.id === activeId;
                        const isFavorite = favoriteIds.includes(calculator.id);

                        return (
                          <li key={calculator.id}>
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={() => handleSelectCalculator(calculator.id)}
                              onMouseEnter={() => setHoveredId(calculator.id)}
                              onFocus={() => setHoveredId(calculator.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" || event.key === " ") {
                                  event.preventDefault();
                                  handleSelectCalculator(calculator.id);
                                }
                              }}
                              className={[
                                "flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-mint/40",
                                isActive ? "bg-mint/10" : "hover:bg-slate-900/70",
                              ].join(" ")}
                              aria-pressed={isActive}
                            >
                              <div className="flex flex-col gap-1">
                                <span className="text-sm font-semibold text-slate-50 sm:text-base">
                                  {calculator.label}
                                </span>
                                {calculator.description ? (
                                  <span className="text-xs text-slate-300 sm:text-sm">{calculator.description}</span>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-3">
                                {isActive ? (
                                  <span className="rounded-full border border-mint/50 bg-mint/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-mint">
                                    Active
                                  </span>
                                ) : null}
                                <button
                                  type="button"
                                  className={[
                                    "inline-flex h-8 w-8 items-center justify-center rounded-full border transition",
                                    isFavorite
                                      ? "border-mint/60 bg-mint/15 text-mint"
                                      : "border-ocean/60 bg-slate-900/60 text-slate-300 hover:border-mint/40 hover:text-mint",
                                  ].join(" ")}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onToggleFavorite(calculator.id);
                                  }}
                                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                                >
                                  <StarIcon className="h-4 w-4" filled={isFavorite} />
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center text-sm text-slate-400">
                      <span>
                        No calculators matched &ldquo;
                        {searchQuery}
                        &rdquo;.
                      </span>
                      <span className="text-xs text-slate-500">Try a different keyword or clear the search.</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3 rounded-2xl border border-ocean/60 bg-slate-950/70 p-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3),0_0_22px_rgba(6,21,34,0.35)] sm:min-h-[320px]">
                <p className="text-xs font-semibold uppercase tracking-widest text-mint/80">Preview</p>
                {previewCalculator ? (
                  <>
                    <h3 className="text-lg font-semibold text-slate-50 sm:text-xl">{previewCalculator.label}</h3>
                    {previewCalculator.description ? (
                      <p className="text-sm text-slate-300 sm:text-base">{previewCalculator.description}</p>
                    ) : (
                      <p className="text-sm text-slate-300 sm:text-base">
                        Configure parameters on the left panel to see Nova’s generated summary and price trajectory.
                      </p>
                    )}
                    <div className="mt-auto rounded-2xl border border-dashed border-ocean/50 bg-slate-900/60 p-4 text-xs text-slate-400 sm:text-sm">
                      Swapping calculators keeps Nova’s summary and price panels in place. Your newest selections appear
                      in the quick slot row above for one-tap access.
                    </div>
                    <button
                      type="button"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-cta-gradient px-4 py-2 text-sm font-semibold text-slate-50 shadow-lg shadow-[rgba(58,198,255,0.24)] transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint"
                      onClick={() => handleSelectCalculator(previewCalculator.id)}
                    >
                      Activate {previewCalculator.label}
                    </button>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                    Select a calculator to preview details.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
