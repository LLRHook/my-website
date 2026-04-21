export const languageColors: Record<string, string> = {
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
  SCSS: "#c6538c",
  Shell: "#89e051",
  Lua: "#000080",
  Dart: "#00B4AB",
  PHP: "#4F5D95",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  MDX: "#fcb32c",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  "Jupyter Notebook": "#DA5B0B",
  Astro: "#ff5a03",
};

export function colorFor(language: string): string {
  return languageColors[language] || "#8b8b8b";
}
