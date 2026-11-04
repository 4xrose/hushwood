import * as THREE from 'three';
import { CANDLES, ROOM_LIGHTS, FLOOR_Y } from './LevelData.js';
import { addBox, addBeam, clamp } from './WorldUtils.js';

function makeBulbMaterial() {
  return new THREE.MeshStandardMaterial({
    color: 0xffe2b2,
    emissive: 0xffb568,
    emissiveIntensity: 0,
    roughness: 0.35,
  });
}

function addBulbFixture(world, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, def.z);
  world.root.add(group);
  const bulbMat = makeBulbMaterial();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.085, 12, 8), bulbMat);
  group.add(bulb);
  const shade = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.18, 14, 1, true),
    world.materials.iron,
  );
  shade.position.y = 0.12;
  shade.rotation.x = Math.PI;
  group.add(shade);
  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.5, 5),
    world.materials.iron,
  );
  cord.position.y = 0.37;
  group.add(cord);

  const light = new THREE.PointLight(def.color, 0, def.distance, 1.65);
  light.position.set(def.x, def.y - 0.05, def.z);
  world.root.add(light);
  world.roomLights.push({ light, bulbMat, def, base: def.intensity });
  return light;
}

function addChandelier(world, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, def.z);
  world.root.add(group);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.035, 6, 24), world.materials.oldBrass);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 6), world.materials.oldBrass);
  stem.position.y = 0.65;
  group.add(stem);
  const bulbs = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x = Math.cos(a) * 0.62;
    const z = Math.sin(a) * 0.62;
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.48, 5), world.materials.oldBrass);
    arm.position.set(x * 0.6, 0.08, z * 0.6);
    arm.rotation.z = Math.PI / 2;
    arm.rotation.y = -a;
    group.add(arm);
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.22, 8), world.materials.wax);
    candle.position.set(x, 0.19, z);
    group.add(candle);
    const bulbMat = makeBulbMaterial();
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 6), bulbMat);
    bulb.position.set(x, 0.34, z);
    group.add(bulb);
    bulbs.push(bulbMat);
  }
  const light = new THREE.PointLight(def.color, 0, def.distance, 1.5);
  light.position.set(def.x, def.y - 0.1, def.z);
  world.root.add(light);
  world.roomLights.push({ light, bulbMat: null, bulbMats: bulbs, def, base: def.intensity });
}

function addCandle(world, def) {
  const group = new THREE.Group();
  group.position.set(def.x, def.y, def.z);
  group.userData.candleId = def.id;
  world.root.add(group);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.045, 12), world.materials.oldBrass);
  group.add(holder);
  const wax = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.22 + Math.random() * 0.1, 10), world.materials.wax);
  wax.position.y = 0.13;
  group.add(wax);
  const flameMat = new THREE.MeshBasicMaterial({
    color: 0xffc078,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.11, 8), flameMat);
  flame.position.y = 0.3;
  group.add(flame);
  const glow = new THREE.PointLight(0xffa25a, 0.7, 4.2, 1.8);
  glow.position.y = 0.36;
  group.add(glow);
  world.candles.push({ def, group, flame, glow, base: 0.7, phase: Math.random() * 10 });
}

function addOilLamp(world, x, y, z, intensity = 0.35) {
  const group = new THREE.Group();
  group.position.set(x, y, z);
  world.root.add(group);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 10), world.materials.brass);
  group.add(base);
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.085, 0.1, 0.28, 10, 1, true),
    new THREE.MeshStandardMaterial({ color: 0xffc88b, transparent: true, opacity: 0.35, roughness: 0.2, side: THREE.DoubleSide, emissive: 0xffa351, emissiveIntensity: 0.45 }),
  );
  glass.position.y = 0.17;
  group.add(glass);
  const light = new THREE.PointLight(0xffad68, intensity, 5.5, 1.8);
  light.position.y = 0.3;
  group.add(light);
  world.fixedLamps.push({ light, base: intensity, phase: Math.random() * 20 });
  return group;
}

export function buildLighting(world) {
  world.roomLights = [];
  world.candles = [];
  world.fixedLamps = [];
  world.ambient = new THREE.AmbientLight(0x18211f, 0.65);
  world.scene.add(world.ambient);
  world.hemi = new THREE.HemisphereLight(0x607c86, 0x0b0a08, 0.55);
  world.scene.add(world.hemi);
  world.moon = new THREE.DirectionalLight(0x9ab4c5, 0.7);
  world.moon.position.set(-8, 14, 10);
  world.moon.castShadow = false;
  world.scene.add(world.moon);

  world.scene.fog = new THREE.FogExp2(0x080b0a, 0.05);
  world.scene.background = new THREE.Color(0x060908);

  for (const def of ROOM_LIGHTS) {
    if (def.id === 'foyer_chand') addChandelier(world, def);
    else addBulbFixture(world, def);
  }

  for (const def of CANDLES) addCandle(world, def);

  // Emergency oil lamps. Each sits on a real surface (cabinet, desk, trolley,
  // wall shelf) instead of hanging in mid-air.
  addOilLamp(world, -15.4, 1.05, 6.8, 0.5);
  addOilLamp(world, -6.6, 0.8, 4.65, 0.45);
  addOilLamp(world, 1.9, 3.4 + 0.8, -4.1, 0.35);
  addOilLamp(world, -5.0, -2.58, -8.2, 0.3);

  // Cold spill from the foyer windows and the attic moon.
  const windowGlow = new THREE.PointLight(0x8fb1c3, 0.9, 11, 1.6);
  windowGlow.position.set(0, 3.4, 6.2);
  world.root.add(windowGlow);
  world.fixedLamps.push({ light: windowGlow, base: 0.9, phase: 2.2 });

  const atticMoon = new THREE.SpotLight(0xa9c4d4, 20, 12, 0.5, 0.8, 1.2);
  atticMoon.position.set(-0.8, 9.25, -16.0);
  atticMoon.target.position.set(0.2, 6.7, -14.3);
  world.root.add(atticMoon);
  world.root.add(atticMoon.target);
  world.atticMoon = atticMoon;

  // A faint volumetric suggestion of the moonbeam in the loft.
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0xa9c4d4,
    transparent: true,
    opacity: 0.032,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 2.3, 2.5, 18, 1, true), beamMat);
  beam.position.set(-0.5, 8.0, -15.4);
  beam.rotation.z = 0.08;
  world.root.add(beam);
  world.atticBeam = beam;

  world.powered = false;
  world.flickerSeed = Array.from({ length: 20 }, () => Math.random() * 10);
  updatePower(world, false);

  // Keep a fixed number of point lights active around the player. Three.js
  // compiles shaders for the exact visible light count, so the budget must stay
  // constant between frames to avoid shader-compilation hitching.
  collectCullableLights(world);
}

const LIGHT_BUDGET = { low: 5, medium: 7, high: 10 };
const lightSortPosition = new THREE.Vector3();

export function collectCullableLights(world) {
  world.cullableLights = [
    ...world.roomLights.map((item) => item.light),
    ...world.candles.map((candle) => candle.glow),
    ...world.fixedLamps.map((item) => item.light),
  ];
  for (const light of world.cullableLights) light.visible = false;
  updateLightBudget(world);
}

export function updateLightBudget(world) {
  const lights = world.cullableLights;
  if (!lights || lights.length === 0) return;
  const quality = world.game?.quality || 'high';
  const budget = Math.min(LIGHT_BUDGET[quality] ?? LIGHT_BUDGET.high, lights.length);
  const camera = world.game?.camera;
  const origin = camera ? camera.position : lightSortPosition.set(0, 1.6, 0);

  const scored = lights.map((light) => {
    light.getWorldPosition(lightSortPosition);
    const distance = lightSortPosition.distanceToSquared(origin);
    // Prefer lights that are actually lit, then the nearest fixtures.
    const lit = light.intensity > 0.02 ? 0 : 1;
    return { light, score: lit * 1e7 + distance };
  });
  scored.sort((a, b) => a.score - b.score);
  for (let i = 0; i < scored.length; i += 1) {
    scored[i].light.visible = i < budget;
  }
}

export function updatePower(world, powered) {
  world.powered = powered;
  for (const item of world.roomLights) {
    const alwaysOn = item.def.id === 'day_fire' || item.def.id === 'attic_moon';
    const on = powered || alwaysOn;
    item.light.intensity = on ? item.base * 14 : 0;
    if (item.bulbMat) item.bulbMat.emissiveIntensity = on ? 1.25 : 0;
    if (item.bulbMats) for (const mat of item.bulbMats) mat.emissiveIntensity = on ? 1.25 : 0;
    item.on = on;
  }
  if (world.ambient) world.ambient.intensity = powered ? 0.9 : 0.55;
  if (world.hemi) world.hemi.intensity = powered ? 0.75 : 0.48;
  if (world.scene.fog) world.scene.fog.density = powered ? 0.043 : 0.05;
}

export function updateLighting(world, dt, time) {
  for (let i = 0; i < world.roomLights.length; i++) {
    const item = world.roomLights[i];
    if (!item.on) continue;
    const seed = world.flickerSeed[i] || 0;
    let flicker = 1;
    if (item.def.id === 'day_fire') {
      flicker = 0.78 + Math.sin(time * 8.3 + seed) * 0.12 + Math.sin(time * 17.1 + seed) * 0.06;
    } else if (item.def.id === 'attic_moon') {
      flicker = 0.94 + Math.sin(time * 0.4) * 0.04;
    } else if (item.def.id === 'generator_lamp') {
      flicker = Math.random() < 0.015 ? 0.2 : 0.9 + Math.sin(time * 11 + seed) * 0.08;
    } else {
      flicker = 0.91 + Math.sin(time * 1.7 + seed) * 0.07 + Math.sin(time * 6.2 + seed) * 0.02;
    }
    item.light.intensity = item.base * 14 * flicker;
    if (item.bulbMat) item.bulbMat.emissiveIntensity = 0.5 + flicker * 0.9;
    if (item.bulbMats) for (const mat of item.bulbMats) mat.emissiveIntensity = 0.4 + flicker * 0.9;
  }
  for (const lamp of world.fixedLamps) {
    lamp.light.intensity = lamp.base * (0.92 + Math.sin(time * 2.1 + lamp.phase) * 0.08);
  }
  for (const candle of world.candles) {
    const flicker = 0.78 + Math.sin(time * 9 + candle.phase) * 0.12 + Math.sin(time * 21 + candle.phase) * 0.06;
    candle.glow.intensity = candle.base * flicker;
    candle.flame.scale.set(0.9 + flicker * 0.15, 0.85 + flicker * 0.3, 0.9 + flicker * 0.15);
    candle.flame.position.x = Math.sin(time * 7 + candle.phase) * 0.008;
    candle.flame.position.z = Math.cos(time * 5.5 + candle.phase) * 0.008;
  }
  if (world.atticMoon) {
    world.atticMoon.intensity = 18 + Math.sin(time * 0.3) * 2;
    if (world.atticBeam) world.atticBeam.material.opacity = 0.028 + Math.sin(time * 0.45) * 0.005;
  }
}

export function lightning(world) {
  if (!world.moon) return;
  const original = world.moon.intensity;
  world.moon.intensity = 3.2;
  if (world.hemi) world.hemi.intensity += 0.35;
  setTimeout(() => {
    world.moon.intensity = original;
    if (world.hemi) world.hemi.intensity = Math.max(0.2, world.hemi.intensity - 0.35);
  }, 120);
}
