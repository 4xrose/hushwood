import { Howl, Howler } from 'howler';

const base = import.meta.env.BASE_URL || '/';
const asset = (name) => `${base}assets/audio/${name}.mp3`;

const TRACKS = {
  ambience_horror: { file: 'ambience_horror', volume: 0.4, loop: true, preload: true },
  ambience_heartbeat: { file: 'ambience_heartbeat', volume: 0.2, loop: true },
  bell_hand: { file: 'bell_hand', volume: 0.55 },
  bell_church: { file: 'bell_church', volume: 0.75 },
  bell_low: { file: 'bell_low', volume: 0.6 },
  bell_loop: { file: 'bell_loop', volume: 0.35, loop: true },
  breath_strong: { file: 'breath_strong', volume: 0.35 },
  breath_child: { file: 'breath_child', volume: 0.3 },
  breath_demon: { file: 'breath_demon', volume: 0.35 },
  clock_tick: { file: 'clock_tick', volume: 0.4, loop: true },
  floor_creak: { file: 'floor_creak', volume: 0.6 },
  floor_creak_long: { file: 'floor_creak_long', volume: 0.55 },
  door_open: { file: 'door_open', volume: 0.55 },
  door_close: { file: 'door_close', volume: 0.5 },
  door_scary: { file: 'door_scary', volume: 0.7 },
  heartbeat_slow: { file: 'heartbeat_slow', volume: 0.4, loop: true, preload: true },
  heartbeat_fast: { file: 'heartbeat_fast', volume: 0.4, loop: true, preload: true },
  glass_break: { file: 'glass_break', volume: 0.6 },
  impact: { file: 'impact', volume: 0.7 },
  key_lock: { file: 'key_lock', volume: 0.55 },
  safe_lock: { file: 'safe_lock', volume: 0.6 },
  paper: { file: 'paper', volume: 0.5 },
  page: { file: 'page', volume: 0.45 },
  phone_ring: { file: 'phone_ring', volume: 0.5 },
  radio_static: { file: 'radio_static', volume: 0.4 },
  radio_creepy: { file: 'radio_creepy', volume: 0.5 },
  switch_click: { file: 'switch_click', volume: 0.55 },
  typewriter: { file: 'typewriter', volume: 0.45 },
  whoosh: { file: 'whoosh', volume: 0.5 },
  horror_transition: { file: 'horror_transition', volume: 0.75 },
  terror_sweep: { file: 'terror_sweep', volume: 0.6 },
  water_bubble: { file: 'water_bubble', volume: 0.35 },
  water_splash: { file: 'water_splash', volume: 0.5 },
  footsteps_tunnel: { file: 'footsteps_tunnel', volume: 0.3, loop: true },
  clock_chime: { file: 'clock_chime', volume: 0.5 },
};

export class AudioSystem {
  constructor(settings) {
    this.settings = settings;
    this.howls = {};
    this.loops = {};
    this.enabled = false;
    this.ctx = null;
    this.noiseBuffer = null;
    this.listener = null;
    this.heartSlow = null;
    this.heartFast = null;
    this.ambience = null;
    this.danger = 0;
    this.lullabyCooldown = 0;
    this.startedAmbience = false;
    this.muted = false;
    this.onSubtitle = null;
    this.recent = new Map();
  }

  preload(progress = () => {}) {
    const entries = Object.entries(TRACKS);
    let done = 0;
    return new Promise((resolve) => {
      let pending = entries.length;
      const finish = () => {
        done++;
        progress(done / entries.length);
        pending--;
        if (pending <= 0) resolve();
      };
      for (const [name, def] of entries) {
        const howl = new Howl({
          src: [asset(def.file)],
          volume: (def.volume ?? 0.5) * (this.settings.masterVolume ?? 0.8),
          loop: Boolean(def.loop),
          preload: Boolean(def.preload),
          html5: false,
          onload: finish,
          onloaderror: () => finish(),
        });
        this.howls[name] = howl;
      }
      setTimeout(resolve, 12000);
    });
  }

  unlock() {
    if (this.enabled) return;
    this.enabled = true;
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') Howler.ctx.resume();
      this.ctx = Howler.ctx;
      if (this.ctx) this.buildSynth();
    } catch (error) {
      console.warn('Audio could not unlock.', error);
    }
    this.startAmbience();
  }

  buildSynth() {
    const ctx = this.ctx;
    const length = Math.floor(ctx.sampleRate * 1.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = 0.97 * last + 0.03 * white;
      data[i] = last * 2.4 + white * 0.22;
    }
    this.noiseBuffer = buffer;
    this.master = ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(ctx.destination);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 22;
    comp.ratio.value = 4;
    comp.attack.value = 0.004;
    comp.release.value = 0.25;
    this.master.disconnect();
    this.master.connect(comp);
    comp.connect(ctx.destination);
    this.spatialMaster = ctx.createGain();
    this.spatialMaster.gain.value = 0.8;
    this.spatialMaster.connect(this.master);
  }

  setSettings(settings) {
    this.settings = settings;
    const vol = settings.masterVolume ?? 0.8;
    Howler.volume(this.muted ? 0 : vol);
    if (this.master) this.master.gain.value = this.muted ? 0 : 0.55 * Math.min(1.2, vol + 0.2);
  }

  setMuted(muted) {
    this.muted = muted;
    this.setSettings(this.settings);
  }

  get(name) {
    return this.howls[name];
  }

  makeSure(name) {
    const howl = this.howls[name];
    if (!howl) return null;
    if (howl.state() === 'unloaded') {
      try { howl.load(); } catch {}
    }
    return howl;
  }

  startAmbience() {
    if (!this.enabled || this.startedAmbience) return;
    this.startedAmbience = true;
    const ambience = this.makeSure('ambience_horror');
    if (ambience) {
      this.ambience = ambience.play();
      ambience.fade(0, 0.24 * (this.settings.masterVolume ?? 0.8), 3200, this.ambience);
      ambience.loop(true);
    }
    this.heartSlow = this.loopTrack('heartbeat_slow', 0);
    this.heartFast = this.loopTrack('heartbeat_fast', 0);
    this.clock = this.loopTrack('clock_tick', 0.05);
  }

  loopTrack(name, volume = 0.2) {
    const howl = this.makeSure(name);
    if (!howl) return null;
    const id = howl.play();
    howl.loop(true, id);
    howl.volume(volume, id);
    return id;
  }

  play(name, { volume = 1, rate = 1, loop = false } = {}) {
    if (!this.enabled) return null;
    const howl = this.makeSure(name);
    if (!howl) return null;
    const id = howl.play();
    const def = TRACKS[name] || {};
    howl.volume(Math.min(1.4, (def.volume ?? 0.6) * volume * (this.settings.masterVolume ?? 0.8)), id);
    howl.rate(rate, id);
    if (loop) howl.loop(true, id);
    return { howl, id };
  }

  stop(handle) {
    if (!handle) return;
    handle.howl.stop(handle.id);
  }

  stopName(name) {
    this.howls[name]?.stop();
  }

  updateListener(camera, playerPosition) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    this.listener = { position: playerPosition.clone(), camera };
    const fwd = { x: 0, y: 0, z: -1 };
    try {
      const v = camera.getWorldDirection({ x: 0, y: 0, z: -1 });
      fwd.x = v.x; fwd.y = v.y; fwd.z = v.z;
    } catch {}
    const up = camera.up;
    if (listener.positionX) {
      const now = this.ctx.currentTime;
      listener.positionX.setValueAtTime(camera.position.x, now);
      listener.positionY.setValueAtTime(camera.position.y, now);
      listener.positionZ.setValueAtTime(camera.position.z, now);
      listener.forwardX.setValueAtTime(fwd.x, now);
      listener.forwardY.setValueAtTime(fwd.y, now);
      listener.forwardZ.setValueAtTime(fwd.z, now);
      listener.upX.setValueAtTime(up.x, now);
      listener.upY.setValueAtTime(up.y, now);
      listener.upZ.setValueAtTime(up.z, now);
    } else {
      listener.setPosition(camera.position.x, camera.position.y, camera.position.z);
      listener.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
    }
  }

  update(dt, { danger = 0, hidden = false, breath = 1, power = false } = {}) {
    this.danger += (danger - this.danger) * Math.min(1, dt * 1.8);
    if (this.heartSlow !== null) {
      const slowVol = Math.min(0.5, this.danger * 0.38 + 0.02) * (this.settings.masterVolume ?? 0.8);
      this.howls.heartbeat_slow.volume(slowVol, this.heartSlow);
    }
    if (this.heartFast !== null) {
      const fastVol = Math.max(0, this.danger - 0.58) * 0.75 * (this.settings.masterVolume ?? 0.8);
      this.howls.heartbeat_fast.volume(fastVol, this.heartFast);
    }
    if (this.clock !== null && power) {
      this.howls.clock_tick.volume(0.022 * (this.settings.masterVolume ?? 0.8), this.clock);
    }
    if (this.lullabyCooldown > 0) this.lullabyCooldown -= dt;
  }

  _spatialChain(position, volume = 1) {
    if (!this.ctx || !this.noiseBuffer) return null;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    let tail = gain;
    if (position) {
      try {
        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1.5;
        panner.maxDistance = 22;
        panner.rolloffFactor = 1.3;
        if (panner.positionX) {
          panner.positionX.value = position.x;
          panner.positionY.value = position.y;
          panner.positionZ.value = position.z;
        } else {
          panner.setPosition(position.x, position.y, position.z);
        }
        gain.connect(panner);
        panner.connect(this.spatialMaster);
        tail = gain;
      } catch {
        gain.connect(this.master);
      }
    } else {
      gain.connect(this.master);
    }
    return { gain, tail };
  }

  footstep({ position = null, intensity = 0.5, surface = 'wood', player = false } = {}) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const branch = this._spatialChain(position, 0.24 * intensity * (this.settings.masterVolume ?? 0.8));
    if (!branch) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.85 + Math.random() * 0.35;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = surface === 'tile' || surface === 'concrete'
      ? 900 + Math.random() * 400
      : surface === 'carpet'
        ? 260 + Math.random() * 120
        : 420 + Math.random() * 260;
    filter.Q.value = 0.75;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.48, now + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.13 + Math.random() * 0.06);
    src.connect(filter);
    filter.connect(env);
    env.connect(branch.gain);
    src.start(now);
    src.stop(now + 0.24);

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(surface === 'wood' ? 84 : 68, now);
    thud.frequency.exponentialRampToValueAtTime(44, now + 0.11);
    thudGain.gain.setValueAtTime(0.12 * intensity, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
    thud.connect(thudGain);
    thudGain.connect(branch.gain);
    thud.start(now);
    thud.stop(now + 0.16);
  }

  breath({ position = null, intensity = 0.5, demon = false } = {}) {
    if (!this.enabled || !this.ctx || !this.noiseBuffer) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const branch = this._spatialChain(position, 0.18 * intensity * (this.settings.masterVolume ?? 0.8));
    if (!branch) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.playbackRate.value = 0.55 + Math.random() * 0.2;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = demon ? 300 : 700;
    filter.Q.value = 1.2;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.12);
    env.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);
    src.connect(filter);
    filter.connect(env);
    env.connect(branch.gain);
    src.start(now);
    src.stop(now + 0.6);
  }

  lullaby({ position = null, volume = 0.22 } = {}) {
    if (!this.enabled || !this.ctx || this.lullabyCooldown > 0) return;
    this.lullabyCooldown = 38;
    const ctx = this.ctx;
    const now = ctx.currentTime + 0.1;
    const notes = [
      [659.25, 0], [783.99, 0.42], [987.77, 0.84], [1318.5, 1.26],
      [1174.66, 1.9], [987.77, 2.32], [783.99, 2.74], [659.25, 3.16],
      [587.33, 3.8], [739.99, 4.22], [880, 4.64], [1174.66, 5.06],
    ];
    const out = ctx.createGain();
    out.gain.value = volume * (this.settings.masterVolume ?? 0.8);
    out.connect(this.master);
    const delay = ctx.createDelay(0.8);
    delay.delayTime.value = 0.27;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.4;
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(out);
    for (const [freq, delayTime] of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + delayTime;
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.85);
      osc.connect(gain);
      gain.connect(out);
      gain.connect(delay);
      osc.start(start);
      osc.stop(start + 0.9);
    }
  }

  sting(kind = 'soft') {
    if (!this.enabled) return;
    if (kind === 'soft') this.play('terror_sweep', { volume: 0.45 });
    else if (kind === 'loud') this.play('horror_transition', { volume: 0.8 });
    else if (kind === 'bell') this.play('bell_low', { volume: 0.7 });
  }

  stopAll() {
    for (const howl of Object.values(this.howls)) {
      try { howl.stop(); } catch {}
    }
    this.heartSlow = null;
    this.heartFast = null;
    this.ambience = null;
    this.clock = null;
    this.startedAmbience = false;
    this.enabled = false;
  }
}
