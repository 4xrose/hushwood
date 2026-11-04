import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FLOOR_Y, ROOM_BY_ID } from './LevelData.js';
import { addBox, addCollider, damp, invisibleHitbox } from './WorldUtils.js';

const DOOR_LABELS = {
  front: 'the front doors',
  intake_reception: 'Reception door',
  reception_foyer: 'Reception arch',
  reception_day: 'Day Room door',
  day_foyer: 'Day Room door',
  day_treatment: 'Treatment door',
  foyer_archive: 'Archive arch',
  foyer_corridor: 'East Corridor door',
  corridor_dining: 'Dining door',
  dining_kitchen: 'Kitchen door',
  kitchen_corridor: 'Kitchen door',
  kitchen_records: 'Records door',
  archive_office: 'Matron’s office door',
  office_records: 'Office door',
  ward_hall: 'Ward door',
  observation_hall: 'Observation door',
  quarters_hall: 'Quarters door',
  hall_balcony: 'Hall arch',
  ward_observation: 'Interconnecting door',
  landing_workshop: 'Workshop door',
  landing_generator: 'Generator door',
  landing_cellar: 'Cellar arch',
  cellar_workshop: 'Workshop door',
  cellar_generator: 'Generator door',
  cellar_laundry: 'Laundry door',
  cellar_boiler: 'Boiler door',
};

export class Door {
  constructor(world, def) {
    this.world = world;
    this.def = def;
    this.id = def.id;
    this.label = DOOR_LABELS[def.id] || 'door';
    this.isOpen = false;
    this.angle = 0;
    this.targetAngle = 0;
    this.collider = null;
    this.leaves = [];
    this.removedCollider = false;
    this.hitboxes = [];

    const firstRoom = ROOM_BY_ID[def.rooms[0]];
    this.baseY = FLOOR_Y[firstRoom?.floor || 'ground'];
    this.height = def.kind === 'double' ? 2.4 : 2.14;
    this.thickness = 0.075;
    this.axis = def.axis;
    this.hand = def.axis === 'x' ? 1 : 1;

    this.group = new THREE.Group();
    world.root.add(this.group);

    this.buildLeaves();
    this.buildCollider();
    this.registerInteraction();

    if (def.initialOpen) this.setOpen(true, { instant: true, silent: true });
  }

  buildLeaves() {
    const { width } = this.def;
    const isDouble = this.def.kind === 'double';
    const leafWidth = isDouble ? width / 2 : width;
    const material = this.def.kind === 'metal'
      ? this.world.materials.oldBrass
      : this.def.id === 'front'
        ? this.world.materials.darkWood
        : this.world.materials.doorWood;

    if (isDouble) {
      this.addLeaf(leafWidth, material, this.def.center - width / 2, this.def.at, 0, 1);
      this.addLeaf(leafWidth, material, this.def.center + width / 2, this.def.at, Math.PI, -1);
    } else {
      const baseRot = this.axis === 'x' ? -Math.PI / 2 : 0;
      const offset = this.axis === 'x' ? -width / 2 : -width / 2;
      const hingeX = this.axis === 'x' ? this.def.at : this.def.center + offset;
      const hingeZ = this.axis === 'x' ? this.def.center + offset : this.def.at;
      this.addLeaf(leafWidth, material, hingeX, hingeZ, baseRot, 1);
    }
  }

  addLeaf(leafWidth, material, hingeX, hingeZ, baseRot, direction) {
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, this.baseY, hingeZ);
    pivot.rotation.y = baseRot;
    this.group.add(pivot);

    const panel = new THREE.Group();
    pivot.add(panel);

    const parts = [];
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(leafWidth, this.height, this.thickness),
      material,
    );
    mesh.position.set(direction * leafWidth / 2, this.height / 2, 0);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parts.push(mesh);

    const insetMat = this.def.kind === 'metal' ? this.world.materials.iron : this.world.materials.trim;
    for (const y of [this.height * 0.32, this.height * 0.7]) {
      const inset = new THREE.Mesh(
        new THREE.BoxGeometry(leafWidth * 0.66, this.height * 0.23, 0.012),
        insetMat,
      );
      inset.position.set(direction * leafWidth / 2, y, this.thickness / 2 + 0.007);
      parts.push(inset);
    }
    const knob = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 8),
      this.world.materials.brass,
    );
    knob.position.set(direction * (leafWidth - 0.12), 0.98, this.thickness / 2 + 0.018);
    parts.push(knob);
    const rose = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.055, 0.014, 12),
      this.world.materials.brass,
    );
    rose.rotation.x = Math.PI / 2;
    rose.position.set(direction * (leafWidth - 0.12), 0.98, this.thickness / 2 + 0.006);
    parts.push(rose);

    if (this.def.id === 'front') {
      const bar = new THREE.Mesh(
        new THREE.BoxGeometry(leafWidth * 0.7, 0.045, 0.055),
        this.world.materials.brass,
      );
      bar.position.set(direction * leafWidth / 2, 0.78, this.thickness / 2 + 0.035);
      parts.push(bar);
      const glass = new THREE.Mesh(
        new THREE.PlaneGeometry(leafWidth * 0.52, this.height * 0.32),
        this.world.materials.darkGlass,
      );
      glass.position.set(direction * leafWidth / 2, this.height * 0.66, this.thickness / 2 + 0.041);
      parts.push(glass);
    }

    // Bake the decorative parts together per material. A door leaf is a single
    // animated pivot, so merging its trim/brass pieces cuts draw calls without
    // changing how it opens.
    const groups = new Map();
    for (const part of parts) {
      const key = part.material.uuid;
      let bucket = groups.get(key);
      if (!bucket) {
        bucket = { material: part.material, parts: [] };
        groups.set(key, bucket);
      }
      bucket.parts.push(part);
    }
    for (const bucket of groups.values()) {
      if (bucket.parts.length === 1) {
        panel.add(bucket.parts[0]);
        continue;
      }
      const geometries = bucket.parts.map((part) => {
        part.updateMatrix();
        return part.geometry.clone().applyMatrix4(part.matrix);
      });
      const merged = mergeGeometries(geometries, false);
      for (const geometry of geometries) geometry.dispose();
      if (!merged) {
        for (const part of bucket.parts) panel.add(part);
        continue;
      }
      const mergedMesh = new THREE.Mesh(merged, bucket.material);
      mergedMesh.castShadow = true;
      mergedMesh.receiveShadow = true;
      panel.add(mergedMesh);
    }

    this.leaves.push({
      pivot,
      baseRot,
      deltaRot: this.axis === 'x' ? -Math.PI / 2 : Math.PI / 2,
      direction,
    });
  }

  buildCollider() {
    const { axis, at, center, width } = this.def;
    const position = axis === 'x'
      ? { x: at, y: this.baseY + this.height / 2, z: center }
      : { x: center, y: this.baseY + this.height / 2, z: at };
    const half = axis === 'x'
      ? { x: 0.08, y: this.height / 2, z: width / 2 }
      : { x: width / 2, y: this.height / 2, z: 0.08 };
    this.collider = addCollider(this.world, position, half, 0, `door:${this.id}`);
    this.removedCollider = false;
  }

  registerInteraction() {
    const { axis, at, center, width } = this.def;
    const position = axis === 'x'
      ? { x: at, y: this.baseY + 1.1, z: center }
      : { x: center, y: this.baseY + 1.1, z: at };
    const size = axis === 'x'
      ? { x: 0.34, y: 2.2, z: width }
      : { x: width, y: 2.2, z: 0.34 };
    const entry = {
      id: `door_${this.id}`,
      type: 'door',
      doorId: this.id,
      label: this.label,
      getPrompt: () => {
        if (this.isOpen) return `Close ${this.label}`;
        if (this.isLocked()) return `${this.label} is locked`;
        return `Open ${this.label}`;
      },
    };
    const hit = this.world.makeHitbox(
      new THREE.Vector3(size.x, size.y, size.z),
      new THREE.Vector3(position.x, position.y, position.z),
      entry,
    );
    this.entry = entry;
    this.hitboxes.push(hit);
  }

  isLocked() {
    const flags = this.world.game.state.flags;
    if (this.def.locked === 'office') return !flags.officeUnlocked;
    if (this.def.locked === 'bell') return !flags.bellSolved;
    return false;
  }

  setOpen(open, { silent = false, instant = false } = {}) {
    if (this.isOpen === open) return;
    this.isOpen = open;
    const leaf = this.leaves[0];
    if (!leaf) return;
    this.targetAngle = open ? leaf.deltaRot : 0;
    if (instant) {
      this.angle = this.targetAngle;
      this.applyAngle();
    }
    if (open && this.collider && !this.removedCollider) {
      this.world.physics.removeCollider(this.collider);
      this.removedCollider = true;
    }
    if (!silent) {
      if (open) this.world.game.audio.play(this.def.kind === 'metal' ? 'door_scary' : 'door_open', { volume: 0.55 });
      else this.world.game.audio.play('door_close', { volume: 0.45 });
    }
  }

  toggle(options = {}) {
    this.setOpen(!this.isOpen, options);
  }

  applyAngle() {
    for (const leaf of this.leaves) {
      leaf.pivot.rotation.y = leaf.baseRot + (this.isOpen ? leaf.deltaRot * this.openCurve() : 0);
    }
  }

  openCurve() {
    // Ease-out overshoot-free curve.
    return this.angle / (this.leaves[0]?.deltaRot || 1);
  }

  update(dt) {
    if (this.leaves.length === 0) return;
    const target = this.isOpen ? this.leaves[0].deltaRot : 0;
    this.angle = damp(this.angle, target, 8.5, dt);
    if (Math.abs(this.angle - target) < 0.002) this.angle = target;
    for (const leaf of this.leaves) {
      leaf.pivot.rotation.y = leaf.baseRot + (this.angle / this.leaves[0].deltaRot) * leaf.deltaRot;
    }
    if (!this.isOpen && this.removedCollider && Math.abs(this.angle) < 0.01) {
      this.buildCollider();
    }
  }
}
