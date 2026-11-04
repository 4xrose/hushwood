import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { PROPS, FLOOR_Y } from './LevelData.js';
import { addCollider, baseUrl } from './WorldUtils.js';

const EXTRA_MODELS = ['crowbar_01'];

export async function loadPropModels(world, progress = () => {}) {
  const loader = new GLTFLoader();
  const slugs = [...new Set([...PROPS.map((p) => p.slug), ...EXTRA_MODELS])];
  let done = 0;
  await Promise.all(slugs.map(async (slug) => {
    try {
      const gltf = await loader.loadAsync(baseUrl(`assets/models/${slug}.glb`));
      const scene = gltf.scene;
      scene.traverse((child) => {
        if (!child.isMesh) return;
        child.castShadow = false;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        for (const material of materials) {
          if (!material) continue;
          material.envMapIntensity = 0.26;
          if (material.map) material.map.anisotropy = 8;
          if (material.normalMap) material.normalMap.anisotropy = 4;
          material.needsUpdate = true;
        }
      });
      world.models[slug] = scene;
    } catch (error) {
      console.warn(`Could not load prop ${slug}`, error);
    } finally {
      done++;
      progress(done / slugs.length);
    }
  }));
}

function createFallbackProp(world, def) {
  const material = world.materials.get(def.room === 'generator' ? 'basementWall' : 'darkWood');
  const group = new THREE.Group();
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, def.height || 0.7, 0.7), material);
  box.position.y = (def.height || 0.7) / 2;
  group.add(box);
  return group;
}

export function placeProps(world) {
  for (const def of PROPS) {
    const source = world.models[def.slug];
    const object = source ? source.clone(true) : createFallbackProp(world, def);
    const desiredHeight = def.height || 1;
    const initialBox = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    initialBox.getSize(size);
    const scale = size.y > 0.001 ? desiredHeight / size.y : 1;
    object.scale.setScalar(scale);
    object.rotation.y = def.rotY || 0;
    const floorY = FLOOR_Y[def.floor] ?? 0;
    const box = new THREE.Box3().setFromObject(object);
    const scaledSize = new THREE.Vector3();
    box.getSize(scaledSize);
    let bottomTarget;
    let centerTarget;
    if (def.anchor === 'center') {
      centerTarget = def.y ?? (floorY + (def.height || 1) / 2);
      bottomTarget = centerTarget - scaledSize.y / 2;
    } else {
      bottomTarget = def.y ?? floorY;
      centerTarget = bottomTarget + scaledSize.y / 2;
    }
    object.position.set(
      def.x - (box.min.x + box.max.x) / 2,
      bottomTarget - box.min.y,
      def.z - (box.min.z + box.max.z) / 2,
    );
    world.root.add(object);

    // Record the placed footprint before static merging detaches the original
    // meshes. The level validator and runtime audit use this instead of trying
    // to measure a merged prop's now-empty container.
    const placedBox = new THREE.Box3().setFromObject(object);
    const placedSize = new THREE.Vector3();
    placedBox.getSize(placedSize);
    def.placementBox = {
      min: placedBox.min.toArray(),
      max: placedBox.max.toArray(),
      size: placedSize.toArray(),
    };

    if (def.collider) {
      const finalBox = new THREE.Box3().setFromObject(object);
      const finalSize = new THREE.Vector3();
      finalBox.getSize(finalSize);
      const finalCenter = new THREE.Vector3();
      finalBox.getCenter(finalCenter);
      addCollider(world, finalCenter, {
        x: finalSize.x / 2, y: finalSize.y / 2, z: finalSize.z / 2,
      }, 0, `prop:${def.slug}`);
    }
    def.object3d = object;
  }
}

export function getPropBySlug(world, slug, index = 0) {
  const matches = PROPS.filter((p) => p.slug === slug);
  return matches[index]?.object3d || null;
}
