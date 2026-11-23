"use client";

import { useEffect, useState } from "react";

const COLORS = ["#d8222f", "#ffffff", "#ff6670", "#4f67a2", "#c9d5ec"];

type Piece = {
  id: number;
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  drift: number;
};

export function Confetti({
  startDelay = 0,
  count = 70,
  spread = 1.2,
}: {
  startDelay?: number;
  count?: number;
  spread?: number;
}) {
  const [pieces] = useState<Piece[]>(() =>
    Array.from({ length: count }, (_, id) => ({
      id,
      left: Math.random() * 100,
      size: 6 + Math.random() * 8,
      color: COLORS[id % COLORS.length],
      duration: 3.5 + Math.random() * 2.5,
      delay: startDelay + Math.random() * spread,
      drift: (Math.random() - 0.5) * 20,
    })),
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), (startDelay + spread + 7) * 1000);
    return () => clearTimeout(timer);
  }, [startDelay, spread]);

  if (done) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className="confetti-piece absolute top-0 block rounded-[2px]"
          style={
            {
              left: `${piece.left}%`,
              width: piece.size,
              height: piece.size * 0.45,
              backgroundColor: piece.color,
              opacity: 0,
              animation: `confetti-fall ${piece.duration}s ${piece.delay}s linear forwards`,
              "--drift": `${piece.drift}vw`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}