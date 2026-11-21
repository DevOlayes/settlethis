import type { RunnerAction } from "./types";

type ActionHandler = (action: RunnerAction) => void;

export class InputController {
  private pointerStart: { x: number; y: number } | null = null;
  private readonly onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))) return;

    const key = event.key.toLowerCase();
    const actions: Record<string, RunnerAction> = {
      arrowleft: "left", a: "left",
      arrowright: "right", d: "right",
      arrowup: "jump", w: "jump", " ": "jump",
      arrowdown: "slide", s: "slide",
    };
    const action = actions[key];
    if (!action) return;
    event.preventDefault();
    this.handler(action);
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    this.pointerStart = { x: event.clientX, y: event.clientY };
    this.element.setPointerCapture?.(event.pointerId);
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    if (!this.pointerStart) return;
    const dx = event.clientX - this.pointerStart.x;
    const dy = event.clientY - this.pointerStart.y;
    this.pointerStart = null;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
    if (Math.abs(dx) > Math.abs(dy)) this.handler(dx > 0 ? "right" : "left");
    else this.handler(dy < 0 ? "jump" : "slide");
  };

  constructor(private readonly element: HTMLElement, private readonly handler: ActionHandler) {}

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    this.element.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    this.element.addEventListener("pointerup", this.onPointerUp, { passive: true });
    this.element.addEventListener("pointercancel", this.onPointerUp, { passive: true });
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerUp);
    this.pointerStart = null;
  }
}
