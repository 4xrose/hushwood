import { PATIENTS } from './Story.js';

export const SAVE_KEY = 'hushwood.save.v1';
export const SETTINGS_KEY = 'hushwood.settings.v1';

function isMobileDevice() {
  if (typeof navigator === 'undefined') return false;
  if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '')) return true;
  return typeof matchMedia === 'function'
    && matchMedia('(pointer: coarse)').matches
    && (navigator.maxTouchPoints || 0) > 0;
}

export const DEFAULT_SETTINGS = {
  sensitivity: 1,
  invertY: false,
  quality: 'high',
  grain: true,
  subtitles: true,
  masterVolume: 0.8,
  haptics: true,
  sprintToggle: false,
  reducedMotion: false,
  showTouch: 'auto',
};

export const DEFAULT_PLAYER = {
  x: -14.2,
  y: 0,
  z: 6.4,
  floor: 'ground',
  yaw: -Math.PI / 2,
  pitch: 0,
  battery: 72,
  composure: 3,
  flashlightOn: false,
};

export const DEFAULT_CHECKPOINT = {
  x: -14.2,
  y: 0,
  z: 6.4,
  floor: 'ground',
  yaw: -Math.PI / 2,
};

function makeBaseState() {
  return {
    version: 1,
    started: false,
    finished: false,
    playtime: 0,
    objective: '',
    flags: {
      introRead: false,
      basementDoorPried: false,
      cabinetPried: false,
      fuseInstalled: false,
      fuelPrimed: false,
      breakersSet: false,
      powerOn: false,
      consoleSolved: false,
      officeUnlocked: false,
      safeSolved: false,
      atticOpen: false,
      bellSolved: false,
      frontDoorOpen: false,
      chairScare: false,
      tubScare: false,
      mirrorScare: false,
      musicBoxScare: false,
      generatorScare: false,
      finalHunt: false,
    },
    items: {
      flashlight: false,
      crowbar: false,
      fuse: false,
      officeKey: false,
      wakingKey: false,
      bottles: 1,
    },
    picked: {},
    readNotes: [],
    clues: [],
    reels: [],
    charts: [false, false, false, false],
    consoleValues: ['I', 'II', 'III', 'REM'],
    mirror: ['/', '\\', '/', '\\'],
    visited: {},
    player: { ...DEFAULT_PLAYER },
    checkpoint: { ...DEFAULT_CHECKPOINT },
    settings: { ...DEFAULT_SETTINGS },
    ending: '',
  };
}

export function getObjective(state) {
  const f = state.flags;
  const items = state.items;
  const chartsRead = state.charts.filter(Boolean).length;
  if (!items.flashlight) {
    return {
      id: 'flashlight',
      act: 'I',
      title: 'A light in the dark',
      text: 'Search the Reception desk for a working flashlight.',
      hint: 'Reception is through the door on the east side of Intake. The desk faces the front of the building.',
    };
  }
  if (!items.crowbar) {
    return {
      id: 'crowbar',
      act: 'I',
      title: 'Something to pry with',
      text: 'Find the crowbar. The staff memo says it is kept by the day-room hearth.',
      hint: 'The Day Room is west of the foyer, or through the back of Reception. Check the fireplace.',
    };
  }
  if (!f.basementDoorPried) {
    return {
      id: 'archive',
      act: 'II',
      title: 'The warped hatch',
      text: 'Pry open the service hatch set into the Archive floor.',
      hint: 'The Archive is north of the Grand Foyer. Look for the brass-rimmed hatch between the shelves.',
    };
  }
  if (!f.powerOn) {
    if (!f.cabinetPried) {
      return {
        id: 'fuse',
        act: 'II',
        title: 'The fuse cabinet',
        text: 'Pry open the nailed fuse cabinet in the basement Workshop.',
        hint: 'Take the service stairs down. The Workshop is west of the landing. The cabinet is on its far wall.',
      };
    }
    if (!f.fuseInstalled) {
      return {
        id: 'install_fuse',
        act: 'II',
        title: 'A missing fuse',
        text: 'Install the ceramic fuse in the generator across the landing.',
        hint: 'The generator room is east of the service landing.',
      };
    }
    if (!f.fuelPrimed) {
      return {
        id: 'prime',
        act: 'II',
        title: 'Prime the line',
        text: 'Prime the generator fuel line and release inside the green band.',
        hint: 'Use the generator panel. Hold PRIME until the needle reaches 55–70 PSI, then release.',
      };
    }
    if (!f.breakersSet) {
      return {
        id: 'breakers',
        act: 'II',
        title: 'Wake the circuits',
        text: 'Throw the three breakers in service order.',
        hint: 'The service plate is beside the generator. THEATRE, then WARD, then BELL.',
      };
    }
    return {
      id: 'start_generator',
      act: 'II',
      title: 'Wake the house',
      text: 'Start the generator. Whatever hears it will come looking.',
      hint: 'Press START on the generator panel. After the lights come on, go back up to the Ward.',
    };
  }
  if (chartsRead < 4) {
    return {
      id: 'charts',
      act: 'III',
      title: 'Read the children',
      text: `Read all four patient charts in the Ward (${chartsRead}/4).`,
      hint: 'Go up the grand stairs, along the balcony, and through the Ward door. A chart hangs at the foot of each bed.',
    };
  }
  if (!f.consoleSolved) {
    return {
      id: 'console',
      act: 'III',
      title: 'The sleep console',
      text: 'Set the sleep console in Observation to match the four charts.',
      hint: 'Observation is north of the Ward, or through the upper hall. Each colored selector needs that patient’s sleep stage.',
    };
  }
  if (!f.officeUnlocked) {
    if (!items.officeKey) {
      return {
        id: 'office_key',
        act: 'IV',
        title: 'The brass drawer',
        text: 'Take the brass office key from the console drawer.',
        hint: 'The drawer is set into the observation console.',
      };
    }
    return {
      id: 'office',
      act: 'IV',
      title: 'The Matron’s office',
      text: 'Unlock the office door on the east side of the Archive.',
      hint: 'The office is on the ground floor, behind the Archive. Use the brass key.',
    };
  }
  if (!f.safeSolved) {
    return {
      id: 'safe',
      act: 'IV',
      title: 'Moonlight remembers',
      text: 'Open the mirror safe in the Matron’s office.',
      hint: 'Turn the four brass mirrors a quarter at a time. Guide the moonbeam into the moth sigil at the right edge.',
    };
  }
  if (!f.atticOpen) {
    if (!items.wakingKey) {
      return {
        id: 'waking_key',
        act: 'V',
        title: 'The Waking Key',
        text: 'Take the Waking Key from the mirror safe.',
        hint: 'The wall safe is in the Matron’s office. It opened when the mirrors caught the moonlight.',
      };
    }
    return {
      id: 'attic',
      act: 'V',
      title: 'The Waking Key',
      text: 'Unlock the attic hatch in Observation.',
      hint: 'Go back to Observation and look up. The hatch is in the middle of the ceiling. The Waking Key opens it.',
    };
  }
  if (!f.bellSolved) {
    return {
      id: 'bell',
      act: 'V',
      title: 'The Waking Chord',
      text: 'Ring the Waking Bell in the attic loft. Youngest first. Each note twice.',
      hint: 'The chord is A A C C E E G G. Pull the four ropes in that order. The chalkboard in Observation has the same protocol.',
    };
  }
  return {
    id: 'escape',
    act: 'VI',
    title: 'RUN.',
    text: 'The front door is open. Get out of Hushwood.',
    hint: 'Leave the loft, descend the grand stairs, and cross the foyer to the front doors. Do not stop.',
  };
}

export class GameState extends EventTarget {
  constructor() {
    super();
    this.data = makeBaseState();
    this.loadSettings();
    this.objective = getObjective(this);
  }

  get flags() { return this.data.flags; }
  get items() { return this.data.items; }
  get charts() { return this.data.charts; }
  get clues() { return this.data.clues; }
  get settings() { return this.data.settings; }
  get player() { return this.data.player; }
  get checkpoint() { return this.data.checkpoint; }
  get reels() { return this.data.reels; }
  get visited() { return this.data.visited; }
  get consoleValues() { return this.data.consoleValues; }
  get mirror() { return this.data.mirror; }

  reset({ keepSettings = true } = {}) {
    const settings = keepSettings ? { ...this.data.settings } : { ...DEFAULT_SETTINGS };
    this.data = makeBaseState();
    this.data.settings = settings;
    this.objective = getObjective(this);
    this.emit('reset');
    this.emitObjective();
  }

  emit(type = 'change', detail = {}) {
    this.dispatchEvent(new CustomEvent('change', { detail: { type, ...detail } }));
  }

  emitObjective(force = false) {
    const next = getObjective(this);
    const changed = force || next.id !== this.objective?.id;
    this.objective = next;
    this.data.objective = next.id;
    if (changed) {
      this.dispatchEvent(new CustomEvent('objective', { detail: next }));
      this.dispatchEvent(new CustomEvent('change', { detail: { type: 'objective', objective: next } }));
    }
    return next;
  }

  getObjective() {
    return getObjective(this);
  }

  getHint() {
    return getObjective(this).hint;
  }

  setFlag(name, value = true, { save = false, silent = false } = {}) {
    if (this.data.flags[name] === value) return;
    this.data.flags[name] = value;
    this.emitObjective();
    if (!silent) this.emit('flag', { name, value });
    if (save) this.save();
  }

  hasItem(name) {
    const value = this.data.items[name];
    if (typeof value === 'number') return value > 0;
    return Boolean(value);
  }

  addItem(name, amount = 1) {
    if (name === 'bottles') {
      this.data.items.bottles = Math.min(5, (this.data.items.bottles || 0) + amount);
    } else {
      this.data.items[name] = true;
    }
    this.emitObjective();
    this.emit('item', { name, amount });
    this.save();
  }

  removeItem(name, amount = 1) {
    if (name === 'bottles') {
      this.data.items.bottles = Math.max(0, (this.data.items.bottles || 0) - amount);
    } else {
      this.data.items[name] = false;
    }
    this.emitObjective();
    this.emit('item', { name, amount: -amount });
  }

  isPicked(id) {
    return Boolean(this.data.picked[id]);
  }

  markPicked(id) {
    this.data.picked[id] = true;
    this.emit('picked', { id });
    this.save();
  }

  readNote(id, clue = '') {
    if (!this.data.readNotes.includes(id)) this.data.readNotes.push(id);
    if (clue) this.addClue(clue);
    this.emit('note', { id });
  }

  addClue(text) {
    if (!this.data.clues.includes(text)) {
      this.data.clues.push(text);
      this.emit('clue', { text });
    }
  }

  readChart(index) {
    if (!PATIENTS[index]) return;
    this.data.charts[index] = true;
    const p = PATIENTS[index];
    this.addClue(`${p.colorName} bed — ${p.name}, age ${p.age}. Sleep stage ${p.stage}.`);
    this.emitObjective();
    this.emit('chart', { index, patient: p });
    this.save();
  }

  addReel(id) {
    if (!this.data.reels.includes(id)) {
      this.data.reels.push(id);
      this.emit('reel', { id });
    }
    this.readNote(id);
    this.save();
  }

  markVisited(roomId) {
    if (this.data.visited[roomId]) return;
    this.data.visited[roomId] = true;
    this.emit('visit', { roomId });
  }

  setCheckpoint(point, { heal = false } = {}) {
    this.data.checkpoint = {
      x: point.x,
      y: point.y ?? 0,
      z: point.z,
      floor: point.floor || 'ground',
      yaw: point.yaw ?? 0,
    };
    if (heal) this.data.player.composure = 3;
    this.save();
    this.emit('checkpoint', { checkpoint: this.data.checkpoint });
  }

  setPlayer(player) {
    this.data.player = { ...this.data.player, ...player };
  }

  saveSettings() {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.data.settings));
    } catch {}
    this.emit('settings', { settings: this.data.settings });
  }

  loadSettings() {
    let stored = false;
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        this.data.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
        stored = true;
      }
    } catch {}
    // Phones start at medium quality instead of stuttering through high on
    // their first launch. Once the player saves a settings change, respect it.
    if (!stored && isMobileDevice()) {
      this.data.settings.quality = 'medium';
      this.data.settings.grain = false;
    }
  }

  save() {
    try {
      this.data.savedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.dispatchEvent(new CustomEvent('save', { detail: { at: this.data.savedAt } }));
    } catch (error) {
      console.warn('Could not save Hushwood progress.', error);
    }
  }

  static hasSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      return Boolean(data && data.started);
    } catch {
      return false;
    }
  }

  load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data) return false;
      const base = makeBaseState();
      this.data = {
        ...base,
        ...data,
        flags: { ...base.flags, ...(data.flags || {}) },
        items: { ...base.items, ...(data.items || {}) },
        player: { ...base.player, ...(data.player || {}) },
        checkpoint: { ...base.checkpoint, ...(data.checkpoint || {}) },
        settings: { ...base.settings, ...(data.settings || {}) },
        picked: { ...(data.picked || {}) },
        visited: { ...(data.visited || {}) },
        charts: Array.isArray(data.charts) && data.charts.length === 4 ? data.charts : base.charts,
        consoleValues: Array.isArray(data.consoleValues) && data.consoleValues.length === 4 ? data.consoleValues : base.consoleValues,
        mirror: Array.isArray(data.mirror) && data.mirror.length === 4 ? data.mirror : base.mirror,
        clues: Array.isArray(data.clues) ? data.clues : [],
        readNotes: Array.isArray(data.readNotes) ? data.readNotes : [],
        reels: Array.isArray(data.reels) ? data.reels : [],
      };
      this.objective = getObjective(this);
      this.emit('loaded');
      this.emitObjective(true);
      return true;
    } catch (error) {
      console.warn('Could not load Hushwood save.', error);
      return false;
    }
  }

  clearSave() {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
  }

  hasProgress() {
    return this.data.started || Object.keys(this.data.picked).length > 0 || this.data.flags.powerOn;
  }

  updateSettings(partial) {
    this.data.settings = { ...this.data.settings, ...partial };
    this.saveSettings();
    this.save();
  }
}
