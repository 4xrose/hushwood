import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { baseUrl } from '../world/WorldUtils.js';

let templatePromise = null;
let clipsPromise = null;
let template = null;

// The Matron's coat tail, trousers and shoes all swing through the apron when
// she walks. The floor-length skirt is the only lower body she needs, so a
// world-space plane clips those three meshes at the waist. It is shared by one
// enemy only; GhostPose keeps the constant in sync with her hips.
const MATRON_CLIP_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const MATRON_FOOT_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));

export function loadSuzieTemplate() {
  if (!templatePromise) {
    templatePromise = new GLTFLoader().loadAsync(baseUrl('assets/characters/suzie.glb')).then((gltf) => {
      const scene = gltf.scene;
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = false;
        // Let Three.js skip characters that are behind the camera. The bind
        // pose sphere is padded in createCharacter() to cover animated limbs.
        child.frustumCulled = true;
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (!mat) continue;
          mat.envMapIntensity = 0.32;
          if (mat.map) mat.map.anisotropy = 4;
          mat.needsUpdate = true;
        }
      });
      template = scene;
      return scene;
    });
  }
  return templatePromise;
}

export function loadClips() {
  if (!clipsPromise) {
    clipsPromise = fetch(baseUrl('assets/anims/clips.json')).then((response) => {
      if (!response.ok) throw new Error(`Animation clips failed: ${response.status}`);
      return response.json();
    });
  }
  return clipsPromise;
}

export async function prepareCharacterAssets() {
  const [scene, raw] = await Promise.all([loadSuzieTemplate(), loadClips()]);
  const hips = scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName('mixamorig:Hips'));
  const hipRest = hips ? hips.position.clone() : new THREE.Vector3();
  const clips = buildClips(raw, hipRest);
  return { scene, clips };
}

function buildClips(raw, hipRest) {
  const out = new Map();
  for (const [name, data] of Object.entries(raw)) {
    const times = data.times;
    const tracks = [];
    for (const [bone, boneData] of Object.entries(data.bones)) {
      const trackNode = THREE.PropertyBinding.sanitizeNodeName(bone);
      if (boneData.q && boneData.q.length === times.length * 4) {
        tracks.push(new THREE.QuaternionKeyframeTrack(`${trackNode}.quaternion`, times, boneData.q));
      }
      if (bone.endsWith(':Hips') && boneData.p && boneData.p.length === times.length * 3) {
        const values = new Float32Array(times.length * 3);
        for (let i = 0; i < times.length; i++) {
          values[i * 3] = hipRest.x + boneData.p[i * 3];
          values[i * 3 + 1] = hipRest.y + boneData.p[i * 3 + 1];
          values[i * 3 + 2] = hipRest.z + boneData.p[i * 3 + 2];
        }
        tracks.push(new THREE.VectorKeyframeTrack(`${trackNode}.position`, times, values));
      }
    }
    const clip = new THREE.AnimationClip(name, data.duration, tracks);
    out.set(name, clip);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Cloth and skin textures
// ---------------------------------------------------------------------------

function makeBandTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#4e4638';
  ctx.fillRect(0, 0, 128, 64);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 64;
    const s = 54 + Math.random() * 34;
    ctx.fillStyle = `rgba(${s},${s - 3},${s - 12},0.35)`;
    ctx.fillRect(x, y, 1.3, 1.3);
  }
  // Rust-coloured seepage from under the band.
  for (const [x, y, r, a] of [[34, 30, 20, 0.5], [92, 26, 14, 0.36], [108, 40, 9, 0.24]]) {
    const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, `rgba(58,24,16,${a})`);
    grad.addColorStop(1, 'rgba(58,24,16,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // A row of small hand stitches along the lower edge.
  ctx.strokeStyle = 'rgba(28,24,18,0.7)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) {
    const x = 3 + i * 5.8;
    ctx.beginPath();
    ctx.moveTo(x, 55);
    ctx.lineTo(x + 2, 61);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeVeilTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#6f6858';
  ctx.fillRect(0, 0, 256, 256);

  // Woven linen grain.
  for (let i = 0; i < 3200; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 256;
    const shade = 88 + Math.random() * 40;
    ctx.fillStyle = `rgba(${shade},${shade - 5},${shade - 18},0.24)`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }

  // Bake the curve of the cloth into the map: the sides fall away into
  // shadow, so the veil reads as a wrapping rather than a flat white mask.
  for (const [x0, x1, a] of [[0, 54, 0.5], [256, 202, 0.5]]) {
    const side = ctx.createLinearGradient(x0, 0, x1, 0);
    side.addColorStop(0, `rgba(22,18,14,${a})`);
    side.addColorStop(1, 'rgba(22,18,14,0)');
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, 256, 256);
  }
  const top = ctx.createLinearGradient(0, 0, 0, 70);
  top.addColorStop(0, 'rgba(20,17,13,0.42)');
  top.addColorStop(1, 'rgba(20,17,13,0)');
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, 256, 70);

  // Old rust-coloured seepage. Deliberately asymmetric: the eye-like reading
  // should arrive late, and never quite resolve into a face.
  for (const [x, y, r, a] of [[82, 92, 34, 0.66], [104, 116, 22, 0.36], [158, 88, 18, 0.52], [150, 108, 12, 0.24]]) {
    const grad = ctx.createRadialGradient(x, y, 1, x, y, r);
    grad.addColorStop(0, `rgba(52,24,17,${a})`);
    grad.addColorStop(0.5, `rgba(64,34,24,${a * 0.42})`);
    grad.addColorStop(1, 'rgba(64,34,24,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Thin vertical runnels under the stains.
  for (const [x, y, h] of [[88, 100, 66], [150, 96, 52], [118, 120, 34]]) {
    const grad = ctx.createLinearGradient(0, y, 0, y + h);
    grad.addColorStop(0, 'rgba(52,25,18,0.36)');
    grad.addColorStop(1, 'rgba(52,25,18,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - 2, y, 4, h);
  }

  // A wide stained band over the eyes. She cannot see; the cloth says so
  // without a neat hospital blindfold.
  const band = ctx.createLinearGradient(0, 58, 0, 112);
  band.addColorStop(0, 'rgba(34,28,22,0)');
  band.addColorStop(0.22, 'rgba(34,28,22,0.5)');
  band.addColorStop(0.72, 'rgba(34,28,22,0.58)');
  band.addColorStop(1, 'rgba(34,28,22,0)');
  ctx.fillStyle = band;
  ctx.fillRect(0, 58, 256, 54);
  ctx.strokeStyle = 'rgba(30,25,19,0.4)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 13; i++) {
    const x = 12 + i * 19;
    ctx.beginPath();
    ctx.moveTo(x, 63);
    ctx.lineTo(x + 3, 70);
    ctx.stroke();
  }

  // A hand-sewn seam where a mouth would be. It sits at the lower third of
  // the cloth, below the eye band, not under the chin.
  ctx.strokeStyle = 'rgba(30,25,19,0.9)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(108, 138);
  for (let x = 0; x <= 52; x += 6) {
    ctx.lineTo(108 + x, 138 + (x % 12 === 0 ? -2.6 : 2.6));
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(30,25,19,0.55)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 6; i++) {
    const x = 112 + i * 8;
    ctx.beginPath();
    ctx.moveTo(x, 134);
    ctx.lineTo(x, 142);
    ctx.stroke();
  }

  // Torn hem and ragged side edges.
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.moveTo(0, 256);
  let x = 0;
  while (x < 256) {
    x += 7 + Math.random() * 13;
    ctx.lineTo(x, 232 + Math.random() * 24);
  }
  ctx.lineTo(256, 256);
  ctx.closePath();
  ctx.fill();
  for (const side of [0, 1]) {
    ctx.beginPath();
    const edge = side ? 256 : 0;
    ctx.moveTo(edge, 0);
    let y = 0;
    while (y < 256) {
      y += 10 + Math.random() * 18;
      const notch = (side ? -1 : 1) * (2 + Math.random() * 7);
      ctx.lineTo(edge + notch, y);
    }
    ctx.lineTo(edge, 256);
    ctx.closePath();
    ctx.fill();
  }
  // A couple of worn-through spots, visible only up close.
  for (const [cx, cy, r] of [[64, 188, 3.2], [198, 166, 2.2]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = 'source-over';

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeApronTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#968d77';
  ctx.fillRect(0, 0, 256, 320);
  for (let i = 0; i < 2400; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 320;
    const s = 98 + Math.random() * 44;
    ctx.fillStyle = `rgba(${s},${s - 4},${s - 20},0.22)`;
    ctx.fillRect(x, y, 1.6, 1.6);
  }
  // Grime along the hem and a faded brown handprint.
  const hem = ctx.createLinearGradient(0, 190, 0, 320);
  hem.addColorStop(0, 'rgba(48,40,30,0)');
  hem.addColorStop(1, 'rgba(48,40,30,0.66)');
  ctx.fillStyle = hem;
  ctx.fillRect(0, 190, 256, 130);

  ctx.fillStyle = 'rgba(62,50,38,0.20)';
  ctx.beginPath();
  ctx.ellipse(180, 240, 26, 38, -0.3, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(158 + i * 12, 202 + i * 5, 5, 15, -0.25 + i * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Embroidered institute mark, dark thread.
  ctx.strokeStyle = 'rgba(52,42,32,0.72)';
  ctx.lineWidth = 2.4;
  ctx.font = '600 34px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(52,42,32,0.72)';
  ctx.fillText('H·I', 128, 78);
  ctx.beginPath();
  ctx.arc(128, 66, 42, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function makeContactShadowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
  grad.addColorStop(0, 'rgba(0,0,0,0.55)');
  grad.addColorStop(0.45, 'rgba(0,0,0,0.30)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addContactShadow(group, scale = 1) {
  const material = new THREE.MeshBasicMaterial({
    map: makeContactShadowTexture(),
    transparent: true,
    depthWrite: false,
    opacity: 0.85,
    toneMapped: false,
  });
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.35 * scale, 1.05 * scale), material);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.012;
  shadow.renderOrder = 1;
  group.add(shadow);
  return shadow;
}

// ---------------------------------------------------------------------------
// Materials
// ---------------------------------------------------------------------------

const MATRON_COLORS = {
  Ch41_Body: 0x9d998a,
  Ch41_Coat: 0x383630,
  Ch41_Eyelashes: 0x0d0b09,
  Ch41_Hair: 0x141210,
  Ch41_Pants: 0x1e1f1c,
  Ch41_Shirt: 0x8c8676,
  Ch41_Shoe: 0x121110,
};

const SLEEPWALKER_COLORS = {
  Ch41_Body: 0xb3b2a5,
  Ch41_Coat: 0xc8c6b6,
  Ch41_Eyelashes: 0x0a0a09,
  Ch41_Hair: 0x2a2721,
  Ch41_Pants: 0xa9a798,
  Ch41_Shirt: 0xd6d2bf,
  Ch41_Shoe: 0x6b675c,
};

function styleMaterials(root, kind) {
  const colors = kind === 'matron' ? MATRON_COLORS : SLEEPWALKER_COLORS;
  root.traverse((child) => {
    if (!child.isMesh) return;
    // Head/body attachments created by us already carry their own materials.
    if (!child.isSkinnedMesh) return;
    const tint = colors[child.name] ?? (kind === 'matron' ? 0x8f8a7d : 0xb7b5a8);
    const style = (mat) => {
      const clone = mat.clone();
      clone.color = new THREE.Color(tint);
      clone.roughness = clamp((mat.roughness ?? 0.8) + (kind === 'matron' ? 0.16 : 0.1), 0, 1);
      clone.metalness = Math.min(mat.metalness ?? 0, 0.08);
      clone.envMapIntensity = kind === 'matron' ? 0.42 : 0.3;
      if (kind === 'matron') {
        if (child.name === 'Ch41_Body') {
          // Bare feet would push out from under the hem in a walk. Clip only
          // the bottom 14 cm; the hands hang far above this line.
          clone.clippingPlanes = [MATRON_FOOT_PLANE];
        }
        if (child.name === 'Ch41_Body' && kind === 'matron') {
          // Waxy, not polished: the skin should swallow light, not catch it.
          clone.roughness = 0.86;
          clone.envMapIntensity = 0.16;
        }
        if (child.name === 'Ch41_Coat' || child.name === 'Ch41_Pants' || child.name === 'Ch41_Shoe') {
          clone.clippingPlanes = [MATRON_CLIP_PLANE];
          clone.clipShadows = false;
        }
      }
      if (child.name === 'Ch41_Hair' || child.name === 'Ch41_Eyelashes') {
        // Alpha-blended hair cards are sorted per object and flicker against
        // each other and against the veil. Alpha-test them instead: they stay
        // solid, never draw in the wrong order, and cost one pass.
        const isHair = child.name === 'Ch41_Hair';
        clone.transparent = false;
        clone.depthWrite = true;
        clone.alphaTest = isHair ? 0.42 : 0.24;
        clone.side = THREE.DoubleSide;
        clone.roughness = 0.94;
        clone.color = new THREE.Color(isHair ? (kind === 'matron' ? 0x121110 : 0x2c2923) : 0x0b0a09);
      }
      clone.needsUpdate = true;
      return clone;
    };
    if (Array.isArray(child.material)) {
      child.material = child.material.map(style);
    } else if (child.material) {
      child.material = style(child.material);
    }

    if (child.isSkinnedMesh) {
      // SkinnedMesh.computeBoundingSphere() transforms every vertex through the
      // skeleton, which is far too slow to repeat for each of the four clones.
      // The bind-pose sphere tracks the enemy root; pad it for limb swing.
      const geometry = child.geometry;
      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      if (geometry.boundingSphere) {
        child.boundingSphere = geometry.boundingSphere.clone();
        child.boundingSphere.radius *= 2;
      }
    }
  });
}

// ---------------------------------------------------------------------------
// Attachments: veil, skirt, apron, bell, keys
// ---------------------------------------------------------------------------

function bone(root, name) {
  return root.getObjectByName(`mixamorig${name}`);
}

function makeSkirtGeometry() {
  const geometry = new THREE.CylinderGeometry(18, 34, 92, 22, 5, true);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const t = clamp((46 - y) / 92, 0, 1);
    const a = Math.atan2(x, z);
    if (t > 0.9) {
      const tear = Math.sin(a * 8.0) * 3.4 + Math.sin(a * 15.0 + 1.2) * 1.8;
      position.setY(i, y - 3.2 + tear * 0.55);
    }
    // The back of the skirt trails on the floor.
    if (z < 0) position.setY(i, y - t * 5.5);
    const radius = Math.hypot(x, z);
    if (radius > 1) {
      const fold = 1 + Math.sin(a * 9.0 + t * 2.0) * 0.03 * t;
      position.setX(i, x * fold);
      position.setZ(i, z * fold);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeVeilGeometry() {
  // A wrapped cloth hood, not a flat card in front of the face. The profile
  // widens over the cheeks, narrows under the chin, then flares over the
  // shoulders. Folds and a torn hem keep the silhouette from reading as a
  // smooth mannequin head.
  const geometry = new THREE.CylinderGeometry(1, 1, 1, 28, 14, true);
  const position = geometry.attributes.position;
  const profile = [
    [0.0, 15.0], [0.07, 12.3], [0.16, 10.3], [0.28, 9.7], [0.46, 10.5],
    [0.64, 11.25], [0.82, 10.9], [1.0, 9.6],
  ];
  const radiusAt = (t) => {
    for (let i = 1; i < profile.length; i++) {
      if (t <= profile[i][0]) {
        const [t0, r0] = profile[i - 1];
        const [t1, r1] = profile[i];
        const k = (t - t0) / (t1 - t0);
        const s = k * k * (3 - 2 * k);
        return r0 + (r1 - r0) * s;
      }
    }
    return profile[profile.length - 1][1];
  };
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const t = position.getY(i) + 0.5;
    const a = Math.atan2(x, z);
    const folds = Math.sin(a * 9 + t * 4.2) * 0.42
      + Math.sin(a * 23 - t * 2.1) * 0.14
      + Math.sin(a * 3 + 0.7) * 0.3;
    const r = radiusAt(t) + folds;
    let y = (t - 0.5) * 22;
    if (t < 0.12) {
      const hem = Math.sin(a * 5 + 1.4) * 0.9 + Math.sin(a * 13) * 0.5;
      y -= (0.12 - t) / 0.12 * (1.6 + hem);
    }
    if (z < 0) y -= 1.2 * (1 - t);
    position.setX(i, Math.sin(a) * r);
    position.setZ(i, Math.cos(a) * r);
    position.setY(i, y);
  }
  geometry.computeVertexNormals();
  geometry.rotateY(Math.PI);
  return geometry;
}

function addMatronCloth(root) {
  const hips = bone(root, 'Hips');
  if (!hips) return;
  const skirtMaterial = new THREE.MeshStandardMaterial({
    color: 0x2b2a26,
    roughness: 0.98,
    side: THREE.DoubleSide,
  });
  const skirt = new THREE.Mesh(makeSkirtGeometry(), skirtMaterial);
  skirt.position.set(0, -44, 0);
  hips.add(skirt);

  // Apron: stained linen panel down the front of the skirt.
  const apronMaterial = new THREE.MeshStandardMaterial({
    map: makeApronTexture(),
    roughness: 0.96,
    side: THREE.DoubleSide,
  });
  const apron = new THREE.Mesh(new THREE.PlaneGeometry(30, 72, 12, 10), apronMaterial);
  const ap = apron.geometry.attributes.position;
  for (let i = 0; i < ap.count; i++) {
    const x = ap.getX(i);
    const y = ap.getY(i);
    const t = (36 - y) / 72;
    // The skirt is a cone from 18 cm at the waist to 34 cm at the hem. Ride
    // 1 cm outside that surface all the way down, so the panel wraps the
    // fabric instead of sinking into it at the sides.
    const R = 19.7 + 12.5 * t;
    ap.setZ(i, Math.sqrt(Math.max(0, R * R - x * x)));
  }
  apron.geometry.computeVertexNormals();
  apron.position.set(0, -38, 0);
  hips.add(apron);

  // Keys on a ring at the belt, the way a matron carries her wards.
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(3.1, 0.5, 5, 12),
    new THREE.MeshStandardMaterial({ color: 0x6b5a3c, metalness: 0.7, roughness: 0.55 }),
  );
  ring.position.set(13.5, 2.5, 8.5);
  ring.rotation.y = 0.3;
  hips.add(ring);
  const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x6f6449, metalness: 0.75, roughness: 0.48 });
  for (let i = 0; i < 3; i++) {
    const key = new THREE.Group();
    key.position.set(13.5 + (i - 1) * 1.6, -2.4 - i * 0.4, 8.5 + (i - 1) * 0.7);
    key.rotation.z = (i - 1) * 0.12;
    const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.7, 8.4 - i * 0.8, 0.5), keyMaterial);
    shaft.position.y = -3.4;
    key.add(shaft);
    const bit = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.7, 0.5), keyMaterial);
    bit.position.set(0.7, -7.0, 0);
    key.add(bit);
    hips.add(key);
  }
}

function addHeadAttachments(root, kind) {
  const head = bone(root, 'Head');
  const neck = bone(root, 'Neck');
  if (!head) return;
  const dark = new THREE.MeshStandardMaterial({ color: 0x191512, roughness: 0.74 });

  if (kind === 'matron') {
    // A soiled linen coif, wrapped close to the skull. No starched cartoon cap.
    const linen = new THREE.MeshStandardMaterial({ color: 0x857c6a, roughness: 0.97 });
    const coif = new THREE.Mesh(
      new THREE.SphereGeometry(9.2, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      linen,
    );
    coif.position.set(0, 5.0, -0.6);
    coif.scale.set(1.0, 1.08, 1.0);
    // Creases in the cloth break the egg-like silhouette.
    const cp = coif.geometry.attributes.position;
    for (let i = 0; i < cp.count; i++) {
      const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
      const a = Math.atan2(x, z);
      const fold = 1 + Math.sin(a * 6 + y * 0.25) * 0.034 + Math.sin(a * 11) * 0.014;
      cp.setX(i, x * fold);
      cp.setZ(i, z * fold);
    }
    coif.geometry.computeVertexNormals();
    head.add(coif);

    // Torn veil over the eyes and mouth, stitched shut.
    const veilMaterial = new THREE.MeshStandardMaterial({
      map: makeVeilTexture(),
      roughness: 0.99,
      side: THREE.DoubleSide,
      alphaTest: 0.45,
      transparent: false,
    });
    const veil = new THREE.Mesh(makeVeilGeometry(), veilMaterial);
    veil.position.set(0, 1.2, 0);
    head.add(veil);

    // The eye band is a real strip of stained linen tied over the veil. It
    // catches the torchlight, casts a shadow under its edge, and gives the
    // head a readable front from any angle.
    const bandGroup = new THREE.Group();
    bandGroup.position.set(0, 4.4, 0);
    bandGroup.rotation.z = 0.035;
    head.add(bandGroup);
    const eyeBandMaterial = new THREE.MeshStandardMaterial({
      map: makeBandTexture(),
      roughness: 0.99,
      side: THREE.DoubleSide,
    });
    const bandGeometry = new THREE.CylinderGeometry(11.7, 11.9, 4.8, 24, 3, true);
    const bp = bandGeometry.attributes.position;
    for (let i = 0; i < bp.count; i++) {
      const x = bp.getX(i);
      const z = bp.getZ(i);
      const a = Math.atan2(x, z);
      bp.setX(i, x * (1 + Math.sin(a * 8) * 0.012));
      bp.setZ(i, z * (1 + Math.sin(a * 8) * 0.012));
      bp.setY(i, bp.getY(i) + Math.sin(a * 6 + 0.8) * 0.22);
    }
    bandGeometry.computeVertexNormals();
    const eyeBand = new THREE.Mesh(bandGeometry, eyeBandMaterial);
    bandGroup.add(eyeBand);
    const bandKnot = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 6), eyeBandMaterial);
    bandKnot.position.set(0, 0.1, -12.0);
    bandKnot.scale.set(1.1, 0.8, 0.7);
    bandGroup.add(bandKnot);
    for (const x of [-1.15, 1.15]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(1.0, 9.0, 0.35), eyeBandMaterial);
      tail.position.set(x, -4.6, -12.1);
      tail.rotation.x = 0.08;
      tail.rotation.z = x > 0 ? -0.08 : 0.08;
      bandGroup.add(tail);
    }

    // A standing collar hides the join between neck and shoulders.
    if (neck) {
      const collar = new THREE.Mesh(
        new THREE.CylinderGeometry(7.6, 5.6, 7.5, 12, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x2c2a25, roughness: 0.95, side: THREE.DoubleSide }),
      );
      collar.position.set(0, -2.0, 0);
      neck.add(collar);
    }

    // The little bell she carries, tarnished and tied to her wrist.
    const hand = bone(root, 'RightHand');
    if (hand) {
      const bellGroup = new THREE.Group();
      bellGroup.position.set(0, -5.4, 2.4);
      hand.add(bellGroup);
      const brass = new THREE.MeshStandardMaterial({ color: 0x79602f, metalness: 0.82, roughness: 0.42 });
      const leather = new THREE.MeshStandardMaterial({ color: 0x241b14, roughness: 0.92 });
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(2.55, 3.55, 3.4, 12, 1, true), brass);
      bell.position.y = -1.5;
      bellGroup.add(bell);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.36, 5, 14), brass);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = -3.15;
      bellGroup.add(rim);
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 3.2, 6), leather);
      handle.position.y = 1.6;
      bellGroup.add(handle);
      const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.75, 7, 5), dark);
      clapper.position.y = -2.5;
      bellGroup.add(clapper);
      const strap = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.45, 4, 10), leather);
      strap.position.set(0, 3.1, 0);
      strap.rotation.x = Math.PI / 2;
      bellGroup.add(strap);
      bellGroup.rotation.z = 0.18;
      bellGroup.userData.isBell = true;
    }
  } else {
    // Sleepwalkers: pale, milk-blind eyes and a taped mouth.
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xc2c4b4, emissive: 0x555a4d, emissiveIntensity: 0.5, roughness: 0.32,
    });
    for (const x of [-3.0, 3.0]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(1.35, 8, 6), eyeMat);
      eye.position.set(x, 4.6, 8.5);
      head.add(eye);
    }
    const tape = new THREE.Mesh(
      new THREE.BoxGeometry(9.2, 2.6, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x9d9887, roughness: 0.96 }),
    );
    tape.position.set(0, 0.2, 9.1);
    tape.rotation.z = 0.05;
    head.add(tape);
    for (const x of [-3.6, 3.6]) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.5, 0.7), tape.material);
      strip.position.set(0, x * 0.35, 9.05);
      strip.rotation.z = -x * 0.01;
      head.add(strip);
    }
  }
}

// ---------------------------------------------------------------------------
// Procedural ghost pose
// ---------------------------------------------------------------------------

const _v = new THREE.Vector3();
const _v2 = new THREE.Vector3();

export class GhostPose {
  constructor(group, kind = 'matron') {
    this.group = group;
    this.kind = kind;
    this.time = Math.random() * 10;
    this.twitchTimer = 2.5 + Math.random() * 5;
    this.twitchPhase = 0;
    this.twitchDir = 1;
    this.headYaw = 0;
    this.headPitch = 0;
    this.groundOffset = 0;
    this.trackYaw = 0;
    this.trackPitch = 0;
    this.lastLook = 0;

    this.hips = bone(group, 'Hips');
    this.spine = bone(group, 'Spine');
    this.spine1 = bone(group, 'Spine1');
    this.spine2 = bone(group, 'Spine2');
    this.neck = bone(group, 'Neck');
    this.head = bone(group, 'Head');
    this.leftShoulder = bone(group, 'LeftShoulder');
    this.rightShoulder = bone(group, 'RightShoulder');
    this.leftArm = bone(group, 'LeftArm');
    this.rightArm = bone(group, 'RightArm');
    this.leftForeArm = bone(group, 'LeftForeArm');
    this.rightForeArm = bone(group, 'RightForeArm');
    this.leftToe = bone(group, 'LeftToeBase');
    this.rightToe = bone(group, 'RightToeBase');

    this.animator = null;
    this.poseBones = [
      this.hips, this.spine, this.spine1, this.spine2,
      this.leftShoulder, this.rightShoulder, this.neck, this.head,
      this.leftArm, this.rightArm, this.leftForeArm, this.rightForeArm,
    ].filter(Boolean);
    this.baseQuats = new Map();
    this.lastMixerTime = -1;

    if (kind === 'matron') this.buildMatronRig();
    else this.buildSleepwalkerRig();
  }

  buildMatronRig() {
    const setScale = (b, x, y, z) => {
      if (!b) return;
      b.scale.set(b.scale.x * x, b.scale.y * y, b.scale.z * z);
    };
    // Gaunt, over-tall proportions. The head is small, the neck long, the arms
    // heavy and low, the shoulders set wider than the hips.
    setScale(this.head, 0.8, 0.86, 0.82);
    setScale(this.neck, 1.0, 1.28, 1.0);
    setScale(bone(this.group, 'LeftShoulder'), 1.12, 1.04, 1.08);
    setScale(bone(this.group, 'RightShoulder'), 1.12, 1.04, 1.08);
    setScale(this.leftArm, 0.9, 1.08, 0.9);
    setScale(this.rightArm, 0.9, 1.08, 0.9);
    setScale(this.leftForeArm, 0.88, 1.12, 0.88);
    setScale(this.rightForeArm, 0.88, 1.12, 0.88);
    setScale(bone(this.group, 'LeftHand'), 0.94, 1.08, 0.94);
    setScale(bone(this.group, 'RightHand'), 0.94, 1.08, 0.94);
    setScale(this.spine1, 0.97, 1.03, 0.97);
    setScale(bone(this.group, 'LeftUpLeg'), 0.94, 1.07, 0.94);
    setScale(bone(this.group, 'RightUpLeg'), 0.94, 1.07, 0.94);

    // Fingers read as too long at close range.
    for (const side of ['Left', 'Right']) {
      for (const part of ['Thumb2', 'Thumb3', 'Index2', 'Index3', 'Middle2', 'Middle3', 'Ring2', 'Ring3', 'Pinky2', 'Pinky3']) {
        setScale(bone(this.group, `${side}Hand${part}`), 1.0, 1.16, 1.0);
      }
    }
  }

  buildSleepwalkerRig() {
    const setScale = (b, x, y, z) => {
      if (!b) return;
      b.scale.set(b.scale.x * x, b.scale.y * y, b.scale.z * z);
    };
    setScale(this.neck, 1.0, 1.12, 1.0);
    setScale(this.head, 0.94, 0.96, 0.94);
    setScale(this.leftArm, 0.92, 1.05, 0.92);
    setScale(this.rightArm, 0.92, 1.05, 0.92);
  }

  update(dt, {
    speed = 0, mode = 'idle', lookTarget = null, floorY = 0, alert = 0, facing = 0,
  } = {}) {
    if (!this.head) return;
    // Keep the lower-body clip plane at the Matron's waist, wherever she is.
    if (this.kind === 'matron' && this.hips) {
      this.hips.getWorldPosition(_v);
      MATRON_CLIP_PLANE.constant = -_v.y + 0.02;
      MATRON_FOOT_PLANE.constant = -(floorY + 0.14);
    }
    // The mixer writes absolute bone rotations. Our additive pose must always
    // start from that snapshot, otherwise a bone with no track accumulates one
    // extra offset every frame and the arm slowly climbs into the ceiling.
    const mixerTime = this.animator?.mixer?.time ?? 0;
    if (mixerTime !== this.lastMixerTime) {
      for (const b of this.poseBones) this.baseQuats.set(b, b.quaternion.clone());
      this.lastMixerTime = mixerTime;
    } else {
      for (const [b, q] of this.baseQuats) b.quaternion.copy(q);
    }
    this.time += dt;
    const t = this.time;
    const moving = speed > 0.12;
    const hunting = mode === 'chase' || mode === 'attack';
    const watchful = alert > 0.35 || hunting;

    // Breathing and a constant, slight forward hunch.
    const breath = Math.sin(t * (hunting ? 2.4 : 1.15)) * (hunting ? 0.018 : 0.008);
    const hunch = hunting ? 0.2 : mode === 'attack' ? 0.26 : 0.1;
    if (this.spine) {
      this.spine.rotateX(hunch * 0.45 + breath);
      this.spine.rotateZ(Math.sin(t * 0.37) * 0.012);
    }
    if (this.spine1) {
      this.spine1.rotateX(hunch * 0.35 + breath * 0.6);
      this.spine1.rotateY(Math.sin(t * 0.41) * 0.02);
    }
    if (this.spine2) this.spine2.rotateX(hunch * 0.2);
    // One shoulder rides lower than the other. It makes her stance read as
    // injured rather than symmetrical and posed.
    if (this.leftShoulder) this.leftShoulder.rotateZ(-0.055);
    if (this.rightShoulder) this.rightShoulder.rotateZ(0.025);

    // Head tracking. She is blind, but she always knows where the breathing is.
    if (lookTarget) {
      this.head.getWorldPosition(_v);
      const dx = lookTarget.x - _v.x;
      const dz = lookTarget.z - _v.z;
      const distance = Math.max(0.4, Math.hypot(dx, dz));
      const desiredYaw = wrapAngle(Math.atan2(dx, dz) - facing);
      const desiredPitch = Math.atan2(lookTarget.y - _v.y, distance);
      const yawLimit = hunting ? 1.15 : 0.95;
      this.trackYaw = damp(this.trackYaw, clamp(desiredYaw, -yawLimit, yawLimit), watchful ? 3.4 : 1.6, dt);
      this.trackPitch = damp(this.trackPitch, clamp(desiredPitch, -0.42, 0.32), 2.6, dt);
      this.lastLook = this.time;
    } else {
      this.trackYaw = damp(this.trackYaw, Math.sin(t * 0.21) * 0.22, 0.7, dt);
      this.trackPitch = damp(this.trackPitch, 0, 0.7, dt);
    }

    // Startle twitches. Sharp, short, and never on a regular beat.
    this.twitchTimer -= dt;
    if (this.twitchTimer <= 0) {
      this.twitchTimer = 2.2 + Math.random() * 6.5;
      this.twitchPhase = 0.2 + Math.random() * 0.12;
      this.twitchDir = Math.random() < 0.5 ? -1 : 1;
    }
    let twitch = 0;
    if (this.twitchPhase > 0) {
      this.twitchPhase -= dt;
      twitch = Math.max(0, this.twitchPhase) / 0.32;
      twitch *= twitch;
    }

    if (this.neck) {
      this.neck.rotateY(this.trackYaw * 0.42 + twitch * this.twitchDir * 0.16);
      this.neck.rotateX(this.trackPitch * 0.32);
      this.neck.rotateZ(twitch * this.twitchDir * 0.05);
    }
    if (this.head) {
      this.head.rotateY(this.trackYaw * 0.58 + twitch * this.twitchDir * 0.26);
      this.head.rotateX(this.trackPitch * 0.68);
      this.head.rotateZ(twitch * this.twitchDir * 0.1 + Math.sin(t * 0.29) * 0.02);
    }

    // Walk cycle additives: a dragging left side and a heavy shoulder roll.
    if (moving) {
      const cadence = mode === 'chase' ? 7.4 : 4.3;
      const phase = t * cadence;
      const limp = Math.sin(phase) * 0.035;
      if (this.hips) this.hips.rotateZ(limp);
      if (this.spine) this.spine.rotateY(Math.sin(phase) * 0.05);
      if (this.leftArm) this.leftArm.rotateX(Math.sin(phase) * 0.05 - 0.04);
      if (this.rightArm) this.rightArm.rotateX(-Math.sin(phase) * 0.05 + 0.02);
      this.groundOffset = damp(this.groundOffset, Math.sin(phase * 2) * 0.006, 14, dt);
      this.group.position.y = this.groundOffset;
    } else {
      // Idle: the bell hand drifts up toward the veil, as if listening to it.
      const atRest = mode === 'idle' || mode === 'observe' || mode === 'patrol'
        || mode === 'investigate' || mode === 'search';
      const lift = atRest ? 0.5 + Math.sin(t * 0.45) * 0.2 : 0;
      if (lift > 0) {
        if (this.rightForeArm) this.rightForeArm.rotateX(-0.55 * lift);
        if (this.rightArm) this.rightArm.rotateX(-0.22 * lift);
      }
      if (this.leftArm) this.leftArm.rotateZ(Math.sin(t * 0.33) * 0.014);
      if (this.leftForeArm) this.leftForeArm.rotateX(Math.sin(t * 0.33 + 1) * 0.02);
      this.group.position.y = 0;
      this.groundOffset = 0;
    }
  }

  // Lift the visual model so the lowest toe never sinks through the floor.
  groundModel(floorY, dt) {
    if (!this.leftToe || !this.rightToe) return;
    const left = this.leftToe.getWorldPosition(_v).y;
    const right = this.rightToe.getWorldPosition(_v2).y;
    const lowest = Math.min(left, right);
    const target = clamp(floorY + 0.015 - lowest, -0.06, 0.09);
    this.groundOffset = damp(this.groundOffset, target, 9, dt);
    this.group.position.y = this.groundOffset;
  }
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

export function createCharacter(kind = 'matron') {
  if (!template) throw new Error('Suzie template not loaded');
  const root = cloneSkeleton(template);
  styleMaterials(root, kind);
  addHeadAttachments(root, kind);
  if (kind === 'matron') addMatronCloth(root);
  const group = new THREE.Group();
  group.add(root);
  if (kind === 'matron') group.scale.setScalar(1.04);
  else group.scale.setScalar(0.99);
  addContactShadow(group, kind === 'matron' ? 1.05 : 0.92);
  group.userData.kind = kind;
  return group;
}

export class CharacterAnimator {
  constructor(root, clips) {
    this.root = root;
    this.clips = clips;
    this.mixer = new THREE.AnimationMixer(root);
    this.actions = new Map();
    this.current = null;
    this.currentName = '';
    this.mixer.addEventListener('finished', () => {});
  }

  getAction(name) {
    if (!this.clips.has(name)) return null;
    let action = this.actions.get(name);
    if (!action) {
      action = this.mixer.clipAction(this.clips.get(name));
      this.actions.set(name, action);
    }
    return action;
  }

  play(name, { loop = true, fade = 0.3, timeScale = 1, force = false } = {}) {
    if (!this.clips.has(name)) return false;
    if (!force && this.currentName === name && this.current?.isRunning()) {
      this.current.setEffectiveTimeScale(timeScale);
      return true;
    }
    const next = this.getAction(name);
    if (!next) return false;
    const previous = this.current;
    next.reset();
    next.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, loop ? Infinity : 1);
    next.clampWhenFinished = !loop;
    next.setEffectiveTimeScale(timeScale);
    next.setEffectiveWeight(1);
    next.play();
    if (previous && previous !== next) {
      previous.crossFadeTo(next, fade, false);
    } else {
      next.fadeIn(fade);
    }
    this.current = next;
    this.currentName = name;
    return true;
  }

  setTimeScale(value) {
    if (this.current) this.current.setEffectiveTimeScale(value);
  }

  update(dt) {
    this.mixer.update(dt);
  }
}
