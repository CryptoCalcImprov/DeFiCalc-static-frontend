"use client";

import clsx from "clsx";

type LoadingDotsProps = {
  text: string;
  className?: string;
  dotClassName?: string;
};

const DOT_ANIMATION_DELAYS = ["0ms", "150ms", "300ms"] as const;

/**
 * Renders a short "typing" indicator style string (e.g., "Loading ...") with animated dots.
 * The dots inherit the surrounding text color unless dotClassName is provided.
 */
export function LoadingDots({ text, className = "", dotClassName }: LoadingDotsProps) {
  const sanitizedText = text.replace(/\s*(?:\u2026|\.{1,})+$/gu, "").trim();
  const displayText = sanitizedText.length > 0 ? sanitizedText : text.trim();

  return (
    <span className={clsx("inline-flex items-center gap-1", className)}>
      <span>{displayText}</span>
      <span className="inline-flex gap-1" aria-hidden="true">
        {DOT_ANIMATION_DELAYS.map((delay, index) => (
          <span
            key={delay}
            className={clsx("inline-block animate-bounce", dotClassName)}
            style={{ animationDelay: delay, transformOrigin: "center bottom" }}
          >
            .
          </span>
        ))}
      </span>
    </span>
  );
}

