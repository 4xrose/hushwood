import * as THREE from 'three';
import { Materials } from './Materials.js';
import { buildArchitecture } from './Architecture.js';
import { Door } from './Door.js';
import { loadPropModels, placeProps } from './Props.js';
import { buildLighting, updatePower, updateLighting, updateLightBudget, collectCullableLights } from './Lighting.js';
import { mergeStaticWorld } from './StaticMerge.js';
import {
  buildSetPieces, updateSetPieces, openHatchWorld, openFuseCabinet, hideFuse,
  setGeneratorPower, showConsoleKey, hideConsoleKey, openMirrorSafe, setAtticOpen,
} from './SetPieces.js';
import {
  ROOMS, ROOM_BY_ID, DOORS, HIDE_SPOTS, CANDLES, FLOOR_Y,
  NAV_NODES, NAV_BY_ID, NAV_EDGES, PATROL_FULL, PATROL_GROUND, PATROL_UPPER,
  SLEEPWALKER_ROUTES,
} from './LevelData.js';
import { PATIENTS, NOTES } from '../core/Story.js';
import {
  addBox, addBeam, addGlint, addCollider, invisibleHitbox, registerInteraction,
  createNoteMesh, makePaperTexture, addCanvasTextureMesh, baseUrl,
} from './WorldUtils.js';

const UP = new THREE.Vector3(0, 1, 0);
const CELLAR_LADDER = { x: 0.35, z: -10.15 };

const NOTE_PLACEMENTS = [
  { id: 'admission_form', x: -14.7, y: 0.87, z: 2.55, rotY: 0.4, room: 'intake', glint: true },
  { id: 'staff_memo', x: -7.4, y: 0.86, z: 4.15, rotY: -0.14, room: 'reception', glint: true },
  { id: 'patient_drawing', x: -6.8, y: 0.86, z: -4.35, rotY: 0.18, room: 'day', glint: false },
  { id: 'workshop_note', x: -7.2, y: FLOOR_Y.basement + 0.86, z: -4.65, rotY: -0.22, room: 'workshop', glint: true },
  { id: 'generator_note', x: 7.2, y: FLOOR_Y.basement + 1.64, z: -7.62, rotY: 0, room: 'generator', glint: false, wall: true },
  { id: 'mirror_warning', x: 6.55, y: 0.87, z: -9.15, rotY: 0.1, room: 'office', glint: true },
  { id: 'office_photo', x: 7.05, y: 0.87, z: -9.05, rotY: -0.3, room: 'office', glint: false },
  { id: 'front_door_note', x: 3.3, y: 0.84, z: 4.35, rotY: -0.4, room: 'foyer', glint: false },
  { id: 'ward_music_box', x: -8.25, y: 3.4 + 0.73, z: -9.45, rotY: 0.25, room: 'ward', glint: true },
  { id: 'chalkboard', x: -3.7, y: 4.65, z: -18.77, rotY: 0, room: 'observation', glint: false, wall: true, noteId: 'chalkboard' },
];

const CHART_POSITIONS = [
  { x: -8.35, z: -8.55, rotY: -0.15 },
  { x: -5.15, z: -8.55, rotY: 0.12 },
  { x: -1.95, z: -8.55, rotY: -0.12 },
  { x: 1.25, z: -8.55, rotY: 0.15 },
];

const REEL_POSITIONS = [
  { id: 'reel_1', x: 12.15, y: 0.80, z: -9.65, rotY: 0.4 },
  { id: 'reel_2', x: 12.65, y: 0.80, z: -9.85, rotY: -0.3 },
  { id: 'reel_3', x: 13.15, y: 0.80, z: -9.55, rotY: 0.2 },
];

function makeReel(world, { x, y, z, rotY }) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.y = rotY;
  world.root.add(group);
  const film = new THREE.MeshStandardMaterial({ color: 0x3b3228, roughness: 0.7, metalness: 0.1 });
  const reel = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.045, 20), film);
  reel.rotation.x = Math.PI / 2;
  group.add(reel);
  for (const s of [-1, 1]) {
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.022, 20), world.materials.brass);
    plate.rotation.x = Math.PI / 2;
    plate.position.z = s * 0.035;
    group.add(plate);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.09, 8), world.materials.iron);
  hub.rotation.x = Math.PI / 2;
  group.add(hub);
  return group;
}

function makeFlashlight(world, x, y, z, rotY) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  group.rotation.set(0, rotY, Math.PI / 2);
  world.root.add(group);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.035, 0.04, 0.24, 12),
    new THREE.MeshStandardMaterial({ color: 0x8e7440, metalness: 0.75, roughness: 0.35 }),
  );
  group.add(body);
  const head = new THREE.Mesh(
    new THREE.CylinderGeometry(0.058, 0.04, 0.075, 12),
    new THREE.MeshStandardMaterial({ color: 0x4a3d2b, metalness: 0.6, roughness: 0.4 }),
  );
  head.position.y = 0.14;
  group.add(head);
  const lens = new THREE.Mesh(
    new THREE.CircleGeometry(0.05, 16),
    new THREE.MeshStandardMaterial({ color: 0xffe8bc, emissive: 0xffd28a, emissiveIntensity: 1.1, roughness: 0.2 }),
  );
  lens.position.y = 0.179;
  lens.rotation.x = -Math.PI / 2;
  group.add(lens);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 5, 14), world.materials.brass);
  ring.position.y = 0.09;
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  return group;
}

function makeCrowbar(world) {
  const source = world.models.crowbar_01;
  let object;
  if (source) {
    object = source.clone(true);
    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    box.getSize(size);
    const scale = 0.7 / Math.max(0.2, size.y);
    object.scale.setScalar(scale);
    const scaledBox = new THREE.Box3().setFromObject(object);
    const scaledSize = new THREE.Vector3();
    scaledBox.getSize(scaledSize);
    object.position.set(-9.18 - (scaledBox.min.x + scaledBox.max.x) / 2, 0.04 - scaledBox.min.y, -3.4 - (scaledBox.min.z + scaledBox.max.z) / 2);
    object.rotation.z = -0.18;
    object.rotation.y = 0.4;
    world.root.add(object);
  } else {
    object = new THREE.Group();
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.72, 7), world.materials.iron);
    object.add(bar);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.02, 6, 12, 2.4), world.materials.iron);
    hook.position.set(0, 0.36, 0);
    hook.rotation.z = 0.5;
    object.add(hook);
    object.position.set(-9.18, 0.42, -3.4);
    world.root.add(object);
  }
  object.rotation.z = (object.rotation.z || 0) - 0.2;
  return object;
}

function makeWakingKey(world) {
  const group = new THREE.Group();
  const brass = new THREE.MeshStandardMaterial({ color: 0xe0bd72, metalness: 0.9, roughness: 0.22, envMapIntensity: 0.9 });
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.026, 0.024), brass);
  group.add(shaft);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.021, 8, 18), brass);
  bow.position.x = -0.17;
  group.add(bow);
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.09, 0.024), brass);
  tooth.position.set(0.105, -0.05, 0);
  group.add(tooth);
  const tooth2 = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.055, 0.024), brass);
  tooth2.position.set(0.06, -0.035, 0);
  group.add(tooth2);
  const glow = new THREE.PointLight(0xffcf7e, 0.35, 1.7, 2);
  group.add(glow);
  return group;
}

export class World {
  constructor(game) {
    this.game = game;
    this.scene = game.scene;
    this.physics = game.physics;
    this.root = new THREE.Group();
    this.root.name = 'HushwoodWorld';
    this.scene.add(this.root);
    this.materials = new Materials();
    this.interactables = [];
    this.interactablesById = new Map();
    this.glints = [];
    this.doors = {};
    this.models = {};
    this.hatch = null;
    this.candles = [];
    this.roomLights = [];
    this.fixedLamps = [];
    this.nav = { nodes: NAV_BY_ID, nodesList: NAV_NODES, edges: [], adjacency: new Map() };
    this.hideSpots = [];
    this.notes = [];
    this.pickups = [];
    this.chartObjects = [];
    this.candleObjects = new Map();
    this.invisibleMaterial = new THREE.MeshBasicMaterial({ visible: false });
    this.navBuild();
    this.roomLookup = new Map(ROOMS.map((room) => [room.id, room]));
  }

  async load(progress = () => {}) {
    const report = (stage, value) => progress({ stage, value });
    report('Preparing surfaces', 0.02);
    await this.materials.load((v) => report('Preparing surfaces', 0.02 + v * 0.22));

    report('Building the clinic', 0.26);
    buildArchitecture(this);

    report('Hanging doors', 0.38);
    for (const def of DOORS) {
      this.doors[def.id] = new Door(this, def);
    }

    report('Carrying furniture', 0.45);
    await loadPropModels(this, (v) => report('Carrying furniture', 0.45 + v * 0.2));
    placeProps(this);

    report('Lighting the halls', 0.68);
    buildLighting(this);

    report('Closing the seams', 0.74);
    mergeStaticWorld(this);

    report('Setting the stage', 0.8);
    buildSetPieces(this);
    mergeStaticWorld(this, {
      dynamicRoots: [
        this.hatch?.pivot,
        this.fuseCabinet?.pivot,
        this.fuseCabinet?.fuseGroup,
        this.console?.drawer,
        this.console?.keyGroup,
        this.mirrorSafe?.door,
        this.attic?.hatchPanel,
        this.bell?.clapper,
        this.mobile,
        this.generatorNeedle,
        this.generatorGreen,
      ],
    });
    collectCullableLights(this);

    report('Hiding the evidence', 0.9);
    this.buildInteractions();
    this.applyState();
    report('Ready', 1);
  }

  navBuild() {
    const adjacency = new Map();
    for (const node of this.nav.nodesList) adjacency.set(node.id, []);
    for (const edge of NAV_EDGES) {
      const a = adjacency.get(edge.a);
      const b = adjacency.get(edge.b);
      if (!a || !b) continue;
      a.push({ to: edge.b, door: edge.door, cost: 1 });
      b.push({ to: edge.a, door: edge.door, cost: 1 });
    }
    this.nav.adjacency = adjacency;
    this.nav.edges = NAV_EDGES;
  }

  doorPassable(doorId, { unlockOffice = false } = {}) {
    if (!doorId) return true;
    const door = this.doors[doorId];
    if (!door) return true;
    if (door.def.locked === 'office') return Boolean(this.game.state.flags.officeUnlocked || unlockOffice);
    if (door.def.locked === 'bell') return Boolean(this.game.state.flags.bellSolved);
    return true;
  }

  nearestNavNode(position, floor = null) {
    let best = null;
    let bestDistance = Infinity;
    for (const node of NAV_NODES) {
      if (floor && node.floor !== floor) continue;
      const dx = node.pos[0] - position.x;
      const dz = node.pos[2] - position.z;
      const dy = node.pos[1] - position.y;
      const distance = dx * dx + dz * dz + dy * dy * 4;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = node;
      }
    }
    return best;
  }

  findPath(start, goal, { allowOffice = false } = {}) {
    const startId = typeof start === 'string' ? start : this.nearestNavNode(start)?.id;
    const goalId = typeof goal === 'string' ? goal : this.nearestNavNode(goal)?.id;
    if (!startId || !goalId) return [];
    if (startId === goalId) return [NAV_BY_ID[goalId]];
    const open = new Set([startId]);
    const came = new Map();
    const gScore = new Map([[startId, 0]]);
    const fScore = new Map([[startId, this.navHeuristic(startId, goalId)]]);
    const closed = new Set();
    while (open.size) {
      let current = null;
      let currentScore = Infinity;
      for (const id of open) {
        const score = fScore.get(id) ?? Infinity;
        if (score < currentScore) {
          currentScore = score;
          current = id;
        }
      }
      if (!current) break;
      if (current === goalId) {
        const path = [];
        let step = current;
        while (step) {
          path.unshift(NAV_BY_ID[step]);
          step = came.get(step);
        }
        return path;
      }
      open.delete(current);
      closed.add(current);
      for (const edge of this.nav.adjacency.get(current) || []) {
        if (closed.has(edge.to)) continue;
        if (!this.doorPassable(edge.door, { unlockOffice: allowOffice })) continue;
        const cost = (gScore.get(current) ?? Infinity) + edge.cost;
        if (cost < (gScore.get(edge.to) ?? Infinity)) {
          came.set(edge.to, current);
          gScore.set(edge.to, cost);
          fScore.set(edge.to, cost + this.navHeuristic(edge.to, goalId));
          open.add(edge.to);
        }
      }
    }
    return [];
  }

  navHeuristic(aId, bId) {
    const a = NAV_BY_ID[aId]?.pos;
    const b = NAV_BY_ID[bId]?.pos;
    if (!a || !b) return 0;
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }

  roomAt(position, floor = null) {
    for (const room of ROOMS) {
      if (floor && room.floor !== floor) continue;
      if (position.x >= room.x1 && position.x <= room.x2 && position.z >= room.z1 && position.z <= room.z2) {
        return room;
      }
    }
    return null;
  }

  floorAt(position) {
    let best = 'ground';
    let bestScore = Infinity;
    for (const [floor, y] of Object.entries(FLOOR_Y)) {
      const score = Math.abs(position.y - y);
      if (score < bestScore) {
        bestScore = score;
        best = floor;
      }
    }
    return best;
  }

  makeHitbox(size, position, entry) {
    const hit = invisibleHitbox(this, size, position);
    hit.userData.interaction = entry;
    entry.hit = hit;
    entry.position = position.clone ? position.clone() : new THREE.Vector3(position.x, position.y, position.z);
    entry.basePrompt = entry.getPrompt;
    this.interactables.push(entry);
    this.interactablesById.set(entry.id, entry);
    return hit;
  }

  addNote(noteId, { x, y, z, rotY = 0, wall = false, width = 0.32, height = 0.42 }) {
    const note = NOTES[noteId];
    if (!note) return null;
    const texture = makePaperTexture(this, noteId === 'patient_drawing' ? 'drawing' : 'note');
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.93,
      side: THREE.DoubleSide,
      color: 0xcfc3a9,
    });
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    plane.position.set(x, y, z);
    plane.rotation.set(wall ? 0 : -Math.PI / 2, rotY, 0);
    if (wall) plane.rotation.x = 0;
    this.root.add(plane);
    const entry = {
      id: `note_${noteId}`,
      type: 'note',
      noteId,
      label: note.kicker || 'note',
      getPrompt: () => (this.game.state.data.readNotes.includes(noteId) ? `Re-read ${note.title.toLowerCase()}` : `Read ${note.title.toLowerCase()}`),
    };
    const hit = this.makeHitbox(new THREE.Vector3(0.4, wall ? 0.55 : 0.32, wall ? 0.2 : 0.48), new THREE.Vector3(x, y, z), entry);
    if (wall) {
      // Keep the hitbox thin and aligned to the wall.
      hit.scale.set(1, 1, 1);
    }
    const glint = addGlint(this, new THREE.Vector3(x, y + 0.1, z + 0.02), { scale: 0.11, hidden: false });
    glint.visible = !this.game.state.data.readNotes.includes(noteId);
    entry.glint = glint;
    this.notes.push(entry);
    return entry;
  }

  buildInteractions() {
    // Physical items.
    const flashlight = makeFlashlight(this, -7.25, 0.88, 4.35, -0.5);
    const flashlightEntry = {
      id: 'pickup_flashlight',
      type: 'pickup',
      item: 'flashlight',
      label: 'flashlight',
      getPrompt: () => 'Take the flashlight',
      onPickup: () => {
        flashlight.visible = false;
        flashlightGlint.visible = false;
      },
    };
    const flashlightHit = this.makeHitbox(new THREE.Vector3(0.55, 0.5, 0.55), new THREE.Vector3(-7.25, 0.92, 4.35), flashlightEntry);
    const flashlightGlint = addGlint(this, new THREE.Vector3(-7.25, 1.08, 4.35), { scale: 0.15 });
    flashlightEntry.glint = flashlightGlint;
    this.pickups.push(flashlightEntry);

    const crowbar = makeCrowbar(this);
    const crowbarEntry = {
      id: 'pickup_crowbar',
      type: 'pickup',
      item: 'crowbar',
      label: 'crowbar',
      getPrompt: () => 'Take the crowbar',
      onPickup: () => {
        crowbar.visible = false;
        crowbarGlint.visible = false;
      },
    };
    this.makeHitbox(new THREE.Vector3(0.55, 1.0, 0.55), new THREE.Vector3(-9.18, 0.42, -3.4), crowbarEntry);
    const crowbarGlint = addGlint(this, new THREE.Vector3(-9.18, 0.75, -3.4), { scale: 0.17 });
    crowbarEntry.glint = crowbarGlint;
    this.pickups.push(crowbarEntry);

    // Batteries.
    const batterySpots = [
      { x: -8.9, y: 0.87, z: 6.35, id: 'battery_reception' },
      { x: -9.25, y: 0.87, z: -6.6, id: 'battery_day' },
      { x: 8.5, y: 0.88, z: -9.25, id: 'battery_office' },
      { x: -5.7, y: -3.0, z: -6.15, id: 'battery_workshop' },
    ];
    for (const spot of batterySpots) {
      const battery = new THREE.Group();
      battery.position.set(spot.x, spot.y, spot.z);
      this.root.add(battery);
      const cell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10),
        new THREE.MeshStandardMaterial({ color: 0x2b3a34, metalness: 0.55, roughness: 0.35 }),
      );
      cell.rotation.z = Math.PI / 2;
      battery.add(cell);
      const tip = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.03, 8), this.materials.brass);
      tip.rotation.z = Math.PI / 2;
      tip.position.x = 0.092;
      battery.add(tip);
      const glint = addGlint(this, new THREE.Vector3(spot.x, spot.y + 0.12, spot.z), { scale: 0.1, color: 0xffe3a4 });
      const entry = {
        id: `pickup_${spot.id}`,
        type: 'battery',
        item: 'battery',
        label: 'battery',
        getPrompt: () => 'Take the spare battery',
        onPickup: () => {
          battery.visible = false;
          glint.visible = false;
        },
      };
      this.makeHitbox(new THREE.Vector3(0.38, 0.36, 0.38), new THREE.Vector3(spot.x, spot.y, spot.z), entry);
      entry.glint = glint;
      this.pickups.push(entry);
    }

    for (const def of NOTE_PLACEMENTS) {
      const noteId = def.noteId || def.id;
      if (!NOTES[noteId]) continue;
      this.addNote(noteId, def);
    }

    // Four patient charts hang at the foot of the ward beds.
    for (let i = 0; i < 4; i++) {
      const chart = CHART_POSITIONS[i];
      const texture = makePaperTexture(this, 'chart');
      const material = new THREE.MeshStandardMaterial({ map: texture, roughness: 0.94, side: THREE.DoubleSide, color: 0xd1c5a9 });
      const plane = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), material);
      plane.position.set(chart.x, 3.4 + 0.74, chart.z);
      plane.rotation.set(-Math.PI / 2 + 0.35, chart.rotY, 0.04);
      this.root.add(plane);
      const glow = addGlint(this, new THREE.Vector3(chart.x, 3.4 + 0.87, chart.z), { scale: 0.1, color: 0xa8d0ff });
      const entry = {
        id: `chart_${i}`,
        type: 'chart',
        chartIndex: i,
        label: `${PATIENTS[i].colorName} patient chart`,
        getPrompt: () => (this.game.state.charts[i] ? `Re-read ${PATIENTS[i].name}'s chart` : `Read the ${PATIENTS[i].colorName.toLowerCase()} patient chart`),
        glint: glow,
      };
      this.makeHitbox(new THREE.Vector3(0.42, 0.45, 0.42), new THREE.Vector3(chart.x, 3.4 + 0.78, chart.z), entry);
      this.chartObjects.push(entry);
    }

    // Reels in Records.
    for (const def of REEL_POSITIONS) {
      const reel = makeReel(this, def);
      const glint = addGlint(this, new THREE.Vector3(def.x, def.y + 0.18, def.z), { scale: 0.09, color: 0xffdca4 });
      const entry = {
        id: `reel_${def.id}`,
        type: 'reel',
        noteId: def.id,
        label: 'reel-to-reel tape',
        getPrompt: () => (this.game.state.reels.includes(def.id) ? 'Play the tape again' : 'Listen to the tape'),
        onPickup: () => {
          reel.visible = false;
          glint.visible = false;
        },
      };
      this.makeHitbox(new THREE.Vector3(0.45, 0.4, 0.45), new THREE.Vector3(def.x, def.y, def.z), entry);
      entry.glint = glint;
      this.pickups.push(entry);
    }

    // Candle rest points.
    for (const def of CANDLES) {
      const entry = {
        id: `candle_${def.id}`,
        type: 'candle',
        candleId: def.id,
        floor: def.floor,
        checkpoint: def.checkpoint,
        label: def.label,
        getPrompt: () => 'Rest by the candle (checkpoint)',
      };
      this.makeHitbox(new THREE.Vector3(0.62, 0.7, 0.62), new THREE.Vector3(def.x, def.y + 0.15, def.z), entry);
      this.candleObjects.set(def.id, entry);
    }

    // Hiding places.
    for (const spot of HIDE_SPOTS) {
      const entry = {
        id: `hide_${spot.id}`,
        type: 'hide',
        spot,
        label: spot.label,
        getPrompt: () => spot.label,
      };
      this.makeHitbox(new THREE.Vector3(0.8, 1.0, 0.8), new THREE.Vector3(spot.x, (FLOOR_Y[spot.floor] ?? 0) + 0.75, spot.z), entry);
      this.hideSpots.push(entry);
    }

    // The Waking Key inside the office safe.
    const wakingKey = makeWakingKey(this);
    wakingKey.position.set(7.0, 1.02, -11.65);
    wakingKey.rotation.set(0.2, 0.6, 0.1);
    this.root.add(wakingKey);
    const keyGlint = addGlint(this, new THREE.Vector3(7.0, 1.22, -11.55), { scale: 0.15, color: 0xffe0a0 });
    const wakingKeyEntry = {
      id: 'pickup_waking_key',
      type: 'pickup',
      item: 'wakingKey',
      label: 'Waking Key',
      getPrompt: () => 'Take the Waking Key',
      enabled: false,
      onPickup: () => {
        wakingKey.visible = false;
        keyGlint.visible = false;
      },
    };
    this.makeHitbox(new THREE.Vector3(0.45, 0.5, 0.5), new THREE.Vector3(7.0, 1.1, -11.65), wakingKeyEntry);
    wakingKeyEntry.glint = keyGlint;
    wakingKey.visible = false;
    keyGlint.visible = false;
    this.wakingKeyObject = wakingKey;
    this.wakingKeyGlint = keyGlint;
    this.pickups.push(wakingKeyEntry);

    // Hook item pickups up to world-visual cleanup when loaded from a save.
    for (const entry of this.interactables) {
      if (entry.type !== 'pickup') continue;
      const already = this.game.state.isPicked(entry.id)
        || (entry.item && this.game.state.hasItem(entry.item) && entry.item !== 'battery');
      if (already && entry.onPickup) entry.onPickup();
    }
    this.syncItemVisibility();
    this.syncCharts();
  }

  syncItemVisibility() {
    const state = this.game.state;
    const officeTaken = state.isPicked('pickup_office_key') || state.hasItem('officeKey');
    if (officeTaken) hideConsoleKey(this);
    else if (state.flags.consoleSolved) showConsoleKey(this);
    if (state.flags.safeSolved) {
      const wakingTaken = state.isPicked('pickup_waking_key')
        || state.hasItem('wakingKey')
        || state.flags.atticOpen;
      if (this.wakingKeyObject) this.wakingKeyObject.visible = !wakingTaken;
      if (this.wakingKeyGlint) this.wakingKeyGlint.visible = !wakingTaken;
      const entry = this.interactablesById.get('pickup_waking_key');
      if (entry) entry.enabled = !wakingTaken;
    }
  }

  syncCharts() {
    for (let i = 0; i < this.chartObjects.length; i++) {
      const entry = this.chartObjects[i];
      if (entry.glint) entry.glint.visible = !this.game.state.charts[i];
    }
    for (const note of this.notes) {
      if (note.glint) note.glint.visible = !this.game.state.data.readNotes.includes(note.noteId);
    }
    for (const pick of this.pickups) {
      if (pick.type === 'reel' && pick.glint) pick.glint.visible = !this.game.state.reels.includes(pick.noteId);
    }
  }

  applyState() {
    const state = this.game.state;
    const flags = state.flags;
    if (flags.basementDoorPried) openHatchWorld(this, { instant: true });
    if (flags.cabinetPried) openFuseCabinet(this, { instant: true });
    if (flags.powerOn) {
      updatePower(this, true);
      setGeneratorPower(this, true);
    }
    if (flags.consoleSolved) {
      if (state.isPicked('pickup_office_key') || state.hasItem('officeKey')) hideConsoleKey(this);
      else showConsoleKey(this, { instant: true });
    }
    if (flags.safeSolved) {
      openMirrorSafe(this);
      const wakingTaken = state.isPicked('pickup_waking_key')
        || state.hasItem('wakingKey')
        || flags.atticOpen;
      if (this.wakingKeyObject) this.wakingKeyObject.visible = !wakingTaken;
      if (this.wakingKeyGlint) this.wakingKeyGlint.visible = !wakingTaken;
      const entry = this.interactablesById.get('pickup_waking_key');
      if (entry) entry.enabled = !wakingTaken;
    }
    if (flags.atticOpen) setAtticOpen(this, true);
    if (flags.bellSolved) {
      for (const door of Object.values(this.doors)) {
        if (door.def.locked === 'bell') door.setOpen(true, { instant: true, silent: true });
      }
    }
    if (flags.frontDoorOpen) {
      this.doors.front?.setOpen(true, { instant: true, silent: true });
    }
    if (flags.fuseInstalled) {
      // The fuse is gone from the cabinet once installed.
      hideFuse(this);
    }
    for (const entry of this.interactables) {
      if (entry.type === 'pickup' && state.isPicked(entry.id)) {
        entry.enabled = false;
        if (entry.onPickup) entry.onPickup();
      }
    }
    this.syncItemVisibility();
    this.syncCharts();
  }

  getPatrolForFloor(floor) {
    if (floor === 'upper') return PATROL_UPPER;
    if (floor === 'basement') return PATROL_GROUND;
    return PATROL_GROUND;
  }

  getFullPatrol() {
    return PATROL_FULL;
  }

  getSleepwalkerRoutes() {
    return SLEEPWALKER_ROUTES;
  }

  nearestInteractable(camera) {
    if (!camera) return null;
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    let best = null;
    let bestScore = Infinity;
    for (const entry of this.interactables) {
      if (entry.enabled === false) continue;
      if (!entry.hit || !entry.hit.parent) continue;
      if (entry.hit.visible === false && entry.type !== 'pickup') continue;
      const position = entry.position || entry.hit.getWorldPosition(new THREE.Vector3());
      const to = new THREE.Vector3().subVectors(position, camera.position);
      const distance = to.length();
      if (distance > 2.8) continue;
      if (distance < 0.05) continue;
      const direction = to.clone().normalize();
      const dot = direction.dot(forward);
      // Nearby floor-level objects are allowed a wider cone.
      const minDot = position.y < camera.position.y - 0.9 ? 0.32 : 0.48;
      if (dot < minDot && distance > 1.1) continue;
      let score = distance * 1.4 + (1 - dot) * 1.9;
      // Loose items sit in front of furniture; let a visible pickup win over
      // the cabinet or console it rests on.
      if (entry.type === 'pickup') score -= 0.55;
      if (score < bestScore) {
        bestScore = score;
        best = entry;
      }
    }
    return best;
  }

  promptFor(entry) {
    if (!entry) return '';
    if (entry.type === 'door') {
      const door = this.doors[entry.doorId];
      if (door?.def.id === 'front') {
        if (this.game.state.flags.bellSolved) return 'Escape through the front doors';
        return 'The front doors are chained';
      }
      if (door?.isLocked() && door.def.locked === 'office' && this.game.state.hasItem('officeKey')) {
        return 'Unlock the office door with the brass key';
      }
      const prompt = entry.getPrompt?.();
      if (prompt) return prompt;
      return door?.isLocked() ? `${door.label} is locked` : `Open ${door?.label || 'door'}`;
    }
    if (entry.type === 'hide') return `Hide — ${entry.spot.label.toLowerCase()}`;
    return entry.getPrompt?.() || entry.label || 'Interact';
  }

  update(dt, time) {
    for (const door of Object.values(this.doors)) door.update(dt);
    updateSetPieces(this, dt, time);
    updateLighting(this, dt, time);
    this.lightTimer = (this.lightTimer ?? 0) - dt;
    if (this.lightTimer <= 0) {
      this.lightTimer = 0.4;
      updateLightBudget(this);
    }
    for (const glint of this.glints) {
      if (!glint.visible) continue;
      glint.material.opacity = 0.35 + Math.sin(time * 2.4 + glint.position.x * 2.1) * 0.2;
      glint.scale.setScalar(0.11 + Math.sin(time * 1.8 + glint.position.z) * 0.025);
    }
    const visitedRoom = this.roomAt(this.game.player.position, this.game.player.currentFloor);
    if (visitedRoom) this.game.state.markVisited(visitedRoom.id);
  }

  chestLevel(position) {
    return this.roomAt(position, this.floorAt(position));
  }

  teleportToBasement() {
    const player = this.game.player;
    player.setPose(CELLAR_LADDER.x, FLOOR_Y.basement, CELLAR_LADDER.z - 0.85, Math.PI, -0.1);
    this.game.ui?.flash(0.7);
    this.game.audio.play('door_scary', { volume: 0.45 });
    this.game.notify('You climb down into the cellar.', 'info');
    this.game.setCheckpoint({ x: CELLAR_LADDER.x, y: FLOOR_Y.basement, z: CELLAR_LADDER.z - 0.9, floor: 'basement', yaw: Math.PI });
  }

  teleportToArchive() {
    const player = this.game.player;
    player.setPose(CELLAR_LADDER.x, FLOOR_Y.ground, CELLAR_LADDER.z + 0.85, 0, -0.1);
    this.game.ui?.flash(0.55);
    this.game.audio.play('whoosh', { volume: 0.4 });
    this.game.notify('You climb back into the Archive.', 'info');
  }

  teleportToAttic() {
    const player = this.game.player;
    player.setPose(0.2, FLOOR_Y.attic, -14.4, Math.PI * 0.1, 0);
    setAtticOpen(this, true);
    this.game.ui?.flash(0.72);
    this.game.audio.play('door_scary', { volume: 0.35 });
    this.game.notify('The bell loft smells of cold brass and dust.', 'info');
    this.game.setCheckpoint({ x: 0.2, y: FLOOR_Y.attic, z: -14.4, floor: 'attic', yaw: Math.PI * 0.1 });
  }

  teleportFromAttic() {
    const player = this.game.player;
    player.setPose(1.2, FLOOR_Y.upper, -14.0, -Math.PI / 2, 0);
    this.game.ui?.flash(0.55);
    this.game.audio.play('whoosh', { volume: 0.35 });
    this.game.notify('You lower yourself back into Observation.', 'info');
    this.game.setCheckpoint({ x: 1.2, y: FLOOR_Y.upper, z: -14.0, floor: 'upper', yaw: -Math.PI / 2 });
  }

  enemyOpenDoor(doorId) {
    const door = this.doors[doorId];
    if (!door || door.isOpen) return;
    if (door.isLocked()) return;
    door.setOpen(true, { silent: true });
    this.game.audio.play('door_scary', { volume: 0.35 });
  }

  revealWakingKey() {
    if (!this.wakingKeyObject) return;
    const state = this.game.state;
    const taken = state.isPicked('pickup_waking_key')
      || state.hasItem('wakingKey')
      || state.flags.atticOpen;
    this.wakingKeyObject.visible = !taken;
    this.wakingKeyGlint.visible = !taken;
    const entry = this.interactablesById.get('pickup_waking_key');
    if (entry) entry.enabled = !taken;
  }

  dispose() {
    this.scene.remove(this.root);
    this.root.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        for (const mat of mats) {
          if (mat.map) mat.map.dispose();
          mat.dispose();
        }
      }
    });
    this.materials.canvasTextures.forEach((texture) => texture.dispose());
  }
}
