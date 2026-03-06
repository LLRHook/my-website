"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import SkillBadge from "@/app/components/about/SkillBadge";

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

export default function AboutSection() {
  return (
    <section id="about" className="py-32 max-w-5xl mx-auto section-padding">
      <FadeInOnScroll>
        <h2 className="text-4xl sm:text-5xl display-heading text-text-primary mb-16">
          About
        </h2>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <div className="space-y-6 mb-20">
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            I&apos;m a software engineer with a passion for building clean,
            performant applications. I enjoy working across the full stack —
            from crafting responsive UIs to designing scalable backend services.
          </p>
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            When I&apos;m not coding, you can find me exploring new
            technologies, contributing to open source, or diving into a good
            book. I believe in writing code that&apos;s not just functional, but
            maintainable and elegant.
          </p>
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.2}>
        <h3 className="text-lg uppercase tracking-widest text-text-muted mb-8">
          Skills
        </h3>
        <div className="flex flex-wrap gap-3 mb-16">
          {skills.map((skill) => (
            <SkillBadge key={skill} skill={skill} />
          ))}
        </div>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.3}>
        <a
          href="/Victor_Ivanov_Resume.pdf"
          className="btn-outline"
        >
          Download Resume
        </a>
      </FadeInOnScroll>
    </section>
  );
}
