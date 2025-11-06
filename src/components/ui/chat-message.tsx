"use client";

import Image from "next/image";
import { MessageParser } from "@/components/ui/message-parser";
import { NovaAvatar } from "@/components/ui/nova-avatar";
import { publicAsset } from "@/lib/public-asset";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  return (
    <div
      className={
        role === "assistant"
          ? "flex items-start gap-3 text-slate-200 min-w-0"
          : "flex flex-row-reverse items-start gap-3 text-right text-white min-w-0"
      }
    >
      {role === "assistant" ? (
        <NovaAvatar />
      ) : (
        <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 shrink-0 overflow-hidden">
          <Image
            src={publicAsset("/assets/user-avatar.png")}
            alt="User"
            width={32}
            height={32}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="min-w-0 rounded-2xl bg-slate-900/70 px-4 py-3 text-left text-sm text-slate-200 whitespace-pre-wrap break-words">
        <MessageParser content={content} />
      </div>
    </div>
  );
}
