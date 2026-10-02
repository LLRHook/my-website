import type { MetadataRoute } from "next";
import { PAGES } from "./lib/html";
import { SITE_URL } from "./lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  // Generated at build time, so lastModified is the deploy that last changed the site.
  const lastModified = new Date();
  return PAGES.map(({ path }) => ({ url: SITE_URL + path, lastModified, changeFrequency: "monthly", priority: path === "/" ? 1.0 : 0.8 }));
}
