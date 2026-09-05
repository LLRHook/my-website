import type { MetadataRoute } from "next";
import { SITE_NAME, SITE_DESCRIPTION } from "./lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Victor Ivanov",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#f5f2e9",
    theme_color: "#657e62",
  };
}
