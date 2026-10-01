import type { IconName } from "@/app/components/room/RoomIcons";

export const APP_SLUGS = {
  about: "about",
  projects: "projects",
  resume: "resume",
  interests: "off-the-clock",
  contact: "contact",
} as const;

export type AppId = keyof typeof APP_SLUGS;

export const APP_METADATA: Record<AppId, { label: string; title: string; description: string }> = {
  about: { label: "About", title: "About | Victor Ivanov", description: "Meet Victor Ivanov, a senior full-stack engineer in Sterling, Virginia building certification software and developer tools." },
  projects: { label: "Projects", title: "Projects | Victor Ivanov", description: "Explore Victor Ivanov's web products, developer tools, and open-source contributions, including MailIt, Citybase, and Kilo." },
  resume: { label: "Resume", title: "Resume | Victor Ivanov", description: "Victor Ivanov's September 2026 resume: engineering experience, selected projects, education, technical skills, and a downloadable PDF." },
  interests: { label: "Off the clock", title: "Off the clock | Victor Ivanov", description: "Around Victor Ivanov's room: rock climbing, cards, books, travel, and projects away from the workday." },
  contact: { label: "Contact", title: "Contact | Victor Ivanov", description: "Contact Victor Ivanov by email or connect on GitHub and LinkedIn. Based in Virginia, on Eastern time." },
};

export function idFromPath(pathname: string): AppId | null {
  return (Object.keys(APP_SLUGS) as AppId[]).find((id) => pathname === pathFor(id)) ?? null;
}

export function pathFor(id: AppId): string {
  return `/${APP_SLUGS[id]}`;
}

export const APPS: { id: AppId; label: string; icon: IconName; file: string }[] = [
  { id: "about", label: "About me", icon: "person", file: "hello.txt" },
  { id: "projects", label: "Projects", icon: "folder", file: "projects/" },
  { id: "resume", label: "Resume", icon: "resume", file: "resume.md" },
  { id: "interests", label: "Off the clock", icon: "heart", file: "interests.txt" },
  { id: "contact", label: "Contact", icon: "mail", file: "say-hello" },
];
