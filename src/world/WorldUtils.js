import * as THREE from 'three';

const base = () => import.meta.env.BASE_URL || '/';

export function addBox(world, material, size, position, rotationY = 0, { parent = null, receive = true, cast = false } = {}) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), material);
  mesh.position.copy(position);
  mesh.rotation.y = rotationY;
  mesh.receiveShadow = receive;
  mesh.castShadow = cast;
  (parent || world.root).add(mesh);
  return mesh;
}

export function addPlane(world, material, width, height, position, rotation = { x: 0, y: 0, z: 0 }, { parent = null, uvScale = null, receive = false, cast = false } = {}) {
  const geo = new THREE.PlaneGeometry(width, height);
  if (uvScale) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      uv.setXY(i, uv.getX(i) * (width * uvScale[0]), uv.getY(i) * (height * uvScale[1]));
    }
    uv.needsUpdate = true;
  }
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(position);
  mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  mesh.receiveShadow = receive;
  mesh.castShadow = cast;
  (parent || world.root).add(mesh);
  return mesh;
}

export function addBeam(world, start, end, radius, material, { parent = null, radialSegments = 7 } = {}) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geo = new THREE.CylinderGeometry(radius, radius, length, radialSegments, 1);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  (parent || world.root).add(mesh);
  return mesh;
}

export function addCollider(world, position, halfExtents, rotationY = 0, tag = '') {
  return world.physics.addStaticBox(position, halfExtents, rotationY, { tag });
}

export function invisibleHitbox(world, size, position, { parent = null, rotationY = 0 } = {}) {
  const mat = world.invisibleMaterial;
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  mesh.position.copy(position);
  mesh.rotation.y = rotationY;
  mesh.userData.isInteractionHitbox = true;
  (parent || world.root).add(mesh);
  return mesh;
}

export function registerInteraction(world, entry, hitbox) {
  if (!hitbox) return entry;
  hitbox.userData.interaction = entry;
  entry.hit = hitbox;
  entry.id = entry.id || `interaction_${world.interactables.length}`;
  world.interactables.push(entry);
  world.interactablesById.set(entry.id, entry);
  return entry;
}

export function makeTextTexture(world, text, options = {}) {
  const {
    width = 512, height = 128, bg = '#2e2b23', fg = '#d1c08f', border = '#756446',
    font = '600 56px "Cormorant Garamond", Georgia, serif', sub = '',
    subFont = '400 22px "Special Elite", monospace', align = 'center',
  } = options;
  return world.materials.canvasTexture(width, height, (ctx, w, h) => {
    if (bg) {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, w, h);
    }
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.max(2, h * 0.035);
      ctx.strokeRect(h * 0.06, h * 0.06, w - h * 0.12, h - h * 0.12);
    }
    ctx.fillStyle = fg;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.font = font;
    ctx.fillText(text, align === 'center' ? w / 2 : w * 0.06, sub ? h * 0.42 : h * 0.52);
    if (sub) {
      ctx.font = subFont;
      ctx.fillStyle = options.subColor || '#a69778';
      ctx.fillText(sub, align === 'center' ? w / 2 : w * 0.06, h * 0.73);
    }
  });
}

export function makePaperTexture(world, kind = 'note') {
  return world.materials.canvasTexture(512, 640, (ctx, w, h) => {
    ctx.fillStyle = '#c9bda2';
    ctx.fillRect(0, 0, w, h);
    const grad = ctx.createRadialGradient(w * 0.48, h * 0.35, 30, w * 0.5, h * 0.5, w * 0.72);
    grad.addColorStop(0, 'rgba(255,248,220,0.22)');
    grad.addColorStop(1, 'rgba(45,30,14,0.32)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(72,54,32,0.18)';
    ctx.lineWidth = 1;
    for (let y = 88; y < h - 34; y += 32) {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(w - 28, y);
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(42,32,22,0.82)';
    ctx.font = 'italic 24px Georgia, serif';
    const lines = kind === 'chart'
      ? ['HUSHWOOD INSTITUTE', 'PATIENT RECORD', '', 'BED: ______', 'SLEEP STAGE: ______', '', 'COMFORT: ______', '', 'DO NOT WAKE THEM.']
      : kind === 'drawing'
        ? ['THE LADY WITH', 'THE BELL', 'HAS NO EYES', '', 'SHE SEES WITH', 'HER EARS', '', "DON'T LET HER", 'HEAR YOU WAKE']
        : ['Dear Mara,', '', 'the children are still', 'asleep. Come back.', '', '— E.'];
    lines.forEach((line, i) => ctx.fillText(line, 46, 118 + i * 44));
    if (kind === 'drawing') {
      ctx.strokeStyle = '#612f2c';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(348, 430, 62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(315, 422);
      ctx.lineTo(381, 422);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(348, 492);
      ctx.lineTo(348, 540);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(348, 520, 55, 0.22, Math.PI - 0.22);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(300, 405);
      ctx.lineTo(284, 382);
      ctx.moveTo(396, 405);
      ctx.lineTo(412, 382);
      ctx.stroke();
    }
    if (kind === 'chart') {
      ctx.fillStyle = 'rgba(128,42,38,0.72)';
      ctx.beginPath();
      ctx.arc(w - 88, 88, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(40,25,20,0.8)';
      ctx.font = '600 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('HUSHWOOD', w - 88, 93);
    }
    // Ragged bottom edge.
    ctx.fillStyle = 'rgba(20,14,9,0.2)';
    for (let x = 0; x < w; x += 12) {
      const d = 4 + Math.random() * 10;
      ctx.fillRect(x, h - d, 12, d);
    }
  });
}

export function makeChalkTexture(world) {
  return world.materials.canvasTexture(1024, 600, (ctx, w, h) => {
    ctx.fillStyle = '#1b2621';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#776449';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = 'rgba(215,221,205,0.8)';
    ctx.textAlign = 'center';
    ctx.font = '600 44px "Cormorant Garamond", Georgia, serif';
    ctx.fillText('THE WAKING CHORD', w / 2, 88);
    ctx.font = '600 70px "Special Elite", monospace';
    ctx.fillText('A  A   C  C   E  E   G  G', w / 2, 200);
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillText('youngest first — each note twice', w / 2, 258);
    ctx.strokeStyle = 'rgba(220,220,200,0.35)';
    ctx.beginPath();
    ctx.moveTo(160, 300);
    ctx.lineTo(w - 160, 300);
    ctx.stroke();
    ctx.font = '28px "Special Elite", monospace';
    ctx.fillText('The bell does not know the difference', w / 2, 364);
    ctx.fillText('between waking and calling.', w / 2, 402);
    ctx.font = 'italic 26px Georgia, serif';
    ctx.fillStyle = 'rgba(220,190,160,0.6)';
    ctx.fillText('Elsie — 8.   Jonah — 12.   Ada — 10.   Tobias — 11.', w / 2, 492);
  });
}

export function makePosterTexture(world, kind) {
  return world.materials.canvasTexture(512, 700, (ctx, w, h) => {
    ctx.fillStyle = '#b9ad91';
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255,246,214,0.18)');
    g.addColorStop(1, 'rgba(60,40,20,0.25)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#44372a';
    ctx.lineWidth = 8;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    ctx.fillStyle = '#352f26';
    ctx.textAlign = 'center';
    if (kind === 'sleep') {
      ctx.font = '600 70px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('SLEEP IS', w / 2, 160);
      ctx.fillText('A DOOR', w / 2, 235);
      ctx.font = 'italic 34px Georgia, serif';
      ctx.fillText('THE QUIET CURE', w / 2, 320);
      ctx.font = '22px "Special Elite", monospace';
      ctx.fillText('HUSHWOOD INSTITUTE', w / 2, 380);
      ctx.strokeStyle = 'rgba(55,45,34,0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(w / 2, 510, 82, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, 428);
      ctx.lineTo(w / 2, 592);
      ctx.moveTo(w / 2 - 84, 510);
      ctx.lineTo(w / 2 + 84, 510);
      ctx.stroke();
    } else {
      ctx.font = '600 58px "Cormorant Garamond", Georgia, serif';
      ctx.fillText('VISITING HOURS', w / 2, 160);
      ctx.font = '28px "Special Elite", monospace';
      ctx.fillText('3:00 — 4:00', w / 2, 245);
      ctx.font = 'italic 25px Georgia, serif';
      ctx.fillText('Please do not wake', w / 2, 340);
      ctx.fillText('the sleeping children.', w / 2, 380);
      ctx.strokeStyle = 'rgba(55,45,34,0.5)';
      ctx.lineWidth = 2;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        ctx.moveTo(70, 450 + i * 12);
        ctx.lineTo(w - 70, 450 + i * 12);
        ctx.stroke();
      }
    }
  });
}

export function makeGlintTexture(world) {
  if (world._glintTexture) return world._glintTexture;
  world._glintTexture = world.materials.canvasTexture(128, 128, (ctx, w, h) => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(255,242,204,0.95)');
    grad.addColorStop(0.2, 'rgba(255,220,160,0.3)');
    grad.addColorStop(0.6, 'rgba(255,190,120,0.05)');
    grad.addColorStop(1, 'rgba(255,160,80,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  });
  return world._glintTexture;
}

export function addGlint(world, position, { color = 0xffdca4, scale = 0.2, parent = null, hidden = false } = {}) {
  const material = new THREE.SpriteMaterial({
    map: makeGlintTexture(world),
    color,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.copy(position);
  sprite.scale.setScalar(scale);
  sprite.visible = !hidden;
  (parent || world.root).add(sprite);
  world.glints.push(sprite);
  return sprite;
}

export function createCanvasLabel(world, text, opts = {}) {
  const texture = makeTextTexture(world, text, opts);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.82,
    metalness: 0.05,
    emissive: new THREE.Color(opts.glow ? 0x2b2115 : 0x000000),
    emissiveIntensity: 0.3,
  });
  return material;
}

export function createNoteMesh(world, kind = 'note') {
  const texture = makePaperTexture(world, kind);
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.96,
    side: THREE.DoubleSide,
    color: 0xd4c8ac,
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.38), material);
}

export function addCanvasTextureMesh(world, texture, width, height, position, rotation, options = {}) {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: options.roughness ?? 0.85,
    metalness: options.metalness ?? 0,
    side: THREE.DoubleSide,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    emissive: options.emissive ? new THREE.Color(options.emissive) : new THREE.Color(0x000000),
    emissiveIntensity: options.emissiveIntensity ?? 0,
    toneMapped: options.toneMapped ?? true,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(position);
  mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  (options.parent || world.root).add(mesh);
  return mesh;
}

export function easyBoard(world, text, { width = 1.6, height = 0.36, position, rotation, sub = '', bg, fg, border, scale = 1 } = {}) {
  const texture = makeTextTexture(world, text, {
    width: 768,
    height: 192,
    bg: bg || '#29271f',
    fg: fg || '#cabb91',
    border: border || '#6b5a3f',
    sub,
    font: `600 ${Math.round(70 * scale)}px "Cormorant Garamond", Georgia, serif`,
    subFont: '400 24px "Special Elite", monospace',
  });
  const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.82, metalness: 0.05, emissive: 0x17130d, emissiveIntensity: 0.2 });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(position);
  mesh.rotation.set(rotation.x || 0, rotation.y || 0, rotation.z || 0);
  world.root.add(mesh);
  return mesh;
}

export function baseUrl(path) {
  const prefix = import.meta.env.BASE_URL || '/';
  return `${prefix}${path.replace(/^\//, '')}`;
}

export function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

export function damp(current, target, lambda, dt) {
  return THREE.MathUtils.damp(current, target, lambda, dt);
}
