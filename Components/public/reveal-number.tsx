"use client";

import { useEffect, useState } from "react";

const randomDigit = () => String(Math.floor(Math.random() * 10));
const SETTLE_START = 1200; // ms before the first digit locks in
const SETTLE_STEP = 380; // ms between each digit locking in

const SIZES = {
  xl: "h-[clamp(4.5rem,11vw,9.5rem)] w-[clamp(3.5rem,8vw,7rem)] rounded-2xl text-[clamp(3rem,8vw,6.5rem)]",
  lg: "h-14 w-10 rounded-lg text-3xl sm:h-16 sm:w-12 sm:text-4xl",
  md: "h-11 w-8 rounded-lg text-2xl sm:h-12 sm:w-9",
  sm: "h-8 w-6 rounded-md text-lg",
};

const GAPS = { xl: "gap-[1.1vw]", lg: "gap-1.5", md: "gap-1.5", sm: "gap-1" };

const TONES = {
  navy: "bg-navy-900 text-white",
  crimson: "bg-crimson-600 text-white",
  white: "bg-white text-navy-900",
};

export function RevealNumber({
  value,
  animate = false,
  delay = 0,
  tone = "navy",
  size = "lg",
}: {
  value: string;
  animate?: boolean;
  delay?: number;
  tone?: keyof typeof TONES;
  size?: keyof typeof SIZES;
}) {
  // Winners already there when the page opened show instantly.
  // Winners drawn while you watch roll like a slot machine.
  const [shown, setShown] = useState<string[]>(() =>
    animate ? value.split("").map(() => "?") : value.split(""),
  );

  useEffect(() => {
    if (!animate) return;
    const digits = value.split("");

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = setTimeout(() => setShown(digits), delay);
      return () => clearTimeout(timer);
    }

    const startAt = Date.now() + delay;
    const lastSettle = SETTLE_START + (digits.length - 1) * SETTLE_STEP;
    const timer = setInterval(() => {
      const elapsed = Date.now() - startAt;
      if (elapsed < 0) return;
      setShown(
        digits.map((digit, i) => (elapsed >= SETTLE_START + i * SETTLE_STEP ? digit : randomDigit())),
      );
      if (elapsed >= lastSettle) clearInterval(timer);
    }, 70);
    return () => clearInterval(timer);
  }, [animate, value, delay]);

  return (
    <span role="img" aria-label={`Ticket number ${value}`} className={`inline-flex ${GAPS[size]}`}>
      {shown.map((digit, index) => (
        <span
          key={index}
          aria-hidden
          className={`flex items-center justify-center font-display font-bold tabular-nums shadow-md ${TONES[tone]} ${SIZES[size]}`}
        >
          {digit}
        </span>
      ))}
    </span>
  );
}