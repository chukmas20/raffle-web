import type { Role } from "@/types/api";

const LABELS: Record<Role, string> = {
  user: "Member",
  admin: "Admin",
  super_admin: "Super admin",
};

const STYLES: Record<Role, string> = {
  user: "bg-navy-50 text-navy-700 ring-navy-200",
  admin: "bg-navy-900 text-white ring-navy-900",
  super_admin: "bg-crimson-600 text-white ring-crimson-600",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STYLES[role]}`}
    >
      {LABELS[role]}
    </span>
  );
}