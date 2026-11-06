// Generate the public PDF from this project's rendered HTML, never a separate
// private resume source. Build/start the local site first; see README.md.
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
  const pdf = await page.pdf({
    // Keep the existing single-page Letter format without cutting any claims.
    format: "Letter", scale: 0.95, printBackground: false, tagged: true,
    margin: { top: "0.4in", bottom: "0.4in", left: "0.45in", right: "0.45in" },
  });
  const output = fileURLToPath(new URL("../public/Victor_Ivanov_Resume.pdf", import.meta.url));
  await writeFile(output, pdf);
  console.log(`Generated the public resume from the local HTML (${pdf.length} bytes).`);
} finally {
  await browser.close();
}
