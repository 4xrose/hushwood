import * as THREE from 'three';
import { CharacterAnimator, GhostPose } from './Animator.js';
import { FLOOR_Y, NAV_BY_ID } from '../world/LevelData.js';

const tmp = new THREE.Vector3();
const tmp2 = new THREE.Vector3();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function horizontalDistance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function dampAngle(current, target, lambda, dt) {
  let delta = ((target - current + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (delta < -Math.PI) delta += Math.PI * 2;
  return current + delta * (1 - Math.exp(-lambda * dt));
}

export class BaseEnemy {
  constructor(game, { kind = 'matron', id, spawnNode, position, forwardOffset = 0 } = {}) {
    this.game = game;
    this.kind = kind;
    this.id = id;
    this.root = new THREE.Group();
    this.root.name = `enemy_${id}`;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.forwardOffset = forwardOffset;
    this.mode = 'idle';
    this.speed = 1.1;
    this.timer = 2;
    this.thinkTimer = 0;
    this.searchTimer = 0;
    this.attackCooldown = 0;
    this.stunTimer = 0;
    this.path = [];
    this.pathIndex = 0;
    this.lastKnown = new THREE.Vector3();
    this.lastHeard = -100;
    this.grace = 20;
    this.footstepTimer = 0;
    this.breathTimer = 2.5 + Math.random() * 4;
    this.animator = null;
    this.active = true;
    this.alertLevel = 0;
    this.isEnemy = true;
    this.attackRange = 1.25;
    this.visible = true;
    this.spawnNode = spawnNode || null;
    if (position) this.position.copy(position);
    else if (spawnNode && NAV_BY_ID[spawnNode]) this.position.fromArray(NAV_BY_ID[spawnNode].pos);
    this.root.position.copy(this.position);
    this.game.scene.add(this.root);
  }

  attachModel(group, clips) {
    this.root.add(group);
    this.model = group;
    this.animator = new CharacterAnimator(group, clips);
    this.pose = new GhostPose(group, this.kind);
    this.pose.animator = this.animator;
    this.playAnimation('Idle', { loop: true, fade: 0 });
  }

  playAnimation(name, options) {
    if (!this.animator) return false;
    return this.animator.play(name, options);
  }

  getLookTarget() {
    const player = this.game.player;
    if (!player || this.game.isFrozen()) return null;
    if (Math.abs(this.position.y - player.position.y) > 1.45) return null;
    const distance = horizontalDistance(this.position, player.position);
    if (distance > 16) return null;
    // While hidden she has to rely on breath and noise; she only looks straight
    // at a hiding place once she is already suspicious.
    if (player.hidden && this.alertLevel < 0.45 && this.mode !== 'chase') return null;
    return { x: player.position.x, y: player.position.y + 1.3, z: player.position.z };
  }

  updateGhostPose(dt) {
    if (!this.pose) return;
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    this.pose.update(dt, {
      speed,
      mode: this.mode,
      lookTarget: this.getLookTarget(),
      floorY: this.floorY(),
      alert: this.alertLevel,
      facing: this.yaw,
    });
    this.pose.groundModel(this.floorY(), dt);
  }

  syncLocomotion() {
    if (!this.animator) return;
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const name = this.animator.currentName;
    if (name === 'Walking' || name === 'Zombie_Walk') {
      this.animator.setTimeScale(clamp(speed / 1.02, 0.55, 1.55));
    } else if (name === 'Running' || name === 'Zombie_Run') {
      this.animator.setTimeScale(clamp(speed / 2.5, 0.8, 1.5));
    }
  }

  floorY() {
    return FLOOR_Y[this.game.world?.floorAt(this.position) ?? 'ground'] ?? 0;
  }

  setDestination(nodeId) {
    if (!nodeId) {
      this.path = [];
      return;
    }
    const start = this.game.world.nearestNavNode(this.position);
    if (!start) return;
    const path = this.game.world.findPath(start.id, nodeId, { allowOffice: false });
    if (!path.length) {
      this.path = [];
      return;
    }
    this.path = path.slice(1);
    this.pathIndex = 0;
    this.maybeOpenDoorForNextNode(start.id);
  }

  setDestinationPosition(position) {
    const node = this.game.world.nearestNavNode(position, this.game.world.floorAt(this.position));
    if (node) this.setDestination(node.id);
  }

  maybeOpenDoorForNextNode(fromId) {
    const next = this.path[this.pathIndex];
    if (!next) return;
    const edge = this.game.world.nav.edges.find((item) => (
      (item.a === fromId && item.b === next.id) || (item.b === fromId && item.a === next.id)
    ));
    if (edge?.door) {
      const door = this.game.world.doors[edge.door];
      if (door && !door.isOpen && !door.isLocked()) {
        this.game.world.enemyOpenDoor(edge.door);
        this.doorWait = 0.35;
      }
    }
  }

  followPath(dt, speed) {
    if (!this.path.length) return false;
    const target = this.path[this.pathIndex];
    if (!target) {
      this.path = [];
      return false;
    }
    if (this.doorWait > 0) {
      this.doorWait -= dt;
      return true;
    }
    tmp.set(target.pos[0] - this.position.x, 0, target.pos[2] - this.position.z);
    const distance = tmp.length();
    if (distance < 0.3) {
      const arrived = target.id;
      this.pathIndex++;
      if (this.pathIndex >= this.path.length) {
        this.path = [];
        this.onPathComplete?.(arrived);
        return false;
      }
      this.maybeOpenDoorForNextNode(arrived);
      return true;
    }
    tmp.normalize();
    const step = Math.min(distance, speed * dt);
    this.position.x += tmp.x * step;
    this.position.z += tmp.z * step;
    const targetY = target.pos[1];
    this.position.y = THREE.MathUtils.damp(this.position.y, targetY, 6.5, dt);
    this.velocity.set(tmp.x * speed, 0, tmp.z * speed);
    const desiredYaw = Math.atan2(tmp.x, tmp.z) + this.forwardOffset;
    this.yaw = dampAngle(this.yaw, desiredYaw, 7, dt);
    return true;
  }

  onPathComplete() {}

  faceToward(position, dt, rate = 5) {
    const dx = position.x - this.position.x;
    const dz = position.z - this.position.z;
    if (Math.hypot(dx, dz) < 0.05) return;
    const desired = Math.atan2(dx, dz) + this.forwardOffset;
    this.yaw = dampAngle(this.yaw, desired, rate, dt);
  }

  moveToward(target, dt, speed) {
    tmp.set(target.x - this.position.x, 0, target.z - this.position.z);
    const distance = tmp.length();
    if (distance < 0.001) return false;
    tmp.normalize();
    const step = Math.min(distance, speed * dt);
    this.position.x += tmp.x * step;
    this.position.z += tmp.z * step;
    this.velocity.set(tmp.x * speed, 0, tmp.z * speed);
    const desiredYaw = Math.atan2(tmp.x, tmp.z) + this.forwardOffset;
    this.yaw = dampAngle(this.yaw, desiredYaw, 7, dt);
    return true;
  }

  canDirectTo(target) {
    const world = this.game.world;
    const here = world.roomAt(this.position);
    const there = world.roomAt(target);
    return Boolean(here && there && here.id === there.id);
  }

  senseNearby(dt) {
    const player = this.game.player;
    if (!player || this.game.isFrozen()) return;
    if (player.hidden) {
      const distance = horizontalDistance(this.position, player.position);
      if (!player.holdingBreath && distance < 4.4 && Math.abs(this.position.y - player.position.y) < 1.6) {
        this.lastKnown.set(player.position.x, player.position.y, player.position.z);
        this.lastHeard = this.game.elapsed;
        this.alertLevel = Math.min(1, this.alertLevel + dt * 1.2);
        if (this.mode !== 'chase' && this.mode !== 'attack') this.beginInvestigate();
      }
      return;
    }
    const distance = horizontalDistance(this.position, player.position);
    const floorDiff = Math.abs(this.position.y - player.position.y);
    if (distance < 2.5 && floorDiff < 1.3) {
      this.lastKnown.copy(player.position);
      this.lastHeard = this.game.elapsed;
      this.alertLevel = 1;
      if (this.mode !== 'attack') this.beginChase();
    }
  }

  hearNoise(event) {
    if (!this.active || this.game.isFrozen()) return;
    if (this.grace > 0) return;
    const distance = Math.hypot(
      this.position.x - event.position.x,
      this.position.y - event.position.y,
      this.position.z - event.position.z,
    );
    if (distance > event.radius) return;
    if (this.mode === 'attack') return;
    this.lastKnown.copy(event.position);
    this.lastHeard = this.game.elapsed;
    this.alertLevel = Math.min(1, this.alertLevel + 0.45 + (event.radius - distance) / event.radius * 0.3);
    if (this.kind === 'matron') {
      if (event.type === 'sprint' || distance < 6.2 || event.radius > 12) this.beginChase();
      else this.beginInvestigate();
    }
  }

  beginChase() {
    if (this.mode === 'attack' || this.mode === 'stunned') return;
    if (this.mode !== 'chase') {
      this.mode = 'chase';
      this.thinkTimer = 0;
      this.alertLevel = 1;
      this.game.audio?.sting('soft');
      this.game.ui?.setTension?.(1);
      this.playAnimation(this.kind === 'matron' ? 'Running' : 'Zombie_Run', { loop: true, fade: 0.2 });
      this.repathTimer = 0;
    }
  }

  beginInvestigate() {
    if (this.mode === 'attack' || this.mode === 'stunned' || this.mode === 'chase') return;
    this.mode = 'investigate';
    this.timer = 0;
    this.repathTimer = 0;
    this.setDestinationPosition(this.lastKnown);
    this.playAnimation(this.kind === 'matron' ? 'Walking' : 'Zombie_Walk', { loop: true, fade: 0.25 });
    this.game.ui?.setTension?.(0.55);
  }

  beginSearch() {
    this.mode = 'search';
    this.searchTimer = 7 + Math.random() * 5;
    this.timer = 0;
    this.alertLevel = Math.max(0.35, this.alertLevel * 0.6);
    this.pickSearchSpot();
    this.playAnimation(this.kind === 'matron' ? 'Walking' : 'Zombie_Walk', { loop: true, fade: 0.3 });
    this.game.ui?.setTension?.(0.35);
  }

  pickSearchSpot() {
    const world = this.game.world;
    const current = world.nearestNavNode(this.position);
    if (!current) return;
    const candidates = [];
    const adjacency = world.nav.adjacency.get(current.id) || [];
    for (const edge of adjacency) {
      const node = NAV_BY_ID[edge.to];
      if (node) candidates.push(node);
    }
    if (!candidates.length) return;
    const node = candidates[Math.floor(Math.random() * candidates.length)];
    this.setDestination(node.id);
  }

  startAttack() {
    if (this.attackCooldown > 0 || this.mode === 'attack') return;
    this.mode = 'attack';
    this.timer = 1.5;
    this.attackCooldown = 2.4;
    this.didHit = false;
    this.velocity.set(0, 0, 0);
    this.playAnimation('Zombie_Scream', { loop: false, fade: 0.08, force: true });
    this.faceToward(this.game.player.position, 1, 20);
  }

  updateAttack(dt) {
    this.timer -= dt;
    if (!this.didHit && this.timer < 1.08) {
      this.didHit = true;
      const distance = this.position.distanceTo(this.game.player.position);
      if (distance < this.attackRange + 0.7 && !this.game.player.hidden) {
        this.game.onEnemyAttack(this);
      }
    }
    if (this.timer <= 0) {
      this.mode = 'stunned';
      this.stunTimer = 1.4 + Math.random();
      this.game.ui?.setTension?.(0.85);
      this.playAnimation('Terrified', { loop: true, fade: 0.2, timeScale: 1.1 });
    }
  }

  updateStun(dt) {
    this.stunTimer -= dt;
    this.velocity.set(0, 0, 0);
    if (this.stunTimer <= 0) {
      this.game.ui?.setTension?.(0.5);
      this.beginSearch();
    }
  }

  updateFootsteps(dt) {
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    if (speed < 0.15) return;
    this.footstepTimer -= dt;
    if (this.footstepTimer <= 0) {
      this.footstepTimer = this.mode === 'chase' ? 0.31 : 0.58;
      if (this.position.distanceTo(this.game.camera.position) < 22) {
        const surface = this.game.world?.roomAt(this.position, this.game.world.floorAt(this.position))?.floorMat;
        this.game.audio.footstep({
          position: this.position,
          intensity: this.mode === 'chase' ? 0.7 : 0.38,
          surface: surface === 'tile' ? 'tile' : surface === 'concrete' || surface === 'basement' ? 'concrete' : 'wood',
        });
      }
    }
  }

  updateBreathing(dt) {
    this.breathTimer -= dt;
    if (this.breathTimer > 0) return;
    this.breathTimer = 3 + Math.random() * 6;
    if (this.position.distanceTo(this.game.camera.position) > 14) return;
    this.game.audio.breath({
      position: this.position,
      intensity: this.mode === 'chase' ? 0.8 : 0.35,
      demon: this.kind === 'matron',
    });
  }

  update(dt) {
    if (!this.active) return;
    this.root.position.copy(this.position);
    this.root.rotation.y = this.yaw;
    this.animator?.update(dt);
    this.updateGhostPose(dt);
    this.syncLocomotion();
    this.updateFootsteps(dt);
    this.updateBreathing(dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
  }

  resetToSpawn() {
    if (this.spawnNode && NAV_BY_ID[this.spawnNode]) {
      this.position.fromArray(NAV_BY_ID[this.spawnNode].pos);
    }
    this.mode = 'idle';
    this.path = [];
    this.pathIndex = 0;
    this.alertLevel = 0;
    this.timer = 3;
    this.attackCooldown = 0;
    this.doorWait = 0;
    this.yaw = this.spawnYaw ?? 0;
    this.root.position.copy(this.position);
  }
}

export class Matron extends BaseEnemy {
  constructor(game, { spawnNode = 'ward', spawnGroup = 'upper' } = {}) {
    super(game, { kind: 'matron', id: 'matron', spawnNode, forwardOffset: 0 });
    this.spawnGroup = spawnGroup;
    this.name = 'The Matron';
    this.canOpenDoors = true;
    this.patrol = [];
    this.patrolIndex = 0;
    this.patrolWait = 0;
    this.grace = 24;
    this.thinkTimer = 0;
    this.repathTimer = 0;
    this.finalHunt = false;
    this.spawnYaw = Math.PI;
    this.searchCooldown = 0;
    this.observeCooldown = 14;
    this.observeTimer = 0;
    this.mode = 'idle';
    this.timer = 2.5;
    this.playAnimation('Idle', { loop: true, fade: 0 });
  }

  choosePatrol() {
    const world = this.game.world;
    const list = this.game.state.flags.powerOn ? world.getFullPatrol() : (this.spawnGroup === 'upper' ? world.getPatrolForFloor('upper') : world.getPatrolForFloor('ground'));
    this.patrol = list;
    this.patrolIndex = Math.max(0, list.indexOf(world.nearestNavNode(this.position)?.id));
    this.patrolWait = 1 + Math.random() * 2;
  }

  nextPatrolNode() {
    if (!this.patrol.length) this.choosePatrol();
    if (!this.patrol.length) return null;
    for (let i = 0; i < this.patrol.length; i++) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrol.length;
      const id = this.patrol[this.patrolIndex];
      const node = NAV_BY_ID[id];
      if (node) return node;
    }
    return null;
  }

  beginObserve() {
    this.mode = 'observe';
    this.observeTimer = 2.8 + Math.random() * 2.6;
    this.path = [];
    this.velocity.set(0, 0, 0);
    this.alertLevel = Math.max(this.alertLevel, 0.22);
    this.playAnimation('Look_Around', { loop: true, fade: 0.65, timeScale: 0.55 });
    // The small bell at her wrist, once, somewhere in the dark.
    this.game.audio?.play?.('bell_hand', { volume: 0.16, rate: 0.86 });
  }

  canObservePlayer() {
    const player = this.game.player;
    if (!player || player.hidden) return false;
    if (this.finalHunt || this.grace > 0) return false;
    const distance = horizontalDistance(this.position, player.position);
    if (distance < 3.4 || distance > 11) return false;
    if (Math.abs(this.position.y - player.position.y) > 1.4) return false;
    const here = this.game.world.roomAt(this.position);
    const there = this.game.world.roomAt(player.position);
    return Boolean(here && there && here.id === there.id);
  }

  update(dt) {
    if (!this.game.started || this.game.isFrozen()) {
      this.animator?.update(dt);
      return;
    }
    this.grace = Math.max(0, this.grace - dt);
    this.thinkTimer -= dt;
    this.repathTimer -= dt;
    this.timer -= dt;
    this.observeCooldown -= dt;
    this.senseNearby(dt);
    this.updateAttackIfNeeded(dt);
    switch (this.mode) {
      case 'idle': {
        this.velocity.set(0, 0, 0);
        if (!this.animator.currentName) this.playAnimation('Idle', { loop: true, fade: 0.2 });
        if (!this.animator?.currentName?.includes('Idle')) this.playAnimation('Idle', { loop: true, fade: 0.2 });
        if (this.timer <= 0 && this.grace < 21) {
          this.mode = 'patrol';
          this.choosePatrol();
          this.playAnimation('Walking', { loop: true, fade: 0.4 });
        }
        break;
      }
      case 'patrol': {
        if (this.grace > 0 && this.game.elapsed < 6) break;
        if (this.observeCooldown <= 0 && this.canObservePlayer()) {
          this.beginObserve();
          break;
        }
        if (this.timer <= 0) {
          this.timer = 0.6;
          if (!this.path.length) {
            const node = this.nextPatrolNode();
            if (node) this.setDestination(node.id);
          }
        }
        this.followPath(dt, 1.15);
        if (!this.path.length) {
          this.playAnimation('Idle', { loop: true, fade: 0.35 });
          if (this.timer <= 0) this.timer = 1.5;
        } else {
          this.playAnimation('Walking', { loop: true, fade: 0.3 });
        }
        break;
      }
      case 'observe': {
        this.velocity.set(0, 0, 0);
        const player = this.game.player;
        this.faceToward(player.position, dt, 1.5);
        const distance = horizontalDistance(this.position, player.position);
        const vertical = Math.abs(this.position.y - player.position.y);
        this.observeTimer -= dt;
        if (distance < 3.1 && vertical < 1.4 && !player.hidden) {
          this.beginChase();
          break;
        }
        if (player.hidden) {
          // The shape she was watching simply isn't there anymore. She waits a
          // beat, then continues her round.
          this.observeTimer = Math.min(this.observeTimer, 0.8);
        }
        if (this.observeTimer <= 0) {
          this.mode = 'patrol';
          this.observeCooldown = 22 + Math.random() * 16;
          this.timer = 0;
        }
        break;
      }
      case 'chase': {
        if (this.grace > 0) {
          this.mode = 'patrol';
          break;
        }
        if (this.repathTimer <= 0) {
          this.repathTimer = 0.55;
          this.setDestinationPosition(this.lastKnown);
        }
        const distance = horizontalDistance(this.position, this.game.player.position);
        const vertical = Math.abs(this.position.y - this.game.player.position.y);
        if (distance < this.attackRange && vertical < 1.4 && !this.game.player.hidden) {
          this.startAttack();
          break;
        }
        const chaseSpeed = this.finalHunt ? 3.15 : 2.75;
        if (vertical < 1.4 && distance < 5.2 && this.canDirectTo(this.lastKnown)) {
          this.moveToward(this.lastKnown, dt, chaseSpeed);
        } else {
          this.followPath(dt, chaseSpeed);
        }
        this.playAnimation('Running', { loop: true, fade: 0.25, timeScale: 1.05 });
        if (this.game.elapsed - this.lastHeard > 7.5 || (!this.path.length && distance > 5)) {
          if (!this.game.player.hidden || distance > 6) this.beginSearch();
        }
        if (this.game.elapsed - this.lastHeard > 1.2 && this.game.player.hidden) {
          // She cannot see the player. Sweep the last known place, then give up.
          this.beginSearch();
        }
        this.game.ui?.setTension?.(Math.max(0.75, 1 - distance / 18));
        break;
      }
      case 'investigate': {
        this.followPath(dt, 1.65);
        this.playAnimation('Walking', { loop: true, fade: 0.25 });
        if (!this.path.length) {
          this.faceToward(this.lastKnown, dt, 1.5);
          this.playAnimation('Look_Around', { loop: true, fade: 0.4 });
          this.timer -= dt;
          if (this.timer <= 0.05) this.timer = 0.05;
          if (this.elapsedInvestigate === undefined) this.elapsedInvestigate = 0;
          this.elapsedInvestigate += dt;
          if (this.elapsedInvestigate > 2.5) {
            this.elapsedInvestigate = 0;
            this.beginSearch();
          }
        } else {
          this.elapsedInvestigate = 0;
        }
        break;
      }
      case 'search': {
        this.searchTimer -= dt;
        this.followPath(dt, 1.35);
        if (this.path.length) {
          this.playAnimation('Walking', { loop: true, fade: 0.25 });
        } else {
          this.faceToward(this.lastKnown, dt, 1.2);
          this.playAnimation('Look_Around', { loop: true, fade: 0.35 });
          if (this.timer <= 0) {
            this.timer = 3.4;
            this.pickSearchSpot();
          }
        }
        if (this.searchTimer <= 0) {
          this.mode = 'patrol';
          this.choosePatrol();
          this.playAnimation('Walking', { loop: true, fade: 0.5 });
        }
        break;
      }
      case 'attack':
        this.updateAttack(dt);
        break;
      case 'stunned':
        this.updateStun(dt);
        break;
      default:
        break;
    }
    super.update(dt);
  }

  updateAttackIfNeeded(dt) {
    if (this.mode === 'attack' || this.mode === 'stunned') return;
    if (!this.game.player.hidden && this.attackCooldown <= 0) {
      const distance = horizontalDistance(this.position, this.game.player.position);
      const vertical = Math.abs(this.position.y - this.game.player.position.y);
      if (distance < this.attackRange && vertical < 1.4) {
        this.startAttack();
      }
    }
  }

  onPowerOn() {
    this.grace = 0;
    this.alertLevel = 0.6;
    this.lastKnown.copy(this.game.player.position);
    this.beginInvestigate();
    this.game.notify('Somewhere above, a door opens.', 'danger');
  }

  onBellSolved() {
    this.finalHunt = true;
    this.grace = 0;
    this.lastKnown.copy(this.game.player.position);
    this.beginChase();
  }

  hearNoise(event) {
    if (this.grace > 0) {
      this.lastKnown.copy(event.position);
      this.lastHeard = this.game.elapsed;
      return;
    }
    super.hearNoise(event);
  }
}

export class Sleepwalker extends BaseEnemy {
  constructor(game, { id, route = [], spawnNode = 'workshop', variant = 0 } = {}) {
    super(game, { kind: 'sleepwalker', id, spawnNode, forwardOffset: 0 });
    this.name = 'Sleepwalker';
    this.route = route;
    this.routeIndex = Math.max(0, route.indexOf(spawnNode));
    this.mode = 'patrol';
    this.grace = 0;
    this.patrolWait = 0;
    this.speed = 0.9;
    this.attackRange = 1.15;
    this.variant = variant;
    this.spawnYaw = Math.PI;
    this.lightMemory = 0;
    this.timer = 1 + Math.random() * 2;
    this.searchCooldown = 0;
    this.playAnimation('Zombie_Idle', { loop: true, fade: 0 });
    this.root.scale.setScalar(1.02 - variant * 0.04);
  }

  update(dt) {
    if (!this.game.started || this.game.isFrozen()) {
      this.animator?.update(dt);
      return;
    }
    this.timer -= dt;
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    const player = this.game.player;
    const onBasement = this.game.world.floorAt(this.position) === 'basement';
    const playerDistance = horizontalDistance(this.position, player.position);
    const vertical = Math.abs(this.position.y - player.position.y);
    const seesLight = player.flashlightOn
      && player.currentFloor === 'basement'
      && !player.hidden
      && playerDistance < 15
      && vertical < 2.2;

    if (this.mode === 'attack') {
      this.updateAttack(dt);
      super.update(dt);
      return;
    }
    if (this.mode === 'stunned') {
      this.updateStun(dt);
      super.update(dt);
      return;
    }

    if (seesLight) {
      this.lightMemory = 2.6;
      this.lastKnown.copy(player.position);
      if (this.mode !== 'chase') {
        this.mode = 'chase';
        this.repathTimer = 0;
        this.game.audio?.breath({ position: this.position, intensity: 0.5, demon: false });
        this.playAnimation('Zombie_Run', { loop: true, fade: 0.2 });
      }
    } else {
      this.lightMemory = Math.max(0, this.lightMemory - dt);
      if (this.mode === 'chase' && this.lightMemory <= 0) {
        this.mode = 'patrol';
        this.playAnimation('Zombie_Walk', { loop: true, fade: 0.4 });
      }
    }

    if (this.mode === 'chase' && onBasement) {
      this.repathTimer -= dt;
      if (this.repathTimer <= 0) {
        this.repathTimer = 0.7;
        this.setDestinationPosition(player.position);
      }
      if (playerDistance < 5.2 && vertical < 1.4 && this.canDirectTo(player.position)) {
        this.moveToward(player.position, dt, 1.2);
      } else {
        this.followPath(dt, 1.2);
      }
      if (playerDistance < this.attackRange && vertical < 1.3 && !player.hidden) {
        this.startAttack();
        super.update(dt);
        return;
      }
      this.playAnimation('Zombie_Run', { loop: true, fade: 0.2 });
    } else if (this.mode === 'investigate') {
      this.followPath(dt, 1.0);
      this.playAnimation('Zombie_Walk', { loop: true, fade: 0.3 });
      if (!this.path.length) {
        this.mode = 'patrol';
        this.timer = 1 + Math.random() * 2;
      }
    } else {
      this.mode = 'patrol';
      if (this.timer <= 0) {
        this.timer = 1.2;
        if (!this.path.length) {
          this.routeIndex = (this.routeIndex + 1) % this.route.length;
          const node = this.route[this.routeIndex];
          if (node) this.setDestination(node);
        }
      }
      if (this.path.length) {
        this.followPath(dt, 0.78);
        this.playAnimation('Zombie_Walk', { loop: true, fade: 0.4 });
      } else {
        this.velocity.set(0, 0, 0);
        this.playAnimation('Zombie_Idle', { loop: true, fade: 0.4 });
      }
    }

    // A sleepwalker close enough to hear breathing will turn toward it even in
    // the dark. Never let this override an attack or a stun.
    if ((this.mode === 'patrol' || this.mode === 'investigate')
      && !player.hidden && onBasement && playerDistance < 2.1 && vertical < 1.2) {
      this.mode = 'chase';
      this.lightMemory = Math.max(this.lightMemory, 1.5);
      this.lastKnown.copy(player.position);
    }

    super.update(dt);
  }

  startAttack() {
    super.startAttack();
    this.playAnimation('Zombie_Scream', { loop: false, fade: 0.05, force: true });
  }

  onEnemyAttack() {}

  updateStun(dt) {
    super.updateStun(dt);
    this.mode = 'patrol';
    this.stunTimer = 0;
    this.playAnimation('Zombie_Idle', { loop: true, fade: 0.4 });
  }

  resetToSpawn() {
    super.resetToSpawn();
    this.mode = 'patrol';
    this.timer = 1.5;
    this.playAnimation('Zombie_Idle', { loop: true, fade: 0.1 });
  }
}
