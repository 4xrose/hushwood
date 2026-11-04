const KEY_ACTIONS = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'back',
  ArrowDown: 'back',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  ControlLeft: 'crouch',
  KeyC: 'crouch',
  Space: 'breath',
  KeyE: 'interact',
  Enter: 'interact',
  KeyF: 'flashlight',
  Escape: 'pause',
  Tab: 'casebook',
  KeyJ: 'casebook',
  KeyM: 'map',
};

const BLOCK_DEFAULT = new Set([
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab',
]);

export class Input {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    this.keys = new Set();
    this.virtual = new Set();
    this.pressed = new Set();
    this.lookDX = 0;
    this.lookDY = 0;
    this.enabled = false;
    this.pointerLocked = false;
    this.touchEnabled = false;
    this.forceTouch = false;
    this.joy = { x: 0, y: 0, active: false, pointerId: null };
    this.lookPointer = null;
    this.lastPointer = { x: 0, y: 0 };
    this.joystick = null;
    this.knob = null;
    this.lookZone = null;
    this._bound = [];
    this._onLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.canvas.classList.toggle('pointer-locked', this.pointerLocked);
    };
    this._bind(document, 'pointerlockchange', this._onLockChange);
    this._bind(window, 'blur', () => this.clear());
    this._bind(document, 'keydown', (event) => this.onKeyDown(event));
    this._bind(document, 'keyup', (event) => this.onKeyUp(event));
    this._bind(document, 'mousemove', (event) => this.onMouseMove(event));
    this._bind(document, 'mousedown', (event) => this.onMouseDown(event));
    this._bind(canvas, 'contextmenu', (event) => event.preventDefault());
    this._bind(canvas, 'click', () => {
      if (this.enabled && !this.pointerLocked && !this.isTouch()) this.requestPointerLock();
    });
    this._bind(document, 'visibilitychange', () => {
      if (document.hidden) this.clear();
    });
    // Mobile browsers only allow fullscreen and orientation lock inside a
    // user gesture. The first tap anywhere is our one clean chance.
    this._immersiveRequested = false;
    this._bind(window, 'pointerdown', () => this.requestImmersive(), { once: true, passive: true });
  }

  requestImmersive() {
    if (this._immersiveRequested || !this.isTouch()) return;
    this._immersiveRequested = true;
    const root = document.documentElement;
    const request = root.requestFullscreen || root.webkitRequestFullscreen;
    const lock = () => {
      try {
        const orientation = window.screen?.orientation;
        const result = orientation?.lock?.('landscape');
        if (result?.catch) result.catch(() => {});
      } catch {
        // Safari and some Android shells do not expose orientation.lock.
      }
    };
    if (!request || document.fullscreenElement || document.webkitFullscreenElement) {
      lock();
      return;
    }
    try {
      const result = request.call(root, { navigationUI: 'hide' });
      if (result?.then) result.then(lock).catch(() => lock());
      else lock();
    } catch {
      lock();
    }
  }

  isTouch() {
    return this.touchEnabled || this.forceTouch || matchMedia('(pointer: coarse)').matches;
  }

  _bind(target, type, handler, options) {
    target.addEventListener(type, handler, options);
    this._bound.push([target, type, handler, options]);
  }

  bindTouch({ joystick, knob, lookZone, actionButtons }) {
    this.joystick = joystick;
    this.knob = knob;
    this.lookZone = lookZone;
    // The touch controls always exist in the DOM. Their presence must not make
    // a desktop browser think it is a phone; that would block pointer lock and
    // show virtual buttons on a mouse-and-keyboard machine.
    this.touchEnabled = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || '');

    if (joystick && knob) {
      const radius = 52;
      const updateJoy = (event) => {
        const rect = joystick.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        let dx = event.clientX - cx;
        let dy = event.clientY - cy;
        const len = Math.hypot(dx, dy);
        if (len > radius) {
          dx = (dx / len) * radius;
          dy = (dy / len) * radius;
        }
        this.joy.x = dx / radius;
        this.joy.y = dy / radius;
        knob.style.transform = `translate(${dx}px, ${dy}px)`;
      };
      const release = () => {
        this.joy.active = false;
        this.joy.pointerId = null;
        this.joy.x = 0;
        this.joy.y = 0;
        knob.style.transform = 'translate(0px, 0px)';
        joystick.classList.remove('active');
      };
      joystick.addEventListener('pointerdown', (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.joy.active = true;
        this.joy.pointerId = event.pointerId;
        joystick.setPointerCapture?.(event.pointerId);
        joystick.classList.add('active');
        updateJoy(event);
      });
      joystick.addEventListener('pointermove', (event) => {
        if (this.joy.active && event.pointerId === this.joy.pointerId) updateJoy(event);
      });
      joystick.addEventListener('pointerup', release);
      joystick.addEventListener('pointercancel', release);
      joystick.addEventListener('lostpointercapture', release);
    }

    if (lookZone) {
      lookZone.addEventListener('pointerdown', (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        this.lookPointer = event.pointerId;
        this.lastPointer.x = event.clientX;
        this.lastPointer.y = event.clientY;
        lookZone.setPointerCapture?.(event.pointerId);
      });
      lookZone.addEventListener('pointermove', (event) => {
        if (!this.enabled || event.pointerId !== this.lookPointer) return;
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        this.lastPointer.x = event.clientX;
        this.lastPointer.y = event.clientY;
        const sensitivity = 0.0029 * (this.settings.sensitivity ?? 1);
        this.lookDX += dx * sensitivity;
        this.lookDY += dy * sensitivity;
      });
      const endLook = (event) => {
        if (event.pointerId === this.lookPointer) this.lookPointer = null;
      };
      lookZone.addEventListener('pointerup', endLook);
      lookZone.addEventListener('pointercancel', endLook);
      lookZone.addEventListener('lostpointercapture', endLook);
    }

    for (const button of actionButtons || []) {
      const action = button.dataset.action;
      if (!action) continue;
      const hold = button.dataset.hold === 'true';
      const press = (event) => {
        if (!this.enabled) return;
        event.preventDefault();
        event.stopPropagation();
        button.classList.add('active');
        if (hold) {
          this.virtual.add(action);
        } else {
          this.pressed.add(action);
        }
      };
      const release = (event) => {
        button.classList.remove('active');
        if (hold) this.virtual.delete(action);
        if (event) event.stopPropagation();
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', () => release());
      button.addEventListener('contextmenu', (event) => event.preventDefault());
    }
  }

  requestPointerLock() {
    if (this.isTouch()) return;
    const promise = this.canvas.requestPointerLock?.();
    if (promise?.catch) promise.catch(() => {});
  }

  exitPointerLock() {
    if (document.pointerLockElement) document.exitPointerLock?.();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
      this.exitPointerLock();
    }
  }

  onKeyDown(event) {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (BLOCK_DEFAULT.has(event.code) && this.enabled) event.preventDefault();
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    if (!this.keys.has(action)) {
      this.pressed.add(action);
    }
    this.keys.add(action);
    if (event.code === 'Tab' && this.enabled) event.preventDefault();
  }

  onKeyUp(event) {
    const action = KEY_ACTIONS[event.code];
    if (!action) return;
    this.keys.delete(action);
  }

  onMouseMove(event) {
    if (!this.pointerLocked || !this.enabled) return;
    const sensitivity = 0.0022 * (this.settings.sensitivity ?? 1);
    this.lookDX += event.movementX * sensitivity;
    this.lookDY += event.movementY * sensitivity * (this.settings.invertY ? -1 : 1);
  }

  onMouseDown(event) {
    if (!this.enabled) return;
    if (event.button === 0 && this.pointerLocked) {
      this.pressed.add('interact');
    } else if (event.button === 0 && !this.pointerLocked && !this.isTouch()) {
      this.requestPointerLock();
    }
  }

  isDown(action) {
    return this.keys.has(action) || this.virtual.has(action);
  }

  consumePressed(action) {
    if (!this.pressed.has(action)) return false;
    this.pressed.delete(action);
    return true;
  }

  getMoveAxis() {
    let x = 0;
    let y = 0;
    if (this.isDown('right')) x += 1;
    if (this.isDown('left')) x -= 1;
    if (this.isDown('forward')) y += 1;
    if (this.isDown('back')) y -= 1;
    x += this.joy.x;
    y -= this.joy.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x, y, magnitude: Math.min(1, len) };
  }

  consumeLook() {
    const out = { x: this.lookDX, y: this.lookDY };
    this.lookDX = 0;
    this.lookDY = 0;
    return out;
  }

  endFrame() {
    this.pressed.clear();
  }

  clear() {
    this.keys.clear();
    this.virtual.clear();
    this.pressed.clear();
    this.joy.x = 0;
    this.joy.y = 0;
    this.joy.active = false;
    this.joy.pointerId = null;
    this.lookPointer = null;
    if (this.knob) this.knob.style.transform = 'translate(0px, 0px)';
    if (this.joystick) this.joystick.classList.remove('active');
  }

  dispose() {
    for (const [target, type, handler, options] of this._bound) {
      target.removeEventListener(type, handler, options);
    }
    this._bound.length = 0;
  }
}
