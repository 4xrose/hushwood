import { NOTES, PATIENTS, ENDINGS } from '../core/Story.js';
import { ROOMS, FLOOR_LABEL } from '../world/LevelData.js';
import { openGenerator, openConsole, openSafe, openBell } from './Puzzles.js';

const ICONS = {
  book: '<svg viewBox="0 0 24 24"><path d="M4 4h6a3 3 0 0 1 3 3v13a2.4 2.4 0 0 0-2.4-2.4H4Z"/><path d="M20 4h-4a3 3 0 0 0-3 3v13a2.4 2.4 0 0 1 2.4-2.4H20Z"/></svg>',
  map: '<svg viewBox="0 0 24 24"><path d="m3 6 5-2 8 2 5-2v14l-5 2-8-2-5 2Z"/><path d="M8 4v14M16 6v14"/></svg>',
  pause: '<svg viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>',
  close: '×',
  hand: '<svg viewBox="0 0 24 24"><path d="M9 12V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v7a6 6 0 0 1-6 6h-1a5 5 0 0 1-4-2l-3-4a1.6 1.6 0 0 1 2.5-2L9 13"/></svg>',
  sprint: '<svg viewBox="0 0 24 24"><path d="m4 17 6-5-6-5M12 17l6-5-6-5"/></svg>',
  crouch: '<svg viewBox="0 0 24 24"><path d="M6 4h5l-2 6h5l-2 5h4l-6 5"/><path d="M4 21h16"/></svg>',
  breath: '<svg viewBox="0 0 24 24"><path d="M12 21c-4 0-6-2.4-6-5.4 0-3.9 4.4-8.1 6-11 1.6 2.9 6 7.1 6 11 0 3-2 5.4-6 5.4Z"/></svg>',
  torch: '<svg viewBox="0 0 24 24"><path d="M9 3h6v4H9zM9.5 7 8 21h8L14.5 7"/><path d="M10 11h4"/></svg>',
  moth: '<svg viewBox="0 0 120 90" aria-hidden="true"><path d="M60 44C45 18 19 8 8 20c-9 10 8 31 38 34-25 5-37 21-29 29 10 10 32-6 43-25 11 19 33 35 43 25 8-8-4-24-29-29 30-3 47-24 38-34C101 8 75 18 60 44Z"/><path d="M60 42v35M58 32c-5-8-3-17 2-21 5 4 7 13 2 21Z"/></svg>',
};

const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

export class UI {
  constructor(game) {
    this.game = game;
    this.root = document.getElementById('ui');
    this.app = document.getElementById('app');
    this.hud = null;
    this.title = null;
    this.ending = null;
    this.backdrop = null;
    this.activeModal = null;
    this.modalOpen = false;
    this.cleanups = [];
    this.toastTimers = new Set();
    this.subtitleTimer = null;
    this.objectiveTimer = null;
    this.flashValue = 0;
    this.currentPrompt = null;
    this.currentInteractId = null;
    this.hintTimer = null;
    this._lastHud = {};
    this._modalToken = 0;
  }

  init() {
    this.root.innerHTML = '';
    this.buildHud();
    this.buildTouch();
    this.buildTitle();
    this.buildOverlays();
    this.bindTopActions();
    this.updateTouchDisplay();
    this.setHudVisible(false);
    return this;
  }

  /* ------------------------------------------------------------------ boot */

  bootProgress(stage, value = 0) {
    const sub = document.querySelector('.boot-sub');
    const line = document.querySelector('.boot-line span');
    if (sub && stage) sub.textContent = stage;
    if (line) line.style.width = `${Math.max(2, Math.min(100, value * 100))}%`;
  }

  bootError(message) {
    const inner = document.querySelector('.boot-inner');
    if (!inner) return;
    const el = document.createElement('p');
    el.className = 'boot-error';
    el.textContent = message;
    inner.appendChild(el);
  }

  hideBoot() {
    document.getElementById('boot')?.classList.add('done');
  }

  /* ------------------------------------------------------------------- HUD */

  buildHud() {
    this.root.insertAdjacentHTML('beforeend', `
      <div id="hud">
        <div class="hud-top">
          <div class="objective-card" id="objective-card">
            <div class="objective-act" id="objective-act">ACT I</div>
            <h2 class="objective-title" id="objective-title">A light in the dark</h2>
            <p class="objective-text" id="objective-text"></p>
            <p class="objective-hint" id="objective-hint"></p>
          </div>
          <div class="top-actions">
            <button class="icon-button" id="btn-casebook" title="Casebook (Tab)" aria-label="Open casebook">${ICONS.book}</button>
            <button class="icon-button" id="btn-map" title="Map (M)" aria-label="Open map">${ICONS.map}</button>
            <button class="icon-button" id="btn-pause" title="Pause (Esc)" aria-label="Pause">${ICONS.pause}</button>
          </div>
        </div>
        <div class="crosshair" id="crosshair"></div>
        <div class="interaction-prompt" id="interaction-prompt">
          <span class="key" id="interaction-key">E</span>
          <span class="text" id="interaction-text"></span>
        </div>
        <div class="subtitles" id="subtitles"></div>
        <div class="toast-stack" id="toast-stack"></div>
        <div class="hud-bottom">
          <div class="status-row">
            <span class="label">Battery</span>
            <span class="battery-track"><span class="battery-fill" id="battery-fill"></span></span>
            <span class="battery-status" id="battery-status">72%</span>
            <span class="flashlight-state" id="flashlight-state"><span class="dot"></span><span id="flashlight-label">OFF</span></span>
          </div>
          <div class="status-row">
            <span class="label">Composure</span>
            <span class="composure" id="composure">
              <span class="pip on"></span><span class="pip on"></span><span class="pip on"></span>
            </span>
            <span class="composure-note" id="composure-note">steady</span>
          </div>
          <div class="status-row">
            <span class="label">Objects</span>
            <span class="composure-note" id="object-count">nothing yet</span>
          </div>
        </div>
        <div class="hidden-state" id="hidden-state"></div>
        <div class="breath-meter" id="breath-meter">
          <div class="caption" id="breath-caption">HOLD YOUR BREATH — SPACE</div>
          <div class="breath-track"><div class="breath-fill" id="breath-fill"></div></div>
        </div>
        <div class="hide-exit-hint" id="hide-exit-hint">E — leave hiding place</div>
        <div class="objective-flash" id="objective-flash">
          <div class="act" id="flash-act"></div>
          <h2 class="title" id="flash-title"></h2>
          <div class="desc" id="flash-desc"></div>
        </div>
      </div>
    `);
    this.hud = document.getElementById('hud');
    this.el = {
      objectiveCard: document.getElementById('objective-card'),
      objectiveAct: document.getElementById('objective-act'),
      objectiveTitle: document.getElementById('objective-title'),
      objectiveText: document.getElementById('objective-text'),
      objectiveHint: document.getElementById('objective-hint'),
      crosshair: document.getElementById('crosshair'),
      prompt: document.getElementById('interaction-prompt'),
      promptKey: document.getElementById('interaction-key'),
      promptText: document.getElementById('interaction-text'),
      subtitles: document.getElementById('subtitles'),
      toasts: document.getElementById('toast-stack'),
      batteryFill: document.getElementById('battery-fill'),
      batteryStatus: document.getElementById('battery-status'),
      flashlightState: document.getElementById('flashlight-state'),
      flashlightLabel: document.getElementById('flashlight-label'),
      composure: document.getElementById('composure'),
      composureNote: document.getElementById('composure-note'),
      objectCount: document.getElementById('object-count'),
      hiddenState: document.getElementById('hidden-state'),
      breathMeter: document.getElementById('breath-meter'),
      breathFill: document.getElementById('breath-fill'),
      breathCaption: document.getElementById('breath-caption'),
      hideHint: document.getElementById('hide-exit-hint'),
      objectiveFlash: document.getElementById('objective-flash'),
      flashAct: document.getElementById('flash-act'),
      flashTitle: document.getElementById('flash-title'),
      flashDesc: document.getElementById('flash-desc'),
    };
  }

  buildTouch() {
    this.root.insertAdjacentHTML('beforeend', `
      <div id="touch-layer">
        <div id="look-zone" aria-hidden="true"></div>
        <div class="joystick" id="joystick">
          <div class="knob" id="joystick-knob"></div>
          <span class="joy-label">MOVE</span>
        </div>
        <div class="touch-actions" id="touch-actions">
          <button class="touch-button interact" id="touch-interact" data-action="interact" aria-label="Interact">${ICONS.hand}<span>Use</span></button>
          <button class="touch-button sprint" data-action="sprint" data-hold="true" aria-label="Sprint">${ICONS.sprint}<span>Run</span></button>
          <button class="touch-button crouch" data-action="crouch" data-hold="true" aria-label="Crouch">${ICONS.crouch}<span>Crouch</span></button>
          <button class="touch-button breath" id="touch-breath" data-action="breath" data-hold="true" aria-label="Hold breath">${ICONS.breath}<span>Breath</span></button>
          <button class="touch-button flashlight" id="touch-flashlight" data-action="flashlight" aria-label="Flashlight">${ICONS.torch}<span>Light</span></button>
          <button class="touch-button pause-touch" id="touch-pause" data-ui="pause" aria-label="Pause">${ICONS.pause}</button>
        </div>
      </div>
    `);
    this.touchLayer = document.getElementById('touch-layer');
    this.joystick = document.getElementById('joystick');
    this.knob = document.getElementById('joystick-knob');
    this.lookZone = document.getElementById('look-zone');
    this.touchButtons = [...document.querySelectorAll('#touch-actions [data-action]')];
    document.getElementById('touch-pause').addEventListener('click', (event) => {
      event.preventDefault();
      this.game.pause();
    });
    if (this.game.input) {
      this.game.input.bindTouch({
        joystick: this.joystick,
        knob: this.knob,
        lookZone: this.lookZone,
        actionButtons: this.touchButtons,
      });
    }
  }

  bindTopActions() {
    document.getElementById('btn-casebook').addEventListener('click', () => this.game.openCasebook());
    document.getElementById('btn-map').addEventListener('click', () => this.game.openMap());
    document.getElementById('btn-pause').addEventListener('click', () => this.game.pause());
  }

  buildOverlays() {
    this.bloodVeil = document.createElement('div');
    this.bloodVeil.id = 'blood-veil';
    this.app.appendChild(this.bloodVeil);

    this.flashVeil = document.createElement('div');
    this.flashVeil.id = 'flash-veil';
    Object.assign(this.flashVeil.style, {
      position: 'fixed', inset: '0', zIndex: '40', pointerEvents: 'none',
      background: '#000', opacity: '0', transition: 'opacity 220ms ease',
    });
    this.app.appendChild(this.flashVeil);
  }

  setHudVisible(visible) {
    this.hud?.classList.toggle('active', Boolean(visible));
  }

  setTension(value) {
    const v = Math.max(0, Math.min(1, value || 0));
    document.documentElement.style.setProperty('--danger', v.toFixed(3));
    document.documentElement.style.setProperty('--tension', v.toFixed(3));
  }

  objective(objective, { announce = false } = {}) {
    if (!objective) return;
    this.el.objectiveAct.textContent = `ACT ${objective.act || 'I'}`;
    this.el.objectiveTitle.textContent = objective.title || '';
    this.el.objectiveText.textContent = objective.text || '';
    this.el.objectiveHint.textContent = objective.hint || '';
    this.el.objectiveCard.classList.add('visible');
    this.el.objectiveCard.classList.add('show-hint');
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.el.objectiveCard?.classList.remove('show-hint'), 9000);
    if (announce) {
      this.el.flashAct.textContent = `ACT ${objective.act || 'I'}`;
      this.el.flashTitle.textContent = objective.title || '';
      this.el.flashDesc.textContent = objective.text || '';
      this.el.objectiveFlash.classList.add('visible');
      clearTimeout(this.objectiveTimer);
      this.objectiveTimer = setTimeout(() => this.el.objectiveFlash?.classList.remove('visible'), 3400);
      this.game.audio?.play('typewriter', { volume: 0.24 });
    }
  }

  setInteraction(entry) {
    if (!entry) {
      if (this.currentInteractId !== null) {
        this.el.prompt.classList.remove('visible', 'locked');
        this.el.crosshair.classList.remove('interactive');
        document.getElementById('touch-interact')?.classList.remove('ready');
        this.currentInteractId = null;
      }
      this.currentPrompt = null;
      this.currentInteractEntry = null;
      return;
    }
    const id = entry.id;
    const prompt = this.game.world?.promptFor(entry) || entry.label || 'Interact';
    const locked = Boolean(entry.type === 'door' && this.game.world?.doors?.[entry.doorId]?.isLocked?.());
    if (id !== this.currentInteractId || prompt !== this.currentPrompt || locked !== this.currentLocked) {
      this.currentInteractId = id;
      this.currentInteractEntry = entry;
      this.currentPrompt = prompt;
      this.currentLocked = locked;
      this.el.promptText.textContent = prompt;
      this.el.promptKey.textContent = this.game.input?.isTouch() ? 'TAP' : 'E';
      this.el.prompt.classList.toggle('locked', locked);
      this.el.prompt.classList.add('visible');
      this.el.crosshair.classList.add('interactive');
      this.el.crosshair.classList.remove('hidden-dot');
      document.getElementById('touch-interact')?.classList.add('ready');
    }
  }

  updateHud() {
    const player = this.game.player;
    const state = this.game.state;
    if (!player || !state) return;
    const battery = Math.max(0, Math.min(100, player.battery ?? 0));
    const batteryRounded = Math.round(battery);
    if (this._lastHud.battery !== batteryRounded) {
      this._lastHud.battery = batteryRounded;
      this.el.batteryFill.style.width = `${battery}%`;
      this.el.batteryFill.classList.toggle('low', battery < 18);
      this.el.batteryStatus.textContent = `${batteryRounded}%`;
    }
    const flashOn = Boolean(player.flashlightOn);
    if (this._lastHud.flashOn !== flashOn) {
      this._lastHud.flashOn = flashOn;
      this.el.flashlightState.classList.toggle('on', flashOn);
      this.el.flashlightLabel.textContent = flashOn ? 'ON' : 'OFF';
    }
    const hasFlashlight = state.hasItem('flashlight');
    if (this._lastHud.hasFlashlight !== hasFlashlight) {
      this._lastHud.hasFlashlight = hasFlashlight;
      document.getElementById('touch-flashlight')?.classList.toggle('visible', hasFlashlight);
    }
    const composure = Math.max(0, Math.min(3, state.player.composure ?? 3));
    if (this._lastHud.composure !== composure) {
      this._lastHud.composure = composure;
      [...this.el.composure.children].forEach((pip, i) => {
        pip.classList.toggle('on', i < composure);
        pip.classList.toggle('hurt', i >= composure);
      });
      this.el.composureNote.textContent = composure === 3 ? 'steady' : composure === 2 ? 'shaken' : composure === 1 ? 'fraying' : 'breaking';
    }
    const objects = ['flashlight', 'crowbar', 'fuse', 'officeKey', 'wakingKey'].filter((item) => state.hasItem(item));
    const objectText = objects.length ? objects.map((item) => ({
      flashlight: 'light', crowbar: 'crowbar', fuse: 'fuse', officeKey: 'brass key', wakingKey: 'Waking Key',
    }[item])).join(' · ') : 'nothing yet';
    if (this._lastHud.objects !== objectText) {
      this._lastHud.objects = objectText;
      this.el.objectCount.textContent = objectText;
    }

    const hidden = Boolean(player.hidden);
    if (this._lastHud.hidden !== hidden) {
      this._lastHud.hidden = hidden;
      this.el.hiddenState.classList.toggle('active', hidden);
      this.el.breathMeter.classList.toggle('visible', hidden);
      this.el.hideHint.classList.toggle('visible', hidden);
      document.getElementById('touch-breath')?.classList.toggle('visible', hidden);
      this.el.breathCaption.textContent = this.game.input?.isTouch()
        ? 'HOLD TO STAY SILENT'
        : 'HOLD YOUR BREATH — SPACE';
      if (hidden) {
        this.el.crosshair.classList.add('hidden-dot');
        this.el.hideHint.textContent = this.game.input?.isTouch()
          ? 'TAP USE — leave hiding place'
          : 'E — leave hiding place';
      } else {
        this.el.crosshair.classList.remove('hidden-dot');
      }
    }
    if (hidden) {
      const breath = Math.max(0, Math.min(1, player.breath ?? 1));
      this.el.breathFill.style.width = `${breath * 100}%`;
      this.el.breathMeter.classList.toggle('holding', Boolean(player.holdingBreath));
    }
  }

  /* ------------------------------------------------------------- messages */

  notify(text, type = 'info') {
    if (!text) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = text;
    this.el.toasts?.appendChild(toast);
    while (this.el.toasts.children.length > 4) this.el.toasts.firstElementChild.remove();
    const outTimer = setTimeout(() => {
      toast.classList.add('out');
      setTimeout(() => toast.remove(), 420);
    }, 3600);
    this.toastTimers.add(outTimer);
    setTimeout(() => this.toastTimers.delete(outTimer), 4300);
  }

  subtitle(text, { speaker = '', danger = false, whisper = false, duration = 4200, force = false } = {}) {
    if (!text) return;
    if (!force && this.game.state?.settings?.subtitles === false) return;
    clearTimeout(this.subtitleTimer);
    this.el.subtitles.innerHTML = '';
    const el = document.createElement('div');
    el.className = `subtitle${danger ? ' danger' : ''}${whisper ? ' whisper' : ''}`;
    if (speaker) {
      const name = document.createElement('span');
      name.className = 'speaker';
      name.textContent = speaker;
      el.appendChild(name);
    }
    el.appendChild(document.createTextNode(text));
    this.el.subtitles.appendChild(el);
    this.subtitleTimer = setTimeout(() => {
      el.style.transition = 'opacity .4s';
      el.style.opacity = '0';
      setTimeout(() => { if (el.parentNode) el.remove(); }, 450);
    }, duration);
  }

  flash(strength = 0.6, color = '#000') {
    if (isPlainObject(strength)) {
      color = strength.color || color;
      strength = strength.opacity ?? strength.strength ?? 0.6;
    }
    this.flashVeil.style.background = color;
    this.flashVeil.style.opacity = String(Math.max(0, Math.min(1, strength)));
    clearTimeout(this.flashTimer);
    this.flashTimer = setTimeout(() => { this.flashVeil.style.opacity = '0'; }, 110);
  }

  hit() {
    this.bloodVeil.classList.add('hit');
    clearTimeout(this.hitTimer);
    this.hitTimer = setTimeout(() => this.bloodVeil.classList.remove('hit'), 320);
  }

  catchFlash() {
    this.bloodVeil.classList.add('dead');
  }

  clearCatch() {
    this.bloodVeil.classList.remove('dead', 'hit');
  }

  /* --------------------------------------------------------------- modals */

  openModal(options = {}) {
    const {
      kicker = '', title = '', sub = '', body = '', actions = [],
      className = '', wide = false, narrow = false, closable = true,
      bodyClass = '', onMount = null, onClose = null,
    } = options;
    this.closeModal({ silent: true });
    const token = ++this._modalToken;

    if (!this.backdrop) {
      this.backdrop = document.createElement('div');
      this.backdrop.className = 'modal-backdrop';
      this.app.appendChild(this.backdrop);
    }
    const classes = ['modal', wide ? 'wide' : '', narrow ? 'narrow' : '', className].filter(Boolean).join(' ');
    const actionsHtml = actions.length
      ? `<div class="modal-actions">${actions.map((action, index) => (
        `<button class="btn ${action.class || ''}" data-modal-action="${index}" ${action.disabled ? 'disabled' : ''}>${action.label}</button>`
      )).join('')}</div>`
      : '';
    this.backdrop.innerHTML = `
      <div class="${classes}" role="dialog" aria-modal="true" aria-label="${esc(title || 'Hushwood')}">
        <div class="modal-head">
          <div>
            ${kicker ? `<div class="modal-kicker">${esc(kicker)}</div>` : ''}
            <h2 class="modal-title">${esc(title)}</h2>
            ${sub ? `<p class="modal-sub">${esc(sub)}</p>` : ''}
          </div>
          ${closable ? `<button class="modal-close" aria-label="Close">${ICONS.close}</button>` : ''}
        </div>
        <div class="modal-body ${bodyClass}">${body}</div>
        ${actionsHtml}
      </div>
    `;
    const modalEl = this.backdrop.firstElementChild;
    this.activeModal = { options: { ...options, onClose }, modalEl, token };
    this.modalOpen = true;
    this.backdrop.classList.add('open');
    this.game.onUiModal?.(true);

    if (closable) {
      modalEl.querySelector('.modal-close')?.addEventListener('click', () => this.closeModal());
    }
    this.backdrop.addEventListener('pointerdown', (event) => {
      if (event.target === this.backdrop && closable) this.closeModal();
    }, { once: true });
    for (const button of modalEl.querySelectorAll('[data-modal-action]')) {
      const index = Number(button.dataset.modalAction);
      button.addEventListener('click', () => {
        const action = actions[index];
        if (!action) return;
        action.onClick?.(this, modalEl);
        if (action.close !== false) this.closeModal();
      });
    }
    onMount?.(modalEl, this);
    setTimeout(() => {
      if (this.activeModal?.token === token) {
        (modalEl.querySelector('.modal-close') || modalEl.querySelector('input, button, select'))?.focus?.({ preventScroll: true });
      }
    }, 60);
    return modalEl;
  }

  closeModal({ silent = false } = {}) {
    const current = this.activeModal;
    if (!current) return;
    this.activeModal = null;
    this.modalOpen = false;
    for (const cleanup of this.cleanups.splice(0)) {
      try { cleanup(); } catch (error) { console.warn(error); }
    }
    this.backdrop?.classList.remove('open');
    if (!silent) current.options.onClose?.(this);
    if (!this.modalOpen) this.game.onUiModal?.(false);
    if (this.backdrop) {
      const token = current.token;
      setTimeout(() => {
        if (!this.modalOpen && this.backdrop && token === this._modalToken) this.backdrop.innerHTML = '';
      }, 330);
    }
  }

  addCleanup(fn) {
    this.cleanups.push(fn);
  }

  openNote(noteId) {
    const note = NOTES[noteId];
    if (!note) return;
    this.openModal({
      kicker: note.kicker || 'Recovered document',
      title: note.title,
      sub: 'Hushwood Institute',
      className: 'note-modal',
      body: `
        ${note.body}
        ${note.clue ? `<div class="clue-tag">↳ ${esc(note.clue)}</div>` : ''}
      `,
      actions: [{ label: 'Fold the page', class: 'ghost' }],
    });
    this.game.audio?.play('paper', { volume: 0.65 });
  }

  openChart(index) {
    const patient = PATIENTS[index];
    if (!patient) return;
    const read = Boolean(this.game.state?.charts?.[index]);
    this.openModal({
      kicker: `Patient chart · Bed ${index + 1}`,
      title: patient.name,
      sub: `Hushwood Institute · ${patient.colorName} file`,
      className: 'note-modal',
      body: `
        <div class="chart-stamp">HUSHWOOD<br>INSTITUTE<br>${esc(patient.stage)}</div>
        <div class="chart-grid">
          <div class="chart-field"><span class="k">Age</span><span class="v">${patient.age}</span></div>
          <div class="chart-field"><span class="k">Sleep stage</span><span class="v">${esc(patient.stage)}</span></div>
          <div class="chart-field"><span class="k">Comfort protocol</span><span class="v">${esc(patient.comfort)}</span></div>
          <div class="chart-field"><span class="k">File status</span><span class="v">${read ? 'Read' : 'Unread'}</span></div>
        </div>
        <p>${esc(patient.sleep)}</p>
        <p class="faint">${esc(patient.comfortText)}</p>
        <p class="hand">${esc(patient.note)}</p>
      `,
      actions: [{ label: 'Return the chart', class: 'ghost' }],
    });
    this.game.audio?.play('paper', { volume: 0.55 });
  }

  openCasebook(initialTab = 'notes', { onClose = null } = {}) {
    const tabs = [
      { id: 'notes', label: 'Documents' },
      { id: 'charts', label: 'Patient charts' },
      { id: 'clues', label: 'Deductions' },
      { id: 'reels', label: 'Tape reels' },
    ];
    const body = `
      <div class="casebook-body">
        <div class="casebook-tabs">
          ${tabs.map((tab) => `<button class="casebook-tab${tab.id === initialTab ? ' active' : ''}" data-tab="${tab.id}">${tab.label}</button>`).join('')}
        </div>
        <div class="casebook-panel" id="casebook-panel"></div>
      </div>
    `;
    const modalEl = this.openModal({
      kicker: 'Everything you have found',
      title: 'The Casebook',
      sub: 'Mara Vale · Hushwood Institute',
      wide: true,
      className: 'casebook-modal',
      body,
      actions: [{ label: 'Close the casebook', class: 'ghost' }],
      onClose,
      onMount: (el) => {
        const panel = el.querySelector('#casebook-panel');
        const render = (tabId) => {
          el.querySelectorAll('.casebook-tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === tabId));
          if (tabId === 'notes') panel.innerHTML = this.notesCasePanel();
          else if (tabId === 'charts') panel.innerHTML = this.chartsCasePanel();
          else if (tabId === 'clues') panel.innerHTML = this.cluesCasePanel();
          else panel.innerHTML = this.reelsCasePanel();
          for (const button of panel.querySelectorAll('[data-open-note]')) {
            button.addEventListener('click', () => {
              const id = button.dataset.openNote;
              this.closeModal();
              this.openNote(id);
            });
          }
        };
        el.querySelectorAll('.casebook-tab').forEach((tab) => tab.addEventListener('click', () => render(tab.dataset.tab)));
        render(initialTab);
      },
    });
    return modalEl;
  }

  notesCasePanel() {
    const read = this.game.state?.data?.readNotes || [];
    if (!read.length) return '<div class="empty-state">No documents yet. Paper remembers more than people do.</div>';
    return read.map((id) => {
      const note = NOTES[id];
      if (!note) return '';
      return `
        <div class="case-entry">
          <h4 class="entry-title">${esc(note.title)}</h4>
          <div class="entry-meta">${esc(note.kicker || 'Recovered document')}</div>
          <p class="entry-text">${esc(note.clue || 'A page from the clinic.')}</p>
          <button class="btn ghost" data-open-note="${esc(id)}" style="margin-top:8px;padding:7px 12px;">Read again</button>
        </div>
      `;
    }).join('');
  }

  chartsCasePanel() {
    return `<div class="chart-list">${PATIENTS.map((patient, index) => {
      const read = Boolean(this.game.state?.charts?.[index]);
      return `
        <div class="chart-mini ${read ? 'read' : ''}">
          <div class="name">${esc(patient.name)}</div>
          <div class="meta">${esc(patient.colorName)} bed · age ${patient.age}</div>
          <div class="stage">${read ? `${esc(patient.stage)} · ${esc(patient.comfortText)}` : 'Chart not yet read.'}</div>
        </div>
      `;
    }).join('')}</div>`;
  }

  cluesCasePanel() {
    const clues = this.game.state?.clues || [];
    if (!clues.length) return '<div class="empty-state">No deductions yet. The house is waiting to be understood.</div>';
    return `<ul class="clue-list">${clues.map((clue) => `<li>${esc(clue)}</li>`).join('')}</ul>`;
  }

  reelsCasePanel() {
    const reels = this.game.state?.reels || [];
    if (!reels.length) return '<div class="empty-state">No tape reels recovered. The Records room may still have them.</div>';
    return `<div class="reel-list">${reels.map((id) => {
      const note = NOTES[id];
      return `<div class="reel-item"><strong>${esc(note?.title || id)}</strong><button class="btn ghost" data-open-note="${esc(id)}">Listen</button></div>`;
    }).join('')}</div>`;
  }

  openMap(initialFloor = null, { onClose = null } = {}) {
    const playerFloor = this.game.player?.currentFloor || 'ground';
    let floor = initialFloor || playerFloor;
    const floors = ['ground', 'upper', 'basement', 'attic'];
    const modalEl = this.openModal({
      kicker: 'Hushwood Institute · floor plan',
      title: 'The House',
      sub: 'Rooms you have walked are marked in gold.',
      wide: true,
      className: 'map-modal',
      body: `
        <div class="map-toolbar">
          ${floors.map((id) => `<button class="map-floor${id === floor ? ' active' : ''}" data-floor="${id}">${FLOOR_LABEL[id]}</button>`).join('')}
        </div>
        <div class="map-canvas" id="map-canvas"></div>
        <div class="map-legend"><span>Current room</span><span>Visited</span><span>Unvisited</span></div>
        <p class="map-floor-note" id="map-floor-note"></p>
      `,
      actions: [{ label: 'Put the map away', class: 'ghost' }],
      onClose,
      onMount: (el) => {
        const canvas = el.querySelector('#map-canvas');
        const note = el.querySelector('#map-floor-note');
        const render = () => {
          const current = this.game.world?.roomAt(this.game.player.position, this.game.player.currentFloor)?.id;
          canvas.innerHTML = this.mapSvg(floor, current);
          note.textContent = floor === playerFloor
            ? 'You are here. Everything else is still dark.'
            : 'A memory of a floor you have walked.';
          el.querySelectorAll('.map-floor').forEach((button) => button.classList.toggle('active', button.dataset.floor === floor));
        };
        el.querySelectorAll('.map-floor').forEach((button) => {
          button.addEventListener('click', () => { floor = button.dataset.floor; render(); });
        });
        render();
      },
    });
    return modalEl;
  }

  mapSvg(floor, currentRoom) {
    const rooms = ROOMS.filter((room) => room.floor === floor);
    if (!rooms.length) return '';
    const visited = this.game.state?.visited || {};
    const minX = Math.min(...rooms.map((room) => room.x1)) - 1.3;
    const maxX = Math.max(...rooms.map((room) => room.x2)) + 1.3;
    const minZ = Math.min(...rooms.map((room) => room.z1)) - 1.3;
    const maxZ = Math.max(...rooms.map((room) => room.z2)) + 1.3;
    const width = maxX - minX;
    const height = maxZ - minZ;
    const shapes = rooms.map((room) => {
      const classes = ['map-room'];
      if (visited[room.id]) classes.push('visited');
      if (room.id === currentRoom) classes.push('current');
      return `
        <g>
          <rect class="${classes.join(' ')}" x="${room.x1}" y="${room.z1}" width="${room.x2 - room.x1}" height="${room.z2 - room.z1}" rx="0.25" />
          <text class="map-room-label" x="${(room.x1 + room.x2) / 2}" y="${(room.z1 + room.z2) / 2 + 0.9}">${esc(room.name)}</text>
        </g>
      `;
    }).join('');
    return `<svg viewBox="${minX} ${minZ} ${width} ${height}" preserveAspectRatio="xMidYMid meet">
      <g opacity="0.18" stroke="#b7a06a" stroke-width="0.08">
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${minX + i * (width / 14)} ${minZ}V${maxZ}" />`).join('')}
        ${Array.from({ length: 14 }, (_, i) => `<path d="M${minX} ${minZ + i * (height / 14)}H${maxX}" />`).join('')}
      </g>
      ${shapes}
    </svg>`;
  }

  openSettings({ fromTitle = false, onClose = null } = {}) {
    const settings = this.game.state.settings;
    const body = `
      <div class="settings-list">
        ${this.rangeRow('sensitivity', 'Look sensitivity', 'How quickly the camera follows your touch or mouse.', 0.3, 2, 0.05, settings.sensitivity, `${Math.round(settings.sensitivity * 100)}%`)}
        ${this.rangeRow('masterVolume', 'Volume', 'Headphones recommended. The house is quieter than it looks.', 0, 1, 0.05, settings.masterVolume, `${Math.round(settings.masterVolume * 100)}%`)}
        ${this.toggleRow('invertY', 'Invert look', 'Flip vertical camera movement.', settings.invertY)}
        ${this.toggleRow('grain', 'Film grain', 'A little dirt on the lens.', settings.grain)}
        ${this.toggleRow('subtitles', 'Subtitles', 'Show spoken and ambient captions.', settings.subtitles)}
        ${this.toggleRow('haptics', 'Haptics', 'Vibrate on attacks, falls, and scares.', settings.haptics)}
        ${this.toggleRow('reducedMotion', 'Reduced motion', 'Disable head bob, shake, and grain movement.', settings.reducedMotion)}
        <div class="setting-row">
          <div class="setting-label"><strong>Quality</strong><span>Lower this if the house stutters.</span></div>
          <div class="segmented" data-segment="quality">
            ${['low', 'medium', 'high'].map((id) => `<button data-value="${id}" class="${settings.quality === id ? 'active' : ''}">${id}</button>`).join('')}
          </div>
        </div>
        <div class="setting-row">
          <div class="setting-label"><strong>Touch controls</strong><span>Auto detects a phone or tablet.</span></div>
          <div class="segmented" data-segment="showTouch">
            ${['auto', 'on', 'off'].map((id) => `<button data-value="${id}" class="${settings.showTouch === id ? 'active' : ''}">${id}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    return this.openModal({
      kicker: fromTitle ? 'Before you step inside' : 'Make the dark bearable',
      title: 'Settings',
      sub: 'Hushwood remembers these choices.',
      body,
      narrow: false,
      actions: [{ label: fromTitle ? 'Back to title' : 'Done', class: 'primary' }],
      onClose,
      onMount: (el) => {
        for (const input of el.querySelectorAll('input[data-setting]')) {
          const key = input.dataset.setting;
          const isCheckbox = input.type === 'checkbox';
          input.addEventListener('input', () => {
            const value = isCheckbox ? input.checked : parseFloat(input.value);
            const partial = { [key]: isCheckbox ? value : Math.round(value * 100) / 100 };
            this.game.state.updateSettings(partial);
            this.game.applySettings();
            const valueEl = el.querySelector(`[data-value-for="${key}"]`);
            if (valueEl) valueEl.textContent = key === 'masterVolume' ? `${Math.round(value * 100)}%` : `${Math.round(value * 100)}%`;
          });
        }
        for (const segment of el.querySelectorAll('[data-segment]')) {
          segment.querySelectorAll('button').forEach((button) => {
            button.addEventListener('click', () => {
              const key = segment.dataset.segment;
              this.game.state.updateSettings({ [key]: button.dataset.value });
              segment.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
              this.game.applySettings();
            });
          });
        }
      },
    });
  }

  rangeRow(key, title, desc, min, max, step, value, display) {
    return `
      <div class="setting-row">
        <div class="setting-label"><strong>${esc(title)}</strong><span>${esc(desc)}</span></div>
        <div class="range-wrap">
          <input type="range" data-setting="${key}" min="${min}" max="${max}" step="${step}" value="${value}" aria-label="${esc(title)}" />
          <span class="range-value" data-value-for="${key}">${esc(display)}</span>
        </div>
      </div>
    `;
  }

  toggleRow(key, title, desc, checked) {
    return `
      <div class="setting-row">
        <div class="setting-label"><strong>${esc(title)}</strong><span>${esc(desc)}</span></div>
        <label class="switch">
          <input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} aria-label="${esc(title)}" />
          <span class="track"></span>
        </label>
      </div>
    `;
  }

  openPause({ onClose = null } = {}) {
    const objective = this.game.state.getObjective();
    const visited = Object.keys(this.game.state.data.visited || {}).length;
    return this.openModal({
      kicker: 'The house waits',
      title: 'Paused',
      sub: `Act ${objective.act} · ${objective.title}`,
      narrow: true,
      className: 'pause-modal',
      body: `
        <div class="pause-menu">
          <button class="pause-item" data-pause="resume">Resume <span>Esc</span></button>
          <button class="pause-item" data-pause="casebook">Casebook <span>${this.game.state.data.readNotes.length} docs</span></button>
          <button class="pause-item" data-pause="map">Map <span>${visited} rooms</span></button>
          <button class="pause-item" data-pause="settings">Settings</button>
          <button class="pause-item" data-pause="checkpoint">Return to last candle <span>checkpoint</span></button>
          <button class="pause-item danger" data-pause="title">Save &amp; return to title</button>
        </div>
        <p class="pause-footnote">Progress saves at candles, after puzzles, and when you pause. There is no shame in running.</p>
      `,
      closable: true,
      onClose,
      onMount: (el) => {
        el.querySelectorAll('[data-pause]').forEach((button) => {
          button.addEventListener('click', () => {
            const action = button.dataset.pause;
            if (action === 'resume') this.closeModal();
            else if (action === 'title') this.game.returnToTitle();
            else if (action === 'checkpoint') {
              this.closeModal();
              this.game.restartFromCheckpoint();
            } else {
              const resume = this.activeModal?.options?.onClose;
              if (this.activeModal) this.activeModal.options.onClose = null;
              this.closeModal();
              const reopenPause = () => this.openPause({ onClose: resume });
              if (action === 'casebook') this.openCasebook('notes', { onClose: reopenPause });
              else if (action === 'map') this.openMap(this.game.player.currentFloor, { onClose: reopenPause });
              else if (action === 'settings') this.openSettings({ onClose: reopenPause });
            }
          });
        });
      },
    });
  }

  openControls({ fromTitle = false } = {}) {
    return this.openModal({
      kicker: 'How to stay alive',
      title: 'How to Play',
      sub: 'The Matron cannot see you. She can hear everything.',
      wide: true,
      body: `
        <div class="puzzle-layout">
          <div class="puzzle-panel">
            <h4>Keyboard &amp; mouse</h4>
            <p class="puzzle-copy"><strong>W A S D</strong> move · <strong>Shift</strong> sprint · <strong>C</strong> crouch<br><strong>E</strong> interact · <strong>F</strong> flashlight · <strong>Space</strong> hold breath<br><strong>Tab</strong> casebook · <strong>M</strong> map · <strong>Esc</strong> pause</p>
          </div>
          <div class="puzzle-panel">
            <h4>Touch</h4>
            <p class="puzzle-copy">Left thumb moves. Drag the screen to look. Use the action buttons for interacting, crouching, sprinting, breathing, and the flashlight.</p>
          </div>
        </div>
        <div class="puzzle-panel" style="margin-top:12px">
          <h4>The quiet cure</h4>
          <p class="puzzle-copy">Stay low and move slowly. Noise draws the Matron. Light draws the sleepwalkers in the cellar. Step into a wardrobe, under a bed, or behind a curtain and <em>hold your breath</em> when she comes close.</p>
          <p class="puzzle-copy">Candles are checkpoints. Read everything. The house is a puzzle with teeth.</p>
        </div>
      `,
      actions: [{ label: fromTitle ? 'Back to title' : 'Understood', class: 'primary' }],
    });
  }

  openCredits() {
    return this.openModal({
      kicker: 'Made with borrowed light',
      title: 'Credits',
      sub: 'HUSHWOOD — The Quiet Cure',
      wide: true,
      body: `
        <div class="puzzle-layout">
          <div class="puzzle-panel">
            <h4>Clinic staff</h4>
            <p class="puzzle-copy">Design, writing, code, and sound direction by Lunarose.<br>Built with Three.js, Rapier, Howler.js, Vite, and Capacitor.</p>
          </div>
          <div class="puzzle-panel">
            <h4>Borrowed materials</h4>
            <p class="puzzle-copy">Environment textures, HDRI, and props from <em>Poly Haven</em> (CC0). Character rigs and animation source from <em>Mixamo</em>. Sound effects from <em>Mixkit</em>. Typefaces: Cormorant Garamond and Special Elite (SIL Open Font License).</p>
          </div>
        </div>
        <p class="puzzle-copy" style="margin-top:14px">Full asset provenance is listed in ASSET_LICENSES.md. Hushwood Institute and its patients are fictional. Any resemblance to a sleeping clinic you have visited is your own business.</p>
      `,
      actions: [{ label: 'Back', class: 'primary' }],
    });
  }

  openConfirm({ title, text, yes = 'Yes', no = 'Not yet', danger = false, onYes }) {
    return this.openModal({
      kicker: 'A door, either way',
      title,
      sub: '',
      narrow: true,
      body: `<p class="puzzle-copy">${text}</p>`,
      actions: [
        { label: no, class: 'ghost' },
        { label: yes, class: danger ? 'danger' : 'primary', onClick: () => onYes?.() },
      ],
    });
  }

  openIntro(onBegin) {
    return this.openModal({
      kicker: 'Hushwood Institute · 3:17 AM',
      title: 'The Quiet Cure',
      sub: 'A letter in a child’s handwriting brought you back.',
      wide: true,
      closable: false,
      body: `
        <p class="puzzle-copy">The front doors seal behind you. The reception clock has stopped. Somewhere above, a small brass bell rings once, then thinks better of it.</p>
        <p class="puzzle-copy">You are Mara Vale. You were patient sixteen, a long time ago. Tonight the clinic is awake, and the Matron is doing her rounds.</p>
        <p class="puzzle-copy"><em>Find a light. Find a way out. And whatever you do, do not let her hear you.</em></p>
        <div class="puzzle-panel" style="margin-top:6px">
          <h4>First steps</h4>
          <p class="puzzle-copy">Search the Reception desk. Read what you find. Candles are checkpoints. Headphones recommended.</p>
        </div>
      `,
      actions: [{
        label: 'Step inside',
        class: 'primary',
        onClick: () => onBegin?.(),
      }],
    });
  }

  /* --------------------------------------------------------------- ending */

  showTitle({ hasSave = false, canContinue = hasSave } = {}) {
    if (!this.title) return;
    this._titleHasSave = hasSave;
    this._titleCanContinue = canContinue;
    this.title.classList.add('active');
    this.title.querySelector('#title-continue').style.display = canContinue ? '' : 'none';
    this.title.querySelector('#title-new').textContent = hasSave ? 'Begin again' : 'New game';
    this.title.querySelector('#title-continue').textContent = 'Continue';
    this.setHudVisible(false);
    this.game.input?.setEnabled(false);
  }

  hideTitle() {
    this.title?.classList.remove('active');
  }

  buildTitle() {
    this.root.insertAdjacentHTML('beforeend', `
      <div class="screen title-screen" id="title-screen">
        <div class="scrim"></div>
        <div class="title-frame"></div>
        <div class="title-inner">
          <div class="title-eyebrow">Hushwood Institute · Est. 1948</div>
          <h1 class="game-title">HUSH<span class="thin">WOOD</span></h1>
          <div class="title-rule"></div>
          <p class="title-sub">The Quiet Cure</p>
          <p class="title-tagline">They treated insomnia with silence.<br>Tonight, <em>the silence is treating you.</em></p>
          <div class="title-menu">
            <button class="title-button primary" id="title-new">New game</button>
            <button class="title-button" id="title-continue">Continue</button>
            <button class="title-button" id="title-settings">Settings</button>
            <button class="title-button" id="title-controls">How to play</button>
            <button class="title-button" id="title-credits">Credits</button>
          </div>
        </div>
        <div class="title-side">
          <span class="vertical">A quiet cure for the sleepless</span>
          <div class="moth-mark">${ICONS.moth}</div>
        </div>
        <div class="title-footer">
          <div class="warn">Contains psychological horror, child peril, and sudden sound. Play with headphones in a dark room, if you must.</div>
          <div class="headphones"><svg viewBox="0 0 24 24"><path d="M4 13v-1a8 8 0 0 1 16 0v1"/><path d="M4 13h3v6H5a1 1 0 0 1-1-1ZM20 13h-3v6h2a1 1 0 0 0 1-1Z"/></svg> Headphones recommended</div>
        </div>
        <div class="live-caption">The house will not open until the bell has spoken.</div>
      </div>
    `);
    this.title = document.getElementById('title-screen');
    document.getElementById('title-new').addEventListener('click', () => {
      if (this._titleHasSave) {
        this.openConfirm({
          title: 'Begin again?',
          text: 'The current story is already recorded. Beginning again will erase your candle, your casebook, and every door you have opened.',
          yes: 'Erase and begin',
          danger: true,
          onYes: () => this.game.newGame(),
        });
      } else {
        this.game.newGame();
      }
    });
    document.getElementById('title-continue').addEventListener('click', () => this.game.continueGame());
    document.getElementById('title-settings').addEventListener('click', () => this.openSettings({ fromTitle: true }));
    document.getElementById('title-controls').addEventListener('click', () => this.openControls({ fromTitle: true }));
    document.getElementById('title-credits').addEventListener('click', () => this.openCredits());
  }

  showEnding(key = 'base', stats = {}) {
    const ending = ENDINGS[key] || ENDINGS.base;
    this.setHudVisible(false);
    this.hideTitle();
    if (!this.ending) {
      this.ending = document.createElement('div');
      this.ending.className = 'screen ending-screen';
      this.root.appendChild(this.ending);
    }
    this.ending.innerHTML = `
      <div class="scrim"></div>
      <div class="ending-inner">
        <div class="ending-content">
          <div class="ending-kicker">Hushwood Institute · 3:18 AM</div>
          <h2 class="ending-title">${esc(ending.title)}</h2>
          <div class="ending-body">${ending.body}</div>
          <div class="ending-stats">
            <div class="ending-stat">Time inside<strong>${formatTime(stats.playtime)}</strong></div>
            <div class="ending-stat">Rooms walked<strong>${stats.rooms ?? 0} / ${ROOMS.length}</strong></div>
            <div class="ending-stat">Documents<strong>${stats.documents ?? 0}</strong></div>
            <div class="ending-stat">Tape reels<strong>${stats.reels ?? 0} / 3</strong></div>
          </div>
          <div class="ending-actions">
            <button class="btn primary" id="ending-again">Begin again</button>
            <button class="btn ghost" id="ending-title">Return to title</button>
          </div>
        </div>
      </div>
    `;
    this.ending.classList.add('active');
    document.getElementById('ending-again').addEventListener('click', () => this.game.eraseAndReload());
    document.getElementById('ending-title').addEventListener('click', () => this.game.returnToTitle());
    this.game.audio?.play('bell_church', { volume: 0.65 });
  }

  updateTouchDisplay() {
    if (!this.touchLayer) return;
    const setting = this.game.state?.settings?.showTouch || 'auto';
    const physicalTouch = Boolean(this.game.input?.touchEnabled)
      || window.matchMedia('(pointer: coarse)').matches;
    const show = setting === 'on' || (setting === 'auto' && physicalTouch);
    if (this.game.input) this.game.input.forceTouch = show;
    this.touchLayer.classList.toggle('active', show);
    this.touchLayer.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (this.el?.promptKey) this.el.promptKey.textContent = show ? 'TAP' : 'E';
  }

  closeAll() {
    this.closeModal({ silent: true });
    this.ending?.classList.remove('active');
    this.hideTitle();
    this.setHudVisible(false);
  }
}
