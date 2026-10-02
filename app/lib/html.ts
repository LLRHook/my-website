import { EMAIL_HREF, GITHUB_HREF, KNOWS_ABOUT, SITE_NAME, SITE_URL, SITE_TITLE, SITE_DESCRIPTION, SOCIAL_BY_ICON, SOCIAL_LINKS } from "./constants";

export function esc(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!);
}

export interface SitePage { path: string; label: string; title: string; description: string }
export const PAGES: readonly SitePage[] = [
  { path: "/", label: "Home", title: SITE_TITLE, description: SITE_DESCRIPTION },
  { path: "/about", label: "About Me", title: "About | Victor Ivanov", description: "Meet Victor Ivanov, a senior full-stack engineer in Sterling, Virginia building certification software and developer tools." },
  { path: "/projects", label: "Projects", title: "Projects | Victor Ivanov", description: "Explore Victor Ivanov's web products, developer tools, and open-source contributions, including MailIt, Citybase, and Kilo." },
  { path: "/resume", label: "Resume", title: "Resume | Victor Ivanov", description: "Victor Ivanov's September 2026 resume: engineering experience, selected projects, education, technical skills, and a downloadable PDF." },
  { path: "/off-the-clock", label: "Off the Clock", title: "Off the clock | Victor Ivanov", description: "Victor Ivanov away from the desk: rock climbing, Pokémon and Magic cards, books, travel, and side projects." },
  { path: "/contact", label: "Contact", title: "Contact | Victor Ivanov", description: "Contact Victor Ivanov by email or connect on GitHub and LinkedIn. Based in Virginia, on Eastern time." },
];

// schema.org Person as microdata (no <script>, so no JSON-LD). `attributes`
// lets a wrapper claim it, e.g. ProfilePage's mainEntity.
export function personMicrodata(attributes = ""): string {
  const meta = (property: string, content: string) => `<meta itemprop="${property}" content="${esc(content)}">`;
  const link = (property: string, href: string) => `<link itemprop="${property}" href="${esc(href)}">`;
  return `<div ${attributes ? `${attributes} ` : ""}itemscope itemtype="https://schema.org/Person" itemid="${esc(SITE_URL)}/#person">${meta("name", "Victor Ivanov")}${meta("jobTitle", "Senior Full-Stack Engineer")}${link("url", SITE_URL + "/")}${link("image", SITE_URL + "/victor-profile.jpg")}${SOCIAL_LINKS.filter((item) => item.external).map((item) => link("sameAs", item.href)).join("")}`
    + `<div itemprop="worksFor" itemscope itemtype="https://schema.org/Organization">${meta("name", "Paradigm Testing")}</div>`
    + `<div itemprop="address" itemscope itemtype="https://schema.org/PostalAddress">${meta("addressLocality", "Sterling")}${meta("addressRegion", "VA")}${meta("addressCountry", "US")}</div>`
    + `<div itemprop="alumniOf" itemscope itemtype="https://schema.org/CollegeOrUniversity">${meta("name", "University of Maryland, Baltimore County")}${link("sameAs", "https://umbc.edu")}</div>`
    + `${KNOWS_ABOUT.map((topic) => meta("knowsAbout", topic)).join("")}</div>`;
}

export function page(options: { path: string; title: string; description: string; body: string }): string {
  const url = esc(SITE_URL + options.path);
  const title = esc(options.title);
  const description = esc(options.description);
  const known = PAGES.some((item) => item.path === options.path);
  const now = new Date();
  const current = PAGES.find((item) => item.path === options.path);
  const crumb = (position: number, name: string, href?: string) => `<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">${href ? `<a itemprop="item" href="${esc(href)}"><span itemprop="name">${esc(name)}</span></a>` : `<span itemprop="name">${esc(name)}</span>`}<meta itemprop="position" content="${position}"></li>`;
  const breadcrumbs = current && current.path !== "/"
    ? `<nav class="crumbs" aria-label="Breadcrumb">You are here: <ol itemscope itemtype="https://schema.org/BreadcrumbList">${crumb(1, "Home", "/")}${crumb(2, current.label)}</ol></nav>`
    : "";
  const navigation = PAGES.map((item) => item.path === options.path
    ? `<strong aria-current="page">${esc(item.label)}</strong>`
    : `<a href="${esc(item.path)}">${esc(item.label)}</a>`).join(" | ");
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title><meta name="description" content="${description}"><meta name="author" content="Victor Ivanov">${known ? `<meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${url}">` : '<meta name="robots" content="noindex">'}
<meta property="og:site_name" content="${esc(SITE_NAME)}"><meta property="og:locale" content="en_US"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}">${known ? `<meta property="og:url" content="${url}">` : ""}${options.path === "/about" ? '<meta property="og:type" content="profile"><meta property="profile:first_name" content="Victor"><meta property="profile:last_name" content="Ivanov">' : '<meta property="og:type" content="website">'}
<meta property="og:image" content="${esc(SITE_URL + "/og-image.png")}"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Victor Ivanov, Senior Full-Stack Engineer, on a 1990s-style home page card"><meta name="twitter:card" content="summary_large_image"><meta name="theme-color" content="#000080">
<link rel="icon" href="/favicon.ico" sizes="16x16 32x32 48x48"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png"><link rel="stylesheet" href="/retro.css"></head>
<body><a class="skip" href="#main">Skip to content</a><div class="page">
<header class="masthead"><p class="site-name"><a href="/">Victor Ivanov's Home Page</a></p>
<div class="marquee" aria-hidden="true"><span>&#9733; Welcome to my home page! &#9733; Senior Full-Stack Engineer &#9733; Java &middot; Spring Boot &middot; React &middot; TypeScript &#9733; Open to on-site and hybrid roles &#9733;</span></div>
<nav aria-label="Site">[ ${navigation} ]</nav></header><hr><main id="main">${breadcrumbs}${options.body}</main><hr>
<footer><p class="buttons"><span class="badge badge-any">Best viewed with<br><b>ANY</b> browser</span><span class="badge badge-nojs"><b>100%</b><br>JavaScript free</span><span class="badge badge-next">Served by<br><b>Next.js</b></span></p>
<p>&copy; ${esc(String(now.getFullYear()))} Victor Ivanov &middot; <a href="${esc(EMAIL_HREF)}">victor.n.ivanov@gmail.com</a> &middot; <a href="${esc(GITHUB_HREF)}" rel="me">GitHub</a> &middot; <a href="${esc(SOCIAL_BY_ICON.linkedin.href)}" rel="me">LinkedIn</a> &middot; <a href="mailto:victor.n.ivanov@gmail.com?subject=Guestbook">Sign my guestbook</a></p>
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
