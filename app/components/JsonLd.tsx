import { SOCIAL_LINKS, SITE_URL, SITE_NAME } from "@/app/lib/constants";

const personJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Victor Ivanov",
  url: SITE_URL,
  jobTitle: "Software Engineer",
  sameAs: SOCIAL_LINKS.filter((l) => l.external).map((l) => l.href),
});

const websiteJson = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
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
    </>
  );
}
