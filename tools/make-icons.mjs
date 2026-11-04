import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const dir = 'public/icons';
await mkdir(dir, { recursive: true });

const jobs = [
  { src: `${dir}/icon.svg`, size: 192, out: `${dir}/icon-192.png` },
  { src: `${dir}/icon.svg`, size: 512, out: `${dir}/icon-512.png` },
  { src: `${dir}/icon-maskable.svg`, size: 512, out: `${dir}/icon-maskable-512.png` },
  { src: `${dir}/icon.svg`, size: 180, out: `${dir}/apple-touch-icon.png` },
  { src: `${dir}/icon.svg`, size: 32, out: `${dir}/favicon-32.png` },
];

for (const job of jobs) {
  await sharp(job.src, { density: 384 })
    .resize(job.size, job.size, { fit: 'cover' })
    .png({ compressionLevel: 9, palette: true })
    .toFile(job.out);
  console.log('wrote', job.out);
}
