import type { CategoryStatus, DrawStatus, MediaKind, OrgType } from "@/types/api";

export type PublicOrganization = {
  name: string;
  slug: string;
  org_type: OrgType;
  logo_url: string | null;
};

export type PublicCategory = {
  id: string;
  name: string;
  prize_description: string | null;
  winners_count: number;
  sort_order: number;
  status: CategoryStatus;
};

export type PublicWinner = {
  category_id: string;
  position: number;
  ticket_number: string;
  holder_name: string | null;
  drawn_at: string;
};

export type PublicMedia = {
  id: string;
  kind: MediaKind;
  title: string;
  url: string;
  media_type: "audio" | "video" | "image";
  format: string;
  category_id: string | null;
  sort_order: number;
};

export type PublicDraw = {
  id: string;
  title: string;
  description: string | null;
  status: DrawStatus;
  scheduled_at: string | null;
  completed_at: string | null;
  ticket_digits: number;
  organization: PublicOrganization;
  categories: PublicCategory[];
  winners: PublicWinner[];
  media: PublicMedia[];
};