import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const root = process.cwd();
const modelsDir = join(root, 'public', 'assets', 'models');
const texturesDir = join(root, 'public', 'assets', 'textures');
const hero = new Set(['old_bed_frame', 'metal_office_desk', 'GothicCabinet_01', 'ornate_mirror_01', 'vintage_grandfather_clock_01']);
const entries = await readdir(modelsDir, { withFileTypes: true });

console.log('Converting props to compressed GLB...');
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const slug = entry.name;
  const source = join(modelsDir, slug, `${slug}_1k.gltf`);
  try {
    await stat(source);
  } catch {
    console.log('  ! missing gltf', slug);
    continue;
  }
  const output = join(modelsDir, `${slug}.glb`);
  const args = [
    join(root, 'node_modules', '@gltf-transform', 'cli', 'bin', 'cli.js'),
    'optimize', source, output,
    '--compress', 'false',
    '--texture-compress', 'webp',
    '--texture-size', hero.has(slug) ? '1024' : '512',
    '--flatten', 'true',
    '--join', 'true',
    '--join-named', 'false',
    '--palette', 'false',
    '--simplify', 'true',
    '--simplify-error', '0.005',
    '--instance', 'false',
    '--prune', 'true',
  ];
  try {
    execFileSync(process.execPath, args, { stdio: 'pipe', cwd: root });
    const outStat = await stat(output);
    console.log('  ✓', slug, `${(outStat.size / 1024).toFixed(0)} KB`);
    await rm(join(modelsDir, slug), { recursive: true, force: true });
  } catch (error) {
    console.log('  ! failed', slug, error.message);
  }
}

console.log('Compressing environment textures...');
const textureDirs = await readdir(texturesDir, { withFileTypes: true });
for (const entry of textureDirs) {
  if (!entry.isDirectory()) continue;
  const dir = join(texturesDir, entry.name);
  for (const file of await readdir(dir)) {
    if (!file.endsWith('.jpg')) continue;
    const src = join(dir, file);
    const dest = src.replace(/\.jpg$/, '.webp');
    await sharp(src).resize({ width: 512, withoutEnlargement: true }).webp({ quality: 84 }).toFile(dest);
    await rm(src);
    console.log('  ✓', entry.name + '/' + basename(dest));
  }
}
console.log('Done.');
