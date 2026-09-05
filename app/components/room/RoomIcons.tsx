import type { SVGProps } from "react";

export type IconName = "person" | "folder" | "resume" | "heart" | "mail" | "power" | "sun" | "moon" | "pause" | "play" | "arrow" | "close" | "expand" | "code" | "leaf";

const paths: Record<IconName, React.ReactNode> = {
  person: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
  folder: <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7h18" />,
  resume: <><path d="M14 3H5v18h14V8l-5-5v5h5M8 12h8M8 16h8" /></>,
  heart: <path d="m12 21-8.5-8.5a5.5 5.5 0 0 1 8-7.5l.5.5.5-.5a5.5 5.5 0 0 1 8 7.5Z" />,
  mail: <><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 6 10 7L22 6" /></>,
  power: <><path d="M12 2v9M6 5a9 9 0 1 0 12 0" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M21 13a9 9 0 0 1-10-10 9 9 0 1 0 10 10Z" />,
  pause: <><path d="M8 5v14M16 5v14" /></>,
  play: <path d="m8 4 12 8-12 8Z" />,
  arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
  code: <path d="m7 6-6 6 6 6m10-12 6 6-6 6M14 3l-4 18" />,
  leaf: <><path d="M20 3C5 2 1 11 6 17s16 3 14-14ZM4 21 16 8" /></>,
};

export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
