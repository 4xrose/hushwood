import * as THREE from 'three';
import { FLOOR_Y } from './LevelData.js';
import {
  addBox, addPlane, addBeam, addCollider, invisibleHitbox,
  registerInteraction, addGlint, addCanvasTextureMesh,
  makeChalkTexture, makePosterTexture, makeTextTexture, damp,
} from './WorldUtils.js';

const HATCH = { x: 0.35, z: -10.15, w: 1.18, d: 1.18 };

function makeCurtainGeometry(width, height, folds = 5) {
  const geometry = new THREE.PlaneGeometry(width, height, Math.max(8, folds * 2), 1);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const u = (position.getX(i) + width / 2) / width;
    // Fold the cloth in and out across its width. After the mesh is turned to
    // face into the room this displacement reads as soft vertical pleats.
    position.setZ(i, Math.sin(u * Math.PI * folds) * 0.045 + Math.sin(u * Math.PI * 2) * 0.014);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function makeCurtain(world, { width, height, color = 0x8b806e, folds = 5, opacity = 1 } = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.98,
    side: THREE.DoubleSide,
    transparent: opacity < 1,
    opacity,
  });
  const mesh = new THREE.Mesh(makeCurtainGeometry(width, height, folds), material);
  world.root.add(mesh);
  return mesh;
}

function addCurtainRail(world, x, y, z1, z2, material, rings = 0, ringMat = null) {
  addBeam(world, new THREE.Vector3(x, y, z1), new THREE.Vector3(x, y, z2), 0.018, material, { radialSegments: 8 });
  if (!rings) return;
  for (let i = 0; i < rings; i++) {
    const z = THREE.MathUtils.lerp(z1 + 0.08, z2 - 0.08, i / Math.max(1, rings - 1));
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.008, 4, 10), ringMat || material);
    ring.position.set(x, y, z);
    ring.rotation.x = Math.PI / 2;
    world.root.add(ring);
  }
}


function buildHearth(world) {
  const m = world.materials;
  // Chimney breast on the west wall of the Day Room.
  addBox(world, m.concrete, new THREE.Vector3(0.38, 2.85, 2.55), new THREE.Vector3(-9.78, 1.425, -4.2));
  addBox(world, m.black, new THREE.Vector3(0.2, 1.05, 1.2), new THREE.Vector3(-9.55, 0.62, -4.2));
  addBox(world, m.darkWood, new THREE.Vector3(0.55, 0.14, 2.2), new THREE.Vector3(-9.5, 1.32, -4.2));
  addBox(world, m.concrete, new THREE.Vector3(0.9, 0.13, 2.35), new THREE.Vector3(-9.55, 0.065, -4.2));
  const logMat = new THREE.MeshStandardMaterial({ color: 0x2a1c13, roughness: 1 });
  for (let i = 0; i < 4; i++) {
    const log = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.68, 7), logMat);
    log.rotation.z = Math.PI / 2;
    log.rotation.y = 0.3 * i;
    log.position.set(-9.52, 0.22 + i * 0.06, -4.25 + (i % 2 ? 0.18 : -0.12));
    world.root.add(log);
  }
  const emberMat = new THREE.MeshStandardMaterial({ color: 0x6b2412, emissive: 0xff5b21, emissiveIntensity: 1.4, roughness: 1 });
  addBox(world, emberMat, new THREE.Vector3(0.06, 0.06, 0.55), new THREE.Vector3(-9.54, 0.2, -4.2));
  const fire = new THREE.PointLight(0xff7a32, 1.4, 5.5, 2);
  fire.position.set(-9.3, 0.65, -4.2);
  world.root.add(fire);
  world.fixedLamps.push({ light: fire, base: 1.4, phase: 4.6 });
  addBox(world, m.iron, new THREE.Vector3(0.05, 0.55, 0.05), new THREE.Vector3(-9.35, 0.35, -5.15));
  addBox(world, m.iron, new THREE.Vector3(0.05, 0.55, 0.05), new THREE.Vector3(-9.35, 0.35, -3.25));

  // A small soot-blackened photograph rests on the mantel.
  const photo = addBox(world, m.trim, new THREE.Vector3(0.03, 0.24, 0.19), new THREE.Vector3(-9.3, 1.5, -4.85));
  photo.rotation.z = -0.08;
}

function buildHatch(world) {
  const base = FLOOR_Y.ground;
  const bench = world.materials.darkWood;
  const rim = world.materials.oldBrass;
  addBox(world, rim, new THREE.Vector3(HATCH.w + 0.14, 0.04, 0.07), new THREE.Vector3(HATCH.x, 0.03, HATCH.z - HATCH.d / 2));
  addBox(world, rim, new THREE.Vector3(HATCH.w + 0.14, 0.04, 0.07), new THREE.Vector3(HATCH.x, 0.03, HATCH.z + HATCH.d / 2));
  addBox(world, rim, new THREE.Vector3(0.07, 0.04, HATCH.d), new THREE.Vector3(HATCH.x - HATCH.w / 2, 0.03, HATCH.z));
  addBox(world, rim, new THREE.Vector3(0.07, 0.04, HATCH.d), new THREE.Vector3(HATCH.x + HATCH.w / 2, 0.03, HATCH.z));

  const pivot = new THREE.Group();
  pivot.position.set(HATCH.x, 0.065, HATCH.z - HATCH.d / 2);
  world.root.add(pivot);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(HATCH.w, 0.085, HATCH.d), bench);
  lid.position.set(0, 0, HATCH.d / 2);
  lid.castShadow = true;
  lid.receiveShadow = true;
  pivot.add(lid);
  for (let i = 0; i < 2; i++) {
    const plank = new THREE.Mesh(new THREE.BoxGeometry(HATCH.w - 0.1, 0.012, 0.28), world.materials.trim);
    plank.position.set(0, 0.048, 0.26 + i * 0.34);
    pivot.add(plank);
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 6, 16), world.materials.oldBrass);
  ring.rotation.x = Math.PI / 2;
  ring.position.set(0, 0.055, HATCH.d - 0.2);
  pivot.add(ring);

  // Ladder disappearing into the dark below.
  const rungMat = world.materials.iron;
  for (const x of [-0.22, 0.24]) {
    addBeam(world, new THREE.Vector3(HATCH.x + x, -0.02, HATCH.z - 0.38), new THREE.Vector3(HATCH.x + x, -3.58, HATCH.z - 0.38), 0.024, rungMat);
  }
  for (let i = 0; i < 11; i++) {
    const y = -0.12 - i * 0.31;
    addBeam(world, new THREE.Vector3(HATCH.x - 0.24, y, HATCH.z - 0.38), new THREE.Vector3(HATCH.x + 0.26, y, HATCH.z - 0.38), 0.018, rungMat);
  }

  const collider = addCollider(world, { x: HATCH.x, y: 0.08, z: HATCH.z }, { x: HATCH.w / 2, y: 0.11, z: HATCH.d / 2 }, 0, 'hatch-lid');

  const topHit = invisibleHitbox(world, { x: 1.55, y: 0.55, z: 1.55 }, new THREE.Vector3(HATCH.x, 0.3, HATCH.z));
  const topEntry = registerInteraction(world, {
    id: 'service_hatch',
    type: 'hatch',
    label: 'service hatch',
    getPrompt: () => (world.hatch.open ? 'Climb down into the cellar' : 'Pry open the service hatch'),
  }, topHit);

  const bottomHit = invisibleHitbox(world, { x: 0.9, y: 1.4, z: 0.9 }, new THREE.Vector3(HATCH.x, -3.0, HATCH.z));
  const bottomEntry = registerInteraction(world, {
    id: 'service_hatch_up',
    type: 'hatch_up',
    label: 'cellar ladder',
    getPrompt: () => 'Climb up into the Archive',
  }, bottomHit);
  bottomEntry.enabled = false;
  bottomHit.visible = false;

  // A dropped work lamp sours the cellar floor beneath the hatch.
  const lamp = new THREE.PointLight(0xffb56e, 0.22, 4, 2);
  lamp.position.set(HATCH.x, -2.8, HATCH.z + 0.2);
  world.root.add(lamp);
  world.fixedLamps.push({ light: lamp, base: 0.22, phase: 1.7 });

  world.hatch = {
    base, open: false, pivot, lid, collider, topEntry, bottomEntry,
    topHit, bottomHit, angle: 0, targetAngle: 0,
  };
}

export function openHatchWorld(world, { instant = false } = {}) {
  if (!world.hatch) return;
  const hatch = world.hatch;
  if (hatch.open) return;
  hatch.open = true;
  hatch.targetAngle = -1.47;
  if (instant) {
    hatch.angle = hatch.targetAngle;
    hatch.pivot.rotation.x = hatch.angle;
  }
  if (hatch.collider) {
    world.physics.removeCollider(hatch.collider);
    hatch.collider = null;
  }
  // The hatch stays interactable so the player can climb down once it is open.
  hatch.topEntry.enabled = true;
  hatch.bottomEntry.enabled = true;
  hatch.bottomHit.visible = true;
}

function buildFuseCabinet(world) {
  const m = world.materials;
  const base = FLOOR_Y.basement;
  const cabinet = new THREE.Group();
  cabinet.position.set(-7.05, base + 1.35, -7.82);
  world.root.add(cabinet);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.98, 0.23), m.basementWall);
  cabinet.add(back);
  const interior = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.84, 0.05), m.black);
  interior.position.z = 0.125;
  cabinet.add(interior);
  const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.78, 0.04, 0.16), m.iron);
  shelf.position.set(0, -0.24, 0.19);
  cabinet.add(shelf);

  const pivot = new THREE.Group();
  pivot.position.set(-0.46, 0, 0.16);
  cabinet.add(pivot);
  const panel = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.92, 0.045), m.paintedMetal || m.basementWall);
  panel.position.set(0.45, 0, 0);
  pivot.add(panel);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.06), m.oldBrass);
  handle.position.set(0.78, -0.15, 0.050);
  pivot.add(handle);
  for (const [x, rot] of [[0.25, 0.6], [0.58, -0.7]]) {
    const nail = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 5), m.iron);
    nail.rotation.z = rot;
    nail.position.set(x, 0.25, 0.05);
    pivot.add(nail);
  }

  // The fuse inside.
  const fuseGroup = new THREE.Group();
  fuseGroup.position.set(-0.05, -0.2, 0.2);
  cabinet.add(fuseGroup);
  const ceramic = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.17, 10), m.ceramic);
  fuseGroup.add(ceramic);
  for (const y of [-0.085, 0.085]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.025, 10), m.brass);
    cap.position.y = y;
    fuseGroup.add(cap);
  }
  const fuseGlow = addGlint(world, new THREE.Vector3(-0.05, 0, 0.28), { scale: 0.14, parent: cabinet, hidden: true });

  const frontHit = invisibleHitbox(world, { x: 1.15, y: 1.2, z: 0.65 }, new THREE.Vector3(-7.05, base + 1.38, -7.55));
  const cabinetEntry = registerInteraction(world, {
    id: 'fuse_cabinet',
    type: 'fuse_cabinet',
    label: 'fuse cabinet',
    getPrompt: () => 'Pry open the fuse cabinet',
  }, frontHit);

  const fuseHit = invisibleHitbox(world, { x: 0.45, y: 0.45, z: 0.45 }, new THREE.Vector3(-7.1, base + 1.12, -7.58));
  const fuseEntry = registerInteraction(world, {
    id: 'pickup_fuse',
    type: 'pickup',
    item: 'fuse',
    label: 'ceramic fuse',
    getPrompt: () => 'Take the ceramic fuse',
    onPickup: () => hideFuse(world),
  }, fuseHit);
  fuseEntry.enabled = false;
  fuseHit.visible = false;

  world.fuseCabinet = {
    group: cabinet, pivot, fuseGroup, fuseGlow, fuseEntry, cabinetEntry,
    frontHit, fuseHit, open: false, angle: 0,
  };
}

export function openFuseCabinet(world, { instant = false } = {}) {
  const c = world.fuseCabinet;
  if (!c || c.open) return;
  c.open = true;
  c.cabinetEntry.enabled = false;
  c.frontHit.visible = false;
  c.fuseEntry.enabled = true;
  c.fuseHit.visible = true;
  c.fuseGlow.visible = true;
  if (instant) {
    c.angle = -1.9;
    c.pivot.rotation.y = c.angle;
  }
}

export function hideFuse(world) {
  const c = world.fuseCabinet;
  if (!c) return;
  c.fuseEntry.enabled = false;
  c.fuseHit.visible = false;
  c.fuseGlow.visible = false;
  c.fuseGroup.visible = false;
}

function buildGeneratorPanel(world) {
  const m = world.materials;
  const base = FLOOR_Y.basement;
  const group = new THREE.Group();
  group.position.set(6.8, base + 1.42, -7.82);
  world.root.add(group);
  addBox(world, m.blackMetal, new THREE.Vector3(1.3, 0.95, 0.18), new THREE.Vector3(0, 0, 0), 0, { parent: group });
  addBox(world, m.iron, new THREE.Vector3(1.2, 0.08, 0.12), new THREE.Vector3(0, 0.42, 0.11), 0, { parent: group });
  const gaugeFace = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.03, 20), m.ceramic);
  gaugeFace.rotation.x = Math.PI / 2;
  gaugeFace.position.set(-0.38, 0.1, 0.11);
  group.add(gaugeFace);
  const gaugeRim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.014, 6, 24), m.brass);
  gaugeRim.position.set(-0.38, 0.1, 0.13);
  group.add(gaugeRim);
  const needlePivot = new THREE.Group();
  needlePivot.position.set(-0.38, 0.1, 0.14);
  group.add(needlePivot);
  const needle = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.115, 0.006), m.emissiveRed);
  needle.position.y = 0.058;
  needlePivot.add(needle);
  const leverBase = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.23, 0.08), m.iron);
  leverBase.position.set(0.1, 0.07, 0.12);
  group.add(leverBase);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.28, 7), m.oldBrass);
  lever.position.set(0.1, 0.24, 0.18);
  lever.rotation.z = -0.45;
  group.add(lever);
  const lampGreen = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m.emissiveGreen);
  lampGreen.position.set(0.46, 0.24, 0.14);
  world.generatorGreen = lampGreen;
  group.add(lampGreen);
  const lampRed = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), m.emissiveRed);
  lampRed.position.set(0.46, 0.12, 0.14);
  group.add(lampRed);
  for (let i = 0; i < 3; i++) {
    addBox(world, m.oldBrass, new THREE.Vector3(0.035, 0.035, 0.02), new THREE.Vector3(-0.24 + i * 0.08, -0.28, 0.12), 0, { parent: group });
  }
  addBox(world, m.brass, new THREE.Vector3(0.7, 0.18, 0.015), new THREE.Vector3(-0.12, -0.33, 0.125), 0, { parent: group });

  const hit = invisibleHitbox(world, { x: 1.55, y: 1.15, z: 0.7 }, new THREE.Vector3(6.8, base + 1.42, -7.55));
  registerInteraction(world, {
    id: 'generator_panel',
    type: 'generator',
    label: 'generator panel',
    getPrompt: () => (world.game.state.flags.powerOn ? 'The generator hums steadily' : 'Use the generator panel'),
  }, hit);
  world.generatorNeedle = needlePivot;
  world.generatorPanel = group;
}

export function setGeneratorPower(world, on) {
  if (!world.generatorNeedle) return;
  const m = world.materials;
  world.generatorGreen.material = on ? m.emissiveGreen : new THREE.MeshStandardMaterial({ color: 0x17301f, roughness: 0.5 });
  world.generatorNeedle.rotation.z = on ? 1.1 : 0;
}

function buildConsole(world) {
  const m = world.materials;
  const base = FLOOR_Y.upper;
  const group = new THREE.Group();
  group.position.set(2.08, base, -15.3);
  group.rotation.y = -Math.PI / 2;
  world.root.add(group);
  // Local coordinates: front is +z.
  addBox(world, m.darkWood, new THREE.Vector3(2.45, 1.0, 0.72), new THREE.Vector3(0, 0.5, 0), 0, { parent: group });
  addBox(world, m.iron, new THREE.Vector3(2.5, 0.09, 0.8), new THREE.Vector3(0, 1.04, 0.02), 0, { parent: group });
  addBox(world, m.black, new THREE.Vector3(2.26, 0.38, 0.38), new THREE.Vector3(0, 1.18, 0.12), 0, { parent: group });
  for (let i = 0; i < 4; i++) {
    const color = [0xa43e39, 0x355d88, 0xae934c, 0x54774f][i];
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.065, 0.035, 12),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.5, roughness: 0.35 }),
    );
    button.rotation.x = Math.PI / 2;
    button.position.set(-0.8 + i * 0.53, 1.28, 0.32);
    group.add(button);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.08), new THREE.MeshBasicMaterial({ map: makeTextTexture(world, ['I', 'II', 'III', 'REM'][i], { width: 256, height: 96, bg: '#1a1d1b', fg: '#d9cba5', border: '#59605a' }) }));
    label.position.set(-0.8 + i * 0.53, 1.12, 0.36);
    group.add(label);
  }
  const drawer = new THREE.Group();
  drawer.position.set(0, 0.64, 0.38);
  group.add(drawer);
  const drawerFace = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.2, 0.05), m.doorWood);
  drawer.add(drawerFace);
  const drawerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.34, 6), m.brass);
  drawerHandle.rotation.z = Math.PI / 2;
  drawerHandle.position.z = 0.04;
  drawer.add(drawerHandle);
  const keyGroup = new THREE.Group();
  keyGroup.position.set(0.85, 0.74, 0.55);
  group.add(keyGroup);
  const keyShaft = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.025, 0.02), m.brass);
  keyGroup.add(keyShaft);
  const keyBow = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.014, 6, 12), m.brass);
  keyBow.position.x = -0.11;
  keyGroup.add(keyBow);
  const keyTooth = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.02), m.brass);
  keyTooth.position.set(0.065, -0.045, 0);
  keyGroup.add(keyTooth);
  keyGroup.visible = false;
  const keyGlint = addGlint(world, new THREE.Vector3(0, 0, 0), { scale: 0.16, parent: group, hidden: true });
  keyGlint.position.set(0.85, 0.74, 0.6);

  const hit = invisibleHitbox(world, { x: 1.0, y: 1.7, z: 2.6 }, new THREE.Vector3(1.56, base + 0.9, -15.3));
  const entry = registerInteraction(world, {
    id: 'sleep_console',
    type: 'console',
    label: 'sleep console',
    getPrompt: () => {
      if (world.game.state.flags.consoleSolved) return 'Review the sleep console';
      const read = world.game.state.charts.filter(Boolean).length;
      return read < 4 ? `The console needs four patient charts (${read}/4)` : 'Set the sleep console';
    },
  }, hit);

  const keyHit = invisibleHitbox(world, { x: 0.55, y: 0.55, z: 0.55 }, new THREE.Vector3(1.55, base + 0.85, -15.3));
  const keyEntry = registerInteraction(world, {
    id: 'pickup_office_key',
    type: 'pickup',
    item: 'officeKey',
    label: 'brass office key',
    getPrompt: () => 'Take the brass office key',
    onPickup: () => {
      keyGroup.visible = false;
      keyGlint.visible = false;
      keyHit.visible = false;
    },
  }, keyHit);
  keyEntry.enabled = false;
  keyHit.visible = false;

  world.console = {
    group, entry, keyGroup, keyEntry, keyGlint, keyHit, drawer,
    drawerOpen: 0, targetDrawer: 0,
  };
}

export function showConsoleKey(world, { instant = false } = {}) {
  const c = world.console;
  if (!c) return;
  c.keyGroup.visible = true;
  c.keyGlint.visible = true;
  c.keyEntry.enabled = true;
  c.keyHit.visible = true;
  c.targetDrawer = 0.44;
  if (instant) {
    c.drawerOpen = c.targetDrawer;
    c.drawer.position.z = 0.38 + c.drawerOpen;
  }
}

export function hideConsoleKey(world) {
  const c = world.console;
  if (!c) return;
  c.keyGroup.visible = false;
  c.keyGlint.visible = false;
  c.keyEntry.enabled = false;
  c.keyHit.visible = false;
}

function buildMirrorSafe(world) {
  const m = world.materials;
  const base = FLOOR_Y.ground;
  const safe = new THREE.Group();
  safe.position.set(7.0, 1.06, -11.83);
  world.root.add(safe);
  addBox(world, m.iron, new THREE.Vector3(0.78, 0.6, 0.16), new THREE.Vector3(0, 0, 0), 0, { parent: safe });
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.5, 0.045), m.oldBrass);
  door.position.z = 0.11;
  safe.add(door);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.04, 20), m.brass);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 0.02, 0.15);
  safe.add(dial);
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.035, 0.06), m.iron);
  handle.position.set(0.25, -0.03, 0.16);
  safe.add(handle);
  const sigilTex = world.materials.canvasTexture(512, 512, (ctx, w, h) => {
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(207,188,139,0.5)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, 0, 176, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -130);
    ctx.bezierCurveTo(105, -80, 125, 60, 0, 150);
    ctx.bezierCurveTo(-125, 60, -105, -80, 0, -130);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -130);
    ctx.lineTo(0, 150);
    ctx.stroke();
  });
  const sigil = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.55), new THREE.MeshBasicMaterial({ map: sigilTex, transparent: true, opacity: 0.6, depthWrite: false }));
  sigil.position.set(0, 0.74, 0.02);
  safe.add(sigil);
  const glow = new THREE.PointLight(0x8fa8a1, 0.22, 2.4, 2);
  glow.position.set(0, 0.1, 0.35);
  safe.add(glow);
  const hit = invisibleHitbox(world, { x: 1.55, y: 2.3, z: 0.65 }, new THREE.Vector3(7.0, 1.35, -11.55));
  const entry = registerInteraction(world, {
    id: 'mirror_safe',
    type: 'safe',
    label: 'mirror safe',
    getPrompt: () => 'Open the mirror safe',
  }, hit);
  world.mirrorSafe = { group: safe, door, dial, sigil, entry, hit, open: false };
}

export function openMirrorSafe(world) {
  if (!world.mirrorSafe || world.mirrorSafe.open) return;
  const safe = world.mirrorSafe;
  safe.open = true;
  safe.door.rotation.y = -1.3;
  safe.door.position.x = -0.32;
  safe.sigil.material.opacity = 1;
  safe.entry.enabled = false;
  safe.hit.visible = false;
}

function buildAttic(world) {
  const m = world.materials;
  const base = FLOOR_Y.attic;
  // The access ladder in Observation.
  const ladderGroup = new THREE.Group();
  ladderGroup.position.set(2.32, FLOOR_Y.upper + 1.55, -14.0);
  world.root.add(ladderGroup);
  for (const z of [-0.25, 0.25]) {
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 3.1, 6), m.iron);
    rail.position.z = z;
    ladderGroup.add(rail);
  }
  for (let i = 0; i < 9; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.55, 5), m.iron);
    rung.rotation.x = Math.PI / 2;
    rung.position.set(0, -1.3 + i * 0.31, 0);
    ladderGroup.add(rung);
  }
  const hatchFrame = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 1.1), m.trim);
  hatchFrame.position.set(1.65, FLOOR_Y.upper + 3.1, -14.0);
  world.root.add(hatchFrame);
  const hatchPanel = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.015, 0.95), m.darkWood);
  hatchPanel.position.set(1.65, FLOOR_Y.upper + 3.08, -14.0);
  world.root.add(hatchPanel);
  const ladderHit = invisibleHitbox(world, { x: 0.9, y: 3.0, z: 1.0 }, new THREE.Vector3(2.05, FLOOR_Y.upper + 1.6, -14.0));
  const ladderEntry = registerInteraction(world, {
    id: 'attic_ladder',
    type: 'attic',
    label: 'attic ladder',
    getPrompt: () => {
      const state = world.game.state;
      if (state.flags.atticOpen) return 'Climb into the bell loft';
      return state.hasItem('wakingKey') ? 'Unlock the attic hatch with the Waking Key' : 'The hatch is locked';
    },
  }, ladderHit);

  const downHit = invisibleHitbox(world, { x: 0.9, y: 1.0, z: 1.0 }, new THREE.Vector3(1.65, base + 0.6, -14.3));
  const downEntry = registerInteraction(world, {
    id: 'attic_ladder_down',
    type: 'attic_down',
    label: 'attic ladder',
    getPrompt: () => 'Climb back down',
  }, downHit);
  downEntry.enabled = false;
  downHit.visible = false;

  // The bell and its rigging.
  const bellBeam = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 0.26), m.darkWood);
  bellBeam.position.set(-0.9, base + 2.48, -16.2);
  world.root.add(bellBeam);
  const bellGroup = new THREE.Group();
  bellGroup.position.set(-1.15, base + 1.7, -16.2);
  world.root.add(bellGroup);
  const profile = [
    [0.08, 1.2], [0.22, 1.15], [0.27, 0.88], [0.38, 0.52],
    [0.5, 0.19], [0.63, 0.08], [0.65, 0.02], [0.58, 0],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const bell = new THREE.Mesh(new THREE.LatheGeometry(profile, 36), m.oldBrass);
  bell.castShadow = true;
  bellGroup.add(bell);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.027, 5, 14), m.brass);
  crown.rotation.x = Math.PI / 2;
  crown.position.y = 1.2;
  bellGroup.add(crown);
  const clapper = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), m.iron);
  clapper.position.y = 0.2;
  bellGroup.add(clapper);
  const bellWire = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.65, 5), m.iron);
  bellWire.position.y = 1.53;
  bellGroup.add(bellWire);
  world.bell = { group: bellGroup, clapper, beam: bellBeam, hit: null };

  // Four pull ropes, one for each note in the waking chord.
  const noteSymbols = ['A', 'C', 'E', 'G'];
  const ropeColors = [0x72523b, 0x745b3a, 0x6c5733, 0x625a3f];
  for (let i = 0; i < 4; i++) {
    const x = -3.15 + i * 1.15;
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.75, 6), new THREE.MeshStandardMaterial({ color: ropeColors[i], roughness: 1 }));
    rope.position.set(x, base + 1.55, -14.25);
    world.root.add(rope);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.02, 6, 14), m.oldBrass);
    handle.position.set(x, base + 0.65, -14.25);
    world.root.add(handle);
    const tag = new THREE.Mesh(
      new THREE.PlaneGeometry(0.17, 0.2),
      new THREE.MeshBasicMaterial({ map: makeTextTexture(world, noteSymbols[i], { width: 200, height: 220, bg: '#b7aa8d', fg: '#332b20', border: '#6b5b43' }), side: THREE.DoubleSide }),
    );
    tag.position.set(x, base + 0.34, -14.24);
    world.root.add(tag);
  }
  const bellHit = invisibleHitbox(world, { x: 3.9, y: 2.2, z: 1.5 }, new THREE.Vector3(-1.5, base + 1.1, -14.6));
  const bellEntry = registerInteraction(world, {
    id: 'waking_bell',
    type: 'bell',
    label: 'Waking Bell',
    getPrompt: () => (world.game.state.flags.bellSolved ? 'The bell is silent' : 'Begin the Waking Chord'),
  }, bellHit);

  // Moonlit crates and a child's chair underneath the bell.
  addBox(world, m.darkWood, new THREE.Vector3(0.8, 0.6, 0.7), new THREE.Vector3(-3.3, base + 0.3, -17.2));
  addBox(world, m.darkWood, new THREE.Vector3(0.6, 0.45, 0.55), new THREE.Vector3(-2.7, base + 0.23, -17.4));
  addBox(world, m.trim, new THREE.Vector3(0.6, 0.34, 0.55), new THREE.Vector3(0.9, base + 0.17, -14.0));
  addBox(world, m.trim, new THREE.Vector3(0.7, 0.06, 0.6), new THREE.Vector3(0.9, base + 0.37, -14.0));
  const smallChair = addBox(world, m.darkWood, new THREE.Vector3(0.48, 0.06, 0.45), new THREE.Vector3(-0.9, base + 0.42, -14.9));
  addBox(world, m.darkWood, new THREE.Vector3(0.48, 0.52, 0.06), new THREE.Vector3(-0.9, base + 0.72, -15.1));
  for (const x of [-1.11, -0.69]) {
    for (const z of [-15.06, -14.74]) addBox(world, m.darkWood, new THREE.Vector3(0.035, 0.4, 0.035), new THREE.Vector3(x, base + 0.2, z));
  }
  world.attic = { ladderEntry, downEntry, bellEntry, hatchPanel };
}

export function setAtticOpen(world, open) {
  if (!world.attic) return;
  world.attic.downEntry.enabled = open;
  if (world.attic.downEntry.hit) world.attic.downEntry.hit.visible = open;
  world.attic.hatchPanel.material = open ? world.materials.black : world.materials.darkWood;
  world.attic.hatchPanel.rotation.y = open ? 0.4 : 0;
}

function buildBasementDressing(world) {
  const m = world.materials;
  // Pipes, cobwebs of steam and a hulking boiler.
  const pipeY = FLOOR_Y.basement + 2.85;
  for (const x of [-2.7, 2.9]) {
    addBeam(world, new THREE.Vector3(x, pipeY, -7.4), new THREE.Vector3(x, pipeY, -13.6), 0.055, m.iron, { radialSegments: 8 });
  }
  for (let i = 0; i < 3; i++) {
    addBeam(world, new THREE.Vector3(-9.4, pipeY - 0.15 * i, -8.2 - i * 0.1), new THREE.Vector3(-4.4, pipeY - 0.15 * i, -8.2 - i * 0.1), 0.035, m.iron, { radialSegments: 8 });
  }

  // A narrow wall shelf carries the cellar's emergency oil lamp.
  addBox(world, m.darkWood, new THREE.Vector3(0.38, 0.04, 0.34), new THREE.Vector3(-5.0, -2.6, -8.21));
  for (const x of [-5.14, -4.86]) {
    addBeam(world, new THREE.Vector3(x, -2.62, -8.36), new THREE.Vector3(x, -2.92, -8.18), 0.016, m.iron);
  }
  const boiler = new THREE.Group();
  boiler.position.set(7.1, FLOOR_Y.basement, -17.1);
  world.root.add(boiler);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 0.9, 2.4, 18), m.basementWall);
  tank.position.y = 1.3;
  boiler.add(tank);
  for (const y of [0.3, 1.1, 1.85, 2.4]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.81, 0.045, 6, 22), m.iron);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    boiler.add(band);
  }
  const gaugeFace = new THREE.Mesh(new THREE.CircleGeometry(0.13, 18), m.ceramic);
  gaugeFace.position.set(0.92, 2.05, 0);
  gaugeFace.rotation.y = Math.PI / 2;
  boiler.add(gaugeFace);
  addBeam(world, new THREE.Vector3(7.1, FLOOR_Y.basement + 2.4, -17.1), new THREE.Vector3(7.1, FLOOR_Y.basement + 3.0, -17.1), 0.12, m.iron, { radialSegments: 10 });
  addBeam(world, new THREE.Vector3(7.1, FLOOR_Y.basement + 2.95, -17.1), new THREE.Vector3(7.1, FLOOR_Y.basement + 2.95, -14.2), 0.09, m.iron, { radialSegments: 8 });

  // Laundry troughs.
  for (let i = 0; i < 2; i++) {
    const x = -8.7 + i * 1.2;
    addBox(world, m.concrete, new THREE.Vector3(0.95, 0.65, 0.95), new THREE.Vector3(x, FLOOR_Y.basement + 0.325, -19.2));
    addBox(world, m.water, new THREE.Vector3(0.8, 0.02, 0.8), new THREE.Vector3(x, FLOOR_Y.basement + 0.65, -19.2));
    addBeam(world, new THREE.Vector3(x, FLOOR_Y.basement + 0.65, -19.55), new THREE.Vector3(x + 0.2, FLOOR_Y.basement + 1.15, -19.55), 0.025, m.oldBrass);
  }

  // Puddles; their shallow surfaces catch the flashlight.
  const puddleMat = new THREE.MeshPhysicalMaterial({
    color: 0x0d1513, roughness: 0.08, metalness: 0.2, transparent: true, opacity: 0.7, envMapIntensity: 0.7,
  });
  for (const [x, z, sx, sz] of [[-2.2, -10.7, 1.4, 0.7], [1.9, -9.2, 1.1, 0.5], [-6.4, -10.8, 0.8, 0.45]]) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(1, 24), puddleMat);
    p.scale.set(sx, sz, 1);
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, FLOOR_Y.basement + 0.012, z);
    world.root.add(p);
  }

  // Crates in the cellar.
  for (const [x, z, s, rot] of [[-8.7, -12.8, 0.7, 0.3], [-7.7, -13.1, 0.55, -0.2], [8.2, -12.4, 0.8, 0.4]]) {
    const crate = addBox(world, m.darkWood, new THREE.Vector3(s, s, s), new THREE.Vector3(x, FLOOR_Y.basement + s / 2, z), rot);
    for (let i = 0; i < 2; i++) {
      addBox(world, m.trim, new THREE.Vector3(s * 1.02, 0.06, 0.05), new THREE.Vector3(x, FLOOR_Y.basement + s * (0.3 + i * 0.4), z), rot);
    }
  }
}

function buildWardDressing(world) {
  const m = world.materials;
  const base = FLOOR_Y.upper;
  // Curtain rails and heavy curtains run the full length of the ward. The
  // panels overlap slightly so the beds read as separate cubicles.
  for (const x of [-6.8, -3.6, -0.4]) {
    addCurtainRail(world, x, base + 2.7, -11.8, -3.4, m.oldBrass, 8, m.oldBrass);
    for (let i = 0; i < 7; i++) {
      const z = -11.4 + i * 1.22;
      const curtain = makeCurtain(world, {
        width: 1.28,
        height: 2.56,
        color: i % 2 === 0 ? 0x8b806e : 0x817767,
        folds: 5,
      });
      curtain.position.set(x + (i % 2 === 0 ? -0.035 : 0.035), base + 1.3, z);
      curtain.rotation.y = Math.PI / 2;
    }
  }
  // A trolley of enamelware.
  addBox(world, m.iron, new THREE.Vector3(0.7, 0.06, 0.45), new THREE.Vector3(1.9, base + 0.8, -4.1));
  for (const z of [-4.4, -3.8]) {
    addBeam(world, new THREE.Vector3(1.6, base + 0.0, z), new THREE.Vector3(1.6, base + 0.8, z), 0.02, m.iron);
    addBeam(world, new THREE.Vector3(2.2, base + 0.0, z), new THREE.Vector3(2.2, base + 0.8, z), 0.02, m.iron);
  }
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.08, 14), m.ceramic);
  bowl.position.set(1.9, base + 0.86, -4.1);
  world.root.add(bowl);

  // The ward clock is stopped at 3:17.
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(0.24, 24), new THREE.MeshStandardMaterial({ color: 0xc5bca4, roughness: 0.6 }));
  clockFace.position.set(-0.8, base + 2.5, -11.82);
  world.root.add(clockFace);
  const hands = new THREE.Group();
  hands.position.set(-0.8, base + 2.5, -11.8);
  world.root.add(hands);
  const handA = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.15, 0.006), m.black);
  handA.position.y = 0.06;
  handA.rotation.z = 1.3;
  hands.add(handA);
  const handB = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.2, 0.006), m.black);
  handB.position.y = 0.08;
  handB.rotation.z = 0.2;
  hands.add(handB);
}

function buildQuarters(world) {
  const m = world.materials;
  const base = FLOOR_Y.upper;
  // A cradle beneath the window, empty except for a mobile of paper moths.
  const cradle = new THREE.Group();
  cradle.position.set(8.7, base, -17.7);
  world.root.add(cradle);
  addBox(world, m.darkWood, new THREE.Vector3(0.9, 0.5, 1.4), new THREE.Vector3(0, 0.45, 0), 0, { parent: cradle });
  addBox(world, m.fabricCream, new THREE.Vector3(0.8, 0.12, 1.25), new THREE.Vector3(0, 0.66, 0), 0, { parent: cradle });
  for (const x of [-0.38, 0.38]) {
    addBeam(world, new THREE.Vector3(8.7 + x, base, -17.7), new THREE.Vector3(8.7 + x, base + 1.5, -17.7), 0.035, m.darkWood);
  }
  addBeam(world, new THREE.Vector3(8.32, base + 1.5, -17.7), new THREE.Vector3(9.08, base + 1.5, -17.7), 0.03, m.darkWood);
  const mobile = new THREE.Group();
  mobile.position.set(8.7, base + 1.33, -17.7);
  cradle.add(mobile);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const moth = new THREE.Mesh(new THREE.PlaneGeometry(0.13, 0.1), m.mothWing);
    moth.position.set(Math.cos(a) * 0.28, -0.15 - i * 0.04, Math.sin(a) * 0.28);
    moth.rotation.y = a;
    mobile.add(moth);
  }
  world.mobile = mobile;

  // Child's drawings pinned above the bed.
  for (let i = 0; i < 3; i++) {
    const tex = world.materials.canvasTexture(300, 380, (ctx, w, h) => {
      ctx.fillStyle = '#bdb49d';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#5b3827';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(w / 2, h * 0.36, 45, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2, h * 0.45);
      ctx.lineTo(w / 2, h * 0.75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(w / 2 - 40, h * 0.62);
      ctx.lineTo(w / 2 + 38, h * 0.56);
      ctx.stroke();
      ctx.font = '22px "Special Elite", monospace';
      ctx.fillStyle = 'rgba(66,45,30,0.8)';
      ctx.fillText(['SHE IS', 'LISTENING', 'STILL'][i], 40, h - 60);
    });
    const drawing = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.4), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
    drawing.position.set(5.0 + i * 0.62, base + 2.1, -18.84);
    world.root.add(drawing);
  }
  const candle = new THREE.PointLight(0xffb37a, 0.25, 3.5, 2);
  candle.position.set(9.0, base + 1.25, -16.0);
  world.root.add(candle);
  world.fixedLamps.push({ light: candle, base: 0.25, phase: 8.2 });
}

function buildCorridorCloset(world) {
  const m = world.materials;
  const group = new THREE.Group();
  group.position.set(6.62, 0, -2.4);
  world.root.add(group);
  // A hollow linen closet. The old solid block put the hiding camera inside
  // timber; this shell leaves a real interior and a door ajar on the corridor.
  addBox(world, m.darkWood, new THREE.Vector3(0.04, 2.25, 1.1), new THREE.Vector3(0.3, 1.125, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.62, 2.25, 0.04), new THREE.Vector3(0, 1.125, -0.53), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.62, 2.25, 0.04), new THREE.Vector3(0, 1.125, 0.53), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.62, 0.06, 1.1), new THREE.Vector3(0, 2.22, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.62, 0.08, 1.1), new THREE.Vector3(0, 0.04, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.05, 0.22, 1.1), new THREE.Vector3(-0.29, 2.12, 0), 0, { parent: group });
  // Shelves and folded linens sit against the back, clear of the hiding eye.
  for (let i = 0; i < 3; i++) {
    addBox(world, m.trim, new THREE.Vector3(0.24, 0.025, 0.94), new THREE.Vector3(0.15, 0.72 + i * 0.52, 0), 0, { parent: group });
    addBox(world, m.fabricCream, new THREE.Vector3(0.19, 0.13 + (i % 2) * 0.04, 0.34), new THREE.Vector3(0.15, 0.79 + i * 0.52, -0.24 + (i % 2) * 0.38), 0, { parent: group });
  }
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.31, 0, -0.55);
  doorPivot.rotation.y = -1.02;
  group.add(doorPivot);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.035, 1.9, 0.56), m.doorWood);
  door.position.set(0, 1.1, 0.28);
  doorPivot.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.025, 6, 5), m.brass);
  knob.position.set(-0.035, 1.05, 0.52);
  doorPivot.add(knob);
  addCollider(world, new THREE.Vector3(6.92, 1.125, -2.4), new THREE.Vector3(0.02, 1.125, 0.55), 0, 'linen-closet-back');
  addCollider(world, new THREE.Vector3(6.62, 1.125, -2.93), new THREE.Vector3(0.31, 1.125, 0.02), 0, 'linen-closet-side');
  addCollider(world, new THREE.Vector3(6.62, 1.125, -1.87), new THREE.Vector3(0.31, 1.125, 0.02), 0, 'linen-closet-side');
}

function buildDayRoomDressing(world) {
  const m = world.materials;
  // A pair of heavy curtains on the west wall gives the day-room hiding spot
  // an actual place to hide. The player slips through the central gap.
  addCurtainRail(world, -9.36, 2.66, -2.75, -0.05, m.oldBrass, 5, m.oldBrass);
  for (const [z, color] of [[-2.25, 0x7e7565], [-0.55, 0x7e7565]]) {
    const curtain = makeCurtain(world, { width: 0.88, height: 2.5, color, folds: 4 });
    curtain.position.set(-9.36, 1.35, z);
    curtain.rotation.y = Math.PI / 2;
  }
  // A low bench and a scatter of abandoned things make the alcove deliberate.
  addBox(world, m.darkWood, new THREE.Vector3(0.32, 0.08, 1.9), new THREE.Vector3(-9.66, 0.46, -1.4));
  for (const z of [-2.25, -0.55]) {
    addBox(world, m.darkWood, new THREE.Vector3(0.28, 0.42, 0.08), new THREE.Vector3(-9.66, 0.21, z));
  }
  addCollider(world, new THREE.Vector3(-9.66, 0.25, -1.4), new THREE.Vector3(0.16, 0.25, 0.95), 0, 'day-curtain-bench');
}

function buildWardrobeNook(world) {
  const m = world.materials;
  const group = new THREE.Group();
  group.position.set(9.42, 0, -4.6);
  world.root.add(group);
  // A walk-in standing wardrobe instead of a solid prop the camera used to be
  // buried inside. One door hangs open toward the office.
  addBox(world, m.darkWood, new THREE.Vector3(0.05, 2.35, 1.2), new THREE.Vector3(0.42, 1.175, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.88, 2.35, 0.05), new THREE.Vector3(0, 1.175, -0.6), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.88, 2.35, 0.05), new THREE.Vector3(0, 1.175, 0.6), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.88, 0.06, 1.2), new THREE.Vector3(0, 2.32, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(0.88, 0.1, 1.2), new THREE.Vector3(0, 0.05, 0), 0, { parent: group });
  addBox(world, m.black, new THREE.Vector3(0.02, 2.08, 1.08), new THREE.Vector3(0.39, 1.12, 0), 0, { parent: group });
  for (const z of [-0.6, 0.6]) {
    addBox(world, m.trim, new THREE.Vector3(0.06, 2.35, 0.06), new THREE.Vector3(-0.44, 1.175, z), 0, { parent: group });
  }
  addBox(world, m.trim, new THREE.Vector3(0.06, 0.08, 1.2), new THREE.Vector3(-0.44, 2.3, 0), 0, { parent: group });
  addBeam(world, new THREE.Vector3(9.58, 2.0, -5.08), new THREE.Vector3(9.58, 2.0, -4.12), 0.016, m.oldBrass);
  const coatColors = [0x2b2924, 0x3a302a, 0x24282a];
  for (let i = 0; i < 3; i++) {
    const coat = new THREE.Mesh(
      new THREE.BoxGeometry(0.13, 0.9 + (i % 2) * 0.14, 0.24),
      new THREE.MeshStandardMaterial({ color: coatColors[i], roughness: 1 }),
    );
    coat.position.set(9.75, 1.5, -4.86 + i * 0.26);
    group.add(coat);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.007, 4, 10), m.oldBrass);
    hook.position.set(9.72, 2.0, -4.86 + i * 0.26);
    hook.rotation.y = Math.PI / 2;
    group.add(hook);
  }
  for (const z of [-4.9, -4.3]) {
    addBox(world, m.darkWood, new THREE.Vector3(0.3, 0.14, 0.34), new THREE.Vector3(9.72, 0.12, z), 0, { parent: group });
  }
  const doorPivot = new THREE.Group();
  doorPivot.position.set(-0.45, 0, -0.6);
  doorPivot.rotation.y = -1.12;
  group.add(doorPivot);
  const door = new THREE.Mesh(new THREE.BoxGeometry(0.04, 2.2, 0.6), m.doorWood);
  door.position.set(0, 1.12, 0.3);
  doorPivot.add(door);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.028, 6, 5), m.brass);
  knob.position.set(-0.045, 1.12, 0.55);
  doorPivot.add(knob);
  addCollider(world, new THREE.Vector3(9.84, 1.175, -4.6), new THREE.Vector3(0.025, 1.175, 0.6), 0, 'wardrobe-back');
  addCollider(world, new THREE.Vector3(9.42, 1.175, -5.2), new THREE.Vector3(0.44, 1.175, 0.025), 0, 'wardrobe-side');
  addCollider(world, new THREE.Vector3(9.42, 1.175, -4.0), new THREE.Vector3(0.44, 1.175, 0.025), 0, 'wardrobe-side');
}

function buildPantry(world) {
  const m = world.materials;
  const group = new THREE.Group();
  group.position.set(13.45, 0, -2.3);
  world.root.add(group);
  // A real walk-in pantry at the kitchen's east wall. The old shelves occupied
  // the hiding camera's exact position.
  addBox(world, m.darkWood, new THREE.Vector3(0.05, 2.25, 1.1), new THREE.Vector3(0.49, 1.125, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(1.0, 2.25, 0.05), new THREE.Vector3(0, 1.125, -0.54), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(1.0, 2.25, 0.05), new THREE.Vector3(0, 1.125, 0.54), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(1.0, 0.06, 1.1), new THREE.Vector3(0, 2.16, 0), 0, { parent: group });
  addBox(world, m.darkWood, new THREE.Vector3(1.0, 0.1, 1.1), new THREE.Vector3(0, 0.05, 0), 0, { parent: group });
  addBox(world, m.black, new THREE.Vector3(0.02, 2.0, 1.0), new THREE.Vector3(0.46, 1.1, 0), 0, { parent: group });
  for (let i = 0; i < 3; i++) {
    addBox(world, m.trim, new THREE.Vector3(0.22, 0.025, 0.96), new THREE.Vector3(0.35, 0.72 + i * 0.52, 0), 0, { parent: group });
    for (let j = 0; j < 3; j++) {
      const jarMat = new THREE.MeshStandardMaterial({
        color: [0x6e6a52, 0x4e5b4d, 0x7b6b50][(i + j) % 3],
        roughness: 0.35,
        metalness: 0.08,
      });
      const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.05, 0.13 + ((i + j) % 2) * 0.05, 8), jarMat);
      jar.position.set(0.35, 0.79 + i * 0.52, -0.32 + j * 0.3);
      group.add(jar);
    }
  }
  addCurtainRail(world, 12.93, 2.02, -2.84, -1.76, m.oldBrass, 4, m.oldBrass);
  const panel = makeCurtain(world, { width: 0.55, height: 1.95, color: 0x6f6555, folds: 4 });
  panel.position.set(12.93, 1.02, -2.56);
  panel.rotation.y = Math.PI / 2;
  addCollider(world, new THREE.Vector3(13.94, 1.125, -2.3), new THREE.Vector3(0.025, 1.125, 0.55), 0, 'pantry-back');
  addCollider(world, new THREE.Vector3(13.45, 1.125, -2.84), new THREE.Vector3(0.5, 1.125, 0.025), 0, 'pantry-side');
  addCollider(world, new THREE.Vector3(13.45, 1.125, -1.76), new THREE.Vector3(0.5, 1.125, 0.025), 0, 'pantry-side');
}

function buildPosters(world) {
  const m = world.materials;
  const posters = [
    { kind: 'sleep', x: -10.13, y: 1.9, z: -1.2, rotY: -Math.PI / 2, w: 0.62, h: 0.86, room: 'treatment' },
    { kind: 'visitors', x: -4.17, y: 1.9, z: -6.2, rotY: -Math.PI / 2, w: 0.55, h: 0.75, room: 'day' },
    { kind: 'sleep', x: -8.5, y: 5.1, z: -11.82, rotY: 0, w: 0.6, h: 0.82, room: 'ward' },
    { kind: 'visitors', x: 3.82, y: 1.8, z: -6.2, rotY: -Math.PI / 2, w: 0.55, h: 0.75, room: 'archive' },
    { kind: 'sleep', x: 9.82, y: 5.0, z: -14.0, rotY: -Math.PI / 2, w: 0.62, h: 0.84, room: 'quarters' },
    { kind: 'visitors', x: 2.32, y: 5.1, z: -14.0, rotY: -Math.PI / 2, w: 0.5, h: 0.7, room: 'observation' },
  ];
  for (const p of posters) {
    const tex = makePosterTexture(world, p.kind);
    addCanvasTextureMesh(world, tex, p.w, p.h, new THREE.Vector3(p.x, p.y, p.z), { y: p.rotY });
    addBox(world, m.trim, new THREE.Vector3(p.rotY === 0 || Math.abs(p.rotY) === Math.PI ? p.w + 0.05 : 0.04, p.h + 0.05, p.rotY === 0 || Math.abs(p.rotY) === Math.PI ? 0.04 : p.w + 0.05), new THREE.Vector3(
      p.x - Math.sin(p.rotY) * 0.03,
      p.y,
      p.z - Math.cos(p.rotY) * 0.03,
    ));
  }
  const chalk = makeChalkTexture(world);
  addCanvasTextureMesh(world, chalk, 2.1, 1.23, new THREE.Vector3(-3.7, 5.05, -18.79), { y: 0 }, { roughness: 0.95 });
  addBox(world, m.trim, new THREE.Vector3(2.22, 1.34, 0.06), new THREE.Vector3(-3.7, 5.05, -18.82));

  // Medical chart cabinet and loose paper in Records.
  addBox(world, m.darkWood, new THREE.Vector3(2.0, 1.8, 0.55), new THREE.Vector3(15.5, 0.9, -11.35));
  for (let i = 0; i < 4; i++) {
    addBox(world, m.oldBrass, new THREE.Vector3(0.55, 0.05, 0.03), new THREE.Vector3(14.85 + (i % 2) * 0.65, 0.35 + Math.floor(i / 2) * 0.75, -11.06));
  }
}

export function buildSetPieces(world) {
  buildHearth(world);
  buildHatch(world);
  buildFuseCabinet(world);
  buildGeneratorPanel(world);
  buildConsole(world);
  buildMirrorSafe(world);
  buildAttic(world);
  buildBasementDressing(world);
  buildWardDressing(world);
  buildDayRoomDressing(world);
  buildQuarters(world);
  buildCorridorCloset(world);
  buildWardrobeNook(world);
  buildPantry(world);
  buildPosters(world);
}

export function updateSetPieces(world, dt, time) {
  const h = world.hatch;
  if (h) {
    h.angle = damp(h.angle, h.targetAngle, 5, dt);
    h.pivot.rotation.x = h.angle;
  }
  const c = world.fuseCabinet;
  if (c && c.open) {
    c.angle = damp(c.angle, -1.55, 7, dt);
    c.pivot.rotation.y = c.angle;
    c.fuseGlow.material.opacity = 0.35 + Math.sin(time * 4.2) * 0.16;
  }
  const con = world.console;
  if (con) {
    con.drawerOpen = damp(con.drawerOpen, con.targetDrawer, 7, dt);
    con.drawer.position.z = 0.38 + con.drawerOpen;
  }
  if (world.mobile) world.mobile.rotation.y = Math.sin(time * 0.35) * 0.4;
  if (world.bell) {
    world.bell.clapper.rotation.z = Math.sin(time * 1.2) * 0.02;
  }
}
