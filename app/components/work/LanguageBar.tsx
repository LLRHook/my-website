"use client";

import { colorFor } from "@/app/lib/languageColors";
import type { LanguageSlice } from "@/app/lib/types";

interface LanguageBarProps {
  languages: LanguageSlice[];
  showLegend?: boolean;
}

const TOP_N = 4;

export default function LanguageBar({
  languages,
  showLegend = true,
}: LanguageBarProps) {
  if (!languages || languages.length === 0) return null;

  const top = languages.slice(0, TOP_N);
  const rest = languages.slice(TOP_N);
  const restPercent = rest.reduce((acc, l) => acc + l.percent, 0);
  const slices =
    restPercent > 0.5
      ? [...top, { name: "Other", bytes: 0, percent: restPercent }]
      : top;

  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="flex h-1 overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label={`Language breakdown: ${slices
          .map((s) => `${s.name} ${s.percent.toFixed(0)}%`)
          .join(", ")}`}
      >
        {slices.map((lang) => (
          <span
            key={lang.name}
            style={{
              width: `${lang.percent}%`,
              backgroundColor: colorFor(lang.name),
            }}
            title={`${lang.name} · ${lang.percent.toFixed(1)}%`}
          />
        ))}
      </div>

      {showLegend && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-text-muted">
          {slices.slice(0, 3).map((lang) => (
            <span key={lang.name} className="inline-flex items-center gap-1">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: colorFor(lang.name) }}
              />
              {lang.name} {lang.percent.toFixed(0)}%
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
