import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { initRapier, Physics } from '../systems/Physics.js';
import { GameState } from '../core/State.js';
import { Input } from '../core/Input.js';
import { AudioSystem } from '../core/Audio.js';
import { World } from '../world/World.js';
import { Player } from '../player/Player.js';
import { Enemies } from '../enemies/Enemies.js';
import { FLOOR_Y } from '../world/LevelData.js';
import { NOTES } from '../core/Story.js';
import { openHatchWorld, openFuseCabinet } from '../world/SetPieces.js';
import { updateLighting, updateLightBudget } from '../world/Lighting.js';
import { baseUrl } from '../world/WorldUtils.js';
import { UI } from '../ui/UI.js';
import { openGenerator, openConsole, openSafe, openBell } from '../ui/Puzzles.js';

const AUTOSTART_KEY = 'hushwood.autostart';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function nowSeconds() {
  return performance.now() * 0.001;
}

export class Game {
  constructor(canvas = document.getElementById('scene')) {
    this.canvas = canvas;
    this.state = new GameState();
    this.hasSave = GameState.hasSave();
    this.loadedSave = false;
    this.started = false;
    this.titleActive = true;
    this.ending = false;
    this.caught = false;
    this.uiModal = false;
    this.elapsed = 0;
    this.titleTime = 0;
    this.cameraShake = 0;
    this.autosaveTimer = 0;
    this.ambientTimer = 42 + Math.random() * 28;
    this.lastRoom = null;
    this.lastFrame = performance.now();
    this.interactable = null;
    this.frame = this.frame.bind(this);
    this.onResize = this.onResize.bind(this);

    this.quality = this.state.settings.quality || 'high';
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.quality !== 'low',
      powerPreference: 'high-performance',
      stencil: false,
    });
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.localClippingEnabled = true;
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(72, window.innerWidth / window.innerHeight, 0.045, 90);
    this.scene.add(this.camera);

    this.input = new Input(canvas, this.state.settings);
    this.audio = new AudioSystem(this.state.settings);

    const state = this.state;
    this.hasSave = GameState.hasSave();
    if (this.hasSave) {
      this.loadedSave = state.load();
      this.input.settings = state.settings;
      this.audio.setSettings(state.settings);
    }

    this.ui = new UI(this);
    this.ui.init();

    this.state.addEventListener('objective', (event) => {
      const objective = event.detail;
      if (!objective) return;
      if (this.started && !this.titleActive && !this.ending) {
        this.ui.objective(objective, { announce: true });
      }
    });

    this.applySettings();
    this.syncOrientation();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('orientationchange', this.onResize);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.started && !this.isFrozen()) this.pause();
    });
    canvas.addEventListener('pointerdown', () => {
      if (!this.started || this.isFrozen() || this.input.isTouch()) return;
      if (!this.input.pointerLocked) this.input.requestPointerLock();
    });

    window.__HUSHWOOD__ = this;
    window.HUSHWOOD = this;
  }

  pixelRatio() {
    const quality = this.state.settings.quality || 'high';
    if (quality === 'low') return Math.min(window.devicePixelRatio || 1, 1);
    if (quality === 'medium') return Math.min(window.devicePixelRatio || 1, 1.25);
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  async boot() {
    try {
      this.ui.bootProgress('Opening the clinic', 0.02);
      await initRapier();
      this.physics = new Physics();
      const spawn = this.state.player;
      this.physics.createCharacter({
        x: spawn.x ?? -14.2,
        y: (FLOOR_Y[spawn.floor || 'ground'] ?? 0) + 0.85,
        z: spawn.z ?? 6.4,
      });

      this.ui.bootProgress('Preparing the quiet cure', 0.06);
      this.world = new World(this);
      await this.world.load(({ stage, value }) => {
        this.ui.bootProgress(stage, 0.06 + value * 0.56);
      });

      this.player = new Player(this);
      this.player.spawnFromState();
      this.ui.updateTouchDisplay();

      this.ui.bootProgress('Waking the quiet ones', 0.66);
      this.enemies = new Enemies(this);
      await this.enemies.load();
      this.ui.bootProgress('The Matron is doing her rounds', 0.82);

      await Promise.all([
        this.loadEnvironment(),
        this.audio.preload((value) => {
          this.ui.bootProgress('Tuning the static', 0.84 + value * 0.13);
        }),
      ]);

      this.applySettings();
      this.ui.bootProgress('Ready', 1);
      this.ui.hideBoot();
      this.ui.showTitle({
        hasSave: this.loadedSave,
        canContinue: this.loadedSave && !this.state.data.finished,
      });
      this.titleActive = true;
      this.renderer.render(this.scene, this.camera);

      requestAnimationFrame(this.frame);

      const autostart = sessionStorage.getItem(AUTOSTART_KEY);
      sessionStorage.removeItem(AUTOSTART_KEY);
      if (autostart === 'new') {
        this.state.clearSave();
        this.newGame();
      } else if (autostart === 'continue' && this.loadedSave) {
        this.continueGame();
      }
    } catch (error) {
      console.error('HUSHWOOD failed to open.', error);
      this.fatal(error);
    }
  }

  async loadEnvironment() {
    if ((this.state.settings.quality || 'high') === 'low') return;
    try {
      const loader = new RGBELoader();
      const texture = await loader.loadAsync(baseUrl('assets/hdri/childrens_hospital_1k.hdr'));
      texture.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const envMap = pmrem.fromEquirectangular(texture).texture;
      this.scene.environment = envMap;
      if ('environmentIntensity' in this.scene) this.scene.environmentIntensity = 0.36;
      texture.dispose();
      pmrem.dispose();
    } catch (error) {
      console.warn('The HDRI would not load; using the built-in fallback reflections.', error);
    }
  }

  fatal(error) {
    const message = error?.message ? String(error.message) : 'Unknown error';
    this.ui?.bootError?.(`Hushwood could not open: ${message}`);
    const sub = document.querySelector('.boot-sub');
    if (sub) sub.textContent = 'The house is dark. Refresh to try again.';
  }

  applySettings() {
    const settings = this.state.settings;
    this.input.settings = settings;
    this.audio.setSettings(settings);
    const grain = document.getElementById('grain');
    if (grain) grain.style.display = settings.grain ? '' : 'none';
    document.body.classList.toggle('reduced-motion', Boolean(settings.reducedMotion));
    document.body.classList.toggle('no-touch', settings.showTouch === 'off');
    this.ui.updateTouchDisplay();
    this.quality = settings.quality || 'high';
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.shadowMap.enabled = this.quality === 'high';
    this.player?.updateFlashlightShadow?.(this.quality);
    if (this.world) {
      for (const item of this.world.roomLights) item.light.castShadow = false;
      updateLightBudget(this.world);
    }
    this.syncOrientation();
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.pixelRatio());
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.syncOrientation();
  }

  /* ------------------------------------------------------------- lifecycle */

  isFrozen() {
    return !this.started || this.titleActive || this.ending || this.caught || this.uiModal;
  }

  isPortraitBlocked() {
    return Boolean(this.input?.isTouch() && window.matchMedia('(orientation: portrait)').matches);
  }

  syncOrientation() {
    const blocked = this.isPortraitBlocked();
    document.body.classList.toggle('portrait-blocked', blocked);
    const overlay = document.getElementById('rotate-overlay');
    if (overlay) overlay.setAttribute('aria-hidden', blocked ? 'false' : 'true');
    if (blocked) this.input?.clear();
  }

  startPlay({ intro = false, resume = false } = {}) {
    this.titleActive = false;
    this.started = true;
    this.ending = false;
    this.caught = false;
    this.state.data.started = true;
    this.state.save();
    this.ui.hideTitle();
    this.ui.setHudVisible(true);
    this.ui.updateTouchDisplay();
    this.audio.unlock();
    this.applySettings();

    if (!resume) {
      this.player.spawnFromState();
    } else {
      this.player.persist();
    }
    this.player.setHiddenPhysics(false);
    this.input.setEnabled(true);
    this.input.clear();
    this.lastFrame = performance.now();
    this.lastRoom = this.world.roomAt(this.player.position, this.player.currentFloor)?.id ?? null;
    this.state.markVisited(this.world.roomAt(this.player.position, this.player.currentFloor)?.id || 'intake');
    this.ui.objective(this.state.getObjective(), { announce: false });
    this.ambientTimer = 42 + Math.random() * 28;
    this.autosaveTimer = 0;

    if (intro && !this.state.flags.introRead) {
      window.setTimeout(() => {
        this.ui.openIntro(() => {
          this.state.setFlag('introRead', true, { save: true });
          this.state.save();
          this.ui.notify('Find the flashlight on the reception desk.', 'info');
          this.ui.subtitle('The clock has stopped at 3:17. It is still ticking.', {
            whisper: true,
            duration: 5200,
          });
          if (!this.input.isTouch()) {
            window.setTimeout(() => {
              if (!this.ui.modalOpen && this.started) this.input.requestPointerLock();
            }, 180);
          }
        });
      }, 360);
    } else {
      if (!this.input.isTouch()) {
        window.setTimeout(() => {
          if (!this.ui.modalOpen && this.started) this.input.requestPointerLock();
        }, 180);
      }
      window.setTimeout(() => {
        if (!this.started) return;
        this.ui.subtitle('Listen. The house is awake.', {
          whisper: true,
          duration: 4600,
        });
      }, 700);
    }
    this.state.save();
  }

  newGame() {
    if (this.state.hasProgress() || this.loadedSave) {
      this.state.clearSave();
      try { sessionStorage.setItem(AUTOSTART_KEY, 'new'); } catch {}
      window.location.reload();
      return;
    }
    this.state.reset();
    this.state.data.started = true;
    this.input.settings = this.state.settings;
    this.audio.setSettings(this.state.settings);
    this.applySettings();
    this.startPlay({ intro: true, resume: false });
  }

  continueGame() {
    if (this.state.data.finished) {
      this.ui.notify('That story has already ended. Begin again.', 'warning');
      return;
    }
    if (!this.state.data.started) {
      this.ui.notify('There is no candle to return to yet.', 'warning');
      return;
    }
    this.startPlay({ intro: false, resume: true });
    this.ui.subtitle('You are still here. The house remembers.', {
      whisper: true,
      duration: 4200,
    });
  }

  returnToTitle() {
    if (this.started && !this.state.data.finished) {
      this.player?.persist?.();
      this.state.save();
    }
    this.titleActive = true;
    this.started = false;
    this.ending = false;
    this.caught = false;
    this.uiModal = false;
    this.input.setEnabled(false);
    this.ui.closeAll();
    this.ui.showTitle({
      hasSave: Boolean(this.loadedSave || this.state.hasProgress()),
      canContinue: Boolean((this.loadedSave || this.state.hasProgress()) && !this.state.data.finished),
    });
    this.ui.setTension(0);
    this.audio.update(0, { danger: 0 });
  }

  eraseAndReload() {
    this.state.clearSave();
    try { sessionStorage.setItem(AUTOSTART_KEY, 'new'); } catch {}
    window.location.reload();
  }

  pause() {
    if (!this.started || this.ending || this.caught || this.ui.modalOpen) return;
    this.player.persist();
    this.state.save();
    this.input.setEnabled(false);
    this.ui.openPause();
  }

  openCasebook(tab = 'notes') {
    if (!this.started || this.ending || this.caught) return;
    this.player.persist();
    this.state.save();
    this.input.setEnabled(false);
    this.ui.openCasebook(tab);
  }

  openMap() {
    if (!this.started || this.ending || this.caught) return;
    this.input.setEnabled(false);
    this.ui.openMap(this.player.currentFloor);
  }

  onUiModal(open) {
    this.uiModal = Boolean(open);
    if (!this.started || this.ending || this.caught) {
      this.input.setEnabled(false);
      return;
    }
    if (open) {
      this.input.setEnabled(false);
      this.player.persist();
      this.state.save();
    } else {
      this.input.setEnabled(true);
      if (!this.input.isTouch()) {
        window.setTimeout(() => {
          if (this.started && !this.ui.modalOpen && !this.ending && !this.caught) {
            this.input.requestPointerLock();
          }
        }, 100);
      }
    }
  }

  /* --------------------------------------------------------------- gameplay */

  frame(timestamp) {
    requestAnimationFrame(this.frame);
    const raw = (timestamp - this.lastFrame) / 1000;
    const dt = Number.isFinite(raw) ? clamp(raw, 0, 0.05) : 0.016;
    this.lastFrame = timestamp;
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  update(dt) {
    if (!this.world || !this.player) return;
    if (this.isPortraitBlocked()) {
      this.input.endFrame();
      return;
    }

    if (this.ui.modalOpen) {
      this.handleModalInput();
      this.input.endFrame();
      return;
    }

    if (this.titleActive || !this.started) {
      this.updateTitle(dt);
      this.handleTitleInput();
      this.input.endFrame();
      return;
    }

    if (this.ending || this.caught) {
      this.cameraShake = Math.max(0, this.cameraShake - dt * 2.5);
      this.input.endFrame();
      return;
    }

    const input = this.input;
    const pressed = {
      interact: input.consumePressed('interact'),
      flashlight: input.consumePressed('flashlight'),
      pause: input.consumePressed('pause'),
      casebook: input.consumePressed('casebook'),
      map: input.consumePressed('map'),
      sprint: input.consumePressed('sprint'),
    };

    if (pressed.pause) {
      this.pause();
      this.input.endFrame();
      return;
    }
    if (pressed.casebook) {
      this.openCasebook('notes');
      this.input.endFrame();
      return;
    }
    if (pressed.map) {
      this.openMap();
      this.input.endFrame();
      return;
    }
    if (pressed.flashlight && !this.player.hidden) {
      this.player.toggleFlashlight();
    }
    if (this.state.settings.sprintToggle && pressed.sprint && !input.isTouch()) {
      if (input.virtual.has('sprint')) input.virtual.delete('sprint');
      else input.virtual.add('sprint');
    }

    this.elapsed += dt;
    this.state.data.playtime = (this.state.data.playtime || 0) + dt;
    this.cameraShake = Math.max(0, this.cameraShake - dt * (2.2 + this.cameraShake * 1.6));

    this.physics.step(dt);
    this.player.update(dt);
    this.world.update(dt, this.elapsed);
    this.enemies.update(dt, this.elapsed);
    this.audio.updateListener(this.camera, this.player.position);
    this.audio.update(dt, {
      danger: this.enemies.lastTension,
      hidden: this.player.hidden,
      breath: this.player.breath,
      power: this.state.flags.powerOn,
    });

    this.updateInteractionPrompt();
    if (pressed.interact) {
      if (this.player.hidden) this.player.exitHide();
      else if (this.interactable) this.interact(this.interactable);
    }

    this.checkRoomScare();
    this.updateAmbience(dt);
    this.updateAutosave(dt);
    this.ui.updateHud();
    this.input.endFrame();
  }

  updateTitle(dt) {
    this.titleTime += dt;
    this.enemies?.update(dt, this.titleTime);
    if (this.world) updateLighting(this.world, dt, this.titleTime);
    this.player?.updateCamera(dt, true);
    this.audio.update(dt, { danger: 0 });
  }

  handleTitleInput() {
    const input = this.input;
    const pause = input.consumePressed('pause');
    if (pause && this.ui.modalOpen) {
      if (this.ui.activeModal?.options?.closable) this.ui.closeModal();
    }
  }

  handleModalInput() {
    const input = this.input;
    const pause = input.consumePressed('pause');
    const interact = input.consumePressed('interact');
    if (this.ui.activeModal?.options?.closable && (pause || (interact && this.ui.activeModal?.options?.allowInteractClose))) {
      this.ui.closeModal();
    }
  }

  updateInteractionPrompt() {
    if (this.player.hidden) {
      this.interactable = null;
      this.ui.setInteraction(null);
      return;
    }
    const entry = this.world.nearestInteractable(this.camera);
    this.interactable = entry;
    this.ui.setInteraction(entry);
  }

  interact(entry) {
    if (!entry || entry.enabled === false) return;
    const state = this.state;
    const world = this.world;

    switch (entry.type) {
      case 'door':
        this.useDoor(entry);
        break;

      case 'hatch': {
        if (!world.hatch?.open) {
          if (!state.hasItem('crowbar')) {
            this.ui.notify('The hatch is nailed shut. You need something to pry it.', 'warning');
            this.audio.play('key_lock', { volume: 0.5 });
            break;
          }
          openHatchWorld(world);
          state.setFlag('basementDoorPried', true, { save: true });
          state.save();
          this.audio.play('impact', { volume: 0.85 });
          this.audio.play('door_scary', { volume: 0.35 });
          this.ui.flash(0.22);
          this.shake(0.35);
          this.vibrate(45);
          this.ui.notify('The hatch shrieks open. Cold air climbs out.', 'good');
          this.ui.subtitle('Something below stops moving when the lid hits the floor.', {
            whisper: true,
            duration: 4800,
          });
          this.emitNoise(entry.position, 15, 'pry');
          this.player.persist();
          state.save();
        } else {
          world.teleportToBasement();
        }
        break;
      }

      case 'hatch_up':
        world.teleportToArchive();
        break;

      case 'fuse_cabinet': {
        if (!state.hasItem('crowbar')) {
          this.ui.notify('The cabinet is nailed shut. The crowbar would make short work of it.', 'warning');
          this.audio.play('key_lock', { volume: 0.5 });
          break;
        }
        openFuseCabinet(world);
        state.setFlag('cabinetPried', true, { save: true });
        state.save();
        this.audio.play('floor_creak_long', { volume: 0.55 });
        this.audio.play('impact', { volume: 0.5 });
        this.ui.flash(0.12);
        this.shake(0.25);
        this.ui.notify('The cabinet door hangs open. A ceramic fuse waits inside.', 'good');
        this.emitNoise(entry.position, 10, 'pry');
        break;
      }

      case 'pickup': {
        if (entry.enabled === false) return;
        entry.enabled = false;
        entry.onPickup?.();
        if (entry.item === 'battery') {
          this.player.addBattery(34);
        } else {
          state.addItem(entry.item);
          state.markPicked(entry.id);
          this.ui.notify(this.pickupMessage(entry.item), 'good');
          if (entry.item === 'crowbar') {
            state.addClue('The crowbar can open the Archive hatch and the nailed fuse cabinet.');
          } else if (entry.item === 'wakingKey') {
            state.addClue('The Waking Key opens the attic hatch above Observation.');
            this.ui.subtitle('The key is warm. It has been waiting in the dark.', {
              whisper: true,
              duration: 4200,
            });
          } else if (entry.item === 'flashlight') {
            this.ui.notify('Press F or tap LIGHT to switch it on.', 'info');
            this.ui.updateTouchDisplay();
          }
        }
        state.save();
        this.audio.play('switch_click', { volume: 0.72 });
        if (entry.item === 'crowbar') this.audio.play('impact', { volume: 0.2 });
        break;
      }

      case 'battery': {
        if (entry.enabled === false) return;
        entry.enabled = false;
        entry.onPickup?.();
        this.player.addBattery(34);
        state.markPicked(entry.id);
        state.save();
        break;
      }

      case 'note': {
        const note = NOTES[entry.noteId];
        state.readNote(entry.noteId, note?.clue || '');
        state.markPicked(entry.id);
        state.save();
        if (entry.glint) entry.glint.visible = false;
        this.ui.openNote(entry.noteId);
        break;
      }

      case 'chart': {
        state.readChart(entry.chartIndex);
        if (entry.glint) entry.glint.visible = false;
        this.ui.openChart(entry.chartIndex);
        if (state.charts.every(Boolean) && !state.flags.consoleSolved) {
          this.ui.subtitle('All four charts agree. The Observation console is waiting.', {
            whisper: true,
            duration: 5200,
          });
        }
        break;
      }

      case 'reel': {
        const id = entry.noteId;
        state.addReel(id);
        state.markPicked(entry.id);
        entry.enabled = false;
        entry.onPickup?.();
        this.audio.play('radio_static', { volume: 0.45 });
        this.ui.openNote(id);
        break;
      }

      case 'candle': {
        const def = entry;
        const checkpoint = def.checkpoint || { x: this.player.position.x, z: this.player.position.z, yaw: this.player.yaw };
        state.setCheckpoint({
          x: checkpoint.x,
          y: FLOOR_Y[def.floor] ?? 0,
          z: checkpoint.z,
          floor: def.floor,
          yaw: checkpoint.yaw ?? 0,
        });
        this.player.refillComposure();
        this.player.persist();
        state.save();
        this.audio.play('clock_chime', { volume: 0.32 });
        this.ui.flash(0.16, '#ffd7a0');
        this.ui.notify('Candlelight steadies you. Checkpoint kept.', 'good');
        break;
      }

      case 'hide':
        this.player.enterHide(entry.spot);
        this.ui.setInteraction(null);
        break;

      case 'console':
        openConsole(this.ui);
        break;

      case 'generator':
        openGenerator(this.ui);
        break;

      case 'safe':
        if (state.flags.safeSolved) {
          this.ui.notify('The safe is already open.', 'info');
        } else {
          openSafe(this.ui);
        }
        break;

      case 'attic': {
        if (state.flags.atticOpen) {
          world.teleportToAttic();
          break;
        }
        if (!state.hasItem('wakingKey')) {
          this.ui.notify('The hatch is locked. A brass keyhole glints beneath the dust.', 'warning');
          this.audio.play('key_lock', { volume: 0.55 });
          break;
        }
        state.removeItem('wakingKey');
        state.setFlag('atticOpen', true, { save: true });
        state.save();
        this.audio.play('key_lock', { volume: 0.9 });
        this.audio.play('door_scary', { volume: 0.35 });
        this.ui.flash(0.25);
        this.shake(0.25);
        this.emitNoise(entry.position, 10, 'door');
        world.teleportToAttic();
        this.ui.subtitle('Above you, the bell loft opens like a held breath.', {
          whisper: true,
          duration: 4600,
        });
        break;
      }

      case 'attic_down':
        world.teleportFromAttic();
        break;

      case 'bell':
        openBell(this.ui);
        break;

      default:
        this.ui.notify('Nothing happens.', 'info');
        break;
    }
  }

  pickupMessage(item) {
    return {
      flashlight: 'A heavy brass flashlight. The lens is still warm.',
      crowbar: 'A crowbar. Solid, cold, and exactly what the hatch needs.',
      fuse: 'A ceramic fuse, wrapped in oilcloth.',
      officeKey: 'A small brass key. The tag reads MATRON.',
      wakingKey: 'The Waking Key. It is heavier than it looks.',
    }[item] || 'You take it.';
  }

  useDoor(entry) {
    const door = this.world.doors[entry.doorId];
    if (!door) return;
    const state = this.state;

    if (entry.doorId === 'front' && state.flags.bellSolved) {
      this.showEnding();
      return;
    }

    if (door.isLocked()) {
      if (door.def.locked === 'office' && state.hasItem('officeKey')) {
        state.removeItem('officeKey');
        state.setFlag('officeUnlocked', true, { save: true });
        state.save();
        door.setOpen(true, { silent: true });
        this.audio.play('key_lock', { volume: 0.95 });
        this.audio.play('door_open', { volume: 0.5 });
        this.emitNoise(entry.position, 9, 'door');
        this.ui.notify('The brass key turns. The Matron’s office opens.', 'good');
        this.ui.subtitle('The room smells of camphor, dust, and something older.', {
          whisper: true,
          duration: 4200,
        });
        this.updateInteractionPrompt();
      } else if (door.def.locked === 'office') {
        this.ui.notify('Locked. The keyhole is brass. The console drawer might hold a key.', 'warning');
        this.audio.play('key_lock', { volume: 0.65 });
      } else {
        this.ui.notify('The front doors are held by the bell circuit. The bell is above, in the loft.', 'warning');
        this.audio.play('key_lock', { volume: 0.65 });
        this.ui.subtitle('THE HOUSE WILL NOT OPEN UNTIL THE BELL HAS SPOKEN.', {
          whisper: true,
          duration: 4400,
        });
      }
      return;
    }

    door.toggle();
    if (door.isOpen) {
      this.audio.play('door_open', { volume: 0.34 });
      this.emitNoise(entry.position, 7.5, 'door');
    }
    this.updateInteractionPrompt();
  }

  onBellSolved() {
    if (this.state.flags.frontDoorOpen) return;
    this.state.setFlag('bellSolved', true, { save: false });
    this.state.setFlag('frontDoorOpen', true, { save: true });
    this.state.save();
    for (const door of Object.values(this.world.doors)) {
      if (door.def.locked === 'bell') door.setOpen(true, { silent: true });
    }
    this.enemies?.onBellSolved?.();
    this.emitNoise(this.player.position, 70, 'bell');
    this.ui.subtitle('Every bell in Hushwood answers at once. The front doors release.', {
      danger: true,
      force: true,
      duration: 6200,
    });
    this.ui.objective(this.state.getObjective(), { announce: true });
    this.audio.play('door_scary', { volume: 0.55 });
    this.shake(0.45);
  }

  checkRoomScare() {
    const room = this.world.roomAt(this.player.position, this.player.currentFloor);
    if (!room || room.id === this.lastRoom) return;
    this.lastRoom = room.id;
    const flags = this.state.flags;
    if (room.id === 'treatment' && !flags.tubScare) {
      this.state.setFlag('tubScare', true);
      this.audio.play('water_splash', { volume: 0.4 });
      this.ui.subtitle('The hydrotherapy tub is full. It should not be full.', {
        whisper: true,
        duration: 4600,
      });
    } else if (room.id === 'office' && !flags.mirrorScare) {
      this.state.setFlag('mirrorScare', true);
      this.audio.play('whoosh', { volume: 0.35 });
      this.ui.flash(0.13);
      this.ui.subtitle('Your reflection in the covered mirror is a half-second late.', {
        whisper: true,
        danger: true,
        duration: 5000,
      });
    } else if (room.id === 'dining' && !flags.chairScare) {
      this.state.setFlag('chairScare', true);
      this.audio.play('floor_creak_long', { volume: 0.42 });
      this.ui.subtitle('A chair scrapes across the dining room. There is no one at the table.', {
        whisper: true,
        duration: 5000,
      });
    } else if (room.id === 'ward' && !flags.musicBoxScare) {
      this.state.setFlag('musicBoxScare', true);
      this.audio.lullaby({ volume: 0.12 });
      this.ui.subtitle('A music box turns over somewhere among the beds.', {
        whisper: true,
        duration: 5000,
      });
    } else if (room.id === 'generator' && !flags.generatorScare) {
      this.state.setFlag('generatorScare', true);
      this.audio.play('impact', { volume: 0.34 });
      this.shake(0.14);
      this.ui.subtitle('The generator is cold. Something inside it knocks back.', {
        whisper: true,
        duration: 4400,
      });
    }
  }

  updateAmbience(dt) {
    this.ambientTimer -= dt;
    if (this.ambientTimer > 0) return;
    this.ambientTimer = 38 + Math.random() * 52;
    if (this.enemies?.lastTension > 0.65) return;
    const roll = Math.random();
    if (roll < 0.5) {
      this.audio.play('floor_creak_long', { volume: 0.25 });
      if (Math.random() < 0.35) {
        this.ui.subtitle('The house settles around you.', { whisper: true, duration: 2600 });
      }
    } else if (roll < 0.76) {
      this.audio.play('clock_tick', { volume: 0.13 });
    } else {
      this.audio.play('whoosh', { volume: 0.18 });
    }
  }

  updateAutosave(dt) {
    this.autosaveTimer += dt;
    if (this.autosaveTimer < 22) return;
    this.autosaveTimer = 0;
    this.player.persist();
    this.state.save();
  }

  emitNoise(position, radius, type = 'noise') {
    if (!this.started || this.isFrozen()) return;
    const point = position?.isVector3
      ? position.clone()
      : new THREE.Vector3(position?.x || 0, position?.y || 0, position?.z || 0);
    this.enemies?.hearNoise({ position: point, radius, type, time: this.elapsed });
  }

  onEnemyAttack(enemy) {
    if (this.caught || this.ending || !this.started) return;
    const composure = this.player.damage(1);
    this.state.setPlayer({ composure });
    this.state.save();
    this.ui.hit();
    this.ui.flash({ opacity: 0.42, color: '#350605' });
    this.audio.play('impact', { volume: 0.75 });
    this.audio.sting('soft');
    this.shake(0.85);
    this.vibrate([55, 40, 110]);
    this.ui.setTension(1);
    const matron = enemy?.kind === 'matron';
    this.ui.subtitle(
      matron ? '“There you are. I heard you breathing.”' : 'A cold hand closes around your wrist.',
      {
        speaker: matron ? 'The Matron' : '',
        danger: true,
        force: true,
        duration: 3200,
      },
    );
    if (composure <= 0) this.triggerCatch(enemy);
  }

  triggerCatch(enemy) {
    if (this.caught) return;
    this.caught = true;
    this.input.setEnabled(false);
    this.player.persist();
    this.state.save();
    this.ui.catchFlash();
    this.ui.setTension(1);
    this.audio.play('horror_transition', { volume: 0.85 });
    this.audio.play('breath_demon', { volume: 0.65 });
    this.vibrate([90, 55, 180]);
    this.ui.subtitle(
      enemy?.kind === 'sleepwalker'
        ? 'You wake on the floor. Your mouth tastes of rust.'
        : '“Hush now. The cure is almost finished.”',
      { speaker: enemy?.kind === 'matron' ? 'The Matron' : '', danger: true, force: true, duration: 4200 },
    );
    window.setTimeout(() => this.respawnFromCatch('The Matron carried you back to the last candle.'), 1350);
  }

  respawnFromCatch(message) {
    const point = this.state.checkpoint;
    const floorY = FLOOR_Y[point.floor] ?? point.y ?? 0;
    this.player.setPose(point.x, floorY, point.z, point.yaw ?? 0, 0);
    this.player.refillComposure();
    this.state.setPlayer({
      x: point.x,
      y: floorY,
      z: point.z,
      floor: point.floor || 'ground',
      yaw: point.yaw ?? 0,
      pitch: 0,
      composure: 3,
    });
    this.enemies?.resetAfterCatch?.();
    this.state.save();
    this.ui.clearCatch();
    this.ui.flash(1, '#000');
    this.ui.clearCatch();
    window.setTimeout(() => {
      this.ui.flash(0, '#000');
      this.ui.notify(message, 'warning');
      this.ui.subtitle('The house has moved on. For now.', { whisper: true, duration: 3800 });
      this.caught = false;
      this.cameraShake = 0;
      this.ui.setTension(0);
      this.input.setEnabled(true);
      if (!this.input.isTouch()) this.input.requestPointerLock();
    }, 780);
  }

  respawn(message) {
    if (this.caught || this.ending) return;
    this.caught = true;
    this.input.setEnabled(false);
    this.player.persist();
    this.state.save();
    this.ui.flash(1, '#000');
    this.audio.play('horror_transition', { volume: 0.7 });
    window.setTimeout(() => {
      const point = this.state.checkpoint;
      const floorY = FLOOR_Y[point.floor] ?? point.y ?? 0;
      this.player.setPose(point.x, floorY, point.z, point.yaw ?? 0, 0);
      this.player.refillComposure();
      this.enemies?.resetAfterCatch?.();
      this.state.setPlayer({
        x: point.x,
        y: floorY,
        z: point.z,
        floor: point.floor || 'ground',
        yaw: point.yaw ?? 0,
        composure: 3,
      });
      this.state.save();
      this.ui.clearCatch();
      this.ui.notify(message, 'warning');
      this.ui.subtitle('You wake by the last candle you touched.', {
        whisper: true,
        duration: 3800,
      });
      this.ui.flash(0, '#000');
      this.caught = false;
      this.cameraShake = 0;
      this.input.setEnabled(true);
      if (!this.input.isTouch()) this.input.requestPointerLock();
    }, 720);
  }

  restartFromCheckpoint() {
    if (!this.started || this.ending) return;
    const point = this.state.checkpoint;
    const floorY = FLOOR_Y[point.floor] ?? point.y ?? 0;
    this.player.setPose(point.x, floorY, point.z, point.yaw ?? 0, 0);
    this.player.refillComposure();
    this.enemies?.resetAfterCatch?.();
    this.state.setPlayer({
      x: point.x,
      y: floorY,
      z: point.z,
      floor: point.floor || 'ground',
      yaw: point.yaw ?? 0,
      composure: 3,
    });
    this.state.save();
    this.ui.clearCatch();
    this.ui.flash(0.35);
    this.ui.notify('You return to the last candle.', 'info');
    this.lastRoom = null;
    this.input.setEnabled(true);
    if (!this.input.isTouch()) this.input.requestPointerLock();
  }

  setCheckpoint(point) {
    this.state.setCheckpoint(point);
  }

  notify(text, type = 'info') {
    this.ui.notify(text, type);
  }

  shake(strength = 0.2) {
    this.cameraShake = Math.max(this.cameraShake, clamp(strength, 0, 1.4));
  }

  vibrate(pattern) {
    if (!this.state.settings.haptics) return;
    try { navigator.vibrate?.(pattern); } catch {}
  }

  showEnding() {
    if (this.ending) return;
    this.ending = true;
    this.input.setEnabled(false);
    this.player.persist();
    this.state.data.finished = true;
    this.state.flags.frontDoorOpen = true;
    this.state.data.ending = this.state.reels.length >= 3 ? 'reels' : 'base';
    this.state.save();
    this.audio.play('door_scary', { volume: 0.55 });
    this.vibrate([30, 80, 120]);
    this.ui.flash(0.85, '#000');
    const stats = {
      playtime: this.state.data.playtime,
      rooms: Object.keys(this.state.data.visited || {}).length,
      documents: this.state.data.readNotes.length,
      reels: this.state.reels.length,
    };
    window.setTimeout(() => {
      this.ui.flash(0, '#000');
      this.ui.showEnding(this.state.data.ending, stats);
      this.state.save();
    }, 520);
  }

  /* ------------------------------------------------------------------ debug */

  debugTeleport(x, y, z, yaw = 0) {
    if (!this.player) return;
    this.player.setPose(Number(x), Number(y), Number(z), Number(yaw), 0);
    this.state.setPlayer({ x, y, z, floor: this.player.currentFloor, yaw });
  }

  debugGive(item) {
    this.state.addItem(item);
    if (item === 'flashlight') this.ui.updateTouchDisplay();
    return this.state.items;
  }

  debugSetFlag(name, value = true) {
    this.state.setFlag(name, value, { save: false });
    this.state.save();
    return this.state.flags;
  }

  debugGo(roomId) {
    const spots = {
      reception: { x: -7.0, y: 0, z: 4.5 },
      foyer: { x: 0, y: 0, z: 2.0 },
      archive: { x: 0, y: 0, z: -6.5 },
      office: { x: 6.8, y: 0, z: -9.3 },
      landing: { x: 0, y: -3.6, z: -3.0 },
      workshop: { x: -6.5, y: -3.6, z: -4.0 },
      generator: { x: 7.0, y: -3.6, z: -4.0 },
      ward: { x: -1.5, y: 3.4, z: -7.0 },
      observation: { x: -1.5, y: 3.4, z: -16.0 },
      quarters: { x: 6.5, y: 3.4, z: -16.0 },
      attic: { x: 0.2, y: 6.7, z: -14.4 },
    };
    const spot = spots[roomId];
    if (spot) this.debugTeleport(spot.x, spot.y, spot.z, 0);
    return Boolean(spot);
  }
}
