// Delivered through the `Speculation-Rules` response header (next.config.js), not a
// <script>, so pages stay JavaScript-free. Chromium prerenders a same-origin page when
// a link is hovered or pressed. Other browsers ignore the header.
const rules = {
  prerender: [{
    where: { and: [
      { href_matches: "/*" },
      { not: { href_matches: "/*.*" } },
      { not: { selector_matches: "[download], [target]" } },
    ] },
    eagerness: "moderate",
  }],
};

export const dynamic = "force-static";
export function GET() {
  return new Response(JSON.stringify(rules), {
    headers: { "content-type": "application/speculationrules+json" },
  });
}
