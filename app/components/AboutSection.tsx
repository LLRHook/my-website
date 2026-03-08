"use client";

import FadeInOnScroll from "@/app/components/ui/FadeInOnScroll";
import Container from "@/app/components/ui/Container";
import SkillBadge from "@/app/components/about/SkillBadge";

const skills = [
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
            Lead full-stack engineer at Paradigm Testing, based in Lausanne,
            Switzerland. I studied computer science at UMBC after switching
            from biochemistry mid-undergrad — spent too much time behind a
            screen to pretend I belonged in a lab. Currently finishing a
            master&apos;s in AI at Georgia Tech.
          </p>
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            I build APIs, data pipelines, and full-stack applications — mostly
            with Java/Spring Boot, React, PostgreSQL, and Redis. My philosophy
            is simple: build fast, break things, but always test. A solid test
            suite is non-negotiable, especially on the backend. With AI in the
            workflow now, there&apos;s no excuse not to have one.
          </p>
          <p className="text-xl sm:text-2xl text-text-secondary leading-relaxed">
            Outside of work, I rock climb every other day. It&apos;s
            programming for athletes — full-body problem solving that keeps me
            sharp. I&apos;m also deep into agentic AI workflows, deployment
            automation, and building tools that make the development cycle
            faster.
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

    </Container>
  );
}
