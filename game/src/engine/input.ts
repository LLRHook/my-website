export const BUTTONS = ["up", "down", "left", "right", "a", "b", "start", "select"] as const;

export type Button = typeof BUTTONS[number];

const KEYS: Readonly<Record<string, Button>> = {
  ArrowUp: "up", KeyW: "up", ArrowDown: "down", KeyS: "down", ArrowLeft: "left", KeyA: "left",
    ArrowRight: "right", KeyD: "right",
  KeyZ: "a", Space: "a", KeyX: "b", Backspace: "b", ShiftLeft: "b", ShiftRight: "b", Enter: "start", Tab: "select",
};

export class Input {
  private readonly keys = new Set<string>();
  private readonly pointers = new Map<number, Button>();
  private readonly pending = new Set<Button>();
  private readonly edges = new Set<Button>();
  private readonly frames = new Map<Button, number>();

  constructor(private readonly root: HTMLElement, private readonly activate: () => void) {
    root.addEventListener("pointerdown", () => root.focus({
      preventScroll: true
    }));
    document.addEventListener("pointerdown", (event) => {
      if (!root.contains(event.target as Node)) {
        this.release();
      }
    });
    document.addEventListener("keydown", (event) => {
      if (!this.focused) {
        return;
      }
      if (event.code === "Escape") {
        this.release();
        return;
      }
      const button = KEYS[event.code];
      if (!button) {
        return;
      }
      event.preventDefault();
      if (!this.keys.has(event.code)) {
        this.pending.add(button);
        this.activate();
      }
      this.keys.add(event.code);
    });
    document.addEventListener("keyup", (event) => {
      if (this.focused && KEYS[event.code]) {
        event.preventDefault();
      }
      this.keys.delete(event.code);
    });
    root.addEventListener("blur", () => this.clear());
    window.addEventListener("blur", () => this.clear());
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.clear();
      }
    });
    for (const element of root.querySelectorAll<HTMLButtonElement>("[data-button]")) {
      const button = element.dataset.button as Button;
      if (!BUTTONS.includes(button)) {
        continue;
      }
      element.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        root.focus({
          preventScroll: true
        });
        element.setPointerCapture(event.pointerId);
        this.pointers.set(event.pointerId, button);
        this.pending.add(button);
        this.activate();
      });
      for (const name of ["pointerup", "pointercancel", "pointerleave", "lostpointercapture"] as const) {
        element.addEventListener(name, (event) => {
          this.pointers.delete(event.pointerId);
        });
      }
    }
  }
  private get focused(): boolean {
    return document.activeElement === this.root;
  }

  private clear(): void {
    this.keys.clear();
    this.pointers.clear();
    this.pending.clear();
    this.edges.clear();
    this.frames.clear();
  }

  private release(): void {
    this.root.blur();
    this.clear();
  }

  update(): void {
    this.edges.clear();
    const down = new Set<Button>();
    if (this.focused) {
      for (const code of this.keys) {
        down.add(KEYS[code]);
      }
      for (const button of this.pointers.values()) {
        down.add(button);
      }
      for (const pad of navigator.getGamepads?.() ?? []) {
        if (!pad || pad.mapping !== "standard") {
          continue;
        }
        const mapping: [
          number,
          Button
        ][] = [[12, "up"], [13, "down"], [14, "left"], [15, "right"], [0, "a"], [1, "b"], [9, "start"], [8, "select"]];
        for (const [index, button] of mapping) {
          if (pad.buttons[index]?.pressed) {
            down.add(button);
          }
        }
        if (pad.axes[0] < -0.5) {
          down.add("left");
        }
        if (pad.axes[0] > 0.5) {
          down.add("right");
        }
        if (pad.axes[1] < -0.5) {
          down.add("up");
        }
        if (pad.axes[1] > 0.5) {
          down.add("down");
        }
      }
    }
    for (const button of BUTTONS) {
      const previous = this.frames.get(button) ?? 0;
      if (this.pending.has(button) || (down.has(button) && previous === 0)) {
        this.edges.add(button);
        this.activate();
      }
      this.frames.set(button, down.has(button) ? previous + 1 : 0);
    }
    this.pending.clear();
  }

  isDown(button: Button): boolean {
    return (this.frames.get(button) ?? 0) > 0;
  }

  pressed(button: Button): boolean {
    return this.edges.has(button);
  }

  repeat(button: Button): boolean {
    const frames = this.frames.get(button) ?? 0;
    return this.pressed(button) || (frames >= 19 && (frames - 19) % 4 === 0);
  }
}
