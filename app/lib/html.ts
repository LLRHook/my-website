import { EMAIL_HREF, SITE_URL, SITE_TITLE, SITE_DESCRIPTION } from "./constants";

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export interface SitePage { path: string; label: string; title: string; description: string }
export const PAGES: readonly SitePage[] = [
  { path: "/", label: "Home", title: SITE_TITLE, description: SITE_DESCRIPTION },
  { path: "/about", label: "About Me", title: "About | Victor Ivanov", description: "Meet Victor Ivanov, a senior full-stack engineer in Sterling, Virginia building certification software and developer tools." },
  { path: "/projects", label: "Projects", title: "Projects | Victor Ivanov", description: "Explore Victor Ivanov's web products, developer tools, and open-source contributions, including MailIt, Citybase, and Kilo." },
  { path: "/resume", label: "Resume", title: "Resume | Victor Ivanov", description: "Victor Ivanov's September 2026 resume: engineering experience, selected projects, education, technical skills, and a downloadable PDF." },
  { path: "/off-the-clock", label: "Off the Clock", title: "Off the clock | Victor Ivanov", description: "Away from the desk: rock climbing, cards, books, travel, and side projects." },
  { path: "/contact", label: "Contact", title: "Contact | Victor Ivanov", description: "Contact Victor Ivanov by email or connect on GitHub and LinkedIn. Based in Virginia, on Eastern time." },
];

export function page(options: { path: string; title: string; description: string; body: string }): string {
  const url = esc(SITE_URL + options.path);
  const title = esc(options.title);
  const description = esc(options.description);
  const now = new Date();
  const navigation = PAGES.map((item) => item.path === options.path
    ? `<strong aria-current="page">${esc(item.label)}</strong>`
    : `<a href="${esc(item.path)}">${esc(item.label)}</a>`).join(" | ");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}">
<meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta property="og:image" content="${esc(SITE_URL + "/victor-profile.jpg")}"><meta name="twitter:card" content="summary">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/retro.css"></head>
<body><a class="skip" href="#main">Skip to content</a><div class="page">
<header class="masthead"><p class="site-name"><a href="/">Victor Ivanov's Home Page</a></p>
<div class="marquee" aria-hidden="true"><span>&#9733; Welcome to my home page! &#9733; Senior Full-Stack Engineer &#9733; Java &middot; Spring Boot &middot; React &middot; TypeScript &#9733; Open to on-site and hybrid roles &#9733;</span></div>
<nav aria-label="Site">[ ${navigation} ]</nav></header><hr><main id="main">${options.body}</main><hr>
<footer><p class="buttons"><span class="badge badge-any">Best viewed with<br><b>ANY</b> browser</span><span class="badge badge-nojs"><b>100%</b><br>JavaScript free</span><span class="badge badge-next">Served by<br><b>Next.js</b></span></p>
<p>&copy; ${esc(String(now.getFullYear()))} Victor Ivanov &middot; <a href="${esc(EMAIL_HREF)}">victor.n.ivanov@gmail.com</a> &middot; <a href="mailto:victor.n.ivanov@gmail.com?subject=Guestbook">Sign my guestbook</a></p>
<p class="updated">Last updated: ${esc(now.toLocaleDateString("en-US", { month: "long", year: "numeric" }))}</p></footer>
</div></body></html>`;
}

export function htmlResponse(html: string, status = 200): Response {
  return new Response(html, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

export function render(path: string, body: string, status = 200): Response {
  const item = PAGES.find((item) => item.path === path)!;
  return htmlResponse(page({ path, title: item.title, description: item.description, body }), status);
}
