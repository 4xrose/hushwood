import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const res = 'android/app/src/main/res';
const icon = 'public/icons/icon.svg';
const maskable = 'public/icons/icon-maskable.svg';

const densities = [
  ['mdpi', 48, 108],
  ['hdpi', 72, 162],
  ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324],
  ['xxxhdpi', 192, 432],
];

for (const [density, legacy, foreground] of densities) {
  const dir = join(res, `mipmap-${density}`);
  await mkdir(dir, { recursive: true });
  await sharp(icon, { density: 384 }).resize(legacy, legacy).png({ compressionLevel: 9 }).toFile(join(dir, 'ic_launcher.png'));
  await sharp(icon, { density: 384 }).resize(legacy, legacy).png({ compressionLevel: 9 }).toFile(join(dir, 'ic_launcher_round.png'));
  await sharp(maskable, { density: 384 }).resize(foreground, foreground).png({ compressionLevel: 9 }).toFile(join(dir, 'ic_launcher_foreground.png'));
  console.log('mipmap', density, legacy, foreground);
}

const splashSizes = [
  ['drawable', 480, 320],
  ['drawable-land-mdpi', 480, 320],
  ['drawable-land-hdpi', 800, 480],
  ['drawable-land-xhdpi', 1280, 720],
  ['drawable-land-xxhdpi', 1600, 960],
  ['drawable-land-xxxhdpi', 1920, 1280],
  ['drawable-port-mdpi', 320, 480],
  ['drawable-port-hdpi', 480, 800],
  ['drawable-port-xhdpi', 720, 1280],
  ['drawable-port-xxhdpi', 960, 1600],
  ['drawable-port-xxxhdpi', 1280, 1920],
];

for (const [dirName, width, height] of splashSizes) {
  const dir = join(res, dirName);
  await mkdir(dir, { recursive: true });
  const iconSize = Math.round(Math.min(width, height) * 0.24);
  const iconBuffer = await sharp(icon, { density: 512 }).resize(iconSize, iconSize).png().toBuffer();
  const backdrop = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <defs><radialGradient id="g" cx="50%" cy="42%" r="62%">
      <stop offset="0" stop-color="#16201b"/><stop offset="0.55" stop-color="#0a0f0d"/><stop offset="1" stop-color="#030504"/>
    </radialGradient></defs>
    <rect width="${width}" height="${height}" fill="url(#g)"/>
    <circle cx="${width / 2}" cy="${height / 2}" r="${iconSize * 0.86}" fill="none" stroke="#b39455" stroke-opacity="0.18" stroke-width="1.5"/>
  </svg>`);
  await sharp(backdrop)
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toFile(join(dir, 'splash.png'));
  console.log('splash', dirName, `${width}x${height}`);
}
