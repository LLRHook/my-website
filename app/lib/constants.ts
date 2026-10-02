export const SITE_URL = "https://victorivanov.engineer";
export const SITE_NAME = "Victor Ivanov — Senior Full-Stack Engineer";
export const SITE_TITLE = "Victor Ivanov | Senior Full-Stack Engineer";
export const SITE_DESCRIPTION =
  "Victor Ivanov is a senior full-stack engineer in Sterling, Virginia, building web products and developer tools with Java, Spring Boot, React, and TypeScript.";

export type SocialIcon = "github" | "linkedin" | "email";

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
];

export const SOCIAL_BY_ICON: Record<SocialIcon, SocialLink> = Object.fromEntries(
  SOCIAL_LINKS.map((l) => [l.icon, l])
) as Record<SocialIcon, SocialLink>;

export const EMAIL_HREF = SOCIAL_BY_ICON.email.href;
export const GITHUB_HREF = SOCIAL_BY_ICON.github.href;

// Skills listed on the About page. (KNOWS_ABOUT is a deliberately curated
// structured-data subset and is intentionally kept separate.)
export const SKILLS: readonly string[] = [
  "Java",
  "Spring Boot",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Redis",
  "Docker",
  "AWS",
  "Git",
  "REST APIs",
  "Tailwind CSS",
  "Linux",
  "CI/CD",
];

export const KNOWS_ABOUT: readonly string[] = [
  "Java",
  "Spring Boot",
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "PostgreSQL",
  "Full-Stack Development",
  "Artificial Intelligence",
];
