export const SITE_URL = "https://victorivanov.engineer";
export const SITE_NAME = "Victor Ivanov — Software Engineer";
export const SITE_TITLE = "Victor Ivanov | Software Engineer";
export const SITE_DESCRIPTION =
  "Portfolio of Victor Ivanov — software engineer specializing in full-stack development. Explore projects, skills, and professional experience.";

export interface NavLink {
  label: string;
  href: string;
}

export const NAV_LINKS: readonly NavLink[] = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export type SocialIcon = "github" | "linkedin" | "x" | "email";

export interface SocialLink {
  label: string;
  icon: SocialIcon;
  href: string;
  external: boolean;
}

export const SOCIAL_LINKS: readonly SocialLink[] = [
  { label: "GitHub", icon: "github", href: "https://github.com/LLRHook", external: true },
  { label: "Email", icon: "email", href: "mailto:victor.n.ivanov@gmail.com", external: false },
  { label: "LinkedIn", icon: "linkedin", href: "https://www.linkedin.com/in/victorivanovofficial/", external: true },
  { label: "X", icon: "x", href: "https://x.com/victori84819871", external: true },
];

export const SOCIAL_BY_ICON: Record<SocialIcon, SocialLink> = Object.fromEntries(
  SOCIAL_LINKS.map((l) => [l.icon, l])
) as Record<SocialIcon, SocialLink>;

export const EMAIL_HREF = SOCIAL_BY_ICON.email.href;
export const GITHUB_HREF = SOCIAL_BY_ICON.github.href;
