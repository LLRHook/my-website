// Authoring only: npm run images. Originals and generated assets are committed;
// neither image processing nor JavaScript runs in the visitor's browser.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { basename } from "node:path";

const photos = [
  { name: "victor-profile", original: "victor-profile.jpg", width: 120, height: 120 },
  { name: "conference-photo", original: "conference-photo.jpg", width: 320, height: 320 },
  { name: "peru-travel", original: "peru-travel.webp", width: 320, height: 240 },
];
const asset = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

for (const { name, original, width, height } of photos) {
  for (const density of [1, 2]) {
    for (const format of ["avif", "webp"]) {
      const output = asset(`${name}-${density}x.${format}`);
      const image = sharp(asset(original)).rotate().resize(width * density, height * density, {
        fit: "inside", withoutEnlargement: true,
      });
      // Sharp strips EXIF/XMP by default. Preserve the source framing and never
      // upscale the 400px conference image to an artificial 640px source.
      const info = await image.toFormat(format, { quality: format === "avif" ? 55 : 75 }).toFile(output);
      console.log(`${basename(output)}: ${info.width}x${info.height}, ${info.size} bytes`);
    }
  }
}
