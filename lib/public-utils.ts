import type { PublicWinner } from "@/types/public";

export const winnerKey = (w: Pick<PublicWinner, "category_id" | "position" | "ticket_number">) =>
  `${w.category_id}:${w.position}:${w.ticket_number}`;