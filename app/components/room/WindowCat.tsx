"use client";

import { useEffect, useState } from "react";

export default function WindowCat({ moving }: { moving: boolean }) {
  const [awake, setAwake] = useState(false);
  useEffect(() => {
    if (!awake) return;
    const timer = window.setTimeout(() => setAwake(false), 6500);
    return () => window.clearTimeout(timer);
  }, [awake]);

  return (
    <button className={`window-cat ${awake ? "cat-awake" : ""}`} onClick={() => setAwake((value) => !value)} aria-label={awake ? "Let the cat sleep" : "Say hello to the cat"} aria-pressed={awake} data-moving={moving}>
      <svg viewBox="0 0 220 112" fill="none" aria-hidden="true">
        <ellipse cx="111" cy="99" rx="92" ry="8" fill="#514738" opacity=".14" />
        <g className="cat-body"><path d="M43 83C35 49 63 26 105 32c32 3 57 25 57 52-1 16-30 18-62 18-32 0-53-4-57-19Z" fill="#b27b50" /><path d="M79 43c-8 5-11 12-11 19m29-28c-10 10-12 17-10 25m25-23c-6 8-7 15-5 24" stroke="#82573e" strokeWidth="7" strokeLinecap="round" /><path d="M152 69c48-8 52 27 22 31-18 3-45-3-53-7" stroke="#986540" strokeWidth="17" strokeLinecap="round" className="cat-tail" /><path d="m180 77 5 7m-20 7 1 9" stroke="#704d38" strokeWidth="7" /></g>
        <g className="cat-head"><path d="m39 75-3-42 23 13c9-3 19-3 28 0l18-12-2 44c-3 29-62 31-64-3Z" fill="#c58e60" /><path d="m42 43 3 20 10-13m34 2 10-10-1 21" fill="#dba88e" /><path d="M62 48v10m12-10v9m11-9-2 10" stroke="#8d5d3c" strokeWidth="4" strokeLinecap="round" /><path d="M58 83c10-7 20-7 29 0-1 19-29 19-29 0Z" fill="#f1dbb8" /><path d="m69 80 7 0-3 4Z" fill="#865344" /><g className="cat-eyes-sleep"><path d="m48 72 6 3 7-3m23 0 6 3 6-3" stroke="#473d30" strokeWidth="2.8" strokeLinecap="round" /></g><g className="cat-eyes-open"><ellipse cx="55" cy="72" rx="5" ry="6" fill="#d5c97f" /><ellipse cx="90" cy="72" rx="5" ry="6" fill="#d5c97f" /><path d="M55 68v8m35-8v8" stroke="#31392b" strokeWidth="2" /></g><path d="m46 81-17-3m18 9-19 2m69-8 18-3m-19 9 18 2" stroke="#ead5b9" strokeWidth="1.4" strokeLinecap="round" /></g>
        <path className="cat-paw" d="M84 95c-7-6-12-17-5-20 8-3 17 15 17 20" fill="#ebcaa3" />
        <g className="cat-zzz" stroke="#776e59" strokeWidth="1.5" strokeLinecap="round"><path d="M115 22h6l-6 7h6M132 5h8l-8 10h8" /></g>
      </svg>
      <span className="cat-label">{awake ? "Let the cat sleep" : "Say hello to the cat"}</span>
    </button>
  );
}
