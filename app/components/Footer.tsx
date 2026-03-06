"use client";

import { NAV_LINKS, SOCIAL_LINKS } from "@/app/lib/constants";
import Container from "@/app/components/ui/Container";

export default function Footer() {
  return (
    <Container as="footer" className="py-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        <div>
          <h3 className="text-text-primary font-bold text-lg mb-3">
            Victor Ivanov
          </h3>
          <p className="text-text-muted text-sm leading-relaxed">
            Software engineer building clean, performant applications.
          </p>
        </div>

        <div>
          <h4 className="text-text-secondary text-sm uppercase tracking-widest mb-4">
            Navigation
          </h4>
          <ul className="space-y-3">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  className="text-text-muted hover:text-text-secondary transition-colors text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-text-secondary text-sm uppercase tracking-widest mb-4">
            Connect
          </h4>
          <ul className="space-y-3">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.external ? "_blank" : undefined}
                  rel={link.external ? "noopener noreferrer" : undefined}
                  className="text-text-muted hover:text-text-secondary transition-colors text-sm"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border pt-8 text-center">
        <span className="text-text-muted text-sm">
          &copy; {new Date().getFullYear()} Victor Ivanov
        </span>
      </div>
    </Container>
  );
}
