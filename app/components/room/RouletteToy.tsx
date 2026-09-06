"use client";

import { useEffect, useRef, useState } from "react";
import { drawPocketIndex, landingRotation, POCKET_ANGLE, ROULETTE_POCKETS, SPIN_DURATION_MS } from "@/app/lib/roulette";
import "./roulette.css";

type Round = (typeof ROULETTE_POCKETS)[number];
export const RESULT_VISIBLE_MS = 2500;
const FILL = { red: "#a35040", black: "#34473c", green: "#59733f" };
const halfAngle = POCKET_ANGLE * Math.PI / 360;
function point(radius: number, direction: number) {
  return `${180 + radius * Math.sin(halfAngle * direction)} ${180 - radius * Math.cos(halfAngle)}`;
}
const pocketPath = `M ${point(151, -1)} A 151 151 0 0 1 ${point(151, 1)} L ${point(111, 1)} A 111 111 0 0 0 ${point(111, -1)} Z`;

export default function RouletteToy({ moving }: { moving: boolean }) {
  const [rotation, setRotation] = useState(0);
  const [pending, setPending] = useState<Round | null>(null);
  const [result, setResult] = useState<Round | null>(null);
  const [expired, setExpired] = useState(false);
  const spinning = useRef(false);
  const [error, setError] = useState(false);
  const [round, setRound] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [previousMoving, setPreviousMoving] = useState(moving);

  // A pause changes the rendered round immediately, before another frame paints.
  if (previousMoving !== moving) {
    setPreviousMoving(moving);
    if (!moving) {
      setCelebrating(false);
      if (pending) {
        setResult(pending);
        setPending(null);
      }
    }
  }

  useEffect(() => {
    if (!pending) { spinning.current = false; return; }
    const finish = () => {
      setResult(pending);
      setCelebrating(moving);
      setPending(null);
      spinning.current = false;
    };
    const timer = window.setTimeout(finish, SPIN_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [pending, moving]);

  useEffect(() => {
    if (!result || pending || error) return;
    const timer = window.setTimeout(() => setExpired(true), RESULT_VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [result, pending, error]);

  function spin() {
    if (spinning.current) return;
    spinning.current = true;
    setExpired(false);
    let index: number;
    try { index = drawPocketIndex(); } catch { spinning.current = false; setError(true); return; }
    setError(false);
    setCelebrating(false);
    setRound(previous => previous + 1);
    const pocket = ROULETTE_POCKETS[index];
    setRotation(previous => landingRotation(previous, index));
    if (moving) setPending(pocket);
    else {
      // A new object restarts result expiry even when two spins land together.
      setResult({ ...pocket });
      spinning.current = false;
    }
  }

  return <div className="roulette-desk target-roulette">
      <button className="roulette-wheel" aria-label="Spin roulette wheel" aria-disabled={pending !== null} aria-busy={pending !== null} onClick={spin} data-spinning={pending !== null && moving}>
        <svg viewBox="0 0 360 360" preserveAspectRatio="none" aria-hidden="true">
          <circle cx="180" cy="185" r="171" fill="#493c2c" opacity=".12" />
          <circle cx="180" cy="180" r="170" fill="#9d8059" />
          <circle cx="180" cy="180" r="163" fill="#d6bd87" stroke="#eadbb7" strokeWidth="2" />
          <circle cx="180" cy="180" r="154" fill="#f6e8c7" />
          <g className="roulette-rotor" style={{ transform: `rotate(${rotation}deg)`, transitionDuration: `${SPIN_DURATION_MS}ms` }}>
            {ROULETTE_POCKETS.map((pocket, index) => <g key={pocket.number} transform={`rotate(${index * POCKET_ANGLE} 180 180)`}>
              <path d={pocketPath} fill={FILL[pocket.color]} stroke="#e6d5af" strokeWidth=".75" />
              <text x="180" y="49" textAnchor="middle" dominantBaseline="middle" fill="#fff8e7" fontSize="12" fontWeight="600">{pocket.number}</text>
            </g>)}
            <circle cx="180" cy="180" r="109" fill="#bf9e70" stroke="#e3cfa1" strokeWidth="3" />
            <circle cx="180" cy="180" r="91" fill="#aa895d" stroke="#99764e" strokeWidth="1" />
            <path d="M180 104v152M104 180h152" stroke="#dac18e" strokeWidth="5" strokeLinecap="round" />
            <circle cx="180" cy="180" r="29" fill="#d8bf87" stroke="#f4e4bd" strokeWidth="2" />
            <circle cx="180" cy="180" r="13" fill="#af8b53" />
          </g>
          <path d="m169 11 11 20 11-20" fill="#f9efd4" stroke="#907344" strokeWidth="1.5" />
          <circle cx="180" cy="74" r="5" fill="#fffaf0" stroke="#7b715c" strokeWidth="1" />
        </svg>
      </button>
      {!pending && celebrating && moving && <div key={round} className="roulette-confetti" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <i key={index} style={{ transform: `rotate(${index * 45}deg)` }}><b /></i>)}</div>}
      <div className="roulette-result" data-visible={(pending !== null || result !== null || error) && !expired} data-still={!moving} role="status" aria-label="Roulette result" aria-live="polite" aria-atomic="true">
        {error ? <span>Couldn’t spin. Try again.</span> : pending ? <span>Spinning…</span> : result ? <strong data-color={result.color}>{result.number} · {result.color}</strong> : null}
      </div>
  </div>;
}
