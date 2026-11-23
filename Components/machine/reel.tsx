const ROWS = Array.from({ length: 30 }, (_, i) => i % 10);

export function Reel({
  stripRef,
  lit,
}: {
  stripRef: (element: HTMLDivElement | null) => void;
  lit: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* silver bezel */}
      <div className="rounded-2xl bg-gradient-to-b from-white via-navy-100 to-navy-300 p-[0.5vw] shadow-lg">
        <div className="rounded-xl bg-navy-900 p-[0.3vw]">
          <div
            aria-hidden
            className="relative h-[var(--reel-h)] w-[var(--reel-w)] overflow-hidden rounded-lg bg-white"
          >
            <div ref={stripRef} className="will-change-transform" style={{ height: "3000%" }}>
              {ROWS.map((digit, row) => (
                <div
                  key={row}
                  className="flex items-center justify-center font-display font-bold tabular-nums text-navy-900"
                  style={{ height: `${100 / 30}%`, fontSize: "calc(var(--reel-h) * 0.62)" }}
                >
                  {digit}
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-navy-900/40 via-transparent to-navy-900/40" />
          </div>
        </div>
      </div>

      {/* light under each reel: it lights up when that reel has landed */}
      <div className="flex h-9 items-center">
        <span
          aria-hidden
          className={`size-[clamp(0.9rem,1.4vw,1.4rem)] rounded-full transition ${
            lit ? "bg-white shadow-[0_0_16px_4px_rgba(255,255,255,0.85)]" : "bg-navy-700"
          }`}
        />
      </div>
    </div>
  );
}