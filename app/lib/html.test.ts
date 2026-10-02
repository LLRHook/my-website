import { describe, it, expect } from "vitest";
import { esc, page, PAGES, personMicrodata, render } from "./html";
import { SITE_URL } from "./constants";

describe("HTML documents", () => {
  it("renders escaped module URLs at the end of the body only when supplied", () => {
    const options = { path: "/projects", title: "Projects", description: "Projects", body: "" };
    expect(page(options)).not.toContain("<script");
    expect(page({ ...options, scripts: ['/game/main.js?x="&'] })).toContain('<script type="module" src="/game/main.js?x=&quot;&amp;"></script></body>');
  });
  it("escapes all five special characters", () => {
    expect(esc('&<>"\'')).toBe("&amp;&lt;&gt;&quot;&#39;");
  });
  it("renders document metadata without scripts", () => {
    const html = page({ path: "/", title: '<Title & "test">', description: "Description", body: "<h1>Home</h1>" });
    expect(html.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(html).toContain("<title>&lt;Title &amp; &quot;test&quot;&gt;</title>");
    expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/">`);
    expect(html).toContain('<link rel="stylesheet" href="/retro.css">');
    expect(html).not.toContain("<script");
  });
  it("marks only the current page and links every other page", () => {
    const html = page({ path: "/about", title: "About", description: "About", body: "" });
    expect(html.match(/aria-current=/g)).toHaveLength(1);
    expect(html).toContain('<strong aria-current="page">About Me</strong>');
    for (const item of PAGES.filter((item) => item.path !== "/about")) {
      expect(html).toContain(`<a href="${item.path}">${item.label}</a>`);
    }
  });
  it("emits share-card and indexing metadata", () => {
    const html = page({ path: "/", title: "Home", description: "Home", body: "" });
    expect(html).toContain('<meta name="robots" content="index,follow,max-image-preview:large">');
    expect(html).toContain(`<meta property="og:image" content="${SITE_URL}/og-image.png">`);
    expect(html).toContain('<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">');
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image">');
    expect(html).toContain('<meta property="og:type" content="website">');
    expect(html).not.toContain('class="crumbs"');
  });
  it("gives subpages breadcrumbs and About a profile type", () => {
    const html = page({ path: "/about", title: "About", description: "About", body: "" });
    expect(html).toContain('<nav class="crumbs" aria-label="Breadcrumb">You are here: <ol itemscope itemtype="https://schema.org/BreadcrumbList">');
    expect(html).toContain('<a itemprop="item" href="/"><span itemprop="name">Home</span></a><meta itemprop="position" content="1">');
    expect(html).toContain('<span itemprop="name">About Me</span><meta itemprop="position" content="2">');
    expect(html).toContain('<meta property="og:type" content="profile">');
  });
  it("links Victor's profiles with rel=me", () => {
    const html = page({ path: "/", title: "Home", description: "Home", body: "" });
    expect(html).toContain('href="https://github.com/LLRHook" rel="me"');
    expect(html).toContain('href="https://www.linkedin.com/in/victorivanovofficial/" rel="me"');
  });
  it("gives every page a unique title and description", () => {
    expect(new Set(PAGES.map((item) => item.title)).size).toBe(PAGES.length);
    expect(new Set(PAGES.map((item) => item.description)).size).toBe(PAGES.length);
  });
  it("keeps unknown pages out of the index", () => {
    const html = page({ path: "", title: "Page not found", description: "Missing", body: "" });
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toContain('rel="canonical"');
    expect(html).not.toContain('property="og:url"');
  });
  it("escapes Person microdata attributes", () => {
    expect(personMicrodata('itemprop="mainEntity"')).toMatch(/^<div itemprop="mainEntity" itemscope itemtype="https:\/\/schema\.org\/Person"/);
    expect(personMicrodata()).toContain('<meta itemprop="name" content="University of Maryland, Baltimore County">');
  });
  it("returns the supplied status and HTML content type", async () => {
    const response = render("/contact", "<h1>Contact</h1>", 202);
    expect(response.status).toBe(202);
    expect(response.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await response.text()).toContain("<h1>Contact</h1>");
  });
});
