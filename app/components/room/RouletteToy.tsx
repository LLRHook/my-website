"use client";

import { useEffect, useRef, useState } from "react";
import { drawPocketIndex, frameIndex, ringPoint, ROULETTE_POCKETS, SPIN_MS, spinPlan, spinState } from "@/app/lib/roulette";
import { SCENE, type Variant } from "@/app/lib/room-scene";

export const RESULT_VISIBLE_MS = 2500;

export default function RouletteToy({ variant, reducedMotion }: { variant: Variant; reducedMotion: boolean }) {
  const rotor = useRef<HTMLDivElement>(null);
  const ball = useRef<HTMLSpanElement>(null);
  const spinning = useRef(false);
  const previousRotor = useRef(0);
  const animation = useRef<number | null>(null);
  const expiry = useRef<number | null>(null);
  const sprites = useRef(new Map<Variant, HTMLImageElement>());
  const [loaded, setLoaded] = useState<Variant[]>([]);
  const [spun, setSpun] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<(typeof ROULETTE_POCKETS)[number] | null>(null);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);
  const { crop, ballDiameter, columns, frames } = SCENE.roulette;
  const rows = Math.ceil(frames / columns);
  const initialPoint = ringPoint(0, SCENE.roulette.trackScale);

  useEffect(() => {
    const images = sprites.current;
    return () => {
      if (animation.current !== null) cancelAnimationFrame(animation.current);
      if (expiry.current !== null) window.clearTimeout(expiry.current);
      for (const image of images.values()) image.onload = null;
    };
  }, []);

  function preload() {
    if (sprites.current.has(variant)) return;
    const image = new Image();
    sprites.current.set(variant, image);
    image.onload = () => setLoaded((previous) => [...previous, variant]);
    image.src = `/room/roulette-${variant}.webp`;
  }

  function spin() {
    if (spinning.current) return;
    spinning.current = true;
    if (expiry.current !== null) window.clearTimeout(expiry.current);
    expiry.current = null;
    setVisible(true);
    preload();
    let index: number;
    try {
      index = drawPocketIndex();
    } catch {
      spinning.current = false;
      setError(true);
      return;
    }
    setError(false);
    setPending(true);
    setSpun(true);
    const plan = spinPlan(index);
    const startRotor = previousRotor.current;

    const apply = (t: number) => {
      const state = spinState(plan, index, t);
      const frame = frameIndex(startRotor + state.rotor);
      const col = frame % columns;
      const row = Math.floor(frame / columns);
      rotor.current!.style.backgroundPosition = `${col / (columns - 1) * 100}% ${row / (rows - 1) * 100}%`;
      const point = ringPoint(startRotor + state.angle, state.scale);
      ball.current!.style.left = `${(point[0] - crop.x) / crop.w * 100}%`;
      ball.current!.style.top = `${(point[1] - crop.y) / crop.h * 100}%`;
    };
    const finish = () => {
      previousRotor.current = startRotor + plan.rotorEnd;
      spinning.current = false;
      animation.current = null;
      setPending(false);
      setResult({ ...ROULETTE_POCKETS[index] });
      expiry.current = window.setTimeout(() => {
        setVisible(false);
        expiry.current = null;
      }, RESULT_VISIBLE_MS);
    };

    apply(0);
    if (reducedMotion) {
      apply(1);
      finish();
    } else {
      const start = performance.now();
      const animate = (now: number) => {
        const t = Math.min((now - start) / SPIN_MS, 1);
        apply(t);
        if (t < 1) animation.current = requestAnimationFrame(animate);
        else finish();
      };
      animation.current = requestAnimationFrame(animate);
    }
  }

  return (
    <>
      <div
        className="roulette-rotor"
        ref={rotor}
        data-ready={loaded.includes(variant) && spun}
        style={{
          backgroundImage: `image-set(url("/room/roulette-${variant}.avif") type("image/avif"), url("/room/roulette-${variant}.webp") type("image/webp"))`,
          backgroundSize: `${columns * 100}% ${rows * 100}%`,
          backgroundPosition: "0% 0%",
        }}
      />
      <span
        className="roulette-ball"
        ref={ball}
        data-variant={variant}
        style={{
          left: `${(initialPoint[0] - crop.x) / crop.w * 100}%`,
          top: `${(initialPoint[1] - crop.y) / crop.h * 100}%`,
          width: `${ballDiameter / crop.w * 100}%`,
        }}
      />
      <button
        className="roulette-spin"
        aria-label="Spin roulette wheel"
        aria-disabled={pending}
        aria-busy={pending}
        onPointerEnter={preload}
        onFocus={preload}
        onClick={spin}
      />
      <div className="roulette-result" data-visible={visible} role="status" aria-label="Roulette result" aria-live="polite" aria-atomic="true">
        {error ? <span>Couldn’t spin. Try again.</span> : pending ? <span>Spinning…</span> : result ? <strong data-color={result.color}>{result.number} · {result.color}</strong> : null}
      </div>
    </>
  );
}
