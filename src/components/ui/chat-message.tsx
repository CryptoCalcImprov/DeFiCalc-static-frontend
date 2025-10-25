"use client";

import { NovaAvatar } from "@/components/ui/nova-avatar";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={
        role === "assistant"
          ? "flex items-start gap-3 text-slate-200"
          : "flex flex-row-reverse items-start gap-3 text-right text-white"
      }
    >
      {role === "assistant" ? (
        <NovaAvatar />
      ) : (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 shrink-0">
          You
        </div>
      )}
      <p className="rounded-2xl bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-200 whitespace-pre-wrap break-words">
        {content}
      </p>
    </div>
  );
}
