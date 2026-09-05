"use client";

import { useEffect, type RefObject } from "react";

const SETTLE_DISTANCE = 0.001;
const RESPONSE_MS = 145;
const TOUCH_REST_MS = 950;

/** Pointer attention for the room, with no animation frame running at rest. */
export default function useRoomMotion(ref: RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    const stage = ref.current;
    if (!stage) return;

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let frame: number | null = null;
    let touchRest: ReturnType<typeof setTimeout> | null = null;
    let previousTime: number | null = null;
    let disposed = false;

    function write() {
      stage!.style.setProperty("--room-look-x", x.toFixed(4));
      stage!.style.setProperty("--room-look-y", y.toFixed(4));
    }

    function cancelTouchRest() {
      if (touchRest !== null) clearTimeout(touchRest);
      touchRest = null;
    }

    function reset() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
      cancelTouchRest();
      x = y = targetX = targetY = 0;
      write();
    }

    stage.dataset.roomMotion = "still";
    write();
    if (!active) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let allowed = !motionPreference.matches && !document.hidden;
    stage.dataset.roomMotion = allowed ? "active" : "still";

    function interpolate(time: number) {
      frame = null;
      if (disposed || !allowed) return;
      // Bound a delayed frame so returning to the page never causes a jump.
      const elapsed = previousTime === null ? 16 : Math.min(40, Math.max(8, time - previousTime));
      previousTime = time;
      const fraction = 1 - Math.exp(-elapsed / RESPONSE_MS);
      x += (targetX - x) * fraction;
      y += (targetY - y) * fraction;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < SETTLE_DISTANCE;
      if (settled) {
        x = targetX;
        y = targetY;
        previousTime = null;
      }
      write();
      if (!settled) frame = requestAnimationFrame(interpolate);
    }

    function aim(nextX: number, nextY: number) {
      if (disposed || !allowed) return;
      targetX = nextX;
      targetY = nextY;
      if (frame === null && (x !== targetX || y !== targetY)) frame = requestAnimationFrame(interpolate);
    }

    function aimAtPointer(event: PointerEvent) {
      if (disposed || !allowed) return;
      const bounds = stage!.getBoundingClientRect();
      if (!bounds.width || !bounds.height) return;
      const clamp = (value: number) => Math.max(-1, Math.min(1, value));
      aim(clamp(((event.clientX - bounds.left) / bounds.width) * 2 - 1), clamp(((event.clientY - bounds.top) / bounds.height) * 2 - 1));
    }

    function pointerMove(event: PointerEvent) {
      if (event.pointerType && event.pointerType !== "mouse") return;
      cancelTouchRest();
      aimAtPointer(event);
    }

    function pointerDown(event: PointerEvent) {
      if (disposed || !allowed) return;
      cancelTouchRest();
      aimAtPointer(event);
      if (event.pointerType === "touch" || event.pointerType === "pen") {
        touchRest = setTimeout(() => {
          touchRest = null;
          aim(0, 0);
        }, TOUCH_REST_MS);
      }
    }

    function pointerLeave(event: PointerEvent) {
      // Touch browsers send pointerleave after a tap; let its short response finish.
      if (touchRest !== null && (event.pointerType === "touch" || event.pointerType === "pen")) return;
      cancelTouchRest();
      aim(0, 0);
    }

    function pointerCancel() {
      cancelTouchRest();
      aim(0, 0);
    }

    function updateEnvironment() {
      allowed = !motionPreference.matches && !document.hidden;
      stage!.dataset.roomMotion = allowed ? "active" : "still";
      if (!allowed) reset();
    }

    stage.addEventListener("pointermove", pointerMove, { passive: true });
    stage.addEventListener("pointerdown", pointerDown, { passive: true });
    stage.addEventListener("pointerleave", pointerLeave, { passive: true });
    stage.addEventListener("pointercancel", pointerCancel, { passive: true });
    motionPreference.addEventListener("change", updateEnvironment);
    document.addEventListener("visibilitychange", updateEnvironment);

    return () => {
      disposed = true;
      stage.removeEventListener("pointermove", pointerMove);
      stage.removeEventListener("pointerdown", pointerDown);
      stage.removeEventListener("pointerleave", pointerLeave);
      stage.removeEventListener("pointercancel", pointerCancel);
      motionPreference.removeEventListener("change", updateEnvironment);
      document.removeEventListener("visibilitychange", updateEnvironment);
      reset();
      stage.dataset.roomMotion = "still";
    };
  }, [ref, active]);
}
