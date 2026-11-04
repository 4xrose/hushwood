import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Static architecture, furniture and light fixtures never move. Baking them
// into one mesh per material + spatial cell removes hundreds of draw calls
// while keeping enough spatial separation for frustum culling.
const CELL_XZ = 32;
const CELL_Y = 3.2;

function geometrySignature(geometry) {
  let signature = '';
  for (const name of Object.keys(geometry.attributes).sort()) {
    const attribute = geometry.attributes[name];
    signature += `${name}:${attribute.itemSize}:${attribute.normalized ? 1 : 0};`;
  }
  return `${signature}${geometry.index ? 'indexed' : 'plain'}`;
}

function cellKey(world, object) {
  const geometry = object.geometry;
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const center = geometry.boundingBox.getCenter(new THREE.Vector3()).applyMatrix4(object.matrixWorld);
  return `${Math.floor(center.x / CELL_XZ)},${Math.floor(center.y / CELL_Y)},${Math.floor(center.z / CELL_XZ)}`;
}

/**
 * Merge every eligible static mesh that existed before the set pieces were
 * built. Doors are excluded because they animate, and transparent materials
 * are kept separate so their sorting stays stable.
 */
export function mergeStaticWorld(world, { dynamicRoots = [] } = {}) {
  const root = world.root;
  root.updateMatrixWorld(true);

  const protectedRoots = new Set(dynamicRoots.filter(Boolean));
  for (const door of Object.values(world.doors || {})) protectedRoots.add(door.group);
  const groups = new Map();
  let before = 0;

  root.traverse((object) => {
    if (!object.isMesh || object.isSkinnedMesh || object.isInstancedMesh) return;
    if (object.userData.isInteractionHitbox || object.userData.noMerge) return;
    if (object.name.startsWith('static_')) return;
    if (object.visible === false) return;
    if (Array.isArray(object.material)) return;
    const material = object.material;
    if (!material || material.visible === false) return;
    if (material.transparent || material.opacity < 1) return;
    if (object.geometry?.morphAttributes && Object.keys(object.geometry.morphAttributes).length) return;

    let parent = object;
    while (parent && parent !== root) {
      if (protectedRoots.has(parent) || parent.userData?.noMerge) return;
      parent = parent.parent;
    }

    // Only merge geometry with identical attribute layouts. Mixing indexed and
    // non-indexed buffers makes mergeGeometries bail out.
    const signature = geometrySignature(object.geometry);
    const key = `${material.uuid}|${cellKey(world, object)}|${signature}`;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = { material, entries: [] };
      groups.set(key, bucket);
    }
    bucket.entries.push(object);
    before += 1;
  });

  let mergedCount = 0;
  let removed = 0;

  for (const bucket of groups.values()) {
    if (bucket.entries.length < 2) continue;

    const geometries = [];
    let receiveShadow = false;
    for (const object of bucket.entries) {
      const geometry = object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      geometries.push(geometry);
      // Merged architectural geometry spans whole floors; letting one small
      // caster mark the entire batch as a shadow caster is far more expensive
      // than the shadows it adds. The flashlight shadow pass keeps doors and
      // characters only.
      receiveShadow = receiveShadow || object.receiveShadow;
    }

    const merged = mergeGeometries(geometries, false);
    for (const geometry of geometries) geometry.dispose();
    if (!merged) continue;

    merged.computeBoundingSphere();
    merged.computeBoundingBox();

    const mesh = new THREE.Mesh(merged, bucket.material);
    mesh.name = `static_${bucket.material.name || 'surface'}`;
    mesh.matrixAutoUpdate = false;
    mesh.castShadow = false;
    mesh.receiveShadow = receiveShadow;
    mesh.frustumCulled = true;
    mesh.userData.noMerge = true;
    root.add(mesh);

    for (const object of bucket.entries) {
      object.removeFromParent();
      removed += 1;
    }
    mergedCount += 1;
  }

  const stats = {
    before,
    removed,
    mergedMeshes: mergedCount,
    children: root.children.length,
  };
  if (world.mergeStats) {
    world.mergeStats.passes.push(stats);
    world.mergeStats.before += stats.before;
    world.mergeStats.removed += stats.removed;
    world.mergeStats.mergedMeshes += stats.mergedMeshes;
    world.mergeStats.children = root.children.length;
  } else {
    world.mergeStats = { ...stats, passes: [stats] };
  }
  return stats;
}
