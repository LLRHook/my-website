// Regenerates the favicon set: `npm run assets`.
// Output is committed; the site itself never runs this.
import { writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const out = (name) => new URL(`../public/${name}`, import.meta.url);

// 16x16 icon: a raised Windows 95 style button with "VI" in navy.
// W white, S silver, D dark grey, K black, N navy.
const GRID = [
  "WWWWWWWWWWWWWWWK",
  "WSSSSSSSSSSSSSDK",
  "WSSSSSSSSSSSSSDK",
  "WSNNSSSNNSSNNSDK",
  "WSNNSSSNNSSNNSDK",
  "WSNNSSSNNSSNNSDK",
  "WSSNNSNNSSSNNSDK",
  "WSSNNSNNSSSNNSDK",
  "WSSNNSNNSSSNNSDK",
  "WSSSNNNSSSSNNSDK",
  "WSSSNNNSSSSNNSDK",
  "WSSSSNSSSSSNNSDK",
  "WSSSSSSSSSSSSSDK",
  "WSSSSSSSSSSSSSDK",
  "WDDDDDDDDDDDDDDK",
  "KKKKKKKKKKKKKKKK",
];
const COLORS = { W: "#fff", S: "#c0c0c0", D: "#808080", K: "#000", N: "#000080" };

function faviconSvg() {
  const rects = GRID.flatMap((row, y) => {
    const runs = [];
    for (let x = 0; x < row.length; ) {
      let end = x;
      while (row[end + 1] === row[x]) end++;
      runs.push(`<rect x="${x}" y="${y}" width="${end - x + 1}" height="1" fill="${COLORS[row[x]]}"/>`);
      x = end + 1;
    }
    return runs;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">\n${rects.join("\n")}\n</svg>\n`;
}

// An ICO file whose images are PNGs (supported by every current browser).
function ico(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, png }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size % 256, entry);
    header.writeUInt8(size % 256, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  return Buffer.concat([header, ...images.map(({ png }) => png)]);
}

const svg = faviconSvg();
const iconData = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const iconPng = async (size, canvas = size, background = "transparent") => {
    await page.setViewportSize({ width: canvas, height: canvas });
    const inset = (canvas - size) / 2;
    await page.setContent(`<body style="margin:0;background:${background}"><img src="${iconData}" style="display:block;position:absolute;left:${inset}px;top:${inset}px;width:${size}px;height:${size}px;image-rendering:pixelated"></body>`);
    return page.screenshot({ omitBackground: background === "transparent" });
  };
  const icons = [];
  for (const size of [16, 32, 48]) icons.push({ size, png: await iconPng(size) });
  const touch = await iconPng(176, 180, "#c0c0c0");
  await writeFile(out("favicon.svg"), svg);
  await writeFile(out("favicon.ico"), ico(icons));
  await writeFile(out("apple-touch-icon.png"), touch);
} finally {
  await browser.close();
}
