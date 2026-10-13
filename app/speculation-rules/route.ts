// Delivered through the `Speculation-Rules` response header (next.config.js), not a
// <script>, so pages stay JavaScript-free. Chromium prerenders a same-origin page when
// a link is hovered or pressed; /projects is only prefetched so Codelings does not boot
// in the background. Other browsers ignore the header.
const notProjects = [{ not: { href_matches: "/projects" } }, { not: { href_matches: "/projects\\?*" } }];
const rules = {
  prerender: [{
    where: { and: [
      { href_matches: "/*" },
      { not: { href_matches: "/*.*" } },
      ...notProjects,
      { not: { selector_matches: "[download], [target]" } },
    ] },
    eagerness: "moderate",
  }],
  prefetch: [{
    where: { or: [{ href_matches: "/projects" }, { href_matches: "/projects\\?*" }] },
    eagerness: "moderate",
  }],
};

export const dynamic = "force-static";
export function GET() {
  return new Response(JSON.stringify(rules), {
    headers: { "content-type": "application/speculationrules+json" },
  });
}
