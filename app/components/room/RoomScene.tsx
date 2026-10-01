"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { boxStyle, SCENE, srcSet, variantFor, type Variant } from "@/app/lib/room-scene";
import { HOTSPOTS, type Hotspot } from "./hotspots";
import "./room-scene.css";

function SceneImage({ variant }: { variant: Variant }) {
  const [initial] = useState(variant);
  const loaded = useRef(new Set<Variant>());
  const [requested, setRequested] = useState<Variant[]>([variant]);
  const [shown, setShown] = useState<Variant>(variant);

  const markLoaded = (v: Variant) => {
    loaded.current.add(v);
    if (v === variant) setShown(v);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- A new lighting prop must request its image before onLoad can switch the still.
    setRequested((previous) => previous.includes(variant) ? previous : [...previous, variant]);
    if (loaded.current.has(variant)) setShown(variant);
  }, [variant]);

  useEffect(() => {
    let idle: number | undefined;
    let timer: number | undefined;
    const prefetch = () => setRequested((previous) => [
      ...previous,
      ...SCENE.variants.filter((v) => !previous.includes(v)),
    ]);
    const schedule = () => {
      if (typeof window.requestIdleCallback === "function") idle = window.requestIdleCallback(prefetch);
      else timer = window.setTimeout(prefetch, 1500);
    };
    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });
    return () => {
      window.removeEventListener("load", schedule);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, []);

  return requested.map((v) => (
    <picture key={v}>
      <source type="image/avif" srcSet={srcSet(v, "avif")} />
      <source type="image/webp" srcSet={srcSet(v, "webp")} />
      <img
        ref={(img) => {
          if (img?.complete && img.naturalWidth > 0) markLoaded(v);
        }}
        src={`/room/${v}-1920.webp`}
        sizes="(max-width: 700px) 1140px, min(100vw, 1440px)"
        width={2560}
        height={1440}
        alt=""
        decoding="async"
        fetchPriority={v === initial ? "high" : "low"}
        data-active={v === shown}
        onLoad={() => markLoaded(v)}
      />
    </picture>
  ));
}

export default function RoomScene({ night, lamp, screen, roulette, onHotspot, screenRef }: {
  night: boolean;
  lamp: boolean;
  screen: ReactNode;
  roulette: ReactNode;
  onHotspot: (hotspot: Hotspot, trigger: HTMLButtonElement) => void;
  screenRef: RefObject<HTMLDivElement | null>;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const { tl, br } = SCENE.screen;
  const screenBox = { x: tl[0], y: tl[1], w: br[0] - tl[0], h: br[1] - tl[1] };

  useEffect(() => {
    const scene = sceneRef.current!;
    const stage = scene.parentElement!;
    if (stage.scrollWidth > stage.clientWidth) {
      stage.scrollLeft = (SCENE.screen.tl[0] + SCENE.screen.br[0]) / 2 * scene.clientWidth - stage.clientWidth / 2;
    }
    const hideHint = () => { scene.dataset.scrolled = "true"; };
    stage.addEventListener("scroll", hideHint, { once: true });
    return () => stage.removeEventListener("scroll", hideHint);
  }, []);

  return (
    <div className="room-scene" ref={sceneRef}>
      <SceneImage variant={variantFor(night, lamp)} />
      {HOTSPOTS.map((hotspot) => (
        <button
          key={hotspot.name}
          type="button"
          className="hotspot"
          style={boxStyle(SCENE.hotspots[hotspot.name])}
          aria-label={typeof hotspot.label === "string" ? hotspot.label : hotspot.label({ night, lamp })}
          aria-pressed={hotspot.action.kind === "toggle" ? { night, lamp }[hotspot.action.target] : undefined}
          onClick={(event) => onHotspot(hotspot, event.currentTarget)}
        >
          <span className="hotspot-label">{hotspot.short}</span>
        </button>
      ))}
      <div className="scene-screen" ref={screenRef} tabIndex={-1} style={boxStyle(screenBox)}>
        {screen}
      </div>
      <div className="scene-roulette" style={boxStyle(SCENE.roulette.crop)}>
        {roulette}
      </div>
      <p className="scene-swipe-hint" aria-hidden="true">Swipe to look around</p>
    </div>
  );
}
