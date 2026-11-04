import * as THREE from 'three';
import { FLOOR_Y } from '../world/LevelData.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const damp = (current, target, lambda, dt) => THREE.MathUtils.damp(current, target, lambda, dt);

export class Player {
  constructor(game) {
    this.game = game;
    this.physics = game.physics;
    this.camera = game.camera;
    this.state = game.state;
    this.audio = game.audio;

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.crouched = false;
    this.hidden = false;
    this.currentHide = null;
    this.enterPosition = null;
    this.holdingBreath = false;
    this.breath = 1;
    this.breathLock = 0;
    this.exhausted = false;
    this.eyeOffset = 0.72;
    this.walkCycle = 0;
    this.bobAmount = 0;
    this.stepTimer = 0;
    this.idleTimer = 0;
    this.battery = 72;
    this.flashlightOn = false;
    this.flashlight = null;
    this.lastSafe = new THREE.Vector3();
    this.lastSafeTime = 0;
    this.stamina = 1;
    this.sprinting = false;
    this.landed = false;
    this.verticalVelocity = 0;
    this.footstepSide = 1;
    this.breathTimer = 0;
    this.flashlightFlicker = 1;
    this.frozen = false;

    this.setupFlashlight();
  }

  setupFlashlight() {
    const spot = new THREE.SpotLight(0xffe1bb, 0, 22, 0.36, 0.65, 1.25);
    spot.position.set(0, 0, 0.1);
    spot.castShadow = this.game.quality === 'high';
    spot.shadow.mapSize.set(1024, 1024);
    spot.shadow.camera.near = 0.3;
    spot.shadow.camera.far = 20;
    spot.shadow.bias = -0.0006;
    spot.shadow.normalBias = 0.018;
    this.camera.add(spot);
    this.camera.add(spot.target);
    spot.target.position.set(0, 0, -4);
    this.flashlight = spot;

    // A soft halo in front of the lens keeps nearby geometry readable when
    // the spotlight cone is pointed at the floor.
    const halo = new THREE.PointLight(0xffd9ae, 0, 4.5, 1.8);
    halo.position.set(0.16, -0.1, -0.35);
    this.camera.add(halo);
    this.flashlightHalo = halo;

    this.flashlightBeam = new THREE.Mesh(
      new THREE.ConeGeometry(0.9, 3.5, 20, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0xffe2b8,
        transparent: true,
        opacity: 0.022,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
      }),
    );
    this.flashlightBeam.rotation.x = -Math.PI / 2;
    this.flashlightBeam.position.set(0, -0.02, -1.9);
    this.flashlightBeam.visible = false;
    this.camera.add(this.flashlightBeam);
  }

  get footY() {
    return this.position.y;
  }

  get isHoldingFlashlight() {
    return this.state.hasItem('flashlight');
  }

  spawnFromState({ fade = false } = {}) {
    const p = this.state.player;
    const point = this.state.checkpoint;
    const x = p?.x ?? point.x;
    const z = p?.z ?? point.z;
    const floor = p?.floor ?? point.floor ?? 'ground';
    const y = FLOOR_Y[floor] ?? 0;
    this.setPose(x, y, z, p?.yaw ?? point.yaw ?? 0, p?.pitch ?? 0);
    this.battery = p?.battery ?? 72;
    this.flashlightOn = Boolean(p?.flashlightOn && this.isHoldingFlashlight);
    this.setFlashlightVisual(this.flashlightOn);
    if (fade) this.game.ui?.flash(0.55);
  }

  setPose(x, y, z, yaw = 0, pitch = 0) {
    this.position.set(x, y, z);
    this.verticalVelocity = 0;
    this.velocity.set(0, 0, 0);
    this.yaw = yaw;
    this.pitch = clamp(pitch, -1.28, 1.28);
    this.updateCamera(0);
    if (this.physics.characterBody) {
      this.physics.setCharacterTranslation({ x, y: y + 0.85, z });
    }
    this.enterPosition = null;
    this.hidden = false;
    this.currentHide = null;
    this.setHiddenPhysics(false);
  }

  setHiddenPhysics(hidden) {
    try {
      this.physics.characterCollider?.setEnabled(!hidden);
    } catch {}
  }

  update(dt) {
    this.updateLook(dt);
    if (this.game.isFrozen()) {
      this.updateCamera(dt, true);
      return;
    }
    if (this.hidden) {
      this.updateHidden(dt);
      return;
    }

    const input = this.game.input;
    const move = input.getMoveAxis();
    const wantSprint = input.isDown('sprint') && move.magnitude > 0.1 && !this.crouched;
    const wantCrouch = input.isDown('crouch');
    this.crouched = wantCrouch && !this.hidden;
    this.sprinting = wantSprint && this.stamina > 0.04;
    if (this.sprinting && !this.crouched) {
      this.stamina = Math.max(0, this.stamina - dt * 0.105);
    } else {
      this.stamina = Math.min(1, this.stamina + dt * 0.16);
    }

    const speed = this.crouched ? 1.02 : this.sprinting ? 3.9 : 2.12;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const desired = new THREE.Vector3()
      .addScaledVector(forward, move.y)
      .addScaledVector(right, move.x);
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(speed * move.magnitude);

    const wasGrounded = this.grounded;
    this.verticalVelocity = Math.max(-18, this.verticalVelocity - dt * 20);
    const translation = {
      x: desired.x * dt,
      y: this.verticalVelocity * dt,
      z: desired.z * dt,
    };
    const result = this.physics.moveCharacter(translation);
    const t = this.physics.getCharacterTranslation();
    this.position.set(t.x, t.y - 0.85, t.z);
    this.grounded = result.grounded;
    if (this.grounded && this.verticalVelocity < 0) this.verticalVelocity = -0.6;

    if (this.grounded && !wasGrounded) {
      this.audio?.footstep({ intensity: 0.8, surface: this.currentSurface });
      this.game.shake(0.08);
    }

    if (this.position.y < -8) {
      this.game.respawn('You fall through the dark.');
      return;
    }

    const horizSpeed = Math.hypot(desired.x, desired.z);
    this.updateMovementNoise(dt, horizSpeed, move);
    this.updateBattery(dt);
    this.updateCamera(dt);

    const room = this.game.world?.roomAt(this.position, this.currentFloor);
    if (room) this.currentRoom = room.id;

    if (horizSpeed > 0.12 && this.grounded) {
      this.idleTimer = 0;
      this.walkCycle += dt * (this.sprinting ? 10.4 : this.crouched ? 5.2 : 7.2);
      const stepFrequency = this.sprinting ? 2.5 : this.crouched ? 1.2 : 1.8;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = 1 / stepFrequency;
        this.playFootstep(horizSpeed);
      }
    } else {
      this.idleTimer += dt;
      this.walkCycle += dt * 1.2;
      this.stepTimer = Math.min(this.stepTimer, 0.25);
    }
    this.updateBreathing(dt, horizSpeed);
  }

  updateLook(dt) {
    const look = this.game.input.consumeLook();
    const sensitivity = this.state.settings.sensitivity ?? 1;
    if (this.hidden) {
      // A hiding place is a cramped observation point, not a fixed camera.
      // Let the player turn all the way around and look up/down as far as the
      // opening allows, while keeping the eye behind the mattress/table edge.
      this.yaw -= look.x * 1.35 * sensitivity;
      const up = this.currentHide?.pitchUp ?? 0.78;
      const down = this.currentHide?.pitchDown ?? 0.95;
      this.pitch = clamp(this.pitch + look.y * 1.2 * sensitivity, -down, up);
      return;
    }
    this.yaw -= look.x * 1.35 * sensitivity;
    this.pitch = clamp(this.pitch + look.y * 1.2 * sensitivity, -1.28, 1.28);
  }

  updateMovementNoise(dt, horizSpeed, move) {
    if (!this.grounded) return;
    if (horizSpeed < 0.1) return;
    // Enemies sample this continuously; continuous footsteps also ring out on
    // their own, so a noisy player cannot stand still inside a chase forever.
    const base = this.sprinting ? 16 : this.crouched ? 2.6 : 8.5;
    this.noiseClock = (this.noiseClock || 0) + dt;
    if (this.noiseClock > 0.35) {
      this.noiseClock = 0;
      this.game.emitNoise(this.position, base, this.sprinting ? 'sprint' : this.crouched ? 'crouch' : 'walk');
    }
  }

  updateBattery(dt) {
    if (this.flashlightOn) {
      this.battery = Math.max(0, this.battery - dt * 0.055);
      if (this.battery <= 0) {
        this.flashlightOn = false;
        this.setFlashlightVisual(false);
        this.game.ui?.notify('The flashlight dies.', 'warning');
        this.game.audio.play('switch_click', { volume: 0.5 });
      }
    }
    const flicker = this.battery < 16 && this.flashlightOn ? (Math.random() < 0.07 ? 0.2 : 1) : 1;
    if (this.flashlight) {
      this.flashlightFlicker = damp(this.flashlightFlicker, flicker, 10, dt);
      this.flashlight.intensity = this.flashlightOn ? 58 * this.flashlightFlicker : 0;
      this.flashlightHalo.intensity = this.flashlightOn ? 3.2 * this.flashlightFlicker : 0;
      this.flashlightBeam.visible = this.flashlightOn;
      this.flashlightBeam.material.opacity = 0.018 * this.flashlightFlicker;
    }
  }

  updateCamera(dt, frozen = false) {
    const floorY = FLOOR_Y[this.currentFloor] ?? 0;
    const targetEye = this.hidden
      ? (this.currentHide?.eyeY ?? 1.05)
      : this.crouched ? 1.08 : 1.62;
    this.eyeOffset = damp(this.eyeOffset, targetEye, 10, dt);
    const speed = Math.hypot(this.velocity.x, this.velocity.z);
    const moving = !this.hidden && speed > 0.15 && !frozen;
    const bobTarget = moving ? (this.sprinting ? 0.042 : 0.022) : 0;
    this.bobAmount = damp(this.bobAmount, bobTarget, 6, dt);
    const reduced = this.state.settings.reducedMotion;
    const bobY = reduced ? 0 : Math.sin(this.walkCycle * 2) * this.bobAmount;
    const bobX = reduced ? 0 : Math.cos(this.walkCycle) * this.bobAmount * 0.35;
    const shake = this.game.cameraShake || 0;
    const shakeX = reduced ? 0 : (Math.random() - 0.5) * shake * 0.055;
    const shakeY = reduced ? 0 : (Math.random() - 0.5) * shake * 0.055;

    if (this.hidden) {
      this.camera.position.set(
        this.currentHide.x,
        floorY + this.eyeOffset,
        this.currentHide.z,
      );
    } else {
      this.camera.position.set(
        this.position.x + bobX,
        this.position.y + this.eyeOffset + bobY,
        this.position.z,
      );
    }
    this.camera.position.x += shakeX;
    this.camera.position.y += shakeY;
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  get cameraPosition() {
    return this.camera.position;
  }

  get currentFloor() {
    if (this.position.y > 6.0) return 'attic';
    if (this.position.y > 2.4) return 'upper';
    if (this.position.y < -1.9) return 'basement';
    return 'ground';
  }

  get currentSurface() {
    const room = this.game.world?.roomAt(this.position, this.currentFloor);
    const mat = room?.floorMat;
    if (mat === 'tile' || mat === 'whiteTile') return 'tile';
    if (mat === 'concrete') return 'concrete';
    if (mat === 'carpet') return 'carpet';
    return 'wood';
  }

  playFootstep(horizSpeed) {
    const intensity = this.crouched ? 0.18 : this.sprinting ? 0.85 : 0.42;
    this.footstepSide *= -1;
    this.audio.footstep({
      intensity,
      surface: this.currentSurface,
      player: true,
    });
    if (this.sprinting) this.game.shake(0.025);
  }

  updateBreathing(dt, speed) {
    const breathing = speed > 0.1 ? (this.sprinting ? 0.2 : 0.08) : 0.035;
    if (this.hidden) return;
    this.breathTimer -= dt;
    if (this.breathTimer <= 0) {
      this.breathTimer = this.sprinting ? 0.7 : 1.7 + Math.random();
      if (speed > 2.4) this.audio.breath({ intensity: 0.35 });
    }
    this.breath = Math.min(1, this.breath + breathing * dt);
  }

  updateHidden(dt) {
    const wantHold = this.game.input.isDown('breath');
    if (wantHold && this.breath > 0 && !this.breathLock) {
      this.holdingBreath = true;
      this.breath = Math.max(0, this.breath - dt * 0.115);
      if (this.breath <= 0) {
        this.breathLock = 1.2;
        this.holdingBreath = false;
        this.audio.breath({ intensity: 0.8 });
        this.game.ui?.notify('You gasp for air.', 'danger');
      }
    } else {
      this.holdingBreath = false;
      this.breath = Math.min(1, this.breath + dt * 0.26);
      this.breathLock = Math.max(0, this.breathLock - dt);
    }

    // Sway very slightly so the hiding camera does not feel welded in place.
    this.eyeOffset = damp(this.eyeOffset, this.currentHide?.eyeY ?? 1.05, 8, dt);
    this.updateCamera(dt);
    const floorY = FLOOR_Y[this.currentFloor] ?? 0;
    this.camera.position.set(this.currentHide.x, floorY + this.eyeOffset, this.currentHide.z);
    this.camera.position.y += Math.sin(performance.now() * 0.0012) * 0.004;
  }

  enterHide(spot) {
    if (this.hidden) return;
    this.hidden = true;
    this.enterPosition = {
      x: this.position.x,
      z: this.position.z,
      y: this.position.y,
      yaw: this.yaw,
      pitch: this.pitch,
    };
    this.currentHide = spot;
    this.yaw = spot.yaw ?? this.yaw;
    this.pitch = 0;
    this.holdingBreath = false;
    this.breath = Math.max(this.breath, 0.75);
    this.setHiddenPhysics(true);
    if (this.flashlightOn) this.toggleFlashlight(false, true);
    // Snap the eye height instead of damping from standing height. Damping
    // here would drag the camera down through the bed frame/table top.
    this.eyeOffset = spot.eyeY ?? 1.05;
    this.camera.position.set(spot.x, (FLOOR_Y[spot.floor] ?? 0) + this.eyeOffset, spot.z);
    this.audio.play('whoosh', { volume: 0.25 });
    this.game.emitNoise(new THREE.Vector3(spot.x, (FLOOR_Y[spot.floor] ?? 0), spot.z), 1.5, 'hide');
    this.updateCamera(0);
  }

  exitHide() {
    if (!this.hidden) return;
    const back = this.enterPosition;
    this.hidden = false;
    this.currentHide = null;
    this.setHiddenPhysics(false);
    // Return to standing/crouching eye height immediately; otherwise the
    // camera would rise out of the furniture over the next few frames.
    this.eyeOffset = this.crouched ? 1.08 : 1.62;
    if (back) {
      this.setPose(back.x, back.y, back.z, back.yaw, back.pitch);
    }
    this.game.ui?.flash(0.18);
    this.game.audio.play('whoosh', { volume: 0.18 });
  }

  toggleFlashlight(force, silent = false) {
    if (!this.isHoldingFlashlight) {
      if (!silent) this.game.ui?.notify('You have no light.', 'warning');
      return;
    }
    if (this.battery <= 0) {
      if (!silent) this.game.ui?.notify('The battery is dead.', 'warning');
      return;
    }
    this.flashlightOn = typeof force === 'boolean' ? force : !this.flashlightOn;
    this.setFlashlightVisual(this.flashlightOn);
    if (!silent) {
      this.audio.play('switch_click', { volume: 0.8 });
      this.game.shake(0.01);
    }
    this.state.setPlayer({
      flashlightOn: this.flashlightOn,
      battery: this.battery,
      composure: this.state.player.composure,
    });
  }

  setFlashlightVisual(on) {
    if (!this.flashlight) return;
    this.flashlight.intensity = 0;
    this.flashlightHalo.intensity = 0;
    this.flashlightBeam.visible = false;
    this.flashlightOn = on;
  }

  addBattery(amount = 35) {
    this.battery = clamp(this.battery + amount, 0, 100);
    this.state.setPlayer({ battery: this.battery });
    this.game.ui?.notify(`Battery +${amount}%`, 'good');
    this.audio.play('switch_click', { volume: 0.5 });
  }

  damage(amount = 1) {
    const composure = Math.max(0, (this.state.player.composure ?? 3) - amount);
    this.state.data.player.composure = composure;
    return composure;
  }

  refillComposure() {
    this.state.data.player.composure = 3;
    this.breath = 1;
    this.stamina = 1;
    this.state.save();
  }

  persist() {
    this.state.setPlayer({
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
      floor: this.currentFloor,
      yaw: this.yaw,
      pitch: this.pitch,
      battery: this.battery,
      composure: this.state.player.composure,
      flashlightOn: this.flashlightOn,
    });
  }

  updateFlashlightShadow(quality) {
    if (!this.flashlight) return;
    this.flashlight.castShadow = quality === 'high';
  }
}
