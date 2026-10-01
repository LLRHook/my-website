import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const here = import.meta.dirname;
const repo = path.resolve(here, '..');
const input = path.join(here, 'out', 'final');
const output = path.join(repo, 'public', 'room');
const variants = ['day_lamp_on', 'day_lamp_off', 'night_lamp_on', 'night_lamp_off'];
const details = ['diploma', 'books', 'pokeball', 'bww', 'plants'];
const widths = [1280, 1920, 2560];

async function encode(input, outBase, width) {
  await sharp(input).resize({ width }).avif({ quality: 60, effort: 6 }).toFile(`${outBase}.avif`);
  await sharp(input).resize({ width }).webp({ quality: 82, effort: 6 }).toFile(`${outBase}.webp`);
}

async function buildSprite(framePaths, columns) {
  const { width, height } = await sharp(framePaths[0]).metadata();
  const tiles = framePaths.map((file, index) => ({ input: file, left: (index % columns) * width, top: Math.floor(index / columns) * height }));
  return sharp({ create: { width: columns * width, height: Math.ceil(framePaths.length / columns) * height, channels: 3, background: '#000' } }).composite(tiles).png().toBuffer();
}

async function main() {
  await fs.mkdir(output, { recursive: true });
  const scene = JSON.parse(await fs.readFile(path.join(here, 'out', 'scene.json'), 'utf8'));
  for (const variant of variants) {
    for (const width of widths) {
      await encode(path.join(input, `${variant}.png`), path.join(output, `${variant}-${width}`), width);
    }
    const frames = Array.from({ length: scene.roulette.frames }, (_, frame) => path.join(input, 'roulette', variant, `${String(frame).padStart(3, '0')}.png`));
    const sprite = await buildSprite(frames, scene.roulette.columns);
    const { width } = await sharp(sprite).metadata();
    await encode(sprite, path.join(output, `roulette-${variant}`), width);
  }
  scene.details = {};
  for (const id of details) {
    const file = path.join(input, 'detail', `${id}.png`);
    const resized = await sharp(file).resize(1200, 1200, { fit: 'inside' }).png().toBuffer();
    const { width } = await sharp(resized).metadata();
    const base = path.join(output, `detail-${id}`);
    await encode(resized, base, width);
    const size = await sharp(`${base}.webp`).metadata();
    scene.details[id] = { width: size.width, height: size.height };
  }
  const data = { width: 2560, height: 1440, widths, variants, ...scene };
  await fs.writeFile(path.join(repo, 'app', 'lib', 'room-scene.json'), `${JSON.stringify(data, null, 2)}\n`);
  console.log('EXPORT COMPLETE:', output);
}

await main();
