import type { OrgType } from "@/types/api";

export const ORG_TYPE_LABELS: Record<OrgType, string> = {
  school: "School",
  church: "Church",
  ngo: "NGO",
  company: "Company",
  community: "Community group",
  other: "Other",
};

export function formatDateTime(iso: string | null | undefined, fallback = "Not scheduled"): string {
  if (!iso) return fallback;
  return new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}

export const formatNumber = (value: number) => value.toLocaleString("en-NG");