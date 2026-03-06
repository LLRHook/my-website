"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import GlassCard from "@/app/components/ui/GlassCard";
import SkillBadge from "./SkillBadge";

const skills = [
  "TypeScript",
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "C++",
  "Java",
  "Rust",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "AWS",
  "Git",
  "REST APIs",
  "GraphQL",
  "Tailwind CSS",
  "Linux",
  "CI/CD",
];

const contactLinks = [
  {
    label: "GitHub",
    href: "https://github.com/LLRHook",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
      </svg>
    ),
  },
  {
    label: "Email",
    href: "mailto:vivanov@paradigmtesting.com",
    icon: (
      <svg
        className="w-5 h-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com/in/victor-ivanov",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
];

export default function AboutTab() {
  return (
    <div className="space-y-10">
      {/* Bio */}
      <FadeInOnScroll>
        <GlassCard className="p-8" hoverable={false}>
          <h2 className="text-2xl font-bold text-text-primary mb-4 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-accent" />
            About Me
          </h2>
          <div className="space-y-4 text-text-secondary leading-relaxed">
            <p>
              I&apos;m a software engineer with a passion for building clean,
              performant applications. I enjoy working across the full stack —
              from crafting responsive UIs to designing scalable backend
              services.
            </p>
            <p>
              When I&apos;m not coding, you can find me exploring new
              technologies, contributing to open source, or diving into a good
              book. I believe in writing code that&apos;s not just functional,
              but maintainable and elegant.
            </p>
          </div>
        </GlassCard>
      </FadeInOnScroll>

      {/* Skills */}
      <FadeInOnScroll delay={0.1}>
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-accent" />
            Skills & Technologies
          </h2>
          <div className="flex flex-wrap gap-3">
            {skills.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
        </div>
      </FadeInOnScroll>

      {/* Resume & Contact */}
      <FadeInOnScroll delay={0.2}>
        <GlassCard className="p-8" hoverable={false}>
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center gap-3">
            <span className="w-8 h-0.5 bg-accent" />
            Get in Touch
          </h2>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <a
              href="/Victor_Ivanov_Resume.pdf"
              download
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-white font-medium hover:opacity-90 transition-opacity"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Resume
            </a>
          </div>

          <div className="flex flex-wrap gap-4">
            {contactLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  link.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
                className="glass inline-flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
              >
                {link.icon}
                {link.label}
              </a>
            ))}
          </div>
        </GlassCard>
      </FadeInOnScroll>
    </div>
  );
}
