// Generate the public resume PDF from the rendered /resume HTML.
// Build and start the local production server first; see README.md.
import { chromium } from "@playwright/test";
import { fileURLToPath } from "node:url";
import { writeFile } from "node:fs/promises";

const origin = new URL(process.argv[2] ?? "http://localhost:3000");
if (!["http:", "https:"].includes(origin.protocol) || !["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)) {
  throw new Error("Use the local production build's loopback origin, not a deployed or unrelated resume.");
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const response = await page.goto(new URL("/resume", origin).href);
  if (!response?.ok() || await page.locator("main h1").textContent() !== "Resume") {
    throw new Error("The local build did not return the resume page; PDF left unchanged.");
  }
  await page.emulateMedia({ media: "print" });
  // Letter size and margins come from the print stylesheet (@page), which lays the
  // sheet out like the owner's one-page application resume.
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: false, tagged: true });
  const pages = (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  if (pages !== 1) {
    throw new Error(`The resume PDF must be one page; it rendered ${pages}. PDF left unchanged.`);
  }
  const output = fileURLToPath(new URL("../public/Victor_Ivanov_Resume.pdf", import.meta.url));
  await writeFile(output, pdf);
  console.log(`Generated public/Victor_Ivanov_Resume.pdf from local /resume HTML (${pdf.length} bytes).`);
} finally {
  await browser.close();
}
