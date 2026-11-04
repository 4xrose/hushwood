import * as THREE from 'three';

const TEXTURE_DEFS = {
  decrepit_wallpaper: ['decrepit_wallpaper_Diffuse_1k.webp', 'decrepit_wallpaper_nor_gl_1k.webp', 'decrepit_wallpaper_Rough_1k.webp'],
  painted_plaster_wall: ['painted_plaster_wall_Diffuse_1k.webp', 'painted_plaster_wall_nor_gl_1k.webp', 'painted_plaster_wall_Rough_1k.webp'],
  dirty_tiles: ['dirty_tiles_Diffuse_1k.webp', 'dirty_tiles_nor_gl_1k.webp', 'dirty_tiles_Rough_1k.webp'],
  old_wooden_floor_02: ['old_wooden_floor_02_Diffuse_1k.webp', 'old_wooden_floor_02_nor_gl_1k.webp', 'old_wooden_floor_02_Rough_1k.webp'],
  diagonal_parquet: ['diagonal_parquet_Diffuse_1k.webp', 'diagonal_parquet_nor_gl_1k.webp', 'diagonal_parquet_Rough_1k.webp'],
  dirty_carpet: ['dirty_carpet_Diffuse_1k.webp', 'dirty_carpet_nor_gl_1k.webp', 'dirty_carpet_Rough_1k.webp'],
  dark_wood: ['dark_wood_Diffuse_1k.webp', 'dark_wood_nor_gl_1k.webp', 'dark_wood_Rough_1k.webp'],
  long_white_tiles: ['long_white_tiles_Diffuse_1k.webp', 'long_white_tiles_nor_gl_1k.webp', 'long_white_tiles_Rough_1k.webp'],
  ceiling_interior: ['ceiling_interior_Diffuse_1k.webp', 'ceiling_interior_nor_gl_1k.webp', 'ceiling_interior_Rough_1k.webp'],
  painted_metal_shutter: ['painted_metal_shutter_Diffuse_1k.webp', 'painted_metal_shutter_nor_gl_1k.webp', 'painted_metal_shutter_Rough_1k.webp'],
  concrete_floor_damaged_01: ['concrete_floor_damaged_01_Diffuse_1k.webp', 'concrete_floor_damaged_01_nor_gl_1k.webp', 'concrete_floor_damaged_01_Rough_1k.webp'],
};

function loadTexture(loader, slug, file, color = false) {
  const base = import.meta.env.BASE_URL || '/';
  const texture = loader.loadAsync(`${base}assets/textures/${slug}/${file}`).then((tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    if (color) tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  });
  return texture;
}

export class Materials {
  constructor() {
    this.loader = new THREE.TextureLoader();
    this.textures = {};
    this.materials = {};
    this.canvasTextures = [];
  }

  async load(progress = () => {}) {
    const jobs = [];
    const total = Object.values(TEXTURE_DEFS).reduce((n, def) => n + def.length, 0);
    let done = 0;
    for (const [slug, [diff, normal, rough]] of Object.entries(TEXTURE_DEFS)) {
      const set = {};
      jobs.push(loadTexture(this.loader, slug, diff, true).then((t) => { set.diffuse = t; done++; progress(done / total); }));
      jobs.push(loadTexture(this.loader, slug, normal).then((t) => { set.normal = t; done++; progress(done / total); }));
      jobs.push(loadTexture(this.loader, slug, rough).then((t) => { set.rough = t; done++; progress(done / total); }));
      this.textures[slug] = set;
    }
    await Promise.all(jobs);
    this.buildMaterials();
  }

  buildMaterials() {
    const make = (name, slug, options = {}) => {
      const set = this.textures[slug];
      const mat = new THREE.MeshStandardMaterial({
        map: set?.diffuse,
        normalMap: set?.normal,
        roughnessMap: set?.rough,
        roughness: options.roughness ?? 0.88,
        metalness: options.metalness ?? 0,
        color: options.color ?? 0xffffff,
        envMapIntensity: options.envMapIntensity ?? 0.35,
        side: options.side ?? THREE.FrontSide,
      });
      if (options.emissive) {
        mat.emissive = new THREE.Color(options.emissive);
        mat.emissiveIntensity = options.emissiveIntensity ?? 0.1;
      }
      mat.name = name;
      return mat;
    };

    this.materials.wallpaper = make('wallpaper', 'decrepit_wallpaper', { color: 0xb9b0a1, roughness: 0.92 });
    this.materials.wallpaperGreen = make('wallpaperGreen', 'decrepit_wallpaper', { color: 0x86978a, roughness: 0.92 });
    this.materials.plaster = make('plaster', 'painted_plaster_wall', { color: 0x9c978a, roughness: 0.95 });
    this.materials.plasterCool = make('plasterCool', 'painted_plaster_wall', { color: 0x859196, roughness: 0.95 });
    this.materials.tile = make('tile', 'dirty_tiles', { color: 0xb0c0b6, roughness: 0.65 });
    this.materials.whiteTile = make('whiteTile', 'long_white_tiles', { color: 0xb4bdb6, roughness: 0.58 });
    this.materials.woodFloor = make('woodFloor', 'old_wooden_floor_02', { color: 0x9c8466, roughness: 0.8 });
    this.materials.parquet = make('parquet', 'diagonal_parquet', { color: 0x8d7258, roughness: 0.72 });
    this.materials.carpet = make('carpet', 'dirty_carpet', { color: 0x746558, roughness: 1 });
    this.materials.darkWood = make('darkWood', 'dark_wood', { color: 0x7a5e44, roughness: 0.78 });
    this.materials.ceiling = make('ceiling', 'ceiling_interior', { color: 0xaaa08e, roughness: 0.98 });
    this.materials.basementWall = make('basementWall', 'painted_metal_shutter', { color: 0x65706b, roughness: 0.75, metalness: 0.25 });
    this.materials.concrete = make('concrete', 'concrete_floor_damaged_01', { color: 0x8a8a82, roughness: 0.98 });
    this.materials.atticWood = make('atticWood', 'dark_wood', { color: 0x6c513b, roughness: 0.9 });
    this.materials.doorWood = make('doorWood', 'dark_wood', { color: 0x896b50, roughness: 0.76 });
    this.materials.trim = new THREE.MeshStandardMaterial({ color: 0x3f3226, roughness: 0.8, metalness: 0.02 });
    this.materials.brass = new THREE.MeshStandardMaterial({ color: 0xa47b3d, metalness: 0.82, roughness: 0.32, envMapIntensity: 0.8 });
    this.materials.oldBrass = new THREE.MeshStandardMaterial({ color: 0x74582f, metalness: 0.72, roughness: 0.45 });
    this.materials.iron = new THREE.MeshStandardMaterial({ color: 0x242525, metalness: 0.75, roughness: 0.5 });
    this.materials.blackMetal = new THREE.MeshStandardMaterial({ color: 0x111616, metalness: 0.65, roughness: 0.45 });
    this.materials.glass = new THREE.MeshPhysicalMaterial({
      color: 0x384a4b, metalness: 0.1, roughness: 0.15, transmission: 0.02, opacity: 0.52,
      transparent: true, side: THREE.DoubleSide, envMapIntensity: 0.6,
    });
    this.materials.darkGlass = new THREE.MeshStandardMaterial({ color: 0x0b1110, metalness: 0.2, roughness: 0.15, transparent: true, opacity: 0.82 });
    this.materials.fabricCream = new THREE.MeshStandardMaterial({ color: 0xb4aa95, roughness: 0.98 });
    this.materials.fabricGrey = new THREE.MeshStandardMaterial({ color: 0x777a73, roughness: 1 });
    this.materials.fabricOx = new THREE.MeshStandardMaterial({ color: 0x6e2f2b, roughness: 1 });
    this.materials.paper = new THREE.MeshStandardMaterial({ color: 0xc9bfa7, roughness: 0.95, side: THREE.DoubleSide });
    this.materials.ink = new THREE.MeshBasicMaterial({ color: 0x1b1915 });
    this.materials.ceramic = new THREE.MeshStandardMaterial({ color: 0xc6c5b8, roughness: 0.35 });
    this.materials.water = new THREE.MeshPhysicalMaterial({ color: 0x091211, roughness: 0.08, metalness: 0.15, transmission: 0.1, opacity: 0.92, transparent: true, envMapIntensity: 0.5 });
    this.materials.wax = new THREE.MeshStandardMaterial({ color: 0xd7c7a7, roughness: 0.8 });
    this.materials.flame = new THREE.MeshBasicMaterial({ color: 0xffbb66, transparent: true, opacity: 0.92 });
    this.materials.emissiveWarm = new THREE.MeshStandardMaterial({ color: 0xffd5a0, emissive: 0xffa34f, emissiveIntensity: 1.4, roughness: 0.5 });
    this.materials.emissiveRed = new THREE.MeshStandardMaterial({ color: 0xa5231e, emissive: 0xa5231e, emissiveIntensity: 1.8, roughness: 0.4 });
    this.materials.emissiveGreen = new THREE.MeshStandardMaterial({ color: 0x4d8d71, emissive: 0x4d8d71, emissiveIntensity: 1.2, roughness: 0.4 });
    this.materials.apatite = new THREE.MeshStandardMaterial({ color: 0x86a0a0, roughness: 0.4, metalness: 0.1 });
    this.materials.mothWing = new THREE.MeshStandardMaterial({ color: 0x8a7b61, roughness: 0.9, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
    this.materials.black = new THREE.MeshStandardMaterial({ color: 0x070909, roughness: 0.9 });
    this.materials.obsidian = new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.3, metalness: 0.4 });

    // World code addresses materials directly (`world.materials.darkWood`).
    // Keep the registry for bookkeeping and expose each material on the instance.
    Object.assign(this, this.materials);
  }

  get(name) {
    return this.materials[name] || this.materials.plaster;
  }

  canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    draw(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    this.canvasTextures.push(texture);
    return texture;
  }

  signTexture(text, { w = 512, h = 128, bg = '#2b2a24', fg = '#c9b98e', border = '#7b6c4e', sub = '' } = {}) {
    return this.canvasTexture(w, h, (ctx, width, height) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = border;
      ctx.lineWidth = 5;
      ctx.strokeRect(10, 10, width - 20, height - 20);
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `600 ${Math.floor(height * 0.38)}px "Cormorant Garamond", Georgia, serif`;
      ctx.fillText(text, width / 2, sub ? height * 0.43 : height * 0.52);
      if (sub) {
        ctx.font = `400 ${Math.floor(height * 0.18)}px "Special Elite", "Courier New", monospace`;
        ctx.fillStyle = '#9a8b6e';
        ctx.fillText(sub, width / 2, height * 0.75);
      }
    });
  }

  paperTexture(kind = 'note') {
    return this.canvasTexture(512, 640, (ctx, w, h) => {
      ctx.fillStyle = '#c5baa2';
      ctx.fillRect(0, 0, w, h);
      const grad = ctx.createRadialGradient(w * 0.5, h * 0.4, 30, w * 0.5, h * 0.5, w * 0.7);
      grad.addColorStop(0, 'rgba(255,245,215,0.20)');
      grad.addColorStop(1, 'rgba(42,30,14,0.28)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = 'rgba(75,56,35,0.22)';
      ctx.lineWidth = 1;
      for (let y = 80; y < h - 40; y += 34) {
        ctx.beginPath();
        ctx.moveTo(32, y);
        ctx.lineTo(w - 32, y);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(43,34,24,0.8)';
      ctx.font = 'italic 26px Georgia, serif';
      const lines = kind === 'chart'
        ? ['HUSHWOOD INSTITUTE', 'PATIENT RECORD', '', 'BED: ______', 'STAGE: ______', '', 'comfort: ______']
        : kind === 'drawing'
          ? ['THE LADY WITH', 'THE BELL', 'HAS NO EYES', '', 'SHE SEES WITH', 'HER EARS']
          : ['Dear Mara,', '', 'the children are still', 'asleep. Come back.', '', '— E.'];
      lines.forEach((line, i) => ctx.fillText(line, 55, 125 + i * 48));
      if (kind === 'drawing') {
        ctx.strokeStyle = '#5e3029';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(350, 440, 58, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(320, 430);
        ctx.lineTo(380, 430);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(350, 440);
        ctx.lineTo(350, 510);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(350, 520, 50, 0.2, Math.PI - 0.2);
        ctx.stroke();
      }
    });
  }
}
