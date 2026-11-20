// Unified Cross-Platform Input Manager: Keyboard, Mouse, and Touch Controls
export interface InputState {
  // Normalized 2D movement vector (-1 to 1)
  moveVector: { x: number; y: number };
  // Key states
  keys: {
    up: boolean;
    down: boolean;
    left: boolean;
    right: boolean;
    space: boolean;
    shift: boolean;
    e: boolean;
    f: boolean;
    r: boolean;
    escape: boolean;
  };
  // Mouse / Pointer
  pointer: {
    x: number;
    y: number;
    isDown: boolean;
    isRightDown: boolean;
  };
  // Mobile Touch Context Buttons
  buttons: {
    jump: boolean;
    action: boolean;
    special: boolean;
  };
}

export class InputManager {
  private state: InputState = {
    moveVector: { x: 0, y: 0 },
    keys: {
      up: false,
      down: false,
      left: false,
      right: false,
      space: false,
      shift: false,
      e: false,
      f: false,
      r: false,
      escape: false,
    },
    pointer: { x: 0, y: 0, isDown: false, isRightDown: false },
    buttons: { jump: false, action: false, special: false },
  };

  private listeners: ((state: InputState) => void)[] = [];
  private attachedElement: HTMLElement | null = null;
  public isTouchDevice = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isTouchDevice =
        'ontouchstart' in window || navigator.maxTouchPoints > 0;
      this.bindKeyboardEvents();
    }
  }

  attachToCanvas(container: HTMLElement) {
    this.attachedElement = container;
    this.bindPointerEvents(container);
  }

  detach() {
    this.unbindKeyboardEvents();
    this.attachedElement = null;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    let updated = false;

    // Movement
    if (key === 'w' || key === 'arrowup') {
      this.state.keys.up = true;
      updated = true;
    } else if (key === 's' || key === 'arrowdown') {
      this.state.keys.down = true;
      updated = true;
    } else if (key === 'a' || key === 'arrowleft') {
      this.state.keys.left = true;
      updated = true;
    } else if (key === 'd' || key === 'arrowright') {
      this.state.keys.right = true;
      updated = true;
    }

    // Actions
    if (e.code === 'Space') {
      this.state.keys.space = true;
      this.state.buttons.jump = true;
      updated = true;
    } else if (e.key === 'Shift') {
      this.state.keys.shift = true;
      updated = true;
    } else if (key === 'e') {
      this.state.keys.e = true;
      this.state.buttons.action = true;
      updated = true;
    } else if (key === 'f') {
      this.state.keys.f = true;
      this.state.buttons.special = true;
      updated = true;
    } else if (key === 'r') {
      this.state.keys.r = true;
      updated = true;
    } else if (key === 'escape' || key === 'p') {
      this.state.keys.escape = true;
      updated = true;
    }

    if (updated) {
      this.recalculateMoveVector();
      this.emitChange();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    let updated = false;

    if (key === 'w' || key === 'arrowup') {
      this.state.keys.up = false;
      updated = true;
    } else if (key === 's' || key === 'arrowdown') {
      this.state.keys.down = false;
      updated = true;
    } else if (key === 'a' || key === 'arrowleft') {
      this.state.keys.left = false;
      updated = true;
    } else if (key === 'd' || key === 'arrowright') {
      this.state.keys.right = false;
      updated = true;
    }

    if (e.code === 'Space') {
      this.state.keys.space = false;
      this.state.buttons.jump = false;
      updated = true;
    } else if (e.key === 'Shift') {
      this.state.keys.shift = false;
      updated = true;
    } else if (key === 'e') {
      this.state.keys.e = false;
      this.state.buttons.action = false;
      updated = true;
    } else if (key === 'f') {
      this.state.keys.f = false;
      this.state.buttons.special = false;
      updated = true;
    } else if (key === 'r') {
      this.state.keys.r = false;
      updated = true;
    } else if (key === 'escape' || key === 'p') {
      this.state.keys.escape = false;
      updated = true;
    }

    if (updated) {
      this.recalculateMoveVector();
      this.emitChange();
    }
  };

  private recalculateMoveVector() {
    let x = 0;
    let y = 0;
    if (this.state.keys.left) x -= 1;
    if (this.state.keys.right) x += 1;
    if (this.state.keys.up) y -= 1;
    if (this.state.keys.down) y += 1;

    // Normalize diagonal
    if (x !== 0 && y !== 0) {
      const len = Math.sqrt(x * x + y * y);
      x /= len;
      y /= len;
    }

    this.state.moveVector = { x, y };
  }

  private bindKeyboardEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private unbindKeyboardEvents() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private bindPointerEvents(element: HTMLElement) {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      this.state.pointer.x = e.clientX - rect.left;
      this.state.pointer.y = e.clientY - rect.top;
      this.emitChange();
    });

    element.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.state.pointer.isDown = true;
      if (e.button === 2) this.state.pointer.isRightDown = true;
      this.emitChange();
    });

    element.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.state.pointer.isDown = false;
      if (e.button === 2) this.state.pointer.isRightDown = false;
      this.emitChange();
    });
  }

  // Mobile Touch Joystick Setter
  setTouchMoveVector(x: number, y: number) {
    this.state.moveVector = { x, y };
    this.state.keys.left = x < -0.3;
    this.state.keys.right = x > 0.3;
    this.state.keys.up = y < -0.3;
    this.state.keys.down = y > 0.3;
    this.emitChange();
  }

  // Mobile Touch Button Setter
  setTouchButton(button: 'jump' | 'action' | 'special', isPressed: boolean) {
    this.state.buttons[button] = isPressed;
    if (button === 'jump') this.state.keys.space = isPressed;
    if (button === 'action') this.state.keys.e = isPressed;
    if (button === 'special') this.state.keys.f = isPressed;

    if (isPressed && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15); // soft haptic feedback
      } catch {}
    }
    this.emitChange();
  }

  getState(): InputState {
    return this.state;
  }

  subscribe(listener: (state: InputState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }

  private emitChange() {
    this.listeners.forEach((fn) => fn(this.state));
  }
}

export const inputManager = new InputManager();
