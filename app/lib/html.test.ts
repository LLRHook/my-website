import { describe, it, expect } from "vitest";
import { esc, page, PAGES, personMicrodata, render } from "./html";
import { SITE_URL } from "./constants";

describe("HTML documents", () => {
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
