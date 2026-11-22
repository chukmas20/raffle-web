import type { CategoryStatus, DrawStatus, TicketStatus } from "@/types/api";

const TONES = {
  navy: "bg-navy-50 text-navy-700 ring-navy-200",
  dark: "bg-navy-900 text-white ring-navy-900",
  live: "bg-crimson-600 text-white ring-crimson-600",
  crimson: "bg-crimson-50 text-crimson-700 ring-crimson-200",
  muted: "bg-white text-navy-500 ring-navy-200",
} as const;

export function Badge({
  tone = "navy",
  children,
}: {
  tone?: keyof typeof TONES;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

const DRAW: Record<DrawStatus, { label: string; tone: keyof typeof TONES }> = {
  draft: { label: "Draft", tone: "navy" },
  active: { label: "Live", tone: "live" },
  completed: { label: "Completed", tone: "dark" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export function DrawStatusBadge({ status }: { status: DrawStatus }) {
  return <Badge tone={DRAW[status].tone}>{DRAW[status].label}</Badge>;
}

export function CategoryStatusBadge({ status }: { status: CategoryStatus }) {
  return status === "completed" ? <Badge tone="dark">Drawn</Badge> : <Badge>Pending</Badge>;
}

const TICKET: Record<TicketStatus, { label: string; tone: keyof typeof TONES }> = {
  available: { label: "Available", tone: "navy" },
  sold: { label: "Sold", tone: "dark" },
  void: { label: "Void", tone: "muted" },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return <Badge tone={TICKET[status].tone}>{TICKET[status].label}</Badge>;
}