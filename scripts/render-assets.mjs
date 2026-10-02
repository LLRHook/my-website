// Regenerates the favicon set and the share card: `npm run assets`.
// Output is committed; the site itself never runs this.
import { readFile, writeFile } from "node:fs/promises";
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
const portrait = `data:image/png;base64,${(await readFile(out("victor-profile.jpg"))).toString("base64")}`;

const card = `<!DOCTYPE html><html><head><style>
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; background: #c0c0c0; font-family: "Times New Roman", Times, serif; padding: 36px; }
.page { height: 100%; background: #fff; border: 6px outset #dfdfdf; display: flex; flex-direction: column; }
.marquee { background: #000080; color: #ff0; font: bold 26px "Courier New", monospace; padding: 10px 24px; white-space: nowrap; overflow: hidden; text-align: center; }
.body { flex: 1; display: flex; gap: 40px; align-items: center; padding: 0 48px; }
img.portrait { width: 220px; height: 220px; border: 4px ridge #808080; image-rendering: auto; }
h1 { color: #800000; font-size: 76px; line-height: 1; }
h2 { color: #000080; font-size: 40px; margin-top: 14px; }
p { font-size: 30px; margin-top: 18px; }
a { color: #0000ee; text-decoration: underline; }
.badges { display: flex; gap: 16px; padding: 0 48px 28px; }
.badge { width: 176px; height: 62px; border: 4px outset #dfdfdf; background: #c0c0c0; font: 16px/1.15 Verdana, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; }
.badge b { font-size: 20px; }
</style></head><body><div class="page">
<div class="marquee">&#9733; Welcome to my home page! &#9733; Senior Full-Stack Engineer</div>
<div class="body"><img class="portrait" src="${portrait}" alt=""><div>
<h1>Victor Ivanov</h1><h2>Senior Full-Stack Engineer</h2><p>Sterling, Virginia &middot; <a>victorivanov.engineer</a></p>
</div></div>
<div class="badges"><span class="badge">Best viewed with<b>ANY browser</b></span><span class="badge"><b>100%</b>JavaScript free</span><span class="badge">Served by<b>Next.js</b></span></div>
</div></body></html>`;

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
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(card);
  const share = await page.screenshot();
  await writeFile(out("favicon.svg"), svg);
  await writeFile(out("favicon.ico"), ico(icons));
  await writeFile(out("apple-touch-icon.png"), touch);
  await writeFile(out("og-image.png"), share);
} finally {
  await browser.close();
}
