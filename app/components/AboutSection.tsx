"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import Container from "@/app/components/ui/Container";
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
    <Container as="section" id="about" className="py-32" data-testid="about">
      <FadeInOnScroll>
        <h2 className="text-4xl sm:text-5xl display-heading text-text-primary mb-16">
          About
        </h2>
      </FadeInOnScroll>

      <FadeInOnScroll delay={0.1}>
        <div className="space-y-6 mb-20">
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim
            ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat.
          </p>
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            Duis aute irure dolor in reprehenderit in voluptate velit esse
            cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat
            cupidatat non proident, sunt in culpa qui officia deserunt mollit
            anim id est laborum.
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
    </Container>
  );
}
