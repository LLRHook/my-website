import type { MetadataRoute } from "next";
import { PAGES } from "./lib/html";
import { SITE_URL } from "./lib/constants";

export default function sitemap(): MetadataRoute.Sitemap {
  return PAGES.map(({ path }) => ({ url: SITE_URL + path, changeFrequency: "monthly", priority: path === "/" ? 1.0 : 0.8 }));
}
