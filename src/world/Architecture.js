import * as THREE from 'three';
import {
  ROOMS, ROOM_BY_ID, DOORS, SIGNS, FLOOR_Y,
} from './LevelData.js';
import { addBox, addCollider, addPlane, addBeam, createCanvasLabel } from './WorldUtils.js';

const HATCH = { x: 0.35, z: -10.15, w: 1.18, d: 1.18 };
const WALL_T = 0.15;
const DOOR_TOP = { wood: 2.16, metal: 2.12, arch: 2.7, double: 2.45 };

const SIDE_INFO = {
  west: { axis: 'x', coord: (r) => r.x1, range: (r) => [r.z1, r.z2], rotY: Math.PI / 2, normal: 1 },
  east: { axis: 'x', coord: (r) => r.x2, range: (r) => [r.z1, r.z2], rotY: -Math.PI / 2, normal: -1 },
  north: { axis: 'z', coord: (r) => r.z1, range: (r) => [r.x1, r.x2], rotY: 0, normal: 1 },
  south: { axis: 'z', coord: (r) => r.z2, range: (r) => [r.x1, r.x2], rotY: Math.PI, normal: -1 },
};

function splitRange(range, holes) {
  let parts = [{ a: range[0], b: range[1] }];
  for (const hole of holes) {
    const next = [];
    for (const part of parts) {
      const a = Math.max(part.a, hole.a);
      const b = Math.min(part.b, hole.b);
      if (b <= a) {
        next.push(part);
        continue;
      }
      if (part.a < a - 0.001) next.push({ a: part.a, b: a });
      if (part.b > b + 0.001) next.push({ a: b, b: part.b });
    }
    parts = next;
  }
  return parts.filter((p) => p.b - p.a > 0.03);
}

function roomSurfaceMaterial(world, room, kind) {
  if (kind === 'floor') return world.materials.get(room.floorMat);
  if (kind === 'ceiling') return world.materials.get(room.ceilMat);
  return world.materials.get(room.wallMat);
}

function addSurfacePlane(world, material, width, depth, x, y, z, { ceiling = false, uvScale = 0.45, receive = true } = {}) {
  const mesh = addPlane(
    world,
    material,
    width,
    depth,
    new THREE.Vector3(x, y, z),
    { x: ceiling ? Math.PI / 2 : -Math.PI / 2, y: 0, z: 0 },
    { uvScale: [uvScale, uvScale], receive },
  );
  return mesh;
}

function addFloorRect(world, room, x1, x2, z1, z2, base, { ceiling = false } = {}) {
  const width = x2 - x1;
  const depth = z2 - z1;
  if (width < 0.02 || depth < 0.02) return;
  const y = ceiling ? base + room.h : base;
  addSurfacePlane(world, roomSurfaceMaterial(world, room, ceiling ? 'ceiling' : 'floor'), width, depth, (x1 + x2) / 2, y, (z1 + z2) / 2, {
    ceiling,
    uvScale: ceiling ? 0.35 : 0.38,
  });
  if (!ceiling) {
    addCollider(world, { x: (x1 + x2) / 2, y: y - 0.09, z: (z1 + z2) / 2 }, {
      x: width / 2, y: 0.09, z: depth / 2,
    }, 0, `floor:${room.id}`);
  } else {
    addCollider(world, { x: (x1 + x2) / 2, y: y + 0.08, z: (z1 + z2) / 2 }, {
      x: width / 2, y: 0.08, z: depth / 2,
    }, 0, `ceiling:${room.id}`);
  }
}

function addFloorAndCeiling(world, room) {
  const base = FLOOR_Y[room.floor];
  const floorHole = room.id === 'archive' ? HATCH : null;
  const ceilingHole = room.id === 'cellar' ? HATCH : null;
  if (!floorHole) {
    addFloorRect(world, room, room.x1, room.x2, room.z1, room.z2, base);
  } else {
    const hx1 = floorHole.x - floorHole.w / 2;
    const hx2 = floorHole.x + floorHole.w / 2;
    const hz1 = floorHole.z - floorHole.d / 2;
    const hz2 = floorHole.z + floorHole.d / 2;
    addFloorRect(world, room, room.x1, room.x2, room.z1, hz1, base);
    addFloorRect(world, room, room.x1, room.x2, hz2, room.z2, base);
    addFloorRect(world, room, room.x1, hx1, hz1, hz2, base);
    addFloorRect(world, room, hx2, room.x2, hz1, hz2, base);
  }
  if (!ceilingHole) {
    addFloorRect(world, room, room.x1, room.x2, room.z1, room.z2, base, { ceiling: true });
  } else {
    const hx1 = ceilingHole.x - ceilingHole.w / 2;
    const hx2 = ceilingHole.x + ceilingHole.w / 2;
    const hz1 = ceilingHole.z - ceilingHole.d / 2;
    const hz2 = ceilingHole.z + ceilingHole.d / 2;
    addFloorRect(world, room, room.x1, room.x2, room.z1, hz1, base, { ceiling: true });
    addFloorRect(world, room, room.x1, room.x2, hz2, room.z2, base, { ceiling: true });
    addFloorRect(world, room, room.x1, hx1, hz1, hz2, base, { ceiling: true });
    addFloorRect(world, room, hx2, room.x2, hz1, hz2, base, { ceiling: true });
  }
}

function doorOpeningsForSide(room, side) {
  const info = SIDE_INFO[side];
  const coord = info.coord(room);
  const openings = [];
  for (const door of DOORS) {
    if (!door.rooms.includes(room.id)) continue;
    if (door.axis !== info.axis) continue;
    if (Math.abs(door.at - coord) > 0.03) continue;
    const [min, max] = info.range(room);
    const a = door.center - door.width / 2;
    const b = door.center + door.width / 2;
    if (a >= min - 0.05 && b <= max + 0.05) {
      openings.push({ a, b, door });
    }
  }
  return openings;
}

function addBaseboard(world, side, room, coord, a, b, base) {
  const length = b - a;
  if (length < 0.05) return;
  const offset = 0.04;
  let position;
  let size;
  if (side === 'west' || side === 'east') {
    const inner = side === 'west' ? coord + WALL_T : coord - WALL_T;
    const dir = side === 'west' ? 1 : -1;
    const x = inner - dir * offset;
    position = new THREE.Vector3(x, base + 0.09, (a + b) / 2);
    size = new THREE.Vector3(0.07, 0.18, length);
  } else {
    const inner = side === 'north' ? coord + WALL_T : coord - WALL_T;
    const dir = side === 'north' ? 1 : -1;
    const z = inner - dir * offset;
    position = new THREE.Vector3((a + b) / 2, base + 0.09, z);
    size = new THREE.Vector3(length, 0.18, 0.07);
  }
  addBox(world, world.materials.trim, size, position);
}

function addWallVisual(world, room, side, coord, a, b, base, height, { baseboard = true, collider = true } = {}) {
  const info = SIDE_INFO[side];
  const length = b - a;
  if (length < 0.02 || height < 0.02) return;
  const material = roomSurfaceMaterial(world, room, 'wall');
  const mid = (a + b) / 2;
  let center;
  let size;
  let planePos;
  let planeWidth = length;
  if (side === 'west' || side === 'east') {
    const x = side === 'west' ? coord + WALL_T / 2 : coord - WALL_T / 2;
    center = new THREE.Vector3(x, base + height / 2, mid);
    size = new THREE.Vector3(WALL_T, height, length);
    planePos = new THREE.Vector3(
      side === 'west' ? coord + WALL_T + 0.002 : coord - WALL_T - 0.002,
      base + height / 2,
      mid,
    );
  } else {
    const z = side === 'north' ? coord + WALL_T / 2 : coord - WALL_T / 2;
    center = new THREE.Vector3(mid, base + height / 2, z);
    size = new THREE.Vector3(length, height, WALL_T);
    planePos = new THREE.Vector3(
      mid,
      base + height / 2,
      side === 'north' ? coord + WALL_T + 0.002 : coord - WALL_T - 0.002,
    );
  }
  addBox(world, material, size, center);
  addPlane(world, material, planeWidth, height, planePos, { x: 0, y: info.rotY, z: 0 }, {
    uvScale: [0.34, 0.34],
    receive: true,
  });
  if (collider) {
    addCollider(world, center, {
      x: size.x / 2, y: size.y / 2, z: size.z / 2,
    }, 0, `wall:${room.id}`);
  }
  if (baseboard) addBaseboard(world, side, room, coord, a, b, base);
  return { material, size, center };
}

function addWall(world, room, side) {
  const info = SIDE_INFO[side];
  const base = FLOOR_Y[room.floor];
  const coord = info.coord(room);
  const [rangeMin, rangeMax] = info.range(room);
  const openings = doorOpeningsForSide(room, side).sort((p, q) => p.a - q.a);
  const skipRanges = [];
  if (room.id === 'balcony' && side === 'west') {
    skipRanges.push({ a: -3, b: 1.5 });
  }
  const allHoles = [
    ...openings.map((o) => ({ a: o.a, b: o.b })),
    ...skipRanges,
  ];
  const solidParts = splitRange([rangeMin, rangeMax], allHoles);

  for (const part of solidParts) {
    addWallVisual(world, room, side, coord, part.a, part.b, base, room.h);
  }

  for (const opening of openings) {
    const doorTop = DOOR_TOP[opening.door.kind] || 2.15;
    if (room.h > doorTop + 0.02) {
      addWallVisual(world, room, side, coord, opening.a, opening.b, base + doorTop, room.h - doorTop, { baseboard: false });
    }
  }

  // Chair rail on papered rooms adds a human scale to the tall walls.
  if (!['treatment', 'kitchen', 'observation', 'workshop', 'generator', 'cellar', 'laundry', 'boiler', 'attic'].includes(room.id)) {
    for (const part of solidParts) {
      const length = part.b - part.a;
      if (length < 0.6) continue;
      let pos;
      let size;
      const inner = side === 'west' ? coord + WALL_T : side === 'east' ? coord - WALL_T : side === 'north' ? coord + WALL_T : coord - WALL_T;
      if (side === 'west' || side === 'east') {
        pos = new THREE.Vector3(inner + (side === 'west' ? -0.03 : 0.03), base + 1.0, (part.a + part.b) / 2);
        size = new THREE.Vector3(0.055, 0.06, length);
      } else {
        pos = new THREE.Vector3((part.a + part.b) / 2, base + 1.0, inner + (side === 'north' ? -0.03 : 0.03));
        size = new THREE.Vector3(length, 0.06, 0.055);
      }
      addBox(world, world.materials.trim, size, pos);
    }
  }
}

function buildDoorFrames(world) {
  const trim = world.materials.trim;
  const brass = world.materials.brass;
  for (const door of DOORS) {
    const first = ROOM_BY_ID[door.rooms[0]];
    const base = FLOOR_Y[first.floor];
    const top = DOOR_TOP[door.kind] || 2.15;
    if (door.axis === 'x') {
      for (const s of [-1, 1]) {
        addBox(world, trim, new THREE.Vector3(0.22, top + 0.08, 0.12), new THREE.Vector3(door.at, base + (top + 0.08) / 2, door.center + s * (door.width / 2 + 0.06)));
      }
      addBox(world, trim, new THREE.Vector3(0.2, 0.14, door.width + 0.34), new THREE.Vector3(door.at, base + top + 0.05, door.center));
      addBox(world, brass, new THREE.Vector3(0.035, 0.06, door.width * 0.4), new THREE.Vector3(door.at + (first.x2 === door.at ? -0.11 : 0.11), base + 1.45, door.center));
    } else {
      for (const s of [-1, 1]) {
        addBox(world, trim, new THREE.Vector3(0.12, top + 0.08, 0.22), new THREE.Vector3(door.center + s * (door.width / 2 + 0.06), base + (top + 0.08) / 2, door.at));
      }
      addBox(world, trim, new THREE.Vector3(door.width + 0.34, 0.14, 0.2), new THREE.Vector3(door.center, base + top + 0.05, door.at));
      addBox(world, brass, new THREE.Vector3(door.width * 0.4, 0.06, 0.035), new THREE.Vector3(door.center, base + 1.45, door.at + (first.z2 === door.at ? -0.11 : 0.11)));
    }
    addBox(world, world.materials.darkWood, new THREE.Vector3(
      door.axis === 'x' ? 0.36 : door.width,
      0.025,
      door.axis === 'x' ? door.width : 0.36,
    ), new THREE.Vector3(
      door.axis === 'x' ? door.at : door.center,
      base + 0.013,
      door.axis === 'x' ? door.center : door.at,
    ));
  }
}

function buildStairs(world) {
  const rise = 3.4 / 17;
  const run = (6.35 - 1.55) / 17;
  const xCenter = 3.12;
  const width = 1.55;
  const material = world.materials.darkWood;
  const runner = new THREE.MeshStandardMaterial({ color: 0x4a2721, roughness: 1 });
  const base = 0;
  for (let i = 0; i < 17; i++) {
    const top = (i + 1) * rise;
    const z = 6.35 - (i + 0.5) * run;
    const height = top;
    addBox(world, material, new THREE.Vector3(width, height, run + 0.015), new THREE.Vector3(xCenter, base + height / 2, z));
    addCollider(world, new THREE.Vector3(xCenter, base + height / 2, z), new THREE.Vector3(width / 2, height / 2, run / 2 + 0.01), 0, 'stairs');
    addBox(world, runner, new THREE.Vector3(0.84, 0.012, run + 0.022), new THREE.Vector3(xCenter, top + 0.009, z));
  }
  // Newel and handrail.
  addBox(world, world.materials.darkWood, new THREE.Vector3(0.12, 1.25, 0.12), new THREE.Vector3(2.29, 0.625, 6.4));
  const railStart = new THREE.Vector3(2.29, 1.0, 6.4);
  const railEnd = new THREE.Vector3(2.29, 4.36, 1.62);
  addBeam(world, railStart, railEnd, 0.045, world.materials.oldBrass);
  const railBaseStart = new THREE.Vector3(2.29, 0.34, 6.3);
  const railBaseEnd = new THREE.Vector3(2.29, 3.74, 1.62);
  addBeam(world, railBaseStart, railBaseEnd, 0.025, world.materials.iron);
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const z = THREE.MathUtils.lerp(6.3, 1.7, t);
    const y = THREE.MathUtils.lerp(0.4, 3.8, t);
    addBeam(world, new THREE.Vector3(2.29, y, z), new THREE.Vector3(2.29, y + 0.58, z), 0.018, world.materials.iron);
  }
  addBeam(world, new THREE.Vector3(3.86, 0.0, 6.4), new THREE.Vector3(3.86, 3.4, 1.62), 0.03, world.materials.iron);

  // Balcony edge rail. No rail across the stair landing at z=1.5.
  const posts = 7;
  for (let i = 0; i < posts; i++) {
    const z = THREE.MathUtils.lerp(-2.92, 1.28, i / (posts - 1));
    addBox(world, world.materials.iron, new THREE.Vector3(0.045, 1.02, 0.045), new THREE.Vector3(2.47, 3.4 + 0.51, z));
  }
  addBeam(world, new THREE.Vector3(2.47, 4.36, -2.95), new THREE.Vector3(2.47, 4.36, 1.38), 0.035, world.materials.darkWood);
  addBeam(world, new THREE.Vector3(2.47, 3.64, -2.95), new THREE.Vector3(2.47, 3.64, 1.38), 0.02, world.materials.iron);
  addCollider(world, new THREE.Vector3(2.47, 3.4 + 0.52, -0.8), new THREE.Vector3(0.055, 0.52, 2.25), 0, 'balcony-rail');
}

function addWindow(world, { x, y, z, w, h, rotY = 0, moon = true }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  world.root.add(group);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0x1b2b33,
    emissive: 0x0a1721,
    emissiveIntensity: moon ? 0.55 : 0.08,
    roughness: 0.2,
    metalness: 0.15,
    transparent: true,
    opacity: 0.82,
  });
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassMat);
  group.add(glass);
  const frameMat = world.materials.trim;
  const t = 0.09;
  const frameParts = [
    { size: [w + t * 2, t, 0.09], pos: [0, h / 2, 0.01] },
    { size: [w + t * 2, t, 0.09], pos: [0, -h / 2, 0.01] },
    { size: [t, h, 0.09], pos: [-w / 2, 0, 0.01] },
    { size: [t, h, 0.09], pos: [w / 2, 0, 0.01] },
    { size: [0.05, h, 0.07], pos: [0, 0, 0.02] },
    { size: [w, 0.05, 0.07], pos: [0, 0, 0.02] },
  ];
  for (const p of frameParts) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...p.size), frameMat);
    mesh.position.set(...p.pos);
    group.add(mesh);
  }
  // A few pale streaks to suggest rain on old glass.
  const rainMat = new THREE.MeshBasicMaterial({ color: 0x8ba4ab, transparent: true, opacity: 0.1, depthWrite: false });
  const rain = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.012, 1), rainMat, 7);
  const streak = new THREE.Object3D();
  for (let i = 0; i < 7; i++) {
    streak.position.set(-w / 2 + Math.random() * w, -h / 2 + Math.random() * h, 0.03);
    streak.rotation.set(0, 0, 0.12);
    streak.scale.set(1, 0.3 + Math.random() * 0.45, 1);
    streak.updateMatrix();
    rain.setMatrixAt(i, streak.matrix);
  }
  rain.instanceMatrix.needsUpdate = true;
  group.add(rain);
  return group;
}

function buildWindows(world) {
  addWindow(world, { x: -2.72, y: 2.55, z: 7.89, w: 0.92, h: 2.5, rotY: Math.PI });
  addWindow(world, { x: 2.72, y: 2.55, z: 7.89, w: 0.92, h: 2.5, rotY: Math.PI });
  addWindow(world, { x: -2.72, y: 5.05, z: 7.89, w: 0.92, h: 1.55, rotY: Math.PI });
  addWindow(world, { x: 2.72, y: 5.05, z: 7.89, w: 0.92, h: 1.55, rotY: Math.PI });
  addWindow(world, { x: -9.89, y: 1.55, z: -16.5, w: 0.9, h: 2.1, rotY: Math.PI / 2 });
}

function buildSigns(world) {
  const defs = [
    { text: 'GRAND FOYER', position: [-1.8, 3.0, 7.828], rotY: Math.PI, width: 1.6, height: 0.3 },
    { text: 'INTAKE', position: [-10.17, 2.45, 6.1], rotY: -Math.PI / 2, width: 1.15, height: 0.28 },
    { text: 'RECEPTION', position: [-9.83, 2.45, 4.3], rotY: Math.PI / 2, width: 1.5, height: 0.3 },
    { text: 'DAY ROOM', position: [-3.828, 2.56, -2.0], rotY: Math.PI / 2, width: 1.5, height: 0.3 },
    { text: 'ARCHIVE', position: [0, 2.72, -2.828], rotY: 0, width: 1.35, height: 0.3 },
    { text: 'EAST CORRIDOR', position: [3.828, 2.55, -1.2], rotY: -Math.PI / 2, width: 1.45, height: 0.28 },
    { text: 'WARD', position: [2.328, 5.65, -7.0], rotY: -Math.PI / 2, width: 1.1, height: 0.28 },
    { text: 'OBSERVATION', position: [2.328, 5.65, -16.0], rotY: -Math.PI / 2, width: 1.55, height: 0.28 },
    { text: 'GENERATOR', position: [4.172, 2.2, -4.0], rotY: Math.PI / 2, width: 1.45, height: 0.28 },
    { text: 'WORKSHOP', position: [-4.172, 2.2, -4.0], rotY: -Math.PI / 2, width: 1.35, height: 0.28 },
    { text: 'BELL LOFT', position: [-1.0, 8.2, -13.172], rotY: Math.PI, width: 1.5, height: 0.32 },
  ];
  for (const def of defs) {
    const material = createCanvasLabel(world, def.text, { width: 768, height: 192, bg: '#28261f' });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(def.width, def.height), material);
    mesh.position.set(...def.position);
    mesh.rotation.y = def.rotY;
    world.root.add(mesh);
    const back = new THREE.Mesh(new THREE.BoxGeometry(def.width + 0.08, def.height + 0.06, 0.035), world.materials.darkWood);
    const backPos = new THREE.Vector3(...def.position);
    backPos.x -= Math.sin(def.rotY) * 0.018;
    backPos.z -= Math.cos(def.rotY) * 0.018;
    back.position.copy(backPos);
    back.rotation.y = def.rotY;
    world.root.add(back);
  }
  // Exit sign above the front door, lit only by the moon.
  const exitMat = createCanvasLabel(world, 'EXIT', { width: 512, height: 180, bg: '#28302a', fg: '#b9c39d', border: '#6e7b68' });
  const exit = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.2), exitMat);
  exit.position.set(0, 3.35, 7.828);
  exit.rotation.y = Math.PI;
  world.root.add(exit);
}

function addFoyerDetails(world) {
  // Archway trim around the two large openings, plus a tired runner rug.
  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 7.2),
    new THREE.MeshStandardMaterial({
      map: world.materials.textures.dirty_carpet?.diffuse,
      color: 0x6b4a3f,
      roughness: 1,
    }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.set(0, 0.012, 2.3);
  world.root.add(rug);

  addBox(world, world.materials.trim, new THREE.Vector3(0.16, 3.6, 0.16), new THREE.Vector3(-1.42, 1.8, -3.0));
  addBox(world, world.materials.trim, new THREE.Vector3(0.16, 3.6, 0.16), new THREE.Vector3(1.42, 1.8, -3.0));
  addBox(world, world.materials.trim, new THREE.Vector3(3.0, 0.17, 0.18), new THREE.Vector3(0, 3.54, -3.0));
}

function buildCeilingBeams(world) {
  for (const room of ROOMS) {
    if (room.floor !== 'basement' && room.floor !== 'attic') continue;
    const base = FLOOR_Y[room.floor] + room.h - 0.08;
    const alongX = room.x2 - room.x1 > room.z2 - room.z1;
    if (room.id === 'cellar' || room.id === 'boiler' || room.id === 'attic') {
      const count = Math.max(2, Math.floor((room.z2 - room.z1) / 2.4));
      for (let i = 1; i < count; i++) {
        const z = THREE.MathUtils.lerp(room.z1, room.z2, i / count);
        addBox(world, world.materials.iron, new THREE.Vector3(room.x2 - room.x1, 0.16, 0.14), new THREE.Vector3((room.x1 + room.x2) / 2, base, z));
      }
    }
    if (room.id === 'attic') {
      for (let i = 0; i < 4; i++) {
        const x = THREE.MathUtils.lerp(room.x1 + 0.5, room.x2 - 0.5, i / 3);
        addBeam(world, new THREE.Vector3(x, base + 0.05, room.z1 + 0.3), new THREE.Vector3(x, base + 0.05, room.z2 - 0.3), 0.055, world.materials.darkWood);
      }
    }
  }
}

export function buildArchitecture(world) {
  for (const room of ROOMS) {
    addFloorAndCeiling(world, room);
    for (const side of ['north', 'south', 'east', 'west']) {
      addWall(world, room, side);
    }
  }
  buildDoorFrames(world);
  buildStairs(world);
  buildWindows(world);
  buildSigns(world);
  addFoyerDetails(world);
  buildCeilingBeams(world);
}
