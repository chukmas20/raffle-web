export function Logo({
  tone = "dark",
  className = "",
}: {
  tone?: "dark" | "light";
  className?: string;
}) {
  const light = tone === "light";
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
        <rect width="34" height="34" rx="9" className="fill-crimson-600" />
        <path
          d="M9 12.5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.6a2.9 2.9 0 0 0 0 5.8v1.6a2 2 0 0 1-2 2H11a2 2 0 0 1-2-2v-1.6a2.9 2.9 0 0 0 0-5.8V12.5Z"
          fill="white"
        />
        <path
          d="M17 13.6l1.1 2.3 2.5.3-1.8 1.7.5 2.5-2.3-1.2-2.3 1.2.5-2.5-1.8-1.7 2.5-.3L17 13.6Z"
          className="fill-crimson-600"
        />
      </svg>
      <span
        className={`font-display text-lg font-bold tracking-tight ${light ? "text-white" : "text-navy-900"}`}
      >
        Raffle <span className={light ? "text-crimson-400" : "text-crimson-600"}>Angel</span>
      </span>
    </span>
  );
}