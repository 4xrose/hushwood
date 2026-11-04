import { prepareCharacterAssets, createCharacter } from './Animator.js';
import { Matron, Sleepwalker } from './Enemy.js';
import { FLOOR_Y } from '../world/LevelData.js';

export class Enemies {
  constructor(game) {
    this.game = game;
    this.matron = null;
    this.sleepwalkers = [];
    this.ready = false;
    this.lastTension = 0;
  }

  async load() {
    const { clips } = await prepareCharacterAssets();
    this.clips = clips;
    this.matron = new Matron(this.game, { spawnNode: 'ward' });
    this.matron.attachModel(createCharacter('matron'), clips);
    this.game.scene.add(this.matron.root);

    const routes = this.game.world.getSleepwalkerRoutes();
    const spawns = [
      { id: 'sleepwalker_a', spawnNode: 'workshop', route: routes[0], variant: 0 },
      { id: 'sleepwalker_b', spawnNode: 'generator', route: routes[1], variant: 1 },
      { id: 'sleepwalker_c', spawnNode: 'laundry', route: routes[2], variant: 2 },
    ];
    for (const spawn of spawns) {
      const enemy = new Sleepwalker(this.game, spawn);
      enemy.attachModel(createCharacter('sleepwalker'), clips);
      this.game.scene.add(enemy.root);
      this.sleepwalkers.push(enemy);
    }
    this.ready = true;
    this.applyState();
  }

  applyState() {
    if (!this.ready) return;
    if (this.game.state.flags.powerOn) this.onPowerOn({ silent: true });
    if (this.game.state.flags.bellSolved) this.onBellSolved({ silent: true });
  }

  onPowerOn({ silent = false } = {}) {
    if (!this.matron) return;
    this.matron.grace = 0;
    this.matron.alertLevel = 0.4;
    this.matron.lastKnown.copy(this.game.player.position);
    this.matron.beginInvestigate();
    if (!silent) this.game.notify('Something in the house has changed. It knows the lights are on.', 'danger');
  }

  onBellSolved({ silent = false } = {}) {
    if (!this.matron) return;
    this.matron.finalHunt = true;
    this.matron.grace = 0;
    this.matron.lastKnown.copy(this.game.player.position);
    this.matron.beginChase();
    this.game.state.setFlag('finalHunt', true);
    if (!silent) this.game.notify('RUN.', 'danger');
  }

  update(dt, time) {
    if (!this.ready) return;
    this.matron?.update(dt, time);
    for (const walker of this.sleepwalkers) walker.update(dt, time);
    const danger = this.computeDanger();
    this.game.ui?.setTension?.(danger);
    this.lastTension = danger;
  }

  computeDanger() {
    if (!this.matron) return 0;
    const player = this.game.player.position;
    let danger = 0;
    const matronDistance = this.matron.position.distanceTo(player);
    if (this.matron.mode === 'chase') danger = Math.max(danger, 0.82);
    else if (this.matron.mode === 'attack') danger = 1;
    else if (this.matron.mode === 'investigate' || this.matron.mode === 'search') danger = Math.max(danger, 0.4);
    danger = Math.max(danger, Math.max(0, 0.55 - matronDistance / 35));
    for (const walker of this.sleepwalkers) {
      if (walker.mode === 'chase') {
        const d = walker.position.distanceTo(player);
        danger = Math.max(danger, Math.max(0.55, 0.9 - d / 30));
      }
    }
    return Math.min(1, danger);
  }

  hearNoise(event) {
    if (!this.ready) return;
    this.matron?.hearNoise(event);
  }

  resetAfterCatch() {
    if (!this.ready) return;
    this.matron.grace = 12;
    this.matron.resetToSpawn();
    this.matron.mode = 'idle';
    this.matron.timer = 4;
    this.matron.attackCooldown = 0;
    this.matron.alertLevel = 0;
    this.matron.finalHunt = this.game.state.flags.bellSolved;
    for (const walker of this.sleepwalkers) walker.resetToSpawn();
  }

  dispose() {
    if (!this.ready) return;
    this.game.scene.remove(this.matron.root);
    for (const walker of this.sleepwalkers) this.game.scene.remove(walker.root);
  }
}
