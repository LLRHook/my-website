import { SOCIAL_LINKS, SITE_URL, SITE_NAME } from "@/app/lib/constants";

const personJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Victor Ivanov",
  url: SITE_URL,
  jobTitle: "Software Engineer",
  worksFor: {
    "@type": "Organization",
    name: "Paradigm Testing",
  },
  workLocation: {
    "@type": "Place",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Tysons",
      addressRegion: "VA",
      addressCountry: "US",
    },
  },
  alumniOf: [
    {
      "@type": "EducationalOrganization",
      name: "University of Maryland, Baltimore County",
      sameAs: "https://umbc.edu",
    },
    {
      "@type": "EducationalOrganization",
      name: "Georgia Institute of Technology",
      sameAs: "https://gatech.edu",
    },
  ],
  knowsAbout: [
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
  ],
  sameAs: SOCIAL_LINKS.filter((l) => l.external).map((l) => l.href),
});

const websiteJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
});

const breadcrumbJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL,
    },
  ],
});

export default function JsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: personJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: websiteJson }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbJson }}
      />
    </>
  );
}
