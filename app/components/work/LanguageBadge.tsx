"use client";

import { colorFor } from "@/app/lib/languageColors";

export default function LanguageBadge({ language }: { language: string }) {
  const color = colorFor(language);

  return (
    <span className="flex items-center gap-1.5 text-sm text-text-secondary">
      <span
        className="inline-block w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
      />
      {language}
    </span>
  );
}
