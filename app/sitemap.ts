import { APP_SLUGS } from "./lib/apps";
import { SITE_URL } from "./lib/constants";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://victorivanov.engineer",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    ...Object.values(APP_SLUGS).map((slug) => ({ url: `${SITE_URL}/${slug}`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 })),
  ];
}
