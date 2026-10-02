const STEP = 1 / 60;

export function startLoop(update: (dt: number) => void, draw: () => void, onError: (error: unknown) =>
  void): () => void {
  let previous = performance.now();
  let accumulator = 0;
  let handle = 0;
  let running = true;
  const reset = () => {
    previous = performance.now();
    accumulator = 0;
  };
  document.addEventListener("visibilitychange", reset);
  const frame = (now: number) => {
    if (!running) {
      return;
    }
    try {
      if (!document.hidden) {
        accumulator += Math.min((now - previous) / 1000, 0.1);
        while (accumulator >= STEP) {
          update(STEP);
          accumulator -= STEP;
        }
        draw();
      }
      previous = now;
      handle = requestAnimationFrame(frame);
    } catch (error) {
      stop();
      onError(error);
    }
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(handle);
    document.removeEventListener("visibilitychange", reset);
  };
  handle = requestAnimationFrame(frame);
  return stop;
}
