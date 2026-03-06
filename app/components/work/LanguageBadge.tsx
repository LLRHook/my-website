"use client";

const languageColors: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Ruby: "#701516",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Shell: "#89e051",
  Lua: "#000080",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Vue: "#41b883",
  Svelte: "#ff3e00",
};

export default function LanguageBadge({ language }: { language: string }) {
  const color = languageColors[language] || "#8b8b8b";

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
