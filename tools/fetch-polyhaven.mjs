import { mkdir, writeFile, stat } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const root = process.cwd();
const out = (...p) => join(root, 'public', 'assets', ...p);

const MODELS = [
  'old_bed_frame',
  'metal_office_desk',
  'GothicCabinet_01',
  'drawer_cabinet',
  'wooden_bookshelf_worn',
  'wheelchair_01',
  'portable_generator',
  'vintage_radio_transceiver',
  'wall_clock',
  'desk_lamp_arm_01',
  'medical_box',
  'crowbar_01',
  'ornate_mirror_01',
  'vintage_grandfather_clock_01',
  'painted_wooden_chair_01',
  'metal_stool_01',
  'WoodenTable_01',
  'vintage_cabinet_01',
  'Shelf_01',
  'SchoolChair_01',
  'SchoolDesk_01',
  'hanging_industrial_lamp',
  'industrial_caged_sconce',
  'vintage_day_bed',
];

const TEXTURES = [
  ['decrepit_wallpaper', ['Diffuse', 'nor_gl', 'Rough', 'AO']],
  ['painted_plaster_wall', ['Diffuse', 'nor_gl', 'Rough']],
  ['dirty_tiles', ['Diffuse', 'nor_gl', 'Rough']],
  ['old_wooden_floor_02', ['Diffuse', 'nor_gl', 'Rough']],
  ['diagonal_parquet', ['Diffuse', 'nor_gl', 'Rough']],
  ['dirty_carpet', ['Diffuse', 'nor_gl', 'Rough']],
  ['dark_wood', ['Diffuse', 'nor_gl', 'Rough']],
  ['long_white_tiles', ['Diffuse', 'nor_gl', 'Rough']],
  ['ceiling_interior', ['Diffuse', 'nor_gl', 'Rough']],
  ['painted_metal_shutter', ['Diffuse', 'nor_gl', 'Rough']],
  ['concrete_floor_damaged_01', ['Diffuse', 'nor_gl', 'Rough']],
];

async function exists(path) {
  try { const s = await stat(path); return s.size > 100; } catch { return false; }
}

async function download(url, path, label) {
  if (await exists(path)) { console.log('  ✓', label); return; }
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'HushwoodAssetFetcher/1.0' } });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, buf);
      console.log('  ↓', label, `${(buf.length / 1024).toFixed(0)} KB`);
      return;
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
}

console.log('Poly Haven models');
for (const slug of MODELS) {
  try {
    const meta = await (await fetch(`https://api.polyhaven.com/files/${slug}`)).json();
    const gltf = meta?.gltf?.['1k']?.gltf;
    if (!gltf) { console.log('  ! no 1k gltf', slug); continue; }
    const dir = out('models', slug);
    await download(gltf.url, join(dir, `${slug}_1k.gltf`), `${slug}.gltf`);
    for (const [rel, info] of Object.entries(gltf.include || {})) {
      await download(info.url, join(dir, rel), `${slug}/${rel}`);
    }
  } catch (error) {
    console.log('  ! failed', slug, error.message);
  }
}

console.log('Poly Haven textures');
for (const [slug, maps] of TEXTURES) {
  try {
    const meta = await (await fetch(`https://api.polyhaven.com/files/${slug}`)).json();
    for (const map of maps) {
      const info = meta?.[map]?.['1k']?.jpg;
      if (!info) { console.log('  ! missing', slug, map); continue; }
      await download(info.url, out('textures', slug, `${slug}_${map}_1k.jpg`), `${slug}/${map}`);
    }
  } catch (error) {
    console.log('  ! failed', slug, error.message);
  }
}

console.log('HDRI');
const hdri = JSON.parse(await (await fetch('https://api.polyhaven.com/files/childrens_hospital')).text());
await download(hdri.hdri['1k'].hdr.url, out('hdri', 'childrens_hospital_1k.hdr'), 'childrens_hospital_1k.hdr');

console.log('Done.');
