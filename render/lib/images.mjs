/* Existing sharp only: source photographs/logo stay read-only in public/. */
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const repo = path.resolve(root, '..');
const generated = path.join(root, 'assets', 'generated');
const svg = (w, h, contents) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${contents}</svg>`);

const esc = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;');

async function textures() {
  await fs.mkdir(generated, { recursive: true });
  await sharp(path.join(repo, 'public', 'bww-logo.svg'), { density: 1200 }).resize(700, 700).png().toFile(path.join(generated, 'bww-logo.png'));
  const logo = await sharp(path.join(generated, 'bww-logo.png')).resize(560, 560).toBuffer();
  await sharp(svg(1000, 700, '<rect width="1000" height="700" fill="#f7bc2a"/>')).composite([
    { input: logo, left: 220, top: 30 },
    { input: svg(1000, 100, '<text x="500" y="65" text-anchor="middle" font-family="Arial" font-size="37" font-weight="bold" fill="#382e2c">BUFFALO WILD WINGS</text>'), left: 0, top: 575 }
  ]).png().toFile(path.join(generated, 'carton-front.png'));
  await sharp(svg(1800, 1300, `<rect width="1800" height="1300" fill="#f1eee4"/>
    <rect x="65" y="65" width="1670" height="1170" fill="none" stroke="#ad975f" stroke-width="8"/>
    <rect x="85" y="85" width="1630" height="1130" fill="none" stroke="#ad975f" stroke-width="2"/>
    <g fill="#303431" text-anchor="middle" font-family="Times New Roman, serif">
    <text x="900" y="280" font-size="68">University of Maryland,</text><text x="900" y="370" font-size="68">Baltimore County</text>
    <text x="900" y="650" font-size="94">Bachelor of Science</text>
    <text x="900" y="805" font-size="64">Computer Science</text></g>
    <circle cx="900" cy="1040" r="86" fill="none" stroke="#b19b5b" stroke-width="8"/>
    <circle cx="900" cy="1040" r="72" fill="none" stroke="#b19b5b" stroke-width="2"/>
    <text x="900" y="1054" font-size="37" fill="#8f7b46" text-anchor="middle" font-family="Times New Roman, serif">UMBC</text>`)).png().toFile(path.join(generated, 'diploma.png'));
  const photos = [
    ['profile', 'victor-profile.jpg', "hello, I'm Victor"],
    ['conference', 'conference-photo.jpg', 'away from the desk.'],
    ['peru', 'peru-travel.webp', 'Peru, September 2026']
  ];
  for (const [name, file, label] of photos) {
    const [w, h] = name === 'profile' ? [1000, 1500] : [1500, 1000];
    const image = await sharp(path.join(repo, 'public', file)).rotate().resize(w - 120, h - 220, { fit: 'cover' }).toBuffer();
    await sharp(svg(w, h, `<rect width="${w}" height="${h}" fill="#faf9f5"/>`)).composite([
      { input: image, left: 60, top: 60 },
      { input: svg(w, 160, `<text x="${w / 2}" y="98" font-size="46" text-anchor="middle" font-family="Arial" fill="#252525">${esc(label)}</text>`), left: 0, top: h - 160 }
    ]).png().toFile(path.join(generated, `photo_${name}.png`));
  }
  await sharp(svg(760, 760, `<rect width="760" height="760" fill="#f4df79"/>
    <g fill="#35352c" text-anchor="middle" font-family="Comic Sans MS, cursive" font-size="100">
    <text x="380" y="300">one more</text><text x="380" y="450">commit.</text></g>`)).png().toFile(path.join(generated, 'sticky.png'));
  console.log('Generated diploma, 3 labelled polaroids, sticky note and BWW carton with sharp', sharp.versions.sharp);
}

async function atlas() {
  await fs.mkdir(generated, { recursive: true });
  const reds = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
  const cells = [];
  for (let number = 0; number < 37; number++) {
    const color = number === 0 ? '#075223' : reds.has(number) ? '#86060b' : '#030303';
    const left = (number % 8) * 512;
    const top = Math.floor(number / 8) * 512;
    cells.push(`<g transform="translate(${left},${top})"><rect width="512" height="512" fill="${color}"/>
      <text x="256" y="432" text-anchor="middle" font-family="Liberation Sans Narrow" font-weight="bold" font-size="495" fill="#ffffff">${number}</text></g>`);
  }
  await sharp(svg(4096, 4096, cells.join(''))).png().toFile(path.join(generated, 'roulette_numbers.png'));
}

async function contact(dir) {
  const labels = ['day_lamp_on', 'day_lamp_off', 'night_lamp_on', 'night_lamp_off'];
  const tiles = [];
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const left = (i % 2) * 820;
    const top = Math.floor(i / 2) * 515;
    tiles.push({ input: await sharp(path.join(dir, `${label}.png`)).resize(800, 450).toBuffer(), left: left + 10, top: top + 45 });
    tiles.push({ input: svg(800, 35, `<text x="8" y="26" fill="#eeeeee" font-family="Arial" font-size="23">${label.replaceAll('_', ' ')}</text>`), left: left + 10, top: top + 5 });
  }
  await sharp({ create: { width: 1640, height: 1030, channels: 3, background: '#202327' } }).composite(tiles).png().toFile(path.join(dir, 'contact.png'));
  console.log('CONTACT COMPLETE:', path.join(dir, 'contact.png'));
}

if (process.argv[2] === 'contact') await contact(process.argv[3]);
else await textures().then(atlas);
