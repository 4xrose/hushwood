import { PATIENTS } from '../core/Story.js';
import { updatePower } from '../world/Lighting.js';
import { setGeneratorPower, showConsoleKey, openMirrorSafe } from '../world/SetPieces.js';

const MIRROR_TARGET = ['\\', '/', '/', '\\'];
const CHORD_TARGET = ['A', 'A', 'C', 'C', 'E', 'E', 'G', 'G'];
const BREAKER_ORDER = ['theatre', 'ward', 'bell'];
const STAGES = ['I', 'II', 'III', 'REM'];

function setNotice(element, text, kind = '') {
  if (!element) return;
  element.textContent = text;
  element.className = `puzzle-notice${kind ? ` ${kind}` : ''}`;
}

/* ------------------------------------------------------------- generator */

export function openGenerator(ui) {
  const game = ui.game;
  const state = game.state;
  const flags = state.flags;
  const powerOn = Boolean(flags.powerOn);
  let pressure = flags.fuelPrimed ? 62 : 0;

  const body = `
    <div class="puzzle-layout">
      <div class="puzzle-panel">
        <h4>Fuel pressure</h4>
        <div class="gauge-wrap">
          <div class="gauge">
            <div class="gauge-band"></div>
            <div class="gauge-needle" id="gauge-needle"></div>
            <div class="gauge-label">PRIME LINE</div>
            <div class="gauge-value" id="gauge-value">0 PSI</div>
          </div>
        </div>
        <button class="prime-button" id="prime-button">Hold to prime</button>
        <div class="puzzle-readout"><span>Green band</span><strong>55 – 70 PSI</strong></div>
        <div class="puzzle-readout"><span>Ceramic fuse</span><strong id="fuse-readout">${flags.fuseInstalled ? 'INSTALLED' : state.hasItem('fuse') ? 'IN HAND' : 'MISSING'}</strong></div>
        <button class="breaker" id="install-fuse" style="width:100%;margin-top:10px;${flags.fuseInstalled || !state.hasItem('fuse') ? 'display:none' : ''}">Install ceramic fuse</button>
        <div class="puzzle-notice" id="generator-notice">${powerOn ? 'The generator is running. The house is listening.' : 'Prime the fuel line before waking the circuits.'}</div>
      </div>
      <div class="puzzle-panel">
        <h4>Service breakers</h4>
        <p class="puzzle-copy">The service plate names the order: <em>THEATRE, then WARD, then BELL.</em></p>
        <div class="breaker-list" id="breaker-list">
          ${BREAKER_ORDER.map((name) => `<button class="breaker${flags.breakersSet ? ' on' : ''}" data-breaker="${name}" ${!flags.fuseInstalled || !flags.fuelPrimed || powerOn ? 'disabled' : ''}>${name.toUpperCase()}</button>`).join('')}
        </div>
        <div class="puzzle-readout"><span>Generator</span><strong id="generator-readout">${powerOn ? 'RUNNING' : 'COLD'}</strong></div>
        <button class="prime-button" id="start-generator" style="margin-top:12px" ${powerOn || !flags.breakersSet ? 'disabled' : ''}>${powerOn ? 'The house is awake' : 'Start the generator'}</button>
        <div class="puzzle-notice" id="start-notice"></div>
      </div>
    </div>
  `;

  const modal = ui.openModal({
    kicker: 'Basement · generator room',
    title: 'The Generator',
    sub: 'A sleeping house needs a heartbeat.',
    wide: true,
    body,
    actions: [{ label: 'Step back', class: 'ghost' }],
    onMount: (el) => {
      const needle = el.querySelector('#gauge-needle');
      const gaugeValue = el.querySelector('#gauge-value');
      const primeButton = el.querySelector('#prime-button');
      const notice = el.querySelector('#generator-notice');
      const startButton = el.querySelector('#start-generator');
      const startNotice = el.querySelector('#start-notice');
      const breakerButtons = [...el.querySelectorAll('[data-breaker]')];
      let holding = false;
      let raf = null;
      let last = 0;
      let overpressured = false;

      const renderGauge = () => {
        const clamped = Math.max(0, Math.min(100, pressure));
        needle.style.transform = `rotate(${-58 + clamped * 1.16}deg)`;
        gaugeValue.textContent = `${Math.round(clamped)} PSI`;
      };
      renderGauge();

      const updateStates = () => {
        const installed = Boolean(state.flags.fuseInstalled);
        const primed = Boolean(state.flags.fuelPrimed);
        const set = Boolean(state.flags.breakersSet);
        const running = Boolean(state.flags.powerOn);
        const fuseBtn = el.querySelector('#install-fuse');
        if (fuseBtn) fuseBtn.style.display = installed || !state.hasItem('fuse') ? 'none' : '';
        const fuseReadout = el.querySelector('#fuse-readout');
        if (fuseReadout) fuseReadout.textContent = installed ? 'INSTALLED' : state.hasItem('fuse') ? 'IN HAND' : 'MISSING';
        primeButton.disabled = !installed || primed || running;
        primeButton.textContent = primed ? 'Fuel line primed' : running ? 'Fuel line open' : 'Hold to prime';
        breakerButtons.forEach((button) => {
          button.disabled = !installed || !primed || set || running;
          button.classList.toggle('on', set || BREAKER_ORDER.indexOf(button.dataset.breaker) < (set ? 3 : 0));
        });
        startButton.disabled = running || !set;
        startButton.textContent = running ? 'The house is awake' : 'Start the generator';
        const readout = el.querySelector('#generator-readout');
        if (readout) readout.textContent = running ? 'RUNNING' : 'COLD';
      };
      updateStates();

      const endPrime = (success) => {
        if (!holding) return;
        holding = false;
        cancelAnimationFrame(raf);
        primeButton.classList.remove('holding');
        if (success) {
          state.setFlag('fuelPrimed', true, { save: true });
          state.save();
          pressure = 62;
          renderGauge();
          setNotice(notice, 'The needle settles in the green band. The line holds.', 'good');
          game.audio.play('switch_click', { volume: 0.8 });
          updateStates();
        } else if (overpressured) {
          setNotice(notice, 'The line vents with a shriek. Too much pressure.', 'bad');
          game.audio.play('impact', { volume: 0.5 });
          pressure = 0;
          renderGauge();
        } else {
          setNotice(notice, 'Not enough pressure. The generator coughs and settles.', 'bad');
          game.audio.play('floor_creak', { volume: 0.4 });
        }
        overpressured = false;
      };

      const beginPrime = (event) => {
        event.preventDefault();
        if (primeButton.disabled || state.flags.fuelPrimed) return;
        holding = true;
        primeButton.classList.add('holding');
        pressure = 0;
        overpressured = false;
        renderGauge();
        setNotice(notice, 'The needle climbs. Release inside the green band.');
        game.audio.play('water_bubble', { volume: 0.25 });
        last = performance.now();
        const tick = (now) => {
          if (!holding) return;
          const dt = Math.min(0.05, (now - last) / 1000);
          last = now;
          pressure = Math.min(100, pressure + dt * 26);
          renderGauge();
          if (pressure >= 86) {
            overpressured = true;
            setNotice(notice, 'The gauge needle strikes the red. Release!', 'bad');
            endPrime(false);
          } else {
            raf = requestAnimationFrame(tick);
          }
        };
        raf = requestAnimationFrame(tick);
      };

      const releasePrime = () => {
        if (!holding) return;
        const success = pressure >= 55 && pressure <= 70;
        if (pressure > 70) overpressured = true;
        endPrime(success);
      };

      if (!powerOn && !flags.fuelPrimed) {
        primeButton.addEventListener('pointerdown', (event) => {
          primeButton.setPointerCapture?.(event.pointerId);
          beginPrime(event);
        });
        primeButton.addEventListener('pointerup', releasePrime);
        primeButton.addEventListener('pointercancel', releasePrime);
        window.addEventListener('pointerup', releasePrime);
        ui.addCleanup(() => {
          window.removeEventListener('pointerup', releasePrime);
          cancelAnimationFrame(raf);
        });
      }

      el.querySelector('#install-fuse')?.addEventListener('click', () => {
        if (!state.hasItem('fuse')) return;
        state.removeItem('fuse');
        state.setFlag('fuseInstalled', true, { save: true });
        state.save();
        setNotice(notice, 'The ceramic fuse seats with a click. The panel is live.', 'good');
        game.audio.play('key_lock', { volume: 0.7 });
        renderGauge();
        updateStates();
      });

      let breakerCount = flags.breakersSet ? 3 : 0;
      for (const button of breakerButtons) {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          const index = BREAKER_ORDER.indexOf(button.dataset.breaker);
          if (index !== breakerCount) {
            breakerCount = 0;
            breakerButtons.forEach((item) => item.classList.remove('on'));
            setNotice(startNotice, 'The circuit snaps back. THEATRE, then WARD, then BELL.', 'bad');
            game.audio.play('impact', { volume: 0.35 });
            return;
          }
          breakerCount++;
          button.classList.add('on');
          game.audio.play('switch_click', { volume: 0.85 });
          if (breakerCount === 3) {
            state.setFlag('breakersSet', true, { save: true });
            state.save();
            setNotice(startNotice, 'All three circuits are live. Start the generator.', 'good');
            startButton.disabled = false;
            updateStates();
          } else {
            setNotice(startNotice, `Breaker set. Next: ${BREAKER_ORDER[breakerCount].toUpperCase()}.`);
          }
        });
      }

      startButton.addEventListener('click', () => {
        if (state.flags.powerOn || !state.flags.breakersSet) return;
        state.setFlag('powerOn', true, { save: true });
        state.save();
        updatePower(game.world, true);
        setGeneratorPower(game.world, true);
        game.audio.sting('loud');
        game.audio.play('horror_transition', { volume: 0.35 });
        game.shake(0.25);
        game.ui.flash(0.72);
        game.enemies?.onPowerOn?.();
        game.player?.refillComposure?.();
        game.notify('The house wakes. Every light is a witness.', 'danger');
        game.ui.subtitle('Somewhere above, a door closes that was already closed.', { whisper: true, danger: true, duration: 5600 });
        ui.closeModal();
      });
    },
  });
  return modal;
}

/* --------------------------------------------------------------- console */

export function openConsole(ui) {
  const game = ui.game;
  const state = game.state;
  const chartsRead = state.charts.filter(Boolean).length;
  const solved = Boolean(state.flags.consoleSolved);
  const values = [...state.consoleValues];

  const body = `
    <div class="puzzle-layout">
      <div class="puzzle-panel">
        <h4>Observation console</h4>
        <p class="puzzle-copy">Four beds. Four sleep stages. The selector must match each patient's chart.</p>
        <div class="console-columns">
          ${PATIENTS.map((patient, index) => `
            <div class="console-column">
              <div class="bed-color" style="color:${patient.color};background:${patient.color}"></div>
              <div class="bed-name">${patient.colorName} bed<br>${patient.name}</div>
              <button class="console-selector" data-bed="${index}" ${solved || chartsRead < 4 ? 'disabled' : ''}>${values[index]}</button>
              <div class="console-lights">
                ${STAGES.map((stage) => `<i class="${values[index] === stage ? 'on' : ''}"></i>`).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <div class="puzzle-readout"><span>Chart files read</span><strong>${chartsRead} / 4</strong></div>
        ${solved ? '<div class="console-solved-note">The console holds the pattern. The drawer is open.</div>' : ''}
        <div class="puzzle-notice" id="console-notice"></div>
      </div>
      <div class="puzzle-panel">
        <h4>A note beside the console</h4>
        <p class="puzzle-copy">“The Quiet Cure is not a sleep. It is a door. Each child holds one part of the pattern. The console will only open the drawer when all four agree.”</p>
        <p class="puzzle-copy"><em>If you have not read every chart in the Ward, the dials will not turn.</em></p>
        <div class="puzzle-readout"><span>Drawer</span><strong>${solved ? 'OPEN' : 'LOCKED'}</strong></div>
        <div class="puzzle-readout"><span>Brass key</span><strong>${state.hasItem('officeKey') ? 'TAKEN' : solved ? 'IN DRAWER' : 'HIDDEN'}</strong></div>
      </div>
    </div>
  `;

  const actions = [{ label: 'Leave the console', class: 'ghost' }];
  if (!solved) {
    actions.unshift({
      label: chartsRead < 4 ? `Need ${4 - chartsRead} more charts` : 'Set the dials',
      class: 'primary',
      disabled: chartsRead < 4,
      close: false,
      onClick: (uiRef, modalEl) => {
        const notice = modalEl.querySelector('#console-notice');
        const correct = PATIENTS.every((patient, index) => values[index] === patient.stage);
        if (correct) {
          state.data.consoleValues = [...values];
          state.setFlag('consoleSolved', true, { save: true });
          state.save();
          showConsoleKey(game.world);
          game.world.syncItemVisibility?.();
          game.audio.sting('bell');
          game.audio.play('safe_lock', { volume: 0.7 });
          game.notify('The console accepts the pattern. A drawer slides open.', 'good');
          game.ui.subtitle('The drawer is open. Something brass catches the light.', { whisper: true });
          uiRef.closeModal();
        } else {
          setNotice(notice, 'The console shudders. One of the stages is wrong. Check the charts.', 'bad');
          game.audio.play('impact', { volume: 0.3 });
          game.shake(0.06);
        }
      },
    });
  }

  return ui.openModal({
    kicker: 'Upper floor · observation room',
    title: 'The Sleep Console',
    sub: 'Four beds. Four stages. One pattern.',
    wide: true,
    body,
    actions,
    onMount: (el) => {
      el.querySelectorAll('[data-bed]').forEach((button) => {
        button.addEventListener('click', () => {
          if (button.disabled) return;
          const index = Number(button.dataset.bed);
          const next = (STAGES.indexOf(values[index]) + 1) % STAGES.length;
          values[index] = STAGES[next];
          button.textContent = values[index];
          state.data.consoleValues = [...values];
          game.audio.play('switch_click', { volume: 0.65 });
          const lights = button.parentElement.querySelectorAll('.console-lights i');
          lights.forEach((light, stageIndex) => light.classList.toggle('on', stageIndex === next));
        });
      });
    },
  });
}

/* ------------------------------------------------------------------ safe */

export function openSafe(ui) {
  const game = ui.game;
  const state = game.state;
  const solved = Boolean(state.flags.safeSolved);
  const mirrors = [...state.mirror];

  const positions = [
    { left: 29, top: 39 },
    { left: 53, top: 27 },
    { left: 37, top: 69 },
    { left: 68, top: 55 },
  ];

  const body = `
    <div class="mirror-layout">
      <div class="mirror-stage" id="mirror-stage">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <radialGradient id="moon-soft" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="rgba(226,228,198,0.85)" />
              <stop offset="100%" stop-color="rgba(143,168,161,0)" />
            </radialGradient>
          </defs>
          <circle cx="18" cy="18" r="13" fill="url(#moon-soft)" />
          <circle cx="18" cy="18" r="4.2" fill="#d9d6b8" opacity="0.8" />
          <path d="M18 2v4M18 30v4M2 18h4M30 18h4M7 7l3 3M26 26l3 3M29 7l-3 3M10 26l-3 3" stroke="rgba(214,212,183,0.35)" stroke-width="0.4" />
          <g stroke="rgba(160,181,173,0.18)" stroke-width="0.55" fill="none" id="mirror-beam-lines">
            <path d="M18 18 29 39 53 27 37 69 68 55 84.5 62" />
            <path d="M18 18 68 55 53 27 29 39 84.5 62" />
          </g>
          <g fill="none" stroke="rgba(183,165,124,0.16)" stroke-width="0.4">
            <rect x="6" y="6" width="88" height="88" />
            <path d="M6 41h88M6 62h88M41 6v88M62 6v88" opacity="0.4" />
          </g>
          <path d="M84.5 55c-3.2 4.1-5.4 6.6-5.4 9.1a5.4 5.4 0 0 0 10.8 0c0-2.5-2.2-5-5.4-9.1Z" fill="none" stroke="rgba(151,169,160,0.5)" stroke-width="0.7" />
        </svg>
        ${mirrors.map((value, index) => `<button class="mirror-btn" data-mirror="${index}" style="left:${positions[index].left}%;top:${positions[index].top}%">${value}</button>`).join('')}
        <div class="mirror-sigil${solved ? ' on' : ''}" id="mirror-sigil">
          <svg viewBox="0 0 40 40"><path d="M20 22C14 12 6 8 3 12c-3 4 3 11 13 12-9 2-13 8-10 10 3 3 11-2 14-9 3 7 11 12 14 9 3-2-1-8-10-10 10-1 16-8 13-12-3-4-11 0-17 10Z" fill="none" stroke="currentColor" stroke-width="1.1"/></svg>
        </div>
        <div class="mirror-order" id="mirror-order">
          ${mirrors.map((value) => `<span>${value}</span>`).join('')}
        </div>
      </div>
      <div class="puzzle-panel">
        <h4>The covered mirror</h4>
        <p class="puzzle-copy">Four brass leaves turn a quarter at a time. Guide the moonbeam into the moth at the right edge.</p>
        <p class="puzzle-copy"><em>Each mirror shows a slash. Turn them until the light agrees.</em></p>
        <div class="puzzle-readout"><span>Mirror leaves</span><strong id="mirror-count">${mirrors.join(' ')}</strong></div>
        <div class="puzzle-readout"><span>Sigil</span><strong id="sigil-readout">${solved ? 'AWAKE' : 'DARK'}</strong></div>
        <div class="puzzle-notice ${solved ? 'good' : ''}" id="safe-notice">${solved ? 'The safe hangs open. The Waking Key is inside.' : 'The moon waits for the right angles.'}</div>
      </div>
    </div>
  `;

  return ui.openModal({
    kicker: 'Matron’s office · wall safe',
    title: 'Moonlight Remembers',
    sub: solved ? 'The safe is open.' : 'A lock made of mirrors.',
    wide: true,
    body,
    actions: [{ label: solved ? 'Step away' : 'Leave the mirrors', class: 'ghost' }],
    onMount: (el) => {
      const notice = el.querySelector('#safe-notice');
      const order = el.querySelector('#mirror-order');
      const updateVisual = () => {
        el.querySelectorAll('[data-mirror]').forEach((button, index) => {
          button.textContent = mirrors[index];
          button.classList.toggle('solved', mirrors[index] === MIRROR_TARGET[index]);
        });
        order.innerHTML = mirrors.map((value, index) => `<span class="${value === MIRROR_TARGET[index] ? 'hit' : ''}">${value}</span>`).join('');
        el.querySelector('#mirror-count').textContent = mirrors.join(' ');
      };
      updateVisual();

      if (solved) {
        el.querySelectorAll('[data-mirror]').forEach((button) => { button.disabled = true; });
        return;
      }

      el.querySelectorAll('[data-mirror]').forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.mirror);
          mirrors[index] = mirrors[index] === '/' ? '\\' : '/';
          state.data.mirror = [...mirrors];
          updateVisual();
          game.audio.play('switch_click', { volume: 0.55 });
          const correct = mirrors.every((value, i) => value === MIRROR_TARGET[i]);
          if (correct) {
            state.setFlag('safeSolved', true, { save: true });
            state.save();
            openMirrorSafe(game.world);
            game.world.revealWakingKey();
            el.querySelector('#mirror-sigil')?.classList.add('on');
            const sigil = el.querySelector('#sigil-readout');
            if (sigil) sigil.textContent = 'AWAKE';
            setNotice(notice, 'The mirrors click into place. The safe opens with a sound like held breath.', 'good');
            game.audio.sting('bell');
            game.audio.play('safe_lock', { volume: 0.8 });
            game.notify('The wall safe opens. A brass key waits inside.', 'good');
            game.ui.flash(0.35);
            setTimeout(() => ui.closeModal(), 1200);
          } else {
            setNotice(notice, 'The beam scatters. Some angle is still wrong.', 'bad');
          }
        });
      });
    },
  });
}

/* ------------------------------------------------------------------ bell */

export function openBell(ui) {
  const game = ui.game;
  const state = game.state;
  const solved = Boolean(state.flags.bellSolved);
  let sequence = [];

  const body = `
    <div class="bell-layout">
      <div class="bell-visual">
        <svg class="bell-svg${solved ? ' ringing' : ''}" viewBox="0 0 120 200" aria-hidden="true">
          <path d="M60 14c-4 0-7 3-7 7 0 2 1 4 2 5-19 6-32 24-32 47v52l-10 20h94l-10-20V73c0-23-13-41-32-47 1-1 2-3 2-5 0-4-3-7-7-7Z" fill="currentColor" opacity="0.65" />
          <path d="M18 145h84" stroke="currentColor" stroke-width="3" opacity="0.6" />
          <circle cx="60" cy="145" r="4" fill="#0b0e0c" />
          <g class="clapper"><path d="M60 148v23" stroke="currentColor" stroke-width="2"/><circle cx="60" cy="175" r="6" fill="currentColor" opacity="0.7"/></g>
          <path d="M42 36c-9 10-14 23-14 37" stroke="rgba(215,201,163,0.35)" stroke-width="2" fill="none" />
        </svg>
      </div>
      <div class="puzzle-panel">
        <h4>The Waking Chord</h4>
        <p class="puzzle-copy">Four ropes. Eight notes. <em>Youngest first. Each note twice.</em></p>
        <div class="chord-slots" id="chord-slots">
          ${CHORD_TARGET.map((_, index) => `<span class="chord-slot" data-slot="${index}"></span>`).join('')}
        </div>
        <div class="rope-buttons" id="rope-buttons">
          ${['A', 'C', 'E', 'G'].map((note) => `<button class="rope" data-note="${note}">${note}<small>${note === 'A' ? 'ELSIE · 8' : note === 'C' ? 'ADA · 10' : note === 'E' ? 'TOBIAS · 11' : 'JONAH · 12'}</small></button>`).join('')}
        </div>
        <div class="puzzle-notice ${solved ? 'good' : ''}" id="bell-notice">${solved ? 'The Waking Chord is ringing. The front doors are open.' : 'The chalkboard calls it the Waking Chord. Youngest first. Each note twice.'}</div>
        <div class="puzzle-readout"><span>Bell loft</span><strong>${solved ? 'AWAKE' : 'WAITING'}</strong></div>
      </div>
    </div>
  `;

  return ui.openModal({
    kicker: 'Bell loft · above Observation',
    title: 'The Waking Chord',
    sub: solved ? 'The house is listening.' : 'Play it once, properly.',
    wide: true,
    body,
    actions: [{ label: solved ? 'Climb back down' : 'Step away from the ropes', class: 'ghost' }],
    onMount: (el) => {
      const slots = el.querySelectorAll('[data-slot]');
      const notice = el.querySelector('#bell-notice');
      const bellSvg = el.querySelector('.bell-svg');

      const render = () => {
        slots.forEach((slot, index) => {
          slot.textContent = sequence[index] || '';
          slot.classList.toggle('filled', Boolean(sequence[index]));
          slot.classList.toggle('next', !solved && index === sequence.length);
        });
      };
      render();

      if (solved) {
        sequence = [...CHORD_TARGET];
        render();
        el.querySelectorAll('.rope').forEach((button) => { button.disabled = true; });
        return;
      }

      el.querySelectorAll('.rope').forEach((button) => {
        button.addEventListener('click', () => {
          const note = button.dataset.note;
          const expected = CHORD_TARGET[sequence.length];
          if (note !== expected) {
            sequence = [];
            render();
            setNotice(notice, 'The bell answers with a flat, wrong sound. Start again: youngest first, each note twice.', 'bad');
            game.audio.play('bell_low', { volume: 0.4, rate: 0.7 });
            return;
          }
          sequence.push(note);
          render();
          const rate = note === 'A' ? 0.76 : note === 'C' ? 0.9 : note === 'E' ? 1.05 : 1.2;
          game.audio.play('bell_hand', { volume: 0.55, rate });
          bellSvg?.classList.add('ringing');
          setTimeout(() => bellSvg?.classList.remove('ringing'), 380);
          if (sequence.length === CHORD_TARGET.length) {
            state.setFlag('bellSolved', true, { save: true });
            state.save();
            game.onBellSolved?.();
            setNotice(notice, 'The chord resolves. Every bell in the house answers at once.', 'good');
            game.audio.play('bell_church', { volume: 0.8 });
            game.audio.sting('loud');
            game.ui.flash(0.8);
            setTimeout(() => ui.closeModal(), 1400);
          } else {
            setNotice(notice, 'The rope sounds. Keep the order.');
          }
        });
      });
    },
  });
}
