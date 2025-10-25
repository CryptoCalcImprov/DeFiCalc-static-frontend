"use client";

import { NovaAvatar } from "@/components/ui/nova-avatar";

export function ThinkingIndicator() {
  return (
    <div className="flex items-start gap-3 text-slate-400">
      <NovaAvatar isLoading />
      <div className="rounded-2xl bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-400">
        <span className="inline-flex items-center gap-1">
          Nova is thinking
          <span className="flex gap-1">
            <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
            <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
          </span>
        </span>
      </div>
    </div>
  );
}
