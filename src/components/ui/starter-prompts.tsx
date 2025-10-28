"use client";

import { Button } from "@/components/ui/button";

interface StarterPromptsProps {
  prompts: string[];
  onPromptClick: (prompt: string) => void;
}

export function StarterPrompts({ prompts, onPromptClick }: StarterPromptsProps) {
  return (
    <div className="mt-4 flex flex-wrap gap-3">
      {prompts.map((prompt) => (
        <Button
          key={prompt}
          variant="secondary"
          className="rounded-full bg-slate-900/80 px-4 py-2 text-xs"
          onClick={() => onPromptClick(prompt)}
        >
          {prompt}
        </Button>
      ))}
    </div>
  );
}
