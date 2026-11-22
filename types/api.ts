export type Role = "user" | "admin" | "super_admin";

export type User = {
  id: string;
  email: string;
  full_name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
  last_login_at: string | null;
};

export type OrgType = "school" | "church" | "ngo" | "company" | "community" | "other";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  org_type: OrgType;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
};

export type DrawStatus = "draft" | "active" | "completed" | "cancelled";
export type CategoryStatus = "pending" | "completed";

export type Category = {
  id: string;
  name: string;
  description: string | null;
  prize_description: string | null;
  winners_count: number;
  sort_order: number;
  status: CategoryStatus;
  completed_at: string | null;
};

export type Draw = {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  status: DrawStatus;
  ticket_digits: number;
  scheduled_at: string | null;
  draw_from_sold_only: boolean;
  exclude_previous_winners: boolean;
  created_at: string;
  completed_at: string | null;
  categories: Category[];
};

export type TicketStatus = "available" | "sold" | "void";

export type Ticket = {
  id: string;
  number: string;
  status: TicketStatus;
  holder_name: string | null;
  holder_phone: string | null;
  holder_email: string | null;
  sold_at: string | null;
};

export type TicketPage = { items: Ticket[]; total: number; page: number; size: number };
export type TicketSummary = {
  total: number;
  available: number;
  sold: number;
  void: number;
  capacity: number;
};

export type DrawResult = {
  id: string;
  category_id: string;
  ticket_id: string;
  ticket_number: string;
  holder_name: string | null;
  holder_phone: string | null;
  position: number;
  status: "active" | "voided";
  void_reason: string | null;
  drawn_at: string;
};

export type CategoryResults = { category: Category; winners: DrawResult[] };
export type DrawResults = {
  draw_id: string;
  title: string;
  status: DrawStatus;
  categories: CategoryResults[];
};