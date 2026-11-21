import { RUNNER_CONFIG } from "./config";
import type { RunnerAction } from "./types";

type ActionHandler = (action: RunnerAction) => void;

export class InputController {
  private pointerStart: { x: number; y: number; id: number; time: number } | null = null;
  private readonly pressedKeys = new Set<string>();

  private readonly onKeyDown = (event: KeyboardEvent) => {
    const target = event.target;
    if (target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target.tagName))) return;

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
    if (event.repeat || this.pressedKeys.has(key)) return;
    this.pressedKeys.add(key);
    this.handler(action);
  };

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(event.key.toLowerCase());
  };

  private readonly onWindowBlur = () => {
    this.pressedKeys.clear();
    this.pointerStart = null;
  };

  private readonly onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || (event.pointerType === "mouse" && event.button !== 0)) return;
    this.pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId, time: performance.now() };
    try {
      this.element.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is an enhancement; swipe tracking still works without it.
    }
  };

  private readonly onPointerUp = (event: PointerEvent) => {
    const start = this.pointerStart;
    if (!start || start.id !== event.pointerId) return;
    this.pointerStart = null;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    const elapsed = performance.now() - start.time;
    const rect = this.element.getBoundingClientRect();
    const threshold = Math.max(RUNNER_CONFIG.movement.inputSwipeThreshold, Math.min(54, Math.min(rect.width, rect.height) * 0.065));
    if (elapsed > 900 || Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return;

    // Require a clear direction so diagonal movement doesn't trigger the wrong action.
    if (Math.abs(dx) > Math.abs(dy) * 1.18) this.handler(dx > 0 ? "right" : "left");
    else if (Math.abs(dy) > Math.abs(dx) * 1.18) this.handler(dy < 0 ? "jump" : "slide");
  };

  private readonly onPointerCancel = (event: PointerEvent) => {
    if (this.pointerStart?.id === event.pointerId) this.pointerStart = null;
  };

  constructor(private readonly element: HTMLElement, private readonly handler: ActionHandler) {}

  attach(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onWindowBlur);
    this.element.addEventListener("pointerdown", this.onPointerDown, { passive: true });
    this.element.addEventListener("pointerup", this.onPointerUp, { passive: true });
    this.element.addEventListener("pointercancel", this.onPointerCancel, { passive: true });
    this.element.addEventListener("lostpointercapture", this.onPointerCancel, { passive: true });
  }

  detach(): void {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onWindowBlur);
    this.element.removeEventListener("pointerdown", this.onPointerDown);
    this.element.removeEventListener("pointerup", this.onPointerUp);
    this.element.removeEventListener("pointercancel", this.onPointerCancel);
    this.element.removeEventListener("lostpointercapture", this.onPointerCancel);
    this.pressedKeys.clear();
    this.pointerStart = null;
  }
}
