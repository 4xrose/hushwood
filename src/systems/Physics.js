import RAPIER from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

let initialized = false;

export async function initRapier() {
  if (!initialized) {
    await RAPIER.init();
    initialized = true;
  }
  return RAPIER;
}

/**
 * Thin physics layer around Rapier. The player is a kinematic capsule moved by
 * Rapier's character controller; props and architecture are static cuboids.
 */
export class Physics {
  constructor() {
    this.RAPIER = RAPIER;
    this.world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
    this.world.timestep = 1 / 60;
    this.accumulator = 0;
    this.colliders = [];
    this.debug = null;
    this.character = null;
    this.characterBody = null;
    this.characterCollider = null;
  }

  addStaticBox(position, halfExtents, rotationY = 0, { tag = '' } = {}) {
    const bodyDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(position.x, position.y, position.z);
    if (rotationY) {
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rotationY);
      bodyDesc.setRotation({ x: q.x, y: q.y, z: q.z, w: q.w });
    }
    const body = this.world.createRigidBody(bodyDesc);
    const collider = this.world.createCollider(
      RAPIER.ColliderDesc.cuboid(
        Math.max(0.01, halfExtents.x),
        Math.max(0.01, halfExtents.y),
        Math.max(0.01, halfExtents.z),
      ),
      body,
    );
    collider.userData = { tag };
    this.colliders.push(collider);
    return collider;
  }

  removeCollider(collider) {
    if (!collider) return;
    try {
      this.world.removeCollider(collider, true);
    } catch {
      // Already removed by a prior transition.
    }
    const i = this.colliders.indexOf(collider);
    if (i >= 0) this.colliders.splice(i, 1);
  }

  createCharacter(position) {
    const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(position.x, position.y, position.z);
    this.characterBody = this.world.createRigidBody(bodyDesc);
    const shape = RAPIER.ColliderDesc.capsule(0.52, 0.33);
    this.characterCollider = this.world.createCollider(shape, this.characterBody);
    this.characterCollider.setFriction(0.1);
    this.character = this.world.createCharacterController(0.04);
    this.character.enableAutostep(0.34, 0.15, true);
    this.character.enableSnapToGround(0.35);
    this.character.setMaxSlopeClimbAngle((55 * Math.PI) / 180);
    this.character.setMinSlopeSlideAngle((38 * Math.PI) / 180);
    this.character.setApplyImpulsesToDynamicBodies(true);
    this.character.setCharacterMass(70);
    this.character.setSlideEnabled(true);
    return this.character;
  }

  moveCharacter(desiredTranslation) {
    if (!this.character) return { translation: { x: 0, y: 0, z: 0 }, grounded: false };
    this.character.computeColliderMovement(
      this.characterCollider,
      desiredTranslation,
      RAPIER.QueryFilterFlags.EXCLUDE_SENSORS,
    );
    const corrected = this.character.computedMovement();
    const t = this.characterBody.translation();
    this.characterBody.setNextKinematicTranslation({
      x: t.x + corrected.x,
      y: t.y + corrected.y,
      z: t.z + corrected.z,
    });
    return {
      translation: corrected,
      grounded: this.character.computedGrounded(),
    };
  }

  getCharacterTranslation() {
    return this.characterBody?.translation() ?? { x: 0, y: 0, z: 0 };
  }

  setCharacterTranslation(position) {
    if (!this.characterBody) return;
    this.characterBody.setTranslation(position, true);
    this.characterBody.setNextKinematicTranslation(position);
  }

  step(dt) {
    this.accumulator = Math.min(this.accumulator + dt, 0.1);
    let steps = 0;
    while (this.accumulator >= this.world.timestep && steps < 5) {
      this.world.step();
      this.accumulator -= this.world.timestep;
      steps++;
    }
  }

  dispose() {
    this.world.free();
  }
}
